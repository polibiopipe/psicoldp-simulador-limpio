import React, { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, Play, RotateCcw, Volume2, VolumeX, Square, Plug } from "lucide-react";
import { BrowserAvatarVoice, preferredSpanishVoice } from "../engine/browserAvatarVoice.js";
import { ClaudioVideoPlayer, CLAUDIO_LOCAL_ORIGIN } from "../engine/claudioVideoPlayer.js";
import "./claudio-pilot.css";

const LABELS = { idle: "Listo para conversar", listening: "Te escucho", thinking: "Preparando respuesta", speaking: "Claudio está hablando", closed: "Sesión finalizada", generating: "Preparando voz y movimiento", playing: "Claudio está hablando", sample: "Muestra animada", ready: "Vídeo listo para reproducir" };
export default function ClaudioTalkingAvatar({ caseItem, history, avatarState, disabled, onVoiceIntervention, onFinish }) {
  const voiceRef = useRef(null), playerRef = useRef(null), videoRef = useRef(null), pairWindowRef = useRef(null);
  const propsRef = useRef({ onVoiceIntervention, disabled });
  propsRef.current = { onVoiceIntervention, disabled };
  const [started, setStarted] = useState(false), [localConnected, setLocalConnected] = useState(false), [connecting, setConnecting] = useState(false);
  const [voiceState, setVoiceState] = useState("idle"), [mediaState, setMediaState] = useState("idle"), [error, setError] = useState(""), [interim, setInterim] = useState("");
  const [voices, setVoices] = useState([]), [voiceURI, setVoiceURI] = useState(""), [muted, setMuted] = useState(false);
  const previousAnswerRef = useRef(history.at(-1)?.id);
  const lastAnswer = history.at(-1)?.answer || caseItem.openingLine;
  const currentVoice = voices.find((voice) => voice.voiceURI === voiceURI) || preferredSpanishVoice(voices);
  const voiceConfigRef = useRef({ currentVoice, muted, localConnected });
  voiceConfigRef.current = { currentVoice, muted, localConnected };

  useEffect(() => {
    let mounted = true, pairing = false;
    const voice = new BrowserAvatarVoice({ onState: setVoiceState, onError: setError, onInterim: setInterim,
      onTranscript: (text) => { if (!propsRef.current.disabled) propsRef.current.onVoiceIntervention(text); } });
    const player = new ClaudioVideoPlayer({ getVideo: () => videoRef.current, onState: setMediaState, onError: setError });
    voiceRef.current = voice; playerRef.current = player;
    const refreshVoices = () => setVoices(window.speechSynthesis?.getVoices().filter((item) => /^es(?:-|$)/i.test(item.lang)) || []);
    refreshVoices(); window.speechSynthesis?.addEventListener("voiceschanged", refreshVoices);
    const hide = () => { if (document.hidden) { voice.stop(); player.stop(); } };
    const pair = async (event) => {
      if (event.origin !== CLAUDIO_LOCAL_ORIGIN || !pairWindowRef.current || event.source !== pairWindowRef.current
        || event.data?.type !== "claudio-local-pair" || typeof event.data.token !== "string" || pairing) return;
      pairing = true; setConnecting(true); setError(""); voice.stop(); player.disconnect();
      try {
        await player.connect(event.data.token);
        if (mounted) { setLocalConnected(true); pairWindowRef.current = null; }
      } catch { if (mounted) { setLocalConnected(false); setError("No se pudo conectar. Mantén abierto el motor y permite la conexión local si el navegador la solicita."); } }
      finally { pairing = false; if (mounted) setConnecting(false); }
    };
    document.addEventListener("visibilitychange", hide); window.addEventListener?.("message", pair);
    return () => {
      mounted = false; voice.dispose(); player.dispose(); voiceRef.current = null; playerRef.current = null; pairWindowRef.current = null;
      window.speechSynthesis?.removeEventListener("voiceschanged", refreshVoices);
      window.removeEventListener?.("message", pair); document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  function stopAll() { voiceRef.current?.stop(); playerRef.current?.stop(); }
  function speakAnswer(text) {
    stopAll();
    if (voiceConfigRef.current.muted) return;
    if (voiceConfigRef.current.localConnected) playerRef.current?.render(text);
    else voiceRef.current?.speak(text, voiceConfigRef.current.currentVoice);
  }
  useEffect(() => { if (avatarState === "thinking" || avatarState === "closed" || disabled) stopAll(); }, [avatarState, disabled]);
  useEffect(() => {
    const latest = history.at(-1);
    if (!latest || latest.id === previousAnswerRef.current || disabled || avatarState === "thinking") return;
    previousAnswerRef.current = latest.id;
    if (!started || avatarState === "closed") return;
    setError(""); speakAnswer(latest.answer);
  }, [history, started, disabled, avatarState]);

  function start() { setError(""); previousAnswerRef.current = history.at(-1)?.id; setStarted(true); speakAnswer(lastAnswer); }
  function toggleMicrophone() {
    setError("");
    if (voiceState === "listening") voiceRef.current?.finishListening();
    else { playerRef.current?.stop(); voiceRef.current?.listen(); }
  }
  function connectLocal() {
    stopAll(); setError("");
    pairWindowRef.current = window.open(`${CLAUDIO_LOCAL_ORIGIN}/pair?origin=${encodeURIComponent(window.location.origin)}`, "claudio-local-pair", "width=600,height=500");
    if (!pairWindowRef.current) setError("Permite la ventana de conexión y vuelve a pulsar Conectar motor local.");
  }
  const status = avatarState === "thinking" || avatarState === "closed" ? avatarState : mediaState !== "idle" ? mediaState : voiceState;
  const showVideo = ["playing", "sample", "ready"].includes(mediaState), busyMedia = mediaState !== "idle";

  return <section className="claudio-pilot" aria-label="Piloto de conversación con Claudio">
    <header className="claudio-pilot-header"><span>Conversación con Claudio</span><span role="status">{LABELS[status] || "Listo para probar"}</span></header>
    <div className="claudio-pilot-stage">
      <img className="claudio-pilot-portrait" src={caseItem.image} alt="Claudio, el paciente de esta sesión" />
      <video ref={videoRef} className={`claudio-pilot-video${showVideo ? " is-visible" : ""}`} playsInline preload="none" poster={caseItem.image} aria-hidden={!showVideo}
        aria-label={mediaState === "sample" ? "Muestra grabada del avatar de Claudio" : "Respuesta animada de Claudio"}
        onEnded={() => playerRef.current?.stop()} onError={() => { if (showVideo) { playerRef.current?.stop(); setError("No se pudo reproducir el vídeo. Puedes continuar en el chat."); } }}>
        {mediaState === "sample" && <track kind="captions" srcLang="es" label="Español" src="/pilots/claudio/presentation.vtt" default />}
      </video>
      {!started && !busyMedia && <div className="claudio-pilot-start"><button type="button" onClick={start} disabled={disabled}><Play aria-hidden="true" /> Activar conversación por voz</button></div>}
      <div className="claudio-pilot-caption"><strong>Claudio</strong><span>{caseItem.age} · Paciente ficticio</span></div>
      {mediaState === "generating" && <div className="claudio-pilot-generating" role="status">Preparando el vídeo. Puedes seguir leyendo o interrumpir.</div>}
    </div>
    <div className="claudio-pilot-demo">
      <button type="button" disabled={disabled} onClick={() => { stopAll(); setError(""); playerRef.current?.sample(); }}><Play aria-hidden="true" /> Ver muestra animada</button>
      {busyMedia && <button type="button" onClick={() => playerRef.current?.stop()}><Square aria-hidden="true" /> Detener vídeo</button>}
      {mediaState === "ready" && <button type="button" onClick={() => { setError(""); playerRef.current?.play(videoRef.current.src); }}><Play aria-hidden="true" /> Reproducir vídeo</button>}
      <p>La muestra reproduce una presentación grabada. {localConnected ? "Las respuestas usan voz y animación local." : "Conecta el motor local para animar las respuestas del chat."}</p>
    </div>
    {started && <>
      <div className="claudio-pilot-controls">
        <button type="button" onClick={toggleMicrophone} disabled={disabled} aria-pressed={voiceState === "listening"}><Mic aria-hidden="true" />{voiceState === "listening" ? "Terminar intervención" : voiceState === "speaking" || busyMedia ? "Interrumpir y hablar" : "Hablar"}</button>
        <button type="button" onClick={() => { stopAll(); setMuted(value => !value); }} aria-pressed={muted}>{muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}{muted ? "Activar voz" : "Silenciar"}</button>
        <button type="button" disabled={disabled || muted || !lastAnswer || voiceState === "listening"} onClick={() => { setError(""); speakAnswer(lastAnswer); }}><RotateCcw aria-hidden="true" /> Repetir respuesta</button>
        <button className="claudio-pilot-finish" type="button" disabled={disabled} onClick={() => { stopAll(); onFinish(); }}><PhoneOff aria-hidden="true" /> Ir al cierre</button>
      </div>
      <p className="claudio-pilot-hint">Pulsa Hablar. Al terminar, tu intervención se enviará al chat. Voz de las respuestas: {localConnected ? "neuronal, con vídeo local" : "del navegador"}.</p>
      {interim && <p className="claudio-pilot-transcript" aria-live="polite">{interim}</p>}
    </>}
    <details className="claudio-pilot-settings"><summary>Animación y voz</summary>
      <p>Para animar cada respuesta en este computador, descarga y descomprime el motor. Abre <strong>Iniciar-Claudio.cmd</strong> y espera a que indique «Listo». Requiere Python 3.12; la primera preparación descarga los modelos.</p>
      <a href="/pilots/claudio/Claudio-motor-local.zip" download>Descargar motor local para Windows</a>
      <div className="claudio-pilot-controls">{localConnected
        ? <button type="button" onClick={() => { stopAll(); playerRef.current?.disconnect(); setLocalConnected(false); }}><Plug aria-hidden="true" /> Desconectar motor local</button>
        : <button type="button" onClick={connectLocal} disabled={disabled || connecting}><Plug aria-hidden="true" />{connecting ? "Conectando…" : "Conectar motor local"}</button>}</div>
      <p>En la ventana que se abre, pulsa «Conectar con el piloto». El vídeo puede tardar según la respuesta y el equipo. El navegador puede pedir permiso para acceder a este computador.</p>
      {!localConnected && <label>Voz del navegador<select value={voiceURI} onChange={event => { stopAll(); setVoiceURI(event.target.value); }}>
        <option value="">Selección automática</option>{voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}
      </select></label>}
      <p>Tu cámara permanece apagada. El dictado puede usar el servicio de voz del navegador. El motor genera archivos temporales y los elimina al entregar el vídeo. Uso académico o personal no comercial.</p>
    </details>
    {error && <div className="claudio-pilot-error" role="alert"><p>{error}</p></div>}
  </section>;
}
