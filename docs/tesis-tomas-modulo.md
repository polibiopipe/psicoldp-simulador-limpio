# Espacio independiente del estudio: Tomás

**Actualización operativa vigente:** ver [tesis-tomas-investigacion-operativa.md](tesis-tomas-investigacion-operativa.md). El documento que sigue conserva el historial de construcción. Desde v3 el recorrido formal incorpora dos encuentros, motor generativo con versión por turno, evaluaciones A/B/C, rúbrica humana y panel del equipo. Las referencias inferiores a cuatro encuentros formales y funcionalidades pendientes describen la versión anterior; cuatro encuentros permanecen únicamente en el ensayo técnico.

Ruta: `/tesis-tomas`. No sustituye el simulador habitual.

## Recorrido

Cuenta personal → condiciones de acceso → consentimiento de investigación vigente → cupo individual → preparación → entrevista con Tomás → bitácora → cierre → retroalimentación.

Se reservan exactamente 50 códigos: EVT-001 a EVT-050. Son cupos que se vinculan a una cuenta real; no son contraseñas, cuentas ficticias ni variantes del personaje. La asignación en servidor es atómica y cada cuenta recibe un único cupo. No se reutilizan automáticamente cupos previamente asignados.

El recorrido conserva cuatro sesiones de hasta 20 minutos y 25 intervenciones. Todas corresponden al mismo caso. El motor clínico local existente de Tomás se usa en el ensayo y esta versión del módulo, registrado como `tomas-local-clinical-v1`. No se llama al endpoint habitual que exige una cita. Esta versión no usa el proveedor generativo de la entrevista habitual; si se decide incorporarlo antes del campo debe fijarse y pilotarse su versión en el protocolo. No hay cambio al motor del simulador habitual.

La bitácora solo ofrece decisión inicial, monitoreo y revisión; no etiqueta repetición del mismo caso como transferencia. La evaluación de transferencia a un caso nuevo queda fuera de este módulo.

## Separación

- Tablas nuevas: thesis_tomas_slots, thesis_tomas_sessions, thesis_tomas_settings.
- Endpoint nuevo: /api/thesis-tomas.
- Sin lecturas ni escrituras de simulation_appointments o simulation_sessions en el endpoint del estudio.
- No cambia App.jsx ni las rutas habituales en esta entrega. main.jsx incorpora una ruta adicional cargada de forma diferida.
- Las condiciones de acceso, identidad y consentimiento existentes se reutilizan; los datos de sesiones del estudio no se mezclan con la práctica.
- La exportación personal de privacidad incluye las dos nuevas tablas con datos propios, conservando el control de identidad existente.

## Estado de recogida

La base contiene solamente un documento de investigación en borrador (`1.0-draft`). `collection_enabled` permanece en false. No se inventó aprobación ni consentimiento. La interfaz ofrece un ensayo técnico sin persistir respuestas ni bitácora en el conjunto de investigación. Las conversaciones del ensayo se pierden al salir o recargar; los borradores de preparación y cierre pueden conservarse en el navegador con ámbito separado. El modo está claramente identificado.

Para iniciar campo: publicar la información y consentimiento completos por el procedimiento existente, confirmar el protocolo del caso y habilitar collection_enabled. Cada operación formal vuelve a comprobar consentimiento aceptado, mayoría de edad, estado publicado y plazo de recogida; retirar consentimiento bloquea nuevas escrituras. Las sesiones conservan la referencia al consentimiento y documento del estudio usados al comenzar.

## Integridad y acceso

El cliente no puede insertar o modificar tablas del estudio directamente. RLS permite leer solo el cupo y sesiones propios. El endpoint verifica cuenta, aprobación y condiciones de ingreso; la función de escritura es SECURITY INVOKER y solo service_role tiene EXECUTE. Los bloqueos por participante y versión de sesión evitan sobrescrituras silenciosas. La fecha y cantidad de intervenciones del episodio se establecen también en servidor. Hay límites de longitud, número de sesiones, turnos y eventos.

Se verificaron en base real: 50 filas y cero asignaciones iniciales; RLS en las tres tablas; ausencia de permisos anónimos de lectura; ausencia de INSERT y EXECUTE de escritura para authenticated. Las pruebas de API simulan servicios externos. No se reclutaron participantes ni crearon cuentas de prueba en producción.

## Pendiente metodológico

Rúbricas, evaluadores, concordancia y panel del estudio siguen pendientes; «Mis evidencias» muestra registros descriptivos del participante. Este módulo proporciona el recorrido aislado, no valida por sí solo los instrumentos ni establece eficacia o transferencia.

## Ampliación del recorrido y presentación

El módulo reutiliza ahora los componentes completos CaseBrief, SimulationChat, SessionClosure, ResultsSummary y FeedbackPanel. Incorpora las seis etapas de preparación (objetivo, plan de sesiones, entrevista, áreas, ética e información prioritaria), las herramientas de conversación, hipótesis y antecedentes, selección de instrumentos, evaluación complementaria con informe ficticio, integración, diseño de intervención, devolución inicial y nota clínica.

SessionClosure recibe isolatedProcess=true: suprime el guardado en la memoria habitual y sustituye la acción de agenda por preparar el siguiente encuentro. Los borradores se separan por el prefijo de cuenta thesis-tomas y por modo piloto/estudio. El límite operativo sigue siendo cuatro encuentros aunque la propuesta clínica justifique otra duración.

La decisión, los artefactos normalizados y la síntesis del proceso se conservan en closure. Las revisiones de cierre mantienen sus versiones anteriores. El segundo intento se guarda como feedbackPractice en el cierre del estudio; el nuevo endpoint /api/thesis-tomas-mediation solo lee el registro propio del módulo o un diálogo de ensayo explícitamente marcado como piloto. Reutiliza instrucciones, validación de citas y fuentes del motor formativo. No modifica la conversación del paciente ni asigna notas. En el ensayo, la revisión solicitada envía el diálogo al proveedor autorizado por las condiciones de acceso, pero no lo añade a la base del estudio.

La portada y «Explorar herramientas» ofrecen acceso progresivo a las guías, con tarjetas, propósitos y ejemplos. El indicador de avance cuenta encuentros efectivamente completados; no representa competencia ni utiliza rachas o urgencia artificial. Los borradores del ensayo pueden conservarse en este navegador; las conversaciones y el proceso del ensayo permanecen en memoria de la ventana y no se incorporan al estudio.

Verificación adicional: recorrido con componentes reales y servicios simulados, de planificación completa a conversación, cierre con hipótesis/artefactos y retroalimentación. Se comprueba aislamiento de la memoria habitual, endpoint de mediación específico y ausencia de acción de agenda. Las pruebas del simulador habitual se mantienen.
