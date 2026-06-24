import { isSemanticallyRepeated, selectLeastSimilarCandidate } from "./conversationQuality.js";
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
    effectiveOpenness
  );
  const selected = selectClinicalCandidate({
    candidates,
    memory,
    avatarId: avatarProfile.identity.id,
    fallbackCandidates: filterAllowedCandidates(
      session.responses.follow_up
        || session.responses.motivo
        || avatarProfile.ambiguityResponses,
      sessionNumber,
      effectiveOpenness
    )
  });

  if (!selected) return null;

  return {
    response: selected.text,
    responseId: `clinical:${avatarProfile.identity.id}:${selected.id}`,
    responseType: `clinical_avatar:${selection.source}:${selected.topic || analysis.topic}`,
    fallbackUsed: selection.source === "fallback",
    profileTopic: selected.topic || analysis.topic,
    resolvedIntent: selection.resolvedIntent || intentResult.intent,
    clinical: {
      avatarId: avatarProfile.identity.id,
      sessionNumber,
      sessionTitle: session.title,
      stage,
      source: selection.source,
      detectedTopic: analysis.topic,
      approach: analysis.approach,
      taskKind: analysis.taskKind,
      goodIntervention: analysis.goodType,
      poorIntervention: analysis.poorType,
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

function prioritizeCandidatesByTopic(candidates = [], topic) {
  if (!topic || topic === "follow_up") return candidates;
  const matching = candidates.filter((candidate) => candidate.topic === topic);
  if (!matching.length) return candidates;
  return [...matching, ...candidates.filter((candidate) => candidate.topic !== topic)];
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
  return session.responses.follow_up || [];
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

function filterAllowedCandidates(candidates = [], sessionNumber, opennessLevel) {
  const currentOpenness = OPENNESS_RANK[opennessLevel] ?? 0;
  return candidates.filter((candidate) => {
    if (!candidate?.text) return false;
    const minimum = OPENNESS_RANK[candidate.minOpenness] ?? 0;
    return (
      sessionNumber >= (candidate.minSession || 1)
      && sessionNumber <= (candidate.maxSession || 4)
      && currentOpenness >= minimum
    );
  });
}

function selectClinicalCandidate({ candidates, memory, avatarId, fallbackCandidates }) {
  const pool = candidates.length ? candidates : fallbackCandidates;
  if (!pool?.length) return null;

  const previousResponses = memory?.usedResponseTexts || memory?.recentPatientMessages || [];
  const usedIds = new Set(memory?.usedResponseIds || []);
  const unused = pool.find((candidate) => {
    const responseId = `clinical:${avatarId}:${candidate.id}`;
    return !usedIds.has(responseId)
      && !isSemanticallyRepeated(candidate.text, previousResponses, 0.64);
  });
  if (unused) return unused;

  return selectLeastSimilarCandidate(pool, previousResponses) || pool[0];
}

function inferLastClinicalTopic(memory, conversationHistory) {
  const lastResponseId = memory?.usedResponseIds?.at(-1)
    || conversationHistory.at(-1)?.responseId
    || "";
  const lastMessage = String(memory?.lastPatientMessage || conversationHistory.at(-1)?.answer || "").toLowerCase();
  const combined = `${lastResponseId} ${lastMessage}`;
  const topics = [
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
