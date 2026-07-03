import React from "react";

export function ProgressBar({ turnCount, maxTurns = 10 }) {
  const percentage = Math.min(100, Math.round((turnCount / maxTurns) * 100));

  return (
    <div className="progress-wrap" aria-label={`Progreso de sesión ${percentage}%`}>
      <div className="progress-meta">
        <span>Progreso formativo</span>
        <strong>{turnCount} turnos</strong>
      </div>
      <div className="progress-track">
        <div style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
