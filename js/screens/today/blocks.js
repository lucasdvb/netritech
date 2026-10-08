// The rest of Today: your three, pinned actions, other habits (folded), and the minimum and
// sick day lists.
import * as store from '../../data/store.js';
import * as M from '../../domain/metrics-core.js';
import * as H from '../../domain/habits.js';
import * as R from '../../domain/routines.js';
import { SECTIONS } from '../../domain/taxonomy.js';
import { today, fmtTime } from '../../domain/dates.js';
import { html, cx, dataAttrs } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { num, litres } from '../../ui/format.js';
import { habitGroup, metricTile, habitRow, METRIC_SOURCES } from './rows.js';

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
/** "Eight": the number of minimum-day essentials, in words. */
export const essentials = () => { const n = H.activeHabits().filter((h) => h.mvd).length; return WORDS[n] || String(n); };

/* ---------- your three (when they aren't steps of a routine) ---------- */
export function threeBlock(date, mode, ui) {
  if (mode === 'sick' || mode === 'minimum') return '';
  const focus = H.focusHabits(date);
  if (!focus.length) {
    const until = store.settings().focusPromptUntil;
    if (date !== today() || (until && today() < until)) return '';
    return html`<section class="choose3" data-key="three" aria-label="Choose your three">
      <h2 class="block-title">Choose your three</h2>
      <p class="card-lead">Pick up to three habits to train. They count in your score. Everything else keeps running on autopilot and never counts against you.</p>
      <div class="btn-row"><button type="button" class="btn btn--primary" data-action="nav" data-to="plan/habits/sort">Choose</button>
        <button type="button" class="btn btn--ghost" data-action="focus-later">Not now</button></div>
    </section>`;
  }
  const loose = focus.filter((h) => !R.inRoutine(h.id));
  const due = loose.filter((h) => H.dueOn(h, date, mode) && h.source !== 'top3');
  const inRoutines = focus.length - loose.length;
  if (!due.length && !inRoutines) return '';
  const doneN = due.filter((h) => H.counts(h, date, mode)).length;
  return html`<section class="${cx('focus3', due.length && doneN === due.length && 'is-complete')}" data-key="three" aria-label="Your three">
    <div class="block-head"><h2 class="block-title">Your three</h2>
      <span class="block-meta tnum">${due.length ? `${doneN} of ${due.length}` : ''}</span>
      <button type="button" class="link-btn" data-action="nav" data-to="plan/habits/sort">Change</button></div>
    ${due.length ? habitGroup(due, date, mode, ui, { focus: true }) : ''}
    ${inRoutines ? html`<p class="focus3-off">${inRoutines === 1 ? 'One is a step' : `${WORDS[inRoutines]} are steps`} in your routines.</p>` : ''}
  </section>`;
}

/* ---------- pinned actions (up to six, chosen and ordered in Edit Today) ---------- */
export const PINS = {
  water: { ic: 'droplet', label: 'Water', quick: 'adds 500 ml', act: 'add-water', data: { ml: 500 }, value: (d) => litres(M.waterMl(d)) },
  food: { ic: 'utensils', label: 'Protein', act: 'log-food', value: (d) => `${num(M.nutrition(d).protein)} g` },
  steps: { ic: 'footprints', label: 'Steps', act: 'log-steps', value: (d) => (M.steps(d) != null ? num(M.steps(d)) : 'Add') },
  weight: { ic: 'scale', label: 'Weight', act: 'log-weight', value: (d) => (M.weight(d) != null ? `${num(M.weight(d), 1)} kg` : 'Log') },
  workout: { ic: 'dumbbell', label: 'Workout', act: 'pin-workout', value: () => 'Start' },
  checkin: { ic: 'sunrise', label: 'Check-in', act: 'open-checkin', value: (d) => (M.sleep(d) || M.mood(d) ? 'Done' : '30 sec') },
  journal: { ic: 'notebook-pen', label: 'Journal', act: 'pin-journal', value: () => 'Write' },
  reading: { ic: 'book-open', label: 'Reading', act: 'pin-reading', value: (d) => (M.mindMinutes(d) ? `${M.mindMinutes(d)} min` : 'Log') },
  meditation: { ic: 'leaf', label: 'Meditation', act: 'pin-meditation', value: (d) => (M.meditationMinutes(d) ? `${M.meditationMinutes(d)} min` : 'Log') },
  task: { ic: 'list-todo', label: 'Task', act: 'task-new', value: () => 'New' },
};
export const DEFAULT_PINS = ['water', 'food', 'steps'];
export const MAX_PINS = 6;
export const pinsOf = () => (store.settings().pinned || DEFAULT_PINS).filter((k) => PINS[k]).slice(0, MAX_PINS);

export function pinnedBlock(date) {
  const pins = pinsOf();
  if (!pins.length) return '';
  return html`<section class="pins pins--${pins.length === 4 ? 2 : Math.min(3, pins.length)}" data-key="pinned" aria-label="Pinned actions">${pins.map((k) => {
    const p = PINS[k];
    return html`<button type="button" class="pin" data-action="${p.act}"${dataAttrs(p.data)} data-key="pin-${k}">
      <span class="pin-top"><span class="pin-ic">${icon(p.ic, { size: 18 })}</span>${p.quick ? html`<span class="pin-quick" aria-hidden="true">${icon('plus', { size: 14 })}</span>` : ''}</span><span class="pin-label">${p.label}</span><span class="pin-val tnum">${p.value(date)}</span>${p.quick ? html`<span class="sr-only">, tap ${p.quick}</span>` : ''}</button>`;
  })}</section>`;
}

/* ---------- other habits (autopilot), folded ---------- */
export function moreBlock(date, mode, ui) {
  if (mode === 'sick' || mode === 'minimum') return '';
  const rest = H.activeHabits().filter((h) => H.dueOn(h, date, mode) && h.source !== 'top3' && H.stateOf(h, date) !== 'focus' && !R.inRoutine(h.id));
  if (!rest.length) return '';
  const open = !!ui.moreOpen;
  const doneN = rest.filter((h) => H.counts(h, date, mode)).length;
  return html`<section class="${cx('more-today', open && 'is-open')}" data-key="more" aria-label="Other habits, on autopilot">
    <button type="button" class="more-head" data-action="more-today" aria-expanded="${open}">
      <span class="more-title">Other habits</span>
      <span class="more-meta tnum">${doneN} of ${rest.length}</span>
      ${icon('chevron-down', { size: 18, cls: 'routine-chev' })}
    </button>
    ${open ? html`<div class="more-body">${SECTIONS.map((sec) => {
      const list = rest.filter((h) => h.section === sec.id);
      if (!list.length) return '';
      return html`<div class="more-group" data-key="mg-${sec.id}"><p class="section-label">${sec.label}</p>${habitGroup(list, date, mode, ui)}</div>`;
    })}</div>` : ''}
  </section>`;
}

/** Habits set aside for today, each one tap from coming back. */
export function notTodayBlock(date, mode) {
  if (mode === 'sick') return '';
  const list = H.activeHabits().filter((h) => H.skipped(h, date, mode));
  if (!list.length) return '';
  return html`<section class="nottoday" data-key="nottoday" aria-label="Not today">
    <p class="nottoday-label">Not today</p>
    <div class="nottoday-chips">${list.map((h) => html`<button type="button" class="chip" data-action="unskip-habit" data-id="${h.id}" data-key="nt-${h.id}" aria-label="Bring back ${h.name}">${icon('plus', { size: 15 })}${h.name}</button>`)}</div>
  </section>`;
}

/* ---------- minimum and sick days ---------- */
export function minimumBlock(date, ui) {
  const list = H.activeHabits().filter((h) => H.dueOn(h, date, 'minimum'));
  const tiles = list.filter((h) => METRIC_SOURCES.includes(h.source));
  const rows = list.filter((h) => !tiles.includes(h));
  return html`<section class="minday" data-key="minday">
    <div class="minday-head"><p class="minday-title">${essentials()} essentials</p><p class="minday-sub">Never abandon the system completely. This is enough today.</p></div>
    ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, 'minimum'))}</div>` : ''}
    <ul class="hlist">${rows.map((h) => habitRow(h, date, 'minimum', ui))}</ul>
    <button type="button" class="link-btn" data-action="set-mode" data-mode="normal">Back to a normal day</button>
  </section>`;
}

export function sickBlock(date, ui) {
  const list = H.activeHabits().filter((h) => H.dueOn(h, date, 'sick'));
  const tiles = list.filter((h) => METRIC_SOURCES.includes(h.source));
  const rows = list.filter((h) => !tiles.includes(h));
  return html`<section class="minday minday--sick" data-key="sick">
    <div class="minday-head"><p class="minday-title">Rest. Fluids. Food. Sleep.</p>
      <p class="minday-sub">No hard training, no calorie deficit, no forced cardio. Get medical care if you need it. Training resumes gradually.</p></div>
    ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, 'sick'))}</div>` : ''}
    <ul class="hlist">${rows.map((h) => habitRow(h, date, 'sick', ui))}</ul>
    <button type="button" class="link-btn" data-action="set-mode" data-mode="normal">I’m feeling better</button>
  </section>`;
}

/** "Life mode" once work is closed for the day. */
export const lifeMode = (date) => {
  const r = M.review(date);
  return r?.shutdown?.done ? html`<p class="mode-shift">${icon('moon', { size: 16 })}<span><strong>Life mode</strong> · work closed at ${fmtTime(new Date(r.shutdown.at))}</span></p>` : '';
};

/* ---------- your layout (Edit Today) ---------- */
export const BLOCKS = [
  { id: 'routines', label: 'Routines', column: 'now' },
  { id: 'three', label: 'Your three', column: 'now' },
  { id: 'priorities', label: 'Priorities and tasks', column: 'day' },
  { id: 'pinned', label: 'Pinned actions', column: 'day' },
  { id: 'more', label: 'Other habits', column: 'day' },
];
/** Block order and hidden blocks, with any block added since you last edited Today at the end. */
export function layoutOf() {
  const l = store.settings().todayLayout || {};
  const ids = BLOCKS.map((b) => b.id);
  const order = [...(l.order || []).filter((id) => ids.includes(id)), ...ids.filter((id) => !(l.order || []).includes(id))];
  return { order, hidden: (l.hidden || []).filter((id) => ids.includes(id)) };
}
