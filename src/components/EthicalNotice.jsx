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
            aria-label="Visitar el sitio oficial de Núcleo Vivo"
          >
            <img
              className="platform-logo-small"
              src="/logo-escucha-viva-horizontal.png"
              alt="Escucha Viva, simuladores formativos. Una iniciativa de Núcleo Vivo"
            />
          </a>
          <span>Entrevista Psicológica Formativa</span>
        </div>
      )}
      <ShieldCheck aria-hidden="true" />
      <p>
        Simulación educativa con casos ficticios. No reemplaza atención psicológica real,
        diagnóstico, tratamiento clínico ni supervisión docente.
      </p>
    </aside>
  );
}
