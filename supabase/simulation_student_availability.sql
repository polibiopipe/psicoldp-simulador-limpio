-- Disponibilidad personal por estudiante para Agenda Clinica Formativa.
-- Migracion aditiva. No reemplaza la politica de consumo de una sesion diaria.
-- Convenio day_of_week: 0=domingo, 1=lunes, 2=martes, 3=miercoles, 4=jueves, 5=viernes, 6=sabado.

begin;

do $$
begin
  if to_regclass('public.simulation_appointments') is null then
    raise exception 'public.simulation_appointments is required before running student availability migration';
  end if;
end;
$$;

create table if not exists public.simulation_student_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Santiago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulation_student_availability_day_check
    check (day_of_week between 0 and 6),
  constraint simulation_student_availability_time_order_check
    check (start_time < end_time),
  constraint simulation_student_availability_timezone_check
    check (timezone = 'America/Santiago')
);

create unique index if not exists simulation_student_availability_exact_block_idx
on public.simulation_student_availability (user_id, day_of_week, start_time, end_time);

create index if not exists simulation_student_availability_user_day_idx
on public.simulation_student_availability (user_id, day_of_week, start_time);

create or replace function public.set_simulation_student_availability_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_simulation_student_availability_block()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  if new.timezone <> 'America/Santiago' then
    raise exception 'availability timezone must be America/Santiago';
  end if;

  if new.start_time >= new.end_time then
    raise exception 'availability start_time must be before end_time';
  end if;

  if exists (
    select 1
    from public.simulation_student_availability other
    where other.user_id = new.user_id
      and other.day_of_week = new.day_of_week
      and other.id <> new.id
      and new.start_time < other.end_time
      and new.end_time > other.start_time
  ) then
    raise exception 'availability blocks cannot overlap';
  end if;

  return new;
end;
$$;

drop trigger if exists on_simulation_student_availability_updated_at
on public.simulation_student_availability;

create trigger on_simulation_student_availability_updated_at
before update on public.simulation_student_availability
for each row
execute function public.set_simulation_student_availability_updated_at();

drop trigger if exists on_simulation_student_availability_validate_block
on public.simulation_student_availability;

create trigger on_simulation_student_availability_validate_block
before insert or update of day_of_week, start_time, end_time, timezone, user_id
on public.simulation_student_availability
for each row
execute function public.validate_simulation_student_availability_block();

create or replace function public.validate_simulation_appointment_student_availability()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare
  caller_role text := '';
  local_start timestamp;
  local_end timestamp;
  local_day int;
  matching_block_exists boolean := false;
begin
  if new.status not in ('scheduled', 'in_progress') then
    return new;
  end if;

  if coalesce(new.timezone, 'America/Santiago') <> 'America/Santiago' then
    raise exception 'appointment timezone must be America/Santiago';
  end if;

  select coalesce(role, 'student')
  into caller_role
  from public.user_profiles
  where id = new.user_id;

  if caller_role in ('admin', 'qa') then
    return new;
  end if;

  local_start := new.scheduled_for at time zone 'America/Santiago';
  local_end := local_start + make_interval(mins => coalesce(new.duration_minutes, 45));

  if local_end::date <> local_start::date then
    raise exception 'appointment duration exceeds local day';
  end if;

  local_day := extract(dow from local_start);

  select exists (
    select 1
    from public.simulation_student_availability availability
    where availability.user_id = new.user_id
      and availability.day_of_week = local_day
      and availability.timezone = 'America/Santiago'
      and local_start::time >= availability.start_time
      and local_end::time <= availability.end_time
  )
  into matching_block_exists;

  if not matching_block_exists then
    raise exception 'appointment outside student availability';
  end if;

  return new;
end;
$$;

drop trigger if exists on_simulation_appointments_student_availability
on public.simulation_appointments;

create trigger on_simulation_appointments_student_availability
before insert or update of scheduled_for, duration_minutes, timezone, user_id
on public.simulation_appointments
for each row
execute function public.validate_simulation_appointment_student_availability();

alter table public.simulation_student_availability enable row level security;

drop policy if exists "Students can read own availability"
on public.simulation_student_availability;

create policy "Students can read own availability"
on public.simulation_student_availability
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.approved = true
  )
);

drop policy if exists "Students can insert own availability"
on public.simulation_student_availability;

create policy "Students can insert own availability"
on public.simulation_student_availability
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.approved = true
  )
);

drop policy if exists "Students can update own availability"
on public.simulation_student_availability;

create policy "Students can update own availability"
on public.simulation_student_availability
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.approved = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.approved = true
  )
);

drop policy if exists "Students can delete own availability"
on public.simulation_student_availability;

create policy "Students can delete own availability"
on public.simulation_student_availability
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.approved = true
  )
);

grant select, insert, update, delete on table public.simulation_student_availability to authenticated;
revoke all on table public.simulation_student_availability from anon;

commit;
