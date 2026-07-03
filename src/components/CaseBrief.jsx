import React from "react";
import { ArrowLeft, ClipboardList, Play, Target, TriangleAlert } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { SessionSelector } from "./SessionSelector.jsx";
import { PedagogicalGuide } from "./PedagogicalGuide.jsx";
import { clinicalExplorationAreas, interviewTypeOptions } from "../data/clinicalWorkflow.js";

export function CaseBrief({
  caseItem,
  difficulty,
  sessionNumber = 1,
  sessionSummary,
  availableSessions = [1],
  preSessionPlan,
  onBack,
  onBegin,
  onSelectSession,
  onPreSessionPlanChange
}) {
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
            <span className="eyebrow">Escucha Viva · Entrevista Psicológica Formativa</span>
            <h1>{caseItem.name}</h1>
            <span className="case-practice-label">Paciente ficticio para práctica formativa.</span>
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
              <div className="panel-heading">
                <ClipboardList aria-hidden="true" />
                <h2>Preparacion antes de la sesion</h2>
              </div>

              <PedagogicalGuide guideId="preparacion_sesion" />

              <label className="clinical-prep-field">
                <span>Objetivo inicial de evaluacion</span>
                <textarea
                  value={preSessionPlan.evaluationObjective}
                  onChange={(event) => updatePlan({ evaluationObjective: event.target.value })}
                  placeholder="Ej.: comprender el motivo de consulta, estado emocional actual y apoyos."
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

              <div className="clinical-prep-field">
                <span>Areas a explorar</span>
                <div className="clinical-area-grid">
                  {clinicalExplorationAreas.map((area) => (
                    <label key={area.id}>
                      <input
                        type="checkbox"
                        checked={(preSessionPlan.explorationAreas || []).includes(area.id)}
                        onChange={() => toggleArea(area.id)}
                      />
                      {area.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="clinical-prep-field">
                <span>Cuidados eticos</span>
                <textarea
                  value={preSessionPlan.ethicalCare}
                  onChange={(event) => updatePlan({ ethicalCare: event.target.value })}
                  placeholder="Confidencialidad, limites de confidencialidad, riesgo y uso educativo."
                  rows={2}
                />
              </label>

              <label className="clinical-prep-field">
                <span>Informacion prioritaria para esta sesion</span>
                <textarea
                  value={preSessionPlan.priorityInformation}
                  onChange={(event) => updatePlan({ priorityInformation: event.target.value })}
                  placeholder="Ej.: inicio del malestar, impacto funcional, red de apoyo y riesgo."
                  rows={2}
                />
              </label>
            </section>
          )}

          <button className="primary-action" type="button" onClick={onBegin}>
            <Play aria-hidden="true" />
            Comenzar {sessionNumber === 1 ? "primera entrevista" : `Sesión ${sessionNumber}`}
          </button>
        </div>
      </div>
    </section>
  );
}
