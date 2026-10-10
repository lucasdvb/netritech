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

const recent = []; // the last few messages: { at, tone, close }

// Recent changes: everything this session offered Undo for, so it can still be undone after its
// message has gone (You › Recent changes). Kept in memory only; a change whose message commits it
// for good when it leaves (onExpire) isn't kept.
const changes = [];
export const recentChanges = () => changes.slice().reverse();
/** Undo one recent change (once). */
export function undoChange(entry) {
  if (!entry || entry.used) return false;
  entry.used = true;
  entry.fn();
  return true;
}

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
  const entry = action && /^undo$/i.test(action.label) && !onExpire ? { message, at: Date.now(), used: false, fn: action.fn } : null;
  if (entry) { changes.push(entry); if (changes.length > 30) changes.shift(); }
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
    el.querySelector('.toast-btn').addEventListener('click', () => {
      used = true;
      if (entry) { if (!entry.used) undoChange(entry); } else action.fn();
      close();
    });
  }
  let timer = 0;
  const arm = (ms) => { clearTimeout(timer); if (duration) timer = setTimeout(close, ms); };
  swipeAway(el, close, () => clearTimeout(timer), () => arm(1500));
  while (active.length >= 2) active[0]();
  layer.appendChild(el);
  active.push(close);
  showing.set(message, close);
  recent.push({ at: Date.now(), tone, close });
  if (recent.length > 8) recent.shift();
  arm(duration);
  return close;
}

/**
 * Swipe a message away (left, right or down) to clear it before its time is up. While a finger is on
 * it the timer waits; let go short of the threshold and it springs back and leaves soon after. A change
 * swiped away stays undoable from You › Recent changes.
 */
function swipeAway(el, close, hold, release) {
  let start = null;
  let dx = 0;
  let dy = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.toast-btn')) return;
    start = { x: e.clientX, y: e.clientY, t: performance.now() };
    dx = 0; dy = 0;
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('is-dragging');
    hold();
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    dx = e.clientX - start.x;
    dy = Math.max(0, e.clientY - start.y);
    const sideways = Math.abs(dx) >= dy;
    const d = sideways ? Math.abs(dx) : dy;
    el.style.transform = sideways ? `translateX(${dx}px)` : `translateY(${dy}px)`;
    el.style.opacity = String(Math.max(0.2, 1 - d / 220));
  });
  const end = () => {
    if (!start) return;
    const ms = Math.max(1, performance.now() - start.t);
    const sideways = Math.abs(dx) >= dy;
    const d = sideways ? Math.abs(dx) : dy;
    start = null;
    el.classList.remove('is-dragging');
    if (d > 72 || (d > 24 && d / ms > 0.5)) {
      el.style.transform = sideways ? `translateX(${Math.sign(dx) * (el.offsetWidth + 40)}px)` : `translateY(${el.offsetHeight + 40}px)`;
      el.style.opacity = '0';
      el.classList.add('is-swiped');
      close();
      return;
    }
    el.style.transform = '';
    el.style.opacity = '';
    release();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
