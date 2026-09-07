import { supabase } from "./supabaseClient.js";
import { normalizeStatisticsRow } from "../engine/researchStatistics.js";

const PAGE_SIZE = 500;
const OWN_FIELDS = "id,case_id,session_number,status,started_at,created_at,metrics:feedback->sessionMetrics,general_score:feedback->generalScore,openness:feedback->patientOpenness->final,measurement_version:feedback->measurementVersion";

export async function loadStatistics({ userId, scope = "own", signal }) {
  if (!supabase || !userId) throw new Error("Inicia sesión para consultar los registros guardados en tu cuenta.");
  const rows = [];
  let cursor = null;
  while (true) {
    let query;
    if (scope === "study") {
      query = supabase.rpc("research_statistics_page", { p_after: cursor, p_limit: PAGE_SIZE });
    } else {
      query = supabase.from("simulation_sessions").select(OWN_FIELDS)
        .eq("user_id", userId).order("id", { ascending: true }).limit(PAGE_SIZE);
      if (cursor) query = query.gt("id", cursor);
    }
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw new Error("No se pudieron cargar las estadísticas. Reintenta; los datos parciales no se mostrarán.");
    const page = data || [];
    rows.push(...page.map(normalizeStatisticsRow));
    if (page.length < PAGE_SIZE) break;
    const next = page[page.length - 1].id;
    if (!next || next === cursor) throw new Error("No se pudo completar la lectura de registros.");
    cursor = next;
  }
  return rows;
}

export async function loadResearchContext(signal) {
  if (!supabase) return null;
  let query = supabase.rpc("research_context");
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw new Error("El módulo de investigación aún no está disponible. Tus estadísticas personales funcionan por separado.");
  return data;
}

export async function setResearchConsent(accepted, protocolVersion) {
  const { data, error } = await supabase.rpc("set_research_consent", {
    p_accepted: accepted, p_version: protocolVersion
  });
  if (error) throw new Error("No se pudo actualizar tu decisión. Recarga y vuelve a intentarlo.");
  return data;
}
