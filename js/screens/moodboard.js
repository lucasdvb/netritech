// Moodboard: up to five images that remind you why. Read them large here; arrange, caption or
// remove them in Edit. The first image leads the collage on Today.
import * as store from '../data/store.js';
import * as MB from '../domain/moodboard.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const addButton = (label, cls = 'btn btn--soft btn--sm') => html`<label class="${cls}">${icon('image-plus', { size: 16 })} ${label}
  <input type="file" accept="image/*" multiple class="sr-only" data-change="mb-file"></label>`;

const onToday = () => !(store.settings().todayLayout?.hidden || []).includes('moodboard');

export default {
  id: 'moodboard',
  title: 'Moodboard',
  render({ ui }) {
    const list = MB.items();
    const room = MB.MAX - list.length;
    const editing = ui.editing && list.length;
    return html`
      ${pageHead({ title: 'Moodboard', back: { to: 'plan', label: 'Plan' }, sub: 'Up to five images that remind you why. They sit on Today.',
        actions: list.length ? html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">${editing ? 'Done' : 'Edit'}</button>` : '' })}
      ${!list.length ? empty({ ic: 'image', title: 'Add what keeps you going', body: 'A place you’re working towards, people you do it for, the strength you’re building. Pictures stay on this device.' }) : ''}
      ${!list.length ? html`<div class="center block-tight">${addButton('Add images', 'btn btn--primary')}</div>` : ''}
      ${list.length && !editing ? html`<div class="mb-gallery">${list.map((x, i) => html`<figure class="mb-figure" data-key="${x.id}" data-static="${x.id}:${x.caption}">
          <img data-mb="${x.id}" alt="${x.caption || `Moodboard image ${i + 1}`}" decoding="async">
          ${x.caption ? html`<figcaption>${x.caption}</figcaption>` : ''}</figure>`)}</div>` : ''}
      ${editing ? html`<section class="block-tight">
          <ol class="mb-edit" data-reorder="mb-move">${list.map((x, i) => html`<li class="mb-row" data-key="${x.id}">
            <button type="button" class="drag-handle" data-drag aria-label="Move image ${i + 1}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
            <img class="mb-thumb" data-mb="${x.id}" data-static="${x.id}" alt="">
            <input class="input" value="${x.caption || ''}" placeholder="Caption (optional)" maxlength="80" data-change="mb-caption" data-id="${x.id}" aria-label="Caption for image ${i + 1}">
            <button type="button" class="icon-btn icon-btn--sm" data-action="mb-remove" data-id="${x.id}" aria-label="Remove image ${i + 1}">${icon('trash-2', { size: 16 })}</button>
          </li>`)}</ol>
          <p class="field-hint">Drag to change the order. The first one is the large picture on Today.</p>
        </section>` : ''}
      ${list.length && room > 0 ? html`<div class="block-tight">${addButton(room === 1 ? 'Add one more' : `Add up to ${room} more`, 'btn btn--soft btn--block')}</div>` : ''}
      ${list.length ? html`<div class="card block set-row"><span class="set-label">Show on Today</span>${toggle(onToday(), { action: 'mb-today', label: 'Show the moodboard on Today' })}</div>` : ''}`;
  },
  mount(el) { MB.hydrate(el); },
  update(el) { MB.hydrate(el); },
  actions: {
    edit: ({ ui }) => { ui.editing = !ui.editing; app.refresh(); },
    'mb-move': ({ from, to }) => MB.move(from, to),
    'mb-remove': ({ data }) => {
      const undo = MB.remove(data.id);
      hap.tap();
      app.toast('Image removed', { action: { label: 'Undo', fn: undo } });
    },
    'mb-today': () => {
      const l = store.settings().todayLayout || {};
      const hidden = l.hidden || [];
      store.setSettings({ todayLayout: { ...l, hidden: hidden.includes('moodboard') ? hidden.filter((x) => x !== 'moodboard') : [...hidden, 'moodboard'] } });
      hap.tap();
    },
  },
  inputs: {
    'mb-file': async ({ el }) => {
      const files = [...(el.files || [])];
      el.value = '';
      if (!files.length) return;
      try {
        const { added, skipped } = await MB.add(files);
        hap.success();
        app.toast(skipped ? `${added} added. The board holds five; remove one to add more.` : added === 1 ? 'Added to your moodboard' : `${added} images added`, { icon: 'image' });
      } catch (err) {
        console.error(err);
        app.toast('Couldn’t add that image. Nothing else was affected. Try another one.', { tone: 'danger' });
      }
    },
    'mb-caption': ({ el, value }) => MB.caption(el.dataset.id, value),
  },
};
