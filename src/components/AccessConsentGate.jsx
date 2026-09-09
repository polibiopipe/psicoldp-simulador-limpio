import React, { useEffect, useRef, useState } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { loadAccessConsent } from "../engine/accessConsent.js";
import { accessDocumentText } from "../engine/accessConsentPolicy.js";
import { downloadTextFile, PRIVACY_CONTACT } from "../data/researchConsent.js";

function AccessDocument({ document }) {
  return <div className="access-consent-document">{document.information.sections.map(({ title, text }) =>
    <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
    <p><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Condiciones de Google Gemini</a> · <a href={`mailto:${PRIVACY_CONTACT}`}>Contacto de privacidad</a></p>
  </div>;
}

export function AccessConsentGate({ access, email, onSignOut, onOpenTrust }) {
  const [checked, setChecked] = useState({ adult: false, educationalUse: false, dataProcessing: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const writing = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function submit(event) {
    event.preventDefault();
    if (writing.current || !Object.values(checked).every(Boolean) || !access.document) return;
    writing.current = true; setBusy(true); setError("");
    try { await access.accept(checked); }
    catch (failure) { if (mounted.current) setError(failure.message); }
    finally { writing.current = false; if (mounted.current) setBusy(false); }
  }
  async function decline() {
    if (writing.current) return;
    writing.current = true; setBusy(true); setError("");
    try {
      const signedOut = await onSignOut();
      if (signedOut === false && mounted.current) setError("No pudimos cerrar la sesión. Revisa la conexión y vuelve a intentarlo.");
    } catch { if (mounted.current) setError("No pudimos cerrar la sesión. Revisa la conexión y vuelve a intentarlo."); }
    finally { writing.current = false; if (mounted.current) setBusy(false); }
  }
  return <main className="app-shell access-consent-shell">
    <section className="access-consent-card" aria-labelledby="access-consent-title">
      <header><FileCheck2 aria-hidden="true" /><span className="eyebrow">Escucha Viva · Antes de ingresar</span>
        <h1 id="access-consent-title">Aceptación de uso y privacidad</h1>
        <p>Para entrar al simulador, revisa estas condiciones y confirma tu aceptación. Se guardará en tu cuenta.</p>
        <p className="consent-small access-consent-account">{email}</p></header>
      {access.status === "loading" && <p role="status">Verificando las condiciones y tu aceptación…</p>}
      {(access.error || error) && <p role="alert" className="consent-error">{access.error || error}</p>}
      {access.document && <>
        <p className="consent-small">Versión {access.document.version}</p>
        <AccessDocument document={access.document} />
        <button type="button" className="secondary-action" disabled={busy} onClick={() => downloadTextFile(`escucha-viva-condiciones-${access.document.version}.txt`, accessDocumentText(access.document))}><Download aria-hidden="true" />Descargar condiciones</button>
        <form onSubmit={submit} className="access-consent-form">
          <fieldset disabled={busy}><legend>Confirma tu decisión</legend>
            {Object.entries(access.document.information.declarations).map(([key, label]) => <label className="consent-checkbox" key={key}>
              <input type="checkbox" required checked={checked[key] || false} onChange={(event) => setChecked((current) => ({ ...current, [key]: event.target.checked }))} />
              <span>{label}</span></label>)}
          </fieldset>
          <p>Esta aceptación permite el uso educativo. Participar en una investigación requiere otro consentimiento voluntario.</p>
          <button type="submit" className="primary-action" disabled={busy || !Object.values(checked).every(Boolean)}>{busy ? "Guardando aceptación…" : "Aceptar e ingresar al simulador"}</button>
        </form>
      </>}
      <div className="consent-actions access-consent-exit">
        {(access.error || error) && <button className="secondary-action" type="button" disabled={busy} onClick={access.reload}>Actualizar condiciones</button>}
        <button className="secondary-action" type="button" disabled={busy} onClick={() => void decline()}>No acepto · Cerrar sesión</button>
        <button className="text-button" type="button" disabled={busy} onClick={onOpenTrust}>Privacidad y consentimiento de investigación</button>
      </div>
    </section>
  </main>;
}

export function AccessConsentSummary({ userId }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setState(null); setError("");
    loadAccessConsent(userId).then((result) => { if (!cancelled) setState(result); }).catch((failure) => { if (!cancelled) setError(failure.message); });
    return () => { cancelled = true; };
  }, [userId]);
  return <section className="access-consent-summary"><h2>Condiciones para ingresar</h2>
    <p>El uso educativo requiere aceptar las condiciones de uso y privacidad. La participación en investigaciones se decide por separado.</p>
    {error && <p role="alert">{error}</p>}
    {state && <>
      <p>{state.receipt ? `Aceptaste la versión ${state.document.version} el ${new Date(state.receipt.created_at).toLocaleString("es-CL")}.` : `Condiciones vigentes: versión ${state.document.version}. La aceptación se solicita al ingresar con tu cuenta.`}</p>
      <details><summary>Leer las condiciones de uso y privacidad</summary><AccessDocument document={state.document} /></details>
      <button className="secondary-action" type="button" onClick={() => downloadTextFile(`escucha-viva-aceptacion-${state.document.version}.txt`, accessDocumentText(state.receipt?.document_snapshot || state.document, state.receipt))}><Download aria-hidden="true" />{state.receipt ? "Descargar mi aceptación de ingreso" : "Descargar condiciones de ingreso"}</button>
    </>}
  </section>;
}
