// The stage every ceremony plays on: full screen, tap anywhere (or Escape) to skip, and under
// reduced motion a still summary card instead of the animation. Frame times are kept for the
// last ceremony so the tests can check it runs smoothly.
import { reducedMotion } from '../ui/motion.js';

let current = null;

/** Measure frame times while a ceremony plays. */
function meter() {
  const deltas = [];
  let last = performance.now();
  let on = true;
  const tick = (t) => { if (!on) return; deltas.push(t - last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  return () => { on = false; return deltas.slice(1); };
}

/**
 * Play a ceremony. `play(el)` builds the scene and returns { duration, animations } (Web
 * Animations it started); `still(el)` builds the reduced-motion card. Resolves when it ends,
 * is skipped, or is closed: { skipped }.
 */
export function stage({ name, label, play, still, tone = 'dark', closeLabel = 'Close' }) {
  current?.finish(true);
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = `stage stage--${tone}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', label);
    el.dataset.ceremony = name;
    document.body.appendChild(el);
    const still_ = reducedMotion();
    let anims = [];
    let timer = 0;
    const stop = still_ ? () => [] : meter();
    const finish = (skipped = false) => {
      if (!el.isConnected) return;
      clearTimeout(timer);
      anims.forEach((a) => { try { a.finish(); } catch { /* already done */ } });
      const frames = stop();
      window.__lifeos && (window.__lifeos.lastCeremony = { name, frames, skipped, still: still_ });
      removeEventListener('keydown', onKey);
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), still_ ? 0 : 220);
      if (current?.el === el) current = null;
      resolve({ skipped });
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); finish(true); } };
    addEventListener('keydown', onKey);
    current = { el, finish };
    if (still_) {
      still(el);
      el.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn--primary stage-close" data-stage-close>${closeLabel}</button>`);
      el.querySelector('[data-stage-close]').focus();
      el.addEventListener('click', (e) => { if (e.target.closest('[data-stage-close]')) finish(false); });
      return;
    }
    const run = play(el) || {};
    anims = run.animations || [];
    el.insertAdjacentHTML('beforeend', '<p class="stage-skip" aria-hidden="true">Tap to skip</p>');
    // A summary that stays (the season finale) ends on its last frame and waits: the first tap
    // jumps to that frame, the next one (or Close) leaves. Anything else closes when it's done.
    let ended = false;
    const toEnd = () => { ended = true; anims.forEach((a) => { try { a.finish(); } catch { /* done */ } }); el.classList.add('is-ended'); };
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-stage-close]')) { finish(false); return; }
      if (e.target.closest('button, a')) return;
      if (run.keep && !ended) toEnd(); else finish(true);
    });
    if (run.keep) timer = setTimeout(toEnd, run.duration || 2500);
    else timer = setTimeout(() => finish(false), run.duration || 2500);
  });
}

/** Skip whatever ceremony is playing. */
export const skip = () => current?.finish(true);

/** Animate one element with the Web Animations API and keep the handle. */
export function anim(list, el, keyframes, opts) {
  if (!el?.animate) return null;
  const a = el.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.2, .8, .2, 1)', ...opts });
  list.push(a);
  return a;
}

/** Count a number up inside an element (text only, on animation frames). */
export function countUp(el, from, to, { delay = 0, duration = 700, fmt = (v) => String(Math.round(v)) } = {}) {
  if (!el) return;
  if (reducedMotion()) { el.textContent = fmt(to); return; }
  el.textContent = fmt(from);
  const t0 = performance.now() + delay;
  const step = (t) => {
    if (!el.isConnected) return;
    const p = Math.min(1, Math.max(0, (t - t0) / duration));
    el.textContent = fmt(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
