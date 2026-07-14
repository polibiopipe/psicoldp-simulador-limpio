export function buildPatientProcessMemory({
  history = [],
  report = {},
  preSessionPlan = null,
  clinicalDecision = null,
  clinicalArtifacts = null,
  taskState = null,
  sessionNumber = 1
} = {}) {
  const meaningfulHistory = history.filter((entry) => !entry.isSessionPrelude);
  const acts = meaningfulHistory.map((entry) => entry.analysis?.clinicalAvatar?.detectedAct || entry.analysis?.detectedIntent || entry.responseCategory).filter(Boolean);
  const clinicalSignals = meaningfulHistory.map((entry) => entry.analysis?.clinicalAvatar).filter(Boolean);

  return {
    sessionNumber,
    studentActs: unique(acts),
    processObjectives: preSessionPlan?.processObjectives || [],
    tasks: buildTaskMemory({ taskState, meaningfulHistory }),
    trust: {
      final: report.trust?.final ?? null,
      label: report.trust?.label || "",
      studentShowedEmpathy: clinicalSignals.some((signal) => signal.goodIntervention || signal.detectedAct === "intervencion_empatica")
    },
    risk: {
      wasExplored: acts.includes("riesgo_autolesion") || meaningfulHistory.some((entry) => /riesgo|hacerte dano|suicid|morir|desaparecer/i.test(entry.question || "")),
      signals: extractRiskSignals(meaningfulHistory)
    },
    hypotheses: extractClinicalHypotheses(report, clinicalArtifacts),
    instruments: clinicalArtifacts?.selectedInstruments || clinicalArtifacts?.instruments || [],
    externalReports: extractExternalReports(clinicalArtifacts),
    reportIntegrations: extractReportIntegrations(clinicalArtifacts),
    interventionDesigns: extractInterventionDesigns(clinicalArtifacts),
    techniques: unique(clinicalSignals.map((signal) => signal.approach || signal.goodIntervention || signal.poorIntervention).filter(Boolean)),
    decisions: clinicalDecision ? [clinicalDecision] : [],
    notes: extractProcessNotes(meaningfulHistory),
    agreements: extractAgreements(meaningfulHistory, clinicalDecision),
    rupturesAndRepairs: extractRupturesAndRepairs(meaningfulHistory),
    changesObserved: extractChangesObserved(meaningfulHistory, report)
  };
}

export function mergeProcessMemories(summaries = []) {
  const memories = summaries.map((summary) => summary.processMemory).filter(Boolean);
  return {
    tasks: memories.flatMap((memory) => memory.tasks || []),
    decisions: memories.flatMap((memory) => memory.decisions || []),
    agreements: memories.flatMap((memory) => memory.agreements || []),
    riskExplored: memories.some((memory) => memory.risk?.wasExplored),
    riskSignals: unique(memories.flatMap((memory) => memory.risk?.signals || [])),
    techniques: unique(memories.flatMap((memory) => memory.techniques || [])),
    externalReports: memories.flatMap((memory) => memory.externalReports || []),
    reportIntegrations: memories.flatMap((memory) => memory.reportIntegrations || []),
    interventionDesigns: memories.flatMap((memory) => memory.interventionDesigns || []),
    rupturesAndRepairs: memories.flatMap((memory) => memory.rupturesAndRepairs || []),
    changesObserved: unique(memories.flatMap((memory) => memory.changesObserved || [])),
    processObjectives: unique(memories.flatMap((memory) => memory.processObjectives || []))
  };
}

function buildTaskMemory({ taskState, meaningfulHistory }) {
  if (taskState?.description) {
    return [{
      type: taskState.type || "tarea_acordada",
      description: taskState.description,
      accepted: Boolean(taskState.accepted),
      source: "session_state"
    }];
  }

  const taskEntry = [...meaningfulHistory].reverse().find((entry) =>
    /\b(tarea|te propongo|para la proxima|podrias|registrar|anotar)\b/i.test(entry.question || "")
  );

  return taskEntry ? [{
    type: "tarea_detectada",
    description: taskEntry.question,
    accepted: !/\b(no|no quiero|no puedo)\b/i.test(taskEntry.answer || ""),
    source: "conversation"
  }] : [];
}

function extractRiskSignals(history) {
  return unique(history
    .flatMap((entry) => [entry.question, entry.answer])
    .filter(Boolean)
    .filter((text) => /desaparecer|apagarme|hacerme dano|morir|no estar|riesgo|suicid/i.test(text))
    .map((text) => String(text).slice(0, 180)));
}

function extractClinicalHypotheses(report, clinicalArtifacts) {
  return unique([
    ...(report?.clinicalHypotheses || []),
    ...(clinicalArtifacts?.hypotheses || []),
    ...(clinicalArtifacts?.clinicalHypotheses || []),
    clinicalArtifacts?.clinicalHypothesis,
    clinicalArtifacts?.complementaryEvaluation?.hypothesis,
    clinicalArtifacts?.interventionDesign?.clinicalFormulation
  ].filter(Boolean));
}

function extractExternalReports(clinicalArtifacts) {
  const externalReport = clinicalArtifacts?.complementaryEvaluation?.report;
  if (!externalReport) return [];
  return [{
    title: externalReport.title,
    instrument: externalReport.requestedInstrument?.name || externalReport.caseData?.instrument || "",
    area: externalReport.requestedInstrument?.area || externalReport.caseData?.area || "",
    createdAt: externalReport.createdAt
  }];
}

function extractReportIntegrations(clinicalArtifacts) {
  const integration = clinicalArtifacts?.complementaryEvaluation?.integration;
  if (!integration || !Object.values(integration).some(Boolean)) return [];
  return [integration];
}

function extractInterventionDesigns(clinicalArtifacts) {
  const design = clinicalArtifacts?.interventionDesign;
  if (!design || !Object.values(design).some(Boolean)) return [];
  return [design];
}

function extractProcessNotes(history) {
  return history
    .filter((entry) => entry.analysis?.clinicalAvatar?.detectedTopic || entry.patientState?.opennessLevel)
    .slice(-5)
    .map((entry) => ({
      topic: entry.analysis?.clinicalAvatar?.detectedTopic || entry.responseCategory || "",
      patientOpenness: entry.patientState?.opennessLevel || "",
      patientResponse: String(entry.answer || "").slice(0, 220)
    }));
}

function extractAgreements(history, clinicalDecision) {
  const agreements = [];
  if (clinicalDecision?.action) {
    agreements.push(`Decision: ${clinicalDecision.action}`);
  }

  const closure = [...history].reverse().find((entry) =>
    /\b(proxima sesion|nos vemos|seguimos|cerramos|tarea|acuerdo)\b/i.test(`${entry.question || ""} ${entry.answer || ""}`)
  );
  if (closure) agreements.push(String(closure.question || closure.answer || "").slice(0, 220));
  return unique(agreements);
}

function extractRupturesAndRepairs(history) {
  const result = [];
  for (const entry of history) {
    const text = `${entry.question || ""} ${entry.answer || ""}`;
    if (/\b(juzg|adiccion|flojo|exager|no cuenta|para ustedes)\b/i.test(text)) {
      result.push({ type: "posible_ruptura", text: String(entry.answer || entry.question || "").slice(0, 220) });
    }
    if (/\b(perdon|quizas sono|entiendo|no queria juzgar|vamos con calma)\b/i.test(text)) {
      result.push({ type: "posible_reparacion", text: String(entry.question || entry.answer || "").slice(0, 220) });
    }
  }
  return result.slice(-6);
}

function extractChangesObserved(history, report) {
  const changes = [];
  if (report?.trust?.final >= 65) changes.push("mayor apertura hacia el final de la sesion");
  if (history.some((entry) => entry.patientState?.opennessLevel === "apertura_alta")) changes.push("apertura alta registrada en al menos un turno");
  if (history.some((entry) => entry.analysis?.categories?.validation)) changes.push("el estudiante uso validacion");
  return unique(changes);
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}
