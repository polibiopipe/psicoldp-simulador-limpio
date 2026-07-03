import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const FUNCTION_PATH = "/.netlify/functions/approve-access";

export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return htmlResponse(405, renderMessagePage({
      title: "Método no permitido",
      message: "Esta página solo permite revisar y confirmar solicitudes de acceso.",
      tone: "error"
    }), { Allow: "GET, POST" });
  }

  const config = getSupabaseConfig();
  if (!config.ok) {
    console.error("APPROVE_ACCESS_CONFIG_ERROR", { missing: config.missing });
    return htmlResponse(503, renderMessagePage({
      title: "Servicio no disponible",
      message: "La aprobación no está configurada. Contacta al equipo de Escucha Viva.",
      tone: "error"
    }));
  }

  const token = event.httpMethod === "GET"
    ? event.queryStringParameters?.token || ""
    : readPostToken(event);

  if (!isValidTokenFormat(token)) {
    return htmlResponse(400, renderInvalidTokenPage());
  }

  const tokenHash = hashApprovalToken(token);
  const supabase = createServerSupabase(config.supabaseUrl, config.serviceRoleKey);

  if (event.httpMethod === "GET") {
    return handleApprovalPreview(supabase, tokenHash, token);
  }

  return handleApprovalConfirmation(supabase, tokenHash);
}

async function handleApprovalPreview(supabase, tokenHash, token) {
  const { data, error } = await supabase
    .from("access_approval_notifications")
    .select("id,email,full_name,registered_at,status,approval_token_expires_at,used_at")
    .eq("approval_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("APPROVE_ACCESS_LOOKUP_ERROR", { code: error.code });
    return htmlResponse(500, renderMessagePage({
      title: "No pudimos revisar la solicitud",
      message: "Intenta nuevamente en unos minutos.",
      tone: "error"
    }));
  }

  if (!data) return htmlResponse(404, renderInvalidTokenPage());

  if (data.status === "approved" || data.used_at) {
    return htmlResponse(409, renderMessagePage({
      title: "Este enlace ya fue utilizado",
      message: "El acceso ya fue procesado. El usuario puede intentar ingresar al simulador.",
      tone: "notice"
    }));
  }

  if (data.status === "expired" || !isFutureDate(data.approval_token_expires_at)) {
    await markExpired(supabase, data.id);
    return htmlResponse(410, renderExpiredTokenPage());
  }

  return htmlResponse(200, renderConfirmationPage({
    email: data.email,
    fullName: data.full_name || "No informado",
    registeredAt: formatRegistrationDate(data.registered_at),
    token
  }));
}

async function handleApprovalConfirmation(supabase, tokenHash) {
  const { data, error } = await supabase.rpc("approve_access_with_token_hash", {
    p_token_hash: tokenHash
  });

  if (error) {
    console.error("APPROVE_ACCESS_RPC_ERROR", { code: error.code });
    return htmlResponse(500, renderMessagePage({
      title: "No pudimos aprobar el acceso",
      message: "No se realizaron cambios. Intenta nuevamente en unos minutos.",
      tone: "error"
    }));
  }

  const result = Array.isArray(data) ? data[0] : data;
  switch (result?.outcome) {
    case "approved":
      return htmlResponse(200, renderMessagePage({
        title: "Acceso aprobado correctamente",
        message: "El usuario ya puede ingresar al simulador con su correo y contraseña.",
        tone: "success"
      }));
    case "expired":
      return htmlResponse(410, renderExpiredTokenPage());
    case "used":
      return htmlResponse(409, renderMessagePage({
        title: "Este enlace ya fue utilizado",
        message: "La solicitud ya fue procesada y no puede aprobarse nuevamente.",
        tone: "notice"
      }));
    default:
      return htmlResponse(404, renderInvalidTokenPage());
  }
}

function getSupabaseConfig() {
  const values = {
    supabaseUrl: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim(),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  return { ...values, missing, ok: missing.length === 0 };
}

function createServerSupabase(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

function readPostToken(event) {
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  return new URLSearchParams(body).get("token") || "";
}

function isValidTokenFormat(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

function hashApprovalToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function isFutureDate(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

async function markExpired(supabase, notificationId) {
  const { error } = await supabase
    .from("access_approval_notifications")
    .update({ status: "expired" })
    .eq("id", notificationId)
    .eq("status", "pending")
    .is("used_at", null);
  if (error) {
    console.error("APPROVE_ACCESS_MARK_EXPIRED_ERROR", { code: error.code });
  }
}

function formatRegistrationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago"
  }).format(date);
}

function renderConfirmationPage({ email, fullName, registeredAt, token }) {
  return renderPage({
    title: "Confirmar aprobación",
    content: `
      <span class="eyebrow">Solicitud pendiente</span>
      <h1>Confirmar acceso a Escucha Viva</h1>
      <p class="lead">Revisa los datos antes de habilitar esta cuenta.</p>
      <dl class="request-data">
        <div><dt>Nombre</dt><dd>${escapeHtml(fullName)}</dd></div>
        <div><dt>Correo</dt><dd>${escapeHtml(email)}</dd></div>
        <div><dt>Fecha de registro</dt><dd>${escapeHtml(registeredAt)}</dd></div>
        <div><dt>Estado</dt><dd><span class="status">Pendiente de aprobación</span></dd></div>
      </dl>
      <form action="${FUNCTION_PATH}" method="post">
        <input type="hidden" name="token" value="${escapeHtml(token)}">
        <button type="submit">Confirmar aprobación</button>
      </form>
      <p class="security-note">El enlace es de un solo uso. La aprobación se realizará de forma segura en el servidor.</p>
    `
  });
}

function renderInvalidTokenPage() {
  return renderMessagePage({
    title: "Enlace de aprobación inválido",
    message: "Este enlace no corresponde a una solicitud válida. Solicita un nuevo aviso desde el equipo de Escucha Viva.",
    tone: "error"
  });
}

function renderExpiredTokenPage() {
  return renderMessagePage({
    title: "El enlace ha vencido",
    message: "Por seguridad, los enlaces de aprobación duran 7 días. Esta solicitud no fue aprobada.",
    tone: "error"
  });
}

function renderMessagePage({ title, message, tone }) {
  const icon = tone === "success" ? "✓" : tone === "notice" ? "i" : "!";
  return renderPage({
    title,
    content: `
      <div class="result-icon ${escapeHtml(tone)}" aria-hidden="true">${icon}</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(message)}</p>
      <p class="institutional">Escucha Viva · Una iniciativa de Núcleo Vivo</p>
    `
  });
}

function renderPage({ title, content }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>${escapeHtml(title)} · Escucha Viva</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; color: #102027; background: #f6f1e8; }
      main { width: min(100%, 560px); padding: clamp(24px, 5vw, 44px); border: 1px solid #d9e3e2; border-radius: 16px; background: #fffdf9; box-shadow: 0 18px 50px rgba(16, 42, 67, .12); }
      .brand { margin: 0 0 28px; color: #063f46; font-weight: 800; font-size: 18px; }
      .brand span { display: block; margin-top: 3px; color: #5f6f73; font-size: 12px; font-weight: 600; }
      .eyebrow { display: inline-block; margin-bottom: 10px; color: #007c7a; font-size: 12px; font-weight: 800; text-transform: uppercase; }
      h1 { margin: 0; color: #102a43; font-size: clamp(26px, 7vw, 36px); line-height: 1.15; }
      .lead { margin: 14px 0 26px; color: #5f6f73; font-size: 17px; line-height: 1.6; }
      .request-data { margin: 0 0 26px; border: 1px solid #e2e8e7; border-radius: 12px; overflow: hidden; }
      .request-data div { display: grid; grid-template-columns: minmax(110px, .8fr) 1.2fr; gap: 16px; padding: 13px 15px; }
      .request-data div:nth-child(odd) { background: #fff9f0; }
      dt { color: #5f6f73; font-size: 13px; font-weight: 700; }
      dd { margin: 0; overflow-wrap: anywhere; font-weight: 700; }
      .status { color: #9a6714; }
      button { width: 100%; min-height: 50px; border: 0; border-radius: 10px; color: white; background: #007c7a; font: inherit; font-weight: 800; cursor: pointer; box-shadow: 0 8px 20px rgba(0, 124, 122, .2); }
      button:hover { background: #056b6a; }
      button:focus-visible { outline: 3px solid rgba(24, 166, 161, .35); outline-offset: 3px; }
      .security-note, .institutional { margin: 20px 0 0; color: #6d7b7e; font-size: 13px; line-height: 1.5; }
      .result-icon { display: grid; place-items: center; width: 54px; height: 54px; margin-bottom: 20px; border-radius: 50%; color: white; background: #b5473c; font-size: 26px; font-weight: 800; }
      .result-icon.success { background: #007c7a; }
      .result-icon.notice { background: #c79a3b; }
      @media (max-width: 480px) { body { padding: 14px; } main { border-radius: 12px; } .request-data div { grid-template-columns: 1fr; gap: 4px; } }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">Escucha Viva<span>Simuladores formativos</span></p>
      ${content}
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      ...extraHeaders
    },
    body
  };
}
