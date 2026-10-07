// Subtle haptics where the platform allows it. Android: Vibration API.
// iOS 18+: toggling a native switch control produces the system tick.
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let enabled = true;

export const setEnabled = (v) => { enabled = v; };

function iosTick() {
  const label = document.querySelector('.haptic-switch');
  if (label) label.click();
}

export function tap() {
  if (!enabled) return;
  if (navigator.vibrate) navigator.vibrate(8);
  else if (ios) iosTick();
}

export function success() {
  if (!enabled) return;
  if (navigator.vibrate) navigator.vibrate([10, 40, 14]);
  else if (ios) { iosTick(); setTimeout(iosTick, 90); }
}
