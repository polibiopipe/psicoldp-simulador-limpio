create or replace function public.thesis_tomas_command(p_user uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare cfg public.thesis_tomas_settings%rowtype; seat public.thesis_tomas_slots%rowtype; sess public.thesis_tomas_sessions%rowtype; n integer; evt jsonb; decision public.simulation_research_consent_events%rowtype;
begin
 if p_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into cfg from public.thesis_tomas_settings where id=true;
 if not cfg.collection_enabled or not exists(select 1 from public.thesis_research_protocols where version=cfg.research_protocol and status='frozen') then raise exception 'STUDY_NOT_OPEN'; end if;
 select * into decision from public.simulation_research_consent_events where user_id=p_user and study_key=cfg.study_key order by sequence desc limit 1;
 if decision.id is null or decision.action <> 'accepted' or not decision.participation_accepted or not decision.data_processing_accepted or not decision.adult_confirmed or not exists(select 1 from public.simulation_research_studies st where st.id=decision.study_id and st.status='published' and st.collection_until>now() and st.id=(select newest.id from public.simulation_research_studies newest where newest.study_key=cfg.study_key and newest.status='published' and newest.collection_until>now() order by newest.published_at desc limit 1)) then raise exception 'RESEARCH_CONSENT_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('thesis-tomas:'||p_user::text,0));
 select * into seat from public.thesis_tomas_slots where user_id=p_user;
 if seat.slot is null then
   select * into seat from public.thesis_tomas_slots where assigned_at is null order by slot for update skip locked limit 1;
   if seat.slot is null then raise exception 'STUDY_FULL'; end if;
   update public.thesis_tomas_slots set user_id=p_user,assigned_at=now() where slot=seat.slot returning * into seat;
 end if;
 if p_action='enroll' then return to_jsonb(seat)-'user_id'; end if;
 if p_action='start' then
   if not exists(select 1 from public.thesis_research_enrollment where user_id=p_user and status='eligible') then raise exception 'ELIGIBILITY_REQUIRED'; end if;
   if not exists(select 1 from public.thesis_research_assessments where user_id=p_user and stage='pre' and status='submitted') then raise exception 'PRE_REQUIRED'; end if;
   select * into sess from public.thesis_tomas_sessions where user_id=p_user and status='in_progress' order by session_number limit 1;
   if sess.id is not null then return to_jsonb(sess)-'user_id'; end if;
   select coalesce(max(session_number),0)+1 into n from public.thesis_tomas_sessions where user_id=p_user;
   if n>cfg.training_sessions then raise exception 'PROCESS_COMPLETE'; end if;
   insert into public.thesis_tomas_sessions(user_id,slot,session_number,protocol_version,consent_event_id,study_id,preparation) values(p_user,seat.slot,n,cfg.research_protocol,decision.id,decision.study_id,coalesce(p_payload->'preparation','{}'::jsonb)||jsonb_build_object('caseId','tomas','sessionNumber',n)) returning * into sess;
   return to_jsonb(sess)-'user_id';
 end if;
 select * into sess from public.thesis_tomas_sessions where id=(p_payload->>'sessionId')::uuid and user_id=p_user for update;
 if sess.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
 if (p_payload->>'version')::integer is distinct from sess.version then raise exception 'VERSION_CONFLICT'; end if;
 -- Replays of an already accepted event are safe, including requests retried after lost responses.
 if p_action='event' and exists(select 1 from jsonb_array_elements(sess.events) e where e->>'id'=p_payload->'event'->>'id') then return to_jsonb(sess)-'user_id'; end if;
 if sess.status<>'in_progress' and p_action not in ('close','practice') then raise exception 'SESSION_CLOSED'; end if;
 if p_action='turn' then
   if now()>sess.started_at+interval '20 minutes' or jsonb_array_length(sess.conversation)>=25 then raise exception 'SESSION_LIMIT'; end if;
   if exists(select 1 from jsonb_array_elements(sess.conversation) t where t->>'id'=p_payload->'turn'->>'id') then return to_jsonb(sess)-'user_id'; end if;
   update public.thesis_tomas_sessions set conversation=conversation||jsonb_build_array(p_payload->'turn'),version=version+1 where id=sess.id returning * into sess;
 elsif p_action='event' then
   if jsonb_array_length(sess.events)>=100 then raise exception 'EVENT_LIMIT'; end if;
   evt=(p_payload->'event') || jsonb_build_object('createdAt',now(),'turnCount',jsonb_array_length(sess.conversation));
   update public.thesis_tomas_sessions set events=events||jsonb_build_array(evt),version=version+1 where id=sess.id returning * into sess;
 elsif p_action='practice' then
   if sess.status<>'completed' then raise exception 'SESSION_CLOSED'; end if;
   update public.thesis_tomas_sessions set closure=jsonb_set(closure,'{feedbackPractice}',p_payload->'practice'),version=version+1 where id=sess.id returning * into sess;
 elsif p_action='close' then
   update public.thesis_tomas_sessions set status='completed',ended_at=now(),closure=(p_payload->'closure') || jsonb_build_object('revisions',coalesce(sess.closure->'revisions','[]'::jsonb) || case when sess.closure is null then '[]'::jsonb else jsonb_build_array(sess.closure-'revisions') end),version=version+1 where id=sess.id returning * into sess;
 else raise exception 'INVALID_ACTION'; end if;
 return to_jsonb(sess)-'user_id';
end; $$;
revoke all on function public.thesis_tomas_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.thesis_tomas_command(uuid,text,jsonb) to service_role;
