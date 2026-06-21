# Escucha Viva · Simuladores formativos

Escucha Viva es una plataforma de simuladores formativos, iniciativa de Nucleo Vivo. Su modulo Entrevista Psicologica Formativa permite practicar un proceso de cuatro sesiones con pacientes virtuales ficticios y recibir retroalimentacion orientada al aprendizaje.

Este simulador tiene fines exclusivamente educativos. No reemplaza atencion psicologica real, no realiza diagnosticos definitivos, no entrega tratamiento clinico y no debe usarse con datos reales de pacientes.

## Version 2

La V2 amplia el prototipo inicial con:

- Cinco casos ficticios: Tomas, Valentina, Marcos, Elena y Nicolas.
- Selector de caso y selector de dificultad.
- Motor de respuestas por reglas con memoria basica de la conversacion.
- Perfiles narrativos profundos para cada paciente ficticio.
- Calculo local de confianza/apertura del paciente de 0 a 100.
- Deteccion de encuadre, preguntas abiertas/cerradas, validacion, juicios, consejos apresurados, exploracion contextual y cierre.
- Pacientes ficticios con estilos comunicacionales diferenciados.
- Barra de progreso, contador de turnos y reinicio de simulacion.
- Retroalimentacion educativa con niveles de logro:
  - Logrado.
  - Parcialmente logrado.
  - Requiere mejorar.
  - No observado.
- Resultados compartibles por correo usando `mailto:`.
- Copia de resultados al portapapeles.
- Descarga de resultados en `.txt`.
- Interfaz responsiva para computador y celular.

## Estructura

```text
src/
  App.jsx
  main.jsx
  styles.css
  data/
    cases.js
    caseFacts.js
    patientProfiles.js
    rubrics.js
    responseEngine.js
    responseBank.js
    responseProfiles.js
  engine/
    analyzeIntent.js
    conversationState.js
    responsePlanner.js
    responseGenerator.js
    mockAiEngine.js
  components/
    Home.jsx
    CaseSelector.jsx
    CaseBrief.jsx
    SimulationChat.jsx
    PatientCard.jsx
    FeedbackPanel.jsx
    ResultsSummary.jsx
    EmailShare.jsx
    ProgressBar.jsx
    EthicalNotice.jsx
  utils/
    scoring.js
    textUtils.js
    analyzeStudentInput.js
    responseEngine.js
    conversationAnalysis.js
    exportResults.js
```

## Motor de respuestas local

El motor no usa IA externa, Firebase ni Supabase. La version actual funciona como una pseudo API local:

```text
mensaje del estudiante
  -> analyzeIntent.js
  -> patientProfiles.js + caseFacts.js
  -> conversationState.js
  -> responsePlanner.js
  -> responseGenerator.js
  -> mockAiEngine.js
```

`src/engine/mockAiEngine.js` expone:

```js
generatePatientResponse({
  caseId,
  studentMessage,
  conversationHistory,
  conversationState,
  difficulty
});
```

Devuelve `responseText`, `detectedIntent`, `directAnswer`, `emotionalTone`, `opennessLevel` y `updatedState`. Esta forma permite reemplazar mas adelante la generacion local por una API real sin redisenar los componentes.

El motor funciona con reglas locales editables:

1. `src/data/patientProfiles.js` define el prompt interno de cada paciente: identidad, motivo explicito, preocupacion oculta, forma de hablar, temas que lo abren o cierran y limites eticos.
2. `src/data/caseFacts.js` contiene datos concretos para responder nombre, edad, estudios, trabajo, vivienda, familia, pares, videojuegos y motivo de consulta.
3. `src/engine/analyzeIntent.js` clasifica el mensaje con prioridad: saludo, nombre, edad, motivo de consulta, preguntas concretas y luego exploraciones mas amplias.
4. `src/engine/conversationState.js` registra turnos, temas explorados, validacion, juicios, consejos apresurados, respuestas usadas y nivel de apertura.
5. `src/engine/responsePlanner.js` decide la estructura `respuesta directa + ampliacion contextual + matiz emocional`.
6. `src/engine/responseGenerator.js` compone la respuesta final segun apertura baja, media o alta.
7. `src/utils/responseEngine.js` queda como adaptador compatible con React.
8. `src/utils/scoring.js` usa los patrones de la conversacion para generar retroalimentacion formativa.

### Ejemplos de prueba del motor

Pregunta:

```text
Tomas, que lugar tienen los videojuegos para ti cuando te sientes solo?
```

Respuesta esperada en tono:

```text
No se si es soledad exactamente... pero cuando juego no tengo que estar pensando si caigo bien o mal. Ahi se que hacer. Afuera me cuesta mas, como que todo se siente mas incomodo.
```

Pregunta:

```text
Valentina, que pasa cuando intentas descansar?
```

Respuesta esperada en tono:

```text
Me cuesta. Puedo estar acostada, pero mi cabeza sigue haciendo listas. Y si descanso mucho rato, aparece esa sensacion de que estoy perdiendo tiempo o que deberia estar avanzando en algo.
```

Pregunta:

```text
Marcos, como llegas a tu casa despues del trabajo?
```

Respuesta esperada en tono:

```text
Llego apagado. A veces mi pareja me habla y yo respondo corto, no porque no me importe, sino porque siento que ya no me queda paciencia. Despues me da culpa, pero en el momento solo quiero silencio.
```

## Requisitos

- Node.js 20 o superior recomendado.
- npm.

## Instalacion

```bash
npm install
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

Antes de desplegar esta version, ejecuta el archivo
`supabase/simulation_sessions.sql` completo en Supabase SQL Editor. El script:

- crea perfiles pendientes automaticamente al registrar usuarios;
- protege la lectura del perfil con RLS;
- impide que un estudiante apruebe su propia cuenta;
- restringe `simulation_sessions` a usuarios con `approved = true`.

Para habilitar una cuenta, abre `public.user_profiles` en Supabase Table Editor y
cambia `approved` a `true`. `approved_at` se completa automaticamente. Los usuarios
existentes quedan pendientes al ejecutar la migracion y deben aprobarse manualmente.

### Aviso por correo de nuevas solicitudes

El aviso se envia desde una Netlify Function; ninguna clave privada se expone en el
navegador y la aprobacion sigue siendo manual desde Supabase.

1. Ejecuta `supabase/access_request_notifications.sql` en Supabase SQL Editor.
2. En Netlify configura estas variables de entorno solo para Functions:
   - `ACCESS_REQUEST_WEBHOOK_SECRET`: secreto largo y aleatorio.
   - `RESEND_API_KEY`: clave del proveedor de correo Resend.
   - `ACCESS_REQUEST_FROM_EMAIL`: remitente de un dominio verificado en Resend.
   - `ACCESS_REQUEST_TO_EMAIL`: `contacto@nucleovivo.net`.
   - `SUPABASE_USER_PROFILES_URL`: enlace HTTPS al Table Editor de `user_profiles`.
3. Despliega el sitio desde Git para publicar
   `netlify/functions/new-access-request.mjs`.
4. En **Supabase > Database > Webhooks**, crea un webhook para el evento `INSERT`
   de `public.access_approval_notifications` con:
   - URL: `https://TU-SITIO.netlify.app/.netlify/functions/new-access-request`.
   - Header: `x-escucha-viva-webhook-secret` con el mismo secreto de Netlify.

La cola se crea solamente cuando el correo pasa a confirmado. Su restriccion unica
por `user_id` evita generar mas de una solicitud por cuenta. El correo incluye un
enlace al Table Editor si `SUPABASE_USER_PROFILES_URL` esta configurado, pero no
aprueba al usuario por si solo.

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

## Despliegue en Netlify

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

No se agregaron dependencias nuevas en la V2. El proyecto mantiene:

- React y React DOM para la interfaz.
- Vite para desarrollo/build.
- lucide-react para iconos de interfaz.

## Limites eticos

- Todos los casos y respuestas son ficticios.
- No se deben ingresar datos reales ni sensibles.
- El sistema no diagnostica, no trata y no interviene clinicamente.
- La retroalimentacion es educativa y debe complementarse con supervision docente.
- No reemplaza atencion psicologica real.
