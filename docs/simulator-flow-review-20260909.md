# Revisión del recorrido completo — 9 de septiembre de 2026

Continuación de los PR 12 y 13. Objetivo: que el estudiante pueda elegir un caso, prepararlo, entrevistarlo, guardar su avance, retomar y registrar un cierre coherente, sin instrucciones duplicadas ni confirmaciones falsas.

## Hallazgos corregidos

| Área | Problema | Comportamiento corregido |
| --- | --- | --- |
| Inicio | Una cita y su borrador contaban dos veces; citas futuras figuraban como sesiones por retomar. | Pacientes únicos; sesiones pendientes por caso y número; las citas programadas se distinguen de entrevistas iniciadas. |
| Navegación | Progreso y Sesiones llevaban al mismo lugar; podía haber dos entradas activas. | Un acceso al historial, estado de navegación único y etiqueta Cierre y evaluación. |
| Preparación | Copias ocultas de la ficha, antecedentes extensos siempre abiertos y encabezado de primera entrevista en sesiones posteriores. | Una ficha, material de referencia desplegable y encabezado contextual. Los nuevos encuentros pasan por preparación. |
| Selección | Volver a elegir un caso comenzaba siempre en la sesión 1. | Se propone la siguiente sesión de continuidad; practicar una sesión ya cerrada se anuncia explícitamente. |
| Entrevista | La barra llegaba a 100 % con diez turnos, sin relación con el aprendizaje. | Contador de intervenciones, sin porcentaje formativo artificial. |
| Entrevista | Vista de avatar y ayudas ocupaban espacio de entrada por defecto. | Conversación por defecto; vista simulada y ayuda de escritura opcionales. |
| Entrevista | Reiniciar, cerrar o salir mientras llegaba una respuesta podía abandonar el registro o mezclar estados. | Se serializa el envío, se bloquean transiciones durante la respuesta y se comprueba identidad/registro antes de incorporarla. Se retira el reinicio directo durante una entrevista activa. |
| Inicio de cita | Una activación rechazada podía aceptarse usando el objeto local como si fuera una confirmación. | El chat exige la confirmación remota antes de solicitar la respuesta del paciente. |
| Salida | Cambiar de pantalla o cerrar acceso podía limpiar el avance sin confirmar su persistencia. | Se confirma el guardado antes de salir; un fallo mantiene la entrevista. Cerrar acceso comprueba el error de Auth. |
| Reanudación | El plan de preparación de la entrevista en curso se reconstruía desde sesiones anteriores. | Se recupera el plan almacenado en el propio registro. El historial ofrece Retomar entrevista / Completar cierre. |
| Resultados | Resumen, feedback y cierre repetían información; la acción de guardado quedaba detrás de varios apartados. | Dos vistas: Registrar cierre y Revisar retroalimentación. Consultarlas conserva el formulario montado. Decisión y guardado aparecen primero. |
| Cierre | Era posible registrar una decisión sin fundamento; instrumentos y campos complementarios parecían obligatorios. | Se pide una justificación breve; la formulación ampliada y los instrumentos se identifican como opcionales. Se mantiene la salida con cierre pendiente. |
| Borradores | La espera de 500 ms podía perder el último cambio al salir, y los fallos de almacenamiento no siempre se mostraban. | Escritura local inmediata con estado de error explícito y distinción entre borrador del dispositivo y cierre confirmado. |
| Cierre pendiente | Salir pendiente no incluía los últimos campos en el registro remoto; otro dispositivo dependía de la caché. | Se persisten decisión y artefactos actuales; se restauran desde el registro remoto cuando no existe borrador local. |
| Cierre ya completado | Editar y salir intentaba guardarlo como pendiente, en conflicto con la protección de la base. | Se guardan los cambios con el mismo identificador y estado completado; se mantiene la validación del fundamento. |
| Continuidad | “Iniciar sesión ahora” abría la agenda; cerrar o derivar antes de la sesión 4 aún sugería continuar. | El botón dice Agendar sesión; la agenda respeta la decisión de continuidad, cierre o derivación. |

## Verificación

- `npm run audit:all`: 20 suites, 0 fallos. Incluye agenda, autenticación/reanudación, duración/expiración, persistencia, evidencia de feedback y conversaciones de los casos.
- Nueva `audit:simulator-flow`: ejecuta App y los componentes reales. Sustituye exclusivamente los servicios remotos por respuestas controladas. Verifica cita rechazada, envío en curso, salida bloqueada, fallo de guardado, pausa/reanudación sin reiniciar reloj, conteo único, cambio entre vistas sin perder borrador, cierre pendiente, recuperación sin caché y cierre definitivo con el mismo identificador.
- `audit:persistence-ui`: agrega el rechazo de una decisión sin justificación y conserva los casos de fallo, reintento y edición después del guardado.
- Compilación de producción y revisión del diff. Las migraciones SQL de disponibilidad y cierre de los PR anteriores permanecen sin modificaciones en esta revisión.

## Límites explícitos

La prueba de interfaz es una integración de componentes, no una entrevista autenticada en el navegador de producción. El navegador disponible permanece en el acceso público; el preview requiere autenticación de Vercel. No se ejecutaron respuestas Gemini reales ni envíos de correo en esta revisión. La publicación se comprueba mediante estado del despliegue, commit, dominio y recursos servidos.

La compilación conserva la advertencia de JavaScript de aproximadamente 1,52 MB sin comprimir y la importación mixta de Supabase. Esta revisión reduce carga de información en el recorrido, pero no acredita rendimiento en teléfonos reales, accesibilidad exhaustiva ni ausencia de todos los posibles errores clínicos/conversacionales. Esas condiciones requieren evaluación específica y observación de uso real; no se afirma que el simulador sea perfecto.
