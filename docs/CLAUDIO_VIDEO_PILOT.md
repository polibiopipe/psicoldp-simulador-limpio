# Piloto Claudio — videollamada real (Tavus)

## Estado
Integración en rama de pruebas. No desplegar como disponible hasta activar Tavus y validar conversación, consentimiento y costos.

## Requisitos en Vercel, servidor (nunca VITE_TAVUS_API_KEY)
- TAVUS_API_KEY: clave secreta Tavus; configurar únicamente en Vercel.
- TAVUS_CLAUDIO_PERSONA_ID: persona Tavus creada específicamente para Claudio.
- SUPABASE_URL / SUPABASE_ANON_KEY (o equivalentes VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY): proyecto escucha-viva-simulador-v2.

La persona debe seguir la biografía canónica de `src/data/avatarCanonicalBiographies.js`. No usar una persona de demostración genérica para evaluación académica.
Dejar desactivada la grabación y habilitar el servicio solamente tras comprobar política de datos y consentimiento informado explícito para proveedor externo.

## Pruebas de aceptación
1. Sin JWT: 401. Con usuario no aprobado o sin consentimiento vigente: 403.
2. Sin configuración Tavus: 503 sin revelar claves.
3. Con persona y claves válidas: iniciar únicamente al pulsar botón, mostrar sala segura HTTPS.
4. Permisos de cámara/micrófono y fin de sesión; verificar que la sesión del proveedor termina efectivamente.
5. Español chileno, narrativa de Claudio, límites éticos y respuesta ante riesgo.
6. Verificar facturación del proveedor por uso y retención de datos.
7. Confirmar compatibilidad con bloqueo de iframes (CSP y X-Frame-Options) y política de la plataforma.
8. No atribuir a este piloto memoria clínica, historial ni feedback: actualmente no están conectados al proveedor. Mantener práctica textual como mecanismo evaluable.

## Restricciones
- No se envía al proveedor la historia previa ni identificadores de usuario.
- La API comprueba sesión Supabase, aprobación y consentimiento de acceso antes de crear llamada.
- Consentimiento específico de tratamiento audiovisual externo pendiente: no usar con estudiantes hasta implementarlo.
- No almacenar audio ni vídeo en Escucha Viva en esta etapa.
