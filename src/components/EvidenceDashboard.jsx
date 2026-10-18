import React, { useMemo, useState } from 'react';
import { evidenceRows, evidenceCounts, stages } from '../engine/decisionEvidence.js';
import './decisionEvidence.css';
export function EvidenceDashboard({ records = [] }) {
  const rows = useMemo(() => evidenceRows(records), [records]);
  const [stage, setStage] = useState("all");
  const visibleRows = stage === "all" ? rows : rows.filter(row => row.stage === stage);
  const counts = evidenceCounts(rows);
  const max = Math.max(1, ...counts.map(row => row.count));
  function download() {
    const payload = { schema: 'decision-evidence-v1', exportedAt: new Date().toISOString(), scope: 'own_sessions', scoring: 'not_validated', records: rows };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'escucha-viva-evidencias.json'; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className="screen decision-evidence"><header className="evidence-heading"><div><span className="eyebrow">Mi recorrido</span><h1>Mis evidencias de razonamiento</h1></div><span className="evidence-count">{rows.length} registros</span></header>
    <p>Registros de tus propias sesiones. Las barras representan cantidades de registros; no indican dominio, calidad ni mejora.</p>
    <p>{rows.length} registros en {new Set(rows.map(row => row.sessionId)).size} sesiones. Las sesiones anteriores sin bitácora no se puntúan como cero.</p>
    <figure className="evidence-chart-card"><figcaption>Registros por momento</figcaption>{counts.map(row => <div className="evidence-bar" key={row.stage}><span>{row.label}</span><meter min="0" max={max} value={row.count} aria-label={row.label} /><strong>{row.count}</strong></div>)}</figure>
    <div className="evidence-controls"><label>Explorar por momento<select value={stage} onChange={event => setStage(event.target.value)}><option value="all">Todos los momentos</option>{Object.entries(stages).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><button type="button" className="secondary-action" disabled={!rows.length} onClick={download}>Descargar mis evidencias</button></div>
    {!rows.length ? <p>Aún no hay registros. Durante una entrevista, abre la bitácora de decisiones.</p> : <div className="evidence-table"><table><caption>Secuencia de evidencias</caption><thead><tr><th>Caso / sesión</th><th>Momento</th><th>Decisión y fundamento</th><th>Contexto</th></tr></thead><tbody>{visibleRows.map(row => <tr key={`${row.sessionId}-${row.id}`}><td>{row.caseName} · {row.sessionNumber}</td><td>{stages[row.stage]}<br />{new Date(row.createdAt).toLocaleString('es-CL')}</td><td><strong>{row.decision}</strong><details><summary>Ver fundamento y alternativas</summary><p><strong>Fundamento:</strong> {row.rationale}</p><p><strong>Incertidumbre:</strong> {row.uncertainty || 'Sin registrar'}</p><p><strong>Alternativa:</strong> {row.alternative || 'Sin registrar'}</p><p><strong>Motivo de revisión:</strong> {row.trigger || 'Sin registrar'}</p></details></td><td>{row.turnCount} intercambios<br />{row.assistance === 'received' ? 'Ayuda declarada' : 'Sin ayuda adicional declarada'}<br />Pregunta estructurada</td></tr>)}</tbody></table></div>}
    {rows.length > 0 && visibleRows.length === 0 && <p role="status">No hay registros para este momento.</p>}
    <p>La etiqueta «caso nuevo» es una declaración del estudiante. Su comparabilidad y la transferencia deben evaluarse con el protocolo del estudio.</p>
  </section>;
}
