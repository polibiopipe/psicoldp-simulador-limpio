import React from "react";
import { ArrowRight, CheckCircle2, Circle, RotateCcw, XCircle } from "lucide-react";
import { EmailShare } from "./EmailShare.jsx";

function CriterionIcon({ level }) {
  if (level === "achieved") return <CheckCircle2 className="success-icon" aria-hidden="true" />;
  if (level === "partial") return <Circle className="partial-icon" aria-hidden="true" />;
  return <XCircle className="growth-icon" aria-hidden="true" />;
}

export function FeedbackPanel({ report, caseItem, history, sessionNumber = 1, onRestart, onSelectCase }) {
  const visibleHistory = history.filter((entry) => !entry.isSessionPrelude);

  return (
    <section className="feedback-panel">
      <header className="section-header">
        <span className="eyebrow">Informe formativo</span>
        <h1>Retroalimentación educativa</h1>
        <p>{report.ethicalNotice}</p>
      </header>

      <div className="feedback-sections">
        <section className="feedback-block">
          <h2>Fortalezas observadas</h2>
          <ul>
            {report.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="feedback-block">
          <h2>Aspectos por mejorar</h2>
          <ul>
            {report.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="feedback-sections">
        <section className="feedback-block">
          <h2>Momentos que favorecieron el vínculo</h2>
          <ul>
            {report.bondMoments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="feedback-block">
          <h2>Momentos que pudieron cerrar la comunicación</h2>
          <ul>
            {report.closingMoments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {report.therapeuticApproach && (
        <section className="feedback-block">
          <h2>Enfoque terapéutico observado</h2>
          <p>{report.therapeuticApproach.feedbackText}</p>
          <ul>
            <li>
              Orientación predominante observada: {report.therapeuticApproach.primaryApproach.label}.
            </li>
            {report.therapeuticApproach.secondaryApproaches.length > 0 && (
              <li>
                Enfoques secundarios observados:{" "}
                {report.therapeuticApproach.secondaryApproaches
                  .map((approach) => approach.label)
                  .join(", ")}.
              </li>
            )}
            {report.therapeuticApproach.primaryApproach.examples?.slice(0, 2).map((example) => (
              <li key={example}>Ejemplo del estudiante: “{example}”</li>
            ))}
            {report.therapeuticApproach.suggestions.slice(0, 2).map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </section>
      )}

      {report.guidedInterventionFeedback && (
        <section className="feedback-block">
          <h2>Uso del selector de intervención</h2>
          <p>{report.guidedInterventionFeedback.summary}</p>
          {report.guidedInterventionFeedback.counts.length > 0 && (
            <ul>
              {report.guidedInterventionFeedback.counts.map((item) => (
                <li key={item.typeId}>
                  {item.label}: {item.count} intervención(es).
                </li>
              ))}
              <li>
                Coherencia selector-texto: {report.guidedInterventionFeedback.coherentCount} de{" "}
                {report.guidedInterventionFeedback.totalGuided} intervención(es) guiadas.
              </li>
            </ul>
          )}
          <ul>
            {report.guidedInterventionFeedback.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="criteria-list">
        {report.criteria.map((criterion) => (
          <article className={`criterion ${criterion.level}`} key={criterion.id}>
            <CriterionIcon level={criterion.level} />
            <div>
              <h2>{criterion.title}</h2>
              <p>{criterion.description}</p>
            </div>
            <strong>{criterion.levelLabel}</strong>
          </article>
        ))}
      </div>

      <section className="feedback-block">
        <h2>Sugerencias para una próxima entrevista</h2>
        <ul>
          {report.nextSuggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

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
