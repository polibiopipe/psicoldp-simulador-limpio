import React from "react";

export function SessionSummary({ summary }) {
  if (!summary) return null;

  return (
    <section className="session-summary-card">
      <span className="eyebrow">Resumen guardado</span>
      <h2>Sesión {summary.sessionNumber} con {summary.patientName}</h2>
      <p>{summary.resumenConversacion}</p>

      <div className="session-summary-grid">
        <div>
          <h3>Temas explorados</h3>
          <ul>
            {summary.temasExplorados.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Temas pendientes</h3>
          <ul>
            {summary.temasPendientes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
