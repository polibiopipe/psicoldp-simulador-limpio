-- Rollback para supabase/simulation_student_availability.sql.
-- No ejecutar si ya existe disponibilidad real que deba conservarse.

begin;

do $$
declare
  availability_count bigint := 0;
begin
  if to_regclass('public.simulation_student_availability') is not null then
    execute 'select count(*) from public.simulation_student_availability' into availability_count;
  end if;

  if availability_count > 0 then
    raise exception
      'Rollback detenido: existen registros de disponibilidad. Respaldar o eliminar manualmente antes de continuar.';
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.simulation_student_availability') is not null then
    drop policy if exists "Students can read own availability"
    on public.simulation_student_availability;

    drop policy if exists "Students can insert own availability"
    on public.simulation_student_availability;

    drop policy if exists "Students can update own availability"
    on public.simulation_student_availability;

    drop policy if exists "Students can delete own availability"
    on public.simulation_student_availability;

    drop trigger if exists on_simulation_student_availability_updated_at
    on public.simulation_student_availability;

    drop trigger if exists on_simulation_student_availability_validate_block
    on public.simulation_student_availability;
  end if;

  if to_regclass('public.simulation_appointments') is not null then
    drop trigger if exists on_simulation_appointments_student_availability
    on public.simulation_appointments;
  end if;
end;
$$;

drop function if exists public.validate_simulation_appointment_student_availability();

drop function if exists public.validate_simulation_student_availability_block();

drop function if exists public.set_simulation_student_availability_updated_at();

drop index if exists public.simulation_student_availability_exact_block_idx;

drop index if exists public.simulation_student_availability_user_day_idx;

drop table if exists public.simulation_student_availability;

commit;
