// The optional sound palette: three soft sounds made in the browser (nothing is downloaded), off
// by default and switched on in Settings. A tick for a completion, a two-note chime for a moment,
// and a low warm chord for sealing the day or a ceremony.
import * as store from '../data/store.js';

let ctx = null;
export const enabled = () => store.settings()?.sound === true;

function audio() {
  if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** One soft note: a sine with a quick attack and a gentle fade. */
function note(freq, { at = 0, dur = 0.35, gain = 0.08, type = 'sine' } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const SOUNDS = {
  tick: () => note(1320, { dur: 0.08, gain: 0.04 }),
  moment: () => { note(784, { dur: 0.5, gain: 0.06 }); note(1175, { at: 0.12, dur: 0.7, gain: 0.05 }); },
  seal: () => { [196, 247, 294, 392].forEach((f, i) => note(f, { at: i * 0.03, dur: 1.6, gain: 0.05, type: i ? 'sine' : 'triangle' })); },
};

export function play(name) {
  if (!enabled()) return;
  try { SOUNDS[name]?.(); } catch { /* sound is never essential */ }
}
