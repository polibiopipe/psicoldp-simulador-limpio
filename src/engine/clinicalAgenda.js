import { getPatientMasterRecord } from "../data/patients/index.js";
import { getSessionStage } from "../data/sessionPrompts.js";
import { formatClinicalDecision } from "./clinicalPlanning.js";
import {
  buildProcessSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList
} from "./sessionMemory.js";

const AGENDA_STORAGE_KEY = "escuchaViva.clinicalAgenda.v1";
const MAX_SIMULATED_SESSIONS = 12;

export const CLINICAL_PROCESS_STATES = {
  notStarted: "No iniciado",
  preparationPending: "Preparacion pendiente",
  inProgress: "En curso",
  clinicalNotePending: "Nota clinica pendiente",
  taskAssigned: "Tarea asignada",
  riskOpen: "Riesgo abierto",
  needsReevaluation: "Requiere reevaluacion",
  readyForNext: "Listo para proxima sesion",
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
  const plannedSessions = derivePlannedSessions({ latestSummary, agendaEntry, patientRecord });
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
    durationMinutes: Number(entry.durationMinutes) || 50,
    modality: String(entry.modality || "simulada").trim(),
    plannedSessionNumber: Number(entry.plannedSessionNumber) || null,
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
