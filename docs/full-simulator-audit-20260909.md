# Auditoría de Escucha Viva — 9 de septiembre de 2026

La revisión continúa el PR 12, ya integrado en `main` (`aa516dd266f9ab2d3a99ca660a8ef4519b412581`), a partir del aviso «Ese día no tiene disponibilidad configurada» después de activar disponibilidad.

## Diagnóstico y correcciones

| Área | Hallazgo | Corrección |
| --- | --- | --- |
| Disponibilidad | Activar días solo cambiaba un borrador; el botón que guardaba decía «Editar mi disponibilidad». | Botón «Guardar disponibilidad», aviso de cambios pendientes, confirmación de guardado y bloqueo de programación mientras queden cambios pendientes. |
| Horarios | La normalización descartaba bloques inválidos antes del reemplazo: un error de hora podía borrar un día válido. Editar el primer bloque eliminaba los demás. | Validación previa a cualquier escritura; controles independientes para todos los bloques; detección de superposiciones y horas inválidas. |
| Agenda | El aviso no identificaba la fecha validada; respuestas incompletas podían interpretarse como listas vacías. | Día y fecha concretos, duración completa y hora de Santiago; respuestas incompletas permanecen sin verificar. |
| Historial | Una caída de Supabase podía mostrar la caché global de otra cuenta; eliminaciones fallidas se mostraban como exitosas. | Cachés por propietario, consultas explícitas por usuario, confirmación de filas y error con reintento. El panel y la continuidad se actualizan al eliminar. |
| Cierre | Historial y cita se escribían por separado. El borrador se borraba incluso tras fallar la nube. | RPC transaccional para historial y estado de cita; el formulario conserva su identificador y contenido hasta confirmación. Los reintentos no duplican registros. |
| Concurrencia | Un autoguardado tardío podía sobrescribir un cierre o acortar una conversación. | Cola por sesión en el cliente y protección de estado/identidad/longitud en PostgreSQL. |
| Continuidad | Los resúmenes dependían del navegador, aunque las sesiones existían en la nube. | Hidratación de resúmenes desde las sesiones completadas; actualización de agenda y panel; separación entre usuarios y rechazo de respuestas de acceso obsoletas. |
| Personajes | El lector narrativo esperaba `currentAge` y límites del formato antiguo; las biografías nuevas usaban `age` y `privacyBoundaries`. | Adaptación del lector, cronología compatible y verificación de apertura progresiva. Los mensajes del paciente no cuentan como intervenciones del estudiante. |
| Coherencia | Un error de precedencia marcaba a estudiantes sin empleo como trabajadores. Algunos motivos eran notas en tercera persona, repetidas literalmente. | Estado laboral correcto, respuestas de consulta en primera persona, variantes al repetir y relaciones familiares coherentes. |

La captura no muestra la fecha elegida ni si se pulsó Guardar. La ausencia de un guardado reciente y el texto ambiguo del editor sustentan el diagnóstico del borrador, pero no permiten reconstruir con certeza cada clic de esa cuenta.

## Base verificada

Proyecto: `escucha-viva-simulador-v2`, referencia `dstmscvnaziqptpomssv`. Coincide con el cliente de producción en `psicoldp-simulador-limpio.vercel.app`.

- `simulation_student_availability_atomic`: aplicada anteriormente, versión remota `20260908224948`; vuelta a probar en esta auditoría.
- `simulation_session_closure_atomic`: aplicada en esta auditoría, versión remota `20260909000749`. Archivo generado por Supabase CLI: `supabase/migrations/20260909000435_simulation_session_closure_atomic.sql`.
- Ambas RPC usan identidad autenticada, aprobación y `SECURITY INVOKER`. No se concedió acceso anónimo ni se modificaron las políticas de aprobación/QA existentes.

Los ensayos SQL crean usuarios y registros temporales dentro de una transacción y terminan en `ROLLBACK`. Verifican disponibilidad, solapamientos, rollback, propiedad, reservas, duplicados, reprogramación, cancelación, cambios obsoletos, cierre pendiente/completado, reintentos y autoguardados tardíos. No quedaron usuarios temporales de cierre.

Huellas antes/después idénticas, calculadas sobre las filas completas ordenadas por id:

| Datos | MD5 |
| --- | --- |
| Disponibilidad | `82e47a6040a28c5375ab8629a79852d3` |
| Seis sesiones existentes | `687286ece167cfbdd9a393d7b6c406e7` |

## Verificación reproducible

```sh
npm ci
npm run audit:all
npm run build
```

Resultado: **19 suites aprobadas, cero fallidas**. Incluyen los 15 casos, 270 intervenciones básicas, 72 comprobaciones de Claudio en cuatro sesiones, escenarios narrativos, preparación, feedback, autenticación/reanudación, expiración, duración y agenda. Las pruebas de componentes ejecutan cambios, guardado, error, reintento y edición posterior al cierre con React; la conexión se sustituye exclusivamente en la frontera Supabase de la prueba.

Los scripts antiguos que exigían etiquetas privadas del motor anterior se actualizaron al contrato público y a los datos canónicos actuales. Se mantienen comprobaciones de identidad, edades, familia, memoria de tareas, límites de revelación y ausencia de contaminación entre casos.

Ensayos de PostgreSQL:

- `scripts/audit-availability-atomic.sql`
- `scripts/audit-session-closure-atomic.sql`

## Alcance pendiente y observaciones

La entrada pública de producción y la publicación se verifican por separado. No se completó el acceso mediante el formulario seguro en el navegador remoto; por ello, no se presenta esta auditoría como una entrevista autenticada de principio a fin dentro de la cuenta del usuario. Tampoco se enviaron correos de aprobación ni se generaron consumos de Gemini como parte de estas pruebas. El navegador remoto bloqueó el servidor local; la interacción de los componentes se comprobó mediante pruebas ejecutables.

El asesor de seguridad no agregó advertencias por las nuevas funciones. Conserva tres observaciones anteriores: [search_path del trigger de timestamps](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [función de aprobación SECURITY DEFINER accesible al usuario autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) —usada por las políticas existentes— y [protección contra contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

La compilación conserva la advertencia previa sobre tamaño del paquete JavaScript. No impide publicar, pero la optimización del peso no forma parte de estas correcciones funcionales.
