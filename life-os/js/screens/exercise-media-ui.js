// Your photos and note on an exercise, wherever it shows: the workout list, gym mode and the
// exercise page. Tap a photo to see it full size; "Photos and note" edits them.
import * as X from '../domain/exercise-media.js';
import * as store from '../data/store.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { hydrate } from '../ui/images.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const thumb = (e, p, i, { edit = false } = {}) => html`<span class="exm-thumb-wrap" data-key="exm-${p.id}">
  <button type="button" class="exm-thumb" data-action="exm-view" data-ex="${e.id}" data-i="${i}" aria-label="Photo ${i + 1} of ${e.name}, full size">
    <img data-exphoto="${p.id}" data-static="${p.id}" alt="" decoding="async"></button>
  ${edit ? html`<button type="button" class="icon-btn icon-btn--sm exm-del" data-action="exm-del" data-ex="${e.id}" data-id="${p.id}" aria-label="Remove photo ${i + 1}">${icon('x', { size: 14 })}</button>` : ''}
</span>`;

/** The photos and note as they show on a workout card or in gym mode (nothing when there are none). */
export function mediaLine(e, { tone = '' } = {}) {
  if (!X.hasMedia(e)) return '';
  const photos = X.photosOf(e);
  return html`<div class="${cx('exm-line', tone && `exm-line--${tone}`)}" data-key="exm-line-${e.id}">
    ${photos.length ? html`<div class="exm-thumbs">${photos.map((p, i) => thumb(e, p, i))}</div>` : ''}
    ${X.noteOf(e) ? html`<p class="exm-note">${icon('notebook-pen', { size: 14 })}<span>${X.noteOf(e)}</span></p>` : ''}
  </div>`;
}

/** The editor: up to two photos (add, remove) and the note. */
function editor(e) {
  const photos = X.photosOf(e);
  return html`<div class="form exm-editor">
    <div><p class="field-label">Photos <small>up to ${X.MAX}</small></p>
      <div class="exm-thumbs exm-thumbs--edit">${photos.map((p, i) => thumb(e, p, i, { edit: true }))}
        ${photos.length < X.MAX ? html`<label class="exm-add" data-key="exm-add">${icon('image-plus', { size: 20 })}<span>Add photo</span>
          <input type="file" accept="image/*" class="sr-only" data-change="exm-add" data-ex="${e.id}" ${X.MAX - photos.length > 1 ? 'multiple' : ''}></label>` : ''}</div>
      <p class="field-hint">The machine’s setup, the position, anything you’d forget. They stay on this device and in your backups.</p></div>
    <label class="field"><span class="field-label">Your note</span>
      <textarea class="input" rows="3" data-change="exm-note" data-ex="${e.id}" maxlength="${X.NOTE_MAX}" placeholder="Seat on 4, grip just outside the shoulders…" aria-label="Your note on ${e.name}">${e.note || ''}</textarea></label>
  </div>`;
}

export function openMedia(exerciseId) {
  const s = app.sheet({
    title: store.get('exercises', exerciseId)?.name || 'Exercise',
    render: () => { const e = store.get('exercises', exerciseId); return e ? editor(e) : ''; },
    actions: mediaActions,
    inputs: mediaInputs,
  });
  hydrate(s.el, { attr: 'exphoto' });
  return s;
}

function openViewer(exerciseId, start = 0) {
  const s = app.sheet({
    title: store.get('exercises', exerciseId)?.name || 'Photo',
    size: 'tall',
    ui: { i: start },
    render: (sh) => {
      const e = store.get('exercises', exerciseId);
      const photos = X.photosOf(e);
      const p = photos[Math.min(sh.ui.i, photos.length - 1)];
      if (!p) return '';
      return html`<div class="exm-viewer">
        <img class="exm-full" data-exphoto="${p.id}" data-static="${p.id}" data-key="full-${p.id}" alt="Photo ${sh.ui.i + 1} of ${e.name}">
        ${photos.length > 1 ? html`<div class="btn-row exm-pager"><button type="button" class="btn btn--soft" data-action="exm-flip">${sh.ui.i ? 'First photo' : 'Second photo'}</button></div>` : ''}
        ${X.noteOf(e) ? html`<p class="exm-note">${icon('notebook-pen', { size: 14 })}<span>${X.noteOf(e)}</span></p>` : ''}
      </div>`;
    },
    actions: { 'exm-flip': ({ sheet }) => { sheet.ui.i = sheet.ui.i ? 0 : 1; sheet.refresh(); hydrate(sheet.el, { attr: 'exphoto' }); } },
  });
  hydrate(s.el, { attr: 'exphoto' });
}

/** Load the pictures for every exercise photo under root. */
export const hydrateMedia = (root) => hydrate(root, { attr: 'exphoto' });

export const mediaActions = {
  'exm-view': ({ data }) => openViewer(data.ex, Number(data.i) || 0),
  'exm-edit': ({ data }) => openMedia(data.ex),
  'exm-del': ({ data, sheet }) => {
    const undo = X.removePhoto(data.ex, data.id);
    hap.tap();
    sheet?.refresh?.();
    app.toast('Photo removed', { action: { label: 'Undo', fn: () => { undo(); if (sheet) { sheet.refresh(); hydrateMedia(sheet.el); } } } });
  },
};

export const mediaInputs = {
  'exm-add': async ({ el, sheet }) => {
    const files = [...(el.files || [])];
    el.value = '';
    if (!files.length) return;
    try {
      const { added, skipped } = await X.addPhotos(el.dataset.ex, files);
      if (added) hap.success();
      if (skipped) app.toast(added ? `${added} added. An exercise keeps ${X.MAX} photos; remove one to add another.` : `An exercise keeps ${X.MAX} photos; remove one to add another.`);
      if (sheet) { sheet.refresh(); hydrateMedia(sheet.el); }
    } catch (err) {
      console.error(err);
      app.toast('Couldn’t add that photo. Nothing else was affected. Try another one.', { tone: 'danger' });
    }
  },
  'exm-note': ({ el, value }) => X.setNote(el.dataset.ex, value),
};
