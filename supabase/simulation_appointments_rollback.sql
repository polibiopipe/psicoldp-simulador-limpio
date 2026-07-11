-- Escucha Viva RC v1.0 - Rollback agenda clinica y control de consumo.
-- Usar solo si supabase/simulation_appointments.sql fue aplicado y falla la validacion.
-- No ejecutar en produccion sin respaldo y revision manual.

begin;

do $$
declare
  appointment_count bigint := 0;
  intervention_count bigint := 0;
  linked_session_count bigint := 0;
begin
  if to_regclass('public.simulation_appointments') is not null then
    execute 'select count(*) from public.simulation_appointments' into appointment_count;
  end if;

  if to_regclass('public.simulation_interventions') is not null then
    execute 'select count(*) from public.simulation_interventions' into intervention_count;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'simulation_sessions'
      and column_name = 'appointment_id'
  ) then
    execute 'select count(*) from public.simulation_sessions where appointment_id is not null' into linked_session_count;
  end if;

  if appointment_count > 0 or intervention_count > 0 or linked_session_count > 0 then
    raise exception
      'Rollback detenido: existen datos en appointments/interventions o sesiones vinculadas. Respaldar y resolver manualmente antes de eliminar objetos.';
  end if;
end;
$$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.simulation_appointments') is not null then
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'simulation_appointments'
    loop
      execute format('drop policy if exists %I on public.simulation_appointments', policy_record.policyname);
    end loop;
  end if;

  if to_regclass('public.simulation_interventions') is not null then
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'simulation_interventions'
    loop
      execute format('drop policy if exists %I on public.simulation_interventions', policy_record.policyname);
    end loop;
  end if;
end;
$$;

do $$
begin
  if to_regprocedure('public.reserve_simulation_intervention(uuid,uuid,uuid,uuid,text,integer)') is not null then
    revoke all on function public.reserve_simulation_intervention(uuid, uuid, uuid, uuid, text, integer) from public, anon, authenticated, service_role;
  end if;
  if to_regprocedure('public.complete_simulation_intervention(uuid,uuid,uuid,text,text)') is not null then
    revoke all on function public.complete_simulation_intervention(uuid, uuid, uuid, text, text) from public, anon, authenticated, service_role;
  end if;
  if to_regprocedure('public.fail_simulation_intervention(uuid,uuid,uuid)') is not null then
    revoke all on function public.fail_simulation_intervention(uuid, uuid, uuid) from public, anon, authenticated, service_role;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.simulation_interventions') is not null then
    drop trigger if exists on_simulation_interventions_updated_at on public.simulation_interventions;
  end if;
  if to_regclass('public.simulation_appointments') is not null then
    drop trigger if exists on_simulation_appointments_validate_transition on public.simulation_appointments;
    drop trigger if exists on_simulation_appointments_updated_at on public.simulation_appointments;
    drop trigger if exists on_simulation_appointments_derived_fields on public.simulation_appointments;
  end if;
  if to_regclass('public.simulation_sessions') is not null then
    drop trigger if exists on_simulation_sessions_updated_at on public.simulation_sessions;
  end if;
end;
$$;

drop function if exists public.fail_simulation_intervention(uuid, uuid, uuid);
drop function if exists public.complete_simulation_intervention(uuid, uuid, uuid, text, text);
drop function if exists public.reserve_simulation_intervention(uuid, uuid, uuid, uuid, text, integer);
drop function if exists public.set_simulation_intervention_updated_at();
drop function if exists public.set_simulation_session_updated_at();
drop function if exists public.validate_simulation_appointment_transition();
drop function if exists public.set_simulation_appointment_updated_at();
drop function if exists public.set_simulation_appointment_derived_fields();

drop index if exists public.simulation_interventions_turn_count_idx;
drop index if exists public.simulation_interventions_one_reserved_idx;
drop index if exists public.simulation_interventions_one_processing_idx;
drop index if exists public.simulation_interventions_unique_intervention_idx;
drop index if exists public.simulation_sessions_one_record_per_appointment_idx;
drop index if exists public.simulation_sessions_appointment_idx;
drop index if exists public.simulation_appointments_user_status_idx;
drop index if exists public.simulation_appointments_user_scheduled_idx;
drop index if exists public.simulation_appointments_one_active_case_session_idx;
drop index if exists public.simulation_appointments_one_active_per_user_day_idx;

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
exception
  when undefined_table then
    null;
end;
$$;

alter table if exists public.simulation_sessions
drop column if exists appointment_id;

alter table if exists public.simulation_sessions
drop column if exists started_at;

alter table if exists public.simulation_sessions
drop column if exists ends_at;

alter table if exists public.simulation_sessions
drop column if exists completed_at;

alter table if exists public.simulation_sessions
drop column if exists status;

alter table if exists public.simulation_sessions
drop column if exists updated_at;

-- No se elimina public.simulation_sessions ni su contenido.

drop table if exists public.simulation_interventions;
drop table if exists public.simulation_appointments;

do $$
begin
  if exists (
    select 1
    from public.user_profiles
    where role = 'qa'
  ) then
    raise exception
      'Rollback detenido: existen usuarios con role=qa. Reasignar roles QA antes de restaurar la restriccion previa.';
  end if;

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
  check (role in ('student', 'admin'));
exception
  when undefined_table then
    null;
end;
$$;

commit;
