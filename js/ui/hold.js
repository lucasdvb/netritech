// Press and hold (G5, and commitments later): a ring fills while you hold; letting go early
// springs it back, so nothing this final happens by accident. Space or Enter held down works the
// same from a keyboard, and the label says what holding does.
import { html } from './dom.js';
import * as hap from './haptics.js';

export function holdButton({ label, action, ms = 1200, hint = 'Press and hold' }) {
  return html`<button type="button" class="hold-btn" data-hold="${action}" data-ms="${ms}" aria-label="${label}. ${hint}.">
    <span class="hold-ring" aria-hidden="true"><svg viewBox="0 0 72 72"><circle class="hold-track" cx="36" cy="36" r="32"/><circle class="hold-fill" cx="36" cy="36" r="32" pathLength="100"/></svg></span>
    <span class="hold-text"><span class="hold-label">${label}</span><span class="hold-hint">${hint}</span></span>
  </button>`;
}

/** Wire every [data-hold] inside root; onDone(action, el) runs when a hold completes. */
export function attachHold(root, onDone) {
  let cur = null;
  const stop = () => {
    if (!cur) return;
    cancelAnimationFrame(cur.raf);
    const { el, p } = cur;
    cur = null;
    el.classList.remove('is-holding');
    el.style.setProperty('--hold', '0');
    // A tap instead of a hold: say how it works.
    if (p < 0.25) { el.classList.add('is-hinting'); setTimeout(() => el.classList.remove('is-hinting'), 1400); }
  };
  const start = (el) => {
    if (cur || el.disabled || el.classList.contains('is-done')) return;
    const ms = Number(el.dataset.ms) || 1200;
    const t0 = performance.now();
    el.classList.add('is-holding');
    hap.hold();
    cur = { el, p: 0, raf: 0 };
    const tick = (t) => {
      if (!cur || cur.el !== el) return;
      cur.p = Math.min(1, (t - t0) / ms);
      el.style.setProperty('--hold', String(cur.p));
      if (cur.p < 1) { cur.raf = requestAnimationFrame(tick); return; }
      cur = null;
      el.classList.remove('is-holding');
      el.classList.add('is-done');
      hap.play('seal');
      onDone(el.dataset.hold, el);
    };
    cur.raf = requestAnimationFrame(tick);
  };
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-hold]');
    if (!el || e.button > 0) return;
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    start(el);
  });
  root.addEventListener('pointerup', stop);
  root.addEventListener('pointercancel', stop);
  root.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-hold]')) e.preventDefault(); });
  root.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('[data-hold]');
    if (!el || (e.key !== ' ' && e.key !== 'Enter')) return;
    e.preventDefault();
    if (!e.repeat) start(el);
  });
  root.addEventListener('keyup', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('[data-hold]')) stop(); });
}
