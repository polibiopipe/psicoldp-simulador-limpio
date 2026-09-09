import React, { useState } from "react";
import { ResultsSummary } from "./ResultsSummary.jsx";
import { FeedbackPanel } from "./FeedbackPanel.jsx";
import { SessionClosure } from "./SessionClosure.jsx";

export function SessionResults({ report, caseItem, history, sessionNumber, closureProps, feedbackProps }) {
  const empty = report.evaluationStatus === "not_evaluable";
  const [view, setView] = useState(empty ? "feedback" : "closure");
  if (empty) {
    return <FeedbackPanel report={report} caseItem={caseItem} history={history} sessionNumber={sessionNumber} {...feedbackProps} />;
  }
  return (
    <section className="session-results-flow">
      <nav className="results-view-switch" aria-label="Pasos después de la entrevista">
        <button type="button" aria-pressed={view === "closure"} onClick={() => setView("closure")}>
          1. Registrar cierre
        </button>
        <button type="button" aria-pressed={view === "feedback"} onClick={() => setView("feedback")}>
          2. Revisar retroalimentación
        </button>
      </nav>
      {/* Both panels stay mounted so consulting feedback never resets a closure draft. */}
      <div hidden={view !== "closure"}>
        <SessionClosure {...closureProps} report={report} caseItem={caseItem} history={history} sessionNumber={sessionNumber}
          onViewFeedback={() => setView("feedback")} />
      </div>
      <div hidden={view !== "feedback"}>
        <ResultsSummary report={report} caseItem={caseItem} history={history} sessionNumber={sessionNumber} />
        <FeedbackPanel {...feedbackProps} report={report} caseItem={caseItem} history={history} sessionNumber={sessionNumber}
          onReviewClosure={() => setView("closure")} />
      </div>
    </section>
  );
}
