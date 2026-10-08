// Today's row for a habit you're cutting down or quitting (13b): the day's count against its
// limit, and a tap to log one or an urge. Loaded the first time such a habit is on Today.
import * as H from '../../domain/habits.js';
import { habitColor } from '../../domain/taxonomy.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';

/** A habit you're cutting down or quitting: the day's count against its limit, and a tap to log. */
export function limitRow(h, date) {
  const n = H.log(h.id, date)?.value || 0;
  const max = H.limitOf(h);
  const kept = H.isDone(h, date);
  const sub = max === 0 ? (kept ? 'Free today' : 'Slipped today. Tomorrow is clean.')
    : `${n} of ${max}${h.unit ? ` ${h.unit}` : ''}${kept ? '' : ' · over the limit'}`;
  return html`<li class="${cx('hrow', 'hrow--limit', kept && 'is-done')}" data-key="${h.id}" data-habit="${h.id}" data-swipe="off" style="--ic:${habitColor(h)}">
    <button type="button" class="${cx('limit-badge', !kept && 'is-over')}" data-action="habit" data-id="${h.id}" aria-label="${h.name}: ${sub}. Log one or an urge">
      ${max === 0 ? icon(kept ? 'shield-check' : 'shield', { size: 17 }) : html`<span class="tnum">${n}</span>`}</button>
    <button type="button" class="hrow-main" data-action="habit" data-id="${h.id}">
      <span class="hrow-name">${h.name}</span>
      <span class="hrow-sub">${sub}</span>
    </button>
  </li>`;
}

