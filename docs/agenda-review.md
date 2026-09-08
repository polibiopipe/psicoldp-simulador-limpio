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

Se conserva la duración de 45 minutos y la restricción existente de una cita no cancelada por estudiante y día. La hora programada no agrega una nueva restricción para comenzar la entrevista: se mantiene la política de inicio vigente.

## Verificación realizada

`npm run audit:agenda` ejecuta la lógica de calendario y horarios, y el servicio real de citas con una frontera Supabase simulada. Cubre errores de red, duplicados, respuestas vacías, cancelaciones rechazadas, inicio concurrente y almacenamiento local lleno. Se ejecutó también con `TZ=UTC` y `TZ=America/Santiago`.

Pasaron las auditorías existentes de expiración, reanudación autenticada y duración. La compilación de producción pasó. No se crearon ni cancelaron citas reales. Falta verificar el recorrido autenticado en navegador.

## Hallazgo pendiente en disponibilidad semanal

La versión publicada de `saveStudentWeeklyAvailability` elimina los bloques anteriores y luego inserta los nuevos mediante dos peticiones separadas. Si la segunda falla, los bloques anteriores pueden haberse perdido.

Ya están preparados `supabase/simulation_student_availability_atomic.sql` y el cliente que invoca `replace_simulation_student_availability` en una sola petición. La función utiliza la identidad autenticada, conserva RLS y los controles existentes de solapamiento, y serializa sus llamadas por usuario. Una excepción revierte también la eliminación de los bloques previos. Instalar esta función no modifica por sí mismo horarios existentes.

Orden de publicación: comprobar el esquema real y aplicar la migración en Supabase; verificar éxito, reversión ante bloque inválido, aislamiento entre usuarios y llamadas simultáneas; después publicar el cliente. No se debe publicar este cliente antes de la migración: si falta la función, muestra un error y evita recurrir al reemplazo inseguro anterior.

El cliente pasó pruebas con la frontera Supabase simulada, incluyendo una sola petición, identidad obtenida por el servidor, respuesta incompleta, migración ausente y fallo de red. La función SQL todavía requiere aplicación y prueba en PostgreSQL. El usuario conectó el complemento Supabase durante la preparación y la instalación aparece confirmada. Sus funciones de consulta y migración todavía no aparecen entre las funciones ejecutables de este hilo; la aplicación de la migración y su prueba real siguen pendientes.

Otro límite del recorrido actual: la carga de citas devuelve una lista vacía ante un error del servidor. La inserción y las restricciones del servidor evitan sobrescribir citas, pero la interfaz todavía necesita distinguir entre agenda vacía y carga fallida. Debe revisarse junto con la sincronización de `App.jsx` en una sesión autenticada.
