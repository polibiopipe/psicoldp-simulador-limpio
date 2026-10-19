import { pedagogicalGuides,PEDAGOGICAL_GUIDES_VERSION } from '../src/data/pedagogicalGuides.js';
import { randomUUID,createHash } from 'node:crypto';
import { FRAMEWORK_VERSION,frameworkSources,frameworkMatrix,validateFrameworkEntry } from '../src/thesis/frameworkModel.js';
import { createClient } from '@supabase/supabase-js';
import { readAccessConsent } from '../src/engine/accessConsentPolicy.js';
import { RESEARCH_PROTOCOL, CLINICAL_RUBRIC, PROCESS_CODES, INTERVIEW_QUESTIONS, validateHumanRating } from '../src/thesis/researchProtocol.js';
import { ACTOR_CASES, STANDARD_INFORMATION } from '../server/thesisResearchCases.js';
import { buildJointDisplay, latestRatings } from '../server/researchData.js';
const uuid=value=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value||'');
const bounded=(value,max=4000)=>String(value||'').trim().slice(0,max);
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function blindTask(assignment,assessment,ownRating){return {assignmentId:assignment.id,code:assignment.blind_code,transcript:assessment.response?.transcript||assessment.response?.answer||'',ownRating:ownRating?{criteria:ownRating.criteria,notes:ownRating.notes,version:ownRating.version}:null};}
export function validateResponse(response,stage){
 const transcript=bounded(response?.transcript,60000);
 if(transcript.length<40)fail('Incluye el registro completo de la actuación o entrevista (al menos 40 caracteres).');
 const result={transcript,recordingReference:bounded(response?.recordingReference,200),declaration:response?.declaration===true};
 if(!result.declaration)fail('Confirma la procedencia y las condiciones del registro.');
 if(stage==='interview')result.answers=INTERVIEW_QUESTIONS.map((_,i)=>bounded(response?.answers?.[i],8000));
 return result;
}
export function validateEpisode(input,session){
 if(!PROCESS_CODES.some(c=>c.id===input.code))fail('Selecciona un código del manual.');
 const turn=session.conversation?.find(t=>t.id===input.anchorId),event=session.events?.find(e=>e.id===input.anchorId);
 const anchor=turn?.question|| (event?JSON.stringify(event):'');const quote=bounded(input.quote,2000);
 if(!quote||!anchor.includes(quote))fail('La cita debe pertenecer al turno del estudiante o a su bitácora.');
 if(!['spontaneous','induced','indeterminate'].includes(input.source)||event&&input.source==='spontaneous')fail('Una respuesta a la bitácora estructurada se registra como inducida o indeterminada.');
 if(input.opportunityId&&!session.conversation.some(t=>t.opportunity?.id===input.opportunityId))fail('La oportunidad indicada no fue entregada en esta sesión.');
 if(!bounded(input.notes))fail('Fundamenta la codificación.');
 return {sessionId:session.id,codebookVersion:RESEARCH_PROTOCOL.codebookVersion,code:input.code,quote,anchorId:input.anchorId,source:input.source,opportunityId:input.opportunityId||null,notes:bounded(input.notes)};
}
export function createResearchHandler({clientFactory=createClient}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const send=(status,data)=>res.status(status).json(data);
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{message:'Utiliza POST.'});}
 try{
  if(JSON.stringify(req.body||{}).length>220000)fail('El registro es demasiado extenso.');
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};const action=body.action;
  const token=String(req.headers?.authorization||'').match(/^Bearer (\S+)$/i)?.[1];if(!token)fail('Inicia sesión.',401);
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)fail('Servicio temporalmente no disponible.',503);
  const db=clientFactory(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  async function checked(query){const r=await query;if(r.error)throw new Error(r.error.message);return r.data;}
  const auth=await db.auth.getUser(token);const user=auth.data?.user;if(auth.error||!user)fail('Vuelve a iniciar sesión.',401);
  const profile=await checked(db.from('user_profiles').select('approved').eq('id',user.id).maybeSingle());
  if(!profile?.approved)fail('La aprobación de acceso está pendiente.',403);
  if(!(await readAccessConsent(db,user.id)).receipt)fail('Revisa las condiciones de acceso.',403);
  const staff=await checked(db.from('thesis_research_staff').select('roles').eq('user_id',user.id).maybeSingle());const roles=staff?.roles||[];
  const has=role=>roles.includes(role);const requireRole=(...allowed)=>{if(!allowed.some(has))fail('Esta sección requiere un rol del equipo.',403);};
  const settings=await checked(db.from('thesis_tomas_settings').select('*').eq('id',true).single());
  const protocol=await checked(db.from('thesis_research_protocols').select('*').eq('version',settings.research_protocol).maybeSingle());
  const command=async(name,payload)=>checked(db.rpc('thesis_research_command',{p_user:user.id,p_action:name,p_payload:payload}));
  const consent=async(id)=>{if(!await checked(db.rpc('thesis_research_consent_ok',{p_user:id})))fail('El consentimiento de investigación no está vigente.',409);};
  async function all(table){let rows=[];for(let offset=0;;offset+=1000){const batch=await checked(db.from(table).select('*').order(['thesis_tomas_slots','thesis_research_enrollment'].includes(table)?'slot':'id').range(offset,offset+999));rows.push(...batch);if(batch.length<1000)break;}return rows;}
  async function frameworkDataset(){
   const active=new Set(await checked(db.rpc('thesis_research_active_users'))||[]);
   const [categories,rawEntries,rawFeedback,rawSessions,rawAssessments,rawSlots,rawExposures]=await Promise.all(['thesis_framework_categories','thesis_framework_entries','thesis_feedback_history','thesis_tomas_sessions','thesis_research_assessments','thesis_tomas_slots','thesis_research_exposures'].map(all));
   const strip=({user_id,...row})=>row;
   const entries=rawEntries.filter(e=>e.entry_type==='analysis_plan'||active.has(e.user_id)).map(strip),feedback=rawFeedback.filter(e=>active.has(e.user_id)).map(strip),sessions=rawSessions.filter(e=>active.has(e.user_id)),assessments=rawAssessments.filter(e=>active.has(e.user_id)),slots=rawSlots.filter(e=>active.has(e.user_id)).map(strip);
   return {version:FRAMEWORK_VERSION,categories,entries,feedback,slots,exposures:rawExposures.filter(e=>active.has(e.user_id)).map(strip),sources:frameworkSources({sessions,assessments,entries,feedback}).filter(source=>body.slot?source.slot===Number(body.slot):action!=='framework_data'),matrix:frameworkMatrix(slots,categories,entries)};
  }
  if(action==='own_feedback')return send(200,{records:await checked(db.from('thesis_feedback_history').select('id,session_id,turn_index,input,result,generated_at,received_at,reviewed_at,feedback_version').eq('user_id',user.id).order('generated_at'))});
  if(action==='feedback_ack'){
   if(!uuid(body.id)||!['received','reviewed'].includes(body.kind))fail('Constancia inválida.');await consent(user.id);
   return send(200,await checked(db.rpc('thesis_feedback_ack',{p_user:user.id,p_id:body.id,p_kind:body.kind})));
  }
  if(action==='framework_data'){requireRole('coordinator','coder');return send(200,{...await frameworkDataset(),roles,protocol:protocol?{version:protocol.version,status:protocol.status,primary_criterion:protocol.primary_criterion}:null});}
  if(action==='framework_category'||action==='framework_entry'){
   requireRole('coordinator','coder');let payload;
   if(action==='framework_category'){
    if(!/^[a-z][a-z0-9_]{2,70}$/.test(body.key||'')||bounded(body.label,150).length<3||bounded(body.definition).length<20||bounded(body.inclusion).length<10||bounded(body.exclusion).length<10||bounded(body.changeReason).length<10||!['deductive','emergent'].includes(body.origin)||!['proposed','active','retired'].includes(body.status)||!Number.isInteger(body.expectedVersion)||body.expectedVersion<0)fail('Completa nombre, definición, inclusión, exclusión y fundamento de la versión. Usa una clave sin espacios.');
    payload={id:body.requestId||randomUUID(),key:body.key,label:bounded(body.label,150),definition:bounded(body.definition),inclusion:bounded(body.inclusion),exclusion:bounded(body.exclusion),changeReason:bounded(body.changeReason),origin:body.origin,status:body.status,expectedVersion:body.expectedVersion};
   }else{
    const dataset=await frameworkDataset();try{payload=validateFrameworkEntry(body,dataset);}catch(error){fail(error.message);}
    if(payload.entry_type==='analysis_plan')requireRole('coordinator');
    payload.id=body.requestId||randomUUID();
    if(payload.payload.references)payload.payload.references=payload.payload.references.map(ref=>{const {text,patientAnswer,...metadata}=ref;const start=text.indexOf(ref.quote);return {...metadata,context:text.slice(Math.max(0,start-250),start+ref.quote.length+250),sourceHash:createHash('sha256').update(text).digest('hex')};});
   }
   if(!uuid(payload.id))fail('Identificador de registro inválido.');
   return send(200,{saved:true,result:await checked(db.rpc('thesis_framework_command',{p_user:user.id,p_action:action==='framework_category'?'category':'entry',p_payload:payload}))});
  }
  if(action==='participant_state'){
   const [enrollment,assessments]=await Promise.all([checked(db.from('thesis_research_enrollment').select('slot,status,reason').eq('user_id',user.id).maybeSingle()),checked(db.from('thesis_research_assessments').select('id,stage,status,response,created_at,submitted_at').eq('user_id',user.id).order('created_at'))]);
   return send(200,{roles,enrollment,assessments,protocol:{...RESEARCH_PROTOCOL,status:protocol?.status||'draft'},collectionEnabled:settings.collection_enabled,trainingSessions:settings.training_sessions});
  }
  if(action==='workbench'||action==='export'){
   requireRole('coordinator','evaluator','coder','expert');
   const active=new Set(await checked(db.rpc('thesis_research_active_users'))||[]);
   const visibleProtocol=has('coordinator')||has('expert')?protocol:protocol?{version:protocol.version,status:protocol.status,primary_criterion:protocol.primary_criterion}:null;
   const result={roles,protocol:visibleProtocol,rubric:CLINICAL_RUBRIC,codebook:PROCESS_CODES};
   if(has('coordinator')||has('coder')||has('evaluator')){
    const assessments=(await all('thesis_research_assessments')).filter(r=>active.has(r.user_id));const ids=new Set(assessments.map(r=>r.id));
    const assignments=(await all('thesis_research_assignments')).filter(r=>ids.has(r.assessment_id)&&(has('coordinator')||r.reviewer_id===user.id));const assignmentIds=new Set(assignments.map(r=>r.id));
    const ratings=(await all('thesis_research_ratings')).filter(r=>assignmentIds.has(r.assignment_id));
    if(has('evaluator')&&!has('coordinator'))result.tasks=assignments.filter(a=>a.reviewer_id===user.id).map(a=>blindTask(a,assessments.find(r=>r.id===a.assessment_id),latestRatings(ratings).find(r=>r.assignment_id===a.id)));
    if(has('coordinator')||has('coder')){
     const sessions=(await all('thesis_tomas_sessions')).filter(r=>active.has(r.user_id));const sessionIds=new Set(sessions.map(s=>s.id));
     const codes=(await all('thesis_research_codes')).filter(r=>sessionIds.has(r.session_id));
     result.sessions=sessions.map(({user_id,consent_event_id,study_id,...row})=>row);result.codes=codes;
     if(has('coordinator')){
      const slots=(await all('thesis_tomas_slots')).filter(s=>active.has(s.user_id));const slotIds=new Set(slots.map(s=>s.slot));
      const exposures=(await all('thesis_research_exposures')).filter(r=>active.has(r.user_id));
      result.enrollments=(await all('thesis_research_enrollment')).filter(r=>active.has(r.user_id)).map(({user_id,reviewed_by,...r})=>r);
      result.assessments=assessments.map(({user_id,...r})=>r);result.assignments=assignments;result.ratings=ratings;
      result.integrations=(await all('thesis_research_integrations')).filter(r=>slotIds.has(r.slot));
      result.joint=buildJointDisplay({slots,assessments,assignments,ratings,sessions,codes,exposures});
      const [frameworkCategories,frameworkEntries]=await Promise.all([all('thesis_framework_categories'),all('thesis_framework_entries')]);
      const activeFramework=frameworkEntries.filter(e=>active.has(e.user_id));
      result.frameworkMatrix=frameworkMatrix(slots,frameworkCategories,activeFramework);
      result.joint.rows=result.joint.rows.map(row=>({...row,frameworkEpisodeCount:activeFramework.filter(e=>e.slot===row.slot&&e.entry_type==='episode').length,frameworkCodingCount:activeFramework.filter(e=>e.slot===row.slot&&e.entry_type==='coding').length}));
      result.flow={capacity:50,assigned:(await all('thesis_tomas_slots')).filter(r=>r.user_id).length,activeConsent:slots.length,targetRecruitment:43,targetPairs:34};
      result.staff=await checked(db.from('thesis_research_staff').select('user_id,roles'));
      result.audit=await checked(db.from('thesis_research_audit').select('id,action,record_id,created_at').order('id',{ascending:false}).limit(100));
     }
    }
   }
   if(has('expert')||has('coordinator')){result.cases=ACTOR_CASES;result.opportunities=STANDARD_INFORMATION;result.reviews=await all('thesis_research_reviews');}
   if(action==='export'){requireRole('coordinator');result.framework=await frameworkDataset();await checked(db.from('thesis_research_audit').insert({actor_id:user.id,action:'export',details:{protocol:settings.research_protocol}}));delete result.staff;delete result.audit;delete result.cases;delete result.reviews;delete result.roles;delete result.tasks;if(result.protocol?.document){const {cases,...document}=result.protocol.document;result.protocol={...result.protocol,document};}}
   return send(200,result);
  }
  let payload={};
  if(action==='eligibility'){
   const e=body.eligibility;if(!e?.adult||!e?.psychologyStudent||!e?.priorClinicalEducation||!bounded(e.institution,150)||!['yes','no'].includes(e.priorSimulatorUse)||e.priorSimulatorUse==='yes'&&!bounded(e.priorExposureNotes,1000))fail('Confirma los requisitos de ingreso y tu institución.');
   payload={eligibility:{adult:true,psychologyStudent:true,priorClinicalEducation:true,institution:bounded(e.institution,150),course:bounded(e.course,200),priorSimulatorUse:e.priorSimulatorUse,priorExposureNotes:bounded(e.priorExposureNotes,1000)}};
  }else if(action==='assessment_start'||action==='assessment_import'){
   if(!['pre','post','transfer','interview'].includes(body.stage))fail('Etapa inválida.');
   payload={stage:body.stage,caseVersion:'actor-cases-draft-v1'};
   if(action==='assessment_import'){requireRole('coordinator');payload.slot=Number(body.slot);payload.response=validateResponse(body.response,body.stage);}
  }else if(action==='assessment_submit'){
   if(!uuid(body.assessmentId))fail('Registro inválido.');
   const assessment=await checked(db.from('thesis_research_assessments').select('*').eq('id',body.assessmentId).eq('user_id',user.id).maybeSingle());if(!assessment)fail('Registro no disponible.',404);
   payload={assessmentId:assessment.id,response:validateResponse(body.response,assessment.stage)};
  }else if(action==='exposures'){
   if(!Array.isArray(body.events)||!body.events.length||body.events.length>20)fail('Lote inválido.');
   payload.events=body.events.map(e=>{if(!['help_open','guide_shown','section_open','feedback_open','tutor_request'].includes(e.kind)||e.sessionId&&!uuid(e.sessionId))fail('Evento inválido.');if(!uuid(e.id))fail('Identificador de evento inválido.');return{id:e.id,kind:e.kind,resource:bounded(e.resource,160),clientTime:bounded(e.clientTime,40),sessionId:e.sessionId||null};});
  }else if(action==='rate'){
   requireRole('evaluator');if(!uuid(body.assignmentId))fail('Asignación inválida.');
   const assignment=await checked(db.from('thesis_research_assignments').select('*').eq('id',body.assignmentId).eq('reviewer_id',user.id).maybeSingle());if(!assignment)fail('Asignación no disponible.',404);
   const assessment=await checked(db.from('thesis_research_assessments').select('*').eq('id',assignment.assessment_id).single());await consent(assessment.user_id);
   try{payload={assignmentId:assignment.id,...validateHumanRating(body,assessment)};}catch(error){fail(error.message);}
  }else if(action==='code'){
   requireRole('coder','coordinator');
   if(protocol?.document?.methodology?.qualitative?.includes('Framework Method'))fail('Esta versión utiliza Análisis cualitativo y el marco analítico con versiones. Registra allí la codificación.',409);
   if(!uuid(body.sessionId))fail('Sesión inválida.');const session=await checked(db.from('thesis_tomas_sessions').select('*').eq('id',body.sessionId).single());await consent(session.user_id);payload=validateEpisode(body,session);
  }else if(action==='integration'){
   requireRole('coordinator','coder');const seat=await checked(db.from('thesis_tomas_slots').select('user_id').eq('slot',Number(body.slot)).single());await consent(seat.user_id);
   if(!CLINICAL_RUBRIC.some(c=>c.id===body.criterion)||!['convergence','divergence','insufficient'].includes(body.status)||bounded(body.note).length<20)fail('Selecciona criterio, relación y fundamento con referencias a los registros.');
   const saved=await checked(db.from('thesis_research_integrations').insert({slot:Number(body.slot),reviewer_id:user.id,criterion:body.criterion,status:body.status,note:bounded(body.note)}).select('id').single());
   await checked(db.from('thesis_research_audit').insert({actor_id:user.id,action,record_id:saved.id}));return send(200,{saved:true});
  }else if(action==='expert_review'){
   requireRole('expert');if(!['protocol','rubric','case_A','case_B','case_C','opportunities'].includes(body.target)||!['acceptable','revise'].includes(body.decision)||bounded(body.notes).length<20)fail('Completa el objeto, decisión y fundamento de la revisión.');payload={target:body.target,decision:body.decision,notes:bounded(body.notes)};
  }else if(action==='staff_set'){
   requireRole('coordinator');const allowed=['coordinator','evaluator','coder','expert'];if(!Array.isArray(body.roles)||!body.roles.length&&body.revoke!==true||body.roles.some(r=>!allowed.includes(r))||body.roles.includes('evaluator')&&body.roles.length>1)fail('Roles inválidos.');
   const target=await checked(db.from('user_profiles').select('id').eq('email',bounded(body.email,254).toLowerCase()).eq('approved',true).maybeSingle());if(!target)fail('No existe una cuenta aprobada con ese correo.');payload={userId:target.id,roles:[...new Set(body.roles)]};
  }else if(action==='eligibility_review'){
   requireRole('coordinator');if(!['eligible','excluded','withdrawn'].includes(body.status)||!bounded(body.reason))fail('Registra decisión y motivo.');payload={slot:Number(body.slot),status:body.status,reason:bounded(body.reason)};
  }else if(action==='assessment_quality'){
   requireRole('coordinator');if(!uuid(body.assessmentId)||!['valid','invalid'].includes(body.quality)||!bounded(body.reason))fail('Registra calidad y motivo.');payload={assessmentId:body.assessmentId,quality:body.quality,reason:bounded(body.reason)};
  }else if(action==='assign'){
   requireRole('coordinator');if(!uuid(body.assessmentId)||!uuid(body.reviewerId))fail('Selecciona registro y evaluador.');payload={assessmentId:body.assessmentId,reviewerId:body.reviewerId,primary:body.primary===true};
  }else if(action==='freeze'){
   requireRole('coordinator');payload={approvalReference:bounded(body.approvalReference,1000),pilotReference:bounded(body.pilotReference,1000),primaryCriterion:body.primaryCriterion,document:{...RESEARCH_PROTOCOL,buildCommit:process.env.VERCEL_GIT_COMMIT_SHA||null,rubric:CLINICAL_RUBRIC,codebook:PROCESS_CODES,cases:ACTOR_CASES,opportunities:STANDARD_INFORMATION,learningMaterials:{version:PEDAGOGICAL_GUIDES_VERSION,guides:pedagogicalGuides}}};
  }else fail('Operación desconocida.');
  return send(200,{saved:true,result:await command(action,payload)});
 }catch(error){const known=/REQUIRED|NOT_OPEN|NOT_FOUND|NOT_AVAILABLE|LOCKED|FROZEN|INCOMPLETE|FORBIDDEN|ALREADY|COMPLETE/.test(error.message);return send(error.status|| (known?409:503),{message:error.status?error.message:known?'La operación requiere completar las condiciones previas del protocolo. Revisa la etapa, los permisos y el consentimiento.':'No se confirmó el registro. Conserva tu texto y vuelve a intentarlo.'});}
};}
export default createResearchHandler();
