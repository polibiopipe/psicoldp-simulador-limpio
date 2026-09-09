import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CONSENT_SCOPE, CONSENT_DECLARATIONS, CONSENT_SECTIONS, consentDocumentText } from '../src/data/researchConsent.js';

const temp = await mkdtemp(resolve('.audit-consent-'));
const info = Object.fromEntries(CONSENT_SECTIONS.map(([key]) => [key, `Protocol ${key}`]));
Object.assign(info, { scope: CONSENT_SCOPE, declarations: CONSENT_DECLARATIONS, allow_quotes: true });
const study = { id: 'study-v1', study_key: 'escucha-viva-estudiantes', title: 'Verified study', version: '1.0', status: 'published', information: info, collection_until: '2099-12-01T00:00:00Z', retention_until: '2100-01-01T00:00:00Z' };
let userId = 'owner';
const tables = { simulation_research_studies: [], simulation_research_consent_events: [] };
let insertCalls = 0;
let nextWrite;
let failRead = false;
let failExportTable;
let busy = false;
let ui;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__consentClient = {
  auth: { getUser: async () => ({ data: { user: { id: userId, email: `${userId}@example.invalid` } }, error: null }) },
  from(table) {
    const filters = []; let payload; let single = false; let limit = Infinity; let start = 0; let end = Infinity; let descending = false;
    return {
      select() { return this; }, eq(k, v) { filters.push((r) => r[k] === v); return this; },
      order(k, options) { if (k === 'sequence') descending = options?.ascending === false; return this; },
      limit(n) { limit = n; return this; }, range(a,b) { start = a; end = b; return this; },
      insert(value) { payload = value; return this; }, single() { single = true; return this; },
      then(yes, no) {
        return (async () => {
          if (failRead || table === failExportTable) return { error: { message: 'offline' }, data: null };
          if (payload) {
            insertCalls++;
            if (nextWrite) { const callback = nextWrite; nextWrite = null; return callback(payload); }
            const row = { ...payload, id: `event-${insertCalls}`, sequence: insertCalls, created_at: new Date().toISOString(), document_snapshot: JSON.parse(JSON.stringify(study)) };
            tables[table].push(row);
            return { data: single ? row : [row], error: null };
          }
          let rows = (tables[table] || []).filter((r) => filters.every((fn) => fn(r)));
          if (descending) rows = rows.toSorted((a,b) => b.sequence-a.sequence);
          return { data: rows.slice(start, Math.min(end+1,start+limit)), error: null };
        })().then(yes, no);
      }
    };
  }
};
const flush = () => new Promise((done) => setImmediate(done));
const text = (node) => node.children.filter((c) => typeof c === 'string').join('');
const button = (label) => ui.root.findAllByType('button').find((b) => text(b).includes(label));
const content = () => JSON.stringify(ui.toJSON());
async function mount(Component, props = {}) {
  await act(async () => { if (ui) ui.unmount(); ui = TestRenderer.create(React.createElement(Component, { userId, onBusyChange: (value) => { busy = value; }, ...props })); await flush(); });
}
async function check(index) { await act(async () => ui.root.findAllByType('input')[index].props.onChange({ target: { checked: true } })); }
try {
  const outfile = join(temp, 'consent.mjs');
  await build({ stdin: { contents: `export { ResearchConsent, ResearchInvitation } from './src/components/ResearchConsent.jsx'; export { TrustCenter } from './src/components/TrustCenter.jsx'; export { exportOwnSimulatorData } from './src/engine/researchConsent.js';`, resolveDir: process.cwd() },
    outfile, bundle: true, platform: 'node', format: 'esm', external: ['react', 'react-dom', 'lucide-react'], define: { 'import.meta.env': '{}' },
    plugins: [{ name: 'remote-only', setup(b) {
      b.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: 'client', namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const supabase=globalThis.__consentClient; export const isSupabaseConfigured=true;' }));
    } }]
  });
  const { ResearchConsent, ResearchInvitation, TrustCenter, exportOwnSimulatorData } = await import(pathToFileURL(outfile));
  await mount(ResearchConsent);
  assert.match(content(), /No hay una convocatoria abierta/);
  assert.equal(button('Aceptar'), undefined);
  assert.equal(insertCalls, 0, 'Opening the module must not create consent');
  tables.simulation_research_studies = [study];
  await mount(ResearchInvitation);
  assert.ok(button('Revisar invitación'));
  await mount(ResearchConsent);
  assert.equal(ui.root.findAllByType('input').length, 4);
  assert.ok(ui.root.findAllByType('input').every((input) => input.props.checked === false));
  await check(0); await check(1);
  assert.equal(button('Aceptar y guardar').props.disabled, true, 'Data authorization is independent');
  await act(async () => ui.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(insertCalls, 0);
  await check(2);
  let release;
  nextWrite = () => new Promise((done) => { release = done; });
  await act(async () => { ui.root.findByType('form').props.onSubmit({ preventDefault() {} }); ui.root.findByType('form').props.onSubmit({ preventDefault() {} }); await flush(); });
  assert.equal(insertCalls, 1, 'Repeated clicks must create one write');
  assert.equal(busy, true);
  await act(async () => { release({ data: null, error: { message: 'offline' } }); await flush(); });
  assert.equal(busy, false);
  assert.match(content(), /No se confirmó el registro/);
  assert.equal(button('Descargar mi constancia'), undefined);
  await act(async () => { button('Actualizar estado').props.onClick(); await flush(); });
  assert.ok(ui.root.findAllByType('input').every((input) => !input.props.checked), 'Reload must require a fresh affirmative choice');
  await check(0); await check(1); await check(2);
  await act(async () => { ui.root.findByType('form').props.onSubmit({ preventDefault() {} }); await flush(); });
  assert.match(content(), /Tu consentimiento quedó registrado/);
  assert.equal(tables.simulation_research_consent_events[0].quotes_accepted, false);
  assert.ok(button('Descargar mi constancia'));
  const accepted = tables.simulation_research_consent_events[0];
  const receipt = consentDocumentText(accepted.document_snapshot, accepted);
  assert.match(receipt, /Versión: 1.0/);
  assert.match(receipt, /Tratamiento autorizado: Sí/);
  assert.match(receipt, /Publicación opcional de fragmentos: No/);
  assert.ok(receipt.includes(CONSENT_DECLARATIONS.participation));
  await mount(ResearchConsent, { canParticipate: false });
  assert.ok(button('Retirarme de la investigación'), 'Withdrawing remains available without practice approval');
  const beforeWithdrawal = insertCalls;
  await act(async () => button('Retirarme de la investigación').props.onClick());
  assert.equal(insertCalls, beforeWithdrawal, 'Withdrawal requires explicit confirmation');
  await act(async () => { button('Confirmar mi retiro').props.onClick(); await flush(); });
  assert.match(content(), /Tu retiro quedó registrado/);
  assert.equal(tables.simulation_research_consent_events.at(-1).previous_event_id, accepted.id);
  await mount(ResearchConsent);
  assert.match(content(), /Te retiraste del estudio/);
  await act(async () => { button('Continuar sin participar').props.onClick(); await flush(); });
  assert.match(content(), /Registramos que no participarás/);
  await mount(ResearchInvitation);
  assert.equal(ui.toJSON(), null, 'A declined invitation must not be repeatedly displayed');
  userId = 'other';
  await mount(ResearchConsent);
  assert.equal(button('Descargar mi constancia'), undefined, 'Another account cannot see the receipt');
  failRead = true;
  await mount(ResearchConsent);
  assert.match(content(), /No pudimos verificar/);
  assert.equal(button('Aceptar y guardar'), undefined);
  failRead = false;
  userId = 'owner';
  tables.user_profiles = [{ id: 'owner' }];
  tables.simulation_sessions = Array.from({ length: 501 }, (_, id) => ({ id, user_id: 'owner' }));
  const exported = await exportOwnSimulatorData('owner');
  assert.equal(exported.tables.simulation_sessions.length, 501, 'Export must paginate past a page boundary');
  assert.ok(exported.tables.simulation_research_consent_events.length >= 3);
  failExportTable = 'simulation_appointments';
  await assert.rejects(exportOwnSimulatorData('owner'), /No pudimos completar/);
  failExportTable = null;
  await assert.rejects(exportOwnSimulatorData('other'), /La cuenta cambió/);
  await mount(TrustCenter);
  assert.ok(button('Consentimiento'));
  await act(async () => button('Mis datos y privacidad').props.onClick());
  assert.ok(button('Descargar mis datos'));
  console.log('PASS: optional invitation, independent unchecked declarations, confirmed persistence, double-click and failure handling, receipts, withdrawal, account isolation, paginated exports and privacy navigation');
} finally { if (ui) await act(async () => ui.unmount()); delete globalThis.__consentClient; await rm(temp, { recursive: true, force: true }); }
