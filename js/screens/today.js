// Today, as a "now" instrument (DR-03): one next action, the routine that's open, your three,
// priorities and tasks, pinned actions, and everything else folded. Edit Today arranges the rest.
import { on as planOn } from '../domain/day-plans-core.js';
import * as store from '../data/store.js';
import * as M from '../domain/metrics-core.js';
import * as H from '../domain/habits.js';
import * as R from '../domain/routines.js';
import { dayScore } from '../domain/scoring.js';
import { phase as phaseOf, trainingCall, isWorkday } from '../domain/day-plan.js';
import { MODES } from '../domain/taxonomy.js';
import { today, fmtLong, fmtShortDate, fmtDayShort, addDays, relativeDay, weekday } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { nowCard } from './today/now.js';
import { routinesBlock } from './today/routines.js';
import { prioritiesBlock } from './today/priorities.js';
import { threeBlock, pinnedBlock, moodboardBlock, moreBlock, notTodayBlock, lifeMode, essentials, layoutOf, BLOCKS, NEVER_FOLD } from './today/blocks.js';
import * as usage from '../ui/usage.js';
// Sheets load on first use, and are fetched in the background once Today is on screen.
const sheets = () => import('./sheets.js');
const workouts = () => import('./workout-actions.js');
const pads = () => import('./pads.js');
const opener = () => import('./today/open.js');
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
    return call.template ? `${call.title} at ${planOn(date).profile.trainTime || '06:30'}.` : 'A slower morning. Move a little.';
  }
  if (ph === 'work') return work ? 'Work block. Move every hour, look away every so often.' : 'A day off work. Walk, family, rest.';
  if (ph === 'evening') return work && !M.review(date)?.shutdown?.done ? 'Time to close the laptop soon.' : 'Life mode. Be present.';
  return `Day complete. Lights out by ${planOn(date).profile.bedTime || '22:00'}.`;
}

/** After midnight, before your day ends: say whose day this still is. */
function stillYesterday(date, now = new Date()) {
  const cal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (cal === date) return '';
  return html`<p class="still-day">${icon('moon', { size: 15 })}<span>Still ${fmtLong(date).split(',')[0]} · your day ends at ${store.profile().dayEndsAt || '00:00'}</span></p>`;
}

function header(date, ph, mode, isToday) {
  const mod = MODES[mode];
  return html`<header class="today-head" data-key="head">
    <div class="today-meta">
      <button type="button" class="date-btn" data-action="pick-day" aria-label="${fmtLong(date)}. Choose a day">
        ${icon('calendar', { size: 16 })}<span class="d-long">${fmtLong(date)}</span><span class="d-short">${fmtShortDate(date)}</span><span class="d-tiny">${fmtDayShort(date)} ${Number(date.slice(8))}</span></button>
      <div class="today-tools">
        <button type="button" class="${cx('mode-chip', mode !== 'normal' && `mode-chip--${mode}`)}" data-action="mode" aria-label="Day mode: ${mod.label}">${icon(mod.icon, { size: 15 })}<span>${mod.short}${mode !== 'away' ? html`<span class="mode-day"> day</span>` : ''}</span></button>
        <button type="button" class="icon-btn" data-action="edit-today" aria-label="Edit Today">${icon('sliders-horizontal', { size: 19 })}</button>
        <button type="button" class="you-btn" data-action="you" aria-label="You: settings, data and privacy">${(store.profile().name || 'Y').slice(0, 1).toUpperCase()}</button>
      </div>
    </div>
    ${isToday
      ? html`<h1 class="greet">${greeting()}, ${store.profile().name}.</h1>${stillYesterday(date)}<p class="greet-sub">${subline(date, ph, mode)}</p>${lifeMode(date)}
        <div class="logbar" data-key="logbar"><button type="button" class="logbar-field" data-action="capture">${icon('plus', { size: 18 })}<span>Log anything…</span></button></div>`
      : html`<h1 class="greet">${relativeDay(date)}</h1><p class="greet-sub">Looking back. Changes save as you go. <button type="button" class="link-btn" data-action="go-today">Back to today</button></p>`}
  </header>`;
}

/** Re-check a routine's finished time after one of its habits changes. */
const settleFor = (habitId, date) => { const r = R.routineOf(habitId); if (r) R.settle(r.routine, date); };

/** Hold on a habit (U3): numbers open the pad, a tiny version logs in one hold, the rest show their options. */

// Minimum and sick days have their own blocks, loaded the first time a day needs them.
let modes = null;
const loadModes = () => { import('./today/modes.js').then((m) => { modes = m; app.refresh(); }).catch(() => {}); return ''; };

// Your day (the plan's blocks, with a line at now) loads right after the first frame.
let strip = null;
let stripLoading = false;
const loadStrip = () => {
  if (!stripLoading) { stripLoading = true; import('./today/day-strip.js').then((m) => { strip = m; app.refresh(); }).catch(() => { stripLoading = false; }); }
  return '';
};

// Coming up (dates) loads after the first frame, and only when there are dates saved.
let soon = null;
const loadSoon = () => { if (!soon && store.all('events').length) import('./today/upcoming.js').then((m) => { soon = m; app.refresh(); }).catch(() => {}); };

/** The moodboard's pictures come from the device store, after the first frame. */
// The morning briefing (today/briefing.js), loaded only before noon.
let brief = null;
let briefLoading = false;
const loadBrief = () => {
  if (!briefLoading) { briefLoading = true; import('./today/briefing.js').then((m) => { brief = m; app.refresh(); }).catch(() => { briefLoading = false; }); }
  return '';
};
// A fresh install opens with the 5-minute setup offered first (until it's done or put off).
const setupCard = () => {
  const s = store.settings();
  if (s.welcomed || s.setupDone) return '';
  return html`<section class="card setup-card" data-key="setup-card">${icon('sparkles', { size: 20 })}
    <span class="row-main"><span class="card-title">Set up your days in 5 minutes</span><span class="row-sub">Your times, training, the habits you start with and reminders, all linked. Moving from another phone? Restore your backup there.</span>
      <span class="setup-card-go"><button type="button" class="btn btn--primary btn--sm" data-action="nav" data-to="you/setup">Start</button>
        <button type="button" class="btn btn--ghost btn--sm" data-action="setup-later">Not now</button></span></span></section>`;
};
const showMoodboard = (el) => { if (el.querySelector('img[data-mb]:not([src])')) import('../domain/moodboard.js').then((m) => m.hydrate(el)).catch(() => {}); };

// Today's buttons and fields act through today/actions.js, fetched just after the first frame. A tap
// before it arrives waits the few milliseconds it takes.
const ACTIONS = [
  'task-check', 'task-open', 'task-new', 'task-today', 'move-priority', 'toggle', 'tiny', 'unskip-habit',
  'step', 'step-label', 'did-it-all', 'routine', 'edit-routine', 'expand', 'habit', 'source',
  'wchip', 'counter', 'more-today', 'day-all', 'unfold', 'skip', 'unskip', 'plan',
  'focus-later', 'edit-today', 'pick-day', 'add-water', 'open-checkin', 'ritual', 'open-shutdown', 'log-steps',
  'log-food', 'log-weight', 'pin-workout', 'pin-journal', 'pin-focus', 'pin-money', 'pin-reading', 'pin-meditation',
  'start-workout', 'set-mode', 'mode', 'go-today', 'top3-check', 'setup-later', 'gap-fill', 'brief-done', 'tk-answer',
];
const INPUTS = [
  'task-add', 'top3-text', 'win',
];
let handlers = null;
const loadHandlers = () => (handlers ||= import('./today/actions.js'));
const lazy = (names, table) => Object.fromEntries(names.map((n) => [n, async (ctx) => (await loadHandlers())[table][n](ctx)]));

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
      day: () => (isToday && !['sick', 'away'].includes(mode) ? (strip ? strip.dayBlock(date, ui) : loadStrip()) : ''),
      moodboard: () => (isToday ? moodboardBlock() : ''),
      upcoming: () => (isToday && soon ? soon.upcomingBlock(date) : ''),
      more: () => moreBlock(date, mode, ui),
    };
    const block = (id) => {
      const out = make[id]();
      if (!out) return '';
      // A section you haven't used in two weeks folds to one line (once the meter has two weeks to go on).
      const fold = isToday && store.settings().foldUnused !== false && !NEVER_FOLD.includes(id) && !ui.unfolded?.[id]
        && usage.days() >= 14 && !usage.usedWithin(`b:${id}`, 14);
      const label = BLOCKS.find((b) => b.id === id).label;
      return html`<div class="tblock" data-key="b-${id}" style="order:${order.indexOf(id) + 2}">${fold
        ? html`<button type="button" class="tfold" data-action="unfold" data-id="${id}" aria-expanded="false">${label}${icon('chevron-down', { size: 16 })}</button>`
        : out}</div>`;
    };
    const col = (c) => order.filter((id) => !hidden.includes(id) && BLOCKS.find((b) => b.id === id).column === c).map(block);
    const special = mode === 'minimum' || mode === 'sick' ? (modes ? (mode === 'sick' ? modes.sickBlock : modes.minimumBlock)(date, ui) : loadModes()) : '';
    const notToday = notTodayBlock(date, mode);
    const catchUp = isToday && nets ? netCards.catchUpBlock(nets.catchUp(date), ui) : '';
    const tidy = isToday && nets && [7, 1].includes(weekday(date)) ? netCards.tidyBlock(nets.tidyDue(date)) : '';
    const setup = isToday ? setupCard() : '';
    const briefing = isToday && !setup && new Date().getHours() < 12 ? (brief ? brief.briefingBlock(date) : loadBrief()) : '';
    return html`<div class="today" data-phase="${ph}" data-mode="${mode}">
      ${header(date, ph, mode, isToday)}
      ${setup ? html`<div class="today-setup" data-key="b-setup">${setup}</div>` : ''}
      ${briefing ? html`<div class="today-brief" data-key="b-brief">${briefing}</div>` : ''}
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
    loadHandlers().catch(() => {});
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
  // What each button does lives in today/actions.js, loaded just after the first frame.
  actions: lazy(ACTIONS, 'actions'),
  inputs: lazy(INPUTS, 'inputs'),
};

export default view;
