import React from "react";
import { CheckCircle2, Clock, GraduationCap, TrendingUp } from "lucide-react";

export function ResultsSummary({ report, caseItem, history }) {
  const achieved = report.criteria.filter((criterion) => criterion.level === "achieved").length;
  const partial = report.criteria.filter((criterion) => criterion.level === "partial").length;

  return (
    <aside className="results-summary" style={{ "--accent": caseItem.accent }}>
      <span className="eyebrow">Resumen visual</span>
      <h1>{caseItem.name}</h1>
      <p>{report.summary}</p>

      <div className="summary-metrics">
        <div>
          <Clock aria-hidden="true" />
          <strong>{history.length}</strong>
          <span>turnos</span>
        </div>
        <div>
          <CheckCircle2 aria-hidden="true" />
          <strong>{achieved}</strong>
          <span>logrados</span>
        </div>
        <div>
          <TrendingUp aria-hidden="true" />
          <strong>{partial}</strong>
          <span>parciales</span>
        </div>
      </div>

      <div className="trust-meter">
        <div>
          <span>Apertura lograda</span>
          <strong>{report.trust.final}/100</strong>
        </div>
        <div className="progress-track">
          <div style={{ width: `${report.trust.final}%` }} />
        </div>
        <p>Nivel final: {report.trust.label}. Cambio durante la sesión: {report.trust.delta >= 0 ? "+" : ""}{report.trust.delta}.</p>
      </div>

      <div className="supervision-note">
        <GraduationCap aria-hidden="true" />
        <p>
          Usa este informe como insumo de conversación con supervisión docente,
          no como evaluación clínica del paciente ficticio.
        </p>
      </div>
    </aside>
  );
}
