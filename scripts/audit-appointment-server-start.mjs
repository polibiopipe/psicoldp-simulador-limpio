import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { getZonedDateKey } from '../src/engine/simulationUsagePolicy.js';

// Execute the real API with controlled authentication and persistence boundaries.
// The provider is unavailable; the real response path can use the local fallback.
const temp = await mkdtemp(resolve('.audit-server-start-'));
const env = Object.fromEntries(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'].map((key) => [key, process.env[key]]));
process.env.SUPABASE_URL = 'https://fixture.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-not-a-key';
process.env.GEMINI_API_KEY = '';
let appointment, writes, mutationAttempts, validAuth, approved, accepted, failedWrite, race, hasResponse, userRole;
const original = () => ({ id: 'appointment-1', user_id: 'owner', case_id: 'claudio', case_name: 'Claudio',
  session_number: 2, status: 'scheduled', started_at: null, ends_at: null,
  duration_minutes: 45, scheduled_local_date: getZonedDateKey(new Date()) });
function reset() {
  appointment = original(); writes = 0; mutationAttempts = 0; validAuth = true;
  approved = true; accepted = true; failedWrite = false; race = ''; hasResponse = true; userRole = 'student';
}
globalThis.__startApiLocal = () => ({ responseText: hasResponse ? 'Me ha costado salir de la rutina. Quisiera conversar sobre eso.' : '' });
globalThis.__startApiClient = {
  auth: { getUser: async () => ({ data: { user: validAuth ? { id: 'owner' } : null }, error: validAuth ? null : { message: 'invalid' } }) },
  from(table) {
    let payload;
    const filters = [];
    return {
      select() { return this; }, eq(key, value) { filters.push([key, value]); return this; },
      is(key, value) { filters.push([key, value]); return this; },
      update(value) { payload = value; return this; },
      async maybeSingle() {
        if (table === 'user_profiles') return { data: { id: 'owner', approved, role: userRole } };
        if (table === 'simulation_access_documents') return { data: { version: '1.0' } };
        if (table === 'simulation_access_consents') return { data: accepted ? { id: 'consent', user_id: 'owner', document_version: '1.0', adult_confirmed: true, educational_use_accepted: true, data_processing_accepted: true } : null };
        if (table === 'simulation_sessions') return { data: null };
        assert.equal(table, 'simulation_appointments');
        if (payload) {
          mutationAttempts++;
          assert.ok(filters.some(([k, v]) => k === 'user_id' && v === 'owner'));
          assert.ok(filters.some(([k, v]) => k === 'status' && v === 'scheduled'));
          assert.ok(filters.some(([k, v]) => k === 'started_at' && v === null));
          assert.deepEqual(Object.keys(payload).sort(), ['ends_at', 'started_at', 'status']);
          if (failedWrite) return { data: null, error: { message: 'database unavailable' } };
          if (race === 'start') {
            appointment = { ...appointment, status: 'in_progress', started_at: new Date(Date.now() - 60000).toISOString(), ends_at: new Date(Date.now() + 44 * 60000).toISOString() };
          } else if (race === 'cancel') appointment = { ...appointment, status: 'cancelled' };
        }
        if (!filters.every(([k, v]) => appointment[k] === v)) return { data: null };
        if (payload) { writes++; appointment = { ...appointment, ...payload }; }
        return { data: { ...appointment }, error: null };
      }
    };
  }
};
try {
  const outfile = join(temp, 'handler.mjs');
  await build({ entryPoints: ['api/gemini-patient-response.js'], outfile, bundle: true, platform: 'node', format: 'esm',
    plugins: [{ name: 'server-boundaries', setup(b) {
      b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'client', namespace: 'fixture' }));
      b.onResolve({ filter: /localMiniAI\.js$/ }, () => ({ path: 'local', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: path === 'client'
        ? 'export const createClient=()=>globalThis.__startApiClient;'
        : 'export const generateLocalPatientResponse=(...args)=>globalThis.__startApiLocal(...args);' }));
    } }] });
  const { default: handler } = await import(pathToFileURL(outfile));
  async function call(overrides = {}, headers = { authorization: 'Bearer fixture-token' }) {
    const res = { setHeader() {}, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; }, end(body) { this.body = body ? JSON.parse(body) : null; } };
    await handler({ method: 'POST', headers, body: { caseId: 'claudio', sessionNumber: 2, studentMessage: '¿Cómo te sientes hoy?', appointmentId: 'appointment-1', ...overrides } }, res);
    return res;
  }
  reset();
  let response = await call({ started_at: '2099-01-01', ends_at: '2099-02-01', userId: 'forged' });
  assert.equal(response.statusCode, 200);
  assert.equal(writes, 1);
  assert.equal(appointment.status, 'in_progress');
  assert.ok(Math.abs(Date.now() - Date.parse(appointment.started_at)) < 5000, 'clock comes from server time');
  assert.equal(Date.parse(appointment.ends_at) - Date.parse(appointment.started_at), 45 * 60000);
  assert.equal(response.body.appointmentTiming.startedAt, appointment.started_at);
  const firstStart = appointment.started_at;
  assert.equal((await call()).statusCode, 200);
  assert.equal(writes, 1, 'retry does not restart the clock');
  assert.equal(appointment.started_at, firstStart);
  reset(); race = 'start'; response = await call();
  assert.equal(response.statusCode, 200); assert.equal(writes, 0, 'a concurrent start keeps the first writer clock');
  assert.equal(response.body.appointmentTiming.startedAt, appointment.started_at);
  reset(); race = 'cancel'; response = await call();
  assert.equal(response.statusCode, 409); assert.equal(writes, 0); assert.equal(appointment.status, 'cancelled');
  reset(); failedWrite = true; response = await call();
  assert.equal(response.statusCode, 503); assert.equal(response.body.code, 'APPOINTMENT_START_FAILED');
  assert.equal(appointment.started_at, null); assert.ok(!response.body.text);
  reset(); hasResponse = false; response = await call();
  assert.equal(response.statusCode, 502); assert.equal(mutationAttempts, 0, 'a missing response does not consume the session');
  for (const scenario of ['no-token', 'invalid-token', 'unapproved', 'no-consent', 'foreign', 'wrong-case', 'wrong-session', 'cancelled', 'completed', 'future', 'expired']) {
    reset();
    if (scenario === 'invalid-token') validAuth = false;
    if (scenario === 'unapproved') approved = false;
    if (scenario === 'no-consent') accepted = false;
    if (scenario === 'foreign') appointment.user_id = 'someone-else';
    if (scenario === 'wrong-case') appointment.case_id = 'other';
    if (scenario === 'wrong-session') appointment.session_number = 3;
    if (scenario === 'cancelled' || scenario === 'completed') appointment.status = scenario;
    if (scenario === 'future') appointment.scheduled_local_date = '2099-01-01';
    if (scenario === 'expired') { appointment.status = 'in_progress'; appointment.started_at = '2000-01-01T12:00:00Z'; }
    response = await call({}, scenario === 'no-token' ? {} : undefined);
    assert.ok(response.statusCode >= 400, scenario);
    assert.equal(mutationAttempts, 0, scenario + ' never changes the appointment');
  }
  console.log('PASS: server clock, first response, retries, races, write failure, authentication, consent, ownership, closed/expired appointments and client time tampering.');
} finally {
  for (const [key, value] of Object.entries(env)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  delete globalThis.__startApiClient; delete globalThis.__startApiLocal;
  await rm(temp, { recursive: true, force: true });
}
