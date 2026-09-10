import { reviewWrittenFields } from "./writtenWorkFeedback.js";
import { getClinicalInstrumentById } from "../data/clinicalWorkflow.js";

export const EXTERNAL_REPORT_ETHICAL_NOTE =
  "Este informe es simulado y tiene fines exclusivamente formativos. No constituye diagnostico real, no reemplaza evaluacion profesional y no reproduce material protegido de pruebas psicologicas.";

export const CLINICAL_DECISION_EXTENDED_ACTIONS = {
  continueEvaluation: "continue_evaluation",
  requestComplementaryEvaluation: "request_complementary_evaluation",
  startInterventionDesign: "start_intervention_design",
  reformulateHypothesis: "reformulate_hypothesis",
  closeOrRefer: "close_or_refer",
  additionalEvaluationSession: "additional_evaluation_session"
};

export function buildInitialComplementaryEvaluation() {
  return {
    instrumentId: "",
    justification: "",
    hypothesis: "",
    expectedInformation: "",
    agePertinence: "",
    integrationPlan: "",
    status: "draft",
    report: null,
    integration: buildInitialExternalReportIntegration(),
    createdAt: new Date().toISOString()
  };
}

export function buildInitialExternalReportIntegration() {
  return {
    newInformation: "",
    hypothesisImpact: "",
    interventionUse: "",
    ethicalRisks: "",
    limitations: "",
    nextDecision: ""
  };
}

export function buildInitialInterventionDesign() {
  return {
    caseUnderstanding: "",
    clinicalFormulation: "",
    objectives: "",
    treatmentPlan: "",
    strategies: "",
    processEvaluation: "",
    ethics: "",
    reflexivity: "",
    contextualIntegration: "",
    continuityDecision: ""
  };
}

export function normalizeComplementaryEvaluation(value = {}) {
  const base = buildInitialComplementaryEvaluation();
  return {
    ...base,
    ...value,
    instrumentId: String(value.instrumentId || "").trim(),
    justification: String(value.justification || "").trim(),
    hypothesis: String(value.hypothesis || "").trim(),
    expectedInformation: String(value.expectedInformation || "").trim(),
    agePertinence: String(value.agePertinence || "").trim(),
    integrationPlan: String(value.integrationPlan || "").trim(),
    status: value.status || "draft",
    report: value.report || null,
    integration: normalizeExternalReportIntegration(value.integration),
    createdAt: value.createdAt || base.createdAt
  };
}

export function normalizeExternalReportIntegration(value = {}) {
  return {
    ...buildInitialExternalReportIntegration(),
    newInformation: String(value?.newInformation || "").trim(),
    hypothesisImpact: String(value?.hypothesisImpact || "").trim(),
    interventionUse: String(value?.interventionUse || "").trim(),
    ethicalRisks: String(value?.ethicalRisks || "").trim(),
    limitations: String(value?.limitations || "").trim(),
    nextDecision: String(value?.nextDecision || "").trim()
  };
}

export function normalizeInterventionDesign(value = {}) {
  return {
    ...buildInitialInterventionDesign(),
    caseUnderstanding: String(value.caseUnderstanding || "").trim(),
    clinicalFormulation: String(value.clinicalFormulation || "").trim(),
    objectives: String(value.objectives || "").trim(),
    treatmentPlan: String(value.treatmentPlan || "").trim(),
    strategies: String(value.strategies || "").trim(),
    processEvaluation: String(value.processEvaluation || "").trim(),
    ethics: String(value.ethics || "").trim(),
    reflexivity: String(value.reflexivity || "").trim(),
    contextualIntegration: String(value.contextualIntegration || "").trim(),
    continuityDecision: String(value.continuityDecision || "").trim()
  };
}

export function evaluateComplementaryEvaluationRequest({
  request = {},
  caseItem = null,
  history = []
} = {}) {
  const normalized = normalizeComplementaryEvaluation(request);
  const instrument = getClinicalInstrumentById(normalized.instrumentId);
  const strengths = [];
  const concerns = [];
  const recommendations = [];
  const turnCount = history.filter((entry) => !entry.isSessionPrelude).length;
  const patientAge = parseAge(caseItem?.age);

  if (instrument) {
    strengths.push(`Seleccionaste ${instrument.label} para explorar ${instrument.area.toLowerCase()}.`);
  } else {
    concerns.push("Debes seleccionar una prueba, area o instrumento complementario.");
  }

  if (normalized.justification.length >= 35) {
    strengths.push("Registraste texto en la justificación; contrástalo con el dato del caso que motiva la solicitud.");
  } else if (normalized.justification.length >= 16) {
    recommendations.push("Iniciaste la justificacion del instrumento; conviene precisar pertinencia, limites y utilidad clinica.");
  } else if (normalized.justification.length > 0) {
    concerns.push("La justificacion esta iniciada, pero aun es demasiado breve para sostener la solicitud.");
  } else {
    concerns.push("La solicitud necesita explicar por que esta evaluacion es necesaria.");
  }

  if (normalized.hypothesis.length >= 28) {
    strengths.push("Registraste una hipótesis; falta contrastar qué hallazgo del caso la sostiene.");
  } else if (normalized.hypothesis.length >= 14) {
    recommendations.push("Nombraste una hipotesis inicial; seria util formular mejor que se quiere contrastar.");
  } else if (normalized.hypothesis.length > 0) {
    concerns.push("La hipotesis esta iniciada, pero necesita mayor claridad clinica.");
  } else {
    concerns.push("Falta nombrar la hipotesis clinica que quieres contrastar.");
  }

  if (normalized.expectedInformation.length >= 24) {
    strengths.push("Registraste información esperada; revisa cómo cambiaría tu decisión clínica.");
  } else if (normalized.expectedInformation.length >= 12) {
    recommendations.push(
      "Explicaste la informacion que esperas obtener, aunque puedes precisar como modificaria tu hipotesis clinica."
    );
  } else if (normalized.expectedInformation.length > 0) {
    concerns.push("La informacion esperada esta iniciada, pero necesita mayor desarrollo.");
  } else {
    concerns.push("Debes precisar que informacion esperas que aporte el informe.");
  }

  if (normalized.agePertinence.length >= 20 || isAgeCompatible(instrument, patientAge)) {
    strengths.push("Hay una referencia etaria o una justificación registrada. Revisa rango, población y límites del instrumento con supervisión.");
  } else if (normalized.agePertinence.length > 0) {
    recommendations.push("Mencionaste pertinencia del instrumento; conviene explicitar edad, contexto y limites de uso.");
  } else {
    concerns.push("Revisa si el instrumento es pertinente para la edad y caracteristicas del caso.");
  }

  if (normalized.integrationPlan.length >= 24) {
    strengths.push("Registraste un plan de integración; contrasta su relación con hipótesis y objetivos.");
  } else if (normalized.integrationPlan.length >= 12) {
    recommendations.push("Anticipaste un uso del informe; falta precisar como se integrara sin cerrar diagnostico.");
  } else if (normalized.integrationPlan.length > 0) {
    concerns.push("El plan de integracion esta iniciado, pero aun no muestra como usaras los resultados.");
  } else {
    concerns.push("Falta explicar como usaras los resultados sin convertirlos en conclusion automatica.");
  }

  if (turnCount < 3) {
    recommendations.push("Con pocas intervenciones, conviene justificar por que no basta con seguir entrevistando.");
  }

  if (instrument && !instrument.reportAvailable) {
    recommendations.push("Este instrumento queda registrado, pero el informe simulado completo se puede poblar mas adelante.");
  }

  const weak = concerns.length >= 3;
  const level = !instrument ? "missing" : weak ? "weak" : "coherent";

  return {
    title: "Registro de solicitud de evaluación complementaria",
    assessmentKind: "structure_only",
    level,
    levelLabel: {
      coherent: "Registro disponible para revisión",
      weak: "Requiere mejor justificacion",
      missing: "Incompleta"
    }[level],
    canGenerateReport: Boolean(instrument) && !weak,
    instrument,
    strengths,
    concerns,
    recommendations,
    summary: buildRequestSummary(level, instrument)
  };
}

export function buildSimulatedExternalReport({
  request = {},
  caseItem = null,
  history = [],
  sessionNumber = 1
} = {}) {
  const normalized = normalizeComplementaryEvaluation(request);
  const instrument = getClinicalInstrumentById(normalized.instrumentId);
  if (!instrument) return null;

  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const patientName = caseItem?.name || "Paciente simulado";
  const motive = caseItem?.motive || caseItem?.reason || "malestar consultado durante la entrevista";
  const latestPatientAnswer = interviewTurns.at(-1)?.answer || "";

  return {
    id: `external-report-${instrument.id}-${Date.now()}`,
    title: "Informe externo de evaluacion psicologica complementaria simulada",
    createdAt: new Date().toISOString(),
    caseData: {
      patientName,
      caseId: caseItem?.id || "",
      sessionNumber,
      instrument: instrument.label,
      type: instrument.type,
      area: instrument.area
    },
    referralReason: normalized.justification || `Profundizar ${instrument.area.toLowerCase()} en el caso de ${patientName}.`,
    requestedInstrument: {
      id: instrument.id,
      name: instrument.label,
      type: instrument.type,
      area: instrument.area,
      ageRange: instrument.ageRange,
      ethicalWarning: instrument.ethicalWarning
    },
    behavioralObservations: [
      `${patientName} se presenta colaborador/a dentro de un encuadre simulado y formativo.`,
      latestPatientAnswer
        ? `Durante la entrevista reciente aparecio como material relevante: "${truncate(latestPatientAnswer, 180)}".`
        : "La informacion disponible proviene principalmente de entrevista simulada y antecedentes del caso.",
      "No se reproducen items, protocolos ni puntajes protegidos de pruebas psicologicas."
    ],
    mainResults: buildNarrativeResults({ instrument, motive, interviewTurns }),
    clinicalInterpretation:
      `Los resultados narrativos sugieren integrar ${instrument.area.toLowerCase()} con la historia del problema, el contexto relacional y los recursos observados. No deben leerse como diagnostico cerrado.`,
    complementaryHypotheses: [
      normalized.hypothesis || "La hipotesis debe formularse con mayor precision a partir de entrevista e informe.",
      "La informacion complementaria puede orientar focos de exploracion, pero requiere contraste en sesion."
    ],
    recommendations: [
      "Devolver los hallazgos con lenguaje claro, tentativo y no patologizante.",
      "Integrar el informe con entrevista, red de apoyo, riesgos y contexto sociocultural.",
      "Definir si corresponde continuar evaluacion, reformular hipotesis o iniciar diseno de intervencion."
    ],
    limitations: [
      "Informe simulado elaborado para entrenamiento; no equivale a evaluacion real.",
      "No utiliza material protegido, baremos ni puntajes reales.",
      "Debe interpretarse junto con entrevista, observacion clinica y supervision docente."
    ],
    ethicalNote: EXTERNAL_REPORT_ETHICAL_NOTE
  };
}

export function evaluateExternalReportIntegration(integration = {}) {
  return { title: "Integración del informe externo", ...reviewWrittenFields(normalizeExternalReportIntegration(integration), [
    ["newInformation", "información nueva", "¿Qué hallazgo concreto del informe no estaba en la entrevista?"],
    ["hypothesisImpact", "efecto en la hipótesis", "¿Qué dato confirma o contradice la hipótesis y qué alternativa permanece abierta?"],
    ["interventionUse", "uso en la intervención", "¿Qué decisión cambiaría a partir de ese hallazgo y por qué?"],
    ["ethicalRisks", "consideraciones éticas", "¿Qué límite de interpretación o consentimiento corresponde a este caso?"],
    ["limitations", "limitaciones", "¿Qué no permite concluir este informe y qué necesitas contrastar?"]
  ]) };
}

export function evaluateInterventionDesign(design = {}) {
  return { title: "Diseño de intervención aplicado al caso", ...reviewWrittenFields(normalizeInterventionDesign(design), [
    ["caseUnderstanding", "comprensión del caso", "¿Qué citas del paciente sostienen tu descripción?"],
    ["clinicalFormulation", "formulación clínica", "¿Qué mecanismo propones, qué evidencia lo apoya y qué lo refutaría?"],
    ["objectives", "objetivos", "¿Qué cambio observable propone el paciente y cómo sabrían que ocurrió?"],
    ["treatmentPlan", "plan de intervención", "¿Cómo se conecta cada paso con la formulación y las preferencias del paciente?"],
    ["strategies", "estrategias", "¿Qué función cumple la técnica en el enfoque declarado y por qué es pertinente aquí?"],
    ["processEvaluation", "evaluación del proceso", "¿Qué indicador revisarías, cuándo y qué harías si no cambia?"],
    ["ethics", "consideraciones éticas", "¿Qué límites y decisiones de consentimiento dependen de este caso?"],
    ["reflexivity", "reflexividad", "¿Qué supuesto propio revisaste a partir de la conversación?"],
    ["contextualIntegration", "contexto", "¿Qué recurso o restricción del entorno modifica tu propuesta?"],
    ["continuityDecision", "continuidad, cierre o derivación", "¿Qué evidencia sostiene la decisión y qué condición haría cambiarla?"]
  ]) };
}

function buildRequestSummary(level, instrument) {
  if (!instrument) return "Selecciona una evaluacion complementaria y fundamenta su pertinencia.";
  if (level === "coherent") {
    return `La solicitud de ${instrument.label} tiene datos registrados para continuar el ejercicio. Esto no confirma la pertinencia clínica del instrumento.`;
  }
  return `La solicitud de ${instrument.label} requiere mejor justificacion antes de entregar un informe simulado.`;
}

function buildNarrativeResults({ instrument, motive, interviewTurns }) {
  const turnCount = interviewTurns.length;
  const base = [
    `El area evaluada se relaciona con ${instrument.area.toLowerCase()} y con el motivo observado: ${motive}.`,
    `La informacion disponible proviene de ${turnCount} turno(s) de entrevista simulada y debe ser considerada preliminar.`
  ];

  if (/riesgo|suicid|dano/i.test(instrument.area)) {
    return [
      ...base,
      "No se observan indicadores suficientes para concluir riesgo activo solo con este informe; cualquier senal debe explorarse directamente y con protocolo.",
      "Se recomienda registrar factores protectores, red de apoyo y condiciones de seguridad antes de decidir continuidad."
    ];
  }

  if (/famil/i.test(instrument.area)) {
    return [
      ...base,
      "Aparecen patrones relacionales y roles familiares que pueden sostener parte del malestar.",
      "La informacion debe ser trabajada con cuidado para evitar culpabilizar a figuras significativas."
    ];
  }

  if (/cogn|intelectual|razonamiento/i.test(instrument.area)) {
    return [
      ...base,
      "No se entrega puntaje ni perfil normativo; el informe solo orienta preguntas sobre funcionamiento y recursos.",
      "Si el foco cognitivo no aparece claramente en entrevista, conviene priorizar evaluacion clinica antes que pruebas amplias."
    ];
  }

  return [
    ...base,
    "Los hallazgos son compatibles con malestar subjetivo que requiere seguir integrando sintomas, contexto y recursos.",
    "Conviene evitar conclusiones diagnosticas cerradas y usar el informe como apoyo para formular preguntas nuevas."
  ];
}

function isAgeCompatible(instrument, age) {
  if (!instrument || !age) return false;
  if (/personas mayores/i.test(instrument.ageRange || "") && age < 55) return false;
  if (/adultos/i.test(instrument.ageRange || "") && age >= 18) return true;
  if (/adolescentes/i.test(instrument.ageRange || "") && age >= 14) return true;
  return true;
}

function parseAge(ageValue) {
  const match = String(ageValue || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function truncate(text, maxLength) {
  const value = String(text || "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}
