// Browser speech only. No TTS subscription, microphone recording, or extra LLM calls.
// Lip timing is an approximation, anchored to SpeechSynthesis word boundaries when available.
export const VISEMES = ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"];

export function preferredSpanishVoice(voices) {
  return voices.filter((voice) => /^es(?:-|$)/i.test(voice.lang)).sort((a, b) => score(b) - score(a))[0] || null;
}
function score(voice) {
  return (/Jorge|Diego|Pablo|Carlos|Alvaro|Álvaro|Andres|Andrés|Rodrigo|Manuel|Enrique|Juan|Raul|Raúl/i.test(voice.name) ? 20 : 0)
    + (/^es-CL$/i.test(voice.lang) ? 10 : 0) + (voice.localService ? 2 : 0);
}
export function spanishVisemes(text, rate = 0.95) {
  const chars = String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let time = 0;
  return Array.from(chars, (char, index) => {
    const viseme = /[aeiou]/.test(char) ? ({ a: "aa", e: "E", i: "I", o: "O", u: "U" })[char]
      : /[pbmv]/.test(char) ? "PP" : char === "f" ? "FF" : /[sz]/.test(char) ? "SS"
      : /[td]/.test(char) ? "DD" : /[kgqj]/.test(char) ? "kk"
      : char === "c" ? (/[ei]/.test(chars[index + 1]) ? "SS" : "kk")
      : /[nlñ]/.test(char) ? "nn" : char === "r" ? "RR" : /[xy]/.test(char) ? "I" : "sil";
    const duration = (/[.,;:!?]/.test(char) ? 180 : /\s/.test(char) ? 55 : /[aeiou]/.test(char) ? 85 : 55) / rate;
    const frame = { index, viseme, time, duration };
    time += duration;
    return frame;
  });
}
export class BrowserAvatarVoice {
  constructor({ env = window, onState = () => {}, onError = () => {}, onTranscript = () => {}, onInterim = () => {} } = {}) {
    this.env = env; this.synth = env.speechSynthesis;
    this.onState = onState; this.onError = onError; this.onTranscript = onTranscript; this.onInterim = onInterim;
    this.state = "idle"; this.generation = 0; this.frames = []; this.anchor = 0; this.anchorTime = 0; this.disposed = false;
  }
  setState(state) {
    if (this.disposed) return;
    this.state = state; this.onState(state);
  }
  stop() {
    this.generation += 1;
    this.env.clearTimeout(this.watchdog); this.env.clearTimeout(this.listenTimer);
    const recognition = this.recognition; this.recognition = null;
    try { recognition?.abort(); } catch { /* Already ended. */ }
    if (this.utterance) this.synth?.cancel();
    this.utterance = null; this.frames = []; this.onInterim(""); this.setState("idle");
  }
  speak(text, voice = null) {
    this.stop();
    if (this.disposed || !String(text).trim()) return;
    if (!this.synth || !this.env.SpeechSynthesisUtterance) {
      this.onError("Este navegador no puede reproducir voz. La respuesta sigue disponible en el chat."); return;
    }
    const token = this.generation;
    const chunks = String(text).match(/[^.!?\n]+[.!?\n]*|[.!?\n]+/g) || [String(text)];
    const queue = chunks.flatMap((chunk) => chunk.match(/.{1,220}(?:\s|$)|\S{1,220}/g) || [chunk]);
    const next = () => {
      if (token !== this.generation || this.disposed) return;
      const chunk = queue.shift();
      if (!chunk) { this.utterance = null; this.frames = []; this.setState("idle"); return; }
      const utterance = new this.env.SpeechSynthesisUtterance(chunk);
      this.utterance = utterance; utterance.lang = voice?.lang || "es-CL";
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95; utterance.pitch = 0.95;
      this.frames = spanishVisemes(chunk, utterance.rate); this.anchor = 0;
      const current = () => !this.disposed && token === this.generation && this.utterance === utterance;
      const fail = (message) => { if (!current()) return; this.stop(); this.onError(message); };
      this.watchdog = this.env.setTimeout(() => fail("La voz no comenzó. Pulsa Repetir respuesta o elige otra voz."), 12000);
      utterance.onstart = () => {
        if (!current()) return;
        this.env.clearTimeout(this.watchdog); this.anchorTime = this.env.performance.now(); this.setState("speaking");
        this.watchdog = this.env.setTimeout(() => fail("La reproducción se detuvo. Puedes repetir la respuesta."), 60000);
      };
      utterance.onboundary = (event) => {
        if (!current() || event.name !== "word") return;
        this.anchor = this.frames.find((frame) => frame.index >= event.charIndex)?.time || 0;
        this.anchorTime = this.env.performance.now();
      };
      utterance.onend = () => { if (!current()) return; this.env.clearTimeout(this.watchdog); next(); };
      utterance.onerror = () => fail("No pudimos reproducir esta voz. Elige otra o continúa por escrito.");
      try { this.synth.speak(utterance); } catch { fail("No se pudo iniciar la voz. Puedes continuar por escrito."); }
    };
    next();
  }
  lipFrame() {
    if (this.state !== "speaking" || !this.frames.length) return { viseme: "sil", level: 0 };
    const time = this.anchor + this.env.performance.now() - this.anchorTime;
    const frame = this.frames.find((item) => time >= item.time && time < item.time + item.duration);
    if (!frame || frame.viseme === "sil") return { viseme: "sil", level: 0 };
    const progress = (time - frame.time) / frame.duration;
    return { viseme: frame.viseme, level: 0.65 * Math.sin(Math.PI * progress) };
  }
  listen() {
    this.stop(); if (this.disposed) return;
    const Recognition = this.env.SpeechRecognition || this.env.webkitSpeechRecognition;
    if (!Recognition) { this.onError("El dictado no está disponible. Prueba Chrome o Edge, o escribe en el chat."); return; }
    const token = this.generation; const recognition = new Recognition(); this.recognition = recognition;
    recognition.lang = "es-CL"; recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 1;
    const finals = new Map(); let failed = false;
    const current = () => !this.disposed && token === this.generation && this.recognition === recognition;
    recognition.onstart = () => { if (current()) this.setState("listening"); };
    recognition.onresult = (event) => {
      if (!current()) return;
      const interim = [];
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript?.trim(); if (!text) continue;
        if (event.results[i].isFinal) finals.set(i, text); else interim.push(text);
      }
      this.onInterim([...finals.values(), ...interim].join(" "));
    };
    recognition.onerror = (event) => {
      if (!current()) return;
      failed = true;
      this.onError(["not-allowed", "service-not-allowed"].includes(event.error)
        ? "Permite el micrófono en el navegador para hablar. También puedes escribir."
        : event.error === "no-speech" ? "No se detectó voz. Pulsa Hablar para intentarlo otra vez."
        : "No se pudo completar el dictado. Revisa tu conexión o continúa por escrito.");
      this.stop();
    };
    recognition.onend = () => {
      if (!current()) return;
      this.env.clearTimeout(this.listenTimer); this.recognition = null; this.onInterim(""); this.setState("idle");
      const transcript = [...finals.entries()].sort((a, b) => a[0] - b[0]).map(([, text]) => text).join(" ").trim();
      if (!failed && transcript) this.onTranscript(transcript);
      else if (!failed) this.onError("No se detectó una intervención. Puedes volver a hablar o escribir.");
    };
    try {
      recognition.start();
      this.listenTimer = this.env.setTimeout(() => {
        if (!current()) return;
        this.stop(); this.onError("El micrófono se cerró por tiempo de espera. Pulsa Hablar para continuar.");
      }, 60000);
    } catch { this.stop(); this.onError("No se pudo abrir el micrófono. Puedes continuar por escrito."); }
  }
  finishListening() { try { this.recognition?.stop(); } catch { this.stop(); } }
  dispose() { this.stop(); this.disposed = true; }
}
