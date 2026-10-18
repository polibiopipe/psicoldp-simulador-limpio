import React, { useState, useRef } from 'react';
import { createDecisionEvidence, stages } from '../engine/decisionEvidence.js';
import './decisionEvidence.css';
const blank = { stage: 'initial', decision: '', rationale: '', uncertainty: '', alternative: '', trigger: '', assistance: 'none_declared' };
export function DecisionEvidence({ events = [], history, onSave, disabled }) {
  const pendingRef = useRef(null);
  const [draft, setDraft] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const signature = JSON.stringify(draft);
      const evidence = pendingRef.current?.signature === signature ? pendingRef.current.evidence : createDecisionEvidence(draft, { history });
      pendingRef.current = { signature, evidence };
      await onSave(evidence);
      pendingRef.current = null;
      setDraft({ ...blank, stage: 'monitoring' }); setMessage('Registro guardado y confirmado.');
    } catch (error) { setMessage(error.message || 'No se confirmó el registro. Conserva tu texto y reintenta.'); }
    finally { setBusy(false); }
  }
  return <details className="decision-evidence"><summary>Bitácora de decisiones · {events.length} registros</summary>
    <p>Registra tu razonamiento antes de consultar retroalimentación. Las preguntas de esta bitácora orientan la reflexión; no constituyen una medición validada.</p>
    <form onSubmit={save}><fieldset disabled={disabled || busy}><legend>Nuevo registro</legend>
      <label>Momento<select value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value })}>{Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {[['decision', '¿Qué decides o mantienes en este momento?', true], ['rationale', '¿En qué antecedentes fundamentas tu decisión?', true], ['uncertainty', '¿Qué dudas, contradicciones o datos faltantes identificas?'], ['alternative', '¿Qué otra interpretación o acción consideras?'], ['trigger', '¿Qué información motivó mantener o revisar tu decisión?']].map(([key, label, required]) => <label key={key}>{label}<textarea required={required} maxLength={6000} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <label>Ayuda antes de responder<select value={draft.assistance} onChange={e => setDraft({ ...draft, assistance: e.target.value })}><option value="none_declared">No declaro ayuda adicional</option><option value="received">Consulté orientación o retroalimentación</option></select></label>
      <button type="submit" className="primary-action">{busy ? 'Guardando…' : 'Guardar registro'}</button>
    </fieldset></form><p role="status">{message}</p>
    <ol>{events.map(event => <li key={event.id}><strong>{stages[event.stage]}</strong> · {event.turnCount} intercambios previos<p>{event.decision}</p><p>Fundamento: {event.rationale}</p></li>)}</ol>
  </details>;
}
