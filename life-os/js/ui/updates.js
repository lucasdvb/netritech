// Works offline through a service worker; when a new version has downloaded, one message offers
// to switch to it. Loaded just after the first screen.
import { toast } from './toast.js';

export function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A new version of Life OS is ready.', {
            duration: 0,
            action: { label: 'Update', fn: () => nw.postMessage({ type: 'skip-waiting' }) },
          });
        }
      });
    });
  }).catch((err) => console.warn('Service worker not registered', err));
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install claims the page; only an update (user tapped Update) should reload.
    if (reloading || !hadController) return;
    reloading = true;
    location.reload();
  });
}
