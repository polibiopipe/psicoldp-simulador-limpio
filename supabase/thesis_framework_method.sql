create table public.thesis_framework_categories(id uuid primary key default gen_random_uuid(),key text not null,version integer not null,label text not null,definition text not null,origin text not null check(origin in ('deductive','emergent')),status text not null check(status in ('proposed','active','retired')),inclusion text not null,exclusion text not null,change_reason text not null,reviewer_id uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),unique(key,version));
create table public.thesis_framework_entries(id uuid primary key,slot integer references public.thesis_tomas_slots(slot),user_id uuid references auth.users(id) on delete cascade,reviewer_id uuid references auth.users(id) on delete set null,entry_type text not null check(entry_type in ('coding','chart','memo','episode','followup','analysis_plan')),category_id uuid references public.thesis_framework_categories(id),payload jsonb not null,protocol_version text not null,created_at timestamptz not null default now(),check((entry_type='analysis_plan' and slot is null and user_id is null) or (entry_type<>'analysis_plan' and slot is not null and user_id is not null)));
create table public.thesis_feedback_history(id uuid primary key,session_id uuid not null references public.thesis_tomas_sessions(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,slot integer not null references public.thesis_tomas_slots(slot),turn_index integer not null,feedback_version text not null,protocol_version text not null,input jsonb not null,result jsonb not null,model text not null,provider_model_version text,generated_at timestamptz not null default now(),received_at timestamptz,reviewed_at timestamptz);
create index thesis_framework_entries_user on public.thesis_framework_entries(user_id);
create index thesis_framework_entries_slot on public.thesis_framework_entries(slot);
create index thesis_framework_entries_category on public.thesis_framework_entries(category_id);
create index thesis_framework_entries_reviewer on public.thesis_framework_entries(reviewer_id);
create index thesis_framework_categories_reviewer on public.thesis_framework_categories(reviewer_id);
create index thesis_feedback_history_user on public.thesis_feedback_history(user_id);
create index thesis_feedback_history_session on public.thesis_feedback_history(session_id);
create index thesis_feedback_history_slot on public.thesis_feedback_history(slot);
do $$ declare tab text; begin foreach tab in array array['thesis_framework_categories','thesis_framework_entries','thesis_feedback_history'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon,authenticated',tab);
 execute format('grant all on public.%I to service_role',tab);
 execute format('create policy "Server framework" on public.%I for all to service_role using(true) with check(true)',tab);
end loop;end $$;
grant select on public.thesis_feedback_history to authenticated;
create policy "Own archived feedback" on public.thesis_feedback_history for select to authenticated using((select auth.uid())=user_id);
create function public.thesis_framework_command(p_user uuid,p_action text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare roles text[]; cfg public.thesis_tomas_settings%rowtype; target_user uuid; n integer; category public.thesis_framework_categories%rowtype; existing public.thesis_framework_entries%rowtype; result jsonb;
begin
 select s.roles into roles from public.thesis_research_staff s where s.user_id=p_user;
 if not(coalesce('coordinator'=any(roles),false) or coalesce('coder'=any(roles),false)) then raise exception 'CODER_REQUIRED'; end if;
 select * into cfg from public.thesis_tomas_settings where id=true;
 if p_action='category' then
  perform pg_advisory_xact_lock(hashtextextended('framework-category:'||(p_payload->>'key'),0));
  select * into category from public.thesis_framework_categories where id=(p_payload->>'id')::uuid;
  if category.id is not null then if category.reviewer_id is distinct from p_user then raise exception 'REQUEST_ID_CONFLICT'; end if; return to_jsonb(category); end if;
  select coalesce(max(version),0) into n from public.thesis_framework_categories where key=p_payload->>'key';
  if n is distinct from (p_payload->>'expectedVersion')::integer then raise exception 'VERSION_CONFLICT'; end if;
  insert into public.thesis_framework_categories(id,key,version,label,definition,origin,status,inclusion,exclusion,change_reason,reviewer_id) values((p_payload->>'id')::uuid,p_payload->>'key',n+1,p_payload->>'label',p_payload->>'definition',p_payload->>'origin',case when 'coordinator'=any(roles) then p_payload->>'status' else 'proposed' end,p_payload->>'inclusion',p_payload->>'exclusion',p_payload->>'changeReason',p_user) returning to_jsonb(thesis_framework_categories) into result;
 elsif p_action='entry' then
  select * into existing from public.thesis_framework_entries where id=(p_payload->>'id')::uuid;
  if existing.id is not null then if existing.reviewer_id is distinct from p_user then raise exception 'REQUEST_ID_CONFLICT'; end if; return to_jsonb(existing)-'user_id'; end if;
  if p_payload->>'entry_type'='analysis_plan' then
   if not coalesce('coordinator'=any(roles),false) then raise exception 'COORDINATOR_REQUIRED'; end if;
   if p_payload->'payload'->>'status'='active' and not exists(select 1 from public.thesis_research_protocols where version=cfg.research_protocol and status='frozen' and primary_criterion=p_payload->'payload'->>'primaryCriterion' and length(p_payload->'payload'->>'validationReference')>=10 and length(p_payload->'payload'->>'assumptionsReview')>=40) then raise exception 'VALIDATED_ANALYSIS_PLAN_REQUIRED'; end if;
  else
   select user_id into target_user from public.thesis_tomas_slots where slot=(p_payload->>'slot')::integer;
   if target_user is null or not public.thesis_research_consent_ok(target_user) then raise exception 'CONSENT_NOT_CURRENT'; end if;
  end if;
  if p_payload->>'category_id' is not null and not exists(select 1 from public.thesis_framework_categories where id=(p_payload->>'category_id')::uuid and status<>'retired') then raise exception 'CATEGORY_NOT_AVAILABLE'; end if;
  insert into public.thesis_framework_entries(id,slot,user_id,reviewer_id,entry_type,category_id,payload,protocol_version) values((p_payload->>'id')::uuid,(p_payload->>'slot')::integer,target_user,p_user,p_payload->>'entry_type',(p_payload->>'category_id')::uuid,p_payload->'payload',cfg.research_protocol) returning to_jsonb(thesis_framework_entries)-'user_id' into result;
 else raise exception 'INVALID_ACTION'; end if;
 insert into public.thesis_research_audit(actor_id,action,record_id) values(p_user,'framework_'||p_action,result->>'id');
 return result;
end;$$;
revoke all on function public.thesis_framework_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.thesis_framework_command(uuid,text,jsonb) to service_role;
create function public.thesis_feedback_archive(p_user uuid,p_session uuid,p_id uuid,p_payload jsonb) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare sess public.thesis_tomas_sessions%rowtype; cfg public.thesis_tomas_settings%rowtype;
begin
 select * into sess from public.thesis_tomas_sessions where id=p_session and user_id=p_user;
 if sess.id is null or sess.status<>'completed' then raise exception 'SESSION_NOT_AVAILABLE'; end if;
 if not public.thesis_research_consent_ok(p_user) then raise exception 'CONSENT_NOT_CURRENT'; end if;
 select * into cfg from public.thesis_tomas_settings where id=true;
 insert into public.thesis_feedback_history(id,session_id,user_id,slot,turn_index,feedback_version,protocol_version,input,result,model,provider_model_version) values(p_id,sess.id,p_user,sess.slot,(p_payload->>'turnIndex')::integer,p_payload->>'feedbackVersion',sess.protocol_version,p_payload->'input',p_payload->'result',p_payload->>'model',p_payload->>'providerModelVersion') on conflict(id) do nothing;
 return p_id;
end;$$;
revoke all on function public.thesis_feedback_archive(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.thesis_feedback_archive(uuid,uuid,uuid,jsonb) to service_role;
create function public.thesis_feedback_ack(p_user uuid,p_id uuid,p_kind text) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_kind not in ('received','reviewed') then raise exception 'INVALID_ACTION'; end if;
 if p_kind='received' then update public.thesis_feedback_history set received_at=coalesce(received_at,now()) where id=p_id and user_id=p_user;
 else update public.thesis_feedback_history set reviewed_at=coalesce(reviewed_at,now()) where id=p_id and user_id=p_user and received_at is not null; end if;
 if not found then raise exception 'FEEDBACK_NOT_AVAILABLE'; end if;
 return jsonb_build_object('saved',true);
end;$$;
revoke all on function public.thesis_feedback_ack(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.thesis_feedback_ack(uuid,uuid,text) to service_role;
