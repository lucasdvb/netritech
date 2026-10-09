// Plan › Brain dump: get it out of your head. Write at the top and file it under a category (or
// leave it Unsorted), then find it again by category or by searching. Tap a note to edit it, move
// it, pin it, make it a task, or delete it.
import * as N from '../domain/notes.js';
import * as store from '../data/store.js';
import { relativeDay, today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const label = (c) => c || 'Unsorted';
const when = (n) => relativeDay((n.updatedAt || n.createdAt || '').slice(0, 10) || today());

/** One row of category chips: tap one to choose it. */
function picker(current, action, { withAll = false, counts = null, add = false } = {}) {
  const opts = [...(withAll ? ['all'] : []), N.UNSORTED, ...N.categories()];
  const name = (c) => (c === 'all' ? 'All' : label(c));
  return html`<div class="chips chips--scroll" role="group" aria-label="${withAll ? 'Show' : 'Category'}">${opts.map((c) => {
    const n = counts ? (c === 'all' ? N.notes().length : counts.get(c) || 0) : null;
    if (counts && c === N.UNSORTED && !n) return '';
    return html`<button type="button" class="${cx('chip', current === c && 'is-active')}" aria-pressed="${current === c}" data-action="${action}" data-c="${c}">${name(c)}${n != null ? html` <span class="chip-n tnum">${n}</span>` : ''}</button>`;
  })}${add ? html`<button type="button" class="chip chip--add" data-action="cat-new" aria-label="New category">${icon('plus', { size: 15 })}New</button>` : ''}</div>`;
}

const noteCard = (n) => html`<li data-key="${n.id}"><button type="button" class="card note-card" data-action="open" data-id="${n.id}">
  <span class="note-text">${n.text}</span>
  <span class="note-meta">${n.pinned ? html`${icon('star', { size: 13 })} ` : ''}${label(n.category)} · ${when(n)}</span>
</button></li>`;

export default {
  id: 'notes',
  title: 'Brain dump',
  render({ ui }) {
    ui.show ??= 'all';
    if (ui.show !== 'all' && ui.show !== N.UNSORTED && !N.categories().includes(ui.show)) ui.show = 'all';
    ui.file ??= ui.show === 'all' ? N.UNSORTED : ui.show;
    if (ui.file && !N.categories().includes(ui.file)) ui.file = N.UNSORTED;
    const all = N.notes();
    const shown = N.filter({ category: ui.show, q: ui.q || '' });
    return html`
      ${pageHead({ title: 'Brain dump', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="cats" aria-label="Categories">${icon('ellipsis', { size: 20 })}</button>` })}
      <section class="card dump-add" data-key="add">
        <textarea class="dump-input" rows="3" data-input="draft" placeholder="What’s on your mind?" aria-label="New note" maxlength="4000">${ui.draft || ''}</textarea>
        <p class="field-label dump-file">File under</p>
        ${picker(ui.file, 'file', { add: true })}
        <button type="button" class="btn btn--primary btn--block btn--sm" data-action="save">${icon('plus', { size: 16 })} Save note</button>
      </section>
      ${all.length ? html`<section class="block" data-key="filter">
          ${picker(ui.show, 'show', { withAll: true, counts: N.counts() })}
          ${all.length > 6 ? html`<div class="search-field block-tight">${icon('search', { size: 16 })}<input type="search" placeholder="Search your notes" value="${ui.q || ''}" data-input="q" aria-label="Search your notes" enterkeyhint="search"></div>` : ''}
        </section>
        ${shown.length ? html`<ul class="note-list" data-key="list">${shown.map(noteCard)}</ul>`
          : html`<p class="muted block-tight" data-key="none">${ui.q ? `Nothing matches “${ui.q}”.` : `Nothing in ${label(ui.show)} yet.`}</p>`}`
      : empty({ ic: 'brain', title: 'Empty your head here.', body: 'Ideas, worries, things to look into. Write it down, file it, and let it go until you need it.' })}`;
  },
  // From search: open the note straight away.
  mount(el, ctx) {
    if (ctx.query.open) {
      window.history.replaceState(window.history.state, '', location.hash.split('?')[0]);
      openNote(ctx.query.open);
    }
  },
  inputs: {
    draft: ({ value, ui }) => { ui.draft = value; },
    q: ({ value, ui }) => { ui.q = value; app.refresh(); },
  },
  actions: {
    file: ({ data, ui }) => { ui.file = data.c; hap.tap(); app.refresh(); },
    show: ({ data, ui }) => { ui.show = data.c; if (data.c !== 'all') ui.file = data.c; hap.tap(); app.refresh(); },
    save: ({ el, ui }) => {
      const field = el.closest('.dump-add')?.querySelector('.dump-input');
      const n = N.create(field?.value ?? ui.draft, ui.file);
      if (!n) { field?.focus(); return; }
      ui.draft = '';
      if (field) field.value = '';
      hap.success();
      app.toast(`Saved to ${label(n.category)}`, { icon: 'check' });
      app.refresh();
    },
    open: ({ data }) => openNote(data.id),
    cats: () => manageCategories(),
    'cat-new': ({ ui }) => newCategory((c) => { ui.file = c; app.refresh(); }),
  },
};

function newCategory(onAdd) {
  app.sheet({
    title: 'New category',
    render: () => html`<form class="form" data-submit="add">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" maxlength="24" placeholder="e.g. Business ideas" autofocus enterkeyhint="done" autocapitalize="words"></label>
      <button type="submit" class="btn btn--primary btn--block">Add</button></form>`,
    actions: {
      add: ({ form, sheet }) => {
        const c = N.addCategory(form.name);
        if (!c) return;
        hap.tap();
        app.closeSheet(sheet);
        onAdd?.(c);
      },
    },
  });
}

/** Rename, reorder (up), add or delete categories. Deleting one moves its notes to Unsorted. */
function manageCategories() {
  app.sheet({
    title: 'Categories',
    render: () => {
      const counts = N.counts();
      return html`<div class="form">
        <p class="sheet-note">Rename a category to move its notes with it. Delete one and its notes go to Unsorted.</p>
        <ol class="cat-list">${N.categories().map((c, i) => html`<li class="cat-row" data-key="cat-${c}">
          <input class="input" value="${c}" maxlength="24" data-change="cat-name" data-c="${c}" aria-label="Category name">
          <span class="muted small tnum cat-n">${counts.get(c) || 0}</span>
          <button type="button" class="icon-btn icon-btn--sm" data-action="cat-up" data-i="${i}" ${i ? '' : 'disabled'} aria-label="Move ${c} up">${icon('chevron-up', { size: 16 })}</button>
          <button type="button" class="icon-btn icon-btn--sm btn--danger-text" data-action="cat-del" data-c="${c}" aria-label="Delete ${c}">${icon('trash-2', { size: 16 })}</button>
        </li>`)}</ol>
        <button type="button" class="btn btn--soft btn--block" data-action="cat-add">${icon('plus', { size: 16 })} New category</button>
      </div>`;
    },
    inputs: { 'cat-name': ({ el, value, sheet }) => { N.renameCategory(el.dataset.c, value); sheet.refresh(); app.refresh(); } },
    actions: {
      'cat-up': ({ data, sheet }) => { const i = Number(data.i); N.moveCategory(i, i - 1); hap.tap(); sheet.refresh(); },
      'cat-add': ({ sheet }) => newCategory(() => sheet.refresh()),
      'cat-del': ({ data, sheet }) => {
        const n = N.counts().get(data.c) || 0;
        const undo = N.deleteCategory(data.c);
        sheet.refresh();
        app.toast(`${data.c} deleted${n ? `; ${n} note${n === 1 ? '' : 's'} moved to Unsorted` : ''}`, { action: { label: 'Undo', fn: () => { undo(); sheet.refresh?.(); } } });
      },
    },
  });
}

export function openNote(id) {
  const n0 = N.note(id);
  if (!n0) return;
  app.sheet({
    title: 'Note',
    size: 'tall',
    render: () => {
      const n = N.note(id);
      if (!n) return '';
      return html`<div class="form note-sheet">
        <textarea class="input note-edit" rows="8" data-change="text" aria-label="Note" maxlength="4000">${n.text}</textarea>
        <div><p class="field-label">Category</p>${picker(n.category || N.UNSORTED, 'move')}</div>
        <div class="btn-row">
          <button type="button" class="btn btn--soft" data-action="pin">${icon('star', { size: 16 })} ${n.pinned ? 'Unpin' : 'Pin to the top'}</button>
          <button type="button" class="btn btn--soft" data-action="to-task">${icon('list-todo', { size: 16 })} Make it a task</button>
        </div>
        <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">${icon('trash-2', { size: 16 })} Delete note</button>
      </div>`;
    },
    inputs: { text: ({ value }) => N.setText(id, value) },
    actions: {
      move: ({ data, sheet }) => { N.file(id, data.c); hap.tap(); sheet.refresh(); },
      pin: ({ sheet }) => { N.pin(id); hap.tap(); sheet.refresh(); },
      'to-task': async ({ sheet }) => {
        const n = N.note(id);
        const T = await import('../domain/tasks.js');
        const lines = n.text.split('\n');
        const t = T.add({ title: N.firstLine(n.text, 120), notes: lines.slice(1).join('\n').trim() });
        store.remove('notes', id);
        app.closeSheet(sheet);
        hap.success();
        app.toast('Added to your tasks', { icon: 'check', action: { label: 'Undo', fn: () => { store.remove('tasks', t.id); store.put('notes', n); } } });
      },
      delete: ({ sheet }) => {
        const n = N.note(id);
        app.closeSheet(sheet);
        store.remove('notes', id);
        app.toast('Note deleted', { action: { label: 'Undo', fn: () => store.put('notes', n) } });
      },
    },
  });
}
