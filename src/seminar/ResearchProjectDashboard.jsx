import React, { useMemo, useState } from 'react';
import { ClipboardCheck, BrainCircuit } from 'lucide-react';
import { LESSONS } from './learningContent.js';
import { isLessonReviewed } from './learningContent.js';

const clean = (value, max=3000) => String(value || '').trim().slice(0,max);
const valueAt = (records,id,key) => clean(records?.[id]?.fields?.[key]);

export function coherenceSignals(records={}, guide={}) {
  const signals=[];
  const question=valueAt(records,'pregunta','question');
  const general=valueAt(records,'objetivos','general');
  const specifics=valueAt(records,'objetivos','specifics');
  const design=valueAt(records,'diseno','design');
  const analysis=valueAt(records,'analisis','plan');
  const population=valueAt(records,'delimitacion','population');
  const phenomenon=valueAt(records,'delimitacion','phenomenon');
  if(question && !general) signals.push(['Pregunta → objetivo','Ya formulaste la pregunta, pero el objetivo general sigue pendiente.']);
  if(general && !specifics) signals.push(['Objetivo general → específicos','El objetivo general ya existe; explicita objetivos específicos cognitivos que lo desplieguen.']);
  if(question && !design) signals.push(['Pregunta → diseño','Contrasta si el diseño elegido permite responder la pregunta formulada.']);
  if(design && !analysis) signals.push(['Diseño → análisis','El diseño está escrito, pero falta declarar cómo se analizará la evidencia.']);
  if(question && population && !question.toLowerCase().includes(population.toLowerCase().slice(0,24))) signals.push(['Población','Comprueba que la población delimitada se conserve explícita o inequívoca en la pregunta.']);
  if(question && phenomenon && !question.toLowerCase().includes(phenomenon.toLowerCase().slice(0,24))) signals.push(['Fenómeno','Comprueba que el fenómeno delimitado mantenga el mismo alcance en la pregunta.']);
  if(guide?.route && guide.route !== 'undecided' && !design) signals.push(['Ruta metodológica','Registraste una ruta metodológica provisional; contrástala ahora con un diseño explícito.']);
  return signals.slice(0,8);
}

export function ResearchProjectDashboard({ records, guide, project, decisions, onOpenLesson }) {
  const reviewed=LESSONS.filter(row=>isLessonReviewed(records?.[row.id] || {})).length;
  const written=LESSONS.filter(row=>row.fields.some(field=>valueAt(records,row.id,field.key))).length;
  const board=project?.board?.cards || [];
  const signals=useMemo(()=>coherenceSignals(records,guide),[records,guide]);
  return <section className="pw-dashboard" aria-label="Panel de progreso de mi tesis">
    <div className="pw-dashboard-heading"><div><p className="rl-eyebrow">MI INVESTIGACIÓN · VISTA DE CONJUNTO</p><h2>Progreso de mi tesis</h2><p>El avance muestra evidencia de trabajo registrada; no es una nota ni una validación académica.</p></div><ClipboardCheck aria-hidden="true"/></div>
    <div className="pw-dashboard-metrics">
      <article><strong>{written}<span>/{LESSONS.length}</span></strong><p>módulos con escritura propia</p></article>
      <article><strong>{reviewed}<span>/{LESSONS.length}</span></strong><p>revisiones personales vigentes</p></article>
      <article><strong>{board.filter(c=>c.status==='done').length}<span>/{board.length}</span></strong><p>tareas Kanban terminadas</p></article>
      <article><strong>{decisions.length}</strong><p>decisiones fundamentadas</p></article>
    </div>
    <div className="pw-coherence"><h3><BrainCircuit aria-hidden="true"/> Conexiones que conviene comprobar</h3>
      {!signals.length ? <p>No aparecen pendientes estructurales automáticos con los campos disponibles. Revisa igualmente contenido, fuentes y criterios con tu equipo y docente.</p> :
      <ul>{signals.map(([title,text])=><li key={title}><strong>{title}</strong><span>{text}</span></li>)}</ul>}
      <div className="rl-actions"><button type="button" onClick={()=>onOpenLesson('pregunta')}>Revisar pregunta</button><button type="button" onClick={()=>onOpenLesson('objetivos')}>Revisar objetivos</button><button type="button" onClick={()=>onOpenLesson('diseno')}>Revisar diseño</button></div>
    </div>
  </section>;
}

export function DecisionLog({ decisions=[], onChange, lesson }) {
  const [form,setForm]=useState({decision:'',reason:'',evidence:'',next:''});
  const [notice,setNotice]=useState('');
  function save(){
    if(!clean(form.decision) || !clean(form.reason)){setNotice('Describe la decisión y explica por qué la tomaste antes de guardarla.');return;}
    const row={id:globalThis.crypto.randomUUID(),module:lesson.id,at:new Date().toISOString(),decision:clean(form.decision),reason:clean(form.reason),evidence:clean(form.evidence),next:clean(form.next)};
    onChange([row,...decisions].slice(0,100)); setForm({decision:'',reason:'',evidence:'',next:''}); setNotice('Decisión registrada en la bitácora.');
  }
  return <details className="pw-panel pw-decisions"><summary><BrainCircuit aria-hidden="true"/> Bitácora de decisiones <span>{decisions.length} registros</span></summary>
    <p>Registra decisiones que cambian o sostienen tu investigación. La bitácora conserva el razonamiento, no reemplaza la fundamentación del texto académico.</p>
    <div className="rl-pair"><label className="rl-field">Decisión tomada<textarea value={form.decision} onChange={e=>setForm({...form,decision:e.target.value})} maxLength={3000}/></label><label className="rl-field">¿Por qué la tomé?<textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} maxLength={3000}/></label></div>
    <div className="rl-pair"><label className="rl-field">Evidencia o fuente que contrasté<textarea value={form.evidence} onChange={e=>setForm({...form,evidence:e.target.value})} maxLength={3000}/></label><label className="rl-field">Qué debo comprobar después<textarea value={form.next} onChange={e=>setForm({...form,next:e.target.value})} maxLength={3000}/></label></div>
    <button type="button" className="rl-primary" onClick={save}>Guardar decisión</button>{notice&&<p className="rl-notice" role="status">{notice}</p>}
    {!decisions.length ? <p className="pw-empty">Aún no registras decisiones. Puedes comenzar con una delimitación, una elección metodológica o un cambio surgido de la revisión.</p> :
    <ol className="pw-decision-list">{decisions.map(row=><li key={row.id}><div><strong>{row.decision}</strong><small>{row.at?.slice(0,10)} · {LESSONS.find(l=>l.id===row.module)?.title || 'Proyecto'}</small></div><p><b>Razón:</b> {row.reason}</p>{row.evidence&&<p><b>Evidencia:</b> {row.evidence}</p>}{row.next&&<p><b>Por comprobar:</b> {row.next}</p>}<button type="button" onClick={()=>{if(globalThis.confirm('¿Retirar esta decisión de la bitácora?'))onChange(decisions.filter(item=>item.id!==row.id));}}>Retirar registro</button></li>)}</ol>}
  </details>;
}
