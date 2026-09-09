-- One verified student, one initial simulator choice. Existing grants win.
begin;

-- End the pilot-only rule that promoted every new account to QA.
-- Existing team/test roles remain unchanged.
drop trigger if exists on_user_profiles_force_global_qa on public.user_profiles;

create function simulator_private.enroll_verified_student(requested_simulator text, expected_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  account auth.users%rowtype;
  assignment public.simulator_access%rowtype;
  participant_role text;
begin
  if caller is null or caller is distinct from expected_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if requested_simulator is null or requested_simulator not in ('escucha-viva','umbral-primera-infancia') then
    raise exception 'Invalid simulator' using errcode = '22023';
  end if;
  select * into account from auth.users where id = caller for update;
  if not found or account.email is null or account.email_confirmed_at is null
    or coalesce(account.is_anonymous,false) or account.banned_until > now() then
    raise exception 'A verified active email account is required' using errcode = '42501';
  end if;
  select * into assignment from public.simulator_access where user_id = caller;
  if not found then
    select role into participant_role from public.user_profiles where id = caller;
    if participant_role is distinct from 'student' then
      raise exception 'Student profile required' using errcode = '42501';
    end if;
    insert into public.simulator_access(user_id,simulator_id,enabled)
    values (caller,requested_simulator,true)
    on conflict (user_id) do nothing;
    select * into assignment from public.simulator_access where user_id = caller;
  end if;
  return jsonb_build_object('user_id',assignment.user_id,
    'simulator_id',assignment.simulator_id,'enabled',assignment.enabled);
end;
$$;
revoke all on function simulator_private.enroll_verified_student(text,uuid) from public, anon;
grant usage on schema simulator_private to authenticated;
grant execute on function simulator_private.enroll_verified_student(text,uuid) to authenticated;

-- The exposed wrapper is invoker-only; privilege is narrowly scoped above.
create function public.enroll_in_simulator(requested_simulator text, expected_user_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select simulator_private.enroll_verified_student(requested_simulator, expected_user_id);
$$;
revoke all on function public.enroll_in_simulator(text,uuid) from public, anon;
grant execute on function public.enroll_in_simulator(text,uuid) to authenticated;
comment on function public.enroll_in_simulator(text,uuid) is
  'Self-enrollment for verified students. First assignment only; never switches, re-enables, or changes roles. No user metadata is used for authorization.';
comment on table public.simulator_access is
  'One simulator per account. Initial enrollment via verified-student RPC or administrative assignment; clients cannot write this table directly.';
notify pgrst, 'reload schema';
commit;
