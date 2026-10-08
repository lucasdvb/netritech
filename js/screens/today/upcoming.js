// Coming up, on Today: birthdays, anniversaries and events in the next two weeks, and any countdown
// you asked for. Loaded after the first frame, and only when you have dates saved.
import * as E from '../../domain/events.js';
import { fmtDayShort, fmtMD } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';

export function upcomingBlock(date) {
  const list = E.upcoming(date).slice(0, 4);
  if (!list.length) return '';
  return html`<section class="soon" data-key="upcoming" aria-label="Coming up">
    <div class="block-head"><h2 class="block-title">Coming up</h2><a class="link-btn" href="#/plan/dates" data-action="nav" data-to="plan/dates">All dates</a></div>
    <ul class="soon-list">${list.map((x) => html`<li class="${cx('soon-row', x.in === 0 && 'is-today')}" data-key="soon-${x.e.id}">
      <span class="soon-ic">${icon(E.kindOf(x.e).ic, { size: 16 })}</span>
      <span class="soon-text">${E.label(x)}</span>
      <span class="soon-when tnum">${x.in === 0 ? 'Today' : x.in <= 6 ? `${fmtDayShort(x.on)} · ${E.inWords(x.in)}` : x.in <= 60 ? `${fmtMD(x.on)} · ${E.inWords(x.in)}` : E.inWords(x.in)}</span>
    </li>`)}</ul>
  </section>`;
}
