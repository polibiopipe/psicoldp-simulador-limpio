import { CLINICAL_RUBRIC, weightedKappa, pairProfiles } from '../src/thesis/researchProtocol.js';
export function latestRatings(rows){const latest=new Map();for(const row of rows){const old=latest.get(row.assignment_id);if(!old||row.version>old.version)latest.set(row.assignment_id,row);}return [...latest.values()];}
export function buildJointDisplay({slots=[],assessments=[],assignments=[],ratings=[],sessions=[],codes=[],exposures=[]}){
 const latest=latestRatings(ratings),scoreByAssessment=new Map();
 for(const assignment of assignments.filter(row=>row.is_primary)){const rating=latest.find(row=>row.assignment_id===assignment.id);if(rating&&assessments.some(a=>a.id===assignment.assessment_id&&a.quality==='valid'))scoreByAssessment.set(assignment.assessment_id,rating);}
 const rows=slots.map(slot=>{
  const records=assessments.filter(a=>a.slot===slot.slot),pre=records.find(a=>a.stage==='pre'),post=records.find(a=>a.stage==='post'),transfer=records.find(a=>a.stage==='transfer'),interview=records.find(a=>a.stage==='interview');
  const participantSessions=sessions.filter(s=>s.slot===slot.slot),sessionIds=new Set(participantSessions.map(s=>s.id));
  const valid=pre?.quality==='valid'&&post?.quality==='valid'&&scoreByAssessment.has(pre.id)&&scoreByAssessment.has(post.id)&&CLINICAL_RUBRIC.every(c=>Number.isFinite(scoreByAssessment.get(pre.id).criteria[c.id]?.score)&&Number.isFinite(scoreByAssessment.get(post.id).criteria[c.id]?.score));
  const opportunities=participantSessions.flatMap(s=>(s.conversation||[]).filter(t=>t.opportunity).map(t=>({sessionId:s.id,turnId:t.id,...t.opportunity})));
  return {code:slot.participant_code,slot:slot.slot,pre:scoreByAssessment.get(pre?.id)||null,post:scoreByAssessment.get(post?.id)||null,transfer:scoreByAssessment.get(transfer?.id)||null,completePair:Boolean(valid),preQuality:pre?.quality||'missing',postQuality:post?.quality||'missing',trainingCompleted:participantSessions.filter(s=>s.status==='completed').length,episodes:codes.filter(c=>sessionIds.has(c.session_id)),opportunities,helpExposures:exposures.filter(e=>e.slot===slot.slot),interview:interview?.response||null,integration:{status:'pending_human_interpretation',note:'No se infieren convergencia ni nivel psicológico a partir de recuentos.'}};
 });
 const agreement=CLINICAL_RUBRIC.map(c=>{
  const pairs=[];for(const assessment of assessments.filter(a=>a.quality==='valid')){const linked=assignments.filter(a=>a.assessment_id===assessment.id);const scored=linked.map(a=>latest.find(r=>r.assignment_id===a.id)).filter(Boolean);if(scored.length>=2)pairs.push([scored[0].criteria[c.id]?.score,scored[1].criteria[c.id]?.score]);}
  return {criterion:c.id,...weightedKappa(pairs)};
 });
 const doubleRated=assessments.filter(a=>assignments.filter(x=>x.assessment_id===a.id&&latest.some(r=>r.assignment_id===x.id)).length>=2).length;
 return {rows,pairs:pairProfiles(rows),completePairs:rows.filter(r=>r.completePair).length,agreement,doubleRated,assessmentCount:assessments.filter(a=>['pre','post','transfer'].includes(a.stage)&&a.status==='submitted').length,aggregationEnabled:false};
}
