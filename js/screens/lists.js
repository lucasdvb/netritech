// Lists: every checklist you keep, in your order. Tap one to open it; drag to reorder.
import * as L from '../domain/lists.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const STARTERS = ['Groceries', 'Packing', 'Gift ideas', 'To buy', 'Ideas'];

export default {
  id: 'lists',
  title: 'Lists',
  render() {
    const all = L.lists();
    const free = STARTERS.filter((n) => !all.some((l) => l.name === n));
    return html`
      ${pageHead({ title: 'Lists', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New list">${icon('plus', { size: 20 })}</button>` })}
      <p class="lead">Checklists for what isn’t a task: shopping, packing, ideas. Tick as you go; untick to use a list again.</p>
      ${all.length ? html`<ol class="list sort-list" data-reorder="move-list">${all.map((l) => {
        const c = L.counts(l);
        return html`<li class="sort-row" data-key="${l.id}">
          <button type="button" class="drag-handle" data-drag aria-label="Move ${l.name}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
          <a class="row" href="#/plan/lists/${l.id}" data-action="nav" data-to="plan/lists/${l.id}">
            <span class="row-main"><span class="row-title">${l.name}</span><span class="row-sub tnum">${c.total ? (c.total - c.done ? `${c.total - c.done} to go${c.done ? ` · ${c.done} ticked` : ''}` : `All ${c.total} ticked`) : 'Empty'}</span></span>
            <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
      })}</ol>` : ''}
      ${free.length ? html`<div class="block"><p class="form-label">${all.length ? 'Start another' : 'Start with one'}</p>
        <div class="chips">${free.map((n) => html`<button type="button" class="chip" data-action="starter" data-name="${n}">${icon('plus', { size: 15 })}${n}</button>`)}</div></div>` : ''}`;
  },
  actions: {
    new: () => { const l = L.create(); hap.tap(); app.go(`plan/lists/${l.id}?rename=1`); },
    starter: ({ data }) => { const l = L.create(data.name); hap.tap(); app.go(`plan/lists/${l.id}`); },
    'move-list': ({ from, to }) => L.move(from, to),
  },
};
