import React from "react";
import { ArrowRight, Gauge, Users } from "lucide-react";

export function CaseSelector({
  cases,
  difficulty,
  difficultyOptions,
  selectedCaseId,
  onDifficultyChange,
  onSelectCase
}) {
  return (
    <section className="screen">
      <header className="section-header">
        <span className="eyebrow">Elige una práctica</span>
        <h1>Selector de casos ficticios</h1>
        <p>
          Cada escenario modifica el estilo de respuesta del paciente y los criterios
          específicos de retroalimentación.
        </p>
      </header>

      <div className="difficulty-panel">
        <div>
          <Gauge aria-hidden="true" />
          <h2>Nivel de dificultad</h2>
        </div>
        <div className="segmented-control" role="group" aria-label="Nivel de dificultad">
          {difficultyOptions.map((option) => (
            <button
              key={option.id}
              className={difficulty === option.id ? "selected" : ""}
              type="button"
              onClick={() => onDifficultyChange(option.id)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="case-grid">
        {cases.map((caseItem) => (
          <article
            className={selectedCaseId === caseItem.id ? "case-card selected" : "case-card"}
            key={caseItem.id}
            style={{ "--accent": caseItem.accent }}
          >
            <div className="case-card-image">
              {caseItem.image ? (
                <img src={caseItem.image} alt={`Retrato ficticio de ${caseItem.name}`} loading="lazy" />
              ) : (
                <Users aria-hidden="true" />
              )}
            </div>
            <div className="case-card-top">
              <span>{caseItem.difficulty}</span>
            </div>
            <h2>{caseItem.name}</h2>
            <strong>{caseItem.shortTitle}</strong>
            <p>{caseItem.motive}</p>
            <button type="button" onClick={() => onSelectCase(caseItem.id)}>
              Seleccionar caso
              <ArrowRight aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
