import React from "react";

export function ProgressBar({ turnCount }) {
  return (
    <div className="progress-wrap" aria-label="Actividad de la entrevista">
      <div className="progress-meta">
        <span>Intervenciones realizadas</span>
        <strong>{turnCount}</strong>
      </div>
      <p>El aprendizaje se revisa al cerrar la sesión.</p>
    </div>
  );
}
