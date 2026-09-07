# Estadísticas de Escucha Viva · primera versión

La navegación **Estadísticas** sustituye el antiguo acceso «Progreso», que abría el historial. Permite revisar registros propios guardados en Supabase y exportar los resultados filtrados como CSV UTF-8 con separador punto y coma. El archivo abre en Excel o puede importarse en Jamovi, R o SPSS.

## Alcance de las mediciones

| Campo | Interpretación y tratamiento |
| --- | --- |
| código de participante | En el estudio es un UUID aleatorio independiente de la cuenta, prefijado EV-. Es seudonimización, no anonimización irreversible. |
| código de registro | En el estudio es independiente del ID de sesión original. En la consulta propia conserva el ID original. |
| fecha | Fecha de inicio en America/Santiago; si falta inicio usa la fecha de creación del registro. No es fecha de evaluación. |
| número de sesión | Etapa informada por el simulador. Dos intentos de la misma etapa siguen siendo dos registros distintos. |
| estado | Completada, cierre pendiente o en curso. No interpreta sesiones incompletas como abandono. |
| duración | Segundos transcurridos guardados por el simulador, dentro de la ventana temporal configurada. Solo se muestra si existe inicio válido, cierre reconocido y estado completado/cierre pendiente. No mide actividad ni atención; no reconstruye horas desde el último guardado. |
| turnos | Intercambios completos guardados en sessionMetrics; falta de registro no equivale a cero. |
| puntaje automático | feedback.generalScore, exclusivamente para sesiones completadas. Exploratorio y no validado como resultado de aprendizaje. No usa la columna score, que puede contener apertura simulada. |
| apertura simulada | Estado del personaje ficticio. No es una medida psicológica del estudiante. |
| versión de medición | usage-v1 identifica el formato de las mediciones. legacy indica ausencia de versionado. No identifica versión de un instrumento ni modelo de IA. |
| versión del consentimiento | Versión aceptada para las sesiones incluidas en el estudio. Vacía en la descarga personal. |

Las medianas excluyen valores faltantes y muestran el denominador disponible. La tasa de finalización divide registros completados por todos los registros filtrados: no es tasa de retención de una cohorte. Las tablas por etapa son descriptivas; no suponen que las etapas contengan los mismos participantes, casos o condiciones. No calculan significación estadística, causalidad ni cambio pre/post pareado.

El razonamiento profesional, la metacognición y la transferencia requieren operacionalización, tareas y rúbricas/instrumentos del protocolo. Esta versión no inventa escalas ni asigna puntajes a esas variables. Tampoco distingue retrospectivamente respuestas de Gemini de respuestas del motor local: las trazas actuales no conservan esa procedencia de manera suficiente. La retroalimentación automática no reemplaza la evaluación humana prevista.

## Preparación en Supabase

1. Deben existir las migraciones actuales `simulation_sessions.sql` y `simulation_appointments.sql`. No volver a ejecutar las migraciones antiguas sobre producción solo para instalar este módulo.
2. Ejecutar **solo** `supabase/research_statistics.sql`. Es aditiva y conserva las políticas existentes. El estudio se crea desactivado y con equipo vacío.
3. Un administrador de base de datos agrega los UUID exactos de las cuentas verificadas de Polibio, Leyla y Daniel a `public.research_team` (user_id, enabled). La pertenencia no se obtiene de emails ni de metadatos editables por el estudiante. No hay asignaciones de personas preestablecidas en la migración.
4. En `public.research_settings`, completar `protocol_version` y `participant_information` con el texto definitivo del protocolo. Debe describir finalidad, datos incluidos, equipo responsable, voluntariedad, retiro, tratamiento de descargas, conservación y contacto. Este archivo no acredita aprobación académica o ética ni reemplaza el consentimiento completo. Configurar `enabled = true` solo al estar preparado el protocolo real para el estudio.
5. Publicar la rama después de verificar la migración y los accesos con cuentas de prueba. Las estadísticas personales no dependen de la activación del estudio y funcionan con las tablas existentes.

No se amplían los permisos de lectura de simulation_sessions. El estudiante sigue consultando solo su propia cuenta. La RPC del estudio valida autenticación, aprobación del perfil y pertenencia habilitada al equipo; devuelve únicamente campos autorizados, sin user_id, email, nombre, conversación ni feedback completo. Las tablas nuevas tienen RLS habilitada y no conceden acceso directo a clientes. No se utiliza una clave service_role en el navegador.

## Inclusión y retiro

- El participante acepta desde Estadísticas, con casilla inicialmente desmarcada. Se guarda versión, texto mostrado y fecha del servidor.
- Solo el INSERT inicial de una sesión en curso con inicio posterior a la aceptación crea vínculo con el estudio. Actualmente el simulador guarda el progreso después del primer intercambio completo; abrir la entrevista y salir sin intercambiar mensajes no crea una observación de sesión. No hay backfill de prácticas históricas, sesiones abiertas antes de aceptar ni sesiones importadas por primera vez ya completadas.
- Si el consentimiento cambia de versión, se requiere nueva aceptación. Los registros vinculados a una versión anterior dejan de aparecer en la vista actual.
- El retiro excluye inmediatamente los registros de consultas posteriores al servidor. Una nueva aceptación abre una participación nueva y no reincorpora registros anteriores.
- La baja de un miembro del equipo revoca las siguientes consultas. Ningún sistema puede retirar un CSV ya descargado o datos ya visibles en otro navegador; el equipo debe gestionar esas copias según el protocolo.
- No se conserva una copia nueva del diálogo. Eliminar una sesión original elimina también su vínculo del estudio. La consulta es una vista del estado actual y no un archivo inmutable de investigación; para cortes de análisis se debe exportar y custodiar la base conforme al protocolo.
- No se modifican los permisos ni el borrado del historial existente. El módulo consulta la nube y no utiliza cachés locales compartidas entre cuentas.

## Verificación

`node scripts/audit-research-statistics.mjs` verifica faltantes, ceros reales, denominadores, duplicados, fechas de Chile, filtros y exportación sin campos personales ni fórmulas ejecutables. `npm run build` comprueba la integración de la interfaz.

La validación SQL adicional ejecuta la migración en PostgreSQL embebido con datos ficticios: acceso anónimo/estudiante/equipo, configuración desactivada, consentimiento, inclusión prospectiva, retiro, reaceptación, paginación y ausencia de campos personales. No representa una prueba contra la base productiva.

Para repetirla, instalar `@electric-sql/pglite` en una carpeta temporal fuera de este repositorio y ejecutar `scripts/audit-research-permissions.mjs` con `RESEARCH_PGLITE_MODULE` apuntando al archivo absoluto `node_modules/@electric-sql/pglite/dist/index.js`. Es una dependencia exclusiva de verificación; no modifica las dependencias ni el lockfile del simulador.

Patrones de permisos utilizados: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones y privilegios](https://supabase.com/docs/guides/database/functions).

## Codespace

Un commit en esta rama no abre ni reinicia el Codespace «glowing system». Para renovar su retención hay que conectarse a ese Codespace desde https://github.com/codespaces. Sus cambios sin publicar deben revisarse allí antes de cualquier sincronización.
