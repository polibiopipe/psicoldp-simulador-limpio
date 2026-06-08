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
  created_at timestamptz not null default now()
);

alter table public.simulation_sessions enable row level security;

create policy "Users can insert their own simulation sessions"
on public.simulation_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read their own simulation sessions"
on public.simulation_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own simulation sessions"
on public.simulation_sessions
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists simulation_sessions_user_created_at_idx
on public.simulation_sessions (user_id, created_at desc);
