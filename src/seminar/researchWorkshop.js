// This script runs inside the existing seminar document and shares its saved state.
const researchVersion = 1;
const workshopState = state.researchWorkshop || (state.researchWorkshop = { tab: 'rebuild', step: 0, data: {} });
workshopState.data ||= {};
let workshopNotice = '';
const reviewChecks = [
  'El documento contiene el desarrollo solicitado; revisamos más que el título o la plantilla.',
  'Contrastamos las afirmaciones con las fuentes y los criterios de esta tarea.',
  'Comprobamos su coherencia con las decisiones vigentes del proyecto.',
  'Abrimos el enlace y comprobamos que lleva a la versión revisada.'
];
function safeEvidence(value) { try { const url = new URL(String(value).trim()); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname; } catch { return false; } }
function researchSave() { localStorage.setItem('ruta-state-v2', JSON.stringify(state)); }
function researchField(name, label, placeholder = '', type = 'textarea') {
  const value = workshopState.data[name] || '';
  return `<label>${label}${type === 'textarea' ? `<textarea data-research="${name}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>` : `<input type="${type}" data-research="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}">`}</label>`;
}
function researchSelect(name, label, options) {
  return `<label>${label}<select data-research="${name}"><option value="">Seleccionar…</option>${options.map(o => `<option value="${esc(o)}" ${workshopState.data[name] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
}
function taskReview(i,j) { return state[key(i,'taskReview'+j)] || {}; }
function taskIsVerified(i,j) {
  const review = taskReview(i,j);
  return !!state[key(i,'task'+j)] && review.version === researchVersion && review.checks?.length === reviewChecks.length && review.checks.every(Boolean)
    && !!review.reviewer?.trim() && !!review.reason?.trim() && safeEvidence(state[key(i,'taskEvidence'+j)])
    && review.draft === (state[key(i,'guideDraft'+j)] || '') && review.evidence === (state[key(i,'taskEvidence'+j)] || '');
}
function feedbackIsVerified(item) {
  return !!(item.product?.trim() && item.origin?.trim() && item.observation?.trim() && item.foundation?.trim() && item.action?.trim() && item.owner?.trim() && item.before?.trim() && item.after?.trim() && item.reason?.trim() && item.verification?.trim() && item.reviewer?.trim() && item.reviewDate && safeEvidence(item.evidence))
    && ['Aceptada','Aceptada parcialmente','Rechazada con fundamento'].includes(item.decision);
}
function stageIsVerified(i) {
  const s = stages[i];
  return s.tasks.every((_,j)=>taskIsVerified(i,j)) && s.evidence.every((_,j)=>safeEvidence(state[key(i,'ev'+j)]))
    && !(state[key(i,'feedback')]||[]).some(item => item.status !== 'Verificada y cerrada' || !feedbackIsVerified(item));
}
function renderTaskReview() {
  const refresh=()=>{updateProgress();renderNav();$('#dateStatus').textContent=stageIsVerified(current)?'Criterios de cierre revisados por el equipo':status(stages[current]);const label=$('#taskGuide .learn-step');if(label)label.textContent=`Paso ${selectedTask+1} de ${stages[current].tasks.length} · ${taskIsVerified(current,selectedTask)?'verificado':'en construcción'}`;};
  $('#guideDraft')?.addEventListener('input',refresh);
  $('#taskEvidence')?.addEventListener('input',refresh);
  if (taskPhase !== 4) return;
  const i=current,j=selectedTask,r=taskReview(i,j),container=document.createElement('section');
  container.className='research-review';container.id='researchTaskReview';
  container.innerHTML=`<h5>Revisión de contenido antes del cierre</h5><p>El equipo confirma estos criterios. El enlace y el texto se guardan como la versión revisada; cambiar cualquiera de ellos requiere verificar de nuevo.</p>${state[key(i,'task'+j)]&&!taskIsVerified(i,j)?'<p class="research-note">Hay un cierre anterior conservado. Falta registrar su revisión con estos criterios.</p>':''}${reviewChecks.map((c,n)=>`<label class="research-check"><input type="checkbox" data-review-check="${n}" ${r.checks?.[n]?'checked':''}><span>${c}</span></label>`).join('')}<label>Nombre de quien revisó<input id="taskReviewer" value="${esc(r.reviewer||'')}" placeholder="Integrante que contrastó el contenido"></label><label>¿Qué se comprobó y qué cambió?<textarea id="taskReviewReason" placeholder="Describe una comprobación concreta y la corrección realizada, o por qué se conserva la versión.">${esc(r.reason||'')}</textarea></label><div id="taskReviewStatus" class="research-status" role="status" aria-live="polite"></div>`;
  $('#taskGuide .task-tutor-screen').appendChild(container);
  const persist=()=>{const prior=taskReview(i,j);state[key(i,'taskReview'+j)]={...prior,checks:[...container.querySelectorAll('[data-review-check]')].map(el=>el.checked),reviewer:$('#taskReviewer').value,reason:$('#taskReviewReason').value};researchSave();refresh();};
  container.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',persist));
  const complete=$('#completeTask');if(complete)complete.textContent='Registrar revisión y cerrar paso →';
}
function confirmTaskReview(i,j) {
  const draft=state[key(i,'guideDraft'+j)]||'', evidence=state[key(i,'taskEvidence'+j)]||'', review=taskReview(i,j);
  const missing=[];
  if(!draft.trim())missing.push('el desarrollo de la tarea');
  if(!safeEvidence(evidence))missing.push('un enlace completo y válido a la evidencia');
  if(review.checks?.length!==reviewChecks.length||!review.checks.every(Boolean))missing.push('las cuatro comprobaciones de contenido');
  if(!review.reviewer?.trim())missing.push('quién revisó');
  if(!review.reason?.trim())missing.push('qué se comprobó y qué cambió');
  if(missing.length){const target=$('#taskReviewStatus');if(target){target.className='research-status research-error';target.textContent='Falta registrar: '+missing.join('; ')+'.';target.scrollIntoView({block:'center'});}return false;}
  state[key(i,'taskReview'+j)]={...review,version:researchVersion,draft,evidence,reviewedAt:new Date().toISOString()};
  return true;
}
function renderFeedbackReview() {
  const items=state[key(current,'feedback')]||[];
  document.querySelectorAll('#feedbackList .feedback-item').forEach((box,index)=>{
    box.querySelector('.research-review')?.remove();
    const item=items[index],panel=document.createElement('section');panel.className='research-review';
    const fields=[['before','Antes de la observación','Versión, fragmento o decisión previa.'],['after','Resultado de la decisión','Cambio realizado; si no se incorpora, explica qué se conserva.'],['reason','Justificación del equipo','Criterio, fuente o argumento que sostiene la decisión.'],['verification','Qué verificó la persona revisora','Qué observó al comparar ambas versiones y revisar las consecuencias.']];
    panel.innerHTML=`<h5>Del comentario a un cambio comprobable</h5>${fields.map(([name,label,placeholder])=>`<label>${label}<textarea data-feedback-review="${name}" placeholder="${placeholder}">${esc(item[name]||'')}</textarea></label>`).join('')}<label>Fecha de revisión<input type="date" data-feedback-review="reviewDate" value="${esc(item.reviewDate||'')}"></label><p class="research-status ${feedbackIsVerified(item)?'research-success':''}" role="status">${feedbackIsVerified(item)?'El registro reúne los campos de verificación. El equipo puede marcarlo como verificado y cerrado.':item.status==='Verificada y cerrada'?'Cierre anterior conservado; faltan datos de verificación para considerarlo vigente.':'Para cerrar, completa antes, resultado, justificación, revisión, fecha, revisor/a y un enlace a la evidencia.'}</p>`;
    box.appendChild(panel);
    panel.querySelectorAll('[data-feedback-review]').forEach(el=>el.onchange=()=>{item[el.dataset.feedbackReview]=el.value;researchSave();renderFeedbackReview();});
  });
}

// Correct the verified assessment/sprint mapping without moving saved tasks.
stages[6].short='Formativa 1 · Sprint 2';
stages[6].title='Sprint 2: vacíos, delimitación, pregunta y aporte';
stages[6].tasks[0][0]='Leer la pauta de Formativa 1 U2: Sprint 2';
stages[6].tasks[0][1]='Distinguir el nombre de la evaluación, el sprint y las claves internas del equipo.';
stages[6].tasks[6][1]='Respaldar el nicho de investigación con al menos tres fuentes académicas pertinentes.';
stages[6].tasks[8][1]='Aplicar PICO o SPIDER según la lógica del estudio y explicar el aporte científico y social en un párrafo.';
stages[6].evidence[8]='Informe de avance del Sprint 2';
stages[6].resources.unshift(['PSIC0901_FORMATIVA1_U2','Pauta revisada: Sprint 2; vacío con al menos 3 papers, población/fenómeno/contexto, pregunta y aporte.']);
stages[6].alert='La Formativa 1 U2 pide el Sprint 2. Las claves históricas SEIA-S1 identifican registros previos, pero no cambian esta correspondencia. El informe requiere 2–5 carillas y evidencia de trabajo colaborativo. Verifica el plazo en la plataforma.';
stages[8].short='Formativa 2 · Sprint 3';
stages[8].title='Sprint 3: antecedentes, pregunta y objetivos';
stages[8].tasks[0][0]='Leer la pauta de Formativa 2 U2: Sprint 3';
stages[8].tasks[1][0]='Revisar el Sprint 2 y formular un proto-objetivo';
stages[8].tasks[9][1]='Objetivo general: verbo de conocimiento, concepto, fenómeno, población y contexto. Al menos tres específicos cognitivos.';
stages[8].resources.unshift(['PSIC0901_FORMATIVA2_U2','Pauta revisada: Sprint 3; borrador del planteamiento, pregunta refinada, objetivos y referencias.']);
stages[8].alert='Esta entrega se construye sobre el problema y la pregunta revisados del Sprint 2. Puede explorarse mientras se corrige la base; las inconsistencias abiertas deben quedar identificadas. Confirma el plazo en la plataforma.';
stages[10].short='Formativa 3 · Revisión';
stages[10].resources.unshift(['PSIC0901_FORMATIVA3_U2','Revisión entre pares antes de la Sumativa U2 y sistematización individual. No asigna aquí un nuevo número de sprint.']);
stages[10].alert='Formativa 3 U2: preparar el MVP, revisar con pares y entregar la sistematización individual. El número de evaluación no equivale al número de sprint.';
stages[9].tasks[1][1]='Pregunta PICO/SPIDER tentativa, concepto de análisis y mapa de 3 papers para los vacíos y 3 para la viabilidad, con su función explicitada.';
stages[9].alert='La pauta Formativa 3 pide explicitar los antecedentes que sostienen el vacío y los que sostienen la viabilidad. Conserva el material presentado y confirma fecha y plazo en la plataforma.';

const stageMap=document.createElement('details');stageMap.className='research-map view-section view-orientation';stageMap.id='researchStageMap';$('#viewNav').after(stageMap);
function renderStageMap(){
  stageMap.innerHTML=`<summary>Ubicar esta etapa: unidad, evaluación y sprint</summary><p>Una unidad reúne actividades; una evaluación pide un producto; un sprint organiza un ciclo de trabajo. Las claves internas ayudan a localizar archivos y no sustituyen la pauta.</p><div class="research-table-wrap"><table class="research-table"><thead><tr><th>Referencia</th><th>Correspondencia revisada</th><th>Resultado esperado</th></tr></thead><tbody><tr><td>Revisión inicial / registros históricos S1</td><td>Base bibliográfica que se revisa antes del Sprint 2</td><td>Búsqueda trazable, lectura comparada y decisiones fundamentadas. Su equivalencia administrativa debe contrastarse con la pauta de origen.</td></tr><tr><td>Formativa 1 · Unidad 2</td><td><strong>Sprint 2</strong></td><td>Vacío respaldado por ≥3 papers, población/fenómeno/contexto, pregunta preliminar y aporte.</td></tr><tr><td>Formativa 2 · Unidad 2</td><td><strong>Sprint 3</strong></td><td>Antecedentes, pregunta refinada, objetivo general, ≥3 objetivos específicos y referencias.</td></tr><tr><td>Formativa 3 · Unidad 2</td><td>Revisión cruzada y sistematización individual</td><td>MVP, revisión de pares y bitácora individual. No se deduce un sprint del número 3.</td></tr></tbody></table></div><p class="map-source">Correspondencias contrastadas con PSIC0901_FORMATIVA1_U2, PSIC0901_FORMATIVA2_U2 y PSIC0901_FORMATIVA3_U2. Las fechas visibles conservan el recorrido registrado; los plazos vigentes se confirman en la plataforma.</p><div class="research-note">Antes de avanzar, revisa que los artículos, el fenómeno, la pregunta y el aporte describan la misma investigación. Guarda las decisiones todavía abiertas.</div>`;
}
const workshopEntry=document.createElement('button');workshopEntry.className='research-entry';workshopEntry.id='openResearchWorkshop';workshopEntry.innerHTML='Taller de investigación<small>Reconstruir, contrastar y justificar decisiones</small>';$('#nav').before(workshopEntry);
const workshopSection=document.createElement('section');workshopSection.id='researchWorkshop';workshopSection.className='card workshop view-section view-practice';$('.layout').before(workshopSection);
const normalRenderView=renderView;
renderView=function(){
  if(currentView!=='practice'){normalRenderView();return;}
  document.body.dataset.view='practice';localStorage.setItem('ruta-view-v2','practice');
  $('#viewTitle').textContent='Taller de investigación';$('#viewDescription').textContent='Practica con un caso ficticio y aplica los criterios a tu propio proyecto.';$('#viewNav').innerHTML='';$('#viewCounter').textContent='';
  $('#previousView').disabled=false;$('#previousView').style.opacity=1;$('#nextBtn').disabled=false;$('#nextBtn').style.opacity=1;$('#nextBtn').textContent='Volver a la etapa →';
};
workshopEntry.onclick=()=>{currentView='practice';renderView();renderWorkshop();window.scrollTo({top:0,behavior:'smooth'});};
const standardPrevious=$('#previousView').onclick;
$('#previousView').onclick=()=>{if(currentView==='practice'){currentView='orientation';render();}else standardPrevious();};
$('#nextBtn').onclick=()=>{
  if(currentView==='practice'){currentView='orientation';render();return;}
  const index=views.findIndex(v=>v.id===currentView);
  if(index<views.length-1){currentView=views[index+1].id;renderView();window.scrollTo({top:0,behavior:'smooth'});return;}
  if(stageIsVerified(current)){advanceStage();return;}
  const s=stages[current],pending=s.tasks.filter((_,j)=>!taskIsVerified(current,j)).length,missing=s.evidence.filter((_,j)=>!safeEvidence(state[key(current,'ev'+j)])).length,feedback=(state[key(current,'feedback')]||[]).filter(item=>item.status!=='Verificada y cerrada'||!feedbackIsVerified(item)).length;
  $('#stageGateText').textContent=`Quedan ${pending} pasos sin revisión vigente, ${missing} evidencias generales sin enlace válido y ${feedback} observaciones abiertas. Puedes explorar la etapa siguiente; esta permanece abierta.`;$('#stageGate').classList.add('show');$('#stageGate').scrollIntoView({behavior:'smooth',block:'center'});
};
const dossiers=[
  {id:'a',title:'A · Registro de búsqueda',body:'La bitácora conserva base de datos, fecha, cadena exacta, filtros, resultados y razones de inclusión. Los textos consultados se distinguen de los resúmenes pendientes.',suggestion:'Conservar',feedback:'Esta pieza permite reconstruir la búsqueda. Se conserva su trazabilidad y se comprueba su pertinencia frente al foco que adopte el equipo.'},
  {id:'b',title:'B · Conclusión de la matriz',body:'Un estudio recoge que 18 de 20 participantes se sintieron más seguros tras practicar. La matriz concluye: «Se demostró una mejora de regulación metacognitiva». No hay registros del razonamiento ni evaluación externa.',suggestion:'Reformular',feedback:'El hallazgo permite describir seguridad percibida. La conclusión metacognitiva excede lo observado. Se puede conservar el antecedente y reformular la afirmación.'},
  {id:'c',title:'C · Pregunta del borrador',body:'El problema propone comprender cómo estudiantes revisan sus decisiones ante nueva información. La pregunta del informe es: «¿Cuánto les gusta la plataforma a los estudiantes?».',suggestion:'Reformular',feedback:'La satisfacción evalúa una experiencia con el dispositivo. Para el problema declarado hace falta una pregunta sobre el proceso de revisión y fundamentación de decisiones.'},
  {id:'d',title:'D · Promesa del aporte',body:'El informe promete que el uso de la plataforma reducirá la deserción universitaria. El proyecto no produce datos de permanencia, abandono ni seguimiento longitudinal.',suggestion:'Retirar',feedback:'Esta promesa no puede sostenerse con los datos previstos. Retirarla del aporte esperado permite delimitar lo que el estudio sí podría conocer.'},
  {id:'e',title:'E · Archivo de correcciones',body:'Existe un Word con título, código de tarea y una sección vacía «Desarrollo de correcciones». La tarjeta figura como terminada porque el enlace abre.',suggestion:'Reformular',feedback:'La estructura puede aprovecharse, pero falta el desarrollo. Reabrir y reformular su estado conserva el registro sin atribuirle una corrección que no contiene.'}
];
const workshopTabs=[['rebuild','Reconstruir un sprint'],['choice','Elegir un tema'],['search','Buscar y leer'],['evidence','Contrastar evidencia'],['coherence','Revisar coherencia']];
function rebuildContent(){
  const step=workshopState.step||0,d=workshopState.data;
  let content='';
  if(step===0)content=`<p>Un equipo tiene artículos, archivos y tarjetas cerradas. Antes de ampliar el proyecto, necesita decidir si esas piezas sostienen una misma investigación.</p><div class="research-note"><strong>Expediente ficticio para practicar.</strong> Los datos y documentos de este caso son inventados. No representan resultados de la tesis del equipo.</div>${researchField('initial','Antes de ver el expediente, ¿cómo decidirías si el sprint está bien construido?','Explica qué revisarías y qué te haría cambiar de opinión.')}<p>La respuesta inicial se conserva durante este intento para compararla con tu razonamiento final.</p>`;
  if(step===1)content=`<div class="research-summary"><strong>Tu criterio inicial</strong>${esc(d.initial||'')}</div><p>Lee cada pieza, decide qué hacer con ella y explica tu criterio. Puedes conservar partes de un documento aunque debas revisar su conclusión.</p>${dossiers.map(x=>`<article class="research-panel"><span class="tag">${x.title}</span><p>${x.body}</p>${researchSelect('decision_'+x.id,'Decisión sobre '+x.title,['Conservar','Reformular','Retirar'])}${researchField('reason_'+x.id,'Fundamento de la decisión '+x.id.toUpperCase(),'¿Qué contenido sirve y qué falta, contradice o excede la evidencia?')}</article>`).join('')}`;
  if(step===2)content=`<p>Contrasta ahora tus decisiones con estas orientaciones. Una elección distinta puede ser defendible si su fundamento responde al expediente.</p>${dossiers.map(x=>`<article class="research-panel"><h4>${x.title}</h4><p><strong>Tu decisión:</strong> ${esc(d['decision_'+x.id]||'Sin registrar')}</p><p>${esc(d['reason_'+x.id]||'')}</p><div class="feedback-answer"><strong>Orientación: ${x.suggestion.toLowerCase()}.</strong> ${x.feedback}</div></article>`).join('')}${researchField('reconsider','¿Qué decisión mantendrías o revisarías después del contraste?','Nombra el antecedente que cambió o sostuvo tu criterio.')}<p>El registro conserva tanto tu decisión inicial como esta revisión.</p>`;
  if(step===3)content=`<div class="research-summary"><strong>Tu criterio al comenzar</strong>${esc(d.initial||'')}</div>${researchField('final_question','Formula una pregunta coherente con el fenómeno del caso','Por ejemplo: cómo se revisan y fundamentan decisiones ante información nueva. No copies una respuesta sin explicar por qué.')}<div class="research-grid"><div>${researchField('bridge','¿Qué piezas deben actualizarse antes del siguiente sprint?','Relaciona matriz, problema, pregunta y aporte.')}</div><div>${researchField('next_evidence','¿Qué evidencia faltaría para cerrar?','Indica el producto concreto y quién debería revisarlo.')}</div></div>${researchField('reflection','¿Cómo cambió tu razonamiento y por qué?','Compara tu criterio inicial con la decisión actual; si lo mantienes, explica qué lo sostuvo.')}<div class="research-note">Registrar una respuesta correcta no demuestra por sí solo regulación metacognitiva. Aquí conservas la decisión inicial, el antecedente considerado y la revisión justificada. Su calidad requiere interpretación y revisión.</div>${workshopState.completedAt?`<p class="research-success">Intento registrado el ${esc(new Date(workshopState.completedAt).toLocaleDateString('es-CL'))}. Puedes seguir revisándolo y exportarlo.</p>`:''}`;
  return `<h3>Reconstruir un sprint</h3><div class="workshop-stepbar">${['Criterio inicial','Examinar piezas','Contrastar decisiones','Reconstruir'].map((t,i)=>`<button type="button" data-rebuild-step="${i}" class="${i===step?'active':''}" ${i>(workshopState.maxStep||0)?'disabled':''}>${i+1} · ${t}</button>`).join('')}</div>${content}<div class="research-actions"><button type="button" id="rebuildBack" ${step===0?'disabled':''}>← Anterior</button><button type="button" id="rebuildNext" class="primary">${step<3?'Continuar →':'Guardar reconstrucción'}</button></div>`;
}
function choiceContent(){return `<h3>Elegir y justificar un tema</h3><p>Compara temas diferentes o versiones del mismo tema. Explica su relevancia psicológica, el conocimiento que aportarían y si puedes investigarlos con el tiempo y acceso disponibles.</p>${[1,2,3].map(n=>`<div class="research-panel"><h4>Alternativa ${n}</h4>${researchField('topic_'+n,'Tema o versión '+n,'Formulación breve','text')}<div class="research-grid"><div>${researchField('relevance_'+n,'Pertinencia y aporte de la alternativa '+n,'¿Qué fenómeno psicológico permitiría comprender?')}</div><div>${researchField('feasibility_'+n,'Viabilidad de la alternativa '+n,'Acceso, participantes, tiempo y datos necesarios.')}</div></div>${researchSelect('topic_decision_'+n,'Decisión sobre la alternativa '+n,['Elegida provisionalmente','Descartada','Requiere más antecedentes'])}${researchField('topic_reason_'+n,'Razón de elección o descarte '+n,'Compara con las demás; evita decidir solo por preferencia.')}</div>`).join('')}<div class="research-note">El inventario permite reconstruir la decisión. Una opción descartada puede revisarse si aparece nueva evidencia.</div>`;}
function searchContent(){return `<h3>De la búsqueda a una síntesis defendible</h3><p>Empieza por un registro reproducible. Después compara qué estudió cada fuente y qué permite sostener. La síntesis debe mostrar relaciones entre hallazgos.</p><div class="research-panel"><h4>1 · Registrar la búsqueda</h4><div class="research-grid"><div>${researchField('search_base','Base o repositorio consultado','','text')}${researchField('search_date','Fecha de búsqueda','','date')}</div><div>${researchField('search_focus','Población, fenómeno y contexto','Separa los conceptos que orientan la consulta.')}</div></div>${researchField('search_terms','Descriptores y sinónimos ES/EN','Agrupa sinónimos y justifica los conceptos.')}${researchField('search_chain','Cadena exacta, filtros y resultados','Conserva AND/OR, paréntesis, ventana temporal, cantidad de resultados y versión de la búsqueda.')}${researchField('search_selection','Selección, duplicados y motivos de exclusión','Explica cómo pasaste de los resultados iniciales al conjunto que leerás.')}</div><div class="research-panel"><h4>2 · Comparar las fuentes</h4><p>Esta ficha de práctica no sustituye el tamaño del corpus exigido en la pauta. Añade el análisis completo al documento de trabajo.</p>${[1,2,3].map(n=>`<details><summary>Fuente ${n} · acceso, hallazgo y límite</summary>${researchField('source_ref_'+n,'Referencia y enlace de fuente '+n,'Referencia comprobada y enlace/DOI.')}${researchSelect('source_access_'+n,'Alcance de lectura '+n,['Texto completo consultado','Solo resumen/metadatos','Citado por otra fuente; original pendiente'])}${researchField('source_method_'+n,'Qué estudió, con quiénes y cómo '+n,'Distingue el diseño, la muestra y la medida utilizada.')}${researchField('source_result_'+n,'Hallazgo que puedes respaldar '+n,'Indica la página o sección pertinente cuando corresponda.')}${researchField('source_limit_'+n,'Límite e interpretación del equipo '+n,'Distingue una limitación del estudio de una limitación de tu acceso al texto.')}</details>`).join('')}</div><div class="research-panel"><h4>3 · Construir una síntesis</h4>${researchField('search_synthesis','Patrones, diferencias y pregunta que permanece abierta','¿Qué se conoce, qué se conoce parcialmente y qué no puedes afirmar con estas lecturas?')}${researchField('search_product','Enlace al registro completo de búsqueda y matriz','','url')}</div>`;}
const evidenceCases=[
  {id:'perception',title:'Percepción y proceso de aprendizaje',body:'Caso ficticio: 18 de 20 estudiantes dicen sentirse más seguros tras practicar. No se observó cómo planificaron, supervisaron o revisaron sus decisiones.',prompt:'¿Qué permite afirmar este resultado y qué evidencia adicional necesitarías?',feedback:'Permite describir seguridad percibida en ese grupo. Para estudiar regulación metacognitiva se necesitan indicadores pertinentes del proceso y una estrategia de análisis; la percepción no equivale a esa evidencia.'},
  {id:'device',title:'Dispositivo y fenómeno psicológico',body:'Un equipo puede preguntar «¿Es fácil usar la plataforma?» o «¿Cómo revisan los estudiantes sus decisiones al recibir información contradictoria?».',prompt:'¿Qué objeto de estudio tiene cada pregunta y cuál responde a una investigación sobre regulación del razonamiento?',feedback:'La primera pregunta examina usabilidad. La segunda se orienta a un proceso psicológico. Ambas pueden ser legítimas, pero exigen objetivos, datos e interpretaciones diferentes.'},
  {id:'gap',title:'Vacío y alcance de la búsqueda',body:'Un equipo no encontró resultados con su primera cadena de búsqueda y escribió: «No existen investigaciones sobre este fenómeno».',prompt:'¿Qué revisarías antes de sostener ese vacío?',feedback:'Conviene revisar términos, bases, filtros y pertinencia de los estudios recuperados. Un nicho se argumenta comparando lo que la literatura cubre y sus límites. Para la Formativa 1 U2 debe respaldarse con al menos tres papers.'}
];
function evidenceContent(){return `<h3>Contrastar antes de afirmar</h3><p>Responde primero. Luego abre la orientación y deja una revisión razonada. Son situaciones de práctica, no resultados de estudios reales.</p>${evidenceCases.map(x=>`<article class="research-panel"><h4>${x.title}</h4><p>${x.body}</p>${researchField('evidence_initial_'+x.id,x.prompt,'Explica qué evidencia respalda tu interpretación.')}<button class="btn" type="button" data-evidence-reveal="${x.id}">Contrastar mi respuesta</button>${workshopState['reveal_'+x.id]?`<div class="feedback-answer">${x.feedback}</div><div class="research-summary"><strong>Respuesta inicial al abrir el contraste</strong>${esc(workshopState['initial_'+x.id]||'')}</div>${researchField('evidence_revision_'+x.id,'¿Qué mantienes o cambias y por qué?','Relaciona tu revisión con la evidencia que hacía falta.')}`:''}</article>`).join('')}`;}
const coherenceRows=[['literature','Literatura','Qué hallazgo respalda cada afirmación y qué no permite concluir.'],['phenomenon','Fenómeno y concepto','Qué proceso psicológico estudiarás y desde qué definición.'],['question','Pregunta','Qué quieres conocer, en quiénes y bajo qué condiciones.'],['objectives','Objetivos','Qué conocimiento producirán y cómo responden a la pregunta.'],['contribution','Aporte','Qué comprensión puede ofrecer el estudio dentro de sus límites.']];
function coherenceContent(){return `<h3>Una formulación vigente y defendible</h3><p>Compara los documentos que realmente usa el equipo. La coincidencia de palabras ayuda a orientarse; la revisión debe comprobar el significado y la función de cada concepto.</p>${coherenceRows.map(([id,label,hint])=>`<div class="research-panel"><h4>${label}</h4><p>${hint}</p><div class="research-coherence-row"><div>${researchField('coherence_text_'+id,'Formulación vigente: '+label,'Resume la versión que el equipo propone sostener.')}</div><div>${researchField('coherence_evidence_'+id,'Fuente o documento de respaldo: '+label,'Nombre, versión, enlace y pasaje pertinente.')}</div><div>${researchSelect('coherence_status_'+id,'Resultado de revisión: '+label,['Coherente con las demás piezas','Requiere ajuste','Evidencia insuficiente'])}</div><div>${researchField('coherence_action_'+id,'Decisión y consecuencia: '+label,'Qué se conserva o cambia y qué otros documentos afecta.')}</div></div></div>`).join('')}${researchField('coherence_reviewer','Revisión cruzada','Quién revisó, cuándo y qué discrepancias quedan abiertas.')}<div class="research-actions"><button id="checkCoherence" type="button" class="primary">Revisar pendientes de la matriz</button></div><p class="research-note">Esta comprobación identifica campos y decisiones pendientes. La coherencia científica la juzga el equipo con sus fuentes y revisión docente.</p>`;}
function renderWorkshop(){
  const content={rebuild:rebuildContent,choice:choiceContent,search:searchContent,evidence:evidenceContent,coherence:coherenceContent};
  if(!content[workshopState.tab])workshopState.tab='rebuild';
  workshopSection.innerHTML=`<div class="eyebrow">Aprender a investigar · decisiones con fundamento</div><div class="workshop-tabs" aria-label="Actividades del taller">${workshopTabs.map(([id,label])=>`<button type="button" data-workshop-tab="${id}" aria-pressed="${workshopState.tab===id}" class="${workshopState.tab===id?'active':''}">${label}</button>`).join('')}</div>${content[workshopState.tab]()}<div id="workshopStatus" class="research-status" role="status" aria-live="polite">${esc(workshopNotice)}</div><div class="research-actions"><button type="button" id="saveWorkshop">Guardar trabajo del taller</button><button type="button" id="exportWorkshop">Exportar taller</button><button type="button" id="backToStage">Volver a mi etapa</button></div><p class="scope-note">Los borradores se conservan en este navegador. Exporta el registro y vincula el producto en Drive para compartirlo con el equipo.</p>`;
  workshopSection.querySelectorAll('[data-workshop-tab]').forEach(el=>el.onclick=()=>{workshopState.tab=el.dataset.workshopTab;workshopNotice='';researchSave();renderWorkshop();});
  workshopSection.querySelectorAll('[data-research]').forEach(el=>el.oninput=()=>{workshopState.data[el.dataset.research]=el.value;researchSave();});
  // Preserve the initial criterion once the learner has examined the dossier.
  if((workshopState.maxStep||0)>0&&workshopSection.querySelector('[data-research="initial"]'))workshopSection.querySelector('[data-research="initial"]').readOnly=true;
  workshopSection.querySelectorAll('[data-rebuild-step]').forEach(el=>el.onclick=()=>{workshopState.step=Number(el.dataset.rebuildStep);workshopNotice='';researchSave();renderWorkshop();});
  if($('#rebuildBack'))$('#rebuildBack').onclick=()=>{workshopState.step--;workshopNotice='';researchSave();renderWorkshop();};
  if($('#rebuildNext'))$('#rebuildNext').onclick=()=>{
    const step=workshopState.step||0,d=workshopState.data;
    const required=step===0?['initial']:step===1?dossiers.flatMap(x=>['decision_'+x.id,'reason_'+x.id]):step===2?['reconsider']:['final_question','bridge','next_evidence','reflection'];
    if(required.some(k=>!d[k]?.trim())){const msg=$('#workshopStatus');msg.textContent='Completa las decisiones y sus fundamentos antes de continuar.';msg.className='research-status research-error';msg.scrollIntoView({block:'center'});return;}
    if(step<3){workshopState.step++;workshopState.maxStep=Math.max(workshopState.maxStep||0,workshopState.step);workshopNotice='';}else{workshopState.completedAt=new Date().toISOString();workshopNotice='Reconstrucción guardada. El registro conserva la respuesta inicial y tu revisión razonada.';}
    researchSave();renderWorkshop();workshopSection.scrollIntoView({block:'start',behavior:'smooth'});
  };
  workshopSection.querySelectorAll('[data-evidence-reveal]').forEach(el=>el.onclick=()=>{
    const id=el.dataset.evidenceReveal,answer=workshopState.data['evidence_initial_'+id];
    if(!answer?.trim()){const msg=$('#workshopStatus');msg.textContent='Escribe tu interpretación antes de abrir el contraste.';msg.className='research-status research-error';msg.scrollIntoView({block:'center'});return;}
    if(!workshopState['reveal_'+id])workshopState['initial_'+id]=answer;
    workshopState['reveal_'+id]=true;researchSave();renderWorkshop();
  });
  if($('#checkCoherence'))$('#checkCoherence').onclick=()=>{const pending=coherenceRows.filter(([id])=>!workshopState.data['coherence_text_'+id]?.trim()||!workshopState.data['coherence_evidence_'+id]?.trim()||!workshopState.data['coherence_action_'+id]?.trim()||workshopState.data['coherence_status_'+id]!=='Coherente con las demás piezas').map(([,label])=>label);const msg=$('#workshopStatus');msg.textContent=pending.length?'Revisión abierta en: '+pending.join(', ')+'.':!workshopState.data.coherence_reviewer?.trim()?'Falta registrar la revisión cruzada.':'La matriz tiene sus campos completos y decisiones registradas como coherentes por el equipo. Revisa el argumento integrado con sus fuentes.';msg.scrollIntoView({block:'center'});};
  $('#saveWorkshop').onclick=()=>{researchSave();$('#workshopStatus').textContent='Trabajo guardado en este navegador.';};
  $('#exportWorkshop').onclick=()=>downloadResearch({tipo:'Taller de investigación',caso:'Expediente ficticio para práctica',version:researchVersion,exportado:new Date().toISOString(),taller:workshopState},'taller-investigacion.json');
  $('#backToStage').onclick=()=>{currentView='orientation';render();};
}
function downloadResearch(value,name){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#exportBtn').onclick=()=>downloadResearch({exportado:new Date().toISOString(),curso:'Ruta de Seminario',criterio:'Los estados de cierre representan comprobaciones registradas por el equipo; no sustituyen la evaluación académica.',taller:workshopState,etapas:stages.map((s,i)=>({etapa:s.title,periodo_registrado:s.dates,cierre_verificado:stageIsVerified(i),proceso_transversal:transversalPractices.map((p,j)=>({practica:p[0],realizada:!!state[key(i,'cross'+j)]})),evidencia_proceso:state[key(i,'processLink')]||'',retroalimentacion:(state[key(i,'feedback')]||[]).map(item=>({...item,verificacion_vigente:feedbackIsVerified(item)&&item.status==='Verificada y cerrada'})),tareas:s.tasks.map((t,j)=>({tarea:t[0],completa:taskIsVerified(i,j),marca_previa:!!state[key(i,'task'+j)],borrador:state[key(i,'guideDraft'+j)]||'',evidencia:state[key(i,'taskEvidence'+j)]||'',revision:taskReview(i,j)})),evidencias:s.evidence.map((e,j)=>({evidencia:e,enlace:state[key(i,'ev'+j)]||''})),bitacora:state[key(i,'notes')]||''}))},'registro-ruta-seminario.json');
// Remember the stage as users navigate, including from the workshop.
const standardRender=render;
render=function(){localStorage.setItem('ruta-current-v2',current);standardRender();};
