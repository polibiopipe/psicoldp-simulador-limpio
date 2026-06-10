import { patientVoices } from "../data/patientVoices.js";

const difficultyShift = {
  introductorio: 8,
  intermedio: 0,
  avanzado: -10
};

export function buildPatientMemory({ caseId, history = [], difficulty = "intermedio", memory }) {
  const voice = patientVoices[caseId] || patientVoices.tomas;
  const trustLevel = history.at(-1)?.patientState?.trustLevel ?? clamp((voice.initialTrust ?? 35) + (difficultyShift[difficulty] ?? 0));
  const evasiveCount = countRecentEvasiveResponses(history);
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
    evasiveCount,
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
    hadFollowUp: history.some((turn) => turn.responseCategory === "seguimiento_contextual" || turn.responseCategory === "seguimiento_contextual_explicito" || turn.responseCategory === "seguimiento_contextual_breve" || turn.responseCategory === "seguimiento_emocional_contextual"),
    ...(memory || {})
  };
}

export function updatePatientMemory({ memory, intent, intentResult, responseId, responseText, studentMessage }) {
  let trustLevel = memory.trustLevel;
  if (intent === "validacion_emocional") trustLevel += 12;
  if (intent === "estado_actual") trustLevel += 2;
  if (intent === "convivencia_familia") trustLevel += 2;
  if (intent === "colegio_estudios") trustLevel += 2;
  if (intent === "saludo_simple") trustLevel += 3;
  if (intent === "saludo") trustLevel += 3;
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
  if (intent === "cierre") trustLevel += 2;

  const nextTrust = clamp(trustLevel);
  const lastTopic = intentResult?.contextualTopic || topicFromIntent(intent) || memory.lastTopic;
  const exploredTopics = Array.from(new Set([...(memory.exploredTopics || []), intent, lastTopic].filter(Boolean)));
  const evasiveCount = isEvasivePatientResponse(responseText) ? (memory.evasiveCount || 0) + 1 : 0;

  return {
    ...memory,
    turnCount: memory.turnCount + 1,
    trustLevel: nextTrust,
    opennessLevel: getOpennessLevel(nextTrust),
    usedResponseIds: responseId ? [...memory.usedResponseIds, responseId] : memory.usedResponseIds,
    evasiveCount,
    lastPatientMessage: responseText,
    lastStudentMessage: studentMessage,
    lastIntent: intent,
    lastTopic,
    exploredTopics,
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
  if (intent === "familia") return "familia";
  if (intent === "hermanos") return "hermanos";
  if (intent === "convivencia") return "convivencia";
  if (intent === "pregunta_social") return "social";
  if (intent === "amistades") return "social";
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
