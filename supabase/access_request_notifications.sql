-- Escucha Viva: queue one access notification after email confirmation.
-- Run after supabase/simulation_sessions.sql.

begin;

create table if not exists public.access_approval_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  registered_at timestamptz not null,
  requested_at timestamptz not null default now(),
  approval_token_hash text,
  approval_token_expires_at timestamptz,
  approved_at timestamptz,
  used_at timestamptz,
  email_sent_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint access_approval_notifications_status_check
    check (status in ('pending', 'approved', 'expired'))
);

alter table public.access_approval_notifications
  add column if not exists approval_token_hash text;
alter table public.access_approval_notifications
  add column if not exists approval_token_expires_at timestamptz;
alter table public.access_approval_notifications
  add column if not exists approved_at timestamptz;
alter table public.access_approval_notifications
  add column if not exists used_at timestamptz;
alter table public.access_approval_notifications
  add column if not exists email_sent_at timestamptz;

alter table public.access_approval_notifications
  drop constraint if exists access_approval_notifications_status_check;
alter table public.access_approval_notifications
  add constraint access_approval_notifications_status_check
  check (status in ('pending', 'approved', 'expired'));

alter table public.access_approval_notifications enable row level security;
revoke all on table public.access_approval_notifications from anon, authenticated;

create or replace function public.queue_access_approval_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.user_profiles as profiles (
    id,
    email,
    full_name,
    approved,
    role,
    created_at
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    false,
    'student',
    new.created_at
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    role = coalesce(profiles.role, excluded.role);

  if exists (
    select 1
    from public.user_profiles
    where id = new.id
      and approved = false
  ) then
    insert into public.access_approval_notifications (
      user_id,
      email,
      full_name,
      registered_at,
      requested_at,
      status
    )
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      new.created_at,
      coalesce(new.email_confirmed_at, now()),
      'pending'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.queue_access_approval_notification()
from public, anon, authenticated;

drop trigger if exists on_auth_user_inserted_confirmed_queue_access_notification
on auth.users;
create trigger on_auth_user_inserted_confirmed_queue_access_notification
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null and new.email is not null)
  execute function public.queue_access_approval_notification();

drop trigger if exists on_auth_user_email_confirmed_queue_access_notification
on auth.users;
create trigger on_auth_user_email_confirmed_queue_access_notification
  after update of email_confirmed_at on auth.users
  for each row
  when (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
    and new.email is not null
  )
  execute function public.queue_access_approval_notification();

create index if not exists access_approval_notifications_created_at_idx
on public.access_approval_notifications (created_at desc);

create unique index if not exists access_approval_notifications_token_hash_idx
on public.access_approval_notifications (approval_token_hash)
where approval_token_hash is not null;

create or replace function public.approve_access_with_token_hash(p_token_hash text)
returns table (
  outcome text,
  approved_user_id uuid,
  approved_email text,
  approved_full_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_record public.access_approval_notifications%rowtype;
  approval_time timestamptz := now();
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    return query select
      'invalid'::text,
      null::uuid,
      null::text,
      null::text;
    return;
  end if;

  select *
  into notification_record
  from public.access_approval_notifications
  where approval_token_hash = p_token_hash
  for update;

  if not found then
    return query select
      'invalid'::text,
      null::uuid,
      null::text,
      null::text;
    return;
  end if;

  if notification_record.status = 'approved'
    or notification_record.used_at is not null then
    return query select
      'used'::text,
      notification_record.user_id,
      notification_record.email,
      notification_record.full_name;
    return;
  end if;

  if notification_record.status = 'expired'
    or notification_record.approval_token_expires_at is null
    or notification_record.approval_token_expires_at <= approval_time then
    update public.access_approval_notifications
    set status = 'expired'
    where id = notification_record.id
      and status = 'pending';

    return query select
      'expired'::text,
      notification_record.user_id,
      notification_record.email,
      notification_record.full_name;
    return;
  end if;

  insert into public.user_profiles as profiles (
    id,
    email,
    full_name,
    approved,
    role
  )
  values (
    notification_record.user_id,
    notification_record.email,
    notification_record.full_name,
    false,
    'student'
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    role = coalesce(profiles.role, excluded.role);

  update public.user_profiles
  set
    approved = true,
    approved_at = coalesce(approved_at, approval_time)
  where id = notification_record.user_id;

  update public.access_approval_notifications
  set
    status = 'approved',
    approved_at = approval_time,
    used_at = approval_time
  where id = notification_record.id;

  return query select
    'approved'::text,
    notification_record.user_id,
    notification_record.email,
    notification_record.full_name;
end;
$$;

revoke all on function public.approve_access_with_token_hash(text)
from public, anon, authenticated;
grant execute on function public.approve_access_with_token_hash(text)
to service_role;

commit;
