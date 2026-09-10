import { getAcademicCriterion, FEEDBACK_BASIS_VERSION } from "../data/feedbackAcademicBasis.js";
import { normalizeFeedbackText } from "./feedbackSignals.js";

/** Presence is observable without an LLM. Semantic quality is not inferred from length. */
export function reviewWrittenFields(value, fields) {
  const present = fields.filter(([key]) => String(value[key] || "").trim());
  const missing = fields.filter(([key]) => !String(value[key] || "").trim());
  const repeatedFields = present.filter(([key], index) => present.some(([other], otherIndex) => otherIndex !== index && normalizeFeedbackText(value[key]) === normalizeFeedbackText(value[other]))).map(([, label]) => label);
  return {
    assessmentKind: "structure_only", basisVersion: FEEDBACK_BASIS_VERSION,
    level: present.length === 0 ? "needsWork" : missing.length ? "partial" : "needsReview",
    levelLabel: present.length === 0 ? "Sin registro" : missing.length ? "Registro incompleto" : "Contenido por contrastar",
    strengths: present.map(([, label]) => `Hay texto registrado en ${label}; su pertinencia está pendiente de revisión.`),
    gaps: [
      ...missing.map(([, label, question]) => `Falta ${label}. ${question || ""}`.trim()),
      ...(repeatedFields.length ? [`El mismo texto aparece en campos con propósitos distintos: ${repeatedFields.join(", ")}. Revisa qué aporta específicamente a cada uno.`] : []),
      ...present.map(([, label, question]) => `Revisar ${label}: ${question || "¿Qué dato del caso respalda esta afirmación?"}`)
    ],
    completedFields: present.map(([key]) => key), missingFields: missing.map(([key]) => key), repeatedFields,
    sources: getAcademicCriterion("formulation").sources,
    summary: `${present.length} de ${fields.length} campos contienen texto. Esta revisión comprueba el registro; la corrección clínica, la coherencia y la vinculación con el caso requieren contrastar el contenido con evidencia y supervisión.`
  };
}
