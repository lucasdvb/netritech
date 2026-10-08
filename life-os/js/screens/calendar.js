// Calendar: every day of a month, shaded by its score, with workouts and journal entries marked.
// A day opens as a sheet of what happened, and from there into that day to edit it.
import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import * as F from '../domain/fitness.js';
import * as H from '../domain/habits.js';
import { dayScore } from '../domain/scoring.js';
import { catColor } from '../domain/taxonomy.js';
import { today, fmtMonth, startOfMonth, endOfMonth, addMonths, range, weekday, relativeDay, durationHM, fmtLong } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { num, pct, kgOut, weightUnit, litres } from '../ui/format.js';
import { app } from '../ui/app-api.js';

export function openDay(date) {
  app.sheet({
    title: fmtLong(date),
    render: () => {
      const s = dayScore(date);
      const hs = H.activeHabits().filter((h) => H.dueOn(h, date));
      const n = M.nutrition(date);
      const sl = M.sleep(date);
      const mood = M.mood(date);
      const ws = F.workoutsOn(date);
      const j = store.onDate('journalEntries', date);
      const r = M.review(date);
      const facts = [
        ['Score', s.ratio != null ? `${pct(s.ratio)} · ${s.done} of ${s.total}` : s.mode === 'sick' ? 'Sick day' : s.mode === 'away' ? 'Away' : '—'],
        ['Weight', M.weight(date) != null ? `${num(kgOut(M.weight(date)), 1)} ${weightUnit()}` : '—'],
        ['Workout', ws.length ? ws.map((w) => w.title).join(', ') : '—'],
        ['Nutrition', n.count ? `${num(n.protein)} g protein · ${num(n.kcal)} kcal` : '—'],
        ['Water', M.waterMl(date) ? litres(M.waterMl(date)) : '—'],
        ['Steps', M.steps(date) != null ? num(M.steps(date)) : '—'],
        ['Sleep', sl ? `${durationHM(sl.hours * 60)}${sl.quality ? ` · quality ${sl.quality}` : ''}` : '—'],
        ['Mood', mood ? `energy ${mood.energy ?? '—'} · stress ${mood.stress ?? '—'} · mood ${mood.mood ?? '—'}` : '—'],
        ['Journal', j.length ? `${j.length} entr${j.length === 1 ? 'y' : 'ies'}` : '—'],
        ['Win', r?.win || '—'],
        ['Sealed', r?.sealedAt ? 'Yes' : '—'],
      ];
      return html`<div class="form">
        <dl class="facts facts--plain">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
        ${hs.length ? html`<div><p class="form-label">Habits</p><div class="weekly-chips">${hs.map((h) => html`<span class="${cx('wchip', H.isDone(h, date) && 'is-done')}" style="--ic:${catColor(h.color || h.category)}">${icon(H.isDone(h, date) ? 'check' : h.icon, { size: 14 })}<span>${h.name}</span></span>`)}</div></div>` : ''}
        <button type="button" class="btn btn--primary btn--block" data-action="open-day">${date === today() ? 'Open today' : `Open ${relativeDay(date) === 'Yesterday' ? 'yesterday' : 'this day'} to edit it`}</button>
      </div>`;
    },
    actions: { 'open-day': ({ sheet }) => { app.closeSheet(sheet); app.go(date === today() ? 'today' : `today/${date}`); } },
  });
}

export default {
  id: 'calendar',
  title: 'Calendar',
  render({ ui }) {
    const month = ui.month || startOfMonth(today());
    const first = startOfMonth(month), last = endOfMonth(month);
    const cells = [...Array(weekday(first) - 1).fill(null), ...range(first, last)];
    return html`
      ${pageHead({ title: 'Calendar', back: { to: 'progress', label: 'Progress' } })}
      <section class="block block--first" data-key="cal">
        <div class="cal-head">
          <button type="button" class="icon-btn" data-action="month" data-delta="-1" aria-label="Previous month">${icon('chevron-left', { size: 20 })}</button>
          <h2 class="block-title">${fmtMonth(first)}</h2>
          <button type="button" class="icon-btn" data-action="month" data-delta="1" aria-label="Next month" ${first >= startOfMonth(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 20 })}</button>
        </div>
        <div class="cal-grid" role="group" aria-label="${fmtMonth(first)}">
          ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => html`<span class="cal-dow" aria-hidden="true">${d}</span>`)}
          ${cells.map((d) => {
            if (!d) return html`<span class="cal-empty"></span>`;
            const s = d <= today() && d >= H.trackingStart() ? dayScore(d) : null;
            const hasWorkout = F.workoutsOn(d).length > 0;
            const hasJournal = store.onDate('journalEntries', d).length > 0;
            return html`<button type="button" class="${cx('cal-day', d === today() && 'is-today', d > today() && 'is-future', H.isOff(s?.mode) && 'is-sick')}" data-action="day" data-date="${d}" ${d > today() ? 'disabled' : ''}
              aria-label="${fmtLong(d)}${s?.ratio != null ? `, ${pct(s.ratio)}` : ''}${hasWorkout ? ', workout' : ''}${hasJournal ? ', journal' : ''}">
              <span class="cal-num tnum">${Number(d.slice(8))}</span>
              <span class="cal-fill" style="opacity:${s?.ratio != null ? 0.12 + s.ratio * 0.88 : 0}"></span>
              <span class="cal-marks">${hasWorkout ? html`<i class="m-w"></i>` : ''}${hasJournal ? html`<i class="m-j"></i>` : ''}</span>
            </button>`;
          })}
        </div>
        <div class="cal-legend"><span><i class="cal-swatch"></i>Daily score</span><span><i class="m-w"></i>Workout</span><span><i class="m-j"></i>Journal</span></div>
      </section>`;
  },
  actions: {
    month: ({ data, ui }) => {
      const next = addMonths(ui.month || startOfMonth(today()), Number(data.delta));
      if (next > startOfMonth(today())) return;
      ui.month = next;
      app.refresh();
    },
    day: ({ data }) => openDay(data.date),
  },
};
