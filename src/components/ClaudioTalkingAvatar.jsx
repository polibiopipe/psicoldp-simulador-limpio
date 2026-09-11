import React, { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { BrowserAvatarVoice, preferredSpanishVoice } from "../engine/browserAvatarVoice.js";
import "./claudio-pilot.css";

const LABELS = { idle: "Listo para conversar", listening: "Te escucho", thinking: "Preparando respuesta", speaking: "Claudio está hablando", closed: "Sesión finalizada" };
export default function ClaudioTalkingAvatar({ caseItem, history, avatarState, disabled, onVoiceIntervention, onFinish }) {
  const voiceRef = useRef(null);
  const propsRef = useRef({ onVoiceIntervention, disabled });
  propsRef.current = { onVoiceIntervention, disabled };
  const [started, setStarted] = useState(false);
  const [voiceState, setVoiceState] = useState("idle"), [error, setError] = useState(""), [interim, setInterim] = useState("");
  const [voices, setVoices] = useState([]), [voiceURI, setVoiceURI] = useState(""), [muted, setMuted] = useState(false);
  const previousAnswerRef = useRef(history.at(-1)?.id);
  const lastAnswer = history.at(-1)?.answer || caseItem.openingLine;
  const currentVoice = voices.find((voice) => voice.voiceURI === voiceURI) || preferredSpanishVoice(voices);
  const voiceConfigRef = useRef({ currentVoice, muted });
  voiceConfigRef.current = { currentVoice, muted };

  useEffect(() => {
    const voice = new BrowserAvatarVoice({
      onState: setVoiceState, onError: setError, onInterim: setInterim,
      onTranscript: (text) => { if (!propsRef.current.disabled) propsRef.current.onVoiceIntervention(text); }
    });
    voiceRef.current = voice;
    const refreshVoices = () => setVoices(window.speechSynthesis?.getVoices().filter((item) => /^es(?:-|$)/i.test(item.lang)) || []);
    refreshVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", refreshVoices);
    const hide = () => { if (document.hidden) voice.stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => {
      voice.dispose(); voiceRef.current = null;
      window.speechSynthesis?.removeEventListener("voiceschanged", refreshVoices);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  useEffect(() => {
    if (avatarState === "thinking" || avatarState === "closed" || disabled) voiceRef.current?.stop();
  }, [avatarState, disabled]);

  useEffect(() => {
    const latest = history.at(-1);
    if (!latest || latest.id === previousAnswerRef.current) return;
    previousAnswerRef.current = latest.id;
    if (!started || voiceConfigRef.current.muted) return;
    setError(""); voiceRef.current?.speak(latest.answer, voiceConfigRef.current.currentVoice);
  }, [history, started]);

  function start() { setError(""); setStarted(true); if (!muted) voiceRef.current?.speak(lastAnswer, currentVoice); }
  function toggleMicrophone() {
    setError("");
    if (voiceState === "listening") voiceRef.current?.finishListening(); else voiceRef.current?.listen();
  }
  function toggleMuted() { voiceRef.current?.stop(); setMuted((value) => !value); }
  const status = avatarState === "thinking" || avatarState === "closed" ? avatarState
    : voiceState !== "idle" ? voiceState : "idle";

  return (
    <section className="claudio-pilot" aria-label="Piloto de conversación con Claudio">
      <header className="claudio-pilot-header">
        <span>Conversación con Claudio</span><span role="status">{started ? LABELS[status] : "Listo para probar"}</span>
      </header>
      <div className="claudio-pilot-stage">
        <img className="claudio-pilot-portrait" src={caseItem.image} alt="Claudio, el paciente de esta sesión" />
        {!started && <div className="claudio-pilot-start"><button type="button" onClick={start} disabled={disabled}><Play aria-hidden="true" /> Activar conversación por voz</button></div>}
        <div className="claudio-pilot-caption"><strong>Claudio</strong><span>{caseItem.age} · Paciente ficticio</span></div>
      </div>
      {started && <>
        <div className="claudio-pilot-controls">
          <button type="button" onClick={toggleMicrophone} disabled={disabled} aria-pressed={voiceState === "listening"}>
            <Mic aria-hidden="true" />{voiceState === "listening" ? "Terminar intervención" : voiceState === "speaking" ? "Interrumpir y hablar" : "Hablar"}
          </button>
          <button type="button" onClick={toggleMuted} aria-pressed={muted}>{muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}{muted ? "Activar voz" : "Silenciar"}</button>
          <button type="button" disabled={disabled || muted || !lastAnswer || voiceState === "listening"} onClick={() => { setError(""); voiceRef.current?.speak(lastAnswer, currentVoice); }}><RotateCcw aria-hidden="true" /> Repetir respuesta</button>
          <button className="claudio-pilot-finish" type="button" disabled={disabled} onClick={() => { voiceRef.current?.stop(); onFinish(); }}><PhoneOff aria-hidden="true" /> Ir al cierre</button>
        </div>
        <p className="claudio-pilot-hint">Pulsa Hablar. Al terminar, tu intervención se enviará al chat. Puedes interrumpir la voz de Claudio.</p>
        {interim && <p className="claudio-pilot-transcript" aria-live="polite">{interim}</p>}
        <details className="claudio-pilot-settings"><summary>Voz y detalles de la prueba</summary>
          <label>Voz en español<select value={voiceURI} onChange={(event) => { voiceRef.current?.stop(); setVoiceURI(event.target.value); }}>
            <option value="">Selección automática</option>
            {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}
          </select></label>
          <p>Esta versión conserva el retrato original de Claudio. Puedes conversar por voz; la imagen permanece fija.</p>
          <p>Tu cámara permanece apagada. El navegador puede procesar el dictado mediante su servicio de voz; este piloto no guarda archivos de audio.</p>
        </details>
      </>}
      {error && <div className="claudio-pilot-error" role="alert"><p>{error}</p></div>}
    </section>
  );
}
