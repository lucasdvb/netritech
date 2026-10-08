// Dates: birthdays and anniversaries (every year) and one-off events with an optional countdown on
// Today. Anything in the next two weeks shows on Today under Coming up.
import * as E from '../domain/events.js';
import { today, fmtMDY, fmtMD } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, segmented } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { deleteWithUndo } from '../ui/undo.js';

export default {
  id: 'dates',
  title: 'Dates',
  render() {
    const list = E.sorted();
    const ahead = list.filter((x) => x.in >= 0);
    const past = list.filter((x) => x.in < 0);
    const row = (x) => html`<li data-key="${x.e.id}"><button type="button" class="row" data-action="edit" data-id="${x.e.id}">
      <span class="row-ic">${icon(E.kindOf(x.e).ic, { size: 18 })}</span>
      <span class="row-main"><span class="row-title">${E.label(x)}</span><span class="row-sub">${x.e.kind === 'event' ? fmtMDY(x.on) : fmtMD(x.on)}${x.e.countdown ? ' · counting down on Today' : ''}</span></span>
      <span class="row-right tnum">${E.inWords(x.in)}</span></button></li>`;
    return html`
      ${pageHead({ title: 'Dates', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New date">${icon('plus', { size: 20 })}</button>` })}
      <p class="lead">Birthdays, anniversaries and the days you’re counting down to. The next two weeks show on Today.</p>
      ${ahead.length ? html`<ul class="list">${ahead.map(row)}</ul>`
        : empty({ ic: 'calendar-heart', title: 'Never miss the ones that matter', body: 'Add birthdays and anniversaries once; they come round every year. Add an event to count down to it.', cta: 'Add a date', action: 'new' })}
      ${past.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Past events</h2></div><ul class="list">${past.map(row)}</ul></section>` : ''}`;
  },
  actions: {
    new: () => openDate(null),
    edit: ({ data }) => openDate(data.id),
  },
};

export function openDate(id) {
  const cur = id ? E.all().find((e) => e.id === id) : null;
  app.sheet({
    title: cur ? 'Edit date' : 'New date',
    size: 'detent',
    ui: { kind: cur?.kind || 'birthday', countdown: !!cur?.countdown, noYear: !!cur?.noYear, error: '' },
    render: (s) => html`<form class="form" data-submit="save">
      ${segmented(E.KINDS.map((k) => ({ id: k.id, label: k.label })), s.ui.kind, { action: 'kind', name: 'Kind' })}
      <label class="field"><span class="field-label">${s.ui.kind === 'birthday' ? 'Whose birthday' : s.ui.kind === 'anniversary' ? 'What it marks' : 'What’s happening'}</span>
        <input class="input" name="title" value="${cur?.title || ''}" maxlength="60" placeholder="${s.ui.kind === 'birthday' ? 'e.g. Mum' : s.ui.kind === 'anniversary' ? 'e.g. Our wedding' : 'e.g. Trip to Japan'}" autofocus></label>
      <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${cur?.date || today()}"></label>
      ${s.ui.kind !== 'event' ? html`<div class="set-row"><span class="set-text"><span class="set-label">I don’t know the year</span><span class="set-hint">Then no age or count of years is shown.</span></span>
        ${toggle(s.ui.noYear, { action: 'noyear', label: 'I don’t know the year' })}</div>` : ''}
      <div class="set-row"><span class="set-text"><span class="set-label">Count down on Today</span><span class="set-hint">${s.ui.kind === 'event' ? 'Shows on Today until the day, however far.' : 'Shows on Today all year, not just the last two weeks.'}</span></span>
        ${toggle(s.ui.countdown, { action: 'countdown', label: 'Count down on Today' })}</div>
      ${s.ui.error ? html`<p class="field-error" role="alert">${s.ui.error}</p>` : ''}
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">Delete</button>` : ''}
    </form>`,
    actions: {
      kind: ({ data, sheet }) => { sheet.ui.kind = data.value; sheet.refresh(); },
      noyear: ({ sheet }) => { sheet.ui.noYear = !sheet.ui.noYear; sheet.refresh(); },
      countdown: ({ sheet }) => { sheet.ui.countdown = !sheet.ui.countdown; sheet.refresh(); },
      save: ({ form, sheet }) => {
        try {
          E.save({ id: cur?.id, title: form.title, date: form.date, kind: sheet.ui.kind, countdown: sheet.ui.countdown, noYear: sheet.ui.kind !== 'event' && sheet.ui.noYear });
          hap.success();
          app.closeSheet(sheet);
        } catch (err) { sheet.ui.error = err.message; sheet.refresh(); }
      },
      delete: ({ sheet }) => { app.closeSheet(sheet); deleteWithUndo([{ store: 'events', id: cur.id }], 'Date deleted'); },
    },
  });
}
