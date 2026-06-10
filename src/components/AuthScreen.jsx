import React, { useState } from "react";
import { AlertTriangle, LogIn, Mail, UserPlus } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

export function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase no esta configurado. Revisa las variables de entorno.");
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
        setMessage("Registro creado. Si Supabase solicita confirmacion, revisa tu correo antes de iniciar sesion.");
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
    <section className="screen auth-screen">
      <div className="auth-card">
        <span className="eyebrow">Acceso estudiantes</span>
        <h1>Simulador Clinico Nucleo Vivo</h1>
        <p>
          Ingresa con tu correo y contrasena para guardar el historial de tus
          entrevistas simuladas.
        </p>

        <div className="auth-ethical-notice">
          <AlertTriangle aria-hidden="true" />
          <span>
            Este simulador utiliza casos ficticios con fines educativos. No ingreses
            datos personales reales ni informacion sensible de pacientes reales.
          </span>
        </div>

        {!isSupabaseConfigured && (
          <div className="auth-warning">
            Modo local: Supabase no esta configurado. El historial no se guardara en
            la nube.
          </div>
        )}

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
      </div>
    </section>
  );
}
