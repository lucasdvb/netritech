// Every number explains itself (56): tap a run, a strength, a consistency, a goal's percentage, the
// week on Review or a weight average and a sheet shows how it was worked out, with your own numbers
// in the sum. Nothing here is estimated for show: it reads the same functions the screens do.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { scheduleLabel } from '../domain/habits-more.js';
import * as G from '../domain/goals.js';
import * as M from '../domain/metrics.js';
import { dayScore } from '../domain/scoring.js';
import { week } from '../domain/story.js';
import { today, addDays, range, fmtMD, fmtDayShort } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { app } from '../ui/app-api.js';
import { pct, num, kgOut, weightUnit } from '../ui/format.js';

const sum = (parts) => html`<p class="explain-sum tnum">${parts}</p>`;
const note = (text) => html`<p class="sheet-note">${text}</p>`;
const days = (list) => html`<ol class="explain-days">${list.map((d) => html`<li class="${cx('explain-day', d.cls)}"><span class="tnum">${d.label}</span><span>${d.value}</span></li>`)}</ol>`;

const EXPLAIN = {
  consistency({ id, days: n }) {
    const h = H.habit(id);
    if (!h) return null;
    const span = Number(n) || 30;
    const c = H.consistency(h, today(), span);
    const s = h.schedule || { kind: 'daily' };
    const fixed = s.kind === 'daily' || s.kind === 'weekdays';
    const recent = range(addDays(today(), -Math.min(span, 14) + 1), today()).reverse().map((d) => {
      if (!H.started(h, d)) return { label: `${fmtDayShort(d)} ${fmtMD(d)}`, value: 'Not started yet', cls: 'is-rest' };
      const done = H.counts(h, d);
      const off = H.isOff(H.dayMode(d)) || H.pausedOn(h, d) || H.isReserve(h, d);
      const due = fixed ? H.isScheduledDay(h, d) : true;
      return { label: `${fmtDayShort(d)} ${fmtMD(d)}`, value: done ? 'Done' : off ? 'Doesn’t count' : due ? (d === today() ? 'Still open' : 'Missed') : 'Not due', cls: done ? 'is-done' : off || !due ? 'is-rest' : '' };
    });
    return {
      title: `${span}-day consistency`,
      body: html`${sum(c.expected ? html`${num(c.done, 0)} done ÷ ${num(c.expected, fixed ? 0 : 1)} expected = <strong>${pct(c.ratio)}</strong>` : 'Not enough days yet')}
        ${note(fixed ? `The days it was scheduled in the last ${span} days, and how many of them counted. Days off, reserve days and paused days don’t count against you, and today only counts once it’s done.`
          : `${scheduleLabel(h)}: over ${span} days that’s about ${num(c.expected, 1)} times expected. Done more often than that still shows 100%.`)}
        <p class="section-label">The last ${Math.min(span, 14)} days</p>${days(recent)}`,
    };
  },
  run({ id }) {
    const h = H.habit(id);
    if (!h) return null;
    const r = H.runs(h);
    const unit = r.unit === 'week' ? 'weeks' : r.unit === 'month' ? 'months' : r.unit === 'time' ? 'times' : 'days';
    return {
      title: 'Current run',
      body: html`${sum(html`<strong>${r.current}</strong> ${unit} in a row · best ${r.best} · ${r.comebacks} comeback${r.comebacks === 1 ? '' : 's'}`)}
        ${note(`A run counts the ${unit} in a row it counted. One miss doesn’t end it: the next one is a chance to come back. Two misses in a row start it again from zero.`)}
        ${note('A comeback is doing it again straight after a miss; the number counts the last 30 days. Days off and paused days are skipped, not missed.')}
        ${r.missesInRow ? note(`Missed the last ${r.missesInRow === 1 ? 'time' : `${r.missesInRow} times`}: ${r.missesInRow === 1 ? 'do it next time and the run carries on.' : 'the next one starts a new run.'}`) : ''}`,
    };
  },
  strength({ id }) {
    const h = H.habit(id);
    if (!h) return null;
    const r = H.runs(h);
    const a = H.strengthStep(h);
    return {
      title: 'Strength',
      body: html`${sum(html`<strong>${Math.round(r.strength * 100)}%</strong> after ${r.total} time${r.total === 1 ? '' : 's'} it counted`)}
        ${note(`Each time it’s due, strength moves ${num(a * 100, 1)}% of the way: towards 100% when it counts, towards 0% when it’s missed. So it builds slowly, a miss only dips it, and it never resets.`)}
        ${note('It reads the last year. Around 80% and steady, a habit tends to feel automatic.')}`,
    };
  },
  goal({ id }) {
    const g = store.get('goals', id);
    if (!g) return null;
    const p = G.progress(g);
    const m = G.measureOf(g);
    const meta = G.MEASURES.find((x) => x.id === m);
    let body;
    if (p.kind === 'numeric' && meta?.kind === 'count') {
      body = html`${sum(html`${num(p.current, 0)} ÷ ${num(g.target, 0)} = <strong>${pct(p.ratio)}</strong>`)}${note(`${meta.label}, counted from the goal’s start${g.since ? ` (${fmtMD(g.since)})` : ''}.`)}`;
    } else if (p.kind === 'numeric') {
      const w = m === 'weight';
      const v = (x) => (x == null ? '—' : w ? `${num(kgOut(x), 1)} ${weightUnit()}` : `${num(x, 1)}${g.unit ? ` ${g.unit}` : ''}`);
      body = p.ratio == null ? note('Needs a start, a target and a current value to work out.')
        : html`${sum(html`(${v(g.start)} − ${v(p.current)}) ÷ (${v(g.start)} − ${v(g.target)}) = <strong>${pct(p.ratio)}</strong>`)}
          ${note(`How far you’ve come from where you started, out of the whole way to the target.${w ? ' Now is your 7-day average weight, so one heavy morning doesn’t move it much.' : ''}`)}`;
    } else if (p.kind === 'milestones') {
      body = html`${sum(html`${p.done} ÷ ${p.total} milestones = <strong>${pct(p.ratio)}</strong>`)}${note('Only finished milestones count, not effort along the way.')}`;
    } else {
      const c = G.habitConsistency(g);
      body = html`${sum(c.ratio == null ? 'No linked habits logged yet' : html`average of ${c.rows.length} habit${c.rows.length === 1 ? '' : 's'} = <strong>${pct(c.ratio)}</strong>`)}
        <ul class="explain-days">${c.rows.map((r) => html`<li class="explain-day"><span>${r.habit.name}</span><span class="tnum">${pct(r.c.ratio)}</span></li>`)}</ul>
        ${note('Each habit’s 30-day consistency, averaged. Tap a habit on the goal’s page to see how its own number is worked out.')}`;
    }
    return { title: g.name, body };
  },
  week() {
    const w = week();
    const list = w.days.filter((d) => !d.future).map((d) => {
      const s = dayScore(d.date);
      return { label: `${fmtDayShort(d.date)} ${fmtMD(d.date)}`, value: d.ratio == null ? (d.off ? 'Day off' : 'Nothing planned') : `${pct(d.ratio)} · ${s.done} of ${s.total}`, cls: d.ratio == null ? 'is-rest' : '' };
    });
    return {
      title: 'This week',
      body: html`${sum(html`average of ${list.filter((x) => x.cls !== 'is-rest').length} day${list.length === 1 ? '' : 's'} = <strong>${w.ratio != null ? pct(w.ratio) : '—'}</strong>`)}
        ${days(list)}
        ${note('Each day’s number is how much of that day’s plan you did: the habits due that day, your routines (each step counts) and your three priorities. A tiny version counts as done. Days off don’t count; today counts once you’ve done something.')}`,
    };
  },
  weight({ date }) {
    const d = date || today();
    const list = range(addDays(d, -6), d).reverse().map((x) => ({ label: `${fmtDayShort(x)} ${fmtMD(x)}`, value: M.weight(x) != null ? `${num(kgOut(M.weight(x)), 1)} ${weightUnit()}` : '—', cls: M.weight(x) == null ? 'is-rest' : '' }));
    const avg = M.weightAvg(d, 7);
    const n = list.filter((x) => x.cls !== 'is-rest').length;
    return {
      title: '7-day average',
      body: html`${sum(avg == null ? 'No weigh-ins this week' : html`${n} weigh-in${n === 1 ? '' : 's'} averaged = <strong>${num(kgOut(avg), 1)} ${weightUnit()}</strong>`)}
        ${days(list)}${note('Daily weight swings with water, salt and food. The average of the last 7 days shows where it’s really going.')}`,
    };
  },
};

/** Open the explanation for a number. `what` is one of the keys above; `data` its dataset. */
export function openExplain(what, data = {}) {
  const e = EXPLAIN[what]?.(data);
  if (!e) return;
  app.sheet({ title: e.title, render: () => html`<div class="explain">${e.body}</div>` });
}
