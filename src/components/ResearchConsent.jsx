import React, { useEffect, useRef, useState } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { CONSENT_SECTIONS, consentDocumentText, downloadTextFile } from "../data/researchConsent.js";
import { loadResearchConsent, recordResearchDecision } from "../engine/researchConsent.js";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";

function StudyDocument({ document }) {
  const info = document.information || {};
  return <div className="consent-document">
    <h3>{document.title}</h3>
    <p>Versión {document.version}</p>
    {CONSENT_SECTIONS.map(([key, label]) => <section key={key}><h4>{label}</h4><p>{info[key]}</p></section>)}
    <section><h4>Alcance de tu autorización</h4><ul>{(info.scope || []).map((point) => <li key={point}>{point}</li>)}</ul></section>
    <p>Recogida de datos hasta: {formatDate(document.collection_until)}.<br />
      Conservación para el estudio hasta: {formatDate(document.retention_until)}.</p>
  </div>;
}

function formatDate(date) {
  return date ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(date)) : "";
}

export function ResearchConsent({ userId, canParticipate = true, onBusyChange }) {
  const [state, setState] = useState({ loading: true, study: null, events: [] });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState({ adult: false, participation: false, data: false, quotes: false });
  const [confirmWithdrawal, setConfirmWithdrawal] = useState(false);
  const mounted = useRef(false);
  const writing = useRef(false);
  const request = useRef(0);
  const busyCallback = useRef(onBusyChange);
  busyCallback.current = onBusyChange;

  async function refresh() {
    const current = ++request.current;
    setError("");
    setChoices({ adult: false, participation: false, data: false, quotes: false });
    setState((old) => ({ ...old, loading: true }));
    try {
      const result = await loadResearchConsent(userId);
      if (mounted.current && request.current === current) setState({ ...result, loading: false });
    } catch (failure) {
      if (mounted.current && request.current === current) {
        setError(failure.message);
        setState((old) => ({ ...old, loading: false }));
      }
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (isSupabaseConfigured) void refresh();
    else setState({ loading: false, study: null, events: [] });
    return () => { mounted.current = false; ++request.current; busyCallback.current?.(false); };
  }, [userId]);

  const latest = state.events[0];
  const enrolled = latest?.action === "accepted";
  const sameVersion = latest?.study_id === state.study?.id;
  const document = state.study || latest?.document_snapshot;
  const canAccept = Boolean(userId && canParticipate && state.study && !(enrolled && sameVersion));
  const disabled = busy || state.loading || Boolean(error);

  async function decide(action) {
    if (writing.current || disabled || !userId) return;
    if (action === "accepted" && (!canAccept || !choices.adult || !choices.participation || !choices.data)) return;
    writing.current = true;
    setBusy(true);
    busyCallback.current?.(true);
    setMessage("");
    try {
      const event = await recordResearchDecision({ userId,
        studyId: action === "withdrawn" ? latest.study_id : state.study.id,
        previousEventId: latest?.id, action,
        adult: action === "accepted" && choices.adult,
        participation: action === "accepted" && choices.participation,
        dataProcessing: action === "accepted" && choices.data,
        quotes: action === "accepted" && choices.quotes
      });
      if (!mounted.current) return;
      setState((old) => ({ ...old, events: [event, ...old.events] }));
      setConfirmWithdrawal(false);
      setMessage(action === "accepted" ? "Tu consentimiento quedó registrado. Puedes descargar tu copia."
        : action === "withdrawn" ? "Tu retiro quedó registrado. Tus datos quedan excluidos de nuevas consultas del conjunto de investigación."
          : "Registramos que no participarás. Puedes continuar practicando.");
    } catch (failure) {
      if (mounted.current) setError(failure.message);
    } finally {
      writing.current = false;
      if (mounted.current) { setBusy(false); busyCallback.current?.(false); }
    }
  }

  return <section className="research-consent" aria-labelledby="research-consent-heading" aria-busy={busy || state.loading}>
    <h2 id="research-consent-heading">Participación en investigación</h2>
    <p>Participar es una decisión voluntaria, independiente de tu acceso al simulador. Puedes consultar la información, guardar una copia y cambiar tu decisión aquí.</p>
    {state.loading && <p role="status">Verificando el estudio y tu consentimiento…</p>}
    {error && <div role="alert" className="consent-error"><p>{error}</p><button className="secondary-action" type="button" disabled={busy || state.loading} onClick={() => void refresh()}>Actualizar estado</button></div>}
    {message && <p role="status" className="consent-success">{message}</p>}
    {!state.loading && !error && !state.study && <div className="consent-status">
      <FileCheck2 aria-hidden="true" /><div><strong>No hay una convocatoria abierta</strong>
        <p>Cuando se abra un estudio, encontrarás aquí su propósito, actividades, duración, responsables y condiciones de uso de datos. Crear una cuenta o practicar no constituye consentimiento para investigar.</p></div>
    </div>}
    {!isSupabaseConfigured && <p>El modo local no registra consentimientos de investigación.</p>}
    {userId && !canParticipate && <p>Tu acceso a la práctica está pendiente de aprobación. Puedes consultar tus decisiones anteriores y retirar un consentimiento existente.</p>}
    {!userId && state.study && <p>Inicia sesión para registrar tu decisión. Puedes leer y descargar la información antes de hacerlo.</p>}
    {latest && <div className="consent-status"><FileCheck2 aria-hidden="true" /><div>
      <strong>{enrolled ? "Consentimiento registrado" : latest.action === "withdrawn" ? "Te retiraste del estudio" : "Elegiste no participar"}</strong>
      <p>{formatDate(latest.created_at)} · Versión {latest.document_snapshot?.version}</p>
      {enrolled && !sameVersion && state.study && <p>Hay una nueva versión. Tu aceptación anterior no autoriza esta versión; puedes revisarla y decidir nuevamente.</p>}
      <button className="secondary-action" type="button" onClick={() => downloadTextFile(`escucha-viva-consentimiento-${latest.id}.txt`, consentDocumentText(latest.document_snapshot, latest))}>
        <Download aria-hidden="true" /> Descargar mi constancia
      </button>
    </div></div>}
    {document && <>
      <StudyDocument document={document} />
      <button className="secondary-action" type="button" onClick={() => downloadTextFile("escucha-viva-informacion-estudio.txt", consentDocumentText(document))}>
        <Download aria-hidden="true" /> Descargar información del estudio
      </button>
    </>}
    {canAccept && <form className="consent-form" onSubmit={(event) => { event.preventDefault(); void decide("accepted"); }}>
      <fieldset disabled={disabled}><legend>Tu decisión</legend>
        {["adult", "participation", "data", ...(state.study.information.allow_quotes ? ["quotes"] : [])].map((key) => <label className="consent-choice" key={key}>
          <input type="checkbox" checked={choices[key]} required={key !== "quotes"} onChange={(event) => setChoices((old) => ({ ...old, [key]: event.target.checked }))} />
          <span>{state.study.information.declarations[key]}</span>
        </label>)}
        <div className="consent-actions">
          <button className="primary-action" type="submit" disabled={!choices.adult || !choices.participation || !choices.data}>Aceptar y guardar consentimiento</button>
          {!enrolled && <button className="secondary-action" type="button" onClick={() => void decide("declined")}>Continuar sin participar</button>}
        </div>
      </fieldset>
    </form>}
    {enrolled && <div className="consent-withdrawal">
      {confirmWithdrawal ? <>
        <p>Se registrará tu retiro y tus registros dejarán de estar disponibles en nuevas consultas del conjunto de investigación. Tu historial de práctica seguirá en tu cuenta. Para gestionar copias ya entregadas al equipo, utiliza el contacto del estudio.</p>
        <div className="consent-actions"><button className="secondary-action" type="button" disabled={disabled} onClick={() => void decide("withdrawn")}>Confirmar mi retiro</button>
          <button className="text-action" type="button" disabled={busy} onClick={() => setConfirmWithdrawal(false)}>Cancelar</button></div>
      </> : <button className="secondary-action" type="button" disabled={disabled} onClick={() => setConfirmWithdrawal(true)}>Retirarme de la investigación</button>}
    </div>}
    {state.events.length > 1 && <details className="consent-history"><summary>Mis decisiones anteriores</summary><ul>
      {state.events.slice(1).map((event) => <li key={event.id}><button className="text-action" type="button" onClick={() => downloadTextFile(`escucha-viva-consentimiento-${event.id}.txt`, consentDocumentText(event.document_snapshot, event))}>
        {formatDate(event.created_at)} · {event.action === "accepted" ? "Aceptación" : event.action === "withdrawn" ? "Retiro" : "No participación"} · Descargar constancia
      </button></li>)}
    </ul></details>}
  </section>;
}

export function ResearchInvitation({ userId, onOpen }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!userId || !isSupabaseConfigured) return;
    loadResearchConsent(userId).then(({ study, events }) => {
      if (!cancelled) setAvailable(Boolean(study && events[0]?.study_id !== study.id));
    }).catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, [userId]);
  if (!available) return null;
  return <aside className="research-invitation"><div><strong>Invitación a participar en un estudio</strong><p>Consulta el consentimiento y decide. Tu práctica sigue disponible si no participas.</p></div>
    <button className="secondary-action" type="button" onClick={onOpen}>Revisar invitación</button></aside>;
}
