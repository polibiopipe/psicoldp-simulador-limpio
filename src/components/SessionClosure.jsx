import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Clock,
  Home,
  MessageSquareText,
  TrendingUp
} from "lucide-react";
import {
  closureExamples,
  getNextSessionAgreement,
  getNextSessionNumber,
  getSessionClosureTitle,
  getSessionStage
} from "../data/sessionPrompts.js";
import {
  buildProcessSummary,
  buildSessionSummary,
  formatProcessSummary,
  formatSessionAgreement,
  saveSessionSummary
} from "../engine/sessionMemory.js";
import { NextSessionModal } from "./NextSessionModal.jsx";

export function SessionClosure({
  caseItem,
  history,
  report,
  sessionNumber,
  previousSessionSummaries = [],
  onContinueSession,
  onBackHome
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processCopied, setProcessCopied] = useState(false);
  const agreement = getNextSessionAgreement(caseItem.id);
  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const achieved = report.criteria.filter((criterion) => criterion.level === "achieved").length;
  const partial = report.criteria.filter((criterion) => criterion.level === "partial").length;
  const nextSessionNumber = getNextSessionNumber(sessionNumber);
  const isFinalSession = !nextSessionNumber;
  const closureTitle = getSessionClosureTitle(sessionNumber);
  const nextSessionStage = nextSessionNumber ? getSessionStage(nextSessionNumber) : null;
  const summary = useMemo(
    () => buildSessionSummary({ caseItem, history, report, sessionNumber, agreement }),
    [caseItem, history, report, sessionNumber, agreement]
  );
  const processSummary = useMemo(
    () => buildProcessSummary({ caseItem, summaries: [...previousSessionSummaries, summary] }),
    [caseItem, previousSessionSummaries, summary]
  );

  function saveCurrentSummary() {
    saveSessionSummary(summary);
  }

  function continueToNextSession() {
    saveCurrentSummary();
    onContinueSession(summary);
  }

  function backHomeAfterSave() {
    saveCurrentSummary();
    onBackHome();
  }

  async function copyCurrentSummary() {
    saveCurrentSummary();
    try {
      await navigator.clipboard.writeText(formatSessionAgreement(summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function copyProcessSummary() {
    saveCurrentSummary();
    try {
      await navigator.clipboard.writeText(formatProcessSummary(processSummary));
      setProcessCopied(true);
      window.setTimeout(() => setProcessCopied(false), 1800);
    } catch {
      setProcessCopied(false);
    }
  }

  return (
    <section className="session-closure" aria-labelledby="session-closure-title">
      <header className="session-closure-header">
        <span className="eyebrow">Proceso por sesiones</span>
        <h1 id="session-closure-title">{closureTitle}</h1>
        <p>
          Resumen formativo de la sesión simulada. Esta síntesis es ficticia y ayuda a
          ordenar qué se exploró y qué podría retomarse en el proceso.
        </p>
      </header>

      {interviewTurns.length < 3 && (
        <div className="session-note low-turn-note">
          Esta sesión tuvo pocas intervenciones. Para un mejor aprendizaje, se recomienda
          profundizar más antes de avanzar, aunque puedes continuar si estás probando el flujo.
        </div>
      )}

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
          <strong>{interviewTurns.length}</strong>
        </div>
      </div>

      <div className="closure-metrics" aria-label="Métricas de cierre">
        <article>
          <Clock aria-hidden="true" />
          <strong>{interviewTurns.length}</strong>
          <span>turnos</span>
        </article>
        <article>
          <CheckCircle2 aria-hidden="true" />
          <strong>{achieved}</strong>
          <span>logrados</span>
        </article>
        <article>
          <TrendingUp aria-hidden="true" />
          <strong>{partial}</strong>
          <span>parciales</span>
        </article>
        <article>
          <MessageSquareText aria-hidden="true" />
          <strong>{report.trust.final}/100</strong>
          <span>apertura</span>
        </article>
      </div>

      <div className="closure-panels">
        <section className="session-summary-card closure-panel closure-panel-wide">
          <span className="eyebrow">Resumen narrativo</span>
          <h2>Sesión {summary.sessionNumber} con {summary.patientName}</h2>
          <p>{summary.resumenConversacion}</p>
        </section>

        <section className="closure-card closure-panel">
          <h2>Aspectos logrados</h2>
          <ul>
            {report.strengths.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="closure-card closure-panel">
          <h2>Aspectos por mejorar</h2>
          <ul>
            {report.improvements.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="closure-card closure-panel">
          <h2>Temas pendientes</h2>
          <ul>
            {summary.temasPendientes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="closure-card closure-panel">
          <h2>Ejemplos de cierre formativo</h2>
          <ul>
            {closureExamples.slice(0, 3).map((example) => (
              <li key={example}>"{example}"</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="continuity-callout">
        <div>
          <h2>{isFinalSession ? "Cierre final del proceso" : "Sugerencia de continuidad"}</h2>
          {isFinalSession ? (
            <p>
              Has completado las cuatro sesiones simuladas. Puedes copiar una síntesis del
              proceso formativo o volver al inicio para trabajar otro caso.
            </p>
          ) : (
            <p>
              Puedes continuar con {nextSessionStage.title.toLowerCase()} para retomar
              los temas abiertos y trabajar el foco: {nextSessionStage.focus}
            </p>
          )}
        </div>
        <div className="closure-actions">
          {isFinalSession ? (
            <>
              <button className="primary-action" type="button" onClick={backHomeAfterSave}>
                <Home aria-hidden="true" />
                Finalizar proceso formativo
              </button>
              <button className="secondary-action" type="button" onClick={copyProcessSummary}>
                <Clipboard aria-hidden="true" />
                {processCopied ? "Proceso copiado" : "Copiar resumen del proceso"}
              </button>
            </>
          ) : (
            <button className="primary-action" type="button" onClick={() => setModalOpen(true)}>
              Continuar a sesión {nextSessionNumber}
              <ArrowRight aria-hidden="true" />
            </button>
          )}
          <button className="secondary-action" type="button" onClick={copyCurrentSummary}>
            <Clipboard aria-hidden="true" />
            {copied ? "Resumen copiado" : "Copiar resumen"}
          </button>
          <button className="secondary-action" type="button" onClick={backHomeAfterSave}>
            <Home aria-hidden="true" />
            Volver al inicio
          </button>
        </div>
      </div>

      {isFinalSession && (
        <section className="session-summary-card closure-panel closure-panel-wide">
          <span className="eyebrow">Síntesis de proceso</span>
          <h2>Resumen de las 4 sesiones con {processSummary.patientName}</h2>
          <p>{processSummary.summaryText}</p>
          <div className="session-summary-grid">
            <div>
              <h3>Temas trabajados</h3>
              <ul>
                {processSummary.workedTopics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Evolución de apertura</h3>
              <ul>
                {processSummary.opennessEvolution.map((item) => (
                  <li key={item.sessionNumber}>
                    Sesión {item.sessionNumber}: {item.trustFinal}/100 ({item.label})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Habilidades logradas</h3>
              <ul>
                {processSummary.studentStrengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Aspectos por seguir practicando</h3>
              <ul>
                {processSummary.studentImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <NextSessionModal
        open={modalOpen}
        summary={summary}
        patientAgreement={agreement}
        nextSessionNumber={nextSessionNumber}
        nextSessionStage={nextSessionStage}
        onClose={() => setModalOpen(false)}
        onContinueSession={continueToNextSession}
        onSaveSummary={saveCurrentSummary}
        onBackHome={backHomeAfterSave}
      />
    </section>
  );
}
