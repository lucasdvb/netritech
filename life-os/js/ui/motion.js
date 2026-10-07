// Motion system: durations, easings and real spring curves, shared by CSS and JS.
// Springs are expressed as CSS linear() easings sampled from a damped spring, so they
// work in CSS transitions and in the Web Animations API alike. The same strings are
// written into css/tokens.css (a unit test keeps the two in step).

export const DURATION = { instant: 80, fast: 140, med: 240, slow: 380 };

export const EASE = {
  standard: 'cubic-bezier(.2, .8, .2, 1)',
  enter: 'cubic-bezier(.16, 1, .3, 1)',
  exit: 'cubic-bezier(.4, 0, 1, 1)',
};

/**
 * Sample a damped spring moving from 0 to 1.
 * Returns the time it takes to settle (ms) and a CSS linear() easing for that duration.
 */
export function spring({ stiffness = 300, damping = 24, mass = 1, points = 40, precision = 0.005 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const at = (t) => {
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t); // critically damped (or heavier)
  };
  // Settled once it stays within `precision` of rest for the rest of a 50 ms window.
  let settle = 0;
  for (let t = 0; t < 3; t += 0.001) {
    if (Math.abs(1 - at(t)) > precision) settle = t + 0.05;
  }
  const values = [];
  for (let i = 0; i <= points; i++) values.push(i === points ? 1 : Math.round(at((settle * i) / points) * 1000) / 1000);
  return { duration: Math.round(settle * 1000), easing: `linear(${values.join(', ')})` };
}

// Snappy: presses, checks and toggles, with a small overshoot. Gentle: sheets and morphs.
export const SPRINGS = {
  snappy: spring({ stiffness: 600, damping: 34 }), // ~330 ms, about 5% overshoot
  gentle: spring({ stiffness: 260, damping: 30 }), // ~430 ms, no overshoot
};

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate with the Web Animations API. Under reduced motion, movement becomes a short fade
 * (or nothing, for animations that only move). Resolves when finished; never rejects.
 */
export function animate(el, keyframes, { duration = DURATION.med, easing = EASE.standard, ...opts } = {}) {
  if (!el?.animate) return Promise.resolve();
  if (reducedMotion()) {
    const fades = keyframes.every((k) => 'opacity' in k);
    if (!fades) return Promise.resolve();
    keyframes = keyframes.map((k) => ({ opacity: k.opacity }));
    duration = 120;
  }
  const a = el.animate(keyframes, { duration, easing, fill: 'both', ...opts });
  return a.finished.then(() => a.commitStyles?.()).catch(() => {}).finally(() => a.cancel());
}

/**
 * FLIP: measure elements, change the DOM, then animate each from where it was to where
 * it is now, using only transforms (no layout work during the animation).
 */
export function flip(elements, mutate, { duration = DURATION.med, easing = SPRINGS.gentle.easing } = {}) {
  const els = [...elements].filter(Boolean);
  const before = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
  mutate();
  if (reducedMotion()) return Promise.resolve();
  return Promise.all(els.filter((el) => el.isConnected).map((el) => {
    const a = before.get(el);
    const b = el.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (!dx && !dy) return null;
    return el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing }).finished.catch(() => {});
  }));
}
