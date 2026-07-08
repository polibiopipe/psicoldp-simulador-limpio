import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.info("[approve-access] started");

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
  console.info("[approve-access] email", safeLogValue(email));

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
  const authUserResult = await findAuthUserByEmail(supabase, email);

  if (authUserResult.error) {
    logApprovalError(authUserResult.error);
    sendHtml(res, 500, renderStatusPage({
      title: "No pudimos aprobar el acceso",
      message: "Ocurrió un error al buscar el usuario en Supabase."
    }));
    return;
  }

  console.info("[approve-access] user found", Boolean(authUserResult.user));
  if (!authUserResult.user) {
    sendHtml(res, 404, renderStatusPage({
      title: "Usuario no encontrado",
      message: "No se encontró usuario registrado con este correo."
    }));
    return;
  }

  console.info("[approve-access] profile upsert started");
  const profileResult = await upsertApprovedProfile(supabase, authUserResult.user);
  console.info("[approve-access] profile upsert success", Boolean(profileResult.data?.approved));

  if (profileResult.error || profileResult.data?.approved !== true) {
    logApprovalError(profileResult.error || { message: "Profile was not approved after upsert" });
    sendHtml(res, 500, renderStatusPage({
      title: "No pudimos aprobar el acceso",
      message: "Ocurrió un error al actualizar el perfil en Supabase."
    }));
    return;
  }

  console.info("ACCESS_APPROVAL_SUCCESS", {
    userId: profileResult.data.id,
    email: profileResult.data.email
  });

  sendHtml(res, 200, renderStatusPage({
    title: "Acceso aprobado",
    message: "El usuario ya puede ingresar al simulador.",
    detail: profileResult.data.email
  }));
}

function getServerConfig() {
  const values = {
    approvalSecret: process.env.ACCESS_APPROVAL_SECRET?.trim(),
    supabaseUrl: process.env.SUPABASE_URL?.trim(),
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

async function findAuthUserByEmail(supabase, normalizedEmail) {
  const perPage = 1000;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) return { user: null, error };

    const users = data?.users || [];
    const user = users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail);
    if (user) return { user, error: null };
    if (users.length < perPage) break;
  }

  return { user: null, error: null };
}

async function upsertApprovedProfile(supabase, user) {
  const approvedAt = new Date().toISOString();
  const fullName = cleanText(user.user_metadata?.full_name || user.user_metadata?.name, 180) || null;
  const attempts = [
    {
      id: user.id,
      email: normalizeEmail(user.email),
      full_name: fullName,
      approved: true,
      approved_at: approvedAt,
      updated_at: approvedAt
    },
    {
      id: user.id,
      email: normalizeEmail(user.email),
      full_name: fullName,
      approved: true,
      approved_at: approvedAt
    },
    {
      id: user.id,
      email: normalizeEmail(user.email),
      approved: true
    }
  ];

  let lastError = null;
  for (const profile of attempts) {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profile, { onConflict: "id" })
      .select("id,email,approved")
      .single();

    if (!error) return { data, error: null };
    lastError = error;
    if (!isMissingColumnError(error)) break;
  }

  return { data: null, error: lastError };
}

function isMissingColumnError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

function logApprovalError(error) {
  console.error("[approve-access] error message", safeLogValue(error?.message || error));
  console.error("[approve-access] error code", safeLogValue(error?.code));
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

function safeLogValue(value) {
  return String(value ?? "").slice(0, 240);
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
