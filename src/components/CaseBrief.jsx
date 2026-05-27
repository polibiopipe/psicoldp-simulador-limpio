import React from "react";
import { ArrowLeft, ClipboardList, Play, Target, TriangleAlert } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { SessionSelector } from "./SessionSelector.jsx";

export function CaseBrief({
  caseItem,
  difficulty,
  sessionNumber = 1,
  sessionSummary,
  onBack,
  onBegin,
  onSelectSession
}) {
  const availableSessions = sessionSummary ? [1, 2] : [1];

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
            <span className="eyebrow">Preparación de entrevista</span>
            <h1>{caseItem.name}</h1>
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
                Hay un resumen ficticio de Sesión 1 guardado para este caso. Puedes
                continuar con Sesión 2 cuando quieras profundizar.
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
              <h2>Objetivo de aprendizaje</h2>
            </div>
            <ul>
              {caseItem.objectives.map((item) => (
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

          <button className="primary-action" type="button" onClick={onBegin}>
            <Play aria-hidden="true" />
            Comenzar {sessionNumber === 1 ? "primera entrevista" : `Sesión ${sessionNumber}`}
          </button>
        </div>
      </div>
    </section>
  );
}
