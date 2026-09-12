export const CLAUDIO_LOCAL_ORIGIN = 'http://127.0.0.1:8765';

export class ClaudioVideoPlayer {
  constructor({ getVideo, onState = () => {}, onError = () => {}, fetchFn = (...args) => fetch(...args), urls = URL }) {
    Object.assign(this, { getVideo, onState, onError, fetchFn, urls });
    this.sequence = 0; this.token = null; this.objectURL = null; this.disposed = false;
  }
  async connect(token) {
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) throw new Error('El código del motor no es válido.');
    const response = await this.fetchFn(`${CLAUDIO_LOCAL_ORIGIN}/health`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000), credentials: 'omit'
    });
    if (!response.ok || (await response.json()).engine !== 'claudio-local-v1') throw new Error('No se pudo conectar el motor de Claudio.');
    if (!this.disposed) this.token = token;
  }
  stop() {
    this.sequence += 1;
    this.abort?.abort(); this.abort = null;
    const video = this.getVideo();
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (this.objectURL) this.urls.revokeObjectURL(this.objectURL);
    this.objectURL = null;
    if (!this.disposed) this.onState('idle');
  }
  async play(source, sequence = this.sequence, kind = 'answer') {
    if (sequence !== this.sequence || this.disposed) return;
    const video = this.getVideo();
    if (!video) return;
    video.src = source; video.muted = false;
    this.onState(kind === 'sample' ? 'sample' : 'playing');
    try { await video.play(); }
    catch (error) {
      if (sequence !== this.sequence || this.disposed) return;
      if (error.name === 'NotAllowedError') { this.onState('ready'); this.onError('El vídeo está listo. Pulsa Reproducir vídeo para escucharlo.'); }
      else { this.stop(); this.onError('No se pudo reproducir el vídeo. Puedes continuar en el chat.'); }
    }
  }
  sample() { this.stop(); return this.play('/pilots/claudio/presentation.mp4', this.sequence, 'sample'); }
  async render(text) {
    this.stop();
    if (!this.token || this.disposed || !String(text).trim()) return;
    const sequence = this.sequence;
    const abort = new AbortController(); this.abort = abort;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, 240000);
    this.onState('generating');
    try {
      const response = await this.fetchFn(`${CLAUDIO_LOCAL_ORIGIN}/render`, {
        method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }), signal: abort.signal, credentials: 'omit'
      });
      if (!response.ok) {
        let message = 'No se pudo generar el vídeo. La respuesta sigue disponible en el chat.';
        try { message = (await response.json()).error || message; } catch { /* Generic message remains. */ }
        throw new Error(message);
      }
      if (!response.headers.get('Content-Type')?.startsWith('video/mp4')) throw new Error('El motor no devolvió un vídeo válido.');
      const blob = await response.blob();
      if (sequence !== this.sequence || this.disposed) return;
      if (!blob.size || blob.size > 40 * 1024 * 1024) throw new Error('El vídeo no tiene un tamaño válido.');
      this.objectURL = this.urls.createObjectURL(blob);
      await this.play(this.objectURL, sequence);
    } catch (error) {
      if (sequence !== this.sequence || this.disposed) return;
      this.onState('idle');
      this.onError(timedOut ? 'El vídeo está tardando demasiado. Puedes repetir la respuesta o usar la voz del navegador.'
        : error.name === 'AbortError' ? 'La generación se interrumpió.'
        : error instanceof TypeError ? 'No se pudo acceder al motor local. Comprueba que esté abierto y permite la conexión local si el navegador la solicita.' : error.message);
    } finally { clearTimeout(timer); if (this.abort === abort) this.abort = null; }
  }
  disconnect() { this.stop(); this.token = null; }
  dispose() { this.stop(); this.token = null; this.disposed = true; }
}
