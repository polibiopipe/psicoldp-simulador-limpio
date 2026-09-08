-- Apply after simulation_student_availability.sql and before deploying its RPC client.
-- Creates the replacement operation; applying this migration does not change schedules.
begin;

create or replace function public.replace_simulation_student_availability(p_blocks jsonb)
returns setof public.simulation_student_availability
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or not exists (
    select 1 from public.user_profiles profile
    where profile.id = caller_id and profile.approved = true
  ) then
    raise exception 'Approved authentication required' using errcode = '42501';
  end if;

  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Availability blocks must be a JSON array' using errcode = '22023';
  end if;

  -- Serialize replacement calls for this user, including an empty schedule.
  perform pg_advisory_xact_lock(hashtextextended('availability:' || caller_id::text, 0));

  delete from public.simulation_student_availability where user_id = caller_id;

  -- Existing constraints, overlap trigger and RLS remain in force. Any error
  -- rolls back this entire call, including the deletion above.
  insert into public.simulation_student_availability
    (user_id, day_of_week, start_time, end_time, timezone)
  select caller_id, block.day_of_week, block.start_time, block.end_time, 'America/Santiago'
  from jsonb_to_recordset(p_blocks) as block(day_of_week smallint, start_time time, end_time time);

  return query
    select availability.* from public.simulation_student_availability availability
    where availability.user_id = caller_id
    order by availability.day_of_week, availability.start_time;
end;
$$;

revoke all on function public.replace_simulation_student_availability(jsonb) from public;
revoke all on function public.replace_simulation_student_availability(jsonb) from anon;
grant execute on function public.replace_simulation_student_availability(jsonb) to authenticated;

commit;
