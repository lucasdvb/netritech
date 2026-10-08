// The safety nets' cards on Today: catch-up (yesterday's unlogged plan) and the weekly tidy-up.
// They load with the safety nets themselves, just after the first screen.
import * as store from '../../data/store.js';
import * as H from '../../domain/habits.js';
import * as A from '../../domain/adapt.js';
import { today } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { check } from '../../ui/controls.js';
import * as hap from '../../ui/haptics.js';
import { app } from '../../ui/app-api.js';
import { habitColor } from '../../domain/taxonomy.js';

/** What the cards (and the Now card's shrink and grow suggestions) do. */
export const actions = {
  'cu-tick': ({ data }) => { const h = H.habit(data.id); if (!h) return; H.tap(h, data.d) ? hap.success() : hap.tap(); },
  'cu-done': ({ data }) => { A.closeCatchUp(data.d); hap.tap(); },
  'cu-off': ({ data }) => {
    const before = store.settings()?.nets || {};
    store.setSettings({ nets: { ...before, catchUp: false } });
    A.closeCatchUp(data.d);
    app.toast('Catch-up is off. Settings can turn it back on.', { action: { label: 'Undo', fn: () => store.setSettings({ nets: before }) } });
  },
  'adapt-yes': ({ data }) => {
    const p = A.suggestions(today()).find((x) => x.habitId === data.id);
    if (!p) return;
    const undo = A.accept(p);
    hap.success();
    app.toast(p.kind === 'grow' ? 'Stepped up.' : p.kind === 'pause' ? 'Paused for two weeks.' : 'Smaller for two weeks.', { action: { label: 'Undo', fn: undo } });
  },
  'adapt-no': ({ data }) => { A.markSuggested(data.id); hap.tap(); },
  tidy: async () => (await import('../tidy.js')).openTidy(),
  'tidy-later': () => { A.markTidy(); hap.tap(); },
};

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
