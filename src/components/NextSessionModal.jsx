import React, { useState } from "react";
import { Clipboard, Download, Home, PlayCircle } from "lucide-react";
import { formatSessionAgreement } from "../engine/sessionMemory.js";

export function NextSessionModal({
  open,
  summary,
  patientAgreement,
  onClose,
  onContinueSession,
  onSaveSummary,
  onBackHome
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  async function copyAgreement() {
    const text = formatSessionAgreement(summary);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="next-session-title">
      <section className="next-session-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <span className="eyebrow">Continuidad simulada</span>
        <h1 id="next-session-title">Propuesta de continuidad</h1>
        <p>
          En una entrevista inicial no siempre es posible abordar todo. Puedes acordar
          una nueva sesión simulada para profundizar en los temas que quedaron abiertos.
        </p>

        <div className="patient-agreement">
          <strong>{summary?.patientName}</strong>
          <p>{patientAgreement}</p>
        </div>

        <div className="modal-actions">
          <button className="primary-action" type="button" onClick={onContinueSession}>
            <PlayCircle aria-hidden="true" />
            Continuar con Sesión 2
          </button>
          <button className="secondary-action" type="button" onClick={onSaveSummary}>
            <Download aria-hidden="true" />
            Guardar resumen de la sesión
          </button>
          <button className="secondary-action" type="button" onClick={copyAgreement}>
            <Clipboard aria-hidden="true" />
            {copied ? "Acuerdo copiado" : "Copiar acuerdo de próxima sesión"}
          </button>
          <button className="secondary-action" type="button" onClick={onBackHome}>
            <Home aria-hidden="true" />
            Volver al inicio
          </button>
        </div>
      </section>
    </div>
  );
}
