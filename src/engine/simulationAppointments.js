import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import {
  SESSION_DURATION_MINUTES,
  SIMULATION_TIMEZONE,
  buildScheduledFor,
  getZonedDateKey,
  normalizeLocalDate
} from "./simulationUsagePolicy.js";

const LOCAL_APPOINTMENTS_KEY = "escuchaViva.simulationAppointments.v1";

export async function getSimulationAppointments(authSession = null) {
  if (!isSupabaseConfigured || !supabase || !authSession?.user) return [];

  const { data, error } = await supabase
    .from("simulation_appointments")
    .select("*")
    .eq("user_id", authSession.user.id)
    .order("scheduled_for", { ascending: true });

  if (error) {
    console.warn("[appointments] load error message", error.message);
    console.warn("[appointments] load error code", error.code || null);
    return [];
  }

  const records = (data || []).map(mapAppointmentRowToRecord);
  cacheAppointmentsForReadOnlyDisplay(records);
  return records;
}

export async function saveSimulationAppointment(authSession = null, appointment = {}) {
  const normalized = normalizeAppointmentInput(authSession, appointment);
  if (!normalized) {
    return { localSaved: false, cloudSaved: false, error: "No hay cita valida para guardar." };
  }

  if (!isSupabaseConfigured || !supabase || !authSession?.user) {
    return {
      localSaved: false,
      cloudSaved: false,
      error:
        "No podemos verificar la agenda en este momento. Tus datos visibles se conservaran, pero no podras iniciar ni programar una sesion hasta recuperar la conexion."
    };
  }

  const payload = mapAppointmentRecordToPayload(normalized, authSession.user);
  const { data, error } = await supabase
    .from("simulation_appointments")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) {
    console.warn("[appointments] save error message", error.message);
    console.warn("[appointments] save error code", error.code || null);
    return { localSaved: false, cloudSaved: false, error };
  }

  const record = mapAppointmentRowToRecord(data);
  cacheAppointmentsForReadOnlyDisplay([record, ...getReadOnlyCachedAppointments()]);
  return { localSaved: true, cloudSaved: true, data: record };
}

export async function cancelSimulationAppointment(authSession = null, appointmentId = "") {
  if (!appointmentId) return { localSaved: false, cloudSaved: false };
  const now = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase || !authSession?.user) {
    return {
      localSaved: false,
      cloudSaved: false,
      error:
        "No podemos verificar la agenda en este momento. Tus datos visibles se conservaran, pero no podras iniciar ni programar una sesion hasta recuperar la conexion."
    };
  }

  const { data, error } = await supabase
    .from("simulation_appointments")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("id", appointmentId)
    .eq("user_id", authSession.user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.warn("[appointments] cancel error message", error.message);
    console.warn("[appointments] cancel error code", error.code || null);
    return { localSaved: false, cloudSaved: false, error };
  }

  return { localSaved: true, cloudSaved: true, data: mapAppointmentRowToRecord(data) };
}

export async function ensureAppointmentForSession({
  authSession = null,
  appointments = [],
  caseItem,
  sessionNumber = 1,
  scheduledDate = getZonedDateKey(new Date()),
  scheduledTime = "09:00",
  durationMinutes = SESSION_DURATION_MINUTES
} = {}) {
  if (!isSupabaseConfigured || !supabase || !authSession?.user) {
    return {
      appointment: null,
      created: false,
      result: {
        cloudSaved: false,
        error:
          "No podemos verificar la agenda en este momento. Tus datos visibles se conservaran, pero no podras iniciar ni programar una sesion hasta recuperar la conexion."
      }
    };
  }
  const existing = findAppointmentForSession(appointments, caseItem?.id, sessionNumber, scheduledDate);
  if (existing) return { appointment: existing, created: false };

  const appointment = buildAppointmentRecord({
    authSession,
    caseItem,
    sessionNumber,
    date: scheduledDate,
    time: scheduledTime,
    durationMinutes,
    status: "scheduled"
  });
  const result = await saveSimulationAppointment(authSession, appointment);
  return { appointment: result.data || appointment, created: true, result };
}

export function buildAppointmentRecord({
  authSession = null,
  caseItem,
  sessionNumber = 1,
  date,
  time,
  durationMinutes = SESSION_DURATION_MINUTES,
  status = "scheduled",
  nextObjective = "",
  reminderNote = ""
} = {}) {
  const scheduledLocalDate = normalizeLocalDate(date);
  const scheduledFor = buildScheduledFor({ date: scheduledLocalDate, time });
  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${caseItem?.id || "case"}-${sessionNumber}-${Date.now()}`;
  const now = new Date().toISOString();
  return {
    id,
    userId: authSession?.user?.id || "",
    userEmail: authSession?.user?.email || "",
    caseId: caseItem?.id || "",
    caseName: caseItem?.name || "",
    sessionNumber: Number(sessionNumber) || 1,
    scheduledFor,
    scheduledLocalDate,
    scheduledTime: time || "09:00",
    timezone: SIMULATION_TIMEZONE,
    durationMinutes: Number(durationMinutes) || SESSION_DURATION_MINUTES,
    status,
    startedAt: "",
    endsAt: "",
    completedAt: "",
    cancelledAt: "",
    nextObjective,
    reminderNote,
    createdAt: now,
    updatedAt: now
  };
}

export function findAppointmentForSession(appointments = [], caseId = "", sessionNumber = 1, date = "") {
  return (appointments || [])
    .filter((appointment) =>
      appointment.caseId === caseId &&
      Number(appointment.sessionNumber) === Number(sessionNumber) &&
      appointment.status !== "cancelled" &&
      (!date || appointment.scheduledLocalDate === date)
    )
    .sort((a, b) => new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime())[0] || null;
}

export function findNextAppointment(appointments = [], caseId = "", sessionNumber = null) {
  const now = Date.now();
  return (appointments || [])
    .filter((appointment) =>
      appointment.status === "scheduled" &&
      (!caseId || appointment.caseId === caseId) &&
      (!sessionNumber || Number(appointment.sessionNumber) === Number(sessionNumber))
    )
    .sort((a, b) => {
      const aTime = new Date(a.scheduledFor || a.createdAt).getTime();
      const bTime = new Date(b.scheduledFor || b.createdAt).getTime();
      return Math.abs(aTime - now) - Math.abs(bTime - now);
    })[0] || null;
}

export function findActiveAppointmentForCase(appointments = [], caseId = "", sessionNumber = 1) {
  return (appointments || [])
    .filter((appointment) =>
      appointment.caseId === caseId &&
      Number(appointment.sessionNumber) === Number(sessionNumber) &&
      ["scheduled", "in_progress", "closure_pending"].includes(appointment.status)
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] || null;
}

function normalizeAppointmentInput(authSession, appointment) {
  if (!appointment?.caseId || !appointment?.caseName) return null;
  const scheduledLocalDate = normalizeLocalDate(appointment.scheduledLocalDate || appointment.date || appointment.scheduledFor);
  const scheduledTime = appointment.scheduledTime || appointment.time || extractTime(appointment.scheduledFor) || "09:00";
  const scheduledFor = appointment.scheduledFor || buildScheduledFor({ date: scheduledLocalDate, time: scheduledTime });
  const now = new Date().toISOString();
  return {
    ...appointment,
    id: appointment.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${appointment.caseId}-${Date.now()}`),
    userId: appointment.userId || authSession?.user?.id || "",
    userEmail: appointment.userEmail || authSession?.user?.email || "",
    sessionNumber: Number(appointment.sessionNumber) || 1,
    scheduledFor,
    scheduledLocalDate,
    scheduledTime,
    timezone: appointment.timezone || SIMULATION_TIMEZONE,
    durationMinutes: Number(appointment.durationMinutes) || SESSION_DURATION_MINUTES,
    status: appointment.status || "scheduled",
    createdAt: appointment.createdAt || now,
    updatedAt: now
  };
}

function mapAppointmentRecordToPayload(record, user) {
  return {
    id: record.id,
    user_id: user.id,
    user_email: user.email,
    case_id: record.caseId,
    case_name: record.caseName,
    session_number: record.sessionNumber,
    scheduled_for: record.scheduledFor,
    scheduled_local_date: record.scheduledLocalDate,
    timezone: record.timezone || SIMULATION_TIMEZONE,
    duration_minutes: record.durationMinutes,
    status: record.status || "scheduled",
    started_at: record.startedAt || null,
    ends_at: record.endsAt || null,
    completed_at: record.completedAt || null,
    cancelled_at: record.cancelledAt || null,
    metadata: {
      scheduledTime: record.scheduledTime,
      nextObjective: record.nextObjective,
      reminderNote: record.reminderNote
    },
    created_at: record.createdAt,
    updated_at: record.updatedAt || new Date().toISOString()
  };
}

function mapAppointmentRowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    caseId: row.case_id,
    caseName: row.case_name,
    sessionNumber: row.session_number,
    scheduledFor: row.scheduled_for,
    scheduledLocalDate: row.scheduled_local_date,
    scheduledTime: row.metadata?.scheduledTime || extractTime(row.scheduled_for),
    timezone: row.timezone || SIMULATION_TIMEZONE,
    durationMinutes: row.duration_minutes || SESSION_DURATION_MINUTES,
    status: row.status || "scheduled",
    startedAt: row.started_at || "",
    endsAt: row.ends_at || "",
    completedAt: row.completed_at || "",
    cancelledAt: row.cancelled_at || "",
    nextObjective: row.metadata?.nextObjective || "",
    reminderNote: row.metadata?.reminderNote || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at
  };
}

export function getReadOnlyCachedAppointments() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_APPOINTMENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cacheAppointmentsForReadOnlyDisplay(records = []) {
  if (!canUseStorage()) return;
  const merged = new Map();
  for (const record of records.filter(Boolean)) merged.set(record.id, record);
  localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(Array.from(merged.values())));
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function extractTime(value = "") {
  const match = String(value || "").match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}
