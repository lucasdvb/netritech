// Edit Today (U7): reorder and hide blocks, and pin up to three actions. Saves as you go.
import * as store from '../../data/store.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { toggle } from '../../ui/controls.js';
import { app } from '../../ui/app-api.js';
import * as hap from '../../ui/haptics.js';
import { BLOCKS, PINS, DEFAULT_PINS, layoutOf, pinsOf } from './blocks.js';

const saveLayout = (order, hidden) => store.setSettings({ todayLayout: { order, hidden } });

export function openEditToday() {
  app.sheet({
    title: 'Edit Today',
    render: () => {
      const { order, hidden } = layoutOf();
      const pins = pinsOf();
      return html`<div class="form edit-today">
        <p class="sheet-note">The next action always comes first. Arrange the rest, and hide what you don’t need on Today. Nothing is deleted.</p>
        <ol class="et-list">${order.map((id, i) => {
          const b = BLOCKS.find((x) => x.id === id);
          const shown = !hidden.includes(id);
          return html`<li class="${cx('et-row', !shown && 'is-hidden')}" data-key="et-${id}">
            <span class="et-label">${b.label}</span>
            <button type="button" class="icon-btn icon-btn--sm" data-action="et-move" data-id="${id}" data-delta="-1" aria-label="Move ${b.label} up"${i === 0 ? ' disabled' : ''}>${icon('chevron-up', { size: 18 })}</button>
            <button type="button" class="icon-btn icon-btn--sm" data-action="et-move" data-id="${id}" data-delta="1" aria-label="Move ${b.label} down"${i === order.length - 1 ? ' disabled' : ''}>${icon('chevron-down', { size: 18 })}</button>
            ${toggle(shown, { action: 'et-show', data: { id }, label: `Show ${b.label}` })}
          </li>`;
        })}</ol>
        <div class="field"><span class="field-label">Pinned actions <small class="tnum">${pins.length} of 3</small></span>
          <div class="chips">${Object.entries(PINS).map(([k, p]) => {
            const on = pins.includes(k);
            return html`<button type="button" class="${cx('chip', on && 'is-active')}" aria-pressed="${on}" data-action="et-pin" data-k="${k}">${icon(p.ic, { size: 16 })}<span>${p.label}</span></button>`;
          })}</div>
          <span class="field-hint">One tap from Today. Choosing a fourth replaces the oldest.</span></div>
        <button type="button" class="link-btn" data-action="et-reset">Back to the default layout</button>
      </div>`;
    },
    actions: {
      'et-move': ({ data }) => {
        const { order, hidden } = layoutOf();
        const i = order.indexOf(data.id);
        const j = i + Number(data.delta);
        if (j < 0 || j >= order.length) return;
        [order[i], order[j]] = [order[j], order[i]];
        saveLayout(order, hidden);
        hap.tap();
        requestAnimationFrame(() => document.querySelector(`[data-action="et-move"][data-id="${data.id}"][data-delta="${data.delta}"]:not([disabled])`)?.focus());
      },
      'et-show': ({ data }) => {
        const { order, hidden } = layoutOf();
        saveLayout(order, hidden.includes(data.id) ? hidden.filter((x) => x !== data.id) : [...hidden, data.id]);
        hap.tap();
      },
      'et-pin': ({ data }) => {
        const pins = pinsOf();
        const next = pins.includes(data.k) ? pins.filter((k) => k !== data.k) : [...pins, data.k].slice(-3);
        store.setSettings({ pinned: next });
        hap.tap();
      },
      'et-reset': () => { store.setSettings({ todayLayout: null, pinned: DEFAULT_PINS }); hap.tap(); },
    },
  });
}
