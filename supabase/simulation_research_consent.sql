-- Escucha Viva: versioned study documents and append-only participant decisions.
-- No study is opened by this migration. Populate/review the protocol before publication.
begin;

create table public.simulation_research_studies (
  id uuid primary key default gen_random_uuid(),
  study_key text not null,
  version text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  information jsonb not null default '{}',
  collection_until timestamptz,
  retention_until timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(study_key, version)
);
create unique index simulation_research_one_open_version on public.simulation_research_studies(study_key) where status='published';
alter table public.simulation_research_studies enable row level security;
revoke all on public.simulation_research_studies from public, anon, authenticated;
grant select on public.simulation_research_studies to anon, authenticated;
grant all on public.simulation_research_studies to service_role;
create policy "Read released study documents" on public.simulation_research_studies for select to anon, authenticated using (status in ('published','closed'));

create table public.simulation_research_consent_events (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.simulation_research_studies(id),
  study_key text not null,
  previous_event_id uuid references public.simulation_research_consent_events(id),
  action text not null check (action in ('accepted','declined','withdrawn')),
  participation_accepted boolean not null default false,
  data_processing_accepted boolean not null default false,
  adult_confirmed boolean not null default false,
  quotes_accepted boolean not null default false,
  participant_code uuid not null default gen_random_uuid(),
  document_snapshot jsonb not null default '{}',
  created_at timestamptz not null default clock_timestamp()
);
create index simulation_research_events_owner on public.simulation_research_consent_events(user_id, study_key, sequence desc);
create index simulation_research_events_study on public.simulation_research_consent_events(study_id);
create index simulation_research_events_previous on public.simulation_research_consent_events(previous_event_id);
alter table public.simulation_research_consent_events enable row level security;
revoke all on public.simulation_research_consent_events from public, anon, authenticated;
grant select, insert on public.simulation_research_consent_events to authenticated;
grant all on public.simulation_research_consent_events to service_role;
grant usage on sequence public.simulation_research_consent_events_sequence_seq to authenticated, service_role;
create policy "Read own research decisions" on public.simulation_research_consent_events for select to authenticated using ((select auth.uid())=user_id);
create policy "Record own research decisions" on public.simulation_research_consent_events for insert to authenticated with check ((select auth.uid())=user_id);

create function public.validate_simulation_research_study() returns trigger
language plpgsql security invoker set search_path='' as $$
declare field_name text;
begin
  if tg_op='UPDATE' and old.status<>'draft' then
    if (to_jsonb(new)-'status'-'closed_at') is distinct from (to_jsonb(old)-'status'-'closed_at')
      or new.status not in ('published','closed') or (old.status='closed' and new.status<>'closed') then
      raise exception 'Released study documents are immutable; create a new version';
    end if;
    new.closed_at := case when old.status='published' and new.status='closed' then clock_timestamp() else old.closed_at end;
    return new;
  end if;
  if new.status='closed' then raise exception 'Publish a reviewed protocol before closing it'; end if;
  new.published_at := null;
  new.closed_at := null;
  if new.status='published' then
    if length(trim(new.title))<5 or new.version !~ '^[0-9]+[.][0-9]+([.][0-9]+)?$' then raise exception 'Study title and version required'; end if;
    foreach field_name in array array['controller','objective','eligibility','activities','duration','voluntary_alternative','risks_support','benefits_costs','data_use','providers_transfers','retention','withdrawal','conflicts','review_reference','contacts'] loop
      if jsonb_typeof(new.information->field_name) is distinct from 'string' or length(trim(new.information->>field_name))<5
        or new.information->>field_name ~* '\[(pendiente|completar)\]' then
        raise exception 'Complete the reviewed protocol field: %',field_name;
      end if;
    end loop;
    if new.collection_until is null or new.retention_until is null or new.collection_until<=clock_timestamp() or new.retention_until<new.collection_until then
      raise exception 'Valid collection and retention deadlines required';
    end if;
    if jsonb_typeof(new.information->'data_categories') is distinct from 'array' then raise exception 'Data categories required'; end if;
    if jsonb_array_length(new.information->'data_categories')=0 or exists(select 1 from jsonb_array_elements_text(new.information->'data_categories') c(value) where value not in ('conversation','feedback','usage')) then raise exception 'Unsupported data category'; end if;
    -- SCOPE_AND_DECLARATIONS are inserted from the shared, version-controlled text below.
    new.information := new.information || '{"scope":["Puedes usar el simulador sin participar en la investigación. Rechazar o retirarte no cambia tu acceso a la práctica.","Esta autorización comprende únicamente el estudio descrito. No incluye publicidad, testimonios comerciales, entrenamiento de modelos ni otras investigaciones.","La investigación solo puede incluir sesiones nuevas iniciadas después de tu aceptación. Los registros anteriores no se incorporan por esta autorización.","Los casos son ficticios. No ingreses datos de pacientes reales ni antecedentes de tu propia salud. No se graban audio, video ni datos biométricos mediante este consentimiento.","La IA puede equivocarse. Su retroalimentación es formativa y no constituye un diagnóstico ni una decisión académica definitiva.","Los registros de la cuenta son identificables. El análisis utiliza códigos; las publicaciones deben evitar la identificación de participantes.","El retiro excluye tus registros de nuevas consultas del conjunto de investigación. No elimina automáticamente tu historial de práctica ni copias ya entregadas al equipo; puedes solicitar su gestión al contacto del estudio. Los resultados irreversiblemente anonimizados ya no pueden vincularse contigo."],"declarations":{"adult":"Confirmo que tengo 18 años o más y cumplo los criterios de participación descritos.","participation":"He leído la información, he tenido oportunidad de consultar mis dudas y acepto participar voluntariamente en este estudio.","data":"Autorizo el tratamiento de los datos indicados para las finalidades de esta versión del estudio.","quotes":"Autorizo, de forma opcional, la publicación de fragmentos de mis respuestas revisados para evitar mi identificación."}}'::jsonb;
    new.published_at := clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.validate_simulation_research_study() from public, anon, authenticated;
create trigger validate_simulation_research_study before insert or update on public.simulation_research_studies for each row execute function public.validate_simulation_research_study();

create function public.validate_simulation_research_decision() returns trigger
language plpgsql security invoker set search_path='' as $$
declare study public.simulation_research_studies%rowtype;
  previous public.simulation_research_consent_events%rowtype;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'Own authenticated account required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':research:'||new.study_key,0));
  select * into study from public.simulation_research_studies where id=new.study_id;
  if not found or study.study_key is distinct from new.study_key then raise exception 'Study unavailable' using errcode='42501'; end if;
  select * into previous from public.simulation_research_consent_events where user_id=new.user_id and study_key=new.study_key order by sequence desc limit 1;
  if new.previous_event_id is distinct from previous.id then raise exception 'Decision changed; reload before deciding' using errcode='40001'; end if;
  if new.action='withdrawn' then
    if previous.action is distinct from 'accepted' or previous.study_id is distinct from study.id then raise exception 'No matching active consent to withdraw'; end if;
    new.document_snapshot := previous.document_snapshot;
  else
    if study.status<>'published' or study.collection_until<=clock_timestamp() then raise exception 'Study is not open for participation'; end if;
    if new.action='accepted' then
      if not public.current_user_is_approved() or not new.participation_accepted or not new.data_processing_accepted or not new.adult_confirmed then
        raise exception 'Approved adult participant and separate consents required' using errcode='42501';
      end if;
      if previous.action='accepted' and previous.study_id=study.id then raise exception 'Consent already recorded' using errcode='40001'; end if;
      if new.quotes_accepted and coalesce((study.information->>'allow_quotes')::boolean,false)<>true then raise exception 'Quotation permission not offered by this study'; end if;
    elsif previous.action='accepted' then raise exception 'Withdraw the current consent first';
    end if;
    new.document_snapshot := jsonb_build_object('id',study.id,'study_key',study.study_key,'version',study.version,'title',study.title,'information',study.information,'collection_until',study.collection_until,'retention_until',study.retention_until);
  end if;
  if new.action<>'accepted' then
    new.participation_accepted:=false; new.data_processing_accepted:=false; new.adult_confirmed:=false; new.quotes_accepted:=false;
  end if;
  new.id:=gen_random_uuid();
  new.participant_code:=coalesce(previous.participant_code,gen_random_uuid());
  new.created_at:=clock_timestamp();
  return new;
end;
$$;
revoke all on function public.validate_simulation_research_decision() from public, anon, authenticated;
create trigger validate_simulation_research_decision before insert on public.simulation_research_consent_events for each row execute function public.validate_simulation_research_decision();

-- An explicit research source for authorized operators. No participant emails,
-- account IDs, appointment IDs, or automatically included historical sessions.
-- Pseudonymized: free text still needs disclosure review before publication.
create view public.simulation_research_eligible_sessions with (security_invoker=true) as
with latest as (
  select distinct on(user_id,study_key) * from public.simulation_research_consent_events order by user_id,study_key,sequence desc
)
select e.participant_code, st.study_key, st.version, s.case_id, s.session_number,
  case when st.information->'data_categories' ? 'conversation' then s.conversation end as conversation,
  case when st.information->'data_categories' ? 'feedback' then s.feedback end as feedback,
  case when st.information->'data_categories' ? 'usage' then jsonb_build_object('score',s.score,'status',s.status,'duration_seconds',greatest(0,extract(epoch from (s.completed_at-s.started_at)))) end as usage,
  e.quotes_accepted
from latest e
join public.simulation_research_studies st on st.id=e.study_id
join public.simulation_sessions s on s.user_id=e.user_id
where e.action='accepted' and st.status in ('published','closed') and st.retention_until>now()
  and s.created_at>=e.created_at and s.started_at>=e.created_at
  and s.created_at<=least(st.collection_until,coalesce(st.closed_at,st.collection_until))
  and s.status='completed';
revoke all on public.simulation_research_eligible_sessions from public, anon, authenticated;
grant select on public.simulation_research_eligible_sessions to service_role;

insert into public.simulation_research_studies(study_key,version,title,information)
values ('escucha-viva-estudiantes','1.0-draft','Participación de estudiantes en investigación con Escucha Viva',
  '{"controller":"","objective":"","eligibility":"","activities":"","duration":"","voluntary_alternative":"","risks_support":"","benefits_costs":"","data_use":"","providers_transfers":"","retention":"","withdrawal":"","conflicts":"","review_reference":"","contacts":"","allow_quotes":false,"data_categories":[]}'::jsonb);

commit;
