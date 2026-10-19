export const RESEARCH_PROTOCOL = {
 version:'ev-tomas-research-draft-v4', status:'draft', source:'Protocolo_Operativo_Tesis_Escucha_Viva_34_43_v1',
 targetCompletePairs:34, recruitmentTarget:43, capacity:50, trainingSessions:2,
 primaryAggregationEnabled:false, rubricVersion:'clinical-reasoning-draft-v1', codebookVersion:'metacognition-draft-v1',
 methodology:{design:'Mixto convergente de orientación predominantemente comprensiva',quantitative:'Un grupo con mediciones pareadas pre–post',qualitative:'Framework Method con categorías deductivas y emergentes',integration:'Matrices conjuntas por participante y criterio',source:'Texto pegado(9).txt',sourceSha256:'765d67c3a6299184af5705c43604f40d2e86164cdc08660703f35f28e2b3a711'},
 validation:'Revisión experta, pilotaje y autorizaciones pendientes',
 phases:[
  {id:'eligibility',label:'Ingreso y elegibilidad'}, {id:'pre',label:'Evaluación inicial con actor'},
  {id:'ev1',label:'Primer encuentro con Tomás'}, {id:'ev2',label:'Segundo encuentro con Tomás'},
  {id:'post',label:'Evaluación final con actor'}, {id:'transfer',label:'Situación nueva'}, {id:'interview',label:'Entrevista de cierre'}
 ]
};
export const CLINICAL_RUBRIC=[
 {id:'selection',label:'Selección de antecedentes',levels:['No identifica antecedentes pertinentes.','Menciona antecedentes aislados sin explicar su relevancia.','Selecciona antecedentes relevantes para la decisión.','Integra y jerarquiza antecedentes y reconoce información ausente.']},
 {id:'evidence',label:'Relación entre evidencia e hipótesis',levels:['No argumenta la relación entre antecedentes e hipótesis.','Ofrece una explicación genérica sin vínculo claro con el caso.','Vincula antecedentes concretos con su hipótesis.','Vincula y contrasta coherentemente antecedentes e hipótesis.']},
 {id:'alternatives',label:'Consideración de alternativas',levels:['No considera alternativas cuando existía oportunidad.','Nombra una alternativa sin examinarla.','Examina una alternativa pertinente.','Compara alternativas con razones vinculadas al caso.']},
 {id:'uncertainty',label:'Reconocimiento de incertidumbre',levels:['Expresa certeza sin sustento suficiente.','Expresa dudas vagas sin precisar su alcance.','Reconoce límites relevantes de la información.','Justifica los límites y explicita qué motivaría revisar la decisión.']}
];
export const PROCESS_CODES=[
 {id:'planning',label:'Planificación',description:'Explicita propósito y estrategia para explorar información.'},
 {id:'missing_information',label:'Detección de información faltante',description:'Reconoce una ausencia o contradicción concreta.'},
 {id:'strategic_search',label:'Búsqueda estratégica',description:'Busca información para aclarar una incertidumbre explícita.'},
 {id:'hypothesis_contrast',label:'Contraste de hipótesis',description:'Examina alternativas con referencia a antecedentes.'},
 {id:'reasoned_control',label:'Mantener o revisar con fundamento',description:'Justifica el mantenimiento o la modificación de una interpretación.'},
 {id:'limits',label:'Reconocimiento de límites',description:'Delimita lo que puede concluir y lo que falta contrastar.'}
];
export const INTERVIEW_QUESTIONS=[
 '¿Qué antecedentes consideró más relevantes al comenzar y por qué?',
 '¿Hubo un momento en que sintió que necesitaba mayor información? ¿Qué buscaba aclarar?',
 'Cuando apareció información nueva, ¿qué hizo con su primera interpretación?',
 '¿Qué razones le permitieron mantener o modificar una decisión?',
 'En la situación nueva, ¿qué fue semejante y qué exigió una estrategia distinta?',
 '¿Hubo algo que creyera estar haciendo y que después notara que no quedó reflejado en su actuación?'
];
export function validateHumanRating(rating,assessment){
 const text=String(assessment?.response?.transcript||assessment?.response?.answer||'');
 const criteria={};
 for(const criterion of CLINICAL_RUBRIC){
  const value=rating?.criteria?.[criterion.id];
  if(!value)throw new Error('Completa los cuatro criterios.');
  if(value.score===null){if(!String(value.reason||'').trim())throw new Error('Justifica por qué un criterio no es evaluable.');criteria[criterion.id]={score:null,reason:String(value.reason).slice(0,1500)};continue;}
  if(!Number.isInteger(value.score)||value.score<0||value.score>3)throw new Error('Las puntuaciones válidas van de 0 a 3.');
  const quote=String(value.quote||'').trim(),reason=String(value.reason||'').trim();
  if(!quote||!text.includes(quote)||!reason)throw new Error('Cada puntuación requiere una cita exacta del registro y su fundamento.');
  criteria[criterion.id]={score:value.score,quote:quote.slice(0,2000),reason:reason.slice(0,2000),locator:String(value.locator||'').slice(0,150)};
 }
 return {rubricVersion:RESEARCH_PROTOCOL.rubricVersion,criteria,notes:String(rating.notes||'').slice(0,4000)};
}
export function criterionProfile(ratings){return CLINICAL_RUBRIC.map(c=>{const values=ratings.map(row=>row.criteria?.[c.id]?.score).filter(Number.isFinite);return {id:c.id,label:c.label,n:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};});}
export function pairProfiles(records){
 return records.flatMap(record=>CLINICAL_RUBRIC.map(c=>{const pre=record.pre?.criteria?.[c.id]?.score,post=record.post?.criteria?.[c.id]?.score;return{code:record.code,criterion:c.id,pre:Number.isFinite(pre)?pre:null,post:Number.isFinite(post)?post:null,delta:Number.isFinite(pre)&&Number.isFinite(post)?post-pre:null};}));
}
export function weightedKappa(pairs){
 const usable=pairs.filter(([a,b])=>Number.isInteger(a)&&a>=0&&a<=3&&Number.isInteger(b)&&b>=0&&b<=3);
 if(usable.length<2)return {n:usable.length,kappa:null,agreement:null};
 const a=[0,0,0,0],b=[0,0,0,0];let observed=0,exact=0;
 for(const[x,y]of usable){a[x]++;b[y]++;observed+=(x-y)**2/9;if(x===y)exact++;}
 let expected=0;for(let i=0;i<4;i++)for(let j=0;j<4;j++)expected+=(i-j)**2/9*(a[i]/usable.length)*(b[j]/usable.length);
 return {n:usable.length,kappa:expected?1-observed/usable.length/expected:null,agreement:exact/usable.length};
}
export function classifyStudyHelp(element){
 const candidate=element?.closest?.('.guide-trigger,.prep-assistant-show,.stage-suggestions-toggle,.prep-example-list button,[data-study-help]');
 if(!candidate)return null;
 return {kind:'help_open',resource:String(candidate.getAttribute?.('data-study-help')||candidate.closest?.('[data-guide-id]')?.getAttribute('data-guide-id')||candidate.className||'learning_help').slice(0,160)};
}
