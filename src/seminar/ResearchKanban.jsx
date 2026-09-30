import React, { useEffect, useRef, useState } from 'react';
import { Columns3, Plus, AlertCircle } from 'lucide-react';
import { LESSONS } from './learningContent.js';
import { localDate, validDate } from './learningJourney.js';
import { KANBAN_COLUMNS, activeWork, safeLink, transitionCard } from './projectWorkspaceModel.js';

export function ResearchKanban({ board = { wipLimit: 3, cards: [] }, onChange, onOpenLesson, requestedPlan, open, onToggle, onExport }) {
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');
  const editorRef = useRef(null);
  const showEditor = value => { setEditor(value); globalThis.requestAnimationFrame?.(() => editorRef.current?.scrollIntoView({ block: 'center' })); };
  function newCard(lesson) {
    if (editor && !globalThis.confirm('Hay una tarjeta abierta sin guardar. ¿Reemplazar ese formulario?')) return;
    showEditor({ title: lesson ? 'Construir: ' + lesson.title : '', module: lesson?.id || 'tema', product: '', owner: '', reviewer: '', due: '', evidence: '', blocked: false, blockReason: '', reviewNote: '', checksText: (lesson?.coherence || ['El producto responde a la tarea acordada.', 'Las afirmaciones tienen respaldo identificable.', 'La revisión queda registrada.']).join('\n') });
    setNotice('Define un producto pequeño que otra persona pueda revisar.');
  }
  useEffect(() => { if (requestedPlan) newCard(LESSONS.find(row => row.id === requestedPlan.id)); }, [requestedPlan]);
  function save() {
    if (!editor.title.trim() || !editor.product.trim()) { setNotice('Escribe el título y el producto verificable de la tarea.'); return; }
    if (editor.due && !validDate(editor.due)) { setNotice('Revisa la fecha de la tarea.'); return; }
    if (editor.evidence && !safeLink(editor.evidence)) { setNotice('La evidencia debe ser un enlace HTTPS válido.'); return; }
    if (editor.blocked && !editor.blockReason.trim()) { setNotice('Describe qué impide continuar.'); return; }
    const original = board.cards.find(card => card.id === editor.id);
    if (original?.status === 'done') { setNotice('Reabre la tarjeta en En revisión antes de modificar un producto terminado.'); return; }
    if (!original && board.cards.length >= 80) { setNotice('Este tablero admite 80 tarjetas. Exporta y retira tareas que ya no necesites conservar aquí.'); return; }
    const checks = editor.checksText.split('\n').map(t => t.trim().slice(0, 400)).filter(Boolean).slice(0, 12).map(t => ({ text: t, done: original?.checks.find(c => c.text === t)?.done || false }));
    if (!checks.length) { setNotice('Escribe al menos un criterio de terminado, uno por línea.'); return; }
    const { checksText, ...values } = editor;
    const card = { ...original, ...values, id: original?.id || globalThis.crypto.randomUUID(), status: original?.status || 'todo', title: values.title.trim(), product: values.product.trim(), evidence: safeLink(values.evidence), checks, createdAt: original?.createdAt || new Date().toISOString(), startedAt: original?.startedAt || '', finishedAt: '', history: original?.history || [] };
    onChange({ ...board, cards: original ? board.cards.map(row => row.id === card.id ? card : row) : [...board.cards, card] });
    setEditor(null); setNotice('Tarjeta guardada en tu tablero personal.');
  }
  function move(id, status) {
    const result = transitionCard(board, id, status);
    if (result.error) { setNotice(result.error); return; }
    onChange(result.board); setNotice('Estado de la tarjeta actualizado.');
  }
  function check(card, index, done) {
    if (card.status === 'done') { setNotice('Reabre la tarea para cambiar sus criterios.'); return; }
    onChange({ ...board, cards: board.cards.map(row => row.id === card.id ? { ...row, checks: row.checks.map((c, n) => n === index ? { ...c, done } : c) } : row) });
  }
  const active = activeWork(board.cards).length;
  const filtered = board.cards.filter(card => (card.title + ' ' + card.owner + ' ' + card.reviewer).toLocaleLowerCase('es').includes(filter.toLocaleLowerCase('es')));
  const change = patch => setEditor(value => ({ ...value, ...patch }));
  return <details className="pw-panel pw-kanban" open={open} onToggle={event => onToggle(event.currentTarget.open)}>
    <summary><Columns3 aria-hidden="true"/> Mi tablero Kanban <span>{board.cards.length} tareas personales</span></summary>
    <p>Haz visible qué construirás, qué está en marcha y qué necesita revisión. Este tablero se guarda con tu cuaderno en este navegador; escribir responsables o revisores no envía invitaciones.</p>
    <details className="pw-guide"><summary>Aprender a trabajar con Kanban</summary><p>Kanban ayuda a gestionar el flujo de trabajo haciendo visibles las tareas, las reglas de avance y los límites de lo que se empieza. Aquí lo adaptamos a productos pequeños de investigación.</p><ol><li><strong>Por hacer:</strong> aclara producto y criterios antes de comenzar.</li><li><strong>En curso:</strong> desarrolla lo comprometido; si algo bloquea el avance, registra qué falta.</li><li><strong>En revisión:</strong> contrasta el producto con criterios y fuentes. Sigue contando como trabajo iniciado.</li><li><strong>Terminado:</strong> registra la revisión y comprueba los criterios. Esto no acredita la validez científica.</li></ol><p>El límite de trabajo en curso incluye «En curso» y «En revisión», también si hay bloqueos. Antes de iniciar otra tarea, ayuda a terminar alguna abierta. Observa fechas y bloqueos para ajustar el proceso.</p><p>Ejemplo: «Comparar tres antecedentes» produce una matriz con pregunta, método, aporte y límite, revisada con las fuentes.</p><a href="https://kanbanguides.org/the-kanban-guide/2025.5/" target="_blank" rel="noopener noreferrer">Fundamento: The Kanban Guide (2025).</a></details>
    <div className="pw-toolbar"><button type="button" className="rl-primary" onClick={() => newCard()}><Plus aria-hidden="true"/> Crear tarea</button><button type="button" disabled={!board.cards.length} onClick={onExport}>Exportar tablero CSV</button><label>Límite de trabajo en curso<select value={board.wipLimit} onChange={event => onChange({ ...board, wipLimit: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, n) => <option key={n} value={n + 1}>{n + 1}</option>)}</select></label><label>Buscar tarea o persona<input value={filter} onChange={event => setFilter(event.target.value)} maxLength={180}/></label></div>
    <div className="pw-metrics"><span><strong>{active}/{board.wipLimit}</strong> en curso y revisión</span><span><strong>{board.cards.filter(c => c.blocked).length}</strong> bloqueos</span><span><strong>{board.cards.filter(c => c.status === 'done').length}</strong> terminadas</span></div>
    {active > board.wipLimit && <p className="rl-notice">El trabajo iniciado supera el límite actual. Revisa las tareas abiertas antes de iniciar otras.</p>}
    {notice && <p role="status" className="rl-notice">{notice}</p>}
    {editor && <section className="pw-editor" ref={editorRef} aria-label="Editor de tarea"><h3>{editor.id ? 'Revisar mi tarea' : 'Preparar una tarea'}</h3><div className="rl-pair">
      <label className="rl-field">Título de la tarea<input value={editor.title} maxLength={180} onChange={event => change({ title: event.target.value })}/></label>
      <label className="rl-field">Apartado de la tarea<select value={editor.module} onChange={event => change({ module: event.target.value })}>{LESSONS.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
      <label className="rl-field">Responsable<input value={editor.owner} maxLength={120} onChange={event => change({ owner: event.target.value })}/></label>
      <label className="rl-field">Revisor o par<input value={editor.reviewer} maxLength={120} onChange={event => change({ reviewer: event.target.value })}/></label>
      <label className="rl-field">Fecha prevista<input type="date" value={editor.due} onChange={event => change({ due: event.target.value })}/></label>
      <label className="rl-field">Enlace a la evidencia<input type="url" placeholder="https://…" value={editor.evidence} maxLength={2000} onChange={event => change({ evidence: event.target.value })}/></label>
    </div>
      <label className="rl-field">Producto verificable<textarea value={editor.product} maxLength={2000} onChange={event => change({ product: event.target.value })} placeholder="Qué quedará escrito, comparado o revisado al terminar."/></label>
      <label className="rl-field">Criterios de terminado: uno por línea<textarea value={editor.checksText} maxLength={4800} onChange={event => change({ checksText: event.target.value })}/><small>Hasta 12 criterios. Los criterios modificados deben comprobarse de nuevo.</small></label>
      <label className="pw-check"><input type="checkbox" checked={editor.blocked} onChange={event => change({ blocked: event.target.checked })}/> Esta tarea está bloqueada</label>
      {editor.blocked && <label className="rl-field">Qué impide continuar<textarea value={editor.blockReason} maxLength={2000} onChange={event => change({ blockReason: event.target.value })}/></label>}
      <label className="rl-field">Revisión de cierre<textarea value={editor.reviewNote} maxLength={2000} onChange={event => change({ reviewNote: event.target.value })} placeholder="Qué comprobé, con qué evidencia y qué ajusté. Se exige antes de terminar."/></label>
      <div className="rl-actions"><button type="button" className="rl-primary" onClick={save}>Guardar tarea</button><button type="button" onClick={() => { if (globalThis.confirm('¿Cerrar sin guardar los cambios del formulario?')) setEditor(null); }}>Cerrar formulario</button></div>
    </section>}
    {!board.cards.length && <p className="pw-empty">Comienza con una pieza pequeña: una pregunta delimitada, una cadena de búsqueda o una comparación de antecedentes. También puedes crear una tarea desde el apartado que estudias.</p>}
    <div className="pw-columns">{KANBAN_COLUMNS.map(([status, label]) => <section key={status} className={'pw-column pw-' + status} aria-label={label} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (board.cards.some(card => card.id === id)) move(id, status); }}><h3>{label}<span>{board.cards.filter(card => card.status === status).length}</span></h3>
      {filtered.filter(card => card.status === status).map(card => <article key={card.id} className="pw-card" draggable onDragStart={event => event.dataTransfer.setData('text/plain', card.id)}><h4>{card.title}</h4><button type="button" className="pw-module-link" onClick={() => onOpenLesson(card.module, 3)}>{LESSONS.find(row => row.id === card.module)?.title}</button><p>{card.product}</p><small>Responsable: {card.owner || 'Por acordar'} · Revisor: {card.reviewer || 'Por acordar'}</small>{card.due && <p className={card.status !== 'done' && card.due < localDate() ? 'pw-overdue' : 'pw-date'}>Fecha: {card.due}{card.status !== 'done' && card.due < localDate() ? ' · pendiente fuera de plazo' : ''}</p>}{card.blocked && <div className="pw-blocker"><AlertCircle aria-hidden="true"/><p>{card.blockReason || 'Bloqueo por precisar'}</p></div>}
        <details><summary>Criterios y evidencia · {card.checks.filter(c => c.done).length}/{card.checks.length}</summary>{card.checks.map((criterion, index) => <label className="pw-check" key={index}><input type="checkbox" checked={criterion.done} disabled={card.status === 'done'} onChange={event => check(card, index, event.target.checked)}/><span>{criterion.text}</span></label>)}{safeLink(card.evidence) && <a href={safeLink(card.evidence)} target="_blank" rel="noopener noreferrer">Abrir evidencia</a>}<p><strong>Revisión de cierre: </strong>{card.reviewNote || 'Pendiente de registrar'}</p>{card.startedAt && <small>Inicio: {card.startedAt.slice(0, 10)}{card.finishedAt ? ' · Cierre: ' + card.finishedAt.slice(0, 10) : ''}</small>}</details>
        <label className="pw-status">Mover tarea<select aria-label={'Estado de ' + card.title} value={card.status} onChange={event => move(card.id, event.target.value)}>{KANBAN_COLUMNS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        <div className="pw-card-actions"><button type="button" onClick={() => { if (!editor || globalThis.confirm('¿Reemplazar el formulario abierto sin guardar?')) showEditor({ ...card, checksText: card.checks.map(c => c.text).join('\n') }); }}>Editar tarea</button><button type="button" onClick={() => { if (globalThis.confirm('¿Retirar esta tarjeta del tablero? No elimina documentos ni el apartado escrito.')) { onChange({ ...board, cards: board.cards.filter(row => row.id !== card.id) }); if (editor?.id === card.id) setEditor(null); } }}>Retirar tarea</button></div>
      </article>)}
      {!filtered.some(card => card.status === status) && <p className="pw-column-empty">{filter ? 'Sin coincidencias.' : 'Sin tareas en este estado.'}</p>}
    </section>)}</div><p className="rl-caption">Arrastra una tarjeta o usa «Mover tarea». Los criterios y la revisión de cierre orientan el avance; tú compruebas la evidencia.</p>
  </details>;
}
