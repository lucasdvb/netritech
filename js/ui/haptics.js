// Haptics map: one table from moments to feel, so the same kind of action always feels the same.
// Android uses the Vibration API; iOS 18+ ticks when a native switch control toggles.
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let enabled = true;

export const setEnabled = (v) => { enabled = v; };

/** Vibration pattern (ms) and iOS ticks for each moment. */
export const MAP = {
  tap: { pattern: [8], ticks: 1 },              // a tick undone, a step, a chip, a counter
  success: { pattern: [10, 40, 14], ticks: 2 }, // something done or saved
  hold: { pattern: [14], ticks: 1 },            // a hold was recognised
  threshold: { pattern: [6], ticks: 1 },        // a swipe passed the point where letting go acts
  commit: { pattern: [12, 30, 18], ticks: 2 },  // a swipe or hold action happened (not today)
  warn: { pattern: [20, 60, 20], ticks: 2 },    // nothing happened: it needs a choice or a fix
  seal: { pattern: [30, 40, 60], ticks: 3 },    // sealing the day
};

function iosTick() {
  document.querySelector('.haptic-switch')?.click();
}

// Something else may want to know (the optional sound palette listens here).
let listener = null;
export const onPlay = (fn) => { listener = fn; };

export function play(name) {
  listener?.(name);
  const m = MAP[name];
  if (!enabled || !m) return;
  // Only once you've touched the app: before that the browser refuses (a moment can arrive on its own).
  if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(m.pattern);
  else if (ios) for (let i = 0; i < m.ticks; i++) setTimeout(iosTick, i * 90);
}

export const tap = () => play('tap');
export const success = () => play('success');
export const hold = () => play('hold');
export const threshold = () => play('threshold');
export const commit = () => play('commit');
export const warn = () => play('warn');
