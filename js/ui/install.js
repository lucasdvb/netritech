// A single, dismissible "Add to Home Screen" hint. Never repeats once dismissed.
import * as store from '../data/store.js';
import { html } from './dom.js';
import { icon } from './icons.js';

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ios = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferred = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
});

export const isInstalled = standalone;
export const canPromptNative = () => !!deferred;

export async function promptNative() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  return outcome === 'accepted';
}

export function maybePrompt() {
  const s = store.settings();
  if (!s || s.installDismissed || standalone()) return;
  if (!s.welcomed) return;
  setTimeout(() => {
    if (!ios() && !deferred) return;
    const el = document.createElement('aside');
    el.className = 'install-hint';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Add Life OS to your Home Screen');
    el.innerHTML = String(html`
      <div class="install-mark">${icon('orbit', { size: 22 })}</div>
      <div class="install-text">
        <p class="install-title">Add Life OS to your Home Screen</p>
        <p class="install-body">${ios()
          ? html`Tap ${icon('share', { size: 15, cls: 'inline-ic' })} Share, then “Add to Home Screen”. It opens full screen and works offline.`
          : 'Install it for a full-screen app that works offline.'}</p>
      </div>
      ${!ios() ? html`<button type="button" class="btn btn--primary btn--sm" data-install>Install</button>` : ''}
      <button type="button" class="icon-btn" data-dismiss aria-label="Dismiss">${icon('x', { size: 18 })}</button>`);
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-open'));
    const close = () => {
      store.setSettings({ installDismissed: true });
      el.classList.remove('is-open');
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector('[data-dismiss]').addEventListener('click', close);
    el.querySelector('[data-install]')?.addEventListener('click', async () => { await promptNative(); close(); });
  }, 2500);
}
