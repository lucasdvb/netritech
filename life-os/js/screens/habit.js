// One habit, most useful first: its run and state, this week, history, statistics, details.
import * as store from '../data/store.js';
import * as HS from '../domain/habit-system.js';
import * as R from '../domain/routines.js';
import { deleteWithUndo } from '../ui/undo.js';
import * as H from '../domain/habits-more.js';
import * as U from '../domain/urges.js';
import { catLabel, sectionLabel, habitColor } from '../domain/taxonomy.js';
import { today, addDays, range, lastNDays, fmtMD, fmtDayShort, fmtDayLetter, relativeDay, startOfWeek, endOfWeek, addMonths } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { plateCard } from './records.js';
import * as C from '../domain/commitments.js';
import { lineChart, barChart, heatmap } from '../ui/charts.js';
import { habitValue, habitTarget, pct, num, plural } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { openHabit } from './sheets.js';

const STATE_OPTIONS = ['focus', 'autopilot', 'queue', 'paused'];
const UNIT = { day: ['day', 'days'], week: ['week', 'weeks'], month: ['month', 'months'], time: ['time', 'times'] };
const unitOf = (r, n) => UNIT[r.unit][n === 1 ? 0 : 1];

function history(h) {
  const end = today();
  const start = startOfWeek(addDays(end, -7 * 12));
  return range(start, addDays(startOfWeek(end), 6)).map((d) => {
    if (d > end) return { date: d, state: 'future' };
    if (!H.started(h, d)) return { date: d, state: 'off' };
    if (H.isOff(H.dayMode(d)) || H.isReserve(h, d)) return { date: d, state: 'rest' };
    if (H.isStretch(h, d)) return { date: d, state: 'stretch' };
    if (H.isDone(h, d)) return { date: d, state: 'done' };
    if (H.isTiny(h, d)) return { date: d, state: 'tiny' };
    const s = h.schedule || {};
    if ((s.kind === 'daily' || s.kind === 'weekdays') && H.isScheduledDay(h, d) && d !== end) return { date: d, state: 'miss' };
    return { date: d, state: 'idle' };
  });
}

/** The week's reserve, in a few words ("" when the habit has none). */
function reserveNote(h) {
  if (!H.reserveAllowance(h) || h.archived) return '';
  const left = H.reservesLeft(h, today());
  return left ? ` ${left === 1 ? 'One reserve day' : `${left} reserve days`} left this week.` : ' This week’s reserve is used.';
}

/** For a habit you're cutting down or quitting: how the urges went, and what they have in common. */
function urgesBlock(h) {
  const p = U.pattern(h.id);
  const common = [p.when?.label, p.where && `at ${p.where.label === 'in bed' ? 'bed' : p.where.label}`, p.feeling && `when ${p.feeling.label}`].filter(Boolean);
  return html`<section class="block" data-key="urges"><div class="block-head"><h2 class="block-title">Urges</h2><span class="block-meta">Last 60 days</span></div>
    <div class="card urge-card">
      ${p.total ? html`<p class="urge-counts"><b class="tnum">${p.resisted}</b> ridden out · <b class="tnum">${p.slipped}</b> ${p.slipped === 1 ? 'slip' : 'slips'}</p>
        ${common.length ? html`<p class="card-lead">Most often ${common.join(', ')}. That’s the moment to plan for.</p>` : html`<p class="card-lead">No clear pattern yet. Where and how you felt, when you log them, will show one.</p>`}`
        : html`<p class="card-lead">Tap it on Today when an urge comes, whether you ride it out or not. A pattern shows after a few.</p>`}
      ${h.instead ? html`<div class="backup-card"><p class="backup-if">Instead, I will</p><p class="backup-then">${h.instead}</p></div>`
        : html`<button type="button" class="link-btn" data-action="edit">Add an “instead, I will…”</button>`}
    </div></section>`;
}

function runNote(r) {
  if (r.missesInRow === 1) return 'Missed once. A run survives one miss, so don’t miss twice.';
  if (r.missesInRow >= 2 && r.total) return 'That run ended. The next one starts the moment you do it again.';
  if (!r.total) return 'Your first run starts the first time you do it. The tiny version counts.';
  return 'One miss never ends a run. Two in a row do.';
}

function graduationCard(h) {
  const g = HS.graduationDue(h);
  if (!g || h.archived) return '';
  const next = H.queue().find((q) => q.id !== h.id);
  return html`<section class="grad" data-key="grad" aria-label="Ready for autopilot">
    <p class="section-label">Ready for autopilot</p>
    <p class="grad-title">Done on ${pct(g.ratio)} of ${H.runUnit(h) === 'day' ? 'days' : 'weeks'} for six weeks.</p>
    <p class="card-lead">It’s becoming automatic. Move it to autopilot to free a slot${next ? ` for ${next.name}` : ''}. It stays on Today in its group.</p>
    <div class="btn-row"><button type="button" class="btn btn--primary" data-action="graduate">Move to autopilot</button>
      <button type="button" class="btn btn--ghost" data-action="not-yet">Not yet</button></div>
  </section>`;
}

function weekStrip(h) {
  const end = endOfWeek(today());
  const list = H.dots(h, end, 7);
  const label = { done: 'done', tiny: 'tiny version', miss: 'missed', today: 'today, open', rest: 'sick day', future: 'coming up', off: 'not scheduled' };
  return html`<ol class="week-strip" aria-label="This week">${list.map((d) => html`<li class="${cx('wk-day', d.date === today() && 'is-today')}">
    <span class="sr-only">${fmtDayShort(d.date)}: ${label[d.state] || '—'}</span>
    <i class="dot dot--${d.state}" aria-hidden="true"></i><b aria-hidden="true">${fmtDayLetter(d.date)}</b></li>`)}</ol>`;
}

export default {
  id: 'habit',
  title: ({ params }) => H.habit(params.id)?.name || 'Habit',
  render({ params }) {
    const h = H.habit(params.id);
    if (!h) return html`${pageHead({ title: 'Not found', back: { to: 'plan/habits', label: 'Habits' } })}${empty({ ic: 'circle-alert', title: 'This habit doesn’t exist anymore.' })}`;
    const st = H.stateOf(h);
    const c7 = H.consistency(h, today(), 7);
    const c30 = H.consistency(h, today(), 30);
    const c90 = H.consistency(h, today(), 90);
    const r = H.runs(h);
    const tiny = H.tinyOf(h);
    const stretch = H.stretchOf(h);
    const strength = Math.round(r.strength * 100);
    const inRoutine = R.routineOf(h.id);
    const numeric = H.isNumeric(h);
    const days30 = lastNDays(today(), 30);
    const notes = store.where('habitLogs', (l) => l.habitId === h.id && (l.note || '').trim()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
    const goal = h.goalId ? store.get('goals', h.goalId) : null;
    const pledge = C.forHabit(h.id);
    const facts = [
      H.isLimit(h) ? ['Limit', H.limitOf(h) === 0 ? 'None at all: quitting it' : `At most ${H.limitOf(h)}${h.unit ? ` ${h.unit}` : ''} a day`] : ['Schedule', H.scheduleLabel(h)],
      h.instead ? ['Instead, I will', h.instead] : null,
      h.anchor ? ['When', h.anchor] : null,
      tiny ? ['Tiny version', tiny.label || habitTarget(h, tiny.min)] : null,
      stretch ? ['Stretch version', stretch.label || habitTarget(h, stretch.min)] : null,
      H.reserveAllowance(h) ? ['Reserve days', `${H.reserveAllowance(h)} a week`] : null,
      h.why ? ['Your why', h.why] : null,
      h.backup?.then ? ['Backup plan', h.backup.when ? `If ${h.backup.when.replace(/^if\s+/i, '')} → ${h.backup.then}` : h.backup.then] : null,
      h.temp && today() < h.temp.until ? ['For now', h.temp.target != null ? `${habitTarget(h, h.temp.target)} until ${h.temp.until}` : `The tiny version until ${h.temp.until}`] : null,
      inRoutine ? ['Routine', `${inRoutine.routine.name} · step ${inRoutine.routine.steps.indexOf(inRoutine.step) + 1}`] : null,
      ['Area', `${catLabel(h.category)} · ${sectionLabel(h.section)}`],
      numeric ? ['Target', `${habitTarget(h, H.displayTarget(h, today()))}${h.min != null && h.min !== h.target ? ` · counts from ${habitTarget(h, H.threshold(h, today()))}` : ''}`] : null,
      h.ramp ? ['Adaptive target', h.ramp.map((x) => num(x)).join(' → ')] : null,
      h.time ? ['Time', h.time] : null,
      h.reminder ? ['Reminder', h.reminder] : null,
      h.cueSetAt ? ['iPhone cue', 'Set up in Shortcuts'] : null,
      h.mvd ? ['Minimum day', 'Essential'] : null,
      H.autoScore(h) != null ? ['Feels automatic', `${H.autoScore(h)} of 5${H.feelsAutomatic(h) ? ' · reminders fade' : ''}`] : null,
      h.source ? ['Tracked from', sourceName(h.source)] : null,
      goal ? ['Goal', goal.name] : null,
    ].filter(Boolean);

    return html`
      ${pageHead({ title: h.name, morph: `habit-${h.id}`, eyebrow: `${H.STATES[st].label} · ${catLabel(h.category)}`, back: { to: 'plan/habits', label: 'Habits' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      ${h.description ? html`<p class="lead">${h.description}</p>` : ''}
      ${h.archived ? html`<div class="notice">${icon('archive', { size: 16 })} Archived. History is kept. <button type="button" class="link-btn" data-action="restore">Restore</button></div>` : ''}
      ${graduationCard(h)}

      <section class="run-card" data-key="run" aria-label="Run">
        <div class="run-main">
          <p class="run-val tnum">${r.current}<span> ${unitOf(r, r.current)}</span></p>
          <p class="run-label">Current run</p>
        </div>
        <dl class="run-facts">
          <div><dt>Strength</dt><dd class="tnum">${strength}%</dd></div>
          <div><dt>Best</dt><dd class="tnum">${r.best}</dd></div>
          <div><dt>Comebacks</dt><dd class="tnum">${r.comebacks}</dd></div>
        </dl>
        <p class="run-note">${runNote(r)}${r.comebacks ? ` ${plural(r.comebacks, 'comeback')} in the last 30 days.` : ''}${reserveNote(h)}</p>
        <p class="run-note run-note--quiet">Strength builds each time it counts. A miss dips it a little and never resets it.${!h.archived && !H.isLimit(h) ? html` <button type="button" class="link-btn" data-action="auto-check">Does it feel automatic?</button>` : ''}</p>
      </section>

      ${H.isLimit(h) ? urgesBlock(h) : ''}

      ${plateCard(h) ? html`<section class="block" data-key="mastery-block"><div class="block-head"><h2 class="block-title">Mastery</h2><a class="link-btn" href="#/progress/records" data-action="nav" data-to="progress/records">All plates</a></div>
        <div class="list">${plateCard(h)}</div>
        ${pledge ? html`<p class="quiet-line">${icon('hand', { size: 15 })} Pledge: day ${C.state(pledge).day} of ${pledge.days}${pledge.stake ? ` · ${pledge.stake}` : ''}</p>` : ''}</section>` : ''}

      ${!h.archived ? html`<section class="block" data-key="state">
        <div class="block-head"><h2 class="block-title">State</h2></div>
        <div class="seg" role="radiogroup" aria-label="State">${STATE_OPTIONS.map((s) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${st === s}" data-action="state" data-value="${s}">${H.STATES[s].label}</button>`)}</div>
        <p class="block-hint block-hint--after">${H.STATES[st].hint}${st === 'paused' && h.pausedUntil ? ` Back on ${fmtMD(h.pausedUntil)}.` : ''}</p>
      </section>` : ''}

      <section class="block" data-key="week">
        <div class="block-head"><h2 class="block-title">This week</h2><button type="button" class="link-btn" data-action="log-today">Log today</button></div>
        <div class="card">${weekStrip(h)}${H.isFlexible(h) ? html`<p class="quiet-line">${icon('calendar', { size: 15 })} ${H.periodLabel(h, today())}</p>` : ''}</div>
      </section>

      <section class="block" data-key="history">
        <div class="block-head"><h2 class="block-title">Last 13 weeks</h2></div>
        <div class="card">${heatmap(history(h), { label: (d) => `${fmtMD(d.date)}: ${{ done: 'done', stretch: 'stretch version', tiny: 'tiny version', miss: 'missed', rest: 'off or reserve' }[d.state] || '—'}` })}
          <div class="heat-legend"><span><i class="heat-cell heat--done"></i>Done</span>${stretch ? html`<span><i class="heat-cell heat--stretch"></i>Stretch</span>` : ''}<span><i class="heat-cell heat--tiny"></i>Tiny</span><span><i class="heat-cell heat--miss"></i>Missed</span><span><i class="heat-cell heat--rest"></i>Off</span></div></div>
      </section>

      <section class="block" data-key="stats">
        <div class="block-head"><h2 class="block-title">Consistency</h2></div>
        <div class="stat-row stat-row--3">
          <div class="stat"><p class="stat-value tnum">${pct(c7.ratio)}</p><p class="stat-label">7 days</p><p class="stat-sub">${c7.expected ? `${Math.round(c7.done)} of ${Math.round(c7.expected) || 1}` : 'starting'}</p></div>
          <div class="stat"><p class="stat-value tnum">${pct(c30.ratio)}</p><p class="stat-label">30 days</p><p class="stat-sub">${c30.expected ? `${Math.round(c30.done)} of ${Math.round(c30.expected) || 1}` : '—'}</p></div>
          <div class="stat"><p class="stat-value tnum">${pct(c90.ratio)}</p><p class="stat-label">90 days</p><p class="stat-sub">${c90.expected ? `${Math.round(c90.done)} of ${Math.round(c90.expected) || 1}` : '—'}</p></div>
        </div>
        ${numeric && h.type !== 'rating' ? html`<div class="card block-tight">${barChart({
          labels: days30.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days30.map((d) => fmtMD(d)),
          values: days30.map((d) => (H.started(h, d) ? H.value(h, d) : null)), color: habitColor(h),
          fmt: (v) => habitValue(h, v), goal: { value: H.displayTarget(h, today()), label: habitTarget(h, H.displayTarget(h, today())) },
        })}</div>` : ''}
        ${h.type === 'rating' ? html`<div class="card block-tight">${lineChart({ labels: days30.map((d) => fmtMD(d)), series: [{ values: days30.map((d) => H.value(h, d)), color: habitColor(h), area: true }], yMin: 0, yMax: 10 })}</div>` : ''}
      </section>

      <section class="block" data-key="details"><div class="block-head"><h2 class="block-title">Details</h2>${!h.archived ? html`<button type="button" class="link-btn" data-action="cue">${icon('smartphone', { size: 15 })} iPhone cue</button>` : ''}</div>
        <dl class="facts">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
        ${h.checklist?.length ? html`<div class="card steps-card"><p class="section-label">Steps</p><ol class="steps">${h.checklist.map((x) => html`<li>${x}</li>`)}</ol></div>` : ''}
      </section>

      ${notes.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Notes</h2></div>
        <ul class="list">${notes.map((n) => html`<li class="row"><span class="row-main"><span class="row-title">${n.note}</span><span class="row-sub">${relativeDay(n.date)}</span></span></li>`)}</ul></section>` : ''}

      <div class="danger-zone">
        ${h.archived ? html`<button type="button" class="btn btn--soft" data-action="restore">${icon('archive-restore', { size: 18 })} Restore</button>`
          : html`<button type="button" class="btn btn--soft" data-action="archive">${icon('archive', { size: 18 })} Archive</button>`}
        <button type="button" class="btn btn--ghost btn--danger-text" data-action="delete">${icon('trash-2', { size: 18 })} Delete</button>
      </div>`;
  },
  mount(el, ctx) {
    // Older "edit" addresses land here and open the editor.
    if (ctx.query.edit && H.habit(ctx.params.id)) {
      window.history.replaceState(window.history.state, '', location.hash.split('?')[0]);
      import('./habit-edit.js').then((m) => m.openHabitEditor(ctx.params.id));
    }
  },
  actions: {
    edit: async ({ params }) => (await import('./habit-edit.js')).openHabitEditor(params.id),
    cue: async ({ params }) => {
      const [{ openCue }, C] = await Promise.all([import('./cues.js'), import('../domain/cues.js')]);
      openCue(C.habitItem(H.habit(params.id)), { onDone: () => app.refresh() });
    },
    'log-today': ({ params }) => openHabit(params.id, today()),
    state: ({ data, params }) => {
      const h = H.habit(params.id);
      if (data.value === H.stateOf(h)) return;
      if (data.value === 'paused') return openPause(h);
      if (!HS.setState(h, data.value)) {
        app.toast('Your three are full. Swap one out first.', { action: { label: 'Choose', fn: () => app.go('plan/habits/sort') } });
        return;
      }
      hap.tap();
      app.toast(data.value === 'focus' ? `${h.name} is one of your three.` : data.value === 'queue' ? `${h.name} waits for a free slot.` : `${h.name} is on autopilot.`);
    },
    'auto-check': async ({ params }) => { const h = H.habit(params.id); if (h) (await import('./auto-check.js')).openAutoCheck(h); },
    graduate: ({ params }) => {
      const h = H.habit(params.id);
      const next = HS.graduate(h);
      hap.success();
      app.toast(`${h.name} is on autopilot.${next ? ` ${next.name} takes its place.` : ''}`, { icon: 'sparkles' });
    },
    'not-yet': ({ params }) => { store.update('habits', params.id, { graduationSnoozed: today() }); hap.tap(); },
    archive: ({ params }) => {
      const h = H.habit(params.id);
      store.update('habits', h.id, { archived: true });
      hap.tap();
      app.toast(`${h.name} archived`, { action: { label: 'Undo', fn: () => store.update('habits', h.id, { archived: false }) } });
    },
    restore: ({ params }) => { store.update('habits', params.id, { archived: false }); hap.tap(); },
    delete: ({ params }) => {
      const h = H.habit(params.id);
      const logs = store.where('habitLogs', (l) => l.habitId === h.id);
      app.replace('plan/habits');
      deleteWithUndo([{ store: 'habits', id: h.id }, ...logs.map((l) => ({ store: 'habitLogs', id: l.id }))],
        `${h.name} deleted, with ${logs.length} logged day${logs.length === 1 ? '' : 's'}`);
    },
  },
};

/** Pause until a date: nothing is due or counted, and the habit comes back by itself. */
function openPause(h) {
  const t = today();
  const options = [['One week', addDays(t, 7)], ['Two weeks', addDays(t, 14)], ['A month', addMonths(t, 1)]];
  app.sheet({
    title: `Pause ${h.name}`,
    ui: { until: addDays(t, 7) },
    render: (s) => html`<div class="form">
      <p class="sheet-note">Nothing is due or counted while it’s paused, and it comes back by itself. Your history and run are kept.</p>
      <div class="chips">${options.map(([label, d]) => html`<button type="button" class="${cx('chip', s.ui.until === d && 'is-active')}" aria-pressed="${s.ui.until === d}" data-action="pick" data-d="${d}">${label}</button>`)}</div>
      <label class="field"><span class="field-label">Back on</span><input class="input" type="date" min="${addDays(t, 1)}" value="${s.ui.until}" data-change="until"></label>
      <button type="button" class="btn btn--primary btn--block" data-action="pause">Pause until ${fmtMD(s.ui.until)}</button>
    </div>`,
    actions: {
      pick: ({ data, sheet }) => { sheet.ui.until = data.d; sheet.refresh(); },
      pause: ({ sheet }) => {
        HS.setState(H.habit(h.id), 'paused', { until: sheet.ui.until });
        hap.tap();
        app.closeSheet(sheet);
        app.toast(`${h.name} paused until ${fmtMD(sheet.ui.until)}.`, { action: { label: 'Undo', fn: () => store.update('habits', h.id, { state: h.state, pausedUntil: h.pausedUntil ?? null }) } });
      },
    },
    inputs: { until: ({ value, sheet }) => { if (value && value > t) { sheet.ui.until = value; sheet.refresh(); } } },
  });
}

function sourceName(src) {
  if (src.startsWith('workout:')) return 'Workout log';
  if (src.startsWith('rel:')) return 'Relationship moments';
  return { sleep: 'Morning check-in', water: 'Water log', protein: 'Food log', produce: 'Food log', steps: 'Steps entry', mind: 'Reading & learning sessions',
    meditation: 'Meditation sessions', journal: 'Journal', top3: 'Top 3 priorities', deepWork: 'Focus block counter', breaks: 'Movement break counter',
    eyeBreaks: 'Visual break counter', shutdown: 'Work shutdown', weeklyReview: 'Weekly review', monthlyReview: 'Monthly review',
    measurements: 'Body measurements', photos: 'Progress photos' }[src] || src;
}
