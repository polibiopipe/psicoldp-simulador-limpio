# Piloto de conversación por voz con Claudio

Abrir `/?piloto=claudio`, ingresar con una cuenta aprobada, preparar la sesión
de Claudio y elegir **Activar conversación por voz**. El acceso retoma el caso
o prepara la siguiente sesión según el avance; no fuerza la sesión 1.

Esta revisión conserva el retrato original de Claudio, de 40 años, antes y
después de activar la voz. Retira el modelo genérico 3D: la imagen permanece
fija. Animar los labios conservando su identidad requiere otro desarrollo.

Usa el historial y la misma función `onAsk` de las sesiones habituales.
No añade llamadas al motor clínico al reproducir una respuesta y mantiene
acceso, consentimiento, límites y guardado. Las intervenciones pertenecen
a la sesión iniciada. Una cita rechazada no se trata como confirmada.

- Voz y dictado mediante Web Speech, sin contratar una API adicional.
  El motor de IA existente conserva sus costos.
- Micrófono al pulsar **Hablar**; envío de la transcripción final al concluir.
  **Interrumpir y hablar** detiene la voz antes de abrir el micrófono.
- El dictado puede utilizar el servicio remoto del navegador. No se promete
  funcionamiento sin internet. No se captura cámara ni se guardan audios.

## Validación

`npm run build` ejecuta las pruebas del controlador de voz y compila el
proyecto. `npm run audit:agenda` verifica persistencia y citas rechazadas.
`npm run audit:simulator-flow` comprueba el recorrido y la continuidad.

La prueba con micrófono y altavoces reales requiere el equipo del usuario.

## Inicio de la sesión

El navegador envía una reserva confirmada. La API autenticada valida usuario,
aprobación, consentimiento, cita y sesión. Solo después de obtener una primera
respuesta válida, el servidor fija `started_at` y `ends_at` mediante una
actualización condicional. Los reintentos conservan la hora ya confirmada.
El cliente recibe esos tiempos junto con la respuesta y los usa al guardar.

`node scripts/audit-appointment-server-start.mjs` ejecuta la API con límites
de autenticación y persistencia simulados: primera respuesta, fallos, permisos,
propiedad, vencimiento y carreras. La prueba transaccional en la base real fue
bloqueada por revisión automática y no se ejecutó. No se modificó su esquema.

## Realismo pendiente

La foto fija y SpeechSynthesis no satisfacen el objetivo de videollamada realista.
No se ha conectado un motor de vídeo ni una voz neuronal nueva.

Una alternativa para evaluar es MuseTalk 1.5 para animación desde foto/audio y
Kokoro para voz española. MuseTalk declara inferencia de más de 30 fps en una
NVIDIA Tesla V100; su ejemplo de una RTX 3050 Ti de 4 GB tarda unos cinco minutos
en generar ocho segundos. No basta con comprobar que exista cualquier GPU.
El propio proyecto advierte limitaciones de preservación de bigote y labios.
Se necesita validar identidad, latencia y calidad con Claudio antes de integrar.

- https://github.com/TMElyralab/MuseTalk
- https://github.com/hexgrad/kokoro
- https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md

No se ha contratado infraestructura. El siguiente dato necesario es el modelo
de GPU disponible, para evaluar una prueba local sin pagar un servidor externo.
