import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temp = await mkdtemp(resolve('.audit-access-api-'));
let receipt = null;
let readError = false;
let approved = true;
let currentVersion = '1.0';
let appointmentQueries = 0;
const row = { id: 'receipt', user_id: 'owner', document_version: '1.0', adult_confirmed: true, educational_use_accepted: true, data_processing_accepted: true };
globalThis.__accessApiClient = {
  auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
  from(table) {
    const filters = [];
    return { select() { return this; }, eq(k,v) { filters.push([k,v]); return this; }, async maybeSingle() {
      if (table === 'user_profiles') return { data: { id: 'owner', approved } };
      if (table === 'simulation_appointments') { appointmentQueries++; return { data: null }; }
      if (readError) return { data: null, error: { message: 'offline' } };
      const data = table === 'simulation_access_documents' ? { version: currentVersion, is_current: true } : receipt;
      return { data: data && filters.every(([k,v]) => data[k] === v) ? data : null };
    } };
  }
};
const oldUrl = process.env.SUPABASE_URL; const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_URL = 'https://audit.invalid'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-not-a-secret';
try {
  const outfile = join(temp, 'handler.mjs');
  await build({ entryPoints: ['api/gemini-patient-response.js'], outfile, bundle: true, platform: 'node', format: 'esm', plugins: [{ name: 'fixture-service', setup(b) {
    b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const createClient=()=>globalThis.__accessApiClient;' }));
  } }] });
  const { default: handler } = await import(pathToFileURL(outfile));
  async function call() {
    const res = { statusCode: 0, setHeader() {}, status(n) { this.statusCode=n; return this; }, json(body) { this.body=body; return this; }, end(body) { this.body=JSON.parse(body); } };
    await handler({ method: 'POST', headers: { authorization: 'Bearer fixture-token' }, body: { caseId: 'claudio', studentMessage: 'Hola', appointmentId: 'fixture-appointment', userId: 'forged-user' } }, res);
    return res;
  }
  let response = await call();
  assert.equal(response.statusCode, 403); assert.equal(response.body.code, 'ACCESS_CONSENT_REQUIRED');
  assert.equal(appointmentQueries, 0, 'no practice/provider work before acceptance');
  receipt = { ...row, user_id: 'forged-user' };
  assert.equal((await call()).body.code, 'ACCESS_CONSENT_REQUIRED', 'payload user ID cannot authorize another account');
  receipt = { ...row, data_processing_accepted: false };
  assert.equal((await call()).body.code, 'ACCESS_CONSENT_REQUIRED');
  receipt = row; readError = true;
  response = await call(); assert.equal(response.statusCode, 503); assert.equal(response.body.code, 'ACCESS_CONSENT_LOOKUP_FAILED');
  readError = false; currentVersion = '2.0';
  assert.equal((await call()).body.code, 'ACCESS_CONSENT_REQUIRED');
  currentVersion = '1.0';
  assert.equal((await call()).body.code, 'APPOINTMENT_NOT_FOUND', 'current receipt reaches the next authorization check');
  assert.equal(appointmentQueries, 1);
  approved = false;
  assert.equal((await call()).body.code, 'ACCESS_NOT_APPROVED', 'receipt never replaces administrative approval');
  console.log('PASS: real API rejects absent, incomplete, foreign and outdated acceptance; database failures stop provider work; approved current acceptance proceeds');
} finally {
  if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
  if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  delete globalThis.__accessApiClient; await rm(temp, { recursive: true, force: true });
}
