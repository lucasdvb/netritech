// Choose exercises from the library: search, a category filter, and a tap to add. With `multi` the
// sheet stays open so a whole workout can be built in one go; each tap shows how many you added.
import * as F from '../domain/fitness.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { segmented } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export function pickExercise({ title = 'Add exercise', multi = false, onPick }) {
  return app.sheet({
    title,
    size: 'tall',
    ui: { q: '', cat: 'all', added: [] },
    render: (s) => {
      const cats = [{ id: 'all', label: 'All' }, ...F.CATEGORIES];
      const q = s.ui.q.trim().toLowerCase();
      const list = F.exercises().filter((e) => (s.ui.cat === 'all' || e.category === s.ui.cat) && (!q || e.name.toLowerCase().includes(q)));
      return html`<div class="form">
        <div class="search-field">${icon('search', { size: 16 })}<input type="search" placeholder="Search exercises" value="${s.ui.q}" data-input="q" aria-label="Search exercises"></div>
        ${segmented(cats, s.ui.cat, { action: 'cat', name: 'Category' })}
        <ul class="food-list food-list--tall">${list.map((e) => {
          const n = s.ui.added.filter((id) => id === e.id).length;
          return html`<li data-key="${e.id}"><button type="button" class="${cx('food-item', n && 'is-added')}" data-action="pick" data-id="${e.id}" aria-label="Add ${e.name}${n ? `, added ${n === 1 ? 'once' : `${n} times`}` : ''}">
            <span class="food-name">${e.name}</span><span class="food-meta">${F.categoryLabel(e.category)}${e.defaultLoad ? ` · ${e.defaultLoad} kg` : ''}</span><span class="food-add">${icon(n ? 'check' : 'plus', { size: 18 })}</span></button></li>`;
        })}</ul>
        ${!list.length ? html`<p class="muted center">No match. Add it in the exercise library.</p>` : ''}
        ${multi ? html`<button type="button" class="btn btn--primary btn--block" data-action="done">${s.ui.added.length ? `Done · ${s.ui.added.length} added` : 'Done'}</button>` : ''}
      </div>`;
    },
    inputs: { q: ({ value, sheet }) => { sheet.ui.q = value; sheet.refresh(); } },
    actions: {
      cat: ({ data, sheet }) => { sheet.ui.cat = data.value; sheet.refresh(); },
      pick: ({ data, sheet }) => {
        onPick(data.id);
        hap.tap();
        if (!multi) { app.closeSheet(sheet); return; }
        sheet.ui.added.push(data.id);
        sheet.refresh();
      },
      done: ({ sheet }) => app.closeSheet(sheet),
    },
  });
}
