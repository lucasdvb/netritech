// Works offline through a service worker. A new version downloads in the background and takes
// over as soon as it's ready (sw.js). The page then reloads into it: at once if the app has only
// just opened or nothing is being typed; otherwise when you next leave the app, with a message
// offering to reload now. The app looks for a new version when it opens and each time it comes
// back to the front. Loaded just after the first screen.
import { toast } from './toast.js';
import * as store from '../data/store.js';

/** Something is being typed or edited: a reload now could lose it. */
const busy = () => !!document.querySelector('.sheet-wrap')
  || !!(document.activeElement && document.activeElement.matches('input, textarea, select, [contenteditable]'));

let reloading = false;
async function reload() {
  if (reloading) return;
  reloading = true;
  try { await store.flush(); } catch { /* saved as far as it could be */ }
  location.reload();
}

export function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    // A version left waiting by an older release: let it take over.
    if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage({ type: 'skip-waiting' });
    reg.update().catch(() => {});
    // Look again each time the app comes back to the front (at most every 10 minutes).
    let last = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || Date.now() - last < 10 * 60 * 1000) return;
      last = Date.now();
      reg.update().catch(() => {});
    });
  }).catch((err) => console.warn('Service worker not registered', err));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install claims the page; only an update should reload.
    if (!hadController) return;
    if (!busy()) { reload(); return; }
    toast('Life OS has been updated.', { duration: 0, action: { label: 'Reload', fn: reload } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) reload(); });
  });
}
