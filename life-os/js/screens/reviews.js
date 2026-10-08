import * as store from '../data/store.js';
import { today, endOfWeek, fmtMD, fmtMonth, monthKey, weekday } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { defaultWeek } from './review-week.js';

export default {
  id: 'reviews',
  title: 'Reviews',
  render() {
    const ws = defaultWeek();
    const cur = store.get('weeklyReviews', ws);
    const m = monthKey(today());
    const mr = store.get('monthlyReviews', m);
    const weeks = store.all('weeklyReviews').filter((r) => r.completedAt).sort((a, b) => (a.id < b.id ? 1 : -1));
    const months = store.all('monthlyReviews').filter((r) => r.completedAt).sort((a, b) => (a.id < b.id ? 1 : -1));
    return html`
      ${pageHead({ title: 'Reviews', back: { to: 'reflect', label: 'Reflect' } })}
      <div class="stack">
        <a class="card card--link review-cta" href="#/reflect/review/week/${ws}" data-action="nav" data-to="reflect/review/week/${ws}">
          <span class="row-ic" style="--ic:var(--c-life)">${icon('calendar-days', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Weekly review · ${fmtMD(ws)} – ${fmtMD(endOfWeek(ws))}</span>
            <span class="row-sub">${cur?.completedAt ? 'Done · tap to revisit' : weekday(today()) === 7 ? 'Sunday evening is the moment · 15–30 min' : 'Best on Sunday evening · 15–30 min'}</span></span>
          ${icon('chevron-right', { size: 18, cls: 'muted' })}</a>
        <a class="card card--link review-cta" href="#/reflect/review/month/${m}" data-action="nav" data-to="reflect/review/month/${m}">
          <span class="row-ic" style="--ic:var(--c-life)">${icon('calendar', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Monthly review · ${fmtMonth(`${m}-01`)}</span><span class="row-sub">${mr?.completedAt ? 'Done · tap to revisit' : 'Stop · start · continue · one focus'}</span></span>
          ${icon('chevron-right', { size: 18, cls: 'muted' })}</a>
      </div>
      ${weeks.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Past weeks</h2></div>
        <ul class="list">${weeks.map((w) => html`<li><a class="row" href="#/reflect/review/week/${w.id}" data-action="nav" data-to="reflect/review/week/${w.id}">
          <span class="row-main"><span class="row-title">${fmtMD(w.id)} – ${fmtMD(endOfWeek(w.id))}</span><span class="row-sub">${w.answers?.one ? `One change: ${w.answers.one}` : 'Completed'}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul></section>` : ''}
      ${months.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Past months</h2></div>
        <ul class="list">${months.map((r) => html`<li><a class="row" href="#/reflect/review/month/${r.id}" data-action="nav" data-to="reflect/review/month/${r.id}">
          <span class="row-main"><span class="row-title">${fmtMonth(`${r.id}-01`)}</span><span class="row-sub">${r.answers?.focus ? `Focus: ${r.answers.focus}` : 'Completed'}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul></section>` : ''}`;
  },
};
