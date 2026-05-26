import { rubricCriteria, levelLabels } from "../data/rubrics.js";
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
  const memory = summarizeConversationMemory(history);
  const turnCount = history.length;
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
    framing: memory.framing >= 1 ? 2 : 0,
    openQuestions: memory.openQuestions >= 3 ? 2 : memory.openQuestions >= 1 ? 1 : 0,
    activeListening: memory.empathicSummary + memory.followUp >= 2 ? 2 : memory.empathicSummary + memory.followUp >= 1 ? 1 : 0,
    validation: memory.validation >= 2 ? 2 : memory.validation >= 1 ? 1 : 0,
    context: memory.contextExploration >= 3 ? 2 : memory.contextExploration >= 1 ? 1 : 0,
    paceRespect: memory.paceRespect >= 1 || (memory.openQuestions >= 2 && !hasJudgment) ? 2 : !hasJudgment ? 1 : 0,
    nonJudgment: !hasJudgment && memory.pressure === 0 ? 2 : 0.5,
    closure: memory.goodClosure >= 1 ? 2 : memory.closure >= 1 ? 1 : 0,
    caseCoherence: specificHits >= 2 ? 2 : specificHits >= 1 ? 1 : 0,
    noRush: !hasRushedAdvice && !hasJudgment && !hasPrematureInterpretation ? 2 : hasRushedAdvice || hasPrematureInterpretation ? 0.5 : 1
  };

  const criteria = rubricCriteria.map((criterion) => {
    const score = rawScores[criterion.id] ?? 0;
    return {
      ...criterion,
      score,
      level: level(score),
      levelLabel: labelFor(score)
    };
  });

  const strengths = [];
  const improvements = [];

  if (memory.framing) strengths.push("Presentaste algún encuadre o límite para ordenar la entrevista.");
  if (memory.openQuestions >= 2) strengths.push("Usaste preguntas abiertas que facilitaron mayor elaboración.");
  if (memory.validation) strengths.push("Incluiste validación emocional y un tono respetuoso.");
  if (memory.contextExploration >= 2) strengths.push("Exploraste dimensiones contextuales relevantes para el caso.");
  if (memory.empathicSummary || memory.followUp) strengths.push("Retomaste contenido del paciente ficticio y usaste seguimiento conversacional, favoreciendo continuidad.");
  if (trustDelta > 8) strengths.push(`La apertura del paciente aumentó durante la entrevista (+${trustDelta} puntos de confianza simulada).`);
  if (!hasJudgment) strengths.push("Evitaste juicios directos o etiquetas sobre el paciente ficticio.");

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

  const bondMoments = history
    .filter((entry) =>
      entry.analysis?.categories?.validation ||
      entry.analysis?.categories?.empathicSummary ||
      entry.analysis?.categories?.followUp ||
      entry.analysis?.categories?.paceRespect ||
      (entry.patientState?.trustLevel ?? 0) >= 60
    )
    .slice(0, 4)
    .map((entry) => `“${entry.question}” favoreció mayor apertura o continuidad.`);

  const closingMoments = history
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
    trust: {
      initial: initialTrust,
      final: finalTrust,
      delta: trustDelta,
      stage: trustStage,
      label: trustLabels[trustStage]
    },
    criteria,
    strengths: strengths.length ? strengths : ["Mantuviste la entrevista activa y generaste oportunidades de exploración."],
    improvements,
    bondMoments: bondMoments.length ? bondMoments : ["No se observaron momentos claros de aumento de apertura; prioriza validación y preguntas abiertas."],
    closingMoments: closingMoments.length ? closingMoments : ["No se observaron intervenciones claramente cerradoras o juzgadoras."],
    summary:
      turnCount === 0
        ? "La sesión terminó sin intervenciones registradas."
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
