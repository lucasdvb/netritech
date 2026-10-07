// Reflect: what you learned. Today's writing first, then the reviews that are due, then the archive.
import * as store from '../data/store.js';
import { today, relativeDay, fmtMD, endOfWeek, monthKey, fmtMonth, weekday, addDays } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { newEntry, KIND_LABEL } from './journal.js';
import { defaultWeek } from './review-week.js';

const preview = (j) => [...Object.values(j.answers || {}), j.text || ''].map((s) => (s || '').trim()).filter(Boolean).join(' · ').slice(0, 120);

function todayCard() {
  const t = today();
  const entries = store.onDate('journalEntries', t);
  const has = (k) => entries.some((j) => j.kind === k);
  const hour = new Date().getHours();
  return html`<section class="reflect-today" data-key="today" aria-label="Today’s reflection">
    <p class="section-label">Today’s reflection</p>
    <p class="reflect-q">${hour < 14 ? 'What matters most today?' : 'What did today teach you?'}</p>
    <div class="write-row">
      <button type="button" class="${cx('write-btn', hour < 14 && !has('morning') && 'is-suggested')}" data-action="new" data-kind="morning">${icon(has('morning') ? 'check' : 'sunrise', { size: 18 })}<span>Morning</span></button>
      <button type="button" class="${cx('write-btn', hour >= 18 && !has('evening') && 'is-suggested')}" data-action="new" data-kind="evening">${icon(has('evening') ? 'check' : 'moon', { size: 18 })}<span>Evening</span></button>
      <button type="button" class="write-btn" data-action="new" data-kind="free">${icon('feather', { size: 18 })}<span>Free entry</span></button>
    </div>
    <p class="privacy-line">${icon('lock', { size: 14 })} Private. Stored only on this device.</p>
  </section>`;
}

function reviewsDue() {
  const ws = defaultWeek();
  const wk = store.get('weeklyReviews', ws);
  const m = monthKey(today());
  const lastMonth = monthKey(addDays(`${m}-01`, -1));
  const monthEnd = monthKey(addDays(today(), 3)) !== m;
  const mId = monthEnd ? m : lastMonth;
  const mr = store.get('monthlyReviews', mId);
  const items = [
    { to: `reflect/review/week/${ws}`, ic: 'calendar-days', title: `Weekly review · ${fmtMD(ws)} – ${fmtMD(endOfWeek(ws))}`, done: !!wk?.completedAt,
      sub: wk?.completedAt ? 'Done · tap to revisit' : weekday(today()) === 7 ? 'Sunday evening is the moment · 15–30 min' : '15–30 min, best on Sunday evening' },
    { to: `reflect/review/month/${mId}`, ic: 'calendar', title: `Monthly review · ${fmtMonth(`${mId}-01`)}`, done: !!mr?.completedAt,
      sub: mr?.completedAt ? 'Done · tap to revisit' : 'Stop · start · continue · one focus' },
  ];
  return html`<section class="block" data-key="reviews">
    <div class="block-head"><h2 class="block-title">Reviews</h2><a class="link-btn" href="#/reflect/reviews" data-action="nav" data-to="reflect/reviews">Past reviews</a></div>
    <ul class="list">${items.map((it) => html`<li><a class="row" href="#/${it.to}" data-action="nav" data-to="${it.to}">
      <span class="${cx('row-ic', it.done && 'row-ic--done')}">${icon(it.done ? 'check' : it.ic, { size: 18 })}</span>
      <span class="row-main"><span class="row-title">${it.title}</span><span class="row-sub">${it.sub}</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>
  </section>`;
}

function recent() {
  const list = store.all('journalEntries').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || '').localeCompare(a.createdAt || ''))).slice(0, 5);
  if (!list.length) return '';
  return html`<section class="block" data-key="journal">
    <div class="block-head"><h2 class="block-title">Journal</h2><a class="link-btn" href="#/reflect/journal" data-action="nav" data-to="reflect/journal">All entries</a></div>
    <ul class="list">${list.map((j) => html`<li><a class="row journal-row" href="#/reflect/journal/${j.id}" data-action="nav" data-to="reflect/journal/${j.id}">
      <span class="row-main"><span class="row-title" data-morph="journal-${j.id}">${KIND_LABEL[j.kind]} <span class="muted">· ${relativeDay(j.date)}</span></span><span class="row-sub journal-preview">${preview(j) || 'Empty'}</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>
  </section>`;
}

export default {
  id: 'reflect',
  title: 'Reflect',
  render() {
    return html`
      ${pageHead({ title: 'Reflect', sub: 'What you learned.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${todayCard()}
      ${reviewsDue()}
      ${recent()}
      ${!store.all('journalEntries').length ? html`<section class="block"><a class="card card--link sort-cta" href="#/reflect/journal" data-action="nav" data-to="reflect/journal">
        <span class="sort-cta-text"><span class="card-title">Journal</span><span class="row-sub">Morning and evening prompts, or just write.</span></span>${icon('chevron-right', { size: 18 })}</a></section>` : ''}`;
  },
  actions: {
    new: ({ data }) => newEntry(data.kind),
  },
};
