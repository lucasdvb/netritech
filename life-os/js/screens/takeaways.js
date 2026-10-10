// Review › Takeaways: ideas worth keeping, from books, notes and reviews. One that's due comes back
// in the morning check-in (and on Today in the morning); "used it" or "still true" sends it further
// out, "forgot it" brings it back sooner, "retire" stops it.
import * as TK from '../domain/takeaways.js';
import { today, fmtMD, relativeDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** Keep a takeaway (from anywhere: a book, a note, the weekly review). */
export function openTakeaway({ source = '', sourceLabel = '', text = '' } = {}) {
  app.sheet({
    title: 'Keep a takeaway',
    ui: { text },
    render: (s) => html`<form class="form" data-submit="tk-save">
      <label class="field"><span class="field-label">The idea, in your words${sourceLabel ? html` <small>from ${sourceLabel}</small>` : ''}</span>
        <textarea class="input" rows="3" maxlength="280" data-input="tk-text" placeholder="Make the good habit obvious: put the shoes by the door." autofocus>${s.ui.text}</textarea></label>
      <p class="field-hint">It comes back tomorrow, then after 3, 7, 16, 35 and 90 days, each time just as it starts to fade.</p>
      <button type="submit" class="btn btn--primary btn--block">Keep it</button>
    </form>`,
    inputs: { 'tk-text': ({ value, sheet }) => { sheet.ui.text = value; } },
    actions: {
      'tk-save': ({ sheet }) => {
        const t = TK.add({ text: sheet.ui.text, source, sourceLabel });
        if (!t) { app.toast('Write the idea first.'); return; }
        hap.success();
        app.closeSheet(sheet);
        app.toast('Kept. It comes back tomorrow.', { icon: 'check', action: { label: 'Undo', fn: TK.remove.bind(null, t.id) } });
      },
    },
  });
}

/** One due takeaway as a card with its four answers (the morning check-in and Today use it). */
export function takeawayCard(t, { compact = false } = {}) {
  if (!t) return '';
  return html`<div class="card takeaway" data-key="tk-${t.id}">
    <p class="section-label">${compact ? 'Remember this?' : 'Comes back today'}${t.sourceLabel ? ` · ${t.sourceLabel}` : ''}</p>
    <p class="takeaway-text">${t.text}</p>
    <div class="takeaway-go">
      <button type="button" class="btn btn--primary btn--sm" data-action="tk-answer" data-id="${t.id}" data-how="used">Used it</button>
      <button type="button" class="btn btn--soft btn--sm" data-action="tk-answer" data-id="${t.id}" data-how="kept">Still true</button>
      <button type="button" class="btn btn--soft btn--sm" data-action="tk-answer" data-id="${t.id}" data-how="forgot">Had forgotten</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="tk-answer" data-id="${t.id}" data-how="retire">Retire</button>
    </div></div>`;
}

export const takeawayActions = {
  'tk-answer': ({ data }) => {
    const undo = TK.answer(data.id, data.how);
    hap.tap();
    const t = TK.one(data.id);
    app.toast(data.how === 'retire' ? 'Retired' : `Back ${relativeDay(t.due)?.toLowerCase() || `on ${fmtMD(t.due)}`}`, { action: { label: 'Undo', fn: undo } });
  },
};

export default {
  id: 'takeaways',
  title: 'Takeaways',
  render() {
    const due = TK.due();
    const all = TK.all();
    return html`
      ${pageHead({ title: 'Takeaways', back: { to: 'review', label: 'Review' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="tk-new">${icon('plus', { size: 16 })} Add</button>`,
        info: 'Ideas worth keeping, from books, notes and reviews. One comes back in your morning check-in each day it’s due, on a widening schedule, so it’s still there when you need it. Add one from a book’s page, a note, or here.' })}
      ${due.length ? html`<section class="block">${due.slice(0, 3).map((t) => takeawayCard(t))}</section>` : ''}
      ${all.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">All of them</h2><span class="block-meta tnum">${all.length}</span></div>
        <ul class="list">${all.map((t) => html`<li data-key="tka-${t.id}"><div class="row row--static"><span class="row-main"><span class="row-title">${t.text}</span>
          <span class="row-sub">${t.sourceLabel ? `${t.sourceLabel} · ` : ''}${t.due <= today() ? 'due now' : `next ${fmtMD(t.due)}`}${t.used ? ` · used ${t.used}×` : ''}</span></span></div></li>`)}</ul></section>`
        : empty({ ic: 'lightbulb', title: 'Ideas that come back', body: 'Keep the one idea from a book or a week that you want to live by. It returns just as you’d forget it.', cta: 'Keep one', action: 'tk-new' })}`;
  },
  actions: { 'tk-new': () => openTakeaway(), ...takeawayActions },
};
