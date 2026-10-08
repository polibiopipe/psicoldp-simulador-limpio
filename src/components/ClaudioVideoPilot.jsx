import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Opt-in visual pilot, not a conversational avatar connection.
 * A production live-avatar provider must issue short-lived sessions server-side.
 * Never pass provider API secrets in VITE_* configuration.
 */
export function ClaudioVideoPilot({ onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [conversationUrl, setConversationUrl] = useState("");

  async function startLiveCall() {
    if (!supabase) { setError("Inicia sesión para acceder a la videollamada experimental."); return; }
    setPending(true);
    setError("");
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) throw new Error("Debes iniciar sesión nuevamente.");
      const response = await fetch("/api/claudio-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ caseId: "claudio" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo conectar el avatar.");
      const address = new URL(payload.conversationUrl);
      if (address.protocol !== "https:") throw new Error("Dirección de videollamada no segura.");
      setConversationUrl(address.href);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCamera(false);
      setMicrophone(false);
    } catch (err) { setError(err.message || "No se pudo iniciar la videollamada."); }
    finally { setPending(false); }
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  async function toggleCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamera(false);
      setMicrophone(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no permite acceder a la cámara en este contexto.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera(true);
    } catch {
      setError("No se pudo activar la cámara. Comprueba los permisos del navegador.");
    } finally {
      setPending(false);
    }
  }

  async function toggleMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Micrófono no disponible.");
      return;
    }
    if (microphone) {
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.stop();
        streamRef.current.removeTrack(track);
      });
      setMicrophone(false);
      return;
    }
    setPending(true);
    try {
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = audio.getAudioTracks()[0];
      if (streamRef.current) streamRef.current.addTrack(track);
      else streamRef.current = audio;
      setMicrophone(true);
    } catch {
      setError("El navegador no concedió acceso al micrófono.");
    } finally {
      setPending(false);
    }
  }

  function finish() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Piloto de videollamada de Claudio" style={{ position:"fixed", inset:0, zIndex:9999, background:"#07151bed", display:"grid", placeItems:"center", padding:16 }}>
      <section style={{ width:"min(960px, 100%)", background:"#10232c", borderRadius:20, color:"#fff", padding:22, boxShadow:"0 20px 80px #0008" }}>
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:16 }}>
          <div><strong style={{ fontSize:20 }}>Claudio · ensayo audiovisual</strong><p style={{ color:"#b7cbd1", margin:"6px 0 0" }}>Caso ficticio · piloto sin transmisión del paciente</p></div>
          <button type="button" onClick={finish} style={{ background:"#d74b51", color:"white", border:0, borderRadius:12, padding:"10px 16px" }}>Salir</button>
        </header>
        <div style={{ position:"relative", background:"#182e37", borderRadius:16, overflow:"hidden", minHeight:360, display:"grid", placeItems:"center" }}>
          {conversationUrl ? (
            <iframe src={conversationUrl} title="Videollamada interactiva con Claudio" allow="camera; microphone; autoplay; fullscreen" referrerPolicy="no-referrer" style={{ border:0, width:"100%", height:520 }} />
          ) : <img src="/avatar/claudio.png" alt="Retrato ficticio de Claudio, todavía sin animación en tiempo real" style={{ width:"100%", height:440, objectFit:"contain" }} />}
          {!conversationUrl && <span style={{ position:"absolute", top:14, left:14, background:"#09151bc9", borderRadius:8, padding:"8px 12px" }}>Vista previa estática · inicia la sesión para conectar</span>}
          {!conversationUrl && <div style={{ position:"absolute", bottom:12, right:12, width:190, height:135, background:"#07151b", border:"1px solid #6d8b94", borderRadius:12, overflow:"hidden", display:"grid", placeItems:"center" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width:"100%", height:"100%", objectFit:"cover", display:camera?"block":"none", transform:"scaleX(-1)" }} />
            {!camera && <span style={{ color:"#c1d0d5" }}>Tu cámara apagada</span>}
          </div>}
        </div>
        <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:12, paddingTop:18 }}>
          {!conversationUrl && <button type="button" disabled={pending} onClick={toggleCamera} aria-pressed={camera} style={{ padding:"12px 18px", borderRadius:12 }}>{camera ? <VideoOff aria-hidden="true" /> : <Video aria-hidden="true" />} {camera ? "Apagar cámara":"Probar cámara"}</button>}
          {!conversationUrl && <button type="button" disabled={pending} onClick={toggleMicrophone} aria-pressed={microphone} style={{ padding:"12px 18px", borderRadius:12 }}>{microphone ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />} {microphone ? "Apagar micrófono":"Probar micrófono"}</button>}
          {!conversationUrl && <button type="button" disabled={pending} onClick={startLiveCall} style={{ padding:"12px 18px", borderRadius:12, background:"#317868", color:"#fff" }}>Iniciar avatar en vivo</button>}
          <button type="button" onClick={finish} style={{ padding:"12px 18px", borderRadius:12, background:"#c84046", color:"#fff" }}><PhoneOff aria-hidden="true" /> Terminar</button>
        </div>
        {error && <p role="alert" style={{ color:"#ffc4c4" }}>{error}</p>}
        <p style={{ fontSize:13, color:"#bdcdd1", marginBottom:0 }}>El avatar en vivo utiliza un proveedor externo solo cuando pulsas Iniciar. Debes contar con autorización y aceptar la transmisión audiovisual al proveedor. El piloto todavía no conserva la memoria ni la evaluación automática de Escucha Viva; la simulación clínica habitual se mantiene por separado.</p>
      </section>
    </div>
  );
}
