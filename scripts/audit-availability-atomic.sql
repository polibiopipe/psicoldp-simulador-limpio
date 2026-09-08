-- Run as postgres on the verified project after installing the RPC.
-- All fixture users, profiles and schedules are rolled back.
begin;
set local statement_timeout = '20s';
do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  pending_user uuid := gen_random_uuid();
  original_rows jsonb;
  actual_rows jsonb;
  rejected boolean;
  bad_blocks jsonb;
  appointment_id uuid := gen_random_uuid();
  active_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values
    (user_a, 'agenda-atomic-' || user_a || '@example.invalid', '{}'),
    (user_b, 'agenda-atomic-' || user_b || '@example.invalid', '{}'),
    (pending_user, 'agenda-atomic-' || pending_user || '@example.invalid', '{}');
  update public.user_profiles set approved = true where id in (user_a, user_b);
  insert into public.simulation_student_availability (user_id, day_of_week, start_time, end_time)
  values (user_b, 2, '14:00', '16:00');

  perform set_config('request.jwt.claims', jsonb_build_object('sub',user_a,'role','authenticated')::text, true);
  set local role authenticated;
  perform public.replace_simulation_student_availability('[{"day_of_week":1,"start_time":"09:00","end_time":"12:00"}]');
  if (select count(*) from public.simulation_student_availability) <> 1 then
    raise exception 'FAIL: ownership isolation or valid replacement';
  end if;
  select jsonb_agg(to_jsonb(a) order by id) into original_rows
  from public.simulation_student_availability a where user_id = user_a;

  -- Each failure must restore the original row, including its ID and timestamps.
  foreach bad_blocks in array array[
    '[{"day_of_week":1,"start_time":"10:00","end_time":"11:00"},{"day_of_week":9,"start_time":"12:00","end_time":"13:00"}]'::jsonb,
    '[{"day_of_week":1,"start_time":"10:00","end_time":"12:00"},{"day_of_week":1,"start_time":"11:00","end_time":"13:00"}]'::jsonb,
    '[{"day_of_week":1,"start_time":"12:00","end_time":"09:00"}]'::jsonb,
    '[{"day_of_week":1,"start_time":"09:00"}]'::jsonb,
    '[{"day_of_week":1,"start_time":"invalid","end_time":"12:00"}]'::jsonb,
    '{}'::jsonb,
    'null'::jsonb
  ] loop
    rejected := false;
    begin
      perform public.replace_simulation_student_availability(bad_blocks);
    exception when others then
      rejected := true;
    end;
    if not rejected then raise exception 'FAIL: invalid payload accepted: %', bad_blocks; end if;
    select jsonb_agg(to_jsonb(a) order by id) into actual_rows
    from public.simulation_student_availability a where user_id = user_a;
    if actual_rows is distinct from original_rows then raise exception 'FAIL: failed replacement changed original rows'; end if;
  end loop;

  -- The client cannot choose another owner or timezone.
  perform public.replace_simulation_student_availability(jsonb_build_array(jsonb_build_object(
    'user_id',user_b,'day_of_week',3,'start_time','10:00','end_time','11:00','timezone','UTC')));
  if not exists (select 1 from public.simulation_student_availability where user_id=user_a and day_of_week=3 and timezone='America/Santiago') then
    raise exception 'FAIL: identity or timezone not enforced';
  end if;
  update public.simulation_student_availability set start_time='13:00' where user_id=user_b;
  if found then raise exception 'FAIL: could update another user'; end if;
  delete from public.simulation_student_availability where user_id=user_b;
  if found then raise exception 'FAIL: could delete another user'; end if;

  perform public.replace_simulation_student_availability('[]');
  if exists (select 1 from public.simulation_student_availability) then raise exception 'FAIL: empty replacement'; end if;

  -- Exercise real appointment constraints and the client's guarded write filters.
  -- Fixture profiles inherit the project's existing global QA policy.
  insert into public.simulation_appointments (id,user_id,case_id,case_name,session_number,scheduled_for,scheduled_local_date)
  values (appointment_id,user_a,'agenda-atomic-test','Temporary agenda test',1,'2099-01-05T12:00:00Z','2099-01-05');
  if not exists (select 1 from public.simulation_appointments where id=appointment_id and status='scheduled') then
    raise exception 'FAIL: reservation was not persisted';
  end if;
  rejected := false;
  begin
    insert into public.simulation_appointments (user_id,case_id,case_name,session_number,scheduled_for,scheduled_local_date)
    values (user_a,'agenda-atomic-test','Temporary agenda test',1,'2099-01-06T12:00:00Z','2099-01-06');
  exception when unique_violation then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate case/session accepted'; end if;
  update public.simulation_appointments set scheduled_for='2099-01-06T12:00:00Z'
  where id=appointment_id and user_id=user_a and status='scheduled';
  if not exists (select 1 from public.simulation_appointments where id=appointment_id and scheduled_local_date='2099-01-06') then
    raise exception 'FAIL: reschedule or Santiago derived date';
  end if;
  update public.simulation_appointments set status='cancelled',cancelled_at=now()
  where id=appointment_id and user_id=user_a and status='scheduled';
  if not found then raise exception 'FAIL: confirmed cancellation'; end if;
  update public.simulation_appointments set scheduled_for='2099-01-07T12:00:00Z'
  where id=appointment_id and user_id=user_a and status='scheduled';
  if found then raise exception 'FAIL: stale edit changed cancelled appointment'; end if;

  insert into public.simulation_appointments (id,user_id,case_id,case_name,session_number,scheduled_for,scheduled_local_date)
  values (active_id,user_a,'agenda-atomic-test','Temporary agenda test',2,'2099-01-07T12:00:00Z','2099-01-07');
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
  update public.simulation_appointments set status='in_progress',started_at=now(),ends_at=now()+interval '45 minutes' where id=active_id;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',user_a,'role','authenticated')::text, true);
  set local role authenticated;
  update public.simulation_appointments set scheduled_for='2099-01-08T12:00:00Z'
  where id=active_id and user_id=user_a and status='scheduled';
  if found then raise exception 'FAIL: stale edit changed started appointment'; end if;
  update public.simulation_appointments set status='cancelled',cancelled_at=now()
  where id=active_id and user_id=user_a and status='scheduled';
  if found then raise exception 'FAIL: stale cancellation changed started appointment'; end if;
  if not exists (select 1 from public.simulation_appointments where id=active_id and status='in_progress' and started_at is not null) then
    raise exception 'FAIL: active session continuity';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',pending_user,'role','authenticated')::text, true);
  rejected := false;
  begin
    perform public.replace_simulation_student_availability('[]');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: unapproved user accepted'; end if;
  perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  rejected := false;
  begin
    perform public.replace_simulation_student_availability('[]');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: missing identity accepted'; end if;
  reset role;
  if not exists (select 1 from public.simulation_student_availability where user_id=user_b and start_time='14:00' and end_time='16:00') then
    raise exception 'FAIL: other user changed';
  end if;
  if has_function_privilege('anon','public.replace_simulation_student_availability(jsonb)','execute') then
    raise exception 'FAIL: anonymous execute granted';
  end if;
end;
$$;
rollback;
select 'PASS: atomic availability, rollback, overlap, ownership, empty schedule, approval/auth checks; real reservations, duplicates, rescheduling, cancellation and stale edits after start; all fixtures rolled back' as result;
