# Piloto de conversación por voz con Claudio

Abrir `/?piloto=claudio`, ingresar con una cuenta aprobada, preparar la sesión
de Claudio y elegir **Activar conversación por voz**. El acceso retoma el caso
o prepara la siguiente sesión según el avance; no fuerza la sesión 1.

Esta revisión conserva el retrato original de Claudio, de 40 años. Incorpora
una presentación animada de 7,25 segundos y una conexión opcional a un motor
local de Kokoro + Wav2Lip/OpenVINO para convertir cada respuesta real en vídeo.
El botón **Ver muestra animada** no inicia intervenciones ni llama a la IA.
Sin conectar el motor local, las respuestas siguen usando Web Speech y foto fija.

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

## Motor local integrado — 12 de septiembre de 2026

En **Animación y voz**, descargar y descomprimir **Claudio-motor-local.zip**.
Con Python 3.12 instalado, abrir **Iniciar-Claudio.cmd** y esperar «Listo».
Pulsar **Conectar motor local**, confirmar en la ventana local y volver al piloto.
El navegador puede solicitar permiso de conexión al equipo. La muestra funciona
sin instalar el motor; las respuestas animadas necesitan mantenerlo abierto.

El motor recibe solo el texto de la respuesta actual, usa voz española
`em_alex` y anima la boca del retrato canónico. No vuelve a llamar a Gemini.
Requiere token temporal y origen permitido; solo escucha en 127.0.0.1:8765.
El token no se persiste. Los archivos generados se eliminan al responder.
No recibe credenciales de Supabase ni modifica citas o consentimientos.

Interrumpir, silenciar, ocultar la pestaña o salir cancela la reproducción y
descarta vídeos tardíos. Si una generación sigue terminando en el motor,
otra petición recibe una indicación de ocupado. No se sustituye una respuesta
fallida por la presentación grabada. Un bloqueo de reproducción automática
ofrece el botón **Reproducir vídeo**.

Pruebas: 15 casos de voz/vídeo, `audit:claudio-video-flow` con el componente
real, `audit:simulator-flow`, pruebas del reloj del servidor y cuatro pruebas
HTTP aisladas del motor. Una petición al motor real produjo 123 fotogramas
a 25 fps con una frase nueva en 16,74 segundos en CPU Linux. Se comprobaron
los fotogramas y el MP4. Esto no mide el Intel Arc del usuario ni demuestra
una videollamada de baja latencia. La revisión visual en el navegador remoto
no pudo acceder a localhost (ERR_BLOCKED_BY_CLIENT). Windows, micrófono real
y el permiso de conexión local en el navegador del usuario quedan por validar.

La boca aún pierde detalle; no se animan cabeza ni ojos. Wav2Lip limita los
modelos y resultados a investigación/uso académico o personal no comercial.
No se ha contratado infraestructura adicional.

- https://github.com/Rudrabha/Wav2Lip
- https://github.com/openvinotoolkit/openvino_notebooks/tree/latest/notebooks/wav2lip
- https://github.com/thewh1teagle/kokoro-onnx
