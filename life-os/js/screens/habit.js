import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { priorityLabel, catLabel, sectionLabel, habitColor } from '../domain/taxonomy.js';
import { today, addDays, range, lastNDays, fmtMD, fmtDayShort, relativeDay, startOfWeek } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { lineChart, barChart, heatmap } from '../ui/charts.js';
import { habitValue, habitTarget, pct, num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { openHabit } from './sheets.js';

function history(h) {
  const end = today();
  const start = startOfWeek(addDays(end, -7 * 12));
  return range(start, addDays(startOfWeek(end), 6)).map((d) => {
    if (d > end) return { date: d, state: 'future' };
    if (!H.started(h, d)) return { date: d, state: 'off' };
    if (H.dayMode(d) === 'sick') return { date: d, state: 'rest' };
    if (H.isDone(h, d)) return { date: d, state: 'done' };
    const s = h.schedule || {};
    if ((s.kind === 'daily' || s.kind === 'weekdays') && H.isScheduledDay(h, d) && d !== end) return { date: d, state: 'miss' };
    return { date: d, state: 'idle' };
  });
}

export default {
  id: 'habit',
  title: ({ params }) => H.habit(params.id)?.name || 'Habit',
  render({ params }) {
    const h = H.habit(params.id);
    if (!h) return html`${pageHead({ title: 'Not found', back: { to: 'habits', label: 'Habits' } })}${empty({ ic: 'circle-alert', title: 'This habit doesn’t exist anymore.' })}`;
    const c7 = H.consistency(h, today(), 7);
    const c30 = H.consistency(h, today(), 30);
    const c90 = H.consistency(h, today(), 90);
    const r = H.runs(h);
    const numeric = H.isNumeric(h);
    const days30 = lastNDays(today(), 30);
    const notes = store.where('habitLogs', (l) => l.habitId === h.id && (l.note || '').trim()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
    const goal = h.goalId ? store.get('goals', h.goalId) : null;
    const s = h.schedule || {};
    const facts = [
      ['Schedule', H.scheduleLabel(h)],
      ['Priority', priorityLabel(h.priority)],
      ['Area', `${catLabel(h.category)} · ${sectionLabel(h.section)}`],
      numeric ? ['Target', `${habitTarget(h, H.displayTarget(h, today()))}${h.min != null && h.min !== h.target ? ` · counts from ${habitTarget(h, H.threshold(h, today()))}` : ''}`] : null,
      h.ramp ? ['Adaptive target', h.ramp.map((x) => num(x)).join(' → ')] : null,
      h.time ? ['Time', h.time] : null,
      h.reminder ? ['Reminder', h.reminder] : null,
      ['Daily score', h.affectsScore && h.priority !== 'optional' ? 'Counts' : 'Doesn’t count'],
      h.mvd ? ['Minimum day', h.mvdLabel || 'Included'] : null,
      h.source ? ['Tracked from', sourceName(h.source)] : null,
      goal ? ['Goal', goal.name] : null,
    ].filter(Boolean);

    return html`
      ${pageHead({ title: h.name, eyebrow: `${catLabel(h.category)} · ${priorityLabel(h.priority)}`, back: { to: 'habits', label: 'Habits' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      ${h.description ? html`<p class="lead">${h.description}</p>` : ''}
      ${h.archived ? html`<div class="notice">${icon('archive', { size: 16 })} Archived. History is kept. <button type="button" class="link-btn" data-action="restore">Restore</button></div>` : ''}

      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">7 days</p><p class="stat-value tnum">${pct(c7.ratio)}</p><p class="stat-sub">${c7.expected ? `${Math.round(c7.done)} of ${Math.round(c7.expected) || 1}` : 'starting'}</p></div>
        <div class="stat"><p class="stat-label">30 days</p><p class="stat-value tnum">${pct(c30.ratio)}</p><p class="stat-sub">${c30.expected ? `${Math.round(c30.done)} of ${Math.round(c30.expected) || 1}` : '—'}</p></div>
        <div class="stat"><p class="stat-label">90 days</p><p class="stat-value tnum">${pct(c90.ratio)}</p><p class="stat-sub">${c90.expected ? `${Math.round(c90.done)} of ${Math.round(c90.expected) || 1}` : '—'}</p></div>
      </div>
      ${(h.streaks || r.best >= 5) && !H.isFlexible(h) ? html`<p class="quiet-line">${icon('history', { size: 15 })} Best run ${r.best} day${r.best === 1 ? '' : 's'}${r.current > 1 ? ` · current ${r.current}` : ''}</p>` : ''}
      ${H.isFlexible(h) ? html`<p class="quiet-line">${icon('calendar', { size: 15 })} ${H.periodLabel(h, today())}</p>` : ''}

      <section class="block">
        <div class="block-head"><h2 class="block-title">Last 13 weeks</h2><button type="button" class="link-btn" data-action="log-today">Log today</button></div>
        <div class="card">${heatmap(history(h), { label: (d) => `${fmtMD(d.date)}: ${d.state === 'done' ? 'done' : d.state === 'miss' ? 'missed' : '—'}` })}
          <div class="heat-legend"><span><i class="heat-cell heat--done"></i>Done</span><span><i class="heat-cell heat--miss"></i>Missed</span><span><i class="heat-cell heat--rest"></i>Sick</span></div></div>
      </section>

      ${numeric && h.type !== 'rating' ? html`<section class="block"><div class="block-head"><h2 class="block-title">Last 30 days</h2></div>
        <div class="card">${barChart({
          labels: days30.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days30.map((d) => fmtMD(d)),
          values: days30.map((d) => (H.started(h, d) ? H.value(h, d) : null)), color: habitColor(h),
          fmt: (v) => habitValue(h, v), goal: { value: H.displayTarget(h, today()), label: habitTarget(h, H.displayTarget(h, today())) },
        })}</div></section>` : ''}
      ${h.type === 'rating' ? html`<section class="block"><div class="block-head"><h2 class="block-title">Last 30 days</h2></div>
        <div class="card">${lineChart({ labels: days30.map((d) => fmtMD(d)), series: [{ values: days30.map((d) => H.value(h, d)), color: habitColor(h), area: true }], yMin: 0, yMax: 10 })}</div></section>` : ''}

      <section class="block"><div class="block-head"><h2 class="block-title">Details</h2></div>
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
  actions: {
    edit: ({ params }) => app.go(`habits/${params.id}/edit`),
    'log-today': ({ params }) => openHabit(params.id, today()),
    archive: ({ params }) => {
      const h = H.habit(params.id);
      store.update('habits', h.id, { archived: true });
      hap.tap();
      app.toast(`${h.name} archived`, { action: { label: 'Undo', fn: () => store.update('habits', h.id, { archived: false }) } });
    },
    restore: ({ params }) => { store.update('habits', params.id, { archived: false }); hap.tap(); },
    delete: async ({ params }) => {
      const h = H.habit(params.id);
      const logs = store.where('habitLogs', (l) => l.habitId === h.id);
      const ok = await app.confirm({ title: `Delete “${h.name}”?`, body: `This removes the habit and its ${logs.length} logged day${logs.length === 1 ? '' : 's'}. Archiving keeps the history instead.`, confirm: 'Delete', tone: 'danger' });
      if (!ok) return;
      store.batch([{ store: 'habits', delete: h.id }, ...logs.map((l) => ({ store: 'habitLogs', delete: l.id }))]);
      app.replace('habits');
      app.toast('Habit deleted');
    },
  },
};

function sourceName(src) {
  if (src.startsWith('workout:')) return 'Workout log';
  if (src.startsWith('rel:')) return 'Relationship moments';
  return { sleep: 'Morning check-in', water: 'Water log', protein: 'Food log', produce: 'Food log', steps: 'Steps entry', mind: 'Reading & learning sessions',
    meditation: 'Meditation sessions', journal: 'Journal', top3: 'Top 3 priorities', deepWork: 'Focus block counter', breaks: 'Movement break counter',
    eyeBreaks: 'Visual break counter', shutdown: 'Work shutdown', weeklyReview: 'Weekly review', monthlyReview: 'Monthly review',
    measurements: 'Body measurements', photos: 'Progress photos' }[src] || src;
}
