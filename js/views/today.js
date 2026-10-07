import * as store from '../core/store.js';
import * as M from '../core/metrics.js';
import * as H from '../core/habits.js';
import * as F from '../core/fitness.js';
import { dayScore, rolling, band } from '../core/scoring.js';
import { guidance, needsAttention, phase as phaseOf, trainingCall, isWorkday } from '../core/coach.js';
import { SECTIONS, MODES, habitColor } from '../core/taxonomy.js';
import { today, fmtLong, fmtShortDate, fmtTime, addDays, lastNDays, fmtDayLetter, relativeDay, durationHM, fmtDay, diffDays } from '../core/dates.js';
import { html, raw, cx, attr } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { ring, check, dots, empty } from '../ui/components.js';
import { num, litres, weight as fmtWeight, habitValue, habitTarget, pct } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as S from './sheets.js';
import { startWorkout, openStartSheet } from './workout-actions.js';
import * as T from '../core/tasks.js';
import { taskRow, taskActions, openTask } from './task-ui.js';

const DEFAULT_OPEN = {
  morning: ['morning', 'body'],
  work: ['body', 'life', 'mind'],
  evening: ['evening', 'life', 'spirit'],
  night: [],
  review: SECTIONS.map((s) => s.id),
};
const LATER = { morning: ['evening'], work: ['evening'] };
const METRIC_SOURCES = ['water', 'protein', 'steps', 'produce'];
const COUNTER_SOURCES = ['deepWork', 'breaks', 'eyeBreaks'];

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
/** "Eight" — the number of Minimum-day habits, in words. */
const essentials = () => { const n = H.activeHabits().filter((h) => h.mvd).length; return WORDS[n] || String(n); };

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function subline(date, ph, mode) {
  if (mode === 'minimum') return `Minimum day. ${essentials()} essentials. That’s enough.`;
  if (mode === 'sick') return 'Rest is the plan. Fluids, food, sleep.';
  const call = trainingCall(date);
  const shutdown = M.review(date)?.shutdown?.done;
  const work = isWorkday(date);
  if (ph === 'morning') {
    if (!M.sleep(date) && !M.mood(date)) return 'Start with a 30-second check-in.';
    if (call.kind === 'done') return `${call.title} done. Good start.`;
    return call.template ? `${call.title} at ${store.profile().trainTime || '06:30'}.` : 'A slower morning. Move a little.';
  }
  if (ph === 'work') return work ? 'Work block. Move every hour, look away every so often.' : 'A day off work. Walk, family, rest.';
  if (ph === 'evening') return work && !shutdown ? 'Time to close the laptop.' : 'Life mode. Be present.';
  return 'Day complete. Lights out by 22:00.';
}

/* ---------- pieces ---------- */
function header(date, ph, mode, isToday) {
  const mod = MODES[mode];
  return html`<header class="today-head" data-key="head">
    <div class="today-meta">
      <div class="date-nav">
        <button type="button" class="icon-btn icon-btn--sm" data-action="day" data-delta="-1" aria-label="Previous day">${icon('chevron-left', { size: 18 })}</button>
        <p class="eyebrow"><span class="d-long">${fmtLong(date)}</span><span class="d-short">${fmtShortDate(date)}</span>${isToday ? html` · <span class="tnum">${fmtTime()}</span>` : ''}</p>
        ${!isToday ? html`<button type="button" class="icon-btn icon-btn--sm" data-action="day" data-delta="1" aria-label="Next day">${icon('chevron-right', { size: 18 })}</button>` : ''}
      </div>
      <div class="today-tools">
        <button type="button" class="${cx('mode-chip', mode !== 'normal' && `mode-chip--${mode}`)}" data-action="mode" aria-label="Day mode: ${mod.label}">${icon(mod.icon, { size: 15 })}<span>${mod.short}</span></button>
        <button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>
      </div>
    </div>
    ${isToday
      ? html`<h1 class="greet">${greeting()}, ${store.profile().name}.</h1><p class="greet-sub">${subline(date, ph, mode)}</p>`
      : html`<h1 class="greet">${relativeDay(date)}</h1><p class="greet-sub">Editing a past day. Changes save as you go. <button type="button" class="link-btn" data-action="go-today">Back to today</button></p>`}
  </header>`;
}

function hero(date) {
  const s = dayScore(date);
  const r7 = rolling(date, 7);
  const b = band(r7.ratio);
  const week = lastNDays(date, 7).map((d) => ({ d, s: dayScore(d), before: d < H.trackingStart() }));
  const complete = s.total && s.done === s.total;
  if (s.mode === 'sick') {
    return html`<section class="hero hero--paused" data-key="hero">
      <div class="hero-ring">${ring(0, { size: 96, stroke: 7 })}<span class="hero-ring-ic">${icon('thermometer', { size: 26 })}</span></div>
      <div class="hero-text"><p class="hero-label">Today</p><p class="hero-big">Paused</p><p class="hero-sub">Sick days don’t count against you.</p></div>
    </section>`;
  }
  return html`<section class="${cx('hero', complete && 'is-complete')}" data-key="hero" aria-label="Today’s score">
    <div class="hero-ring">${ring(s.ratio || 0, { size: 96, stroke: 7, label: `${pct(s.ratio)} of key habits done` })}
      <span class="hero-pct tnum" data-tween="${Math.round((s.ratio || 0) * 100)}" data-tween-suffix="%"><span data-tween-text>${Math.round((s.ratio || 0) * 100)}%</span></span></div>
    <div class="hero-text">
      <p class="hero-label">${s.mode === 'minimum' ? 'Minimum day' : 'Today'}</p>
      <p class="hero-big tnum"><span>${s.done}</span> of ${s.total} <span class="hero-big-sub">${s.mode === 'minimum' ? 'essentials' : 'key habits'}</span></p>
      <div class="hero-week" aria-label="Last 7 days">
        <div class="mini-bars">${week.map((w) => html`<span class="${cx('mini-bar', w.d === date && 'is-today', w.before && 'is-off', w.s.mode === 'sick' && 'is-off')}" title="${fmtDay(w.d)}: ${pct(w.s.ratio)}"><i style="--h:${Math.max(0.06, Math.round((w.s.ratio || 0) * 100) / 100)}"></i><b>${fmtDayLetter(w.d)}</b></span>`)}</div>
        <p class="hero-sub">${r7.ratio != null && r7.days >= 3 ? html`Last 7 days <strong class="tnum">${pct(r7.ratio)}</strong> · <span class="band band--${b.key}">${b.label}</span>` : r7.days ? `Building your baseline · ${r7.days} of 7 days logged` : 'Your 7-day consistency builds from today.'}</p>
      </div>
    </div>
  </section>`;
}

function coachCard(date, ui) {
  const list = guidance(date);
  if (!list.length) return '';
  const [first, ...rest] = list;
  return html`<section class="coach" data-key="coach" aria-label="Next useful action">
    <p class="coach-label">${icon('compass', { size: 14 })} Next useful action</p>
    ${coachItem(first, true)}
    ${rest.length ? html`<details class="coach-more" ${ui.coachOpen ? raw('open') : ''} data-key="coach-more">
      <summary data-action="toggle-coach">${rest.length} more note${rest.length === 1 ? '' : 's'}</summary>
      <div class="coach-rest">${rest.map((c) => coachItem(c, false))}</div></details>` : ''}
  </section>`;
}

function coachItem(c, primary) {
  const d = c.action?.data ? Object.entries(c.action.data).map(([k, v]) => ` data-${k}="${v}"`).join('') : '';
  return html`<div class="${cx('coach-item', `coach-item--${c.tone}`, primary && 'is-primary')}" data-key="c-${c.id}">
    <p class="coach-title">${c.title}</p>
    <p class="coach-body">${c.body}</p>
    <div class="coach-foot">
      ${c.fact ? html`<span class="tag" title="Based on your logged data">From your data</span>` : html`<span class="tag tag--soft">Suggestion</span>`}
      ${c.action ? html`<button type="button" class="btn btn--sm ${primary ? 'btn--primary btn--arrow' : 'btn--soft'}" data-action="${c.action.act}"${raw(d)}>${c.action.label}${primary ? html`<span class="btn-tile" aria-hidden="true">${icon('arrow-up-right', { size: 16 })}${icon('arrow-up-right', { size: 16 })}</span>` : ''}</button>` : ''}
    </div>
  </div>`;
}

function briefing(date, ph, mode) {
  if (date !== today() || mode === 'sick') return '';
  const checked = M.sleep(date) || M.mood(date);
  if (ph === 'morning' && !checked) {
    return html`<button type="button" class="checkin-cta" data-action="open-checkin" data-key="brief">
      <span class="checkin-ic">${icon('sunrise', { size: 22 })}</span>
      <span><span class="checkin-title">Morning check-in</span><span class="checkin-sub">Sleep, energy, stress, mood · 30 seconds</span></span>
      <span class="checkin-chev">${icon('arrow-up-right', { size: 18 })}</span></button>`;
  }
  if (ph === 'morning' || (ph === 'work' && checked && new Date().getHours() < 12)) {
    const sl = M.sleep(date);
    const w = M.weightSummary(date);
    const call = trainingCall(date);
    const t = M.targets();
    const focus = (M.review(date)?.top3 || []).find((p) => (p.text || '').trim() && !p.done);
    const items = [
      ['Sleep', sl ? durationHM(sl.hours * 60) : '—', sl?.quality ? `quality ${sl.quality}/10` : ''],
      ['Weight', w.avg7 != null ? fmtWeight(w.avg7) : '—', w.avg7 != null ? '7-day average' : 'no weigh-ins yet'],
      ['Today', call.title, call.kind === 'lighter' || call.kind === 'recovery' ? 'adjusted' : ''],
      ['Protein', `${t.proteinG} g`, 'target'],
      ['Steps', `${num(M.stepsTarget(date) / 1000, 0)}k+`, '8–10k'],
      ['Focus', focus?.text || 'Set your Top 3', ''],
    ];
    return html`<section class="briefing" data-key="brief" aria-label="Daily briefing">
      <p class="section-label">Briefing</p>
      <dl class="brief-grid">${items.map(([k, v, sub]) => html`<div class="brief-item"><dt>${k}</dt><dd>${v}</dd>${sub ? html`<span>${sub}</span>` : ''}</div>`)}</dl>
    </section>`;
  }
  return '';
}

function dayComplete(date, ph, mode) {
  if (date !== today() || !(ph === 'night' || (ph === 'evening' && new Date().getHours() >= 21))) return '';
  const due = H.activeHabits().filter((h) => H.dueOn(h, date, mode) && h.priority !== 'optional');
  const done = due.filter((h) => H.isDone(h, date, mode)).length;
  const n = M.nutrition(date);
  const t = M.targets();
  const workouts = F.workoutsOn(date);
  const tm = addDays(date, 1);
  const tmTpl = F.plannedTemplate(tm);
  const tmTop = (M.review(tm)?.top3 || []).filter((p) => (p.text || '').trim());
  const win = M.review(date)?.win;
  return html`<section class="day-complete" data-key="complete">
    <p class="section-label">Day complete</p>
    <div class="dc-grid">
      <div><dt>Habits</dt><dd class="tnum">${done} / ${due.length}</dd></div>
      <div><dt>Protein</dt><dd class="tnum">${num(n.protein)} g</dd></div>
      <div><dt>Water</dt><dd class="tnum">${litres(M.waterMl(date))}</dd></div>
      <div><dt>Steps</dt><dd class="tnum">${M.steps(date) != null ? num(M.steps(date)) : '—'}</dd></div>
      <div><dt>Workout</dt><dd>${workouts.length ? workouts[0].title : '—'}</dd></div>
      <div><dt>Sleep</dt><dd>Lights out ${store.profile().bedTime}</dd></div>
    </div>
    ${win ? html`<p class="dc-win">${icon('star', { size: 15 })} ${win}</p>` : html`<button type="button" class="link-btn" data-action="focus-win">${icon('pencil', { size: 15 })} One reflection or win from today</button>`}
    <div class="tomorrow">
      <p class="section-label">Tomorrow · ${fmtDay(tm)}</p>
      <p class="tomorrow-line">${icon('activity', { size: 16 })} ${tmTpl ? `${tmTpl.name} · ${store.profile().trainTime}` : 'Recovery · walk or mobility'}</p>
      ${tmTop.length ? tmTop.map((p, i) => html`<p class="tomorrow-line"><span class="tnum muted">${i + 1}</span> ${p.text}</p>`) : html`<p class="tomorrow-line muted">No priorities set yet. Shutdown adds tomorrow’s first one.</p>`}
    </div>
  </section>`;
}

function top3(date, ph, mode) {
  if (mode === 'sick' || (mode === 'minimum')) return '';
  const work = isWorkday(date);
  if (date === today() && (ph === 'night' || (ph === 'evening' && !work))) return '';
  const r = M.review(date);
  const list = [...(r?.top3 || [])];
  while (list.length < 3) list.push({ id: `empty-${list.length}`, text: '', done: false, empty: true });
  const doneN = list.filter((p) => p.done && p.text).length;
  return html`<section class="top3" data-key="top3" aria-label="Top 3 priorities">
    <div class="block-head"><h2 class="block-title">${work ? 'Top 3 priorities' : 'Top 3 for today'}</h2><span class="block-meta tnum">${doneN}/3</span></div>
    <ol class="top3-list" data-top3>${list.slice(0, 3).map((p, i) => html`<li class="${cx('top3-item', p.done && 'is-done')}" data-key="${p.id}" data-index="${i}">
      <button type="button" class="drag-handle" data-drag aria-label="Reorder priority ${i + 1}. Use arrow keys to move." data-index="${i}">${icon('grip-vertical', { size: 16 })}</button>
      ${check(p.done, { action: 'top3-check', data: { i }, label: `Priority ${i + 1} done`, cls: 'check--sm' })}
      <input class="top3-input" value="${p.text || ''}" placeholder="${['The one that matters most', 'Second priority', 'Third priority'][i]}" aria-label="Priority ${i + 1}" data-change="top3-text" data-i="${i}" enterkeyhint="done" maxlength="120">
    </li>`)}</ol>
  </section>`;
}

// The workbook's Week Plan put tasks right under the Top 3; so does Today.
function tasksCard(date, ph, mode) {
  if (mode === 'sick' || mode === 'minimum') return '';
  const isToday = date === today();
  const list = T.forToday(date);
  const open = list.filter((t) => !t.done).length;
  if (!isToday && !list.length) return '';
  if (isToday && ph === 'night' && !open) return '';
  return html`<section class="tasks-card" data-key="tasks" aria-label="Tasks">
    <div class="block-head"><h2 class="block-title">Tasks</h2>
      <span class="block-meta tnum">${list.length ? `${list.length - open}/${list.length}` : ''}</span>
      <button type="button" class="link-btn" data-action="nav" data-to="more/tasks">All tasks</button></div>
    ${list.length ? html`<ul class="tlist">${list.map((t) => taskRow(t, { showDue: t.date !== date, ref: date }))}</ul>` : ''}
    ${isToday ? html`<div class="task-add">
      <span class="task-add-ic" aria-hidden="true">${icon('plus', { size: 18 })}</span>
      <input class="task-add-input" data-change="task-add" placeholder="${list.length ? 'Add another' : 'Add a task for today'}" aria-label="Add a task for today" enterkeyhint="done" maxlength="140">
      <button type="button" class="icon-btn icon-btn--sm" data-action="task-new" aria-label="New task with a date, repeat or area">${icon('ellipsis', { size: 18 })}</button>
    </div>` : ''}
  </section>`;
}

function shutdownCard(date, ph, mode) {
  if (date !== today() || !isWorkday(date) || mode === 'sick') return '';
  const r = M.review(date);
  if (r?.shutdown?.done) {
    if (ph !== 'evening' && ph !== 'night') return '';
    const at = new Date(r.shutdown.at);
    return html`<div class="mode-shift" data-key="shift">${icon('moon', { size: 16 })}<span><strong>Life mode</strong> · work closed at ${fmtTime(at)}</span></div>`;
  }
  if (ph !== 'evening' && !(ph === 'work' && new Date().getHours() >= 19)) return '';
  return html`<button type="button" class="shutdown-cta" data-action="open-shutdown" data-key="shift">
    <span class="shutdown-from">Work</span>${icon('arrow-right', { size: 16 })}<span class="shutdown-to">Life</span>
    <span class="shutdown-label">Close the work day</span></button>`;
}

function metricTile(h, date, mode) {
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

function counterRow(h, date, mode) {
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

function habitRow(h, date, mode, ui) {
  const done = H.isDone(h, date, mode);
  const l = H.log(h.id, date);
  const name = mode === 'minimum' && h.mvdLabel ? h.mvdLabel : h.name;
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
  const expanded = ui.expanded?.[h.id];
  const state = h.type === 'check' && H.value(h, date) === 0 ? 'no' : undefined;
  const isSleep = h.source === 'sleep';
  return html`<li class="${cx('hrow', done && 'is-done', expanded && 'is-expanded')}" data-key="${h.id}" style="--ic:${habitColor(h)}">
    ${isSleep
      ? html`<span class="${cx('auto-ic', done && 'is-done')}">${done ? icon('check', { size: 16, stroke: 2.2 }) : icon('bed', { size: 16 })}</span>`
      : check(done, { action: 'toggle', data: { id: h.id }, label: `${name}${done ? ', done' : ''}`, color: habitColor(h), state })}
    <button type="button" class="hrow-main" data-action="habit" data-id="${h.id}">
      <span class="hrow-name">${name}${h.priority === 'optional' ? html`<span class="tag tag--quiet">Bonus</span>` : ''}</span>
      ${sub ? html`<span class="hrow-sub">${sub}</span>` : ''}
    </button>
    ${h.checklist?.length ? html`<button type="button" class="icon-btn icon-btn--sm hrow-expand" data-action="expand" data-id="${h.id}" aria-expanded="${!!expanded}" aria-label="Show steps">${icon('chevron-down', { size: 18 })}</button>` : ''}
    ${h.checklist?.length && expanded ? html`<ul class="hrow-steps">${h.checklist.map((item, i) => html`<li data-key="${h.id}-s${i}">
      ${check(!!l?.checklist?.[i] || (l?.value === 1 && !l?.checklist), { action: 'step', data: { id: h.id, i }, label: item, cls: 'check--sm', color: habitColor(h) })}<span>${item}</span></li>`)}</ul>` : ''}
  </li>`;
}

function weeklyChips(list, date) {
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

function sectionBlock(sec, date, mode, ph, ui) {
  const due = H.activeHabits().filter((h) => h.section === sec.id && H.dueOn(h, date, mode) && h.source !== 'top3');
  if (!due.length) return '';
  const tiles = due.filter((h) => METRIC_SOURCES.includes(h.source));
  const counters = due.filter((h) => COUNTER_SOURCES.includes(h.source));
  const flexible = due.filter((h) => H.isFlexible(h) && !tiles.includes(h) && !counters.includes(h));
  const rows = due.filter((h) => !tiles.includes(h) && !counters.includes(h) && !flexible.includes(h))
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.order - b.order);
  const counted = [...rows, ...tiles, ...counters].filter((h) => h.priority !== 'optional');
  const doneN = counted.filter((h) => H.isDone(h, date, mode)).length;
  const allDone = counted.length && doneN === counted.length;
  const phaseKey = date === today() ? ph : 'review';
  const isLater = date === today() && (LATER[ph] || []).includes(sec.id);
  const open = ui.open?.[sec.id] ?? (store.settings().showAllSections || (DEFAULT_OPEN[phaseKey] || []).includes(sec.id) && !allDone);
  return html`<section class="${cx('hsec', open && 'is-open', allDone && 'is-complete', isLater && 'is-later')}" data-key="sec-${sec.id}" aria-label="${sec.label}">
    <button type="button" class="hsec-head" data-action="section" data-id="${sec.id}" aria-expanded="${!!open}">
      <span class="hsec-title">${sec.label}</span>
      ${isLater && !open ? html`<span class="tag tag--quiet">Later</span>` : ''}
      <span class="hsec-count tnum">${allDone ? html`${icon('check', { size: 14, stroke: 2.2 })} Done` : counted.length ? `${doneN} of ${counted.length}` : ''}</span>
      ${icon('chevron-down', { size: 18, cls: 'hsec-chev' })}
    </button>
    ${open ? html`<div class="hsec-body">
      ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, mode))}</div>` : ''}
      ${rows.length ? html`<ul class="hlist">${rows.map((h) => habitRow(h, date, mode, ui))}</ul>` : ''}
      ${counters.length ? html`<div class="counters">${counters.map((h) => counterRow(h, date, mode))}</div>` : ''}
      ${weeklyChips(flexible, date)}
    </div>` : ''}
  </section>`;
}

function minimumDay(date, ui) {
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

function sickDay(date, ui) {
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

function attention(date) {
  const list = needsAttention(date);
  if (!list.length) return '';
  return html`<section class="attention" data-key="attention">
    <p class="section-label">Needs attention</p>
    <ul>${list.map((a) => html`<li><button type="button" class="attention-item" data-action="habit" data-id="${a.habit.id}" style="--ic:${habitColor(a.habit)}">
      <span class="attention-dot"></span><span><strong>${a.habit.name}</strong> · ${a.text}</span></button></li>`)}</ul>
  </section>`;
}

function winCard(date, ui) {
  const r = M.review(date);
  return html`<section class="win" data-key="win">
    <label class="win-label" for="win-input">${icon('star', { size: 15 })} Win of the day <small>optional</small></label>
    <input id="win-input" class="win-input" value="${r?.win || ''}" placeholder="Trained despite low motivation · hit protein · present at dinner…" data-change="win" maxlength="160" enterkeyhint="done">
  </section>`;
}

/* ---------- view ---------- */
export default {
  id: 'today',
  title: 'Today',
  wide: true,
  render({ params, ui }) {
    const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today();
    const isToday = date === today();
    const ph = isToday ? phaseOf() : 'review';
    const mode = H.dayMode(date);
    const body = mode === 'minimum' ? minimumDay(date, ui) : mode === 'sick' ? sickDay(date, ui)
      : html`${SECTIONS.map((s) => sectionBlock(s, date, mode, ph, ui))}`;
    return html`<div class="today" data-phase="${ph}" data-mode="${mode}">
      ${header(date, ph, mode, isToday)}
      <div class="today-grid">
        <div class="today-aside">
          ${hero(date)}
          ${isToday ? coachCard(date, ui) : ''}
          ${briefing(date, ph, mode)}
          ${dayComplete(date, ph, mode)}
        </div>
        <div class="today-main">
          ${shutdownCard(date, ph, mode)}
          ${top3(date, ph, mode)}
          ${tasksCard(date, ph, mode)}
          ${body}
          ${mode !== 'sick' ? attention(date) : ''}
          ${winCard(date, ui)}
          ${mode === 'normal' && isToday ? html`<button type="button" class="link-btn center-link" data-action="toggle-all">${store.settings().showAllSections ? 'Show by time of day' : 'Show everything'}</button>` : ''}
        </div>
      </div>
    </div>`;
  },
  mount(el, ctx) { attachTop3Drag(el, ctx); },
  update(el, ctx) {
    const date = ctx.params.date || today();
    const s = dayScore(date);
    const key = `lifeos.celebrated.${date}`;
    if (s.total && s.done === s.total && s.mode !== 'sick') {
      try {
        if (!sessionStorage.getItem(key) && !localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          hap.success();
          app.toast(s.mode === 'minimum' ? `All ${essentials().toLowerCase()} essentials. That’s a good day.` : `All ${s.total} key habits. Quiet win.`, { icon: 'sparkles' });
        }
      } catch { /* storage unavailable */ }
    }
  },
  actions: {
    ...taskActions,
    'task-new': ({ params }) => openTask(null, { date: params.date || today() }),
    toggle: ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      const wasDone = H.isDone(h, date);
      const now = H.toggle(h, date);
      if (wasDone && now) { app.toast('Done from your logged data. Edit the entry to change it.'); return; }
      now ? hap.success() : hap.tap();
    },
    step: ({ data, params }) => { H.toggleChecklistItem(H.habit(data.id), params.date || today(), Number(data.i)); hap.tap(); },
    expand: ({ data, ui }) => { ui.expanded = { ...(ui.expanded || {}), [data.id]: !ui.expanded?.[data.id] }; app.refresh(); },
    habit: ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      if (h.id === 'h-training') {
        const active = F.activeWorkout();
        if (active) return app.go(`body/workout/${active.id}`);
        if (F.workoutsOn(date).length) return app.go('body/training');
        return openStartSheet(date);
      }
      if (h.source && !COUNTER_SOURCES.includes(h.source) && !h.source.startsWith('workout:')) return S.openSource(h, date);
      S.openHabit(h.id, date);
    },
    source: ({ data, params }) => S.openSource(H.habit(data.id), params.date || today()),
    wchip: ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      if (h.source) return S.openSource(h, date);
      const now = H.toggle(h, date);
      now ? hap.success() : hap.tap();
    },
    counter: ({ data, params }) => S.bumpCounter(params.date || today(), data.source, Number(data.delta)),
    section: ({ data, ui }) => {
      const el = document.querySelector(`[data-key="sec-${data.id}"]`);
      const open = el?.classList.contains('is-open');
      ui.open = { ...(ui.open || {}), [data.id]: !open };
      app.refresh();
    },
    'toggle-all': () => store.setSettings({ showAllSections: !store.settings().showAllSections }),
    'toggle-coach': ({ ui, event }) => { event.preventDefault(); ui.coachOpen = !ui.coachOpen; app.refresh(); },
    'add-water': ({ data, params }) => S.addWater(params.date || today(), Number(data.ml) || 500),
    'open-checkin': ({ params }) => S.openCheckin(params.date || today()),
    'open-shutdown': ({ params }) => S.openShutdown(params.date || today()),
    'log-steps': ({ params }) => S.openSteps(params.date || today()),
    'log-food': ({ params }) => S.openFood(params.date || today()),
    'start-workout': ({ data, params }) => startWorkout(data.template, params.date || today()),
    'set-mode': ({ data, params }) => S.setMode(params.date || today(), data.mode),
    mode: ({ params }) => S.openMode(params.date || today()),
    day: ({ data, params }) => {
      const cur = params.date || today();
      const next = addDays(cur, Number(data.delta));
      if (next > today()) return;
      app.replace(next === today() ? 'today' : `today/${next}`);
    },
    'go-today': () => app.replace('today'),
    'top3-check': ({ data, params }) => {
      const date = params.date || today();
      const r = S.reviewOf(date);
      const list = [...(r.top3 || [])];
      const i = Number(data.i);
      if (!list[i]?.text) { document.querySelector(`[data-i="${i}"].top3-input`)?.focus(); return; }
      list[i] = { ...list[i], done: !list[i].done };
      S.saveReview(date, { top3: list });
      list[i].done ? hap.success() : hap.tap();
    },
    'focus-win': () => document.getElementById('win-input')?.focus(),
  },
  inputs: {
    'task-add': ({ el, value, params }) => {
      const title = value.trim();
      if (!title) return;
      T.add({ title, date: params.date || today() });
      el.value = '';
      hap.tap();
    },
    'top3-text': ({ el, value, params }) => {
      const date = params.date || today();
      const r = S.reviewOf(date);
      const list = [...(r.top3 || [])];
      const i = Number(el.dataset.i);
      while (list.length <= i) list.push({ id: store.uid(), text: '', done: false });
      list[i] = { ...list[i], id: list[i].id?.startsWith('empty-') ? store.uid() : list[i].id || store.uid(), text: value.trim() };
      S.saveReview(date, { top3: list });
    },
    win: ({ value, params }) => S.saveReview(params.date || today(), { win: value.trim() }),
  },
};

/* ---------- drag to reorder Top 3 (pointer + keyboard) ---------- */
function attachTop3Drag(root, ctx) {
  const date = () => ctx.params.date || today();
  const move = (from, to) => {
    const r = S.reviewOf(date());
    const list = [...(r.top3 || [])];
    while (list.length < 3) list.push({ id: store.uid(), text: '', done: false });
    if (to < 0 || to > 2 || from === to) return;
    const [it] = list.splice(from, 1);
    list.splice(to, 0, it);
    S.saveReview(date(), { top3: list });
    hap.tap();
  };
  root.addEventListener('keydown', (e) => {
    const handle = e.target.closest('[data-drag]');
    if (!handle) return;
    const i = Number(handle.dataset.index);
    if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1); requestAnimationFrame(() => root.querySelector(`[data-drag][data-index="${i - 1}"]`)?.focus()); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1); requestAnimationFrame(() => root.querySelector(`[data-drag][data-index="${i + 1}"]`)?.focus()); }
  });
  let drag = null;
  root.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('[data-drag]');
    if (!handle) return;
    const item = handle.closest('.top3-item');
    const listEl = item.parentElement;
    drag = { from: Number(handle.dataset.index), item, listEl, startY: e.clientY, h: item.offsetHeight, to: Number(handle.dataset.index) };
    item.classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    drag.item.style.transform = `translateY(${dy}px)`;
    drag.to = Math.max(0, Math.min(2, drag.from + Math.round(dy / drag.h)));
    [...drag.listEl.children].forEach((li, idx) => {
      if (li === drag.item) return;
      let shift = 0;
      if (drag.from < drag.to && idx > drag.from && idx <= drag.to) shift = -drag.h;
      if (drag.from > drag.to && idx < drag.from && idx >= drag.to) shift = drag.h;
      li.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  });
  const end = () => {
    if (!drag) return;
    const { from, to, listEl, item } = drag;
    drag = null;
    item.classList.remove('is-dragging');
    [...listEl.children].forEach((li) => { li.style.transform = ''; });
    move(from, to);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
