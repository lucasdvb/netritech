// Books: reading now, want to read, finished. "Read 20 pages" anywhere moves the book on.
import * as store from '../data/store.js';
import * as B from '../domain/books.js';
import { fmtMD } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, bar } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export function bookSheet(existing = null) {
  const ui = { title: existing?.title || '', author: existing?.author || '', pages: existing?.pages ?? '', status: existing?.status || 'reading' };
  app.sheet({
    title: existing ? 'Edit book' : 'Add a book',
    ui,
    render: (s) => html`<div class="form">
      <label class="field"><span class="field-label">Title</span><input class="input" value="${s.ui.title}" data-input="bf" data-f="title" maxlength="120" autofocus></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Author <small>optional</small></span><input class="input" value="${s.ui.author}" data-input="bf" data-f="author" maxlength="80"></label>
        <label class="field"><span class="field-label">Pages <small>optional</small></span><input class="input" type="number" inputmode="numeric" min="1" value="${s.ui.pages}" data-input="bf" data-f="pages"></label>
      </div>
      <div class="field"><span class="field-label">Shelf</span><div class="chips">${Object.entries(B.STATUS).map(([id, label]) => html`<button type="button" class="${cx('chip', s.ui.status === id && 'is-active')}" aria-pressed="${s.ui.status === id}" data-action="bf-status" data-id="${id}">${label}</button>`)}</div></div>
      <button type="button" class="btn btn--primary btn--block" data-action="bf-save">${existing ? 'Save' : 'Add book'}</button>
    </div>`,
    inputs: { bf: ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; } },
    actions: {
      'bf-status': ({ data, sheet }) => { sheet.ui.status = data.id; sheet.refresh(); },
      'bf-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.title.trim()) { app.toast('Add the title.'); return; }
        const pages = u.pages === '' ? null : Math.max(1, Number(u.pages));
        if (existing) store.put('books', { ...existing, title: u.title.trim(), author: u.author.trim(), pages, status: u.status, finishedAt: u.status === 'finished' ? existing.finishedAt || null : null });
        const b = existing || B.create({ title: u.title, author: u.author, pages, status: u.status });
        hap.success();
        app.closeSheet(sheet);
        if (!existing) app.go(`plan/books/${b.id}`);
      },
    },
  });
}

export function bookRow(b) {
  const p = B.progress(b);
  return html`<li data-key="b-${b.id}"><a class="row" href="#/plan/books/${b.id}" data-action="nav" data-to="plan/books/${b.id}">
    <span class="row-ic">${icon(b.status === 'finished' ? 'check' : 'book-open', { size: 18 })}</span>
    <span class="row-main"><span class="row-title" data-morph="book-${b.id}">${b.title}</span>
      <span class="row-sub">${b.status === 'finished' ? `Finished${b.finishedAt ? ` ${fmtMD(b.finishedAt)}` : ''}` : p.pages ? `Page ${p.page} of ${p.pages}` : p.page ? `Page ${p.page}` : b.author || B.STATUS[b.status]}</span>
      ${b.status === 'reading' && p.ratio != null ? html`<span class="book-bar">${bar(p.ratio, { label: `${b.title}: how far through` })}</span>` : ''}</span>
    <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
}

export default {
  id: 'books',
  title: 'Books',
  render() {
    const shelves = Object.entries(B.STATUS).map(([id, label]) => ({ id, label, list: B.byStatus(id) })).filter((s) => s.list.length);
    return html`
      ${pageHead({ title: 'Books', back: { to: 'plan', label: 'Plan' }, actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="Add a book">${icon('plus', { size: 20 })}</button>` })}
      <p class="lead">Log pages from anywhere (“read 20 pages”) and the book you’re reading moves on.</p>
      ${shelves.length ? shelves.map((s) => html`<section class="block" data-key="shelf-${s.id}"><div class="block-head"><h2 class="block-title">${s.label}</h2><span class="block-meta tnum">${s.list.length}</span></div>
        <ul class="list">${s.list.map(bookRow)}</ul></section>`)
        : empty({ ic: 'book-open', title: 'No books yet', body: 'Add what you’re reading now. Pages you log move it along.', cta: 'Add a book', action: 'new' })}`;
  },
  actions: { new: () => bookSheet() },
};
