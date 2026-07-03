import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_RECIPIENT = "contacto@nucleovivo.net";
const EMAIL_SUBJECT = "Nueva solicitud de acceso a Escucha Viva";
const APPROVAL_URL =
  "https://psicoldp-simulador1.netlify.app/.netlify/functions/approve-access";
const TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, { Allow: "POST" });
  }

  const config = getServerConfig();
  if (!config.ok) {
    console.error("ACCESS_REQUEST_NOTIFICATION_CONFIG_ERROR", {
      missing: config.missing
    });
    return jsonResponse(503, { error: "Notification service is not configured" });
  }

  const providedSecret = getHeader(event.headers, "x-escucha-viva-webhook-secret");
  if (!secretsMatch(providedSecret, config.webhookSecret)) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const record = payload?.record;
  if (
    payload?.type !== "INSERT" ||
    payload?.schema !== "public" ||
    payload?.table !== "access_approval_notifications" ||
    !record
  ) {
    return jsonResponse(400, { error: "Unexpected webhook payload" });
  }

  if (record.status && record.status !== "pending") {
    return jsonResponse(202, { ignored: true });
  }

  const userEmail = normalizeEmail(record.email);
  const notificationId = normalizeUuid(record.id);
  if (!userEmail || !notificationId) {
    return jsonResponse(400, { error: "A valid notification and email are required" });
  }

  const supabase = createServerSupabase(config.supabaseUrl, config.serviceRoleKey);
  const existingResult = await supabase
    .from("access_approval_notifications")
    .select("id,status,used_at,approval_token_hash,approval_token_expires_at,email_sent_at")
    .eq("id", notificationId)
    .maybeSingle();

  if (existingResult.error) {
    console.error("ACCESS_REQUEST_NOTIFICATION_LOAD_ERROR", {
      notificationId,
      code: existingResult.error.code
    });
    return jsonResponse(500, { error: "The access request could not be loaded" });
  }

  const existing = existingResult.data;
  if (!existing || existing.status !== "pending" || existing.used_at) {
    return jsonResponse(202, { ignored: true });
  }

  if (
    existing.email_sent_at &&
    existing.approval_token_hash &&
    isFutureDate(existing.approval_token_expires_at)
  ) {
    return jsonResponse(202, { alreadySent: true });
  }

  const approvalToken = randomBytes(32).toString("base64url");
  const tokenHash = hashApprovalToken(approvalToken);
  const tokenExpiresAt = new Date(Date.now() + TOKEN_DURATION_MS).toISOString();

  const tokenUpdate = await supabase
    .from("access_approval_notifications")
    .update({
      approval_token_hash: tokenHash,
      approval_token_expires_at: tokenExpiresAt,
      approved_at: null,
      used_at: null,
      email_sent_at: null,
      status: "pending"
    })
    .eq("id", notificationId)
    .eq("status", "pending")
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (tokenUpdate.error || !tokenUpdate.data) {
    console.error("ACCESS_REQUEST_TOKEN_SAVE_ERROR", {
      notificationId,
      code: tokenUpdate.error?.code || null
    });
    return jsonResponse(500, { error: "The approval link could not be prepared" });
  }

  const userName = cleanText(record.full_name, 160) || "No informado";
  const registeredAt = formatRegistrationDate(record.registered_at || record.created_at);
  const recipient = normalizeEmail(process.env.ACCESS_REQUEST_TO_EMAIL) || DEFAULT_RECIPIENT;
  const approvalUrl = `${APPROVAL_URL}?token=${encodeURIComponent(approvalToken)}`;
  const message = buildEmail({
    userEmail,
    userName,
    registeredAt,
    approvalUrl
  });

  let providerResponse;
  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `escucha-viva-access-${tokenHash.slice(0, 24)}`
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [recipient],
        reply_to: userEmail,
        subject: EMAIL_SUBJECT,
        text: message.text,
        html: message.html
      })
    });
  } catch (error) {
    await clearUnusedToken(supabase, notificationId, tokenHash);
    console.error("ACCESS_REQUEST_NOTIFICATION_NETWORK_ERROR", {
      notificationId,
      message: error?.message
    });
    return jsonResponse(502, { error: "Email provider is unavailable" });
  }

  const providerBody = await readProviderBody(providerResponse);
  if (!providerResponse.ok) {
    await clearUnusedToken(supabase, notificationId, tokenHash);
    console.error("ACCESS_REQUEST_NOTIFICATION_PROVIDER_ERROR", {
      notificationId,
      status: providerResponse.status,
      providerError: providerBody?.message || providerBody?.name || "Unknown provider error"
    });
    return jsonResponse(502, { error: "The notification could not be sent" });
  }

  const sentUpdate = await supabase
    .from("access_approval_notifications")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("approval_token_hash", tokenHash)
    .eq("status", "pending");

  if (sentUpdate.error) {
    console.error("ACCESS_REQUEST_NOTIFICATION_SENT_STATE_ERROR", {
      notificationId,
      code: sentUpdate.error.code
    });
  }

  console.info("ACCESS_REQUEST_NOTIFICATION_SENT", {
    notificationId,
    providerId: providerBody?.id || null
  });

  return jsonResponse(200, { sent: true });
}

function getServerConfig() {
  const values = {
    webhookSecret: process.env.ACCESS_REQUEST_WEBHOOK_SECRET?.trim(),
    resendApiKey: process.env.RESEND_API_KEY?.trim(),
    fromEmail: process.env.ACCESS_REQUEST_FROM_EMAIL?.trim(),
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

async function clearUnusedToken(supabase, notificationId, tokenHash) {
  const { error } = await supabase
    .from("access_approval_notifications")
    .update({
      approval_token_hash: null,
      approval_token_expires_at: null,
      email_sent_at: null
    })
    .eq("id", notificationId)
    .eq("approval_token_hash", tokenHash)
    .eq("status", "pending")
    .is("used_at", null);

  if (error) {
    console.error("ACCESS_REQUEST_TOKEN_CLEANUP_ERROR", {
      notificationId,
      code: error.code
    });
  }
}

function buildEmail({ userEmail, userName, registeredAt, approvalUrl }) {
  const safeName = escapeHtml(userName);
  const safeEmail = escapeHtml(userEmail);
  const safeDate = escapeHtml(registeredAt);
  const safeApprovalUrl = escapeHtml(approvalUrl);

  return {
    text: [
      "Hay una nueva solicitud de acceso al simulador Escucha Viva.",
      "",
      `Nombre: ${userName}`,
      `Correo: ${userEmail}`,
      `Fecha de registro: ${registeredAt}`,
      "Estado: pendiente de aprobación.",
      "",
      `Aprobar acceso: ${approvalUrl}`,
      "",
      "El enlace es de un solo uso y expira en 7 días."
    ].join("\n"),
    html: `
      <div style="margin:0;padding:28px;background:#f6f1e8;font-family:Arial,sans-serif;color:#102027;">
        <div style="max-width:600px;margin:0 auto;padding:28px;border:1px solid #d9e3e2;border-radius:12px;background:#ffffff;">
          <p style="margin:0 0 8px;color:#007c7a;font-size:13px;font-weight:700;text-transform:uppercase;">Escucha Viva · Simuladores formativos</p>
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;">Nueva solicitud de acceso</h1>
          <p style="margin:0 0 20px;line-height:1.6;">Hay una nueva solicitud pendiente de aprobación por el equipo.</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
            <tr><td style="padding:8px 10px;background:#fff9f0;font-weight:700;">Nombre</td><td style="padding:8px 10px;background:#fff9f0;">${safeName}</td></tr>
            <tr><td style="padding:8px 10px;font-weight:700;">Correo</td><td style="padding:8px 10px;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 10px;background:#fff9f0;font-weight:700;">Fecha de registro</td><td style="padding:8px 10px;background:#fff9f0;">${safeDate}</td></tr>
            <tr><td style="padding:8px 10px;font-weight:700;">Estado</td><td style="padding:8px 10px;color:#9a6714;font-weight:700;">Pendiente de aprobación</td></tr>
          </table>
          <a href="${safeApprovalUrl}" style="display:inline-block;margin-top:22px;padding:13px 20px;border-radius:8px;background:#007c7a;color:#ffffff;text-decoration:none;font-weight:700;">Aprobar acceso</a>
          <p style="margin:20px 0 0;color:#5f6f73;font-size:13px;line-height:1.5;">Este enlace es personal, de un solo uso y expira en 7 días. No lo reenvíes.</p>
        </div>
      </div>
    `
  };
}

function getHeader(headers = {}, expectedName) {
  const match = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === expectedName.toLowerCase()
  );
  return typeof match?.[1] === "string" ? match[1] : "";
}

function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function hashApprovalToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeUuid(value) {
  if (typeof value !== "string") return "";
  const uuid = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid)
    ? uuid
    : "";
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isFutureDate(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function formatRegistrationDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readProviderBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}
