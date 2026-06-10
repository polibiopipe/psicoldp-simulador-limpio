import { caseProfiles } from "../data/caseProfiles.js";
import { normalizeText } from "../utils/textUtils.js";

const intentTopicMap = {
  saludo_simple: "saludo",
  saludo: "saludo",
  presentacion_personal_abierta: "presentacion_personal_abierta",
  motivo_de_consulta: "motivo_consulta",
  vivienda_residencia: "convivencia",
  ocupacion_actividad: "estudios_trabajo",
  pregunta_escolar: "estudios_trabajo",
  pregunta_academica: "estudios_trabajo",
  pregunta_laboral: "estudios_trabajo",
  pregunta_familiar: "familia",
  pregunta_social: "amistades",
  pregunta_videojuegos: "videojuegos",
  pregunta_habitos: "rutina_diaria",
  exploracion_emocional: "emociones",
  preocupacion_principal: "preocupacion",
  preferencias_valoracion: "ayuda",
  validacion_emocional: "validacion",
  seguimiento_emocional_contextual: "seguimiento_emocional_contextual",
  cierre: "cierre"
};

export function selectCaseProfileResponse({
  caseId,
  studentMessage,
  intentResult,
  memory
}) {
  const profile = caseProfiles[caseId];
  if (!profile) return null;
  const normalizedMessage = normalizeText(studentMessage);
  const explicitFollowUp = intentResult.intent === "seguimiento_emocional_contextual"
    || intentResult.intent === "seguimiento_contextual_explicito"
    || intentResult.intent === "seguimiento_contextual"
    || isExplicitFollowUp(normalizedMessage);

  const detectedTopic = detectProfileTopic({
    message: studentMessage,
    intent: intentResult.intent,
    intentResult,
    memory,
    profile
  });

  if (!detectedTopic) return null;

  const candidates = getCandidatesForTopic({
    profile,
    topic: detectedTopic,
    memory,
    intentResult
  });

  if (!candidates.length) return null;

  const selected = pickProfileResponse({
    caseId,
    topic: detectedTopic,
    candidates,
    memory
  });
  const shouldResolveAsFollowUp = explicitFollowUp
    && ["seguimiento_contextual", "seguimiento_no_es_tan_simple"].includes(detectedTopic);

  return {
    response: selected.text,
    responseId: selected.id,
    responseType: `case_profile:${detectedTopic}`,
    fallbackUsed: false,
    profileTopic: detectedTopic,
    resolvedIntent: shouldResolveAsFollowUp ? "seguimiento_contextual" : toResolvedIntent(detectedTopic, intentResult.intent)
  };
}

export function detectProfileTopic({ message, intent, intentResult, memory, profile }) {
  const text = normalizeText(message);
  const lastPatientMessage = normalizeText(memory?.lastPatientMessage || "");

  if (!text) return null;

  if (isRiskQuestion(text)) return "riesgo";
  if (isTrulyAmbiguous(text) && !intentResult.explicitReferenceDetected) return "ambiguo_real";
  if (isCurrentStateQuestion(text)) return "estado_actual";
  if (isMotiveQuestion(text)) return "motivo_consulta";
  if (isHelpExpectationQuestion(text)) return "ayuda";
  if (intent === "seguimiento_emocional_contextual") return "seguimiento_emocional_contextual";
  if (intent === "seguimiento_contextual_explicito" || intent === "seguimiento_contextual" || isExplicitFollowUp(text)) {
    return detectFollowUpTopic({ text, lastPatientMessage, profile, preferExplicitFollowUp: true });
  }
  if (isSiblingQuestion(text)) return "hermanos";
  if (isResidenceQuestion(text)) return "convivencia";
  if (isDailyRoutineQuestion(text)) return "rutina_diaria";
  if (isConcernQuestion(text)) return "preocupacion";
  if (isEmotionQuestion(text)) return "emociones";
  if (isFamilyQuestion(text)) return "familia";
  if (isFriendQuestion(text)) return "amistades";
  if (isDigitalOrVideogameQuestion(text, profile)) return "videojuegos";
  if (isStudyOrWorkQuestion(text)) return "estudios_trabajo";

  return intentTopicMap[intent] || null;
}

function getCandidatesForTopic({ profile, topic, memory, intentResult }) {
  if (topic === "ambiguo_real") {
    return buildAmbiguousCandidates(profile, memory);
  }

  const specificTopic = topic === "seguimiento_contextual"
    ? detectFollowUpTopic({
        text: intentResult.normalizedText || "",
        lastPatientMessage: normalizeText(memory?.lastPatientMessage || ""),
        profile
      })
    : topic;

  const direct = profile.topics?.[specificTopic] || [];
  if (direct.length) return direct;

  if (specificTopic !== "seguimiento_contextual" && profile.topics?.seguimiento_contextual?.length) {
    return profile.topics.seguimiento_contextual;
  }

  return buildConstructedCandidates(profile, specificTopic, memory);
}

function buildConstructedCandidates(profile, topic, memory) {
  const baseByTopic = {
    motivo_consulta: profile.reasonForConsultation,
    familia: profile.familyContext,
    convivencia: profile.familyContext,
    estudios_trabajo: profile.academicOrWorkContext,
    amistades: profile.socialContext,
    emociones: profile.emotionalCore,
    rutina_diaria: profile.dailyRoutine,
    preocupacion: profile.emotionalCore,
    ayuda: profile.whatThePatientKnows,
    validacion: profile.emotionalCore,
    seguimiento_contextual: profile.emotionalCore
  };

  const primary = baseByTopic[topic] || profile.reasonForConsultation;
  const follow = memory?.lastPatientMessage
    ? `Creo que eso se conecta con lo que venía diciendo. ${profile.emotionalCore}`
    : "";

  return [primary, follow].filter(Boolean);
}

function buildAmbiguousCandidates(profile, memory) {
  if (memory?.lastPatientMessage) {
    return [
      "No estoy seguro de haber entendido bien. ¿Te refieres a lo que veníamos hablando?",
      `Me perdí un poco con eso. Si te refieres a lo que me pasa, diría que ${lowerFirst(profile.emotionalCore)}`
    ];
  }
  return ["No estoy seguro de haber entendido bien. ¿Me lo podrías preguntar de otra forma?"];
}

function pickProfileResponse({ caseId, topic, candidates, memory }) {
  const normalizedLast = normalizeForCompare(memory?.lastPatientMessage || "");
  const enriched = candidates.map((text, index) => ({
    text,
    id: makeProfileResponseId(caseId, topic, text, index)
  }));

  const opennessOffset = memory?.opennessLevel === "apertura_alta"
    ? 2
    : memory?.opennessLevel === "apertura_media"
      ? 1
      : 0;

  const ordered = [...enriched.slice(opennessOffset), ...enriched.slice(0, opennessOffset)];
  const unused = ordered.find((candidate) => {
    const sameAsLast = normalizeForCompare(candidate.text) === normalizedLast;
    return !sameAsLast && !memory?.usedResponseIds?.includes(candidate.id);
  });

  if (unused) return unused;

  const notSame = ordered.find((candidate) => normalizeForCompare(candidate.text) !== normalizedLast);
  if (notSame) {
    return {
      text: addNaturalVariation(notSame.text),
      id: makeProfileResponseId(caseId, `${topic}_variation`, notSame.text, memory?.turnCount || 0)
    };
  }

  return {
    text: addNaturalVariation(enriched[0].text),
    id: makeProfileResponseId(caseId, `${topic}_variation`, enriched[0].text, memory?.turnCount || 0)
  };
}

function detectFollowUpTopic({ text, lastPatientMessage, profile }) {
  const combined = `${text} ${lastPatientMessage}`;
  const topics = profile.topics || {};

  if (profile.id === "tomas" && /no es tan simple|no tan simple|simple/.test(combined) && topics.seguimiento_no_es_tan_simple) {
    return "seguimiento_no_es_tan_simple";
  }

  if (isExplicitFollowUp(text)) {
    return "seguimiento_contextual";
  }

  const topicTerms = [
    ["videojuegos", ["computador", "juego", "jugar", "videojuego", "online", "redes", "celular"]],
    ["familia", ["familia", "mama", "papa", "papas", "padres", "hijos", "hija", "pareja", "casa"]],
    ["hermanos", ["hermano", "hermana", "hermanos"]],
    ["estudios_trabajo", ["colegio", "universidad", "estudio", "trabajo", "pega", "clases", "licencia", "jubil"]],
    ["amistades", ["amigos", "amigas", "companeros", "compañeros", "gente"]],
    ["emociones", ["sientes", "culpa", "miedo", "rabia", "pena", "cansado", "cansada", "agotado", "agotada"]],
    ["rutina_diaria", ["rutina", "dia", "día", "duerm", "descanso", "descansar"]],
    ["preocupacion", ["preocupa", "inquieta", "miedo", "temor"]],
    ["ayuda", ["ayuda", "ayudara", "ayudarte", "necesitas"]]
  ];

  for (const [topic, terms] of topicTerms) {
    if (topics[topic] && terms.some((term) => combined.includes(normalizeText(term)))) return topic;
  }

  return "seguimiento_contextual";
}

function toResolvedIntent(topic, originalIntent) {
  const map = {
    estado_actual: "estado_actual",
    motivo_consulta: "motivo_de_consulta",
    familia: "familia",
    hermanos: "hermanos",
    convivencia: "convivencia",
    videojuegos: "videojuegos",
    estudios_trabajo: "estudios_trabajo",
    amistades: "amistades",
    emociones: "emociones",
    rutina_diaria: "rutina_diaria",
    preocupacion: "preocupacion_principal",
    ayuda: "preferencias_valoracion",
    validacion: "validacion_emocional",
    seguimiento_emocional_contextual: "seguimiento_emocional_contextual",
    seguimiento_contextual: "seguimiento_contextual",
    seguimiento_no_es_tan_simple: "seguimiento_contextual",
    cierre: "cierre",
    riesgo: "riesgo",
    ambiguo_real: "ambiguo_real"
  };
  return map[topic] || originalIntent;
}

function isCurrentStateQuestion(text) {
  return /\b(como estas|como te encuentras|como has estado|como te sientes hoy|como llegas hoy)\b/.test(text);
}

function isMotiveQuestion(text) {
  return /\b(que te trajo|que te trae|por que viniste|por que estas aqui|por que estas aca|motivo de consulta|que paso para que llegaras|que te esta pasando|que sucede)\b/.test(text);
}

function isFamilyQuestion(text) {
  return /\b(cuentame de tu familia|como es tu familia|tu familia|con tu familia|familia)\b/.test(text);
}

function isSiblingQuestion(text) {
  return /\b(tienes hermanos|tienes hermanas|hermanos|hermanas|hermano|hermana)\b/.test(text);
}

function isResidenceQuestion(text) {
  return /\b(donde vives|con quien vives|vives con|vives solo|vives sola|con quien compartes casa)\b/.test(text);
}

function isDigitalOrVideogameQuestion(text, profile) {
  const hasDigitalCue = /\b(videojuegos|juegas|computador|redes|celular|instagram|tiktok|online|pantalla)\b/.test(text);
  return hasDigitalCue && Boolean(profile.topics?.videojuegos);
}

function isStudyOrWorkQuestion(text) {
  return /\b(colegio|universidad|estudias|que estudias|trabajas|trabajo|pega|a que te dedicas|que haces actualmente|ocupacion)\b/.test(text);
}

function isDailyRoutineQuestion(text) {
  return /\b(que haces durante el dia|como es tu dia|como es un dia|rutina|dia a dia|que haces en el dia|como duermes|duermes|descansas)\b/.test(text);
}

function isFriendQuestion(text) {
  return /\b(tienes amigos|tienes amigas|amistades|amigos|amigas|companeros|compañeros|te juntas|sales con alguien)\b/.test(text);
}

function isEmotionQuestion(text) {
  return /\b(que sientes|como te sientes|que emocion|que te pasa con eso|te da miedo|te da culpa|te da rabia|te da pena|que te cuesta)\b/.test(text);
}

function isConcernQuestion(text) {
  return /\b(que te preocupa|cual es tu preocupacion|que te inquieta|que te da miedo|que es lo que mas te pesa)\b/.test(text);
}

function isHelpExpectationQuestion(text) {
  return /\b(como te gustaria que te ayudara|como podria ayudarte|que te ayudaria|que esperas|que necesitas de esta conversacion|que te gustaria lograr)\b/.test(text);
}

function isRiskQuestion(text) {
  return /\b(hacerte dano|hacerte daño|danarte|dañarte|morirte|morir|suicid|no querer vivir|hacer dano a alguien|hacer daño a alguien)\b/.test(text);
}

function isExplicitFollowUp(text) {
  return /\b(me dijiste que|dijiste que|mencionaste que|cuando dices|cuando dijiste|a que te refieres|que quieres decir|cuentame mas|que significa|en que sentido|que no es tan simple)\b/.test(text);
}

function isTrulyAmbiguous(text) {
  return /^(y|y eso|eso|como|por que|que cosa|explicate|no entiendo|como asi|mmm)$/.test(text);
}

function addNaturalVariation(text) {
  if (!text) return "No estoy seguro de haber entendido bien.";
  if (/^creo que/i.test(text)) return text.replace(/^creo que/i, "Quizás lo diría así: creo que");
  if (/^no sé/i.test(text)) return text.replace(/^no sé/i, "No sé bien");
  return `Lo diría de otra forma: ${lowerFirst(text)}`;
}

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function makeProfileResponseId(caseId, topic, text, index) {
  return `${caseId}_profile_${topic}_${index}_${text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 150);
}

function normalizeForCompare(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
