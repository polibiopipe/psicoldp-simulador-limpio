begin;

create table if not exists public.seminar_route_access (
  email text primary key check (email = lower(trim(email))),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.seminar_route_access enable row level security;

drop policy if exists seminar_route_access_read_own on public.seminar_route_access;
create policy seminar_route_access_read_own
on public.seminar_route_access
for select
to authenticated
using (
  enabled = true
  and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  and exists (
    select 1 from public.user_profiles profile
    where profile.id = auth.uid() and profile.approved = true
  )
);

revoke all on table public.seminar_route_access from anon;
grant select on table public.seminar_route_access to authenticated;

insert into public.seminar_route_access (email, enabled)
values
  ('polibio.solis@nucleovivo.net', true),
  ('leyla.llanos@nucleovivo.net', true),
  ('daniel.toledo@nucleovivo.net', true)
on conflict (email) do update set enabled = excluded.enabled;

commit;
