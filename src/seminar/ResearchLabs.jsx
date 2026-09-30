import React, { useState } from 'react';
import { ArrowUpRight, BarChart3, MessagesSquare, Combine, BookOpen, Layers, Search, Users, Compass } from 'lucide-react';
import { METHOD_ROUTES, RESEARCH_READINGS } from './advancedLearningContent.js';
import { REFERENCES } from './learningContent.js';

export function LearningEntrances({ onOpen }) {
  return <nav className="rl-entrances" aria-label="Explorar el aula">
    {[
      ['busqueda', Search, 'Encontrar evidencia', 'Fuentes, cadenas y flujo de búsqueda', 'aqua'],
      ['diseno', Compass, 'Explorar metodología', 'Una pregunta, tres formas de estudiarla', 'lavender'],
      ['xp', Users, 'Investigar en equipo', 'XP, iteraciones y revisión en pares', 'sand']
    ].map(([id, Icon, title, detail, color]) => <button type="button" key={id} className={'rl-entrance rl-tone-' + color} onClick={() => onOpen(id)}><Icon aria-hidden="true"/><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight aria-hidden="true"/></button>)}
  </nav>;
}

export function MethodExplorer({ onOpen }) {
  const [selected, setSelected] = useState('cuantitativo');
  const route = METHOD_ROUTES.find(row => row.id === selected);
  const icons = [BarChart3, MessagesSquare, Combine];
  return <section className="rl-lab" aria-label="Laboratorio de enfoques">
    <p className="rl-eyebrow">EXPLORA · COMPARA · DECIDE</p><h4>Una situación, tres miradas</h4>
    <p>Situación ficticia: estudiantes revisan una decisión durante una simulación. Cambia de enfoque y observa qué pregunta y evidencia necesitarías.</p>
    <div className="rl-route-switch" aria-label="Enfoque para explorar">{METHOD_ROUTES.map((row,n) => { const Icon = icons[n]; return <button type="button" key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}><Icon aria-hidden="true"/>{row.label}</button>; })}</div>
    <div className="rl-route-content" aria-live="polite"><h4>{route.verb}</h4><blockquote>{route.question}</blockquote><div className="rl-pair"><div><h5>Qué evidencia buscaría</h5><p>{route.evidence}</p></div><div><h5>Cómo la analizaría</h5><p>{route.analysis}</p></div></div><p className="rl-boundary"><strong>Cuida esta distinción. </strong>{route.limit}</p></div>
    <button type="button" className="rl-primary" onClick={() => onOpen(route.id)}>Trabajar la ruta {route.label.toLowerCase()} <ArrowUpRight aria-hidden="true"/></button>
    <p className="rl-caption">Explorar una ruta no cambia ni aprueba el diseño de tu proyecto. Fundamento: estándares JARS de Psicología y Fetters, Curry y Creswell (2013); consulta las fuentes del apartado.</p>
  </section>;
}

export function ResearchReadingRoom() {
  return <section className="rl-reading-room"><h4>Lecturas que se convierten en práctica</h4><p>En cada lectura identifica el contexto, la propuesta y sus límites. Después elige qué adaptar a tu equipo.</p><div className="rl-source-grid">{RESEARCH_READINGS.map(row => <article key={row.ref}><span className="rl-reading-tag"><BookOpen aria-hidden="true"/>{row.tag}</span><h5>{REFERENCES[row.ref].label}</h5><p>{row.contribution}</p><details><summary>Mi pregunta de lectura</summary><p>{row.prompt}</p><small>{REFERENCES[row.ref].note}</small></details><a href={REFERENCES[row.ref].url} target="_blank" rel="noopener noreferrer">Abrir la referencia <ArrowUpRight aria-hidden="true"/></a></article>)}</div></section>;
}

export function PairReviewLab() {
  const [view, setView] = useState(0);
  const scenes = [
    ['Propuesta inicial', '«Cinco voluntarios disfrutaron la actividad; por tanto, todos mejoran su razonamiento».', 'Antes de seguir: ¿qué parte de esta afirmación está respaldada y cuál excede la evidencia?'],
    ['Pregunta del par', '«¿Se midió razonamiento o satisfacción? ¿Qué permite afirmar la selección de esos cinco voluntarios?»', 'La pregunta apunta al constructo y al alcance. No rechaza a la persona ni le entrega una conclusión inventada.'],
    ['Integración razonada', '«En este ejemplo ficticio, cinco voluntarios expresaron satisfacción. Aún no contamos con evidencia sobre cambios en el razonamiento».', 'La nueva versión limita la afirmación. Falta revisar el registro original y decidir qué evidencia adicional necesita el estudio.']
  ];
  return <section className="rl-lab rl-pair-lab" aria-label="Escena de revisión en pares"><p className="rl-eyebrow">UN ARGUMENTO EN TRES MOMENTOS</p><h4>Una pregunta puede mejorar una versión</h4><p className="rl-caption">Escena didáctica ficticia, sin participantes ni resultados reales.</p><div className="rl-scene-buttons">{scenes.map(([title],n) => <button type="button" aria-pressed={view === n} key={title} onClick={() => setView(n)}><span>{n+1}</span>{title}</button>)}</div><div aria-live="polite" className="rl-scene"><Layers aria-hidden="true"/><blockquote>{scenes[view][1]}</blockquote><p>{scenes[view][2]}</p></div></section>;
}
