import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { today, lastNDays, startOfWeek, relativeDay, fmtDayLetter, monthKey, fmtMonth, startOfMonth } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { openSession } from './sheets.js';

const DAILY = [['h-prayer', 'Prayer'], ['h-scripture', 'Scripture'], ['h-gratitude', 'Gratitude']];

export default {
  id: 'faith',
  title: 'Faith',
  render() {
    const days = lastNDays(today(), 7);
    const sessions = store.all('spiritualSessions').sort((a, b) => (a.date < b.date ? 1 : -1));
    const gratitude = sessions.filter((s) => s.kind === 'gratitude' && (s.notes || '').trim()).slice(0, 8);
    const church = H.habit('h-church');
    const study = H.habit('h-study');
    const mr = store.get('monthlyReviews', monthKey(today()));
    return html`
      ${pageHead({ title: 'Faith', back: { to: 'more', label: 'More' } })}
      <p class="lead">Practice, not points. This page shows what you did, nothing more.</p>
      <section class="card">
        <p class="section-label">Daily · last 7 days</p>
        <div class="practice">${DAILY.map(([id, label]) => {
          const h = H.habit(id);
          if (!h) return '';
          return html`<div class="practice-row"><span class="practice-name">${label}</span>
            <span class="practice-days">${days.map((d) => html`<span class="${cx('pday', H.isDone(h, d) && 'is-on', d === today() && 'is-today')}" title="${relativeDay(d)}">${fmtDayLetter(d)}</span>`)}</span>
            <button type="button" class="${cx('icon-btn icon-btn--sm', H.isDone(h, today()) && 'is-on')}" data-action="mark" data-id="${id}" aria-pressed="${H.isDone(h, today())}" aria-label="${label} today">${icon(H.isDone(h, today()) ? 'check' : 'plus', { size: 16 })}</button></div>`;
        })}</div>
      </section>
      <div class="quick-row">
        <button type="button" class="btn btn--primary btn--sm" data-action="log" data-kind="prayer">${icon('hand-heart', { size: 16 })} Prayer</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="log" data-kind="scripture">${icon('book-heart', { size: 16 })} Scripture</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="log" data-kind="gratitude">${icon('sparkle', { size: 16 })} Gratitude</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="log" data-kind="study">Study</button>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">This week</h2></div>
        <dl class="facts">
          <div><dt>Church / worship</dt><dd>${church && H.periodDone(church, today()) ? 'Yes' : church ? 'Sunday' : '—'}</dd></div>
          <div><dt>Longer Scripture study</dt><dd>${study ? (H.periodDone(study, today()) ? 'Done' : 'Not yet') : '—'}</dd></div>
          <div><dt>Prayer for family and direction</dt><dd><button type="button" class="link-btn" data-action="log" data-kind="prayer">Log</button></dd></div>
        </dl>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Monthly reflection</h2></div>
        <div class="card">
          <p class="reflect-q">Am I becoming more disciplined, loving, truthful, patient and useful?</p>
          ${mr?.spirit ? html`<p class="reflect-a">${mr.spirit}</p>` : html`<p class="muted small">Answered in the monthly review.</p>`}
          <a class="link-btn" href="#/more/review/month" data-action="nav" data-to="more/review/month">Open ${fmtMonth(startOfMonth(today()))} review</a>
        </div>
      </section>
      ${gratitude.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Gratitude</h2></div>
        <ul class="list">${gratitude.map((g) => html`<li class="row"><span class="row-main"><span class="row-title">${g.notes}</span><span class="row-sub">${relativeDay(g.date)}</span></span></li>`)}</ul></section>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Recent</h2></div>
        ${sessions.length ? html`<ul class="list">${sessions.slice(0, 12).map((s) => html`<li><button type="button" class="row" data-action="edit" data-id="${s.id}">
          <span class="row-main"><span class="row-title">${s.kind[0].toUpperCase() + s.kind.slice(1)}${s.passage ? ` · ${s.passage}` : ''}</span><span class="row-sub">${relativeDay(s.date)}${s.minutes ? ` · ${s.minutes} min` : ''}${s.notes ? ` · ${s.notes.slice(0, 60)}` : ''}</span></span></button></li>`)}</ul>`
          : html`<p class="muted">Ticking prayer on Today is enough. Log a session here when you want to keep a note or a passage.</p>`}
      </section>`;
  },
  actions: {
    mark: ({ data }) => { const h = H.habit(data.id); const now = H.toggle(h, today()); now ? hap.success() : hap.tap(); },
    log: ({ data }) => openSession('spiritual', today(), null, { kind: data.kind, minutes: data.kind === 'gratitude' ? 2 : 10 }),
    edit: ({ data }) => openSession('spiritual', null, store.get('spiritualSessions', data.id)),
  },
};
