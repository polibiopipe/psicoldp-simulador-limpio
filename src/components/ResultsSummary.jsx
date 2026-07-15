import React from "react";
import { CheckCircle2, Clock, GraduationCap, TrendingUp } from "lucide-react";
import { buildSessionFeedback } from "../engine/sessionFeedback.js";

export function ResultsSummary({ report, caseItem, history, sessionNumber = 1 }) {
  const achieved = report.criteria.filter((criterion) => criterion.level === "achieved").length;
  const partial = report.criteria.filter((criterion) => criterion.level === "partial").length;
  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const isNotEvaluable = report.evaluationStatus === "not_evaluable";
  const isLimitedEvaluation = report.evaluationStatus === "limited";

  if (isNotEvaluable) {
    return (
      <aside className="results-summary not-evaluable" style={{ "--accent": caseItem.accent }}>
        <span className="eyebrow">Resumen visual · Sesión {sessionNumber}</span>
        <h1>{caseItem.name}</h1>
        <p>{report.summary}</p>

        <div className="summary-metrics">
          <div>
            <Clock aria-hidden="true" />
            <strong>0</strong>
            <span>intervenciones</span>
          </div>
          <div>
            <GraduationCap aria-hidden="true" />
            <strong>No evaluable</strong>
            <span>estado</span>
          </div>
        </div>

        <div className="supervision-note">
          <GraduationCap aria-hidden="true" />
          <p>
            Para generar retroalimentación formativa, realiza al menos una intervención
            de encuadre, exploración, validación o cierre.
          </p>
        </div>
      </aside>
    );
  }

  const sessionFeedback = buildSessionFeedback({
    sessionNumber,
    selectedCase: caseItem,
    conversation: history,
    report,
    selectedApproach: report.therapeuticApproach
  });

  return (
    <aside className="results-summary" style={{ "--accent": caseItem.accent }}>
      <span className="eyebrow">Resumen visual · Sesión {sessionNumber}</span>
      <h1>{caseItem.name}</h1>
      <p>{sessionFeedback.briefSummary}</p>

      <div className="summary-metrics">
        <div>
          <Clock aria-hidden="true" />
          <strong>{interviewTurns.length}</strong>
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
        <div>
          <GraduationCap aria-hidden="true" />
          <strong>{isLimitedEvaluation ? "Limitada" : sessionFeedback.levelLabel}</strong>
          <span>{isLimitedEvaluation ? "evaluación" : "nivel"}</span>
        </div>
      </div>

      {!isLimitedEvaluation && (
        <div className="trust-meter">
          <div>
            <span>Apertura lograda</span>
            <strong>{report.trust.final}/100</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${report.trust.final}%` }} />
          </div>
          <p>
            Nivel final: {report.trust.label}. Cambio durante la sesión:{" "}
            {report.trust.delta >= 0 ? "+" : ""}
            {report.trust.delta}.
          </p>
        </div>
      )}

      <div className="supervision-note">
        <GraduationCap aria-hidden="true" />
        <p>
          Usa esta devolución como insumo de supervisión docente, no como evaluación
          clínica del paciente ficticio.
        </p>
      </div>
    </aside>
  );
}
