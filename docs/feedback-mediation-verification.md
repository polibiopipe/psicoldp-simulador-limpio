# Mediación de aprendizaje y verificación del recorrido

Fecha: 10 de septiembre de 2026. Complementa `feedback-academic-review.md` y documenta una etapa posterior a su revisión inicial.

## Experiencia incorporada

Después de la entrevista, el estudiante elige un intercambio con respuesta, explica su intención o una discrepancia con el informe y escribe un segundo intento. «Guardar y revisar con IA» confirma primero el cierre, conservándolo como pendiente cuando corresponde, y solicita una lectura de ese intercambio. El ensayo no se envía al paciente. Cambiar de turno conserva los borradores de los otros momentos; cada descarga corresponde al ejercicio seleccionado.

La devolución distingue observación, interpretación posible, otra lectura, respuesta a la reflexión, revisión del ensayo, pregunta para seguir pensando, práctica siguiente y límites. No asigna nota ni decide el cierre. Se puede cuestionar y volver a solicitar después de editar. El ejercicio y su devolución se guardan junto con el cierre mediante el flujo existente, se recuperan al retomar y están disponibles para descargar desde el historial. El resultado recién generado queda pendiente de guardar, como los demás cambios del cierre; las salidas internas solicitan conservarlos.

El informe inmediato conserva su análisis textual. La mediación semántica es una llamada diferente a Gemini, a petición del estudiante. La bibliografía y los diez criterios originales fundamentan el encuadre educativo; no son un instrumento clínicamente validado ni un entrenamiento del modelo.

## Separación y consistencia

- `api/feedback-mediation.js` lee una sesión propia, guardada como `closure_pending` o `completed`. No importa el motor del paciente, no reserva intervenciones y no modifica conversaciones, decisiones ni puntuaciones.
- La cuenta se valida con `auth.getUser(token)`, aprobación, asignación habilitada a Escucha Viva y aceptación vigente. La lectura del registro filtra por sesión y propietario, y comprueba otra vez el propietario. No confía en un usuario o una conversación enviados por el navegador.
- La IA recibe la conversación registrada completa dentro del límite de contexto, el momento elegido, la reflexión, el ensayo y los criterios. No recibe el correo, biografía oculta, diagnósticos del caso, estado interno del avatar ni resultados de otros ejercicios. La apertura se conserva por separado y vuelve a incorporarse al retomar.
- Se pide salida estructurada. Las citas del estudiante y paciente deben coincidir literalmente con el intercambio; el criterio pertenece al catálogo y los enlaces se incorporan desde ese catálogo. Hay una comprobación básica de vínculo textual; **no demuestra corrección semántica ni bloquea toda devolución genérica o inyección de instrucciones**.
- Si falta configuración, expira la petición, falla el proveedor o no pasan los controles, no se fabrica una respuesta de IA. El informe y el ejercicio siguen disponibles.
- El historial muestra todos los turnos. Los registros anteriores se leen con criterios actuales cuando carecen de la versión nueva, indicándolo en pantalla. Los nuevos registros usan `score: null` cuando no existe una nota válida; la apertura del avatar ya no se usa como nota. El esquema versionado permite nulos y no se cambió la base de datos.
- Las correcciones anteriores de `analyzeStudentInput.js` siguen compartidas con el paciente local. La mediación nueva está separada; **el conjunto completo de cambios sí puede alterar algunas clasificaciones y respuestas locales**. Las pruebas de escenarios y consistencia pasan, pero no sustituyen una comparación humana de calidad conversacional.

## Verificación ejecutada

| Recorrido o límite | Evidencia | Alcance |
| --- | --- | --- |
| Compilación | `npm run build` completado | Código de producción; advertencias previas de tamaño del paquete |
| Regresión general | `npm run audit:all`: 24 suites aprobadas, ninguna fallida | Motores, biografías, escenarios, consentimiento, agenda, persistencia y feedback |
| Especificidad | `audit:feedback-academic`: 21 comprobaciones | Negaciones, límites, elogios improcedentes, incidentes tardíos, citas y exportación |
| Mediación | `audit:feedback-mediation`: 14 comprobaciones | API y componente reales, Supabase y respuesta del proveedor simulados |
| Recorrido de aplicación | `audit:simulator-flow` aprobado | Ingreso y tres aceptaciones, preparación, envío, guardado fallido, pausa, reanudación, cierre pendiente/definitivo y ejercicio recuperado |
| Apertura al recuperar | `audit:persistence-ui` aprobado | Conservación del preludio, sin duplicarlo ni contarlo como intervención |
| Navegador | No completado | La política del navegador bloqueó el acceso a la vista de pruebas; no se eludió el bloqueo |
| Gemini y datos reales | No ejecutado | El entorno de trabajo no dispone de las credenciales de Gemini/Supabase; las respuestas de pruebas son fixtures, no generaciones reales |

El fallo previo del recorrido completo se debía a que la cuenta ficticia no tenía fila en `simulator_access`; la prueba llegaba a la selección de simulador, no al consentimiento. Se añadió la asignación al fixture de ambas cuentas y una aserción que exige ver las tres declaraciones. No se relajó el control de ingreso.

## Configuración y comprobación pendiente

Se reutilizan `GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del servidor. `GEMINI_FEEDBACK_MODEL` permite seleccionar un modelo distinto para la mediación; si no existe, se usa el del paciente y, en último término, `gemini-2.5-flash`. No se añadieron dependencias ni migraciones.

El servidor limita el tamaño de la solicitud y contexto, la salida a 2.800 tokens y la espera del proveedor a 18 segundos. El cliente evita doble envío y espera hasta 25 segundos después del guardado. El límite de cuatro solicitudes por minuto y cuenta vive **por instancia**: no es una cuota distribuida ni un límite de gasto global. Antes de una apertura masiva debe verificarse la cuota del proveedor o añadir un control compartido.

Antes de publicar, falta verificar con una cuenta de pruebas autorizada y Gemini real: guardar una entrevista, pedir mediación sobre un límite, contrastar la devolución con la cita, editar el ensayo, volver a revisar, salir guardando y recuperar el ejercicio. Comprobar asimismo lectura en móvil, teclado, recuperación de errores y tiempo de respuesta. No se afirma que la revisión visual, la calidad semántica en uso real ni una mejora clínica estén demostradas.

La calibración docente propuesta en el informe académico sigue pendiente: pares de evaluadores, casos reservados, revisión de falsos positivos/omisiones y transferencia a una nueva entrevista. Las pruebas técnicas establecen comportamientos concretos; no establecen superioridad respecto de otros simuladores.

Referencias técnicas consultadas: [Supabase: getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [Gemini: salidas estructuradas](https://ai.google.dev/gemini-api/docs/structured-output), [Google: esquema y tipo de respuesta](https://firebase.google.com/docs/ai-logic/generate-structured-output). Fundamento educativo y límites de los 20 estudios/documentos: `src/data/feedbackAcademicBasis.js` y `docs/feedback-academic-review.md`.
