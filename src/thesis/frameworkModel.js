export const FRAMEWORK_VERSION='framework-method-v1';
export const FRAMEWORK_SEEDS=[
 ['monitoring','Monitoreo','Reconoce cómo avanza su comprensión y detecta discrepancias entre lo esperado y lo observado.'],
 ['uncertainty','Reconocimiento de incertidumbre','Explicita límites de información y aspectos que no puede concluir.'],
 ['search','Búsqueda de antecedentes','Busca información vinculada a una necesidad de comprensión identificable.'],
 ['contrast','Contraste de hipótesis','Examina interpretaciones alternativas y las relaciona con antecedentes.'],
 ['strategy','Regulación de estrategias','Fundamenta mantener o modificar la forma de explorar o abordar una decisión.'],
 ['justification','Fundamentación de decisiones','Relaciona una decisión con antecedentes, argumentos y límites.']
].map(([key,label,definition])=>({key,label,definition,origin:'deductive',version:1,status:'active',inclusion:'Exigir evidencia textual y contexto; interpretar según el episodio completo.',exclusion:'No inferir procesos psicológicos a partir de clics o frecuencia por sí solos.'}));
export function latestCategories(rows=[]){const byKey=new Map();for(const row of rows){const old=byKey.get(row.key);if(!old||row.version>old.version)byKey.set(row.key,row);}return [...byKey.values()];}
const value=text=>typeof text==='string'?text.trim():'';
export function frameworkSources({sessions=[],assessments=[],entries=[],feedback=[]}={}){
 const sources=[];const add=(item)=>{if(value(item.text))sources.push({...item,text:value(item.text)});};
 for(const s of sessions){
  const base={slot:s.slot,sourceType:'session',sourceId:s.id,version:s.version,sessionNumber:s.session_number};
  for(const key of ['evaluationObjective','processObjectives','priorityInformation','interviewJustification','sessionCountJustification'])add({...base,anchorId:`preparation:${key}`,label:`Preparación · ${{evaluationObjective:'Objetivo',processObjectives:'Plan de exploración',priorityInformation:'Información prioritaria',interviewJustification:'Fundamento de la entrevista',sessionCountJustification:'Fundamento de continuidad'}[key]}`,text:s.preparation?.[key],elicitation:'induced',time:s.started_at,timeBasis:'registrado_al_iniciar'});
  for(const [index,t] of (s.conversation||[]).entries()){add({...base,anchorId:`turn:${t.id}`,label:`Encuentro ${s.session_number} · Intervención ${index+1}`,text:t.question,patientAnswer:t.answer,elicitation:'indeterminate',time:t.createdAt,timeBasis:'registro_del_turno',opportunity:t.opportunity||null,position:index+1});}
  for(const e of s.events||[])add({...base,anchorId:`event:${e.id}`,label:`Bitácora · ${e.stage}`,text:[e.decision,e.rationale,e.uncertainty,e.alternative,e.trigger].filter(Boolean).join('\n'),elicitation:'induced',time:e.createdAt,timeBasis:'registro_de_bitacora',turnCount:e.turnCount});
  add({...base,anchorId:'closure:rationale',label:'Cierre · Fundamento',text:s.closure?.rationale,elicitation:'induced',time:s.ended_at,timeBasis:'registro_del_cierre'});
  for(const key of ['clinicalHypothesis','supportingData','missingData'])add({...base,anchorId:`closure:${key}`,label:`Cierre · ${{clinicalHypothesis:'Hipótesis',supportingData:'Antecedentes de apoyo',missingData:'Información faltante'}[key]}`,text:s.closure?.clinicalArtifacts?.[key],elicitation:'induced',time:s.ended_at,timeBasis:'registro_del_cierre'});
 }
 for(const a of assessments.filter(a=>a.status==='submitted'))add({slot:a.slot,sourceType:'assessment',sourceId:a.id,anchorId:'transcript',version:a.protocol_version,label:`Actuación externa · ${a.stage}`,text:a.response?.transcript,elicitation:a.stage==='interview'?'induced':'indeterminate',time:a.submitted_at,timeBasis:'envio_del_registro_no_tiempo_de_actuacion'});
 for(const e of entries.filter(e=>e.entry_type==='followup'))add({slot:e.slot,sourceType:'followup',sourceId:e.id,anchorId:'transcript',version:1,label:'Entrevista de profundización',text:e.payload?.transcript,elicitation:'induced',time:e.created_at,timeBasis:'incorporacion_del_registro'});
 for(const f of feedback)for(const key of ['reflection','rewrite'])add({slot:f.slot,sourceType:'feedback',sourceId:f.id,anchorId:key,version:f.feedback_version,label:`Ejercicio de retroalimentación · ${key==='reflection'?'Reflexión':'Segundo intento'}`,text:f.input?.[key],elicitation:'induced',time:f.generated_at,timeBasis:'generacion_de_la_devolucion'});
 return sources.sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
}
export function validateSourceReference(input,sources,slot){
 const source=sources.find(s=>s.slot===Number(slot)&&s.sourceType===input?.sourceType&&s.sourceId===input.sourceId&&s.anchorId===input.anchorId);
 const quote=value(input?.quote);if(!source||!quote||quote.length>4000||!source.text.includes(quote))throw new Error('Cada referencia requiere una cita exacta de una fuente del mismo participante.');
 return {...source,quote};
}
export function validateFrameworkEntry(input,{sources,categories}){
 const type=input.entryType,slot=Number(input.slot),note=value(input.note);
 if(!['coding','chart','memo','episode','followup','analysis_plan'].includes(type))throw new Error('Tipo de registro inválido.');
 if(type==='analysis_plan'){
  if(!['selection','evidence','alternatives','uncertainty'].includes(input.primaryCriterion)||note.length<40||note.length>8000)throw new Error('Define el criterio principal y fundamenta el plan.');
  return {entry_type:type,slot:null,category_id:null,payload:{method:'paired_t',primaryCriterion:input.primaryCriterion,note,validationReference:value(input.validationReference),assumptionsReview:value(input.assumptionsReview),status:input.status==='active'?'active':'draft'}};
 }
 if(!Number.isInteger(slot)||slot<1||slot>50||note.length<10||note.length>8000)throw new Error('Selecciona participante y fundamenta el registro (10 a 8.000 caracteres).');
 if(type==='followup'){
  const transcript=value(input.transcript);if(transcript.length<40||transcript.length>60000||input.declaration!==true||value(input.selectionReason).length<20)throw new Error('Incluye transcripción fiel, criterio de selección y declaración de procedencia.');
  return {entry_type:type,slot,category_id:null,payload:{transcript,selectionReason:value(input.selectionReason).slice(0,4000),recordingReference:value(input.recordingReference).slice(0,200),note,declaration:true}};
 }
 const category=categories.find(c=>c.id===input.categoryId);
 if(['coding','chart'].includes(type)&&(!category||category.status==='retired'))throw new Error('Selecciona una versión utilizable del marco analítico.');
 if(input.references&&!Array.isArray(input.references)||input.references?.length>12)throw new Error('Las referencias deben ser una lista de hasta doce citas.');
 const refs=(input.references||[]).map(ref=>validateSourceReference(ref,sources,slot));
 if(['coding','chart'].includes(type)&&!refs.length||type==='episode'&&refs.length<2||refs.length>12)throw new Error('Incluye referencias: al menos una para codificar o sintetizar y dos para reconstruir un episodio; máximo doce.');
 const referenceKeys=refs.map(r=>`${r.sourceType}|${r.sourceId}|${r.anchorId}|${r.quote}`);if(new Set(referenceKeys).size!==refs.length)throw new Error('No dupliques la misma cita en un registro.');
 if(type==='episode'&&new Set(refs.map(r=>`${r.sourceType}|${r.sourceId}|${r.anchorId}`)).size<2)throw new Error('Un episodio reconstruido requiere al menos dos fuentes o momentos distintos.');
 let elicitation=input.elicitation||'indeterminate';
 if(!['spontaneous','induced','indeterminate'].includes(elicitation))throw new Error('Origen de la respuesta inválido.');
 if(elicitation==='spontaneous'&&refs.some(r=>r.elicitation==='induced'))throw new Error('Una fuente solicitada mediante una consigna no puede registrarse como espontánea.');
 return {entry_type:type,slot,category_id:category?.id||null,payload:{note,references:refs,categoryKey:category?.key||null,categoryLabel:category?.label||null,categoryVersion:category?.version||null,elicitation,memoKind:['analytical','contradiction','negative_case','reflexivity','method_decision'].includes(input.memoKind)?input.memoKind:'analytical',sequenceNote:type==='episode'?value(input.sequenceNote).slice(0,4000):null}};
}
export function frameworkMatrix(slots,categories,entries){return slots.map(s=>({slot:s.slot,code:s.participant_code,cells:latestCategories(categories).filter(c=>c.status!=='retired').map(c=>{const related=entries.filter(e=>e.slot===s.slot&&e.payload?.categoryKey===c.key);const charts=related.filter(e=>e.entry_type==='chart').sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));return{key:c.key,label:c.label,categoryVersion:c.version,summary:charts.at(-1)||null,codings:related.filter(e=>e.entry_type==='coding'),history:charts};})}));}
