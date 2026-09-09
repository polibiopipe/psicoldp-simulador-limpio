# Consentimiento de investigación · Escucha Viva

## Estado de esta entrega

El módulo se encuentra integrado en «Consentimiento» y en el enlace de privacidad del acceso. El estudio `escucha-viva-estudiantes` está en estado `draft`, versión `1.0-draft`. No hay una convocatoria abierta y no se registró ningún consentimiento real durante las pruebas.

La decisión de participar es independiente del acceso a prácticas. La migración no modifica perfiles, citas, sesiones ni disponibilidades existentes. Nunca interpreta una cuenta existente, un ingreso o una práctica previa como consentimiento.

Supabase: `escucha-viva-simulador-v2` (`dstmscvnaziqptpomssv`), región `us-east-1`. Migración aplicada `20260909015833_simulation_research_consent`; fuente reproducible: `supabase/simulation_research_consent.sql`. La instalación del CLI no estuvo disponible en esta ejecución; se utilizó el conector de Supabase para registrar la migración, conservando el SQL con nombre descriptivo. La migración complementaria `simulation_research_collection_window` (fuente del mismo nombre en `supabase/`) excluye también sesiones completadas fuera del periodo de recogida.

## Para abrir la convocatoria

Completar `docs/research-study-template.json` con el protocolo revisado. Los campos vacíos son deliberados: no se han inventado responsables legales, duración, aprobación institucional ni condiciones de los proveedores.

1. Confirmar objetivo, población adulta, actividades, duración, instrumentos, riesgos, apoyo, beneficios/costos e incentivos.
2. Identificar responsable del estudio y del tratamiento, equipo autorizado, contacto de derechos y contacto independiente. UNIACC no pasa automáticamente a ser responsable por participar estudiantes de esa universidad.
3. Acordar la voluntariedad y alternativa académica con la institución. Documentar la relación del equipo con el desarrollo de Escucha Viva y cualquier interés comercial.
4. Revisar las condiciones efectivas del servicio de IA (incluida la modalidad contratada y los usos de los contenidos), Supabase y Vercel: destinatarios, ubicación, retención, subencargados y garantías de transferencias. No activar el estudio si esas condiciones contradicen las finalidades informadas.
5. Establecer fechas `collection_until` y `retention_until`, proceso de retiro, tratamiento de copias/exportaciones y conservación diferenciada de evidencia del consentimiento. La fecha de conservación no puede ser anterior a la de recogida.
6. Incluir referencia real a la revisión del protocolo. No afirmar una aprobación inexistente. Someter consentimiento y protocolo a la instancia institucional correspondiente.
7. Con el documento completo, actualizar la fila que sigue en `draft` con el contenido del JSON y cambiar `status` a `published` en la misma transacción. Solo un operador de base autorizado puede hacerlo. No usar claves de servicio en el navegador.

La publicación se rechaza en la base si faltan campos, categorías de datos o fechas válidas. Al publicar, el servidor incorpora las declaraciones y alcance canónicos, establece la fecha y congela el documento. No se publica desde el rol `qa`, ya que el proyecto actualmente asigna ese rol de forma general.

Las categorías admitidas son `conversation`, `feedback` y `usage`. `feedback` puede contener preparación y cierre: detallar eso en el protocolo si se incluye. Seleccionar solo lo necesario. `allow_quotes` habilita una casilla opcional; no habilita audio, video, biometría, publicidad, entrenamiento de modelos ni reutilización en otros estudios.

## Evidencia y retiro

`simulation_research_consent_events` es un historial de decisiones. Cada aceptación exige tres declaraciones: mayoría de edad/criterios, participación y tratamiento de datos. La constancia guarda texto completo, versión, decisiones, usuario y fecha del servidor. El cliente no puede falsificar el texto o la fecha ni actualizar o eliminar eventos. Cada persona solo consulta sus propios eventos.

La inserción comprueba el evento anterior bajo un bloqueo por usuario/estudio. Una ventana desactualizada debe recargar antes de guardar, lo que evita que una aceptación pendiente sobrescriba silenciosamente un retiro. La interfaz no confirma guardado cuando el servidor falla. Las casillas comienzan sin marcar, incluidos cambios de versión y reintentos.

El retiro se registra con confirmación explícita y está disponible también para una cuenta cuya aprobación de práctica fue retirada. No borra sesiones de práctica. Descargar una constancia `.txt` conserva el texto de la versión efectivamente registrada, incluso después de cambios de convocatoria. La pantalla muestra las 100 decisiones más recientes; la descarga completa de datos pagina todos los eventos disponibles.

## Datos para investigación

Usar exclusivamente `simulation_research_eligible_sessions` como origen del estudio. Es una vista `security_invoker`, accesible solo a operadores autorizados mediante `service_role`/administración de base. No se concede acceso de investigación al rol compartido `qa` ni a estudiantes.

La vista usa la última decisión del estudio y admite únicamente sesiones completadas e iniciadas después de esa aceptación, dentro del periodo de recogida y completadas antes del cierre de convocatoria. Deja de entregar datos después del retiro o del límite de conservación. Omite nombres, correo, ID de cuenta y de cita; entrega un código de participante y solo las categorías autorizadas. Los textos libres aún pueden identificar personas: requieren revisión antes de publicar. Los datos de la vista son seudonimizados, no anónimos.

El retiro bloquea nuevas consultas de ese conjunto. No puede eliminar por sí mismo archivos previamente descargados por investigadores; el responsable debe gestionar esas copias y solicitudes mediante el procedimiento publicado. La caducidad de la vista tampoco sustituye la eliminación/anonimización operativa: gestionar las copias del estudio, respaldos y constancias conforme al plazo documentado. El historial educativo tiene una finalidad separada.

Al cerrar una versión (`status='closed'`), el servidor fija `closed_at`. Para cambiar el documento, crear una nueva fila/versión y cerrar la anterior en una transacción. Nunca editar una versión publicada. Una aceptación anterior no autoriza una nueva versión; volver a aceptar solo incorpora sesiones nuevas posteriores a esa nueva decisión.

## Acceso a datos personales

La descarga «Mis datos y privacidad» reúne los registros visibles de perfil, sesiones, citas, disponibilidad, intervenciones y decisiones con filtros de propietario y paginación. Si falla una consulta, no se descarga un archivo incompleto. Se comprueba la identidad antes y después de recopilar los datos. No se almacenan consentimientos en cachés del navegador.

El enlace de gestión abre un correo a `contacto@nucleovivo.net`; no simula un ticket ni envía automáticamente un mensaje. El usuario debe enviarlo. Atender solicitudes que involucren borradores del dispositivo, registros técnicos, respaldos u otras copias mediante ese canal. La pantalla no promete borrado automático de toda la infraestructura.

## Verificación

- `npm run audit:all`: 21 suites aprobadas, incluidas la agenda, persistencia, recorrido completo y el nuevo consentimiento.
- `npm run audit:research-consent`: invitación opcional, decisiones separadas sin preselección, errores y doble clic, constancias, retiro, separación de cuentas, paginación y navegación de privacidad.
- `scripts/audit-research-consent.sql`: ejecutado sobre el proyecto real con cuentas/filas de prueba y `ROLLBACK`. Comprueba publicación incompleta, inmutabilidad, mayoría de edad, autorizaciones separadas, RLS, ventana obsoleta, exclusión de sesiones anteriores, minimización y retiro sin borrar prácticas.
- `npm run build`: correcto. Continúan los avisos previos de tamaño del paquete e importaciones mixtas del cliente Supabase.
- Asesor de seguridad: sin hallazgos nuevos para las tablas, funciones o vista incorporadas. Permanecen los avisos preexistentes de `set_simulation_session_updated_at`, el helper de aprobación y protección de contraseñas filtradas.

El texto legal de referencia se consultó el 9 de septiembre de 2026. No se afirma cumplimiento jurídico integral ni aprobación institucional. La fecha de vigencia de la reforma debe verificarse nuevamente al abrir el estudio, dadas las propuestas de postergación.
