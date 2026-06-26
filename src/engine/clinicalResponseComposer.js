import { responseSimilarity } from "./conversationQuality.js";

const DISCLOSURE_ORDER = {
  low: 0,
  medium: 1,
  high: 2
};

const BASIC_ACTS = new Set([
  "saludo",
  "identidad_nombre",
  "datos_basicos",
  "convivencia_familia",
  "agenda_proxima_sesion",
  "cierre"
]);

export function composePatientResponse({
  profile,
  detectedAct,
  clinicalTopic,
  state,
  disclosureLevel,
  studentMessage = ""
}) {
  const responseKey = resolveResponseKey({ detectedAct, clinicalTopic, state });
  let responses = profile.responses[responseKey] || profile.responses.pregunta_confusa || [];
  if (responseKey === "motivo_consulta" && !state.revealedTopics?.includes("motivo_consulta")) {
    responses = responses.filter((candidate) => !candidate.id.includes("repeat"));
  }
  const candidate = selectBestResponse({
    responses,
    usedResponseIds: state.usedResponseIds || [],
    usedResponseTexts: state.usedResponseTexts || [],
    disclosureLevel
  }) || buildFallbackResponse({ detectedAct, clinicalTopic, state, disclosureLevel, studentMessage });

  const responseText = addRareActiveInteraction({
    text: candidate.text,
    detectedAct,
    state,
    usedResponseTexts: state.usedResponseTexts || []
  });

  return {
    responseText: cleanPatientVoice(responseText),
    responseId: candidate.id,
    selectedResponse: candidate,
    feedbackSignals: buildFeedbackSignals({ detectedAct, clinicalTopic, responseKey, state })
  };
}

function resolveResponseKey({ detectedAct, clinicalTopic, state }) {
  if (state.studentHasClosedSession || detectedAct === "cierre") return "cierre";
  if (clinicalTopic === "limite_profundidad") return "limite_profundidad";
  if (detectedAct === "seguimiento_tarea") return "seguimiento_tarea";
  if (detectedAct === "confirmar_tarea") return "confirmar_tarea";
  if (detectedAct === "tarea_terapeutica") return "tarea_terapeutica";
  if (detectedAct === "agenda_proxima_sesion") return "agenda_proxima_sesion";
  if (detectedAct === "intervencion_confrontativa") return "confrontativa";
  if (detectedAct === "intervencion_empatica") return "empatica";
  if (detectedAct === "pregunta_confusa") return "pregunta_confusa";
  if (detectedAct === "saludo") return "saludo";
  if (detectedAct === "identidad_nombre") return "identidad_nombre";
  if (detectedAct === "datos_basicos") return clinicalTopic === "trabajo" ? "trabajo" : "edad";
  if (detectedAct === "convivencia_familia") return clinicalTopic === "familia" ? "familia" : "convivencia";
  if (detectedAct === "motivo_consulta" && state.revealedTopics?.includes("motivo_consulta")) return "repeticion";
  if (detectedAct === "motivo_consulta") return "motivo_consulta";
  if (detectedAct === "emocion") {
    if (clinicalTopic === "miedo") return "miedo";
    if (clinicalTopic === "verguenza") return "verguenza";
    return "emocion";
  }
  if (detectedAct === "experiencia_vivida") {
    if (clinicalTopic === "temporal") return "temporal";
    if (state.revealedTopics?.includes(clinicalTopic) && !BASIC_ACTS.has(detectedAct)) return "repeticion";
    return "experiencia_vivida";
  }
  if (detectedAct === "rutina") return "rutina";
  if (detectedAct === "apoyo_redes") return "apoyo_redes";
  return "pregunta_confusa";
}

function selectBestResponse({ responses, usedResponseIds, usedResponseTexts, disclosureLevel }) {
  const allowed = responses.filter((candidate) => {
    const candidateDisclosure = DISCLOSURE_ORDER[candidate.minDisclosure || "low"] ?? 0;
    const currentDisclosure = DISCLOSURE_ORDER[disclosureLevel || "low"] ?? 0;
    return candidateDisclosure <= currentDisclosure;
  });
  const pool = allowed.length ? allowed : responses;
  if (!pool.length) return null;

  const scored = pool.map((candidate) => {
    const idWasUsed = isResponseIdUsed(candidate.id, usedResponseIds);
    const maxSimilarity = usedResponseTexts.length
      ? Math.max(...usedResponseTexts.map((previous) => responseSimilarity(candidate.text, previous)))
      : 0;
    const openingPenalty = repeatedOpeningPenalty(candidate.text, usedResponseTexts);
    return {
      candidate,
      score: (idWasUsed ? 3 : 0) + maxSimilarity + openingPenalty
    };
  });

  return scored.sort((a, b) => a.score - b.score)[0]?.candidate || null;
}

function buildFallbackResponse({ detectedAct, clinicalTopic, state, disclosureLevel }) {
  const id = `fallback-${detectedAct}-${clinicalTopic || "general"}-${state.turnCount || 0}`;

  if (detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea") {
    return {
      id,
      text: "Si, me parece. Prefiero que sea algo concreto y simple, porque cuando lo pienso muy grande tiendo a postergarlo.",
      topic: "tarea",
      minDisclosure: "low",
      reveals: [],
      tags: ["taskAccepted"]
    };
  }

  if (detectedAct === "agenda_proxima_sesion") {
    return {
      id,
      text: "Si, me parece bien. Puedo venir en ese horario.",
      topic: "agenda",
      minDisclosure: "low",
      reveals: []
    };
  }

  if (detectedAct === "cierre") {
    return {
      id,
      text: "Esta bien. Me sirve dejarlo aqui y seguir ordenandolo con calma.",
      topic: "cierre",
      minDisclosure: "low",
      reveals: []
    };
  }

  if (detectedAct === "emocion" && clinicalTopic === "miedo") {
    return {
      id,
      text: "Creo que me da miedo equivocarme y despues no poder volver atras. Esa idea me frena bastante.",
      topic: "miedo",
      minDisclosure: disclosureLevel || "low",
      reveals: ["miedo_a_equivocarse"]
    };
  }

  return {
    id,
    text: "Me cuesta responderlo con claridad. Podria decir que sigo funcionando, pero con una sensacion de estar detenido.",
    topic: clinicalTopic || "fallback",
    minDisclosure: disclosureLevel || "low",
    reveals: []
  };
}

function addRareActiveInteraction({ text, detectedAct, state, usedResponseTexts }) {
  if (detectedAct !== "intervencion_empatica") return text;
  if ((state.turnCount || 0) < 4) return text;
  if ((state.trustLevel || 0) < 28) return text;
  if (usedResponseTexts.some((previous) => previous.includes("Tiene sentido que lo piense tanto"))) return text;
  return `${text} Tiene sentido que lo piense tanto antes de mover algo?`;
}

function repeatedOpeningPenalty(text, usedResponseTexts) {
  const openings = ["me ayuda que", "creo que", "no se si", "puede ser"];
  const normalized = text.toLowerCase();
  const opening = openings.find((item) => normalized.startsWith(item));
  if (!opening) return 0;
  const recentUses = usedResponseTexts.filter((previous) => previous.toLowerCase().startsWith(opening)).length;
  return recentUses * 0.65;
}

function isResponseIdUsed(responseId, usedResponseIds) {
  return usedResponseIds.some((usedId) => usedId === responseId || String(usedId).endsWith(`:${responseId}`));
}

function cleanPatientVoice(text) {
  return String(text || "")
    .replace(/\bClaudio siente\b/g, "yo siento")
    .replace(/\bel paciente\b/gi, "yo")
    .replace(/\bse siente\b/gi, "me siento")
    .replace(/\bintervencion\b/gi, "pregunta")
    .replace(/\bresolvedIntent\b/g, "pregunta")
    .trim();
}

function buildFeedbackSignals({ detectedAct, clinicalTopic, responseKey, state }) {
  return {
    respondedConcreteAct: !["pregunta_confusa"].includes(detectedAct),
    disclosureWasLimited: responseKey === "limite_profundidad",
    empathyIncreasedTrust: detectedAct === "intervencion_empatica",
    closureRespected: detectedAct === "cierre" || state.studentHasClosedSession,
    taskAccepted: responseKey === "tarea_terapeutica" || responseKey === "confirmar_tarea",
    clinicalTopic
  };
}
