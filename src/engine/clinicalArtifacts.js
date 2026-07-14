import { clinicalInstrumentOptions } from "../data/clinicalWorkflow.js";
import {
  buildInitialComplementaryEvaluation,
  buildInitialInterventionDesign,
  evaluateComplementaryEvaluationRequest,
  evaluateExternalReportIntegration,
  evaluateInterventionDesign,
  normalizeComplementaryEvaluation,
  normalizeInterventionDesign
} from "./clinicalComplementaryEvaluation.js";

export function buildInitialClinicalArtifacts() {
  return {
    clinicalHypothesis: "",
    supportingData: "",
    missingData: "",
    selectedInstruments: [],
    instrumentJustification: "",
    complementaryEvaluation: buildInitialComplementaryEvaluation(),
    interventionDesign: buildInitialInterventionDesign(),
    initialFeedbackDraft: "",
    clinicalNote: "",
    createdAt: new Date().toISOString()
  };
}

export function normalizeClinicalArtifacts(artifacts = {}) {
  const validInstrumentIds = new Set(clinicalInstrumentOptions.map((instrument) => instrument.id));
  const selectedInstruments = Array.isArray(artifacts.selectedInstruments)
    ? artifacts.selectedInstruments.filter((id) => validInstrumentIds.has(id))
    : [];

  return {
    clinicalHypothesis: String(artifacts.clinicalHypothesis || "").trim(),
    supportingData: String(artifacts.supportingData || "").trim(),
    missingData: String(artifacts.missingData || "").trim(),
    selectedInstruments,
    instrumentJustification: String(artifacts.instrumentJustification || "").trim(),
    complementaryEvaluation: normalizeComplementaryEvaluation(artifacts.complementaryEvaluation),
    interventionDesign: normalizeInterventionDesign(artifacts.interventionDesign),
    initialFeedbackDraft: String(artifacts.initialFeedbackDraft || "").trim(),
    clinicalNote: String(artifacts.clinicalNote || "").trim(),
    createdAt: artifacts.createdAt || new Date().toISOString()
  };
}

export function evaluateClinicalArtifacts({ artifacts = {}, report = {}, history = [], caseItem = null } = {}) {
  const normalized = normalizeClinicalArtifacts(artifacts);
  const strengths = [];
  const gaps = [];
  const turnCount = history.filter((entry) => !entry.isSessionPrelude).length;
  const complementaryRequestEvaluation = evaluateComplementaryEvaluationRequest({
    request: normalized.complementaryEvaluation,
    caseItem,
    history
  });
  const externalReportIntegrationEvaluation = normalized.complementaryEvaluation.report
    ? evaluateExternalReportIntegration(normalized.complementaryEvaluation.integration)
    : null;
  const interventionDesignEvaluation = evaluateInterventionDesign(normalized.interventionDesign);

  if (normalized.clinicalHypothesis.length >= 30) {
    strengths.push("Formulaste una hipotesis clinica inicial.");
  } else {
    gaps.push("Falta una hipotesis clinica inicial suficientemente clara.");
  }

  if (normalized.supportingData.length >= 25) {
    strengths.push("Vinculaste la hipotesis con datos de la entrevista.");
  } else {
    gaps.push("La hipotesis necesita datos observados que la sostengan.");
  }

  if (normalized.missingData.length >= 18) {
    strengths.push("Identificaste informacion faltante o preguntas pendientes.");
  } else {
    gaps.push("Conviene registrar que informacion aun falta antes de concluir.");
  }

  if (normalized.selectedInstruments.length > 0 && normalized.instrumentJustification.length >= 24) {
    strengths.push("Seleccionaste instrumentos con una justificacion inicial.");
  } else if (normalized.selectedInstruments.length > 0) {
    gaps.push("Los instrumentos seleccionados necesitan justificacion de pertinencia y limites.");
  }

  if (normalized.complementaryEvaluation.report) {
    strengths.push("Solicitaste y recibiste un informe externo simulado.");
  } else if (normalized.complementaryEvaluation.instrumentId) {
    gaps.push("La evaluacion complementaria seleccionada aun no tiene informe simulado generado.");
  }

  if (normalized.complementaryEvaluation.report && externalReportIntegrationEvaluation?.level === "achieved") {
    strengths.push("Integra el informe externo con hipotesis, etica y continuidad.");
  } else if (normalized.complementaryEvaluation.report) {
    gaps.push("Falta integrar mejor el informe externo antes de usarlo para decidir.");
  }

  if (normalized.initialFeedbackDraft.length >= 30) {
    strengths.push("Ensayaste una devolucion inicial al paciente.");
  }

  if (normalized.clinicalNote.length >= 40) {
    strengths.push("Redactaste una nota clinica breve.");
  } else {
    gaps.push("La nota clinica es insuficiente o aun no fue redactada.");
  }

  if (turnCount < 4 && normalized.clinicalHypothesis.length > 60) {
    gaps.push("La formulacion puede ser apresurada para la cantidad de informacion recogida.");
  }

  const level = gaps.length <= 1 ? "achieved" : gaps.length <= 3 ? "partial" : "needsWork";

  return {
    title: "Formulacion, instrumentos y nota clinica",
    level,
    levelLabel: {
      achieved: "Logrado",
      partial: "Parcialmente logrado",
      needsWork: "Por fortalecer"
    }[level],
    strengths,
    gaps,
    selectedInstrumentLabels: normalized.selectedInstruments.map(
      (id) => clinicalInstrumentOptions.find((instrument) => instrument.id === id)?.label || id
    ),
    complementaryRequestEvaluation,
    externalReportIntegrationEvaluation,
    interventionDesignEvaluation,
    summary: `Registraste ${normalized.selectedInstruments.length} instrumento(s), una hipotesis ${normalized.clinicalHypothesis ? "presente" : "pendiente"} y una nota clinica ${normalized.clinicalNote ? "presente" : "pendiente"}.`
  };
}
