import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

const unsupportedMessage =
  "Tu navegador no permite dictado por voz. Puedes escribir tu intervención manualmente.";
const permissionMessage =
  "No se pudo acceder al micrófono. Revisa los permisos del navegador.";
const noSpeechMessage =
  "No se detectó voz. Intenta nuevamente o escribe tu intervención.";

export function VoiceDictationButton({ onTranscript, onStatusChange }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const receivedSpeechRef = useRef(false);
  const errorHandledRef = useRef(false);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function toggleDictation() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    startDictation();
  }

  function startDictation(language = "es-CL") {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setIsSupported(false);
      onStatusChange?.(unsupportedMessage);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    receivedSpeechRef.current = false;
    errorHandledRef.current = false;
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let skipNoSpeechOnEnd = false;

    recognition.onstart = () => {
      setIsListening(true);
      onStatusChange?.("Escuchando...");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript?.trim();
        if (!transcript) continue;
        if (event.results[index].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      if (finalTranscript.trim()) {
        receivedSpeechRef.current = true;
        onTranscript?.(finalTranscript.trim());
        onStatusChange?.("Texto dictado agregado. Revísalo antes de enviar.");
        return;
      }

      if (interimTranscript.trim()) {
        onStatusChange?.(`Escuchando: “${interimTranscript.trim()}”`);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      errorHandledRef.current = true;
      skipNoSpeechOnEnd = true;
      const fallbackLanguage = getFallbackLanguage(recognition.lang);
      if (event.error === "language-not-supported" && fallbackLanguage) {
        window.setTimeout(() => startDictation(fallbackLanguage), 0);
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onStatusChange?.(permissionMessage);
        return;
      }
      if (event.error === "no-speech") {
        onStatusChange?.(noSpeechMessage);
        return;
      }
      onStatusChange?.("No se pudo iniciar el dictado por voz. Intenta nuevamente o escribe tu intervención.");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (!receivedSpeechRef.current && !errorHandledRef.current && !skipNoSpeechOnEnd) {
        onStatusChange?.(noSpeechMessage);
      }
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      onStatusChange?.("No se pudo iniciar el dictado por voz. Intenta nuevamente o escribe tu intervención.");
    }
  }

  return (
    <button
      className={`voice-dictation-button${isListening ? " listening" : ""}${!isSupported ? " unavailable" : ""}`}
      type="button"
      title="Dictar por voz"
      aria-label="Dictar intervención por voz"
      aria-pressed={isListening}
      onClick={toggleDictation}
    >
      {isSupported ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
      <span>{isListening ? "Escuchando" : isSupported ? "Dictar por voz" : "No disponible"}</span>
    </button>
  );
}

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getFallbackLanguage(language) {
  if (language === "es-CL") return "es-ES";
  if (language === "es-ES") return "es";
  return "";
}
