// Rows shared by every block on Today: habit rows, metric tiles, counters and weekly chips.
import * as store from '../../data/store.js';
import * as M from '../../domain/metrics.js';
import * as H from '../../domain/habits.js';
import { trainingCall } from '../../domain/day-plan.js';
import { habitColor } from '../../domain/taxonomy.js';
import { durationHM } from '../../domain/dates.js';
import { html, raw, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { ring, check } from '../../ui/components.js';
import { num, habitValue, habitTarget } from '../../ui/format.js';

export const METRIC_SOURCES = ['water', 'protein', 'steps', 'produce'];
export const COUNTER_SOURCES = ['deepWork', 'breaks', 'eyeBreaks'];

export function metricTile(h, date, mode) {
  const v = H.value(h, date) || 0;
  const tgt = H.displayTarget(h, date, mode);
  const done = H.isDone(h, date, mode);
  const valText = h.unit === 'ml' ? num(v / 1000, 1) : num(v);
  const tgtText = h.unit === 'ml' ? `${num(tgt / 1000, 1)} L` : h.unit === 'steps' ? `${num(tgt / 1000, tgt % 1000 ? 1 : 0)}k` : `${num(tgt)}${h.unit === 'g' ? ' g' : ''}`;
  const quick = h.source === 'water';
  return html`<div class="${cx('tile', done && 'is-done', quick && 'has-quick')}" data-key="tile-${h.id}" style="--tile:${habitColor(h)}">
    <button type="button" class="tile-main" data-action="source" data-id="${h.id}" aria-label="${h.name}: ${habitValue(h, v)} of ${habitTarget(h, tgt)}">
      <span class="tile-ring">${ring(H.progress(h, date, mode), { size: 44, stroke: 4, color: 'var(--tile)' })}<span class="tile-ic">${done ? icon('check', { size: 16, stroke: 2.2 }) : icon(h.icon, { size: 16 })}</span></span>
      <span class="tile-text"><span class="tile-name">${h.name}</span><span class="tile-val tnum">${valText}<small> / ${tgtText}</small></span></span>
    </button>
    ${quick ? html`<button type="button" class="tile-add" data-action="add-water" data-ml="500" aria-label="Add 500 ml of water">+500</button>` : ''}
  </div>`;
}

export function counterRow(h, date, mode) {
  const v = H.value(h, date) || 0;
  const tgt = H.displayTarget(h, date, mode);
  return html`<div class="${cx('counter', H.isDone(h, date, mode) && 'is-done')}" data-key="${h.id}" style="--ic:${habitColor(h)}">
    <span class="row-ic">${icon(h.icon, { size: 17 })}</span>
    <button type="button" class="counter-main" data-action="habit" data-id="${h.id}"><span class="row-title">${h.name}</span><span class="row-sub tnum">${v} of ${tgt} ${h.unit}</span></button>
    <div class="counter-ctl">
      <button type="button" class="icon-btn icon-btn--sm" data-action="counter" data-source="${h.source}" data-delta="-1" aria-label="${h.name}: one less"${v <= 0 ? raw(' disabled') : ''}>${icon('minus', { size: 16 })}</button>
      <span class="counter-val tnum" aria-live="polite">${v}</span>
      <button type="button" class="icon-btn icon-btn--sm icon-btn--filled" data-action="counter" data-source="${h.source}" data-delta="1" aria-label="${h.name}: add one">${icon('plus', { size: 16 })}</button>
    </div>
  </div>`;
}

export function habitRow(h, date, mode, ui, { focus = false } = {}) {
  const done = H.isDone(h, date, mode);
  const lv = H.level(h, date, mode);
  const l = H.log(h.id, date);
  const tiny = H.tinyOf(h);
  const name = (mode === 'minimum' || H.tinyPlan(h, date)) && tiny?.label && !h.source ? tiny.label : h.name;
  let sub = '';
  if (h.id === 'h-training') {
    const call = trainingCall(date);
    sub = call.kind === 'done' ? `${call.title} · logged` : mode === 'minimum' ? 'Basic movement' : `${call.title} · ${store.profile().trainTime || h.time}`;
  } else if (h.source === 'sleep') {
    const sl = M.sleep(date);
    sub = sl ? `${durationHM(sl.hours * 60)}${sl.quality ? ` · quality ${sl.quality}/10` : ''}` : 'From your morning check-in';
  } else if (h.checklist?.length) {
    const n = h.checklist.filter((_, i) => l?.checklist?.[i]).length;
    sub = done ? 'Done' : n ? `${n} of ${h.checklist.length} steps` : h.time ? h.time : `${h.checklist.length} steps`;
  } else if (h.source === 'mind') {
    const m = M.mindMinutes(date);
    sub = m ? `${m} of ${h.target} min logged` : `${h.target} min${h.time ? ` · ${h.time}` : ''}`;
  } else if (h.source?.startsWith('rel:')) {
    const n = M.relationship(date, h.source.slice(4)).length;
    sub = n ? 'Logged' : h.mvd && mode === 'minimum' ? '' : h.time ? `${h.time} · phone away` : '';
  } else if (h.type === 'check') {
    sub = H.value(h, date) === 0 ? 'Not today' : 'Yes / no';
  } else if (H.isFlexible(h)) {
    sub = H.periodLabel(h, date);
  } else {
    sub = h.time || '';
  }
  if (lv === 'tiny') sub = tiny?.label ? `Tiny version · ${tiny.label}` : 'Tiny version';
  else if (focus && !lv) {
    // Runs survive one miss; after a miss the row asks, quietly, for the next one.
    const r = H.runs(h, date);
    const run = r.missesInRow === 1 ? 'Don’t miss twice' : r.current >= 3 ? `${r.current}-${r.unit} run` : '';
    sub = [sub, run].filter(Boolean).join(' · ');
  }
  const expanded = ui.expanded?.[h.id];
  const state = h.type === 'check' && H.value(h, date) === 0 ? 'no' : lv === 'tiny' ? 'tiny' : undefined;
  const isSleep = h.source === 'sleep';
  const canTiny = focus && !lv && tiny && !isSleep && h.type !== 'check';
  // Hold for an amount or the tiny version; swipe left for "not today" (not once it's done).
  return html`<li class="${cx('hrow', done && 'is-done', expanded && 'is-expanded')}" data-key="${h.id}" data-habit="${h.id}" data-swipe="${lv ? 'off' : 'on'}" style="--ic:${habitColor(h)}">
    ${isSleep
      ? html`<span class="${cx('auto-ic', done && 'is-done')}">${done ? icon('check', { size: 16, stroke: 2.2 }) : icon('bed', { size: 16 })}</span>`
      : check(done, { action: 'toggle', data: { id: h.id }, label: `${name}${done ? ', done' : lv === 'tiny' ? ', tiny version done' : ''}`, color: habitColor(h), state })}
    <button type="button" class="hrow-main" data-action="habit" data-id="${h.id}">
      <span class="hrow-name">${name}</span>
      ${sub ? html`<span class="hrow-sub">${sub}</span>` : ''}
    </button>
    ${canTiny || h.checklist?.length ? html`<span class="hrow-tools">
      ${canTiny ? html`<button type="button" class="tiny-btn" data-action="tiny" data-id="${h.id}" aria-label="Log the tiny version of ${h.name}${tiny.label ? `: ${tiny.label}` : ''}">Tiny</button>` : ''}
      ${h.checklist?.length ? html`<button type="button" class="icon-btn icon-btn--sm hrow-expand" data-action="expand" data-id="${h.id}" aria-expanded="${!!expanded}" aria-label="Show steps">${icon('chevron-down', { size: 18 })}</button>` : ''}
    </span>` : ''}
    ${h.checklist?.length && expanded ? html`<ul class="hrow-steps">${h.checklist.map((item, i) => html`<li data-key="${h.id}-s${i}">
      ${check(!!l?.checklist?.[i] || (l?.value === 1 && !l?.checklist), { action: 'step', data: { id: h.id, i }, label: item, cls: 'check--sm', color: habitColor(h) })}<span>${item}</span></li>`)}</ul>` : ''}
  </li>`;
}

export function weeklyChips(list, date) {
  if (!list.length) return '';
  const month = list.filter((h) => h.schedule.kind === 'perMonth');
  const week = list.filter((h) => h.schedule.kind !== 'perMonth');
  return html`${chipGroup(week, date, 'This week')}${chipGroup(month, date, 'This month')}`;
}

function chipGroup(list, date, label) {
  if (!list.length) return '';
  return html`<div class="weekly"><p class="weekly-label">${label}</p>
    <div class="weekly-chips">${list.map((h) => {
      const done = H.isDone(h, date);
      const s = h.schedule;
      const count = s.kind === 'interval' ? (done ? '✓' : 'due') : `${H.periodDone(h, date)}/${s.count}`;
      return html`<button type="button" class="${cx('wchip', done && 'is-done')}" data-action="wchip" data-id="${h.id}" aria-pressed="${done}" style="--ic:${habitColor(h)}" data-key="w-${h.id}">
        ${icon(done ? 'check' : h.icon, { size: 15, stroke: done ? 2.2 : 1.75 })}<span>${h.name}</span><b class="tnum">${count}</b></button>`;
    })}</div></div>`;
}

/** Split habits into metric tiles, rows, counters and weekly chips. */
export function split(list) {
  const tiles = list.filter((h) => METRIC_SOURCES.includes(h.source));
  const counters = list.filter((h) => COUNTER_SOURCES.includes(h.source));
  const flexible = list.filter((h) => H.isFlexible(h) && !tiles.includes(h) && !counters.includes(h));
  const rows = list.filter((h) => !tiles.includes(h) && !counters.includes(h) && !flexible.includes(h))
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.order - b.order);
  return { tiles, counters, flexible, rows };
}


/** A set of habits as tiles, rows, counters and weekly chips, in that order. */
export function habitGroup(list, date, mode, ui, { focus = false } = {}) {
  const { tiles, counters, flexible, rows } = split(list);
  return html`
    ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, mode))}</div>` : ''}
    ${rows.length || (focus && flexible.length) ? html`<ul class="hlist">${[...rows, ...(focus ? flexible : [])].map((h) => habitRow(h, date, mode, ui, { focus }))}</ul>` : ''}
    ${counters.length ? html`<div class="counters">${counters.map((h) => counterRow(h, date, mode))}</div>` : ''}
    ${!focus ? weeklyChips(flexible, date) : ''}`;
}
