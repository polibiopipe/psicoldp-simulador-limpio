import { generateLocalPatientResponse } from '../engine/localMiniAI.js';
export const EXPLORATION_VERSION='tomas-exploration-v1';
export const CHALLENGES=[
 {id:'listen',title:'Escuchar sin apresurar',focus:'Abrir espacio para que Tomás precise su experiencia.',question:'¿Qué quisieras que comprendiera de lo que te está pasando?'},
 {id:'deepen',title:'Profundizar con cuidado',focus:'Explorar un antecedente sin convertir una suposición en certeza.',question:'¿En qué momentos notas que esto cambia?'},
 {id:'uncertainty',title:'Sostener la incertidumbre',focus:'Reconocer qué falta antes de concluir.',question:'¿Qué más necesitaríamos comprender para darle sentido a esto?'},
 {id:'close',title:'Cerrar dejando continuidad',focus:'Comprobar lo comprendido y acordar qué explorar después.',question:'¿Qué te gustaría que retomáramos en el próximo encuentro?'}
];
export const MICROSCENES=[
 {id:'silence',title:'Cuando aparece el silencio',tag:'Escucha y ritmo',opening:'No sé bien cómo explicar lo que me pasa…',context:'Tomás hace una pausa al comenzar a hablar. Decide cómo dar espacio sin completar su relato por él.',challenge:'listen'},
 {id:'avoidance',title:'«Prefiero no hablar de eso»',tag:'Autonomía y vínculo',opening:'De mi familia prefiero no hablar ahora.',context:'Tomás expresa un límite. Explora cómo respetarlo y mantener abierto el encuentro.',challenge:'deepen'},
 {id:'disagreement',title:'Una interpretación que no encaja',tag:'Revisar y contrastar',opening:'No creo que sea solamente por jugar. Con mis amigos online me siento menos juzgado.',context:'Tu primera lectura resulta incompleta. Escucha qué diferencia introduce Tomás sin asumir una explicación definitiva.',challenge:'uncertainty'},
 {id:'closure',title:'El encuentro está terminando',tag:'Síntesis y continuidad',opening:'Todavía me cuesta decir qué necesito, pero hay cosas que me gustaría seguir conversando.',context:'Quedan unos minutos. Construye una síntesis que Tomás pueda confirmar o corregir.',challenge:'close'}
];
export function explorationAllowed({entry,collectionEnabled,roles=[],assessments=[]}){
 if(entry)return ['pre','post','transfer','interview'].every(stage=>assessments.some(a=>a.stage===stage&&a.status==='submitted'));
 return !collectionEnabled||roles.length>0;
}
export function studentTurns(session){return (session?.conversation||[]).filter(t=>!t.isSessionPrelude&&t.question&&t.answer);}
export function replayMoment({session,turnId,rewrite,now=new Date().toISOString(),id=crypto.randomUUID()}){
 const all=session?.conversation||[],index=all.findIndex(t=>t.id===turnId);const original=all[index];const text=String(rewrite||'').trim();
 if(index<0||!original?.question||!original?.answer)throw new Error('Selecciona un intercambio completo.');
 if(!text||text.length>3000)throw new Error('Escribe una alternativa de hasta 3.000 caracteres.');
 const prefix=all.slice(0,index).map(t=>({...t}));
 const answer=generateLocalPatientResponse({caseId:'tomas',studentMessage:text,history:prefix,sessionNumber:session.session_number||1});
 if(!answer?.responseText)throw new Error('No se obtuvo respuesta. Conserva tu alternativa y reintenta.');
 return {id,version:EXPLORATION_VERSION,type:'replay',createdAt:now,sourceSessionId:session.id,sourceTurnId:turnId,original:{question:original.question,answer:original.answer,engineVersion:original.engineVersion||'unknown'},alternative:{question:text,answer:answer.responseText,engineVersion:'tomas-local-clinical-v1'},prefixTurnIds:prefix.map(t=>t.id).filter(Boolean),interpretation:'independent_practice_not_causal_comparison'};
}
export function createIntentionNote({session,turnId,intention,observation,nextStep,now=new Date().toISOString(),id=crypto.randomUUID()}){
 const turn=studentTurns(session).find(t=>t.id===turnId);if(!turn)throw new Error('Selecciona un intercambio real.');
 const values={intention,observation,nextStep};for(const [key,value] of Object.entries(values)){values[key]=String(value||'').trim();if(!values[key]||values[key].length>4000)throw new Error('Completa intención, observación y próximo intento (hasta 4.000 caracteres por campo).');}
 return {id,version:EXPLORATION_VERSION,type:'intention',createdAt:now,sourceSessionId:session.id,sourceTurnId:turnId,question:turn.question,answer:turn.answer,...values,interpretation:'student_reflection_not_validated_score'};
}
export function continuityCards(sessions){return sessions.filter(s=>s.status==='completed').map(s=>({sessionId:s.id,number:s.session_number,question:studentTurns(s).at(-1)?.question||'',answer:studentTurns(s).at(-1)?.answer||'',hypothesis:s.closure?.clinicalArtifacts?.clinicalHypothesis||'',rationale:s.closure?.rationale||'',nextQuestion:s.closure?.clinicalArtifacts?.missingData||'',summary:s.closure?.summary||null}));}
export function discoveryEntries(sessions,notes){
 const structured=sessions.flatMap(s=>(s.events||[]).map(e=>({id:`event:${e.id}`,type:'journal',createdAt:e.createdAt,sourceSessionId:s.id,title:e.decision,text:e.rationale,source:'Bitácora de la práctica'})));
 const reflections=notes.filter(n=>n.type==='intention'||n.type==='discovery').map(n=>({id:n.id,type:n.type,createdAt:n.createdAt,sourceSessionId:n.sourceSessionId,title:n.type==='intention'?n.intention:n.title,text:n.type==='intention'?n.observation:n.text,nextStep:n.nextStep||'',source:n.type==='intention'?'Intención y respuesta':'Descubrimiento personal'}));
 return [...structured,...reflections].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
}
export function loadExploration(userId,storage=globalThis.sessionStorage){try{const data=JSON.parse(storage?.getItem(`ev-exploration:v1:${userId}`)||'null');if(data?.version!==EXPLORATION_VERSION||!Array.isArray(data.notes))return{version:EXPLORATION_VERSION,notes:[],challenge:'listen',scene:null};return {...data,notes:data.notes.filter(n=>n&&typeof n.id==='string'&&typeof n.type==='string'),challenge:CHALLENGES.some(c=>c.id===data.challenge)?data.challenge:'listen',scene:data.scene&&Array.isArray(data.scene.conversation)&&Number.isFinite(Date.parse(data.scene.startedAt))?data.scene:null};}catch{return{version:EXPLORATION_VERSION,notes:[],challenge:'listen',scene:null};}}
export function saveExploration(userId,value,storage=globalThis.sessionStorage){if(!storage)throw new Error('El navegador no permite conservar este borrador. Descarga una copia antes de cerrar.');storage.setItem(`ev-exploration:v1:${userId}`,JSON.stringify(value));}
