import { getPatientMasterRecord } from "../data/patients/index.js";
import { SESSION_COUNT_LIMITS, getPlannedSessionCount } from "./clinicalPreparation.js";

export const CLINICAL_DECISION_OPTIONS = [
  {
    value: "continue_evaluation",
    label: "Continuar evaluacion clinica",
    shortLabel: "Continuar evaluacion",
    description: "Aun falta informacion relevante antes de intervenir o cerrar."
  },
  {
    value: "request_complementary_evaluation",
    label: "Solicitar evaluacion complementaria",
    shortLabel: "Evaluacion complementaria",
    description: "Se requiere un informe externo simulado para contrastar o profundizar hipotesis."
  },
  {
    value: "start_intervention_design",
    label: "Iniciar diseno de intervencion",
    shortLabel: "Diseno de intervencion",
    description: "Ya existe comprension clinica suficiente para proponer objetivos y plan aplicado."
  },
  {
    value: "reformulate_hypothesis",
    label: "Reformular hipotesis clinica",
    shortLabel: "Reformulacion",
    description: "La informacion disponible obliga a ajustar la comprension inicial del caso."
  },
  {
    value: "close_or_refer",
    label: "Cerrar proceso o derivar",
    shortLabel: "Cierre o derivacion",
    description: "La informacion disponible permite cerrar pedagogicamente o justificar derivacion."
  },
  {
    value: "additional_evaluation_session",
    label: "Continuar con una sesion adicional de evaluacion",
    shortLabel: "Sesion adicional",
    description: "Se justifica otra sesion evaluativa antes de intervenir, cerrar o derivar."
  }
];

const LEGACY_DECISION_LABELS = {
  close_process: { shortLabel: "Cierre", label: "Cerrar el proceso simulado" },
  continue_session: { shortLabel: "Continuidad", label: "Agendar una nueva sesion" },
  refer: { shortLabel: "Derivacion", label: "Derivar a otro profesional o dispositivo" },
  risk_protocol: { shortLabel: "Riesgo", label: "Activar protocolo de riesgo" },
  request_supervision: { shortLabel: "Supervision", label: "Solicitar supervision" },
  apply_instruments: { shortLabel: "Evaluacion complementaria", label: "Solicitar evaluacion complementaria" },
  initial_feedback: { shortLabel: "Devolucion", label: "Hacer devolucion inicial" },
  follow_up: { shortLabel: "Seguimiento", label: "Recomendar seguimiento" },
  beyond_simulator: { shortLabel: "Continuidad adicional", label: "Continuidad mas alla del ciclo propuesto" }
};

const NEXT_SESSION_ACTIONS = new Set([
  "continue_evaluation",
  "additional_evaluation_session",
  "continue_session"
]);

const COMPLEMENTARY_EVALUATION_ACTIONS = new Set([
  "continue_evaluation",
  "request_complementary_evaluation",
  "reformulate_hypothesis",
  "additional_evaluation_session",
  "apply_instruments"
]);

const FALLBACK_SESSION_PLAN = {
  maxSessions: SESSION_COUNT_LIMITS.max,
  expectedRange: {
    minimum: 1,
    recommended: 4,
    maximum: SESSION_COUNT_LIMITS.max
  },
  expectedSessions: {
    minimum: 1,
    maximum: SESSION_COUNT_LIMITS.max,
    recommended: 4
  },
  continueIf: [
    "El motivo de consulta aun no esta delimitado.",
    "No se han explorado red de apoyo, recursos o riesgo.",
    "Quedan temas relevantes abiertos para una siguiente sesion."
  ],
  closeIf: [
    "El motivo de consulta queda claro.",
    "No aparecen indicadores de riesgo actual.",
    "Se acuerdan pasos realistas y limites del proceso simulado."
  ],
  referIf: [
    "Riesgo vital o ideacion suicida activa.",
    "Violencia, vulneracion o deterioro agudo.",
    "Necesidad de atencion especializada fuera del simulador."
  ],
  riskProtocolIf: [
    "Riesgo vital actual.",
    "Plan suicida o perdida de control.",
    "Violencia actual o amenaza inminente."
  ],
  sessionGoals: {
    session1: ["Encuadre", "Motivo de consulta", "Estado emocional", "Riesgo y apoyos"],
    session2: ["Historia del problema", "Contexto familiar/social", "Patrones de afrontamiento"],
    session3: ["Recursos", "Hipotesis inicial", "Objetivos breves"],
    session4: ["Sintesis", "Cierre", "Derivacion o continuidad externa"]
  },
  betweenSessions: {
    afterSession1: "El paciente puede volver con mayor confianza si hubo encuadre y escucha.",
    afterSession2: "El paciente puede profundizar si se sintio respetado.",
    afterSession3: "El paciente puede reconocer patrones sin que exista resolucion completa.",
    afterSession4: "El paciente puede aceptar cierre, derivacion o continuidad externa."
  }
};

export function getClinicalSessionPlan(caseItem) {
  const record = getPatientMasterRecord(caseItem?.id);
  return record?.sessionPlan || record?.clinicalPlan || FALLBACK_SESSION_PLAN;
}

export function buildInitialClinicalDecision({
  sessionNumber = 1,
  sessionPlan = FALLBACK_SESSION_PLAN,
  preSessionPlan = null
} = {}) {
  const expected = getExpectedSessions(sessionPlan);
  const plannedTotal = getPlannedSessionCount(preSessionPlan, expected.recommended || SESSION_COUNT_LIMITS.defaultValue);
  const recommended = clampNumber(plannedTotal, SESSION_COUNT_LIMITS.min, SESSION_COUNT_LIMITS.max);
  const shouldContinue = sessionNumber < recommended;

  return {
    action: shouldContinue ? "continue_evaluation" : "close_or_refer",
    proposedSessions: shouldContinue ? recommended : sessionNumber,
    justification: "",
    knownInformation: "",
    missingInformation: "",
    ethicalConsiderations: "",
    nextSessionObjectives: "",
    pendingRisks: "",
    createdAt: new Date().toISOString()
  };
}

export function normalizeClinicalDecision(
  decision = {},
  sessionPlan = FALLBACK_SESSION_PLAN,
  sessionNumber = 1,
  preSessionPlan = null
) {
  const expected = getExpectedSessions(sessionPlan);
  const action = normalizeDecisionAction(decision.action);
  const plannedTotal = getPlannedSessionCount(preSessionPlan, expected.recommended || SESSION_COUNT_LIMITS.defaultValue);
  const minimumTotal = decisionAllowsNextSession(action)
    ? Math.min(SESSION_COUNT_LIMITS.max, sessionNumber + 1)
    : SESSION_COUNT_LIMITS.min;
  const maximumTotal = SESSION_COUNT_LIMITS.max;
  const proposedSessions = clampNumber(
    Number(decision.proposedSessions) || plannedTotal || expected.recommended || minimumTotal,
    minimumTotal,
    maximumTotal
  );

  return {
    action,
    proposedSessions,
    justification: String(decision.justification || "").trim(),
    knownInformation: String(decision.knownInformation || "").trim(),
    missingInformation: String(decision.missingInformation || "").trim(),
    ethicalConsiderations: String(decision.ethicalConsiderations || "").trim(),
    nextSessionObjectives: String(decision.nextSessionObjectives || "").trim(),
    pendingRisks: String(decision.pendingRisks || "").trim(),
    createdAt: decision.createdAt || new Date().toISOString()
  };
}

export function formatClinicalDecision(decision = {}) {
  const normalizedAction = normalizeDecisionAction(decision.action);
  const option = getDecisionOption(normalizedAction);
  return option?.shortLabel || option?.label || "Decision pendiente";
}

export function decisionAllowsNextSession(action = "") {
  return NEXT_SESSION_ACTIONS.has(normalizeDecisionAction(action));
}

export function decisionAllowsComplementaryEvaluation(action = "") {
  return COMPLEMENTARY_EVALUATION_ACTIONS.has(normalizeDecisionAction(action));
}

export function buildContinuityAgreement({ decision, sessionPlan, fallbackAgreement = "", sessionNumber = 1 } = {}) {
  const normalized = normalizeClinicalDecision(decision, sessionPlan, sessionNumber);
  const label = formatClinicalDecision(normalized);

  if (decisionAllowsNextSession(normalized.action)) {
    return [
      `Decision del estudiante: ${label}.`,
      `Propone un total de ${normalized.proposedSessions} sesion(es) dentro del simulador.`,
      normalized.justification ? `Justificacion: ${normalized.justification}` : "",
      normalized.knownInformation ? `Informacion clinica disponible: ${normalized.knownInformation}` : "",
      normalized.missingInformation ? `Informacion faltante: ${normalized.missingInformation}` : "",
      normalized.ethicalConsiderations ? `Riesgos o dilemas eticos: ${normalized.ethicalConsiderations}` : "",
      normalized.nextSessionObjectives ? `Objetivos siguientes: ${normalized.nextSessionObjectives}` : "",
      fallbackAgreement ? `Respuesta sugerida del paciente: ${fallbackAgreement}` : ""
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `Decision del estudiante: ${label}.`,
    `Sesiones propuestas: ${normalized.proposedSessions}.`,
    normalized.justification ? `Justificacion: ${normalized.justification}` : "",
    normalized.knownInformation ? `Informacion clinica disponible: ${normalized.knownInformation}` : "",
    normalized.missingInformation ? `Informacion faltante: ${normalized.missingInformation}` : "",
    normalized.ethicalConsiderations ? `Riesgos o dilemas eticos: ${normalized.ethicalConsiderations}` : "",
    normalized.nextSessionObjectives ? `Objetivos o pasos siguientes: ${normalized.nextSessionObjectives}` : "",
    normalized.pendingRisks ? `Riesgos o pendientes: ${normalized.pendingRisks}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function evaluateClinicalPlanDecision({
  decision,
  sessionPlan = FALLBACK_SESSION_PLAN,
  report = {},
  history = [],
  sessionNumber = 1,
  preSessionPlan = null,
  completedSessionCount = sessionNumber
} = {}) {
  const normalized = normalizeClinicalDecision(decision, sessionPlan, sessionNumber, preSessionPlan);
  const expected = getExpectedSessions(sessionPlan);
  const completedCount = Math.max(Number(completedSessionCount) || sessionNumber, sessionNumber);
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const hasRiskExploration = didExploreRisk(meaningfulHistory, report);
  const hasSupportExploration = didExploreSupport(meaningfulHistory, report);
  const hasClosure = didCloseSession(meaningfulHistory, report);
  const hasJustification = normalized.justification.length >= 24;
  const hasKnownInformation = normalized.knownInformation.length >= 20;
  const hasMissingInformation = normalized.missingInformation.length >= 20;
  const hasEthicalConsiderations = normalized.ethicalConsiderations.length >= 18 || normalized.pendingRisks.length >= 12;
  const hasObjectives = normalized.nextSessionObjectives.length >= 18;
  const hasPendingRiskNote = normalized.pendingRisks.length >= 12;
  const proposedInRange =
    normalized.proposedSessions >= (expected.minimum || 1) &&
    normalized.proposedSessions <= SESSION_COUNT_LIMITS.max;
  const strengths = [];
  const concerns = [];
  const recommendations = [];

  if (hasJustification) {
    strengths.push("Incluiste una justificacion clinica breve para la decision.");
  } else {
    concerns.push("La decision necesita una justificacion mas explicita basada en lo escuchado.");
  }

  if (hasKnownInformation) {
    strengths.push("Nombraste informacion clinica ya disponible.");
  } else {
    concerns.push("Falta explicitar que informacion clinica ya tienes.");
  }

  if (hasMissingInformation) {
    strengths.push("Identificaste informacion faltante antes de decidir.");
  } else {
    concerns.push("Falta registrar que informacion aun necesitas o por que ya no es necesaria.");
  }

  if (hasEthicalConsiderations) {
    strengths.push("Consideraste riesgos, dilemas eticos o aspectos contextuales.");
  } else {
    recommendations.push("Agrega riesgos, dilemas eticos o elementos contextuales que condicionan la decision.");
  }

  if (proposedInRange) {
    strengths.push("El numero de sesiones propuesto queda dentro del rango permitido para este proceso simulado.");
  } else {
    concerns.push("El numero de sesiones propuesto queda fuera del rango permitido para el prototipo.");
  }

  if (normalized.proposedSessions < completedCount) {
    concerns.push(`Ya existen ${completedCount} sesiones registradas; reducir el plan no debe borrar ni invalidar memoria clinica previa.`);
    recommendations.push("Mantener las sesiones realizadas como eventos historicos y ajustar solo las sesiones futuras o el cierre del proceso.");
  }

  if (hasRiskExploration || hasPendingRiskNote) {
    strengths.push("Consideraste riesgo o pendientes de seguridad en la planificacion.");
  } else {
    recommendations.push("Antes de cerrar o continuar, conviene dejar registrada una exploracion basica de riesgo y apoyos.");
  }

  if (hasSupportExploration) {
    strengths.push("La decision considera recursos o red de apoyo observados durante la entrevista.");
  } else {
    recommendations.push("Explora red de apoyo y recursos antes de decidir cierre, derivacion o continuidad.");
  }

  if (normalized.action === "close_process" && sessionNumber < (expected.minimum || 1)) {
    concerns.push("Cerrar en esta sesion parece apresurado para el minimo sugerido por el caso.");
  }

  if (normalized.action === "close_process" && !hasClosure) {
    concerns.push("Si decides cerrar, falta un cierre mas explicito con sintesis y proximos pasos.");
  }

  if (decisionAllowsNextSession(normalized.action) && !hasObjectives) {
    concerns.push("La continuidad requiere objetivos concretos para la siguiente sesion.");
  }

  if (normalized.action === "close_or_refer" || normalized.action === "refer" || normalized.action === "risk_protocol") {
    if (hasPendingRiskNote || hasRiskExploration) {
      strengths.push("La decision de cerrar o derivar queda vinculada a elementos observados.");
    } else {
      recommendations.push("Si corresponde derivar o cerrar, registra indicadores, red de apoyo y limites del proceso.");
    }
  }

  if (["request_complementary_evaluation", "reformulate_hypothesis", "start_intervention_design"].includes(normalized.action)) {
    if (hasObjectives) {
      strengths.push("Nombraste un siguiente paso formativo coherente con la decision elegida.");
    } else {
      concerns.push("Esta decision requiere explicitar que haras despues y para que.");
    }
  }

  if (normalized.action === "request_complementary_evaluation") {
    recommendations.push("La evaluacion complementaria debe justificarse por hipotesis, pertinencia etaria, limites eticos e integracion posterior.");
  }

  if (normalized.action === "start_intervention_design") {
    recommendations.push("Antes de intervenir, verifica que exista formulacion, objetivos, criterios de evaluacion y consideraciones eticas.");
  }

  const risky = (normalized.action === "close_process" && concerns.length >= 2) ||
    (normalized.action === "risk_protocol" && !hasPendingRiskNote && !hasRiskExploration);
  const level = risky ? "risky" : concerns.length === 0 ? "achieved" : concerns.length <= 2 ? "partial" : "needsWork";
  const levelLabel = {
    achieved: "Logrado",
    partial: "Parcialmente logrado",
    needsWork: "Por fortalecer",
    risky: "Riesgoso o apresurado"
  }[level];

  return {
    title: "Decision sobre continuidad del proceso",
    decisionLabel: formatClinicalDecision(normalized),
    decision: normalized,
    level,
    levelLabel,
    score: level === "achieved" ? 2 : level === "partial" ? 1 : level === "needsWork" ? 0.5 : 0,
    summary: buildDecisionSummary(normalized, level, expected),
    strengths,
    concerns,
    recommendations: recommendations.length ? recommendations : [
      "Mantener una justificacion breve, revisar riesgo y definir objetivos antes de avanzar."
    ],
    expectedSessions: expected,
    patientPlan: {
      continueIf: sessionPlan.continueIf || [],
      closeIf: sessionPlan.closeIf || [],
      referIf: sessionPlan.referIf || [],
      riskProtocolIf: sessionPlan.riskProtocolIf || []
    }
  };
}

function buildDecisionSummary(decision, level, expected) {
  if (decisionAllowsNextSession(decision.action)) {
    return `Propusiste continuar hasta ${decision.proposedSessions} sesion(es). La decision es ${level === "achieved" ? "clinicamente razonable" : "formativamente revisable"} segun tu justificacion, los objetivos y los datos explorados.`;
  }
  if (decision.action === "request_complementary_evaluation") {
    return "Propusiste solicitar evaluacion complementaria. La decision debe fundamentar pertinencia, hipotesis, edad, limites e integracion posterior.";
  }
  if (decision.action === "start_intervention_design") {
    return "Propusiste iniciar diseno de intervencion. Revisa que el plan derive de la entrevista, hipotesis, contexto y datos suficientes.";
  }
  if (decision.action === "reformulate_hypothesis") {
    return "Propusiste reformular hipotesis. Es pertinente cuando nuevos datos tensionan la comprension inicial del caso.";
  }
  if (decision.action === "close_or_refer" || decision.action === "close_process" || decision.action === "refer") {
    return "Propusiste cerrar o derivar. Revisa que la decision incluya sintesis, riesgo, red de apoyo, limites y proximos pasos.";
  }
  return "Propusiste una decision clinica formativa. Debe quedar justificada con datos de entrevista, etica y objetivos siguientes.";
}

function normalizeDecisionAction(action = "") {
  const value = String(action || "").trim();
  const knownActions = new Set(CLINICAL_DECISION_OPTIONS.map((option) => option.value));
  if (knownActions.has(value)) return value;
  if (value === "continue_session") return "continue_evaluation";
  if (value === "apply_instruments") return "request_complementary_evaluation";
  if (value === "close_process" || value === "refer" || value === "risk_protocol") return "close_or_refer";
  if (value === "request_supervision") return "reformulate_hypothesis";
  if (value === "initial_feedback" || value === "follow_up" || value === "beyond_simulator") return "start_intervention_design";
  return "continue_evaluation";
}

function getDecisionOption(action = "") {
  const normalizedAction = normalizeDecisionAction(action);
  return CLINICAL_DECISION_OPTIONS.find((item) => item.value === normalizedAction) || LEGACY_DECISION_LABELS[action];
}

function getExpectedSessions(sessionPlan = FALLBACK_SESSION_PLAN) {
  const expected = sessionPlan.expectedSessions || sessionPlan.expectedRange || FALLBACK_SESSION_PLAN.expectedSessions;
  return {
    minimum: expected.minimum || 1,
    recommended: expected.recommended || SESSION_COUNT_LIMITS.defaultValue,
    maximum: Math.max(expected.maximum || SESSION_COUNT_LIMITS.defaultValue, sessionPlan.maxSessions || 0, SESSION_COUNT_LIMITS.defaultValue)
  };
}

function didExploreRisk(history, report) {
  const riskText = /\b(riesgo|hacerte dano|hacerte algo|suicid|morir|no querer vivir|peligro|urgencia)\b/i;
  return history.some((entry) => riskText.test(entry.question || "")) ||
    (report.skillClassification || []).some((item) => normalize(item.label).includes("riesgo"));
}

function didExploreSupport(history, report) {
  const supportText = /\b(red|apoyo|cuentas|quien te ayuda|familia|amigos|pareja|recursos)\b/i;
  return history.some((entry) => supportText.test(entry.question || "")) ||
    (report.criteria || []).some((criterion) => criterion.id === "seguimientoContextual" && criterion.score > 0);
}

function didCloseSession(history, report) {
  const closureText = /\b(cerrar|cierre|terminamos|nos vemos|proxima sesion|hasta aqui|resumir|sintesis)\b/i;
  return history.some((entry) => closureText.test(entry.question || "")) ||
    (report.criteria || []).some((criterion) => criterion.id === "cierre" && criterion.score > 0);
}

function clampNumber(value, min, max) {
  const number = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, number));
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
