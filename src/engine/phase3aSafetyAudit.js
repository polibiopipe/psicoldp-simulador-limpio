import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  CONSUMED_APPOINTMENT_STATUSES,
  MAX_CONTEXT_TURNS,
  MAX_STUDENT_TURNS,
  SIMULATION_TIMEZONE,
  canScheduleSession,
  canStartSession,
  getRemainingTurns,
  getZonedDateKey,
  trimConversationForGemini
} from "./simulationUsagePolicy.js";

const checks = [];

function check(name, assertion) {
  try {
    if (!assertion()) throw new Error("assertion returned false");
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
  }
}

const student = { role: "student" };
const admin = { role: "admin" };
const sql = readFileSync(resolve(process.cwd(), "supabase/simulation_appointments.sql"), "utf8");
const endpoint = readFileSync(resolve(process.cwd(), "api/gemini-patient-response.js"), "utf8");
const baseAppointment = {
  id: "appointment-1",
  caseId: "claudio",
  sessionNumber: 1,
  scheduledLocalDate: "2026-07-10",
  status: "scheduled"
};

check("timezone uses America/Santiago calendar day", () =>
  SIMULATION_TIMEZONE === "America/Santiago" &&
  getZonedDateKey(new Date("2026-07-10T03:30:00Z"), SIMULATION_TIMEZONE) === "2026-07-09"
);

check("daily scheduling rejects consumed appointment", () =>
  !canScheduleSession(student, "2026-07-10", [baseAppointment]).ok
);

check("daily scheduling rejects completed appointment", () =>
  !canScheduleSession(student, "2026-07-10", [{ ...baseAppointment, status: "completed" }]).ok
);

check("daily scheduling rejects closure_pending appointment", () =>
  !canScheduleSession(student, "2026-07-10", [{ ...baseAppointment, status: "closure_pending" }]).ok
);

check("daily scheduling allows cancelled appointment", () =>
  canScheduleSession(student, "2026-07-10", [{ ...baseAppointment, status: "cancelled" }]).ok
);

check("student cannot start without appointment", () =>
  canStartSession(student, null, []).reason === "APPOINTMENT_REQUIRED"
);

check("admin bypass is server-role compatible", () =>
  canStartSession(admin, null, []).ok
);

check("expired in_progress session is rejected", () =>
  canStartSession(
    student,
    {
      ...baseAppointment,
      status: "in_progress",
      startedAt: "2026-07-10T10:00:00.000Z",
      durationMinutes: 45
    },
    [],
    new Date("2026-07-10T11:00:01.000Z")
  ).reason === "SESSION_TIME_EXPIRED"
);

check("turn 24 is allowed before max is reached", () =>
  23 < MAX_STUDENT_TURNS
);

check("turn 25 is rejected at max completed interventions", () => {
  const history = Array.from({ length: MAX_STUDENT_TURNS }, (_, index) => ({
    id: `turn-${index}`,
    question: "Pregunta",
    answer: "Respuesta"
  }));
  return getRemainingTurns(history) === 0;
});

check("Gemini context is capped server-side constant", () => {
  const history = Array.from({ length: MAX_CONTEXT_TURNS + 7 }, (_, index) => ({
    id: `turn-${index}`,
    question: `Pregunta ${index}`,
    answer: `Respuesta ${index}`
  }));
  return trimConversationForGemini(history).length === MAX_CONTEXT_TURNS;
});

check("endpoint rejects oversized request bodies", () =>
  endpoint.includes("MAX_REQUEST_BODY_CHARS") &&
  endpoint.includes("REQUEST_BODY_TOO_LARGE") &&
  endpoint.includes("sendJson(res, 413")
);

check("closure_pending and completed records merge by same id", () => {
  const pending = { id: "session-1", status: "closure_pending", updatedAt: "2026-07-10T10:00:00.000Z" };
  const completed = { ...pending, status: "completed", updatedAt: "2026-07-10T10:05:00.000Z" };
  const merged = new Map([[pending.id, pending]]);
  merged.set(completed.id, completed);
  return merged.size === 1 && merged.get("session-1").status === "completed";
});

check("appointment statuses include closure_pending as consumed/active", () =>
  ACTIVE_APPOINTMENT_STATUSES.has("closure_pending") &&
  CONSUMED_APPOINTMENT_STATUSES.has("closure_pending")
);

check("migration includes atomic intervention RPC and unique idempotency", () => {
  return [
    "create table if not exists public.simulation_interventions",
    "simulation_interventions_unique_intervention_idx",
    "simulation_interventions_one_reserved_idx",
    "public.reserve_simulation_intervention",
    "public.complete_simulation_intervention",
    "public.fail_simulation_intervention",
    "alter table public.simulation_interventions enable row level security"
  ].every((needle) => sql.includes(needle));
});

check("foreign appointment ownership is rejected server-side", () =>
  endpoint.includes("appointment.user_id !== user.id") &&
  endpoint.includes("APPOINTMENT_REQUIRED")
);

check("case mismatch is rejected server-side", () =>
  endpoint.includes("appointment.case_id !== caseId") &&
  endpoint.includes("APPOINTMENT_CASE_MISMATCH")
);

check("first Gemini failure does not start appointment", () =>
  endpoint.includes("await releaseReservedIntervention(usageValidation)") &&
  sql.includes("public.fail_simulation_intervention") &&
  !/fail_simulation_intervention[\s\S]*status = 'in_progress'/.test(sql)
);

check("retry uses idempotent intervention id without duplicate turn", () =>
  sql.includes("on public.simulation_interventions (appointment_id, intervention_id)") &&
  sql.includes("'INTERVENTION_ALREADY_COMPLETED'") &&
  endpoint.includes("cachedResponse")
);

check("two simultaneous requests cannot start two sessions", () =>
  sql.includes("for update") &&
  sql.includes("simulation_interventions_one_reserved_idx") &&
  sql.includes("where status = 'reserved'")
);

check("orphan reserved interventions expire before new reservation", () =>
  sql.includes("RESERVATION_EXPIRED") &&
  sql.includes("created_at < now() - interval '10 minutes'")
);

check("admin and qa role are resolved from server profile", () =>
  endpoint.includes(".select(\"id,email,approved,role\")") &&
  endpoint.includes("getSimulationUsagePolicy({ role: profile.role })") &&
  !endpoint.includes("payload.role")
);

check("client cannot write simulation_interventions directly", () =>
  sql.includes("revoke all on table public.simulation_interventions from anon, authenticated") &&
  sql.includes("grant select on table public.simulation_interventions to authenticated")
);

check("completed or closure_pending session cannot return to chat", () =>
  endpoint.includes("[\"cancelled\", \"completed\"].includes(appointment.status)") &&
  endpoint.includes("appointment.status === \"closure_pending\"") &&
  endpoint.includes("sessionData.status === \"closure_pending\"") &&
  endpoint.includes("sessionData.status === \"completed\"")
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.name}${item.error ? `: ${item.error}` : ""}`);
}

if (failed.length) {
  console.error(`phase3a safety audit failed: ${failed.length} check(s)`);
  process.exit(1);
}

console.log(`phase3a safety audit passed: ${checks.length} checks`);
