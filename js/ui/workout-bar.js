// While a workout is running and you've left it, a small bar sits above the tab bar on every
// screen: the workout, the rest still to go (or the session's time, paused while you're away), and a
// tap back into gym mode. Loaded only when there's a workout under way.
import * as store from '../data/store.js';
import { activeMs, clockText } from '../domain/session-clock.js';
import { html } from './dom.js';
import { icon } from './icons.js';

let el = null;
let tick = null;
const active = () => store.all('workouts').find((w) => w.status === 'active') || null;
const restLeft = (w) => (w?.restUntil ? Math.max(0, Math.ceil((Date.parse(w.restUntil) - Date.now()) / 1000)) : 0);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function draw() {
  const w = active();
  if (!w || !el) { hide(); return; }
  const rest = restLeft(w);
  el.innerHTML = String(html`<a class="wbar-link" href="#/workout/${w.id}/gym" aria-label="Back to ${w.title}${rest ? `, rest ${mmss(rest)} left` : ''}">
    <span class="wbar-ic">${icon('dumbbell', { size: 18 })}</span>
    <span class="wbar-text"><span class="wbar-title">${w.title}</span><span class="wbar-sub tnum">${rest ? `Rest ${mmss(rest)}` : `${clockText(activeMs(w))} · paused while you’re away`}</span></span>
    <span class="wbar-go">${icon('chevron-right', { size: 18 })}</span></a>`);
}

function hide() {
  clearInterval(tick);
  tick = null;
  el?.remove();
  el = null;
  document.body.classList.remove('has-wbar');
}

/** Show the bar when there's a workout under way and you're not on it; otherwise take it away. */
export function sync(away) {
  if (!away || !active()) { hide(); return; }
  if (!el) {
    el = document.createElement('div');
    el.className = 'wbar';
    el.dataset.key = 'wbar';
    document.body.append(el);
    document.body.classList.add('has-wbar');
  }
  draw();
  if (!tick) tick = setInterval(draw, 1000);
}
