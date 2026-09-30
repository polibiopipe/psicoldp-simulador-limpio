import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { DEEP_TEACHING, GUIDED_CASES } from './deepTeachingContent.js';
import { stageFor } from './learningJourney.js';

export function TeachingExplanation({ lesson }) {
  const content = DEEP_TEACHING[lesson.id];
  if (!content) return null;
  return <section className="ts-explanation"><h4>Comprender el razonamiento</h4><p>{content.explanation}</p><div className="ts-distinction"><Lightbulb aria-hidden="true"/><div><h5>Una distinción que cambia tus decisiones</h5><p>{content.distinction}</p></div></div></section>;
}

export function TeachingStudio({ lesson, record, onChange, onApply, onPlan }) {
  const [step, setStep] = useState(0);
  const content = DEEP_TEACHING[lesson.id];
  const task = GUIDED_CASES[stageFor(lesson.id).id];
  if (!content || !task) return null;
  const learning = record.learning || {};
  const change = patch => onChange({ learning: { ...learning, ...patch } });
  const fingerprint = JSON.stringify([learning.teachingChoice || '', learning.teachingReason || '']);
  const hasChoice = ['0', '1', '2'].includes(learning.teachingChoice);
  const canContrast = hasChoice && (learning.teachingReason || '').trim().length >= 10;
  const showFeedback = learning.teachingFeedbackFor === fingerprint;
  return <section className="ts-studio" aria-label="Ejemplo resuelto y decisión guiada">
    <p className="rl-eyebrow">OBSERVAR · RAZONAR · DECIDIR</p>
    <h4>Un ejemplo resuelto, paso a paso</h4>
    <p>Situación hipotética para aprender. Sus afirmaciones y decisiones no son hallazgos de tu investigación.</p>
    <nav className="ts-steps" aria-label="Pasos del ejemplo">{content.walkthrough.map((row, index) => <button key={index} type="button" aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}>Paso {index + 1}</button>)}</nav>
    <div className="ts-worked"><span className="rl-eyebrow">DECISIÓN {step + 1} DE {content.walkthrough.length}</span><h5>{content.walkthrough[step].action}</h5><p>{content.walkthrough[step].reason}</p>{step < content.walkthrough.length - 1 && <button type="button" onClick={() => setStep(step + 1)}>Ver la siguiente decisión</button>}</div>
    <div className="ts-challenge"><h4>Ahora decide tú</h4><p>{task.prompt}</p>
      <fieldset><legend>Elige una acción y explica tus razones</legend>{task.options.map((option, index) => <label key={index}><input type="radio" name={'teaching-' + lesson.id} value={String(index)} checked={learning.teachingChoice === String(index)} onChange={event => change({ teachingChoice: event.target.value })}/><span>{option}</span></label>)}</fieldset>
      <label>Mis razones antes de contrastar<textarea maxLength={4000} value={learning.teachingReason || ''} onChange={event => change({ teachingReason: event.target.value })} placeholder="¿Qué evidencia pedirías? ¿Qué alternativa descartas y por qué?"/></label>
      <button type="button" disabled={!canContrast} onClick={() => change({ teachingFeedbackFor: fingerprint })}>Contrastar esta decisión</button>
      {!canContrast && <small>Elige una opción y escribe tus razones para abrir la orientación.</small>}
      {showFeedback && <div className="ts-feedback" role="status"><h5>{Number(learning.teachingChoice) === task.answer ? 'Tu elección coincide con esta orientación' : 'Examina esta alternativa'}</h5><p><strong>{task.options[task.answer]}</strong></p><p>{task.feedback}</p><small>Esta orientación corresponde al caso didáctico; no califica la calidad de tu tesis.</small><label>Qué ajusto después de comparar<textarea maxLength={4000} value={learning.teachingRevision || ''} onChange={event => change({ teachingRevision: event.target.value })}/></label></div>}
      {!!learning.teachingFeedbackFor && !showFeedback && <p className="rl-notice">Cambiaste tu respuesta. Contrasta nuevamente esta versión.</p>}
    </div>
    <div className="rl-actions"><button type="button" className="rl-primary" onClick={onApply}>Llevar este aprendizaje a mi apartado</button><button type="button" onClick={onPlan}>Organizar este apartado en Kanban</button></div>
    <details className="ts-foundation"><summary>Por qué aprendemos de esta manera</summary><p>Los ejemplos resueltos hacen visible el razonamiento; explicar una decisión ayuda a contrastar la propia comprensión, y la retroalimentación ofrece información para revisarla. Esta secuencia adapta aportes de estas investigaciones; su eficacia en este simulador debe evaluarse con evidencia de aprendizaje.</p><ul><li><a href="https://doi.org/10.1007/s10648-019-09465-5" target="_blank" rel="noopener noreferrer">Sweller, van Merriënboer y Paas (2019): carga cognitiva y diseño de la enseñanza.</a></li><li><a href="https://doi.org/10.1007/s10648-018-9434-x" target="_blank" rel="noopener noreferrer">Bisra y colaboradores (2018): metaanálisis sobre autoexplicación.</a></li><li><a href="https://doi.org/10.3389/fpsyg.2019.03087" target="_blank" rel="noopener noreferrer">Wisniewski, Zierer y Hattie (2020): metaanálisis sobre retroalimentación.</a></li></ul></details>
  </section>;
}
