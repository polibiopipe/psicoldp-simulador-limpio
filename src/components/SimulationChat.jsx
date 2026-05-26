import React, { useState } from "react";
import { RotateCcw, Send, SquareCheckBig, Users } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { ProgressBar } from "./ProgressBar.jsx";

export function SimulationChat({
  caseItem,
  difficulty,
  history,
  onAsk,
  onFinish,
  onRestart,
  onChangeCase
}) {
  const [question, setQuestion] = useState("");
  const writingSuggestion = analyzeWritingQuality(question);

  function submitQuestion(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onAsk(trimmed);
    setQuestion("");
  }

  return (
    <section className="screen chat-screen">
      <aside className="chat-sidebar">
        <PatientCard caseItem={caseItem} difficulty={difficulty} />
        <ProgressBar turnCount={history.length} />
        <div className="learning-box">
          <h2>Objetivo de aprendizaje</h2>
          <p>{caseItem.objectives[0]}</p>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">Entrevista simulada</span>
            <h1>{caseItem.name}</h1>
          </div>
          <div className="chat-actions">
            <button className="secondary-action" type="button" onClick={onChangeCase}>
              <Users aria-hidden="true" />
              Caso
            </button>
            <button className="secondary-action" type="button" onClick={onRestart}>
              <RotateCcw aria-hidden="true" />
              Reiniciar
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={onFinish}
              disabled={history.length === 0}
            >
              <SquareCheckBig aria-hidden="true" />
              Terminar
            </button>
          </div>
        </header>

        <div className="conversation" aria-live="polite">
          {history.length === 0 ? (
            <div className="empty-state">
              <p>{caseItem.openingLine}</p>
              <span>
                Sugerencia: parte por encuadre, propósito educativo y una pregunta abierta.
              </span>
            </div>
          ) : (
            history.map((entry) => (
              <div className="exchange" key={entry.id}>
                <div className="message student-message">
                  <span>Estudiante</span>
                  <p>{entry.question}</p>
                </div>
                <div className="message patient-message">
                  <span>{caseItem.name}</span>
                  <p>{entry.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="question-form" onSubmit={submitQuestion}>
          <label htmlFor="student-question">Intervención del estudiante</label>
          <p className="writing-support">
            Redacta tu pregunta con claridad. Usa puntuación y evita mensajes demasiado
            ambiguos.
          </p>
          <div className="input-row">
            <textarea
              id="student-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ej.: Antes de comenzar, quisiera explicarte el objetivo de esta entrevista. ¿Qué te gustaría que entienda de lo que estás viviendo?"
              rows={3}
            />
            <button className="icon-action" type="submit" aria-label="Enviar intervención">
              <Send aria-hidden="true" />
            </button>
          </div>
          {writingSuggestion && (
            <p className="writing-suggestion" aria-live="polite">
              {writingSuggestion}
            </p>
          )}
        </form>
      </section>
    </section>
  );
}

function analyzeWritingQuality(studentMessage) {
  const text = normalizeWritingText(studentMessage);
  if (!text) return "";

  if (text === "q te pasa" || text === "que te pasa") {
    return "Sugerencia: podrías escribirlo de forma más clara, por ejemplo: “¿Qué sientes que te está pasando últimamente?”";
  }

  if (text === "te encierras" || text === "te encierras?") {
    return "Sugerencia: podrías formularlo así: “Cuando dices que te encierras, ¿a qué te refieres exactamente?”";
  }

  const shortExemptions = ["hola", "gracias", "buenos dias", "buenas tardes", "buenas noches"];
  if (text.length < 12 && !text.includes("?") && !shortExemptions.includes(text)) {
    return "Sugerencia: intenta agregar contexto o formular una pregunta completa.";
  }

  return "";
}

function normalizeWritingText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ");
}
