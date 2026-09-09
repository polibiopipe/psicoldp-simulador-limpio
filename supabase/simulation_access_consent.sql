-- Additive first stage. Deploy the application before access_consent_enforcement.
create table public.simulation_access_documents (
  version text primary key,
  title text not null,
  information jsonb not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(information->'sections')='array' and jsonb_array_length(information->'sections')>0),
  check (information->'declarations' ?& array['adult','educationalUse','dataProcessing'])
);
create unique index simulation_access_one_current on public.simulation_access_documents(is_current) where is_current;
alter table public.simulation_access_documents enable row level security;
revoke all on public.simulation_access_documents from anon, authenticated;
grant select on public.simulation_access_documents to anon, authenticated;
grant all on public.simulation_access_documents to service_role;
create policy "Public access information" on public.simulation_access_documents for select to anon,authenticated using(true);

create function public.freeze_simulation_access_document() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('simulation_access_document',0));
  if (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then
    raise exception 'Publish a new version instead of changing an existing access document';
  end if;
  return new;
end;
$$;
revoke all on function public.freeze_simulation_access_document() from public,anon,authenticated;
create trigger freeze_simulation_access_document before update on public.simulation_access_documents for each row execute function public.freeze_simulation_access_document();

create table public.simulation_access_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version text not null references public.simulation_access_documents(version),
  adult_confirmed boolean not null default false check(adult_confirmed),
  educational_use_accepted boolean not null default false check(educational_use_accepted),
  data_processing_accepted boolean not null default false check(data_processing_accepted),
  document_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id,document_version)
);
alter table public.simulation_access_consents enable row level security;
revoke all on public.simulation_access_consents from anon,authenticated;
grant select,insert on public.simulation_access_consents to authenticated;
grant all on public.simulation_access_consents to service_role;
create policy "Read own access acceptance" on public.simulation_access_consents for select to authenticated using(user_id=(select auth.uid()));
create policy "Record own access acceptance" on public.simulation_access_consents for insert to authenticated with check(user_id=(select auth.uid()) and public.current_user_is_approved());

create function public.validate_simulation_access_consent() returns trigger language plpgsql security invoker set search_path='' as $$
declare document public.simulation_access_documents%rowtype;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() or not public.current_user_is_approved() then
    raise exception 'Own approved account required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('simulation_access_document',0));
  select * into document from public.simulation_access_documents where version=new.document_version and is_current;
  if not found then raise exception 'The access document changed; review the current version' using errcode='40001'; end if;
  if not (new.adult_confirmed and new.educational_use_accepted and new.data_processing_accepted) then
    raise exception 'All access declarations are required' using errcode='42501';
  end if;
  new.id:=gen_random_uuid();
  new.created_at:=clock_timestamp();
  new.document_snapshot:=to_jsonb(document);
  return new;
end;
$$;
revoke all on function public.validate_simulation_access_consent() from public,anon,authenticated;
create trigger validate_simulation_access_consent before insert on public.simulation_access_consents for each row execute function public.validate_simulation_access_consent();

create function public.current_user_has_simulation_access_consent() returns boolean language sql stable security invoker set search_path='' as $$
  select exists(
    select 1 from public.simulation_access_consents c join public.simulation_access_documents d on d.version=c.document_version
    where c.user_id=(select auth.uid()) and d.is_current and c.adult_confirmed and c.educational_use_accepted and c.data_processing_accepted
  );
$$;
revoke all on function public.current_user_has_simulation_access_consent() from public,anon;
grant execute on function public.current_user_has_simulation_access_consent() to authenticated;

insert into public.simulation_access_documents(version,title,information,is_current) values (
'1.0','Condiciones de uso educativo y privacidad de Escucha Viva','{"sections": [{"title": "Responsable y finalidad", "text": "Escucha Viva es un simulador educativo de Núcleo Vivo, desarrollado por Polibio Solís. El contacto para privacidad, consultas y solicitudes es contacto@nucleovivo.net. Utilizamos los datos necesarios para administrar tu cuenta, permitir el acceso, guardar y retomar tus prácticas, gestionar tu agenda y ofrecer retroalimentación formativa."}, {"title": "Uso educativo y mayoría de edad", "text": "El acceso está dirigido a personas de 18 años o más. Los personajes y sus antecedentes son ficticios. El simulador no entrega atención de salud ni reemplaza la supervisión docente. La inteligencia artificial puede equivocarse; debes revisar críticamente sus respuestas. Puedes pausar la actividad si te produce malestar."}, {"title": "Qué datos se tratan", "text": "Se vinculan a tu cuenta el nombre y correo, las citas, disponibilidad, objetivos de preparación, mensajes de la entrevista, cierres, retroalimentación y registros necesarios de funcionamiento. Guardamos también esta aceptación, su versión y fecha. No ingreses datos de pacientes reales, información de tu propia salud ni otros antecedentes sensibles. Esta aceptación no autoriza grabaciones de audio, video ni biometría."}, {"title": "Proveedores y tratamiento fuera de Chile", "text": "Supabase gestiona la cuenta y los registros en la región Este de Estados Unidos; Vercel aloja la aplicación y procesa sus solicitudes. Google Gemini recibe los mensajes de la entrevista, su contexto y el caso ficticio para generar respuestas. Según la modalidad del servicio de Google, estos mensajes pueden usarse para mejorar sus productos y ser revisados por personas; consulta sus condiciones en https://ai.google.dev/gemini-api/terms. No se ofrece una garantía general de exclusión de entrenamiento del proveedor. Algunas respuestas pueden generarse localmente. El personal que administra la infraestructura puede acceder técnicamente a los registros para soporte y gestión."}, {"title": "Conservación, copia y retiro de la autorización", "text": "Los registros de práctica se conservan para dar continuidad a tu historial hasta que los elimines desde «Sesiones» o solicites su gestión. El navegador puede conservar borradores y copias de trabajo. Puedes descargar los registros disponibles de tu cuenta desde «Mis datos y privacidad», y solicitar acceso, rectificación, eliminación o revocar esta autorización a contacto@nucleovivo.net. La gestión de respaldos y registros técnicos requiere esa solicitud; no se promete un borrado inmediato de todas las copias. Revocar el tratamiento necesario supone dejar de utilizar el simulador. La revocación no invalida el tratamiento realizado legítimamente antes de ella."}, {"title": "Tu decisión y la investigación", "text": "Puedes rechazar estas condiciones y cerrar sesión; en ese caso no ingresarás al simulador. Aceptarlas habilita únicamente el uso educativo y el tratamiento necesario descrito. No autoriza usar tus prácticas para una investigación, publicidad o testimonios. Si hay una invitación a un estudio, tendrá información y consentimiento propios: puedes rechazarla o retirarte sin perder el acceso educativo por esa decisión."}], "declarations": {"adult": "Confirmo que tengo 18 años o más.", "educationalUse": "He leído y acepto las condiciones de uso educativo y sus límites.", "dataProcessing": "Autorizo el tratamiento de mis datos para las finalidades de funcionamiento descritas, incluidos los proveedores y el tratamiento fuera de Chile informados."}}',true);
