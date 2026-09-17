import React, { useEffect, useState } from "react";
import { KeyRound, LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { isAuthorizedSeminarEmail } from "./seminarAccess.js";
import seminarDocument from "./rutaSeminarioDocument.js";

export function SeminarStandaloneApp() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

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

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setStatus("signed_out");
  }

  if (status === "approved") {
    return (
      <main className="seminar-standalone-shell">
        <header className="seminar-session-bar">
          <div><strong>Ruta de Seminario</strong><span>PsicoLDP · Investigación</span></div>
          <div><span>{session?.user?.email}</span><button type="button" onClick={signOut}><LogOut aria-hidden="true" /> Cerrar sesión</button></div>
        </header>
        <iframe className="seminar-standalone-frame" srcDoc={seminarDocument} title="Ruta de Seminario · PsicoLDP" />
      </main>
    );
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
        <div className="seminar-auth-mark">Ψ</div>
        <span>PsicoLDP · Simuladores formativos</span>
        <h1>Ruta de Seminario</h1>
        <p>Un espacio privado para orientar el trabajo, documentar el proceso y conservar las evidencias del equipo.</p>
        <div className="seminar-auth-security"><ShieldCheck aria-hidden="true" /> Acceso mediante la validación común de Supabase.</div>
      </section>
      <section className="seminar-auth-card">
        <span className="eyebrow">Acceso del equipo</span>
        <h2>{mode === "reset" ? "Recuperar contraseña" : "Iniciar sesión"}</h2>
        <p>Utiliza el mismo correo y contraseña registrados en los simuladores formativos.</p>
        <form onSubmit={submit}>
          <label>Correo<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode === "login" && <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          {error && <p className="seminar-auth-error">{error}</p>}
          {notice && <p className="seminar-auth-notice">{notice}</p>}
          <button className="seminar-auth-submit" type="submit" disabled={busy}>{mode === "reset" ? <Mail aria-hidden="true" /> : <LogIn aria-hidden="true" />}{busy ? "Procesando…" : mode === "reset" ? "Enviar recuperación" : "Ingresar"}</button>
        </form>
        <button className="seminar-auth-reset" type="button" onClick={() => setMode(mode === "reset" ? "login" : "reset")}><KeyRound aria-hidden="true" />{mode === "reset" ? "Volver al ingreso" : "Olvidé mi contraseña"}</button>
      </section>
    </main>
  );
}

function AccessState({ title, text, action }) {
  return <main className="seminar-state-page"><ShieldCheck aria-hidden="true" /><h1>{title}</h1><p>{text}</p>{action && <button type="button" onClick={action}>Cerrar sesión</button>}</main>;
}
