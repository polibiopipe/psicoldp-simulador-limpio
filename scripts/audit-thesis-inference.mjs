import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const code=String.raw`
import importlib.util, math
spec=importlib.util.spec_from_file_location('inference','scripts/research/infer_paired.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def fixture():
 data={'protocol':{'version':'p1','status':'frozen','primary_criterion':'evidence','document':{'rubricVersion':'r1'}},'framework':{'entries':[{'id':'plan1','entry_type':'analysis_plan','protocol_version':'p1','created_at':'2026-01-01','payload':{'method':'paired_t','status':'active','primaryCriterion':'evidence','validationReference':'Validation reference reviewed','assumptionsReview':'Human review of the paired-mean model and the limitations of ordinal levels.'}}]},'assessments':[],'assignments':[],'ratings':[]}
 for slot,(pre,post) in enumerate([(0,1),(1,3),(2,2),(1,2)],1):
  for stage,score in [('pre',pre),('post',post)]:
   ident=f'{slot}-{stage}';data['assessments'].append({'id':ident,'slot':slot,'stage':stage,'status':'submitted','quality':'valid','protocol_version':'p1'});data['assignments'].append({'id':ident,'assessment_id':ident,'is_primary':True});data['ratings'].append({'id':ident,'assignment_id':ident,'version':1,'rubric_version':'r1','criteria':{'evidence':{'score':score}}})
 return data
r=m.infer(fixture());assert r['paired_n']==4;assert r['mean_change']==1;assert abs(r['dz']-1.224744871391589)<1e-10;assert r['mean_change_ci95'][0]<1<r['mean_change_ci95'][1];assert 0<=r['p_two_sided']<=1
d=fixture();d['protocol']['status']='draft'
try:m.infer(d);raise AssertionError('Draft protocol should be blocked')
except ValueError:pass
d=fixture();d['ratings'][-1]['criteria']['evidence']['score']=None;assert m.infer(d)['paired_n']==3
d=fixture();d['assessments'][-1]['quality']='invalid';assert m.infer(d)['paired_n']==3
d=fixture();d['framework']['entries'][0]['payload']['primaryCriterion']='selection'
try:m.infer(d);raise AssertionError('Wrong primary criterion should be blocked')
except ValueError:pass
print('PASS paired inference: frozen primary plan, real rating reconstruction, missing/invalid exclusion, mean change, CI95, dz and two-sided p')
`;
const result=spawnSync('python3',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);process.stdout.write(result.stdout);
