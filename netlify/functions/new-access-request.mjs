import { timingSafeEqual } from "node:crypto";

const DEFAULT_RECIPIENT = "contacto@nucleovivo.net";
const EMAIL_SUBJECT = "Nueva solicitud de acceso a Escucha Viva";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, { Allow: "POST" });
  }

  const webhookSecret = process.env.ACCESS_REQUEST_WEBHOOK_SECRET?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.ACCESS_REQUEST_FROM_EMAIL?.trim();

  if (!webhookSecret || !resendApiKey || !fromEmail) {
    console.error("ACCESS_REQUEST_NOTIFICATION_CONFIG_ERROR");
    return jsonResponse(503, { error: "Notification service is not configured" });
  }

  const providedSecret = getHeader(event.headers, "x-escucha-viva-webhook-secret");
  if (!secretsMatch(providedSecret, webhookSecret)) {
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
  if (!userEmail) {
    return jsonResponse(400, { error: "A valid user email is required" });
  }

  const userName = cleanText(record.full_name, 160) || "No informado";
  const registeredAt = formatRegistrationDate(record.registered_at || record.created_at);
  const recipient = normalizeEmail(process.env.ACCESS_REQUEST_TO_EMAIL) || DEFAULT_RECIPIENT;
  const reviewUrl = normalizeHttpsUrl(process.env.SUPABASE_USER_PROFILES_URL);
  const requestId = cleanText(record.id, 80) || cleanText(record.user_id, 80) || "unknown";
  const message = buildEmail({ userEmail, userName, registeredAt, reviewUrl });

  let providerResponse;
  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `escucha-viva-access-${requestId}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        reply_to: userEmail,
        subject: EMAIL_SUBJECT,
        text: message.text,
        html: message.html
      })
    });
  } catch (error) {
    console.error("ACCESS_REQUEST_NOTIFICATION_NETWORK_ERROR", {
      requestId,
      message: error?.message
    });
    return jsonResponse(502, { error: "Email provider is unavailable" });
  }

  const providerBody = await readProviderBody(providerResponse);
  if (!providerResponse.ok) {
    console.error("ACCESS_REQUEST_NOTIFICATION_PROVIDER_ERROR", {
      requestId,
      status: providerResponse.status,
      providerError: providerBody?.message || providerBody?.name || "Unknown provider error"
    });
    return jsonResponse(502, { error: "The notification could not be sent" });
  }

  console.info("ACCESS_REQUEST_NOTIFICATION_SENT", {
    requestId,
    providerId: providerBody?.id || null
  });

  return jsonResponse(200, { sent: true });
}

function buildEmail({ userEmail, userName, registeredAt, reviewUrl }) {
  const safeName = escapeHtml(userName);
  const safeEmail = escapeHtml(userEmail);
  const safeDate = escapeHtml(registeredAt);
  const reviewButton = reviewUrl
    ? `<a href="${escapeHtml(reviewUrl)}" style="display:inline-block;margin-top:20px;padding:12px 18px;border-radius:8px;background:#007c7a;color:#ffffff;text-decoration:none;font-weight:700;">Revisar solicitud en Supabase</a>`
    : "";
  const reviewText = reviewUrl ? `\nRevisar solicitud: ${reviewUrl}` : "";

  return {
    text: [
      "Hay una nueva solicitud de acceso al simulador Escucha Viva.",
      "",
      `Nombre: ${userName}`,
      `Correo: ${userEmail}`,
      `Fecha de registro: ${registeredAt}`,
      "Estado: pendiente de aprobación.",
      reviewText
    ].join("\n"),
    html: `
      <div style="margin:0;padding:28px;background:#f6f1e8;font-family:Arial,sans-serif;color:#102027;">
        <div style="max-width:600px;margin:0 auto;padding:28px;border:1px solid #d9e3e2;border-radius:12px;background:#ffffff;">
          <p style="margin:0 0 8px;color:#007c7a;font-size:13px;font-weight:700;text-transform:uppercase;">Escucha Viva · Simuladores formativos</p>
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;">Nueva solicitud de acceso</h1>
          <p style="margin:0 0 20px;line-height:1.6;">Hay una nueva solicitud pendiente de revisión por el equipo.</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
            <tr><td style="padding:8px 10px;background:#fff9f0;font-weight:700;">Nombre</td><td style="padding:8px 10px;background:#fff9f0;">${safeName}</td></tr>
            <tr><td style="padding:8px 10px;font-weight:700;">Correo</td><td style="padding:8px 10px;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 10px;background:#fff9f0;font-weight:700;">Fecha de registro</td><td style="padding:8px 10px;background:#fff9f0;">${safeDate}</td></tr>
            <tr><td style="padding:8px 10px;font-weight:700;">Estado</td><td style="padding:8px 10px;color:#9a6714;font-weight:700;">Pendiente de aprobación</td></tr>
          </table>
          ${reviewButton}
          <p style="margin:24px 0 0;color:#5f6f73;font-size:13px;line-height:1.5;">La aprobación debe realizarse desde Supabase. Este correo no contiene credenciales ni permite modificar el acceso sin autenticación administrativa.</p>
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

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeHttpsUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}
