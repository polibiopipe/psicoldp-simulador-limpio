# Revisión de la agenda de Escucha Viva

Fecha: 8 de septiembre de 2026. Base: `1180a3c`, que ya incluye la mejora visual aprobada y publicada.

## Correcciones preparadas

- Guardar y cancelar requieren una respuesta confirmada de Supabase. Los errores mantienen abierto el formulario, muestran un mensaje y no inventan una cita ni una cancelación. Los botones se bloquean durante la petición.
- Las nuevas reservas usan inserción; reprogramar y cancelar solo afectan citas que siguen en estado `scheduled` en el servidor. Un inicio concurrente no puede sobrescribirse desde un formulario antiguo.
- La siguiente sesión excluye las completadas y canceladas. Los cierres pendientes y sesiones en curso tienen prioridad. Las citas históricas siguen visibles y al pulsarlas se abre la sesión exacta.
- Día avanza un día; semana, siete; mes conserva el mes elegido y ajusta el día al último válido. Hoy usa la fecha de Santiago, incluso al comienzo del mes.
- Las nuevas fechas se guardan como instantes UTC calculados desde `America/Santiago`. Se contemplan horario de invierno/verano y horas inexistentes. No se modifican retroactivamente las citas existentes.
- Las sugerencias excluyen horarios pasados y días ocupados. Seleccionar otro horario actualiza el borrador y mantiene sus notas.
- El estado se muestra según el registro real. Se retiraron opciones de estado y modalidad que la interfaz ofrecía pero no persistía.
- Los bloques de disponibilidad se muestran con sus horarios reales. Un fallo de guardado deja su estado como no verificado y libera los controles para reintentar.
- La carga de citas diferencia una lista vacía confirmada de errores de red, servidor o respuestas incompletas. App conserva la última agenda verificada, muestra un aviso con reintento y bloquea la programación y cancelación mientras no pueda verificarla. Las respuestas antiguas no sobrescriben cambios confirmados; los cambios de usuario limpian los registros visibles.
- El calendario y las sugerencias de espacios libres indican que falta verificar los datos, en vez de afirmar que no existen citas u horarios.

Se conserva la duración de 45 minutos y la validación de una cita no cancelada por estudiante y día en la interfaz. La hora programada no agrega una nueva restricción para comenzar la entrevista: se mantiene la política de inicio vigente. La inspección real detectó que el proyecto mantiene su modo QA global (`force_global_qa_role`) y no tiene el índice diario global; las excepciones QA de la base no se modifican con este PR. Sí está activa la unicidad de caso y número de sesión por usuario.

## Verificación realizada

`npm run audit:agenda` ejecuta la lógica de calendario y horarios, y el servicio real de citas con una frontera Supabase simulada. Cubre errores de red, duplicados, respuestas vacías, cancelaciones rechazadas, inicio concurrente y almacenamiento local lleno. Se ejecutó también con `TZ=UTC` y `TZ=America/Santiago`.

Pasaron las auditorías existentes de expiración, reanudación autenticada y duración. La compilación de producción pasó. Las pruebas nuevas usaron exclusivamente usuarios y citas temporales; no se cambiaron citas de participantes.

## Migración aplicada y verificada

Proyecto confirmado: `escucha-viva-simulador-v2`, referencia `dstmscvnaziqptpomssv`, estado `ACTIVE_HEALTHY`. El JavaScript servido por `https://psicoldp-simulador-limpio.vercel.app/` contiene exactamente ese host de Supabase. No se modificaron los otros proyectos.

Se aplicó `supabase/simulation_student_availability_atomic.sql` mediante el registro de migraciones de Supabase, antes de publicar el cliente RPC. La función reemplaza DELETE/INSERT separados por una transacción, usa la identidad autenticada, conserva RLS y las restricciones existentes, y serializa sus llamadas por usuario. Es `SECURITY INVOKER`, tiene `search_path = ''`, permite ejecución a `authenticated` y la deniega a `anon` y `PUBLIC`.

`scripts/audit-availability-atomic.sql` pasó en PostgreSQL real bajo el rol `authenticated` y con identidades de prueba. Cubre:

- Reemplazo correcto y disponibilidad vacía.
- Reversión exacta, incluidos IDs y fechas, cuando falla un bloque después de insertar otro válido.
- Solapamientos, día inválido, hora inválida, campos faltantes, intervalos invertidos y JSON no válido para la operación.
- Aislamiento de lectura, actualización y borrado entre usuarios; el payload no puede seleccionar otro propietario ni cambiar la zona horaria.
- Rechazo de usuarios sin aprobación o sin identidad, y ausencia de permiso anónimo.
- Reserva, lectura, duplicados, reprogramación con fecha local derivada, cancelación confirmada y protección de citas iniciadas ante editores desactualizados.

También se ejecutaron ocho peticiones HTTP autenticadas solapadas contra el RPC real. Cada respuesta coincidió con su reemplazo completo y la lectura final coincidió con uno de los ocho conjuntos, sin mezclas. Pasaron además reversión por HTTP y denegación anónima. El intento de recorrido HTTP de citas no se considera una prueba completa: su lectura final coincidió con la limpieza del usuario temporal. El recorrido de citas sí pasó íntegramente en la prueba SQL transaccional anterior.

Las pruebas SQL terminan en ROLLBACK. Los usuarios temporales usados para concurrencia y HTTP, junto con sus sesiones de autenticación y registros dependientes, se eliminaron al terminar. Los cuatro bloques de disponibilidad preexistentes conservan su huella `45f4da723f24d147c1dda51b63ad21c4`.

El asesor de seguridad no detectó avisos nuevos por la migración. Persisten avisos anteriores sobre `set_simulation_session_updated_at`, el helper de aprobación y protección de contraseñas filtradas; no se cambiaron permisos o políticas ajenos a esta corrección.

## Límite de verificación visual

Se inspeccionó la aplicación publicada y su pantalla de acceso en navegador. El navegador no tenía sesión iniciada: no se afirma haber completado el recorrido autenticado de la agenda. Las comprobaciones de cliente automatizadas y de base de datos real están separadas de esa verificación visual pendiente.
