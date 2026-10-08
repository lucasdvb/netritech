// Edit Today (U7): drag blocks into order and hide them, and choose and order the pinned
// actions. Saves as you go.
import * as store from '../../data/store.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { toggle } from '../../ui/controls.js';
import { app } from '../../ui/app-api.js';
import * as hap from '../../ui/haptics.js';
import { BLOCKS, PINS, DEFAULT_PINS, MAX_PINS, layoutOf, pinsOf } from './blocks.js';

const saveLayout = (order, hidden) => store.setSettings({ todayLayout: { order, hidden } });

export function openEditToday() {
  app.sheet({
    title: 'Edit Today',
    render: () => {
      const { order, hidden } = layoutOf();
      const pins = pinsOf();
      const free = Object.keys(PINS).filter((k) => !pins.includes(k));
      return html`<div class="form edit-today">
        <p class="sheet-note">The next action always comes first. Drag the rest into the order you like, and hide what you don’t need. Nothing is deleted.</p>
        <ol class="et-list" data-reorder="et-move">${order.map((id) => {
          const b = BLOCKS.find((x) => x.id === id);
          const shown = !hidden.includes(id);
          return html`<li class="${cx('et-row', !shown && 'is-hidden')}" data-key="et-${id}">
            <button type="button" class="drag-handle" data-drag aria-label="Move ${b.label}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
            <span class="et-label">${b.label}</span>
            ${toggle(shown, { action: 'et-show', data: { id }, label: `Show ${b.label}` })}
          </li>`;
        })}</ol>
        <div class="field"><span class="field-label">Pinned actions <small class="tnum">${pins.length} of ${MAX_PINS}</small></span>
          ${pins.length ? html`<ol class="et-list" data-reorder="et-pin-move">${pins.map((k) => html`<li class="et-row" data-key="pin-${k}">
            <button type="button" class="drag-handle" data-drag aria-label="Move ${PINS[k].label}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
            <span class="et-ic">${icon(PINS[k].ic, { size: 16 })}</span><span class="et-label">${PINS[k].label}</span>
            <button type="button" class="icon-btn icon-btn--sm" data-action="et-pin" data-k="${k}" aria-label="Unpin ${PINS[k].label}">${icon('x', { size: 16 })}</button>
          </li>`)}</ol>` : ''}
          ${free.length && pins.length < MAX_PINS ? html`<div class="chips et-add">${free.map((k) => html`<button type="button" class="chip" data-action="et-pin" data-k="${k}">${icon('plus', { size: 15 })}<span>${PINS[k].label}</span></button>`)}</div>` : ''}
          <span class="field-hint">One tap from Today, in this order. Up to ${MAX_PINS}.</span></div>
        <button type="button" class="link-btn" data-action="et-reset">Back to the default layout</button>
      </div>`;
    },
    actions: {
      'et-move': ({ from, to }) => {
        const { order, hidden } = layoutOf();
        saveLayout(moved(order, from, to), hidden);
      },
      'et-show': ({ data }) => {
        const { order, hidden } = layoutOf();
        saveLayout(order, hidden.includes(data.id) ? hidden.filter((x) => x !== data.id) : [...hidden, data.id]);
        hap.tap();
      },
      'et-pin': ({ data }) => {
        const pins = pinsOf();
        if (!pins.includes(data.k) && pins.length >= MAX_PINS) return;
        store.setSettings({ pinned: pins.includes(data.k) ? pins.filter((k) => k !== data.k) : [...pins, data.k] });
        hap.tap();
      },
      'et-pin-move': ({ from, to }) => store.setSettings({ pinned: moved(pinsOf(), from, to) }),
      'et-reset': () => { store.setSettings({ todayLayout: null, pinned: DEFAULT_PINS }); hap.tap(); },
    },
  });
}

const moved = (arr, from, to) => { const out = [...arr]; const [x] = out.splice(from, 1); out.splice(to, 0, x); return out; };
