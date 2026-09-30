import React, { useEffect, useRef, useState } from 'react';
import { LESSONS, LEARNING_STEPS, REFERENCES, SEARCH_SOURCES, buildBoolean, computeFlow, reviewSnapshot, isLessonReviewed, draftText, structuralFeedback } from './learningContent.js';
import './researchLearning.css';

const empty = () => ({ schema: 1, selected: LESSONS[0].id, records: {} });
function loadNotebook(key) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return { data: empty(), error: '' };
    const data = JSON.parse(value);
    if (data?.schema !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) throw new Error();
    return { data, error: '' };
  } catch { return { data: empty(), error: 'No pudimos recuperar el cuaderno de este navegador. No se sobrescribirá el registro anterior. Exporta lo que escribas en esta sesión y conserva la página abierta.' }; }
}

export function ResearchLearningWorkspace({ session, onShare }) {
  const storageKey = 'seminar-learning-v1:' + session.user.id;
  const [initial] = useState(() => loadNotebook(storageKey));
  const [notebook, setNotebook] = useState(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState('');
  const [checks, setChecks] = useState({});
  const [showModel, setShowModel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [decision, setDecision] = useState('');
  const request = useRef(null);
  const contentRef = useRef(null);
  const lesson = LESSONS.find(row => row.id === notebook.selected) || LESSONS[0];
  const record = notebook.records[lesson.id] || {};
  const fingerprint = reviewSnapshot(record);
  const reviewed = LESSONS.filter(row => isLessonReviewed(notebook.records[row.id])).length;

  useEffect(() => {
    if (initial.error) return;
    try { localStorage.setItem(storageKey, JSON.stringify(notebook)); setStorageError(''); }
    catch { setStorageError('No fue posible guardar en este navegador. Exporta tu cuaderno antes de salir o prepara el aporte para guardarlo con el equipo.'); }
  }, [notebook, storageKey, initial.error]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { setChecks({}); }, [lesson.id, fingerprint]);

  function update(patch) {
    setNotebook(previous => ({ ...previous, records: { ...previous.records, [lesson.id]: { ...previous.records[lesson.id], ...patch } } }));
  }
  function select(id) {
    request.current?.abort(); request.current = null; setBusy(false); setCoachError('');
    setNotebook(previous => ({ ...previous, selected: id })); setStep(0); setShowModel(false); setNotice(''); setDecision('');
  }
  function navigate(next) { setStep(next); setNotice(''); contentRef.current?.focus(); }
  function exportNotebook() {
    const output = { ...notebook, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'Mi-investigacion-cuaderno.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Cuaderno exportado. Conserva la copia como respaldo; los aportes compartidos se guardan desde la mesa del equipo.');
  }
  function exportText() {
    const text = LESSONS.filter(row => notebook.records[row.id]).map(row => {
      const value = notebook.records[row.id];
      return row.title + '\n\n' + draftText(row, value) + '\n\nFuente y respaldo:\n' + (value.source || '(pendiente)') + '\n\nPráctica:\n' + (value.practice || '(pendiente)') + '\n\nReflexión:\n' + (value.reflection || '(pendiente)') + (value.tools ? '\n\nRegistro de herramientas:\n' + JSON.stringify(value.tools, null, 2) : '');
    }).join('\n\n────────────────────\n\n');
    const url = URL.createObjectURL(new Blob([text || 'Cuaderno sin desarrollos.', '\n'], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'Mi-investigacion-desarrollo.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importNotebook(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 1500000) throw new Error('La copia es demasiado extensa.');
      const incoming = JSON.parse(await file.text());
      if (incoming.schema !== 1 || !incoming.records || typeof incoming.records !== 'object') throw new Error('Esta copia no tiene el formato del cuaderno.');
      const records = {};
      for (const module of LESSONS) {
        const value = incoming.records[module.id]; if (!value || typeof value !== 'object') continue;
        const fields = {}; for (const field of module.fields) fields[field.key] = String(value.fields?.[field.key] || '').slice(0, 4000);
        const clean = { fields, practice: String(value.practice || '').slice(0,4000), reflection: String(value.reflection || '').slice(0,4000), source: String(value.source || '').slice(0,4000) };
        if (module.id === 'booleanas') clean.tools = { blocks: [0,1,2].map(n => String(value.tools?.blocks?.[n] || '').slice(0,500)) };
        if (module.id === 'flujo') {
          clean.tools = { searches: Array.isArray(value.tools?.searches) ? value.tools.searches.slice(0,100).map((row, n) => Object.fromEntries(['date','source','query','filters','count','note'].map(k => [k, String(row?.[k] ?? '').slice(0,2000)]).concat([['id','import-' + n]]))) : [], flow: {} };
          for (const key of ['duplicates','other','screenedOut','notRetrieved','fullExcluded','reasons','otherReason']) clean.tools.flow[key] = String(value.tools?.flow?.[key] ?? '').slice(0,4000);
        }
        records[module.id] = clean;
      }
      if (!Object.keys(records).length) throw new Error('La copia no contiene módulos reconocibles.');
      if (!globalThis.confirm('¿Reemplazar los módulos presentes en esta copia? Exporta primero tu cuaderno si necesitas conservar ambas versiones. Las revisiones deberán registrarse de nuevo.')) return;
      setNotebook(previous => ({ ...previous, records: { ...previous.records, ...records } }));
      setNotice('Copia recuperada. Los módulos importados requieren una nueva revisión.');
    } catch (error) { setNotice(error.message || 'No fue posible leer la copia. El cuaderno actual se conserva.'); }
  }
  async function askCoach(phase) {
    const draft = draftText(lesson, record);
    if (!lesson.fields.some(field => String(record.fields?.[field.key] || '').trim().length >= 20)) { setCoachError('Escribe primero una propuesta propia en Aplicar a mi investigación.'); return; }
    if (phase === 'contrast' && !decision.trim()) { setCoachError('Explica primero tu decisión y su fundamento.'); return; }
    const reviewText = draft + '\n\nRespaldo aportado: ' + (record.source || '(sin fuente registrada)');
    if (reviewText.length > 6000) { setCoachError('Esta devolución admite hasta 6000 caracteres de desarrollo y respaldo. Sintetiza el apartado para que se revise completo; puedes exportar antes tu versión extensa.'); return; }
    const controller = new AbortController(); request.current?.abort(); request.current = controller;
    const id = lesson.id, snapshot = fingerprint;
    setBusy(true); setCoachError('');
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('/api/seminar-writing-coach', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token || ''}` },
        body: JSON.stringify({ phase, stage: 'Aula formativa: ' + lesson.title, task: lesson.title,
          purpose: lesson.purpose, criteria: lesson.coherence, expectedProduct: lesson.fields.map(f => f.label).join('; '),
          resources: lesson.refs.map(key => REFERENCES[key].label), draft: reviewText,
          priorQuestion: record.coach?.question || '', teamDecision: decision })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'No fue posible completar la devolución.');
      if (!data || typeof data.observation !== 'string' || typeof data.question !== 'string') throw new Error('La devolución no tuvo el formato esperado. Tu borrador se conserva.');
      if (request.current !== controller) return;
      setNotebook(previous => ({ ...previous, records: { ...previous.records, [id]: { ...previous.records[id], coach: { ...data, snapshot, decision: phase === 'contrast' ? decision : '' } } } }));
    } catch (error) {
      if (request.current === controller) setCoachError(error.name === 'AbortError' ? 'La revisión no terminó a tiempo. Tu texto se conserva; puedes reintentar.' : error.message);
    } finally { clearTimeout(timer); if (request.current === controller) { setBusy(false); request.current = null; } }
  }
  function closeReview() {
    if (lesson.fields.some(field => !String(record.fields?.[field.key] || '').trim()) || !record.source?.trim() || !record.practice?.trim() || !record.reflection?.trim()) {
      setNotice('Completa tu práctica, el desarrollo propio, su respaldo y la reflexión antes de registrar esta revisión.'); return;
    }
    if (!lesson.coherence.every((_, n) => checks[n])) { setNotice('Responde las comprobaciones de coherencia y marca las que efectivamente revisaste.'); return; }
    if (lesson.id === 'flujo') {
      const flow = record.tools?.flow || {};
      const computed = computeFlow(record.tools?.searches || [], flow);
      if (computed.error || (Number(flow.other) > 0 && !flow.otherReason?.trim())) { setNotice(computed.error || 'Explica los otros retiros previos al cribado.'); return; }
    }
    update({ review: { snapshot: fingerprint, at: new Date().toISOString() } });
    setNotice('Revisión personal registrada para esta versión. Una modificación del desarrollo requiere revisarla nuevamente.');
  }
  function share() {
    if (!lesson.fields.some(field => record.fields?.[field.key]?.trim())) { setNotice('Escribe tu desarrollo antes de llevarlo a la mesa.'); return; }
    const development = draftText(lesson, record) + '\n\nFUENTE Y RESPALDO\n' + (record.source || '(pendiente)') + '\n\nREFLEXIÓN\n' + (record.reflection || '(pendiente)') + (record.tools ? '\n\nREGISTROS\n' + JSON.stringify(record.tools, null, 2) : '');
    if (development.length > 58000) { setNotice('Este registro es muy extenso para un solo aporte. Exporta el cuaderno y comparte un enlace al documento desde la mesa.'); return; }
    onShare({ requestId: globalThis.crypto.randomUUID(), title: lesson.title + ' · desarrollo propio', stage: 'Aula formativa · ' + lesson.id, development, evidence: '' });
  }

  return <section className="research-learning" aria-label="Aula formativa de investigación">
    <header className="rl-heading"><div><p className="rl-eyebrow">PSICOLDP · APRENDER A INVESTIGAR</p><h1>Comprende cada decisión.<br/>Construye tu investigación.</h1><p>Un concepto a la vez, con ejemplos, práctica y revisión de tu propio proyecto.</p></div><div className="rl-progress"><strong>{reviewed}<span> / {LESSONS.length}</span></strong><span>módulos con revisión personal vigente</span></div></header>
    <div className="rl-storage"><p>{storageError || 'Tu cuaderno se guarda en este navegador y esta cuenta. Para compartir y guardar un aporte con el equipo, llévalo a la mesa.'}</p><div className="rl-actions"><button type="button" onClick={exportNotebook}>Exportar cuaderno</button><button type="button" onClick={exportText}>Descargar desarrollo</button><label className="rl-file">Recuperar copia<input type="file" accept="application/json,.json" onChange={importNotebook}/></label></div></div>
    {notice && <p className="rl-notice" role="status">{notice}</p>}
    <div className="rl-layout">
      <nav className="rl-lessons" aria-label="Módulos de investigación">{[...new Set(LESSONS.map(row => row.group))].map(group => <div key={group}><h2>{group}</h2>{LESSONS.filter(row => row.group === group).map(row => <button key={row.id} type="button" onClick={() => select(row.id)} aria-current={lesson.id === row.id ? 'step' : undefined}><span>{row.title}</span>{isLessonReviewed(notebook.records[row.id]) && <small>Revisión registrada</small>}</button>)}</div>)}</nav>
      <main className="rl-main">
        <div className="rl-module-title"><p className="rl-eyebrow">{lesson.group} · Módulo {LESSONS.indexOf(lesson) + 1}</p><h2>{lesson.title}</h2></div>
        <nav className="rl-steps" aria-label="Pasos de aprendizaje">{LEARNING_STEPS.map((label, n) => <button type="button" key={label} onClick={() => navigate(n)} aria-current={step === n ? 'step' : undefined}><span>{n + 1}</span>{label}</button>)}</nav>
        <section className="rl-content" ref={contentRef} tabIndex={-1} aria-label={LEARNING_STEPS[step]}>
          <h3>{LEARNING_STEPS[step]}</h3>
          {step === 0 && <>
            <h4>Qué es</h4><p>{lesson.definition}</p><div className="rl-pair"><div><h4>Para qué sirve</h4><p>{lesson.purpose}</p></div><div><h4>Cuándo se utiliza</h4><p>{lesson.when}</p></div></div>
            <h4>Cómo se construye</h4><ol className="rl-process">{lesson.steps.map(item => <li key={item}>{item}</li>)}</ol>
            <Sources refs={lesson.refs}/>
            {lesson.id === 'busqueda' && <SearchDirectory/>}
          </>}
          {step === 1 && <><p className="rl-caption">Ejemplos didácticos. No son datos, resultados ni decisiones aprobadas de tu investigación.</p><article className="rl-example"><h4>Una formulación que orienta</h4><p>{lesson.example}</p></article><article className="rl-example rl-example-revise"><h4>Una formulación que necesita revisión</h4><p>{lesson.weak}</p></article><h4>Por qué</h4><p>{lesson.explanation}</p><Sources refs={lesson.refs}/></>}
          {step === 2 && <><p>{lesson.practice}</p><TextField label="Mi respuesta al ejercicio" value={record.practice || ''} onChange={value => update({ practice: value })}/><button type="button" disabled={!record.practice?.trim()} onClick={() => setShowModel(true)}>Contrastar con una orientación</button>{showModel && <div className="rl-notice"><h4>Una vía de resolución</h4><p>{lesson.model}</p><p>Compara las razones de tu respuesta, no solo las palabras. Puedes volver a editarla.</p></div>}</>}
          {step === 3 && <><p>Construye este apartado con tus propias fuentes y decisiones. Si algo sigue pendiente, indícalo y explica cómo lo resolverás.</p>{lesson.fields.map(field => <TextField key={lesson.id + field.key} label={field.label} help={field.help} value={record.fields?.[field.key] || ''} onChange={value => update({ fields: { ...record.fields, [field.key]: value } })}/>)}<TextField label="Fuente y pasaje que sustentan este desarrollo" help="Autor, año, documento, página o sección y la afirmación que respalda. Distingue lectura completa, parcial y resumen consultado." value={record.source || ''} onChange={value => update({ source: value })}/>
            {lesson.id === 'booleanas' && <BooleanBuilder tools={record.tools || {}} onChange={tools => update({ tools })} onUse={value => update({ fields: { ...record.fields, strategy: value + '\nPlataforma y fecha de ejecución: pendientes.' } })}/>}
            {lesson.id === 'busqueda' && <><SearchDirectory/><button type="button" onClick={() => { select('flujo'); setStep(3); }}>Abrir mi bitácora y flujo</button></>}
            {lesson.id === 'flujo' && <SearchFlow tools={record.tools || {}} onChange={tools => update({ tools })}/>}
          </>}
          {step === 4 && <>
            <h4>Primera revisión de estructura</h4><p className="rl-caption">Comprueba campos y expresiones que conviene revisar. No califica la calidad científica ni verifica el contenido de las fuentes.</p><ul>{structuralFeedback(lesson, record).map(note => <li key={note}>{note}</li>)}</ul>
            <h4>Devolución sobre mi desarrollo</h4><p>La devolución formula una mejora prioritaria. Tú decides qué mantener o corregir y fundamentas esa decisión.</p>
            <button type="button" className="rl-primary" disabled={busy} onClick={() => askCoach('question')}>{busy ? 'Revisando el desarrollo…' : 'Solicitar retroalimentación'}</button>
            {coachError && <p className="rl-error" role="alert">{coachError}</p>}
            {record.coach && <div className="rl-coach"><h4>{record.coach.snapshot === fingerprint ? 'Devolución de esta versión' : 'Devolución anterior: el desarrollo cambió'}</h4><p>{record.coach.observation}</p><p><strong>Prioridad: </strong>{record.coach.priorityImprovement}</p><p><strong>Pregunta: </strong>{record.coach.question}</p>{Array.isArray(record.coach.options) && <ul>{record.coach.options.map((option,n) => <li key={n}>{String(option)}</li>)}</ul>}<p>{record.coach.contrast}</p>{record.coach.suggestedRewrite && <details><summary>Propuesta de redacción para contrastar</summary><p>{record.coach.suggestedRewrite}</p><small>Revisa su fidelidad antes de incorporar cualquier frase a tu desarrollo.</small></details>}<p>{record.coach.nextAction}</p><p className="rl-caption">{record.coach.limitation}</p>
              {record.coach.snapshot === fingerprint && <><TextField label="Mi decisión y sus razones" value={decision} onChange={setDecision}/><button type="button" disabled={busy || !decision.trim()} onClick={() => askCoach('contrast')}>Contrastar mi decisión</button></>}
            </div>}
            <TextField label="Qué mantengo, qué cambio y por qué" help="Registra tu reflexión después de revisar. Explica también qué fuente o pregunta necesitas contrastar." value={record.reflection || ''} onChange={value => update({ reflection: value })}/><Sources refs={['feedback','meta']}/>
          </>}
          {step === 5 && <>
            <p>Lee tu desarrollo junto a los demás componentes. Registra una revisión solo después de explicar las conexiones y resolver o declarar las tensiones.</p><div className="rl-checks">{lesson.coherence.map((text,n) => <label key={text}><input type="checkbox" checked={!!checks[n]} onChange={event => setChecks(previous => ({ ...previous, [n]: event.target.checked }))}/><span>{text}</span></label>)}</div>
            <CoherenceMap records={notebook.records} onOpen={id => { select(id); setStep(3); }}/>
            <div className="rl-actions"><button type="button" className="rl-primary" onClick={closeReview}>Registrar mi revisión</button><button type="button" onClick={share}>Llevar desarrollo a la mesa del equipo</button></div>
            <p className="rl-caption">{isLessonReviewed(record) ? 'Revisión personal vigente. ' : 'Revisión personal pendiente o desactualizada. '}La mesa permite preparar un aporte y guardarlo para revisión en pares. La validación académica requiere contrastar fuentes y criterios.</p>
          </>}
        </section>
        <footer className="rl-navigation"><button type="button" disabled={step === 0} onClick={() => navigate(step - 1)}>Paso anterior</button><span>{step + 1} de 6</span>{step < 5 ? <button type="button" onClick={() => navigate(step + 1)}>Siguiente paso</button> : <button type="button" disabled={LESSONS.indexOf(lesson) === LESSONS.length - 1} onClick={() => select(LESSONS[LESSONS.indexOf(lesson)+1].id)}>Siguiente módulo</button>}</footer>
      </main>
    </div>
  </section>;
}

function TextField({ label, help, value, onChange }) {
  return <label className="rl-field">{label}{help && <small>{help}</small>}<textarea rows={4} maxLength={4000} value={value} onChange={event => onChange(event.target.value)}/></label>;
}
function Sources({ refs }) {
  return <details className="rl-sources"><summary>Fundamento y fuentes de este apartado</summary>{refs.map(key => <p key={key}><strong>{REFERENCES[key].label}</strong><br/>{REFERENCES[key].text}{REFERENCES[key].url && <><br/><a href={REFERENCES[key].url} target="_blank" rel="noopener noreferrer">Consultar fuente</a></>}{REFERENCES[key].note && <><br/><small>{REFERENCES[key].note}</small></>}</p>)}</details>;
}
function SearchDirectory() {
  return <section className="rl-directory"><h4>Dónde y cómo buscar</h4><p>Elige según tu pregunta. Abre la fuente, prueba la búsqueda y registra lo que realmente recuperaste.</p><div className="rl-source-grid">{SEARCH_SOURCES.map(([name,url,help]) => <article key={name}><a href={url} target="_blank" rel="noopener noreferrer">{name}</a><p>{help}</p></article>)}</div><h4>Qué documento necesitas</h4><ul><li><strong>Artículo empírico:</strong> examina pregunta, método, resultados y limitaciones.</li><li><strong>Revisión:</strong> orienta patrones del campo; consulta los estudios originales para afirmaciones específicas.</li><li><strong>Trabajo teórico:</strong> compara definiciones y modelos.</li><li><strong>Tesis o informe:</strong> puede aportar contexto o detalles; identifica institución y evaluación recibida.</li><li><strong>Prepublicación:</strong> comprueba si tiene evaluación por pares y si existe una versión posterior.</li></ul><p className="rl-caption">La indexación, el acceso abierto o el orden del buscador no garantizan por sí solos calidad ni pertinencia.</p></section>;
}
function BooleanBuilder({ tools, onChange, onUse }) {
  const blocks = tools.blocks || ['','','']; const chain = buildBoolean(blocks);
  const [notice,setNotice] = useState('');
  return <section className="rl-tool"><h4>Construir mi cadena</h4><p>Un concepto por bloque. Separa sus sinónimos por coma o punto y coma. El constructor une alternativas con OR y conceptos con AND.</p>{[0,1,2].map(n => <label className="rl-field" key={n}>Concepto {n+1}{n === 2 ? ' (opcional)' : ''}<input maxLength={500} value={blocks[n] || ''} placeholder={['metacognition, metacognitive regulation','simulation, virtual patient','psychology students'][n]} onChange={event => onChange({ ...tools, blocks: [0,1,2].map(i => i === n ? event.target.value : blocks[i] || '') })}/></label>)}<pre aria-label="Cadena construida">{chain || 'Agrega términos para construir la cadena.'}</pre><div className="rl-actions"><button type="button" disabled={!chain} onClick={async () => { try { await navigator.clipboard.writeText(chain); setNotice('Cadena copiada.'); } catch { setNotice('Selecciona el texto de la cadena para copiarlo manualmente.'); } }}>Copiar cadena</button><button type="button" disabled={!chain} onClick={() => { onUse(chain); setNotice('Cadena incorporada al desarrollo. Completa la plataforma y la fecha después de ejecutarla.'); }}>Usar en mi desarrollo</button>{chain && <a href={'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(chain)} target="_blank" rel="noopener noreferrer">Probar en PubMed</a>}</div>{notice && <p role="status">{notice}</p>}<p className="rl-caption">La sintaxis final depende de la base. Este constructor no ejecuta búsquedas ni registra resultados automáticamente. Evita introducir AND, OR o NOT dentro de un sinónimo.</p></section>;
}

function SearchFlow({ tools, onChange }) {
  const searches = tools.searches || [], flow = tools.flow || {};
  const [row,setRow] = useState({ date: new Date().toLocaleDateString('en-CA'), source: '', query: '', filters: '', count: '', note: '' });
  const [error,setError] = useState('');
  const computed = computeFlow(searches,flow);
  function add() {
    if (!row.date || !row.source.trim() || !row.query.trim() || row.count === '' || !Number.isSafeInteger(Number(row.count)) || Number(row.count) < 0) { setError('Completa fecha, fuente, cadena y un conteo entero no negativo.'); return; }
    if (searches.length >= 100) { setError('Este cuaderno admite 100 búsquedas. Exporta el registro y continúa en un documento de trabajo.'); return; }
    onChange({ ...tools, searches: [...searches,{...row,id:globalThis.crypto.randomUUID()}] }); setRow({...row,query:'',count:'',note:''}); setError('');
  }
  const labels = [['date','Fecha'],['source','Base o fuente'],['query','Cadena exacta ejecutada'],['filters','Filtros y colección'],['count','Registros recuperados'],['note','Archivo exportado / observaciones']];
  return <section className="rl-tool"><h4>Mi bitácora de búsqueda</h4><p>Registra cada ejecución una sola vez. Si cambiaste la cadena o filtros, identifica la nueva búsqueda y elimina duplicados antes del cribado.</p><div className="rl-pair">{labels.map(([key,label]) => <label className="rl-field" key={key}>{label}<input maxLength={2000} type={key === 'date' ? 'date' : key === 'count' ? 'number' : 'text'} min={key === 'count' ? 0 : undefined} step={key === 'count' ? 1 : undefined} value={row[key]} onChange={event => setRow({...row,[key]:event.target.value})}/></label>)}</div><button type="button" onClick={add}>Registrar búsqueda</button>{error && <p className="rl-error" role="alert">{error}</p>}
    <div className="rl-table-wrap"><table><caption>Búsquedas registradas ({searches.length})</caption><thead><tr><th>Fecha y fuente</th><th>Consulta y filtros</th><th>Registros</th><th>Acción</th></tr></thead><tbody>{searches.map(item => <tr key={item.id}><td>{item.date}<br/>{item.source}</td><td>{item.query}<br/><small>{item.filters}<br/>{item.note}</small></td><td>{item.count}</td><td><button type="button" onClick={() => { if(globalThis.confirm('¿Retirar esta búsqueda del conteo? Revisa después el flujo.')) onChange({ ...tools, searches: searches.filter(entry => entry.id !== item.id) }); }}>Retirar</button></td></tr>)}</tbody></table></div>
    <h4>Construir el flujo con mis registros</h4><p>Este flujo didáctico sigue registros e informes en una ruta simple. Si un estudio tiene varios informes, o usas otras rutas de identificación, conserva además la correspondencia documental y adapta el diagrama oficial cuando corresponda.</p><div className="rl-pair">{[['duplicates','Duplicados retirados'],['other','Otros registros retirados antes del cribado'],['screenedOut','Excluidos por título y resumen'],['notRetrieved','Textos completos no recuperados'],['fullExcluded','Textos completos excluidos']].map(([key,label]) => <label className="rl-field" key={key}>{label}<input type="number" min="0" step="1" value={flow[key] ?? ''} onChange={event => onChange({...tools,flow:{...flow,[key]:event.target.value}})}/></label>)}</div>
    <TextField label="Otros retiros: motivos y cantidades" value={flow.otherReason || ''} onChange={value => onChange({...tools,flow:{...flow,otherReason:value}})}/><TextField label="Exclusiones de texto completo: motivos, cantidades y registro documental" value={flow.reasons || ''} onChange={value => onChange({...tools,flow:{...flow,reasons:value}})}/>
    {computed.error || (Number(flow.other) > 0 && !flow.otherReason?.trim()) ? <p className="rl-notice" role="status">{computed.error || 'Explica los otros retiros previos al cribado.'}</p> : <><ol className="rl-flow" aria-label="Flujo calculado de selección">{[['Recuperados',computed.total],['Examinados por título y resumen',computed.screened],['Textos completos buscados',computed.sought],['Textos completos evaluados',computed.assessed],['Informes incluidos',computed.included]].map(([label,count]) => <li key={label}><span>{label}</span><strong>{count}</strong></li>)}</ol><p className="rl-caption">La aritmética es consistente. Revisa que las cifras y razones coincidan con los documentos; el cálculo no valida la selección ni identifica estudios únicos.</p></>}
    <Sources refs={['prisma']}/>
  </section>;
}

function CoherenceMap({ records, onOpen }) {
  const rows = [['delimitacion','phenomenon','Fenómeno'],['delimitacion','population','Población'],['delimitacion','context','Contexto'],['concepto','lens','Lente teórico'],['vacio','gap','Vacío'],['vacio','problem','Problema'],['pregunta','question','Pregunta'],['objetivos','general','Objetivo general'],['objetivos','specifics','Objetivos específicos'],['diseno','design','Diseño'],['analisis','plan','Análisis']];
  return <details className="rl-map" open><summary>Mi investigación: comprobar la conexión entre apartados</summary><p>Compara palabras y alcance. ¿Aparece un concepto nuevo sin fundamento? ¿Cambian participantes o contexto? ¿Cada objetivo tiene evidencia y análisis previstos?</p><div className="rl-table-wrap"><table><thead><tr><th>Componente</th><th>Mi formulación actual</th><th>Revisar</th></tr></thead><tbody>{rows.map(([id,key,title]) => <tr key={id+key}><th scope="row">{title}</th><td>{records[id]?.fields?.[key] || 'Pendiente de desarrollar'}</td><td><button type="button" onClick={() => onOpen(id)}>Abrir {title.toLowerCase()}</button></td></tr>)}</tbody></table></div></details>;
}
