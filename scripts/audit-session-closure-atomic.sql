-- Fixtures only; every row in this audit is rolled back.
begin;
set local statement_timeout = '20s';
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  pending_id uuid := gen_random_uuid();
  appt_id uuid := gen_random_uuid();
  session_id uuid := gen_random_uuid();
  foreign_appt uuid := gen_random_uuid();
  scheduled_id uuid := gen_random_uuid();
  payload jsonb;
  bad_payload jsonb;
  rejected boolean;
  before_row jsonb;
  saved_count integer;
begin
  insert into auth.users(id,email,raw_user_meta_data) values
    (owner_id,'closure-a-'||owner_id||'@example.invalid','{}'),
    (other_id,'closure-b-'||other_id||'@example.invalid','{}'),
    (pending_id,'closure-p-'||pending_id||'@example.invalid','{}');
  update public.user_profiles set approved=true where id in (owner_id,other_id);
  insert into public.simulation_appointments(id,user_id,case_id,case_name,session_number,scheduled_for,scheduled_local_date,status,started_at,ends_at)
  values (appt_id,owner_id,'audit-closure','Temporary audit',1,'2099-01-05T12:00Z','2099-01-05','in_progress',now(),now()+interval '45 minutes'),
    (foreign_appt,other_id,'audit-closure','Temporary audit',1,'2099-01-05T12:00Z','2099-01-05','in_progress',now(),now()+interval '45 minutes'),
    (scheduled_id,owner_id,'audit-closure','Temporary audit',2,'2099-01-06T12:00Z','2099-01-06','scheduled',null,null);
  insert into public.simulation_sessions(id,user_id,case_id,case_name,session_number,appointment_id,conversation,status)
    values(session_id,owner_id,'audit-closure','Temporary audit',1,appt_id,'[{"question":"test","answer":"fixture"}]','in_progress');
  payload := jsonb_build_object('id',session_id,'user_id',owner_id,'case_id','audit-closure','case_name','Temporary audit',
    'session_number',1,'appointment_id',appt_id,'conversation','[{"question":"test","answer":"fixture"}]'::jsonb,
    'feedback','{}'::jsonb,'status','closure_pending','score',40);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  set local role authenticated;
  insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted,data_processing_accepted)
  select owner_id,version,true,true,true from public.simulation_access_documents where is_current;
  select count(*) into saved_count from public.save_simulation_session_closure(payload);
  if saved_count<>1 or not exists(select 1 from public.simulation_sessions where id=session_id and status='closure_pending')
    or not exists(select 1 from public.simulation_appointments where id=appt_id and status='closure_pending') then
    raise exception 'FAIL: pending closure must confirm both rows';
  end if;
  -- Completing and retrying must keep the original record and completion time.
  payload := payload || '{"status":"completed"}';
  perform public.save_simulation_session_closure(payload);
  select to_jsonb(s) into before_row from public.simulation_sessions s where id=session_id;
  perform public.save_simulation_session_closure(payload);
  if (select count(*) from public.simulation_sessions)<>1
    or not exists(select 1 from public.simulation_sessions where id=session_id and status='completed' and completed_at=(before_row->>'completed_at')::timestamptz)
    or not exists(select 1 from public.simulation_appointments where id=appt_id and status='completed') then
    raise exception 'FAIL: completed closure must be idempotent';
  end if;
  foreach bad_payload in array array[
    payload || '{"status":"in_progress"}'::jsonb,
    payload || '{"conversation":[]}'::jsonb,
    payload || jsonb_build_object('appointment_id',foreign_appt),
    payload || jsonb_build_object('user_id',other_id),
    payload || jsonb_build_object('id',gen_random_uuid(),'appointment_id',scheduled_id,'session_number',2),
    payload || jsonb_build_object('id',gen_random_uuid(),'appointment_id',null),
    payload || '{"case_id":"wrong-case"}'::jsonb
  ] loop
    rejected := false;
    begin perform public.save_simulation_session_closure(bad_payload);
    exception when others then rejected := true; end;
    if not rejected then raise exception 'FAIL: invalid closure accepted'; end if;
  end loop;
  -- A direct, delayed autosave cannot undo the RPC's final status or lose turns.
  rejected := false;
  begin update public.simulation_sessions set status='in_progress' where id=session_id;
  exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL: stale progress reopened completed session'; end if;
  rejected := false;
  begin update public.simulation_sessions set conversation='[]' where id=session_id;
  exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL: stale progress removed turns'; end if;
  if (select to_jsonb(s) from public.simulation_sessions s where id=session_id) is distinct from before_row then
    raise exception 'FAIL: rejected operations changed the saved session';
  end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pending_id,'role','authenticated')::text,true);
  rejected := false;
  begin perform public.save_simulation_session_closure(payload || jsonb_build_object('user_id',pending_id));
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'FAIL: unapproved closure'; end if;
  reset role;
  if has_function_privilege('anon','public.save_simulation_session_closure(jsonb)','execute') then raise exception 'FAIL: anonymous execute'; end if;
  if not exists(select 1 from public.simulation_appointments where id=foreign_appt and status='in_progress') then raise exception 'FAIL: another account changed'; end if;
end;
$$;
select 'PASS: atomic pending/completed closure, retries, rejected writes, stale autosaves, RLS and approval' as audit_result;
rollback;
