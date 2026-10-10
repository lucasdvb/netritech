// Your pictures and note on an exercise, wherever it shows: the workout list, gym mode (large, so
// the form is on screen while you do the set) and the exercise page. A picture can be a photo or a
// GIF of the movement, picked or pasted straight from a web page. Tap one to see it full size;
// "Photos and note" edits them.
import * as X from '../domain/exercise-media.js';
import * as store from '../data/store.js';
import { html, cx, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { hydrate } from '../ui/images.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const thumb = (e, p, i, { edit = false } = {}) => html`<span class="exm-thumb-wrap" data-key="exm-${p.id}"${p.w && p.h ? raw(` style="--ar:${p.w}/${p.h}"`) : ''}>
  <button type="button" class="exm-thumb" data-action="exm-view" data-ex="${e.id}" data-i="${i}" aria-label="Picture ${i + 1} of ${e.name}, full size">
    <img data-exphoto="${p.id}" data-static="${p.id}" alt="" decoding="async"></button>
  ${edit ? html`<button type="button" class="icon-btn icon-btn--sm exm-del" data-action="exm-del" data-ex="${e.id}" data-id="${p.id}" aria-label="Remove picture ${i + 1}">${icon('x', { size: 14 })}</button>` : ''}
</span>`;

/** The pictures and note as they show on a workout card, or large in gym mode (nothing when there are none). */
export function mediaLine(e, { tone = '' } = {}) {
  if (!X.hasMedia(e)) return '';
  const photos = X.photosOf(e);
  return html`<div class="${cx('exm-line', tone && `exm-line--${tone}`)}" data-key="exm-line-${e.id}">
    ${photos.length ? html`<div class="exm-thumbs">${photos.map((p, i) => thumb(e, p, i))}</div>` : ''}
    ${X.noteOf(e) ? html`<p class="exm-note">${icon('notebook-pen', { size: 14 })}<span>${X.noteOf(e)}</span></p>` : ''}
  </div>`;
}

/** Add a picture: pick one (a photo, or a GIF saved from the web) or paste the one you copied. */
export const addTiles = ({ room, change, action, data = {} }) => (room > 0 ? html`
  <label class="exm-add" data-key="exm-add">${icon('image-plus', { size: 20 })}<span>Picture or GIF</span>
    <input type="file" accept="image/*,image/gif" class="sr-only" data-change="${change}" ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(' '))} ${room > 1 ? 'multiple' : ''}></label>
  ${X.canPaste() ? html`<button type="button" class="exm-add" data-key="exm-paste" data-action="${action}" ${raw(Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(' '))}>${icon('clipboard-paste', { size: 20 })}<span>Paste</span></button>` : ''}` : '');

export const PICS_HINT = 'How the movement looks, the machine’s setup. Found a picture or GIF online? Copy it, then Paste here, or save it and pick it. They stay on this device and in your backups.';

/** The pictures of an exercise, editable in place (remove, add, paste). */
export function picsEditor(e) {
  const photos = X.photosOf(e);
  return html`<div class="field"><p class="field-label">How it’s done <small>up to ${X.MAX} pictures</small></p>
      <div class="exm-thumbs exm-thumbs--edit">${photos.map((p, i) => thumb(e, p, i, { edit: true }))}
        ${addTiles({ room: X.MAX - photos.length, change: 'exm-add', action: 'exm-paste', data: { ex: e.id } })}</div>
      <p class="field-hint">${PICS_HINT}</p></div>`;
}

/** The editor: up to two pictures (add, paste, remove) and the note. */
function editor(e) {
  return html`<div class="form exm-editor">
    ${picsEditor(e)}
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
    title: store.get('exercises', exerciseId)?.name || 'Picture',
    size: 'tall',
    ui: { i: start },
    render: (sh) => {
      const e = store.get('exercises', exerciseId);
      const photos = X.photosOf(e);
      const p = photos[Math.min(sh.ui.i, photos.length - 1)];
      if (!p) return '';
      return html`<div class="exm-viewer">
        <img class="exm-full" data-exphoto="${p.id}" data-static="${p.id}" data-key="full-${p.id}" alt="Picture ${sh.ui.i + 1} of ${e.name}">
        ${photos.length > 1 ? html`<div class="btn-row exm-pager"><button type="button" class="btn btn--soft" data-action="exm-flip">${sh.ui.i ? 'First picture' : 'Second picture'}</button></div>` : ''}
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
  'exm-paste': async ({ data, sheet }) => { const f = await pasted(); if (f) await addTo(data.ex, [f], sheet); },
  'exm-del': ({ data, sheet }) => {
    const undo = X.removePhoto(data.ex, data.id);
    hap.tap();
    sheet?.refresh?.();
    app.toast('Picture removed', { action: { label: 'Undo', fn: () => { undo(); if (sheet) { sheet.refresh(); hydrateMedia(sheet.el); } } } });
  },
};

/** Keep picked or pasted files on an exercise, and say what didn't fit. */
export async function addTo(exerciseId, files, sheet) {
  try {
    const { added, skipped, tooBig } = await X.addPhotos(exerciseId, files);
    if (added) hap.success();
    if (tooBig) app.toast(`That GIF is over ${Math.round(X.GIF_MAX / 1048576)} MB. Try a smaller one.`);
    else if (skipped) app.toast(added ? `${added} added. An exercise keeps ${X.MAX} pictures; remove one to add another.` : `An exercise keeps ${X.MAX} pictures; remove one to add another.`);
    if (sheet) { sheet.refresh(); hydrateMedia(sheet.el); }
    return added;
  } catch (err) {
    console.error(err);
    app.toast('Couldn’t add that picture. Nothing else was affected. Try another one.', { tone: 'danger' });
    return 0;
  }
}

/** The picture on the clipboard, or a message saying why there isn't one. */
export async function pasted() {
  try {
    const f = await X.clipboardPicture();
    if (!f) app.toast('No picture on the clipboard. Copy one first: press and hold it, then Copy.');
    return f;
  } catch {
    app.toast('Couldn’t read the clipboard. Save the picture instead, then pick it.');
    return null;
  }
}

export const mediaInputs = {
  'exm-add': async ({ el, sheet }) => {
    const files = [...(el.files || [])];
    el.value = '';
    if (files.length) await addTo(el.dataset.ex, files, sheet);
  },
  'exm-note': ({ el, value }) => X.setNote(el.dataset.ex, value),
};
