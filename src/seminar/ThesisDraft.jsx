import React from 'react';
import { FileText, PencilLine } from 'lucide-react';
import { LESSONS, isLessonReviewed } from './learningContent.js';
import { JOURNEY_STAGES } from './learningJourney.js';

const teamWorkshops = new Set(['xp', 'iteracion', 'pares']);
export function thesisSections(records = {}) {
  return JOURNEY_STAGES.flatMap(stage => stage.ids).filter(id => !teamWorkshops.has(id)).map(id => {
    const lesson = LESSONS.find(row => row.id === id), record = records[id] || {};
    return { lesson, record };
  }).filter(({ lesson, record }) => lesson.fields.some(field => record.fields?.[field.key]?.trim()));
}
export function thesisText(records = {}) {
  const sections = thesisSections(records);
  if (!sections.length) return '';
  return 'MI TESIS EN CONSTRUCCIÓN\nBorrador de trabajo. Revisa e integra los apartados según las pautas de tu investigación.\n\n' + sections.map(({lesson,record}) =>
    lesson.title.toLocaleUpperCase('es') + '\n' + (isLessonReviewed(record) ? 'Revisión personal vigente' : 'Pendiente de revisión personal') + '\n\n' +
    lesson.fields.map(field => field.label + '\n' + (record.fields?.[field.key]?.trim() || '[Pendiente de desarrollar]')).join('\n\n') +
    '\n\nFuente y respaldo\n' + (record.source?.trim() || '[Pendiente de registrar]')
  ).join('\n\n────────────────────\n\n') + '\n';
}

export function ThesisDraft({records,onEdit,open,onToggle,onDownload}) {
  const sections = thesisSections(records);
  return <details className="rl-thesis-draft" open={open} onToggle={event => onToggle(event.currentTarget.open)}>
    <summary><FileText aria-hidden="true"/> Mi tesis en construcción <span>{sections.length} {sections.length === 1 ? 'apartado con escritura propia' : 'apartados con escritura propia'}</span></summary>
    <p>Aquí se reúnen los apartados que escribes en «Aplicar a mi investigación» y sus fuentes. Lee cómo se conectan, vuelve a editarlos y descarga el borrador para integrarlo según las pautas de tu tesis.</p>
    {!sections.length ? <div className="rl-notice"><p>Tu primer apartado aparecerá aquí cuando escribas tu propuesta. La guía te acompaña desde el tema y la intención de conocimiento.</p><button type="button" onClick={() => onEdit('tema',0)}>Comenzar por mi tema</button></div> : <>
      <button type="button" onClick={onDownload}>Descargar borrador de mi tesis</button>
      <p className="rl-caption">Borrador de trabajo: los apartados con texto pueden tener campos pendientes. La revisión personal requiere contrastar fuentes y criterios.</p>
      {sections.map(({lesson,record}) => <article key={lesson.id} className="rl-thesis-section"><header><div><h3>{lesson.title}</h3><small>{isLessonReviewed(record) ? 'Revisión personal vigente' : 'Pendiente de revisión personal'}</small></div><button type="button" onClick={() => onEdit(lesson.id,3)}><PencilLine aria-hidden="true"/> Editar apartado</button></header><details><summary>Leer mi desarrollo</summary>{lesson.fields.map(field => <div key={field.key}><h4>{field.label}</h4><p>{record.fields?.[field.key]?.trim() || 'Pendiente de desarrollar'}</p></div>)}<h4>Fuente y respaldo</h4><p>{record.source?.trim() || 'Pendiente de registrar'}</p></details></article>)}
    </>}
  </details>;
}
