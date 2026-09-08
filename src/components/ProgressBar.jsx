import React from "react";

export function ProgressBar({ turnCount = 0, remainingMs, durationMinutes = 45 }) {
  const durationMs = Math.max(1, durationMinutes) * 60000;
  const remaining = Number.isFinite(remainingMs) ? Math.max(0, Math.min(durationMs, remainingMs)) : durationMs;
  const percentage = Math.round((1 - remaining / durationMs) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        <span>Tiempo de entrevista</span>
        <strong>{turnCount} {turnCount === 1 ? "intervención" : "intervenciones"}</strong>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Tiempo transcurrido de entrevista" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={`${Math.ceil(remaining / 60000)} minutos restantes de ${durationMinutes}`}>
        <div style={{ width: `${percentage}%` }} />
      </div>
      <small>El tiempo transcurrido no mide tu desempeño.</small>
    </div>
  );
}
