import { clinicalExplorationAreas } from "../data/clinicalWorkflow.js";

const DEFAULT_AREAS = [
  "motivo_consulta",
  "estado_emocional",
  "funcionamiento_diario",
  "red_apoyo",
  "riesgo"
];

export const SESSION_COUNT_LIMITS = {
  min: 1,
  max: 12,
  defaultValue: 4
};

export const ethicalCareChecklist = [
  { id: "confidencialidad", label: "Confidencialidad" },
  { id: "limites_confidencialidad", label: "Limites de confidencialidad" },
  { id: "consentimiento", label: "Consentimiento" },
  { id: "no_datos_reales", label: "No ingresar datos de pacientes reales" },
  { id: "indicadores_riesgo", label: "Atencion a indicadores de riesgo" }
];

export function buildInitialPreSessionPlan({ caseItem = null, sessionNumber = 1, basePlan = null } = {}) {
  const normalizedBasePlan = basePlan ? normalizePreSessionPlan(basePlan, { caseItem, sessionNumber }) : null;

  return {
    caseId: caseItem?.id || "",
    sessionNumber,
    evaluationObjective: normalizedBasePlan?.evaluationObjective || "",
    proposedSessionCount: normalizedBasePlan?.proposedSessionCount || SESSION_COUNT_LIMITS.defaultValue,
    sessionCountJustification: normalizedBasePlan?.sessionCountJustification || "",
    processObjectives: normalizedBasePlan?.processObjectives || "",
    interviewType: normalizedBasePlan?.interviewType || "semiestructurada",
    interviewJustification: normalizedBasePlan?.interviewJustification || "",
    explorationAreas: normalizedBasePlan?.explorationAreas || DEFAULT_AREAS,
    ethicalCareItems: normalizedBasePlan?.ethicalCareItems || [],
    ethicalCare: normalizedBasePlan?.ethicalCare || "",
    priorityInformation: normalizedBasePlan?.priorityInformation || "",
    createdAt: new Date().toISOString()
  };
}

export function normalizePreSessionPlan(plan = {}, { caseItem = null, sessionNumber = 1 } = {}) {
  const validAreaIds = new Set(clinicalExplorationAreas.map((area) => area.id));
  const explorationAreas = Array.isArray(plan.explorationAreas)
    ? plan.explorationAreas.filter((area) => validAreaIds.has(area))
    : DEFAULT_AREAS;
  const validCareIds = new Set(ethicalCareChecklist.map((item) => item.id));
  const ethicalCareItems = Array.isArray(plan.ethicalCareItems)
    ? plan.ethicalCareItems.filter((item) => validCareIds.has(item))
    : inferEthicalCareItems(plan.ethicalCare);
  const ethicalCareText = ethicalCareItems.length
    ? ethicalCareChecklist
        .filter((item) => ethicalCareItems.includes(item.id))
        .map((item) => item.label)
        .join(", ")
    : String(plan.ethicalCare || "").trim();

  return {
    caseId: plan.caseId || caseItem?.id || "",
    sessionNumber: Number(plan.sessionNumber) || sessionNumber,
    evaluationObjective: preserveWritableText(plan.evaluationObjective),
    proposedSessionCount: clampSessionCount(plan.proposedSessionCount),
    sessionCountJustification: preserveWritableText(plan.sessionCountJustification),
    processObjectives: preserveWritableText(plan.processObjectives),
    interviewType: ["abierta", "semiestructurada", "estructurada"].includes(plan.interviewType)
      ? plan.interviewType
      : "semiestructurada",
    interviewJustification: preserveWritableText(plan.interviewJustification),
    explorationAreas,
    ethicalCareItems,
    ethicalCare: ethicalCareText,
    priorityInformation: preserveWritableText(plan.priorityInformation),
    clinicalLanguageTerm: preserveWritableText(plan.clinicalLanguageTerm),
    clinicalLanguageCustomTerm: preserveWritableText(plan.clinicalLanguageCustomTerm),
    clinicalLanguageLabel: preserveWritableText(plan.clinicalLanguageLabel),
    preparationQuality: preserveWritableText(plan.preparationQuality),
    preparationOverrideUsed: Boolean(plan.preparationOverrideUsed),
    preparationWeakReasons: Array.isArray(plan.preparationWeakReasons)
      ? plan.preparationWeakReasons.map((item) => preserveWritableText(item)).filter(Boolean)
      : [],
    preparationMissingFields: Array.isArray(plan.preparationMissingFields)
      ? plan.preparationMissingFields.map((item) => preserveWritableText(item)).filter(Boolean)
      : [],
    preparationStartedAt: preserveWritableText(plan.preparationStartedAt),
    createdAt: plan.createdAt || new Date().toISOString()
  };
}

export function evaluatePreSessionPlan({ preSessionPlan = null, report = {}, history = [] } = {}) {
  const plan = normalizePreSessionPlan(preSessionPlan);
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const exploredText = meaningfulHistory.map((entry) => `${entry.question || ""} ${entry.answer || ""}`).join(" ");
  const strengths = [];
  const gaps = [];

  if (plan.preparationOverrideUsed) {
    gaps.push("Iniciaste la entrevista con preparacion debil o insuficiente y decidiste continuar de todos modos.");
    if (plan.preparationWeakReasons?.length) {
      gaps.push(`Aspectos debiles al iniciar: ${plan.preparationWeakReasons.slice(0, 3).join("; ")}.`);
    }
  }

  if (plan.evaluationObjective.trim().length >= 18) {
    strengths.push("Definiste un objetivo inicial de evaluacion.");
  } else {
    gaps.push("Falto precisar el objetivo inicial antes de entrevistar.");
  }

  if (plan.sessionCountJustification.trim().length >= 24 && plan.processObjectives.trim().length >= 24) {
    strengths.push(`Propusiste un proceso de ${plan.proposedSessionCount} sesion(es) con objetivos clinicos iniciales.`);
  } else {
    gaps.push("Falto justificar la cantidad de sesiones propuesta y definir objetivos del proceso.");
  }

  if (plan.interviewJustification.trim().length >= 18) {
    strengths.push("Justificaste la modalidad de entrevista elegida.");
  } else {
    gaps.push("Falto justificar por que esa modalidad de entrevista era pertinente.");
  }

  if (plan.explorationAreas.includes("riesgo")) {
    strengths.push("Incluiste riesgo como area a considerar.");
  } else {
    gaps.push("No priorizaste riesgo en el plan previo.");
  }

  if (plan.ethicalCareItems.length >= 4 || plan.ethicalCare.trim().length >= 18) {
    strengths.push("Nombraste cuidados eticos antes de iniciar.");
  } else {
    gaps.push("El plan previo necesita explicitar confidencialidad, limites y seguridad.");
  }

  const coveredAreas = plan.explorationAreas.filter((area) => areaWasExplored(area, exploredText, report));
  if (coveredAreas.length) {
    strengths.push(`Retomaste ${coveredAreas.length} area(s) planificada(s) durante la entrevista.`);
  }
  if (coveredAreas.length < Math.min(3, plan.explorationAreas.length)) {
    gaps.push("Varias areas planificadas no aparecen exploradas en la conversacion.");
  }

  return {
    title: "Preparacion antes de la sesion",
    interviewType: plan.interviewType,
    plannedAreas: plan.explorationAreas,
    coveredAreas,
    strengths,
    gaps,
    level: gaps.length <= 1 ? "achieved" : gaps.length <= 3 ? "partial" : "needsWork",
    summary: `Planificaste una entrevista ${plan.interviewType}. Se observaron ${coveredAreas.length} de ${plan.explorationAreas.length} area(s) planificada(s) en la conversacion.`
  };
}

export function evaluatePreSessionReadiness(plan = {}, { languagePreference = {} } = {}) {
  const selectedAreas = Array.isArray(plan?.explorationAreas) ? plan.explorationAreas : [];
  const selectedCareItems = Array.isArray(plan?.ethicalCareItems) ? plan.ethicalCareItems : [];
  const proposedSessionCount = Number(plan?.proposedSessionCount);
  const term = plan?.clinicalLanguageTerm || languagePreference?.term || "paciente";
  const customTerm = plan?.clinicalLanguageCustomTerm || languagePreference?.customTerm || "";
  const languageReady = term !== "otro" || hasText(customTerm);
  const requiredCompletion = {
    objective: hasText(plan?.evaluationObjective),
    process:
      proposedSessionCount >= SESSION_COUNT_LIMITS.min &&
      proposedSessionCount <= SESSION_COUNT_LIMITS.max &&
      hasText(plan?.sessionCountJustification) &&
      hasText(plan?.processObjectives) &&
      languageReady,
    interview:
      Boolean(plan?.interviewType) &&
      hasText(plan?.interviewJustification),
    areas: selectedAreas.length >= 1,
    ethics: selectedCareItems.length >= 1,
    priority: hasText(plan?.priorityInformation)
  };
  const qualityCompletion = {
    objective: String(plan?.evaluationObjective || "").trim().length >= 18,
    process:
      requiredCompletion.process &&
      String(plan?.sessionCountJustification || "").trim().length >= 24 &&
      String(plan?.processObjectives || "").trim().length >= 24,
    interview:
      Boolean(plan?.interviewType) &&
      String(plan?.interviewJustification || "").trim().length >= 18,
    areas: selectedAreas.length >= 4 && selectedAreas.length <= 6,
    ethics: selectedCareItems.length >= Math.min(4, ethicalCareChecklist.length),
    priority: String(plan?.priorityInformation || "").trim().length >= 18
  };
  const missingReasons = buildPreparationReasons(requiredCompletion, {
    objective: "Falta objetivo inicial.",
    process: languageReady
      ? "Falta completar plan de sesiones, justificacion u objetivos del proceso."
      : "Falta definir el termino personalizado que usaras para nombrar a la persona.",
    interview: "Falta justificar la modalidad de entrevista.",
    areas: "Selecciona al menos un area prioritaria.",
    ethics: "Selecciona al menos un cuidado etico.",
    priority: "Falta informacion clave para cerrar la primera entrevista."
  });
  const weakReasons = buildPreparationReasons(qualityCompletion, {
    objective: "Objetivo inicial demasiado breve.",
    process: "Justificacion de sesiones u objetivos del proceso demasiado breves.",
    interview: "Justificacion de la modalidad de entrevista demasiado breve.",
    areas: "Prioriza entre 4 y 6 areas para sostener foco clinico.",
    ethics: "Conviene marcar al menos 4 cuidados eticos.",
    priority: "Informacion clave demasiado breve."
  });

  return {
    requiredCompletion,
    qualityCompletion,
    requiredComplete: Object.values(requiredCompletion).every(Boolean),
    qualityComplete: Object.values(qualityCompletion).every(Boolean),
    missingReasons,
    weakReasons
  };
}

function areaWasExplored(area, text, report) {
  const normalized = normalize(text);
  const skills = (report.skillClassification || []).map((item) => normalize(item.label)).join(" ");
  const lookup = {
    motivo_consulta: /\b(motivo|consulta|trae|viniste|preocupa)\b/,
    historia_problema: /\b(desde cuando|cuando empezo|historia|antes|inicio)\b/,
    anamnesis: /\b(infancia|historia|familia|antecedentes)\b/,
    estado_emocional: /\b(sientes|sentido|emocion|triste|cansado|ansiedad|culpa|miedo)\b/,
    examen_mental: /\b(sueno|concentracion|memoria|animo|pensamientos)\b/,
    funcionamiento_diario: /\b(dia|rutina|trabajo|estudio|casa|funcionar)\b/,
    familia: /\b(familia|mama|papa|hermano|pareja|hijos)\b/,
    red_apoyo: /\b(apoyo|red|cuentas|amigos|quien te ayuda)\b/,
    riesgo: /\b(riesgo|hacerte dano|morir|suicid|peligro)\b/,
    consumo: /\b(alcohol|sustancia|consumo|drogas)\b/,
    antecedentes_medicos: /\b(medico|enfermedad|medicacion|salud fisica)\b/,
    antecedentes_salud_mental: /\b(psicologo|psiquiatra|terapia|diagnostico|tratamiento)\b/,
    contexto_sociocultural: /\b(contexto|cultura|migr|comunidad|recursos economicos)\b/,
    factores_protectores: /\b(protege|ayuda|recursos|fortalezas|motivos para)\b/
  };
  return Boolean(lookup[area]?.test(normalized)) || skills.includes(normalize(area.replace(/_/g, " ")));
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function clampSessionCount(value, fallback = SESSION_COUNT_LIMITS.defaultValue) {
  const parsed = Number.parseInt(value, 10);
  const safeNumber = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(SESSION_COUNT_LIMITS.max, Math.max(SESSION_COUNT_LIMITS.min, safeNumber));
}

export function getPlannedSessionCount(plan = {}, fallback = SESSION_COUNT_LIMITS.defaultValue) {
  return clampSessionCount(plan?.proposedSessionCount, fallback);
}

function preserveWritableText(value = "") {
  return String(value ?? "").replace(/\r\n/g, "\n");
}

function inferEthicalCareItems(ethicalCare = "") {
  const text = normalize(ethicalCare);
  if (!text) return [];
  return ethicalCareChecklist
    .filter((item) => {
      if (item.id === "confidencialidad") return /\bconfidencial/.test(text);
      if (item.id === "limites_confidencialidad") return /\blimite|riesgo|peligro/.test(text);
      if (item.id === "consentimiento") return /\bconsent/.test(text);
      if (item.id === "no_datos_reales") return /\bdato|paciente real|reales/.test(text);
      if (item.id === "indicadores_riesgo") return /\briesgo|hacerte dano|peligro/.test(text);
      return false;
    })
    .map((item) => item.id);
}

function buildPreparationReasons(completion, messages) {
  return Object.entries(completion)
    .filter(([, ok]) => !ok)
    .map(([key]) => messages[key])
    .filter(Boolean);
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}
