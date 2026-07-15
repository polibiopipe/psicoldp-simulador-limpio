import React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { buildSessionFeedback } from "../engine/sessionFeedback.js";
import { EmailShare } from "./EmailShare.jsx";

export function FeedbackPanel({
  report,
  caseItem,
  history,
  sessionNumber = 1,
  onRestart,
  onBackToInterview,
  onSelectCase
}) {
  const visibleHistory = history.filter((entry) => !entry.isSessionPrelude);
  const isNotEvaluable = report.evaluationStatus === "not_evaluable";
  const isLimitedEvaluation = report.evaluationStatus === "limited";

  if (isNotEvaluable) {
    return (
      <section className="feedback-panel">
        <header className="section-header">
          <span className="eyebrow">Informe formativo</span>
          <h1>Sesión sin intervenciones suficientes para evaluar</h1>
          <p>{report.emptySessionMessage}</p>
        </header>

        <section className="feedback-empty-evaluation">
          <div className="closure-case-strip">
            <div>
              <span>Paciente ficticio</span>
              <strong>{caseItem.name}</strong>
            </div>
            <div>
              <span>Sesión</span>
              <strong>{sessionNumber}</strong>
            </div>
            <div>
              <span>Intervenciones</span>
              <strong>0</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>No evaluable</strong>
            </div>
          </div>

          <div className="feedback-block">
            <h2>Para recibir retroalimentación</h2>
            <ul>
              {report.nextSuggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="action-row">
          <button className="secondary-action" type="button" onClick={onSelectCase}>
            Elegir otro caso
            <ArrowRight aria-hidden="true" />
          </button>
          {onBackToInterview && (
            <button className="secondary-action" type="button" onClick={onBackToInterview}>
              Volver a entrevista
            </button>
          )}
          <button className="primary-action" type="button" onClick={onRestart}>
            <RotateCcw aria-hidden="true" />
            Repetir simulación
          </button>
        </div>
      </section>
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
    <section className="feedback-panel">
      <header className="section-header">
        <span className="eyebrow">Informe formativo</span>
        <h1>Retroalimentación educativa</h1>
        <p>{report.ethicalNotice}</p>
      </header>

      <section className={`feedback-score-card ${isLimitedEvaluation ? "limited" : ""}`}>
        <div>
          <span className="eyebrow">
            {isLimitedEvaluation ? "Retroalimentación limitada" : "Nivel formativo"}
          </span>
          <strong>{isLimitedEvaluation ? "Sin puntaje robusto" : sessionFeedback.levelLabel}</strong>
        </div>
        <p>
          {isLimitedEvaluation
            ? "Hubo muy poco material conversacional. La devolución orienta el próximo intento, pero no entrega porcentajes robustos."
            : sessionFeedback.levelDescription}
        </p>
      </section>

      <div className="feedback-sections feedback-brief-grid">
        <section className="feedback-block">
          <h2>Síntesis breve</h2>
          <p>{sessionFeedback.briefSummary}</p>
        </section>

        <section className="feedback-block">
          <h2>Fortalezas observadas</h2>
          <ul>
            {sessionFeedback.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="feedback-block">
          <h2>Aspecto a mejorar</h2>
          <ul>
            {sessionFeedback.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="feedback-block">
          <h2>Próximo paso sugerido</h2>
          <p>{sessionFeedback.nextStep}</p>
        </section>
      </div>

      <details className="history-details feedback-detail-toggle">
        <summary>Ver detalle formativo</summary>

        <div className="feedback-sections">
          <section className="feedback-block">
            <h2>Criterios formativos</h2>
            <ul>
              {sessionFeedback.formativeCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="feedback-block">
            <h2>Referencias usadas</h2>
            <ul>
              {sessionFeedback.referencesUsed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        {report.therapeuticApproach && (
          <section className="feedback-block">
            <h2>Enfoque observado</h2>
            <p>{report.therapeuticApproach.feedbackText}</p>
            <ul>
              <li>Predominante: {report.therapeuticApproach.primaryApproach.label}.</li>
              {report.therapeuticApproach.secondaryApproaches.length > 0 && (
                <li>
                  Secundarios:{" "}
                  {report.therapeuticApproach.secondaryApproaches
                    .map((approach) => approach.label)
                    .join(", ")}.
                </li>
              )}
              {report.therapeuticApproach.suggestions.slice(0, 2).map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </section>
        )}

        {report.objectiveEvaluation?.length > 0 && (
          <section className="feedback-block">
            <h2>Objetivos del caso</h2>
            <ul className="objective-feedback-list">
              {report.objectiveEvaluation.slice(0, 5).map((item) => (
                <li className={item.level} key={item.objective}>
                  <span>{item.objective}</span>
                  <strong>{item.levelLabel}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.reformulationSuggestions?.length > 0 && (
          <section className="feedback-block">
            <h2>Reformulaciones sugeridas</h2>
            <ul className="reformulation-list">
              {report.reformulationSuggestions.slice(0, 2).map((item) => (
                <li key={`${item.insteadOf}-${item.tryThis}`}>
                  <span>En vez de: "{item.insteadOf}"</span>
                  <strong>Podrías decir: "{item.tryThis}"</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.skillClassification?.length > 0 && (
          <section className="feedback-block">
            <h2>Habilidades observadas durante la entrevista</h2>
            <div className="skill-chip-list">
              {report.skillClassification.map((item) => (
                <span key={item.label}>{item.label}: {item.count}</span>
              ))}
            </div>
          </section>
        )}
      </details>

      <details className="history-details">
        <summary>Ver conversación completa ({visibleHistory.length})</summary>
        <ol>
          {visibleHistory.map((entry) => (
            <li key={entry.id}>
              <strong>Estudiante:</strong> {entry.question}
              <br />
              <strong>{caseItem.name}:</strong> {entry.answer}
            </li>
          ))}
        </ol>
      </details>

      <EmailShare report={report} caseItem={caseItem} history={visibleHistory} />

      <div className="action-row">
        <button className="secondary-action" type="button" onClick={onSelectCase}>
          Elegir otro caso
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="primary-action" type="button" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          Repetir simulación
        </button>
      </div>
    </section>
  );
}
