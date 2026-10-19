alter table public.thesis_tomas_settings add column training_sessions integer not null default 2 check(training_sessions between 1 and 4);
alter table public.thesis_tomas_settings add column research_protocol text not null default 'ev-tomas-research-draft-v3';
alter table public.thesis_tomas_settings add column primary_aggregation_enabled boolean not null default false;
create table public.thesis_research_protocols(version text primary key,status text not null default 'draft' check(status in ('draft','frozen')),document jsonb not null,approval_reference text,pilot_reference text,primary_criterion text,aggregation_enabled boolean not null default false,frozen_at timestamptz);
create table public.thesis_research_staff(user_id uuid primary key references auth.users(id) on delete cascade,roles text[] not null check(roles <@ array['coordinator','evaluator','coder','expert']::text[] and cardinality(roles)>0),created_at timestamptz not null default now());
create table public.thesis_research_enrollment(slot integer primary key references public.thesis_tomas_slots(slot),user_id uuid not null unique references auth.users(id) on delete cascade,case_order text not null check(case_order in ('AB','BA')),eligibility jsonb not null,status text not null default 'pending' check(status in ('pending','eligible','excluded','withdrawn')),reason text,reviewed_by uuid references auth.users(id) on delete set null,updated_at timestamptz not null default now());
create table public.thesis_research_assessments(id uuid primary key default gen_random_uuid(),slot integer not null references public.thesis_tomas_slots(slot),user_id uuid not null references auth.users(id) on delete cascade,stage text not null check(stage in ('pre','post','transfer','interview')),variant text not null check(variant in ('A','B','C','interview')),case_version text not null,protocol_version text not null references public.thesis_research_protocols(version),status text not null default 'draft' check(status in ('draft','submitted')),response jsonb not null default '{}'::jsonb,quality text not null default 'pending' check(quality in ('pending','valid','invalid')),quality_reason text,submitted_at timestamptz,created_at timestamptz not null default now(),unique(slot,stage));
create table public.thesis_research_assignments(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.thesis_research_assessments(id) on delete cascade,reviewer_id uuid not null references auth.users(id) on delete cascade,blind_code uuid not null default gen_random_uuid(),is_primary boolean not null default false,created_at timestamptz not null default now(),unique(assessment_id,reviewer_id));
create unique index thesis_one_primary_assignment on public.thesis_research_assignments(assessment_id) where is_primary;
create table public.thesis_research_ratings(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.thesis_research_assignments(id) on delete cascade,reviewer_id uuid not null references auth.users(id) on delete cascade,version integer not null,rubric_version text not null,criteria jsonb not null,notes text,created_at timestamptz not null default now(),unique(assignment_id,version));
create table public.thesis_research_codes(id uuid primary key default gen_random_uuid(),session_id uuid not null references public.thesis_tomas_sessions(id) on delete cascade,reviewer_id uuid not null references auth.users(id) on delete cascade,codebook_version text not null,code text not null,quote text not null,anchor_id text not null,source text not null check(source in ('spontaneous','induced','indeterminate')),opportunity_id text,notes text not null,created_at timestamptz not null default now());
create table public.thesis_research_exposures(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,slot integer not null references public.thesis_tomas_slots(slot),session_id uuid references public.thesis_tomas_sessions(id) on delete cascade,kind text not null,resource text not null,client_time text,recorded_at timestamptz not null default now(),protocol_version text not null);
create table public.thesis_research_reviews(id uuid primary key default gen_random_uuid(),reviewer_id uuid not null references auth.users(id) on delete cascade,target text not null,decision text not null check(decision in ('acceptable','revise')),notes text not null,protocol_version text not null references public.thesis_research_protocols(version),created_at timestamptz not null default now());
create table public.thesis_research_audit(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,action text not null,record_id text,details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index thesis_assessment_user_idx on public.thesis_research_assessments(user_id);
create index thesis_assignment_reviewer_idx on public.thesis_research_assignments(reviewer_id);
create index thesis_rating_reviewer_idx on public.thesis_research_ratings(reviewer_id);
create index thesis_codes_session_idx on public.thesis_research_codes(session_id);
create index thesis_exposure_user_idx on public.thesis_research_exposures(user_id);
do $$ declare tab text; begin foreach tab in array array['thesis_research_protocols','thesis_research_staff','thesis_research_enrollment','thesis_research_assessments','thesis_research_assignments','thesis_research_ratings','thesis_research_codes','thesis_research_exposures','thesis_research_reviews','thesis_research_audit'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon,authenticated',tab);
 execute format('grant all on public.%I to service_role',tab);
 execute format('create policy "Server operations" on public.%I for all to service_role using (true) with check (true)',tab);
 end loop; end $$;
grant usage,select on sequence public.thesis_research_audit_id_seq to service_role;
grant select on public.thesis_research_enrollment,public.thesis_research_assessments,public.thesis_research_exposures to authenticated;
create policy "Own research enrollment" on public.thesis_research_enrollment for select to authenticated using ((select auth.uid())=user_id);
create policy "Own research assessment" on public.thesis_research_assessments for select to authenticated using ((select auth.uid())=user_id);
create policy "Own help exposure" on public.thesis_research_exposures for select to authenticated using ((select auth.uid())=user_id);

create function public.thesis_research_consent_ok(p_user uuid) returns boolean language sql security invoker set search_path=public,pg_temp as $$
 select exists(select 1 from (select * from public.simulation_research_consent_events where user_id=p_user and study_key=(select study_key from public.thesis_tomas_settings where id=true) order by sequence desc limit 1) e join public.simulation_research_studies st on st.id=e.study_id where e.action='accepted' and e.adult_confirmed and e.participation_accepted and e.data_processing_accepted and st.status='published' and st.collection_until>now() and st.id=(select id from public.simulation_research_studies where study_key=st.study_key and status='published' and collection_until>now() order by published_at desc limit 1)); $$;
revoke all on function public.thesis_research_consent_ok(uuid) from public,anon,authenticated;
grant execute on function public.thesis_research_consent_ok(uuid) to service_role;

create function public.thesis_research_command(p_user uuid,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare cfg public.thesis_tomas_settings%rowtype; roles text[]; seat public.thesis_tomas_slots%rowtype; enrollment public.thesis_research_enrollment%rowtype; assessment public.thesis_research_assessments%rowtype; assignment public.thesis_research_assignments%rowtype; protocol public.thesis_research_protocols%rowtype; target_user uuid; n integer; variant text; result jsonb; row_id uuid; item jsonb;
begin
 if p_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into cfg from public.thesis_tomas_settings where id=true;
 select s.roles into roles from public.thesis_research_staff s where s.user_id=p_user;
 select * into protocol from public.thesis_research_protocols where version=cfg.research_protocol;
 if p_action in ('staff_set','eligibility_review','assessment_quality','assign','freeze','assessment_import') and not coalesce('coordinator'=any(roles),false) then raise exception 'STAFF_REQUIRED'; end if;
 if p_action='staff_set' then
   target_user=(p_payload->>'userId')::uuid;
   if target_user=p_user then raise exception 'SELF_ROLE_CHANGE_FORBIDDEN'; end if;
   if not exists(select 1 from public.user_profiles where id=target_user and approved=true) then raise exception 'APPROVED_ACCOUNT_REQUIRED'; end if;
   insert into public.thesis_research_staff(user_id,roles) values(target_user,array(select jsonb_array_elements_text(p_payload->'roles'))) on conflict(user_id) do update set roles=excluded.roles;
   result=jsonb_build_object('saved',true);
 elsif p_action='expert_review' then
   if not coalesce('expert'=any(roles),false) then raise exception 'EXPERT_REQUIRED'; end if;
   if protocol.status='frozen' then raise exception 'PROTOCOL_FROZEN'; end if;
   insert into public.thesis_research_reviews(reviewer_id,target,decision,notes,protocol_version) values(p_user,p_payload->>'target',p_payload->>'decision',p_payload->>'notes',cfg.research_protocol) returning id into row_id;
   result=jsonb_build_object('id',row_id);
 elsif p_action='freeze' then
   if coalesce(length(trim(p_payload->>'approvalReference')),0)<10 or coalesce(length(trim(p_payload->>'pilotReference')),0)<10 then raise exception 'APPROVAL_REFERENCES_REQUIRED'; end if;
   if (select count(distinct reviewer_id) from (select distinct on(reviewer_id,target) * from public.thesis_research_reviews where protocol_version=cfg.research_protocol order by reviewer_id,target,created_at desc) latest where reviewer_id<>p_user and decision='acceptable')<2 then raise exception 'INDEPENDENT_EXPERT_REVIEWS_REQUIRED'; end if;
   if exists(select 1 from unnest(array['protocol','rubric','case_A','case_B','case_C','opportunities']) t where not exists(select 1 from (select distinct on(reviewer_id,target) * from public.thesis_research_reviews where protocol_version=cfg.research_protocol order by reviewer_id,target,created_at desc) r where r.target=t and r.decision='acceptable' and r.reviewer_id<>p_user)) then raise exception 'REVIEW_INCOMPLETE'; end if;
   if coalesce(p_payload->>'primaryCriterion','') not in ('selection','evidence','alternatives','uncertainty') then raise exception 'PRIMARY_CRITERION_REQUIRED'; end if;
   update public.thesis_research_protocols set status='frozen',approval_reference=p_payload->>'approvalReference',pilot_reference=p_payload->>'pilotReference',primary_criterion=p_payload->>'primaryCriterion',frozen_at=now() where version=cfg.research_protocol;
   result=jsonb_build_object('frozen',true);
 elsif p_action='eligibility_review' then
   update public.thesis_research_enrollment set status=p_payload->>'status',reason=p_payload->>'reason',reviewed_by=p_user,updated_at=now() where slot=(p_payload->>'slot')::integer returning to_jsonb(thesis_research_enrollment) into result;
   if result is null then raise exception 'ENROLLMENT_NOT_FOUND'; end if;
 elsif p_action='assessment_quality' then
   update public.thesis_research_assessments set quality=p_payload->>'quality',quality_reason=p_payload->>'reason' where id=(p_payload->>'assessmentId')::uuid returning jsonb_build_object('saved',true) into result;
 if result is null then raise exception 'ASSESSMENT_NOT_FOUND'; end if;
 elsif p_action='assign' then
   select * into assessment from public.thesis_research_assessments where id=(p_payload->>'assessmentId')::uuid;
   target_user=(p_payload->>'reviewerId')::uuid;
   if assessment.status is distinct from 'submitted' or assessment.stage='interview' or not public.thesis_research_consent_ok(assessment.user_id) then raise exception 'ASSESSMENT_NOT_AVAILABLE'; end if;
   if target_user=assessment.user_id or not exists(select 1 from public.thesis_research_staff where user_id=target_user and 'evaluator'=any(thesis_research_staff.roles) and not ('coordinator'=any(thesis_research_staff.roles))) then raise exception 'INDEPENDENT_EVALUATOR_REQUIRED'; end if;
   insert into public.thesis_research_assignments(assessment_id,reviewer_id,is_primary) values(assessment.id,target_user,coalesce((p_payload->>'primary')::boolean,false)) on conflict(assessment_id,reviewer_id) do nothing;
   result=jsonb_build_object('assigned',true);
 elsif p_action='rate' then
   if not coalesce('evaluator'=any(roles),false) then raise exception 'EVALUATOR_REQUIRED'; end if;
   select * into assignment from public.thesis_research_assignments where id=(p_payload->>'assignmentId')::uuid and reviewer_id=p_user for update;
   if assignment.id is null then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;
   select * into assessment from public.thesis_research_assessments where id=assignment.assessment_id;
   if not public.thesis_research_consent_ok(assessment.user_id) then raise exception 'CONSENT_NOT_CURRENT'; end if;
   select coalesce(max(version),0)+1 into n from public.thesis_research_ratings where assignment_id=assignment.id;
   insert into public.thesis_research_ratings(assignment_id,reviewer_id,version,rubric_version,criteria,notes) values(assignment.id,p_user,n,p_payload->>'rubricVersion',p_payload->'criteria',p_payload->>'notes') returning id into row_id;
   result=jsonb_build_object('id',row_id,'version',n);
 elsif p_action='code' then
   if not (coalesce('coder'=any(roles),false) or coalesce('coordinator'=any(roles),false)) then raise exception 'CODER_REQUIRED'; end if;
   if not exists(select 1 from public.thesis_tomas_sessions s where id=(p_payload->>'sessionId')::uuid and public.thesis_research_consent_ok(s.user_id)) then raise exception 'SESSION_NOT_AVAILABLE'; end if;
   insert into public.thesis_research_codes(session_id,reviewer_id,codebook_version,code,quote,anchor_id,source,opportunity_id,notes) values((p_payload->>'sessionId')::uuid,p_user,p_payload->>'codebookVersion',p_payload->>'code',p_payload->>'quote',p_payload->>'anchorId',p_payload->>'source',p_payload->>'opportunityId',p_payload->>'notes') returning id into row_id;
   result=jsonb_build_object('id',row_id);
 elsif p_action in ('eligibility','assessment_start','assessment_submit','exposures','assessment_import') then
   target_user=case when p_action='assessment_import' then (select user_id from public.thesis_tomas_slots where slot=(p_payload->>'slot')::integer) else p_user end;
   if not cfg.collection_enabled or protocol.status is distinct from 'frozen' then raise exception 'STUDY_NOT_OPEN'; end if;
   if not public.thesis_research_consent_ok(target_user) then raise exception 'RESEARCH_CONSENT_REQUIRED'; end if;
   select * into seat from public.thesis_tomas_slots where user_id=target_user;
   if seat.slot is null then raise exception 'SEAT_REQUIRED'; end if;
   perform pg_advisory_xact_lock(hashtextextended('research:'||target_user::text,0));
   select * into enrollment from public.thesis_research_enrollment where user_id=target_user;
   if p_action='eligibility' then
     if enrollment.status='eligible' then raise exception 'ELIGIBILITY_ALREADY_VERIFIED'; end if;
     insert into public.thesis_research_enrollment(slot,user_id,case_order,eligibility) values(seat.slot,target_user,case when seat.slot%2=1 then 'AB' else 'BA' end,p_payload->'eligibility') on conflict(slot) do update set eligibility=excluded.eligibility,status='pending',updated_at=now();
     result=jsonb_build_object('saved',true,'status','pending');
   elsif p_action='exposures' then
     if jsonb_array_length(p_payload->'events')>20 then raise exception 'EVENT_LIMIT'; end if;
     for item in select * from jsonb_array_elements(p_payload->'events') loop
       if item->>'sessionId' is not null and not exists(select 1 from public.thesis_tomas_sessions where id=(item->>'sessionId')::uuid and user_id=target_user) then raise exception 'SESSION_NOT_FOUND'; end if;
       insert into public.thesis_research_exposures(user_id,slot,session_id,kind,resource,client_time,protocol_version) values(target_user,seat.slot,(item->>'sessionId')::uuid,item->>'kind',item->>'resource',item->>'clientTime',cfg.research_protocol);
     end loop;
     result=jsonb_build_object('saved',true);
   else
     if enrollment.status is distinct from 'eligible' then raise exception 'ELIGIBILITY_REQUIRED'; end if;
     if p_action='assessment_submit' then
       select * into assessment from public.thesis_research_assessments where id=(p_payload->>'assessmentId')::uuid and user_id=target_user for update;
       if assessment.id is null or assessment.status<>'draft' then raise exception 'ASSESSMENT_LOCKED'; end if;
       update public.thesis_research_assessments set response=p_payload->'response',status='submitted',submitted_at=now() where id=assessment.id returning to_jsonb(thesis_research_assessments)-'user_id' into result;
     else
       if p_payload->>'stage' not in ('pre','post','transfer','interview') then raise exception 'INVALID_STAGE'; end if;
       if p_payload->>'stage'='post' and not exists(select 1 from public.thesis_research_assessments where user_id=target_user and stage='pre' and status='submitted') then raise exception 'PRE_REQUIRED'; end if;
       if p_payload->>'stage'='post' and (select count(*) from public.thesis_tomas_sessions where user_id=target_user and status='completed')<cfg.training_sessions then raise exception 'TRAINING_REQUIRED'; end if;
       if p_payload->>'stage'='transfer' and not exists(select 1 from public.thesis_research_assessments where user_id=target_user and stage='post' and status='submitted') then raise exception 'POST_REQUIRED'; end if;
       if p_payload->>'stage'='interview' and not exists(select 1 from public.thesis_research_assessments where user_id=target_user and stage='transfer' and status='submitted') then raise exception 'TRANSFER_REQUIRED'; end if;
       variant=case p_payload->>'stage' when 'pre' then left(enrollment.case_order,1) when 'post' then right(enrollment.case_order,1) when 'transfer' then 'C' else 'interview' end;
       insert into public.thesis_research_assessments(slot,user_id,stage,variant,case_version,protocol_version,status,response,submitted_at) values(seat.slot,target_user,p_payload->>'stage',variant,p_payload->>'caseVersion',cfg.research_protocol,case when p_action='assessment_import' then 'submitted' else 'draft' end,coalesce(p_payload->'response','{}'::jsonb),case when p_action='assessment_import' then now() else null end) on conflict(slot,stage) do nothing;
       select to_jsonb(a)-'user_id' into result from public.thesis_research_assessments a where slot=seat.slot and stage=p_payload->>'stage';
     end if;
   end if;
 else raise exception 'INVALID_ACTION'; end if;
 insert into public.thesis_research_audit(actor_id,action,record_id) values(p_user,p_action,coalesce(row_id::text,result->>'id',p_payload->>'sessionId',p_payload->>'assessmentId'));
 return result;
end; $$;
revoke all on function public.thesis_research_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.thesis_research_command(uuid,text,jsonb) to service_role;

create function public.thesis_research_active_users() returns setof uuid language sql security invoker set search_path=public,pg_temp as $$
 select e.user_id from (select distinct on(user_id) * from public.simulation_research_consent_events where study_key=(select study_key from public.thesis_tomas_settings where id=true) order by user_id,sequence desc) e join public.simulation_research_studies st on st.id=e.study_id where e.action='accepted' and e.adult_confirmed and e.participation_accepted and e.data_processing_accepted and st.status='published' and st.collection_until>now() and st.id=(select id from public.simulation_research_studies where study_key=st.study_key and status='published' and collection_until>now() order by published_at desc limit 1); $$;
revoke all on function public.thesis_research_active_users() from public,anon,authenticated;
grant execute on function public.thesis_research_active_users() to service_role;

create table public.thesis_research_integrations(id uuid primary key default gen_random_uuid(),slot integer not null references public.thesis_tomas_slots(slot),reviewer_id uuid references auth.users(id) on delete set null,criterion text not null,status text not null check(status in ('convergence','divergence','insufficient')),note text not null,created_at timestamptz not null default now());
alter table public.thesis_research_integrations enable row level security;
revoke all on public.thesis_research_integrations from anon,authenticated;
grant all on public.thesis_research_integrations to service_role;
create policy "Server integrations" on public.thesis_research_integrations for all to service_role using(true) with check(true);
