// A new habit in three questions: what is it, when (after what), and what's the tiny version.
// Everything else gets a sensible default and lives under "More options" in the editor.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { catLabel, sectionLabel } from '../domain/taxonomy.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { fieldError } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** The habit the three answers describe, with everything else defaulted. */
export function draftFrom({ name = '', anchor = '', tiny = '' }) {
  const shape = H.guessShape(name, anchor);
  return H.newHabit({
    name: name.trim(), anchor: anchor.trim() || null, tiny: tiny.trim() ? { label: tiny.trim(), min: null } : null,
    type: 'binary', ...shape,
  });
}

export function openNewHabit(prefill = {}) {
  app.sheet({
    title: 'New habit',
    ui: { name: prefill.name || '', anchor: prefill.anchor || '', tiny: '', error: '' },
    render: (s) => {
      const u = s.ui;
      const shape = H.guessShape(u.name, u.anchor);
      const free = H.focusHabits().length < H.FOCUS_LIMIT;
      return html`<form class="form new-habit" data-submit="save" novalidate>
        <label class="field"><span class="field-label">What is it?</span>
          <textarea class="input input--grow${u.error ? ' is-invalid' : ''}" rows="1" data-grow data-input="f" data-f="name" placeholder="e.g. Read 10 pages" maxlength="60" autofocus aria-invalid="${!!u.error}" enterkeyhint="done">${u.name}</textarea>
          ${fieldError(u.error)}</label>
        <div class="field"><span class="field-label">When? <small>after something you already do</small></span>
          <div class="chips" role="group" aria-label="Suggested moments">${H.anchorSuggestions().slice(0, 6).map((a) => html`<button type="button" class="${cx('chip', u.anchor === a && 'is-active')}" aria-pressed="${u.anchor === a}" data-action="anchor" data-v="${a}">${a}</button>`)}</div>
          <textarea class="input input--grow" rows="1" data-grow data-input="f" data-f="anchor" placeholder="After I…" maxlength="60" aria-label="When, in your own words" enterkeyhint="done">${u.anchor}</textarea></div>
        <label class="field"><span class="field-label">What’s the tiny version?</span>
          <textarea class="input input--grow" rows="1" data-grow data-input="f" data-f="tiny" placeholder="e.g. Read one page" maxlength="60" enterkeyhint="done">${u.tiny}</textarea>
          <span class="field-hint">The two-minute version you can do on your worst day. It always counts.</span></label>
        <p class="new-habit-where">${icon(free ? 'target' : 'clock', { size: 16 })} ${free
          ? html`It joins <strong>your three</strong>: on Today and counted in your score.`
          : html`Your three are full, so it waits in <strong>Later</strong> until a slot frees up.`}
          <span class="muted">${catLabel(shape.category)} · ${sectionLabel(shape.section)} · every day</span></p>
        <div class="btn-row">
          <button type="button" class="btn btn--ghost" data-action="more">More options</button>
          <button type="submit" class="btn btn--primary">Add habit</button>
        </div>
      </form>`;
    },
    inputs: {
      f: ({ el, value, sheet }) => {
        sheet.ui[el.dataset.f] = value;
        if (el.dataset.f === 'name' && sheet.ui.error && value.trim()) sheet.ui.error = '';
        // Re-render only for answers that change the summary line, without stealing focus.
        if (el.dataset.f !== 'tiny') sheet.refresh();
      },
    },
    actions: {
      anchor: ({ data, sheet }) => { sheet.ui.anchor = sheet.ui.anchor === data.v ? '' : data.v; hap.tap(); sheet.refresh(); },
      more: async ({ sheet }) => {
        const draft = draftFrom(sheet.ui);
        app.closeSheet(sheet);
        (await import('./habit-edit.js')).openHabitEditor(draft);
      },
      save: ({ sheet }) => {
        if (!sheet.ui.name.trim()) {
          sheet.ui.error = 'Give it a short name.';
          sheet.refresh();
          sheet.el.querySelector('[data-f="name"]')?.focus();
          return;
        }
        const h = draftFrom(sheet.ui);
        store.put('habits', h);
        hap.success();
        app.closeSheet(sheet);
        app.toast(h.state === 'focus' ? `${h.name} is one of your three.` : `${h.name} is waiting in Later.`, {
          icon: 'check', action: { label: 'Open', fn: () => app.go(`plan/habits/${h.id}`) },
        });
      },
    },
  });
}
