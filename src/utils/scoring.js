import { rubricCriteria, levelLabels } from "../data/rubrics.js";
import { guidedInterventionTypes } from "../data/guidedConversation.js";
import { analyzeTherapeuticApproaches } from "../engine/therapeuticApproachAnalyzer.js";
import { getTrustStage, summarizeConversationMemory } from "./analyzeStudentInput.js";

function level(score) {
  if (score >= 2) return "achieved";
  if (score >= 1) return "partial";
  if (score > 0) return "needsWork";
  return "notObserved";
}

function labelFor(score) {
  return levelLabels[level(score)];
}

export function buildEducationalReport(history, caseItem) {
  const scoredHistory = history.filter((entry) => !entry.isSessionPrelude);
  const turnCount = scoredHistory.length;

  if (turnCount === 0) {
    return buildNoInterventionReport(caseItem);
  }

  const isLimitedEvaluation = turnCount < 2;
  const therapeuticApproach = analyzeTherapeuticApproaches(scoredHistory.map((entry) => entry.question));
  const guidedInterventionFeedback = analyzeGuidedInterventionUsage(scoredHistory);
  const memory = summarizeConversationMemory(scoredHistory);
  const hasJudgment = memory.judgment > 0;
  const hasRushedAdvice = memory.rushedAdvice > 0;
  const hasPrematureInterpretation = memory.prematureInterpretation > 0;
  const finalTrust = memory.trustLevels.at(-1) ?? 0;
  const initialTrust = memory.trustLevels[0] ?? finalTrust;
  const trustDelta = finalTrust - initialTrust;
  const trustStage = getTrustStage(finalTrust);
  const specificHits = caseItem.specificCriteria.filter((criterion) => {
    const text = criterion.toLowerCase();
    if (text.includes("videojuegos")) return memory.contextExploration > 0;
    if (text.includes("laborales")) return memory.contextExploration > 0;
    if (text.includes("redes")) return memory.support > 0;
    if (text.includes("familia")) return memory.contextExploration > 0;
    return memory.openQuestions + memory.validation > 1;
  }).length;

  const rawScores = {
    encuadre: memory.framing >= 1 ? 2 : memory.initialPresentation || memory.greeting ? 1 : 0,
    vinculo: !hasJudgment && memory.pressure === 0 && (memory.validation || memory.paceRespect || memory.greeting)
      ? 2
      : !hasJudgment && memory.pressure === 0
        ? 1
        : 0.5,
    preguntasAbiertas: memory.openQuestions >= 3 ? 2 : memory.openQuestions >= 1 ? 1 : 0,
    escuchaValidacion: memory.validation + memory.empathicSummary >= 2
      ? 2
      : memory.validation + memory.empathicSummary >= 1
        ? 1
        : 0,
    exploracionMotivo: memory.consultationReason >= 1 && (memory.emotion || memory.contextExploration)
      ? 2
      : memory.consultationReason >= 1
        ? 1
        : 0,
    seguimientoContextual: memory.followUp >= 2 ? 2 : memory.followUp >= 1 ? 1 : 0,
    eticaRiesgo: memory.riskExploration >= 1 || memory.framing >= 1
      ? 2
      : !hasJudgment && !hasRushedAdvice
        ? 1
        : 0,
    cierre: memory.goodClosure >= 1 && memory.continuityAgreement >= 1
      ? 2
      : memory.closure >= 1
        ? 1
        : 0
  };

  let criteria = rubricCriteria.map((criterion) => {
    const score = rawScores[criterion.id] ?? 0;
    return {
      ...criterion,
      score,
      level: level(score),
      levelLabel: labelFor(score)
    };
  });
  if (isLimitedEvaluation) {
    criteria = criteria.map(limitCriterionForSparseEvidence);
  }

  const generalScore = isLimitedEvaluation
    ? null
    : Math.round(
        (criteria.reduce((sum, criterion) => sum + criterion.score, 0) / (criteria.length * 2)) * 100
      );
  let objectiveEvaluation = evaluateLearningObjectives({ caseItem, memory, history: scoredHistory });
  if (isLimitedEvaluation) {
    objectiveEvaluation = objectiveEvaluation.map(limitObjectiveForSparseEvidence);
  }
  const reformulationSuggestions = buildReformulationSuggestions(scoredHistory, caseItem);
  const skillClassification = buildSkillClassification(memory);

  const strengths = [];
  const improvements = [];

  if (memory.framing) strengths.push("Presentaste algún encuadre o límite para ordenar la entrevista.");
  if (memory.openQuestions >= 2) strengths.push("Usaste preguntas abiertas que facilitaron mayor elaboración.");
  if (memory.validation) strengths.push("Incluiste validación emocional y un tono respetuoso.");
  if (memory.contextExploration >= 2) strengths.push("Exploraste dimensiones contextuales relevantes para el caso.");
  if (memory.empathicSummary || memory.followUp) strengths.push("Retomaste contenido del paciente ficticio y usaste seguimiento conversacional, favoreciendo continuidad.");
  if (trustDelta > 8) strengths.push(`La apertura del paciente aumentó durante la entrevista (+${trustDelta} puntos de confianza simulada).`);
  if (!hasJudgment && !isLimitedEvaluation) strengths.push("Evitaste juicios directos o etiquetas sobre el paciente ficticio.");

  if (!memory.framing) improvements.push("Inicia con un encuadre más explícito: propósito, límites, ritmo y carácter educativo.");
  if (memory.closedQuestions > memory.openQuestions) improvements.push("Hubo predominio de preguntas cerradas; alterna con preguntas abiertas para favorecer relato.");
  if (memory.openQuestions < 2) improvements.push("Aumenta el uso de preguntas abiertas y evita una secuencia de preguntas cerradas.");
  if (!memory.validation) improvements.push("Refleja emociones antes de avanzar a hipótesis o nuevas áreas.");
  if (memory.contextExploration < 2) improvements.push("Explora con más equilibrio familia, estudio/trabajo, redes y vida digital según el caso.");
  if (memory.followUp < 1 && turnCount >= 3) improvements.push("Incluye preguntas de seguimiento sobre palabras del paciente para sostener una conversación más humana.");
  if (hasJudgment) improvements.push("Cuida el lenguaje para evitar moralizar, etiquetar o responsabilizar al paciente ficticio.");
  if (hasRushedAdvice) improvements.push("Evita consejos apresurados; prioriza comprensión del caso y formulación de preguntas.");
  if (hasPrematureInterpretation) improvements.push("Evita interpretaciones cerradas demasiado pronto; formula hipótesis como preguntas tentativas.");
  if (memory.pressure) improvements.push("Reduce presión o insistencia: respeta silencios y permite que el paciente ficticio marque ritmo.");
  if (!memory.goodClosure) improvements.push("Cierra con resumen empático, agradecimiento y una pregunta breve sobre cómo queda el paciente.");
  if (!memory.continuityAgreement) improvements.push("Al cerrar, puedes dejar abierta una próxima sesión simulada sin prometer soluciones inmediatas.");

  const bondMoments = scoredHistory
    .filter((entry) =>
      entry.analysis?.categories?.validation ||
      entry.analysis?.categories?.empathicSummary ||
      entry.analysis?.categories?.followUp ||
      entry.analysis?.categories?.paceRespect ||
      (entry.patientState?.trustLevel ?? 0) >= 60
    )
    .slice(0, 4)
    .map((entry) => `“${entry.question}” favoreció mayor apertura o continuidad.`);

  const closingMoments = scoredHistory
    .filter((entry) =>
      entry.analysis?.categories?.judgment ||
      entry.analysis?.categories?.rushedAdvice ||
      entry.analysis?.categories?.prematureInterpretation ||
      entry.analysis?.categories?.pressure ||
      (entry.analysis?.categories?.repeatedQuestion && !entry.analysis?.categories?.goodClosure) ||
      (entry.analysis?.categories?.prematureClosure && !entry.analysis?.categories?.goodClosure)
    )
    .slice(0, 4)
    .map((entry) => `“${entry.question}” pudo aumentar defensa, cierre o sensación de presión.`);

  const trustLabels = {
    closed: "baja/cerrada",
    cautious: "cautelosa",
    open: "abierta",
    reflective: "reflexiva"
  };

  return {
    caseName: caseItem.name,
    turnCount,
    evaluationStatus: isLimitedEvaluation ? "limited" : "complete",
    isEvaluable: true,
    isLimitedEvaluation,
    generalScore,
    trust: {
      initial: initialTrust,
      final: finalTrust,
      delta: trustDelta,
      stage: trustStage,
      label: trustLabels[trustStage]
    },
    criteria,
    objectiveEvaluation,
    reformulationSuggestions,
    skillClassification,
    therapeuticApproach: isLimitedEvaluation ? null : therapeuticApproach,
    guidedInterventionFeedback,
    strengths: strengths.length ? strengths : ["Realizaste una primera intervención observable, aunque todavía insuficiente para una evaluación robusta."],
    improvements,
    bondMoments: bondMoments.length ? bondMoments : ["No se observaron momentos claros de aumento de apertura; prioriza validación y preguntas abiertas."],
    closingMoments: closingMoments.length ? closingMoments : ["No se observaron intervenciones claramente cerradoras o juzgadoras."],
    summary:
      isLimitedEvaluation
        ? `Retroalimentación limitada: se registró ${turnCount} intervención con ${caseItem.name}. Se requiere más material conversacional para evaluar habilidades clínicas con solidez.`
        : `Se realizaron ${turnCount} intervenciones con ${caseItem.name}. La entrevista mostró ${memory.openQuestions} pregunta(s) abierta(s), ${memory.validation} validación(es), ${memory.contextExploration} exploración(es) contextuales, ${memory.followUp} seguimiento(s) conversacionales y una apertura final ${trustLabels[trustStage]}.`,
    nextSuggestions: [
      "Ensaya un encuadre inicial breve antes de explorar el motivo de consulta.",
      "Formula una hipótesis solo como pregunta tentativa, no como conclusión.",
      "Lleva la conversación desde relato general hacia emoción, contexto y recursos.",
      "Comparte estos resultados con supervisión docente para recibir orientación académica."
    ],
    ethicalNotice:
      "Informe formativo basado en una simulación con datos ficticios. No corresponde a diagnóstico, tratamiento ni intervención clínica real."
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

function limitCriterionForSparseEvidence(criterion) {
  const score = Math.min(criterion.score || 0, 1);
  return {
    ...criterion,
    score,
    level: level(score),
    levelLabel: labelFor(score)
  };
}

function limitObjectiveForSparseEvidence(item) {
  if (!item || item.score <= 0) return item;
  return {
    ...item,
    score: Math.min(item.score, 1),
    status: "parcialmente observado",
    level: "partial",
    levelLabel: "Parcialmente observado"
  };
}

function evaluateLearningObjectives({ caseItem, memory, history }) {
  const objectives = caseItem.learningObjectives || caseItem.objectives || [];
  return objectives.map((objective) => {
    const score = scoreObjective(objective, memory, history);
    const status = score >= 2 ? "logrado" : score >= 1 ? "parcialmente logrado" : "no abordado";
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
    checks.push(memory.openQuestions >= 1 || memory.followUp >= 1);
  }
  if (includesAnyObjective(text, ["familia", "familiar", "red", "apoyo", "recursos", "contexto", "responsabilidades", "pares"])) {
    checks.push(memory.contextExploration >= 1 || memory.family >= 1 || memory.support >= 1);
  }
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
  if (includesAnyObjective(text, ["cerrar", "cierre", "continuidad", "proxima"])) {
    checks.push(memory.closure >= 1 || memory.continuityAgreement >= 1);
  }
  if (includesAnyObjective(text, ["evitar", "no entregar", "no idealizar", "no patologizar", "sin apresurar"])) {
    checks.push(memory.rushedAdvice === 0 && memory.prematureInterpretation === 0 && memory.judgment === 0);
  }
  if (includesAnyObjective(text, ["riesgo", "etica", "derivacion"])) {
    checks.push(memory.riskExploration >= 1 || memory.framing >= 1);
  }

  if (!checks.length) {
    checks.push(memory.openQuestions >= 1 || memory.validation >= 1 || memory.contextExploration >= 1);
  }

  const hits = checks.filter(Boolean).length;
  if (hits === checks.length && hits > 0) return 2;
  if (hits > 0 || history.length >= 4) return 1;
  return 0;
}

function buildReformulationSuggestions(history, caseItem) {
  const suggestions = [];
  const questions = history.map((entry) => entry.question || "");
  const firstJudgment = history.find((entry) => entry.analysis?.categories?.judgment);
  const firstAdvice = history.find((entry) => entry.analysis?.categories?.rushedAdvice);
  const firstClosed = history.find((entry) => entry.analysis?.categories?.closedQuestion && !entry.analysis?.categories?.openQuestion);

  if (firstJudgment) {
    suggestions.push({
      insteadOf: firstJudgment.question,
      tryThis: suggestionByCase(caseItem.id, "judgment")
    });
  }
  if (firstAdvice) {
    suggestions.push({
      insteadOf: firstAdvice.question,
      tryThis: "Antes de pensar en soluciones, ¿podrías contarme cómo has estado viviendo esto?"
    });
  }
  if (firstClosed) {
    suggestions.push({
      insteadOf: firstClosed.question,
      tryThis: "¿Cómo ha sido para ti vivir esta situación en el día a día?"
    });
  }
  if (!questions.some((question) => normalizeForFeedback(question).includes("familia")) && caseItem.id !== "miguel") {
    suggestions.push({
      insteadOf: "Pregunta general sin contexto familiar.",
      tryThis: "¿Cómo se vive esto en tu casa o con las personas cercanas a ti?"
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      insteadOf: "Pregunta amplia: ¿qué te pasa?",
      tryThis: suggestionByCase(caseItem.id, "open")
    });
  }

  return suggestions.slice(0, 3);
}

function buildSkillClassification(memory) {
  return [
    ["Saludo", memory.greeting],
    ["Encuadre", memory.framing],
    ["Pregunta abierta", memory.openQuestions],
    ["Pregunta cerrada", memory.closedQuestions],
    ["Validación", memory.validation],
    ["Reflejo o resumen", memory.empathicSummary],
    ["Seguimiento contextual", memory.followUp],
    ["Familia/contexto", memory.family],
    ["Emoción", memory.emotion],
    ["Motivo de consulta", memory.consultationReason],
    ["Cierre", memory.closure],
    ["Posible juicio", memory.judgment],
    ["Consejo prematuro", memory.rushedAdvice],
    ["Ética/riesgo", memory.riskExploration]
  ]
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({ label, count }));
}

function suggestionByCase(caseId, type) {
  if (type === "judgment") {
    const byCase = {
      tomas: "¿Qué lugar ocupa el juego para ti cuando estás en la casa?",
      camila: "¿Qué pasa contigo cuando sientes que tienes que estar disponible para todos?",
      marcos: "¿Cómo notas que el cansancio del trabajo se mete en tu vida fuera de la pega?",
      valentina: "¿Qué ocurre contigo cuando intentas descansar y aparece la culpa?",
      daniela: "¿Cómo conviven el amor por tu hijo y el cansancio que estás sintiendo?"
    };
    return byCase[caseId] || "¿Cómo estás viviendo esto, sin tener que justificarlo ahora?";
  }

  const byCase = {
    tomas: "¿Qué te gustaría que entienda sobre el computador y lo que pasa fuera de él?",
    camila: "¿En qué momentos notas más fuerte la culpa cuando intentas poner un límite?",
    marcos: "¿Qué te preocupa de llegar a la casa con tan poca energía?",
    valentina: "¿Cómo se siente para ti parar cuando todavía quedan pendientes?",
    daniela: "¿Qué parte de todo esto te pesa más durante el día?"
  };
  return byCase[caseId] || "¿Qué sería importante que entienda de lo que estás viviendo?";
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
