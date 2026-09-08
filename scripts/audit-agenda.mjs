import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { cases } from "../src/data/cases.js";
import { formatDateInput, getWeekStartDate, getEmptyWeeklyAvailability } from "../src/engine/clinicalAgenda.js";
import { buildScheduledFor } from "../src/engine/simulationUsagePolicy.js";
import {
  buildAppointmentAvailableSlots, buildScheduleDraft, findRelevantAppointment,
  getAgendaToday, moveAgendaDate, requireConfirmedAppointment, validateAppointmentSchedule
} from "../src/engine/agendaScheduling.js";

const day = (value) => new Date(`${value}T12:00:00`);
assert.equal(formatDateInput(moveAgendaDate(day("2026-01-31"), "mes", 1)), "2026-02-28");
assert.equal(formatDateInput(moveAgendaDate(day("2024-01-31"), "mes", 1)), "2024-02-29");
assert.equal(formatDateInput(moveAgendaDate(day("2026-03-01"), "mes", -1)), "2026-02-01");
assert.equal(formatDateInput(moveAgendaDate(day("2026-12-31"), "mes", 1)), "2027-01-31");
assert.equal(formatDateInput(moveAgendaDate(day("2026-09-08"), "dia", 1)), "2026-09-09");
assert.equal(formatDateInput(moveAgendaDate(day("2026-09-08"), "semana", 1)), "2026-09-15");
assert.equal(formatDateInput(getAgendaToday(new Date("2026-03-01T02:00:00Z"))), "2026-02-28");
assert.equal(formatDateInput(getAgendaToday(new Date("2026-03-01T15:00:00Z"))), "2026-03-01", "Hoy conserva el mes aunque el lunes pertenezca al anterior");

assert.equal(buildScheduledFor({ date: "2026-07-19", time: "09:00" }), "2026-07-19T13:00:00.000Z");
assert.equal(buildScheduledFor({ date: "2026-09-08", time: "09:00" }), "2026-09-08T12:00:00.000Z");
assert.equal(buildScheduledFor({ date: "2026-09-06", time: "00:30" }), "", "rechaza una hora inexistente por cambio de horario");
assert.equal(buildScheduledFor({ date: "2026-02-31", time: "09:00" }), "");
assert.equal(buildScheduledFor({ date: "2026-09-08", time: "24:15" }), "");

const caseItem = cases.find((item) => item.id === "claudio");
const item = { caseItem, nextSessionNumber: 2, plannedSessions: 4, nextFocus: "Retomar tarea" };
const past = { id: "past", caseId: caseItem.id, sessionNumber: 1, status: "completed", scheduledFor: "2026-09-01T12:00:00Z" };
const next = { id: "next", caseId: caseItem.id, sessionNumber: 2, status: "scheduled", scheduledLocalDate: "2026-09-09", scheduledTime: "10:00", scheduledFor: "2026-09-09T13:00:00Z" };
assert.equal(findRelevantAppointment(item, [past, next]).id, "next");
assert.equal(findRelevantAppointment(item, [past]), null);
assert.equal(findRelevantAppointment(item, [next, { ...past, status: "closure_pending" }]).id, "past");
assert.equal(findRelevantAppointment(item, [{ ...next, status: "cancelled" }]), null);

const draft = buildScheduleDraft(item, { reminderNote: "Conservar esta nota", date: "2026-09-08", time: "09:00" }, { date: "2026-09-09", time: "10:00" });
assert.equal(draft.date, "2026-09-09");
assert.equal(draft.time, "10:00");
assert.equal(draft.reminderNote, "Conservar esta nota", "elegir otro espacio mantiene el contenido del formulario");
const availability = getEmptyWeeklyAvailability();
for (const key of Object.keys(availability)) availability[key] = { enabled: true, blocks: [{ start: "09:00", end: "12:00" }] };
const now = new Date("2026-09-08T13:00:00Z"); // martes, 10:00 en Santiago
const input = { item, draft, cases, availability, appointmentsStatus: { authoritative: true }, availabilityStatus: { authoritative: true }, now };
assert.equal(validateAppointmentSchedule({ ...input, appointmentsStatus: { authoritative: false } }).type, "unverified_agenda");
assert.equal(validateAppointmentSchedule({ ...input, appointmentsStatus: { authoritative: true, loading: true } }).ok, false);
assert.equal(validateAppointmentSchedule(input).ok, true);
assert.equal(validateAppointmentSchedule({ ...input, appointments: [next] }).ok, true, "reprogramar la misma cita no se considera duplicación");
assert.equal(validateAppointmentSchedule({ ...input, appointments: [{ ...next, id: "other", caseId: "otro" }] }).type, "daily_limit");
assert.equal(validateAppointmentSchedule({ ...input, appointments: [{ ...next, status: "completed" }] }).type, "closed");
assert.equal(validateAppointmentSchedule({ ...input, draft: { ...draft, date: "2026-09-07" } }).type, "invalid_date");
assert.equal(validateAppointmentSchedule({ ...input, draft: { ...draft, time: "11:45" } }).type, "outside_availability");
assert.equal(validateAppointmentSchedule({ ...input, availabilityStatus: { loading: true } }).ok, false);
const slots = buildAppointmentAvailableSlots({ availability, weekStart: getWeekStartDate(day("2026-09-08")), appointments: [next], now, limit: 100 });
assert.ok(slots.length > 0);
assert.ok(slots.every((slot) => Date.parse(buildScheduledFor(slot)) > now.getTime()), "no sugiere horarios pasados");
assert.ok(slots.every((slot) => slot.date !== "2026-09-09"), "respeta una cita por día");

for (const result of [{ cloudSaved: false }, { cloudSaved: true, data: null }, { cloudSaved: true, data: { id: "next", status: "completed" } }]) {
  assert.throws(() => requireConfirmedAppointment(result, "scheduled"));
}
assert.throws(() => requireConfirmedAppointment({ cloudSaved: false, error: { code: "23505" } }, "scheduled"), /ya tiene una cita/);
assert.equal(requireConfirmedAppointment({ cloudSaved: true, data: next }, "scheduled"), next);

// Execute the actual persistence code with an in-memory Supabase boundary.
// This verifies failed writes and concurrent starts without changing live data.
const temp = await mkdtemp(join(tmpdir(), "escucha-agenda-"));
const cache = new Map();
globalThis.window = {};
globalThis.localStorage = { getItem: (key) => cache.get(key), setItem: (key, value) => cache.set(key, value) };
let row = null;
let failure = null;
let incompleteLoad = false;
globalThis.__agendaTestSupabase = {
  from() {
    let operation;
    let payload;
    const filters = [];
    return {
      insert(value) { operation = "insert"; payload = value; return this; },
      update(value) { operation = "update"; payload = value; return this; },
      upsert(value) { operation = "upsert"; payload = value; return this; },
      eq(key, value) { filters.push([key, value]); return this; },
      select() { return this; },
      async order() {
        if (failure instanceof Error) throw failure;
        if (failure) return { data: null, error: failure };
        return { data: incompleteLoad ? null : row ? [row] : [], error: null };
      },
      async maybeSingle() {
        if (failure instanceof Error) throw failure;
        if (failure) return { data: null, error: failure };
        if (operation === "update" && (!row || filters.some(([key, value]) => row[key] !== value))) return { data: null, error: null };
        if (operation === "insert" && row) return { data: null, error: { code: "23505", message: "duplicate" } };
        row = operation === "update" ? { ...row, ...payload } : payload;
        return { data: row, error: null };
      }
    };
  }
};
try {
  const outfile = join(temp, "appointments.mjs");
  await build({
    entryPoints: [resolve("src/engine/simulationAppointments.js")], outfile, bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "mock-supabase", setup(builder) {
      builder.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: "supabase", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const isSupabaseConfigured = true; export const supabase = globalThis.__agendaTestSupabase;" }));
    } }]
  });
  const service = await import(pathToFileURL(outfile));
  const auth = { user: { id: "user-1", email: "qa@example.invalid" } };
  assert.deepEqual(await service.getSimulationAppointments(auth), [], "una agenda vacía confirmada sí es una lista vacía");
  await assert.rejects(service.getSimulationAppointments(null), /sesión y conexión/);
  failure = { code: "NETWORK_ERROR", message: "offline" };
  await assert.rejects(service.getSimulationAppointments(auth), /No pudimos cargar/);
  failure = new Error("connection lost");
  await assert.rejects(service.getSimulationAppointments(auth), /connection lost/);
  failure = null;
  incompleteLoad = true;
  await assert.rejects(service.getSimulationAppointments(auth), /incompleta/);
  incompleteLoad = false;
  const appointment = service.buildAppointmentRecord({ authSession: auth, caseItem, sessionNumber: 2, date: draft.date, time: draft.time });
  failure = { code: "NETWORK_ERROR", message: "offline" };
  assert.equal((await service.saveScheduledAppointment(auth, appointment)).cloudSaved, false);
  assert.equal(row, null, "una escritura rechazada no crea citas");
  failure = null;
  assert.equal((await service.saveScheduledAppointment(auth, appointment)).cloudSaved, true);
  assert.equal(row.scheduled_for, "2026-09-09T13:00:00.000Z");
  const confirmedCache = service.getReadOnlyCachedAppointments();
  failure = { code: "NETWORK_ERROR", message: "offline" };
  await assert.rejects(service.getSimulationAppointments(auth));
  assert.deepEqual(service.getReadOnlyCachedAppointments(), confirmedCache, "una carga fallida no vacía la agenda verificada");
  failure = null;
  assert.equal((await service.saveScheduledAppointment(auth, { ...appointment, scheduledTime: "11:00" }, appointment.id)).cloudSaved, true);
  assert.equal(service.getReadOnlyCachedAppointments()[0].scheduledTime, "11:00", "la caché conserva la versión nueva");
  row = { ...row, status: "in_progress", started_at: "2026-09-09T13:00:00Z" };
  assert.equal((await service.saveScheduledAppointment(auth, appointment, appointment.id)).cloudSaved, false);
  assert.equal((await service.cancelSimulationAppointment(auth, appointment.id)).cloudSaved, false);
  assert.equal(row.status, "in_progress", "un editor desactualizado no reinicia ni cancela una sesión iniciada");
  assert.equal(row.started_at, "2026-09-09T13:00:00Z");
  row = { ...row, status: "scheduled", started_at: null };
  failure = { code: "NETWORK_ERROR", message: "offline" };
  assert.equal((await service.cancelSimulationAppointment(auth, appointment.id)).cloudSaved, false);
  assert.equal(row.status, "scheduled", "no muestra cancelaciones que el servidor rechazó");
  failure = new Error("connection lost");
  await assert.rejects(service.saveScheduledAppointment(auth, appointment, appointment.id), /connection lost/);
  failure = null;
  globalThis.localStorage.setItem = () => { throw new Error("quota"); };
  assert.equal((await service.cancelSimulationAppointment(auth, appointment.id)).cloudSaved, true, "una caché llena no invalida una cancelación confirmada");
  assert.equal(row.status, "cancelled");

  const availabilityOutfile = join(temp, "availability.mjs");
  await build({
    entryPoints: [resolve("src/engine/clinicalAgenda.js")], outfile: availabilityOutfile, bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "mock-supabase", setup(builder) {
      builder.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: "supabase", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const isSupabaseConfigured = true; export const supabase = globalThis.__agendaTestSupabase;" }));
    } }]
  });
  const availabilityService = await import(pathToFileURL(availabilityOutfile));
  let rpcCalls = 0;
  let rpcFailure = null;
  globalThis.__agendaTestSupabase.from = () => { throw new Error("No se permite reemplazar horarios mediante peticiones separadas"); };
  globalThis.__agendaTestSupabase.rpc = async (name, args) => {
    rpcCalls += 1;
    assert.equal(name, "replace_simulation_student_availability");
    assert.ok(args.p_blocks.every((block) => !Object.hasOwn(block, "user_id")), "la identidad la obtiene el servidor de la autenticación");
    if (rpcFailure instanceof Error) throw rpcFailure;
    if (rpcFailure) return rpcFailure;
    return { data: args.p_blocks, error: null };
  };
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, availability)).ok, true);
  assert.equal(rpcCalls, 1, "todos los bloques se reemplazan con una sola petición");
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, getEmptyWeeklyAvailability())).configured, false);
  rpcFailure = { data: null, error: { code: "PGRST202", message: "missing function" } };
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, availability)).source, "migration_required");
  rpcFailure = { data: null, error: null };
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, availability)).ok, false);
  rpcFailure = { data: [], error: null };
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, availability)).ok, false);
  rpcFailure = new Error("offline");
  assert.equal((await availabilityService.saveStudentWeeklyAvailability(auth, availability)).ok, false);
} finally {
  delete globalThis.__agendaTestSupabase;
  delete globalThis.window;
  delete globalThis.localStorage;
  await rm(temp, { recursive: true, force: true });
}

console.log("audit:agenda ok — calendario, hora de Chile, continuidad, disponibilidad y persistencia verificados.");
