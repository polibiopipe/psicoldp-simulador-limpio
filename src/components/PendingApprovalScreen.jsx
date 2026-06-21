import React from "react";
import { Clock3, LogOut, RefreshCw, ShieldCheck } from "lucide-react";

export function PendingApprovalScreen({ email, error, onRetry, onSignOut }) {
  const hasError = Boolean(error);

  return (
    <section className="screen approval-screen" aria-live="polite">
      <article className="approval-card">
        <div className="approval-icon" aria-hidden="true">
          {hasError ? <ShieldCheck /> : <Clock3 />}
        </div>
        <span className="eyebrow">Acceso protegido</span>
        <h1>{hasError ? "No pudimos verificar tu acceso" : "Acceso pendiente de aprobación"}</h1>

        {hasError ? (
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
              Tu cuenta fue registrada correctamente y tu correo ya fue validado.
              Ahora está pendiente de aprobación por el equipo de Escucha Viva.
            </p>
            <p className="approval-secondary-copy">
              Cuando tu acceso esté habilitado, podrás entrar al simulador con este
              mismo correo.
            </p>
          </>
        )}

        {email && <span className="approval-email">{email}</span>}

        <div className="approval-actions">
          <button className="secondary-action" type="button" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            Revisar estado
          </button>
          <button className="danger-action" type="button" onClick={onSignOut}>
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </article>
    </section>
  );
}
