// The weekly tidy-up (H8): habits untouched for two weeks, each one keep, smaller, pause until a
// date, or archive. Nothing changes until Done, and Done has Undo.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as A from '../domain/adapt.js';
import { statePatch } from '../domain/habit-system.js';
import { today, addDays } from '../domain/dates.js';
import { habitColor } from '../domain/taxonomy.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { segmented } from '../ui/components.js';

const smaller = (h) => {
  const numeric = H.isNumeric(h) && h.type !== 'rating' && !h.ramp && h.target > 0;
  if (numeric) { const step = h.step > 0 ? h.step : 1; const to = Math.max(step, Math.round((h.target * 0.6) / step) * step); return to < h.target ? { target: to } : null; }
  return H.tinyOf(h) ? { tiny: true } : null;
};

export function openTidy(date = today()) {
  const list = A.untouched(date);
  if (!list.length) { app.toast('Nothing to tidy. Every habit has been touched in the last two weeks.'); return; }
  const ui = { pick: Object.fromEntries(list.map((h) => [h.id, 'keep'])), until: Object.fromEntries(list.map((h) => [h.id, addDays(date, 14)])) };
  app.sheet({
    title: 'Weekly tidy-up',
    size: 'detent',
    ui,
    render: (s) => html`<div class="form tidy">
      <p class="sheet-note">These haven’t been touched for two weeks. Keep them, make them smaller, pause them until a date, or archive them (archived habits keep their history).</p>
      <ul class="tidy-list">${list.map((h) => {
        const opts = [{ id: 'keep', label: 'Keep' }, ...(smaller(h) ? [{ id: 'smaller', label: 'Smaller' }] : []), { id: 'pause', label: 'Pause' }, { id: 'archive', label: 'Archive' }];
        return html`<li class="tidy-item" data-key="td-${h.id}" style="--ic:${habitColor(h)}">
          <p class="tidy-name"><span class="row-ic">${icon(h.icon, { size: 16 })}</span>${h.name}</p>
          ${segmented(opts, s.ui.pick[h.id], { action: 'td-pick', name: `${h.name}: what to do`, cls: `td-${h.id}` })}
          ${s.ui.pick[h.id] === 'pause' ? html`<label class="field field--inline"><span class="field-label">Until</span>
            <input class="input" type="date" min="${addDays(date, 1)}" value="${s.ui.until[h.id]}" data-change="td-until" data-id="${h.id}"></label>` : ''}
        </li>`;
      })}</ul>
      <button type="button" class="btn btn--primary btn--block" data-action="td-done">Done</button>
    </div>`,
    inputs: { 'td-until': ({ el, value, sheet }) => { sheet.ui.until[el.dataset.id] = value; } },
    actions: {
      // The segmented control tells which habit through its class (td-<id>).
      'td-pick': ({ el, data, sheet }) => {
        const id = [...el.closest('.seg').classList].find((c) => c.startsWith('td-'))?.slice(3);
        if (!id) return;
        sheet.ui.pick[id] = data.value;
        hap.tap();
        sheet.refresh();
      },
      'td-done': ({ sheet }) => {
        const before = list.map((h) => ({ ...H.habit(h.id) }));
        const ops = [];
        for (const h0 of list) {
          const h = H.habit(h0.id);
          const choice = sheet.ui.pick[h.id];
          if (choice === 'archive') ops.push({ store: 'habits', value: { ...h, archived: true } });
          if (choice === 'pause') ops.push({ store: 'habits', value: { ...h, ...statePatch(h, 'paused', { until: sheet.ui.until[h.id] || addDays(date, 14) }) } });
          if (choice === 'smaller') {
            const sm = smaller(h);
            ops.push({ store: 'habits', value: { ...h, temp: { ...(sm.target != null ? { target: sm.target, from: h.target } : { tiny: true }), since: date, until: addDays(date, 14) } } });
          }
        }
        if (ops.length) store.batch(ops);
        A.markTidy(date);
        hap.success();
        app.closeSheet(sheet);
        app.toast(ops.length ? `Tidied ${ops.length === 1 ? 'one habit' : `${ops.length} habits`}.` : 'All kept.', ops.length ? { action: { label: 'Undo', fn: () => store.batch(before.map((value) => ({ store: 'habits', value }))) } } : {});
      },
    },
  });
}
