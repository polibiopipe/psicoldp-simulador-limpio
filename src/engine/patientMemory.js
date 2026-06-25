import { patientVoices } from "../data/patientVoices.js";
import { buildIdeaSignature } from "./conversationQuality.js";

const difficultyShift = {
  introductorio: 8,
  intermedio: 0,
  avanzado: -10
};

export function buildPatientMemory({ caseId, history = [], difficulty = "intermedio", sessionNumber = 1, memory }) {
  const voice = patientVoices[caseId] || patientVoices.tomas;
  const trustLevel = history.at(-1)?.patientState?.trustLevel
    ?? memory?.trustLevel
    ?? clamp((voice.initialTrust ?? 35) + (difficultyShift[difficulty] ?? 0));
  const evasiveCount = countRecentEvasiveResponses(history);
  const exploredTopics = new Set();
  for (const turn of history) {
    const category = turn.responseCategory || turn.analysis?.detectedIntent;
    if (category) exploredTopics.add(category);
  }

  const historyResponseTexts = history.map((turn) => turn.answer).filter(Boolean);
  const usedResponseTexts = Array.from(new Set([
    ...(memory?.usedResponseTexts || []),
    ...historyResponseTexts
  ]));
  const usedResponseIds = Array.from(new Set([
    ...(memory?.usedResponseIds || []),
    ...history.map((turn) => turn.responseId).filter(Boolean)
  ]));
  const recentTurns = history.length
    ? history.slice(-5).map(toMemoryTurn)
    : (memory?.recentTurns || []).slice(-5);
  const lastPatientMessage = history.at(-1)?.answer || memory?.lastPatientMessage || "";
  const lastStudentMessage = history.at(-1)?.question || memory?.lastStudentMessage || "";
  const lastIntent = history.at(-1)?.responseCategory || memory?.lastIntent || null;
  const lastTopic = history.at(-1)?.analysis?.contextualTopic
    || history.at(-1)?.responseCategory
    || memory?.lastTopic
    || null;
  const lastSubstantiveTopic = findLastSubstantiveTopic(recentTurns) || memory?.lastSubstantiveTopic || lastTopic;
  const recentValidationCount = recentTurns.filter((turn) => turn.validation).length;
  const revealedTopics = Array.from(new Set([
    ...(memory?.revealedTopics || []),
    ...history.flatMap((turn) => turn.analysis?.clinicalAvatar?.reveals || [])
  ]));
  const latestTaskTurn = [...history]
    .reverse()
    .find((turn) =>
      turn.analysis?.clinicalAvatar?.taskKind
      || turn.analysis?.clinicalAvatar?.practicalAct === "task_confirmation"
    );
  const latestTask = latestTaskTurn?.analysis?.clinicalAvatar || null;
  const taskKind = latestTask?.taskKind || memory?.taskStatus || null;
  const taskDetails = latestTask?.taskDetails || null;
  const acceptedTask = latestTask?.taskKind === "concrete"
    || latestTask?.practicalAct === "task_confirmation";

  return {
    ...(memory || {}),
    caseId,
    sessionNumber,
    turnCount: history.length || memory?.turnCount || 0,
    trustLevel,
    opennessLevel: getOpennessLevel(trustLevel),
    voice,
    usedResponseIds,
    usedResponseTexts,
    usedIdeaSignatures: Array.from(new Set(usedResponseTexts.map(buildIdeaSignature).filter(Boolean))),
    recentTurns,
    recentPatientMessages: recentTurns.map((turn) => turn.patientMessage).filter(Boolean),
    recentStudentMessages: recentTurns.map((turn) => turn.studentMessage).filter(Boolean),
    recentValidationCount,
    evasiveCount,
    lastPatientMessage,
    lastStudentMessage,
    lastIntent,
    lastStudentIntent: lastIntent,
    lastTopic,
    currentTopic: lastTopic,
    lastSubstantiveTopic,
    exploredTopics: Array.from(exploredTopics),
    revealedTopics,
    emotionalOpenness: getOpennessLevel(trustLevel),
    taskAssigned: acceptedTask ? true : Boolean(memory?.taskAssigned),
    taskType: taskDetails?.type || memory?.taskType || null,
    taskDescription: taskDetails?.description || memory?.taskDescription || null,
    taskProposedText: taskDetails?.proposedText || memory?.taskProposedText || null,
    taskAccepted: acceptedTask ? true : Boolean(memory?.taskAccepted),
    taskStatus: acceptedTask ? "accepted" : taskKind,
    hadValidation: Boolean(memory?.hadValidation || history.some((turn) => turn.analysis?.categories?.validation)),
    hadJudgment: Boolean(memory?.hadJudgment || history.some((turn) => turn.analysis?.categories?.judgment)),
    hadRushedAdvice: Boolean(memory?.hadRushedAdvice || history.some((turn) => turn.analysis?.categories?.rushedAdvice)),
    hadFraming: Boolean(memory?.hadFraming || history.some((turn) => turn.analysis?.categories?.framing)),
    hadClosure: Boolean(memory?.hadClosure || history.some((turn) => turn.analysis?.categories?.closure)),
    hadFollowUp: Boolean(memory?.hadFollowUp || history.some((turn) => turn.responseCategory === "seguimiento_contextual" || turn.responseCategory === "seguimiento_contextual_explicito" || turn.responseCategory === "seguimiento_contextual_breve" || turn.responseCategory === "seguimiento_emocional_contextual"))
  };
}

export function updatePatientMemory({ memory, intent, intentResult, responseId, responseText, studentMessage }) {
  let trustLevel = memory.trustLevel;
  if (intent === "validacion_emocional") trustLevel += 12;
  if (intent === "estado_actual") trustLevel += 2;
  if (intent === "convivencia_familia") trustLevel += 2;
  if (intent === "colegio_estudios") trustLevel += 2;
  if (intent === "amistades_red_social") trustLevel += 2;
  if (intent === "saludo_simple") trustLevel += 3;
  if (intent === "saludo") trustLevel += 3;
  if (intent === "identidad_nombre") trustLevel += 1;
  if (intent === "cortesia_vinculo") trustLevel += 6;
  if (intent === "presentacion_estudiante") trustLevel += 4;
  if (intent === "encuadre" || intent === "encuadre_o_consentimiento" || intent === "encuadre_mas_pregunta" || intent === "encuadre_mas_pregunta_abierta") trustLevel += 6;
  if (intent === "presentacion_personal_abierta" || intent === "motivo_de_consulta") trustLevel += 2;
  if (intent === "preocupacion_principal" || intent === "preferencias_valoracion" || intent === "ayuda") trustLevel += 3;
  if (intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta") trustLevel += 2;
  if (intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito" || intent === "seguimiento_contextual_breve" || intent === "seguimiento_emocional_contextual") trustLevel += 4;
  if (intent === "exploracion_emocional" || intent === "exploracion_contextual" || intent === "contexto_familiar_social") trustLevel += 5;
  if (intent === "juicio_o_critica") trustLevel -= 16;
  if (intent === "consejo_apresurado") trustLevel -= 10;
  if (intent === "tarea_concreta" || intent === "seguimiento_tarea") trustLevel += 3;
  if (intent === "tarea_amplia") trustLevel -= 3;
  if (intent === "tarea_prematura") trustLevel -= 5;
  if (intent === "cierre") trustLevel += 2;

  const nextTrust = clamp(trustLevel);
  const lastTopic = intentResult?.contextualTopic || topicFromIntent(intent) || memory.lastTopic;
  const exploredTopics = Array.from(new Set([...(memory.exploredTopics || []), intent, lastTopic].filter(Boolean)));
  const revealedTopics = Array.from(new Set([
    ...(memory.revealedTopics || []),
    ...(intentResult?.revealedTopics || [])
  ]));
  const taskDetails = intentResult?.clinicalTaskDetails || null;
  const taskWasAccepted = intent === "tarea_concreta" || intent === "confirmacion_tarea";
  const evasiveCount = isEvasivePatientResponse(responseText) ? (memory.evasiveCount || 0) + 1 : 0;
  const recentTurns = [
    ...(memory.recentTurns || []),
    {
      studentMessage,
      patientMessage: responseText,
      intent,
      topic: lastTopic,
      responseId,
      validation: intent === "validacion_emocional",
      closure: intent === "cierre"
    }
  ].slice(-5);
  const usedResponseTexts = Array.from(new Set([...(memory.usedResponseTexts || []), responseText].filter(Boolean)));

  return {
    ...memory,
    turnCount: memory.turnCount + 1,
    trustLevel: nextTrust,
    opennessLevel: getOpennessLevel(nextTrust),
    usedResponseIds: responseId ? [...memory.usedResponseIds, responseId] : memory.usedResponseIds,
    usedResponseTexts,
    usedIdeaSignatures: Array.from(new Set(usedResponseTexts.map(buildIdeaSignature).filter(Boolean))),
    recentTurns,
    recentPatientMessages: recentTurns.map((turn) => turn.patientMessage).filter(Boolean),
    recentStudentMessages: recentTurns.map((turn) => turn.studentMessage).filter(Boolean),
    recentValidationCount: recentTurns.filter((turn) => turn.validation).length,
    evasiveCount,
    lastPatientMessage: responseText,
    lastStudentMessage: studentMessage,
    lastIntent: intent,
    lastStudentIntent: intent,
    lastTopic,
    currentTopic: lastTopic,
    lastSubstantiveTopic: isSubstantiveTopic(lastTopic) ? lastTopic : memory.lastSubstantiveTopic,
    exploredTopics,
    revealedTopics,
    emotionalOpenness: getOpennessLevel(nextTrust),
    taskAssigned: taskWasAccepted ? true : Boolean(memory.taskAssigned),
    taskType: taskDetails?.type || memory.taskType || null,
    taskDescription: taskDetails?.description || memory.taskDescription || null,
    taskProposedText: taskDetails?.proposedText || memory.taskProposedText || null,
    taskAccepted: taskWasAccepted ? true : Boolean(memory.taskAccepted),
    taskStatus: taskWasAccepted ? "accepted" : intentResult?.clinicalTaskKind || memory.taskStatus || null,
    nextSessionAgreement: intent === "agenda_continuidad" ? studentMessage : memory.nextSessionAgreement || null,
    hadValidation: memory.hadValidation || intent === "validacion_emocional",
    hadJudgment: memory.hadJudgment || intent === "juicio_o_critica",
    hadRushedAdvice: memory.hadRushedAdvice || intent === "consejo_apresurado",
    hadFraming: memory.hadFraming || intent === "saludo" || intent === "saludo_simple" || intent === "rol_entrevistador" || intent === "presentacion_estudiante" || intent === "encuadre" || intent === "encuadre_o_consentimiento" || intent === "encuadre_mas_pregunta" || intent === "encuadre_mas_pregunta_abierta",
    hadClosure: memory.hadClosure || intent === "cierre",
    hadFollowUp: memory.hadFollowUp || intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito" || intent === "seguimiento_contextual_breve" || intent === "seguimiento_emocional_contextual"
  };
}

export function isEvasivePatientResponse(responseText = "") {
  const normalized = normalizeForEvasion(responseText);
  if (!normalized) return false;

  const evasivePatterns = [
    "no se si lo puedo explicar bien",
    "quizas no es tan grave",
    "me cuesta hablar de eso",
    "no quiero que suene como excusa",
    "no se bien como responder eso",
    "me cuesta ordenarlo todavia",
    "no se por donde partir",
    "no se que decir",
    "capaz estoy exagerando",
    "siento que deberia poder resolverlo sola"
  ];

  return evasivePatterns.some((pattern) => normalized.includes(pattern));
}

function toMemoryTurn(turn) {
  const intent = turn.responseCategory || turn.analysis?.intent || turn.analysis?.detectedIntent || null;
  const topic = turn.analysis?.contextualTopic || turn.analysis?.profileTopic || intent;
  return {
    studentMessage: turn.question || "",
    patientMessage: turn.answer || "",
    intent,
    topic,
    responseId: turn.responseId || null,
    validation: Boolean(turn.analysis?.categories?.validation || intent === "validacion_emocional"),
    closure: Boolean(turn.analysis?.categories?.closure || intent === "cierre")
  };
}

function findLastSubstantiveTopic(recentTurns) {
  return [...recentTurns]
    .reverse()
    .map((turn) => turn.topic || turn.intent)
    .find(isSubstantiveTopic) || null;
}

function isSubstantiveTopic(topic) {
  if (!topic) return false;
  return ![
    "saludo",
    "saludo_simple",
    "presentacion_estudiante",
    "encuadre",
    "encuadre_o_consentimiento",
    "validacion",
    "validacion_emocional",
    "cierre",
    "desconocida",
    "ambiguo_real"
  ].includes(topic);
}

export function getOpennessLevel(trustLevel) {
  if (trustLevel <= 35) return "apertura_baja";
  if (trustLevel <= 70) return "apertura_media";
  return "apertura_alta";
}

export function getTrustStage(trustLevel) {
  if (trustLevel <= 25) return "closed";
  if (trustLevel <= 50) return "cautious";
  if (trustLevel <= 75) return "open";
  return "reflective";
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countRecentEvasiveResponses(history) {
  let count = 0;
  for (const turn of [...history].reverse()) {
    if (!isEvasivePatientResponse(turn.answer || "")) break;
    count += 1;
  }
  return count;
}

function normalizeForEvasion(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function topicFromIntent(intent) {
  if (intent === "pregunta_familiar") return "familia";
  if (intent === "identidad_nombre") return "identidad";
  if (intent === "familia") return "familia";
  if (intent === "hermanos") return "hermanos";
  if (intent === "convivencia") return "convivencia";
  if (intent === "pregunta_social") return "social";
  if (intent === "amistades") return "social";
  if (intent === "amistades_red_social") return "social";
  if (intent === "pregunta_escolar") return "colegio";
  if (intent === "pregunta_academica") return "universidad";
  if (intent === "pregunta_laboral") return "trabajo";
  if (intent === "estudios_trabajo") return "ocupacion";
  if (intent === "colegio_estudios") return "colegio";
  if (intent === "pregunta_videojuegos") return "digital";
  if (intent === "videojuegos") return "digital";
  if (intent === "pregunta_habitos") return "habitos";
  if (intent === "rutina_diaria") return "rutina";
  if (intent === "motivo_de_consulta") return "motivo_de_consulta";
  if (intent === "estado_actual") return "estado_actual";
  if (intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta") return "llegada_consulta";
  if (intent === "ocupacion_actividad") return "ocupacion";
  if (intent === "vivienda_residencia") return "vivienda";
  if (intent === "convivencia_familia") return "vivienda";
  if (intent === "preocupacion_principal") return "preocupacion";
  if (intent === "riesgo") return "riesgo";
  if (intent === "ambiguo_real") return "ambiguo_real";
  if (intent === "seguimiento_contextual_explicito") return "seguimiento";
  if (intent === "seguimiento_contextual_breve") return "seguimiento";
  if (intent === "seguimiento_emocional_contextual") return "seguimiento_emocional";
  if (intent === "validacion_emocional") return "validacion";
  if (intent === "tarea_concreta" || intent === "tarea_amplia" || intent === "tarea_prematura") return "tarea";
  if (intent === "seguimiento_tarea") return "seguimiento_tarea";
  if (intent === "contexto_familiar_social") return "contexto";
  if (intent === "cierre") return "cierre";
  if (intent === "exploracion_emocional") return "emocion";
  if (intent === "preferencias_valoracion") return "preferencias";
  if (intent === "presentacion_estudiante") return "presentacion";
  if (intent === "saludo_simple") return "saludo";
  if (intent === "encuadre") return "encuadre";
  if (intent === "encuadre_o_consentimiento") return "encuadre";
  if (intent === "encuadre_mas_pregunta") return "encuadre_y_pregunta";
  if (intent === "encuadre_mas_pregunta_abierta") return "encuadre_y_pregunta";
  return null;
}
