# Escucha Viva RC v1.0 - Runbook migracion fase 3A

Este runbook prepara la aplicacion controlada de `supabase/simulation_appointments.sql`.
No promover a produccion hasta aprobar Preview con pruebas funcionales.

## 1. Entorno objetivo

1. Confirmar si Vercel Preview apunta a un Supabase separado o al mismo proyecto de produccion.
2. Comparar solo project refs/hosts, sin exponer claves:
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - Serverless: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Si Preview y Production comparten Supabase, detenerse y pedir autorizacion explicita antes de ejecutar SQL.

## 2. Respaldo previo

Antes de ejecutar la migracion:

```sql
select count(*) as simulation_sessions_count from public.simulation_sessions;
select count(*) as user_profiles_count from public.user_profiles;
```

Exportar respaldo desde Supabase Dashboard o CLI para:

- `public.simulation_sessions`
- `public.user_profiles`

## 3. Orden exacto

1. Ejecutar validaciones locales:

```bash
git diff --check
npm run build
npm run audit:clinical-claudio
npm run audit:phase3a-safety
```

2. Abrir Supabase SQL Editor del entorno objetivo.
3. Pegar y ejecutar completo:

```text
supabase/simulation_appointments.sql
```

4. No ejecutar rollback salvo que falle la validacion posterior.

## 4. Verificacion de migracion

```sql
select to_regclass('public.simulation_appointments') as appointments_table;
select to_regclass('public.simulation_interventions') as interventions_table;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('simulation_appointments', 'simulation_interventions')
order by table_name, ordinal_position;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('simulation_appointments', 'simulation_interventions', 'simulation_sessions')
order by tablename, indexname;
```

## 5. Verificacion RLS

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('simulation_appointments', 'simulation_interventions');

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('simulation_appointments', 'simulation_interventions')
order by tablename, policyname;
```

Resultado esperado:

- `rowsecurity = true` en ambas tablas.
- Appointments: SELECT, INSERT, UPDATE para usuario aprobado y propio.
- Interventions: SELECT propio; sin INSERT/UPDATE directo desde cliente.

## 6. Verificacion RPC

```sql
select proname, prosecdef, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'reserve_simulation_intervention',
    'complete_simulation_intervention',
    'fail_simulation_intervention'
  );

select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'reserve_simulation_intervention',
    'complete_simulation_intervention',
    'fail_simulation_intervention'
  )
order by routine_name, grantee;
```

Resultado esperado:

- `prosecdef = true`.
- `search_path=public, auth, pg_temp`.
- `EXECUTE` solo para `service_role`.

## 7. Verificacion variables Vercel Preview

En Vercel Project Settings > Environment Variables, revisar Preview:

- `VITE_SUPABASE_URL`: presente, host correcto.
- `VITE_SUPABASE_ANON_KEY`: presente.
- `SUPABASE_URL`: presente, mismo host que `VITE_SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: presente solo como server variable.
- `GEMINI_API_KEY`: presente si se probara Gemini real.

No copiar ni pegar valores en issues, logs o capturas.

## 8. Crear usuario QA

1. Crear usuario en Supabase Auth.
2. Confirmar email si corresponde.
3. En `public.user_profiles`, configurar:

```sql
update public.user_profiles
set approved = true,
    role = 'qa',
    updated_at = now()
where lower(email) = lower('<correo_qa>');
```

Usar correo institucional de prueba. No usar cuentas de estudiantes reales para pruebas de stress.

## 9. Pruebas funcionales minimas

1. Login con usuario aprobado.
2. Agendar sesion de Claudio para hoy.
3. Iniciar entrevista.
4. Enviar primer turno y verificar respuesta Gemini/local segura.
5. Verificar que la cita pase a `in_progress`.
6. Reintentar un turno fallido y confirmar que no duplica.
7. Enviar hasta advertencia de limite si se requiere.
8. Volver al dashboard y retomar sesion.
9. Terminar entrevista.
10. Salir sin decision y guardar `closure_pending`.
11. Retomar cierre pendiente y completar decision.
12. Verificar que la sesion quede `completed` y no vuelva al chat.

Consultas utiles:

```sql
select id, user_email, case_id, session_number, status, scheduled_local_date, started_at, ends_at, completed_at
from public.simulation_appointments
order by updated_at desc
limit 20;

select appointment_id, intervention_id, turn_number, status, response_source, error_code, completed_at, failed_at
from public.simulation_interventions
order by created_at desc
limit 20;

select id, user_email, case_id, session_number, status, appointment_id, updated_at
from public.simulation_sessions
order by updated_at desc
limit 20;
```

## 10. Cuando ejecutar rollback

Ejecutar `supabase/simulation_appointments_rollback.sql` solo si:

- la migracion fue aplicada;
- falla la validacion estructural;
- no hay datos reales que deban conservarse;
- se cuenta con respaldo.

El rollback aborta si detecta datos en appointments, interventions o sesiones vinculadas por `appointment_id`.

## 11. Prohibicion de promocion a produccion

No promover a produccion antes de:

- aprobar Vercel Preview;
- validar RLS/RPC;
- completar las 12 pruebas funcionales;
- confirmar que Preview no comparte Supabase con produccion, o contar con autorizacion explicita si lo comparte.
