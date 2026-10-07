import { html } from './dom.js';
import { icon } from './icons.js';

let layer;
const active = [];

export function toast(message, { action, tone = 'default', duration = 3600, icon: ic } = {}) {
  layer ||= document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.innerHTML = String(html`
    ${ic ? html`<span class="toast-ic">${icon(ic, { size: 18 })}</span>` : ''}
    <span class="toast-msg">${message}</span>
    ${action ? html`<button class="toast-btn" type="button">${action.label}</button>` : ''}`);
  const close = () => {
    if (!el.isConnected) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
    const i = active.indexOf(close);
    if (i >= 0) active.splice(i, 1);
  };
  if (action) {
    el.querySelector('.toast-btn').addEventListener('click', () => { action.fn(); close(); });
  }
  while (active.length >= 2) active[0]();
  layer.appendChild(el);
  active.push(close);
  if (duration) setTimeout(close, duration);
  return close;
}
