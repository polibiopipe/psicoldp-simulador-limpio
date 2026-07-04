import React, { useState } from "react";
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
import { SESSION_COUNT_LIMITS, ethicalCareChecklist } from "../engine/clinicalPreparation.js";

const prepSteps = [
  { id: "objective", label: "Objetivo inicial" },
  { id: "process", label: "Plan de sesiones" },
  { id: "interview", label: "Tipo de entrevista" },
  { id: "areas", label: "Areas prioritarias" },
  { id: "ethics", label: "Cuidados eticos" },
  { id: "priority", label: "Informacion clave" }
];

const interviewJustificationExamples = [
  "Elijo entrevista abierta para favorecer vinculo y escuchar el relato inicial.",
  "Elijo entrevista semiestructurada para equilibrar escucha clinica con exploracion de areas relevantes.",
  "Elijo entrevista estructurada porque necesito evaluar un aspecto especifico o riesgo."
];

const assistantMessages = {
  objective:
    "Define que necesitas comprender primero. Un buen objetivo inicial te ayuda a no entrar a la entrevista solo por curiosidad.",
  process:
    "No elijas un numero al azar. Tu propuesta de sesiones funciona como una hipotesis clinica inicial que luego deberas sostener, ajustar o cuestionar.",
  interview:
    "La modalidad de entrevista debe responder al caso y al momento clinico. Elige y justifica tu decision.",
  areas:
    "No intentes explorarlo todo. Selecciona las areas mas importantes para esta primera sesion.",
  ethics:
    "Antes de preguntar, recuerda los limites de confidencialidad, consentimiento y manejo de riesgo.",
  priority:
    "Piensa que informacion no puede faltar antes de cerrar esta primera entrevista.",
  summary:
    "Revisa tu plan inicial. Durante la entrevista podras ajustar tu estrategia si el caso lo requiere.",
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
  preSessionPlan,
  onBack,
  onBegin,
  onSelectSession,
  onPreSessionPlanChange
}) {
  const [assistantVisible, setAssistantVisible] = useState(true);
  const completion = getPreparationCompletion(preSessionPlan);
  const activeStepId = prepSteps.find((step) => !completion[step.id])?.id || "summary";
  const allComplete = prepSteps.every((step) => completion[step.id]);
  const selectedAreas = preSessionPlan?.explorationAreas || [];
  const selectedCareItems = preSessionPlan?.ethicalCareItems || [];
  const selectedAreaLabels = selectedAreas
    .map((areaId) => clinicalExplorationAreas.find((area) => area.id === areaId)?.label)
    .filter(Boolean);
  const selectedCareLabels = selectedCareItems
    .map((careId) => ethicalCareChecklist.find((item) => item.id === careId)?.label)
    .filter(Boolean);
  const assistantMessage = allComplete
    ? assistantMessages.ready
    : assistantMessages[activeStepId] || assistantMessages.summary;
  const proposedSessionCount =
    Number(preSessionPlan?.proposedSessionCount) || totalSessions || SESSION_COUNT_LIMITS.defaultValue;

  function updatePlan(patch) {
    if (!onPreSessionPlanChange) return;
    onPreSessionPlanChange({
      ...preSessionPlan,
      ...patch
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

  return (
    <section className="screen">
      <button className="text-action" type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Cambiar caso
      </button>

      <div className="brief-layout">
        <PatientCard caseItem={caseItem} difficulty={difficulty} />

        <div className="brief-content">
          <header className="section-header">
            <span className="eyebrow">Escucha Viva - Entrevista Psicologica Formativa</span>
            <h1>{caseItem.name}</h1>
            <span className="case-practice-label">Paciente ficticio para practica formativa.</span>
            <p>{caseItem.motive}</p>
          </header>

          <section className="info-panel">
            <div className="panel-heading">
              <ClipboardList aria-hidden="true" />
              <h2>Tipo de sesion</h2>
            </div>
            <SessionSelector
              currentSession={sessionNumber}
              availableSessions={availableSessions}
              totalSessions={proposedSessionCount}
              onSelect={onSelectSession}
            />
            {sessionSummary ? (
              <p className="session-note">
                Hay un resumen ficticio de la sesion anterior guardado para este caso.
                Puedes continuar el proceso formativo sin perder lo ya trabajado.
              </p>
            ) : (
              <p className="session-note">
                La primera entrevista permite encuadrar, explorar el motivo inicial y
                dejar temas abiertos para continuidad simulada.
              </p>
            )}
          </section>

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
              <h2>Objetivos formativos de esta simulacion</h2>
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
                    <span className="eyebrow">Antesala clinica</span>
                    <h2>Antes de comenzar: prepara tu primera entrevista</h2>
                  </div>
                </div>
                <p>
                  Completa estos pasos antes de hablar con el paciente simulado. Esta
                  preparacion sera considerada en tu retroalimentacion final.
                </p>
              </div>

              <PedagogicalGuide guideId="preparacion_sesion" />

              <div className="prep-workflow-stepper" aria-label="Avance de preparacion">
                {prepSteps.map((step, index) => {
                  const status = completion[step.id]
                    ? "completed"
                    : activeStepId === step.id
                      ? "in-progress"
                      : "pending";
                  const StatusIcon = status === "completed" ? CheckCircle2 : Circle;
                  return (
                    <div className={`prep-step ${status}`} key={step.id}>
                      <span className="prep-step-index">{index + 1}</span>
                      <StatusIcon aria-hidden="true" />
                      <strong>{step.label}</strong>
                      <small>
                        {status === "completed"
                          ? "Completado"
                          : status === "in-progress"
                            ? "En progreso"
                            : "Pendiente"}
                      </small>
                    </div>
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
                      <span>Guia Vivo</span>
                      <button type="button" onClick={() => setAssistantVisible(false)}>
                        Ocultar guia
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
                    Mostrar guia
                  </button>
                )}
              </div>

              <label className="clinical-prep-field">
                <span>Objetivo inicial de evaluacion</span>
                <small>
                  Escribe tu objetivo inicial para esta entrevista. Que necesitas
                  comprender primero del caso?
                </small>
                <textarea
                  value={preSessionPlan.evaluationObjective}
                  onChange={(event) => updatePlan({ evaluationObjective: event.target.value })}
                  placeholder={`Ej.: Comprender como el estres laboral esta afectando el funcionamiento emocional, familiar y cotidiano de ${caseItem.name}.`}
                  rows={3}
                />
              </label>

              <div className="clinical-prep-field session-plan-field">
                <span>Cantidad de sesiones que propones para este caso</span>
                <small>
                  Define cuantas sesiones consideras necesarias para trabajar este caso.
                  El simulador generara ese numero de sesiones y luego evaluara si tu
                  decision fue coherente con los objetivos clinicos, la evolucion del
                  paciente y los resultados del proceso.
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
                  No se trata de adivinar un numero correcto. Tu propuesta funciona como
                  una hipotesis clinica inicial; durante el proceso deberas demostrar si se
                  sostiene, si requiere ajustes o si corresponde derivar, cerrar o continuar.
                </p>
              </div>

              <label className="clinical-prep-field">
                <span>Por que propones esta cantidad de sesiones?</span>
                <small>
                  Justifica tu decision considerando motivo de consulta, gravedad, riesgo,
                  objetivos clinicos, recursos del paciente, red de apoyo y posibilidad de
                  reevaluacion.
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
                <small>Indica que esperas lograr durante las sesiones que propones.</small>
                <textarea
                  value={preSessionPlan.processObjectives || ""}
                  onChange={(event) => updatePlan({ processObjectives: event.target.value })}
                  placeholder="Ej.: Comprender el origen del desgaste, identificar factores mantenedores, explorar impacto familiar, evaluar riesgo y definir continuidad, cierre o derivacion."
                  rows={3}
                />
              </label>

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
                <span>Por que eliges esta modalidad de entrevista?</span>
                <small>
                  No basta con elegir una modalidad. Debes justificarla segun el caso,
                  el momento de la sesion y lo que necesitas evaluar.
                </small>
                <textarea
                  value={preSessionPlan.interviewJustification || ""}
                  onChange={(event) => updatePlan({ interviewJustification: event.target.value })}
                  placeholder="Ej.: Elijo entrevista semiestructurada para equilibrar escucha clinica con exploracion de areas relevantes."
                  rows={3}
                />
                <div className="prep-example-list" aria-label="Ejemplos de justificacion">
                  {interviewJustificationExamples.map((example) => (
                    <span key={example}>{example}</span>
                  ))}
                </div>
              </label>

              <div className="clinical-prep-field">
                <span>Areas prioritarias</span>
                <small>
                  Selecciona entre 4 y 6 areas prioritarias para esta primera entrevista.
                  No necesitas explorarlo todo en una sola sesion.
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
                      ? "Intenta priorizar. Una primera entrevista necesita foco clinico, no solo acumulacion de preguntas."
                      : selectedAreas.length < 4
                        ? "Elige al menos 4 areas para sostener un plan inicial suficiente."
                        : "Priorizar tambien es parte del criterio clinico."}
                  </span>
                </div>
              </div>

              <div className="clinical-prep-field">
                <span>Cuidados eticos</span>
                <small>Marca los cuidados que tendras presentes antes de iniciar.</small>
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

              <label className="clinical-prep-field">
                <span>Antes de cerrar esta primera entrevista, que informacion no puede faltar?</span>
                <textarea
                  value={preSessionPlan.priorityInformation}
                  onChange={(event) => updatePlan({ priorityInformation: event.target.value })}
                  placeholder="Ej.: inicio del malestar, impacto funcional, irritabilidad familiar, red de apoyo y presencia o ausencia de riesgo."
                  rows={2}
                />
              </label>

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
                  La preparacion inicial sera considerada en la retroalimentacion.
                </p>
                <dl className="prep-summary-grid">
                  <div>
                    <dt>Objetivo</dt>
                    <dd>{preSessionPlan.evaluationObjective || "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt>Sesiones propuestas</dt>
                    <dd>{preSessionPlan.proposedSessionCount || "Pendiente"} sesion(es)</dd>
                  </div>
                  <div>
                    <dt>Justificacion de sesiones</dt>
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
                    <dt>Justificacion</dt>
                    <dd>{preSessionPlan.interviewJustification || "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt>Areas</dt>
                    <dd>{selectedAreaLabels.length ? selectedAreaLabels.join(", ") : "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt>Cuidados</dt>
                    <dd>{selectedCareLabels.length ? selectedCareLabels.join(", ") : "Pendiente"}</dd>
                  </div>
                  <div>
                    <dt>Informacion clave</dt>
                    <dd>{preSessionPlan.priorityInformation || "Pendiente"}</dd>
                  </div>
                </dl>
                {allComplete ? (
                  <div className="prep-ready-message">
                    <CheckCircle2 aria-hidden="true" />
                    Preparacion lograda. Puedes iniciar con mayor claridad.
                  </div>
                ) : (
                  <div className="prep-ready-message pending">
                    <Compass aria-hidden="true" />
                    Completa los pasos pendientes antes de iniciar la entrevista.
                  </div>
                )}
              </section>
            </section>
          )}

          <button
            className="primary-action prep-start-action"
            type="button"
            onClick={onBegin}
            disabled={!allComplete}
          >
            <Play aria-hidden="true" />
            Estoy listo para iniciar la entrevista
          </button>
        </div>
      </div>
    </section>
  );
}

function getPreparationCompletion(plan = {}) {
  const selectedAreas = Array.isArray(plan?.explorationAreas) ? plan.explorationAreas : [];
  const selectedCareItems = Array.isArray(plan?.ethicalCareItems) ? plan.ethicalCareItems : [];
  return {
    objective: String(plan?.evaluationObjective || "").trim().length >= 18,
    process:
      Number(plan?.proposedSessionCount) >= SESSION_COUNT_LIMITS.min &&
      Number(plan?.proposedSessionCount) <= SESSION_COUNT_LIMITS.max &&
      String(plan?.sessionCountJustification || "").trim().length >= 24 &&
      String(plan?.processObjectives || "").trim().length >= 24,
    interview:
      Boolean(plan?.interviewType) &&
      String(plan?.interviewJustification || "").trim().length >= 18,
    areas: selectedAreas.length >= 4 && selectedAreas.length <= 6,
    ethics: selectedCareItems.length === ethicalCareChecklist.length,
    priority: String(plan?.priorityInformation || "").trim().length >= 18
  };
}

function getInterviewTypeLabel(value) {
  return interviewTypeOptions.find((option) => option.value === value)?.label || "Pendiente";
}
