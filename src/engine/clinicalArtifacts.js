import { reviewWrittenFields } from "./writtenWorkFeedback.js";
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

  const writtenReview = reviewWrittenFields(normalized, [
    ["clinicalHypothesis", "hipótesis", "¿Qué hipótesis alternativa consideraste?"],
    ["supportingData", "datos de apoyo", "¿Qué fragmento de la entrevista respalda cada afirmación?"],
    ["missingData", "datos faltantes", "¿Qué necesitas preguntar antes de concluir?"],
    ["clinicalNote", "nota clínica", "¿Separaste observaciones, hipótesis y decisiones?"]
  ]);
  strengths.push(...writtenReview.strengths);
  gaps.push(...writtenReview.gaps);
  const level = writtenReview.level;

  return {
    title: "Formulacion, instrumentos y nota clinica",
    level,
    levelLabel: writtenReview.levelLabel,
    assessmentKind: "structure_only",
    strengths,
    gaps,
    selectedInstrumentLabels: normalized.selectedInstruments.map(
      (id) => clinicalInstrumentOptions.find((instrument) => instrument.id === id)?.label || id
    ),
    complementaryRequestEvaluation,
    externalReportIntegrationEvaluation,
    interventionDesignEvaluation,
    summary: writtenReview.summary
  };
}
