import { html } from './dom.js';
import { icon } from './icons.js';

let layer;
const active = [];
const showing = new Map(); // message → close, so the same message never stacks
let sticky = null;         // once nothing more can be saved, every message becomes this one

/** From now on, show this message instead of any other (except errors), and keep it up. */
export function stick(message, options) {
  sticky = { message, options: { ...options, duration: 0 } };
  return toast(message, sticky.options);
}

const recent = []; // { at, tone, close } for the messages of the last few seconds

/** A save failed: messages about it that already went up ("Saved", "Undo") are taken back. */
export function retract(ms = 3000) {
  const since = Date.now() - ms;
  for (const r of recent.splice(0)) if (r.at >= since && r.tone !== 'danger') r.close();
}

export function toast(message, options = {}) {
  if (sticky && message !== sticky.message && options.tone !== 'danger') return toast(sticky.message, sticky.options);
  if (showing.has(message)) return showing.get(message);
  const { action, tone = 'default', duration = action ? 6000 : 3600, icon: ic, onExpire } = options;
  layer ||= document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.innerHTML = String(html`
    ${ic ? html`<span class="toast-ic">${icon(ic, { size: 18 })}</span>` : ''}
    <span class="toast-msg">${message}</span>
    ${action ? html`<button class="toast-btn" type="button">${action.label}</button>` : ''}`);
  let used = false;
  const close = () => {
    if (!el.isConnected) return;
    if (!used) onExpire?.();
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
    showing.delete(message);
    const i = active.indexOf(close);
    if (i >= 0) active.splice(i, 1);
  };
  if (action) {
    el.querySelector('.toast-btn').addEventListener('click', () => { used = true; action.fn(); close(); });
  }
  while (active.length >= 2) active[0]();
  layer.appendChild(el);
  active.push(close);
  showing.set(message, close);
  recent.push({ at: Date.now(), tone, close });
  if (recent.length > 8) recent.shift();
  if (duration) setTimeout(close, duration);
  return close;
}
