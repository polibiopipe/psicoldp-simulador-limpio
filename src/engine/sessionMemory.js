import { patientFacts } from "../data/patientFacts.js";

const STORAGE_KEY = "simuladorClinicoLdp.sessions";

export function buildSessionSummary({ caseItem, history, report, sessionNumber = 1, agreement = "" }) {
  const facts = patientFacts[caseItem.id] || {};
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const lastState = meaningfulHistory.at(-1)?.patientState;

  return {
    id: `${caseItem.id}-s${sessionNumber}-${Date.now()}`,
    caseId: caseItem.id,
    patientName: caseItem.name,
    sessionNumber,
    simulatedDate: new Date().toISOString(),
    temasExplorados: deriveExploredTopics(meaningfulHistory, facts),
    temasPendientes: derivePendingTopics(meaningfulHistory, facts),
    nivelApertura: lastState?.opennessLevel || report.trust?.label || "No observado",
    trustFinal: report.trust?.final ?? lastState?.trustLevel ?? 45,
    fortalezasEstudiante: report.strengths.slice(0, 4),
    aspectosPorMejorar: report.improvements.slice(0, 4),
    resumenConversacion: summarizeConversation(meaningfulHistory, caseItem.name),
    acuerdoContinuidad: agreement,
    ethicalNotice:
      "Registro ficticio y educativo. No corresponde a atención psicológica real, tratamiento ni diagnóstico."
  };
}

export function saveSessionSummary(summary) {
  if (!canUseStorage()) return false;
  const sessions = readStoredSessions();
  const filtered = sessions.filter(
    (item) => !(item.caseId === summary.caseId && item.sessionNumber === summary.sessionNumber)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, summary]));
  return true;
}

export function getLatestSessionSummary(caseId, sessionNumber = 1) {
  if (!canUseStorage()) return null;
  return readStoredSessions()
    .filter((item) => item.caseId === caseId && item.sessionNumber === sessionNumber)
    .sort((a, b) => new Date(b.simulatedDate).getTime() - new Date(a.simulatedDate).getTime())[0] || null;
}

export function formatSessionAgreement(summary) {
  if (!summary) return "";
  return [
    "Acuerdo de próxima sesión simulada",
    `Paciente ficticio: ${summary.patientName}`,
    `Sesión realizada: ${summary.sessionNumber}`,
    `Fecha simulada: ${new Date(summary.simulatedDate).toLocaleString()}`,
    "",
    "Resumen breve:",
    summary.resumenConversacion,
    "",
    "Temas explorados:",
    ...summary.temasExplorados.map((item) => `- ${item}`),
    "",
    "Temas pendientes:",
    ...summary.temasPendientes.map((item) => `- ${item}`),
    "",
    "Acuerdo:",
    summary.acuerdoContinuidad || "Se propone continuar con una próxima sesión simulada.",
    "",
    summary.ethicalNotice
  ].join("\n");
}

function readStoredSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function deriveExploredTopics(history, facts) {
  const topics = new Set();
  for (const entry of history) {
    const categories = entry.analysis?.categories || {};
    if (entry.responseCategory === "motivo_de_consulta" || entry.analysis?.detectedIntent === "motivo_de_consulta") topics.add("motivo de consulta");
    if (entry.responseCategory === "vivienda_residencia" || entry.analysis?.detectedIntent === "vivienda_residencia") topics.add("vivienda o convivencia");
    if (entry.responseCategory === "ocupacion_actividad" || entry.analysis?.detectedIntent === "ocupacion_actividad") topics.add("ocupación o actividad principal");
    if (categories.framing) topics.add("encuadre inicial");
    if (categories.validation) topics.add("validación emocional");
    if (categories.followUp) topics.add("seguimiento del relato");
    if (categories.familyExploration) topics.add("contexto familiar o vivienda");
    if (categories.academicExploration) topics.add("contexto escolar/académico");
    if (categories.workExploration) topics.add("contexto laboral");
    if (categories.digitalExploration) topics.add("vida digital");
    if (categories.supportExploration) topics.add("redes de apoyo");
    if (categories.closure) topics.add("cierre de sesión");
  }

  if (!topics.size && facts.temaCentral) topics.add(facts.temaCentral);
  return Array.from(topics).slice(0, 6);
}

function derivePendingTopics(history, facts) {
  const explored = deriveExploredTopics(history, facts).join(" ").toLowerCase();
  const pending = [];
  if (!explored.includes("familiar") && facts.family) pending.push("profundizar contexto familiar o de convivencia");
  if (!explored.includes("apoyo")) pending.push("explorar apoyos y recursos cotidianos");
  if (!explored.includes("cierre")) pending.push("cuidar un cierre más explícito y acordado");
  if (facts.concreteConcern) pending.push(facts.concreteConcern);
  return pending.slice(0, 4);
}

function summarizeConversation(history, patientName) {
  if (!history.length) return `La sesión con ${patientName} no registró intervenciones.`;
  const first = history[0];
  const last = history.at(-1);
  return `Se realizaron ${history.length} intervención(es). La entrevista comenzó con “${first.question}” y cerró con “${last.question}”. ${patientName} respondió con una apertura final registrada como ${last.patientState?.opennessLevel || "no observada"}.`;
}
