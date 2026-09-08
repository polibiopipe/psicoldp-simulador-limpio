# Mejora visual de Escucha Viva

La pantalla de acceso utiliza una escena original de conversación, con fotografía y luz natural. La misma imagen aparece de forma discreta en el encabezado del panel de inicio. Los retratos existentes se conservan; el selector de casos mejora sus encuadres, espaciado, legibilidad y señalización de selección.

Las animaciones son transiciones de interfaz y una entrada breve del formulario. Respetan la preferencia de movimiento reducido. No constituyen video ni animación facial o sincronización labial.

No se agregaron proveedores, paquetes ni llamadas a servicios. El recurso se sirve como archivo estático. No se modificaron autenticación, conversaciones, evaluación, agenda ni almacenamiento.

## Recurso

- Archivo utilizado: `public/visuals/espacio-escucha.webp`.
- Método: generador de imágenes integrado en ChatGPT; una generación, sin Higgsfield ni API externa.
- El PNG generado se recodificó a WebP para reducir su peso, sin cambiar la escena.
- Imagen decorativa con texto alternativo vacío. Los retratos de pacientes mantienen su identificación como ficticios.

## Prompt original

```text
Use case: photorealistic-natural
Asset type: one original photographic background for the Escucha Viva access screen, a Núcleo Vivo conversation training simulator.
Primary request: Create ONE image only: a realistic editorial architectural photograph of an intimate contemporary conversation space in Chile. Horizontal 16:9 composition.
Scene and subjects: two comfortable petroleum teal fabric armchairs positioned at a gentle angle toward each other; a wooden side table; a tall window opening visually onto a small planted courtyard; restrained warm amber details.
Composition and framing: human eye level from the point of view of someone entering the room. Place both chairs predominantly in the lower right half. Keep the left half and upper area quiet, uncluttered and somewhat dark, with natural architectural negative space suitable for a later text overlay. The image itself must contain no text.
Lighting and mood: soft natural late afternoon light entering from the courtyard, warm amber accents; inviting, calm, sober and distinctive.
Style and texture: convincingly real architectural editorial photography, authentic woven upholstery and wood grain, natural material variation, realistic perspective, soft shadows and restrained color grading. The setting should feel like a welcoming small conversation room.
Constraints: no people, letters, logos, screens, text, watermarks, collage or interface. No corporate office aesthetic, no hospital or clinic aesthetic. Do not include or alter patient portraits. Single scene, single image, no variants.
```
