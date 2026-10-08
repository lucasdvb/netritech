// The safety nets' cards on Today: catch-up (yesterday's unlogged plan) and the weekly tidy-up.
// They load with the safety nets themselves, just after the first screen.
import * as H from '../../domain/habits.js';
import { html } from '../../ui/dom.js';
import { check } from '../../ui/controls.js';
import { habitColor } from '../../domain/taxonomy.js';

/** Catch-up (U5): yesterday's unlogged plan, once, as taps, never as a list of misses. */
export function catchUpBlock(cu, ui) {
  if (!cu) return '';
  // The list stays as it was when it appeared, so ticking one doesn't make it vanish.
  ui.catchUp = ui.catchUp?.date === cu.date ? ui.catchUp : { date: cu.date, ids: cu.habits.map((h) => h.id) };
  const list = ui.catchUp.ids.map((id) => H.habit(id)).filter(Boolean);
  return html`<section class="catchup" data-key="catchup" aria-label="Catch up on yesterday">
    <p class="catchup-eyebrow">Yesterday</p>
    <h2 class="catchup-title">Did any of these happen?</h2>
    <p class="catchup-sub">Tap what you did. Anything else just wasn’t logged.</p>
    <ul class="hlist">${list.map((h) => {
      const done = H.counts(h, cu.date);
      return html`<li class="${cx('hrow', done && 'is-done')}" data-key="cu-${h.id}" style="--ic:${habitColor(h)}">
        ${check(done, { action: 'cu-tick', data: { id: h.id, d: cu.date }, label: `${h.name}${done ? ', done yesterday' : ''}`, color: habitColor(h) })}
        <span class="hrow-main"><span class="hrow-name">${h.name}</span></span></li>`;
    })}</ul>
    <div class="catchup-foot">
      <button type="button" class="btn btn--soft btn--sm" data-action="cu-done" data-d="${cu.date}">Done</button>
      <button type="button" class="link-btn" data-action="cu-off" data-d="${cu.date}">Don’t ask again</button>
    </div>
  </section>`;
}

/** The weekly tidy-up (H8), offered at the start or end of a week when there's something to tidy. */
export function tidyBlock(list) {
  if (!list?.length) return '';
  return html`<section class="tidy-card" data-key="tidy" aria-label="Weekly tidy-up">
    <div class="tidy-text"><p class="tidy-title">Weekly tidy-up</p>
      <p class="tidy-sub">${list.length === 1 ? 'One habit' : `${list.length} habits`} untouched for two weeks. About 30 seconds.</p></div>
    <div class="tidy-actions"><button type="button" class="btn btn--soft btn--sm" data-action="tidy">Tidy up</button>
      <button type="button" class="link-btn" data-action="tidy-later">Not this week</button></div>
  </section>`;
}
