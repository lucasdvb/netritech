// The focus timer wherever you are: a small pill above the tab bar while a block runs. Tap it for
// the timer. When time is up the block is counted, with a tap and (if it's on) a soft sound.
import * as F from '../domain/focus.js';
import { app } from './app-api.js';
import * as hap from './haptics.js';
import { html } from './dom.js';
import { icon } from './icons.js';

let el = null;
let timer = 0;

function remove() {
  clearInterval(timer);
  el?.remove();
  el = null;
  document.documentElement.classList.remove('has-focus-bar');
}

function paint(t) {
  const left = F.remaining(t);
  el.innerHTML = String(html`<button type="button" class="focus-bar-main" data-fb="open" aria-label="Focus timer, ${F.clock(left)} left${t.pausedAt ? ', paused' : ''}. Open">
      ${icon('timer', { size: 18 })}<span class="focus-bar-time tnum">${F.clock(left)}</span><span class="focus-bar-label">${t.pausedAt ? 'Paused' : t.label || 'Focus'}</span></button>
    <button type="button" class="focus-bar-btn" data-fb="${t.pausedAt ? 'resume' : 'pause'}" aria-label="${t.pausedAt ? 'Resume' : 'Pause'}">${icon(t.pausedAt ? 'play' : 'pause', { size: 18 })}</button>`);
}

function tick() {
  const t = F.current();
  if (!t) { remove(); return; }
  if (F.remaining(t) === 0 && !t.pausedAt) { done(); return; }
  const time = el?.querySelector('.focus-bar-time');
  if (time) time.textContent = F.clock(F.remaining(t));
}

const done = () => announce(F.finish());

function announce(r) {
  remove();
  if (!r) return;
  hap.play('success');
  import('./sound.js').then((s) => s.play?.('moment')).catch(() => {});
  const text = `Focus block done · ${r.minutes} min${r.blocks > 1 ? ` · ${r.blocks} today` : ''}`;
  app.toast(text, { icon: 'check' });
  if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification('Life OS', { body: text, tag: 'focus' }); } catch { /* not allowed here */ }
  }
}

async function onClick(e) {
  const b = e.target.closest('[data-fb]');
  if (!b) return;
  const what = b.dataset.fb;
  if (what === 'pause') F.pause();
  else if (what === 'resume') F.resume();
  else if (what === 'open') { (await import('../screens/focus-sheet.js')).openFocus(); return; }
  hap.play('tap');
  sync();
}

/** Show, update or hide the pill to match the timer. A block that ran out while away is counted. */
export function sync() {
  const ended = F.settle();
  if (ended) { announce(ended); return; }
  const t = F.current();
  if (!t) { remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.className = 'focus-bar';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Focus timer');
    el.addEventListener('click', onClick);
    document.body.append(el);
    document.documentElement.classList.add('has-focus-bar');
  }
  paint(t);
  clearInterval(timer);
  if (!t.pausedAt) timer = setInterval(tick, 1000);
}
