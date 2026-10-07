import * as store from '../core/store.js';
import * as M from '../core/metrics.js';
import * as H from '../core/habits.js';
import { isWorkday } from '../core/coach.js';
import { today, lastNDays, startOfWeek, relativeDay, fmtTime, fmtDayShort, fmtMD, range } from '../core/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, check } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { openShutdown, bumpCounter, reviewOf, saveReview } from './sheets.js';

export default {
  id: 'work',
  title: 'Work',
  render() {
    const r = M.review(today()) || {};
    const top = (r.top3 || []).filter((p) => (p.text || '').trim());
    const days = lastNDays(today(), 14);
    const shutdowns = store.all('dailyReviews').filter((x) => x.shutdown?.done).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7);
    const weekDays = range(startOfWeek(today()), today()).filter(isWorkday);
    const priDone = weekDays.reduce((a, d) => a + (M.review(d)?.top3 || []).filter((p) => p.done && p.text).length, 0);
    const priSet = weekDays.reduce((a, d) => a + (M.review(d)?.top3 || []).filter((p) => p.text).length, 0);
    const deep = weekDays.reduce((a, d) => a + (M.review(d)?.deepWork || 0), 0);
    return html`
      ${pageHead({ title: 'Work', back: { to: 'more', label: 'More' } })}
      <p class="lead">Do the important work in the day, then close it so the evening belongs to people.</p>
      <section class="card">
        <div class="card-head"><p class="section-label">Today’s Top 3</p><a class="link-btn" href="#/today" data-action="nav" data-to="today">Edit on Today</a></div>
        ${top.length ? html`<ol class="top3-read">${top.map((p, i) => html`<li class="${cx(p.done && 'is-done')}">${check(p.done, { action: 'top3', data: { i }, label: p.text, cls: 'check--sm' })}<span>${p.text}</span></li>`)}</ol>`
          : html`<p class="muted small">No priorities yet. Write three before work starts.</p>`}
      </section>
      <div class="stat-row stat-row--3 block-tight">
        <div class="stat"><p class="stat-label">Focus blocks today</p><p class="stat-value tnum">${r.deepWork || 0}<span class="stat-unit">/ 2–3</span></p>
          <div class="mini-ctl"><button type="button" class="icon-btn icon-btn--sm" data-action="deep" data-delta="-1" aria-label="One less focus block">${icon('minus', { size: 15 })}</button><button type="button" class="icon-btn icon-btn--sm icon-btn--filled" data-action="deep" data-delta="1" aria-label="Add a focus block">${icon('plus', { size: 15 })}</button></div></div>
        <div class="stat"><p class="stat-label">Priorities · week</p><p class="stat-value tnum">${priDone}<span class="stat-unit">/ ${priSet}</span></p><p class="stat-sub">done / set</p></div>
        <div class="stat"><p class="stat-label">Focus · week</p><p class="stat-value tnum">${deep}</p><p class="stat-sub">blocks</p></div>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">Focus blocks · 14 days</h2></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: days.map((d) => M.review(d)?.deepWork || null), color: 'var(--c-work)', fmt: (v) => `${v} blocks`, goal: { value: 2, label: '2' }, height: 110 })}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Shutdown</h2></div>
        <div class="card">
          ${r.shutdown?.done ? html`<p class="shift-done">${icon('moon', { size: 16 })} Work closed at ${fmtTime(new Date(r.shutdown.at))}. Life mode.</p>` : html`<p class="muted small">At about 20:00: what did I complete, what remains, what’s first tomorrow? Then stop.</p>`}
          <button type="button" class="btn ${r.shutdown?.done ? 'btn--soft' : 'btn--primary'} btn--block" data-action="shutdown">${icon('power', { size: 16 })} ${r.shutdown?.done ? 'Edit shutdown' : 'Close the work day'}</button>
        </div>
        ${shutdowns.length ? html`<ul class="list block-tight">${shutdowns.map((x) => html`<li class="row"><span class="row-main"><span class="row-title">${relativeDay(x.date)} · ${fmtTime(new Date(x.shutdown.at))}</span>
          <span class="row-sub">${[x.shutdown.completed && `Done: ${x.shutdown.completed.split('\n')[0]}`, x.shutdown.first && `Next: ${x.shutdown.first}`].filter(Boolean).join(' · ') || 'Closed'}</span></span></li>`)}</ul>` : ''}
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Weekly business review</h2></div>
        <div class="card"><p class="muted small">Revenue · pipeline · sales activity · client delivery · marketing · cash flow · outstanding tasks · one strategic priority.</p>
          <a class="link-btn" href="#/more/review/week" data-action="nav" data-to="more/review/week">Part of the weekly review</a></div>
      </section>`;
  },
  actions: {
    deep: ({ data }) => bumpCounter(today(), 'deepWork', Number(data.delta)),
    shutdown: () => openShutdown(today()),
    top3: ({ data }) => {
      const r = reviewOf(today());
      const list = [...(r.top3 || [])].filter((p) => (p.text || '').trim());
      const all = [...(r.top3 || [])];
      const target = list[Number(data.i)];
      const idx = all.findIndex((p) => p.id === target.id);
      all[idx] = { ...all[idx], done: !all[idx].done };
      saveReview(today(), { top3: all });
      all[idx].done ? hap.success() : hap.tap();
    },
  },
};
