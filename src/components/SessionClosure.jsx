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
  getNextSessionAgreement,
  getNextSessionNumber,
  getSessionClosureTitle,
  getSessionStage
} from "../data/sessionPrompts.js";
import {
  buildProcessSummary,
  buildSessionSummary,
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
import { buildSessionFeedback } from "../engine/sessionFeedback.js";
import { clinicalInstrumentOptions } from "../data/clinicalWorkflow.js";
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
  onRequestExit,
  onSaveSessionRecord
}) {
  const [copied, setCopied] = useState(false);
  const [hasSavedSessionRecord, setHasSavedSessionRecord] = useState(false);
  const [hasSavedContinuityAgreement, setHasSavedContinuityAgreement] = useState(false);
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
  const completedSessionCount = Math.max(
    sessionNumber,
    ...previousSessionSummaries.map((summary) => Number(summary?.sessionNumber) || 0)
  );
  const planBelowCompletedSessions = normalizedClinicalDecision.proposedSessions < completedSessionCount;
  const plannedSessionTotal = Math.max(
    normalizedClinicalDecision.proposedSessions || totalSessions,
    completedSessionCount
  );
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
        preSessionPlan,
        completedSessionCount
      }),
    [normalizedClinicalDecision, sessionPlan, report, history, sessionNumber, preSessionPlan, completedSessionCount]
  );
  const normalizedClinicalArtifacts = useMemo(
    () => normalizeClinicalArtifacts(clinicalArtifacts),
    [clinicalArtifacts]
  );
  const clinicalArtifactsEvaluation = useMemo(
    () => evaluateClinicalArtifacts({ artifacts: normalizedClinicalArtifacts, report, history }),
    [normalizedClinicalArtifacts, report, history]
  );
  const sessionFeedback = useMemo(
    () =>
      buildSessionFeedback({
        sessionNumber,
        selectedCase: caseItem,
        conversation: history,
        clinicalDecision: normalizedClinicalDecision,
        studentPlan: preSessionPlan,
        selectedApproach: report.therapeuticApproach,
        report
      }),
    [sessionNumber, caseItem, history, normalizedClinicalDecision, preSessionPlan, report]
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
  const reachedSessionLimit = !nextSessionNumber;
  const closureAction = getClosureActionConfig({
    canContinueInSimulator,
    normalizedClinicalDecision,
    nextSessionNumber,
    nextSessionStage,
    plannedSessionTotal,
    reachedSessionLimit
  });
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
    setHasSavedContinuityAgreement(false);
  }, [caseItem.id, sessionNumber, sessionPlan, preSessionPlanKey]);

  function updateDecision(patch) {
    setClinicalDecision((current) => ({
      ...current,
      ...patch
    }));
  }

  function selectClinicalAction(action) {
    const nextPatch = { action };
    if (action === "continue_session") {
      nextPatch.proposedSessions = Math.max(
        Number(clinicalDecision.proposedSessions) || sessionNumber + 1,
        sessionNumber + 1
      );
    } else {
      nextPatch.proposedSessions = sessionNumber;
    }
    updateDecision(nextPatch);
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

  async function saveContinuityAgreement() {
    await saveCurrentSummary({ includeHistory: true });
    setHasSavedContinuityAgreement(true);
  }

  async function backHomeAfterSave() {
    await saveCurrentSummary({ includeHistory: true });
    onBackHome();
  }

  function requestBackHomeWithoutDecision() {
    if (onRequestExit) {
      onRequestExit("home");
      return;
    }
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
        <section className="session-summary-card closure-panel closure-panel-wide session-feedback-compact">
          <span className="eyebrow">Retroalimentacion breve</span>
          <div className="feedback-brief-header">
            <div>
              <h2>{sessionFeedback.levelLabel}</h2>
              <p>{sessionFeedback.levelDescription}</p>
            </div>
            <strong>Sesion {summary.sessionNumber}</strong>
          </div>

          <div className="feedback-sections feedback-brief-grid">
            <article className="feedback-block">
              <h3>Sintesis breve</h3>
              <p>{sessionFeedback.briefSummary}</p>
            </article>
            <article className="feedback-block">
              <h3>Fortalezas observadas</h3>
              <ul>
                {sessionFeedback.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="feedback-block">
              <h3>Aspecto a mejorar</h3>
              <ul>
                {sessionFeedback.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="feedback-block">
              <h3>Proximo paso sugerido</h3>
              <p>{sessionFeedback.nextStep}</p>
            </article>
          </div>

          <details className="history-details feedback-detail-toggle">
            <summary>Ver detalle formativo</summary>
            <div className="session-summary-grid">
              <div>
                <h3>Criterios</h3>
                <ul>
                  {sessionFeedback.formativeCriteria.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Referencias formativas</h3>
                <ul>
                  {sessionFeedback.referencesUsed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
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
                onChange={() => selectClinicalAction(option.value)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        {normalizedClinicalDecision.action === "continue_session" && (
          <div className="session-note" role="status">
            Primero se registrara la continuidad. La sesion siguiente podra iniciarse despues como accion opcional.
          </div>
        )}

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
            {planBelowCompletedSessions && (
              <div className="prep-plan-memory-warning" role="alert">
                Ya existen {completedSessionCount} sesiones registradas. No se eliminara
                memoria clinica previa; el plan visual se ajustara sin borrar lo trabajado.
              </div>
            )}
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
          <h2>{canContinueInSimulator && hasSavedContinuityAgreement ? "Continuidad registrada" : closureAction.title}</h2>
          <p>
            {canContinueInSimulator && hasSavedContinuityAgreement
              ? `La continuidad dentro del simulador quedo registrada. Puedes iniciar la sesion ${nextSessionNumber} ahora o volver al inicio para retomarla luego.`
              : closureAction.description}
          </p>
        </div>
        <PedagogicalGuide
          guideId="cierre_seguimiento"
          autoOpen={false}
          compact
          className="clinical-inline-guide"
        />
        <div className="closure-actions">
          {canContinueInSimulator && !hasSavedContinuityAgreement ? (
            <button className="primary-action" type="button" onClick={saveContinuityAgreement}>
              {closureAction.primaryLabel}
              <CheckCircle2 aria-hidden="true" />
            </button>
          ) : null}
          {canContinueInSimulator && hasSavedContinuityAgreement ? (
            <>
              <button className="primary-action" type="button" onClick={backHomeAfterSave}>
                <Home aria-hidden="true" />
                Volver al inicio
              </button>
              <button className="secondary-action" type="button" onClick={continueToNextSession}>
                <ArrowRight aria-hidden="true" />
                Iniciar sesion {nextSessionNumber} ahora
              </button>
            </>
          ) : null}
          {!canContinueInSimulator ? (
            <button className="primary-action" type="button" onClick={backHomeAfterSave}>
              <Home aria-hidden="true" />
              {closureAction.primaryLabel}
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={copyCurrentSummary}>
            <Clipboard aria-hidden="true" />
            {copied ? "Resumen copiado" : "Copiar resumen"}
          </button>
          {!(canContinueInSimulator && hasSavedContinuityAgreement) && (
          <button className="secondary-action" type="button" onClick={requestBackHomeWithoutDecision}>
            <Home aria-hidden="true" />
            Volver al inicio
          </button>
          )}
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

    </section>
  );
}

function getClosureActionConfig({
  canContinueInSimulator,
  normalizedClinicalDecision,
  nextSessionNumber,
  nextSessionStage,
  plannedSessionTotal,
  reachedSessionLimit
}) {
  if (canContinueInSimulator) {
    return {
      title: "Registrar continuidad",
      description: `Registra primero la continuidad dentro del simulador. Luego podras iniciar ${nextSessionStage?.title?.toLowerCase() || "la proxima sesion simulada"} si quieres continuar ahora.`,
      primaryLabel: "Registrar continuidad"
    };
  }

  const suffix = reachedSessionLimit ? " Ya llegaste a la ultima sesion del proceso que propusiste." : "";
  const configs = {
    close_process: {
      title: "Cerrar proceso simulado",
      description: `La sesion quedara guardada como cierre del proceso simulado.${suffix}`,
      primaryLabel: "Cerrar proceso y volver al inicio"
    },
    refer: {
      title: "Registrar derivacion",
      description: "La sesion quedara guardada con una decision de derivacion. Revisa que la justificacion indique el motivo y el dispositivo sugerido.",
      primaryLabel: "Registrar derivacion y finalizar sesion"
    },
    risk_protocol: {
      title: "Registrar protocolo de riesgo",
      description: "La prioridad formativa es dejar registrada la decision de seguridad, supervisar el caso y no avanzar automaticamente a otra sesion.",
      primaryLabel: "Registrar protocolo de riesgo"
    },
    request_supervision: {
      title: "Registrar solicitud de supervision",
      description: "La sesion quedara guardada para revision docente o supervision antes de tomar una nueva decision clinica.",
      primaryLabel: "Registrar solicitud de supervision"
    },
    apply_instruments: {
      title: "Registrar evaluacion complementaria",
      description: "La sesion quedara guardada indicando que se requieren instrumentos o evaluacion complementaria antes de continuar.",
      primaryLabel: "Registrar evaluacion complementaria"
    },
    initial_feedback: {
      title: "Guardar devolucion inicial",
      description: "La sesion quedara guardada con una decision de devolucion inicial, sin forzar avance automatico a una nueva sesion.",
      primaryLabel: "Guardar devolucion inicial"
    },
    follow_up: {
      title: "Guardar recomendacion de seguimiento",
      description: "La sesion quedara guardada con recomendacion de seguimiento y monitoreo segun lo observado.",
      primaryLabel: "Guardar recomendacion de seguimiento"
    },
    beyond_simulator: {
      title: "Registrar continuidad extendida",
      description: "La sesion quedara guardada indicando que el caso requiere continuidad mas alla del ciclo disponible en el simulador.",
      primaryLabel: "Registrar continuidad extendida"
    }
  };

  return configs[normalizedClinicalDecision.action] || {
    title: "Guardar decision y cerrar",
    description: `La sesion quedara guardada con tu decision de ${formatClinicalDecision(normalizedClinicalDecision).toLowerCase()}.${suffix}`,
    primaryLabel: "Guardar decision y volver al inicio"
  };
}
