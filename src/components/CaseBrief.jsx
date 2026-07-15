import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Play,
  Sparkles,
  Target,
  TriangleAlert
} from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { SessionSelector } from "./SessionSelector.jsx";
import { PedagogicalGuide } from "./PedagogicalGuide.jsx";
import { clinicalExplorationAreas, interviewTypeOptions } from "../data/clinicalWorkflow.js";
import { SESSION_COUNT_LIMITS, ethicalCareChecklist, evaluatePreSessionReadiness } from "../engine/clinicalPreparation.js";
import {
  CLINICAL_TERM_OPTIONS,
  getClinicalTermCopy,
  getClinicalTermPreference,
  saveClinicalTermPreference
} from "../engine/clinicalLanguage.js";
import {
  buildClinicalDraftKey,
  clearClinicalDraft,
  loadClinicalDraft,
  saveClinicalDraft
} from "../engine/clinicalDraftAutosave.js";

const prepSteps = [
  { id: "objective", label: "Objetivo inicial", hint: "Qué necesitas comprender primero." },
  { id: "process", label: "Plan de sesiones", hint: "Cantidad, criterio y objetivos." },
  { id: "interview", label: "Tipo de entrevista", hint: "Modalidad y justificación." },
  { id: "areas", label: "Áreas prioritarias", hint: "Foco clínico inicial." },
  { id: "ethics", label: "Cuidados éticos", hint: "Encuadre, límites y seguridad." },
  { id: "priority", label: "Información clave", hint: "Lo que no debe faltar." }
];

const prepReviewStep = {
  id: "summary",
  label: "Revisión final",
  hint: "Confirma tu plan antes de iniciar."
};

const interviewJustificationExamples = [
  "Elijo entrevista abierta para favorecer vínculo y escuchar el relato inicial.",
  "Elijo entrevista semiestructurada para equilibrar escucha clínica con exploración de áreas relevantes.",
  "Elijo entrevista estructurada porque necesito evaluar un aspecto específico o riesgo."
];

const assistantMessages = {
  objective:
    "Define qué necesitas comprender primero. Un buen objetivo inicial evita entrar a la entrevista solo por curiosidad.",
  process:
    "No elijas un número al azar. Tu propuesta de sesiones funciona como una hipótesis clínica inicial que luego deberás sostener, ajustar o cuestionar.",
  interview:
    "La modalidad de entrevista debe responder al caso y al momento clínico. Elige y justifica tu decisión.",
  areas:
    "No intentes explorarlo todo. Selecciona las áreas más importantes para esta primera sesión.",
  ethics:
    "Antes de preguntar, recuerda los límites de confidencialidad, consentimiento y manejo de riesgo.",
  priority:
    "Piensa qué información no puede faltar antes de cerrar esta primera entrevista.",
  summary:
    "Revisa tu plan inicial. Durante la entrevista podrás ajustar tu estrategia si el caso lo requiere.",
  ready:
    "Ya tienes un plan inicial. Ahora puedes comenzar la entrevista con mayor claridad."
};

export function CaseBrief({
  caseItem,
  difficulty,
  sessionNumber = 1,
  sessionSummary,
  availableSessions = [1],
  totalSessions = SESSION_COUNT_LIMITS.defaultValue,
  completedSessionCount = 0,
  preSessionPlan,
  userId = "",
  userEmail = "",
  sessionRecordId = "",
  onBack,
  onBegin,
  onSelectSession,
  onPreSessionPlanChange
}) {
  const [assistantVisible, setAssistantVisible] = useState(true);
  const [showWeakPreparationWarning, setShowWeakPreparationWarning] = useState(false);
  const [selectedPrepStepId, setSelectedPrepStepId] = useState(null);
  const [draftStatus, setDraftStatus] = useState(null);
  const restoredDraftRef = useRef(false);
  const stableSessionRecordIdRef = useRef(sessionRecordId);
  const [languagePreference, setLanguagePreference] = useState(() => getClinicalTermPreference(caseItem.id));
  const termCopy = getClinicalTermCopy(languagePreference);
  if (sessionRecordId) stableSessionRecordIdRef.current = sessionRecordId;
  const preparationDraftKey = useMemo(
    () =>
      buildClinicalDraftKey({
        userId,
        userEmail,
        caseId: caseItem.id,
        sessionId: stableSessionRecordIdRef.current,
        sessionNumber,
        step: "preparation"
      }),
    [userId, userEmail, caseItem.id, stableSessionRecordIdRef.current, sessionNumber]
  );
  const readiness = evaluatePreSessionReadiness(preSessionPlan, { languagePreference });
  const completion = readiness.requiredCompletion;
  const qualityCompletion = readiness.qualityCompletion;
  const activeStepId =
    prepSteps.find((step) => !completion[step.id])?.id ||
    prepSteps.find((step) => !qualityCompletion[step.id])?.id ||
    "summary";
  const displayedPrepStepId = selectedPrepStepId || activeStepId;
  const requiredComplete = readiness.requiredComplete;
  const qualityComplete = readiness.qualityComplete;
  const preparationWeak = requiredComplete && !qualityComplete;
  const requiredStepCount = prepSteps.length;
  const completedRequiredSteps = Object.values(completion).filter(Boolean).length;
  const prepProgressPercent = Math.round((completedRequiredSteps / requiredStepCount) * 100);
  const nextPrepStep = prepSteps.find((step) => !completion[step.id]) || prepSteps.find((step) => !qualityCompletion[step.id]);
  const selectedAreas = preSessionPlan?.explorationAreas || [];
  const selectedCareItems = preSessionPlan?.ethicalCareItems || [];
  const selectedAreaLabels = selectedAreas
    .map((areaId) => clinicalExplorationAreas.find((area) => area.id === areaId)?.label)
    .filter(Boolean);
  const selectedCareLabels = selectedCareItems
    .map((careId) => ethicalCareChecklist.find((item) => item.id === careId)?.label)
    .filter(Boolean);
  const assistantMessage = requiredComplete
    ? preparationWeak
      ? "Tu preparación permite iniciar, pero hay aspectos que conviene fortalecer. Puedes mejorarla o continuar de todos modos."
      : assistantMessages.ready
    : assistantMessages[activeStepId] || assistantMessages.summary;
  const proposedSessionCount =
    Number(preSessionPlan?.proposedSessionCount) || totalSessions || SESSION_COUNT_LIMITS.defaultValue;
  const planBelowCompletedSessions = Number(proposedSessionCount) < Number(completedSessionCount || 0);
  const previousClinicalDecision = getClinicalDecisionFromSummary(sessionSummary);
  const previousExternalReport = getExternalReportFromSummary(sessionSummary);
  const previousReportIntegration = getReportIntegrationFromSummary(sessionSummary);
  const previousPendingTopics = getPendingTopicsFromSummary(sessionSummary);

  useEffect(() => {
    setLanguagePreference(getClinicalTermPreference(caseItem.id));
    setSelectedPrepStepId(null);
    setShowWeakPreparationWarning(false);
    setDraftStatus(null);
    restoredDraftRef.current = false;
  }, [caseItem.id, sessionNumber]);

  useEffect(() => {
    if (!preSessionPlan || !onPreSessionPlanChange) return;
    const draft = loadClinicalDraft(preparationDraftKey);
    if (!hasMeaningfulPreSessionDraft(draft) || hasMeaningfulPreSessionDraft(preSessionPlan)) return;

    restoredDraftRef.current = true;
    setDraftStatus({ type: "restored", message: "Recuperamos tu borrador." });
    onPreSessionPlanChange({
      ...preSessionPlan,
      ...draft,
      caseId: caseItem.id,
      sessionNumber
    });
  }, [preparationDraftKey]);

  useEffect(() => {
    if (!preSessionPlan || !hasMeaningfulPreSessionDraft(preSessionPlan)) return undefined;

    if (!restoredDraftRef.current) {
      setDraftStatus({ type: "pending", message: "Cambios pendientes de guardar." });
    }

    const timeoutId = window.setTimeout(() => {
      const result = saveClinicalDraft(preparationDraftKey, preSessionPlan);
      if (result.ok) {
        setDraftStatus({ type: "saved", message: "Borrador guardado." });
      }
      restoredDraftRef.current = false;
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [preparationDraftKey, preSessionPlan]);

  useEffect(() => {
    if (!hasMeaningfulPreSessionDraft(preSessionPlan)) return undefined;

    function warnBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [preSessionPlan]);

  function updatePlan(patch) {
    if (!onPreSessionPlanChange) return;
    setShowWeakPreparationWarning(false);
    onPreSessionPlanChange({
      ...preSessionPlan,
      ...patch
    });
  }

  function updateLanguagePreference(patch) {
    const next = saveClinicalTermPreference({
      caseId: caseItem.id,
      ...languagePreference,
      ...patch,
      saveAsDefault: true
    });
    setLanguagePreference(next);
    updatePlan({
      clinicalLanguageTerm: next.term,
      clinicalLanguageCustomTerm: next.customTerm,
      clinicalLanguageLabel: getClinicalTermCopy(next).singular
    });
  }

  function toggleArea(areaId) {
    const current = new Set(preSessionPlan?.explorationAreas || []);
    if (current.has(areaId)) current.delete(areaId);
    else current.add(areaId);
    updatePlan({ explorationAreas: Array.from(current) });
  }

  function toggleCareItem(careId) {
    const current = new Set(preSessionPlan?.ethicalCareItems || []);
    if (current.has(careId)) current.delete(careId);
    else current.add(careId);
    updatePlan({ ethicalCareItems: Array.from(current) });
  }

  function handleBeginClick() {
    if (!requiredComplete) return;
    if (preparationWeak && !showWeakPreparationWarning) {
      setSelectedPrepStepId("summary");
      setShowWeakPreparationWarning(true);
      return;
    }
    beginWithPreparationState(preparationWeak);
  }

  function beginWithPreparationState(overrideUsed = false) {
    if (!onBegin) return;
    clearClinicalDraft(preparationDraftKey);
    setDraftStatus(null);
    onBegin({
      preparationQuality: preparationWeak ? "debil" : "suficiente",
      preparationOverrideUsed: Boolean(overrideUsed),
      preparationWeakReasons: readiness.weakReasons,
      preparationMissingFields: readiness.missingReasons,
      preparationStartedAt: new Date().toISOString()
    });
  }

  function getPrepStepStatus(stepId) {
    if (stepId === "summary") {
      if (displayedPrepStepId === "summary" && !requiredComplete) return "in-progress";
      if (requiredComplete && qualityComplete) return "completed";
      if (requiredComplete) return "weak";
      return "pending";
    }

    if (displayedPrepStepId === stepId && !completion[stepId]) return "in-progress";
    if (completion[stepId]) return qualityCompletion[stepId] ? "completed" : "weak";
    return "pending";
  }

  function renderPreparationStepContent() {
    if (displayedPrepStepId === "objective") {
      return (
        <div className="prep-step-panel">
          <div className="clinical-prep-field clinical-language-field">
            <span>Lenguaje del proceso</span>
            <small>
              La forma en que nombras a la persona también comunica tu enfoque.
              Elige un término respetuoso y úsalo con coherencia.
            </small>
            <div className="clinical-language-controls">
              <label>
                <span>Usaré el término</span>
                <select
                  value={languagePreference.term}
                  onChange={(event) => updateLanguagePreference({ term: event.target.value })}
                >
                  {CLINICAL_TERM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {languagePreference.term === "otro" && (
                <label>
                  <span>Término personalizado</span>
                  <input
                    type="text"
                    value={languagePreference.customTerm}
                    onChange={(event) => updateLanguagePreference({ customTerm: event.target.value })}
                    placeholder="Ej.: persona consultante"
                  />
                </label>
              )}
            </div>
            <p className="prep-help-note">
              Guía Vivo usará esta preferencia en agenda, preparación y recordatorios:
              entrevista {termCopy.prep}.
            </p>
          </div>

          <label className="clinical-prep-field">
            <span>Objetivo inicial de evaluación</span>
            <small>
              Escribe tu objetivo inicial para esta entrevista. ¿Qué necesitas
              comprender primero del caso?
            </small>
            <textarea
              value={preSessionPlan.evaluationObjective}
              onChange={(event) => updatePlan({ evaluationObjective: event.target.value })}
              placeholder={`Ej.: Comprender cómo el estrés laboral está afectando el funcionamiento emocional, familiar y cotidiano de ${caseItem.name}.`}
              rows={3}
            />
          </label>
        </div>
      );
    }

    if (displayedPrepStepId === "process") {
      return (
        <div className="prep-step-panel">
          <div className="clinical-prep-field session-plan-field">
            <span>Cantidad de sesiones que propones para este caso</span>
            <small>
              Define cuántas sesiones consideras necesarias para trabajar este caso.
              El simulador generará ese número de sesiones y luego evaluará si tu
              decisión fue coherente con los objetivos clínicos, la evolución del
              proceso {termCopy.prep} y sus resultados.
            </small>
            <div className="session-count-control">
              <input
                type="number"
                min={SESSION_COUNT_LIMITS.min}
                max={SESSION_COUNT_LIMITS.max}
                value={preSessionPlan.proposedSessionCount}
                onChange={(event) => updatePlan({ proposedSessionCount: event.target.value })}
                aria-label="Cantidad de sesiones propuestas"
              />
              <span>sesiones</span>
            </div>
            <p className="prep-help-note">
              No se trata de adivinar un número correcto. Tu propuesta funciona como
              una hipótesis clínica inicial; durante el proceso deberás demostrar si se
              sostiene, si requiere ajustes o si corresponde derivar, cerrar o continuar.
            </p>
            {planBelowCompletedSessions && (
              <div className="prep-plan-memory-warning" role="alert">
                Ya existen {completedSessionCount} sesiones registradas. No se eliminará
                memoria clínica previa; puedes cerrar el proceso o ajustar el plan, pero
                las sesiones realizadas se mantendrán.
              </div>
            )}
          </div>

          <label className="clinical-prep-field">
            <span>¿Por qué propones esta cantidad de sesiones?</span>
            <small>
              Justifica tu decisión considerando motivo de consulta, gravedad, riesgo,
              objetivos clínicos, recursos de {termCopy.article}, red de apoyo y posibilidad de
              reevaluación.
            </small>
            <textarea
              value={preSessionPlan.sessionCountJustification || ""}
              onChange={(event) => updatePlan({ sessionCountJustification: event.target.value })}
              placeholder="Ej.: Propongo 8 sesiones porque el malestar parece sostenido, afecta el funcionamiento familiar y emocional, y requiere reevaluar avances hacia la mitad del proceso."
              rows={3}
            />
          </label>

          <label className="clinical-prep-field">
            <span>Objetivos del proceso propuesto</span>
            <small>Indica qué esperas lograr durante las sesiones que propones.</small>
            <textarea
              value={preSessionPlan.processObjectives || ""}
              onChange={(event) => updatePlan({ processObjectives: event.target.value })}
              placeholder="Ej.: Comprender el origen del desgaste, identificar factores mantenedores, explorar impacto familiar, evaluar riesgo y definir continuidad, cierre o derivación."
              rows={3}
            />
          </label>
        </div>
      );
    }

    if (displayedPrepStepId === "interview") {
      return (
        <div className="prep-step-panel">
          <label className="clinical-prep-field">
            <span>Tipo de entrevista</span>
            <select
              value={preSessionPlan.interviewType}
              onChange={(event) => updatePlan({ interviewType: event.target.value })}
            >
              {interviewTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="clinical-prep-field">
            <span>¿Por qué eliges esta modalidad de entrevista?</span>
            <small>
              No basta con elegir una modalidad. Debes justificarla según el caso,
              el momento de la sesión y lo que necesitas evaluar.
            </small>
            <textarea
              value={preSessionPlan.interviewJustification || ""}
              onChange={(event) => updatePlan({ interviewJustification: event.target.value })}
              placeholder="Ej.: Elijo entrevista semiestructurada para equilibrar escucha clínica con exploración de áreas relevantes."
              rows={3}
            />
            <div className="prep-example-list" aria-label="Ejemplos de justificación">
              {interviewJustificationExamples.map((example) => (
                <span key={example}>{example}</span>
              ))}
            </div>
          </label>
        </div>
      );
    }

    if (displayedPrepStepId === "areas") {
      return (
        <div className="prep-step-panel">
          <div className="clinical-prep-field">
            <span>Áreas prioritarias</span>
            <small>
              Selecciona entre 4 y 6 áreas prioritarias para esta primera entrevista.
              No necesitas explorarlo todo en una sola sesión.
            </small>
            <div className="clinical-area-grid">
              {clinicalExplorationAreas.map((area) => (
                <label key={area.id}>
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                  />
                  {area.label}
                </label>
              ))}
            </div>
            <div className={`prep-priority-status ${selectedAreas.length > 6 ? "warning" : ""}`}>
              <strong>{selectedAreas.length}</strong>
              <span>
                {selectedAreas.length > 6
                  ? "Intenta priorizar. Una primera entrevista necesita foco clínico, no solo acumulación de preguntas."
                  : selectedAreas.length < 4
                    ? "Elige al menos 4 áreas para sostener un plan inicial suficiente."
                    : "Priorizar también es parte del criterio clínico."}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (displayedPrepStepId === "ethics") {
      return (
        <div className="prep-step-panel">
          <div className="clinical-prep-field">
            <span>Cuidados éticos</span>
            <small>Marca los cuidados que tendrás presentes antes de iniciar.</small>
            <div className="ethical-care-grid">
              {ethicalCareChecklist.map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    checked={selectedCareItems.includes(item.id)}
                    onChange={() => toggleCareItem(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (displayedPrepStepId === "priority") {
      return (
        <div className="prep-step-panel">
          <label className="clinical-prep-field">
            <span>Antes de cerrar esta primera entrevista, ¿qué información no puede faltar?</span>
            <textarea
              value={preSessionPlan.priorityInformation}
              onChange={(event) => updatePlan({ priorityInformation: event.target.value })}
              placeholder="Ej.: inicio del malestar, impacto funcional, irritabilidad familiar, red de apoyo y presencia o ausencia de riesgo."
              rows={3}
            />
          </label>
        </div>
      );
    }

    return (
      <section className="prep-summary-card" aria-labelledby="prep-summary-title">
        <div className="panel-heading">
          <ClipboardCheck aria-hidden="true" />
          <div>
            <span className="eyebrow">Tu plan inicial</span>
            <h3 id="prep-summary-title">Revisa antes de comenzar</h3>
          </div>
        </div>
        <p>
          Puedes ajustar tu estrategia durante la entrevista si el caso lo requiere.
          La preparación inicial será considerada en la retroalimentación.
        </p>
        <dl className="prep-summary-grid">
          <div>
            <dt>Objetivo</dt>
            <dd>{preSessionPlan.evaluationObjective || "Pendiente"}</dd>
          </div>
          <div>
            <dt>Sesiones propuestas</dt>
            <dd>{preSessionPlan.proposedSessionCount || "Pendiente"} sesión(es)</dd>
          </div>
          <div>
            <dt>Justificación de sesiones</dt>
            <dd>{preSessionPlan.sessionCountJustification || "Pendiente"}</dd>
          </div>
          <div>
            <dt>Objetivos del proceso</dt>
            <dd>{preSessionPlan.processObjectives || "Pendiente"}</dd>
          </div>
          <div>
            <dt>Modalidad</dt>
            <dd>{getInterviewTypeLabel(preSessionPlan.interviewType)}</dd>
          </div>
          <div>
            <dt>Justificación</dt>
            <dd>{preSessionPlan.interviewJustification || "Pendiente"}</dd>
          </div>
          <div>
            <dt>Áreas</dt>
            <dd>{selectedAreaLabels.length ? selectedAreaLabels.join(", ") : "Pendiente"}</dd>
          </div>
          <div>
            <dt>Cuidados</dt>
            <dd>{selectedCareLabels.length ? selectedCareLabels.join(", ") : "Pendiente"}</dd>
          </div>
          <div>
            <dt>Información clave</dt>
            <dd>{preSessionPlan.priorityInformation || "Pendiente"}</dd>
          </div>
        </dl>
        {requiredComplete && qualityComplete ? (
          <div className="prep-ready-message">
            <CheckCircle2 aria-hidden="true" />
            Preparación lograda. Puedes iniciar con mayor claridad.
          </div>
        ) : requiredComplete ? (
          <div className="prep-ready-message weak">
            <TriangleAlert aria-hidden="true" />
            Preparación débil: puedes mejorarla o continuar de todos modos.
          </div>
        ) : (
          <div className="prep-ready-message pending">
            <Compass aria-hidden="true" />
            Completa los pasos pendientes antes de iniciar la entrevista.
          </div>
        )}
        {preparationWeak && showWeakPreparationWarning && (
          <div className="prep-weak-confirm" role="alert">
            <div>
              <strong>Necesita mejorar</strong>
              <p>
                Hay contenido suficiente para iniciar, pero la preparación está
                débil. Esto quedará registrado en la retroalimentación final.
              </p>
              <ul>
                {readiness.weakReasons.slice(0, 4).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            <div>
              <button
                className="secondary-action"
                type="button"
                onClick={() => setShowWeakPreparationWarning(false)}
              >
                Mejorar preparación
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={() => beginWithPreparationState(true)}
              >
                Continuar de todos modos
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="screen">
      <button className="text-action" type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Cambiar caso
      </button>

      <div className="brief-layout preparation-brief-layout">
        <div className="brief-sidebar-stack">
          <PatientCard
            caseItem={caseItem}
            difficulty={difficulty}
            sessionNumber={sessionNumber}
            totalSessions={proposedSessionCount}
            sessionSummary={sessionSummary}
            preSessionPlan={preSessionPlan}
          />

          {preSessionPlan && (
            <aside className="prep-sidebar-card" aria-label="Progreso de preparación">
              <div>
                <span className="eyebrow">Preparación</span>
                <h2>{prepProgressPercent}% listo</h2>
                <p>
                  {nextPrepStep
                    ? `Próximo paso: ${nextPrepStep.label}.`
                    : preparationWeak
                      ? "Plan completo con aspectos por fortalecer."
                      : "Plan listo para iniciar."}
                </p>
              </div>
              <div className="prep-progress-meter" aria-hidden="true">
                <span style={{ width: `${prepProgressPercent}%` }} />
              </div>
              <ul className="prep-sidebar-checklist">
                {prepSteps.map((step) => {
                  const status = getPrepStepStatus(step.id);
                  return (
                    <li key={step.id} className={status}>
                      <span>{step.label}</span>
                      <strong>
                        {status === "completed"
                          ? "Listo"
                          : status === "weak"
                            ? "Mejorar"
                            : "Pendiente"}
                      </strong>
                    </li>
                  );
                })}
              </ul>
              <button
                className="primary-action prep-start-action"
                type="button"
                onClick={handleBeginClick}
                disabled={!requiredComplete}
              >
                <Play aria-hidden="true" />
                {preparationWeak ? "Revisar antes de iniciar" : "Iniciar entrevista"}
              </button>
            </aside>
          )}
        </div>

        <div className="brief-content">
          <header className="section-header">
            <span className="eyebrow">Escucha Viva - Entrevista Psicológica Formativa</span>
            <h1>{caseItem.name}</h1>
            <span className="case-practice-label">Persona ficticia para práctica formativa.</span>
            <p>{caseItem.motive}</p>
          </header>

          <section className="info-panel">
            <div className="panel-heading">
              <ClipboardList aria-hidden="true" />
              <h2>Tipo de sesión</h2>
            </div>
            <SessionSelector
              currentSession={sessionNumber}
              availableSessions={availableSessions}
              totalSessions={proposedSessionCount}
              onSelect={onSelectSession}
            />
            {sessionSummary ? (
              <p className="session-note">
                Hay un resumen ficticio de la sesión anterior guardado para este caso.
                Puedes continuar el proceso formativo sin perder lo ya trabajado.
              </p>
            ) : (
              <p className="session-note">
                La primera entrevista permite encuadrar, explorar el motivo inicial y
                dejar temas abiertos para continuidad simulada.
              </p>
            )}
          </section>

          {sessionSummary && (
            <section className="info-panel">
              <div className="panel-heading">
                <ClipboardCheck aria-hidden="true" />
                <h2>Continuidad clinica disponible</h2>
              </div>
              <ul>
                {previousClinicalDecision && (
                  <li>
                    Decision previa: {previousClinicalDecision.action || "registrada"}
                    {previousClinicalDecision.justification ? ` - ${previousClinicalDecision.justification}` : ""}
                  </li>
                )}
                {previousExternalReport && (
                  <li>
                    Informe externo recibido: {previousExternalReport.requestedInstrument?.name ||
                      previousExternalReport.caseData?.instrument || "evaluacion complementaria simulada"}.
                  </li>
                )}
                {previousReportIntegration && (
                  <li>
                    Integracion del informe: {previousReportIntegration.hypothesisImpact ||
                      previousReportIntegration.nextDecision ||
                      "pendiente de profundizar"}.
                  </li>
                )}
                {previousPendingTopics.slice(0, 3).map((item) => (
                  <li key={item}>Pendiente: {item}</li>
                ))}
                {!previousClinicalDecision && !previousExternalReport && previousPendingTopics.length === 0 && (
                  <li>Hay memoria de sesion previa, sin decisiones o informes externos registrados.</li>
                )}
              </ul>
            </section>
          )}

          <section className="info-panel">
            <div className="panel-heading">
              <ClipboardList aria-hidden="true" />
              <h2>Antecedentes relevantes</h2>
            </div>
            <ul>
              {caseItem.background.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="info-panel">
            <div className="panel-heading">
              <Target aria-hidden="true" />
              <h2>Objetivos formativos de esta simulación</h2>
            </div>
            <ul>
              {(caseItem.learningObjectives || caseItem.objectives || []).slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="info-panel caution">
            <div className="panel-heading">
              <TriangleAlert aria-hidden="true" />
              <h2>Recomendaciones antes de iniciar</h2>
            </div>
            <ul>
              {caseItem.sensitiveTopics.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {preSessionPlan && (
            <section className="info-panel clinical-preparation-panel">
              <div className="clinical-prep-hero">
                <div className="panel-heading">
                  <ClipboardList aria-hidden="true" />
                  <div>
                    <span className="eyebrow">Antesala clínica</span>
                    <h2>Antes de comenzar: prepara tu primera entrevista</h2>
                  </div>
                </div>
                <p>
                  Completa estos pasos antes de hablar {termCopy.prep}. Esta
                  preparación será considerada en tu retroalimentación final.
                </p>
                <PedagogicalGuide
                  guideId="preparacion_sesion"
                  autoOpen={false}
                  compact
                  className="prep-context-guide"
                />
                {draftStatus && (
                  <div className={`draft-autosave-status ${draftStatus.type}`} role="status">
                    {draftStatus.message}
                  </div>
                )}
              </div>

              <div className="prep-workflow-stepper" aria-label="Avance de preparacion">
                {[...prepSteps, prepReviewStep].map((step, index) => {
                  const status = getPrepStepStatus(step.id);
                  const isActive = displayedPrepStepId === step.id;
                  const StatusIcon = status === "completed" ? CheckCircle2 : status === "weak" ? TriangleAlert : Circle;
                  return (
                    <button
                      className={`prep-step ${status} ${isActive ? "is-active" : ""}`}
                      type="button"
                      key={step.id}
                      onClick={() => setSelectedPrepStepId(step.id)}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span className="prep-step-index">{index + 1}</span>
                      <StatusIcon aria-hidden="true" />
                      <strong>{step.label}</strong>
                      <em>{step.hint}</em>
                      <small>
                        {status === "completed"
                          ? "Completado"
                          : status === "weak"
                            ? "Necesita mejorar"
                          : status === "in-progress"
                            ? "En progreso"
                            : "Pendiente"}
                      </small>
                    </button>
                  );
                })}
              </div>

              <div className={`prep-assistant-card ${assistantVisible ? "visible" : "minimized"}`}>
                <div className="prep-assistant-orb" aria-hidden="true">
                  <span />
                  <Sparkles />
                </div>
                {assistantVisible ? (
                  <div className="prep-assistant-message">
                    <div>
                      <span>Guía Vivo</span>
                      <button type="button" onClick={() => setAssistantVisible(false)}>
                        Ocultar guía
                      </button>
                    </div>
                    <p>{assistantMessage}</p>
                  </div>
                ) : (
                  <button
                    className="prep-assistant-show"
                    type="button"
                    onClick={() => setAssistantVisible(true)}
                  >
                    Mostrar guía
                  </button>
                )}
              </div>

              {renderPreparationStepContent()}
            </section>
          )}

          {!preSessionPlan && (
            <button
              className="primary-action prep-start-action"
              type="button"
              onClick={handleBeginClick}
              disabled={!requiredComplete}
            >
              <Play aria-hidden="true" />
              Estoy listo para iniciar la entrevista
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const DEFAULT_PREPARATION_AREAS = new Set([
  "motivo_consulta",
  "estado_emocional",
  "funcionamiento_diario",
  "red_apoyo",
  "riesgo"
]);

function hasMeaningfulPreSessionDraft(plan = null) {
  if (!plan || typeof plan !== "object") return false;
  const textFields = [
    plan.evaluationObjective,
    plan.sessionCountJustification,
    plan.processObjectives,
    plan.interviewJustification,
    plan.priorityInformation,
    plan.clinicalLanguageCustomTerm
  ];
  if (textFields.some(hasText)) return true;
  if (Array.isArray(plan.ethicalCareItems) && plan.ethicalCareItems.length > 0) return true;
  if (Array.isArray(plan.explorationAreas) && hasNonDefaultAreaSelection(plan.explorationAreas)) return true;
  return false;
}

function hasNonDefaultAreaSelection(areas = []) {
  if (!Array.isArray(areas)) return false;
  if (areas.length !== DEFAULT_PREPARATION_AREAS.size) return true;
  return areas.some((area) => !DEFAULT_PREPARATION_AREAS.has(area));
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function getInterviewTypeLabel(value) {
  return interviewTypeOptions.find((option) => option.value === value)?.label || "Pendiente";
}

function getClinicalArtifactsFromSummary(summary) {
  return summary?.clinicalArtifacts || summary?.sessionSummary?.clinicalArtifacts || null;
}

function getClinicalDecisionFromSummary(summary) {
  return summary?.clinicalDecision || summary?.sessionSummary?.clinicalDecision || null;
}

function getExternalReportFromSummary(summary) {
  return getClinicalArtifactsFromSummary(summary)?.complementaryEvaluation?.report || null;
}

function getReportIntegrationFromSummary(summary) {
  const integration = getClinicalArtifactsFromSummary(summary)?.complementaryEvaluation?.integration;
  if (!integration || !Object.values(integration).some(Boolean)) return null;
  return integration;
}

function getPendingTopicsFromSummary(summary) {
  return Array.isArray(summary?.temasPendientes) ? summary.temasPendientes : [];
}
