// A book: where you are, your pace and when you'll finish at it, the sessions, and your notes.
import * as store from '../data/store.js';
import * as B from '../domain/books.js';
import * as TK from '../domain/takeaways.js';
import { fmtMD, fmtMDY, today } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, ring } from '../ui/components.js';
import { pct, num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { deleteWithUndo } from '../ui/undo.js';
import { bookSheet } from './books.js';

let noteTimer = 0;

export default {
  id: 'book',
  title: ({ params }) => B.book(params.id)?.title || 'Book',
  render({ params }) {
    const b = B.book(params.id);
    if (!b) return html`${pageHead({ title: 'Book', back: { to: 'plan/books', label: 'Books' } })}${empty({ ic: 'book-open', title: 'This book was removed.' })}`;
    const p = B.progress(b);
    const pace = B.pace(b);
    const sessions = store.all('readingSessions').filter((r) => r.bookId === b.id).sort((a, c) => (a.date < c.date ? 1 : -1)).slice(0, 12);
    const paceLine = b.status === 'finished' ? `Finished ${b.finishedAt ? fmtMDY(b.finishedAt) : ''}.`
      : pace.perDay > 0 ? `${num(pace.perDay, pace.perDay < 10 ? 1 : 0)} pages a day lately${pace.finish ? `: you’d finish around ${fmtMD(pace.finish)}` : ''}.`
        : 'Log pages to see your pace and when you’d finish.';
    return html`
      ${pageHead({ title: b.title, morph: `book-${b.id}`, eyebrow: b.author || B.STATUS[b.status], back: { to: 'plan/books', label: 'Books' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      <div class="card goal-hero">
        <span class="goal-ring">${ring(p.ratio || 0, { size: 84, stroke: 7, color: 'var(--accent)' })}<span class="goal-pct tnum">${p.ratio != null ? pct(p.ratio) : p.page || '—'}</span></span>
        <div><p class="card-title">${p.pages ? `Page ${p.page} of ${p.pages}` : p.page ? `Page ${p.page}` : 'Not started'}</p>
          <p class="muted small">${paceLine}</p></div>
      </div>
      ${b.status !== 'finished' ? html`<div class="btn-row block-tight">
        <button type="button" class="btn btn--primary" data-action="log-pages">${icon('plus', { size: 16 })} Log pages</button>
        <button type="button" class="btn btn--soft" data-action="set-page">Set page</button>
        <button type="button" class="btn btn--ghost" data-action="finish">Finished</button></div>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Notes</h2></div>
        <textarea class="input book-notes" rows="4" data-input="notes" aria-label="Notes on this book" maxlength="4000" placeholder="Ideas worth keeping, quotes, what you’d do differently">${b.notes || ''}</textarea></section>
      <section class="block" data-key="book-takeaways"><div class="block-head"><h2 class="block-title">Takeaways</h2>
          <button type="button" class="link-btn" data-action="bk-takeaway">${icon('plus', { size: 14 })} Keep one</button></div>
        ${TK.fromSource(`book:${b.id}`).length ? html`<ul class="list">${TK.fromSource(`book:${b.id}`).map((t) => html`<li data-key="bt-${t.id}"><div class="row row--static"><span class="row-main"><span class="row-title">${t.text}</span>
            <span class="row-sub">${t.retired ? 'Retired' : `Comes back ${fmtMD(t.due)}`}</span></span></div></li>`)}</ul>`
          : html`<p class="muted small">The idea from this book you want to live by. It comes back in your morning check-in, just as you’d forget it.</p>`}</section>
      ${sessions.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Sessions</h2></div>
        <ul class="list">${sessions.map((r) => html`<li class="row" data-key="${r.id}"><span class="row-main"><span class="row-title">${fmtMD(r.date)}</span>
          <span class="row-sub">${[r.pages ? `${r.pages} pages` : '', r.minutes ? `${r.minutes} min` : ''].filter(Boolean).join(' · ') || 'Logged'}</span></span></li>`)}</ul></section>` : ''}
      <div class="danger-zone">
        ${b.status !== 'reading' ? html`<button type="button" class="btn btn--soft" data-action="shelf" data-v="reading">Start reading</button>` : ''}
        ${b.status !== 'want' && b.status !== 'finished' ? html`<button type="button" class="btn btn--soft" data-action="shelf" data-v="want">Back on the shelf</button>` : ''}
        <button type="button" class="btn btn--ghost btn--danger-text" data-action="remove">Remove</button>
      </div>`;
  },
  inputs: {
    notes: ({ value, params }) => {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { const b = B.book(params.id); if (b) store.put('books', { ...b, notes: value }); }, 400);
    },
  },
  actions: {
    edit: ({ params }) => bookSheet(B.book(params.id)),
    'bk-takeaway': async ({ params }) => {
      const b = B.book(params.id);
      (await import('./takeaways.js')).openTakeaway({ source: `book:${b.id}`, sourceLabel: b.title });
    },
    'log-pages': async ({ params }) => {
      const b = B.book(params.id);
      const { openNumpad } = await import('../ui/numpad.js');
      openNumpad({ title: 'Pages read today', unit: 'pages', value: null, step: 5, min: 1, max: 2000,
        hint: b.pages ? `You’re on page ${b.currentPage || 0} of ${b.pages}.` : null,
        onSave: (n) => {
          const before = [{ store: 'books', value: B.book(b.id) }];
          const ops = B.readingOps(B.book(b.id), { pages: n, date: today() });
          store.batch(ops);
          hap.success();
          const done = ops[1].value.status === 'finished';
          app.toast(done ? `Finished ${b.title}. Well read.` : `${n} pages · page ${ops[1].value.currentPage}`, { icon: 'book-open',
            action: { label: 'Undo', fn: () => store.batch([...before, { store: 'readingSessions', delete: ops[0].value.id }]) } });
        } });
    },
    'set-page': async ({ params }) => {
      const b = B.book(params.id);
      const { openNumpad } = await import('../ui/numpad.js');
      openNumpad({ title: 'Current page', unit: '', value: b.currentPage || 0, step: 1, min: 0, max: b.pages || 5000,
        onSave: (n) => {
          const before = B.book(b.id);
          store.put('books', { ...before, currentPage: n, status: before.status === 'want' ? 'reading' : before.status, startedAt: before.startedAt || today() });
          hap.tap();
          app.toast(`On page ${n}`, { action: { label: 'Undo', fn: () => store.put('books', before) } });
        } });
    },
    finish: ({ params }) => {
      const before = B.book(params.id);
      store.put('books', { ...before, status: 'finished', finishedAt: today(), currentPage: before.pages || before.currentPage });
      hap.success();
      app.toast(`Finished ${before.title}.`, { icon: 'check', action: { label: 'Undo', fn: () => store.put('books', before) } });
    },
    shelf: ({ data, params }) => { const b = B.book(params.id); store.put('books', { ...b, status: data.v, startedAt: data.v === 'reading' ? b.startedAt || today() : b.startedAt }); hap.tap(); },
    remove: ({ params }) => {
      const b = B.book(params.id);
      app.replace('plan/books');
      deleteWithUndo([{ store: 'books', id: b.id }], `${b.title} removed. Its reading sessions stay in your history.`);
    },
  },
};
