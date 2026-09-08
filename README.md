# Escucha Viva · Entrevista psicológica formativa

Plataforma educativa de Núcleo Vivo con 15 pacientes ficticios adultos. Permite preparar, agendar y practicar entrevistas, completar un cierre y revisar retroalimentación con evidencia de las intervenciones. El proceso admite entre 1 y 12 sesiones planificadas; cada entrevista dispone de 45 minutos y un máximo técnico de 60 intervenciones. El tiempo continúa al cerrar o recargar la página.

La entrevista es por texto, con dictado opcional del navegador y un retrato estático. Los indicadores de tiempo y uso no representan competencia clínica. La retroalimentación y los puntajes son orientativos: no constituyen un instrumento validado ni reemplazan la revisión docente. No introducir datos de pacientes reales.

## Arquitectura actual

- React 19 y Vite para la interfaz; las pantallas y el motor de respuestas se cargan según se necesitan.
- Supabase Auth y aprobación manual para acceder a la versión publicada; sesiones, agenda y perfiles protegidos por sus políticas de acceso.
- `api/gemini-patient-response.js`: función de Vercel que valida la cuenta, la sesión, la duración y la intervención antes de solicitar una respuesta a Gemini. Conserva reintentos idempotentes y respaldo local.
- `src/utils/responseEngine.js`: cliente de la función y manejo de errores recuperables.
- `src/data/avatarCanonicalBiographies.js`: identidad y hechos de los 15 casos. `patientConversationLines.js` expresa los mismos hechos en primera persona.
- `src/engine/narrativeDisclosure.js`: selector compartido de revelación inicial, contextual y profunda. Los antecedentes íntimos no se incluyen anticipadamente en el contexto del modelo.
- `src/utils/patientResponseValidation.js`: validación compartida que admite respuestas breves completas y detecta señales de truncamiento.
- `src/engine/sessionHistory.js`: registros de práctica y versión de medición; `src/engine/researchStatistics.js`: indicadores y exportación.

## Progreso e investigación

Estadísticas utiliza los registros de la cuenta para mostrar actividad, cierres y medidas formativas, con descarga CSV. El módulo personal funciona independientemente de la configuración de investigación.

La instalación opcional de investigación se describe en [docs/research-statistics.md](docs/research-statistics.md). La migración mantiene el estudio desactivado y no asigna investigadores. No activar ni recopilar información para una tesis sin definir el protocolo, los permisos y el consentimiento correspondiente.

## Comprobaciones

```bash
npm run audit:coherence
npm run audit:encoding
npm run audit:feedback
npm run audit:session-expiration
npm run audit:session-resume-auth
npm run audit:session-duration-policy
npm run audit:adult-avatars
npm run audit:clinical-all
npm run audit:phase3a-safety
node scripts/audit-avatar-canonical-biographies.mjs
node scripts/audit-narrative-disclosure.mjs
node scripts/audit-local-narrative-integration.mjs
node scripts/audit-avatar-conversation-scenarios.mjs
node scripts/audit-research-statistics.mjs
npm run build
```

## Requisitos

- Node.js 20 o superior recomendado.
- npm.

## Instalacion

```bash
npm ci
```

## Desarrollo local

```bash
npm run dev
```

Abre la URL local que muestre Vite, normalmente:

```text
http://localhost:5173
```

## Aprobacion manual de usuarios

La aplicacion exige dos validaciones cuando Supabase esta configurado:

1. Confirmacion del correo mediante Supabase Auth.
2. Aprobacion manual del perfil en `public.user_profiles`.

Para una instalación nueva, revisa `supabase/simulation_sessions.sql` en Supabase SQL Editor. En una instalación existente, compara las migraciones aplicadas antes de ejecutar SQL: este archivo restablece las aprobaciones existentes. El script:

- crea perfiles pendientes automaticamente al registrar usuarios;
- protege la lectura del perfil con RLS;
- impide que un estudiante apruebe su propia cuenta;
- restringe `simulation_sessions` a usuarios con `approved = true`.

Para habilitar una cuenta, abre `public.user_profiles` en Supabase Table Editor y
cambia `approved` a `true`. `approved_at` se completa automaticamente. Los usuarios
existentes quedan pendientes al ejecutar la migracion y deben aprobarse manualmente.

### Aprobacion segura desde el correo

La solicitud se envia desde una Netlify Function y contiene un enlace de aprobacion
de un solo uso. El token plano existe solamente en memoria durante el envio; Supabase
guarda su hash SHA-256. La `service_role` se usa exclusivamente en las Functions y
nunca se expone al navegador ni al frontend de Vite.

1. Ejecuta `supabase/access_request_notifications.sql` en Supabase SQL Editor.
2. En Netlify configura estas variables de entorno solo para Functions:
   - `ACCESS_REQUEST_WEBHOOK_SECRET`: secreto largo y aleatorio.
   - `RESEND_API_KEY`: clave del proveedor de correo Resend.
   - `ACCESS_REQUEST_FROM_EMAIL`: remitente de un dominio verificado en Resend.
   - `ACCESS_REQUEST_TO_EMAIL`: `contacto@nucleovivo.net`.
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave secreta disponible solo para Functions.
3. Despliega el sitio desde Git para publicar
   `netlify/functions/new-access-request.mjs` y
   `netlify/functions/approve-access.mjs`.
4. En **Supabase > Database > Webhooks**, crea un webhook para el evento `INSERT`
   de `public.access_approval_notifications` con:
   - URL: `https://TU-SITIO.netlify.app/.netlify/functions/new-access-request`.
   - Header: `x-escucha-viva-webhook-secret` con el mismo secreto de Netlify.

La cola se crea solamente cuando el correo pasa a confirmado. Su restriccion unica
por `user_id` evita generar mas de una solicitud por cuenta. El correo incluye el
boton **Aprobar acceso**, que abre una pagina de confirmacion responsive. El enlace
expira en 7 dias y solo puede utilizarse una vez.

Al confirmar, la funcion SQL `approve_access_with_token_hash` actualiza en una sola
transaccion `public.user_profiles` y `public.access_approval_notifications`. Un token
vencido, reutilizado o invalido no modifica la cuenta. La aprobacion manual desde el
Table Editor sigue disponible como respaldo.

Importante: `SUPABASE_SERVICE_ROLE_KEY` debe configurarse en Netlify como variable
secreta. No debe agregarse a `.env`, no debe usar el prefijo `VITE_` y nunca debe
subirse a GitHub.

Para avisar sobre usuarios confirmados antes de instalar esta migracion, configura
primero el webhook y luego ejecuta una insercion manual en
`public.access_approval_notifications` por cada cuenta pendiente que quieras notificar.

## Build de produccion

```bash
npm run build
```

La carpeta generada para publicar es:

```text
dist/
```

## Previsualizar build

```bash
npm run preview
```

## Despliegue actual en Vercel

El proyecto utiliza la integración GitHub–Vercel. El build genera `dist/` y las funciones se encuentran en `api/`.

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para el cliente. Las claves `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y cualquier secreto de correo pertenecen solo al servidor, nunca al prefijo `VITE_`. `GEMINI_MODEL` permite seleccionar el modelo; el valor por defecto del servidor es `gemini-2.5-flash`.

Publicar únicamente `dist/` en un hosting estático no instala las funciones ni configura Supabase. La comprobación de una versión debe incluir autenticación, respuestas y persistencia con una cuenta autorizada.

## Integración alternativa existente en Netlify

Opcion recomendada desde GitHub:

1. Sube el proyecto a un repositorio de GitHub.
2. En Netlify, elige **Add new site** y conecta el repositorio.
3. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Publica el sitio.

Opcion manual:

1. Ejecuta `npm run build`.
2. Sube la carpeta `dist/` a Netlify Drop.

Nota: Netlify Drop publica solo el frontend. La notificacion por correo requiere un
despliegue conectado a Git o mediante Netlify CLI para incluir la Function.

## Dependencias

El proyecto utiliza:

- React y React DOM para la interfaz.
- Vite para desarrollo/build.
- lucide-react para iconos de interfaz.
- Supabase JS para autenticación y persistencia.

## Limites eticos

- Todos los casos y respuestas son ficticios.
- No se deben ingresar datos reales ni sensibles.
- El sistema no diagnostica, no trata y no interviene clinicamente.
- La retroalimentacion es educativa y debe complementarse con supervision docente.
- No reemplaza atencion psicologica real.
