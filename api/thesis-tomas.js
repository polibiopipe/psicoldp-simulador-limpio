import { createClient } from '@supabase/supabase-js';
import { readAccessConsent } from '../src/engine/accessConsentPolicy.js';
import { generateLocalPatientResponse } from '../src/engine/localMiniAI.js';
import { createDecisionEvidence } from '../src/engine/decisionEvidence.js';
import { validateStudyCommand, STUDY_ENGINE_VERSION, studyMessages, normalizeStudyPreparation, buildStudyClosure } from '../src/thesis/studyModel.js';

export function createStudyHandler({ clientFactory = createClient, respond = generateLocalPatientResponse } = {}) {
 return async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  const send=(status,data)=>res.status(status).json(data);
  if(req.method!=='POST') { res.setHeader('Allow','POST'); return send(405,{error:'METHOD_NOT_ALLOWED'}); }
  try {
   const body=validateStudyCommand(typeof req.body==='string'?JSON.parse(req.body):req.body);
   const token=String(req.headers?.authorization||'').match(/^Bearer (\S+)$/i)?.[1];
   if(!token)return send(401,{error:'AUTH_REQUIRED',message:'Inicia sesión para acceder.'});
   const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
   if(!url||!key)return send(503,{error:'CONFIGURATION',message:'El acceso no está disponible temporalmente.'});
   const db=clientFactory(url,key,{auth:{persistSession:false}});
   const auth=await db.auth.getUser(token); const user=auth.data?.user;
   if(auth.error||!user)return send(401,{error:'AUTH_REQUIRED',message:'Tu sesión venció. Vuelve a ingresar.'});
   const profile=await db.from('user_profiles').select('approved').eq('id',user.id).maybeSingle();
   if(profile.error)throw new Error('PROFILE_LOOKUP_FAILED');
   if(!profile.data?.approved)return send(403,{error:'ACCESS_PENDING',message:studyMessages.ACCESS_PENDING});
   const access=await readAccessConsent(db,user.id);
   if(!access.receipt)return send(403,{error:'ACCESS_CONSENT_REQUIRED',message:'Revisa las condiciones de acceso antes de ingresar.'});
   if(body.action==='status'){
    const results=await Promise.all([
     db.from('thesis_tomas_settings').select('collection_enabled,protocol_version').eq('id',true).single(),
     db.from('thesis_tomas_slots').select('participant_code,slot').eq('user_id',user.id).maybeSingle(),
     db.from('thesis_tomas_sessions').select('*').eq('user_id',user.id).order('session_number')
    ]);
    if(results.some(r=>r.error))throw new Error('STUDY_LOOKUP_FAILED');
    return send(200,{settings:results[0].data,entry:results[1].data,sessions:(results[2].data||[]).map(({user_id,...row})=>row),capacity:50});
   }
   let payload={...body}; delete payload.action; delete payload.caseId;
   if(['turn','event','close','practice'].includes(body.action)){
    const current=await db.from('thesis_tomas_sessions').select('*').eq('id',body.sessionId).eq('user_id',user.id).maybeSingle();
    if(current.error)throw new Error('SESSION_LOOKUP_FAILED');
    if(!current.data)throw new Error('SESSION_NOT_FOUND');
    const session=current.data;
    if(body.action==='turn'){
     const question=String(body.question||'').trim(),id=String(body.turnId||'');
     if(!question||question.length>3000||!/^[\da-f-]{36}$/i.test(id))throw new Error('INVALID_TURN');
     const existing=session.conversation.find(turn=>turn.id===id);
     if(existing)return send(200,{session:((({user_id,...row})=>row)(session))});
     if(session.status!=='in_progress')throw new Error('SESSION_CLOSED');
     if(session.version!==body.version)throw new Error('VERSION_CONFLICT');
     if(Date.now()>new Date(session.started_at).getTime()+20*60000||session.conversation.length>=25)throw new Error('SESSION_LIMIT');
     const previous=session.session_number>1?await db.from('thesis_tomas_sessions').select('closure').eq('user_id',user.id).eq('session_number',session.session_number-1).maybeSingle():null;
     if(previous?.error)throw new Error('SESSION_LOOKUP_FAILED');
     const selectedInterventionType=String(body.selectedInterventionType||'').slice(0,150);
     const conversationStage=body.conversationStage&&JSON.stringify(body.conversationStage).length<4000?body.conversationStage:null;
     const result=respond({caseId:'tomas',studentMessage:question,history:session.conversation,difficulty:'intermedio',sessionNumber:session.session_number,selectedInterventionType,conversationStage,previousSessionSummary:previous?.data?.closure?.summary});
     if(!result?.responseText)throw new Error('RESPONSE_UNAVAILABLE');
     payload.turn={id,question,answer:result.responseText,createdAt:new Date().toISOString(),engineVersion:STUDY_ENGINE_VERSION,interventionType:selectedInterventionType};
    }
    if(body.action==='event' && !['initial','monitoring','revision'].includes(body.event?.stage))throw new Error('INVALID_ACTION');
    if(body.action==='event'){
     if(!/^[\da-f-]{36}$/i.test(body.event?.id||''))throw new Error('INVALID_ACTION');
     const existing=session.events.find(event=>event.id===body.event.id);
     if(existing)return send(200,{session:((({user_id,...row})=>row)(session))});
     payload.event=createDecisionEvidence(body.event||{}, {history:session.conversation,id:body.event.id});
    }
    if(body.action==='close'){
     const next=buildStudyClosure(session,body.closure||{});
     if(!next.rationale?.trim())throw new Error('CLOSURE_REQUIRED');
     payload.closure=next;
    }
    if(body.action==='practice'){
     if(session.status!=='completed')throw new Error('SESSION_CLOSED');
     if(!body.practice || typeof body.practice!=='object' || JSON.stringify(body.practice).length>200000)throw new Error('INVALID_ACTION');
     payload.practice=body.practice;
    }
   }
   if(body.action==='start'){
    const plan=normalizeStudyPreparation(body.preparation);
    if(!plan.evaluationObjective.trim()||!plan.processObjectives.trim())throw new Error('PREPARATION_REQUIRED');
    payload.preparation=plan;
   }
   const result=await db.rpc('thesis_tomas_command',{p_user:user.id,p_action:body.action,p_payload:payload});
   if(result.error)throw new Error(result.error.message);
   return send(200,body.action==='enroll'?{entry:result.data}:{session:result.data});
  }catch(error){
   const code=Object.keys(studyMessages).find(key=>String(error.message).includes(key));
   const validation=['INVALID_ACTION','CASE_NOT_ALLOWED','REQUEST_TOO_LARGE','INVALID_SESSION','INVALID_TURN','PREPARATION_REQUIRED','CLOSURE_REQUIRED'].find(key=>String(error.message).includes(key));
   return send(code?409:validation?400:503,{error:code||validation||'STUDY_UNAVAILABLE',message:code?studyMessages[code]:validation==='PREPARATION_REQUIRED'?'Completa tu objetivo y plan antes de comenzar.':validation==='CLOSURE_REQUIRED'?'Completa la decisión y su fundamento antes de cerrar.':'No pudimos completar la operación. Tu texto se conserva; vuelve a intentarlo.'});
  }
 };
}
export default createStudyHandler();
