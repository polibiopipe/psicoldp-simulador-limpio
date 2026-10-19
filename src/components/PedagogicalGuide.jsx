import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, HelpCircle, Lightbulb, X } from "lucide-react";
import { LearningExposureContext } from './LearningExposureContext.jsx';
import { getPedagogicalGuide, PEDAGOGICAL_GUIDES_VERSION } from "../data/pedagogicalGuides.js";

export function PedagogicalGuide({
  guideId,
  autoOpen = true,
  compact = false,
  className = ""
}) {
  const onExposure=useContext(LearningExposureContext);
  const shell=useRef(null);
  const guide = useMemo(() => getPedagogicalGuide(guideId), [guideId]);
  const storageKey = `escucha-viva-guide-hidden:${guideId}`;
  const [isOpen, setIsOpen] = useState(() => autoOpen && !readSuppressed(storageKey));
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  useEffect(() => {
    setDoNotShowAgain(false);
    setIsOpen(autoOpen && !readSuppressed(storageKey));
  }, [autoOpen, storageKey]);

  useEffect(()=>{
    if(!isOpen||!onExposure||typeof IntersectionObserver==='undefined')return;
    const card=shell.current?.querySelector('aside');if(!card)return;
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting&&entry.intersectionRatio>=0.1)onExposure('guide_shown',`${guideId}@${PEDAGOGICAL_GUIDES_VERSION}`);},{threshold:0.1});
    observer.observe(card);return()=>observer.disconnect();
  },[isOpen,onExposure,guideId]);

  function closeGuide() {
    if (doNotShowAgain) writeSuppressed(storageKey);
    setIsOpen(false);
  }

  function reopenGuide() {
    setIsOpen(true);
  }

  return (
    <div ref={shell} data-guide-id={guideId} className={`pedagogical-guide-shell ${compact ? "compact" : ""} ${className}`.trim()}>
      <button
        className="guide-trigger"
        type="button"
        onClick={reopenGuide}
        aria-expanded={isOpen}
      >
        <HelpCircle aria-hidden="true" />
        Guía
      </button>

      {isOpen && (
        <aside className="pedagogical-guide-card" aria-label={`Guía: ${guide.title}`}>
          <button
            className="guide-close"
            type="button"
            onClick={closeGuide}
            aria-label="Cerrar guía"
          >
            <X aria-hidden="true" />
          </button>

          <div className="guide-card-heading">
            <span className="guide-icon">
              <Lightbulb aria-hidden="true" />
            </span>
            <div>
              <span className="guide-label">Guía pedagógica</span>
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
