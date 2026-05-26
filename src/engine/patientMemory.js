import { patientVoices } from "../data/patientVoices.js";

const difficultyShift = {
  introductorio: 8,
  intermedio: 0,
  avanzado: -10
};

export function buildPatientMemory({ caseId, history = [], difficulty = "intermedio", memory }) {
  const voice = patientVoices[caseId] || patientVoices.tomas;
  const trustLevel = history.at(-1)?.patientState?.trustLevel ?? clamp((voice.initialTrust ?? 35) + (difficultyShift[difficulty] ?? 0));
  const exploredTopics = new Set();
  for (const turn of history) {
    const category = turn.responseCategory || turn.analysis?.detectedIntent;
    if (category) exploredTopics.add(category);
  }

  return {
    caseId,
    turnCount: history.length,
    trustLevel,
    opennessLevel: getOpennessLevel(trustLevel),
    voice,
    usedResponseIds: history.map((turn) => turn.responseId).filter(Boolean),
    lastPatientMessage: history.at(-1)?.answer || "",
    lastStudentMessage: history.at(-1)?.question || "",
    lastIntent: history.at(-1)?.responseCategory || null,
    lastTopic: history.at(-1)?.analysis?.contextualTopic || history.at(-1)?.responseCategory || null,
    exploredTopics: Array.from(exploredTopics),
    hadValidation: history.some((turn) => turn.analysis?.categories?.validation),
    hadJudgment: history.some((turn) => turn.analysis?.categories?.judgment),
    hadRushedAdvice: history.some((turn) => turn.analysis?.categories?.rushedAdvice),
    hadFraming: history.some((turn) => turn.analysis?.categories?.framing),
    hadClosure: history.some((turn) => turn.analysis?.categories?.closure),
    hadFollowUp: history.some((turn) => turn.responseCategory === "seguimiento_contextual"),
    ...(memory || {})
  };
}

export function updatePatientMemory({ memory, intent, intentResult, responseId, responseText, studentMessage }) {
  let trustLevel = memory.trustLevel;
  if (intent === "validacion_emocional" || intent === "cortesia_vinculo") trustLevel += 6;
  if (intent === "presentacion_personal_abierta" || intent === "motivo_de_consulta") trustLevel += 2;
  if (intent === "seguimiento_contextual") trustLevel += 4;
  if (intent === "exploracion_emocional" || intent === "exploracion_contextual") trustLevel += 5;
  if (intent === "juicio_o_critica") trustLevel -= 16;
  if (intent === "consejo_apresurado") trustLevel -= 10;
  if (intent === "cierre") trustLevel += 2;

  const nextTrust = clamp(trustLevel);
  const lastTopic = intentResult?.contextualTopic || topicFromIntent(intent) || memory.lastTopic;
  const exploredTopics = Array.from(new Set([...(memory.exploredTopics || []), intent, lastTopic].filter(Boolean)));

  return {
    ...memory,
    turnCount: memory.turnCount + 1,
    trustLevel: nextTrust,
    opennessLevel: getOpennessLevel(nextTrust),
    usedResponseIds: responseId ? [...memory.usedResponseIds, responseId] : memory.usedResponseIds,
    lastPatientMessage: responseText,
    lastStudentMessage: studentMessage,
    lastIntent: intent,
    lastTopic,
    exploredTopics,
    hadValidation: memory.hadValidation || intent === "validacion_emocional",
    hadJudgment: memory.hadJudgment || intent === "juicio_o_critica",
    hadRushedAdvice: memory.hadRushedAdvice || intent === "consejo_apresurado",
    hadFraming: memory.hadFraming || intent === "rol_entrevistador",
    hadClosure: memory.hadClosure || intent === "cierre",
    hadFollowUp: memory.hadFollowUp || intent === "seguimiento_contextual"
  };
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

function topicFromIntent(intent) {
  if (intent === "pregunta_familiar") return "familia";
  if (intent === "pregunta_social") return "social";
  if (intent === "pregunta_escolar") return "colegio";
  if (intent === "pregunta_academica") return "universidad";
  if (intent === "pregunta_laboral") return "trabajo";
  if (intent === "pregunta_videojuegos") return "digital";
  if (intent === "pregunta_habitos") return "habitos";
  if (intent === "ocupacion_actividad") return "ocupacion";
  if (intent === "exploracion_emocional") return "emocion";
  if (intent === "preferencias_valoracion") return "preferencias";
  return null;
}
