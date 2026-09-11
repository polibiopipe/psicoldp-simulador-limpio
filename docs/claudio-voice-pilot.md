# Piloto de voz y avatar de Claudio

Abrir `/?piloto=claudio`, ingresar con la cuenta aprobada, preparar la sesión
de Claudio y elegir **Activar voz y avatar** en la entrevista. El piloto solo
se habilita para Claudio y con ese parámetro.

Usa el caso canónico vigente (40 años), el historial y la misma función
`onAsk` de las sesiones habituales. No genera respuestas clínicas propias,
no añade llamadas al modelo al reproducir voz y respeta acceso, consentimiento,
límites y guardado. Las intervenciones pertenecen a la sesión iniciada.

- TalkingHead 1.7.0 y Three.js 0.180.0 fijados.
- Voz y dictado mediante Web Speech, sin una API de voz o avatar contratada.
  El motor de IA existente conserva sus costos.
- Micrófono al pulsar Hablar; envío de la transcripción final al concluir.
  Interrumpir y hablar detiene la voz antes de abrir el micrófono.
- El dictado puede utilizar el servicio remoto del navegador; no se promete
  funcionamiento sin internet. No se captura cámara ni se guardan audios.
- Visemas españoles aproximados, corregidos por eventos de palabra si la voz
  los proporciona; no equivale a alineación acústica.
- Figura masculina provisional del ejemplo AvatarSDK de TalkingHead,
  publicada para uso no comercial. No reproduce el retrato de Claudio.
  Ver `/claudio-pilot-attribution.txt`.

## Validación

`npm run build` ejecuta primero nueve pruebas de voz, transcripción,
interrupción, permisos y cancelación, y luego compila el proyecto.
Las comprobaciones locales del caso Claudio (72) y de acceso/consentimiento
pasaron antes de preparar la vista previa.

Pendiente: prueba humana con micrófono y altavoces reales, revisión visual,
voz es-CL/es-ES en Chrome/Edge y ajuste labial. El modelo carga unos 12 MB
desde el repositorio original y requiere WebGL.

La conexión al entorno de trabajo se interrumpió al preparar la publicación;
la versión entregada y sus pruebas se conservan en la rama del piloto.
