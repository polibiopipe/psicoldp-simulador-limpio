import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TEAM_KEY, TEAM_ACTIVITIES, REVIEW_CHECKS, blankItem, validateItem, reviewState, canReview, safeEvidenceUrl } from '../src/seminar/seminarTeamModel.js';

const members = ['a', 'b', 'c'].map((id, i) => ({ team_key: TEAM_KEY, user_id: id, display_name: `Integrante ${i + 1}`, active: true }));
const item = { id: 'fixture', revision: 1, kind: 'decision', owner_id: 'a', reviewer_id: 'b', updated_by: 'a' };
let counter = 0;
const event = (actor, type, revision = 1) => ({ id: `event-${++counter}`, item_id: 'fixture', item_revision: revision, actor_id: actor, event_type: type, created_at: new Date(counter * 1000).toISOString() });
assert.equal(Object.keys(TEAM_ACTIVITIES).length, 6);
assert.equal(REVIEW_CHECKS.length, 4);
assert.equal(canReview(item, 'a'), false);
assert.equal(canReview(item, 'b'), true);
assert.equal(canReview({ ...item, updated_by: 'b' }, 'b'), false);
assert.equal(reviewState(item, [], members).reviewed, false);
const events = [event('b', 'review_approved'), event('a', 'agree'), event('b', 'agree')];
assert.equal(reviewState(item, events, members).reviewed, true);
assert.equal(reviewState(item, events, members).agreed, false, 'A majority is not consensus');
events.push(event('c', 'agree'));
assert.equal(reviewState(item, events, members).agreed, true);
events.push(event('c', 'object'));
assert.equal(reviewState(item, events, members).agreed, false, 'An objection remains visible');
assert.equal(reviewState({ ...item, revision: 2 }, events, members).reviewed, false);
assert.equal(reviewState({ ...item, revision: 2 }, events, members).agreementCount, 0);
assert.equal(reviewState(item, [event('a', 'review_approved')], members).reviewed, false);
assert.equal(safeEvidenceUrl('javascript:alert(1)'), '');
assert.equal(safeEvidenceUrl('http://example.org'), '');
assert.equal(safeEvidenceUrl('https://example.org/evidence'), 'https://example.org/evidence');
const proposal = blankItem('antecedente', 'a', members);
assert.equal(proposal.owner_id, 'a');
assert.notEqual(proposal.reviewer_id, 'a');
assert.ok(validateItem(proposal));
assert.equal(validateItem({ ...proposal, title: 'Antecedente de prueba' }), '');
assert.ok(validateItem({ ...proposal, title: 'Prueba', reviewer_id: 'a' }));
console.log('PASS seminar-team model: peer review, consensus, version invalidation and safe links');

// Synthetic client: no live services, access tokens or participant records.
let actor = 'a', next = 0, rpcFailure = null;
const store = { seminar_members: members, seminar_items: [], seminar_events: [] };
const fakeClient = {
  from(table) {
    const filters = [];
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      order() { return query; },
      async range(start, end) {
        return { data: structuredClone(store[table].filter(row => filters.every(([key, value]) => row[key] === value)).slice(start, end + 1)), error: null };
      }
    };
    return query;
  },
  channel() { const channel = { on() { return channel; }, subscribe(callback) { callback('SUBSCRIBED'); return channel; } }; return channel; },
  async removeChannel() {},
  async rpc(name, params) {
    if (rpcFailure) return { data: null, error: rpcFailure };
    if (name === 'seminar_save_item') {
      const prior = store.seminar_items.find(row => row.id === params.p_item_id);
      if (prior && prior.revision !== params.p_expected_revision) return { error: { code: '40001', message: 'VERSION_CONFLICT' } };
      const saved = { ...structuredClone(params.p_document), id: prior?.id || `shared-${++next}`, revision: (prior?.revision || 0) + 1, updated_by: actor, created_by: prior?.created_by || actor, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.seminar_items = [saved, ...store.seminar_items.filter(row => row.id !== saved.id)];
      store.seminar_events.unshift({ id: `revision-${++next}`, item_id: saved.id, team_key: TEAM_KEY, item_revision: saved.revision, actor_id: actor, event_type: 'revision', note: 'Versión de prueba', payload: { document: saved }, created_at: new Date().toISOString() });
      return { data: structuredClone(saved), error: null };
    }
    if (name === 'seminar_add_event') {
      const saved = { id: `review-${++next}`, team_key: TEAM_KEY, item_id: params.p_item_id, item_revision: params.p_revision, actor_id: actor, event_type: params.p_type, note: params.p_note, payload: { checks: params.p_checks }, created_at: new Date().toISOString() };
      store.seminar_events.unshift(saved); return { data: structuredClone(saved), error: null };
    }
    throw new Error('Unexpected RPC');
  }
};
const local = new Map();
const originals = new Map(['localStorage', 'document', 'addEventListener', 'removeEventListener', 'confirm', 'setInterval', 'clearInterval', 'IS_REACT_ACT_ENVIRONMENT', '__SEMINAR_FAKE_DB__'].map(key => [key, globalThis[key]]));
globalThis.__SEMINAR_FAKE_DB__ = fakeClient;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.localStorage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value), removeItem: key => local.delete(key) };
globalThis.document = { hidden: true };
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.confirm = () => true;
globalThis.setInterval = () => 1;
globalThis.clearInterval = () => {};
const output = resolve('.audit-verification/tmp/seminar-team-ui.cjs');
mkdirSync(resolve('.audit-verification/tmp'), { recursive: true });
const bundled = await build({ entryPoints: ['src/seminar/SeminarTeamWorkspace.jsx'], outfile: output, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], loader: { '.css': 'empty' }, plugins: [{ name: 'synthetic-team-client', setup(plugin) {
  plugin.onResolve({ filter: /supabaseClient\.js$/ }, () => ({ path: 'client', namespace: 'test-client' }));
  plugin.onLoad({ filter: /.*/, namespace: 'test-client' }, () => ({ contents: 'export const supabase = globalThis.__SEMINAR_FAKE_DB__;', loader: 'js' }));
} }] });
writeFileSync(output, bundled.outputFiles[0].contents);
const imported = await import(pathToFileURL(output).href);
const Workspace = imported.SeminarTeamWorkspace || imported.default.SeminarTeamWorkspace;
let renderer;
const text = node => typeof node === 'string' ? node : (node?.children || []).map(text).join(' ');
const button = title => renderer.root.findAllByType('button').find(node => text(node).includes(title));
async function mount(id) { actor = id; await act(async () => { renderer = TestRenderer.create(React.createElement(Workspace, { session: { user: { id, email: `${id}@example.test` } }, onOpenGuide() {} })); }); }
async function unmount() { await act(async () => renderer.unmount()); }
try {
  await mount('a');
  assert.ok(text(renderer.root).includes('Integrante 3'));
  await act(async () => button('Consolidar antecedentes').props.onClick());
  await act(async () => renderer.root.findByProps({ placeholder: 'Una propuesta concreta que el equipo pueda revisar' }).props.onChange({ target: { value: 'Antecedente de prueba' } }));
  await act(async () => renderer.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'Referencia leída y registrada por la primera persona' } }));
  await act(async () => renderer.root.findByProps({ type: 'url' }).props.onChange({ target: { value: 'https://example.org/evidence' } }));
  await act(async () => renderer.root.findAllByType('form')[0].props.onSubmit({ preventDefault() {} }));
  assert.equal(store.seminar_items.length, 1);
  assert.equal(renderer.root.findAllByType('option').find(node => node.props.value === 'review_approved').props.disabled, true);
  await unmount();
  await mount('b');
  await act(async () => button('Antecedente de prueba').props.onClick());
  assert.equal(renderer.root.findAllByType('textarea')[0].props.value, 'Referencia leída y registrada por la primera persona');
  const intervention = renderer.root.findAllByType('select').find(node => node.findAllByType('option').some(option => option.props.value === 'review_approved'));
  await act(async () => intervention.props.onChange({ target: { value: 'review_approved' } }));
  for (const checkbox of renderer.root.findAllByType('input').filter(node => node.props.type === 'checkbox')) await act(async () => checkbox.props.onChange({ target: { checked: true } }));
  await act(async () => renderer.root.findAllByType('textarea').at(-1).props.onChange({ target: { value: 'Contrasté la referencia y sus límites con la evidencia de prueba.' } }));
  await act(async () => renderer.root.findAllByType('form').at(-1).props.onSubmit({ preventDefault() {} }));
  assert.equal(reviewState(store.seminar_items[0], store.seminar_events, members).reviewed, true);
  await unmount();
  await mount('a');
  await act(async () => button('Antecedente de prueba').props.onClick());
  await act(async () => renderer.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'Referencia revisada en un segundo incremento' } }));
  await act(async () => renderer.root.findAllByType('form')[0].props.onSubmit({ preventDefault() {} }));
  assert.equal(store.seminar_items[0].revision, 2);
  assert.equal(reviewState(store.seminar_items[0], store.seminar_events, members).reviewed, false);
  rpcFailure = { message: 'network unavailable' };
  await act(async () => renderer.root.findAllByType('textarea')[0].props.onChange({ target: { value: 'Borrador que no debe perderse sin conexión' } }));
  await act(async () => renderer.root.findAllByType('form')[0].props.onSubmit({ preventDefault() {} }));
  assert.equal(renderer.root.findAllByType('textarea')[0].props.value, 'Borrador que no debe perderse sin conexión');
  assert.ok([...local.values()].some(value => value.includes('Borrador que no debe perderse')));
  assert.equal(store.seminar_items[0].revision, 2);
  rpcFailure = null;
  await unmount();
  await mount('outside');
  assert.equal(renderer.root.findAllByType('textarea').length, 0);
  assert.ok(text(renderer.root).includes('no tiene una membresía activa'));
  await unmount();
  console.log('PASS seminar-team React: shared save/read, separate reviewer, revision invalidation, offline draft recovery and membership gate');
} finally {
  for (const [key, value] of originals) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
}
