import React, { useState } from "react";
import { Clock3, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";
import { SIMULATORS, enrollInSimulator, registrationSimulator } from "../lib/simulatorEnrollment.js";

export function PendingApprovalScreen({ email, user, status, error, onRetry, onSignOut }) {
  const hasError = Boolean(error);
  const [choice, setChoice] = useState(() => registrationSimulator() || "");
  const [busy, setBusy] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState("");
  const needsChoice = status === "needs_simulator";
  const isUmbral = status === "other_simulator";
  const isSuspended = status === "suspended";

  async function activate(event) {
    event.preventDefault();
    setBusy(true);
    setEnrollmentError("");
    try {
      await enrollInSimulator(supabase, user, choice);
      await onRetry();
    } catch (failure) { setEnrollmentError(failure.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="screen approval-screen" aria-live="polite">
      <article className="approval-card">
        <div className="approval-icon" aria-hidden="true">
          {hasError ? <ShieldCheck /> : <Clock3 />}
        </div>
        <span className="eyebrow">Acceso protegido</span>
        <h1>{needsChoice ? "Elige tu simulador" : isUmbral ? "Tu acceso es a Umbral Docente" : isSuspended ? "Tu acceso está deshabilitado" : hasError ? "No pudimos verificar tu acceso" : "Revisa el estado de tu cuenta"}</h1>

        {needsChoice ? <>
          <p>Selecciona el simulador que utilizarás. Cada correo queda asociado a uno solo; no necesitas una aprobación manual.</p>
          <form className="auth-form" onSubmit={activate} aria-busy={busy}>
            <label htmlFor="activate-simulator">Simulador
              <select id="activate-simulator" value={choice} onChange={(event) => setChoice(event.target.value)} required disabled={busy}>
                <option value="" disabled>Selecciona una opción</option>
                {SIMULATORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button className="primary-action" disabled={busy || !choice}>{busy ? "Activando…" : "Activar mi acceso"}</button>
            {enrollmentError && <p className="auth-error" role="alert">{enrollmentError}</p>}
          </form>
        </> : isUmbral ? <>
          <p>Tu cuenta está asociada a Primera Infancia. Continúa a Umbral e ingresa con el mismo correo y contraseña.</p>
          <a className="primary-action" href="https://psicoldp.org/umbral/">Continuar a Umbral Docente</a>
        </> : isSuspended ? <p>Contacta al equipo responsable para revisar tu acceso. Crear una nueva selección no modifica esta asignación.</p> : hasError ? (
          <>
            <p>
              Por seguridad, el simulador permanecerá bloqueado hasta que podamos
              verificar el estado de tu cuenta.
            </p>
            <p className="approval-secondary-copy">
              Intenta revisar nuevamente. Si el problema continúa, contacta al equipo
              de Escucha Viva.
            </p>
          </>
        ) : (
          <>
            <p>
              No pudimos habilitar el acceso con el estado actual de esta cuenta.
              Confirma tu correo y revisa nuevamente.
            </p>
            <p className="approval-secondary-copy">
              Si el problema continúa, contacta al equipo responsable.
            </p>
          </>
        )}

        {email && <span className="approval-email">{email}</span>}

        <div className="approval-actions">
          <button className="secondary-action" type="button" onClick={onRetry} disabled={busy}>
            <RefreshCw aria-hidden="true" />
            Revisar estado
          </button>
          <button className="danger-action" type="button" onClick={onSignOut} disabled={busy}>
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </article>
    </section>
  );
}
