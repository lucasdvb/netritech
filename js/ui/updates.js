// Works offline through a service worker. A new version downloads in the background; it's then
// applied the next time Life OS opens (nothing is on screen yet), or, mid-session, one message
// offers to switch to it. A version that finished downloading in an earlier session is offered too,
// so an update can never be stuck waiting. Loaded just after the first screen.
import { toast } from './toast.js';

let offered = null;

/** Offer the waiting version once; Update switches to it (the page reloads on the switch). */
function offer(worker) {
  if (!worker || offered === worker) return;
  offered = worker;
  toast('A new version of Life OS is ready.', {
    duration: 0,
    action: { label: 'Update', fn: () => worker.postMessage({ type: 'skip-waiting' }) },
  });
}

/** Nothing typed yet: the app has only just opened, so switching now loses nothing. */
const justOpened = () => performance.now() < 8000 && !document.querySelector('.sheet-wrap')
  && !(document.activeElement && document.activeElement.matches('input, textarea, select, [contenteditable]'));

export function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const ready = (worker) => {
      if (!navigator.serviceWorker.controller) return;
      if (justOpened()) worker.postMessage({ type: 'skip-waiting' });
      else offer(worker);
    };
    // Downloaded in an earlier session and still waiting.
    if (reg.waiting) ready(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => { if (nw.state === 'installed') ready(nw); });
    });
    // Look for a new version each time the app comes back to the front (at most every 30 minutes).
    let last = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || Date.now() - last < 30 * 60 * 1000) return;
      last = Date.now();
      reg.update().catch(() => {});
    });
  }).catch((err) => console.warn('Service worker not registered', err));
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install claims the page; only an update should reload.
    if (reloading || !hadController) return;
    reloading = true;
    location.reload();
  });
}
