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
let bellTimer: number | null = null;
let chordIndex = 0;

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

// Escala pentatónica en Do: nunca suena mal, aunque se combine al azar
const NOTE = (semi: number) => 261.63 * Math.pow(2, semi / 12);
const CHORDS = [
  [0, 4, 7, 11], // Cmaj7
  [-3, 0, 4, 7], // Am7
  [-7, -3, 0, 4], // Fmaj7
  [-5, -1, 2, 7], // G6
];
const BELLS = [12, 14, 16, 19, 21, 24];

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
  delay.delayTime.value = 0.34;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
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
  return ctx;
}

function playChord() {
  if (!ctx || !musicBus) return;
  const chord = CHORDS[chordIndex % CHORDS.length];
  chordIndex += 1;
  const t = ctx.currentTime;
  const dur = 8;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.1, t + 2.5);
  g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
  filter.connect(g).connect(musicBus);
  for (const semi of chord) {
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = NOTE(semi - 12);
      o.detune.value = detune;
      o.connect(filter);
      o.start(t);
      o.stop(t + dur + 1.6);
    }
  }
}

function playBell() {
  if (!ctx || !musicBus) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = NOTE(BELLS[Math.floor(Math.random() * BELLS.length)]);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + 2.5);
}

function scheduleBell() {
  bellTimer = window.setTimeout(
    () => {
      if (!musicOn) return;
      playBell();
      scheduleBell();
    },
    2200 + Math.random() * 3800,
  );
}

function startMusic() {
  const c = ensure();
  if (!c || !musicBus || musicOn) return;
  void c.resume();
  musicOn = true;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.linearRampToValueAtTime(0.55, c.currentTime + 3);
  playChord();
  chordTimer = window.setInterval(playChord, 8000);
  scheduleBell();
}

function stopMusic() {
  if (!ctx || !musicBus) return;
  musicOn = false;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  if (chordTimer) window.clearInterval(chordTimer);
  if (bellTimer) window.clearTimeout(bellTimer);
  chordTimer = bellTimer = null;
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
