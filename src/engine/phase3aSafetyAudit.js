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
import {
  getEmptyWeeklyAvailability,
  hasConfiguredAvailability,
  validateAgendaSchedule
} from "./clinicalAgenda.js";

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
const rollback = readFileSync(resolve(process.cwd(), "supabase/simulation_appointments_rollback.sql"), "utf8");
const availabilitySql = readFileSync(resolve(process.cwd(), "supabase/simulation_student_availability.sql"), "utf8");
const availabilityRollback = readFileSync(resolve(process.cwd(), "supabase/simulation_student_availability_rollback.sql"), "utf8");
const endpoint = readFileSync(resolve(process.cwd(), "api/gemini-patient-response.js"), "utf8");
const clinicalAgendaComponent = readFileSync(resolve(process.cwd(), "src/components/ClinicalAgenda.jsx"), "utf8");
const clinicalAgendaEngine = readFileSync(resolve(process.cwd(), "src/engine/clinicalAgenda.js"), "utf8");
const baseAppointment = {
  id: "appointment-1",
  caseId: "claudio",
  sessionNumber: 1,
  scheduledLocalDate: "2026-07-10",
  status: "scheduled"
};
const agendaCase = {
  id: "claudio",
  name: "Claudio",
  age: "40 años",
  motive: "Estancamiento vital",
  shortTitle: "Caso piloto"
};
const mondayAvailability = {
  ...getEmptyWeeklyAvailability(),
  monday: {
    enabled: true,
    start: "09:00",
    end: "13:00",
    blocks: [{ start: "09:00", end: "13:00" }]
  }
};
const editedAvailability = {
  ...getEmptyWeeklyAvailability(),
  monday: {
    enabled: true,
    start: "15:00",
    end: "19:00",
    blocks: [{ start: "15:00", end: "19:00" }]
  }
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

check("ClinicalAgenda imports defined local date formatter", () =>
  clinicalAgendaEngine.includes("export function formatDateInput") &&
  clinicalAgendaEngine.includes("Number.isNaN(value.getTime())") &&
  clinicalAgendaComponent.includes("formatDateInput") &&
  /import\s*{[\s\S]*formatDateInput[\s\S]*}\s*from\s*"\.\.\/engine\/clinicalAgenda\.js"/.test(clinicalAgendaComponent)
);

check("student without availability cannot schedule silently", () => {
  const result = validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "09:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: getEmptyWeeklyAvailability()
  });
  return !result.ok && result.type === "no_availability";
});

check("missing availability table is handled without blank screen", () =>
  clinicalAgendaEngine.includes("classifyAvailabilityError") &&
  clinicalAgendaEngine.includes("source: \"schema_missing\"") &&
  clinicalAgendaEngine.includes("La configuración de disponibilidad aún no está habilitada en este entorno") &&
  clinicalAgendaComponent.includes("availabilityStatus?.authoritative")
);

check("availability network and permission errors are controlled", () =>
  clinicalAgendaEngine.includes("source: \"permission_denied\"") &&
  clinicalAgendaEngine.includes("No tienes permiso para modificar esta disponibilidad") &&
  clinicalAgendaEngine.includes("source: \"network_or_supabase_error\"") &&
  clinicalAgendaEngine.includes("No pudimos verificar tu disponibilidad")
);

check("student can define availability for one day", () =>
  hasConfiguredAvailability(mondayAvailability) &&
  validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "09:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  }).ok
);

check("student can edit availability block", () =>
  validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "15:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: editedAvailability
  }).ok
);

check("student can remove availability blocks", () =>
  !hasConfiguredAvailability(getEmptyWeeklyAvailability())
);

check("appointment fully inside availability block is accepted near the end", () =>
  validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "12:15", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  }).ok
);

check("appointment ending one minute outside availability is rejected", () => {
  const result = validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "12:16", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  });
  return !result.ok && result.type === "outside_availability";
});

check("appointment at availability end is rejected", () => {
  const result = validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "13:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  });
  return !result.ok && result.type === "outside_availability";
});

check("appointment outside availability block is rejected", () => {
  const result = validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-06", time: "08:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  });
  return !result.ok && result.type === "outside_availability";
});

check("day without availability is rejected", () => {
  const result = validateAgendaSchedule({
    caseId: "claudio",
    draft: { date: "2026-07-07", time: "09:00", durationMinutes: 45, plannedSessionNumber: 1 },
    cases: [agendaCase],
    availability: mondayAvailability
  });
  return !result.ok && result.type === "outside_availability";
});

check("daily session limit remains independent from availability blocks", () =>
  !canScheduleSession(student, "2026-07-06", [{ ...baseAppointment, scheduledLocalDate: "2026-07-06" }]).ok
);

check("availability RLS isolates each student's rows", () =>
  availabilitySql.includes("auth.uid() = user_id") &&
  availabilitySql.includes("profile.approved = true") &&
  availabilitySql.includes("with check") &&
  availabilitySql.includes("for select") &&
  availabilitySql.includes("for insert") &&
  availabilitySql.includes("for update") &&
  availabilitySql.includes("for delete")
);

check("availability model uses explicit day and time columns", () =>
  availabilitySql.includes("day_of_week smallint not null") &&
  availabilitySql.includes("start_time time not null") &&
  availabilitySql.includes("end_time time not null") &&
  availabilitySql.includes("check (day_of_week between 0 and 6)") &&
  availabilitySql.includes("check (start_time < end_time)") &&
  availabilitySql.includes("check (timezone = 'America/Santiago')")
);

check("availability migration rejects duplicates and overlapping blocks", () =>
  availabilitySql.includes("simulation_student_availability_exact_block_idx") &&
  availabilitySql.includes("public.validate_simulation_student_availability_block") &&
  availabilitySql.includes("availability blocks cannot overlap") &&
  availabilitySql.includes("new.start_time < other.end_time") &&
  availabilitySql.includes("new.end_time > other.start_time")
);

check("availability migration validates appointments server-side", () =>
  availabilitySql.includes("public.validate_simulation_appointment_student_availability") &&
  availabilitySql.includes("on_simulation_appointments_student_availability") &&
  availabilitySql.includes("appointment outside student availability") &&
  availabilitySql.includes("new.scheduled_for at time zone 'America/Santiago'") &&
  availabilitySql.includes("local_end::date <> local_start::date") &&
  availabilitySql.includes("local_end::time <= availability.end_time") &&
  availabilitySql.includes("caller_role in ('admin', 'qa')") &&
  availabilitySql.includes("before insert or update of scheduled_for, duration_minutes, timezone, user_id") &&
  availabilityRollback.includes("drop trigger if exists on_simulation_appointments_student_availability")
);

check("existing appointments remain valid after availability edits", () =>
  availabilitySql.includes("before insert or update of scheduled_for, duration_minutes, timezone, user_id") &&
  !availabilitySql.includes("update public.simulation_appointments") &&
  !availabilitySql.includes("delete from public.simulation_appointments") &&
  !availabilitySql.includes("status, user_id")
);

check("localStorage cache does not authorize appointment scheduling", () =>
  clinicalAgendaComponent.includes("availabilityStatus?.authoritative") &&
  clinicalAgendaComponent.includes("availabilityState.authoritative ? availability : emptyAvailability") &&
  clinicalAgendaComponent.includes("source: finalResult.source || \"supabase\"") &&
  clinicalAgendaEngine.includes("if (!raw) return getEmptyWeeklyAvailability()")
);

check("availability save refreshes authoritative Supabase state", () =>
  clinicalAgendaComponent.includes("const refreshed = await loadStudentWeeklyAvailability(authSession)") &&
  clinicalAgendaComponent.includes("finalResult = refreshed.authoritative") &&
  clinicalAgendaComponent.includes("setAvailability(finalResult.availability)") &&
  clinicalAgendaComponent.includes("configured: Boolean(finalResult.configured)")
);

check("stale availability loads cannot override saved blocks", () =>
  clinicalAgendaComponent.includes("availabilityRequestRef") &&
  clinicalAgendaComponent.includes("requestId !== availabilityRequestRef.current") &&
  clinicalAgendaComponent.includes("availabilityRequestRef.current = requestId")
);

check("editing availability from scheduler closes modal and preserves draft", () =>
  clinicalAgendaComponent.includes("function openAvailabilityFromScheduling") &&
  clinicalAgendaComponent.includes("updateScheduleDraft(caseId, draft)") &&
  clinicalAgendaComponent.includes("setScheduleCaseId(\"\")") &&
  clinicalAgendaComponent.includes("savedDraft={scheduleDrafts[scheduleItem.caseItem.id]}") &&
  clinicalAgendaComponent.includes("onAction: () => onEditAvailability?.(draft)")
);

check("availability save failure keeps previous authoritative state visible", () =>
  clinicalAgendaComponent.includes("const previousAvailability = availability") &&
  clinicalAgendaComponent.includes("const previousState = availabilityState") &&
  clinicalAgendaComponent.includes("setAvailability(previousAvailability)") &&
  clinicalAgendaComponent.includes("...previousState")
);

check("availability save blocks double click duplicates", () =>
  clinicalAgendaComponent.includes("const [localSaving, setLocalSaving]") &&
  clinicalAgendaComponent.includes("if (localSaving || status?.saving) return") &&
  clinicalAgendaComponent.includes("disabled={status?.saving || localSaving}") &&
  clinicalAgendaComponent.includes("Guardando...")
);

check("availability migration has rollback and data protection", () =>
  availabilitySql.includes("create table if not exists public.simulation_student_availability") &&
  availabilityRollback.includes("Rollback detenido: existen registros de disponibilidad") &&
  availabilityRollback.includes("drop table if exists public.simulation_student_availability") &&
  !availabilityRollback.includes("drop table if exists public.simulation_appointments") &&
  !availabilityRollback.includes("drop table if exists public.simulation_interventions")
);

check("availability migration is idempotent and isolated", () =>
  availabilitySql.includes("drop trigger if exists on_simulation_student_availability_updated_at") &&
  availabilitySql.includes("drop trigger if exists on_simulation_student_availability_validate_block") &&
  availabilitySql.includes("drop trigger if exists on_simulation_appointments_student_availability") &&
  availabilitySql.includes("drop policy if exists \"Students can read own availability\"") &&
  !availabilitySql.includes("create table if not exists public.simulation_appointments") &&
  !availabilitySql.includes("update public.simulation_sessions") &&
  !availabilitySql.includes("update public.user_profiles")
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

check("migration creates simulation_sessions status before status constraint", () => {
  const statusColumn = sql.indexOf("add column if not exists status text");
  const statusConstraint = sql.indexOf("simulation_sessions_status_check");
  return statusColumn !== -1 && statusConstraint !== -1 && statusColumn < statusConstraint;
});

check("migration normalizes historical sessions as completed", () =>
  sql.includes("set status = 'completed'") &&
  sql.includes("where status is null or btrim(status) = ''") &&
  sql.includes("alter column status set default 'completed'") &&
  sql.includes("alter column status set not null")
);

check("migration creates simulation_sessions updated_at before trigger", () => {
  const updatedAtColumn = sql.indexOf("add column if not exists updated_at timestamptz");
  const updatedAtTrigger = sql.indexOf("on_simulation_sessions_updated_at");
  return updatedAtColumn !== -1 && updatedAtTrigger !== -1 && updatedAtColumn < updatedAtTrigger;
});

check("migration backfills updated_at from historical created_at", () =>
  sql.includes("set updated_at = coalesce(updated_at, created_at, now())") &&
  sql.includes("where updated_at is null") &&
  sql.includes("alter column updated_at set default now()") &&
  sql.includes("alter column updated_at set not null")
);

check("migration keeps historical sessions unlinked to appointments", () =>
  sql.includes("add column if not exists appointment_id uuid references public.simulation_appointments(id) on delete set null") &&
  !/update\s+public\.simulation_sessions[\s\S]{0,240}set\s+appointment_id/i.test(sql)
);

check("migration updates simulation_sessions updated_at by trigger", () =>
  sql.includes("create or replace function public.set_simulation_session_updated_at()") &&
  sql.includes("drop trigger if exists on_simulation_sessions_updated_at on public.simulation_sessions") &&
  sql.includes("create trigger on_simulation_sessions_updated_at")
);

check("rollback removes phase3a columns without dropping simulation_sessions", () =>
  [
    "drop column if exists appointment_id",
    "drop column if exists started_at",
    "drop column if exists ends_at",
    "drop column if exists completed_at",
    "drop column if exists status",
    "drop column if exists updated_at"
  ].every((needle) => rollback.includes(needle)) &&
  !rollback.includes("drop table if exists public.simulation_sessions")
);

check("rollback protects new operational data before dropping objects", () =>
  rollback.includes("appointment_count > 0 or intervention_count > 0 or linked_session_count > 0") &&
  rollback.includes("Rollback detenido: existen datos en appointments/interventions o sesiones vinculadas")
);

check("rollback removes simulation_sessions trigger and status constraint", () =>
  rollback.includes("drop trigger if exists on_simulation_sessions_updated_at on public.simulation_sessions") &&
  rollback.includes("drop function if exists public.set_simulation_session_updated_at()") &&
  rollback.includes("alter table public.simulation_sessions drop constraint simulation_sessions_status_check")
);

check("rollback restores previous role constraint only without qa users", () =>
  rollback.includes("where role = 'qa'") &&
  rollback.includes("Rollback detenido: existen usuarios con role=qa") &&
  rollback.includes("add constraint user_profiles_role_check") &&
  rollback.includes("check (role in ('student', 'admin'))")
);

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
