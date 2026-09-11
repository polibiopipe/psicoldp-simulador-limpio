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
