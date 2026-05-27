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
import { closureExamples, getNextSessionAgreement } from "../data/sessionPrompts.js";
import {
  buildSessionSummary,
  formatSessionAgreement,
  saveSessionSummary
} from "../engine/sessionMemory.js";
import { NextSessionModal } from "./NextSessionModal.jsx";

export function SessionClosure({
  caseItem,
  history,
  report,
  sessionNumber,
  onContinueSession,
  onBackHome
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const agreement = getNextSessionAgreement(caseItem.id);
  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const achieved = report.criteria.filter((criterion) => criterion.level === "achieved").length;
  const partial = report.criteria.filter((criterion) => criterion.level === "partial").length;
  const summary = useMemo(
    () => buildSessionSummary({ caseItem, history, report, sessionNumber, agreement }),
    [caseItem, history, report, sessionNumber, agreement]
  );

  function saveCurrentSummary() {
    saveSessionSummary(summary);
  }

  function continueSessionTwo() {
    saveCurrentSummary();
    onContinueSession(summary);
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

  return (
    <section className="session-closure" aria-labelledby="session-closure-title">
      <header className="session-closure-header">
        <span className="eyebrow">Proceso por sesiones</span>
        <h1 id="session-closure-title">Cierre de la primera entrevista</h1>
        <p>
          Resumen formativo de la sesión simulada. Esta síntesis es ficticia y ayuda a
          ordenar qué se exploró y qué podría retomarse en una próxima sesión.
        </p>
      </header>

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
          <h2>Sugerencia de continuidad</h2>
          <p>
            Puedes acordar una Sesión 2 para profundizar el motivo de consulta ficticio
            y retomar los temas que quedaron abiertos.
          </p>
        </div>
        <div className="closure-actions">
          <button className="primary-action" type="button" onClick={() => setModalOpen(true)}>
            Acordar próxima sesión
            <ArrowRight aria-hidden="true" />
          </button>
          <button className="secondary-action" type="button" onClick={copyCurrentSummary}>
            <Clipboard aria-hidden="true" />
            {copied ? "Resumen copiado" : "Copiar resumen"}
          </button>
          <button className="secondary-action" type="button" onClick={onBackHome}>
            <Home aria-hidden="true" />
            Volver al inicio
          </button>
        </div>
      </div>

      <NextSessionModal
        open={modalOpen}
        summary={summary}
        patientAgreement={agreement}
        onClose={() => setModalOpen(false)}
        onContinueSession={continueSessionTwo}
        onSaveSummary={saveCurrentSummary}
        onBackHome={onBackHome}
      />
    </section>
  );
}
