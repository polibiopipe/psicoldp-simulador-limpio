# Motor local de Claudio

Este paquete conecta voz neuronal y vídeo a las respuestas reales del piloto
de Escucha Viva. Está limitado a uso académico o personal no comercial.

1. Instala **Python 3.12** desde https://www.python.org/downloads/ si aún no lo tienes.
2. Descomprime el ZIP completo en una carpeta de tu computador.
3. Abre **Iniciar-Claudio.cmd**. La primera vez descarga dependencias y unos
   790 MB de modelos. No requiere una API de pago. Espera al mensaje «Listo».
4. En el piloto, despliega **Animación y voz** y pulsa **Conectar motor local**.
5. En la ventana nueva, pulsa **Conectar con el piloto**. Si el navegador pide
   permiso de conexión local, acéptalo para este piloto. Regresa al simulador.
6. Activa la conversación por voz. Cada nueva respuesta del chat se envía al
   motor y se convierte en un vídeo con su propio audio. También puedes repetirla.

Mantén abierta la ventana del motor. Para detenerlo pulsa Ctrl+C; en el piloto
puedes desconectarlo y seguir usando texto o la voz del navegador. Si cambias
de página, vuelve a conectar el motor. El código de conexión solo dura mientras
el motor está abierto y no se guarda en el navegador.

El programa se ha probado en Linux con CPU. El lanzador está preparado para
Windows, pero no se ha ejecutado en el portátil del usuario. El equipo reportado
es Intel Core Ultra 5 125H, Intel Arc y unos 16 GB de RAM. El modo inicial usa
CPU; no necesita NVIDIA. Para medir Intel Arc, después de instalar se puede
ejecutar `.venv\Scripts\python.exe server.py --device GPU` desde esta carpeta.
La GPU requiere controladores y compatibilidad de OpenVINO en ese equipo.

## Qué esperar

- Conserva la fotografía de Claudio y anima la parte inferior de la cara.
  Los ojos y la cabeza permanecen quietos. La boca aún pierde detalle.
- Utiliza Kokoro `em_alex` en español. No clona una voz real ni garantiza
  acento chileno. La calidad sigue siendo experimental.
- Necesita preparar el vídeo antes de reproducirlo; puede haber esperas de
  varios segundos o más según el texto y el equipo. No promete videollamada
  de baja latencia. El texto de la respuesta está disponible durante la espera.
- El botón **Ver muestra animada** reproduce la presentación grabada. Esta
  presentación nunca se usa para fingir una respuesta nueva del paciente.
- **Interrumpir y hablar**, silenciar, salir o cerrar la sesión detienen la
  reproducción. Una generación interrumpida puede terminar de procesarse en el
  motor; su resultado no se reproduce. Si el motor sigue ocupado, espera unos
  segundos y pulsa **Repetir respuesta**.

## Privacidad y alcance

El motor escucha exclusivamente en `127.0.0.1:8765`, dentro del computador.
Requiere una conexión iniciada desde el piloto y un código temporal. Recibe
solo el texto que debe pronunciar. No recibe la cuenta, contraseñas, tokens de
Supabase ni el historial completo. No llama a Gemini ni altera citas, sesiones,
consentimientos o evaluaciones. Los archivos de audio y vídeo son temporales:
se eliminan después de generar la respuesta HTTP. No se activa la cámara.

Las funciones clínicas del simulador mantienen sus servicios y condiciones
existentes. Que este motor no use una API de pago no elimina los costos de
los servicios ya presentes en el simulador.

## Fuentes

- Wav2Lip: https://github.com/Rudrabha/Wav2Lip
  Referencia incluida del commit `bac9a81e63ecc153202353372e5724b83d9e6322`.
  Sus modelos y resultados están restringidos a investigación, uso académico
  o personal no comercial. Se conserva el README original en `Wav2Lip/`.
- OpenVINO: https://github.com/openvinotoolkit/openvino_notebooks/tree/latest/notebooks/wav2lip
- Kokoro ONNX (MIT): https://github.com/thewh1teagle/kokoro-onnx
- Pesos Kokoro (Apache 2.0): https://huggingface.co/hexgrad/Kokoro-82M

`model-sources.json` identifica las descargas exactas y sus SHA-256. El programa
verifica esos hashes antes de usar los pesos. Los pesos no se incluyen en el ZIP.

Para reproducir las pruebas aisladas del servidor: `python -m unittest test_server.py`.
