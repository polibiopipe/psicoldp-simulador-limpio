import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { RESEARCH_STUDY_KEY } from "../data/researchConsent.js";

function requireClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Conéctate a tu cuenta para gestionar el consentimiento.");
  return supabase;
}

export async function loadResearchConsent(userId) {
  const client = requireClient();
  const [studiesResult, eventsResult] = await Promise.all([
    client.from("simulation_research_studies").select("*").eq("study_key", RESEARCH_STUDY_KEY).order("published_at", { ascending: false }),
    userId
      ? client.from("simulation_research_consent_events").select("*").eq("user_id", userId).eq("study_key", RESEARCH_STUDY_KEY).order("sequence", { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (studiesResult.error || eventsResult.error) throw new Error("No pudimos verificar el consentimiento. Reintenta para ver tu estado actualizado.");
  const studies = studiesResult.data || [];
  return {
    study: studies.find((study) => study.status === "published" && new Date(study.collection_until).getTime() > Date.now()) || null,
    events: eventsResult.data || []
  };
}

export async function recordResearchDecision({ userId, studyId, previousEventId, action, participation = false, dataProcessing = false, adult = false, quotes = false }) {
  const client = requireClient();
  const result = await client.from("simulation_research_consent_events").insert({
    user_id: userId, study_id: studyId, study_key: RESEARCH_STUDY_KEY,
    previous_event_id: previousEventId || null, action,
    participation_accepted: participation, data_processing_accepted: dataProcessing,
    adult_confirmed: adult, quotes_accepted: quotes
  }).select("*").single();
  if (result.error || !result.data?.id) {
    if (result.error?.code === "40001") throw new Error("Tu decisión cambió en otra ventana. Actualiza el estado antes de volver a decidir.");
    throw new Error("No se confirmó el registro. Tu decisión no se mostrará como guardada hasta verificarla. Actualiza el estado y reintenta.");
  }
  return result.data;
}

export async function exportOwnSimulatorData(userId) {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error || data?.user?.id !== userId) throw new Error("La cuenta cambió. Vuelve a abrir tus datos.");
  const output = { exported_at: new Date().toISOString(), account: { id: userId, email: data.user.email }, tables: {} };
  for (const [table, ownerColumn] of [
    ["user_profiles", "id"], ["simulation_sessions", "user_id"],
    ["simulation_appointments", "user_id"], ["simulation_student_availability", "user_id"],
    ["simulation_interventions", "user_id"],
    ["simulation_research_consent_events", "user_id"]
  ]) {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const result = await client.from(table).select("*").eq(ownerColumn, userId).order("id").range(offset, offset + 499);
      if (result.error) throw new Error("No pudimos completar la descarga. No se generó una copia parcial; reintenta o solicita tus datos al contacto de privacidad.");
      rows.push(...result.data);
      if (result.data.length < 500) break;
    }
    output.tables[table] = rows;
  }
  const finalAuth = await client.auth.getUser();
  if (finalAuth.error || finalAuth.data?.user?.id !== userId) throw new Error("La cuenta cambió durante la descarga. Vuelve a abrir tus datos.");
  return output;
}
