import { createClient } from "@supabase/supabase-js";
import { readAccessConsent } from "../src/engine/accessConsentPolicy.js";
import { buildMediationContext, mediationInstruction, mediationSchema, validateMediationResult } from "../src/engine/feedbackMediation.js";

// Independent, read-only tutoring endpoint. Never calls the patient engine,
// updates session scores, reserves interventions, or changes the closure.
export function createMediationHandler({ clientFactory = createClient, providerFetch = fetch } = {}) {
  const recentRequests = new Map();
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const send = (status, code, message) => res.status(status).json({ code, message });
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405, "METHOD_NOT_ALLOWED", "Utiliza el formulario de revisión."); }
    try {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
      if (raw.length > 8000) return send(413, "TOO_LARGE", "Acorta tu reflexión y tu segundo intento.");
      let body;
      try { body = JSON.parse(raw); } catch { return send(400, "INVALID_REQUEST", "No pudimos leer la solicitud."); }
      const { sessionRecordId, turnIndex, reflection, rewrite } = body || {};
      if (typeof sessionRecordId !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(sessionRecordId) || !Number.isInteger(turnIndex) || turnIndex < 1 ||
          typeof reflection !== "string" || !reflection.trim() || reflection.length > 1600 || typeof rewrite !== "string" || !rewrite.trim() || rewrite.length > 1600) {
        return send(400, "INVALID_REQUEST", "Selecciona un turno y escribe tu reflexión y tu segundo intento.");
      }
      const token = String(req.headers?.authorization || "").match(/^Bearer (\S+)$/i)?.[1];
      if (!token) return send(401, "AUTH_REQUIRED", "Inicia sesión para solicitar la mediación de IA.");
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return send(503, "UNAVAILABLE", "La mediación de IA no está disponible. Puedes conservar y descargar tu ejercicio.");
      const client = clientFactory(url, key, { auth: { persistSession: false } });
      const { data, error } = await client.auth.getUser(token);
      const userId = data?.user?.id;
      if (error || !userId) return send(401, "AUTH_INVALID", "Tu sesión venció. Vuelve a ingresar para solicitar la revisión.");
      const [profile, assignment] = await Promise.all([
        client.from("user_profiles").select("approved").eq("id", userId).maybeSingle(),
        client.from("simulator_access").select("simulator_id,enabled").eq("user_id", userId).maybeSingle()
      ]);
      if (profile.error || assignment.error) return send(503, "ACCESS_LOOKUP_FAILED", "No pudimos verificar tu acceso. Reintenta en unos momentos.");
      if (profile.data?.approved !== true || assignment.data?.simulator_id !== "escucha-viva" || assignment.data?.enabled !== true) return send(403, "ACCESS_REQUIRED", "Tu cuenta no tiene acceso activo a Escucha Viva.");
      const access = await readAccessConsent(client, userId);
      if (!access.receipt) return send(403, "CONSENT_REQUIRED", "Actualiza el simulador y revisa las condiciones de ingreso.");
      const record = await client.from("simulation_sessions").select("id,user_id,status,conversation,feedback").eq("id", sessionRecordId).eq("user_id", userId).maybeSingle();
      if (record.error) return send(503, "SESSION_LOOKUP_FAILED", "No pudimos recuperar la entrevista guardada. Reintenta.");
      if (!record.data || record.data.user_id !== userId) return send(404, "SESSION_NOT_FOUND", "No encontramos esta entrevista en tu cuenta.");
      if (!["closure_pending", "completed"].includes(record.data.status)) return send(409, "CLOSURE_REQUIRED", "Finaliza y guarda la entrevista antes de solicitar la mediación.");
      const conversation = record.data.conversation;
      if (!Array.isArray(conversation) || JSON.stringify(conversation).length > 180000) return send(413, "CONTEXT_LIMIT", "Esta entrevista requiere una revisión docente por su extensión.");
      let context;
      try {
        context = buildMediationContext([...(record.data.feedback?.sessionPrelude || []), ...conversation], turnIndex, reflection.trim(), rewrite.trim());
      } catch { return send(409, "TURN_NOT_SAVED", "Este turno todavía no tiene una respuesta guardada. Guarda el cierre y reintenta."); }
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) return send(503, "AI_UNAVAILABLE", "La mediación de IA no está disponible. Tu reflexión y el informe siguen disponibles.");
      const now = Date.now();
      for (const [id, value] of recentRequests) if (now - value.started > 60000) recentRequests.delete(id);
      const usage = recentRequests.get(userId) || { started: now, count: 0 };
      if (usage.count >= 4) return send(429, "SLOW_DOWN", "Dedica un momento a revisar la devolución y reintenta en un minuto.");
      usage.count++; recentRequests.set(userId, usage);
      const configured = process.env.GEMINI_FEEDBACK_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const model = /^[a-zA-Z0-9._-]+$/.test(configured) ? configured : "gemini-2.5-flash";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      let response;
      let generated;
      try {
        response = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, signal: controller.signal,
          body: JSON.stringify({ systemInstruction: { parts: [{ text: mediationInstruction }] }, contents: [{ role: "user", parts: [{ text: JSON.stringify(context) }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2800, responseMimeType: "application/json", responseSchema: mediationSchema } })
        });
        if (response.ok) generated = await response.json();
      } finally { clearTimeout(timeout); }
      if (!response.ok) return send(503, "PROVIDER_UNAVAILABLE", "La IA no pudo completar la revisión. Tu ejercicio se conserva; puedes reintentar.");
      const candidate = generated?.candidates?.[0];
      let value;
      try { value = JSON.parse(candidate?.content?.parts?.filter(part => !part.thought).map(part => part.text || "").join("") || ""); } catch { /* reject malformed output */ }
      const result = candidate?.finishReason === "STOP" && validateMediationResult(value, context.selected);
      if (!result) return send(502, "UNGROUNDED_RESPONSE", "La devolución no pudo vincularse de forma fiable con tu intercambio. Conservamos el informe y tu ejercicio para que puedas reintentar o revisarlos con tu docente.");
      return res.status(200).json({ ...result, source: "gemini", model, turnIndex, generatedAt: new Date().toISOString() });
    } catch (error) {
      return send(503, "MEDIATION_UNAVAILABLE", error?.name === "AbortError" ? "La revisión tardó más de lo esperado. Tu ejercicio se conserva; puedes reintentar." : "No pudimos completar la mediación. Conserva tu ejercicio y vuelve a intentarlo.");
    }
  };
}
export default createMediationHandler();
