-- Additive migration. Requires simulation_sessions.sql + simulation_appointments.sql.
-- Starts disabled. Does not change existing session or profile access policies.
begin;

create table if not exists public.research_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  protocol_version text not null default '',
  participant_information text not null default '',
  constraint research_settings_information_check check (
    not enabled or (length(trim(protocol_version)) > 0 and length(trim(participant_information)) >= 100)
  )
);
insert into public.research_settings (id) values (true) on conflict do nothing;

create table if not exists public.research_team (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true
);

create table if not exists public.research_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_code uuid not null unique default gen_random_uuid(),
  protocol_version text not null,
  information_snapshot text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index if not exists research_one_active_consent
  on public.research_consents(user_id) where revoked_at is null;

create table if not exists public.research_session_scope (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.simulation_sessions(id) on delete cascade,
  consent_id uuid not null references public.research_consents(id) on delete cascade
);
create index if not exists research_scope_consent_idx on public.research_session_scope(consent_id);

alter table public.research_settings enable row level security;
alter table public.research_team enable row level security;
alter table public.research_consents enable row level security;
alter table public.research_session_scope enable row level security;
revoke all on public.research_settings, public.research_team,
  public.research_consents, public.research_session_scope from public, anon, authenticated;

create or replace function public.research_context()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  settings public.research_settings;
  consent public.research_consents;
begin
  if auth.uid() is null or not public.current_user_is_approved() then
    raise exception 'Approved authentication required' using errcode = '42501';
  end if;
  select * into settings from public.research_settings where id = true;
  select * into consent from public.research_consents
    where user_id = auth.uid() and revoked_at is null;
  return jsonb_build_object(
    'enabled', coalesce(settings.enabled, false),
    'protocolVersion', settings.protocol_version,
    'information', settings.participant_information,
    'canReview', exists(select 1 from public.research_team where user_id = auth.uid() and enabled),
    'hasConsent', consent.id is not null,
    'currentConsent', consent.id is not null and consent.protocol_version = settings.protocol_version,
    'consentVersion', consent.protocol_version,
    'consentedAt', consent.consented_at
  );
end;
$$;

create or replace function public.set_research_consent(p_accepted boolean, p_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  settings public.research_settings;
  existing_consent public.research_consents;
begin
  if auth.uid() is null or not public.current_user_is_approved() then
    raise exception 'Approved authentication required' using errcode = '42501';
  end if;
  if p_accepted is null then raise exception 'Decision required'; end if;
  -- Serializes concurrent decisions and protocol changes.
  select * into settings from public.research_settings where id = true for update;
  if p_accepted and (not coalesce(settings.enabled, false)
      or p_version is distinct from settings.protocol_version) then
    raise exception 'Protocol unavailable or changed';
  end if;
  select * into existing_consent from public.research_consents
    where user_id = auth.uid() and revoked_at is null;
  if p_accepted and existing_consent.protocol_version = p_version then
    return public.research_context();
  end if;
  update public.research_consents set revoked_at = now()
    where user_id = auth.uid() and revoked_at is null;
  if p_accepted then
    insert into public.research_consents(user_id, protocol_version, information_snapshot)
      values (auth.uid(), settings.protocol_version, settings.participant_information);
  end if;
  return public.research_context();
end;
$$;

create or replace function public.register_research_session()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Only brand-new sessions started after consent are eligible. No historical backfill.
  insert into public.research_session_scope(session_id, consent_id)
  select new.id, consent.id
  from public.research_consents consent
  join public.research_settings settings on settings.id = true and settings.enabled
  where consent.user_id = new.user_id and consent.revoked_at is null
    and consent.protocol_version = settings.protocol_version
    and new.started_at >= consent.consented_at
    and new.started_at <= now()
    and new.status = 'in_progress'
  on conflict (session_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_session_created_research_scope on public.simulation_sessions;
create trigger on_session_created_research_scope after insert on public.simulation_sessions
  for each row execute function public.register_research_session();

create or replace function public.research_statistics_page(p_after uuid default null, p_limit integer default 500)
returns table (
  id uuid, participant_code text, case_id text, session_number integer,
  status text, started_at timestamptz, created_at timestamptz,
  metrics jsonb, general_score jsonb, openness jsonb,
  measurement_version text, consent_version text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.current_user_is_approved()
    or not exists(select 1 from public.research_team where user_id = auth.uid() and enabled) then
    raise exception 'Research team access required' using errcode = '42501';
  end if;
  return query
  select scope.id, 'EV-' || consent.participant_code::text, session.case_id,
    session.session_number, session.status, session.started_at, session.created_at,
    jsonb_build_object(
      'elapsedSeconds', session.feedback #> '{sessionMetrics,elapsedSeconds}',
      'studentTurnCount', session.feedback #> '{sessionMetrics,studentTurnCount}',
      'endReason', session.feedback #> '{sessionMetrics,endReason}'
    ),
    session.feedback -> 'generalScore',
    session.feedback #> '{patientOpenness,final}',
    session.feedback ->> 'measurementVersion', consent.protocol_version
  from public.research_session_scope scope
  join public.simulation_sessions session on session.id = scope.session_id
  join public.research_consents consent on consent.id = scope.consent_id and consent.user_id = session.user_id
  join public.research_settings settings on settings.id = true and settings.enabled
  where consent.revoked_at is null and consent.protocol_version = settings.protocol_version
    and (p_after is null or scope.id > p_after)
  order by scope.id
  limit least(greatest(coalesce(p_limit, 500), 1), 500);
end;
$$;

revoke all on function public.research_context() from public, anon, authenticated;
revoke all on function public.set_research_consent(boolean, text) from public, anon, authenticated;
revoke all on function public.register_research_session() from public, anon, authenticated;
revoke all on function public.research_statistics_page(uuid, integer) from public, anon, authenticated;
grant execute on function public.research_context() to authenticated;
grant execute on function public.set_research_consent(boolean, text) to authenticated;
grant execute on function public.research_statistics_page(uuid, integer) to authenticated;

commit;
