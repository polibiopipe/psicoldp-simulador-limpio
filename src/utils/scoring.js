import { buildSessionFeedback, getVisibleFeedbackTurns } from "../engine/sessionFeedback.js";
import { rubricCriteria } from "../data/rubrics.js";
import { guidedInterventionTypes } from "../data/guidedConversation.js";
import { getTrustStage, summarizeConversationMemory } from "./analyzeStudentInput.js";

export function buildEducationalReport(history = [], caseItem = {}) {
  const scoredHistory = getVisibleFeedbackTurns(history);
  if (!scoredHistory.length) return buildNoInterventionReport(caseItem);
  const feedback = buildSessionFeedback({ conversation: history, caseItem });
  const memory = summarizeConversationMemory(history);
  const actions = feedback.observedActions;
  const has = (...keys) => actions.some(action => keys.some(key => action[key]));
  const evidenceByCriterion = {
    encuadre: actions.filter(action => action.framing),
    vinculo: actions.filter(action => action.validation || action.autonomyRespect),
    preguntasAbiertas: actions.filter(action => action.facilitativeOpenQuestion),
    escuchaValidacion: actions.filter(action => action.validation),
    exploracionMotivo: scoredHistory.filter(turn => /que te trae|motivo de consulta|que te preocupa|que te gustaria contar/i.test(normalizeForFeedback(turn.question))),
    seguimientoContextual: actions.filter(action => action.followUp),
    eticaRiesgo: actions.filter(action => action.risk),
    cierre: actions.filter(action => action.closure)
  };
  const criteria = rubricCriteria.map(criterion => {
    const evidence = evidenceByCriterion[criterion.id] || [];
    const concern = criterion.id === "vinculo" && has("judgment", "boundaryPressure", "pressure");
    return { ...criterion, score: concern ? 0.5 : evidence.length ? 1 : 0, level: concern ? "needsWork" : evidence.length ? "partial" : "notObserved", levelLabel: concern ? "Contradicción por revisar" : evidence.length ? "Indicio por revisar" : "Sin evidencia identificada", evidenceQuotes: evidence.map(item => item.quote || item.question), assessmentKind: "textual_cue" };
  });
  const finalTrust = memory.trustLevels.at(-1) ?? 0;
  const initialTrust = memory.trustLevels[0] ?? finalTrust;
  const trustStage = getTrustStage(finalTrust);
  const trustLabels = { closed: "baja/cerrada", cautious: "cautelosa", open: "abierta", reflective: "reflexiva" };
  return {
    caseName: caseItem.name, turnCount: scoredHistory.length,
    evaluationStatus: "limited", isEvaluable: true, isLimitedEvaluation: true,
    // Text cues and simulation state are not a validated competence percentage.
    generalScore: null, assessmentKind: "formative_textual_review", basisVersion: feedback.basisVersion,
    trust: { initial: initialTrust, final: finalTrust, delta: finalTrust - initialTrust, stage: trustStage, label: trustLabels[trustStage], isSimulated: true },
    criteria, objectiveEvaluation: evaluateLearningObjectives({ caseItem, memory, history: scoredHistory }),
    reformulationSuggestions: actions.filter(item => item.evidenceStatus === "review").map(item => ({ insteadOf: item.quote, tryThis: item.reformulation })),
    skillClassification: buildSkillClassification(memory),
    // A word-frequency model cannot establish the approach actually delivered.
    therapeuticApproach: null,
    guidedInterventionFeedback: analyzeGuidedInterventionUsage(scoredHistory),
    strengths: feedback.strengths, improvements: feedback.priorityImprovements,
    bondMoments: actions.filter(item => item.validation || item.autonomyRespect || item.followUp).slice(0, 4).map(item => `Turno ${item.index}, “${item.quote}”. ${item.possibleEffect}`),
    closingMoments: actions.filter(item => item.evidenceStatus === "review").map(item => `Turno ${item.index}, “${item.quote}”. ${item.possibleEffect}`),
    summary: `Se registraron ${scoredHistory.length} intervenciones con ${caseItem.name || "el paciente"}. ${feedback.levelDescription}`,
    nextSuggestions: feedback.nextSessionPriorities,
    academicReferences: feedback.academicReferences,
    ethicalNotice: "Informe formativo sobre una simulación con datos ficticios. Los indicios textuales requieren revisión docente y no constituyen una evaluación clínica validada."
  };
}

function buildNoInterventionReport(caseItem) {
  return {
    caseName: caseItem.name,
    turnCount: 0,
    evaluationStatus: "not_evaluable",
    isEvaluable: false,
    isLimitedEvaluation: false,
    generalScore: null,
    trust: {
      initial: 0,
      final: 0,
      delta: 0,
      stage: "not_evaluable",
      label: "no evaluable"
    },
    criteria: [],
    objectiveEvaluation: [],
    reformulationSuggestions: [],
    skillClassification: [],
    therapeuticApproach: null,
    guidedInterventionFeedback: null,
    strengths: [],
    improvements: [],
    bondMoments: [],
    closingMoments: [],
    summary: "Sesión sin intervenciones suficientes para evaluar.",
    emptySessionMessage:
      "No se registraron intervenciones del estudiante. Para recibir retroalimentación formativa, realiza al menos una intervención de encuadre, exploración, validación o cierre.",
    nextSuggestions: [
      "Inicia con un encuadre breve sobre el propósito de la entrevista simulada.",
      "Formula una pregunta abierta que permita conocer el motivo de consulta.",
      "Incluye una validación simple antes de profundizar en nuevas áreas."
    ],
    ethicalNotice:
      "Informe formativo basado en una simulación con datos ficticios. No corresponde a diagnóstico, tratamiento ni intervención clínica real."
  };
}

function evaluateLearningObjectives({ caseItem, memory, history }) {
  const objectives = caseItem.learningObjectives || caseItem.objectives || [];
  return objectives.map((objective) => {
    const score = scoreObjective(objective, memory, history);
    const status = score > 0 ? "indicio por contrastar con el objetivo" : "sin evidencia específica identificada";
    return {
      objective,
      score,
      status,
      level: score >= 2 ? "achieved" : score >= 1 ? "partial" : "notObserved",
      levelLabel: status.charAt(0).toUpperCase() + status.slice(1)
    };
  });
}

function scoreObjective(objective, memory, history) {
  const text = normalizeForFeedback(objective);
  const checks = [];

  if (includesAnyObjective(text, ["encuadre", "proposito", "limites", "eticos", "entrevista inicial"])) {
    checks.push(memory.framing >= 1 || memory.initialPresentation >= 1);
  }
  if (includesAnyObjective(text, ["motivo", "consulta", "trae al paciente"])) {
    checks.push(memory.consultationReason >= 1);
  }
  if (includesAnyObjective(text, ["validar", "validacion", "sin juzgar", "no enjuiciadora", "sin culpabilizar", "sin moralizar"])) {
    checks.push(memory.validation >= 1 && memory.judgment === 0);
  }
  if (includesAnyObjective(text, ["preguntas abiertas", "seguimiento", "retomar", "profundizar"])) {
    checks.push((memory.facilitativeOpenQuestions ?? memory.openQuestions) >= 1 || memory.followUp >= 1);
  }
  if (includesAnyObjective(text, ["familia", "familiar"])) checks.push(memory.family >= 1);
  if (includesAnyObjective(text, ["red de apoyo", "redes de apoyo", "recursos", "pares", "apoyo"])) checks.push(memory.support >= 1);
  if (includesAnyObjective(text, ["contexto", "responsabilidades"])) checks.push(memory.contextExploration >= 1);
  if (includesAnyObjective(text, ["emocion", "culpa", "cansancio", "autoexigencia", "irritabilidad", "miedo", "ambivalencia", "perdida"])) {
    checks.push(memory.emotion >= 1 || memory.validation >= 1);
  }
  if (includesAnyObjective(text, ["videojuego", "digital", "redes", "celular", "comparacion"])) {
    checks.push(memory.digital >= 1);
  }
  if (includesAnyObjective(text, ["academ", "universidad", "estudio", "colegio"])) {
    checks.push(memory.academic >= 1);
  }
  if (includesAnyObjective(text, ["laboral", "trabajo", "rendimiento", "reintegracion"])) {
    checks.push(memory.work >= 1);
  }
  if (includesAnyObjective(text, ["limites", "sobrecarga relacional", "disponibilidad"])) {
    checks.push(memory.emotion >= 1 || memory.support >= 1 || memory.contextExploration >= 1);
  }
  if (includesAnyObjective(text, ["cerrar", "cierre", "continuidad", "próxima"])) {
    checks.push(memory.closure >= 1 || memory.continuityAgreement >= 1);
  }
  if (includesAnyObjective(text, ["evitar", "no entregar", "no idealizar", "no patologizar", "sin apresurar"])) {
    checks.push(memory.validation > 0 && memory.rushedAdvice === 0 && memory.prematureInterpretation === 0 && memory.judgment === 0);
  }
  if (includesAnyObjective(text, ["riesgo", "ética", "derivación"])) {
    checks.push(memory.riskExploration >= 1);
  }

  if (!checks.length) return 0;
  // Mapping identifies possible evidence only, never mastery of a free-text objective.
  return checks.some(Boolean) ? 1 : 0;
}

function buildSkillClassification(memory) {
  return [
    ["Saludo", memory.greeting],
    ["Encuadre", memory.framing],
    ["Pregunta con forma abierta sin conflicto detectado", memory.facilitativeOpenQuestions ?? memory.openQuestions],
    ["Respeto de límites", memory.autonomyRespect],
    ["Presión sobre límite", memory.boundaryPressure],
    ["Pregunta cerrada", memory.closedQuestions],
    ["Indicio de reconocimiento", memory.validation],
    ["Reflejo o resumen", memory.empathicSummary],
    ["Seguimiento contextual", memory.followUp],
    ["Familia/contexto", memory.family],
    ["Emoción", memory.emotion],
    ["Motivo de consulta", memory.consultationReason],
    ["Cierre", memory.closure],
    ["Posible juicio", memory.judgment],
    ["Indicación por revisar", memory.rushedAdvice],
    ["Mención de riesgo", memory.riskExploration]
  ]
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({ label, count }));
}

function includesAnyObjective(text, terms) {
  return terms.some((term) => text.includes(normalizeForFeedback(term)));
}

function normalizeForFeedback(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function analyzeGuidedInterventionUsage(history) {
  const guidedTurns = history.filter((entry) => entry.guidedIntervention || entry.analysis?.guidedIntervention);
  if (!guidedTurns.length) {
    return {
      usedSelector: false,
      summary: "No se usó el selector de tipo de intervención. El sistema funcionó en modo automático.",
      counts: [],
      coherentCount: 0,
      totalGuided: 0,
      suggestions: [
        "Para estabilizar la simulación, prueba seleccionar un tipo de intervención cuando formules preguntas compuestas.",
        "El selector puede ayudarte a practicar intención clínica: encuadre, motivo, validación, seguimiento o cierre."
      ]
    };
  }

  const labels = Object.fromEntries(guidedInterventionTypes.map((type) => [type.id, type.label]));
  const countsMap = new Map();
  let coherentCount = 0;
  const incongruentSamples = [];

  for (const entry of guidedTurns) {
    const guided = entry.guidedIntervention || entry.analysis?.guidedIntervention;
    const typeId = guided?.selectedInterventionType || entry.interventionType;
    if (!typeId) continue;
    countsMap.set(typeId, (countsMap.get(typeId) || 0) + 1);
    if (guided?.isCoherent) {
      coherentCount += 1;
    } else {
      incongruentSamples.push({
        typeLabel: labels[typeId] || typeId,
        question: entry.question
      });
    }
  }

  const counts = Array.from(countsMap.entries())
    .map(([typeId, count]) => ({
      typeId,
      label: labels[typeId] || typeId,
      count
    }))
    .sort((a, b) => b.count - a.count);
  const coherenceRatio = coherentCount / guidedTurns.length;
  const summary =
    coherenceRatio >= 0.75
      ? "Usaste el selector de tipo de intervención de forma mayoritariamente coherente con tus preguntas."
      : "Usaste el selector, pero conviene revisar mejor la coherencia entre el tipo elegido y la frase escrita.";
  const suggestions = [
    counts[0]
      ? `El tipo más usado fue “${counts[0].label}”. Revisa si esa elección calza con el objetivo de cada etapa.`
      : "Elige un tipo de intervención antes de enviar cuando quieras orientar mejor la respuesta del paciente.",
    coherenceRatio >= 0.75
      ? "Cuando seleccionaste un tipo y escribiste una intervención coherente, el paciente tendió a responder de forma más estable."
      : "Si seleccionas “Motivo de consulta”, formula una pregunta sobre lo que trae al paciente; si seleccionas “Cierre”, escribe una frase de síntesis o continuidad."
  ];

  if (incongruentSamples.length) {
    suggestions.push(
      `Ejemplo a revisar: seleccionaste “${incongruentSamples[0].typeLabel}” para “${incongruentSamples[0].question}”.`
    );
  }

  return {
    usedSelector: true,
    summary,
    counts,
    coherentCount,
    totalGuided: guidedTurns.length,
    suggestions
  };
}
