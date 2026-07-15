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
    strengths.push("Justificaste la solicitud con una razon clinica explicita.");
  } else if (normalized.justification.length >= 16) {
    recommendations.push("Iniciaste la justificacion del instrumento; conviene precisar pertinencia, limites y utilidad clinica.");
  } else if (normalized.justification.length > 0) {
    concerns.push("La justificacion esta iniciada, pero aun es demasiado breve para sostener la solicitud.");
  } else {
    concerns.push("La solicitud necesita explicar por que esta evaluacion es necesaria.");
  }

  if (normalized.hypothesis.length >= 28) {
    strengths.push("Vinculaste la solicitud con una hipotesis a explorar o contrastar.");
  } else if (normalized.hypothesis.length >= 14) {
    recommendations.push("Nombraste una hipotesis inicial; seria util formular mejor que se quiere contrastar.");
  } else if (normalized.hypothesis.length > 0) {
    concerns.push("La hipotesis esta iniciada, pero necesita mayor claridad clinica.");
  } else {
    concerns.push("Falta nombrar la hipotesis clinica que quieres contrastar.");
  }

  if (normalized.expectedInformation.length >= 24) {
    strengths.push("Definiste que informacion esperas obtener.");
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
    strengths.push("Consideraste pertinencia por edad y caracteristicas del caso.");
  } else if (normalized.agePertinence.length > 0) {
    recommendations.push("Mencionaste pertinencia del instrumento; conviene explicitar edad, contexto y limites de uso.");
  } else {
    concerns.push("Revisa si el instrumento es pertinente para la edad y caracteristicas del caso.");
  }

  if (normalized.integrationPlan.length >= 24) {
    strengths.push("Anticipaste como integraras los resultados al proceso.");
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
    title: "Solicitud de evaluacion complementaria",
    level,
    levelLabel: {
      coherent: "Coherente",
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
  const normalized = normalizeExternalReportIntegration(integration);
  const strengths = [];
  const gaps = [];

  if (normalized.newInformation.length >= 25) strengths.push("Identificaste informacion nueva aportada por el informe.");
  else gaps.push("Falta nombrar que informacion nueva aporta el informe.");

  if (normalized.hypothesisImpact.length >= 25) strengths.push("Relacionaste el informe con tu hipotesis clinica.");
  else gaps.push("Debes indicar si el informe confirma, modifica o tensiona la hipotesis.");

  if (normalized.interventionUse.length >= 25) strengths.push("Conectaste resultados con el diseno de intervencion.");
  else gaps.push("Falta explicar como el informe orientara el trabajo posterior.");

  if (normalized.ethicalRisks.length >= 20) strengths.push("Consideraste riesgos, limites o dilemas eticos.");
  else gaps.push("Conviene explicitar limites eticos del informe complementario.");

  if (normalized.limitations.length >= 20) strengths.push("Reconociste limitaciones del informe.");
  else gaps.push("Falta reconocer que el informe no entrega una verdad definitiva.");

  const level = gaps.length <= 1 ? "achieved" : gaps.length <= 3 ? "partial" : "needsWork";
  return {
    title: "Integracion del informe externo",
    level,
    levelLabel: {
      achieved: "Lograda",
      partial: "Parcial",
      needsWork: "Por fortalecer"
    }[level],
    strengths,
    gaps,
    summary:
      level === "achieved"
        ? "La integracion conecta hallazgos, hipotesis, limites y continuidad del proceso."
        : "La integracion aun debe vincular mejor informe, hipotesis, etica y plan de continuidad."
  };
}

export function evaluateInterventionDesign(design = {}) {
  const normalized = normalizeInterventionDesign(design);
  const strengths = [];
  const gaps = [];
  const fields = [
    ["caseUnderstanding", "comprension del caso", 35],
    ["clinicalFormulation", "formulacion clinica", 35],
    ["objectives", "objetivos de intervencion", 25],
    ["treatmentPlan", "plan de tratamiento o intervencion", 30],
    ["strategies", "estrategias clinicas", 25],
    ["processEvaluation", "evaluacion del proceso", 25],
    ["ethics", "consideraciones eticas", 20],
    ["reflexivity", "reflexividad del estudiante", 20],
    ["contextualIntegration", "integracion situada/contextual", 25],
    ["continuityDecision", "continuidad, cierre o derivacion", 20]
  ];

  for (const [key, label, minLength] of fields) {
    if (normalized[key].length >= minLength) strengths.push(`Incluiste ${label}.`);
    else gaps.push(`Falta desarrollar ${label}.`);
  }

  const level = gaps.length <= 2 ? "achieved" : gaps.length <= 5 ? "partial" : "needsWork";
  return {
    title: "Diseno de intervencion aplicado al caso",
    level,
    levelLabel: {
      achieved: "Consistente",
      partial: "En desarrollo",
      needsWork: "Insuficiente"
    }[level],
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    summary:
      level === "achieved"
        ? "El diseno se sostiene en formulacion, objetivos, estrategias, etica y evaluacion del proceso."
        : "El diseno requiere mas fundamentacion para funcionar como propuesta clinica aplicada al caso."
  };
}

function buildRequestSummary(level, instrument) {
  if (!instrument) return "Selecciona una evaluacion complementaria y fundamenta su pertinencia.";
  if (level === "coherent") {
    return `La solicitud de ${instrument.label} es formativamente coherente si se integra con entrevista y contexto.`;
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
