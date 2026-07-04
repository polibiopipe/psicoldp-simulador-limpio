import { getPatientMasterRecord } from "../data/patients/index.js";
import { SESSION_COUNT_LIMITS, getPlannedSessionCount } from "./clinicalPreparation.js";

export const CLINICAL_DECISION_OPTIONS = [
  {
    value: "close_process",
    label: "Cerrar el proceso simulado",
    shortLabel: "Cierre",
    description: "El caso puede cerrarse pedagogicamente con la informacion disponible."
  },
  {
    value: "continue_session",
    label: "Agendar una nueva sesion",
    shortLabel: "Continuidad",
    description: "El caso requiere una sesion adicional dentro del simulador."
  },
  {
    value: "refer",
    label: "Derivar a otro profesional o dispositivo",
    shortLabel: "Derivacion",
    description: "El caso requiere apoyo externo o especializado."
  },
  {
    value: "risk_protocol",
    label: "Activar protocolo de riesgo",
    shortLabel: "Riesgo",
    description: "Aparecen indicadores que exigen priorizar seguridad."
  },
  {
    value: "request_supervision",
    label: "Solicitar supervision",
    shortLabel: "Supervision",
    description: "El caso requiere revisar hipotesis o manejo con supervision docente."
  },
  {
    value: "apply_instruments",
    label: "Aplicar instrumentos antes de continuar",
    shortLabel: "Instrumentos",
    description: "La continuidad requiere evaluacion complementaria justificada."
  },
  {
    value: "initial_feedback",
    label: "Hacer devolucion inicial",
    shortLabel: "Devolucion",
    description: "Corresponde sintetizar comprension preliminar con el paciente."
  },
  {
    value: "follow_up",
    label: "Recomendar seguimiento",
    shortLabel: "Seguimiento",
    description: "Se sugiere monitoreo posterior o reingreso si reaparece malestar."
  },
  {
    value: "beyond_simulator",
    label: "Continuidad mas alla del ciclo propuesto",
    shortLabel: "Continuidad adicional",
    description: "El caso requiere continuidad posterior al ciclo definido para esta practica."
  }
];

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
    action: shouldContinue ? "continue_session" : "close_process",
    proposedSessions: shouldContinue ? recommended : sessionNumber,
    justification: "",
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
  const knownActions = new Set(CLINICAL_DECISION_OPTIONS.map((option) => option.value));
  const action = knownActions.has(decision.action) ? decision.action : "continue_session";
  const plannedTotal = getPlannedSessionCount(preSessionPlan, expected.recommended || SESSION_COUNT_LIMITS.defaultValue);
  const minimumTotal = action === "continue_session"
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
    nextSessionObjectives: String(decision.nextSessionObjectives || "").trim(),
    pendingRisks: String(decision.pendingRisks || "").trim(),
    createdAt: decision.createdAt || new Date().toISOString()
  };
}

export function formatClinicalDecision(decision = {}) {
  const normalizedAction = decision.action || "continue_session";
  const option = CLINICAL_DECISION_OPTIONS.find((item) => item.value === normalizedAction);
  return option?.shortLabel || option?.label || "Decision pendiente";
}

export function buildContinuityAgreement({ decision, sessionPlan, fallbackAgreement = "", sessionNumber = 1 } = {}) {
  const normalized = normalizeClinicalDecision(decision, sessionPlan, sessionNumber);
  const label = formatClinicalDecision(normalized);

  if (normalized.action === "continue_session") {
    return [
      `Decision del estudiante: ${label}.`,
      `Propone un total de ${normalized.proposedSessions} sesion(es) dentro del simulador.`,
      normalized.justification ? `Justificacion: ${normalized.justification}` : "",
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
  preSessionPlan = null
} = {}) {
  const normalized = normalizeClinicalDecision(decision, sessionPlan, sessionNumber, preSessionPlan);
  const expected = getExpectedSessions(sessionPlan);
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const hasRiskExploration = didExploreRisk(meaningfulHistory, report);
  const hasSupportExploration = didExploreSupport(meaningfulHistory, report);
  const hasClosure = didCloseSession(meaningfulHistory, report);
  const hasJustification = normalized.justification.length >= 24;
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

  if (proposedInRange) {
    strengths.push("El numero de sesiones propuesto queda dentro del rango permitido para este proceso simulado.");
  } else {
    concerns.push("El numero de sesiones propuesto queda fuera del rango permitido para el prototipo.");
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

  if (normalized.action === "continue_session" && !hasObjectives) {
    concerns.push("La continuidad requiere objetivos concretos para la siguiente sesion.");
  }

  if (normalized.action === "refer" || normalized.action === "risk_protocol") {
    if (hasPendingRiskNote || hasRiskExploration) {
      strengths.push("La decision de derivar o activar riesgo queda vinculada a elementos observados.");
    } else {
      concerns.push("Derivar o activar protocolo requiere nombrar los indicadores que sustentan esa decision.");
    }
  }

  if (["request_supervision", "apply_instruments", "initial_feedback", "follow_up"].includes(normalized.action)) {
    if (hasObjectives) {
      strengths.push("Nombraste un siguiente paso formativo coherente con la decision elegida.");
    } else {
      concerns.push("Esta decision requiere explicitar que haras despues y para que.");
    }
  }

  if (normalized.action === "beyond_simulator") {
    recommendations.push("Explicita que la continuidad posterior dependeria de reevaluacion clinica, objetivos pendientes y condiciones de cuidado.");
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
  if (decision.action === "continue_session") {
    return `Propusiste continuar hasta ${decision.proposedSessions} sesion(es). La decision es ${level === "achieved" ? "clinicamente razonable" : "formativamente revisable"} segun tu justificacion, los objetivos y los datos explorados.`;
  }
  if (decision.action === "close_process") {
    return `Propusiste cerrar el proceso simulado en la sesion ${decision.proposedSessions}. Revisa que el cierre incluya sintesis, riesgo y proximos pasos.`;
  }
  if (decision.action === "refer") {
    return "Propusiste derivacion. Esta decision debe apoyarse en indicadores claros y comunicarse de forma cuidadosa.";
  }
  if (decision.action === "risk_protocol") {
    return "Propusiste activar protocolo de riesgo. La prioridad formativa es justificarlo con indicadores de seguridad observados.";
  }
  if (decision.action === "request_supervision") {
    return "Propusiste solicitar supervision. Es pertinente cuando faltan datos, hay dudas de riesgo o la hipotesis aun es fragil.";
  }
  if (decision.action === "apply_instruments") {
    return "Propusiste aplicar instrumentos. La decision debe justificar pertinencia, limites y resguardos eticos.";
  }
  if (decision.action === "initial_feedback") {
    return "Propusiste realizar una devolucion inicial. Revisa que sea clara, empatica y no cierre hipotesis sin evidencia.";
  }
  if (decision.action === "follow_up") {
    return "Propusiste seguimiento. Debe quedar claro que se monitorea sin reemplazar continuidad clinica si el caso lo requiere.";
  }
  return "Propusiste continuidad adicional. Debe quedar claro que requiere objetivos, reevaluacion y fundamentos clinicos.";
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
