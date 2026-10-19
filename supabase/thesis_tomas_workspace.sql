-- Isolated research workspace. Ordinary simulator tables and policies are unchanged.
create table public.thesis_tomas_settings (
 id boolean primary key default true check(id),
 collection_enabled boolean not null default false,
 study_key text not null default 'escucha-viva-estudiantes',
 protocol_version text not null default 'tomas-protocol-draft-v1'
);
insert into public.thesis_tomas_settings(id) values(true);
create table public.thesis_tomas_slots (
 slot integer primary key check(slot between 1 and 50),
 participant_code text generated always as ('EVT-' || lpad(slot::text,3,'0')) stored unique,
 user_id uuid unique references auth.users(id) on delete set null,
 assigned_at timestamptz
);
insert into public.thesis_tomas_slots(slot) select generate_series(1,50);
create table public.thesis_tomas_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 slot integer not null references public.thesis_tomas_slots(slot),
 case_id text not null default 'tomas' check(case_id='tomas'),
 session_number integer not null check(session_number between 1 and 4),
 protocol_version text not null,
 consent_event_id uuid not null references public.simulation_research_consent_events(id),
 study_id uuid not null references public.simulation_research_studies(id),
 status text not null default 'in_progress' check(status in ('in_progress','completed')),
 started_at timestamptz not null default now(),
 ended_at timestamptz,
 version integer not null default 0,
 preparation jsonb not null default '{}'::jsonb,
 conversation jsonb not null default '[]'::jsonb check(jsonb_typeof(conversation)='array'),
 events jsonb not null default '[]'::jsonb check(jsonb_typeof(events)='array'),
 closure jsonb,
 unique(user_id,session_number)
);
create index thesis_tomas_sessions_slot_idx on public.thesis_tomas_sessions(slot);
alter table public.thesis_tomas_settings enable row level security;
alter table public.thesis_tomas_slots enable row level security;
alter table public.thesis_tomas_sessions enable row level security;
revoke all on public.thesis_tomas_settings,public.thesis_tomas_slots,public.thesis_tomas_sessions from anon,authenticated;
grant select on public.thesis_tomas_slots,public.thesis_tomas_sessions to authenticated;
create policy "Own thesis participant entry" on public.thesis_tomas_slots for select to authenticated using ((select auth.uid())=user_id);
create policy "Own thesis sessions" on public.thesis_tomas_sessions for select to authenticated using ((select auth.uid())=user_id);
create policy "Server thesis settings" on public.thesis_tomas_settings for all to service_role using (true) with check (true);
grant all on public.thesis_tomas_settings,public.thesis_tomas_slots,public.thesis_tomas_sessions to service_role;

-- Invoker function callable only by the authenticated server service role.
-- Row locks serialize seat assignment, starts and append operations.
create function public.thesis_tomas_command(p_user uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare cfg public.thesis_tomas_settings%rowtype; seat public.thesis_tomas_slots%rowtype; sess public.thesis_tomas_sessions%rowtype; n integer; evt jsonb; decision public.simulation_research_consent_events%rowtype;
begin
 if p_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into cfg from public.thesis_tomas_settings where id=true;
 if not cfg.collection_enabled then raise exception 'STUDY_NOT_OPEN'; end if;
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
   select * into sess from public.thesis_tomas_sessions where user_id=p_user and status='in_progress' order by session_number limit 1;
   if sess.id is not null then return to_jsonb(sess)-'user_id'; end if;
   select coalesce(max(session_number),0)+1 into n from public.thesis_tomas_sessions where user_id=p_user;
   if n>4 then raise exception 'PROCESS_COMPLETE'; end if;
   insert into public.thesis_tomas_sessions(user_id,slot,session_number,protocol_version,consent_event_id,study_id,preparation) values(p_user,seat.slot,n,cfg.protocol_version,decision.id,decision.study_id,coalesce(p_payload->'preparation','{}'::jsonb)) returning * into sess;
   return to_jsonb(sess)-'user_id';
 end if;
 select * into sess from public.thesis_tomas_sessions where id=(p_payload->>'sessionId')::uuid and user_id=p_user for update;
 if sess.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
 if (p_payload->>'version')::integer is distinct from sess.version then raise exception 'VERSION_CONFLICT'; end if;
 -- Replays of an already accepted event are safe, including requests retried after lost responses.
 if p_action='event' and exists(select 1 from jsonb_array_elements(sess.events) e where e->>'id'=p_payload->'event'->>'id') then return to_jsonb(sess)-'user_id'; end if;
 if sess.status<>'in_progress' then raise exception 'SESSION_CLOSED'; end if;
 if p_action='turn' then
   if now()>sess.started_at+interval '20 minutes' or jsonb_array_length(sess.conversation)>=25 then raise exception 'SESSION_LIMIT'; end if;
   if exists(select 1 from jsonb_array_elements(sess.conversation) t where t->>'id'=p_payload->'turn'->>'id') then return to_jsonb(sess)-'user_id'; end if;
   update public.thesis_tomas_sessions set conversation=conversation||jsonb_build_array(p_payload->'turn'),version=version+1 where id=sess.id returning * into sess;
 elsif p_action='event' then
   if jsonb_array_length(sess.events)>=100 then raise exception 'EVENT_LIMIT'; end if;
   evt=(p_payload->'event') || jsonb_build_object('createdAt',now(),'turnCount',jsonb_array_length(sess.conversation));
   update public.thesis_tomas_sessions set events=events||jsonb_build_array(evt),version=version+1 where id=sess.id returning * into sess;
 elsif p_action='close' then
   update public.thesis_tomas_sessions set status='completed',ended_at=now(),closure=p_payload->'closure',version=version+1 where id=sess.id returning * into sess;
 else raise exception 'INVALID_ACTION'; end if;
 return to_jsonb(sess)-'user_id';
end; $$;
revoke all on function public.thesis_tomas_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.thesis_tomas_command(uuid,text,jsonb) to service_role;
