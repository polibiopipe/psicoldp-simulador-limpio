import React, { useState } from "react";
import {
  AlertTriangle,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

export function AuthScreen({ onOpenTrust }) {
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
    <section className="screen auth-screen">
      <div className="auth-card">
        <span className="eyebrow">Escucha Viva - Simuladores formativos</span>
        <h1>Simulacion clinica asistida por IA</h1>
        <span className="auth-module-label">Modulo: Entrevista Psicologica Formativa</span>
        <p>
          Entrena entrevistas psicologicas en un entorno seguro, etico y formativo.
        </p>

        <div className="auth-trust-chips" aria-label="Caracteristicas de confianza">
          <span><UserPlus aria-hidden="true" /> Pacientes simulados</span>
          <span><Sparkles aria-hidden="true" /> Feedback formativo</span>
          <span><LockKeyhole aria-hidden="true" /> Privacidad y seguridad</span>
          <span><ShieldCheck aria-hidden="true" /> Cumplimiento</span>
        </div>

        <div className="auth-ethical-notice">
          <AlertTriangle aria-hidden="true" />
          <span>
            Casos ficticios con fines educativos. No ingreses datos personales reales
            ni informacion sensible de pacientes reales.
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

        <button className="text-action auth-trust-action" type="button" onClick={onOpenTrust}>
          <ShieldCheck aria-hidden="true" />
          Privacidad y cumplimiento
        </button>
      </div>

      <aside className="auth-visual-panel" aria-label="Vista previa del simulador">
        <div className="auth-visual-card">
          <div className="auth-visual-top">
            <span>Sesion simulada</span>
            <strong>En practica</strong>
          </div>
          <div className="auth-visual-patient">
            <img src="/avatar/claudio.png" alt="Retrato ficticio de Claudio" />
            <div>
              <strong>Claudio, 40</strong>
              <span>Estancamiento vital</span>
            </div>
          </div>
          <p>
            Siento que estoy funcionando en automatico. No es una crisis, pero algo
            se quedo detenido.
          </p>
          <div className="auth-visual-response">
            <span>Intervencion sugerida</span>
            <strong>Explorar con calma y sin apresurar soluciones.</strong>
          </div>
        </div>

        <div className="auth-value-strip" aria-label="Beneficios principales">
          <span>Pacientes realistas</span>
          <span>Feedback formativo</span>
          <span>Aprendizaje seguro</span>
        </div>
      </aside>
    </section>
  );
}
