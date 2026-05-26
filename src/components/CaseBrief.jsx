import React from "react";
import { ArrowLeft, ClipboardList, Play, Target, TriangleAlert } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";

export function CaseBrief({ caseItem, difficulty, onBack, onBegin }) {
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
            Comenzar entrevista
          </button>
        </div>
      </div>
    </section>
  );
}
