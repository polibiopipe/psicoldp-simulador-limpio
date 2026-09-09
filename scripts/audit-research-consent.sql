-- Run after simulation_research_consent.sql; fixtures and every change roll back.
begin;
set local statement_timeout='20s';
do $$
declare
  owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); pending_id uuid:=gen_random_uuid();
  study_id uuid:=gen_random_uuid(); draft_id uuid:=gen_random_uuid(); first_id uuid; withdrawal_id uuid;
  study_key text:='audit-'||gen_random_uuid(); info jsonb:='{}'; field_name text; rejected boolean;
  result_row public.simulation_research_consent_events%rowtype; n integer; code uuid;
begin
  foreach field_name in array array['controller','objective','eligibility','activities','duration','voluntary_alternative','risks_support','benefits_costs','data_use','providers_transfers','retention','withdrawal','conflicts','review_reference','contacts'] loop
    info:=info||jsonb_build_object(field_name,'Temporary audit fixture for '||field_name);
  end loop;
  info:=info||'{"data_categories":["usage"],"allow_quotes":false}';
  insert into auth.users(id,email,raw_user_meta_data) values
    (owner_id,'consent-a-'||owner_id||'@example.invalid','{}'),
    (other_id,'consent-b-'||other_id||'@example.invalid','{}'),
    (pending_id,'consent-p-'||pending_id||'@example.invalid','{}');
  update public.user_profiles set approved=true where id in(owner_id,other_id);
  insert into public.simulation_research_studies(id,study_key,version,title) values(draft_id,study_key,'0.1','Temporary draft');
  rejected:=false;
  begin update public.simulation_research_studies set status='published' where id=draft_id;
  exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL: incomplete protocol can open'; end if;
  insert into public.simulation_research_studies(id,study_key,version,title,status,information,collection_until,retention_until)
  values(study_id,study_key,'1.0','Temporary consent study','published',info,now()+interval '1 day',now()+interval '2 days');
  rejected:=false;
  begin update public.simulation_research_studies set information=info||'{"controller":"Changed after publication"}' where id=study_id;
  exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL: published text is mutable'; end if;
  -- A prior practice session must never become eligible just by consenting later.
  insert into public.simulation_sessions(user_id,case_id,case_name,session_number,status,created_at,started_at,completed_at)
  values(owner_id,'research-audit','Temporary case',1,'completed',now()-interval '1 day',now()-interval '1 day',now()-interval '23 hours');

  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  set local role authenticated;
  if exists(select 1 from public.simulation_research_studies where id=draft_id) then raise exception 'FAIL: draft exposed'; end if;
  rejected:=false;
  begin insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,participation_accepted,adult_confirmed)
    values(owner_id,study_id,study_key,'accepted',true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: data consent not required'; end if;
  rejected:=false;
  begin insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,participation_accepted,data_processing_accepted)
    values(owner_id,study_id,study_key,'accepted',true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: adult declaration not required'; end if;
  insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,participation_accepted,data_processing_accepted,adult_confirmed,document_snapshot,created_at)
  values(owner_id,study_id,study_key,'accepted',true,true,true,'{"forged":true}','2000-01-01') returning * into result_row;
  first_id:=result_row.id; code:=result_row.participant_code;
  if result_row.document_snapshot ? 'forged' or result_row.created_at<now() or result_row.document_snapshot->'information'->'declarations'->>'data' is null then raise exception 'FAIL: untrusted evidence accepted'; end if;
  rejected:=false;
  begin update public.simulation_research_consent_events set action='declined' where id=first_id;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: editable decision'; end if;
  rejected:=false;
  begin delete from public.simulation_research_consent_events where id=first_id;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: deletable decision'; end if;
  rejected:=false;
  begin insert into public.simulation_research_consent_events(user_id,study_id,study_key,action) values(owner_id,study_id,study_key,'withdrawn');
  exception when serialization_failure then rejected:=true; end;
  if not rejected then raise exception 'FAIL: stale tab can override decision'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
  if exists(select 1 from public.simulation_research_consent_events where id=first_id) then raise exception 'FAIL: foreign read'; end if;
  rejected:=false;
  begin insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,previous_event_id) values(owner_id,study_id,study_key,'withdrawn',first_id);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: foreign write'; end if;
  reset role;
  if exists(select 1 from public.simulation_research_eligible_sessions where participant_code=code) then raise exception 'FAIL: historical session included'; end if;
  insert into public.simulation_sessions(user_id,case_id,case_name,session_number,status,created_at,started_at,completed_at,conversation,feedback)
  values(owner_id,'research-audit','Temporary case',2,'completed',clock_timestamp(),clock_timestamp(),clock_timestamp(),'[{"question":"private text"}]','{"private":"private feedback"}');
  insert into public.simulation_sessions(user_id,case_id,case_name,session_number,status,created_at,started_at,completed_at)
  values(owner_id,'research-audit','Temporary case',3,'completed',clock_timestamp(),clock_timestamp(),now()+interval '3 days');
  select count(*) into n from public.simulation_research_eligible_sessions where participant_code=code and conversation is null and feedback is null;
  if n<>1 then raise exception 'FAIL: prospective session or category minimization'; end if;
  -- Even a revoked practice approval must not prevent a withdrawal.
  update public.user_profiles set approved=false where id=owner_id;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  set local role authenticated;
  insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,previous_event_id) values(owner_id,study_id,study_key,'withdrawn',first_id) returning id into withdrawal_id;
  rejected:=false;
  begin insert into public.simulation_research_consent_events(user_id,study_id,study_key,action,previous_event_id,participation_accepted,data_processing_accepted,adult_confirmed)
    values(owner_id,study_id,study_key,'accepted',withdrawal_id,true,true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: pending account can accept'; end if;
  reset role;
  if exists(select 1 from public.simulation_research_eligible_sessions where participant_code=code) then raise exception 'FAIL: withdrawn data remains eligible'; end if;
  if (select count(*) from public.simulation_sessions where user_id=owner_id)<>3 then raise exception 'FAIL: withdrawal deleted practice'; end if;
  if has_table_privilege('anon','public.simulation_research_consent_events','select') or has_table_privilege('authenticated','public.simulation_research_studies','update')
    or has_table_privilege('authenticated','public.simulation_research_eligible_sessions','select') then raise exception 'FAIL: excessive privileges'; end if;
end;
$$;
select 'PASS: publication gate, immutable evidence, separate consents, adult declaration, own-account RLS, stale decisions, prospective data, category minimization, collection deadline and withdrawal without practice deletion' as audit_result;
rollback;
