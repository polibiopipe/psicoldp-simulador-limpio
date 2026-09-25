create schema if not exists seminar_private;
revoke all on schema seminar_private from public, anon;
grant usage on schema seminar_private to authenticated;

create table public.seminar_members (
 team_key text not null, user_id uuid not null references auth.users(id),
 display_name text not null, active boolean not null default true,
 primary key(team_key,user_id)
);
create table public.seminar_items (
 id uuid primary key default gen_random_uuid(), team_key text not null,
 kind text not null check(kind in ('aporte','antecedente','coherencia','posicionamiento','decision','caso')),
 title text not null check(length(title) between 3 and 180), stage_key text not null default '',
 content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object'),
 evidence_url text not null default '', owner_id uuid not null references auth.users(id),
 reviewer_id uuid not null references auth.users(id), revision integer not null default 1 check(revision>0),
 created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(owner_id<>reviewer_id)
);
create table public.seminar_events (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references public.seminar_items(id),
 team_key text not null, item_revision integer not null,
 actor_id uuid not null references auth.users(id),
 event_type text not null check(event_type in ('revision','comment','review_approved','review_changes','agree','object')),
 note text not null default '', payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default clock_timestamp()
);
create index seminar_members_user_idx on public.seminar_members(user_id);
create index seminar_items_team_updated_idx on public.seminar_items(team_key,updated_at desc);
create index seminar_events_item_time_idx on public.seminar_events(item_id,created_at desc);
create index seminar_events_team_idx on public.seminar_events(team_key);
create index seminar_items_owner_idx on public.seminar_items(owner_id);
create index seminar_items_reviewer_idx on public.seminar_items(reviewer_id);
create index seminar_items_created_idx on public.seminar_items(created_by);
create index seminar_items_updated_idx on public.seminar_items(updated_by);
create index seminar_events_actor_idx on public.seminar_events(actor_id);

insert into public.seminar_members(team_key,user_id,display_name)
 select 'seia-grupo4',u.id,v.display_name from auth.users u join (values
 ('polibio.solis@nucleovivo.net','Polibio Felipe Solís Celedón'),
 ('leyla.llanos@nucleovivo.net','Leyla Llanos Muñoz'),
 ('daniel.toledo@nucleovivo.net','Carlos Daniel Toledo Hein')
 ) v(email,display_name) on lower(u.email)=v.email
 join public.user_profiles p on p.id=u.id and p.approved=true;

create function seminar_private.is_member(p_team text) returns boolean
 language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.seminar_members m join public.user_profiles p on p.id=m.user_id
 where m.team_key=p_team and m.user_id=auth.uid() and m.active and p.approved=true
 ); $$;
revoke all on function seminar_private.is_member(text) from public,anon;
grant execute on function seminar_private.is_member(text) to authenticated;

alter table public.seminar_members enable row level security;
alter table public.seminar_items enable row level security;
alter table public.seminar_events enable row level security;
revoke all on public.seminar_members,public.seminar_items,public.seminar_events from public,anon,authenticated;
grant select on public.seminar_members,public.seminar_items,public.seminar_events to authenticated;
create policy seminar_members_read on public.seminar_members for select to authenticated using(seminar_private.is_member(team_key));
create policy seminar_items_read on public.seminar_items for select to authenticated using(seminar_private.is_member(team_key));
create policy seminar_events_read on public.seminar_events for select to authenticated using(seminar_private.is_member(team_key));

create function seminar_private.save_item(p_item_id uuid,p_expected_revision integer,p_document jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
 declare v public.seminar_items; t text:=p_document->>'team_key'; a uuid:=auth.uid(); o uuid; r uuid; e text;
 begin
 if not seminar_private.is_member(t) then raise exception 'Acceso al equipo no autorizado' using errcode='42501'; end if;
 if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>120000 then raise exception 'Documento inválido o demasiado extenso'; end if;
 if jsonb_typeof(p_document->'content') is distinct from 'object' then raise exception 'El contenido debe ser un objeto'; end if;
 if length(trim(coalesce(p_document->>'title',''))) not between 3 and 180 or length(coalesce(p_document->>'stage_key',''))>160 then raise exception 'Revisa el título y la etapa'; end if;
 if coalesce(p_document->>'kind','') not in ('aporte','antecedente','coherencia','posicionamiento','decision','caso') then raise exception 'Tipo de aporte no válido'; end if;
 o:=(p_document->>'owner_id')::uuid; r:=(p_document->>'reviewer_id')::uuid;
 if o is null or r is null or o=r then raise exception 'Responsable y revisor deben ser personas distintas'; end if;
 if (select count(*) from public.seminar_members m join public.user_profiles p on p.id=m.user_id where m.team_key=t and m.user_id in(o,r) and m.active and p.approved=true)<>2 then raise exception 'Los roles deben pertenecer a integrantes activos'; end if;
 e:=trim(coalesce(p_document->>'evidence_url',''));
 if length(e)>2000 or (e<>'' and e !~ '^https://[^[:space:]/]+[^[:space:]]*$') then raise exception 'Usa un enlace HTTPS completo para la evidencia'; end if;
 if p_item_id is null then
 if p_expected_revision is distinct from 0 then raise exception 'La versión inicial debe ser cero'; end if;
 insert into public.seminar_items(team_key,kind,title,stage_key,content,evidence_url,owner_id,reviewer_id,created_by,updated_by)
 values(t,p_document->>'kind',trim(p_document->>'title'),coalesce(p_document->>'stage_key',''),p_document->'content',e,o,r,a,a) returning * into v;
 else
 select * into v from public.seminar_items where id=p_item_id and team_key=t for update;
 if not found then raise exception 'Aporte no disponible' using errcode='42501'; end if;
 if v.revision is distinct from p_expected_revision then raise exception 'VERSION_CONFLICT: otra persona guardó una versión nueva. Compara antes de integrar.' using errcode='40001'; end if;
 update public.seminar_items set kind=p_document->>'kind',title=trim(p_document->>'title'),stage_key=coalesce(p_document->>'stage_key',''),content=p_document->'content',evidence_url=e,owner_id=o,reviewer_id=r,revision=v.revision+1,updated_by=a,updated_at=clock_timestamp()
 where id=p_item_id returning * into v;
 end if;
 insert into public.seminar_events(item_id,team_key,item_revision,actor_id,event_type,note,payload)
 values(v.id,v.team_key,v.revision,a,'revision','Versión compartida guardada',jsonb_build_object('document',to_jsonb(v)));
 return to_jsonb(v);
 end; $$;
revoke all on function seminar_private.save_item(uuid,integer,jsonb) from public,anon;
grant execute on function seminar_private.save_item(uuid,integer,jsonb) to authenticated;
create function public.seminar_save_item(p_item_id uuid,p_expected_revision integer,p_document jsonb) returns jsonb
 language sql security invoker set search_path='' as $$ select seminar_private.save_item(p_item_id,p_expected_revision,p_document); $$;
revoke all on function public.seminar_save_item(uuid,integer,jsonb) from public,anon;
grant execute on function public.seminar_save_item(uuid,integer,jsonb) to authenticated;

create function seminar_private.add_event(p_item_id uuid,p_revision integer,p_type text,p_note text,p_checks jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
 declare v public.seminar_items; a uuid:=auth.uid(); ev public.seminar_events;
 begin
 select * into v from public.seminar_items where id=p_item_id for update;
 if not found or not seminar_private.is_member(v.team_key) then raise exception 'Acceso al aporte no autorizado' using errcode='42501'; end if;
 if v.revision is distinct from p_revision then raise exception 'VERSION_CONFLICT: revisa la versión vigente antes de registrar tu respuesta' using errcode='40001'; end if;
 if p_type is null or p_type not in ('comment','review_approved','review_changes','agree','object') then raise exception 'Acción no permitida'; end if;
 if length(trim(coalesce(p_note,''))) not between 8 and 6000 then raise exception 'Registra una explicación de entre 8 y 6000 caracteres'; end if;
 if p_type in ('review_approved','review_changes') then
 if a=v.owner_id or a=v.updated_by or a<>v.reviewer_id then raise exception 'La revisión corresponde a otra persona: debe ser el revisor asignado, distinto del responsable y de quien guardó esta versión' using errcode='42501'; end if;
 end if;
 if p_type='review_approved' then
 if p_checks is distinct from '[true,true,true,true]'::jsonb then raise exception 'Falta confirmar las cuatro comprobaciones de contenido'; end if;
 if v.evidence_url='' or v.content='{}'::jsonb then raise exception 'Falta el desarrollo y su enlace de evidencia'; end if;
 end if;
 insert into public.seminar_events(item_id,team_key,item_revision,actor_id,event_type,note,payload)
 values(v.id,v.team_key,v.revision,a,p_type,trim(p_note),jsonb_build_object('checks',case when p_type='review_approved' then p_checks else '[]'::jsonb end)) returning * into ev;
 return to_jsonb(ev);
 end; $$;
revoke all on function seminar_private.add_event(uuid,integer,text,text,jsonb) from public,anon;
grant execute on function seminar_private.add_event(uuid,integer,text,text,jsonb) to authenticated;
create function public.seminar_add_event(p_item_id uuid,p_revision integer,p_type text,p_note text,p_checks jsonb default '[]'::jsonb) returns jsonb
 language sql security invoker set search_path='' as $$ select seminar_private.add_event(p_item_id,p_revision,p_type,p_note,p_checks); $$;
revoke all on function public.seminar_add_event(uuid,integer,text,text,jsonb) from public,anon;
grant execute on function public.seminar_add_event(uuid,integer,text,text,jsonb) to authenticated;

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 alter publication supabase_realtime add table public.seminar_items,public.seminar_events,public.seminar_members;
 end if;
end $$;
