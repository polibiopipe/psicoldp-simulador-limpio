import React from "react";
import { ShieldCheck } from "lucide-react";

export function EthicalNotice({ compact = false }) {
  return (
    <aside className={compact ? "ethical-notice compact" : "ethical-notice"}>
      {compact && (
        <div className="compact-brand-lockup">
          <a
            className="institutional-logo-link"
            href="https://nucleovivo.net/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visitar el sitio oficial de Nucleo Vivo"
          >
            <img
              className="platform-logo-small"
              src="/logo-escucha-viva-horizontal.png"
              alt="Escucha Viva"
            />
          </a>
          <span>Entrevista Psicologica Formativa</span>
        </div>
      )}
      <ShieldCheck aria-hidden="true" />
      <p>Uso exclusivamente educativo. No reemplaza atencion clinica real ni supervision docente.</p>
    </aside>
  );
}
