import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
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
const tables = { user_profiles: [{ ...auth.user, approved: true }], simulation_sessions: [], simulation_appointments: [] };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = {
  scrollY: 0, addEventListener() {}, removeEventListener() {}, scrollTo() {},
  requestAnimationFrame: (fn) => fn(),
  setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
  clearTimeout(id) { timers.delete(id); }, setInterval() { return 0; }, clearInterval() {}
};
globalThis.document = { documentElement: { scrollTop: 0 }, body: { scrollTop: 0 } };
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
      maybeSingle() { single = true; return this; },
      upsert(row) { payload = row; return this; },
      then(yes, no) {
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
  assert.equal(ui.root.findByType(s.AuthenticatedLayout).props.currentScreen, 'home');
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
  await act(async () => { await assert.rejects(chat().props.onAsk('¿Qué te trae por acá?'), /offline/); });
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
  await act(async () => { button('1. Registrar cierre').props.onClick(); });
  assert.equal(justification().props.value, rationale, 'consultar feedback conserva el cierre sin remontarlo');
  await act(async () => { await ui.root.findByType(s.AuthenticatedLayout).props.onNavigate('home'); });
  assert.ok(button('Salir y dejar pendiente'));
  await act(async () => { await button('Salir y dejar pendiente').props.onClick(); });
  assert.equal(tables.simulation_sessions[0].status, 'closure_pending');
  assert.equal(tables.simulation_sessions[0].feedback.preSessionPlan.evaluationObjective, preparationObjective, 'retomar conserva la preparación original');
  assert.equal(tables.simulation_sessions[0].feedback.clinicalDecision.justification, rationale, 'salir pendiente incluye los campos actuales en la nube');
  cache.clear(); // simulate another device, with no local draft available
  await act(async () => { await home().props.onStartSession('claudio', 1); });
  assert.equal(justification().props.value, rationale, 'el cierre pendiente se recupera desde el registro remoto');
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
  s.saveSessionSummary({ caseId: 'claudio', sessionNumber: 1, simulatedDate: new Date().toISOString(), clinicalDecision: { action: 'close_or_refer', proposedSessions: 4 } }, auth.user.id);
  assert.equal(s.buildClinicalAgendaItem(caseItem).nextSessionNumber, null, 'cerrar antes de la cuarta sesión no propone otra entrevista');
  await act(async () => { ui.unmount(); });
  console.log('PASS: flujo de preparación, envío, guardado fallido, salida, reanudación, cierre pendiente, cambio de dispositivo y cierre definitivo.');
} finally {
  if (ui) await act(async () => { ui.unmount(); });
  await rm(temp, { recursive: true, force: true });
}
