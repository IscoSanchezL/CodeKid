/**
 * Sonido generado con Web Audio (sin archivos): música ambiental suave para concentrarse y efectos cortos.
 * Los navegadores solo permiten sonar tras un toque del usuario, por eso `armAudio` espera el primer gesto.
 */

const KEY = "codekid:sound:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let enabled = true;
let musicOn = false;
let chordTimer: number | null = null;

try {
  enabled = window.localStorage.getItem(KEY) !== "off";
} catch {
  enabled = true;
}

export const isSoundEnabled = () => enabled;
export function subscribeSound(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const notify = () => listeners.forEach((l) => l());

const NOTE = (semi: number) => 261.63 * Math.pow(2, semi / 12);

// ── Música alegre por mundo ─────────────────────────────────────────────
// Un pequeño «secuenciador» sintetizado: bajo, ukelele, marimba/silbido, sonajero y maderita.
// Cada mundo cambia tono, velocidad, acordes, melodías e instrumento principal.
type Chord = { root: number; notes: number[] };
const I: Chord = { root: 0, notes: [0, 4, 7] };
const VI: Chord = { root: 9, notes: [9, 12, 16] };
const IV: Chord = { root: 5, notes: [5, 9, 12] };
const V: Chord = { root: 7, notes: [7, 11, 14] };

type Lead = "marimba" | "whistle" | "steel";
type Theme = {
  bpm: number;
  key: number; // semitonos sobre Do
  swing: number; // 0 a 0.2: retrasa las corcheas pares para dar «rebote»
  prog: Chord[];
  lead: Lead;
  strum: "offbeat" | "bounce" | "arp";
  melodies: (number | null)[][]; // índices de la escala pentatónica (0 a 9)
};

const THEMES: Record<string, Theme> = {
  cielo: {
    bpm: 104,
    key: 0,
    swing: 0.06,
    prog: [I, VI, IV, V],
    lead: "marimba",
    strum: "offbeat",
    melodies: [
      [4, null, 5, null, 7, null, 5, 4],
      [7, 6, 5, null, 4, null, 2, null],
      [2, 4, 5, 7, 5, 4, null, null],
      [9, null, 7, null, 5, 4, 5, null],
    ],
  },
  pradera: {
    bpm: 116,
    key: 7,
    swing: 0.1,
    prog: [I, IV, I, V],
    lead: "whistle",
    strum: "bounce",
    melodies: [
      [5, 5, 7, null, 6, 5, 4, null],
      [4, null, 5, 7, 9, null, 7, null],
      [7, 7, 6, 5, 6, null, 4, null],
      [2, 4, 5, null, 4, 2, 1, null],
    ],
  },
  bosque: {
    bpm: 100,
    key: 2,
    swing: 0.04,
    prog: [I, VI, IV, V],
    lead: "marimba",
    strum: "arp",
    melodies: [
      [null, 4, null, 6, null, 7, 6, null],
      [5, null, 4, null, 2, null, 4, 5],
      [7, null, 9, null, 7, 6, 5, null],
      [4, 5, 6, 7, null, 6, 4, null],
    ],
  },
  playa: {
    bpm: 120,
    key: 5,
    swing: 0.12,
    prog: [I, V, VI, IV],
    lead: "steel",
    strum: "offbeat",
    melodies: [
      [7, null, 7, 9, 7, null, 5, null],
      [5, 7, null, 7, 9, null, 7, 5],
      [4, null, 5, null, 7, 5, 4, null],
      [9, 7, 5, null, 7, null, 4, null],
    ],
  },
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

let theme = "cielo";
let nextTime = 0;
let step = 0;
let bar = 0;
let noiseBuf: AudioBuffer | null = null;

/** Elige la música según el mundo (se aplica en el siguiente compás, sin cortes). */
export function setMusicTheme(name: string) {
  if (THEMES[name]) theme = name;
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.9;
  // un poco de eco para que suene espacioso
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.25;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master);
  musicBus.connect(delay);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.5;
  sfxBus.connect(master);
  master.connect(ctx.destination);
  const len = Math.floor(ctx.sampleRate * 0.1);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

function pluck(
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  extra?: { harmonic?: number; vibrato?: boolean },
) {
  if (!ctx || !musicBus) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(musicBus);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.05);
  if (extra?.harmonic) {
    const h = ctx.createOscillator();
    const hg = ctx.createGain();
    h.type = "sine";
    h.frequency.value = freq * extra.harmonic;
    hg.gain.value = 0.35;
    h.connect(hg).connect(g);
    h.start(t);
    h.stop(t + dur + 0.05);
  }
  if (extra?.vibrato) {
    const l = ctx.createOscillator();
    const lg = ctx.createGain();
    l.frequency.value = 5.5;
    lg.gain.value = freq * 0.012;
    l.connect(lg).connect(o.frequency);
    l.start(t);
    l.stop(t + dur + 0.05);
  }
}

function noiseHit(t: number, vol: number, hp: number, dur: number) {
  if (!ctx || !musicBus || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(musicBus);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function lead(kind: Lead, freq: number, t: number, beat: number) {
  if (kind === "marimba")
    pluck(freq, t, beat * 0.9, "sine", 0.2, { harmonic: 4 });
  else if (kind === "whistle")
    pluck(freq * 2, t, beat * 1.1, "sine", 0.1, { vibrato: true });
  else {
    pluck(freq, t, beat * 1.2, "triangle", 0.15, { harmonic: 2 });
  }
}

function scheduleStep(i: number, t: number, th: Theme) {
  const beat = 60 / th.bpm;
  const chord = th.prog[bar % th.prog.length];
  const k = th.key;
  // bajo: tiempos 1 y 3 (y un saltito antes del compás siguiente)
  if (i === 0 || i === 4)
    pluck(NOTE(k + chord.root - 24), t, beat * 0.9, "triangle", 0.3);
  if (i === 6)
    pluck(NOTE(k + chord.root - 12), t, beat * 0.4, "triangle", 0.16);
  // bombo suave y maderita
  if (i === 0 || i === 4) pluck(110, t, 0.12, "sine", 0.18);
  if (i === 2 || i === 6) pluck(1500, t, 0.04, "sine", 0.05);
  // sonajero en cada corchea (más flojo en las pares)
  noiseHit(t, i % 2 ? 0.035 : 0.06, 6500, 0.05);
  // ukelele / arpegio
  const strum = () =>
    chord.notes.forEach((n, j) =>
      pluck(NOTE(k + n), t + j * 0.014, beat * 0.45, "triangle", 0.11, {
        harmonic: 2,
      }),
    );
  if (th.strum === "offbeat" && i % 2 === 1) strum();
  else if (th.strum === "bounce" && (i % 2 === 1 || i === 0 || i === 4))
    strum();
  else if (th.strum === "arp")
    pluck(
      NOTE(k + chord.notes[i % 3] + (i % 6 > 2 ? 12 : 0)),
      t,
      beat * 0.5,
      "triangle",
      0.1,
      { harmonic: 3 },
    );
  // melodía
  const melody =
    th.melodies[(Math.floor(bar / 2) + (bar % 2 ? 1 : 0)) % th.melodies.length];
  const degree = melody[i];
  if (degree !== null && degree !== undefined)
    lead(th.lead, NOTE(k + PENTA[degree]), t, beat);
  // campanita al cambiar de compás
  if (i === 0 && bar % 4 === 0)
    pluck(NOTE(k + 24), t + 0.02, 1.2, "sine", 0.05);
}

function scheduler() {
  if (!ctx || !musicOn) return;
  const th = THEMES[theme];
  const eighth = 60 / th.bpm / 2;
  while (nextTime < ctx.currentTime + 0.3) {
    const swung = nextTime + (step % 2 ? eighth * th.swing : 0);
    scheduleStep(step, swung, th);
    nextTime += eighth;
    step = (step + 1) % 8;
    if (step === 0) bar += 1;
  }
}

function startMusic() {
  const c = ensure();
  if (!c || !musicBus || musicOn) return;
  void c.resume();
  musicOn = true;
  step = 0;
  bar = 0;
  nextTime = c.currentTime + 0.1;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.5);
  scheduler();
  chordTimer = window.setInterval(scheduler, 80);
}

function stopMusic() {
  if (!ctx || !musicBus) return;
  musicOn = false;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  if (chordTimer) window.clearInterval(chordTimer);
  chordTimer = null;
}

/** Llamar en el primer toque del usuario: arranca la música si el sonido está activado. */
export function armAudio() {
  if (enabled) startMusic();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // sin almacenamiento: solo vale para esta visita
  }
  if (on) startMusic();
  else stopMusic();
  notify();
}

/** Pausa al cambiar de pestaña y reanuda al volver. */
export function setAudioVisible(visible: boolean) {
  if (!ctx) return;
  if (visible) void ctx.resume();
  else void ctx.suspend();
}

type Sfx = "step" | "turn" | "bump" | "win" | "fail" | "star" | "click";

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  slideTo?: number,
) {
  if (!ctx || !sfxBus) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Efectos cortos del juego. No suenan si el sonido está apagado. */
export function sfx(name: Sfx) {
  if (!enabled || !ensure() || !ctx) return;
  void ctx.resume();
  switch (name) {
    case "step":
      tone(
        NOTE(7 + Math.floor(Math.random() * 3) * 2),
        0,
        0.14,
        "triangle",
        0.22,
      );
      break;
    case "turn":
      tone(NOTE(12), 0, 0.1, "square", 0.08, NOTE(16));
      break;
    case "bump":
      tone(150, 0, 0.22, "sawtooth", 0.2, 70);
      break;
    case "click":
      tone(NOTE(19), 0, 0.06, "sine", 0.18);
      break;
    case "star":
      tone(NOTE(24), 0, 0.3, "sine", 0.22);
      tone(NOTE(31), 0.08, 0.35, "sine", 0.16);
      break;
    case "win":
      [0, 4, 7, 12, 16].forEach((n, i) =>
        tone(NOTE(n + 12), i * 0.11, 0.5, "triangle", 0.24),
      );
      break;
    case "fail":
      tone(NOTE(7), 0, 0.25, "sine", 0.2, NOTE(2));
      tone(NOTE(2), 0.2, 0.35, "sine", 0.18, NOTE(-3));
      break;
  }
}
