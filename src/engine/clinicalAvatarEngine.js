import { normalizeComparableText, responseSimilarity } from "./conversationQuality.js";
import { analyzeClinicalIntervention } from "./clinicalInterventionAnalysis.js";

const OPENNESS_RANK = {
  low: 0,
  apertura_baja: 0,
  medium: 1,
  apertura_media: 1,
  high: 2,
  apertura_alta: 2
};

export function generateClinicalAvatarResponse({
  avatarProfile,
  studentMessage,
  intentResult,
  selectedInterventionType = "",
  sessionNumber = 1,
  conversationHistory = [],
  memory,
  conversationStage = null,
  previousSessionSummary = null
}) {
  if (!avatarProfile) return null;

  const session = avatarProfile.sessionProgression[sessionNumber]
    || avatarProfile.sessionProgression[1];
  const analysis = analyzeClinicalIntervention({
    studentMessage,
    intentResult,
    selectedInterventionType,
    sessionNumber,
    previousSessionSummary
  });
  const stage = resolveClinicalStage({
    analysis,
    conversationStage,
    session
  });
  const effectiveOpenness = resolveAvatarOpenness(avatarProfile, memory);
  const validationCooldownActive = analysis.goodType === "validation"
    && hasRecentValidationLead(memory, 5);
  const selection = buildCandidateSelection({
    avatarProfile,
    session,
    sessionNumber,
    analysis,
    intentResult,
    selectedInterventionType,
    conversationHistory,
    memory,
    previousSessionSummary
  });
  const candidates = filterAllowedCandidates(
    selection.candidates,
    sessionNumber,
    effectiveOpenness,
    { avoidValidationLead: validationCooldownActive }
  );
  const contextualFallbacks = buildContextualFallbackCandidates({
    avatarProfile,
    session,
    topic: analysis.topic
  });
  const selected = selectClinicalCandidate({
    candidates,
    memory,
    avatarId: avatarProfile.identity.id,
    avatarProfile,
    topic: analysis.topic,
    sessionNumber,
    fallbackCandidates: filterAllowedCandidates(
      contextualFallbacks,
      sessionNumber,
      effectiveOpenness,
      { avoidValidationLead: validationCooldownActive }
    )
  });

  if (!selected) return null;

  const responseSource = selected.selectionSource || selection.source;

  return {
    response: selected.text,
    responseId: `clinical:${avatarProfile.identity.id}:${selected.id}`,
    responseType: `clinical_avatar:${responseSource}:${selected.topic || analysis.topic}`,
    fallbackUsed: responseSource.startsWith("contextual_fallback") || selection.source === "fallback",
    profileTopic: selected.topic || analysis.topic,
    resolvedIntent: selection.resolvedIntent || intentResult.intent,
    clinical: {
      avatarId: avatarProfile.identity.id,
      sessionNumber,
      sessionTitle: session.title,
      stage,
      source: responseSource,
      detectedTopic: analysis.topic,
      approach: analysis.approach,
      taskKind: analysis.taskKind,
      goodIntervention: analysis.goodType,
      poorIntervention: analysis.poorType,
      validationCooldownActive,
      opennessLevel: effectiveOpenness,
      previousTask: previousSessionSummary?.tareaAcordada || null,
      selectedResponseId: selected.id,
      reveals: selected.reveals || []
    }
  };
}

function resolveAvatarOpenness(avatarProfile, memory) {
  const baseline = avatarProfile.emotionalRules?.baselineOpenness || "low";
  if (!memory) return baseline;

  if (baseline === "low" && !memory.hadValidation && (memory.trustLevel || 0) < 50) {
    return "low";
  }

  return memory.opennessLevel || baseline;
}

function buildCandidateSelection({
  avatarProfile,
  session,
  sessionNumber,
  analysis,
  intentResult,
  conversationHistory,
  memory,
  previousSessionSummary
}) {
  if (analysis.isClosure) {
    return selection(
      avatarProfile.formativeClosure[sessionNumber],
      "closure",
      "cierre"
    );
  }

  const factual = factualCandidates(avatarProfile, analysis.topic);
  if (factual.length) {
    return selection(factual, "factual", intentResult.intent);
  }

  if (isProtectedEarlyTopic(session, analysis.topic)) {
    return selection(
      avatarProfile.boundaryResponses?.[analysis.topic]
        || avatarProfile.taskResponses.emotionallyPremature,
      "session_boundary",
      "seguimiento_contextual"
    );
  }

  if (analysis.taskKind) {
    const taskCandidates = taskResponseCandidates({
      avatarProfile,
      taskKind: analysis.taskKind,
      previousSessionSummary,
      memory
    });
    return selection(
      taskCandidates,
      `task_${analysis.taskKind}`,
      taskIntent(analysis.taskKind)
    );
  }

  if (analysis.poorType) {
    return selection(
      avatarProfile.poorInterventions[analysis.poorType],
      `poor_${analysis.poorType}`,
      analysis.poorType === "rapidAdvice" ? "consejo_apresurado" : "juicio_o_critica"
    );
  }

  const directIntentCandidates = avatarProfile.intentResponses?.[analysis.topic] || [];
  if (directIntentCandidates.length) {
    return selection(
      directIntentCandidates,
      `intent_${analysis.topic}`,
      intentForClinicalTopic(analysis.topic, intentResult.intent)
    );
  }

  if (analysis.goodType) {
    const approachCandidates = analysis.approach
      ? avatarProfile.approachResponses[analysis.approach] || []
      : [];
    const goodCandidates = avatarProfile.goodInterventions[analysis.goodType] || [];
    const orderedCandidates = analysis.goodType === "validation"
      ? [...prioritizeCandidatesByTopic(approachCandidates, analysis.topic), ...goodCandidates]
      : [...goodCandidates, ...prioritizeCandidatesByTopic(approachCandidates, analysis.topic)];
    return selection(
      orderedCandidates,
      `good_${analysis.goodType}`,
      analysis.goodType === "validation" ? "validacion_emocional" : "seguimiento_contextual"
    );
  }

  if (analysis.isExplicitFollowUp) {
    const lastTopic = analysis.topic !== "follow_up"
      ? analysis.topic
      : inferLastClinicalTopic(memory, conversationHistory);
    return selection(
      avatarProfile.followUpResponses[lastTopic]
        || avatarProfile.followUpResponses.default,
      `follow_up_${lastTopic || "default"}`,
      "seguimiento_contextual"
    );
  }

  const sessionCandidates = sessionCandidatesForTopic(session, analysis.topic);
  if (sessionCandidates.length && shouldPrioritizeSessionTopic(analysis.topic, analysis.approach)) {
    return selection(sessionCandidates, `session_${analysis.topic}`, intentResult.intent);
  }

  if (analysis.approach && avatarProfile.approachResponses[analysis.approach]) {
    return selection(
      prioritizeCandidatesByTopic(avatarProfile.approachResponses[analysis.approach], analysis.topic),
      `approach_${analysis.approach}`,
      intentResult.intent
    );
  }

  if (sessionCandidates.length) {
    return selection(sessionCandidates, `session_${analysis.topic}`, intentResult.intent);
  }

  if (analysis.isAmbiguous) {
    return selection(avatarProfile.ambiguityResponses, "ambiguity", "ambiguo_real");
  }

  return selection(
    session.responses.follow_up || avatarProfile.followUpResponses.default,
    "fallback",
    intentResult.intent
  );
}

function shouldPrioritizeSessionTopic(topic, approach) {
  if (!approach) return true;
  return ["saludo", "encuadre", "encuadre_mas_pregunta", "motivo", "separacion", "ayuda"].includes(topic);
}

function intentForClinicalTopic(topic, fallbackIntent) {
  const map = {
    temporal: "pregunta_temporal",
    miedo_especifico: "exploracion_miedo",
    foco_sesion: "preferencias_valoracion",
    confidencialidad: "encuadre_o_consentimiento",
    certeza_control: "exploracion_decisiones"
  };
  return map[topic] || fallbackIntent;
}

function prioritizeCandidatesByTopic(candidates = [], topic) {
  if (!topic || topic === "follow_up") return candidates;
  const matching = candidates.filter((candidate) => candidate.topic === topic);
  if (!matching.length) return candidates;
  return [
    ...matching.map((candidate) => ({ ...candidate, selectionPriority: -0.35 })),
    ...candidates.filter((candidate) => candidate.topic !== topic)
  ];
}

function factualCandidates(profile, topic) {
  const map = {
    identidad_nombre: "identidad_nombre",
    edad: "edad",
    convivencia: "convivencia",
    hermanos: "hermanos",
    estudios_trabajo: "estudios_trabajo",
    amistades: "amistades",
    derivacion: "derivacion",
    riesgo: "riesgo"
  };
  return profile.factualResponses[map[topic]] || [];
}

function sessionCandidatesForTopic(session, topic) {
  const map = {
    saludo: "saludo",
    encuadre: "encuadre",
    encuadre_mas_pregunta: "encuadre_mas_pregunta",
    motivo: "motivo",
    rutina: "rutina",
    decisiones: "decisiones",
    emociones: "emociones",
    separacion: "separacion",
    contexto: "contexto",
    recursos: "recursos",
    valores: "valores",
    ayuda: "ayuda",
    follow_up: "follow_up",
    cierre: "continuidad"
  };
  const direct = session.responses[map[topic] || topic] || [];
  if (direct.length) return direct;
  if (topic === "motivo" && session.responses.sintesis) return session.responses.sintesis;
  if (topic === "recursos" && session.responses.accion) return session.responses.accion;
  if (topic === "follow_up") return session.responses.follow_up || [];
  return [];
}

function taskResponseCandidates({ avatarProfile, taskKind, previousSessionSummary, memory }) {
  if (taskKind !== "followUp") return avatarProfile.taskResponses[taskKind] || [];
  if (!previousSessionSummary?.tareaAcordada) return avatarProfile.taskResponses.noPreviousTask || [];

  const priorTaskResponses = memory?.usedResponseIds || [];
  const partialWasUsed = priorTaskResponses.some((id) => id.includes("task-partial"));
  if (partialWasUsed) return avatarProfile.taskResponses.helpful || [];

  const taskText = String(previousSessionSummary.tareaAcordada).toLowerCase();
  const wasBroad = /cambiar toda|renuncia|decide|resuelve|todos los dias/.test(taskText);
  return wasBroad
    ? avatarProfile.taskResponses.notDone || []
    : avatarProfile.taskResponses.partial || [];
}

function taskIntent(taskKind) {
  const map = {
    concrete: "tarea_concreta",
    tooBroad: "tarea_amplia",
    emotionallyPremature: "tarea_prematura",
    followUp: "seguimiento_tarea",
    helpful: "seguimiento_tarea",
    noPreviousTask: "seguimiento_tarea"
  };
  return map[taskKind] || "seguimiento_tarea";
}

function isProtectedEarlyTopic(session, topic) {
  const protectedTopicMap = {
    separacion: "separacion",
    historia: "historia_familiar_profunda"
  };
  return session.protectedThemes?.includes(protectedTopicMap[topic]);
}

function filterAllowedCandidates(candidates = [], sessionNumber, opennessLevel, options = {}) {
  const currentOpenness = OPENNESS_RANK[opennessLevel] ?? 0;
  return candidates.filter((candidate) => {
    if (!candidate?.text) return false;
    if (options.avoidValidationLead && startsWithValidationLead(candidate.text)) return false;
    const minimum = OPENNESS_RANK[candidate.minOpenness] ?? 0;
    return (
      sessionNumber >= (candidate.minSession || 1)
      && sessionNumber <= (candidate.maxSession || 4)
      && currentOpenness >= minimum
    );
  });
}

function selectClinicalCandidate({ candidates, memory, avatarId, avatarProfile, topic, sessionNumber, fallbackCandidates }) {
  const previousResponses = memory?.usedResponseTexts || memory?.recentPatientMessages || [];
  const recentResponses = memory?.recentPatientMessages || previousResponses.slice(-5);
  const usedIds = new Set(memory?.usedResponseIds || []);
  const primary = selectFreshCandidate(candidates, {
    avatarId,
    usedIds,
    previousResponses,
    recentResponses,
    maximumSimilarity: 0.66
  });
  if (primary) return primary;

  const contextual = selectFreshCandidate(fallbackCandidates, {
    avatarId,
    usedIds,
    previousResponses,
    recentResponses,
    maximumSimilarity: 0.72
  });
  if (contextual) {
    return { ...contextual, selectionSource: "contextual_fallback" };
  }

  const unused = rankCandidates(
    dedupeCandidates([...(candidates || []), ...(fallbackCandidates || [])]),
    { avatarId, usedIds, previousResponses, recentResponses }
  ).find((entry) => !entry.used && !entry.exactRepeat)?.candidate;

  if (unused) return { ...unused, selectionSource: "contextual_fallback_relaxed" };

  return synthesizeContextualFallback({
    avatarProfile,
    topic,
    sessionNumber,
    memory,
    previousResponses,
    recentResponses
  });
}

function selectFreshCandidate(candidates, context) {
  return rankCandidates(dedupeCandidates(candidates), context)
    .find((entry) => !entry.used && !entry.exactRepeat && entry.similarity < context.maximumSimilarity)
    ?.candidate || null;
}

function rankCandidates(candidates, { avatarId, usedIds, previousResponses, recentResponses }) {
  return candidates
    .map((candidate) => {
      const responseId = `clinical:${avatarId}:${candidate.id}`;
      const normalized = normalizeComparableText(candidate.text);
      const similarities = previousResponses.map((previous) => responseSimilarity(candidate.text, previous));
      const similarity = similarities.length ? Math.max(...similarities) : 0;
      const exactRepeat = previousResponses.some(
        (previous) => normalizeComparableText(previous) === normalized
      );
      const openingPenalty = hasRepeatedOpening(candidate.text, recentResponses) ? 0.32 : 0;
      return {
        candidate,
        used: usedIds.has(responseId),
        exactRepeat,
        similarity,
        score: similarity + openingPenalty + (candidate.selectionPriority || 0)
      };
    })
    .sort((first, second) => first.score - second.score);
}

function buildContextualFallbackCandidates({ avatarProfile, session, topic }) {
  const contextual = avatarProfile.contextualFallbacks || {};
  const directIntentCandidates = avatarProfile.intentResponses?.[topic] || [];
  if (directIntentCandidates.length) {
    return dedupeCandidates([
      ...(contextual[topic] || []),
      ...directIntentCandidates,
      ...sessionCandidatesForTopic(session, topic)
    ]);
  }

  return dedupeCandidates([
    ...(contextual[topic] || []),
    ...sessionCandidatesForTopic(session, topic),
    ...(avatarProfile.followUpResponses?.[topic] || []),
    ...(contextual.follow_up || []),
    ...(session.responses.follow_up || []),
    ...(contextual.default || [])
  ]);
}

function dedupeCandidates(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate?.id || seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

function hasRecentValidationLead(memory, cooldownTurns) {
  return (memory?.recentPatientMessages || [])
    .slice(-cooldownTurns)
    .some(startsWithValidationLead);
}

function startsWithValidationLead(text = "") {
  return /^(me ayuda|gracias|eso me ayuda|agradezco|si,? eso ayuda)/.test(normalizeComparableText(text));
}

function hasRepeatedOpening(candidateText, recentResponses) {
  const candidateOpening = openingFamily(candidateText);
  if (!candidateOpening) return false;
  return recentResponses.some((response) => openingFamily(response) === candidateOpening);
}

function openingFamily(text = "") {
  const normalized = normalizeComparableText(text);
  const patterned = [
    ["me_ayuda", /^(me ayuda|eso me ayuda)/],
    ["creo_relacion", /^creo que (se relaciona|tiene que ver)/],
    ["no_se_si", /^no se si/],
    ["puede_ser", /^puede ser/],
    ["gracias", /^gracias/]
  ].find(([, pattern]) => pattern.test(normalized));
  if (patterned) return patterned[0];
  return normalized.split(" ").slice(0, 3).join(" ");
}

function synthesizeContextualFallback({
  avatarProfile,
  topic,
  sessionNumber,
  memory,
  previousResponses,
  recentResponses
}) {
  const synthesis = avatarProfile.fallbackSynthesis?.[topic]
    || avatarProfile.fallbackSynthesis?.default;
  if (!synthesis?.openings?.length || !synthesis?.details?.length) return null;

  const combinations = synthesis.openings.flatMap((opening, openingIndex) =>
    synthesis.details.map((detail, detailIndex) => ({
      id: `synthesis-${topic}-${sessionNumber}-${openingIndex}-${detailIndex}-${memory?.turnCount || 0}`,
      text: `${opening} ${detail}`,
      topic,
      openingIndex,
      detailIndex
    }))
  );
  const ranked = combinations
    .map((candidate) => {
      const similarities = previousResponses.map((previous) => responseSimilarity(candidate.text, previous));
      const similarity = similarities.length ? Math.max(...similarities) : 0;
      const openingPenalty = hasRepeatedOpening(candidate.text, recentResponses) ? 0.32 : 0;
      return { candidate, score: similarity + openingPenalty, similarity };
    })
    .sort((first, second) => first.score - second.score);
  const selected = ranked.find(({ candidate }) =>
    !previousResponses.some(
      (previous) => normalizeComparableText(previous) === normalizeComparableText(candidate.text)
    )
  )?.candidate;

  return selected ? { ...selected, selectionSource: "contextual_synthesis" } : null;
}

function inferLastClinicalTopic(memory, conversationHistory) {
  const lastResponseId = memory?.usedResponseIds?.at(-1)
    || conversationHistory.at(-1)?.responseId
    || "";
  const lastMessage = String(memory?.lastPatientMessage || conversationHistory.at(-1)?.answer || "").toLowerCase();
  const combined = `${lastResponseId} ${lastMessage}`;
  const topics = [
    ["encuadre", /acostumbr|hablar de lo que|espacio cuidado|confidencial/],
    ["separacion", /separaci|expareja/],
    ["rutina", /routine|rutina|automatico|automático/],
    ["decisiones", /decision|decidir|posterg|equivoc/],
    ["deber", /deber|correspond|responsab/],
    ["valores", /valor|interes|deseo/],
    ["tarea", /task|tarea|registro|anotar/],
    ["motivo", /motive|motivo|estanc|desgaste/]
  ];
  return topics.find(([, pattern]) => pattern.test(combined))?.[0]
    || memory?.lastSubstantiveTopic
    || "default";
}

function resolveClinicalStage({ analysis, conversationStage, session }) {
  if (analysis.isClosure) return "closure";
  if (analysis.taskKind) return "task";
  if (analysis.poorType) return "defensive_response";
  if (analysis.goodType) return "relational_opening";
  if (conversationStage?.stageName) return conversationStage.stageName;
  if (["saludo", "encuadre", "encuadre_mas_pregunta"].includes(analysis.topic)) return "opening";
  if (analysis.topic === "motivo") return "manifest_motive";
  if (["contexto", "convivencia", "estudios_trabajo", "amistades"].includes(analysis.topic)) return "context";
  if (["recursos", "valores"].includes(analysis.topic)) return "resources";
  return session.defaultStage;
}

function selection(candidates, source, resolvedIntent) {
  return {
    candidates: (candidates || []).filter(Boolean),
    source,
    resolvedIntent
  };
}
