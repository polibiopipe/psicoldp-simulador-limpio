export const RESEARCH_STUDY_KEY = "escucha-viva-estudiantes";
export const PRIVACY_CONTACT = "contacto@nucleovivo.net";

export const CONSENT_SECTIONS = [
  ["controller", "Responsable del estudio y de los datos"],
  ["objective", "Propósito de la investigación"],
  ["eligibility", "A quién se invita"],
  ["activities", "Qué harás"],
  ["duration", "Tiempo de participación"],
  ["voluntary_alternative", "Tu decisión y la alternativa académica"],
  ["risks_support", "Posibles molestias y apoyo"],
  ["benefits_costs", "Beneficios, costos e incentivos"],
  ["data_use", "Datos y análisis del estudio"],
  ["providers_transfers", "Proveedores, IA y tratamiento fuera de Chile"],
  ["retention", "Conservación y eliminación"],
  ["withdrawal", "Retiro y derechos sobre tus datos"],
  ["conflicts", "Relación del equipo con Escucha Viva"],
  ["review_reference", "Revisión del protocolo"],
  ["contacts", "Consultas y contacto independiente"]
];

export const CONSENT_DECLARATIONS = {
  adult: "Confirmo que tengo 18 años o más y cumplo los criterios de participación descritos.",
  participation: "He leído la información, he tenido oportunidad de consultar mis dudas y acepto participar voluntariamente en este estudio.",
  data: "Autorizo el tratamiento de los datos indicados para las finalidades de esta versión del estudio.",
  quotes: "Autorizo, de forma opcional, la publicación de fragmentos de mis respuestas revisados para evitar mi identificación."
};

export const CONSENT_SCOPE = [
  "Puedes usar el simulador sin participar en la investigación. Rechazar o retirarte no cambia tu acceso a la práctica.",
  "Esta autorización comprende únicamente el estudio descrito. No incluye publicidad, testimonios comerciales, entrenamiento de modelos ni otras investigaciones.",
  "La investigación solo puede incluir sesiones nuevas iniciadas después de tu aceptación. Los registros anteriores no se incorporan por esta autorización.",
  "Los casos son ficticios. No ingreses datos de pacientes reales ni antecedentes de tu propia salud. No se graban audio, video ni datos biométricos mediante este consentimiento.",
  "La IA puede equivocarse. Su retroalimentación es formativa y no constituye un diagnóstico ni una decisión académica definitiva.",
  "Los registros de la cuenta son identificables. El análisis utiliza códigos; las publicaciones deben evitar la identificación de participantes.",
  "El retiro excluye tus registros de nuevas consultas del conjunto de investigación. No elimina automáticamente tu historial de práctica ni copias ya entregadas al equipo; puedes solicitar su gestión al contacto del estudio. Los resultados irreversiblemente anonimizados ya no pueden vincularse contigo."
];

export function consentDocumentText(document, event = null) {
  const info = document?.information || {};
  const lines = ["ESCUCHA VIVA · CONSENTIMIENTO INFORMADO", document?.title || "", `Versión: ${document?.version || ""}`];
  for (const [key, label] of CONSENT_SECTIONS) lines.push("", label.toUpperCase(), info[key] || "");
  lines.push("", "ALCANCE", ...(info.scope || []));
  if (document?.collection_until) lines.push("", `Fin de recogida de datos: ${document.collection_until}`);
  if (document?.retention_until) lines.push(`Límite de conservación para el estudio: ${document.retention_until}`);
  lines.push("", "DECLARACIONES", ...Object.entries(info.declarations || {}).filter(([key]) => key !== "quotes" || info.allow_quotes).map(([, value]) => value));
  if (event) lines.push("", "CONSTANCIA DE TU DECISIÓN",
    `Identificador: ${event.id}`, `Fecha del registro: ${event.created_at}`,
    `Decisión: ${{ accepted: "Aceptación", declined: "No participa", withdrawn: "Retiro" }[event.action] || event.action}`,
    `Participación aceptada: ${event.participation_accepted ? "Sí" : "No"}`,
    `Tratamiento autorizado: ${event.data_processing_accepted ? "Sí" : "No"}`,
    `Mayoría de edad confirmada: ${event.adult_confirmed ? "Sí" : "No"}`,
    `Publicación opcional de fragmentos: ${event.quotes_accepted ? "Sí" : "No"}`);
  return lines.join("\n");
}

export function downloadTextFile(filename, text, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
