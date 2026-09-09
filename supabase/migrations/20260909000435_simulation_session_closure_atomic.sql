-- No historical rows are modified. Existing ownership policies remain in force.
begin;

create or replace function public.guard_simulation_session_progress()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id or new.case_id is distinct from old.case_id
    or new.session_number is distinct from old.session_number
    or (old.appointment_id is not null and new.appointment_id is distinct from old.appointment_id) then
    raise exception 'Session identity cannot change' using errcode = '22023';
  end if;
  if (old.status = 'completed' and new.status <> 'completed')
    or (old.status = 'closure_pending' and new.status = 'in_progress') then
    raise exception 'A closed session cannot return to progress' using errcode = '22023';
  end if;
  if jsonb_typeof(new.conversation) <> 'array' or
    jsonb_array_length(new.conversation) < jsonb_array_length(old.conversation) then
    raise exception 'A stale save cannot remove conversation turns' using errcode = '22023';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$$;
revoke all on function public.guard_simulation_session_progress() from public, anon, authenticated;
drop trigger if exists guard_simulation_session_progress on public.simulation_sessions;
create trigger guard_simulation_session_progress before update on public.simulation_sessions
for each row execute function public.guard_simulation_session_progress();

create or replace function public.save_simulation_session_closure(p_record jsonb)
returns setof public.simulation_sessions
language plpgsql security invoker set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  record_id uuid := (p_record->>'id')::uuid;
  appointment_id_value uuid := nullif(p_record->>'appointment_id', '')::uuid;
  target_status text := p_record->>'status';
  appointment public.simulation_appointments;
  existing_session public.simulation_sessions;
begin
  if caller_id is null or not exists (
    select 1 from public.user_profiles p where p.id = caller_id and p.approved = true
  ) then raise exception 'Approved authentication required' using errcode = '42501'; end if;
  if record_id is null or (p_record->>'user_id')::uuid is distinct from caller_id
    or target_status is null or target_status not in ('closure_pending', 'completed')
    or jsonb_typeof(p_record->'conversation') is distinct from 'array' then
    raise exception 'Invalid closure payload' using errcode = '22023';
  end if;
  -- This lock also serializes retries when no previous session row exists.
  perform pg_advisory_xact_lock(hashtextextended('session:' || record_id::text, 0));
  if appointment_id_value is not null then
    select a.* into appointment from public.simulation_appointments a
      where a.id = appointment_id_value and a.user_id = caller_id for update;
    if not found or appointment.case_id is distinct from p_record->>'case_id'
      or appointment.session_number is distinct from (p_record->>'session_number')::integer
      or appointment.status not in ('in_progress', 'closure_pending', 'completed')
      or (appointment.status = 'completed' and target_status <> 'completed') then
      raise exception 'Appointment is not eligible for this closure' using errcode = '22023';
    end if;
  end if;
  select s.* into existing_session from public.simulation_sessions s where s.id = record_id for update;
  if found and (existing_session.user_id is distinct from caller_id
    or existing_session.case_id is distinct from p_record->>'case_id'
    or existing_session.session_number is distinct from (p_record->>'session_number')::integer) then
    raise exception 'Session identity mismatch' using errcode = '22023';
  end if;
  -- Legacy practices without appointment links may still complete their own record.
  if appointment_id_value is null and (not found or existing_session.user_id <> caller_id) then
    raise exception 'An existing session or appointment is required' using errcode = '22023';
  end if;
  return query
    insert into public.simulation_sessions as saved
      (id,user_id,user_email,case_id,case_name,session_number,appointment_id,conversation,feedback,score,status,started_at,ends_at,completed_at,created_at,updated_at)
    values
      (record_id,caller_id,p_record->>'user_email',p_record->>'case_id',p_record->>'case_name',
       (p_record->>'session_number')::integer,appointment_id_value,p_record->'conversation',coalesce(p_record->'feedback','{}'::jsonb),
       (p_record->>'score')::integer,target_status,
       coalesce(appointment.started_at, nullif(p_record->>'started_at','')::timestamptz),
       coalesce(appointment.ends_at, nullif(p_record->>'ends_at','')::timestamptz),
       case when target_status = 'completed' then coalesce(existing_session.completed_at,now()) else null end,
       coalesce(existing_session.created_at,now()),now())
    on conflict (id) do update set
      appointment_id = excluded.appointment_id, conversation = excluded.conversation,
      feedback = excluded.feedback, score = excluded.score, status = excluded.status,
      started_at = excluded.started_at, ends_at = excluded.ends_at,
      completed_at = excluded.completed_at, updated_at = excluded.updated_at
    returning saved.*;
  if appointment_id_value is not null and appointment.status <> target_status then
    update public.simulation_appointments a set status = target_status,
      completed_at = case when target_status = 'completed' then now() else a.completed_at end
      where a.id = appointment_id_value and a.user_id = caller_id;
    if not found then raise exception 'Appointment closure was not confirmed' using errcode = '42501'; end if;
  end if;
end;
$$;
revoke all on function public.save_simulation_session_closure(jsonb) from public, anon;
grant execute on function public.save_simulation_session_closure(jsonb) to authenticated;
commit;
