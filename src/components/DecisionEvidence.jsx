import React, { useState, useRef } from 'react';
import { createDecisionEvidence, stages } from '../engine/decisionEvidence.js';
import './decisionEvidence.css';
const blank = { stage: 'initial', decision: '', rationale: '', uncertainty: '', alternative: '', trigger: '', assistance: 'none_declared' };
export function DecisionEvidence({ events = [], history, onSave, disabled, allowedStages = Object.keys(stages) }) {
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
  return <section className="decision-evidence"><header className="evidence-heading"><div><span className="eyebrow">Una pausa para pensar</span><h1>Tu bitácora de decisiones</h1><p>Explica qué decides y por qué. Puedes volver a la entrevista sin perder el texto.</p></div><span className="evidence-count">{events.length} registros</span></header>
    <p>Registra tu razonamiento antes de consultar retroalimentación. Completa primero tu decisión y su fundamento; luego profundiza si lo necesitas.</p>
    <form onSubmit={save}><fieldset disabled={disabled || busy}><legend>Nuevo registro</legend><div className="evidence-form-grid">
      <label>Momento<select value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value })}>{Object.entries(stages).filter(([key]) => allowedStages.includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {[['decision', '¿Qué decides o mantienes en este momento?', true], ['rationale', '¿En qué antecedentes fundamentas tu decisión?', true], ['uncertainty', '¿Qué dudas, contradicciones o datos faltantes identificas?'], ['alternative', '¿Qué otra interpretación o acción consideras?'], ['trigger', '¿Qué información motivó mantener o revisar tu decisión?']].map(([key, label, required]) => <label key={key}>{label}<textarea required={required} maxLength={6000} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <label>Ayuda antes de responder<select value={draft.assistance} onChange={e => setDraft({ ...draft, assistance: e.target.value })}><option value="none_declared">No declaro ayuda adicional</option><option value="received">Consulté orientación o retroalimentación</option></select></label>
      </div><button type="submit" className="primary-action">{busy ? 'Guardando…' : 'Guardar registro'}</button>
    </fieldset></form><p role="status">{message}</p>
    <details className="evidence-history"><summary>Consultar registros anteriores ({events.length})</summary><ol>{events.map(event => <li key={event.id}><strong>{stages[event.stage]}</strong> · {event.turnCount} intercambios previos<p>{event.decision}</p><p>Fundamento: {event.rationale}</p></li>)}</ol></details>
  </section>;
}
