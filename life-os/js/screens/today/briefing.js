// The morning briefing on Today: the day in a few lines (domain/briefing.js), from waking until
// noon, until you put it away for the day. Loaded only in the morning.
import * as store from '../../data/store.js';
import * as BR from '../../domain/briefing.js';
import { today } from '../../domain/dates.js';
import { html } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import * as TK from '../../domain/takeaways.js';
import { takeawayCard } from '../takeaways.js';

const seen = (date) => store.get('dailyReviews', date)?.briefingSeen;

/** The card, or '' when it isn't the morning, it was put away, or there's nothing to say. */
export function briefingBlock(date = today(), now = new Date()) {
  if (date !== today() || now.getHours() >= 12 || seen(date) || store.settings().briefing === false) return '';
  const lines = BR.lines(date);
  const tk = TK.forMorning(date);
  if (lines.length < 2 && !tk) return '';
  return html`<section class="card brief" data-key="brief" aria-label="Your morning briefing">
    <div class="brief-head"><p class="section-label">This morning</p>
      <button type="button" class="link-btn" data-action="brief-done">Got it</button></div>
    <ul class="brief-list">${lines.map((l, i) => html`<li data-key="br-${i}"><a href="#/${l.to}" data-action="nav" data-to="${l.to}">${icon(l.ic, { size: 16 })}<span>${l.text}</span></a></li>`)}</ul>
    ${tk ? takeawayCard(tk, { compact: true }) : ''}
  </section>`;
}

/** Put it away for today. */
export function dismiss(date = today()) {
  const r = store.get('dailyReviews', date) || { id: date, date };
  store.put('dailyReviews', { ...r, briefingSeen: true });
}
