import { caseProfiles } from "../data/caseProfiles.js";
import { normalizeText } from "../utils/textUtils.js";
import { isSemanticallyRepeated, selectLeastSimilarCandidate } from "./conversationQuality.js";

const intentTopicMap = {
  saludo_simple: "saludo",
  saludo: "saludo",
  presentacion_personal_abierta: "presentacion_personal_abierta",
  motivo_de_consulta: "motivo_consulta",
  derivacion_llegada: "derivacion",
  derivacion_llegada_consulta: "derivacion",
  convivencia_familia: "convivencia_familia",
  vivienda_residencia: "convivencia",
  colegio_estudios: "colegio_estudios",
  ocupacion_actividad: "estudios_trabajo",
  pregunta_escolar: "estudios_trabajo",
  pregunta_academica: "estudios_trabajo",
  pregunta_laboral: "estudios_trabajo",
  pregunta_familiar: "familia",
  amistades_red_social: "amistades_red_social",
  pregunta_social: "amistades",
  pregunta_videojuegos: "videojuegos",
  pregunta_habitos: "rutina_diaria",
  exploracion_emocional: "emociones",
  preocupacion_principal: "preocupacion",
  preferencias_valoracion: "ayuda",
  validacion_emocional: "validacion",
  seguimiento_contextual_breve: "seguimiento_contextual_breve",
  seguimiento_emocional_contextual: "seguimiento_emocional_contextual",
  cierre: "cierre"
};

const topicAliases = {
  motivo_de_consulta: "motivo_consulta",
  preocupacion_principal: "preocupacion",
  exploracion_emocional: "emociones",
  pregunta_familiar: "familia",
  pregunta_social: "amistades",
  pregunta_videojuegos: "videojuegos",
  convivencia_familia: "convivencia",
  colegio_estudios: "estudios_trabajo",
  seguimiento_contextual_breve: "seguimiento_contextual",
  seguimiento_colegio_habla_poco: "seguimiento_contextual",
  seguimiento_discusiones_computador: "familia",
  seguimiento_sentirse_juzgado: "emociones",
  seguimiento_dificultad_social: "amistades",
  derivacion_motivo_informal: "derivacion",
  derivacion_como_llego: "derivacion",
  derivacion_quien_mando: "derivacion",
  amistades_red_social: "amistades",
  amistades_red_social_negacion: "amistades",
  seguimiento_emocional_contextual: "seguimiento_contextual"
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

  if (intent === "cierre" || isClosureMessage(text)) return "cierre";
  if (intent === "validacion_emocional") return "validacion";
  if (isRiskQuestion(text)) return "riesgo";
  if (isTrulyAmbiguous(text) && !intentResult.explicitReferenceDetected) return "ambiguo_real";
  if (isCurrentStateQuestion(text)) return "estado_actual";
  if (profile.id === "tomas" && isInformalWhyHereQuestion(text)) return "derivacion_motivo_informal";
  if (profile.id === "tomas" && isHowArrivedQuestion(text)) return "derivacion_como_llego";
  if (profile.id === "tomas" && isWhoSentQuestion(text)) return "derivacion_quien_mando";
  if (intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta" || isDerivationQuestion(text)) return "derivacion";
  if (isMotiveQuestion(text)) return "motivo_consulta";
  if (isHelpExpectationQuestion(text)) return "ayuda";
  if (intent === "convivencia_familia") return "convivencia_familia";
  if (intent === "colegio_estudios") return "colegio_estudios";
  if (isNegativeFriendQuestion(text)) return "amistades_red_social_negacion";
  if (intent === "amistades_red_social") return "amistades_red_social";
  if (intent === "seguimiento_contextual_breve") return detectFollowUpTopic({ text, lastPatientMessage, profile, preferBriefFollowUp: true });
  if (intent === "seguimiento_emocional_contextual") return detectEmotionalFollowUpTopic({ text, lastPatientMessage, profile });
  if (intent === "seguimiento_contextual_explicito" || intent === "seguimiento_contextual" || isExplicitFollowUp(text)) {
    return detectFollowUpTopic({ text, lastPatientMessage, profile, preferExplicitFollowUp: true });
  }
  if (profile.id === "tomas" && /(afuera|relacion|gente|hablar con nadie|hablar con otros|persona|presencial)/.test(`${text} ${lastPatientMessage}`) && profile.topics?.seguimiento_dificultad_social) {
    return "seguimiento_dificultad_social";
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

  if (topic === "validacion") {
    return buildValidationElaborationCandidates(profile);
  }

  const specificTopic = topic === "seguimiento_contextual"
    ? detectFollowUpTopic({
        text: intentResult.normalizedText || "",
        lastPatientMessage: normalizeText(memory?.lastPatientMessage || ""),
        profile
      })
    : topic;

  const aliasTopic = topicAliases[specificTopic];
  const direct = profile.topics?.[specificTopic] || profile.topics?.[aliasTopic] || [];
  if (direct.length) return direct;

  if (specificTopic !== "seguimiento_contextual" && profile.topics?.seguimiento_contextual?.length) {
    return profile.topics.seguimiento_contextual;
  }

  return buildConstructedCandidates(profile, specificTopic, memory);
}

function buildValidationElaborationCandidates(profile) {
  const acknowledgements = profile.topics?.validacion || [];
  const elaborations = profile.topics?.validacion_elaboracion
    || profile.topics?.seguimiento_contextual
    || profile.topics?.emociones
    || [];

  if (!elaborations.length) return acknowledgements;

  const candidates = elaborations.map((elaboration, index) => {
    const acknowledgement = acknowledgements[index % Math.max(acknowledgements.length, 1)]
      || "Gracias. Me ayuda que lo digas así.";
    return combineNaturally(acknowledgement, elaboration);
  });

  return candidates;
}

function buildConstructedCandidates(profile, topic, memory) {
  const baseByTopic = {
    motivo_consulta: profile.reasonForConsultation,
    derivacion: profile.basicFacts?.referredBy || profile.reasonForConsultation,
    familia: profile.familyContext,
    convivencia_familia: profile.familyContext,
    convivencia: profile.familyContext,
    colegio_estudios: profile.academicOrWorkContext,
    estudios_trabajo: profile.academicOrWorkContext,
    amistades: profile.socialContext,
    emociones: profile.emotionalCore,
    rutina_diaria: profile.dailyRoutine,
    preocupacion: profile.emotionalCore,
    ayuda: profile.whatThePatientKnows,
    validacion: profile.emotionalCore,
    seguimiento_contextual_breve: profile.emotionalCore,
    seguimiento_emocional_contextual: profile.emotionalCore,
    seguimiento_contextual: profile.emotionalCore
  };

  const primary = baseByTopic[topic] || profile.reasonForConsultation;
  const follow = memory?.lastPatientMessage
    ? `Creo que eso se conecta con lo que venía diciendo. ${profile.emotionalCore}`
    : "";

  return [primary, follow].filter(Boolean);
}

function buildAmbiguousCandidates(_profile, memory) {
  if (memory?.lastPatientMessage) {
    return ["No sé si entendí bien... ¿me preguntas por lo que dije recién?"];
  }
  return ["No sé si entendí bien... ¿podrías preguntármelo de otra forma?"];
}

function buildLegacyAmbiguousCandidates(profile, memory) {
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
  const previousResponses = memory?.usedResponseTexts || memory?.recentPatientMessages || [];
  const enriched = candidates.map((text, index) => ({
    text,
    id: makeProfileResponseId(caseId, topic, text, index)
  }));

  const directConcreteTopics = new Set([
    "convivencia_familia",
    "convivencia",
    "colegio_estudios",
    "hermanos",
    "motivo_consulta",
    "derivacion",
    "derivacion_motivo_informal",
    "derivacion_como_llego",
    "derivacion_quien_mando",
    "amistades_red_social",
    "amistades_red_social_negacion",
    "amistades",
    "seguimiento_no_es_tan_simple",
    "seguimiento_descanso_culpa",
    "seguimiento_llegada_casa",
    "seguimiento_limites",
    "seguimiento_culpa_descanso",
    "seguimiento_colegio_habla_poco",
    "seguimiento_discusiones_computador",
    "seguimiento_sentirse_juzgado",
    "seguimiento_dificultad_social",
    "seguimiento_emocional_contextual"
  ]);
  const opennessOffset = directConcreteTopics.has(topic)
    ? 0
    : memory?.opennessLevel === "apertura_alta"
      ? 2
      : memory?.opennessLevel === "apertura_media"
        ? 1
        : 0;

  const ordered = [...enriched.slice(opennessOffset), ...enriched.slice(0, opennessOffset)];
  const unused = ordered.find((candidate) => {
    const sameAsLast = normalizeForCompare(candidate.text) === normalizedLast;
    const repeatsIdea = shouldAllowRepeatedFact(topic)
      ? false
      : isSemanticallyRepeated(candidate.text, previousResponses);
    return !sameAsLast && !repeatsIdea && !memory?.usedResponseIds?.includes(candidate.id);
  });

  if (unused) return unused;

  const leastSimilar = selectLeastSimilarCandidate(
    ordered.filter((candidate) => normalizeForCompare(candidate.text) !== normalizedLast),
    previousResponses
  );
  if (leastSimilar) {
    return {
      text: leastSimilar.text,
      id: makeProfileResponseId(caseId, `${topic}_continuation`, leastSimilar.text, memory?.turnCount || 0)
    };
  }

  return {
    text: enriched[0].text,
    id: makeProfileResponseId(caseId, `${topic}_continuation`, enriched[0].text, memory?.turnCount || 0)
  };
}

function shouldAllowRepeatedFact(topic) {
  return [
    "identidad_nombre",
    "edad",
    "convivencia_familia",
    "convivencia",
    "hermanos",
    "colegio_estudios",
    "estudios_trabajo",
    "derivacion",
    "derivacion_motivo_informal",
    "derivacion_como_llego",
    "derivacion_quien_mando"
  ].includes(topic);
}

function detectFollowUpTopic({ text, lastPatientMessage, profile }) {
  const combined = `${text} ${lastPatientMessage}`;
  const topics = profile.topics || {};

  if (profile.id === "valentina" && /descans|parar|culpa/.test(text) && topics.seguimiento_descanso_culpa) {
    return "seguimiento_descanso_culpa";
  }

  if (profile.id === "marcos" && /llegas|llego|casa|paciencia/.test(text) && topics.seguimiento_llegada_casa) {
    return "seguimiento_llegada_casa";
  }

  if (profile.id === "camila" && /decir que no|limite|limites/.test(text) && topics.seguimiento_limites) {
    return "seguimiento_limites";
  }

  if (profile.id === "daniela" && /culpa|descans|cansad/.test(text) && topics.seguimiento_culpa_descanso) {
    return "seguimiento_culpa_descanso";
  }

  if (profile.id === "tomas" && /discusion|discusiones|a que discusiones/.test(combined) && topics.seguimiento_discusiones_computador) {
    return "seguimiento_discusiones_computador";
  }

  if (profile.id === "tomas" && /juzgado|juzgan|juzgar/.test(combined) && topics.seguimiento_sentirse_juzgado) {
    return "seguimiento_sentirse_juzgado";
  }

  if (profile.id === "tomas" && /(afuera|relacion|gente|hablar con nadie|hablar con otros|persona|presencial)/.test(combined) && topics.seguimiento_dificultad_social) {
    return "seguimiento_dificultad_social";
  }

  if (
    profile.id === "tomas" &&
    /^(por que|porque)$/.test(text.trim()) &&
    /colegio|hablo poco|prefiero no decir|callado|callarme|quedarme callado/.test(lastPatientMessage) &&
    topics.seguimiento_colegio_habla_poco
  ) {
    return "seguimiento_colegio_habla_poco";
  }

  if (profile.id === "tomas" && /no es tan simple|no tan simple|simple/.test(combined) && topics.seguimiento_no_es_tan_simple) {
    return "seguimiento_no_es_tan_simple";
  }

  if (/^(por que|porque)$/.test(text.trim())) {
    return "seguimiento_contextual";
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

function detectEmotionalFollowUpTopic({ text, lastPatientMessage, profile }) {
  if (profile.id === "tomas" && /juzgado|juzgan|juzgar/.test(`${text} ${lastPatientMessage}`) && profile.topics?.seguimiento_sentirse_juzgado) {
    return "seguimiento_sentirse_juzgado";
  }

  return "seguimiento_emocional_contextual";
}

function toResolvedIntent(topic, originalIntent) {
  const map = {
    estado_actual: "estado_actual",
    motivo_consulta: "motivo_de_consulta",
    derivacion: "derivacion_llegada",
    derivacion_motivo_informal: "derivacion_llegada",
    derivacion_como_llego: "derivacion_llegada",
    derivacion_quien_mando: "derivacion_llegada",
    amistades_red_social: "amistades_red_social",
    amistades_red_social_negacion: "amistades_red_social",
    familia: "familia",
    hermanos: "hermanos",
    convivencia_familia: "convivencia_familia",
    convivencia: "convivencia",
    colegio_estudios: "colegio_estudios",
    videojuegos: "videojuegos",
    estudios_trabajo: "estudios_trabajo",
    amistades: "amistades",
    emociones: "emociones",
    rutina_diaria: "rutina_diaria",
    preocupacion: "preocupacion_principal",
    ayuda: "preferencias_valoracion",
    validacion: "validacion_emocional",
    seguimiento_contextual_breve: "seguimiento_contextual_breve",
    seguimiento_emocional_contextual: "seguimiento_emocional_contextual",
    seguimiento_contextual: "seguimiento_contextual",
    seguimiento_no_es_tan_simple: "seguimiento_contextual",
    seguimiento_descanso_culpa: "seguimiento_contextual",
    seguimiento_llegada_casa: "seguimiento_contextual",
    seguimiento_limites: "seguimiento_contextual",
    seguimiento_culpa_descanso: "seguimiento_contextual",
    seguimiento_colegio_habla_poco: "seguimiento_contextual_breve",
    seguimiento_discusiones_computador: "seguimiento_contextual",
    seguimiento_sentirse_juzgado: "seguimiento_emocional_contextual",
    seguimiento_dificultad_social: "seguimiento_contextual",
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
  return /\b(que te trajo|que te trae|por que viniste|por que estas( hoy)? aqui|por qu estas( hoy)? aqui|por que estas( hoy)? aca|motivo de consulta|cual es tu consulta|que paso para que llegaras|que paso para que vinieras|que te esta pasando|que sucede)\b/.test(text);
}

function isDerivationQuestion(text) {
  return /\b(quien te mando|quien te pidio venir|quien pidio que vinieras|quien quiso que vinieras|como llegaste aqui|como llegaste aca|que haces aqui|y tu que haces aqui|viniste solo|viniste sola|te enviaron|te mandaron|te trajeron|te derivo|te derivaron|quien te derivo|quien te trajo|tus papas te trajeron|tus padres te trajeron|tu mama te trajo|tu papa te trajo|fue idea tuya|viniste por tu cuenta)\b/.test(text);
}

function isInformalWhyHereQuestion(text) {
  return /\b(y tu )?que haces (aqui|aca)\b/.test(text);
}

function isHowArrivedQuestion(text) {
  return /\bcomo llegaste (aqui|aca)\b/.test(text);
}

function isWhoSentQuestion(text) {
  return /\b(quien te mando|quien te pidio venir|quien pidio que vinieras|quien quiso que vinieras|quien te trajo|tus papas te trajeron|tus padres te trajeron|tu mama te trajo|tu papa te trajo)\b/.test(text);
}

function isFamilyQuestion(text) {
  return /\b(cuentame de tu familia|como es tu familia|tu familia|con tu familia|familia)\b/.test(text);
}

function isSiblingQuestion(text) {
  return /\b(tienes hermanos|tienes hermanas|hermanos|hermanas|hermano|hermana)\b/.test(text);
}

function isResidenceQuestion(text) {
  return /\b(donde vives|con quien vives|con quienes vives|quien vive contigo|quienes viven contigo|vives con|vives solo|vives sola|con quien compartes casa)\b/.test(text);
}

function isDigitalOrVideogameQuestion(text, profile) {
  const hasDigitalCue = /\b(videojuegos|juegas|computador|redes|celular|instagram|tiktok|online|pantalla)\b/.test(text);
  return hasDigitalCue && Boolean(profile.topics?.videojuegos);
}

function isStudyOrWorkQuestion(text) {
  return /\b(vas al colegio|colegio|universidad|estudias|que estudias|en que curso|que curso|trabajas|trabajo|pega|a que te dedicas|que haces actualmente|ocupacion)\b/.test(text);
}

function isDailyRoutineQuestion(text) {
  return /\b(que haces durante el dia|como es tu dia|como es un dia|rutina|dia a dia|que haces en el dia|como duermes|duermes|descansas)\b/.test(text);
}

function isFriendQuestion(text) {
  return /\b(no tienes amigos|tienes amigos|teni amigos|tenis amigos|tienes amigas|tienes amistades|tienes companeros|amistades|amigos|amigas|companeros|compañeros|con quien hablas|hablas con gente|te juntas|tienes grupo|sales con alguien)\b/.test(text);
}

function isNegativeFriendQuestion(text) {
  return /\bno tienes amigos\b/.test(text);
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

function isClosureMessage(text) {
  return /\b(nos vemos|hasta la proxima|dejemos hasta aqui|dejarlo hasta aqui|terminemos por hoy|cerrar por hoy|proxima sesion|retomar en otra sesion|continuar otro dia|gracias por conversar|hoy pudimos conversar)\b/.test(text);
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

function combineNaturally(first, second) {
  if (!first) return second;
  if (!second) return first;
  const normalizedFirst = normalizeForCompare(first);
  const normalizedSecond = normalizeForCompare(second);
  if (normalizedFirst.includes(normalizedSecond)) return first;
  if (normalizedSecond.includes(normalizedFirst)) return second;
  return `${first.trim()} ${second.trim()}`;
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
