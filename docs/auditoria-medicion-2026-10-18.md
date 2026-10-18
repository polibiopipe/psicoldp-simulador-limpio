# Auditoría de Escucha Viva y registro de razonamiento

Fecha: 18 de octubre de 2026. Base: 5e65c741638cdcf343daad9ba75a81a1fdf3f087.

## Alcance y límites

Revisión del código de la aplicación React/Vite, persistencia de sesiones, consentimiento, motor de casos, retroalimentación y suites del repositorio. La verificación funcional usa la aplicación real con servicios remotos simulados. No equivale a una auditoría de las políticas efectivamente instaladas en la base de producción, ni a una validación psicométrica o del protocolo de actores.

## Hallazgos y acciones

| Área | Evidencia actual | Acción / estado |
| --- | --- | --- |
| Preparación | CaseBrief y clinicalPreparation capturan objetivos y planificación. | Reutilizar; no duplicar preparación. |
| Casos | Existen biografías canónicas, reglas de revelación, evolución y auditorías de consistencia. | Conservar motor; seleccionar y pilotar casos equivalentes para el estudio. La equivalencia no se infiere de pasar pruebas de software. |
| Entrevista | Se guardan preguntas y respuestas con identificadores. | Añadida bitácora contextual vinculada a los identificadores de intercambios completos disponibles al registrar. |
| Decisiones | Existía decisión clínica de cierre, sin secuencia estructurada de decisiones intermedias. | Añadidos registros de decisión inicial, monitoreo, revisión y aplicación declarada a caso nuevo; cada uno conserva fundamentos, incertidumbre, alternativa y motivo. |
| Ayudas | Existen guías y retroalimentación formativa. | Cada nuevo registro se identifica como respuesta a pregunta estructurada y conserva ayuda declarada. No se afirma que la regulación sea espontánea; falta instrumentación automática de todas las ayudas. |
| Persistencia | simulation_sessions.feedback es JSONB y se serializa íntegramente. | decisionEvidence se conserva dentro de feedback. Sin migraciones ni ampliación de permisos. Se prueba guardado fallido, reintento, recuperación y cierre. |
| Concurrencia | Guardados en cola por sesión. | Se impide envío, cierre y navegación durante el guardado de bitácora. Reintentar el mismo registro conserva su identificador. La escritura en varias pestañas sigue requiriendo control de versión en servidor. |
| Acceso | Autenticación, aprobación y consentimiento de acceso; consentimiento de investigación separado. SQL contiene RLS por propietario y vista de sesiones elegibles restringida. | Mantener separación. El nuevo panel muestra únicamente las sesiones del usuario cargadas por el flujo existente; no crea acceso al conjunto del estudio. Políticas de producción pendientes de inspección directa. |
| Puntajes | scoring.js usa revisión formativa de indicios textuales y generalScore nulo. | No reutilizar indicios como puntuación validada de regulación o fundamentación. |
| Visualización | Faltaba una vista dedicada de episodios de razonamiento. | Añadido «Mis evidencias»: cantidades por momento, tabla de decisiones y exportación JSON de registros propios. Ausencia de registro no se convierte en cero de desempeño. |
| Transferencia | No se encontró un protocolo ejecutable de pre/post con actores y equivalencia documentada. | El etiquetado de caso nuevo es autodeclarado; no prueba transferencia. Falta integrar actores, evaluación sin ayudas y rúbricas revisadas. |
| Integridad | Sesiones editables por propietario en diseño existente. | La interfaz añade registros; no garantiza inmutabilidad en servidor. Antes del campo se requiere almacenamiento de eventos y evaluaciones con permisos diferenciados y versiones. |
| Rendimiento | Compilación genera paquete principal superior a 2 MB minificado. | Deuda existente: separar módulos de seminario y simulación; no condiciona captura de esta versión. |

## Qué se registra

Cada evento incluye id, versión del esquema, fecha, etapa, decisión, fundamento, incertidumbre, alternativa, motivo de mantenimiento/revisión, fuente estructurada, ayuda declarada, número de intercambios y sus identificadores. La conversación original permanece en el registro de sesión. El formulario no solicita datos de pacientes reales.

El modo actual es una bitácora formativa personal. No incorpora automáticamente a nadie al estudio. Su uso en investigación exige revisar el documento de información, consentimiento y protocolo para incluir estas categorías y distinguirlas del uso formativo.

## Matriz de medición propuesta, pendiente de validación

| Objetivo | Evidencia disponible | Evaluación necesaria |
| --- | --- | --- |
| Manifestaciones de regulación | Plan, incertidumbre, contradicciones y revisiones justificadas, enlazadas a conversación. | Codificación de planificación, monitoreo y adaptación con criterios explícitos y doble revisión. |
| Fundamentación de decisiones | Decisión, antecedentes, alternativas y límites declarados. | Rúbrica analítica independiente; criterios y niveles sometidos a expertos y pilotaje. |
| Relación entre procesos | Episodios y decisiones de una misma sesión identificados. | Matriz conjunta con puntuaciones y fragmentos; no confundir cantidad con calidad. |
| Movilización a caso nuevo | Etapa declarada y sesiones por caso. | Casos equivalentes, protocolo sin orientación y comparación del uso/adaptación de estrategias. |

## Condiciones pendientes para trabajo de campo

1. Cerrar indicadores, rúbricas, momentos de registro y protocolo de actores.
2. Separar modo de práctica y modo de evaluación con ayudas controladas y registro automático de su exposición.
3. Versionar casos, protocolo y motor; definir asignación de casos iniciales/nuevos.
4. Incorporar evaluación humana independiente con rol de investigador/revisor, evidencias ancladas y concordancia entre evaluadores.
5. Implementar eventos y evaluaciones en servidor con control de concurrencia; probar RLS con usuarios distintos contra la base real.
6. Habilitar panel del estudio sobre participantes elegibles según consentimiento vigente, códigos seudonimizados y exportación autorizada.
7. Pilotear carga de respuesta: la bitácora puede modificar el proceso observado y debe quedar descrita como tal.

Estos puntos no se consideran implementados ni validados por la presente entrega. La primera versión establece captura y consulta personal sin inventar puntuaciones ni cambiar el diseño de investigación.
