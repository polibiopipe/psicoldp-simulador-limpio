import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Real App, screens, persistence and routing; only remote services are simulated.
const temp = await mkdtemp(resolve('.audit-flow-'));
const cache = new Map();
const timers = new Map();
let timerId = 0;
let ui;
let writeFailure = false;
let appointmentFailure = false;
let responseResolve;
let responseCalls = 0;
const auth = { user: { id: 'flow-student', email: 'student@example.test' } };
const accessDocument = { ...JSON.parse(await readFile(new URL('../docs/access-consent-1.0.json', import.meta.url), 'utf8')), is_current: true };
let practiceReads = 0;
let accessWrites = 0;
const tables = { simulator_access: [{ user_id: auth.user.id, simulator_id: 'escucha-viva', enabled: true }], simulation_access_documents: [accessDocument], simulation_access_consents: [], user_profiles: [{ ...auth.user, approved: true }], simulation_sessions: [], simulation_appointments: [] };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = {
  location: { search: '?piloto=claudio' },
  scrollY: 0, addEventListener() {}, removeEventListener() {}, scrollTo() {},
  requestAnimationFrame: (fn) => fn(),
  setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
  clearTimeout(id) { timers.delete(id); }, setInterval() { return 0; }, clearInterval() {}
};
globalThis.document = { documentElement: { scrollTop: 0 }, body: { scrollTop: 0 }, addEventListener() {}, removeEventListener() {} };
globalThis.localStorage = { getItem: (key) => cache.get(key) || null, setItem: (key, value) => cache.set(key, value), removeItem: (key) => cache.delete(key) };
globalThis.__flowResponse = () => { responseCalls++; return new Promise((resolve) => { responseResolve = resolve; }); };
globalThis.__flowSupabase = {
  auth: {
    getSession: async () => ({ data: { session: auth }, error: null }),
    getUser: async () => ({ data: { user: auth.user }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null })
  },
  rpc: async (name, { p_record }) => {
    assert.equal(name, 'save_simulation_session_closure');
    if (writeFailure) return { data: null, error: { message: 'offline' } };
    tables.simulation_sessions = [p_record, ...tables.simulation_sessions.filter((r) => r.id !== p_record.id)];
    const appointment = tables.simulation_appointments.find((r) => r.id === p_record.appointment_id);
    if (appointment) appointment.status = p_record.status;
    return { data: [p_record], error: null };
  },
  from(table) {
    let payload;
    let single = false;
    let max = Infinity;
    const filters = [];
    return {
      select() { return this; }, order() { return this; },
      eq(key, value) { filters.push((r) => r[key] === value); return this; },
      in(key, values) { filters.push((r) => values.includes(r[key])); return this; },
      limit(n) { max = n; return this; },
      maybeSingle() { single = true; return this; }, single() { single = true; return this; },
      insert(row) { payload = { ...row, id: 'access-receipt', created_at: new Date().toISOString(), document_snapshot: accessDocument }; accessWrites++; return this; },
      upsert(row) { payload = row; return this; },
      then(yes, no) {
        if (["simulation_sessions", "simulation_appointments"].includes(table) && !payload) practiceReads++;
        if (payload && (writeFailure || (appointmentFailure && table === 'simulation_appointments'))) {
          return Promise.resolve({ data: null, error: { message: 'offline' } }).then(yes, no);
        }
        if (payload) tables[table] = [payload, ...(tables[table] || []).filter((r) => r.id !== payload.id)];
        const rows = payload ? [payload] : (tables[table] || []).filter((r) => filters.every((fn) => fn(r))).slice(0, max);
        return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(yes, no);
      }
    };
  }
};

const flush = () => new Promise((resolve) => setImmediate(resolve));
const buttonText = (node) => node.children.filter((c) => typeof c === 'string' || typeof c === 'number').join('');
const button = (text) => ui.root.findAllByType('button').find((b) => buttonText(b).includes(text));
try {
  const outfile = join(temp, 'app.mjs');
  await build({ stdin: { contents: `export { default as App } from './src/App.jsx';
    export { ClinicalDashboard } from './src/components/ClinicalDashboard.jsx';
    export { AuthenticatedLayout } from './src/components/AuthenticatedLayout.jsx';
    export { CaseBrief } from './src/components/CaseBrief.jsx';
    export { SimulationChat } from './src/components/SimulationChat.jsx';
    export { SessionClosure } from './src/components/SessionClosure.jsx';
    export { SessionResults } from './src/components/SessionResults.jsx';
    export { FeedbackMediation } from './src/components/FeedbackMediation.jsx';
    export { cases } from './src/data/cases.js'; export { buildClinicalAgendaItem } from './src/engine/clinicalAgenda.js'; export { saveSessionSummary } from './src/engine/sessionMemory.js';`, resolveDir: process.cwd() },
    outfile, bundle: true, platform: 'node', format: 'esm', define: { 'import.meta.env': '{}' }, external: ['react', 'react-dom', 'lucide-react'],
    plugins: [{ name: 'remote-boundaries', setup(b) {
      b.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: 'supabase', namespace: 'test' }));
      b.onResolve({ filter: /utils\/responseEngine\.js$/ }, () => ({ path: 'response', namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents: path === 'supabase'
        ? 'export const supabaseConfigStatus={}; export const isSupabaseConfigured=true; export const isAccessGateRequired=true; export const supabase=globalThis.__flowSupabase;'
        : 'export const createPatientResponse=(...args)=>globalThis.__flowResponse(...args);' }));
    } }]
  });
  const s = await import(pathToFileURL(outfile));
  await act(async () => { ui = TestRenderer.create(React.createElement(s.App)); await flush(); });
  assert.equal(ui.root.findAllByType(s.AuthenticatedLayout).length, 0, 'the workspace stays unmounted until affirmative acceptance');
  assert.equal(practiceReads, 0, 'practice history must not load behind the gate');
  assert.equal(accessWrites, 0, 'login alone does not imply acceptance');
  assert.equal(ui.root.findAllByType('input').length, 3, 'the assigned account reaches all three consent declarations');
  assert.ok(ui.root.findAllByType('input').every((n) => n.props.checked === false));
  const submitConsent = () => ui.root.findByType('form').props.onSubmit({ preventDefault() {} });
  await act(async () => { await submitConsent(); });
  assert.equal(accessWrites, 0, 'empty acceptance cannot be submitted');
  for (const index of [0, 1, 2]) await act(async () => { ui.root.findAllByType('input')[index].props.onChange({ target: { checked: true } }); });
  writeFailure = true;
  await act(async () => { await submitConsent(); });
  assert.equal(ui.root.findAllByType(s.AuthenticatedLayout).length, 0, 'a failed database write does not admit the user');
  assert.match(JSON.stringify(ui.toJSON()), /No se confirmó tu aceptación/);
  writeFailure = false;
  await act(async () => { await Promise.all([submitConsent(), submitConsent()]); await flush(); });
  assert.equal(accessWrites, 2, 'one failed attempt plus one successful write; double clicks do not duplicate');
  assert.equal(tables.simulation_research_consent_events, undefined, 'mandatory entry does not consent to research');
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'home');
  await act(async () => { ui.unmount(); ui = TestRenderer.create(React.createElement(s.App)); await flush(); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'home', 'confirmed acceptance persists across reloads');
  assert.equal(button('Progreso'), undefined, 'no existe una ruta duplicada con otro nombre');
  const home = () => ui.root.findByType(s.ClinicalDashboard);
  await act(async () => { await home().props.onStartSession('claudio', 1); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'brief', 'una sesión nueva de agenda pasa por preparación');
  const preparationObjective = 'Comprender la postergación y sus efectos cotidianos.';
  await act(async () => { const brief = ui.root.findByType(s.CaseBrief); brief.props.onPreSessionPlanChange({ ...brief.props.preSessionPlan, evaluationObjective: preparationObjective }); });
  await act(async () => { await ui.root.findByType(s.CaseBrief).props.onBegin({}); });
  const chat = () => ui.root.findByType(s.SimulationChat);
  assert.equal(chat().props.history.length, 0);
  assert.equal(button('Reiniciar'), undefined, 'no hay reinicio que abandone una sesión abierta');
  assert.doesNotMatch(JSON.stringify(ui.toJSON()), /Progreso formativo|Progreso de sesión 100/);

  // An appointment activation rejected by the server must never reach the patient service.
  appointmentFailure = true;
  await act(async () => { await assert.rejects(chat().props.onAsk('¿Qué te trae por acá?'), /No se pudo preparar la cita/); });
  assert.equal(responseCalls, 0);
  appointmentFailure = false;
  // Drive the real composer, including its delayed request and double-click protection.
  await act(async () => { ui.root.findByProps({ id: 'student-question' }).props.onChange({ target: { value: '¿Qué te trae por acá?' } }); });
  await act(async () => { ui.root.findByType('form').props.onSubmit({ preventDefault() {} }); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.navigationBusy, true);
  assert.equal(button('Ir al cierre').props.disabled, true);
  await act(async () => {
    await chat().props.onFinish();
    await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home');
  });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'simulation');
  const request = [...timers.values()].find((t) => t.ms === 520);
  assert.ok(request);
  let responseTask;
  await act(async () => { responseTask = request.fn(); await flush(); });
  assert.equal(responseCalls, 1);
  await act(async () => { responseResolve({ text: 'Me cuesta decidir y termino postergando.', analysis: {}, responseCategory: 'motivo_consulta' }); await responseTask; await flush(); });
  assert.equal(chat().props.history.length, 1);
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.navigationBusy, false);
  const sessionId = tables.simulation_sessions[0].id;
  const originalStartedAt = tables.simulation_appointments[0].started_at;

  // Pause fails closed when storage is unavailable, and resumes the same record on retry.
  writeFailure = true;
  await act(async () => { await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home'); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'simulation');
  writeFailure = false;
  await act(async () => { await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home'); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'home');
  const metrics = ui.root.findAll((n) => n.props.className === 'dashboard-metric-card');
  assert.equal(metrics[0].findByType('strong').children[0], '1', 'un paciente con cita y borrador cuenta una sola vez');
  assert.equal(metrics[1].findByType('strong').children[0], '1', 'la misma sesión no aparece duplicada');
  await act(async () => { await home().props.onStartSession('claudio', 1); });
  assert.equal(chat().props.history.length, 1);
  assert.equal(tables.simulation_appointments[0].started_at, originalStartedAt, 'retomar no reinicia el reloj');
  await act(async () => { await chat().props.onFinish(); });
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'results');
  assert.ok(ui.root.findByType(s.SessionResults));
  const justification = () => ui.root.findAllByType('textarea').find((t) => t.props.placeholder?.includes('motivo aun'));
  const rationale = 'Falta delimitar el motivo y conocer sus apoyos cotidianos.';
  await act(async () => { justification().props.onChange({ target: { value: rationale } }); });
  await act(async () => { button('2. Revisar retroalimentación').props.onClick(); });
  const practice = { turnIndex: 1, quote: '¿Qué te trae por acá?', reflection: 'Buscaba conocer qué le preocupa. La respuesta menciona postergación.', rewrite: '¿En qué momento de esta semana te costó decidir?', result: null };
  await act(async () => { ui.root.findByType(s.FeedbackMediation).props.onDraftChange(practice); });
  await act(async () => { button('1. Registrar cierre').props.onClick(); });
  assert.equal(justification().props.value, rationale, 'consultar feedback conserva el cierre sin remontarlo');
  await act(async () => { await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home'); });
  assert.ok(button('Salir y dejar pendiente'));
  await act(async () => { await button('Salir y dejar pendiente').props.onClick(); });
  assert.equal(tables.simulation_sessions[0].status, 'closure_pending');
  assert.equal(tables.simulation_sessions[0].feedback.preSessionPlan.evaluationObjective, preparationObjective, 'retomar conserva la preparación original');
  assert.equal(tables.simulation_sessions[0].feedback.clinicalDecision.justification, rationale, 'salir pendiente incluye los campos actuales en la nube');
  assert.deepEqual(tables.simulation_sessions[0].feedback.feedbackPractice, practice, 'la reflexión se guarda con el cierre, separada de la entrevista');
  assert.equal(tables.simulation_sessions[0].score, null, 'la apertura del avatar no se guarda como nota del estudiante');
  cache.clear(); // simulate another device, with no local draft available
  await act(async () => { await home().props.onStartSession('claudio', 1); });
  assert.equal(justification().props.value, rationale, 'el cierre pendiente se recupera desde el registro remoto');
  assert.deepEqual(ui.root.findByType(s.FeedbackMediation).props.initialPractice, practice, 'el ejercicio se recupera al cambiar de dispositivo');
  assert.equal(ui.root.findByType(s.SessionResults).props.history.length, 1, 'la reflexión no agrega intervenciones al paciente');
  await act(async () => { await button('Registrar continuidad').props.onClick(); });
  assert.equal(tables.simulation_sessions[0].status, 'completed');
  assert.equal(tables.simulation_sessions[0].id, sessionId, 'se cierra la misma sesión que se inició');
  assert.equal(tables.simulation_sessions.length, 1);
  assert.ok(button('Agendar sesión'), 'la acción dice que abre la agenda');
  assert.equal(button('Iniciar sesión 2 ahora'), undefined);
  await act(async () => { justification().props.onChange({ target: { value: rationale + ' Ajusto el foco de seguimiento.' } }); });
  await act(async () => { await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home'); });
  assert.ok(button('Guardar cambios y salir'));
  await act(async () => { await button('Guardar cambios y salir').props.onClick(); });
  assert.equal(tables.simulation_sessions[0].status, 'completed', 'editar y salir no hace retroceder un cierre completado');
  assert.equal(tables.simulation_sessions[0].id, sessionId);
  const caseItem = s.cases.find((c) => c.id === 'claudio');
  await act(async () => { await button('Preparar piloto con Claudio').props.onClick(); });
  assert.equal(ui.root.findByType(s.CaseBrief).props.sessionNumber, 2, 'el piloto respeta el avance y no intenta repetir la sesión 1 completada');
  assert.equal(tables.simulation_appointments.length, 1, 'preparar el piloto no duplica citas');
  await act(async () => { await ui.root.findByType(s.CaseBrief).props.onBegin({}); await flush(); });
  const portrait = () => ui.root.findByProps({ className: 'claudio-pilot-portrait' });
  assert.equal(portrait().props.src, caseItem.image, 'el piloto muestra el retrato canónico de Claudio');
  await act(async () => { button('Activar conversación por voz').props.onClick(); });
  assert.equal(portrait().props.src, caseItem.image, 'activar voz no sustituye la identidad visual');
  assert.equal(ui.root.findAllByType('canvas').length, 0, 'no se monta un modelo 3D ajeno');
  await act(async () => { ui.unmount(); });
  tables.simulation_sessions = [];
  cache.clear();
  await act(async () => { ui = TestRenderer.create(React.createElement(s.App)); await flush(); });
  await act(async () => { await button('Preparar piloto con Claudio').props.onClick(); });
  assert.equal(ui.root.findByType(s.CaseBrief).props.sessionNumber, 2, 'una cita completada sin resumen también impide repetir la sesión 1');
  assert.equal(tables.simulation_appointments.length, 1, 'la recuperación no altera la cita histórica');
  s.saveSessionSummary({ caseId: 'claudio', sessionNumber: 1, simulatedDate: new Date().toISOString(), clinicalDecision: { action: 'close_or_refer', proposedSessions: 4 } }, auth.user.id);
  assert.equal(s.buildClinicalAgendaItem(caseItem).nextSessionNumber, null, 'cerrar antes de la cuarta sesión no propone otra entrevista');
  await act(async () => { ui.unmount(); });
  accessDocument.version = '2.0';
  await act(async () => { ui = TestRenderer.create(React.createElement(s.App)); await flush(); });
  assert.equal(ui.root.findAllByType(s.AuthenticatedLayout).length, 0, 'a new version requires a new explicit acceptance');
  assert.ok(ui.root.findAllByType('input').every((n) => n.props.checked === false));
  accessDocument.version = '1.0';
  await act(async () => { ui.unmount(); auth.user = { id: 'second-student', email: 'second@example.invalid' }; tables.user_profiles.push({ ...auth.user, approved: true }); tables.simulator_access.push({ user_id: auth.user.id, simulator_id: 'escucha-viva', enabled: true }); ui = TestRenderer.create(React.createElement(s.App)); await flush(); });
  assert.equal(ui.root.findAllByType(s.AuthenticatedLayout).length, 0, 'one account cannot reuse another account acceptance');
  assert.equal(ui.root.findAllByType('input').length, 3, 'la segunda cuenta también llega al consentimiento pendiente');
  console.log('PASS: mandatory gate, unchecked declarations, failed writes, double clicks, account/version isolation and flujo de preparación, envío, guardado fallido, salida, reanudación, cierre pendiente, cambio de dispositivo y cierre definitivo.');
} finally {
  if (ui) await act(async () => { ui.unmount(); });
  await rm(temp, { recursive: true, force: true });
}
