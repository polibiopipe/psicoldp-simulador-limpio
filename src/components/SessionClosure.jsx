import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { buildSessionFeedback } from "../engine/sessionFeedback.js";
import {
  buildContinuityAgreement,
  buildInitialClinicalDecision,
  CLINICAL_DECISION_OPTIONS,
  decisionAllowsComplementaryEvaluation,
  decisionAllowsNextSession,
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
import { buildSimulatedExternalReport } from "../engine/clinicalComplementaryEvaluation.js";
import {
  buildClinicalDraftKey,
  buildClinicalScrollKey,
  clearClinicalDraft,
  clearClinicalScrollPosition,
  loadClinicalDraft,
  loadClinicalScrollPosition,
  saveClinicalScrollPosition,
  saveClinicalDraft
} from "../engine/clinicalDraftAutosave.js";
import { clinicalExplorationAreas, clinicalInstrumentOptions } from "../data/clinicalWorkflow.js";
import { PedagogicalGuide } from "./PedagogicalGuide.jsx";

export function SessionClosure({
  caseItem,
  history,
  report,
  sessionNumber,
  totalSessions = 4,
  previousSessionSummaries = [],
  preSessionPlan = null,
  userId = "",
  userEmail = "",
  sessionRecordId = "",
  onContinueSession,
  onScheduleNextSession,
  onBackHome,
  onRequestExit,
  onSaveSessionRecord
}) {
  const [copied, setCopied] = useState(false);
  const [processCopied, setProcessCopied] = useState(false);
  const [hasSavedSessionRecord, setHasSavedSessionRecord] = useState(false);
  const [hasSavedContinuityAgreement, setHasSavedContinuityAgreement] = useState(false);
  const [clinicalArtifacts, setClinicalArtifacts] = useState(() => buildInitialClinicalArtifacts());
  const [draftStatus, setDraftStatus] = useState(null);
  const restoredDraftRef = useRef(false);
  const restoredScrollKeyRef = useRef("");
  const scrollPersistenceDisabledRef = useRef(false);
  const hydratingDraftRef = useRef(true);
  const stableSessionRecordIdRef = useRef(sessionRecordId);
  const sessionPlan = useMemo(() => getClinicalSessionPlan(caseItem), [caseItem.id]);
  if (sessionRecordId) stableSessionRecordIdRef.current = sessionRecordId;
  const decisionDraftKey = useMemo(
    () =>
      buildClinicalDraftKey({
        userId,
        userEmail,
        caseId: caseItem.id,
        sessionId: stableSessionRecordIdRef.current,
        sessionNumber,
        step: "closure-decision"
      }),
    [userId, userEmail, caseItem.id, stableSessionRecordIdRef.current, sessionNumber]
  );
  const artifactsDraftKey = useMemo(
    () =>
      buildClinicalDraftKey({
        userId,
        userEmail,
        caseId: caseItem.id,
        sessionId: stableSessionRecordIdRef.current,
        sessionNumber,
        step: "closure-artifacts"
      }),
    [userId, userEmail, caseItem.id, stableSessionRecordIdRef.current, sessionNumber]
  );
  const closureScrollKey = useMemo(
    () =>
      buildClinicalScrollKey({
        userId,
        userEmail,
        caseId: caseItem.id,
        sessionId: stableSessionRecordIdRef.current,
        sessionNumber,
        step: "closure"
      }),
    [userId, userEmail, caseItem.id, stableSessionRecordIdRef.current, sessionNumber]
  );
  const [clinicalDecision, setClinicalDecision] = useState(() =>
    buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan })
  );
  const fallbackAgreement = getNextSessionAgreement(caseItem.id);
  const interviewTurns = history.filter((entry) => !entry.isSessionPrelude);
  const isNotEvaluable = report.evaluationStatus === "not_evaluable";
  const isLimitedEvaluation = report.evaluationStatus === "limited";
  const normalizedClinicalDecision = useMemo(
    () => normalizeClinicalDecision(clinicalDecision, sessionPlan, sessionNumber, preSessionPlan),
    [clinicalDecision, sessionPlan, sessionNumber, preSessionPlan]
  );
  const sessionFeedback = useMemo(
    () =>
      buildSessionFeedback({
        sessionNumber,
        selectedCase: caseItem,
        conversation: history,
        clinicalDecision: normalizedClinicalDecision,
        studentPlan: preSessionPlan,
        selectedApproach: report?.therapeuticApproach,
        report
      }),
    [sessionNumber, caseItem, history, normalizedClinicalDecision, preSessionPlan, report]
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
    () => evaluateClinicalArtifacts({ artifacts: normalizedClinicalArtifacts, report, history, caseItem }),
    [normalizedClinicalArtifacts, report, history, caseItem]
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
    decisionAllowsNextSession(normalizedClinicalDecision.action) &&
    Boolean(nextSessionNumber) &&
    normalizedClinicalDecision.proposedSessions > sessionNumber;
  const canRequestComplementaryEvaluation = decisionAllowsComplementaryEvaluation(normalizedClinicalDecision.action);
  const shouldShowInterventionDesign = normalizedClinicalDecision.action === "start_intervention_design";
  const complementaryEvaluation = normalizedClinicalArtifacts.complementaryEvaluation;
  const complementaryRequestEvaluation = clinicalArtifactsEvaluation.complementaryRequestEvaluation;
  const externalReportIntegrationEvaluation = clinicalArtifactsEvaluation.externalReportIntegrationEvaluation;
  const interventionDesignEvaluation = clinicalArtifactsEvaluation.interventionDesignEvaluation;
  const isFinalSession = !canContinueInSimulator;
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
    hydratingDraftRef.current = true;
    const initialDecision = buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan });
    const initialArtifacts = buildInitialClinicalArtifacts();
    const decisionDraft = loadClinicalDraft(decisionDraftKey);
    const artifactsDraft = loadClinicalDraft(artifactsDraftKey);
    const hasDecisionDraft = hasMeaningfulClinicalDecisionDraft(decisionDraft, initialDecision);
    const hasArtifactsDraft = hasMeaningfulClinicalArtifactsDraft(artifactsDraft);

    setClinicalDecision(hasDecisionDraft ? { ...initialDecision, ...decisionDraft } : initialDecision);
    setClinicalArtifacts(hasArtifactsDraft ? mergeClinicalArtifactsDraft(initialArtifacts, artifactsDraft) : initialArtifacts);
    setHasSavedSessionRecord(false);
    setHasSavedContinuityAgreement(false);
    restoredDraftRef.current = hasDecisionDraft || hasArtifactsDraft;
    setDraftStatus(
      restoredDraftRef.current
        ? { type: "restored", message: "Recuperamos tu borrador." }
        : null
    );
    restoredScrollKeyRef.current = "";
    scrollPersistenceDisabledRef.current = false;
  }, [caseItem.id, sessionNumber, sessionPlan, preSessionPlanKey, decisionDraftKey, artifactsDraftKey]);

  useEffect(() => {
    if (hydratingDraftRef.current) {
      hydratingDraftRef.current = false;
      return undefined;
    }

    const initialDecision = buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan });
    const hasDecisionDraft = hasMeaningfulClinicalDecisionDraft(clinicalDecision, initialDecision);
    const hasArtifactsDraft = hasMeaningfulClinicalArtifactsDraft(clinicalArtifacts);

    if (!hasDecisionDraft) clearClinicalDraft(decisionDraftKey);
    if (!hasArtifactsDraft) clearClinicalDraft(artifactsDraftKey);
    if (!hasDecisionDraft && !hasArtifactsDraft) return undefined;

    if (!restoredDraftRef.current) {
      setDraftStatus({ type: "pending", message: "Cambios pendientes de guardar." });
    }

    const timeoutId = window.setTimeout(() => {
      if (hasDecisionDraft) saveClinicalDraft(decisionDraftKey, clinicalDecision);
      if (hasArtifactsDraft) saveClinicalDraft(artifactsDraftKey, clinicalArtifacts);
      setDraftStatus({ type: "saved", message: "Borrador guardado." });
      restoredDraftRef.current = false;
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    decisionDraftKey,
    artifactsDraftKey,
    clinicalDecision,
    clinicalArtifacts,
    sessionNumber,
    sessionPlan,
    preSessionPlan
  ]);

  useEffect(() => {
    const initialDecision = buildInitialClinicalDecision({ sessionNumber, sessionPlan, preSessionPlan });
    const shouldWarn =
      !hasSavedSessionRecord &&
      (hasMeaningfulClinicalDecisionDraft(clinicalDecision, initialDecision) ||
        hasMeaningfulClinicalArtifactsDraft(clinicalArtifacts));

    if (!shouldWarn) return undefined;

    function warnBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasSavedSessionRecord, clinicalDecision, clinicalArtifacts, sessionNumber, sessionPlan, preSessionPlan]);

  useEffect(() => {
    if (restoredScrollKeyRef.current === closureScrollKey) return undefined;
    restoredScrollKeyRef.current = closureScrollKey;

    const savedY = loadClinicalScrollPosition(closureScrollKey);
    if (!savedY) return undefined;

    const timeoutId = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "auto" });
      });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [closureScrollKey, clinicalDecision, clinicalArtifacts]);

  useEffect(() => {
    let timeoutId = null;

    function persistScrollPosition() {
      timeoutId = null;
      if (scrollPersistenceDisabledRef.current) return;
      saveClinicalScrollPosition(closureScrollKey, getCurrentScrollY());
    }

    function handleScroll() {
      if (timeoutId) return;
      timeoutId = window.setTimeout(persistScrollPosition, 400);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      persistScrollPosition();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [closureScrollKey]);

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

  function updateComplementaryEvaluation(patch) {
    setClinicalArtifacts((current) => ({
      ...current,
      complementaryEvaluation: {
        ...(current.complementaryEvaluation || {}),
        ...patch
      }
    }));
  }

  function updateReportIntegration(patch) {
    setClinicalArtifacts((current) => ({
      ...current,
      complementaryEvaluation: {
        ...(current.complementaryEvaluation || {}),
        integration: {
          ...(current.complementaryEvaluation?.integration || {}),
          ...patch
        }
      }
    }));
  }

  function updateInterventionDesign(patch) {
    setClinicalArtifacts((current) => ({
      ...current,
      interventionDesign: {
        ...(current.interventionDesign || {}),
        ...patch
      }
    }));
  }

  function requestExternalReport() {
    if (!complementaryRequestEvaluation.canGenerateReport) {
      updateComplementaryEvaluation({ status: "needs_revision" });
      return;
    }

    const report = buildSimulatedExternalReport({
      request: complementaryEvaluation,
      caseItem,
      history,
      sessionNumber
    });
    updateComplementaryEvaluation({
      status: report ? "received" : "needs_revision",
      report
    });
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
    if (includeHistory) {
      scrollPersistenceDisabledRef.current = true;
      clearClinicalDraft(decisionDraftKey);
      clearClinicalDraft(artifactsDraftKey);
      clearClinicalScrollPosition(closureScrollKey);
      setDraftStatus({ type: "saved", message: "Cambios guardados." });
    }
  }

  async function continueToNextSession() {
    await saveCurrentSummary({ includeHistory: true });
    if (canContinueInSimulator) onContinueSession(summary);
  }

  async function scheduleNextSession() {
    await saveCurrentSummary({ includeHistory: true });
    if (canContinueInSimulator) {
      if (onScheduleNextSession) onScheduleNextSession(nextSessionNumber);
      else onContinueSession(summary);
    }
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

  if (isNotEvaluable) {
    return (
      <section className="session-closure session-closure-empty" aria-labelledby="session-closure-title">
        <header className="session-closure-header">
          <span className="eyebrow">Cierre de sesión</span>
          <h1 id="session-closure-title">Sesión sin intervenciones suficientes para evaluar</h1>
          <p>{report.emptySessionMessage}</p>
        </header>

        <section className="closure-card closure-panel closure-panel-wide">
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
          <p>
            Esta sesión no entrega evaluación formativa porque no hubo intervenciones
            observables del estudiante.
          </p>
          <ul>
            {report.nextSuggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="closure-action-row">
            <button className="secondary-action" type="button" onClick={onBackHome}>
              <Home aria-hidden="true" />
              Volver al inicio
            </button>
          </div>
        </section>
      </section>
    );
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
        <p>
          Las cuatro sesiones son una ruta formativa base, no un cierre obligatorio.
          Puedes continuar evaluando, solicitar información complementaria o iniciar
          diseño de intervención si la comprensión clínica ya es suficiente.
        </p>
        {draftStatus && (
          <div className={`draft-autosave-status ${draftStatus.type}`} role="status">
            {draftStatus.message}
          </div>
        )}
      </header>

      <div className="closure-stage-list">
        <details className="closure-stage" open>
          <summary>
            <span>1</span>
            <strong>Resumen breve de sesión</strong>
            <small>Paciente, turnos, apertura y señales generales del cierre.</small>
          </summary>
          <div className="closure-stage-body">
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

            <section className="session-summary-card closure-panel closure-panel-wide">
              <span className="eyebrow">Resumen narrativo</span>
              <h2>Sesión {summary.sessionNumber} con {summary.patientName}</h2>
              <p>{summary.resumenConversacion}</p>
            </section>
          </div>
        </details>

        <details className="closure-stage">
          <summary>
            <span>2</span>
            <strong>Retroalimentación formativa</strong>
            <small>Indicadores, fortalezas y aspectos prioritarios.</small>
          </summary>
          <div className="closure-stage-body">
      {isLimitedEvaluation ? (
        <div className="session-note low-turn-note">
          Retroalimentación limitada: hubo muy pocas intervenciones para sostener
          juicios robustos. Usa esta devolución como orientación para
          iniciar mejor el próximo intento.
        </div>
      ) : (
      <div className="closure-metrics" aria-label="Métricas de cierre">
        <article>
          <Clock aria-hidden="true" />
          <strong>{interviewTurns.length}</strong>
          <span>turnos</span>
        </article>
        <article>
          <CheckCircle2 aria-hidden="true" />
          <strong>{sessionFeedback.levelLabel}</strong>
          <span>evidencia</span>
        </article>
        <article>
          <TrendingUp aria-hidden="true" />
          <strong>{sessionFeedback.pendingAreas.length}</strong>
          <span>pendientes</span>
        </article>
        <article>
          <MessageSquareText aria-hidden="true" />
          <strong>{report.trust.label}</strong>
          <span>apertura simulada</span>
        </article>
      </div>
      )}

      <div className="closure-panels closure-feedback-brief">
        <section className="closure-card closure-panel">
          <h2>Fortalezas principales</h2>
          <ul>
            {sessionFeedback.strengths.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="closure-card closure-panel">
          <h2>Aspectos por mejorar</h2>
          <ul>
            {sessionFeedback.priorityImprovements.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="closure-card closure-panel">
          <h2>Temas pendientes</h2>
          <ul>
            {(sessionFeedback.pendingAreas.length ? sessionFeedback.pendingAreas : summary.temasPendientes).map((item) => (
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

          </div>
        </details>

        <details className="closure-stage">
          <summary>
            <span>3</span>
            <strong>Preparación previa y continuidad</strong>
            <small>Síntesis compacta del plan inicial utilizado.</small>
          </summary>
          <div className="closure-stage-body">
            {summary.preSessionEvaluation ? (
              <section className="closure-card closure-panel closure-panel-wide clinical-plan-panel compact-preparation-summary">
                <span className="eyebrow">Preparación previa utilizada</span>
                <h2>Plan inicial de entrevista</h2>
                <ul className="compact-clinical-list">
                  <li>
                    <strong>Modalidad:</strong> {summary.preSessionEvaluation.interviewType || "No registrada"}.
                  </li>
                  <li>
                    <strong>Áreas planificadas:</strong>{" "}
                    {formatClinicalAreaList(summary.preSessionEvaluation.plannedAreas)}.
                  </li>
                  <li>
                    <strong>Áreas retomadas:</strong>{" "}
                    {summary.preSessionEvaluation.coveredAreas.length} de{" "}
                    {summary.preSessionEvaluation.plannedAreas.length}.
                  </li>
                  <li>
                    <strong>Brechas relevantes:</strong>{" "}
                    {summary.preSessionEvaluation.gaps.slice(0, 3).join("; ") || "No se observan brechas relevantes en el plan."}
                  </li>
                </ul>
                <details className="closure-inline-detail">
                  <summary>Ver análisis de preparación</summary>
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
                </details>
              </section>
            ) : (
              <div className="session-note">No hay preparación previa registrada para esta sesión.</div>
            )}
          </div>
        </details>

        <details className="closure-stage">
          <summary>
            <span>4</span>
            <strong>Formulación clínica e instrumentos</strong>
            <small>Hipótesis, datos, instrumentos e informe externo.</small>
          </summary>
          <div className="closure-stage-body">
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

        <div className="clinical-plan-subpanel">
          <span className="eyebrow">Evaluacion complementaria simulada</span>
          <h3>Solicitar informe externo</h3>
          <p>
            El estudiante no aplica pruebas dentro del simulador. Solicita una evaluacion
            complementaria, justifica su pertinencia y recibe un informe externo simulado
            para integrarlo al caso.
          </p>
          {!canRequestComplementaryEvaluation && (
            <div className="session-note">
              Esta seccion queda disponible especialmente si decides continuar evaluando,
              solicitar evaluacion complementaria o reformular hipotesis.
            </div>
          )}

          <div className="clinical-plan-form">
            <label>
              <span>Prueba, area o instrumento solicitado</span>
              <select
                value={clinicalArtifacts.complementaryEvaluation?.instrumentId || ""}
                onChange={(event) =>
                  updateComplementaryEvaluation({
                    instrumentId: event.target.value,
                    status: "draft",
                    report: null
                  })
                }
              >
                <option value="">Selecciona una opcion</option>
                {clinicalInstrumentOptions.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.label} - {instrument.area}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Por que solicitas esta evaluacion complementaria?</span>
              <textarea
                value={clinicalArtifacts.complementaryEvaluation?.justification || ""}
                onChange={(event) => updateComplementaryEvaluation({ justification: event.target.value })}
                placeholder="Explica que dato clinico falta y por que no basta con concluir todavia."
                rows={2}
              />
            </label>

            <label>
              <span>Que hipotesis quieres explorar o contrastar?</span>
              <textarea
                value={clinicalArtifacts.complementaryEvaluation?.hypothesis || ""}
                onChange={(event) => updateComplementaryEvaluation({ hypothesis: event.target.value })}
                placeholder="Ej.: distinguir si el malestar se explica mejor por ansiedad, sobrecarga o evitacion."
                rows={2}
              />
            </label>

            <label>
              <span>¿Qué información esperas obtener?</span>
              <textarea
                value={clinicalArtifacts.complementaryEvaluation?.expectedInformation || ""}
                onChange={(event) => updateComplementaryEvaluation({ expectedInformation: event.target.value })}
                placeholder="Nombra información específica que ayudaría a decidir continuidad, derivación o intervención."
                rows={2}
              />
            </label>

            <label>
              <span>Pertinencia por edad y caracteristicas del caso</span>
              <textarea
                value={clinicalArtifacts.complementaryEvaluation?.agePertinence || ""}
                onChange={(event) => updateComplementaryEvaluation({ agePertinence: event.target.value })}
                placeholder="Justifica por que esta evaluacion corresponde a este paciente y a este momento del proceso."
                rows={2}
              />
            </label>

            <label>
              <span>Como integraras estos resultados al proceso?</span>
              <textarea
                value={clinicalArtifacts.complementaryEvaluation?.integrationPlan || ""}
                onChange={(event) => updateComplementaryEvaluation({ integrationPlan: event.target.value })}
                placeholder="Explica como evitaras usar el informe como conclusion automatica."
                rows={2}
              />
            </label>
          </div>

          <div className={`clinical-plan-evaluation ${complementaryRequestEvaluation.level}`}>
            <div>
              <span>{complementaryRequestEvaluation.title}</span>
              <strong>{complementaryRequestEvaluation.levelLabel}</strong>
            </div>
            <p>{complementaryRequestEvaluation.summary}</p>
            {(complementaryRequestEvaluation.concerns.length > 0 ||
              complementaryRequestEvaluation.recommendations.length > 0) && (
              <ul>
                {[...complementaryRequestEvaluation.concerns, ...complementaryRequestEvaluation.recommendations]
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
            )}
          </div>

          <div className="closure-actions">
            <button className="primary-action" type="button" onClick={requestExternalReport}>
              Solicitar informe externo simulado
            </button>
          </div>

          {complementaryEvaluation.status === "needs_revision" && (
            <div className="session-note low-turn-note">
              Antes de entregar el informe, mejora la justificacion clinica, la hipotesis
              y el plan de integracion.
            </div>
          )}

          {complementaryEvaluation.report && (
            <article className="session-summary-card closure-panel">
              <span className="eyebrow">Informe externo recibido</span>
              <h3>{complementaryEvaluation.report.title}</h3>
              <p><strong>Motivo de derivacion:</strong> {complementaryEvaluation.report.referralReason}</p>
              <p>
                <strong>Prueba o area:</strong> {complementaryEvaluation.report.requestedInstrument.name}
                {" "}({complementaryEvaluation.report.requestedInstrument.type})
              </p>
              <div className="session-summary-grid">
                <div>
                  <h4>Observaciones conductuales</h4>
                  <ul>
                    {complementaryEvaluation.report.behavioralObservations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Resultados principales</h4>
                  <ul>
                    {complementaryEvaluation.report.mainResults.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Hipotesis complementarias</h4>
                  <ul>
                    {complementaryEvaluation.report.complementaryHypotheses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Recomendaciones</h4>
                  <ul>
                    {complementaryEvaluation.report.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p><strong>Interpretacion clinica-formativa:</strong> {complementaryEvaluation.report.clinicalInterpretation}</p>
              <p><strong>Limitaciones:</strong> {complementaryEvaluation.report.limitations.join(" ")}</p>
              <p><strong>Nota etica:</strong> {complementaryEvaluation.report.ethicalNote}</p>
            </article>
          )}

          {complementaryEvaluation.report && (
            <div className="clinical-plan-form">
              <label>
                <span>¿Qué información nueva aporta el informe?</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.newInformation || ""}
                  onChange={(event) => updateReportIntegration({ newInformation: event.target.value })}
                  rows={2}
                />
              </label>
              <label>
                <span>Confirma, modifica o tensiona tu hipotesis?</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.hypothesisImpact || ""}
                  onChange={(event) => updateReportIntegration({ hypothesisImpact: event.target.value })}
                  rows={2}
                />
              </label>
              <label>
                <span>¿Qué integrarás al diseño de intervención?</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.interventionUse || ""}
                  onChange={(event) => updateReportIntegration({ interventionUse: event.target.value })}
                  rows={2}
                />
              </label>
              <label>
                <span>Que riesgos o dilemas eticos aparecen?</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.ethicalRisks || ""}
                  onChange={(event) => updateReportIntegration({ ethicalRisks: event.target.value })}
                  rows={2}
                />
              </label>
              <label>
                <span>Que limitaciones tiene este informe?</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.limitations || ""}
                  onChange={(event) => updateReportIntegration({ limitations: event.target.value })}
                  rows={2}
                />
              </label>
              <label>
                <span>Decision clinica posterior al informe</span>
                <textarea
                  value={clinicalArtifacts.complementaryEvaluation?.integration?.nextDecision || ""}
                  onChange={(event) => updateReportIntegration({ nextDecision: event.target.value })}
                  placeholder="Continuar evaluacion, iniciar intervencion, reformular hipotesis, cerrar o derivar."
                  rows={2}
                />
              </label>
            </div>
          )}

          {externalReportIntegrationEvaluation && (
            <div className={`clinical-plan-evaluation ${externalReportIntegrationEvaluation.level}`}>
              <div>
                <span>{externalReportIntegrationEvaluation.title}</span>
                <strong>{externalReportIntegrationEvaluation.levelLabel}</strong>
              </div>
              <p>{externalReportIntegrationEvaluation.summary}</p>
              <ul>
                {(externalReportIntegrationEvaluation.gaps.length
                  ? externalReportIntegrationEvaluation.gaps
                  : externalReportIntegrationEvaluation.strengths
                ).slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {(shouldShowInterventionDesign || normalizedClinicalArtifacts.interventionDesign.caseUnderstanding) && (
          <div className="clinical-plan-subpanel">
            <span className="eyebrow">Diseño de intervención aplicado al caso</span>
            <h3>Construir propuesta clinica situada</h3>
            <p>
              Esta pauta no es generica: debe sostenerse en entrevistas realizadas,
              decisiones previas, informes externos, contexto del paciente e hipotesis
              clinicas.
            </p>

            <div className="clinical-plan-form">
              {[
                ["caseUnderstanding", "Comprensión del caso"],
                ["clinicalFormulation", "Formulacion clinica"],
                ["objectives", "Objetivos de intervencion"],
                ["treatmentPlan", "Plan de tratamiento o intervencion"],
                ["strategies", "Estrategias clinicas"],
                ["processEvaluation", "Evaluacion del proceso"],
                ["ethics", "Consideraciones eticas"],
                ["reflexivity", "Reflexividad del estudiante"],
                ["contextualIntegration", "Integracion situada/contextual"],
                ["continuityDecision", "Continuidad, cierre o derivacion"]
              ].map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <textarea
                    value={clinicalArtifacts.interventionDesign?.[key] || ""}
                    onChange={(event) => updateInterventionDesign({ [key]: event.target.value })}
                    rows={2}
                  />
                </label>
              ))}
            </div>

            <div className={`clinical-plan-evaluation ${interventionDesignEvaluation.level}`}>
              <div>
                <span>{interventionDesignEvaluation.title}</span>
                <strong>{interventionDesignEvaluation.levelLabel}</strong>
              </div>
              <p>{interventionDesignEvaluation.summary}</p>
              <ul>
                {(interventionDesignEvaluation.gaps.length
                  ? interventionDesignEvaluation.gaps
                  : interventionDesignEvaluation.strengths
                ).slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
          </div>
        </details>

        <details className="closure-stage">
          <summary>
            <span>5</span>
            <strong>Decisión clínica</strong>
            <small>Continuidad, cierre, derivación o acción final.</small>
          </summary>
          <div className="closure-stage-body">
      <section className="closure-card closure-panel closure-panel-wide clinical-plan-panel">
        <div className="clinical-plan-header">
          <div>
            <span className="eyebrow">Decision clinica formativa</span>
            <h2>Decision sobre continuidad del proceso</h2>
            <p>
              Decide si corresponde cerrar, continuar, derivar o activar una respuesta de
              riesgo. La cantidad de sesiones es una hipótesis clínica que puedes sostener,
              ajustar o cuestionar durante el proceso.
            </p>
          </div>
          <div className="clinical-plan-range">
            <span>Plan propuesto</span>
            <strong>
              {plannedSessionTotal}
            </strong>
            <span>sesión(es)</span>
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
                  {value} sesión{value > 1 ? "es" : ""}
                </option>
              ))}
            </select>
            {planBelowCompletedSessions && (
              <div className="prep-plan-memory-warning" role="alert">
                Ya existen {completedSessionCount} sesiones registradas. No se eliminará
                memoria clinica previa; el plan visual se ajustara sin borrar lo trabajado.
              </div>
            )}
          </label>

          <label>
            <span>¿Por qué propones esta cantidad de sesiones?</span>
            <textarea
              value={clinicalDecision.justification}
              onChange={(event) => updateDecision({ justification: event.target.value })}
              placeholder="Ej.: porque el motivo aun necesita delimitarse y falta explorar apoyo o riesgo."
              rows={3}
            />
          </label>

          <label>
            <span>¿Qué información clínica ya tienes?</span>
            <textarea
              value={clinicalDecision.knownInformation || ""}
              onChange={(event) => updateDecision({ knownInformation: event.target.value })}
              placeholder="Resume los datos relevantes obtenidos en entrevista, sin convertirlos aun en diagnostico cerrado."
              rows={2}
            />
          </label>

          <label>
            <span>¿Qué información consideras que falta?</span>
            <textarea
              value={clinicalDecision.missingInformation || ""}
              onChange={(event) => updateDecision({ missingInformation: event.target.value })}
              placeholder="Nombra antecedentes, riesgo, red de apoyo, contexto o hipotesis que aun requieren exploracion."
              rows={2}
            />
          </label>

          <label>
            <span>Que riesgos, dilemas eticos o aspectos contextuales debes considerar?</span>
            <textarea
              value={clinicalDecision.ethicalConsiderations || ""}
              onChange={(event) => updateDecision({ ethicalConsiderations: event.target.value })}
              placeholder="Ej.: confidencialidad, riesgo, pertinencia de derivacion, contexto familiar o limites del simulador."
              rows={2}
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
              ? `La continuidad dentro del simulador quedó registrada. La sesión ${nextSessionNumber} podrá iniciarse después como acción opcional.`
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
              <button className="secondary-action" type="button" onClick={scheduleNextSession}>
                <ArrowRight aria-hidden="true" />
                Iniciar sesión {nextSessionNumber} ahora
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
          {!hasSavedContinuityAgreement && (
            <button className="secondary-action" type="button" onClick={requestBackHomeWithoutDecision}>
              <Home aria-hidden="true" />
              Volver al inicio
            </button>
          )}
          <button className="secondary-action" type="button" onClick={copyProcessSummary}>
            <Clipboard aria-hidden="true" />
            {processCopied ? "Proceso copiado" : "Copiar resumen del proceso"}
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
              <p className="microcopy">Señal cualitativa de apertura simulada, no medición clínica.</p>
              <ul>
                {processSummary.opennessEvolution.map((item) => (
                  <li key={item.sessionNumber}>
                    Sesión {item.sessionNumber}: {item.label || "sin señal cualitativa registrada"}
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
          </div>
        </details>
      </div>

    </section>
  );
}

function getClosureActionConfig({
  canContinueInSimulator,
  normalizedClinicalDecision,
  nextSessionStage,
  reachedSessionLimit
}) {
  if (canContinueInSimulator) {
    return {
      title: "Registrar continuidad",
      description:
        "Primero se registrará la continuidad. La sesión siguiente podrá iniciarse después como acción opcional.",
      primaryLabel: "Registrar continuidad"
    };
  }

  const suffix = reachedSessionLimit ? " Ya llegaste a la última sesión del proceso que propusiste." : "";
  const configs = {
    close_process: {
      title: "Cerrar proceso simulado",
      description: `La sesión quedará guardada como cierre del proceso simulado.${suffix}`,
      primaryLabel: "Cerrar proceso y volver al inicio"
    },
    refer: {
      title: "Registrar derivación",
      description:
        "La sesión quedará guardada con una decisión de derivación. Revisa que la justificación indique el motivo y el dispositivo sugerido.",
      primaryLabel: "Registrar derivación y finalizar sesión"
    },
    risk_protocol: {
      title: "Registrar protocolo de riesgo",
      description:
        "La prioridad formativa es dejar registrada la decisión de seguridad, supervisar el caso y no avanzar automáticamente a otra sesión.",
      primaryLabel: "Registrar protocolo de riesgo"
    },
    request_supervision: {
      title: "Registrar solicitud de supervisión",
      description:
        "La sesión quedará guardada para revisión docente o supervisión antes de tomar una nueva decisión clínica.",
      primaryLabel: "Registrar solicitud de supervisión"
    },
    apply_instruments: {
      title: "Registrar evaluación complementaria",
      description:
        "La sesión quedará guardada indicando que se requieren instrumentos o evaluación complementaria antes de continuar.",
      primaryLabel: "Registrar evaluación complementaria"
    },
    initial_feedback: {
      title: "Guardar devolución inicial",
      description:
        "La sesión quedará guardada con una decisión de devolución inicial, sin forzar avance automático a una nueva sesión.",
      primaryLabel: "Guardar devolución inicial"
    },
    follow_up: {
      title: "Guardar recomendación de seguimiento",
      description: "La sesión quedará guardada con recomendación de seguimiento y monitoreo según lo observado.",
      primaryLabel: "Guardar recomendación de seguimiento"
    },
    beyond_simulator: {
      title: "Registrar continuidad extendida",
      description:
        "La sesión quedará guardada indicando que el caso requiere continuidad más allá del ciclo disponible en el simulador.",
      primaryLabel: "Registrar continuidad extendida"
    }
  };

  return configs[normalizedClinicalDecision.action] || {
    title: "Guardar decisión y cerrar",
    description: `La sesión quedará guardada con tu decisión de ${formatClinicalDecision(normalizedClinicalDecision).toLowerCase()}.${suffix}`,
    primaryLabel: "Guardar decisión y volver al inicio"
  };
}

function formatClinicalAreaList(areaIds = []) {
  if (!Array.isArray(areaIds) || areaIds.length === 0) return "No registradas";
  const labels = areaIds
    .map((areaId) => clinicalExplorationAreas.find((area) => area.id === areaId)?.label || areaId)
    .filter(Boolean);
  return labels.slice(0, 6).join(", ") + (labels.length > 6 ? ` y ${labels.length - 6} mas` : "");
}

function mergeClinicalArtifactsDraft(base = {}, draft = {}) {
  if (!draft || typeof draft !== "object") return base;
  return {
    ...base,
    ...draft,
    complementaryEvaluation: {
      ...(base.complementaryEvaluation || {}),
      ...(draft.complementaryEvaluation || {}),
      integration: {
        ...(base.complementaryEvaluation?.integration || {}),
        ...(draft.complementaryEvaluation?.integration || {})
      }
    },
    interventionDesign: {
      ...(base.interventionDesign || {}),
      ...(draft.interventionDesign || {})
    }
  };
}

function hasMeaningfulClinicalDecisionDraft(decision = null, initialDecision = {}) {
  if (!decision || typeof decision !== "object") return false;
  const textFields = [
    decision.justification,
    decision.knownInformation,
    decision.missingInformation,
    decision.ethicalConsiderations,
    decision.nextSessionObjectives,
    decision.pendingRisks
  ];
  if (textFields.some(hasText)) return true;
  if (decision.action && decision.action !== initialDecision.action) return true;
  if (
    Number(decision.proposedSessions) > 0 &&
    Number(decision.proposedSessions) !== Number(initialDecision.proposedSessions)
  ) {
    return true;
  }
  return false;
}

function hasMeaningfulClinicalArtifactsDraft(artifacts = null) {
  if (!artifacts || typeof artifacts !== "object") return false;
  const baseTextFields = [
    artifacts.clinicalHypothesis,
    artifacts.supportingData,
    artifacts.missingData,
    artifacts.instrumentJustification,
    artifacts.initialFeedbackDraft,
    artifacts.clinicalNote
  ];
  if (baseTextFields.some(hasText)) return true;
  if (Array.isArray(artifacts.selectedInstruments) && artifacts.selectedInstruments.length > 0) return true;
  if (hasMeaningfulComplementaryEvaluationDraft(artifacts.complementaryEvaluation)) return true;
  if (hasMeaningfulObjectText(artifacts.interventionDesign)) return true;
  return false;
}

function hasMeaningfulComplementaryEvaluationDraft(value = null) {
  if (!value || typeof value !== "object") return false;
  const fields = [
    value.instrumentId,
    value.justification,
    value.hypothesis,
    value.expectedInformation,
    value.agePertinence,
    value.integrationPlan
  ];
  if (fields.some(hasText)) return true;
  if (value.report) return true;
  if (value.status && value.status !== "draft") return true;
  return hasMeaningfulObjectText(value.integration);
}

function hasMeaningfulObjectText(value = null) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => {
    if (Array.isArray(item)) return item.length > 0;
    if (item && typeof item === "object") return hasMeaningfulObjectText(item);
    return hasText(item);
  });
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function getCurrentScrollY() {
  if (typeof window === "undefined") return 0;
  return window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
}
