import { getPatientMasterRecord } from "../data/patients/index.js";
import { getSessionStage } from "../data/sessionPrompts.js";
import { formatClinicalDecision } from "./clinicalPlanning.js";
import {
  buildProcessSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList
} from "./sessionMemory.js";
import { SIMULATION_TIMEZONE } from "./simulationUsagePolicy.js";

const AGENDA_STORAGE_KEY = "escuchaViva.clinicalAgenda.v1";
const AVAILABILITY_STORAGE_KEY = "escuchaViva.weeklyAvailability.v1";
const AVAILABILITY_TABLE = "simulation_student_availability";
const MAX_SIMULATED_SESSIONS = 12;
const DEFAULT_SESSION_DURATION = 45;
const DEFAULT_EDIT_BLOCK = { start: "09:00", end: "10:00" };

export const SESSION_DURATION_OPTIONS = [30, 45, 60];

export const WEEK_DAYS = [
  { key: "monday", label: "Lunes", shortLabel: "Lun", dayIndex: 1 },
  { key: "tuesday", label: "Martes", shortLabel: "Mar", dayIndex: 2 },
  { key: "wednesday", label: "Miercoles", shortLabel: "Mie", dayIndex: 3 },
  { key: "thursday", label: "Jueves", shortLabel: "Jue", dayIndex: 4 },
  { key: "friday", label: "Viernes", shortLabel: "Vie", dayIndex: 5 },
  { key: "saturday", label: "Sabado", shortLabel: "Sab", dayIndex: 6 },
  { key: "sunday", label: "Domingo", shortLabel: "Dom", dayIndex: 0 }
];

const EMPTY_WEEKLY_AVAILABILITY = buildEmptyWeeklyAvailability();
const DAY_KEY_TO_INDEX = Object.fromEntries(WEEK_DAYS.map((day) => [day.key, day.dayIndex]));
const DAY_INDEX_TO_KEY = Object.fromEntries(WEEK_DAYS.map((day) => [day.dayIndex, day.key]));

export const CLINICAL_PROCESS_STATES = {
  notStarted: "No iniciado",
  preparationPending: "Preparacion pendiente",
  inProgress: "En curso",
  clinicalNotePending: "Nota clinica pendiente",
  taskAssigned: "Tarea asignada",
  riskOpen: "Riesgo abierto",
  needsReevaluation: "Requiere reevaluacion",
  readyForNext: "Listo para próxima sesión",
  closing: "En cierre",
  closed: "Cerrado",
  referred: "Derivado",
  followUpPending: "Seguimiento pendiente"
};

export function buildClinicalAgendaItems(cases = []) {
  return cases
    .map((caseItem) => buildClinicalAgendaItem(caseItem))
    .sort((a, b) => getStatePriority(a.processState) - getStatePriority(b.processState));
}

export function buildClinicalAgendaItem(caseItem) {
  const patientRecord = getPatientMasterRecord(caseItem.id);
  const summaries = mergeSessionSummaryList(getSessionSummariesForCase(caseItem.id));
  const processSummary = buildProcessSummary({ caseItem, summaries });
  const agendaEntry = getClinicalAgendaEntry(caseItem.id);
  const latestSummary = summaries.at(-1) || null;
  const completedSessions = summaries.length ? Math.max(...summaries.map((summary) => summary.sessionNumber || 0)) : 0;
  const plannedSessions = Math.max(
    derivePlannedSessions({ latestSummary, agendaEntry, patientRecord }),
    completedSessions
  );
  const nextSessionNumber = completedSessions < plannedSessions ? completedSessions + 1 : null;
  const latestDecision = latestSummary?.clinicalDecision || null;
  const processMemory = processSummary.processMemory || {};
  const noteStatus = deriveClinicalNoteStatus(latestSummary);
  const task = derivePendingTask({ latestSummary, processMemory });
  const risk = deriveRiskStatus({ latestSummary, processMemory });
  const lastTopic = deriveLastTopic({ latestSummary, processSummary, caseItem, patientRecord });
  const nextFocus = deriveNextFocus({
    latestSummary,
    processSummary,
    agendaEntry,
    nextSessionNumber,
    plannedSessions
  });
  const processState = deriveProcessState({
    completedSessions,
    plannedSessions,
    latestSummary,
    latestDecision,
    agendaEntry,
    noteStatus,
    task,
    risk
  });

  const item = {
    caseItem,
    patientRecord,
    summaries,
    processSummary,
    agendaEntry,
    latestSummary,
    completedSessions,
    plannedSessions,
    currentSessionLabel: completedSessions
      ? `Sesion ${completedSessions} de ${plannedSessions}`
      : `0 de ${plannedSessions}`,
    nextSessionNumber,
    nextSessionLabel: nextSessionNumber ? `Sesion ${nextSessionNumber} de ${plannedSessions}` : "Sin sesion pendiente",
    processState,
    noteStatus,
    task,
    risk,
    lastTopic,
    nextFocus,
    registry: buildPatientRegistry(summaries)
  };

  return {
    ...item,
    alerts: deriveAgendaAlerts(item)
  };
}

export function getClinicalAgendaEntry(caseId) {
  return readAgendaEntries()[caseId] || null;
}

export function saveClinicalAgendaEntry(caseId, entry = {}) {
  if (!canUseStorage() || !caseId) return null;
  const entries = readAgendaEntries();
  const normalized = normalizeAgendaEntry(entry);
  const nextEntry = {
    ...(entries[caseId] || {}),
    ...normalized,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify({
    ...entries,
    [caseId]: nextEntry
  }));
  return nextEntry;
}

export function clearClinicalAgendaEntry(caseId) {
  if (!canUseStorage() || !caseId) return false;
  const entries = readAgendaEntries();
  delete entries[caseId];
  localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(entries));
  return true;
}

export function getWeeklyAvailability() {
  if (!canUseStorage()) return getEmptyWeeklyAvailability();
  try {
    const raw = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    if (!raw) return getEmptyWeeklyAvailability();
    const parsed = JSON.parse(raw);
    return normalizeWeeklyAvailability(parsed);
  } catch {
    return getEmptyWeeklyAvailability();
  }
}

export function saveWeeklyAvailability(availability = {}) {
  const normalized = normalizeWeeklyAvailability(availability);
  if (canUseStorage()) {
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export async function loadStudentWeeklyAvailability(authSession = null) {
  const { isSupabaseConfigured, supabase } = await getSupabaseRuntime();
  if (!isSupabaseConfigured || !supabase || !authSession?.user?.id) {
    return {
      availability: getEmptyWeeklyAvailability(),
      configured: false,
      authoritative: false,
      source: "unavailable",
      error: "No podemos verificar tu disponibilidad en este momento."
    };
  }

  const { data, error } = await supabase
    .from(AVAILABILITY_TABLE)
    .select("id,day_of_week,start_time,end_time,timezone,updated_at")
    .eq("user_id", authSession.user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.warn("[availability] load error message", error.message);
    console.warn("[availability] load error code", error.code || null);
    const classified = classifyAvailabilityError(error);
    return {
      availability: getEmptyWeeklyAvailability(),
      configured: false,
      authoritative: false,
      source: classified.source,
      error: classified.message
    };
  }

  const availability = mapAvailabilityRowsToWeekly(data || []);
  saveWeeklyAvailability(availability);
  return {
    availability,
    configured: hasConfiguredAvailability(availability),
    authoritative: true,
    source: "supabase",
    error: ""
  };
}

export async function saveStudentWeeklyAvailability(authSession = null, availability = {}) {
  const normalized = normalizeWeeklyAvailability(availability);
  const { isSupabaseConfigured, supabase } = await getSupabaseRuntime();
  if (!isSupabaseConfigured || !supabase || !authSession?.user?.id) {
    return {
      ok: false,
      availability: normalized,
      error: "No podemos guardar tu disponibilidad sin conexión segura a Supabase."
    };
  }

  const rows = mapWeeklyAvailabilityToRows(authSession.user.id, normalized);

  const { error: deleteError } = await supabase
    .from(AVAILABILITY_TABLE)
    .delete()
    .eq("user_id", authSession.user.id);

  if (deleteError) {
    console.warn("[availability] delete error message", deleteError.message);
    console.warn("[availability] delete error code", deleteError.code || null);
    const classified = classifyAvailabilityError(deleteError);
    return { ok: false, availability: normalized, error: classified.message, source: classified.source };
  }

  if (!rows.length) {
    const empty = getEmptyWeeklyAvailability();
    saveWeeklyAvailability(empty);
    return {
      ok: true,
      availability: empty,
      configured: false,
      error: ""
    };
  }

  const { data, error } = await supabase
    .from(AVAILABILITY_TABLE)
    .insert(rows)
    .select("id,day_of_week,start_time,end_time,timezone,updated_at");

  if (error) {
    console.warn("[availability] save error message", error.message);
    console.warn("[availability] save error code", error.code || null);
    const classified = classifyAvailabilityError(error);
    return { ok: false, availability: normalized, error: classified.message, source: classified.source };
  }

  const saved = mapAvailabilityRowsToWeekly(data || rows);
  saveWeeklyAvailability(saved);
  return {
    ok: true,
    availability: saved,
    configured: hasConfiguredAvailability(saved),
    error: ""
  };
}

export function getEmptyWeeklyAvailability() {
  return normalizeWeeklyAvailability(EMPTY_WEEKLY_AVAILABILITY);
}

export function hasConfiguredAvailability(availability = {}) {
  const normalized = normalizeWeeklyAvailability(availability);
  return WEEK_DAYS.some((day) => normalized[day.key]?.blocks?.length > 0);
}

export function formatAvailabilityForDay(dayAvailability = {}) {
  const blocks = Array.isArray(dayAvailability.blocks) ? dayAvailability.blocks : [];
  if (!dayAvailability.enabled || !blocks.length) return "Sin disponibilidad";
  return blocks.map((block) => `${block.start} a ${block.end}`).join(", ");
}

export function getWeekStartDate(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateInput(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildWeeklyAgenda({ cases = [], weekStart = getWeekStartDate(), availability = getWeeklyAvailability() } = {}) {
  const normalizedAvailability = normalizeWeeklyAvailability(availability);
  const days = WEEK_DAYS.map((day, index) => {
    const date = addDays(weekStart, index);
    const dateKey = formatDateInput(date);
    return {
      ...day,
      date,
      dateKey,
      dateLabel: formatDayLabel(date),
      availability: normalizedAvailability[day.key],
      sessions: []
    };
  });

  const blocks = buildScheduledSessionBlocks(cases);
  blocks.forEach((block) => {
    const day = days.find((candidate) => candidate.dateKey === block.date);
    if (day) day.sessions.push(block);
  });

  days.forEach((day) => day.sessions.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));

  return {
    weekStart: formatDateInput(weekStart),
    days,
    blocks
  };
}

export function buildAvailableSlots({
  cases = [],
  weekStart = getWeekStartDate(),
  availability = getWeeklyAvailability(),
  durationMinutes = DEFAULT_SESSION_DURATION,
  limit = 12
} = {}) {
  const normalizedAvailability = normalizeWeeklyAvailability(availability);
  const blocks = buildScheduledSessionBlocks(cases);
  const slots = [];
  const duration = normalizeDuration(durationMinutes);

  WEEK_DAYS.forEach((day, index) => {
    const dayAvailability = normalizedAvailability[day.key];
    if (!dayAvailability?.enabled) return;
    const date = formatDateInput(addDays(weekStart, index));
    dayAvailability.blocks.forEach((availabilityBlock) => {
      const start = timeToMinutes(availabilityBlock.start);
      const end = timeToMinutes(availabilityBlock.end);

      for (let current = start; current + duration <= end; current += duration) {
        const candidate = {
          date,
          time: minutesToTime(current),
          durationMinutes: duration
        };
        const conflict = findScheduleConflict({
          caseId: "",
          date,
          time: candidate.time,
          durationMinutes: duration,
          blocks
        });
        if (!conflict) {
          slots.push({
            ...candidate,
            dayLabel: day.label,
            endTime: minutesToTime(current + duration)
          });
        }
      }
    });
  });

  return slots.slice(0, limit);
}

export function validateAgendaSchedule({
  caseId,
  draft = {},
  cases = [],
  availability = getEmptyWeeklyAvailability()
} = {}) {
  const item = cases.find((caseItem) => caseItem.id === caseId)
    ? buildClinicalAgendaItem(cases.find((caseItem) => caseItem.id === caseId))
    : null;
  const date = String(draft.date || "").trim();
  const time = String(draft.time || "").trim();
  const durationMinutes = normalizeDuration(draft.durationMinutes);

  if (!date || !time) {
    return {
      ok: false,
      type: "missing",
      message: "Elige fecha y hora para validar la programacion.",
      detail: ""
    };
  }

  if (!item?.nextSessionNumber && !draft.plannedSessionNumber) {
    return {
      ok: false,
      type: "closed",
      message: "Este caso no tiene una sesion pendiente dentro del plan definido.",
      detail: "Revisa la decision de continuidad antes de programar una nueva sesion."
    };
  }

  const availabilityResult = validateAvailability({ date, time, durationMinutes, availability });
  if (!availabilityResult.ok) {
    return availabilityResult;
  }

  const conflict = findScheduleConflict({
    caseId,
    date,
    time,
    durationMinutes,
    blocks: buildScheduledSessionBlocks(cases)
  });

  if (conflict) {
    return {
      ok: false,
      type: "conflict",
      message: "Este horario ya esta ocupado por otra sesion.",
      detail: `Horario ocupado: ${conflict.patientName} - ${conflict.sessionLabel} - ${conflict.time} a ${conflict.endTime}.`,
      conflict
    };
  }

  return {
    ok: true,
    type: "available",
    message: "Horario disponible. Puedes agendar esta sesion.",
    detail: `${time} a ${minutesToTime(timeToMinutes(time) + durationMinutes)}.`
  };
}

export function buildAgendaReminder(item) {
  if (!item) return [];
  return [
    { label: "Ultimo tema trabajado", value: item.lastTopic },
    { label: "Tarea o acuerdo pendiente", value: item.task?.description || "Sin tarea registrada." },
    { label: "Riesgo", value: item.risk?.label || "Sin informacion disponible." },
    { label: "Objetivo de la sesion", value: item.nextFocus },
    { label: "Nota clinica anterior", value: item.noteStatus?.label || "Sin sesion previa." },
    {
      label: "Aspectos pendientes",
      value: withFallback(item.latestSummary?.temasPendientes?.slice(0, 3).join(", "), "Revisar motivo, apoyos y cierre.")
    }
  ];
}

export function formatAgendaDate(entry) {
  if (!entry?.date && !entry?.time) return "Sin horario programado";
  const dateLabel = entry.date ? formatDateOnly(entry.date) : "Fecha pendiente";
  return `${dateLabel}${entry.time ? `, ${entry.time}` : ""}`;
}

function readAgendaEntries() {
  if (!canUseStorage()) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeAgendaEntry(entry = {}) {
  return {
    date: String(entry.date || "").trim(),
    time: String(entry.time || "").trim(),
    durationMinutes: normalizeDuration(entry.durationMinutes),
    modality: String(entry.modality || "simulada").trim(),
    plannedSessionNumber: Number(entry.plannedSessionNumber) || null,
    status: String(entry.status || "programada").trim(),
    nextObjective: String(entry.nextObjective || "").trim(),
    reminderNote: String(entry.reminderNote || "").trim()
  };
}

function derivePlannedSessions({ latestSummary, agendaEntry, patientRecord }) {
  const candidates = [
    latestSummary?.clinicalDecision?.proposedSessions,
    latestSummary?.preSessionPlan?.proposedSessionCount,
    agendaEntry?.plannedSessionNumber,
    patientRecord?.sessionPlan?.expectedSessions?.recommended,
    patientRecord?.sessionPlan?.expectedRange?.recommended,
    4
  ];
  const value = candidates.find((candidate) => Number(candidate) > 0);
  return clampSessionCount(value || 4);
}

function deriveClinicalNoteStatus(latestSummary) {
  if (!latestSummary) {
    return {
      status: "not_started",
      label: "Sin nota aun",
      completed: false
    };
  }
  const note = String(latestSummary?.clinicalArtifacts?.clinicalNote || "").trim();
  return note
    ? { status: "completed", label: "Nota clinica completada", completed: true }
    : { status: "pending", label: "Nota clinica pendiente", completed: false };
}

function derivePendingTask({ latestSummary, processMemory }) {
  const latestTask = latestSummary?.taskDescription || latestSummary?.tareaAcordada || "";
  const memoryTask = processMemory?.tasks?.at(-1)?.description || "";
  const description = withFallback(latestTask, memoryTask);
  return description
    ? {
        description,
        accepted: Boolean(latestSummary?.taskAccepted ?? processMemory?.tasks?.at(-1)?.accepted),
        label: "Tarea por revisar"
      }
    : null;
}

function deriveRiskStatus({ latestSummary, processMemory }) {
  const decision = latestSummary?.clinicalDecision || {};
  const pendingRisks = String(decision.pendingRisks || "").trim();
  const riskSignals = processMemory?.riskSignals || [];
  const explored = Boolean(processMemory?.riskExplored || latestSummary?.processMemory?.risk?.wasExplored);
  const explicitOpenRisk =
    decision.action === "risk_protocol" ||
    riskSignals.length > 0 ||
    /\b(riesgo|suicid|hacer.*dano|violencia|urgencia|vulneracion)\b/i.test(pendingRisks);

  if (explicitOpenRisk) {
    return {
      status: "open",
      label: "Riesgo abierto o requiere reevaluacion",
      details: pendingRisks || riskSignals[0] || "Revisar indicadores de seguridad antes de avanzar."
    };
  }

  if (explored) {
    return {
      status: "reviewed",
      label: "Riesgo explorado sin senales abiertas",
      details: "Mantener seguimiento formativo."
    };
  }

  return {
    status: "unknown",
    label: latestSummary ? "Riesgo no evaluado suficientemente" : "Riesgo pendiente de evaluar",
    details: "Explorar seguridad y apoyos antes de cerrar."
  };
}

function deriveLastTopic({ latestSummary, processSummary, caseItem, patientRecord }) {
  return withFallback(
    latestSummary?.temasExplorados?.at(-1),
    processSummary?.workedTopics?.at(-1),
    patientRecord?.summaryVisible?.mainTheme,
    caseItem.mainTheme,
    caseItem.shortTitle
  );
}

function deriveNextFocus({ latestSummary, processSummary, agendaEntry, nextSessionNumber, plannedSessions }) {
  if (agendaEntry?.nextObjective) return agendaEntry.nextObjective;
  if (latestSummary?.clinicalDecision?.nextSessionObjectives) return latestSummary.clinicalDecision.nextSessionObjectives;
  if (latestSummary?.temasPendientes?.length) return latestSummary.temasPendientes.slice(0, 2).join(", ");
  if (processSummary?.pendingTopics?.length) return processSummary.pendingTopics.slice(0, 2).join(", ");
  if (nextSessionNumber) return getSessionStage(nextSessionNumber, plannedSessions).focus;
  return "Sintesis, cierre o decision de continuidad.";
}

function deriveProcessState({
  completedSessions,
  plannedSessions,
  latestDecision,
  agendaEntry,
  noteStatus,
  task,
  risk
}) {
  if (!completedSessions) {
    return agendaEntry?.date || agendaEntry?.time
      ? CLINICAL_PROCESS_STATES.preparationPending
      : CLINICAL_PROCESS_STATES.notStarted;
  }

  if (risk?.status === "open") return CLINICAL_PROCESS_STATES.riskOpen;
  if (latestDecision?.action === "refer") return CLINICAL_PROCESS_STATES.referred;
  if (latestDecision?.action === "follow_up") return CLINICAL_PROCESS_STATES.followUpPending;
  if (["request_supervision", "apply_instruments", "beyond_simulator"].includes(latestDecision?.action)) {
    return CLINICAL_PROCESS_STATES.needsReevaluation;
  }
  if (latestDecision?.action === "close_process" && completedSessions >= plannedSessions) {
    return CLINICAL_PROCESS_STATES.closed;
  }
  if (!noteStatus?.completed) return CLINICAL_PROCESS_STATES.clinicalNotePending;
  if (task?.description) return CLINICAL_PROCESS_STATES.taskAssigned;
  if (completedSessions >= plannedSessions) return CLINICAL_PROCESS_STATES.closing;
  return CLINICAL_PROCESS_STATES.readyForNext;
}

function deriveAgendaAlerts(item) {
  const alerts = [];
  if (item.noteStatus?.status === "pending") {
    alerts.push({
      type: "note",
      label: "Nota clinica pendiente",
      text: "Completa o revisa la nota antes de avanzar a la siguiente sesion."
    });
  }
  if (item.plannedSessions > 1 && !hasClearObjectives(item.latestSummary)) {
    alerts.push({
      type: "objectives",
      label: "Objetivos poco claros",
      text: `Definiste ${item.plannedSessions} sesiones, pero aun conviene explicitar objetivos de continuidad.`
    });
  }
  if (item.task?.description) {
    alerts.push({
      type: "task",
      label: "Tarea por revisar",
      text: "Pregunta al iniciar como le fue con la tarea o acuerdo pendiente."
    });
  }
  if (item.risk?.status === "open") {
    alerts.push({
      type: "risk",
      label: "Riesgo abierto",
      text: "Reevalua seguridad antes de continuar con otros focos."
    });
  } else if (item.risk?.status === "unknown" && item.completedSessions > 0) {
    alerts.push({
      type: "risk",
      label: "Riesgo no suficientemente evaluado",
      text: "Incluye una exploracion basica de riesgo y factores protectores."
    });
  }
  if (item.completedSessions > 0 && !hasSupportExplored(item.processSummary)) {
    alerts.push({
      type: "support",
      label: "Red de apoyo pendiente",
      text: "No aparece una exploracion clara de apoyos o recursos."
    });
  }
  if (hasSensitivePendingTopic(item.latestSummary)) {
    alerts.push({
      type: "sensitive",
      label: "Tema sensible abierto",
      text: "Considera retomarlo con cuidado y suficiente contencion."
    });
  }
  if (item.nextSessionNumber && !item.agendaEntry?.date) {
    alerts.push({
      type: "schedule",
      label: "Proxima sesion sin horario",
      text: "Programa fecha, hora y objetivo para sostener continuidad."
    });
  }
  return alerts.slice(0, 5);
}

function buildPatientRegistry(summaries = []) {
  return summaries.map((summary) => ({
    id: summary.id,
    sessionNumber: summary.sessionNumber,
    date: summary.simulatedDate,
    objective: withFallback(summary.preSessionPlan?.evaluationObjective, summary.preSessionPlan?.processObjectives),
    summary: summary.resumenConversacion,
    hypothesis: summary.clinicalArtifacts?.clinicalHypothesis || "",
    risk: withFallback(
      summary.clinicalDecision?.pendingRisks,
      summary.processMemory?.risk?.signals?.[0],
      summary.processMemory?.risk?.wasExplored ? "Riesgo explorado sin senales abiertas." : ""
    ),
    instruments: summary.clinicalArtifacts?.selectedInstruments || [],
    techniques: summary.processMemory?.techniques || [],
    task: summary.taskDescription || summary.tareaAcordada || "",
    decision: summary.clinicalDecision ? formatClinicalDecision(summary.clinicalDecision) : "Decision no registrada",
    clinicalNote: summary.clinicalArtifacts?.clinicalNote || "",
    formativeEvaluation: withFallback(
      summary.clinicalPlanEvaluation?.summary,
      summary.clinicalArtifactsEvaluation?.summary,
      summary.preSessionEvaluation?.summary
    )
  }));
}

function hasClearObjectives(summary) {
  return Boolean(
    String(summary?.clinicalDecision?.nextSessionObjectives || "").trim().length >= 18 ||
    String(summary?.preSessionPlan?.processObjectives || "").trim().length >= 18
  );
}

function hasSupportExplored(processSummary) {
  return (processSummary?.workedTopics || []).some((topic) => /apoyo|red|familia|recursos/i.test(topic));
}

function hasSensitivePendingTopic(summary) {
  return (summary?.temasPendientes || []).some((topic) =>
    /riesgo|culpa|verguenza|violencia|duelo|familia|pareja|consumo/i.test(topic)
  );
}

function getStatePriority(state) {
  const priorities = {
    [CLINICAL_PROCESS_STATES.riskOpen]: 0,
    [CLINICAL_PROCESS_STATES.clinicalNotePending]: 1,
    [CLINICAL_PROCESS_STATES.taskAssigned]: 2,
    [CLINICAL_PROCESS_STATES.needsReevaluation]: 3,
    [CLINICAL_PROCESS_STATES.readyForNext]: 4,
    [CLINICAL_PROCESS_STATES.inProgress]: 5,
    [CLINICAL_PROCESS_STATES.preparationPending]: 6,
    [CLINICAL_PROCESS_STATES.followUpPending]: 7,
    [CLINICAL_PROCESS_STATES.closing]: 8,
    [CLINICAL_PROCESS_STATES.referred]: 9,
    [CLINICAL_PROCESS_STATES.closed]: 10,
    [CLINICAL_PROCESS_STATES.notStarted]: 11
  };
  return priorities[state] ?? 20;
}

function clampSessionCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 4;
  return Math.min(MAX_SIMULATED_SESSIONS, Math.max(1, Math.round(numeric)));
}

function withFallback(...values) {
  return values.find((value) => String(value || "").trim().length > 0) || "";
}

function formatDateOnly(value) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium"
    }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function buildScheduledSessionBlocks(cases = []) {
  return buildClinicalAgendaItems(cases)
    .filter((item) => item.agendaEntry?.date && item.agendaEntry?.time)
    .map((item) => {
      const durationMinutes = normalizeDuration(item.agendaEntry.durationMinutes);
      const startMinutes = timeToMinutes(item.agendaEntry.time);
      return {
        caseId: item.caseItem.id,
        patientName: item.caseItem.name,
        date: item.agendaEntry.date,
        time: item.agendaEntry.time,
        endTime: minutesToTime(startMinutes + durationMinutes),
        startMinutes,
        endMinutes: startMinutes + durationMinutes,
        durationMinutes,
        sessionNumber: item.agendaEntry.plannedSessionNumber || item.nextSessionNumber || 1,
        plannedSessions: item.plannedSessions,
        sessionLabel: `Sesion ${item.agendaEntry.plannedSessionNumber || item.nextSessionNumber || 1} de ${item.plannedSessions}`,
        status: item.agendaEntry.status || item.processState,
        focus: item.agendaEntry.nextObjective || item.nextFocus,
        reminderNote: item.agendaEntry.reminderNote || item.task?.description || "",
        item
      };
    });
}

function validateAvailability({ date, time, durationMinutes, availability }) {
  const normalizedAvailability = normalizeWeeklyAvailability(availability);
  if (!hasConfiguredAvailability(normalizedAvailability)) {
    return {
      ok: false,
      type: "no_availability",
      message: "Aún no has definido tu disponibilidad.",
      detail: "Configúrala para organizar tus próximas sesiones.",
      actionLabel: "Editar disponibilidad"
    };
  }

  const dayKey = getDayKey(date);
  const dayAvailability = normalizedAvailability[dayKey];
  if (!dayAvailability?.enabled) {
    return {
      ok: false,
      type: "outside_availability",
      message: "Este horario está fuera de tu disponibilidad.",
      detail: "Ese día no tiene disponibilidad configurada.",
      actionLabel: "Editar disponibilidad"
    };
  }

  const start = timeToMinutes(time);
  const end = start + normalizeDuration(durationMinutes);
  const matchingBlock = dayAvailability.blocks.find((block) => {
    const availableStart = timeToMinutes(block.start);
    const availableEnd = timeToMinutes(block.end);
    return start >= availableStart && end <= availableEnd;
  });
  if (!matchingBlock) {
    return {
      ok: false,
      type: "outside_availability",
      message: "Este horario está fuera de tu disponibilidad.",
      detail: `Disponibilidad del día: ${formatAvailabilityForDay(dayAvailability)}.`,
      actionLabel: "Editar disponibilidad"
    };
  }

  return { ok: true };
}

function findScheduleConflict({ caseId, date, time, durationMinutes, blocks = [] }) {
  const start = timeToMinutes(time);
  const end = start + normalizeDuration(durationMinutes);
  return blocks.find((block) => {
    if (block.caseId === caseId) return false;
    if (block.date !== date) return false;
    return start < block.endMinutes && end > block.startMinutes;
  }) || null;
}

function normalizeWeeklyAvailability(availability = {}) {
  return WEEK_DAYS.reduce((acc, day) => {
    const source = availability?.[day.key] || {};
    const rawBlocks = Array.isArray(source.blocks)
      ? source.blocks
      : source.enabled && source.start && source.end
        ? [{ start: source.start, end: source.end }]
        : [];
    const blocks = rawBlocks
      .map((block) => ({
        start: isValidTime(block?.start) ? block.start : "",
        end: isValidTime(block?.end) ? block.end : ""
      }))
      .filter((block) => block.start && block.end && timeToMinutes(block.end) > timeToMinutes(block.start))
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    const enabled = source.enabled !== false && blocks.length > 0;
    const firstBlock = blocks[0] || DEFAULT_EDIT_BLOCK;
    acc[day.key] = {
      enabled,
      start: enabled ? firstBlock.start : "",
      end: enabled ? firstBlock.end : "",
      blocks: enabled ? blocks : []
    };
    return acc;
  }, {});
}

function buildEmptyWeeklyAvailability() {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day.key] = { enabled: false, start: "", end: "", blocks: [] };
    return acc;
  }, {});
}

function mapAvailabilityRowsToWeekly(rows = []) {
  const base = buildEmptyWeeklyAvailability();
  for (const row of rows) {
    const dayKey = DAY_INDEX_TO_KEY[Number(row.day_of_week)];
    if (!dayKey) continue;
    const currentBlocks = Array.isArray(base[dayKey].blocks) ? base[dayKey].blocks : [];
    base[dayKey] = {
      enabled: true,
      blocks: [
        ...currentBlocks,
        {
          id: row.id || "",
          start: normalizeTimeValue(row.start_time),
          end: normalizeTimeValue(row.end_time)
        }
      ]
    };
  }
  return normalizeWeeklyAvailability(base);
}

function mapWeeklyAvailabilityToRows(userId, availability = {}) {
  const normalized = normalizeWeeklyAvailability(availability);
  return WEEK_DAYS.flatMap((day) => {
    const blocks = normalized[day.key]?.blocks || [];
    return blocks.map((block) => ({
      user_id: userId,
      day_of_week: DAY_KEY_TO_INDEX[day.key],
      start_time: block.start,
      end_time: block.end,
      timezone: SIMULATION_TIMEZONE
    }));
  });
}

function normalizeTimeValue(value = "") {
  const match = String(value || "").match(/^(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function classifyAvailabilityError(error = {}) {
  const code = String(error.code || "");
  const message = String(error.message || "");
  if (code === "42P01" || /does not exist|schema cache|simulation_student_availability/i.test(message)) {
    return {
      source: "schema_missing",
      message: "La configuración de disponibilidad aún no está habilitada en este entorno."
    };
  }
  if (code === "42501" || /permission|row-level security|rls/i.test(message)) {
    return {
      source: "permission_denied",
      message: "No tienes permiso para modificar esta disponibilidad."
    };
  }
  return {
    source: "network_or_supabase_error",
    message: "No pudimos verificar tu disponibilidad. Intenta nuevamente."
  };
}

async function getSupabaseRuntime() {
  try {
    return await import("../lib/supabaseClient.js");
  } catch (error) {
    console.warn("[availability] supabase runtime unavailable", error?.message || error);
    return { isSupabaseConfigured: false, supabase: null };
  }
}

function getDayKey(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const dayIndex = date.getDay();
  return WEEK_DAYS.find((day) => day.dayIndex === dayIndex)?.key || "monday";
}

function timeToMinutes(time = "00:00") {
  const [hours, minutes] = String(time).split(":").map((part) => Number.parseInt(part, 10));
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function minutesToTime(value) {
  const safeValue = Math.max(0, Number(value) || 0);
  const hours = Math.floor(safeValue / 60);
  const minutes = safeValue % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeDuration(value) {
  const numeric = Number(value);
  return SESSION_DURATION_OPTIONS.includes(numeric) ? numeric : DEFAULT_SESSION_DURATION;
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || ""));
}

function formatDayLabel(date) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(date);
  } catch {
    return formatDateInput(date);
  }
}
