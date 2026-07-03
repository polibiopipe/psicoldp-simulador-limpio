import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, HelpCircle, Lightbulb, X } from "lucide-react";
import { getPedagogicalGuide } from "../data/pedagogicalGuides.js";

export function PedagogicalGuide({
  guideId,
  autoOpen = true,
  compact = false,
  className = ""
}) {
  const guide = useMemo(() => getPedagogicalGuide(guideId), [guideId]);
  const storageKey = `escucha-viva-guide-hidden:${guideId}`;
  const [isOpen, setIsOpen] = useState(() => autoOpen && !readSuppressed(storageKey));
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  useEffect(() => {
    setDoNotShowAgain(false);
    setIsOpen(autoOpen && !readSuppressed(storageKey));
  }, [autoOpen, storageKey]);

  function closeGuide() {
    if (doNotShowAgain) writeSuppressed(storageKey);
    setIsOpen(false);
  }

  function reopenGuide() {
    setIsOpen(true);
  }

  return (
    <div className={`pedagogical-guide-shell ${compact ? "compact" : ""} ${className}`.trim()}>
      <button
        className="guide-trigger"
        type="button"
        onClick={reopenGuide}
        aria-expanded={isOpen}
      >
        <HelpCircle aria-hidden="true" />
        Guia
      </button>

      {isOpen && (
        <aside className="pedagogical-guide-card" aria-label={`Guia: ${guide.title}`}>
          <button
            className="guide-close"
            type="button"
            onClick={closeGuide}
            aria-label="Cerrar guia"
          >
            <X aria-hidden="true" />
          </button>

          <div className="guide-card-heading">
            <span className="guide-icon">
              <Lightbulb aria-hidden="true" />
            </span>
            <div>
              <span className="guide-label">Guia pedagogica</span>
              <h3>{guide.title}</h3>
            </div>
          </div>

          <p>{guide.text}</p>

          <div className="guide-example">
            <strong>Ejemplo</strong>
            <span>{guide.example}</span>
          </div>

          <div className="guide-objective">
            <CheckCircle2 aria-hidden="true" />
            <span>{guide.objective}</span>
          </div>

          <div className="guide-card-actions">
            <label>
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={(event) => setDoNotShowAgain(event.target.checked)}
              />
              No volver a mostrar esta ayuda
            </label>
            <button className="guide-primary-action" type="button" onClick={closeGuide}>
              Entendido
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

function readSuppressed(storageKey) {
  try {
    return globalThis.sessionStorage?.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function writeSuppressed(storageKey) {
  try {
    globalThis.sessionStorage?.setItem(storageKey, "1");
  } catch {
    // Session storage is optional. The guide still works without persistence.
  }
}
