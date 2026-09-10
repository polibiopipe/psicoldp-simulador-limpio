import { FEEDBACK_BASIS_VERSION, getAcademicCriterion } from "../data/feedbackAcademicBasis.js";
import { detectFeedbackSignals, hasPatientBoundarySignal, normalizeFeedbackText } from "./feedbackSignals.js";
export { hasPatientBoundarySignal, hasAutonomyRespect, isBoundaryPressure, isFormalOpenQuestion } from "./feedbackSignals.js";

const SESSION_CRITERIA = {
  1: {
    focus: "Ingreso, alianza y exploración inicial",
    references: [
      "Fundamentos de la intervención clínica",
      "Fundamentos de evaluación psicológica en adultos"
    ],
    criteria: [
      "Encuadre inicial",
      "Alianza terapéutica",
      "Escucha y validación",
      "Motivo de consulta explícito e implícito",
      "Antecedentes iniciales",
      "Riesgo si emerge",
      "No apresurar diagnóstico"
    ],
    nextStep:
      "En la próxima sesión conviene profundizar cronología del malestar, antecedentes relevantes y red de apoyo."
  },
  2: {
    focus: "Formulación clínica y planificación",
    references: [
      "Diseño y planificación de intervenciones",
      "Fundamentos de evaluación psicológica en adultos"
    ],
    criteria: [
      "Organización del motivo de consulta",
      "Hipótesis clínica inicial",
      "Sintomatología y antecedentes relevantes",
      "Factores contextuales, socioculturales y redes",
      "Objetivos preliminares",
      "Decisión sobre evaluación complementaria si corresponde"
    ],
    nextStep:
      "Conviene co-construir un foco de trabajo y precisar si se requiere evaluación complementaria."
  },
  3: {
    focus: "Intervención y técnica",
    references: ["Estrategias y técnicas de intervención clínica"],
    criteria: [
      "Coherencia entre enfoque y técnica",
      "Pertinencia de preguntas o intervenciones",
      "Adaptación al caso",
      "Cuidado ético",
      "No aplicar técnicas de manera mecánica"
    ],
    nextStep:
      "El siguiente paso formativo es sostener una técnica coherente con el caso y revisar su efecto."
  },
  4: {
    focus: "Evaluación, seguimiento, cierre o derivación",
    references: [
      "Evaluación y seguimiento de las intervenciones",
      "Informe psicológico"
    ],
    criteria: [
      "Monitoreo del proceso y resultados",
      "Revisión de objetivos",
      "Indicadores de cambio",
      "Decisión clínica justificada",
      "Co-construcción de criterios con el consultante",
      "Lenguaje claro y ético"
    ],
    nextStep:
      "Corresponde justificar cierre, continuidad, derivación o seguimiento con criterios observables."
  }
};

const ACTION_NEXT_STEPS = {
  continue_session:
    "La continuidad debe orientarse a profundizar motivo, antecedentes y objetivos de la sesión siguiente.",
  close_process:
    "Si cierras el proceso, explicita criterios de cierre y resguarda indicaciones de seguimiento.",
  refer:
    "La derivación requiere justificar el motivo, dispositivo sugerido y red de apoyo disponible.",
  risk_protocol:
    "Prioriza seguridad, supervisión y evaluación de red antes de cualquier continuidad simulada.",
  request_supervision:
    "Lleva a supervisión la hipótesis, los riesgos pendientes y la decisión clínica tomada.",
  apply_instruments:
    "Define qué información falta y por qué un instrumento sería pertinente y ético.",
  initial_feedback:
    "La devolución debe ser clara, comprensible y limitada a lo que permite la entrevista.",
  follow_up:
    "El seguimiento debe incluir indicadores observables y condiciones para reconsultar.",
  beyond_simulator:
    "La continuidad extendida requiere objetivos, límites del simulador y eventual trabajo en red."
};


export function getVisibleFeedbackTurns(conversation = []) {
  return (conversation || []).filter(entry => entry && !entry.isSessionPrelude && !entry.isPendingResponse && String(entry.question || "").trim());
}

export function analyzeConversationEvidence(conversation = []) {
  const actions = [];
  let previousPatientResponse = "";
  for (const turn of conversation || []) {
    if (!turn || turn.isPendingResponse) continue;
    const question = String(turn.question || "").trim();
    const patientAnswer = String(turn.answer || turn.patientResponse || "").trim();
    if (!turn.isSessionPrelude && question) {
      const flags = detectFeedbackSignals(question, previousPatientResponse);
      const criterionId = flags.boundaryPressure ? "autonomy" : flags.judgment ? "judgment" : flags.rushedAdvice ? "advice" : flags.prematureInterpretation ? "formulation" : flags.pressure ? "autonomy" : flags.risk ? "risk" : flags.autonomyRespect ? "autonomy" : flags.validation ? "validation" : flags.framing ? "framing" : flags.closure ? "closure" : flags.followUp || flags.facilitativeOpenQuestion ? "inquiry" : "reflection";
      const academic = getAcademicCriterion(criterionId);
      const concern = flags.boundaryPressure || flags.judgment || flags.rushedAdvice || flags.prematureInterpretation || flags.pressure;
      const evidenceStatus = concern ? "review" : criterionId === "reflection" ? "unclassified" : "textual_cue";
      const action = {
        index: actions.length + 1, turnId: turn.id || null, quote: question, previousPatientResponse, patientAnswer,
        ...flags, criterionId, criterion: academic.label, sourceIds: academic.sourceIds, sources: academic.sources,
        basisVersion: FEEDBACK_BASIS_VERSION, evidenceStatus,
        // Ordering is a UI review priority, not a clinical severity score.
        reviewPriority: flags.boundaryPressure || flags.judgment || flags.pressure ? 3 : flags.risk || concern ? 2 : evidenceStatus === "textual_cue" ? 1 : 0,
        recognizedSkill: recognizedLabel(flags, criterionId),
        formativeReading: reading(flags, academic, previousPatientResponse),
        possibleEffect: observedResponse(patientAnswer),
        suggestion: suggestion(flags, academic, previousPatientResponse),
        reformulation: reformulation(flags, previousPatientResponse),
        reflectionQuestion: `Turno ${actions.length + 1}: ${academic.reflection}`,
        uncertainty: "Indicios textuales para revisión: no equivalen a una calificación de competencia ni demuestran un efecto causal."
      };
      actions.push(action);
    }
    if (patientAnswer) previousPatientResponse = patientAnswer;
  }
  return actions;
}

export function buildSessionFeedback({ sessionNumber = 1, selectedCase = null, caseItem = null, conversation = [], clinicalDecision = null, studentPlan = null, preSessionPlan = null, selectedApproach = null, report = null } = {}) {
  const n = Math.min(Math.max(Number(sessionNumber) || 1, 1), 4);
  const sessionCriteria = SESSION_CRITERIA[n];
  const observedActions = analyzeConversationEvidence(conversation);
  const evidenceLevel = resolveEvidenceLevel(observedActions);
  const concerns = prioritizeFeedbackActions(observedActions.filter(item => item.evidenceStatus === "review"));
  const promising = observedActions.filter(item => item.evidenceStatus === "textual_cue" && item.criterionId !== "risk");
  const strengths = promising.slice(0, 3).map(item => `Turno ${item.index}: indicio de ${item.criterion.toLowerCase()} en “${item.quote}”. Contrasta su recepción con la respuesta del paciente.`);
  if (!strengths.length && observedActions.length) strengths.push("No se identificaron indicios suficientemente específicos para destacar una fortaleza. Revisa los turnos sin clasificar con tu docente.");
  const priorityImprovements = concerns.slice(0, 3).map(item => `Turno ${item.index}, “${item.quote}”: ${item.suggestion}`);
  const unknown = observedActions.find(item => item.evidenceStatus === "unclassified");
  if (!priorityImprovements.length && unknown) priorityImprovements.push(`Turno ${unknown.index}, “${unknown.quote}”: explica qué buscabas explorar; el análisis textual no permite identificar una habilidad específica.`);
  const top = concerns[0] || promising[0] || observedActions[0];
  const pendingAreas = [];
  if (!observedActions.some(item => item.framing)) pendingAreas.push("Encuadre: no se identificó una explicación explícita en este registro; revisa si se realizó antes.");
  if (!observedActions.some(item => item.followUp)) pendingAreas.push("Seguimiento: selecciona una respuesta del paciente e identifica qué dato necesitarías aclarar.");
  const plan = studentPlan || preSessionPlan;
  if (plan?.evaluationObjective || plan?.objective) pendingAreas.push(`Objetivo declarado: “${plan.evaluationObjective || plan.objective}”. Selecciona los turnos que permiten valorar su cumplimiento; no se infiere por la etapa de sesión.`);
  const nextSessionPriorities = top ? [top.reflectionQuestion, `Ensaya una alternativa para el turno ${top.index} y contrasta qué información necesitarías observar para valorar su efecto.`] : ["Realiza una intervención y revisa la respuesta antes de evaluar el encuentro."];
  if (clinicalDecision?.action && ACTION_NEXT_STEPS[clinicalDecision.action]) nextSessionPriorities.push(ACTION_NEXT_STEPS[clinicalDecision.action]);
  const references = [...new Map(observedActions.flatMap(item => item.sources).map(source => [source.id, source])).values()];
  const name = (selectedCase || caseItem)?.name || report?.caseName || "el paciente";
  const summary = `Se registraron ${observedActions.length} intervenciones con ${name}; ${evidenceLevel.distinctCount} diferentes. Foco previsto de la sesión ${n}: ${sessionCriteria.focus.toLowerCase()}. Su cumplimiento debe contrastarse con el diálogo.`;
  return {
    evidenceLevel, level: evidenceLevel.key, levelLabel: evidenceLevel.label, levelDescription: evidenceLevel.description,
    basisVersion: FEEDBACK_BASIS_VERSION, assessmentKind: "formative_textual_review", sessionSummary: summary, briefSummary: summary,
    observedActions, priorityActions: prioritizeFeedbackActions(observedActions).slice(0, 4), strengths,
    priorityImprovements, improvements: priorityImprovements, pendingAreas, nextSessionPriorities,
    nextStep: nextSessionPriorities[0], formativeCriteria: sessionCriteria.criteria,
    referencesUsed: references.map(source => `${source.label}. ${source.title}`), academicReferences: references,
    selectedApproach: selectedApproach?.label || "",
    evidenceNote: `Lectura de la conversación registrada, incluidos antecedentes de apertura. ${evidenceLevel.description} Las fuentes fundamentan los criterios educativos; no validan automáticamente cada detección.`,
    metacognitivePrompt: top?.reflectionQuestion || "¿Qué quieres practicar en el próximo encuentro?"
  };
}

export function prioritizeFeedbackActions(actions = []) {
  return [...actions].sort((a, b) => b.reviewPriority - a.reviewPriority || a.index - b.index);
}

function resolveEvidenceLevel(actions) {
  const distinctCount = new Set(actions.map(item => normalizeFeedbackText(item.quote))).size;
  const meaningful = new Set(actions.filter(item => item.evidenceStatus !== "unclassified").map(item => normalizeFeedbackText(item.quote))).size;
  // No count certifies sufficiency or competence. These describe available material only.
  const key = !actions.length ? "not_evaluable" : meaningful <= 3 ? "very_preliminary" : "limited";
  const labels = { not_evaluable: "No evaluable", very_preliminary: "Evidencia muy preliminar", limited: "Evidencia limitada" };
  return { key, label: labels[key], distinctCount, meaningfulCount: meaningful, description: !actions.length ? "No hay intervenciones del estudiante para analizar." : `Se reconocen indicios en ${meaningful} intervenciones diferentes. Las repeticiones no aumentan la evidencia; la suficiencia y la competencia requieren valoración docente.` };
}

function recognizedLabel(flags, id) {
  if (flags.boundaryPressure) return "Posible presión sobre un límite del paciente";
  if (flags.judgment) return "Lenguaje potencialmente juzgador";
  if (flags.rushedAdvice) return "Indicación cuyo contexto debe revisarse";
  if (flags.prematureInterpretation) return "Hipótesis expresada como conclusión";
  if (flags.pressure) return "Posible insistencia";
  if (id === "reflection") return "Intención no determinada por el análisis textual";
  return `Indicio de ${getAcademicCriterion(id).label.toLowerCase()}`;
}

function reading(flags, criterion, previous) {
  const mixed = flags.mixedMessage ? "La frase combina una señal de comprensión con contenido que requiere revisión; no se cuenta como validación. " : "";
  if (flags.boundaryPressure) return `${mixed}La intervención sigue al límite “${previous}”. Revisa si la insistencia está justificada por el contexto o requiere reparación.`;
  return mixed + criterion.rationale;
}

function observedResponse(answer) {
  if (!answer) return "No hay una respuesta posterior registrada; no se puede valorar la recepción.";
  const text = normalizeFeedbackText(answer);
  if (hasPatientBoundarySignal(answer) || /no me (entiendes|comprendes)|me siento (juzgad|presionad)|no es (eso|asi)|no se si es tan simple/.test(text)) return `La respuesta posterior expresa reserva o desacuerdo: “${answer}”. Revisa el desajuste; no demuestra por sí sola que la intervención lo causara.`;
  if (/me (siento|senti) (escuchad|comprendid)|eso me acomoda|gracias por (entender|escuchar)|si,? (eso|me hace sentido)/.test(text)) return `La respuesta posterior incluye una señal de aceptación: “${answer}”. Corrobora el significado sin equiparar acuerdo con beneficio clínico.`;
  return `Respuesta posterior: “${answer}”. Este fragmento permite revisar la recepción, pero no atribuir una mejoría o deterioro clínico.`;
}

function suggestion(flags, criterion, previous) {
  if (flags.boundaryPressure) return `Vuelve al límite expresado (“${previous}”) y ofrece elegir otro foco; si hay una razón de seguridad para insistir, explicítala y revísala con supervisión.`;
  if (flags.judgment) return "Retira la atribución de culpa o la descalificación de esta frase y pregunta por la experiencia concreta que necesitas comprender.";
  if (flags.rushedAdvice) return "Revisa este consejo: identifica si el paciente pidió orientación, qué alternativas se exploraron y cómo puede decidir sobre la propuesta.";
  if (flags.prematureInterpretation) return "Presenta esta hipótesis como tentativa; indica el dato que la sostiene y pregunta qué parte no encaja.";
  return criterion.reflection;
}

function reformulation(flags, previous) {
  if (flags.boundaryPressure || flags.autonomyRespect) return /nombre/i.test(previous) ? "No necesitas decir el nombre. ¿Prefieres abordar otro aspecto o dejar este tema por ahora?" : "Podemos dejar ese tema por ahora. ¿Sobre qué te gustaría seguir hablando?";
  if (flags.judgment) return "Quiero revisar cómo lo dije. ¿Qué necesitaría comprender mejor de tu experiencia?";
  if (flags.rushedAdvice) return "¿Quieres que exploremos primero lo que has intentado y después valoremos opciones juntos?";
  if (flags.prematureInterpretation) return "Tengo una hipótesis, pero necesito contrastarla contigo. ¿Qué parte de lo que planteé encaja y qué parte no?";
  if (flags.risk) return "Revisa con tu docente cómo completar la exploración de seguridad según el contexto y el protocolo del caso; una frase aislada no sustituye esa evaluación.";
  if (previous && (flags.followUp || flags.validation || flags.facilitativeOpenQuestion)) return `Punto de partida: el paciente dijo “${previous}”. Reformula retomando un dato de ese fragmento y permite que corrija tu comprensión.`;
  return "Explica primero tu intención en este turno y el dato del paciente al que responde; con esa información podrás ensayar una alternativa pertinente.";
}
