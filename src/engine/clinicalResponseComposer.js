import { responseSimilarity } from "./conversationQuality.js";

const DISCLOSURE_ORDER = {
  low: 0,
  medium: 1,
  high: 2
};

const BASIC_ACTS = new Set([
  "saludo",
  "identidad_nombre",
  "edad",
  "vivienda",
  "ocupacion_estudios",
  "datos_basicos",
  "convivencia_familia",
  "familia_composicion",
  "estado_civil_pareja",
  "red_apoyo",
  "riesgo_autolesion",
  "consumo_sustancias",
  "agenda_proxima_sesion",
  "cierre",
  "cierre_sesion"
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
  let responses = profile.responses[responseKey] || [];
  if (!responses.length && detectedAct !== "pregunta_confusa") {
    responses = profile.responses.no_definido || [];
  }
  if (!responses.length) {
    responses = profile.responses.pregunta_confusa || [];
  }
  if (responseKey === "motivo_consulta" && !state.revealedTopics?.includes("motivo_consulta")) {
    responses = responses.filter((candidate) => !candidate.id.includes("repeat"));
  }
  const candidate = selectBestResponse({
    responses,
    usedResponseIds: state.usedResponseIds || [],
    usedResponseTexts: state.usedResponseTexts || [],
    disclosureLevel
  }) || buildFallbackResponse({ profile, detectedAct, clinicalTopic, state, disclosureLevel, studentMessage });

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
  if (state.studentHasClosedSession || detectedAct === "cierre" || detectedAct === "cierre_sesion") return "cierre_sesion";
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
  if (detectedAct === "encuadre_confidencialidad") return "encuadre_confidencialidad";
  if (detectedAct === "edad") return "edad";
  if (detectedAct === "vivienda") return "vivienda";
  if (detectedAct === "ocupacion_estudios") return "ocupacion_estudios";
  if (detectedAct === "datos_basicos") return clinicalTopic === "trabajo" ? "trabajo" : "edad";
  if (detectedAct === "familia_composicion") return "familia_composicion";
  if (detectedAct === "estado_civil_pareja") return "estado_civil_pareja";
  if (detectedAct === "red_apoyo") return "red_apoyo";
  if (detectedAct === "riesgo_autolesion") return "riesgo_autolesion";
  if (detectedAct === "consumo_sustancias") return "consumo_sustancias";
  if (detectedAct === "convivencia_familia") return clinicalTopic === "familia" ? "familia" : "convivencia";
  if (detectedAct === "motivo_consulta" && state.revealedTopics?.includes("motivo_consulta")) return "repeticion";
  if (detectedAct === "motivo_consulta") return "motivo_consulta";
  if (detectedAct === "emocion" || detectedAct === "sintomas_malestar") {
    if (clinicalTopic === "miedo") return "miedo";
    if (clinicalTopic === "verguenza") return "verguenza";
    return "sintomas_malestar";
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

function buildFallbackResponse({ profile, detectedAct, clinicalTopic, state, disclosureLevel }) {
  const id = `fallback-${detectedAct}-${clinicalTopic || "general"}-${state.turnCount || 0}`;

  if (detectedAct !== "pregunta_confusa") {
    const unknown = profile?.responses?.no_definido?.[0];
    if (unknown) {
      return {
        ...unknown,
        id,
        topic: clinicalTopic || unknown.topic || "no_definido"
      };
    }
  }

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

  if (detectedAct === "cierre" || detectedAct === "cierre_sesion") {
    return {
      id,
      text: "Esta bien. Me sirve dejarlo aqui y seguir ordenandolo con calma.",
      topic: "cierre",
      minDisclosure: "low",
      reveals: []
    };
  }

  if (detectedAct === "riesgo_autolesion") {
    return {
      id,
      text: "No, no he pensado en hacerme dano. Mi malestar va por otro lado.",
      topic: "riesgo",
      minDisclosure: "low",
      reveals: []
    };
  }

  if (detectedAct === "consumo_sustancias") {
    return {
      id,
      text: "No, no consumo sustancias. No es un tema central para mi.",
      topic: "consumo",
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
    text: "Prefiero ir de a poco con eso. Puedo responder mejor si lo acotamos un poco.",
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
    .replace(/^siente que\b/i, "Siento que")
    .replace(/^cree que\b/i, "Creo que")
    .replace(/^sabe que\b/i, "Se que")
    .replace(/^teme\b/i, "Me da miedo")
    .replace(/^le cuesta\b/i, "Me cuesta")
    .replace(/^le preocupa\b/i, "Me preocupa")
    .replace(/\bla esta agotando\b/gi, "me esta agotando")
    .replace(/\blo esta agotando\b/gi, "me esta agotando")
    .replace(/\bsu hijo\b/gi, "mi hijo")
    .replace(/\bsu hija\b/gi, "mi hija")
    .replace(/\bsus hijos\b/gi, "mis hijos")
    .replace(/\bsus hijas\b/gi, "mis hijas")
    .replace(/\ba si misma\b/gi, "a mi misma")
    .replace(/\ba si mismo\b/gi, "a mi mismo")
    .replace(/\bse mide a mi misma\b/gi, "me mido a mi misma")
    .replace(/\bse mide a mi mismo\b/gi, "me mido a mi mismo")
    .replace(/\bSe que ama a mi hijo\b/g, "Se que amo a mi hijo")
    .replace(/\bse que ama a mi hijo\b/g, "se que amo a mi hijo")
    .replace(/\bno entiende como\b/gi, "no entiendo como")
    .replace(/\bintervencion\b/gi, "pregunta")
    .replace(/\bresolvedIntent\b/g, "pregunta")
    .trim();
}

function buildFeedbackSignals({ detectedAct, clinicalTopic, responseKey, state }) {
  const closureAct = detectedAct === "cierre" || detectedAct === "cierre_sesion";
  return {
    respondedConcreteAct: !["pregunta_confusa"].includes(detectedAct),
    disclosureWasLimited: responseKey === "limite_profundidad",
    empathyIncreasedTrust: detectedAct === "intervencion_empatica",
    closureRespected: closureAct || state.studentHasClosedSession,
    taskAccepted: responseKey === "tarea_terapeutica" || responseKey === "confirmar_tarea",
    clinicalTopic,
    usedPatientDossier: true
  };
}
