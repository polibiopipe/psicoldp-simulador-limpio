import React, { useEffect, useRef, useState } from "react";
import { MonitorPlay, RotateCcw, Send, ShieldCheck, SquareCheckBig, Users } from "lucide-react";
import { PatientCard } from "./PatientCard.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { SessionSelector } from "./SessionSelector.jsx";
import { VoiceDictationButton } from "./VoiceDictationButton.jsx";
import { AvatarSessionView } from "./AvatarSessionView.jsx";
import { PedagogicalGuide } from "./PedagogicalGuide.jsx";
import {
  getStageSuggestions,
  guidedInterventionTypes,
  resolveConversationStage
} from "../data/guidedConversation.js";
import { resolveInterviewGuideId } from "../data/pedagogicalGuides.js";

export function SimulationChat({
  caseItem,
  difficulty,
  sessionNumber = 1,
  totalSessions = 4,
  sessionSummary,
  history,
  onAsk,
  onFinish,
  onRestart,
  onChangeCase,
  onOpenTrust
}) {
  const [question, setQuestion] = useState("");
  const [selectedInterventionType, setSelectedInterventionType] = useState("");
  const [showStageSuggestions, setShowStageSuggestions] = useState(false);
  const [showVideoSession, setShowVideoSession] = useState(() =>
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? true
      : window.matchMedia("(min-width: 761px)").matches
  );
  const [avatarState, setAvatarState] = useState("idle");
  const [validationFeedback, setValidationFeedback] = useState("");
  const [canRetryLastMessage, setCanRetryLastMessage] = useState(false);
  const [failedTurn, setFailedTurn] = useState(null);
  const conversationRef = useRef(null);
  const previousHistoryLengthRef = useRef(history.length);
  const avatarIdleTimerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const visibleHistory = history.filter(isDisplayableEntry);
  const interviewTurns = visibleHistory.filter((entry) => !entry.isSessionPrelude);
  const currentStage = resolveConversationStage({
    sessionNumber,
    history: interviewTurns,
    selectedInterventionType
  });
  const interviewGuideId = resolveInterviewGuideId(currentStage.stageName, selectedInterventionType);
  const stageSuggestions = getStageSuggestions(currentStage.stageName).slice(0, 3);
  const lastConfidence = visibleHistory.at(-1)?.analysis?.confidence;
  const lowConfidenceSuggestion =
    lastConfidence && lastConfidence < 0.55 && !selectedInterventionType
      ? "Si la respuesta no fue suficientemente precisa, prueba seleccionar un tipo de intervención antes de enviar."
      : "";
  const writingSuggestion = validationFeedback || lowConfidenceSuggestion || analyzeWritingQuality(question);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior: "smooth"
    });
  }, [history.length]);

  useEffect(() => {
    if (history.length <= previousHistoryLengthRef.current) {
      previousHistoryLengthRef.current = history.length;
      return;
    }

    previousHistoryLengthRef.current = history.length;
    window.clearTimeout(avatarIdleTimerRef.current);
    setAvatarState("speaking");
    avatarIdleTimerRef.current = window.setTimeout(() => {
      setAvatarState((current) => current === "speaking" ? "idle" : current);
    }, 1800);
  }, [history.length]);

  useEffect(() => () => {
    window.clearTimeout(avatarIdleTimerRef.current);
    window.clearTimeout(responseTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
  }, []);

  function submitQuestion(event) {
    event.preventDefault();
    attemptSendQuestion(question);
  }

  function attemptSendQuestion(rawQuestion) {
    const validation = validateStudentMessage(rawQuestion);
    logSimulationDebug("SEND_ATTEMPT", {
      inputValue: rawQuestion,
      selectedInterventionType,
      canSend: validation.isValid,
      reasonIfBlocked: validation.isValid ? "" : validation.reason
    });
    if (!validation.isValid) {
      setValidationFeedback(validation.suggestion);
      return;
    }
    if (avatarState === "thinking" || avatarState === "closed") return;

    const studentMessage = rawQuestion.trim();
    const failedTurnId = failedTurn?.question === studentMessage ? failedTurn.id : crypto.randomUUID();
    setCanRetryLastMessage(false);
    setFailedTurn({
      id: failedTurnId,
      question: studentMessage,
      status: "sending",
      errorType: "",
      retryAvailable: false
    });
    setAvatarState("thinking");
    window.clearTimeout(responseTimerRef.current);
    responseTimerRef.current = window.setTimeout(async () => {
      try {
        const patientResponse = await onAsk(studentMessage, selectedInterventionType, {
          conversationStage: currentStage
        });
        logSimulationDebug("MESSAGE_SENT", {
          studentMessage,
          patientResponse
        });
        setQuestion("");
        setValidationFeedback("");
        setFailedTurn(null);
      } catch (error) {
        console.error("PATIENT_RESPONSE_ERROR", error);
        setAvatarState("idle");
        setCanRetryLastMessage(true);
        setFailedTurn({
          id: failedTurnId,
          question: studentMessage,
          status: "failed",
          errorType: error?.errorType || "unknown",
          retryAvailable: true
        });
        setValidationFeedback("");
      }
    }, 520);
  }

  function updateQuestion(value) {
    setQuestion(value);
    if (validationFeedback) setValidationFeedback("");
    if (avatarState !== "thinking" && avatarState !== "closed") {
      setAvatarState(value.trim() ? "listening" : "idle");
    }
  }

  function retryLastMessage() {
    if (!canRetryLastMessage || avatarState === "thinking" || avatarState === "closed") return;
    attemptSendQuestion(failedTurn?.question || question);
  }

  function appendDictatedText(text) {
    if (avatarState === "thinking" || avatarState === "closed") return;
    const transcript = text.trim();
    if (!transcript) return;
    setQuestion((current) => [current.trimEnd(), transcript].filter(Boolean).join(" "));
    setAvatarState("listening");
  }

  function finishSimulation() {
    if (avatarState === "closed") return;
    window.clearTimeout(avatarIdleTimerRef.current);
    window.clearTimeout(responseTimerRef.current);
    setAvatarState("closed");
    closeTimerRef.current = window.setTimeout(onFinish, 520);
  }

  return (
    <section className="screen chat-screen">
      <aside className="chat-sidebar">
        <PatientCard
          caseItem={caseItem}
          difficulty={difficulty}
          sessionNumber={sessionNumber}
          totalSessions={totalSessions}
          sessionSummary={sessionSummary}
        />
        <ProgressBar turnCount={interviewTurns.length} />
        <div className="learning-box">
          <h2>Tipo de sesión</h2>
          <SessionSelector
            currentSession={sessionNumber}
            availableSessions={[sessionNumber]}
            totalSessions={totalSessions}
          />
          {sessionSummary && (
            <p>Esta sesión retoma un resumen ficticio guardado de la entrevista anterior.</p>
          )}
        </div>
        <div className="learning-box">
          <h2>Objetivo de aprendizaje</h2>
          <p>{caseItem.objectives[0]}</p>
        </div>
        <div className="learning-box trust-compact-panel">
          <h2>Privacidad</h2>
          <p>Usa solo informacion ficticia. No ingreses datos reales de pacientes.</p>
          <button className="text-action" type="button" onClick={onOpenTrust}>
            <ShieldCheck aria-hidden="true" />
            Centro de confianza
          </button>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">Escucha Viva · Entrevista Psicológica Formativa</span>
            <div className="chat-title-line">
              <h1>{caseItem.name}</h1>
              <span className="session-context">
                {sessionNumber === 1
                  ? `Entrevista inicial simulada · Sesion 1 de ${totalSessions}`
                  : `Sesion ${sessionNumber} de ${totalSessions}`}
              </span>
            </div>
          </div>
          <div className="chat-actions">
            <button
              className="secondary-action video-view-toggle"
              type="button"
              aria-pressed={showVideoSession}
              onClick={() => setShowVideoSession((current) => !current)}
            >
              <MonitorPlay aria-hidden="true" />
              {showVideoSession ? "Ocultar vista" : "Vista simulada"}
            </button>
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
              onClick={finishSimulation}
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

        <PedagogicalGuide
          guideId={interviewGuideId}
          className="chat-phase-guide"
        />

        <div className={`interview-experience${showVideoSession ? " with-video" : " chat-only"}`}>
          {showVideoSession && (
            <AvatarSessionView
              avatarState={avatarState}
              caseItem={caseItem}
              sessionNumber={sessionNumber}
              totalSessions={totalSessions}
              turnCount={interviewTurns.length}
              onFinish={finishSimulation}
            />
          )}

          <div className="conversation" aria-live="polite" ref={conversationRef}>
            {visibleHistory.length === 0 && !failedTurn ? (
              <div className="empty-state">
                <p>{caseItem.openingLine}</p>
                <span>
                  Puedes comenzar con calma: presenta el encuadre y abre la conversación
                  con una pregunta respetuosa.
                </span>
              </div>
            ) : (
              <>
                {visibleHistory.map((entry) => (
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
                ))}
                {failedTurn && (
                  <div className="exchange failed-exchange" key={failedTurn.id}>
                    <div className="message student-message">
                      <span>Estudiante</span>
                      <p>{failedTurn.question}</p>
                    </div>
                    <div className={`message patient-message retryable-message ${failedTurn.status}`}>
                      <span>{caseItem.name}</span>
                      {failedTurn.status === "sending" ? (
                        <p>Esperando respuesta del paciente...</p>
                      ) : (
                        <>
                          <p>No pudimos obtener la respuesta del paciente. Tu intervención está guardada.</p>
                          <button
                            className="secondary-action retry-response-action"
                            type="button"
                            onClick={retryLastMessage}
                          >
                            Reintentar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <form className="question-form" onSubmit={submitQuestion}>
          <label htmlFor="student-question">Intervención del estudiante</label>
          <p className="writing-support">
            Escribe con calma y claridad. Una pregunta cuidadosa puede abrir una
            conversación más profunda.
          </p>
          <PedagogicalGuide
            guideId="intervencion_breve"
            autoOpen={false}
            compact
            className="input-guide"
          />
          <div className="guided-intervention-panel">
            <label htmlFor="intervention-type">Tipo de intervención</label>
            <select
              id="intervention-type"
              value={selectedInterventionType}
              onChange={(event) => {
                setSelectedInterventionType(event.target.value);
                setShowStageSuggestions(false);
              }}
            >
              <option value="">Automático</option>
              {guidedInterventionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              className="stage-suggestions-toggle"
              type="button"
              onClick={() => setShowStageSuggestions((current) => !current)}
              aria-expanded={showStageSuggestions}
            >
              {showStageSuggestions ? "▾ Ocultar sugerencias" : "▸ Ver sugerencias para esta etapa"}
            </button>
            {showStageSuggestions && (
              <div className="stage-suggestions">
                <span>Intervenciones sugeridas: {currentStage.stageLabel}</span>
                <ul>
                  {stageSuggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="input-row">
            <textarea
              id="student-question"
              disabled={avatarState === "thinking" || avatarState === "closed"}
              value={question}
              onChange={(event) => updateQuestion(event.target.value)}
              placeholder="Ej.: Antes de comenzar, quisiera explicarte el objetivo de esta entrevista. ¿Qué te gustaría que entienda de lo que estás viviendo?"
              rows={3}
            />
            <VoiceDictationButton
              disabled={avatarState === "thinking" || avatarState === "closed"}
              onTranscript={appendDictatedText}
              onStatusChange={setValidationFeedback}
            />
            <button
              className="icon-action"
              type="submit"
              aria-label="Enviar intervención"
              disabled={avatarState === "thinking" || avatarState === "closed"}
            >
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

function logSimulationDebug(label, payload) {
  if (import.meta.env.DEV || globalThis.__EV_DEBUG_CONVERSATION__) {
    console.log(label, payload);
  }
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
