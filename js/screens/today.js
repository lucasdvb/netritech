// Today, as a "now" instrument (DR-03): one next action, the routine that's open, your three,
// priorities and tasks, pinned actions, and everything else folded. Edit Today arranges the rest.
import * as store from '../data/store.js';
import * as M from '../domain/metrics-core.js';
import * as H from '../domain/habits.js';
import * as F from '../domain/fitness-core.js';
import * as R from '../domain/routines.js';
import * as T from '../domain/tasks.js';
import { dayScore } from '../domain/scoring.js';
import { phase as phaseOf, trainingCall, isWorkday } from '../domain/day-plan.js';
import { MODES } from '../domain/taxonomy.js';
import { today, fmtLong, fmtShortDate, addDays, relativeDay, weekday } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { saveReview } from '../domain/day.js';
import { taskActions, openTask } from './task-ui.js';
import { nowCard } from './today/now.js';
import { routinesBlock } from './today/routines.js';
import { prioritiesBlock } from './today/priorities.js';
import { threeBlock, pinnedBlock, moodboardBlock, moreBlock, notTodayBlock, lifeMode, essentials, layoutOf, BLOCKS } from './today/blocks.js';
// Sheets load on first use, and are fetched in the background once Today is on screen.
const sheets = () => import('./sheets.js');
const workouts = () => import('./workout-actions.js');
const pads = () => import('./pads.js');
const opener = () => import('./today/open.js');
/** An action that opens something from a module loaded on first use, for the day on screen. */
const open = (load, fn, ...args) => async ({ params }) => (await load())[fn](...args, params.date || today());
// The safety nets (catch-up, fresh start, shrink and grow, tidy-up) arrive right after the first screen.
let nets = null;
let netCards = null; // their cards (today/nets.js), loaded with them

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
  const work = isWorkday(date);
  if (ph === 'morning') {
    if (call.kind === 'done') return `${call.title} done. Good start.`;
    return call.template ? `${call.title} at ${store.profile().trainTime || '06:30'}.` : 'A slower morning. Move a little.';
  }
  if (ph === 'work') return work ? 'Work block. Move every hour, look away every so often.' : 'A day off work. Walk, family, rest.';
  if (ph === 'evening') return work && !M.review(date)?.shutdown?.done ? 'Time to close the laptop soon.' : 'Life mode. Be present.';
  return `Day complete. Lights out by ${store.profile().bedTime || '22:00'}.`;
}

function header(date, ph, mode, isToday) {
  const mod = MODES[mode];
  return html`<header class="today-head" data-key="head">
    <div class="today-meta">
      <button type="button" class="date-btn" data-action="pick-day" aria-label="${fmtLong(date)}. Choose a day">
        ${icon('calendar', { size: 16 })}<span class="d-long">${fmtLong(date)}</span><span class="d-short">${fmtShortDate(date)}</span></button>
      <div class="today-tools">
        <button type="button" class="${cx('mode-chip', mode !== 'normal' && `mode-chip--${mode}`)}" data-action="mode" aria-label="Day mode: ${mod.label}">${icon(mod.icon, { size: 15 })}<span>${mod.short}${mode !== 'away' ? html`<span class="mode-day"> day</span>` : ''}</span></button>
        <button type="button" class="icon-btn" data-action="edit-today" aria-label="Edit Today">${icon('sliders-horizontal', { size: 19 })}</button>
        <button type="button" class="you-btn" data-action="you" aria-label="You: settings, data and privacy">${(store.profile().name || 'Y').slice(0, 1).toUpperCase()}</button>
      </div>
    </div>
    ${isToday
      ? html`<h1 class="greet">${greeting()}, ${store.profile().name}.</h1><p class="greet-sub">${subline(date, ph, mode)}</p>${lifeMode(date)}`
      : html`<h1 class="greet">${relativeDay(date)}</h1><p class="greet-sub">Looking back. Changes save as you go. <button type="button" class="link-btn" data-action="go-today">Back to today</button></p>`}
  </header>`;
}

/** Re-check a routine's finished time after one of its habits changes. */
const settleFor = (habitId, date) => { const r = R.routineOf(habitId); if (r) R.settle(r.routine, date); };

/** Hold on a habit (U3): numbers open the pad, a tiny version logs in one hold, the rest show their options. */

// Minimum and sick days have their own blocks, loaded the first time a day needs them.
let modes = null;
const loadModes = () => { import('./today/modes.js').then((m) => { modes = m; app.refresh(); }).catch(() => {}); return ''; };

// Coming up (dates) loads after the first frame, and only when there are dates saved.
let soon = null;
const loadSoon = () => { if (!soon && store.all('events').length) import('./today/upcoming.js').then((m) => { soon = m; app.refresh(); }).catch(() => {}); };

/** The moodboard's pictures come from the device store, after the first frame. */
const showMoodboard = (el) => { if (el.querySelector('img[data-mb]:not([src])')) import('../domain/moodboard.js').then((m) => m.hydrate(el)).catch(() => {}); };

const view = {
  id: 'today',
  title: 'Today',
  wide: true,
  render({ params, ui }) {
    const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today();
    const isToday = date === today();
    const ph = isToday ? phaseOf() : 'review';
    const mode = H.dayMode(date);
    const { order, hidden } = layoutOf();
    const make = {
      routines: () => (mode === 'normal' || mode === 'rest' ? routinesBlock(date, ui) : ''),
      three: () => threeBlock(date, mode, ui),
      priorities: () => prioritiesBlock(date, mode),
      pinned: () => (isToday ? pinnedBlock(date) : ''),
      moodboard: () => (isToday ? moodboardBlock() : ''),
      upcoming: () => (isToday && soon ? soon.upcomingBlock(date) : ''),
      more: () => moreBlock(date, mode, ui),
    };
    const block = (id) => {
      const out = make[id]();
      return out ? html`<div class="tblock" data-key="b-${id}" style="order:${order.indexOf(id) + 2}">${out}</div>` : '';
    };
    const col = (c) => order.filter((id) => !hidden.includes(id) && BLOCKS.find((b) => b.id === id).column === c).map(block);
    const special = mode === 'minimum' || mode === 'sick' ? (modes ? (mode === 'sick' ? modes.sickBlock : modes.minimumBlock)(date, ui) : loadModes()) : '';
    const notToday = notTodayBlock(date, mode);
    const catchUp = isToday && nets ? netCards.catchUpBlock(nets.catchUp(date), ui) : '';
    const tidy = isToday && nets && [7, 1].includes(weekday(date)) ? netCards.tidyBlock(nets.tidyDue(date)) : '';
    return html`<div class="today" data-phase="${ph}" data-mode="${mode}">
      ${header(date, ph, mode, isToday)}
      <div class="today-grid">
        <div class="today-col today-col--now">
          <div class="tblock" data-key="b-now" style="order:0">${nowCard(date, isToday, ui)}</div>
          ${catchUp ? html`<div class="tblock" data-key="b-catchup" style="order:1">${catchUp}</div>` : ''}
          ${special ? html`<div class="tblock" data-key="b-special" style="order:1">${special}</div>` : ''}
          ${col('now')}
        </div>
        <div class="today-col today-col--day">${col('day')}${notToday ? html`<div class="tblock" data-key="b-nottoday" style="order:98">${notToday}</div>` : ''}${tidy ? html`<div class="tblock" data-key="b-tidy" style="order:99">${tidy}</div>` : ''}</div>
      </div>
    </div>`;
  },
  mount(el, ctx) {
    showMoodboard(el);
    loadSoon();
    import('../ui/gestures.js').then((g) => {
      // Swipe the header to move a day back or forward (never past today).
      g.attachHeadSwipe(el, '.today-head', (dir) => {
        const next = addDays(ctx.params.date || today(), dir);
        if (next > today()) return;
        hap.tap();
        app.replace(next === today() ? 'today' : `today/${next}`);
      });
      g.attachRowGestures(el, {
        onHold: async (id) => (await opener()).holdHabit(id, ctx.params.date || today(), settleFor),
        onSwipe: async (id) => { const h = H.habit(id); if (h) (await pads()).notToday(h, ctx.params.date || today(), { onDone: () => settleFor(id, ctx.params.date || today()) }); },
      });
    }).catch(() => {});
    // The Health Shortcut ends by opening #/today?paste=1.
    if (ctx.query.paste) {
      window.history.replaceState(window.history.state, '', location.hash.split('?')[0]);
      import('./health.js').then((m) => m.openHealthPaste({ auto: true }));
    }
    if (ctx.query.you) {
      window.history.replaceState(window.history.state, '', location.hash.split('?')[0]);
      import('./you.js').then((m) => m.openYou());
    }
    // The coach's suggestions and the safety nets arrive a moment after the first screen.
    Promise.all([import('../domain/coach.js'), import('../domain/next-action.js'), import('../domain/adapt.js'), import('./today/nets.js')]).then(([c, n, a, cards]) => {
      // Only the first visit needs a second render; after that the first one already had them.
      const first = !nets;
      n.useCoach(c.guidance);
      n.useAdapt(a);
      netCards = cards;
      nets = a;
      Object.assign(view.actions, cards.actions);
      // Back after three or more days away: those days read as "away", and a fresh start is offered once.
      const away = !ctx.params.date && a.freshStartDue();
      if (away) {
        a.markAway(away);
        a.markFreshStart();
        import('./fresh-start.js').then((m) => m.openFreshStart(away));
      }
      if (first) app.refresh();
    }).catch((err) => console.error(err));
    setTimeout(() => Promise.all([sheets(), workouts()]).catch(() => {}), 1500);
  },
  update(el, ctx) {
    showMoodboard(el);
    loadSoon();
    const date = ctx.params.date || today();
    const s = dayScore(date);
    const key = `lifeos.celebrated.${date}`;
    if (s.total && s.done === s.total && s.mode !== 'sick') {
      try {
        if (!sessionStorage.getItem(key) && !localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          hap.success();
          app.toast(s.mode === 'minimum' ? 'Everything on your minimum day. That’s a good day.' : 'Everything you planned today. Quiet win.', { icon: 'sparkles' });
        }
      } catch { /* storage unavailable */ }
    }
  },
  actions: {
    ...taskActions,
    'task-new': ({ params }) => openTask(null, { date: params.date || today() }),
    'task-today': ({ data }) => { T.save(data.id, { date: today() }); hap.tap(); },
    'move-priority': ({ from, to, params }) => T.movePriority(params.date || today(), from, to),
    toggle: ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      const wasDone = H.isDone(h, date);
      const now = H.tap(h, date);
      settleFor(h.id, date);
      if (wasDone && now) { app.toast('Done from your logged data. Edit the entry to change it.'); return; }
      now ? hap.success() : hap.tap();
    },
    tiny: async ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      if (h) (await pads()).logTiny(h, date, { onDone: () => settleFor(h.id, date) });
    },
    // The safety nets' own actions (today/nets.js) join these when they load.
    'unskip-habit': ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      if (!h) return;
      H.setSkip(h, date, false);
      settleFor(h.id, date);
      hap.tap();
    },
    // A routine step: plain steps tick; habit steps complete like any habit.
    step: async ({ data, params }) => {
      const date = params.date || today();
      const r = R.routine(data.r);
      const s = r && R.progress(r, date).steps.find((x) => x.id === data.s);
      if (!s) return;
      if (s.kind === 'label') { R.toggleLabel(r, s, date) ? hap.success() : hap.tap(); return; }
      const h = s.habit;
      const needsInput = H.isNumeric(h) || ['sleep', 'shutdown'].includes(h.source) || h.id === 'h-training' || h.source?.startsWith('workout:');
      if (needsInput && !s.done) return (await opener()).openHabitOrSource(h, date);
      const now = H.tap(h, date);
      R.settle(r, date);
      now ? hap.success() : hap.tap();
    },
    'step-label': ({ data, params }) => {
      const date = params.date || today();
      const r = R.routine(data.r);
      const s = r && R.progress(r, date).steps.find((x) => x.id === data.s);
      if (s) { R.toggleLabel(r, s, date); hap.success(); }
    },
    'did-it-all': ({ data, params }) => {
      const date = params.date || today();
      const r = R.routine(data.r);
      if (!r) return;
      const undo = R.didItAll(r, date);
      hap.success();
      app.toast(`${r.name} done.`, { icon: 'check', action: { label: 'Undo', fn: undo } });
    },
    routine: ({ data, ui }) => {
      const open = document.querySelector(`[data-key="r-${data.id}"]`)?.classList.contains('is-open');
      ui.routines = { ...(ui.routines || {}), [data.id]: !open };
      app.refresh();
    },
    'edit-routine': async ({ data }) => (await import('./routine-edit.js')).openRoutineEditor(data.id),
    expand: ({ data, ui }) => { ui.expanded = { ...(ui.expanded || {}), [data.id]: !ui.expanded?.[data.id] }; app.refresh(); },
    habit: async ({ data, params }) => { const h = H.habit(data.id); if (h) await (await opener()).openHabitOrSource(h, params.date || today()); },
    source: async ({ data, params }) => (await sheets()).openSource(H.habit(data.id), params.date || today()),
    wchip: async ({ data, params }) => {
      const date = params.date || today();
      const h = H.habit(data.id);
      if (h.source) return (await sheets()).openSource(h, date);
      const now = H.toggle(h, date);
      now ? hap.success() : hap.tap();
    },
    counter: async ({ data, params }) => (await sheets()).bumpCounter(params.date || today(), data.source, Number(data.delta)),
    'more-today': ({ ui }) => { ui.moreOpen = !ui.moreOpen; app.refresh(); },
    skip: ({ data, ui }) => { ui.skipped = [...(ui.skipped || []), data.id]; hap.tap(); app.refresh(); },
    unskip: ({ ui }) => { ui.skipped = []; app.refresh(); },
    plan: open(sheets, 'openPlan'),
    'focus-later': () => store.setSettings({ focusPromptUntil: addDays(today(), 7) }),
    'edit-today': async () => (await import('./today/edit.js')).openEditToday(),
    'pick-day': open(() => import('./today/day-picker.js'), 'openDayPicker'),
    'add-water': async ({ data, params }) => (await sheets()).addWater(params.date || today(), Number(data.ml) || 500),
    'open-checkin': open(sheets, 'openCheckin'),
    ritual: async ({ data, params }) => (await import('./ritual.js')).openRitual(data.which === 'morning' ? 'morning' : 'evening', params.date || today()),
    'open-shutdown': open(sheets, 'openShutdown'),
    'log-steps': open(pads, 'stepsPad'),
    'log-food': open(sheets, 'openFood'),
    'log-weight': open(pads, 'weightPad'),
    'pin-workout': async ({ params }) => {
      const active = F.activeWorkout();
      if (active) return app.go(`workout/${active.id}`);
      (await workouts()).openStartSheet(params.date || today());
    },
    'pin-journal': async () => (await import('./journal.js')).newEntry('free'),
    'pin-focus': open(() => import('./focus-sheet.js'), 'openFocus'),
    'pin-money': async () => (await import('./money.js')).openExpense(),
    'pin-reading': open(sheets, 'openSession', 'reading'),
    'pin-meditation': open(sheets, 'openSession', 'meditation'),
    'start-workout': async ({ data, params }) => (await workouts()).startWorkout(data.template, params.date || today()),
    'set-mode': async ({ data, params }) => (await sheets()).setMode(params.date || today(), data.mode),
    mode: open(sheets, 'openMode'),
    'go-today': () => app.replace('today'),
    'top3-check': ({ data, params }) => {
      const date = params.date || today();
      const i = Number(data.i);
      const t = T.slots(date)[i];
      if (!t) { document.querySelector(`[data-i="${i}"].top3-input`)?.focus(); return; }
      T.toggle(t.id) ? hap.success() : hap.tap();
    },
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
      const undo = T.setPriorityUndoable(params.date || today(), Number(el.dataset.i), value);
      if (undo) app.toast('Priority cleared', { action: { label: 'Undo', fn: undo } });
    },
    win: ({ value, params }) => saveReview(params.date || today(), { win: value.trim() }),
  },
};

export default view;
