import React from "react";
import { ShieldCheck } from "lucide-react";

export function EthicalNotice({ compact = false }) {
  return (
    <aside className={compact ? "ethical-notice compact" : "ethical-notice"}>
      {compact && (
        <img
          className="logo-psicoldp logo-psicoldp-small"
          src="/logo-psicoldp.png"
          alt="Logo PSICOLDP"
        />
      )}
      <ShieldCheck aria-hidden="true" />
      <p>
        Simulación educativa con casos ficticios. No reemplaza atención psicológica real,
        diagnóstico, tratamiento clínico ni supervisión docente.
      </p>
    </aside>
  );
}
