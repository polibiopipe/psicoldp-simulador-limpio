-- Escucha Viva: perfiles, aprobación manual y sesiones protegidas.
-- Ejecutar este archivo completo en Supabase SQL Editor.

begin;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  approved boolean not null default false,
  role text not null default 'student',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  constraint user_profiles_role_check check (role in ('student', 'admin'))
);

alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists approved boolean not null default false;
alter table public.user_profiles add column if not exists role text not null default 'student';
alter table public.user_profiles add column if not exists created_at timestamptz not null default now();
alter table public.user_profiles add column if not exists approved_at timestamptz;
alter table public.user_profiles add column if not exists approved_by uuid references auth.users(id) on delete set null;

update public.user_profiles set approved = false where approved is null;
update public.user_profiles set role = 'student' where role is null;
update public.user_profiles set created_at = now() where created_at is null;
alter table public.user_profiles alter column approved set default false;
alter table public.user_profiles alter column approved set not null;
alter table public.user_profiles alter column role set default 'student';
alter table public.user_profiles alter column role set not null;
alter table public.user_profiles alter column created_at set default now();
alter table public.user_profiles alter column created_at set not null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles as profiles (id, email, full_name, approved, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    false,
    'student'
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    role = coalesce(profiles.role, excluded.role);
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.sync_profile_approval_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.approved = true and old.approved = false then
    new.approved_at = coalesce(new.approved_at, now());
  elsif new.approved = false then
    new.approved_at = null;
    new.approved_by = null;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_profile_approval_metadata() from public, anon, authenticated;

drop trigger if exists on_user_profile_approval_change on public.user_profiles;
create trigger on_user_profile_approval_change
  before update of approved on public.user_profiles
  for each row execute function public.sync_profile_approval_metadata();

-- Crea perfiles pendientes para usuarios registrados antes de esta migración.
insert into public.user_profiles as profiles (id, email, full_name, approved, role, created_at)
select
  users.id,
  users.email,
  users.raw_user_meta_data ->> 'full_name',
  false,
  'student',
  users.created_at
from auth.users as users
on conflict (id) do update
set
  email = coalesce(excluded.email, profiles.email),
  full_name = coalesce(profiles.full_name, excluded.full_name),
  role = coalesce(profiles.role, excluded.role);

alter table public.user_profiles enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles'
  loop
    execute format('drop policy if exists %I on public.user_profiles', policy_record.policyname);
  end loop;
end;
$$;

create policy "Users can read their own approval profile"
on public.user_profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or lower(email) = lower((select auth.jwt() ->> 'email'))
);

create policy "Users can create only their own pending profile"
on public.user_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and approved = false
  and role = 'student'
  and approved_at is null
  and approved_by is null
);

revoke all on table public.user_profiles from anon, authenticated;
grant select, insert on table public.user_profiles to authenticated;

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and approved = true
  );
$$;

revoke all on function public.current_user_is_approved() from public, anon;
grant execute on function public.current_user_is_approved() to authenticated;

create table if not exists public.simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  case_id text not null,
  case_name text not null,
  session_number integer not null,
  conversation jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  score integer,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.simulation_sessions
add column if not exists status text not null default 'completed';

alter table public.simulation_sessions
add column if not exists updated_at timestamptz not null default now();

alter table public.simulation_sessions
alter column status set default 'completed';

alter table public.simulation_sessions
alter column updated_at set default now();

update public.simulation_sessions
set status = coalesce(nullif(status, ''), 'completed')
where status is null or status = '';

update public.simulation_sessions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.simulation_sessions
alter column status set not null;

alter table public.simulation_sessions
alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'simulation_sessions_status_check'
      and conrelid = 'public.simulation_sessions'::regclass
  ) then
    alter table public.simulation_sessions
    add constraint simulation_sessions_status_check
    check (status in ('in_progress', 'completed'));
  end if;
end;
$$;

create or replace function public.set_simulation_session_updated_at()
returns trigger
language plpgsql
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

alter table public.simulation_sessions enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'simulation_sessions'
  loop
    execute format('drop policy if exists %I on public.simulation_sessions', policy_record.policyname);
  end loop;
end;
$$;

create policy "Approved users can insert their own simulation sessions"
on public.simulation_sessions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

create policy "Approved users can read their own simulation sessions"
on public.simulation_sessions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

create policy "Approved users can update their own simulation sessions"
on public.simulation_sessions
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

create policy "Approved users can delete their own simulation sessions"
on public.simulation_sessions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_user_is_approved()
);

revoke all on table public.simulation_sessions from anon, authenticated;
grant select, insert, update, delete on table public.simulation_sessions to authenticated;

create index if not exists user_profiles_approved_idx
on public.user_profiles (approved, created_at desc);

create index if not exists simulation_sessions_user_created_at_idx
on public.simulation_sessions (user_id, created_at desc);

create index if not exists simulation_sessions_user_status_updated_at_idx
on public.simulation_sessions (user_id, status, updated_at desc);

create index if not exists simulation_sessions_user_case_session_idx
on public.simulation_sessions (user_id, case_id, session_number, status);

commit;
