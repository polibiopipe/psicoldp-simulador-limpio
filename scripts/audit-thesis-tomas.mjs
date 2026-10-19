import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createStudyHandler} from '../api/thesis-tomas.js';
import {participantCodes,validateStudyCommand,toEvidenceRecord} from '../src/thesis/studyModel.js';
const codes=participantCodes();assert.equal(codes.length,50);assert.equal(new Set(codes).size,50);assert.equal(codes[0],'EVT-001');assert.equal(codes[49],'EVT-050');
assert.throws(()=>validateStudyCommand({action:'turn',caseId:'claudio'}),/CASE_NOT_ALLOWED/);
assert.throws(()=>validateStudyCommand({action:'start',user_id:'x',question:'x'.repeat(46000)}),/REQUEST_TOO_LARGE/);
assert.equal(toEvidenceRecord({id:'s1',session_number:1,events:[]}).caseId,'tomas');
const reads=[],writes=[];
let approved=true, consent=true,rpcError=null;
const id='00000000-0000-4000-8000-000000000001';
const current={id,user_id:'u1',case_id:'tomas',session_number:1,status:'in_progress',version:0,conversation:[],events:[],started_at:new Date().toISOString()};
const db={auth:{getUser:async()=>({data:{user:{id:'u1'}}})},from(table){reads.push(table);let filters=[];return{select(){return this},eq(key,value){filters.push([key,value]);return this},order(){return this},maybeSingle(){return this},single(){return this},then(resolve){let data=table==='user_profiles'?{approved}:table==='simulation_access_documents'?{version:'1'}:table==='simulation_access_consents'?consent?{id:'c1',user_id:'u1',document_version:'1',adult_confirmed:true,educational_use_accepted:true,data_processing_accepted:true}:null:table==='thesis_tomas_sessions'?current:table==='thesis_tomas_settings'?{collection_enabled:false}:null;return Promise.resolve({data,error:null}).then(resolve);}}},rpc:async(name,args)=>{writes.push({name,args});return{data:{...current,conversation:args.p_payload.turn?[args.p_payload.turn]:[],events:args.p_payload.event?[args.p_payload.event]:[]},error:rpcError};}};
const originalUrl=process.env.SUPABASE_URL,originalKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
const handler=createStudyHandler({clientFactory:()=>db,respond:()=>({responseText:'Me cuesta hablar de esto.'})});
async function call(body,token='test-token',method='POST'){let status,output;await handler({method,headers:{authorization:token?`Bearer ${token}`:''},body},{setHeader(){},status(value){status=value;return this},json(value){output=value;return this}});return{status,output};}
try{
 assert.equal((await call({action:'status'},'')).status,401);
 approved=false;assert.equal((await call({action:'status'})).status,403);approved=true;
 consent=false;assert.equal((await call({action:'start',preparation:{objective:'o',plan:'p'}})).status,403);consent=true;
 assert.equal(writes.length,0);
 rpcError={message:'STUDY_NOT_OPEN'};assert.equal((await call({action:'enroll'})).output.error,'STUDY_NOT_OPEN');rpcError=null;
 const event={id:'00000000-0000-4000-8000-000000000002',stage:'initial',decision:'Explorar',rationale:'Faltan antecedentes'};
 const saved=await call({action:'event',sessionId:id,version:0,event});assert.equal(saved.status,200);assert.equal(saved.output.session.events[0].id,event.id);
 assert.equal(saved.output.session.events[0].source,'structured_prompt');
 const turn=await call({action:'turn',sessionId:id,version:0,turnId:id,question:'¿Qué te trae hoy?'});assert.equal(turn.status,200);assert.equal(turn.output.session.conversation[0].engineVersion,'tomas-local-clinical-v1');
 assert.equal((await call({action:'event',sessionId:id,version:0,event:{...event,stage:'transfer'}})).status,400);
 assert.equal((await call({action:'turn',sessionId:id,version:0,turnId:id,question:'hola'},'test-token','GET')).status,405);
 assert.ok(writes.every(write=>write.name==='thesis_tomas_command'));
 assert.ok(!reads.includes('simulation_appointments'));assert.ok(!reads.includes('simulation_sessions'));
 const source=readFileSync('src/thesis/ThesisTomasApp.jsx','utf8');assert.ok(!source.includes('ClinicalAgenda'));assert.ok(source.includes('allowedStages'));
 console.log('PASS isolated Tomás: 50 entries, authentication, consent, single case, contextual events, endpoint isolation and fixed engine version');
}finally{if(originalUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=originalUrl;if(originalKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=originalKey;}
