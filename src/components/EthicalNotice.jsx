import React from "react";
import { ShieldCheck } from "lucide-react";

export function EthicalNotice({ compact = false }) {
  return (
    <aside className={compact ? "ethical-notice compact" : "ethical-notice"}>
      {compact && (
        <div className="compact-brand-lockup">
          <img
            className="platform-logo-small"
            src="/vivolab-logo.png"
            alt="VivoLab, simuladores formativos. Una iniciativa de Núcleo Vivo"
          />
          <span>Entrevista Inicial</span>
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
