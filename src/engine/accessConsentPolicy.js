// Shared by the browser and the authenticated API. No browser-only dependencies.
export async function readAccessConsent(client, userId = "") {
  const documentResult = await client.from("simulation_access_documents").select("*").eq("is_current", true).maybeSingle();
  if (documentResult.error || !documentResult.data?.version) throw new Error("No pudimos verificar las condiciones de ingreso. Reintenta en unos momentos.");
  const document = documentResult.data;
  if (!userId) return { document, receipt: null };
  const receiptResult = await client.from("simulation_access_consents").select("*").eq("user_id", userId).eq("document_version", document.version).maybeSingle();
  if (receiptResult.error) throw new Error("No pudimos verificar tu aceptación. Reintenta antes de ingresar.");
  const row = receiptResult.data;
  const receipt = row?.id && row.user_id === userId && row.document_version === document.version && row.adult_confirmed && row.educational_use_accepted && row.data_processing_accepted ? row : null;
  return { document, receipt };
}

export function accessDocumentText(document, receipt = null) {
  return ["ESCUCHA VIVA · CONDICIONES DE INGRESO", `Versión: ${document.version}`, document.title,
    ...document.information.sections.flatMap(({ title, text }) => ["", title, text]),
    "", "Declaraciones", ...Object.values(document.information.declarations),
    ...(receipt ? ["", "CONSTANCIA DE ACEPTACIÓN", `Registro: ${receipt.id}`, `Cuenta: ${receipt.user_id}`, `Fecha: ${receipt.created_at}`, "Mayoría de edad, uso educativo y tratamiento necesario: aceptados expresamente."] : []),
    "", "Este documento no constituye consentimiento para una investigación."
  ].join("\n");
}
