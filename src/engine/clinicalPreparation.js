import { clinicalExplorationAreas } from "../data/clinicalWorkflow.js";

const DEFAULT_AREAS = [
  "motivo_consulta",
  "estado_emocional",
  "funcionamiento_diario",
  "red_apoyo",
  "riesgo"
];

export function buildInitialPreSessionPlan({ caseItem = null, sessionNumber = 1 } = {}) {
  return {
    caseId: caseItem?.id || "",
    sessionNumber,
    evaluationObjective: "",
    interviewType: "semiestructurada",
    explorationAreas: DEFAULT_AREAS,
    ethicalCare: "Confidencialidad, limites de confidencialidad, consentimiento y no ingresar datos de pacientes reales.",
    priorityInformation: "",
    createdAt: new Date().toISOString()
  };
}

export function normalizePreSessionPlan(plan = {}, { caseItem = null, sessionNumber = 1 } = {}) {
  const validAreaIds = new Set(clinicalExplorationAreas.map((area) => area.id));
  const explorationAreas = Array.isArray(plan.explorationAreas)
    ? plan.explorationAreas.filter((area) => validAreaIds.has(area))
    : DEFAULT_AREAS;

  return {
    caseId: plan.caseId || caseItem?.id || "",
    sessionNumber: Number(plan.sessionNumber) || sessionNumber,
    evaluationObjective: String(plan.evaluationObjective || "").trim(),
    interviewType: ["abierta", "semiestructurada", "estructurada"].includes(plan.interviewType)
      ? plan.interviewType
      : "semiestructurada",
    explorationAreas,
    ethicalCare: String(plan.ethicalCare || "").trim(),
    priorityInformation: String(plan.priorityInformation || "").trim(),
    createdAt: plan.createdAt || new Date().toISOString()
  };
}

export function evaluatePreSessionPlan({ preSessionPlan = null, report = {}, history = [] } = {}) {
  const plan = normalizePreSessionPlan(preSessionPlan);
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const exploredText = meaningfulHistory.map((entry) => `${entry.question || ""} ${entry.answer || ""}`).join(" ");
  const strengths = [];
  const gaps = [];

  if (plan.evaluationObjective.length >= 18) {
    strengths.push("Definiste un objetivo inicial de evaluacion.");
  } else {
    gaps.push("Falto precisar el objetivo inicial antes de entrevistar.");
  }

  if (plan.explorationAreas.includes("riesgo")) {
    strengths.push("Incluiste riesgo como area a considerar.");
  } else {
    gaps.push("No priorizaste riesgo en el plan previo.");
  }

  if (plan.ethicalCare.length >= 18) {
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
