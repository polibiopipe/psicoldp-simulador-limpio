import { createClient } from "@supabase/supabase-js";

// Server-only endpoint. Set TAVUS_API_KEY and TAVUS_CLAUDIO_PERSONA_ID in Vercel.
// SUPABASE_URL and SUPABASE_ANON_KEY must refer to Escucha Viva v2.
// Never put TAVUS_API_KEY in a VITE_* variable.
const send = (res, status, json) => res.status(status).json(json);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return send(res, 405, { error: "Método no permitido" });
  if (req.method === "POST" && req.headers["content-type"]?.split(";")[0] !== "application/json") return send(res, 415, { error: "Formato no permitido" });
  const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
  if (!token) return send(res, 401, { error: "Debes iniciar sesión" });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return send(res, 503, { error: "Autenticación no configurada" });
  const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return send(res, 401, { error: "Sesión inválida" });
  const [{ data: profile, error: profileError }, { data: consent, error: consentError }] = await Promise.all([
    client.from("user_profiles").select("approved").eq("id", user.id).single(),
    client.rpc("current_user_has_simulation_access_consent")
  ]);
  if (profileError || consentError || profile?.approved !== true || consent !== true) {
    return send(res, 403, { error: "La cuenta debe estar aprobada y contar con consentimiento vigente" });
  }
  if (!process.env.TAVUS_API_KEY || !process.env.TAVUS_CLAUDIO_PERSONA_ID) return send(res, 503, { error: "El servicio de avatar de Claudio aún no está configurado" });
  if (req.method === "GET") {
    const personaId = process.env.TAVUS_CLAUDIO_PERSONA_ID.trim();
    if (!/^p[a-zA-Z0-9_-]{5,}$/.test(personaId)) {
      return send(res, 422, { error: "El identificador guardado no tiene formato de Persona ID de Tavus (debe comenzar por p)." });
    }
    try {
      const verification = await fetch("https://tavusapi.com/v2/personas/" + encodeURIComponent(personaId), {
        method: "GET",
        headers: { "x-api-key": process.env.TAVUS_API_KEY },
        signal: AbortSignal.timeout(12000)
      });
      if (!verification.ok) {
        const description = { 400:"Identificador de persona inválido.", 401:"La clave API de Tavus no es válida.", 403:"La clave API no tiene permiso para esta persona.", 404:"La persona no existe en la cuenta de Tavus.", 429:"Tavus limitó temporalmente las solicitudes." };
        return send(res, 502, { error: description[verification.status] || "No fue posible verificar la persona.", providerStatus: verification.status });
      }
      const persona = await verification.json();
      return send(res, 200, { ready: true, message: "Tavus reconoce la persona y la clave API. Esta verificación no crea ninguna videollamada.", personaName: typeof persona.persona_name === "string" ? persona.persona_name.slice(0, 100) : null });
    } catch { return send(res, 502, { error:"No fue posible verificar la conexión con Tavus." }); }
  }
  // A dedicated Tavus persona must be configured in its dashboard using the canonical Claudio biography.
  try {
    const upstream = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: { "x-api-key": process.env.TAVUS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        persona_id: process.env.TAVUS_CLAUDIO_PERSONA_ID,
        conversation_name: "Escucha Viva - Claudio - Piloto máximo 4 minutos",
        properties: { max_call_duration: 240, enable_recording: false }
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) {
      const safeMessages = { 400: "Tavus rechazó la configuración de la conversación o sus parámetros.", 401: "Tavus rechazó la clave API: verifica que corresponda a esta cuenta.", 403: "La cuenta Tavus no tiene permiso para crear esta conversación.", 404: "La persona audiovisual indicada no existe o no está disponible.", 422: "La persona o el avatar no cumplen los requisitos de Tavus.", 429: "Tavus aplicó un límite de uso o solicitudes." };
      return send(res, 502, { error: safeMessages[upstream.status] || "El proveedor de video rechazó la solicitud.", providerStatus: upstream.status });
    }
    const data = await upstream.json();
    if (!/^https:\/\//.test(data.conversation_url || "") || !data.conversation_url.startsWith("https://")) {
      return send(res, 502, { error: "Respuesta de sesión inválida" });
    }
    return send(res, 200, { conversationUrl: data.conversation_url });
  } catch {
    return send(res, 502, { error: "Servicio de videollamada no disponible" });
  }
}
