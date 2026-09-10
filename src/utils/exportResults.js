import { analyzeConversationEvidence } from "../engine/sessionFeedback.js";

export function buildResultsText({ report, caseItem, history }) {
  const date = new Date().toLocaleString("es-CL");
  const achieved = report.criteria
    .map((criterion) => `- ${criterion.title}: ${criterion.levelLabel}`)
    .join("\n");
  const improvements = report.improvements.map((item) => `- ${item}`).join("\n");
  const opening = history.filter(entry => entry.isSessionPrelude).map(entry => `${caseItem.name}: ${entry.answer}`).join("\n");
  const conversation = history
    .filter((entry) => !entry.isPendingResponse && !entry.isSessionPrelude)
    .map((entry, index) => `${index + 1}. Estudiante: ${entry.question}\n   ${caseItem.name}: ${entry.answer}`)
    .join("\n");
  const evidence = analyzeConversationEvidence(history).map(action => [
    `Turno ${action.index}: ${action.quote}`,
    `Contexto anterior: ${action.previousPatientResponse || "Sin respuesta previa registrada"}`,
    `Criterio: ${action.criterion}`, `Lectura formativa: ${action.formativeReading}`,
    `Respuesta y límites: ${action.possibleEffect}`, `Sugerencia: ${action.suggestion}`,
    `Para reflexionar: ${action.reflectionQuestion}`,
    `Fuentes: ${action.sources.map(source => `${source.label} ${source.url}`).join("; ")}`
  ].join("\n")).join("\n\n");

  return `Escucha Viva · Entrevista Psicológica Formativa - ${caseItem.name}
Fecha: ${date}
Caso: ${caseItem.name} (${caseItem.age})
Motivo ficticio: ${caseItem.motive}

Resumen del desempeño:
${report.summary}

Apertura simulada observada:
${report.trust.label}. Esta es una lectura cualitativa formativa, no una medición clínica.

Criterios y evidencia disponible:
${achieved || "- Sin evidencia identificada para estos criterios."}

Aspectos a mejorar:
${improvements || "- No hay observaciones específicas adicionales; revisa la conversación con tu docente."}

Intervenciones y respuestas para revisar el vínculo:
${report.bondMoments.map((item) => `- ${item}`).join("\n")}

Momentos que pudieron cerrar la comunicación:
${report.closingMoments.map((item) => `- ${item}`).join("\n")}

Fundamentos educativos:
${(report.academicReferences || []).map(source => `- ${source.label}. ${source.title}. ${source.url}`).join("\n") || "- Sin fuentes asociadas a intervenciones."}
Versión de criterios: ${report.basisVersion || "Registro anterior a la versión académica"}.

Detalle de los intercambios:
${evidence || "- Sin intervenciones para revisar."}

Contexto de apertura:
${opening || "- Sin apertura previa registrada."}

Conversación registrada:
${conversation || "- No hay conversación registrada."}

Uso educativo:
${report.ethicalNotice}
Este material no reemplaza supervisión docente, atención psicológica real ni intervención clínica.`;
}

export function createMailto({ report, caseItem, history }) {
  const subject = `Escucha Viva · Entrevista Psicológica Formativa - ${caseItem.name}`;
  const body = buildResultsText({ report, caseItem, history });
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyResultsToClipboard(payload) {
  const text = buildResultsText(payload);
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to a temporary textarea when clipboard permissions are blocked.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function downloadResultsTxt(payload) {
  const text = buildResultsText(payload);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `resultados-escucha-viva-${payload.caseItem.id}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
