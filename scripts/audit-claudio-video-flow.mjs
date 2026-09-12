import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const directory = await mkdtemp(resolve('.audit-claudio-video-'));
const events = new Map(), requests = [];
const popup = {}, video = { src: '', pause() {}, load() {}, removeAttribute() { this.src = ''; }, async play() {} };
let resolveRender, delayRender = false, ui;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { location: { origin: 'http://127.0.0.1:5173' }, open: () => popup,
  addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name),
  setTimeout, clearTimeout, performance, speechSynthesis: { getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {} } };
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
const videoResponse = () => new Response(new Blob(['mp4']), { headers: { 'Content-Type': 'video/mp4' } });
globalThis.fetch = async (url, options) => {
  requests.push({ url, options });
  if (url.endsWith('/health')) return new Response(JSON.stringify({ engine: 'claudio-local-v1' }));
  if (delayRender) return new Promise(resolve => { resolveRender = resolve; });
  return videoResponse();
};
const button = text => ui.root.findAllByType('button').find(node => node.children.filter(c => typeof c === 'string').join('').includes(text));
try {
  const outfile = join(directory, 'component.mjs');
  await build({ entryPoints: ['src/components/ClaudioTalkingAvatar.jsx'], outfile, bundle: true, platform: 'node', format: 'esm',
    external: ['react', 'lucide-react'], loader: { '.css': 'empty' } });
  const { default: Avatar } = await import(pathToFileURL(outfile));
  let props = { caseItem: { image: '/avatar/claudio.png', age: 40, openingLine: 'Me cuesta saber por dónde empezar.' },
    history: [], avatarState: 'idle', disabled: false, onVoiceIntervention: () => assert.fail('must not submit'), onFinish() {} };
  await act(async () => { ui = TestRenderer.create(React.createElement(Avatar, props), { createNodeMock: element => element.type === 'video' ? video : null }); });
  await act(async () => { button('Ver muestra animada').props.onClick(); });
  assert.equal(video.src, '/pilots/claudio/presentation.mp4'); assert.equal(requests.length, 0);
  await act(async () => { button('Conectar motor local').props.onClick(); });
  const payload = { source: popup, origin: 'http://127.0.0.1:8765', data: { type: 'claudio-local-pair', token: 'a'.repeat(43) } };
  await act(async () => { await events.get('message')({ ...payload, source: {} }); await events.get('message')({ ...payload, origin: 'https://evil.test' }); });
  assert.equal(requests.length, 0, 'untrusted pairing cannot connect');
  await act(async () => { await events.get('message')(payload); });
  assert.ok(button('Desconectar motor local'));
  await act(async () => { button('Activar conversación por voz').props.onClick(); });
  assert.equal(JSON.parse(requests.at(-1).options.body).text, props.caseItem.openingLine);
  assert.match(video.src, /^blob:/);
  const count = requests.length;
  props = { ...props, history: [{ id: 'new', answer: 'Esta respuesta sí es nueva.' }], disabled: true, avatarState: 'thinking' };
  await act(async () => { ui.update(React.createElement(Avatar, props)); });
  assert.equal(requests.length, count);
  delayRender = true; props = { ...props, disabled: false, avatarState: 'idle' };
  await act(async () => { ui.update(React.createElement(Avatar, props)); });
  assert.equal(requests.length, count + 1);
  assert.equal(JSON.parse(requests.at(-1).options.body).text, props.history[0].answer);
  await act(async () => { button('Interrumpir y hablar').props.onClick(); resolveRender(videoResponse()); });
  assert.equal(requests.at(-1).options.signal.aborted, true); assert.equal(video.src, '');
  await act(async () => { ui.update(React.createElement(Avatar, { ...props })); });
  assert.equal(requests.length, count + 1, 'the same response is not duplicated');
  assert.equal(ui.root.findByProps({ className: 'claudio-pilot-portrait' }).props.src, '/avatar/claudio.png');
  console.log('PASS: actual component, demonstration, pairing origin/source, exact opening and next answer, waiting transition, interruption and identity.');
} finally { if (ui) await act(async () => ui.unmount()); await rm(directory, { recursive: true, force: true }); }
