export const SIMULATION_TIMEZONE = "America/Santiago";
export const DAILY_SESSION_LIMIT = 1;
export const SESSION_DURATION_MINUTES = 45;
export const MAX_STUDENT_TURNS = 24;
export const MAX_CONTEXT_TURNS = 10;
export const TURN_WARNING_THRESHOLD = 20;
export const TIME_WARNING_MINUTES = {
  closing: 5,
  final: 1
};

export const ACTIVE_APPOINTMENT_STATUSES = new Set([
  "scheduled",
  "in_progress",
  "closure_pending",
  "completed"
]);

export const CONSUMED_APPOINTMENT_STATUSES = new Set([
  "in_progress",
  "closure_pending",
  "completed"
]);

export function getSimulationUsagePolicy(user = null) {
  const role = String(user?.role || user?.app_metadata?.role || user?.user_metadata?.role || "student").toLowerCase();
  const hasBypass = role === "admin" || role === "qa";
  return {
    dailySessionLimit: DAILY_SESSION_LIMIT,
    sessionDurationMinutes: SESSION_DURATION_MINUTES,
    maxStudentTurns: MAX_STUDENT_TURNS,
    maxContextTurns: MAX_CONTEXT_TURNS,
    timezone: SIMULATION_TIMEZONE,
    role,
    hasBypass
  };
}

export function canScheduleSession(user, date, appointments = []) {
  const policy = getSimulationUsagePolicy(user);
  if (policy.hasBypass) return { ok: true, reason: "" };
  const localDate = normalizeLocalDate(date, policy.timezone);
  if (!localDate) {
    return { ok: false, reason: "INVALID_DATE", message: "Elige una fecha valida para agendar." };
  }
  const conflict = appointments.find((appointment) =>
    appointment.scheduledLocalDate === localDate &&
    ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)
  );
  if (conflict) {
    return {
      ok: false,
      reason: "DAILY_APPOINTMENT_EXISTS",
      message: "Ya existe una sesion programada o consumida para ese dia.",
      conflict
    };
  }
  return { ok: true, reason: "" };
}

export function canStartSession(user, appointment, appointments = [], now = new Date()) {
  const policy = getSimulationUsagePolicy(user);
  if (policy.hasBypass) return { ok: true, reason: "" };
  if (!appointment) {
    return {
      ok: false,
      reason: "APPOINTMENT_REQUIRED",
      message: "Agenda la sesion antes de iniciar la entrevista."
    };
  }
  if (["cancelled", "completed"].includes(appointment.status)) {
    return {
      ok: false,
      reason: "SESSION_ALREADY_CLOSED",
      message: "Esta sesion ya fue cerrada o cancelada."
    };
  }

  const today = getZonedDateKey(now, policy.timezone);
  const appointmentDate = appointment.scheduledLocalDate || normalizeLocalDate(appointment.scheduledFor, policy.timezone);
  if (appointmentDate !== today && appointment.status === "scheduled") {
    return {
      ok: false,
      reason: "APPOINTMENT_NOT_TODAY",
      message: "Esta sesion esta programada para otro dia."
    };
  }

  const consumedToday = appointments.find((candidate) =>
    candidate.id !== appointment.id &&
    candidate.scheduledLocalDate === today &&
    CONSUMED_APPOINTMENT_STATUSES.has(candidate.status)
  );
  if (consumedToday) {
    return {
      ok: false,
      reason: "DAILY_LIMIT_REACHED",
      message:
        "Ya realizaste tu sesion clinica de hoy. Puedes revisar resultados, completar notas o agendar otra sesion para otro dia.",
      conflict: consumedToday
    };
  }

  const remainingMs = getRemainingSessionTime(appointment, now);
  if (appointment.startedAt && remainingMs <= 0) {
    return {
      ok: false,
      reason: "SESSION_TIME_EXPIRED",
      message: "El tiempo de entrevista ha finalizado. Continua con el cierre y la retroalimentacion."
    };
  }

  return { ok: true, reason: "" };
}

export function getRemainingSessionTime(sessionOrAppointment, now = new Date()) {
  if (!sessionOrAppointment?.startedAt) return SESSION_DURATION_MINUTES * 60 * 1000;
  const startedAt = new Date(sessionOrAppointment.startedAt);
  if (Number.isNaN(startedAt.getTime())) return SESSION_DURATION_MINUTES * 60 * 1000;
  const duration = Number(sessionOrAppointment.durationMinutes) || SESSION_DURATION_MINUTES;
  const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000);
  return Math.max(0, endsAt.getTime() - new Date(now).getTime());
}

export function getRemainingTurns(sessionOrHistory) {
  const usedTurns = Array.isArray(sessionOrHistory)
    ? countCompletedStudentTurns(sessionOrHistory)
    : Number(sessionOrHistory?.studentTurnCount) || countCompletedStudentTurns(sessionOrHistory?.conversationHistory || []);
  return Math.max(0, MAX_STUDENT_TURNS - usedTurns);
}

export function countCompletedStudentTurns(history = []) {
  return (Array.isArray(history) ? history : []).filter((entry) =>
    !entry?.isSessionPrelude &&
    !entry?.isPendingResponse &&
    String(entry?.question || entry?.student || "").trim() &&
    String(entry?.answer || entry?.patient || "").trim()
  ).length;
}

export function trimConversationForGemini(history = [], maxTurns = MAX_CONTEXT_TURNS) {
  return (Array.isArray(history) ? history : [])
    .filter((entry) => entry && !entry.isSessionPrelude)
    .slice(-maxTurns);
}

export function getZonedDateKey(date = new Date(), timezone = SIMULATION_TIMEZONE) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(value);
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

export function normalizeLocalDate(value, timezone = SIMULATION_TIMEZONE) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return getZonedDateKey(value, timezone);
}

export function buildScheduledFor({ date, time, timezone = SIMULATION_TIMEZONE }) {
  const localDate = normalizeLocalDate(date, timezone);
  const safeTime = /^\d{2}:\d{2}$/.test(String(time || "")) ? time : "09:00";
  if (!localDate) return "";
  return `${localDate}T${safeTime}:00`;
}
