import React, { useEffect, useId, useRef, useState } from "react";
import { mediationPracticeText, validateMediationResult } from "../engine/feedbackMediation.js";
import { downloadTextFile } from "../data/researchConsent.js";

export function FeedbackMediation({ actions, authSession, sessionRecordId, initialPractice, onDraftChange, onSavePractice }) {
  const usableActions = actions.filter(action => action.patientAnswer);
  const first = usableActions.find(action => action.evidenceStatus === "review") || usableActions[0];
  const initial = usableActions.find(action => action.index === initialPractice?.turnIndex && action.quote === initialPractice?.quote);
  const [practice, setPractice] = useState(() => initial ? initialPractice : { turnIndex: first?.index, quote: first?.quote, reflection: "", rewrite: "", result: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const mounted = useRef(false);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const action = usableActions.find(item => item.index === practice.turnIndex) || first;
  if (!action) return null;
  const canRequest = Boolean(authSession?.access_token && sessionRecordId && onSavePractice);
  const result = practice.result && validateMediationResult(practice.result, action);

  function update(next) {
    setPractice(next);
    setError("");
    onDraftChange?.(next);
  }
  async function ask(event) {
    event.preventDefault();
    if (request.current || !canRequest || !practice.reflection.trim() || !practice.rewrite.trim()) return;
    const controller = new AbortController();
    request.current = controller; setBusy(true); setError("");
    let timeout;
    try {
      const saved = await onSavePractice();
      if (!mounted.current) return;
      if (!saved?.cloudSaved) throw new Error("No se confirmó el guardado. Conserva esta pantalla y vuelve a intentarlo.");
      timeout = setTimeout(() => controller.abort(), 25000);
      const response = await fetch("/api/feedback-mediation", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ sessionRecordId, turnIndex: action.index, reflection: practice.reflection, rewrite: practice.rewrite })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "La mediación no está disponible. Tu ejercicio se conserva.");
      if (!validateMediationResult(data, action)) throw new Error("No pudimos vincular la devolución con este intercambio. Reintenta o revísalo con tu docente.");
      if (mounted.current) update({ ...practice, result: data });
    } catch (failure) {
      if (mounted.current) setError(failure.name === "AbortError" ? "La revisión tardó más de lo esperado. Tu ejercicio se conserva; puedes reintentar." : failure.message);
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
      if (mounted.current) setBusy(false);
    }
  }
  return <section className="feedback-block feedback-mediation" aria-labelledby={`${id}-title`}>
    <span className="eyebrow">Reflexión y segundo intento</span>
    <h2 id={`${id}-title`}>Revisa una decisión con la IA</h2>
    <p>Elige un momento, explica qué buscabas y prueba otra forma de intervenir. Puedes cuestionar la devolución y llevar tu lectura a supervisión.</p>
    <form onSubmit={ask}>
      <fieldset disabled={busy}>
        <legend className="sr-only">Tu ejercicio de reflexión</legend>
        <label htmlFor={`${id}-turn`}>Momento de la entrevista</label>
        <select id={`${id}-turn`} value={action.index} onChange={event => {
          const selected = usableActions.find(item => item.index === Number(event.target.value));
          const { otherTurns = {}, ...current } = practice;
          const stored = otherTurns[selected.index];
          const next = stored?.quote === selected.quote ? stored : { turnIndex: selected.index, quote: selected.quote, reflection: "", rewrite: "", result: null };
          update({ ...next, otherTurns: { ...otherTurns, [action.index]: current } });
        }}>{usableActions.map(item => <option key={item.index} value={item.index}>Turno {item.index}: {item.quote.slice(0, 90)}</option>)}</select>
        <div className="mediation-exchange">
          {action.previousPatientResponse && <p><strong>Paciente antes:</strong> {action.previousPatientResponse}</p>}
          <p><strong>Tu intervención:</strong> {action.quote}</p>
          <p><strong>Respuesta registrada:</strong> {action.patientAnswer}</p>
        </div>
        <label htmlFor={`${id}-reflection`}>¿Qué buscabas y cómo interpretas la respuesta?</label>
        <p id={`${id}-reflection-help`}>También puedes explicar con qué observación del informe no estás de acuerdo y por qué.</p>
        <textarea id={`${id}-reflection`} required maxLength={1600} rows={3} aria-describedby={`${id}-reflection-help`} value={practice.reflection}
          onChange={event => update({ ...practice, reflection: event.target.value, result: null })} />
        <label htmlFor={`${id}-rewrite`}>¿Cómo intervendrías en un segundo intento?</label>
        <textarea id={`${id}-rewrite`} required maxLength={1600} rows={3} value={practice.rewrite}
          onChange={event => update({ ...practice, rewrite: event.target.value, result: null })} />
        <p>Este ensayo no se envía al paciente ni cambia la entrevista. Se guarda junto con tu cierre.</p>
        {canRequest ? <>
          <p className="mediation-scope">Al solicitar la revisión, se envían a la IA la conversación guardada, tu reflexión y tu ensayo para ayudarte a analizarlos. Su lectura es revisable y no asigna una nota.</p>
          <button className="primary-action" type="submit" disabled={busy || !practice.reflection.trim() || !practice.rewrite.trim()}>{busy ? "Revisando tu intercambio…" : "Guardar y revisar con IA"}</button>
        </> : <p>La mediación de IA requiere una sesión iniciada en tu cuenta. Puedes preparar y descargar este ejercicio para revisarlo con tu docente.</p>}
      </fieldset>
    </form>
    {busy && <p role="status">La revisión está en curso. Puedes seguir consultando tu informe.</p>}
    {error && <p role="alert" className="consent-error">{error}</p>}
    {result && <div className="mediation-result" aria-live="polite">
      <h3>Una lectura para contrastar</h3>
      <p><strong>Lo que aparece en el intercambio:</strong> {result.observation}</p>
      <p><strong>Interpretación posible:</strong> {result.interpretation}</p>
      <p><strong>Otra lectura a considerar:</strong> {result.alternativeReading}</p>
      <p><strong>Sobre tu reflexión:</strong> {result.reflectionResponse}</p>
      <p><strong>Sobre tu segundo intento:</strong> {result.rewriteFeedback}</p>
      <p><strong>Para seguir pensando:</strong> {result.nextQuestion}</p>
      <p><strong>En la próxima práctica:</strong> {result.nextPractice}</p>
      <p><strong>Lo que falta contrastar:</strong> {result.limitations}</p>
      <p><strong>Criterio:</strong> {result.criterion}</p>
      <p><strong>Fundamento:</strong> {result.sources.map((source, index) => <React.Fragment key={source.id}>{index > 0 && "; "}<a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></React.Fragment>)}</p>
      <p>Puedes ajustar tu reflexión o tu ensayo para solicitar otra revisión.</p>
    </div>}
    <button className="secondary-action" type="button" disabled={busy || (!practice.reflection.trim() && !practice.rewrite.trim())}
      onClick={() => downloadTextFile("escucha-viva-segundo-intento.txt", mediationPracticeText({ action, ...practice, result }))}>Descargar mi ejercicio</button>
  </section>;
}
