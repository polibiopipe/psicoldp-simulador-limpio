# Laboratorio de escucha: práctica complementaria con Tomás

Versión: tomas-exploration-v1.

## Seis incorporaciones

1. **Microescenas** de hasta cinco minutos y seis intervenciones nuevas: silencio, límite sobre un tema, desacuerdo con una interpretación y cierre. El estudiante elige qué decir y cierra con una reflexión. El tiempo limita la actividad; no es una medida de desempeño. Las aperturas son situaciones ficticias de entrenamiento compatibles con Tomás, no episodios empíricos ni nuevos datos del caso formal.
2. **Volver a un momento**: el estudiante elige un intercambio de sus sesiones, redacta otra intervención y obtiene una respuesta de ensayo. La rama utiliza solamente el prefijo anterior al turno elegido. Conserva el original y todas las alternativas; no reescribe la sesión ni incorpora el futuro original como si hubiera ocurrido en la rama. El motor local puede diferir del motor original, limitación visible junto a la comparación. No se atribuyen diferencias causalmente a la pregunta.
3. **Intención y respuesta**: la intervención y respuesta originales acompañan tres campos: intención, observación y límites, y próximo intento. Se conserva referencia exacta a sesión y turno; la reflexión pertenece al estudiante y no es una puntuación psicológica.
4. **Hilos de Tomás**: muestra último intercambio, hipótesis, fundamento y datos faltantes de los cierres reales disponibles. Permite anotar pendientes y retomar un hilo en una práctica breve. Esta práctica copia el contexto original, genera solo nuevas respuestas complementarias y mantiene intacto el cierre. La continuidad de las sesiones formales sigue utilizando la síntesis previa existente; el laboratorio no altera esa intervención.
5. **Mapa de descubrimientos**: reúne bitácoras reales y reflexiones propias, con procedencia, fecha y próximos intentos. Las microescenas terminadas y alternativas se conservan y pueden revisarse. Los contadores describen actividades; no significan competencia, mejora, regulación metacognitiva ni eficacia.
6. **Desafíos elegidos**: escuchar sin apresurar, profundizar con cuidado, sostener incertidumbre o cerrar con continuidad. El propósito puede elegirse entre actividades; queda fijado durante una escena para conservar su contexto. No se imponen rachas, posiciones entre estudiantes ni recompensas por volumen.

## Separación respecto de la investigación

Se accede desde la nueva sección Laboratorio de escucha en /tesis-tomas. No modifica el simulador general, su agenda, las evaluaciones ni los datos clínicos originales. No hay nuevas tablas, cambios al consentimiento ni llamadas del laboratorio al servidor de investigación. El acceso al laboratorio tampoco se agrega como una exposición formativa del recorrido.

En preparación, las cuentas sin cupo asignado pueden explorar el laboratorio. Durante la recogida formal, las personas sin cupo deben seguir el ingreso del estudio; no se les ofrece un ensayo que contamine la línea base. Una persona con cupo solo accede después de enviar pre, post, transferencia y entrevista retrospectiva, incluso si la recogida se cierra o la cuenta dispone de un rol del equipo. Esto mantiene el contenido complementario fuera del tramo medido. Los registros siguen sujetos a revisión humana de calidad; el acceso posterior no modifica sus respuestas ya enviadas.

La restricción es una condición de la interfaz del estudio. No impide que una persona use otros simuladores o modifique código en su navegador; la evaluación continúa requiriendo supervisión y declaración de exposiciones previas. Incorporar estas actividades durante EV1/EV2 requeriría una nueva versión del protocolo común, revisión y pilotaje; no se ha hecho ese cambio.

## Conservación y privacidad

El cuaderno usa sessionStorage con versión y clave por cuenta. Se conserva al navegar o recargar en la misma pestaña; no es almacenamiento permanente ni sincronizado entre dispositivos. Si el navegador rechaza el guardado se informa del error y el contenido sigue disponible en memoria mientras la actividad permanezca abierta. La descarga JSON conserva notas, ramas, conversaciones breves y procedencia, identificada como práctica complementaria fuera del conjunto de investigación. No incluye token, correo ni clave de servicio.

El contexto y los textos pueden ser personales: conservar la copia en un lugar propio y revisar antes de compartir. La interfaz explica el alcance temporal del borrador y ofrece descarga visible. Los borradores de campos todavía no enviados no se presentan como reflexiones registradas. El motor de ensayo funciona localmente; no realiza llamadas de red ni envía conversaciones al proveedor.

## Verificación

La prueba audit:thesis-exploration recorre componentes reales con React: bloqueo antes de completar la entrevista retrospectiva, microescena y respuesta, reflexión, rama alternativa, intención frente a respuesta, continuidad con contexto copiado, límite de cinco minutos, mapa y cambio de cuenta. Verifica inmutabilidad del original, prefijo correcto de la rama, separación de borradores y ausencia de llamadas de red. La suite general comprueba las funciones habituales y del módulo de tesis. Compilación de producción verificada; la revisión visual y de usabilidad supervisada con estudiantes sigue formando parte del pilotaje pendiente.
