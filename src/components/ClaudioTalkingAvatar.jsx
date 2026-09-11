import React, { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { BrowserAvatarVoice, preferredSpanishVoice, VISEMES } from "../engine/browserAvatarVoice.js";
import "./claudio-pilot.css";

const MODEL_URL = "https://raw.githubusercontent.com/met4citizen/TalkingHead/eed58d198076a7e1e825f804802921c4d3804d46/avatars/avatarsdk.glb";
const LABELS = { loading: "Preparando avatar", idle: "Listo para conversar", listening: "Te escucho", thinking: "Preparando respuesta", speaking: "Claudio está hablando", closed: "Sesión finalizada" };
export default function ClaudioTalkingAvatar({ caseItem, history, avatarState, disabled, onVoiceIntervention, onFinish }) {
  const stageRef = useRef(null), headRef = useRef(null), voiceRef = useRef(null);
  const propsRef = useRef({ onVoiceIntervention, disabled });
  propsRef.current = { onVoiceIntervention, disabled };
  const [started, setStarted] = useState(false), [modelState, setModelState] = useState("idle");
  const [voiceState, setVoiceState] = useState("idle"), [error, setError] = useState(""), [interim, setInterim] = useState("");
  const [voices, setVoices] = useState([]), [voiceURI, setVoiceURI] = useState(""), [muted, setMuted] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
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
    if (!started) return undefined;
    let cancelled = false, head, settled = false, disposed = false;
    setModelState("loading");
    const disposeHead = () => {
      if (!head || disposed) return;
      disposed = true; head.dispose();
      void head.audioCtx?.close().catch(() => {});
      if (headRef.current === head) headRef.current = null;
    };
    (async () => {
      try {
        const { TalkingHead } = await import("@met4citizen/talkinghead");
        if (cancelled || !stageRef.current) return;
        head = new TalkingHead(stageRef.current, {
          ttsEndpoint: null, lipsyncModules: [], cameraView: "head",
          cameraRotateEnable: false, cameraPanEnable: false, cameraZoomEnable: false,
          modelFPS: 30, modelPixelRatio: Math.min(1, 1.5 / window.devicePixelRatio),
          avatarMood: "neutral", avatarIdleHeadMove: 0.12, avatarSpeakingHeadMove: 0.22,
          lightAmbientIntensity: 1.5, lightDirectIntensity: 12,
          update: () => {
            if (cancelled || !head?.mtAvatar) return;
            const voice = voiceRef.current, frame = voice?.lipFrame() || { viseme: "sil", level: 0 };
            head.isSpeaking = voice?.state === "speaking"; head.isListening = voice?.state === "listening";
            for (const viseme of VISEMES) {
              const morph = head.mtAvatar["viseme_" + viseme];
              if (!morph) continue;
              morph.realtime = viseme === frame.viseme ? frame.level : 0; morph.needsUpdate = true;
            }
          }
        });
        headRef.current = head;
        await head.showAvatar({
          url: MODEL_URL, body: "M", avatarMood: "neutral",
          retarget: { Neck: { z: -0.01, rx: -0.15 }, Neck1: { z: -0.01, rx: -0.15 }, Neck2: { z: -0.01, rx: -0.15 },
            LeftShoulder: { rz: -0.3 }, RightShoulder: { rz: 0.3 }, scaleToEyesLevel: 1, origin: { y: -0.1 } },
          baseline: { headRotateX: -0.04, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 }
        });
        if (cancelled) { disposeHead(); return; }
        setModelState("ready");
      } catch {
        disposeHead(); if (cancelled) return;
        setModelState("error"); setError("No se pudo cargar el avatar 3D. Puedes reintentar o seguir conversando con voz y texto.");
      } finally { settled = true; if (cancelled) disposeHead(); }
    })();
    return () => { cancelled = true; if (settled) disposeHead(); else head?.stop(); };
  }, [started, loadAttempt]);

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
    : voiceState !== "idle" ? voiceState : modelState === "loading" ? "loading" : "idle";

  return (
    <section className="claudio-pilot" aria-label="Piloto de conversación con Claudio">
      <header className="claudio-pilot-header">
        <span>Piloto · Voz y avatar 3D</span><span role="status">{started ? LABELS[status] : "Listo para probar"}</span>
      </header>
      <div className="claudio-pilot-stage">
        <div ref={stageRef} className="claudio-pilot-canvas" aria-label="Representación 3D de prueba" />
        {modelState !== "ready" && <img className="claudio-pilot-portrait" src={caseItem.image} alt="Retrato de Claudio" />}
        {!started && <div className="claudio-pilot-start"><button type="button" onClick={start} disabled={disabled}><Play aria-hidden="true" /> Activar voz y avatar</button></div>}
        <div className="claudio-pilot-caption"><strong>Claudio</strong><span>{caseItem.age} · Paciente ficticio</span></div>
        {modelState === "loading" && <span className="claudio-pilot-loading">Cargando representación 3D…</span>}
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
          <p>La figura 3D es provisional y no reproduce todavía el retrato de Claudio. El movimiento labial es aproximado y depende de la voz del navegador.</p>
          <p>Tu cámara permanece apagada. El navegador puede procesar el dictado mediante su servicio de voz; este piloto no guarda archivos de audio.</p>
          <a href="/claudio-pilot-attribution.txt" target="_blank" rel="noopener noreferrer">Créditos del modelo de prueba</a>
        </details>
      </>}
      {error && <div className="claudio-pilot-error" role="alert"><p>{error}</p>{modelState === "error" && <button type="button" onClick={() => { setError(""); setLoadAttempt((value) => value + 1); }}>Reintentar avatar</button>}</div>}
    </section>
  );
}
