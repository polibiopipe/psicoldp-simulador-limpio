import assert from 'node:assert/strict';
import test from 'node:test';
import { ClaudioVideoPlayer } from '../src/engine/claudioVideoPlayer.js';

function fixture(fetchFn) {
  const states = [], errors = [], revoked = [], played = [];
  const video = { src: '', pause() {}, removeAttribute() { this.src = ''; }, load() {}, async play() { played.push(this.src); } };
  const player = new ClaudioVideoPlayer({ getVideo: () => video, fetchFn, onState: s => states.push(s), onError: e => errors.push(e),
    urls: { createObjectURL: () => 'blob:answer', revokeObjectURL: url => revoked.push(url) } });
  player.token = 'a'.repeat(43);
  return { player, video, states, errors, revoked, played };
}
const videoResponse = () => new Response(new Blob(['mp4'], { type: 'video/mp4' }), { headers: { 'Content-Type': 'video/mp4' } });

test('the demonstration plays its own clip without sending a chat or render request', async () => {
  const f = fixture(() => { throw new Error('must not fetch'); });
  await f.player.sample();
  assert.deepEqual(f.played, ['/pilots/claudio/presentation.mp4']);
  assert.equal(f.states.at(-1), 'sample'); f.player.dispose();
});
test('renders the actual complete answer and releases its video on interruption', async () => {
  const answer = 'Me quedé pensando en lo que hablamos. ¿Por dónde podemos empezar?';
  let request;
  const f = fixture(async (url, options) => { request = { url, options }; return videoResponse(); });
  await f.player.render(answer);
  assert.deepEqual(JSON.parse(request.options.body), { text: answer });
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.headers.Authorization, `Bearer ${'a'.repeat(43)}`);
  assert.deepEqual(f.played, ['blob:answer']);
  f.player.stop(); assert.deepEqual(f.revoked, ['blob:answer']); assert.equal(f.video.src, ''); f.player.dispose();
});
test('an interrupted or superseded request cannot start a late video', async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = f.player.render('Respuesta anterior.');
  f.player.stop(); finish(videoResponse()); await pending;
  assert.deepEqual(f.played, []); assert.deepEqual(f.errors, []); f.player.dispose();
});
test('a local error never substitutes the recorded presentation for a new answer', async () => {
  const f = fixture(async () => new Response(JSON.stringify({ error: 'Motor ocupado.' }), { status: 409 }));
  await f.player.render('Texto nuevo');
  assert.deepEqual(f.played, []); assert.deepEqual(f.errors, ['Motor ocupado.']); f.player.dispose();
});
test('autoplay denial preserves the generated video for an explicit play gesture', async () => {
  const f = fixture(async () => videoResponse());
  f.video.play = async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); };
  await f.player.render('Hola.');
  assert.equal(f.states.at(-1), 'ready'); assert.equal(f.video.src, 'blob:answer'); assert.deepEqual(f.revoked, []);
  f.video.play = async () => {}; await f.player.play(f.video.src); assert.equal(f.states.at(-1), 'playing'); f.player.dispose();
});
test('incorrect content and an invalid pairing code are rejected', async () => {
  const f = fixture(async () => new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html' } }));
  await f.player.render('Hola.'); assert.deepEqual(f.played, []); assert.match(f.errors[0], /vídeo válido/);
  await assert.rejects(f.player.connect('bad'), /no es válido/); f.player.dispose();
});
