import React, { useState } from "react";
import {
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import {
  isAccessGateRequired,
  isSupabaseConfigured,
  supabase,
  supabaseConfigStatus
} from "../lib/supabaseClient.js";

export function AuthScreen({ onOpenTrust }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isHostedAccessBlocked = isAccessGateRequired && !isSupabaseConfigured;

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      console.warn("[auth] signIn error:", "missing Supabase configuration");
      setError(getMissingSupabaseMessage(isHostedAccessBlocked));
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        console.info("[auth] signUp started");
        let signUpResult;
        try {
          signUpResult = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                full_name: name
              }
            }
          });
        } catch (signUpException) {
          logSignUpError(signUpException);
          throw withAuthAction(signUpException, "signUp");
        }

        const { data: signUpData, error: signUpError } = signUpResult;
        if (signUpError) logSignUpError(signUpError);
        if (signUpError) throw withAuthAction(signUpError, "signUp");
        console.info("[auth] signUp success user:", Boolean(signUpData?.user));
        await ensurePendingProfileAfterSignUp({
          user: signUpData?.user,
          email,
          fullName: name
        });
        await notifyAccessRequest({
          email,
          fullName: name,
          userId: signUpData?.user?.id
        });
        setMessage(
          "Tu solicitud quedó pendiente de aprobación. Revisa tu correo para confirmar tu cuenta; cuando el equipo habilite tu acceso, podrás ingresar."
        );
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: globalThis.location?.origin
        });
        if (resetError) throw withAuthAction(resetError, "resetPassword");
        setMessage("Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) logSignInError(signInError);
        if (signInError) throw withAuthAction(signInError, "signIn");
      }
    } catch (authError) {
      const action = authError.authAction || (mode === "register" ? "signUp" : mode === "reset" ? "resetPassword" : "signIn");
      console.warn(`[auth] ${action} error: ${summarizeAuthError(authError)}`);
      setError(getAuthErrorMessage(authError, action));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="screen auth-screen identity-auth-screen refined-auth-screen">
      <div className="auth-intro-panel">
        <div className="auth-brand-lockup">
          <img src="/logo-escucha-viva-horizontal.png" alt="Escucha Viva" />
          <div>
            <strong>Escucha Viva</strong>
            <span>Plataforma formativa de simulación clínica</span>
          </div>
        </div>
        <span className="auth-kicker">Entrevista Psicológica Formativa</span>
        <h1>Entrena entrevistas psicológicas con criterio clínico.</h1>
        <p>
          Práctica formativa con casos ficticios y retroalimentación pedagógica.
        </p>

        <a
          className="auth-institution-note auth-institution-link"
          href="https://nucleovivo.net/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Escucha Viva, una iniciativa de Núcleo Vivo.
        </a>

        {!isSupabaseConfigured && (
          <div className="auth-warning">
            {isHostedAccessBlocked
              ? "Falta configuración Supabase en Vercel. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY."
              : "Modo local: Supabase no está configurado. El historial no se guardará en la nube."}
          </div>
        )}
      </div>

      <div className="auth-card refined-auth-card">
        <header className="auth-card-heading">
          <span className="eyebrow">Acceso</span>
          <h2>{mode === "register" ? "Crear cuenta" : mode === "reset" ? "Recuperar acceso" : "Iniciar sesión"}</h2>
        </header>

        <div className="auth-tabs" aria-label="Opciones de acceso">
          <button
            className={mode === "login" ? "selected" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={mode === "register" ? "selected" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Nombre
              <input
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          {mode !== "reset" && (
            <label>
              Contraseña
              <input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button className="primary-action" disabled={isSubmitting || !isSupabaseConfigured} type="submit">
            {mode === "register" ? <UserPlus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
            {mode === "register"
              ? "Crear cuenta"
              : mode === "reset"
                ? "Enviar recuperación"
                : "Iniciar sesión"}
          </button>
        </form>

        <button className="text-action auth-reset-action" type="button" onClick={() => setMode(mode === "reset" ? "login" : "reset")}>
          <Mail aria-hidden="true" />
          {mode === "reset" ? "Volver a iniciar sesión" : "Recuperar contraseña"}
        </button>

        <button className="text-action auth-trust-action" type="button" onClick={onOpenTrust}>
          <ShieldCheck aria-hidden="true" />
          Privacidad y cumplimiento
        </button>
      </div>
    </section>
  );
}

function getMissingSupabaseMessage(isHostedAccessBlocked) {
  if (isHostedAccessBlocked) return "Falta configuración Supabase en Vercel";
  return "Supabase no está configurado. Revisa las variables de entorno.";
}

function withAuthAction(error, authAction) {
  return {
    authAction,
    originalError: error,
    message: error?.message || String(error || "Unknown auth error")
  };
}

function summarizeAuthError(error) {
  const originalError = error?.originalError || error;
  const message = String(originalError?.message || originalError?.name || originalError || "Unknown auth error").trim();
  if (isNetworkAuthError(error)) {
    return "network error; check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY";
  }
  return message.slice(0, 180);
}

function getAuthErrorMessage(error, action = "") {
  if (!supabaseConfigStatus.hasUrl || !supabaseConfigStatus.hasAnonKey) {
    return "Falta configuración Supabase en Vercel";
  }
  if (isInvalidApiKeyError(error)) {
    return "La clave pública de Supabase no es válida o está incompleta.";
  }
  if (action === "signUp" && isUserAlreadyRegisteredError(error)) {
    return "Este correo ya está registrado. Intenta iniciar sesión o recuperar contraseña.";
  }
  if (action === "signUp" && isSignupDisabledError(error)) {
    return "El registro está deshabilitado en Supabase.";
  }
  if (isInvalidCredentialsError(error)) {
    return "Correo o contraseña incorrectos.";
  }
  if (isEmailNotConfirmedError(error)) {
    return action === "signUp" ? "Debes confirmar tu correo." : "Debes confirmar tu correo antes de ingresar.";
  }
  if (isNetworkAuthError(error)) {
    return "No se pudo conectar con Supabase. Revisa URL, key o conectividad.";
  }
  return error?.message || error?.originalError?.message || "No se pudo completar la acción. Intenta nuevamente.";
}

function isNetworkAuthError(error) {
  const message = getAuthErrorText(error);
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch")
  );
}

function isInvalidCredentialsError(error) {
  const message = getAuthErrorText(error);
  return message.includes("invalid login credentials") || message.includes("invalid credentials");
}

function isInvalidApiKeyError(error) {
  const message = getAuthErrorText(error);
  return (
    message.includes("invalid api key") ||
    message.includes("api key invalid") ||
    message.includes("invalid anon key") ||
    message.includes("invalid publishable key") ||
    message.includes("invalid jwt") ||
    message.includes("invalid compact jwt")
  );
}

function isUserAlreadyRegisteredError(error) {
  const message = getAuthErrorText(error);
  return (
    message.includes("user already registered") ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already exists") ||
    message.includes("email address already registered")
  );
}

function isSignupDisabledError(error) {
  const message = getAuthErrorText(error);
  return (
    message.includes("signups not allowed") ||
    message.includes("signup disabled") ||
    message.includes("signups are disabled") ||
    message.includes("user signups are disabled") ||
    message.includes("signup is disabled")
  );
}

function isEmailNotConfirmedError(error) {
  const message = getAuthErrorText(error);
  return (
    message.includes("email not confirmed") ||
    message.includes("email not_confirmed") ||
    message.includes("email_not_confirmed")
  );
}

function getAuthErrorText(error) {
  const originalError = error?.originalError || error;
  return String(originalError?.message || originalError?.name || originalError || "").toLowerCase();
}

function logSignInError(error) {
  const rawError = getSafeRawAuthError(error);
  console.warn("[auth] signIn error name:", rawError.name || "");
  console.warn("[auth] signIn error message:", rawError.message || "");
  console.warn("[auth] signIn error status:", rawError.status || "");
  console.warn("[auth] signIn raw error:", rawError);
}

function logSignUpError(error) {
  const rawError = getSafeRawAuthError(error);
  console.warn("[auth] signUp error name:", rawError.name || "");
  console.warn("[auth] signUp error message:", rawError.message || "");
  console.warn("[auth] signUp error status:", rawError.status || "");
  console.warn("[auth] signUp raw error:", rawError);
}

function getSafeRawAuthError(error) {
  return {
    name: safeLogValue(error?.name),
    message: safeLogValue(error?.message),
    status: safeLogValue(error?.status),
    code: safeLogValue(error?.code),
    causeName: safeLogValue(error?.cause?.name),
    causeMessage: safeLogValue(error?.cause?.message)
  };
}

function safeLogValue(value) {
  return String(value ?? "").slice(0, 240);
}

async function ensurePendingProfileAfterSignUp({ user, email, fullName }) {
  console.info("[profile] pending profile upsert started");
  if (!user?.id) {
    console.warn("[profile] pending profile upsert warning:", "missing signup user");
    return;
  }

  let session = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[profile] pending profile session warning:", safeLogValue(error.message || error));
    }
    session = data?.session || null;
  } catch (error) {
    console.warn("[profile] pending profile session warning:", safeLogValue(error?.message || error));
  }

  if (!session) {
    console.info("[profile] pending profile upsert success:", "database trigger");
    return;
  }

  const { error } = await supabase.from("user_profiles").insert({
    id: user.id,
    email,
    full_name: fullName || null,
    approved: false,
    role: "student"
  });

  if (!error || error.code === "23505") {
    console.info("[profile] pending profile upsert success");
    return;
  }

  console.warn("[profile] pending profile upsert warning:", sanitizeProfileError(error));
}

function sanitizeProfileError(error) {
  return {
    code: safeLogValue(error?.code),
    message: safeLogValue(error?.message),
    details: safeLogValue(error?.details)
  };
}

async function notifyAccessRequest({ email, fullName, userId }) {
  console.info("[access-request] started");
  try {
    const response = await fetch("/api/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        fullName,
        userId,
        createdAt: new Date().toISOString()
      })
    });
    const payload = await readAccessRequestPayload(response);
    if (!response.ok || payload?.emailSent === false) {
      console.warn("[access-request] email warning:", {
        status: response.status,
        reason: safeLogValue(payload?.reason || payload?.error || "unknown")
      });
      return;
    }
    console.info("[access-request] success");
  } catch (error) {
    console.warn("[access-request] email warning:", safeLogValue(error?.message || error));
  }
}

async function readAccessRequestPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
