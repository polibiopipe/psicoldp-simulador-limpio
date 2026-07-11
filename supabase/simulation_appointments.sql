-- Escucha Viva RC v1.0 - Agenda clinica y control de consumo.
-- Migracion aditiva. Ejecutar despues de supabase/simulation_sessions.sql.

begin;

alter table public.user_profiles
add column if not exists role text not null default 'student';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_role_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles drop constraint user_profiles_role_check;
  end if;

  alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('student', 'admin', 'qa'));
end;
$$;

create table if not exists public.simulation_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  case_id text not null,
  case_name text not null,
  session_number integer not null,
  scheduled_for timestamptz not null,
  scheduled_local_date date not null,
  timezone text not null default 'America/Santiago',
  duration_minutes integer not null default 45,
  status text not null default 'scheduled',
  started_at timestamptz,
  ends_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulation_appointments_session_number_check check (session_number > 0),
  constraint simulation_appointments_duration_check check (duration_minutes > 0 and duration_minutes <= 180),
  constraint simulation_appointments_status_check check (
    status in ('scheduled', 'in_progress', 'closure_pending', 'completed', 'cancelled')
  )
);

alter table public.simulation_appointments
add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.set_simulation_appointment_derived_fields()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  new.timezone = coalesce(nullif(new.timezone, ''), 'America/Santiago');
  new.scheduled_local_date = (new.scheduled_for at time zone new.timezone)::date;
  return new;
end;
$$;

create or replace function public.set_simulation_appointment_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_simulation_appointment_transition()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare
  caller_role text := coalesce(auth.role(), '');
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.user_id <> old.user_id then
    raise exception 'simulation_appointments.user_id cannot be changed';
  end if;

  if caller_role = 'authenticated' then
    if new.started_at is distinct from old.started_at or new.ends_at is distinct from old.ends_at then
      raise exception 'started_at and ends_at can only be managed by the server';
    end if;

    if new.completed_at is distinct from old.completed_at and new.status <> 'completed' then
      raise exception 'completed_at can only change when completing a session';
    end if;

    if new.cancelled_at is distinct from old.cancelled_at and new.status <> 'cancelled' then
      raise exception 'cancelled_at can only change when cancelling a scheduled session';
    end if;

    if old.status <> 'scheduled' and (
      new.case_id is distinct from old.case_id or
      new.case_name is distinct from old.case_name or
      new.session_number is distinct from old.session_number or
      new.scheduled_for is distinct from old.scheduled_for or
      new.scheduled_local_date is distinct from old.scheduled_local_date or
      new.timezone is distinct from old.timezone or
      new.duration_minutes is distinct from old.duration_minutes
    ) then
      raise exception 'consumed appointments cannot be rescheduled or reassigned by the client';
    end if;
  end if;

  if old.status = new.status then
    if old.status in ('completed', 'cancelled') then
      raise exception 'closed appointments cannot be modified';
    end if;
    return new;
  end if;

  if old.status = 'scheduled' and new.status = 'cancelled' then
    return new;
  end if;

  if old.status = 'scheduled' and new.status = 'in_progress' and caller_role <> 'authenticated' then
    return new;
  end if;

  if old.status = 'in_progress' and new.status in ('closure_pending', 'completed') then
    return new;
  end if;

  if old.status = 'closure_pending' and new.status = 'completed' then
    return new;
  end if;

  raise exception 'invalid simulation appointment status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists on_simulation_appointments_derived_fields on public.simulation_appointments;
create trigger on_simulation_appointments_derived_fields
before insert or update of scheduled_for, timezone on public.simulation_appointments
for each row
execute function public.set_simulation_appointment_derived_fields();

drop trigger if exists on_simulation_appointments_updated_at on public.simulation_appointments;
create trigger on_simulation_appointments_updated_at
before update on public.simulation_appointments
for each row
execute function public.set_simulation_appointment_updated_at();

drop trigger if exists on_simulation_appointments_validate_transition on public.simulation_appointments;
create trigger on_simulation_appointments_validate_transition
before update on public.simulation_appointments
for each row
execute function public.validate_simulation_appointment_transition();

alter table public.simulation_sessions
add column if not exists status text;

update public.simulation_sessions
set status = 'completed'
where status is null or btrim(status) = '';

alter table public.simulation_sessions
alter column status set default 'completed';

alter table public.simulation_sessions
alter column status set not null;

alter table public.simulation_sessions
add column if not exists updated_at timestamptz;

update public.simulation_sessions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.simulation_sessions
alter column updated_at set default now();

alter table public.simulation_sessions
alter column updated_at set not null;

alter table public.simulation_sessions
add column if not exists appointment_id uuid references public.simulation_appointments(id) on delete set null;

alter table public.simulation_sessions
add column if not exists started_at timestamptz;

alter table public.simulation_sessions
add column if not exists ends_at timestamptz;

alter table public.simulation_sessions
add column if not exists completed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'simulation_sessions_status_check'
      and conrelid = 'public.simulation_sessions'::regclass
  ) then
    alter table public.simulation_sessions drop constraint simulation_sessions_status_check;
  end if;

  alter table public.simulation_sessions
  add constraint simulation_sessions_status_check
  check (status in ('in_progress', 'closure_pending', 'completed'));
end;
$$;

create or replace function public.set_simulation_session_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_simulation_sessions_updated_at on public.simulation_sessions;
create trigger on_simulation_sessions_updated_at
before update on public.simulation_sessions
for each row
execute function public.set_simulation_session_updated_at();

drop index if exists public.simulation_appointments_one_active_per_user_day_idx;
create unique index simulation_appointments_one_active_per_user_day_idx
on public.simulation_appointments (user_id, scheduled_local_date)
where status <> 'cancelled';

drop index if exists public.simulation_appointments_one_active_case_session_idx;
create unique index simulation_appointments_one_active_case_session_idx
on public.simulation_appointments (user_id, case_id, session_number)
where status <> 'cancelled';

create index if not exists simulation_appointments_user_scheduled_idx
on public.simulation_appointments (user_id, scheduled_for);

create index if not exists simulation_appointments_user_status_idx
on public.simulation_appointments (user_id, status, scheduled_for);

create index if not exists simulation_sessions_appointment_idx
on public.simulation_sessions (appointment_id);

create unique index if not exists simulation_sessions_one_record_per_appointment_idx
on public.simulation_sessions (appointment_id)
where appointment_id is not null;

create table if not exists public.simulation_interventions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.simulation_appointments(id) on delete cascade,
  session_id uuid references public.simulation_sessions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  intervention_id uuid not null,
  case_id text not null,
  turn_number integer,
  status text not null default 'reserved',
  response_text text,
  response_source text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  constraint simulation_interventions_turn_number_check check (turn_number is null or turn_number > 0),
  constraint simulation_interventions_status_check check (status in ('reserved', 'completed', 'failed'))
);

create unique index if not exists simulation_interventions_unique_intervention_idx
on public.simulation_interventions (appointment_id, intervention_id);

drop index if exists public.simulation_interventions_one_processing_idx;
create unique index if not exists simulation_interventions_one_reserved_idx
on public.simulation_interventions (appointment_id)
where status = 'reserved';

create index if not exists simulation_interventions_turn_count_idx
on public.simulation_interventions (appointment_id, status, completed_at);

create or replace function public.set_simulation_intervention_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_simulation_interventions_updated_at on public.simulation_interventions;
create trigger on_simulation_interventions_updated_at
before update on public.simulation_interventions
for each row
execute function public.set_simulation_intervention_updated_at();

create or replace function public.reserve_simulation_intervention(
  p_appointment_id uuid,
  p_session_id uuid,
  p_intervention_id uuid,
  p_user_id uuid,
  p_case_id text,
  p_max_turns integer default 24
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  appointment_record public.simulation_appointments%rowtype;
  intervention_record public.simulation_interventions%rowtype;
  completed_turns integer;
begin
  if auth.role() = 'authenticated' and auth.uid() <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'AUTH_USER_MISMATCH');
  end if;

  select *
  into appointment_record
  from public.simulation_appointments
  where id = p_appointment_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'APPOINTMENT_NOT_FOUND');
  end if;

  if appointment_record.user_id <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'APPOINTMENT_NOT_OWNED');
  end if;

  if appointment_record.case_id <> p_case_id then
    return jsonb_build_object('ok', false, 'code', 'CASE_MISMATCH');
  end if;

  if appointment_record.status in ('completed', 'cancelled') then
    return jsonb_build_object('ok', false, 'code', 'SESSION_ALREADY_CLOSED');
  end if;

  if appointment_record.status = 'closure_pending' then
    return jsonb_build_object('ok', false, 'code', 'CLOSURE_PENDING');
  end if;

  update public.simulation_interventions
  set
    status = 'failed',
    failed_at = now(),
    error_code = 'RESERVATION_EXPIRED',
    updated_at = now()
  where appointment_id = p_appointment_id
    and status = 'reserved'
    and created_at < now() - interval '10 minutes';

  select *
  into intervention_record
  from public.simulation_interventions
  where appointment_id = p_appointment_id
    and intervention_id = p_intervention_id;

  if found and intervention_record.status = 'completed' then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'code', 'INTERVENTION_ALREADY_COMPLETED',
      'responseText', intervention_record.response_text,
      'source', coalesce(intervention_record.response_source, 'gemini')
    );
  end if;

  if found and intervention_record.status = 'reserved' then
    return jsonb_build_object('ok', false, 'code', 'INTERVENTION_ALREADY_RESERVED');
  end if;

  if exists (
    select 1
    from public.simulation_interventions
    where appointment_id = p_appointment_id
      and status = 'reserved'
      and intervention_id <> p_intervention_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'SESSION_ALREADY_ACTIVE');
  end if;

  select count(*)
  into completed_turns
  from public.simulation_interventions
  where appointment_id = p_appointment_id
    and status = 'completed';

  if completed_turns >= p_max_turns then
    return jsonb_build_object('ok', false, 'code', 'TURN_LIMIT_REACHED');
  end if;

  insert into public.simulation_interventions (
    appointment_id,
    session_id,
    user_id,
    intervention_id,
    case_id,
    turn_number,
    status
  )
  values (
    p_appointment_id,
    p_session_id,
    p_user_id,
    p_intervention_id,
    p_case_id,
    completed_turns + 1,
    'reserved'
  )
  on conflict (appointment_id, intervention_id)
  do update
  set
    session_id = coalesce(excluded.session_id, public.simulation_interventions.session_id),
    turn_number = coalesce(public.simulation_interventions.turn_number, excluded.turn_number),
    status = 'reserved',
    failed_at = null,
    error_code = null,
    updated_at = now()
  where public.simulation_interventions.status = 'failed';

  return jsonb_build_object('ok', true, 'duplicate', false, 'completedTurns', completed_turns);
end;
$$;

create or replace function public.complete_simulation_intervention(
  p_appointment_id uuid,
  p_intervention_id uuid,
  p_user_id uuid,
  p_response_text text,
  p_response_source text default 'gemini'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  appointment_record public.simulation_appointments%rowtype;
  intervention_record public.simulation_interventions%rowtype;
  started_value timestamptz;
  ends_value timestamptz;
begin
  if auth.role() = 'authenticated' and auth.uid() <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'AUTH_USER_MISMATCH');
  end if;

  select *
  into appointment_record
  from public.simulation_appointments
  where id = p_appointment_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'APPOINTMENT_NOT_FOUND');
  end if;

  if appointment_record.user_id <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'APPOINTMENT_NOT_OWNED');
  end if;

  select *
  into intervention_record
  from public.simulation_interventions
  where appointment_id = p_appointment_id
    and intervention_id = p_intervention_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'INTERVENTION_NOT_RESERVED');
  end if;

  if intervention_record.status = 'completed' then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'responseText', intervention_record.response_text,
      'source', coalesce(intervention_record.response_source, 'gemini')
    );
  end if;

  if intervention_record.status <> 'reserved' then
    return jsonb_build_object('ok', false, 'code', 'INTERVENTION_NOT_RESERVED');
  end if;

  if appointment_record.status = 'scheduled' then
    if exists (
      select 1
      from public.simulation_appointments other
      where other.user_id = p_user_id
        and other.id <> appointment_record.id
        and other.scheduled_local_date = appointment_record.scheduled_local_date
        and other.status in ('in_progress', 'closure_pending', 'completed')
    ) then
      update public.simulation_interventions
      set status = 'failed', failed_at = now(), error_code = 'DAILY_LIMIT_REACHED'
      where id = intervention_record.id;
      return jsonb_build_object('ok', false, 'code', 'DAILY_LIMIT_REACHED');
    end if;

    started_value := now();
    ends_value := started_value + (appointment_record.duration_minutes * interval '1 minute');

    update public.simulation_appointments
    set
      status = 'in_progress',
      started_at = started_value,
      ends_at = ends_value,
      updated_at = now()
    where id = appointment_record.id
      and status = 'scheduled';
  elsif appointment_record.status = 'in_progress' then
    if appointment_record.ends_at is not null and now() > appointment_record.ends_at then
      update public.simulation_interventions
      set status = 'failed', failed_at = now(), error_code = 'SESSION_TIME_EXPIRED'
      where id = intervention_record.id;
      return jsonb_build_object('ok', false, 'code', 'SESSION_TIME_EXPIRED');
    end if;
  else
    update public.simulation_interventions
    set status = 'failed', failed_at = now(), error_code = 'SESSION_ALREADY_CLOSED'
    where id = intervention_record.id;
    return jsonb_build_object('ok', false, 'code', 'SESSION_ALREADY_CLOSED');
  end if;

  update public.simulation_interventions
  set
    status = 'completed',
    response_text = p_response_text,
    response_source = p_response_source,
    error_code = null,
    completed_at = now(),
    updated_at = now()
  where id = intervention_record.id;

  return jsonb_build_object('ok', true, 'duplicate', false);
end;
$$;

create or replace function public.fail_simulation_intervention(
  p_appointment_id uuid,
  p_intervention_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() <> p_user_id then
    return;
  end if;

  update public.simulation_interventions
  set
    status = 'failed',
    failed_at = now(),
    error_code = 'ENDPOINT_RELEASED',
    updated_at = now()
  where appointment_id = p_appointment_id
    and intervention_id = p_intervention_id
    and user_id = p_user_id
    and status = 'reserved';
end;
$$;

revoke all on function public.reserve_simulation_intervention(uuid, uuid, uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.complete_simulation_intervention(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.fail_simulation_intervention(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_simulation_intervention(uuid, uuid, uuid, uuid, text, integer) to service_role;
grant execute on function public.complete_simulation_intervention(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.fail_simulation_intervention(uuid, uuid, uuid) to service_role;

alter table public.simulation_appointments enable row level security;
alter table public.simulation_interventions enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'simulation_appointments'
  loop
    execute format('drop policy if exists %I on public.simulation_appointments', policy_record.policyname);
  end loop;
end;
$$;

create policy "Approved users can read their own simulation appointments"
on public.simulation_appointments
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

create policy "Approved users can insert their own simulation appointments"
on public.simulation_appointments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

create policy "Approved users can update their own simulation appointments"
on public.simulation_appointments
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
)
with check (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

revoke all on table public.simulation_appointments from anon, authenticated;
grant select, insert, update on table public.simulation_appointments to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'simulation_interventions'
  loop
    execute format('drop policy if exists %I on public.simulation_interventions', policy_record.policyname);
  end loop;
end;
$$;

create policy "Approved users can read their own simulation interventions"
on public.simulation_interventions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

revoke all on table public.simulation_interventions from anon, authenticated;
grant select on table public.simulation_interventions to authenticated;

commit;
