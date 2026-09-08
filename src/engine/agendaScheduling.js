import {
  addDays, formatDateInput, getWeekStartDate, validateAgendaSchedule, WEEK_DAYS
} from "./clinicalAgenda.js";
import {
  ACTIVE_APPOINTMENT_STATUSES, buildScheduledFor, getZonedDateKey, SESSION_DURATION_MINUTES
} from "./simulationUsagePolicy.js";

export function getAgendaToday(now = new Date()) {
  return new Date(`${getZonedDateKey(now)}T12:00:00`);
}

export function moveAgendaDate(value, view, direction) {
  const date = new Date(value);
  if (view !== "mes") return addDays(date, direction * (view === "dia" ? 1 : 7));
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + direction);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}

export function findRelevantAppointment(item, appointments = []) {
  const priority = { closure_pending: 0, in_progress: 1, scheduled: 2 };
  return appointments
    .filter((appointment) => appointment.caseId === item.caseItem.id && Object.hasOwn(priority, appointment.status))
    .sort((a, b) => priority[a.status] - priority[b.status] ||
      Number(a.sessionNumber) - Number(b.sessionNumber) ||
      new Date(a.scheduledFor || a.createdAt) - new Date(b.scheduledFor || b.createdAt))[0] || null;
}

export function findDraftAppointment(item, draft, appointments = []) {
  return appointments.find((appointment) =>
    appointment.caseId === item.caseItem.id && appointment.status !== "cancelled" &&
    Number(appointment.sessionNumber) === Number(draft.plannedSessionNumber || item.nextSessionNumber || 1)
  ) || null;
}

export function buildScheduleDraft(item, savedDraft = null, slot = null) {
  return {
    date: item.agendaEntry?.date || "",
    time: item.agendaEntry?.time || "",
    durationMinutes: SESSION_DURATION_MINUTES,
    plannedSessionNumber: item.agendaEntry?.plannedSessionNumber || item.nextSessionNumber || 1,
    nextObjective: item.agendaEntry?.nextObjective || item.nextFocus || "",
    reminderNote: item.agendaEntry?.reminderNote || item.task?.description || "",
    ...savedDraft,
    ...(slot ? { date: slot.date, time: slot.time } : {})
  };
}

export function requireConfirmedAppointment(result, expectedStatus) {
  if (result?.cloudSaved && result.data?.id && result.data.status === expectedStatus) return result.data;
  const error = result?.error;
  if (error?.code === "23505") {
    throw new Error("Ese día o esa sesión ya tiene una cita. Actualiza la agenda y elige otro horario.");
  }
  throw new Error(typeof error === "string" ? error : "No pudimos confirmar el cambio. Tu formulario se conserva; revisa la conexión y vuelve a intentarlo.");
}

export function buildAppointmentAvailableSlots({
  appointments = [], weekStart = getWeekStartDate(getAgendaToday()), availability = {},
  durationMinutes = SESSION_DURATION_MINUTES, limit = 10, now = new Date()
} = {}) {
  const slots = [];
  WEEK_DAYS.forEach((day, index) => {
    const dayAvailability = availability[day.key];
    if (!dayAvailability?.enabled) return;
    const date = formatDateInput(addDays(weekStart, index));
    if (appointments.some((appointment) => appointment.scheduledLocalDate === date &&
      ACTIVE_APPOINTMENT_STATUSES.has(appointment.status))) return;
    (dayAvailability.blocks || []).forEach((block) => {
      for (let current = timeToMinutes(block.start); current + durationMinutes <= timeToMinutes(block.end); current += durationMinutes) {
        const time = minutesToTime(current);
        const scheduledFor = buildScheduledFor({ date, time });
        if (!scheduledFor || new Date(scheduledFor) <= now) continue;
        slots.push({ date, time, endTime: minutesToTime(current + durationMinutes), durationMinutes, dayLabel: day.label });
      }
    });
  });
  return slots.slice(0, limit);
}

export function validateAppointmentSchedule({ item, draft, appointments = [], appointmentsStatus, availability, availabilityStatus, cases, now = new Date() }) {
  if (!appointmentsStatus?.authoritative || appointmentsStatus.loading) {
    return { ok: false, type: "unverified_agenda", message: "La agenda aún no está verificada.", detail: "Espera a que se carguen tus citas o utiliza Reintentar carga de agenda antes de programar." };
  }
  if (availabilityStatus?.loading || availabilityStatus?.saving) {
    return { ok: false, type: "no_availability", message: "Estamos verificando tu disponibilidad.", detail: "Espera unos segundos antes de programar la sesión." };
  }
  if (!availabilityStatus?.authoritative) {
    return {
      ok: false, type: "no_availability",
      message: availabilityStatus?.error ? "No pudimos verificar tu disponibilidad." : "Aún no has definido tu disponibilidad.",
      detail: availabilityStatus?.error || "Configúrala para organizar tus próximas sesiones.", actionLabel: "Editar disponibilidad"
    };
  }
  const existing = findDraftAppointment(item, draft, appointments);
  if (existing && existing.status !== "scheduled") {
    return { ok: false, type: "closed", message: "Esta sesión ya se inició o finalizó.", detail: "Retoma su proceso o selecciona una sesión pendiente para programar." };
  }
  if (!draft.date || !draft.time) {
    return { ok: false, type: "missing", message: "Elige fecha y hora para validar la programación." };
  }
  const scheduledFor = buildScheduledFor({ date: draft.date, time: draft.time });
  if (!scheduledFor || new Date(scheduledFor) <= now) {
    return { ok: false, type: "invalid_date", message: "Elige una fecha y hora futuras válidas.", detail: "Los horarios corresponden a Chile (Santiago), incluido el cambio de hora." };
  }
  const base = validateAgendaSchedule({ caseId: item.caseItem.id, draft, cases, availability });
  if (!base.ok && base.type !== "conflict") return base;
  if (appointments.some((appointment) => appointment.scheduledLocalDate === draft.date &&
    ACTIVE_APPOINTMENT_STATUSES.has(appointment.status) && appointment.id !== existing?.id)) {
    return { ok: false, type: "daily_limit", message: "Ya existe una sesión programada para ese día.", detail: "Cada estudiante puede tener como máximo una sesión clínica simulada por día." };
  }
  return { ok: true, type: "available", message: "Horario disponible. Puedes agendar esta sesión.", detail: `${draft.time} · ${SESSION_DURATION_MINUTES} minutos · hora de Chile (Santiago).` };
}

function timeToMinutes(time = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
