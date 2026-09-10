import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const temp = await mkdtemp(resolve('.audit-persistence-'));
const cache = new Map();
let userId = 'owner-a';
let failure = null;
let incomplete = false;
let rows = [];
let calls = [];
let holdWrite = null;
let availabilityRows = [];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { scrollY: 0, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout };
globalThis.document = { documentElement: { scrollTop: 0 }, body: { scrollTop: 0 } };
globalThis.localStorage = { getItem: (key) => cache.get(key) || null, setItem: (key, value) => cache.set(key, value), removeItem: (key) => cache.delete(key) };
async function answer(operation, payload, filters = []) {
  calls.push({ operation, payload, filters });
  if (operation === 'save' && holdWrite) await holdWrite;
  if (failure instanceof Error) throw failure;
  if (failure) return { data: null, error: failure };
  if (incomplete) return { data: null, error: null };
  if (operation === 'save' || operation === 'closure') {
    rows = [payload, ...rows.filter((row) => row.id !== payload.id)];
    return { data: [payload], error: null };
  }
  const matching = rows.filter((row) => filters.every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value));
  if (operation === 'delete') rows = rows.filter((row) => !matching.includes(row));
  return { data: matching, error: null };
}
globalThis.__persistenceSupabase = {
  auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
  rpc: async (name, args) => {
    if (name === 'save_simulation_session_closure') return answer('closure', args.p_record);
    assert.equal(name, 'replace_simulation_student_availability');
    calls.push({ operation: 'availability', payload: args.p_blocks });
    if (failure) return { data: null, error: failure };
    availabilityRows = args.p_blocks;
    return { data: availabilityRows, error: null };
  },
  from: () => {
    let operation = 'read';
    let payload;
    const filters = [];
    return {
      select() { return this; },
      eq(key, value) { filters.push([key, value]); return this; },
      in(key, value) { filters.push([key, value]); return this; },
      order() { return this; }, limit() { return this; },
      delete() { operation = 'delete'; return this; },
      upsert(value) { operation = 'save'; payload = value; return this; },
      then(resolve, reject) { return answer(operation, payload, filters).then(resolve, reject); }
    };
  }
};
let ui;
try {
  const outfile = join(temp, 'system.mjs');
  await build({ stdin: { contents: `export * from './src/engine/sessionHistory.js'; export * from './src/engine/sessionMemory.js'; export * from './src/engine/clinicalStorage.js'; export * from './src/engine/clinicalAgenda.js'; export { AvailabilityEditor } from './src/components/ClinicalAgenda.jsx'; export { SessionClosure } from './src/components/SessionClosure.jsx'; export { cases } from './src/data/cases.js'; export { buildEducationalReport } from './src/utils/scoring.js'; export { SavedSessions } from './src/components/SavedSessions.jsx';`, resolveDir: process.cwd() }, outfile, bundle: true, platform: 'node', format: 'esm', external: ['react', 'react-dom', 'lucide-react'], plugins: [{ name: 'supabase-boundary', setup(b) {
    b.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: 'supabase', namespace: 'test' }));
    b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const isSupabaseConfigured=true; export const supabase=globalThis.__persistenceSupabase;' }));
  } }] });
  const s = await import(pathToFileURL(outfile));
  s.setClinicalStorageOwner(userId);
  const auth = { user: { id: userId } };
  const record = { id: 'session-1', caseId: 'claudio', caseName: 'Claudio', sessionNumber: 1, conversationHistory: [{ question: 'hola', answer: 'hola' }], feedback: {}, status: 'in_progress', createdAt: new Date().toISOString() };
  assert.equal((await s.saveSessionHistory(record, { userId })).cloudSaved, true);
  s.setClinicalStorageOwner('owner-b');
  assert.deepEqual(s.getSessionHistory(), [], 'un segundo usuario no recibe la caché del primero');
  s.setClinicalStorageOwner(userId);
  assert.equal(s.getSessionHistory().length, 1);
  failure = new Error('offline');
  await assert.rejects(s.getSessionHistoryForUser(auth));
  await assert.rejects(s.getLatestInProgressSessionForCase(auth, 'claudio'));
  await assert.rejects(s.deleteSessionHistory(record.id, auth));
  await assert.rejects(s.clearAllSessionHistory(auth));
  assert.equal(s.getSessionHistory().length, 1, 'una eliminación fallida conserva el historial');
  assert.equal(s.isSessionSaveConfirmed(await s.saveSessionHistory(record, { userId })), false);
  failure = null; incomplete = true;
  assert.equal((await s.saveSessionHistory(record, { userId })).cloudSaved, false);
  await assert.rejects(s.getSessionHistoryForUser(auth));
  incomplete = false;
  globalThis.localStorage.setItem = () => { throw new Error('quota'); };
  const quotaResult = await s.saveSessionHistory(record, { userId });
  assert.equal(quotaResult.cloudSaved, true);
  assert.equal(quotaResult.localSaved, false);
  userId = 'owner-b';
  assert.equal((await s.saveSessionHistory(record, { userId: 'owner-a' })).cloudSaved, false, 'una cuenta distinta no adopta un guardado pendiente');
  userId = 'owner-a';
  globalThis.localStorage.setItem = (key, value) => cache.set(key, value);
  let release;
  holdWrite = new Promise((resolve) => { release = resolve; });
  calls = [];
  const progress = s.saveSessionHistory(record, { userId });
  const closure = s.saveSessionHistory({ ...record, status: 'completed' }, { userId });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.map((call) => call.operation), ['save']);
  release();
  await Promise.all([progress, closure]);
  holdWrite = null;
  assert.deepEqual(calls.map((call) => call.operation), ['save', 'closure']);
  assert.equal(rows[0].status, 'completed', 'el cierre queda después del autoguardado lento');
  assert.equal((await s.getSessionHistoryForUser(auth))[0].status, 'completed');
  assert.ok(calls.at(-1).filters.some(([key, value]) => key === 'user_id' && value === userId));
  s.syncSessionSummariesFromHistory([{ ...record, status: 'completed', sessionSummary: { sessionNumber: 1, simulatedDate: record.createdAt } }], userId);
  assert.equal(s.getSessionSummariesForCase('claudio').length, 1, 'recupera continuidad desde la nube');
  s.setClinicalStorageOwner('owner-b');
  assert.deepEqual(s.getSessionSummariesForCase('claudio'), []);
  s.setClinicalStorageOwner(userId);

  let authoritative = s.getEmptyWeeklyAvailability();
  let dirty = false;
  function EditorHarness() {
    const [saved, setSaved] = React.useState(authoritative);
    return React.createElement(s.AvailabilityEditor, { availability: saved, status: { configured: s.hasConfiguredAvailability(saved) }, onDirtyChange: (value) => { dirty = value; }, onChange: async (draft) => {
      const result = await s.saveStudentWeeklyAvailability(auth, draft);
      if (result.ok) { authoritative = result.availability; setSaved(result.availability); }
      return result;
    } });
  }
  await act(async () => { ui = TestRenderer.create(React.createElement(EditorHarness)); });
  const checkbox = () => ui.root.findAllByType('input').filter((input) => input.props.type === 'checkbox')[1];
  const saveButton = () => ui.root.findAllByType('button').find((button) => button.props.className?.includes('availability-save'));
  await act(async () => { checkbox().props.onChange({ target: { checked: true } }); });
  assert.equal(dirty, true);
  assert.equal(authoritative.tuesday.enabled, false, 'activar es un cambio pendiente, todavía no confirmado');
  await act(async () => { await saveButton().props.onClick(); });
  assert.equal(dirty, false);
  assert.equal(authoritative.tuesday.enabled, true);
  assert.deepEqual(availabilityRows, [{ day_of_week: 2, start_time: '09:00', end_time: '10:00' }]);
  assert.match(JSON.stringify(ui.toJSON()), /Disponibilidad guardada/);
  let endInput = ui.root.findAllByType('input').find((input) => input.props['aria-label']?.includes('término'));
  await act(async () => { endInput.props.onChange({ target: { value: '08:00' } }); });
  assert.equal(saveButton().props.disabled, true);
  const countBefore = calls.length;
  const invalid = await s.saveStudentWeeklyAvailability(auth, { tuesday: { enabled: true, blocks: [{ start: '09:00', end: '08:00' }] } });
  assert.equal(invalid.ok, false);
  assert.equal(calls.length, countBefore, 'un borrador inválido nunca invoca el reemplazo que borraría horarios');
  assert.equal(authoritative.tuesday.blocks[0].end, '10:00');
  await act(async () => { ui.unmount(); });

  // The actual history screen offers retry instead of presenting an empty history.
  failure = new Error('offline');
  await act(async () => { ui = TestRenderer.create(React.createElement(s.SavedSessions, { authSession: auth, onBackHome() {} })); });
  assert.match(JSON.stringify(ui.toJSON()), /Reintentar carga de historial/);
  assert.doesNotMatch(JSON.stringify(ui.toJSON()), /Aun no hay sesiones guardadas/);
  failure = null;
  await act(async () => { await ui.root.findAllByType('button').find((b) => b.children.includes('Reintentar carga de historial')).props.onClick(); });
  assert.match(JSON.stringify(ui.toJSON()), /Claudio/);
  await act(async () => { ui.unmount(); });
  const caseItem = s.cases.find((item) => item.id === 'claudio');
  const conversation = [{ id: 'turn-1', question: '¿Qué te trae por acá?', answer: 'Me cuesta decidir y termino postergando.', responseCategory: 'motivo_consulta' }];
  const report = s.buildEducationalReport(conversation, caseItem);
  const prelude = { isSessionPrelude: true, answer: 'Prefiero no hablar de mi familia todavía.' };
  const withPrelude = s.buildSessionHistoryRecord({ id: 'with-prelude', caseItem, history: [prelude, ...conversation], report, sessionNumber: 2 });
  assert.deepEqual(s.restoreSessionConversation(withPrelude), [prelude, ...withPrelude.conversationHistory], 'recuperar conserva la apertura sin contarla como intervención');
  assert.equal(withPrelude.conversationHistory.length, 1);
  assert.equal(s.restoreSessionConversation({ ...withPrelude, conversationHistory: [prelude, ...withPrelude.conversationHistory] }).length, 2, 'no se duplica una apertura ya presente');
  let closureCalls = 0;
  let confirmed = false;
  let navigated = false;
  await act(async () => { ui = TestRenderer.create(React.createElement(s.SessionClosure, {
    caseItem, history: conversation, report, sessionNumber: 1, userId, sessionRecordId: 'stable-closure',
    onBackHome() { navigated = true; },
    onSaveSessionRecord: async () => { closureCalls += 1; return { cloudSaved: confirmed, error: confirmed ? null : 'offline' }; }
  })); });
  const closureButton = () => ui.root.findAllByType('button').find((button) => button.props.onClick?.name === 'saveContinuityAgreement' || button.props.onClick?.name === 'backHomeAfterSave');
  assert.ok(closureButton(), 'el cierre tiene una acción de guardado');
  await act(async () => { await closureButton().props.onClick(); });
  assert.equal(closureCalls, 0, 'una decisión sin fundamento no se registra como completa');
  assert.match(JSON.stringify(ui.toJSON()), /Fundamenta tu decisión/);
  await act(async () => { ui.root.findAllByType('textarea').find((t) => t.props.placeholder?.includes('motivo aun')).props.onChange({ target: { value: 'Falta comprender el motivo y explorar los apoyos cotidianos.' } }); });
  await act(async () => { await closureButton().props.onClick(); });
  assert.equal(closureCalls, 1);
  assert.equal(navigated, false, 'el cierre rechazado no navega');
  assert.match(JSON.stringify(ui.toJSON()), /El cierre no se ha confirmado/);
  confirmed = true;
  await act(async () => { await closureButton().props.onClick(); });
  assert.equal(closureCalls, 2, 'el reintento vuelve a persistir el mismo cierre');
  assert.match(JSON.stringify(ui.toJSON()), /Cambios guardados/);
  const textarea = ui.root.findAllByType('textarea')[0];
  await act(async () => { textarea.props.onChange({ target: { value: 'Ampliar el foco con la información compartida hoy.' } }); });
  await act(async () => { await closureButton().props.onClick(); });
  assert.equal(closureCalls, 3, 'editar un cierre guardado vuelve a requerir confirmación');
  await act(async () => { ui.unmount(); });
  console.log('PASS: aislamiento de cuentas, errores reales, confirmaciones, orden del autoguardado, continuidad y flujo visual de disponibilidad/historial.');
} finally {
  await rm(temp, { recursive: true, force: true });
  delete globalThis.__persistenceSupabase;
  delete globalThis.localStorage;
  delete globalThis.window;
  delete globalThis.document;
}
