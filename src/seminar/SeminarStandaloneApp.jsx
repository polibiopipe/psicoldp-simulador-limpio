import React, { useEffect, useRef, useState } from "react";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { isAuthorizedSeminarEmail } from "./seminarAccess.js";
import seminarDocument from "./rutaSeminarioEnhancedDocument.js";
import { CollaborativeSeminarShell } from "./CollaborativeSeminarShell.jsx";

export function SeminarStandaloneApp() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus("configuration");
      return undefined;
    }
    let active = true;
    async function applySession(nextSession) {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession?.user) {
        setStatus("signed_out");
        return;
      }
      if (!isAuthorizedSeminarEmail(nextSession.user.email)) {
        setStatus("denied");
        return;
      }
      setStatus("checking");
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("id,approved")
        .eq("id", nextSession.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setMessage("No pudimos comprobar el acceso. Revisa la conexión e inténtalo nuevamente.");
        setStatus("error");
        return;
      }
      setStatus(profile?.approved === true ? "approved" : "pending");
    }
    supabase.auth.getSession().then(({ data }) => void applySession(data?.session || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      globalThis.setTimeout(() => void applySession(nextSession), 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function receiveCoachRequest(event) {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== "seminar-coach-request") return;
      const requestId = event.data.requestId;
      try {
        const response = await fetch("/api/seminar-writing-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
          body: JSON.stringify(event.data.payload || {})
        });
        const data = await response.json().catch(() => null);
        frameRef.current?.contentWindow?.postMessage({ type: "seminar-coach-response", requestId, ok: response.ok, data }, "*");
      } catch {
        frameRef.current?.contentWindow?.postMessage({ type: "seminar-coach-response", requestId, ok: false, data: { message: "No pudimos conectar con la mediación. El texto se conserva." } }, "*");
      }
    }
    globalThis.addEventListener("message", receiveCoachRequest);
    return () => globalThis.removeEventListener("message", receiveCoachRequest);
  }, [session?.access_token]);

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setStatus("signed_out");
  }

  if (status === "approved") {
    return <CollaborativeSeminarShell key={session.user.id} session={session} onSignOut={signOut} frameRef={frameRef} seminarDocument={seminarDocument} />;
  }
  if (["loading", "checking"].includes(status)) {
    return <AccessState title="Verificando acceso" text="Estamos comprobando tu sesión y autorización." />;
  }
  if (status === "signed_out") return <SeminarLogin />;
  if (status === "denied") {
    return <AccessState title="Acceso no autorizado" text="Esta Ruta de Seminario está habilitada únicamente para los tres integrantes registrados." action={signOut} />;
  }
  if (status === "pending") {
    return <AccessState title="Cuenta pendiente de aprobación" text="El correo pertenece al equipo, pero su perfil todavía no está aprobado en el acceso común." action={signOut} />;
  }
  return <AccessState title="No fue posible ingresar" text={message || "La configuración de acceso no está disponible."} action={session ? signOut : undefined} />;
}

function SeminarLogin() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      if (!isAuthorizedSeminarEmail(email)) throw new Error("Este correo no está habilitado para la Ruta de Seminario.");
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: globalThis.location.origin + "/ruta-seminario"
        });
        if (resetError) throw resetError;
        setNotice("Si la cuenta está registrada, recibirás un correo para recuperar la contraseña.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (submitError) {
      setError(submitError?.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : submitError?.message || "No fue posible iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="seminar-auth-page">
      <section className="seminar-auth-intro">
        <div className="seminar-cinema-glow" aria-hidden="true" />
        <div className="seminar-cinema-grid" aria-hidden="true" />
        <div className="seminar-cinema-orbit" aria-hidden="true"><i/><i/><i/><span>01</span><span>13</span><span>26</span></div>
        <div className="seminar-cinema-beam" aria-hidden="true" />
        <div className="seminar-auth-brand"><div className="seminar-auth-mark">Ψ</div><div><strong>PsicoLDP</strong><span>Conocimiento en construcción</span></div></div>
        <div className="seminar-auth-story">
          <span className="seminar-auth-kicker">Simulador formativo · Investigación aplicada</span>
          <h1>Ruta de<br/><em>Seminario</em></h1>
          <p>Del primer acuerdo del equipo al expediente final: una experiencia para comprender, ejecutar y dejar evidencia de cada decisión.</p>
          <div className="seminar-auth-metrics">
            <div><strong>26</strong><span>hitos conectados</span></div>
            <div><strong>04</strong><span>unidades de trabajo</span></div>
            <div><strong>01</strong><span>proceso trazable</span></div>
          </div>
        </div>
        <div className="seminar-auth-foot">
          <div className="seminar-auth-security"><ShieldCheck aria-hidden="true" /> Acceso privado del equipo</div>
          <span>AGO 2026 — ENE 2027</span>
        </div>
      </section>
      <section className="seminar-auth-card">
        <div className="seminar-card-aura" aria-hidden="true" />
        <div className="seminar-card-number">01</div>
        <span className="eyebrow">Acceso reservado</span>
        <h2>{mode === "reset" ? "Recuperar contraseña" : "Volver al proceso"}</h2>
        <p>{mode === "reset" ? "Te enviaremos las instrucciones al correo registrado." : "Ingresa con las mismas credenciales de los simuladores formativos."}</p>
        <form onSubmit={submit}>
          <label>Correo<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode === "login" && <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          {error && <p className="seminar-auth-error">{error}</p>}
          {notice && <p className="seminar-auth-notice">{notice}</p>}
          <button className="seminar-auth-submit" type="submit" disabled={busy}>{mode === "reset" ? <Mail aria-hidden="true" /> : <LogIn aria-hidden="true" />}{busy ? "Procesando…" : mode === "reset" ? "Enviar recuperación" : "Ingresar"}</button>
        </form>
        <button className="seminar-auth-reset" type="button" onClick={() => setMode(mode === "reset" ? "login" : "reset")}><KeyRound aria-hidden="true" />{mode === "reset" ? "Volver al ingreso" : "Olvidé mi contraseña"}</button>
        <div className="seminar-card-note"><span>Ψ</span><p>Este espacio conserva el recorrido académico del equipo. El acceso está limitado a sus tres integrantes.</p></div>
      </section>
      <div className="seminar-scene-caption" aria-hidden="true"><span>INVESTIGAR</span><i/><span>DOCUMENTAR</span><i/><span>COMPRENDER</span></div>
    </main>
  );
}

function AccessState({ title, text, action }) {
  return <main className="seminar-state-page"><ShieldCheck aria-hidden="true" /><h1>{title}</h1><p>{text}</p>{action && <button type="button" onClick={action}>Cerrar sesión</button>}</main>;
}
