-- Run after both access migrations. All fixtures/decisions roll back.
begin;
set local statement_timeout='20s';
do $$
declare
  owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); pending_id uuid:=gen_random_uuid();
  active_version text; receipt public.simulation_access_consents%rowtype; rejected boolean;
begin
  select version into strict active_version from public.simulation_access_documents where is_current;
  insert into auth.users(id,email,raw_user_meta_data) values
    (owner_id,'access-a-'||owner_id||'@example.invalid','{}'),
    (other_id,'access-b-'||other_id||'@example.invalid','{}'),
    (pending_id,'access-p-'||pending_id||'@example.invalid','{}');
  update public.user_profiles set approved=true where id in(owner_id,other_id);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  set local role authenticated;
  if public.current_user_has_simulation_access_consent() then raise exception 'FAIL: implicit acceptance'; end if;
  rejected:=false;
  begin insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted)
    values(owner_id,active_version,true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: incomplete declarations accepted'; end if;
  rejected:=false;
  begin insert into public.simulation_sessions(user_id,case_id,case_name,session_number,status) values(owner_id,'access-audit','Temporary',1,'in_progress');
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: practice without acceptance'; end if;
  insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted,data_processing_accepted,created_at,document_snapshot)
    values(owner_id,active_version,true,true,true,'2000-01-01','{"forged":true}') returning * into receipt;
  if receipt.created_at<now() or receipt.document_snapshot ? 'forged' or receipt.document_snapshot->>'version'<>active_version then raise exception 'FAIL: forged evidence'; end if;
  if not public.current_user_has_simulation_access_consent() then raise exception 'FAIL: confirmed acceptance missing'; end if;
  insert into public.simulation_sessions(user_id,case_id,case_name,session_number,status) values(owner_id,'access-audit','Temporary',1,'in_progress');
  rejected:=false;
  begin update public.simulation_access_consents set created_at='2000-01-01' where id=receipt.id;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: editable receipt'; end if;
  rejected:=false;
  begin delete from public.simulation_access_consents where id=receipt.id;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: deletable receipt'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
  if exists(select 1 from public.simulation_access_consents where id=receipt.id) or public.current_user_has_simulation_access_consent() then raise exception 'FAIL: cross-account consent'; end if;
  rejected:=false;
  begin insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted,data_processing_accepted)
    values(owner_id,active_version,true,true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: foreign acceptance'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pending_id,'role','authenticated')::text,true);
  rejected:=false;
  begin insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted,data_processing_accepted)
    values(pending_id,active_version,true,true,true);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: unapproved access'; end if;
  reset role;
  rejected:=false;
  begin update public.simulation_access_documents set title='Changed' where version=active_version;
  exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL: text can change without version'; end if;
  update public.simulation_access_documents set is_current=false where version=active_version;
  insert into public.simulation_access_documents(version,title,information,is_current)
    select 'audit-'||owner_id,title,information,true from public.simulation_access_documents where version=active_version;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  set local role authenticated;
  if public.current_user_has_simulation_access_consent() then raise exception 'FAIL: prior version grants access'; end if;
  rejected:=false;
  begin insert into public.simulation_access_consents(user_id,document_version,adult_confirmed,educational_use_accepted,data_processing_accepted) values(owner_id,active_version,true,true,true);
  exception when serialization_failure then rejected:=true; end;
  if not rejected then raise exception 'FAIL: stale document accepted'; end if;
  if not exists(select 1 from public.simulation_sessions where user_id=owner_id) then raise exception 'FAIL: privacy read blocked'; end if;
  delete from public.simulation_sessions where user_id=owner_id;
  if exists(select 1 from public.simulation_sessions where user_id=owner_id) then raise exception 'FAIL: privacy deletion blocked'; end if;
  if exists(select 1 from public.simulation_research_consent_events where user_id=owner_id) then raise exception 'FAIL: research consent inferred'; end if;
  reset role;
end;
$$;
select 'PASS: mandatory acceptance, complete declarations, immutable server evidence, owner isolation, approval, document version, practice write gate, privacy access and separate research' as audit_result;
rollback;
