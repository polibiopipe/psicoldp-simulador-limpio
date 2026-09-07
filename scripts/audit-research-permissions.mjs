import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Optional test-only dependency, installed outside the application checkout.
const { PGlite } = await import(process.env.RESEARCH_PGLITE_MODULE || "@electric-sql/pglite");
const db = new PGlite();
const student = "10000000-0000-4000-8000-000000000001";
const researcher = "10000000-0000-4000-8000-000000000002";
const other = "10000000-0000-4000-8000-000000000003";
const sessionId = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users(id uuid primary key);
  insert into auth.users values ('${student}'), ('${researcher}'), ('${other}');
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
  create table public.user_profiles(id uuid primary key references auth.users(id), approved boolean, role text);
  insert into public.user_profiles select id, true, 'student' from auth.users;
  create function public.current_user_is_approved() returns boolean language sql stable security definer set search_path='' as $$
    select exists(select 1 from public.user_profiles where id=auth.uid() and approved)
  $$;
  create table public.simulation_sessions(
    id uuid primary key, user_id uuid not null references auth.users(id),
    user_email text, case_id text, case_name text, session_number integer, status text,
    started_at timestamptz, created_at timestamptz default now(), feedback jsonb default '{}', conversation jsonb default '[]'
  );
  alter table public.simulation_sessions enable row level security;
  grant select, insert, update, delete on public.simulation_sessions to authenticated;
  create policy own_sessions on public.simulation_sessions to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
`);
const sql = readFileSync(new URL("../supabase/research_statistics.sql", import.meta.url), "utf8");
await db.exec(sql);
await db.exec(sql); // Migration reruns preserve settings and grants.

async function asUser(id, query, params = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id || ""]);
  await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  try { return await db.query(query, params); }
  finally { await db.exec("reset role"); }
}
const context = async (id) => (await asUser(id, "select public.research_context() as context")).rows[0].context;
const readStudy = async (id, after = null, limit = 500) =>
  (await asUser(id, "select * from public.research_statistics_page($1, $2)", [after, limit])).rows;
async function addSession(id, user = student, offsetSeconds = 0, status = "in_progress") {
  await asUser(user, `insert into public.simulation_sessions(id,user_id,user_email,case_id,case_name,session_number,status,started_at,feedback,conversation)
    values ($1,$2,'private@example.test','claudio','Ficticio',1,$3,now()+($4 * interval '1 second'),$5::jsonb,'[{"question":"private dialogue"}]')`,
  [id, user, status, offsetSeconds, JSON.stringify({ sessionMetrics: { elapsedSeconds: 900, studentTurnCount: 10, endReason: "voluntary_closure" }, generalScore: 60, patientOpenness: { final: 70 }, measurementVersion: "usage-v1", privateText: "must not leave" })]);
}

assert.equal((await context(student)).enabled, false);
await assert.rejects(() => asUser(null, "select public.research_context()"));
await assert.rejects(() => asUser(student, "select * from public.research_consents"));
await assert.rejects(() => asUser(student, "insert into public.research_team(user_id) values ($1)", [student]));
await assert.rejects(() => asUser(student, "select public.set_research_consent(true, 'v1')"));
await assert.rejects(() => readStudy(student));
await addSession(sessionId(1)); // Before activation and consent.

await db.query("insert into public.research_team(user_id) values ($1)", [researcher]);
await db.query("update public.research_settings set enabled=true, protocol_version='v1', participant_information=$1", ["Información ficticia para prueba de permisos, nunca consentimiento real. ".repeat(3)]);
assert.equal((await context(researcher)).canReview, true);
const consent = await asUser(student, "select public.set_research_consent(true, 'v1') as context");
assert.equal(consent.rows[0].context.currentConsent, true);
await addSession(sessionId(2)); // Eligible new session.
await addSession(sessionId(3), student, -86400); // Old start even if inserted now.
await addSession(sessionId(4), other); // No consent.
await addSession(sessionId(5), student, 0, "completed"); // Historical import/first save already closed.
await asUser(student, "update public.simulation_sessions set status='completed' where id=$1", [sessionId(1)]);
let rows = await readStudy(researcher);
assert.equal(rows.length, 1);
assert.ok(rows[0].participant_code.startsWith("EV-"));
assert.notEqual(rows[0].id, sessionId(2));
assert.equal(rows[0].general_score, 60);
assert.ok(!JSON.stringify(rows).includes(student) && !JSON.stringify(rows).includes("private") && !JSON.stringify(rows).includes("must not leave"));
await addSession(sessionId(6));
const firstPage = await readStudy(researcher, null, 1);
const secondPage = await readStudy(researcher, firstPage[0].id, 1);
assert.equal(secondPage.length, 1);
assert.notEqual(firstPage[0].id, secondPage[0].id);
assert.equal((await readStudy(researcher, secondPage[0].id)).length, 0);
await asUser(student, "select public.set_research_consent(false, 'v1')");
assert.equal((await readStudy(researcher)).length, 0);
await asUser(student, "select public.set_research_consent(true, 'v1')");
assert.equal((await readStudy(researcher)).length, 0, "Reconsent must not revive previous observations");
await addSession(sessionId(7));
assert.equal((await readStudy(researcher)).length, 1);
await db.exec("update public.research_settings set protocol_version='v2'");
assert.equal((await readStudy(researcher)).length, 0);
await assert.rejects(() => asUser(student, "select public.set_research_consent(true, 'v1')"));
await asUser(student, "select public.set_research_consent(true, 'v2')");
await addSession(sessionId(8));
assert.equal((await readStudy(researcher)).length, 1);
await db.exec("update public.research_settings set enabled=false");
assert.equal((await readStudy(researcher)).length, 0);
await asUser(student, "select public.set_research_consent(false, 'v2')");
assert.equal((await context(student)).hasConsent, false, "Withdrawal works while study disabled");
await db.query("update public.research_team set enabled=false where user_id=$1", [researcher]);
await assert.rejects(() => readStudy(researcher));
const own = await asUser(student, "select id from public.simulation_sessions");
assert.ok(own.rows.length > 0 && !own.rows.some((row) => row.id === sessionId(4)), "Source RLS stays scoped to account");
await db.close();
console.log("Research SQL: migration, RLS, team permissions, consent, prospective inclusion, protocol changes, withdrawal and pagination passed.");
