import React, { useState } from 'react';
import { ArrowRight, Compass, Lightbulb, RotateCcw, Route, BookOpen, Users } from 'lucide-react';
import { LESSONS, isLessonReviewed } from './learningContent.js';
import { JOURNEY_STAGES, SUPPORT_LEVELS, METHOD_CHOICES, stageFor, routeIds, recordState, suggestedAction, moduleConnections, dueReviews, simulateBoolean, TRAINING_DOCUMENTS, TRANSFER_CASES, localDate } from './learningJourney.js';
import { PEDAGOGY_EVIDENCE } from './pedagogyEvidence.js';
import './researchGuide.css';

function Field({label,value,onChange,help,rows=3}) {
  return <label className="rl-field">{label}{help && <small>{help}</small>}<textarea rows={rows} maxLength={4000} value={value || ''} onChange={event=>onChange(event.target.value)}/></label>;
}

export function ProjectGuide({notebook,lesson,onOpen,onGuideChange,onTeam,onArchive}) {
  const guide=notebook.guide || {}, records=notebook.records || {};
  const suggestion=suggestedAction(notebook), current=stageFor(lesson.id), selectedIds=routeIds(guide);
  const due=dueReviews(records);
  const [notice,setNotice]=useState('');
  const [mapOpen,setMapOpen]=useState(false);
  function saveDecision() {
    if (!guide.reason?.trim() || !guide.alternative?.trim()) {setNotice('Explica tus razones y la alternativa considerada antes de registrar esta decisión provisional.');return;}
    if ((guide.decisions || []).length >= 40) {setNotice('El registro conserva 40 decisiones. Exporta el cuaderno para conservarlas; puedes seguir editando tu propuesta actual.');return;}
    const decision={route:guide.route || 'undecided',reason:guide.reason,alternative:guide.alternative,at:new Date().toISOString()};
    const last=guide.decisions?.at(-1);
    if (last && ['route','reason','alternative'].every(key=>last[key]===decision[key])) {setNotice('Esta decisión ya está registrada.');return;}
    onGuideChange({...guide,decisions:[...(guide.decisions || []),decision]});setNotice('Decisión provisional registrada con sus razones. Puedes revisarla cuando cambie la evidencia.');
  }
  return <section className="rg-project" aria-label="Guía de mi proyecto">
    <div className="rg-heading"><div><p className="rl-eyebrow"><Route aria-hidden="true"/> UNA INVESTIGACIÓN · UN RECORRIDO</p><h2>Mi ruta y mis decisiones.</h2><p>La guía propone una secuencia. Tú eliges dónde trabajar, qué ayuda usar y cuándo volver a una decisión.</p></div><details className="rg-how"><summary>¿Cómo me orienta?</summary><p>La sugerencia considera los campos desarrollados, las revisiones vigentes y la ruta que eliges. Explica su razón y permite explorar cualquier módulo. No interpreta automáticamente la calidad de tu argumento ni decide el método.</p><p>Las siete etapas ordenan el aprendizaje; el calendario conserva sus hitos y pautas. En cada apartado: comprender → ejemplos → práctica → proyecto propio → retroalimentación → coherencia. La fundamentación y la revisión acompañan todo el recorrido.</p></details></div>
    <details className="rg-map-details" open={mapOpen} onToggle={event=>setMapOpen(event.currentTarget.open)}><summary>Mapa de las siete etapas · puedes entrar en cualquiera</summary><nav className="rg-stage-map" aria-label="Etapas del proyecto">{JOURNEY_STAGES.map((stage,n)=>{
      const ids=stage.ids.filter(id=>selectedIds.includes(id)), reviewed=ids.filter(id=>isLessonReviewed(records[id])).length;
      const next=ids.find(id=>!isLessonReviewed(records[id])) || stage.ids[0];
      return <button type="button" key={stage.id} aria-current={current.id===stage.id ? 'step' : undefined} onClick={()=>onOpen(next,0)}><span className="rg-stage-number">0{n+1}</span><strong>{stage.title}</strong><small>{reviewed} de {ids.length} revisados en tu ruta</small></button>;
    })}</nav></details>
    <div className="rg-next"><Compass aria-hidden="true"/><div><span>Siguiente paso sugerido</span><h3>{suggestion.title}</h3><p>{suggestion.why}</p></div><button type="button" className="rl-primary" onClick={()=>onOpen(suggestion.id,suggestion.step)}>Seguir sugerencia <ArrowRight aria-hidden="true"/></button></div>
    <details className="rg-decisions"><summary>Mis decisiones y apoyos · {METHOD_CHOICES.find(([id])=>id===(guide.route || 'undecided'))?.[1]}</summary>
      <div className="rl-pair"><label className="rl-field">Ruta metodológica que deseo explorar<small>La pregunta y la evidencia deben justificarla. Las demás rutas permanecen disponibles.</small><select value={guide.route || 'undecided'} onChange={event=>onGuideChange({...guide,route:event.target.value})}>{METHOD_CHOICES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className="rl-field">Cómo quiero trabajar<small>Puedes cambiar la ayuda en cualquier momento; esta preferencia no mide tu nivel.</small><select value={guide.support || 'guided'} onChange={event=>onGuideChange({...guide,support:event.target.value})}>{SUPPORT_LEVELS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
      <p className="rl-caption">{SUPPORT_LEVELS.find(([id])=>id===(guide.support || 'guided'))?.[2]} {guide.route==='mixto' && 'La ruta mixta incluye las bases cuantitativas, cualitativas y su integración.'}</p>
      <Field label="Por qué considero esta ruta" value={guide.reason} onChange={reason=>onGuideChange({...guide,reason})} help="Conecta pregunta, objetivo y evidencia necesaria; si aún no decides, explica qué te falta contrastar."/>
      <Field label="Qué alternativa comparé y qué sigue pendiente" value={guide.alternative} onChange={alternative=>onGuideChange({...guide,alternative})}/>
      <div className="rl-actions"><button type="button" onClick={saveDecision}>Registrar decisión provisional</button><button type="button" onClick={()=>onOpen('diseno',0)}>Comparar enfoques antes de decidir</button></div>{notice && <p role="status">{notice}</p>}
      {!!guide.decisions?.length && <details><summary>Historia de mis decisiones ({guide.decisions.length})</summary>{guide.decisions.map((row,n)=><article className="rg-decision" key={n}><strong>{METHOD_CHOICES.find(([id])=>id===row.route)?.[1]}</strong><small>{new Date(row.at).toLocaleDateString('es-CL')}</small><p>{row.reason}</p><p><strong>Alternativa y pendientes: </strong>{row.alternative}</p></article>)}</details>}
    </details>
    {!!due.length && <div className="rg-recall-queue"><RotateCcw aria-hidden="true"/><div><strong>Retomar lo aprendido</strong><p>Estos repasos tienen una fecha alcanzada. Intenta reconstruir la idea antes de volver al ejemplo.</p><div className="rl-actions">{due.map(row=><button type="button" key={row.id} onClick={()=>onOpen(row.id,2)}>Repasar {row.title.toLowerCase()}</button>)}</div></div></div>}
    <details className="rg-project-support"><summary>Apoyos para mi tesis · equipo, calendario y materiales</summary><p>Abre estos apoyos cuando los necesites y vuelve a construir tu tesis desde el mismo apartado.</p><div className="rg-crosslinks">{onTeam && <button type="button" onClick={onTeam}><Users aria-hidden="true"/> Revisar con mi equipo</button>}{onArchive && <button type="button" onClick={onArchive}>Consultar calendario y archivo</button>}</div></details>
    <details className="rg-evidence"><summary>Por qué aprendemos así · 12 estudios y 3 recursos de diseño</summary><p>Estas fuentes orientan las actividades. Su aplicación al aprendizaje de tesis es una adaptación que requiere evaluación propia. Consulta el alcance de cada estudio; confianza, satisfacción y desempeño se examinan por separado.</p><div className="rg-evidence-grid">{PEDAGOGY_EVIDENCE.map(row=><article key={row.id}><p className="rl-eyebrow">{row.title}</p><h3>{row.label}</h3><p>{row.kind}</p><p><strong>En esta aula: </strong>{row.application}</p><p className="rl-caption">{row.limit}</p><details><summary>Referencia y lectura</summary><p>{row.citation}</p><a href={row.url} target="_blank" rel="noopener noreferrer">Consultar fuente original</a></details><button type="button" onClick={()=>onOpen(row.module,row.step)}>{row.action} <ArrowRight aria-hidden="true"/></button></article>)}</div></details>
  </section>;
}

export function ModuleGuide({lesson,records,onOpen}) {
  const stage=stageFor(lesson.id), connections=moduleConnections(lesson.id,records);
  return <details className="rg-module-guide"><summary><Lightbulb aria-hidden="true"/> Para qué sirve este módulo en mi proyecto</summary><p><strong>{stage.question}</strong></p><p>Producto de esta etapa: {stage.product} {stage.bridge}</p>{!!connections.length && <><p>Conecta este apartado con:</p><div className="rl-actions">{connections.map(row=><button type="button" key={row.id} onClick={()=>onOpen(row.id,3)}>{row.title} · {row.hasDraft ? 'con desarrollo' : 'por desarrollar'}</button>)}</div></>}<p className="rl-caption">Puedes explorar sin completar estas conexiones. Al registrar coherencia, explica qué depende todavía de otra decisión.</p></details>;
}

export function BooleanPracticeLab() {
  const [inner,setInner]=useState('OR'),[outer,setOuter]=useState('AND'),[grouping,setGrouping]=useState('left');
  const result=simulateBoolean(inner,outer,grouping);
  return <section className="rg-boolean-lab" aria-label="Laboratorio booleano con registros ficticios"><h4>Prueba la lógica con seis registros</h4><p>Índice de entrenamiento completamente ficticio. Solo busca en las etiquetas visibles; no consulta bases académicas ni alimenta tu flujo real.</p><div className="rg-operators"><label>Entre los sinónimos<select value={inner} onChange={e=>setInner(e.target.value)}><option>OR</option><option>AND</option></select></label><label>Entre conceptos<select value={outer} onChange={e=>setOuter(e.target.value)}><option>AND</option><option>OR</option></select></label><label>Paréntesis<select value={grouping} onChange={e=>setGrouping(e.target.value)}><option value="left">Agrupar estrés y stress</option><option value="right">Agrupar stress y estudiantes</option></select></label></div><pre>{result.query}</pre><p role="status"><strong>{result.matches.length} de 6 registros ficticios</strong> coinciden. Compara cuáles entran o salen y explica la causa.</p><ul className="rg-training-docs">{TRAINING_DOCUMENTS.map(row=><li key={row.id} data-matched={result.matches.includes(row.id)}><strong>{row.id} · {row.title}</strong><small>Etiquetas: {row.terms.join(', ')}</small><span>{result.matches.includes(row.id) ? 'Incluido en este ensayo' : 'Fuera de este ensayo'}</span></li>)}</ul></section>;
}

export function PracticeStudio({lesson,record,guide,onChange,onNavigate,onSupportChange}) {
  const learning=record.learning || {}, support=guide.support || 'guided';
  const [hint,setHint]=useState(0),[model,setModel]=useState(false),[notice,setNotice]=useState('');
  const setLearning=patch=>onChange({learning:{...learning,...patch}});
  const markBeforeHelp=()=>{if (record.practice?.trim() && !learning.beforeHelp) setLearning({beforeHelp:{answer:record.practice,reason:learning.reason || ''}});};
  function saveAttempt() {
    if (!record.practice?.trim() || !learning.reason?.trim() || !learning.alternative?.trim()) {setNotice('Registra tu respuesta, sus razones y la alternativa considerada antes de guardar el intento.');return;}
    if ((learning.attempts || []).length>=40) {setNotice('Ya hay 40 intentos conservados. Exporta el cuaderno; tu respuesta actual sigue guardándose.');return;}
    const entry={at:new Date().toISOString(),answer:record.practice,reason:learning.reason,alternative:learning.alternative,support,help:hint>0 || model || !!learning.beforeHelp};
    const last=learning.attempts?.at(-1);
    if(last && ['answer','reason','alternative','support','help'].every(key=>last[key]===entry[key])) {setNotice('Este intento ya está conservado. Revisa tu respuesta o continúa al proyecto.');return;}
    setLearning({attempts:[...(learning.attempts || []),entry]});setNotice('Intento conservado. Puedes editar la respuesta actual y guardar otra versión para comparar.');
  }
  return <div className="rg-practice">
    <p className="rl-caption">Antes de comenzar: este es un ejercicio de entrenamiento. Tus respuestas y revisiones se guardan en el cuaderno; no producen resultados de investigación.</p>
    <Field label="Mi meta para esta práctica" value={learning.goal} onChange={goal=>setLearning({goal})} help="Qué quieres poder explicar o decidir al terminar."/>
    <div className="rg-support"><label className="rl-field">Ayuda que quiero usar ahora<select value={support} onChange={e=>onSupportChange?.(e.target.value)}>{SUPPORT_LEVELS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><p>{support==='guided' ? 'Puedes revisar el ejemplo y después resolver el caso con pistas.' : 'Intenta resolver primero. Abre una pista o el ejemplo cuando lo necesites.'}</p><button type="button" onClick={()=>onNavigate(1)}>Ver un ejemplo explicado</button></div>
    {lesson.id==='booleanas' && <BooleanPracticeLab/>}
    <h4>Tu desafío</h4><p>{lesson.practice}</p>
    <Field label="Mi respuesta al ejercicio" value={record.practice} onChange={practice=>onChange({practice})}/>
    <Field label="Por qué tomé esta decisión" value={learning.reason} onChange={reason=>setLearning({reason})} help="Explica el vínculo entre la evidencia, el criterio y tu respuesta."/>
    <Field label="Qué alternativa consideré" value={learning.alternative} onChange={alternative=>setLearning({alternative})} help="Por qué la descartas, la conservas o todavía no puedes decidir."/>
    <div className="rl-actions"><button type="button" disabled={hint>=2} onClick={()=>{markBeforeHelp();setHint(n=>n+1);}}>Pedir una pista{hint ? ' más' : ''}</button><button type="button" disabled={!record.practice?.trim()} onClick={()=>{markBeforeHelp();setModel(true);}}>Contrastar con una orientación</button></div>
    {hint>0 && <aside className="rl-notice"><h4>Una pista para pensar</h4><p>{lesson.coherence[0]}</p>{hint>1 && <p>Reconstruye el procedimiento: {lesson.steps.slice(0,3).join(' ')}</p>}</aside>}
    {model && <div className="rl-notice"><h4>Una vía de resolución</h4><p>{lesson.model}</p><p>Compara las razones de tu respuesta; después decide qué revisar. Esta orientación no califica tu intento.</p></div>}
    <label className="rl-field">Cómo me resultó el desafío<small>Es una percepción para elegir apoyo, no una nota de aprendizaje.</small><select value={learning.difficulty || ''} onChange={e=>setLearning({difficulty:e.target.value})}><option value="">Quiero decidir después</option><option value="need-help">Necesito más apoyo</option><option value="some-doubt">Pude avanzar, con dudas</option><option value="ready">Quiero intentar con menos ayuda</option></select></label>
    {learning.difficulty==='need-help' && <p className="rl-notice">La guía sugiere volver al ejemplo o contrastar la primera pista con tu respuesta. Puedes elegir seguir practicando.</p>}
    <div className="rl-actions"><button type="button" onClick={saveAttempt}>Conservar este intento</button><button type="button" className="rl-primary" onClick={()=>onNavigate(3)}>Aplicar lo aprendido a mi proyecto <ArrowRight aria-hidden="true"/></button></div>{notice && <p role="status">{notice}</p>}
    {(learning.beforeHelp || learning.attempts?.length>0) && <details className="rg-attempts"><summary>Comparar mi razonamiento y mis intentos</summary>{learning.beforeHelp && <article><h4>Lo que había escrito antes de consultar ayuda</h4><p>{learning.beforeHelp.answer}</p><p>{learning.beforeHelp.reason || 'Todavía no había registrado razones.'}</p></article>}{(learning.attempts || []).map((row,n)=><article key={n}><h4>Intento {n+1}</h4><small>{new Date(row.at).toLocaleDateString('es-CL')} · {row.help ? 'Con apoyo consultado' : 'Sin pistas consultadas en este registro'}</small><p>{row.answer}</p><p><strong>Razones: </strong>{row.reason}</p><p><strong>Alternativa: </strong>{row.alternative}</p></article>)}</details>}
    {learning.due && <RecallPractice lesson={lesson} learning={learning} onChange={setLearning} onCompleted={()=>setNotice('Repaso registrado. Puedes elegir una nueva fecha en Comprobar coherencia.')}/>}
  </div>;
}

function RecallPractice({lesson,learning,onChange,onCompleted}) {
  const [reveal,setReveal]=useState(false);
  return <section className="rg-recall"><h4>Recuperar sin mirar</h4><p>Repaso previsto para {learning.due}. Reconstruye qué es «{lesson.title}», para qué sirve y una decisión clave. Intenta responder antes de volver a la explicación.</p><Field label="Lo que recuerdo y puedo explicar" value={learning.recall} onChange={recall=>onChange({recall})}/><button type="button" disabled={!learning.recall?.trim()} onClick={()=>setReveal(true)}>Contrastar mi recuerdo</button>{reveal && <><p className="rl-notice">{lesson.definition}</p><Field label="Qué recuperé y qué necesito corregir" value={learning.recallReflection} onChange={recallReflection=>onChange({recallReflection})}/><button type="button" disabled={!learning.recallReflection?.trim()} onClick={()=>{onChange({due:''});onCompleted();}}>Registrar este repaso</button></>}</section>;
}

export function TransferPractice({lesson,record,onChange}) {
  const learning=record.learning || {}, exercise=TRANSFER_CASES[stageFor(lesson.id).id];
  const [hint,setHint]=useState(false);
  const update=patch=>onChange({learning:{...learning,...patch}});
  return <details className="rg-transfer"><summary>Transferir: una situación nueva y un próximo repaso</summary><p>Ensaya primero sin ayudas. El caso es ficticio y no reemplaza el desarrollo de tu investigación.</p><p><strong>{exercise.prompt}</strong></p><Field label="Mi decisión ante la situación nueva" value={learning.transfer} onChange={transfer=>update({transfer})}/><Field label="Fundamento, límite y conexión con mi proyecto" value={learning.transferReason} onChange={transferReason=>update({transferReason})}/><button type="button" onClick={()=>setHint(true)}>Abrir una pista para esta situación</button>{hint && <p className="rl-notice">{exercise.hint}</p>}<p className="rl-caption">Revisa con un par: ¿la decisión responde al caso?, ¿las razones la sostienen?, ¿reconoce una alternativa y un límite? El registro conserva tu evidencia; no asigna una nota automática.</p><label className="rl-field">Cuándo quiero volver a recuperar este concepto<small>Elige otra sesión para practicar de nuevo. La fecha aparecerá en tu ruta al entrar; no se enviarán notificaciones.</small><input type="date" min={localDate()} value={learning.due || ''} onChange={e=>update({due:e.target.value})}/></label></details>;
}

export function JourneyNavigation({selected,records,onOpen,query=''}) {
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  const filtered=JOURNEY_STAGES.map(stage=>({...stage,lessons:stage.ids.map(id=>LESSONS.find(row=>row.id===id)).filter(row=>normalize(row.title+' '+stage.title).includes(normalize(query)))})).filter(stage=>stage.lessons.length);
  return <>{filtered.map((stage)=><div key={stage.id}><h2>{JOURNEY_STAGES.indexOf(JOURNEY_STAGES.find(row=>row.id===stage.id))+1}. {stage.title}</h2>{stage.lessons.map(row=><button key={row.id} type="button" onClick={()=>onOpen(row.id,0)} aria-current={selected===row.id ? 'step' : undefined}><span>{row.title}</span>{recordState(row,records[row.id])!=='Por explorar' && <small>{recordState(row,records[row.id])}</small>}</button>)}</div>)}{!filtered.length && <p className="rl-caption">No encontramos ese módulo. Prueba otra palabra.</p>}</>;
}
