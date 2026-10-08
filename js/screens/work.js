import * as store from '../data/store.js';
import { priorities } from '../domain/tasks.js';
import { areaBlocks } from './area.js';
import * as M from '../domain/metrics.js';
import { isWorkday } from '../domain/coach.js';
import { today, lastNDays, startOfWeek, relativeDay, fmtTime, fmtDayShort, fmtMD, range } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { bumpCounter } from './sheets.js';

export default {
  id: 'work',
  title: 'Work',
  render() {
    const r = M.review(today()) || {};
    const days = lastNDays(today(), 14);
    const shutdowns = store.all('dailyReviews').filter((x) => x.shutdown?.done).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7);
    const weekDays = range(startOfWeek(today()), today()).filter(isWorkday);
    const pri = weekDays.flatMap((d) => priorities(d));
    const priDone = pri.filter((t) => t.done).length;
    const priSet = pri.length;
    const deep = weekDays.reduce((a, d) => a + (M.review(d)?.deepWork || 0), 0);
    return html`
      ${pageHead({ title: 'Work', back: { to: 'progress', label: 'Progress' } })}
      <p class="lead">Do the important work in the day, then close it so the evening belongs to people.</p>
      <div class="stat-row stat-row--3 block-tight">
        <div class="stat"><p class="stat-label">Focus today</p><p class="stat-value tnum">${r.deepWork || 0}<span class="stat-unit">/ 2–3</span></p>
          <div class="mini-ctl"><button type="button" class="icon-btn icon-btn--sm" data-action="deep" data-delta="-1" aria-label="One less focus block">${icon('minus', { size: 15 })}</button><button type="button" class="icon-btn icon-btn--sm icon-btn--filled" data-action="deep" data-delta="1" aria-label="Add a focus block">${icon('plus', { size: 15 })}</button></div></div>
        <div class="stat"><p class="stat-label">Priorities</p><p class="stat-value tnum">${priDone}<span class="stat-unit">/ ${priSet}</span></p><p class="stat-sub">this week</p></div>
        <div class="stat"><p class="stat-label">Focus blocks</p><p class="stat-value tnum">${deep}</p><p class="stat-sub">this week</p></div>
      </div>
      <button type="button" class="btn btn--primary btn--block block-tight" data-action="focus">${icon('timer', { size: 16 })} ${store.settings().focus ? 'Focus timer' : 'Start a focus block'}</button>
      <section class="block"><div class="block-head"><h2 class="block-title">Focus blocks</h2><span class="block-meta">14 days</span></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: days.map((d) => M.review(d)?.deepWork || null), color: 'var(--c-work)', fmt: (v) => `${v} blocks`, goal: { value: 2, label: '2' }, height: 110 })}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Shutdown</h2></div>
        <div class="card">
          ${r.shutdown?.done ? html`<p class="shift-done">${icon('moon', { size: 16 })} Work closed at ${fmtTime(new Date(r.shutdown.at))}. Life mode.</p>` : html`<p class="muted small">At about 20:00: what did I complete, what remains, what’s first tomorrow? Then stop.</p>`}
          <p class="quiet-line">${icon('sun', { size: 15 })} Your Top 3 and the evening shutdown live on Today.</p>
        </div>
        ${shutdowns.length ? html`<ul class="list block-tight">${shutdowns.map((x) => html`<li class="row"><span class="row-main"><span class="row-title">${relativeDay(x.date)} · ${fmtTime(new Date(x.shutdown.at))}</span>
          <span class="row-sub">${[x.shutdown.completed && `Done: ${x.shutdown.completed.split('\n')[0]}`, x.shutdown.first && `Next: ${x.shutdown.first}`].filter(Boolean).join(' · ') || 'Closed'}</span></span></li>`)}</ul>` : ''}
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Weekly business review</h2></div>
        <div class="card"><p class="muted small">Revenue · pipeline · sales activity · client delivery · marketing · cash flow · outstanding tasks · one strategic priority.</p>
          <a class="link-btn" href="#/reflect/review/week" data-action="nav" data-to="reflect/review/week">Part of the weekly review</a></div>
      </section>
      ${areaBlocks('work')}`;
  },
  actions: {
    deep: ({ data }) => bumpCounter(today(), 'deepWork', Number(data.delta)),
    focus: async () => (await import('./focus-sheet.js')).openFocus(),
  },
};
