export function buildResultsText({ report, caseItem, history }) {
  const date = new Date().toLocaleString("es-CL");
  const achieved = report.criteria
    .filter((criterion) => criterion.level === "achieved")
    .map((criterion) => `- ${criterion.title}`)
    .join("\n");
  const improvements = report.improvements.map((item) => `- ${item}`).join("\n");
  const conversation = history
    .slice(0, 8)
    .map((entry, index) => `${index + 1}. Estudiante: ${entry.question}\n   ${caseItem.name}: ${entry.answer}`)
    .join("\n");

  return `Resultados simulación clínica LDP - ${caseItem.name}
Fecha: ${date}
Caso: ${caseItem.name} (${caseItem.age})
Motivo ficticio: ${caseItem.motive}

Resumen del desempeño:
${report.summary}

Nivel de apertura logrado:
${report.trust.final}/100 (${report.trust.label}). Cambio durante la sesión: ${report.trust.delta >= 0 ? "+" : ""}${report.trust.delta}.

Criterios logrados:
${achieved || "- Sin criterios completamente logrados todavía."}

Aspectos a mejorar:
${improvements || "- Mantener calidad de entrevista y profundizar con supervisión docente."}

Momentos que favorecieron el vínculo:
${report.bondMoments.map((item) => `- ${item}`).join("\n")}

Momentos que pudieron cerrar la comunicación:
${report.closingMoments.map((item) => `- ${item}`).join("\n")}

Conversación resumida:
${conversation || "- No hay conversación registrada."}

Uso educativo:
${report.ethicalNotice}
Este material no reemplaza supervisión docente, atención psicológica real ni intervención clínica.`;
}

export function createMailto({ report, caseItem, history }) {
  const subject = `Resultados simulación clínica LDP - ${caseItem.name}`;
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
  link.download = `resultados-simulador-ldp-${payload.caseItem.id}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
