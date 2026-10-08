// One list: add items at the top (paste several lines to add them all), tick them off, drag to
// reorder. Ticked items wait at the bottom until you clear them, or untick them all to reuse.
import * as L from '../domain/lists.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { check } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as store from '../data/store.js';

const itemRow = (i, sortable) => html`<li class="${cx('li-row', i.done && 'is-done')}" data-key="${i.id}">
  ${sortable ? html`<button type="button" class="drag-handle" data-drag aria-label="Move ${i.text}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>` : ''}
  ${check(i.done, { action: 'tick', data: { id: i.id }, label: `${i.text}${i.done ? ', ticked' : ''}`, cls: 'check--sm' })}
  <input class="li-text" value="${i.text}" data-change="text" data-id="${i.id}" maxlength="120" aria-label="Item">
  <button type="button" class="icon-btn icon-btn--sm li-del" data-action="del" data-id="${i.id}" aria-label="Delete ${i.text}">${icon('x', { size: 16 })}</button>
</li>`;

export default {
  id: 'list',
  title: ({ params }) => L.list(params.id)?.name || 'List',
  render({ params, query, ui }) {
    const l = L.list(params.id);
    if (!l) return html`${pageHead({ title: 'List', back: { to: 'plan/lists', label: 'Lists' } })}${empty({ ic: 'list-checks', title: 'This list was deleted.' })}`;
    const open = (l.items || []).filter((i) => !i.done);
    const done = (l.items || []).filter((i) => i.done);
    const renaming = ui.renaming ?? !!query.rename;
    return html`
      ${pageHead({ title: l.name, back: { to: 'plan/lists', label: 'Lists' },
        actions: html`<button type="button" class="icon-btn" data-action="menu" aria-label="List options">${icon('ellipsis', { size: 20 })}</button>` })}
      ${renaming ? html`<label class="field block-tight"><span class="field-label">Name</span><input class="input" value="${l.name}" data-change="name" maxlength="40" autofocus enterkeyhint="done"></label>` : ''}
      <div class="task-add li-add">
        <span class="task-add-ic" aria-hidden="true">${icon('plus', { size: 18 })}</span>
        <input class="task-add-input" data-change="add" placeholder="Add an item" aria-label="Add an item" enterkeyhint="done" maxlength="2000"${renaming ? '' : ' autofocus'}>
      </div>
      ${open.length ? html`<ol class="li-list" data-reorder="move">${open.map((i) => itemRow(i, open.length > 1))}</ol>` : ''}
      ${!open.length && !done.length ? html`<p class="muted block-tight">Nothing here yet. Type an item and press return; paste a few lines to add them all.</p>` : ''}
      ${!open.length && done.length ? html`<p class="muted block-tight">${icon('check', { size: 14 })} All done.</p>` : ''}
      ${done.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Ticked</h2><span class="block-meta tnum">${done.length}</span>
          <button type="button" class="link-btn" data-action="clear">Clear</button></div>
        <ul class="li-list">${done.map((i) => itemRow(i, false))}</ul></section>` : ''}`;
  },
  // Pasting several lines adds each one as an item (a field on its own would join them up).
  mount(el, { params }) {
    el.addEventListener('paste', (e) => {
      const field = e.target.closest?.('[data-change="add"]');
      const text = e.clipboardData?.getData('text') || '';
      if (!field || !/\n/.test(text.trim())) return;
      e.preventDefault();
      L.add(params.id, text);
      field.value = '';
      hap.tap();
    });
  },
  actions: {
    tick: ({ data, params }) => { L.toggle(params.id, data.id); hap.tap(); },
    del: ({ data, params }) => {
      const before = L.list(params.id);
      L.removeItem(params.id, data.id);
      app.toast('Item deleted', { action: { label: 'Undo', fn: () => store.put('lists', before) } });
    },
    'move': ({ from, to, params }) => L.moveItem(params.id, from, to),
    clear: ({ params }) => {
      const before = L.list(params.id);
      L.clearDone(params.id);
      hap.tap();
      app.toast('Ticked items cleared', { action: { label: 'Undo', fn: () => store.put('lists', before) } });
    },
    menu: ({ params, ui }) => listMenu(params.id, ui),
  },
  inputs: {
    add: ({ el, value, params }) => {
      if (!value.trim()) return;
      L.add(params.id, value);
      el.value = '';
      hap.tap();
      requestAnimationFrame(() => el.focus());
    },
    text: ({ el, value, params }) => L.setText(params.id, el.dataset.id, value),
    name: ({ value, params, ui }) => { L.rename(params.id, value); ui.renaming = false; app.refresh(); },
  },
};

function listMenu(id, ui) {
  app.sheet({
    title: L.list(id)?.name || 'List',
    render: () => html`<div class="form">
      <button type="button" class="btn btn--soft btn--block" data-action="rename">${icon('pencil', { size: 16 })} Rename</button>
      <button type="button" class="btn btn--soft btn--block" data-action="uncheck">${icon('rotate-ccw', { size: 16 })} Untick everything</button>
      <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">${icon('trash-2', { size: 16 })} Delete list</button>
    </div>`,
    actions: {
      rename: ({ sheet }) => { ui.renaming = true; app.closeSheet(sheet); app.refresh(); },
      uncheck: ({ sheet }) => { L.uncheckAll(id); hap.tap(); app.closeSheet(sheet); },
      delete: ({ sheet }) => {
        const before = L.list(id);
        app.closeSheet(sheet);
        store.remove('lists', id);
        app.replace('plan/lists');
        app.toast(`${before.name} deleted`, { action: { label: 'Undo', fn: () => store.put('lists', before) } });
      },
    },
  });
}
