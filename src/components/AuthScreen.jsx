import React, { useState } from "react";
import {
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { isAccessGateRequired, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

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
      setError(
        isHostedAccessBlocked
          ? "El acceso seguro no esta disponible porque faltan variables de Supabase en Vercel."
          : "Supabase no esta configurado. Revisa las variables de entorno."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (signUpError) throw signUpError;
        setMessage(
          "Registro creado. Revisa tu correo para confirmarlo. Despues, tu acceso quedara pendiente de aprobacion por el equipo de Escucha Viva."
        );
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: globalThis.location?.origin
        });
        if (resetError) throw resetError;
        setMessage("Si el correo esta registrado, recibiras instrucciones para recuperar tu contrasena.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (authError) {
      setError(authError.message || "No se pudo completar la accion. Intenta nuevamente.");
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
            <span>Plataforma formativa de simulacion clinica</span>
          </div>
        </div>
        <span className="auth-kicker">Entrevista Psicologica Formativa</span>
        <h1>Entrena entrevistas psicologicas con criterio clinico.</h1>
        <p>
          Practica formativa con casos ficticios y retroalimentacion pedagogica.
        </p>

        <a
          className="auth-institution-note auth-institution-link"
          href="https://nucleovivo.net/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Escucha Viva, una iniciativa de Nucleo Vivo.
        </a>

        {!isSupabaseConfigured && (
          <div className="auth-warning">
            {isHostedAccessBlocked
              ? "Acceso seguro pendiente de configuracion: agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel."
              : "Modo local: Supabase no esta configurado. El historial no se guardara en la nube."}
          </div>
        )}
      </div>

      <div className="auth-card refined-auth-card">
        <header className="auth-card-heading">
          <span className="eyebrow">Acceso</span>
          <h2>{mode === "register" ? "Crear cuenta" : mode === "reset" ? "Recuperar acceso" : "Iniciar sesion"}</h2>
        </header>

        <div className="auth-tabs" aria-label="Opciones de acceso">
          <button
            className={mode === "login" ? "selected" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Iniciar sesion
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
              Contrasena
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
                ? "Enviar recuperacion"
                : "Iniciar sesion"}
          </button>
        </form>

        <button className="text-action auth-reset-action" type="button" onClick={() => setMode(mode === "reset" ? "login" : "reset")}>
          <Mail aria-hidden="true" />
          {mode === "reset" ? "Volver a iniciar sesion" : "Recuperar contrasena"}
        </button>

        <button className="text-action auth-trust-action" type="button" onClick={onOpenTrust}>
          <ShieldCheck aria-hidden="true" />
          Privacidad y cumplimiento
        </button>
      </div>
    </section>
  );
}
