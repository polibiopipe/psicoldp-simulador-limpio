import React from "react";
import { ArrowRight, Gauge, Users } from "lucide-react";

const levelLearningFocus = {
  introductorio: "Encuadre, motivo de consulta, preguntas abiertas y escucha básica.",
  intermedio: "Ambivalencia, emociones, familia, validación y seguimiento contextual.",
  avanzado: "Riesgo, dilemas éticos, derivación, resistencia y cierre complejo."
};

export function CaseSelector({
  cases,
  difficulty,
  difficultyOptions,
  selectedCaseId,
  onDifficultyChange,
  onSelectCase
}) {
  const selectedLevel = difficultyOptions.find((option) => option.id === difficulty);

  return (
    <section className="screen">
      <header className="section-header">
        <span className="eyebrow">Escucha Viva · Simuladores formativos</span>
        <h1>Casos disponibles</h1>
        <p>
          Elige un caso ficticio y practica distintas sesiones de una entrevista
          psicológica formativa, con objetivos claros y a tu propio ritmo.
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
        <p className="level-focus">
          {selectedLevel?.label}: {levelLearningFocus[difficulty] || selectedLevel?.description}
        </p>
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
              <span className={`case-level case-level-${caseItem.difficulty.toLowerCase()}`}>
                {caseItem.difficulty}
              </span>
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
