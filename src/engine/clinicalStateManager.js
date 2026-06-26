import { clamp, opennessLevel } from "../utils/textUtils.js";

export function buildClinicalState({
  caseId,
  history = [],
  memory = {},
  sessionNumber = 1,
  profile
} = {}) {
  const previousClinicalState = findLastClinicalState(history);
  const responseIdsFromHistory = history.map((turn) => turn.responseId).filter(Boolean);
  const responseTextsFromHistory = history.map((turn) => turn.answer).filter(Boolean);
  const revealedFromHistory = history.flatMap((turn) =>
    turn.analysis?.clinicalSimulation?.memoryPatch?.revealedTopics
    || turn.analysis?.clinicalAvatar?.reveals
    || []
  );

  return {
    caseId: caseId || profile?.id || "claudio",
    sessionNumber,
    turnCount: history.length || memory.turnCount || previousClinicalState?.turnCount || 0,
    usedResponseIds: unique([
      ...(previousClinicalState?.usedResponseIds || []),
      ...(memory.usedResponseIds || []),
      ...responseIdsFromHistory
    ]),
    usedResponseTexts: unique([
      ...(previousClinicalState?.usedResponseTexts || []),
      ...(memory.usedResponseTexts || []),
      ...responseTextsFromHistory
    ]),
    revealedTopics: unique([
      ...(previousClinicalState?.revealedTopics || []),
      ...(memory.revealedTopics || []),
      ...revealedFromHistory
    ]),
    emotionalState: previousClinicalState?.emotionalState
      || memory.emotionalState
      || profile?.clinicalFrame?.initialEmotionalState
      || "cauteloso",
    trustLevel: clamp(previousClinicalState?.trustLevel ?? memory.trustLevel ?? 0),
    currentTopic: previousClinicalState?.currentTopic || memory.currentTopic || null,
    sessionStage: previousClinicalState?.sessionStage || memory.sessionStage || "inicio",
    studentHasShownEmpathy: Boolean(previousClinicalState?.studentHasShownEmpathy || memory.studentHasShownEmpathy),
    studentHasAskedMotive: Boolean(previousClinicalState?.studentHasAskedMotive || memory.studentHasAskedMotive),
    studentHasAskedEmotion: Boolean(previousClinicalState?.studentHasAskedEmotion || memory.studentHasAskedEmotion),
    studentHasClosedSession: Boolean(previousClinicalState?.studentHasClosedSession || memory.studentHasClosedSession),
    taskAssigned: Boolean(previousClinicalState?.taskAssigned || memory.taskAssigned),
    taskType: previousClinicalState?.taskType || memory.taskType || null,
    taskDescription: previousClinicalState?.taskDescription || memory.taskDescription || null,
    taskProposedText: previousClinicalState?.taskProposedText || memory.taskProposedText || null,
    taskAccepted: Boolean(previousClinicalState?.taskAccepted || memory.taskAccepted),
    taskStatus: previousClinicalState?.taskStatus || memory.taskStatus || null,
    nextSessionAgreement: previousClinicalState?.nextSessionAgreement || memory.nextSessionAgreement || null,
    lastStudentAct: previousClinicalState?.lastStudentAct || memory.lastStudentAct || null,
    lastClinicalTopic: previousClinicalState?.lastClinicalTopic || memory.lastClinicalTopic || null,
    lastPatientMessage: history.at(-1)?.answer || memory.lastPatientMessage || "",
    lastStudentMessage: history.at(-1)?.question || memory.lastStudentMessage || "",
    recentTurns: history.slice(-5).map((turn) => ({
      studentMessage: turn.question || "",
      patientMessage: turn.answer || "",
      detectedAct: turn.analysis?.clinicalSimulation?.detectedAct || turn.responseCategory || null,
      clinicalTopic: turn.analysis?.clinicalSimulation?.clinicalTopic || turn.analysis?.contextualTopic || null
    }))
  };
}

export function updateClinicalState({
  state,
  detectedAct,
  clinicalTopic,
  taskDetails,
  studentMessage = ""
}) {
  const delta = trustDeltaByAct(detectedAct);
  const nextTrust = clamp((state.trustLevel || 0) + delta);
  const studentHasShownEmpathy = state.studentHasShownEmpathy || detectedAct === "intervencion_empatica";
  const studentHasAskedMotive = state.studentHasAskedMotive || detectedAct === "motivo_consulta";
  const studentHasAskedEmotion = state.studentHasAskedEmotion || detectedAct === "emocion";
  const studentHasClosedSession = state.studentHasClosedSession || detectedAct === "cierre";
  const taskWasAccepted = detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea";
  const nextTopic = clinicalTopic || state.currentTopic;

  return {
    ...state,
    trustLevel: nextTrust,
    emotionalState: resolveEmotionalState({
      detectedAct,
      trustLevel: nextTrust,
      closed: studentHasClosedSession
    }),
    currentTopic: nextTopic,
    lastClinicalTopic: nextTopic,
    lastStudentAct: detectedAct,
    sessionStage: resolveSessionStage({
      state,
      detectedAct,
      studentHasClosedSession
    }),
    studentHasShownEmpathy,
    studentHasAskedMotive,
    studentHasAskedEmotion,
    studentHasClosedSession,
    taskAssigned: taskWasAccepted ? true : state.taskAssigned,
    taskType: taskDetails?.type || state.taskType,
    taskDescription: taskDetails?.description || state.taskDescription,
    taskProposedText: taskDetails?.proposedText || state.taskProposedText,
    taskAccepted: taskWasAccepted ? true : state.taskAccepted,
    taskStatus: taskWasAccepted ? "accepted" : state.taskStatus,
    nextSessionAgreement: detectedAct === "agenda_proxima_sesion"
      ? studentMessage
      : state.nextSessionAgreement
  };
}

export function selectDisclosureLevel({ state, clinicalTopic, sessionNumber = 1 }) {
  if (clinicalTopic === "limite_profundidad") return "low";
  if (state.studentHasClosedSession) return "low";
  if (sessionNumber >= 2 && state.trustLevel >= 55 && state.studentHasShownEmpathy && state.studentHasAskedEmotion) {
    return "high";
  }
  if (
    state.trustLevel >= 22
    || state.studentHasAskedEmotion
    || state.studentHasShownEmpathy
    || ["emocion", "miedo", "verguenza", "experiencia_vivida"].includes(clinicalTopic)
  ) {
    return "medium";
  }
  return "low";
}

export function buildMemoryPatch({
  state,
  selectedResponse,
  responseText,
  detectedAct,
  clinicalTopic,
  disclosureLevel,
  taskDetails
}) {
  const responseId = selectedResponse?.id || null;
  const revealedTopics = unique([
    ...(state.revealedTopics || []),
    ...(selectedResponse?.reveals || []),
    clinicalTopic
  ].filter(Boolean));
  const usedResponseIds = unique([
    ...(state.usedResponseIds || []),
    responseId
  ].filter(Boolean));
  const usedResponseTexts = unique([
    ...(state.usedResponseTexts || []),
    responseText
  ].filter(Boolean));

  return {
    ...state,
    turnCount: (state.turnCount || 0) + 1,
    usedResponseIds,
    usedResponseTexts,
    revealedTopics,
    lastPatientMessage: responseText,
    lastStudentAct: detectedAct,
    lastClinicalTopic: clinicalTopic,
    currentTopic: clinicalTopic || state.currentTopic,
    disclosureLevel,
    opennessLevel: opennessLevel(state.trustLevel),
    taskAssigned: (detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea")
      ? true
      : state.taskAssigned,
    taskType: taskDetails?.type || state.taskType,
    taskDescription: taskDetails?.description || state.taskDescription,
    taskProposedText: taskDetails?.proposedText || state.taskProposedText,
    taskAccepted: (detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea")
      ? true
      : state.taskAccepted,
    taskStatus: (detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea")
      ? "accepted"
      : state.taskStatus,
    taskDetails: taskDetails || state.taskDetails || null
  };
}

export function clinicalOpennessLevel(trustLevel = 0) {
  return opennessLevel(trustLevel);
}

function trustDeltaByAct(detectedAct) {
  const deltas = {
    saludo: 2,
    identidad_nombre: 1,
    datos_basicos: 1,
    convivencia_familia: 2,
    motivo_consulta: 5,
    emocion: 6,
    experiencia_vivida: 4,
    rutina: 3,
    apoyo_redes: 3,
    tarea_terapeutica: 4,
    confirmar_tarea: 3,
    agenda_proxima_sesion: 2,
    cierre: 1,
    pregunta_confusa: -1,
    intervencion_confrontativa: -12,
    intervencion_empatica: 14
  };
  return deltas[detectedAct] ?? 0;
}

function resolveEmotionalState({ detectedAct, trustLevel, closed }) {
  if (closed) return "reflexivo";
  if (detectedAct === "intervencion_confrontativa") return "defensivo";
  if (trustLevel < 12) return "cauteloso";
  if (trustLevel < 35) return "ambivalente";
  if (trustLevel < 60) return "mas_abierto";
  return "reflexivo";
}

function resolveSessionStage({ state, detectedAct, studentHasClosedSession }) {
  if (studentHasClosedSession) return "cierre";
  if ((state.turnCount || 0) <= 1) return "inicio";
  if (detectedAct === "tarea_terapeutica" || detectedAct === "agenda_proxima_sesion") return "cierre_formativo";
  return "exploracion";
}

function findLastClinicalState(history) {
  return [...history]
    .reverse()
    .map((turn) => turn.analysis?.clinicalSimulation?.memoryPatch)
    .find(Boolean) || null;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}
