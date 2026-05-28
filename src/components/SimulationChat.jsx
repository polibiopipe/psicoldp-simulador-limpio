import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, SquareCheckBig, Users } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { SessionSelector } from "./SessionSelector.jsx";

export function SimulationChat({
  caseItem,
  difficulty,
  sessionNumber = 1,
  sessionSummary,
  history,
  onAsk,
  onFinish,
  onRestart,
  onChangeCase
}) {
  const [question, setQuestion] = useState("");
  const [validationFeedback, setValidationFeedback] = useState("");
  const conversationRef = useRef(null);
  const writingSuggestion = validationFeedback || analyzeWritingQuality(question);
  const visibleHistory = history.filter(isDisplayableEntry);
  const interviewTurns = visibleHistory.filter((entry) => !entry.isSessionPrelude);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior: "smooth"
    });
  }, [history.length]);

  function submitQuestion(event) {
    event.preventDefault();
    const validation = validateStudentMessage(question);
    if (!validation.isValid) {
      setValidationFeedback(validation.suggestion);
      return;
    }
    onAsk(question.trim());
    setQuestion("");
    setValidationFeedback("");
  }

  function updateQuestion(value) {
    setQuestion(value);
    if (validationFeedback) setValidationFeedback("");
  }

  return (
    <section className="screen chat-screen">
      <aside className="chat-sidebar">
        <PatientCard caseItem={caseItem} difficulty={difficulty} />
        <ProgressBar turnCount={interviewTurns.length} />
        <div className="learning-box">
          <h2>Tipo de sesión</h2>
          <SessionSelector currentSession={sessionNumber} availableSessions={[sessionNumber]} />
          {sessionSummary && (
            <p>Esta sesión retoma un resumen ficticio guardado de la entrevista anterior.</p>
          )}
        </div>
        <div className="learning-box">
          <h2>Objetivo de aprendizaje</h2>
          <p>{caseItem.objectives[0]}</p>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">
              {sessionNumber === 1 ? "Primera entrevista simulada" : `Sesión ${sessionNumber} simulada`}
            </span>
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
            >
              <SquareCheckBig aria-hidden="true" />
              Terminar
            </button>
          </div>
        </header>

        <details className="mobile-case-summary">
          <summary>Ficha y objetivo de la sesión</summary>
          <div>
            <strong>{caseItem.name} · {caseItem.age}</strong>
            <p>{caseItem.communicationStyle}</p>
            <p>{caseItem.objectives[0]}</p>
          </div>
        </details>

        <div className="conversation" aria-live="polite" ref={conversationRef}>
          {visibleHistory.length === 0 ? (
            <div className="empty-state">
              <p>{caseItem.openingLine}</p>
              <span>
                Sugerencia: parte por encuadre, propósito educativo y una pregunta abierta.
              </span>
            </div>
          ) : (
            visibleHistory.map((entry) => (
              <div className="exchange" key={entry.id}>
                {!entry.isSessionPrelude && (
                  <div className="message student-message">
                    <span>Estudiante</span>
                    <p>{entry.question}</p>
                  </div>
                )}
                <div className="message patient-message">
                  <span>{entry.isSessionPrelude ? `Inicio Sesión ${sessionNumber}` : caseItem.name}</span>
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
              onChange={(event) => updateQuestion(event.target.value)}
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

function isSubmittableQuestion(value) {
  return validateStudentMessage(value).isValid;
}

function isDisplayableEntry(entry) {
  if (entry.isSessionPrelude) return Boolean(entry.answer?.trim());
  return isSubmittableQuestion(entry.question?.trim() || "") && Boolean(entry.answer?.trim());
}

function validateStudentMessage(message) {
  const trimmed = message.trim();
  const normalized = normalizeWritingText(trimmed);
  const compact = normalized.replace(/\s+/g, "");
  const allowedBriefMessages = new Set([
    "si",
    "no",
    "claro",
    "entiendo",
    "continua",
    "gracias"
  ]);

  if (!trimmed) {
    return {
      isValid: false,
      reason: "empty",
      suggestion: "Escribe una intervención antes de enviarla."
    };
  }

  if (allowedBriefMessages.has(normalized)) {
    return {
      isValid: true,
      reason: "brief_but_meaningful",
      suggestion: ""
    };
  }

  if (normalized === "ok") {
    return {
      isValid: false,
      reason: "ambiguous_short",
      suggestion:
        "No se envió el mensaje. “Ok” puede ser muy ambiguo en esta práctica; intenta agregar una pregunta o una frase de seguimiento."
    };
  }

  if (!/[a-z0-9]/i.test(normalized)) {
    return {
      isValid: false,
      reason: "symbols_only",
      suggestion:
        "No se envió el mensaje. Intenta formular una intervención completa, por ejemplo: “¿Podrías contarme un poco más sobre eso?”"
    };
  }

  if (compact.length < 3) {
    return {
      isValid: false,
      reason: "too_short",
      suggestion:
        "No se envió el mensaje. Parece una entrada accidental. Para practicar una entrevista más clara, intenta escribir una intervención completa."
    };
  }

  const hasRecognizableWord = normalized
    .split(/\s+/)
    .some((word) => /^[a-z0-9]{3,}$/.test(word));

  if (!hasRecognizableWord) {
    return {
      isValid: false,
      reason: "no_recognizable_word",
      suggestion:
        "Tu intervención parece demasiado breve o poco clara. Intenta escribir una pregunta completa para que el paciente ficticio pueda responder de forma más coherente."
    };
  }

  return {
    isValid: true,
    reason: "valid",
    suggestion: ""
  };
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
