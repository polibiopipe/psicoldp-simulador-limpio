# Escucha Viva RC v1.0 - Runbook migracion fase 3A

Este runbook prepara la aplicacion controlada de `supabase/simulation_appointments.sql`.
No promover a produccion hasta aprobar Preview con pruebas funcionales.

## 0. Snapshot real usado para compatibilidad

Snapshot real del proyecto activo `escucha-viva-simulador-v2`:

- Project ref: `dstmscvnaziqptpomssv`.
- `public.user_profiles`: 4 filas.
- `public.user_profiles.role`: existe.
- `public.simulation_sessions`: 10 filas.
- `public.simulation_sessions.status`: existe.
- Estados actuales: 9 `completed`, 1 `in_progress`.
- Sesion activa a preservar: `danieltoledohein@gmail.com`, caso `claudio`, sesion 1, `status = in_progress`.
- `public.simulation_sessions.updated_at`: existe y no tiene nulos.
- `public.simulation_sessions.started_at`: no existe antes de esta migracion.
- `public.simulation_sessions.ends_at`: no existe antes de esta migracion.
- `public.simulation_sessions.completed_at`: no existe antes de esta migracion.
- `public.simulation_sessions.appointment_id`: no existe antes de esta migracion.
- Constraint actual: `simulation_sessions_status_check` con `status in ('in_progress', 'completed')`.

Compatibilidad aplicada:

- Las sesiones historicas se conservan.
- `status` no se crea ni se normaliza; se conserva el valor de las 10 sesiones existentes.
- La sesion `in_progress` de Daniel no se completa, no se vincula a appointment y no se elimina.
- `updated_at` no se crea ni se sobrescribe.
- `appointment_id` queda nullable y no se asigna artificialmente a sesiones antiguas.
- El constraint `simulation_sessions_status_check` se reemplaza para aceptar `closure_pending` sin agregar `scheduled` ni `cancelled` a `simulation_sessions`.

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
select status, count(*) from public.simulation_sessions group by status order by status;
select id, user_email, case_id, session_number, status
from public.simulation_sessions
where lower(user_email) = lower('danieltoledohein@gmail.com')
  and case_id = 'claudio'
  and session_number = 1;
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

4. Para habilitar disponibilidad personal del estudiante, ejecutar despues:

```text
supabase/simulation_student_availability.sql
```

Modelo de disponibilidad:

- `id uuid`
- `user_id uuid`
- `day_of_week smallint`
- `start_time time`
- `end_time time`
- `timezone text`
- `created_at timestamptz`
- `updated_at timestamptz`

Convenio `day_of_week`: `0=domingo`, `1=lunes`, `2=martes`, `3=miercoles`, `4=jueves`, `5=viernes`, `6=sabado`.
La zona operativa autorizada para esta version es `America/Santiago`.
Cada fila representa un bloque horario. La base rechaza bloques superpuestos, duplicados exactos, `start_time >= end_time`, zonas horarias distintas y dias fuera de rango.

5. No ejecutar rollback salvo que falle la validacion posterior.

La migracion de disponibilidad depende de que `public.simulation_appointments` exista. No ejecutarla antes de validar la migracion principal.

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

select count(*) as user_profiles_count
from public.user_profiles;

select count(*) as simulation_sessions_count
from public.simulation_sessions;

select status, count(*) as total
from public.simulation_sessions
group by status
order by status;

select count(*) as daniel_claudio_in_progress
from public.simulation_sessions
where lower(user_email) = lower('danieltoledohein@gmail.com')
  and case_id = 'claudio'
  and session_number = 1
  and status = 'in_progress';

select count(*) as historical_sessions_linked_to_appointments
from public.simulation_sessions
where appointment_id is not null;

select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'simulation_sessions'
  and column_name in ('status', 'updated_at', 'started_at', 'ends_at', 'completed_at', 'appointment_id')
order by column_name;
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
Tambien aborta si existen sesiones con estados no compatibles con el constraint original `status in ('in_progress', 'completed')`.
El rollback restaura `simulation_sessions_status_check` a su forma original y no elimina `status`, `updated_at`, policies existentes ni contenido historico.

Para disponibilidad personal, usar `supabase/simulation_student_availability_rollback.sql` solo si no hay registros de disponibilidad que conservar.
Ese rollback aborta si detecta filas en `public.simulation_student_availability`.

## 11. Prohibicion de promocion a produccion

No promover a produccion antes de:

- aprobar Vercel Preview;
- validar RLS/RPC;
- completar las 12 pruebas funcionales;
- confirmar que Preview no comparte Supabase con produccion, o contar con autorizacion explicita si lo comparte.
