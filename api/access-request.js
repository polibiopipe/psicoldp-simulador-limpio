import { createHmac } from "node:crypto";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_SUBJECT = "Nueva solicitud de acceso a Escucha Viva";
const APPROVAL_LINK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      provider: "vercel",
      function: "access-request",
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.ACCESS_REQUEST_FROM_EMAIL),
      hasToEmail: Boolean(process.env.ACCESS_REQUEST_TO_EMAIL),
      hasApprovalSecret: Boolean(process.env.ACCESS_APPROVAL_SECRET),
      hasAppBaseUrl: Boolean(process.env.APP_BASE_URL)
    });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const payload = readPayload(req);
  const userEmail = normalizeEmail(payload.email);
  if (!userEmail) {
    res.status(400).json({
      ok: false,
      emailSent: false,
      reason: "invalid_email"
    });
    return;
  }

  const config = getResendConfig();
  if (!config.ok) {
    console.warn("ACCESS_REQUEST_EMAIL_CONFIG_MISSING", {
      missing: config.missing
    });
    res.status(200).json({
      ok: false,
      emailSent: false,
      reason: "missing_resend_configuration",
      missing: config.missing
    });
    return;
  }

  const fullName = cleanText(payload.fullName || payload.name, 160) || "No informado";
  const registeredAt = formatRegistrationDate(payload.createdAt || new Date().toISOString());
  const approvalUrl = buildApprovalUrl({
    email: userEmail,
    baseUrl: getAppBaseUrl(req),
    secret: process.env.ACCESS_APPROVAL_SECRET?.trim()
  });
  const message = buildEmail({
    userEmail,
    fullName,
    registeredAt,
    approvalUrl
  });

  let providerResponse;
  try {
    providerResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [config.toEmail],
        reply_to: userEmail,
        subject: DEFAULT_SUBJECT,
        text: message.text,
        html: message.html
      })
    });
  } catch (error) {
    console.error("ACCESS_REQUEST_EMAIL_NETWORK_ERROR", {
      message: cleanText(error?.message, 180)
    });
    res.status(200).json({
      ok: false,
      emailSent: false,
      reason: "resend_network_error"
    });
    return;
  }

  const providerBody = await readProviderBody(providerResponse);
  if (!providerResponse.ok) {
    console.error("ACCESS_REQUEST_EMAIL_PROVIDER_ERROR", {
      status: providerResponse.status,
      providerError: cleanText(providerBody?.message || providerBody?.name, 180)
    });
    res.status(200).json({
      ok: false,
      emailSent: false,
      reason: "resend_provider_error",
      status: providerResponse.status
    });
    return;
  }

  console.info("ACCESS_REQUEST_EMAIL_SENT", {
    providerId: providerBody?.id || null,
    to: config.toEmail
  });

  res.status(200).json({
    ok: true,
    emailSent: true,
    provider: "resend"
  });
}

function setJsonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}

function readPayload(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

function getResendConfig() {
  const values = {
    resendApiKey: process.env.RESEND_API_KEY?.trim(),
    fromEmail: process.env.ACCESS_REQUEST_FROM_EMAIL?.trim(),
    toEmail: process.env.ACCESS_REQUEST_TO_EMAIL?.trim()
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  return { ...values, missing, ok: missing.length === 0 };
}

function buildEmail({ userEmail, fullName, registeredAt, approvalUrl }) {
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(userEmail);
  const safeDate = escapeHtml(registeredAt);
  const safeApprovalUrl = approvalUrl ? escapeHtml(approvalUrl) : "";

  return {
    text: [
      "Hay una nueva solicitud de acceso al simulador Escucha Viva.",
      "",
      `Nombre: ${fullName}`,
      `Correo: ${userEmail}`,
      `Fecha de registro: ${registeredAt}`,
      "Estado: pendiente de aprobacion.",
      "",
      ...(approvalUrl ? [`Aprobar acceso: ${approvalUrl}`, ""] : []),
      "Para aprobar manualmente:",
      "1. Abre Supabase.",
      "2. Ve a Table Editor -> public.user_profiles.",
      "3. Busca el correo del usuario.",
      "4. Cambia approved a true."
    ].join("\n"),
    html: `
      <div style="margin:0;padding:28px;background:#f7f8f6;font-family:Arial,sans-serif;color:#10212b;">
        <div style="max-width:600px;margin:0 auto;padding:28px;border:1px solid #e1e5e3;border-radius:14px;background:#ffffff;">
          <p style="margin:0 0 8px;color:#176d75;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Escucha Viva</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Nueva solicitud de acceso</h1>
          <p style="margin:0 0 20px;line-height:1.6;">Hay un nuevo usuario pendiente de aprobacion manual.</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
            <tr>
              <td style="padding:9px 10px;background:#f7f8f6;font-weight:700;">Nombre</td>
              <td style="padding:9px 10px;background:#f7f8f6;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:9px 10px;font-weight:700;">Correo</td>
              <td style="padding:9px 10px;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding:9px 10px;background:#f7f8f6;font-weight:700;">Fecha</td>
              <td style="padding:9px 10px;background:#f7f8f6;">${safeDate}</td>
            </tr>
            <tr>
              <td style="padding:9px 10px;font-weight:700;">Estado</td>
              <td style="padding:9px 10px;color:#9a6714;font-weight:700;">Pendiente de aprobacion</td>
            </tr>
          </table>
          ${
            safeApprovalUrl
              ? `<a href="${safeApprovalUrl}" style="display:inline-block;margin-top:22px;padding:13px 20px;border-radius:10px;background:#176d75;color:#ffffff;text-decoration:none;font-weight:700;">Aprobar acceso</a>
          <p style="margin:12px 0 0;color:#5f6f73;font-size:13px;line-height:1.45;">El enlace es seguro, personal y temporal. Si expira, aprueba manualmente desde Supabase.</p>`
              : ""
          }
          <div style="margin-top:22px;padding:16px;border-radius:12px;background:#fff9f0;border:1px solid #eadcc5;">
            <p style="margin:0 0 8px;font-weight:700;">Aprobacion manual</p>
            <p style="margin:0;line-height:1.55;color:#40515a;">En Supabase, abre <strong>public.user_profiles</strong>, busca este correo y cambia <strong>approved</strong> a <strong>true</strong>.</p>
          </div>
        </div>
      </div>
    `
  };
}

function buildApprovalUrl({ email, baseUrl, secret }) {
  if (!email || !baseUrl || !secret) {
    console.warn("ACCESS_APPROVAL_LINK_CONFIG_MISSING", {
      hasEmail: Boolean(email),
      hasBaseUrl: Boolean(baseUrl),
      hasSecret: Boolean(secret)
    });
    return "";
  }

  const expires = String(Date.now() + APPROVAL_LINK_DURATION_MS);
  const token = signApprovalToken({ email, expires, secret });
  const url = new URL("/api/approve-access", baseUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("expires", expires);
  url.searchParams.set("token", token);
  return url.toString();
}

function signApprovalToken({ email, expires, secret }) {
  return createHmac("sha256", secret)
    .update(`${email}:${expires}`)
    .digest("hex");
}

function getAppBaseUrl(req) {
  const configured = cleanBaseUrl(process.env.APP_BASE_URL);
  if (configured) return configured;

  const host = req.headers?.host;
  if (!host) return "";
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  return cleanBaseUrl(`${proto}://${host}`);
}

function cleanBaseUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanText(value, maxLength = 240) {
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
