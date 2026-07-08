import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendHtml(res, 405, renderStatusPage({
      title: "Método no permitido",
      message: "Este enlace solo permite aprobar solicitudes de acceso."
    }));
    return;
  }

  const config = getServerConfig();
  if (!config.ok) {
    console.error("ACCESS_APPROVAL_CONFIG_ERROR", {
      missing: config.missing
    });
    sendHtml(res, 500, renderStatusPage({
      title: "No pudimos aprobar el acceso",
      message: "Falta configuración segura en el servidor. Revisa las variables de entorno de Vercel."
    }));
    return;
  }

  const email = normalizeEmail(getQueryValue(req.query?.email));
  const expires = cleanText(getQueryValue(req.query?.expires), 40);
  const token = cleanText(getQueryValue(req.query?.token), 256);

  if (!email || !expires || !token) {
    sendHtml(res, 400, renderStatusPage({
      title: "Enlace incompleto",
      message: "El enlace de aprobación no contiene todos los datos necesarios."
    }));
    return;
  }

  if (isExpired(expires)) {
    sendHtml(res, 410, renderStatusPage({
      title: "Enlace vencido",
      message: "Este enlace de aprobación expiró. Puedes aprobar el usuario manualmente desde Supabase."
    }));
    return;
  }

  if (!isValidToken({ email, expires, token, secret: config.approvalSecret })) {
    sendHtml(res, 401, renderStatusPage({
      title: "Enlace no válido",
      message: "No pudimos validar la firma de esta solicitud. Por seguridad, el acceso no fue aprobado."
    }));
    return;
  }

  const supabase = createServerSupabase(config.supabaseUrl, config.serviceRoleKey);
  const approvedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      approved: true,
      approved_at: approvedAt
    })
    .ilike("email", email)
    .select("id,email,approved")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("ACCESS_APPROVAL_UPDATE_ERROR", {
      code: error.code,
      message: cleanText(error.message, 180)
    });
    sendHtml(res, 500, renderStatusPage({
      title: "No pudimos aprobar el acceso",
      message: "Ocurrió un error al actualizar el perfil en Supabase."
    }));
    return;
  }

  if (!data) {
    sendHtml(res, 404, renderStatusPage({
      title: "Usuario no encontrado",
      message: "No se encontró usuario pendiente para este correo."
    }));
    return;
  }

  console.info("ACCESS_APPROVAL_SUCCESS", {
    userId: data.id,
    email: data.email
  });

  sendHtml(res, 200, renderStatusPage({
    title: "Acceso aprobado",
    message: "El usuario ya puede ingresar al simulador.",
    detail: data.email
  }));
}

function getServerConfig() {
  const values = {
    approvalSecret: process.env.ACCESS_APPROVAL_SECRET?.trim(),
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

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function isExpired(expires) {
  const expiresAt = Number(expires);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

function isValidToken({ email, expires, token, secret }) {
  const expected = createHmac("sha256", secret)
    .update(`${email}:${expires}`)
    .digest("hex");
  return safeEqualHex(token, expected);
}

function safeEqualHex(value, expected) {
  if (!/^[a-f0-9]{64}$/i.test(value)) return false;
  const valueBuffer = Buffer.from(value, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanText(value, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sendHtml(res, status, html) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(html);
}

function renderStatusPage({ title, message, detail = "" }) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeDetail = detail ? escapeHtml(detail) : "";
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} · Escucha Viva</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f8f6;
        color: #10212b;
      }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(42, 154, 164, 0.14), transparent 34rem),
          linear-gradient(135deg, #f7f8f6 0%, #fff 100%);
      }
      main {
        width: min(100%, 520px);
        padding: 34px;
        border: 1px solid #e1e5e3;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 24px 80px rgba(16, 33, 43, 0.12);
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #176d75;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(28px, 6vw, 42px);
        line-height: 1.05;
      }
      p {
        margin: 0;
        color: #40515a;
        font-size: 17px;
        line-height: 1.55;
      }
      .detail {
        margin-top: 18px;
        padding: 12px 14px;
        border-radius: 14px;
        background: #f1f7f6;
        color: #176d75;
        font-size: 14px;
        font-weight: 700;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Escucha Viva</p>
      <h1>${safeTitle}</h1>
      <p>${safeMessage}</p>
      ${safeDetail ? `<div class="detail">${safeDetail}</div>` : ""}
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
