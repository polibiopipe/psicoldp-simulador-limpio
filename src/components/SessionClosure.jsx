import React, { useEffect, useMemo, useState } from "react";
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
import {
  buildContinuityAgreement,
  buildInitialClinicalDecision,
  CLINICAL_DECISION_OPTIONS,
  evaluateClinicalPlanDecision,
  formatClinicalDecision,
  getClinicalSessionPlan,
  normalizeClinicalDecision
} from "../engine/clinicalPlanning.js";
import {
  buildInitialClinicalArtifacts,
  evaluateClinicalArtifacts,
  normalizeClinicalArtifacts
} from "../engine/clinicalArtifacts.js";
import { clinicalInstrumentOptions } from "../data/clinicalWorkflow.js";
import { NextSessionModal } from "./NextSessionModal.jsx";
import { PedagogicalGuide } from "./PedagogicalGuide.jsx";

export function SessionClosure({
  caseItem,
  history,
  report,
  sessionNumber,
  totalSessions = 4,
  previousSessionSummaries = [],
  preSessionPlan = null,
  onContinueSession,
  onBackHome,
  onSaveSessionRecord
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processCopied, setProcessCopied] = useState(false);
  const [hasSavedSessionRecord, setHasSavedSessionRecord] = useState(false);
  const [clinicalArtifacts, setClinicalArtifacts] = useState(() => buildInitialClinicalArtifacts());
  const sessionPlan = useMemo(() => getClinicalSessionPlan(caseItem), [caseItem.id]);
  const [clinicalDecision, setClinicalDecision] = useState(() =>
    buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan })
  );
  const fallbackAgreement = getNextSessionAgreement(caseItem.id);
  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const achieved = report.criteria.filter((criterion) => criterion.level === "achieved").length;
  const partial = report.criteria.filter((criterion) => criterion.level === "partial").length;
  const normalizedClinicalDecision = useMemo(
    () => normalizeClinicalDecision(clinicalDecision, sessionPlan, sessionNumber, preSessionPlan),
    [clinicalDecision, sessionPlan, sessionNumber, preSessionPlan]
  );
  const plannedSessionTotal = normalizedClinicalDecision.proposedSessions || totalSessions;
  const nextSessionNumber = getNextSessionNumber(sessionNumber, plannedSessionTotal);
  const closureTitle = getSessionClosureTitle(sessionNumber, plannedSessionTotal);
  const nextSessionStage = nextSessionNumber ? getSessionStage(nextSessionNumber, plannedSessionTotal) : null;
  const clinicalPlanEvaluation = useMemo(
    () =>
      evaluateClinicalPlanDecision({
        decision: normalizedClinicalDecision,
        sessionPlan,
        report,
        history,
        sessionNumber,
        preSessionPlan
      }),
    [normalizedClinicalDecision, sessionPlan, report, history, sessionNumber, preSessionPlan]
  );
  const normalizedClinicalArtifacts = useMemo(
    () => normalizeClinicalArtifacts(clinicalArtifacts),
    [clinicalArtifacts]
  );
  const clinicalArtifactsEvaluation = useMemo(
    () => evaluateClinicalArtifacts({ artifacts: normalizedClinicalArtifacts, report, history }),
    [normalizedClinicalArtifacts, report, history]
  );
  const agreement = useMemo(
    () =>
      buildContinuityAgreement({
        decision: normalizedClinicalDecision,
        sessionPlan,
        fallbackAgreement,
        sessionNumber
      }),
    [normalizedClinicalDecision, sessionPlan, fallbackAgreement, sessionNumber]
  );
  const canContinueInSimulator =
    normalizedClinicalDecision.action === "continue_session" &&
    Boolean(nextSessionNumber) &&
    normalizedClinicalDecision.proposedSessions > sessionNumber;
  const isFinalSession = !canContinueInSimulator;
  const reachedSessionLimit = !nextSessionNumber;
  const summary = useMemo(
    () =>
      buildSessionSummary({
        caseItem,
        history,
        report,
        sessionNumber,
        agreement,
        preSessionPlan,
        clinicalArtifacts: normalizedClinicalArtifacts,
        clinicalDecision: normalizedClinicalDecision,
        clinicalPlanEvaluation
      }),
    [
      caseItem,
      history,
      report,
      sessionNumber,
      agreement,
      preSessionPlan,
      normalizedClinicalArtifacts,
      normalizedClinicalDecision,
      clinicalPlanEvaluation
    ]
  );
  const processSummary = useMemo(
    () => buildProcessSummary({ caseItem, summaries: [...previousSessionSummaries, summary] }),
    [caseItem, previousSessionSummaries, summary]
  );
  const preSessionPlanKey = [
    preSessionPlan?.proposedSessionCount,
    preSessionPlan?.sessionCountJustification,
    preSessionPlan?.processObjectives
  ].join("|");

  useEffect(() => {
    setClinicalDecision(buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan }));
    setClinicalArtifacts(buildInitialClinicalArtifacts());
    setHasSavedSessionRecord(false);
  }, [caseItem.id, sessionNumber, sessionPlan, preSessionPlanKey]);

  function updateDecision(patch) {
    setClinicalDecision((current) => ({
      ...current,
      ...patch
    }));
  }

  function updateArtifacts(patch) {
    setClinicalArtifacts((current) => ({
      ...current,
      ...patch
    }));
  }

  function toggleInstrument(instrumentId) {
    const current = new Set(clinicalArtifacts.selectedInstruments || []);
    if (current.has(instrumentId)) current.delete(instrumentId);
    else current.add(instrumentId);
    updateArtifacts({ selectedInstruments: Array.from(current) });
  }

  async function saveCurrentSummary({ includeHistory = false } = {}) {
    saveSessionSummary(summary);
    if (includeHistory && !hasSavedSessionRecord && onSaveSessionRecord) {
      await onSaveSessionRecord({
        clinicalDecision: normalizedClinicalDecision,
        clinicalPlanEvaluation,
        clinicalArtifacts: normalizedClinicalArtifacts
      });
      setHasSavedSessionRecord(true);
    }
  }

  async function continueToNextSession() {
    await saveCurrentSummary({ includeHistory: true });
    if (canContinueInSimulator) onContinueSession(summary);
  }

  async function backHomeAfterSave() {
    await saveCurrentSummary({ includeHistory: true });
    onBackHome();
  }

  async function copyCurrentSummary() {
    await saveCurrentSummary();
    try {
      await navigator.clipboard.writeText(formatSessionAgreement(summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function copyProcessSummary() {
    await saveCurrentSummary();
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

      {summary.preSessionEvaluation && (
        <section className="closure-card closure-panel closure-panel-wide clinical-plan-panel">
          <span className="eyebrow">Preparacion previa</span>
          <h2>Plan inicial de entrevista</h2>
          <p>{summary.preSessionEvaluation.summary}</p>
          <div className="session-summary-grid">
            <div>
              <h3>Fortalezas del plan</h3>
              <ul>
                {summary.preSessionEvaluation.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Brechas a revisar</h3>
              <ul>
                {summary.preSessionEvaluation.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

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

      <section className="closure-card closure-panel closure-panel-wide clinical-plan-panel">
        <span className="eyebrow">Formulacion y registro</span>
        <h2>Hipotesis, instrumentos y nota clinica</h2>
        <p>
          Registra una formulacion breve y los datos que todavia faltan antes de decidir
          continuidad, cierre o derivacion.
        </p>

        <PedagogicalGuide guideId="formulacion_hipotesis" />

        <div className="clinical-plan-form">
          <label>
            <span>Hipotesis clinica inicial</span>
            <textarea
              value={clinicalArtifacts.clinicalHypothesis}
              onChange={(event) => updateArtifacts({ clinicalHypothesis: event.target.value })}
              placeholder="Ej.: el malestar parece vincular cansancio, autoexigencia y dificultad para pedir ayuda."
              rows={3}
            />
          </label>

          <label>
            <span>Datos que sostienen la hipotesis</span>
            <textarea
              value={clinicalArtifacts.supportingData}
              onChange={(event) => updateArtifacts({ supportingData: event.target.value })}
              placeholder="Ej.: irritabilidad en casa, culpa posterior, sobrecarga laboral y baja red de apoyo."
              rows={3}
            />
          </label>

          <label>
            <span>Datos que faltan o diferenciales posibles</span>
            <textarea
              value={clinicalArtifacts.missingData}
              onChange={(event) => updateArtifacts({ missingData: event.target.value })}
              placeholder="Ej.: duracion, sueno, consumo, riesgo, antecedentes medicos y salud mental previa."
              rows={3}
            />
          </label>

          <PedagogicalGuide
            guideId="devolucion_inicial"
            autoOpen={false}
            compact
            className="clinical-inline-guide"
          />

          <label>
            <span>Devolucion inicial que ensayarias</span>
            <textarea
              value={clinicalArtifacts.initialFeedbackDraft}
              onChange={(event) => updateArtifacts({ initialFeedbackDraft: event.target.value })}
              placeholder="Ej.: Por lo que hemos conversado, entiendo que..."
              rows={3}
            />
          </label>
        </div>

        <PedagogicalGuide
          guideId="seleccion_instrumentos"
          autoOpen={false}
          compact
          className="clinical-inline-guide"
        />

        <div className="clinical-prep-field">
          <span>Instrumentos posibles si fueran pertinentes</span>
          <div className="clinical-area-grid">
            {clinicalInstrumentOptions.map((instrument) => (
              <label key={instrument.id}>
                <input
                  type="checkbox"
                  checked={(clinicalArtifacts.selectedInstruments || []).includes(instrument.id)}
                  onChange={() => toggleInstrument(instrument.id)}
                />
                {instrument.label} · {instrument.useCase}
              </label>
            ))}
          </div>
        </div>

        <label className="clinical-prep-field">
          <span>Justificacion de instrumentos</span>
          <textarea
            value={clinicalArtifacts.instrumentJustification}
            onChange={(event) => updateArtifacts({ instrumentJustification: event.target.value })}
            placeholder="Explica pertinencia, limites y resguardos eticos."
            rows={2}
          />
        </label>

        <PedagogicalGuide
          guideId="nota_clinica"
          autoOpen={false}
          compact
          className="clinical-inline-guide"
        />

        <label className="clinical-prep-field">
          <span>Nota clinica breve</span>
          <textarea
            value={clinicalArtifacts.clinicalNote}
            onChange={(event) => updateArtifacts({ clinicalNote: event.target.value })}
            placeholder="Motivo, antecedentes relevantes, observaciones, riesgo, factores protectores y decision."
            rows={4}
          />
        </label>

        <div className={`clinical-plan-evaluation ${clinicalArtifactsEvaluation.level}`}>
          <div>
            <span>{clinicalArtifactsEvaluation.title}</span>
            <strong>{clinicalArtifactsEvaluation.levelLabel}</strong>
          </div>
          <p>{clinicalArtifactsEvaluation.summary}</p>
          <div className="session-summary-grid">
            <div>
              <h3>Fortalezas</h3>
              <ul>
                {clinicalArtifactsEvaluation.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Brechas</h3>
              <ul>
                {clinicalArtifactsEvaluation.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="closure-card closure-panel closure-panel-wide clinical-plan-panel">
        <div className="clinical-plan-header">
          <div>
            <span className="eyebrow">Decision clinica formativa</span>
            <h2>Decision sobre continuidad del proceso</h2>
            <p>
              Decide si corresponde cerrar, continuar, derivar o activar una respuesta de
              riesgo. La cantidad de sesiones es una hipotesis clinica que puedes sostener,
              ajustar o cuestionar durante el proceso.
            </p>
          </div>
          <div className="clinical-plan-range">
            <span>Plan propuesto</span>
            <strong>
              {plannedSessionTotal}
            </strong>
            <span>sesion(es)</span>
          </div>
        </div>

        <PedagogicalGuide guideId="decision_clinica" />
        <PedagogicalGuide
          guideId="plan_intervencion"
          autoOpen={false}
          compact
          className="clinical-inline-guide"
        />

        <div className="clinical-decision-grid" role="radiogroup" aria-label="Decision sobre continuidad">
          {CLINICAL_DECISION_OPTIONS.map((option) => (
            <label
              className={`clinical-decision-option ${
                normalizedClinicalDecision.action === option.value ? "selected" : ""
              }`}
              key={option.value}
            >
              <input
                type="radio"
                name="clinical-decision-action"
                value={option.value}
                checked={normalizedClinicalDecision.action === option.value}
                onChange={() => updateDecision({ action: option.value })}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="clinical-plan-form">
          <label>
            <span>Cantidad de sesiones que propones para este caso</span>
            <small>
              Puedes mantener tu plan inicial o ajustarlo si la evolucion del paciente lo
              justifica.
            </small>
            <select
              value={normalizedClinicalDecision.proposedSessions}
              onChange={(event) => updateDecision({ proposedSessions: Number(event.target.value) })}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value} sesion{value > 1 ? "es" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Por que propones esta cantidad de sesiones?</span>
            <textarea
              value={clinicalDecision.justification}
              onChange={(event) => updateDecision({ justification: event.target.value })}
              placeholder="Ej.: porque el motivo aun necesita delimitarse y falta explorar apoyo o riesgo."
              rows={3}
            />
          </label>

          <label>
            <span>Objetivos del proceso propuesto o siguiente paso</span>
            <textarea
              value={clinicalDecision.nextSessionObjectives}
              onChange={(event) => updateDecision({ nextSessionObjectives: event.target.value })}
              placeholder="Ej.: profundizar historia del problema, red de apoyo y recursos cotidianos."
              rows={3}
            />
          </label>

          <label>
            <span>Que riesgos o aspectos pendientes quedan abiertos?</span>
            <textarea
              value={clinicalDecision.pendingRisks}
              onChange={(event) => updateDecision({ pendingRisks: event.target.value })}
              placeholder="Ej.: no se exploro riesgo de forma suficiente; queda pendiente red de apoyo."
              rows={3}
            />
          </label>
        </div>

        <div className={`clinical-plan-evaluation ${clinicalPlanEvaluation.level}`}>
          <div>
            <span>{clinicalPlanEvaluation.decisionLabel}</span>
            <strong>{clinicalPlanEvaluation.levelLabel}</strong>
          </div>
          <p>{clinicalPlanEvaluation.summary}</p>
          <div className="session-summary-grid">
            <div>
              <h3>Fortalezas</h3>
              <ul>
                {clinicalPlanEvaluation.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Aspectos a revisar</h3>
              <ul>
                {(clinicalPlanEvaluation.concerns.length
                  ? clinicalPlanEvaluation.concerns
                  : clinicalPlanEvaluation.recommendations
                ).slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="continuity-callout">
        <div>
          <h2>{canContinueInSimulator ? "Continuar segun tu decision" : "Guardar decision y cerrar"}</h2>
          {canContinueInSimulator ? (
            <p>
              Puedes avanzar a {nextSessionStage.title.toLowerCase()} porque propusiste continuidad
              dentro de las {plannedSessionTotal} sesiones propuestas.
            </p>
          ) : (
            <p>
              La sesion quedara guardada con tu decision de {formatClinicalDecision(normalizedClinicalDecision).toLowerCase()}.
              {reachedSessionLimit ? " Ya llegaste a la ultima sesion del proceso que propusiste." : ""}
            </p>
          )} 
        </div>
        <PedagogicalGuide
          guideId="cierre_seguimiento"
          autoOpen={false}
          compact
          className="clinical-inline-guide"
        />
        <div className="closure-actions">
          {canContinueInSimulator ? (
            <button className="primary-action" type="button" onClick={() => setModalOpen(true)}>
              Continuar a sesion {nextSessionNumber}
              <ArrowRight aria-hidden="true" />
            </button>
          ) : (
            <button className="primary-action" type="button" onClick={backHomeAfterSave}>
              <Home aria-hidden="true" />
              Guardar y volver al inicio
            </button>
          )}
          <button className="secondary-action" type="button" onClick={copyProcessSummary}>
            <Clipboard aria-hidden="true" />
            {processCopied ? "Proceso copiado" : "Copiar resumen del proceso"}
          </button>
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

      <div className="continuity-callout" hidden>
        <div>
          <h2>{canContinueInSimulator ? "Continuar segun tu decision" : "Guardar decision y cerrar"}</h2>
          {isFinalSession ? (
            <p>
              Has completado las sesiones simuladas de tu plan. Puedes copiar una sintesis del
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

      {reachedSessionLimit && (
        <section className="session-summary-card closure-panel closure-panel-wide">
          <span className="eyebrow">Síntesis de proceso</span>
          <h2>Resumen del proceso con {processSummary.patientName}</h2>
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
        onSaveSummary={() => saveCurrentSummary({ includeHistory: true })}
        onBackHome={backHomeAfterSave}
      />
    </section>
  );
}
