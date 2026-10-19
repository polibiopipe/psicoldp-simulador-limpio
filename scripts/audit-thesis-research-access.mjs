import assert from 'node:assert/strict';
import { createResearchHandler } from '../api/thesis-research.js';
const savedEnv={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};
process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
const ids={reviewer:'00000000-0000-4000-8000-000000000001',participant:'00000000-0000-4000-8000-000000000002',withdrawn:'00000000-0000-4000-8000-000000000003',assessment:'00000000-0000-4000-8000-000000000004',assignment:'00000000-0000-4000-8000-000000000005',otherAssignment:'00000000-0000-4000-8000-000000000006'};
let roles=['evaluator'],approved=true,commands=[];
const datasets={
 user_profiles:[{id:ids.reviewer,approved:true}],
 simulation_access_documents:[{version:'1',is_current:true}],
 simulation_access_consents:[{id:'receipt',user_id:ids.reviewer,document_version:'1',adult_confirmed:true,educational_use_accepted:true,data_processing_accepted:true}],
 thesis_tomas_settings:[{id:true,research_protocol:'draft',collection_enabled:false,training_sessions:2}],
 thesis_research_protocols:[{version:'draft',status:'draft',document:{cases:{A:'PRIVATE_ACTOR_BANK'}}}],
 thesis_tomas_slots:[{slot:1,user_id:ids.participant,participant_code:'EVT-001'},{slot:2,user_id:ids.withdrawn,participant_code:'EVT-002'}],
 thesis_research_assessments:[{id:ids.assessment,user_id:ids.participant,slot:1,stage:'post',variant:'B',quality:'valid',status:'submitted',response:{transcript:'Registro que aún no permite concluir una causa única.'}},{id:'withdrawn-assessment',user_id:ids.withdrawn,slot:2,response:{transcript:'WITHDRAWN_PRIVATE'}}],
 thesis_research_assignments:[{id:ids.assignment,assessment_id:ids.assessment,reviewer_id:ids.reviewer,blind_code:'BLIND-CODE',is_primary:true},{id:ids.otherAssignment,assessment_id:ids.assessment,reviewer_id:'another-evaluator',blind_code:'OTHER-BLIND',is_primary:false}],
 thesis_research_ratings:[{id:'other-score',assignment_id:ids.otherAssignment,reviewer_id:'another-evaluator',version:1,criteria:{secret:'OTHER_RATING'}}],
 thesis_tomas_sessions:[],thesis_research_codes:[],thesis_research_enrollment:[],thesis_research_exposures:[],thesis_research_integrations:[],thesis_research_audit:[],thesis_research_reviews:[],thesis_framework_categories:[],thesis_framework_entries:[{id:'withdrawn-framework',user_id:ids.withdrawn,slot:2,entry_type:'memo',payload:{note:'WITHDRAWN_PRIVATE'}}],thesis_feedback_history:[]
};
const db={auth:{getUser:async()=>({data:{user:{id:ids.reviewer}}})},from(table){let filters=[],single=false,start=0,end=999;return{select(){return this},eq(k,v){filters.push([k,v]);return this},maybeSingle(){single=true;return this},single(){single=true;return this},order(){return this},limit(n){end=n-1;return this},range(a,b){start=a;end=b;return this},insert(){return this},then(resolve){let rows=table==='thesis_research_staff'?[{user_id:ids.reviewer,roles}]:table==='user_profiles'?[{id:ids.reviewer,approved}]:datasets[table]||[];rows=rows.filter(r=>filters.every(([k,v])=>r[k]===v)).slice(start,end+1);return Promise.resolve({data:single?rows[0]||null:rows,error:null}).then(resolve);}}},rpc:async(name,args)=>{if(name==='thesis_research_active_users')return{data:[ids.participant]};if(name==='thesis_research_consent_ok')return{data:args.p_user===ids.participant};commands.push(args);return{data:{saved:true}};}};
const handler=createResearchHandler({clientFactory:()=>db});
async function call(body){let status,output;await handler({method:'POST',headers:{authorization:'Bearer fixture'},body},{setHeader(){},status(n){status=n;return this},json(data){output=data;}});return{status,output};}
try{
 const blind=await call({action:'workbench'});assert.equal(blind.status,200);assert.equal(blind.output.tasks.length,1);const serialized=JSON.stringify(blind.output.tasks);assert.ok(!serialized.includes(ids.participant));assert.ok(!serialized.includes('post'));assert.ok(!serialized.includes('OTHER_RATING'));assert.ok(!serialized.includes('WITHDRAWN_PRIVATE'));assert.equal(blind.output.cases,undefined);assert.ok(!JSON.stringify(blind.output).includes('PRIVATE_ACTOR_BANK'));assert.equal((await call({action:'framework_data'})).status,403);assert.equal(blind.output.assessments,undefined);
 assert.equal((await call({action:'staff_set',email:'any@example.invalid',roles:['coordinator']})).status,403);assert.equal(commands.length,0);
 assert.equal((await call({action:'export'})).status,403);
 assert.equal((await call({action:'rate',assignmentId:ids.otherAssignment,criteria:{}})).status,404);
 roles=[];assert.equal((await call({action:'workbench'})).status,403);const own=await call({action:'participant_state'});assert.equal(own.status,200);assert.equal(own.output.cases,undefined);
 roles=['coder'];const framework=await call({action:'framework_data'});assert.equal(framework.status,200);assert.ok(!JSON.stringify(framework.output).includes('WITHDRAWN_PRIVATE'));assert.ok(!JSON.stringify(framework.output).includes('PRIVATE_ACTOR_BANK'));
 assert.equal((await call({action:'framework_entry',entryType:'analysis_plan',primaryCriterion:'evidence',status:'draft',note:'Una justificación detallada del plan de análisis que se propone.'})).status,403);
 roles=['coordinator'];const coordinator=await call({action:'workbench'});assert.equal(coordinator.status,200);assert.ok(!JSON.stringify(coordinator.output).includes('WITHDRAWN_PRIVATE'));assert.ok(coordinator.output.cases.A);assert.equal(coordinator.output.flow.assigned,2);assert.equal(coordinator.output.flow.activeConsent,1);
 assert.equal((await call({action:'staff_set',roles:['evaluator','coder'],email:'x@example.invalid'})).status,400);
 approved=false;assert.equal((await call({action:'participant_state'})).status,403);
 console.log('PASS research access: role isolation, blind review, no peer ratings, no participant case bank, withdrawn records excluded, coordinator scope and approved access');
}finally{for(const [key,value]of Object.entries(savedEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
