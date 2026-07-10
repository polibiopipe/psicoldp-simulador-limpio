import React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { buildSessionFeedback } from "../engine/sessionFeedback.js";
import { EmailShare } from "./EmailShare.jsx";

export function FeedbackPanel({ report, caseItem, history, sessionNumber = 1, onRestart, onSelectCase }) {
  const visibleHistory = history.filter((entry) => !entry.isSessionPrelude);
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
        <h1>Retroalimentacion educativa</h1>
        <p>{report.ethicalNotice}</p>
      </header>

      <section className="feedback-score-card">
        <div>
          <span className="eyebrow">Nivel formativo</span>
          <strong>{sessionFeedback.levelLabel}</strong>
        </div>
        <p>{sessionFeedback.levelDescription}</p>
      </section>

      <div className="feedback-sections feedback-brief-grid">
        <section className="feedback-block">
          <h2>Sintesis breve</h2>
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
          <h2>Proximo paso sugerido</h2>
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
                  <strong>Podrias decir: "{item.tryThis}"</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </details>

      <details className="history-details">
        <summary>Ver conversacion completa ({visibleHistory.length})</summary>
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
          Repetir simulacion
        </button>
      </div>
    </section>
  );
}
