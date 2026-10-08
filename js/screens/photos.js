// Progress photos: stored as blobs in IndexedDB on this device only.
import * as store from '../data/store.js';
import { blobs } from '../data/blobs.js';
import { deleteWithUndo } from '../ui/undo.js';
import { today, fmtMDY, fmtMonth, monthKey } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, segmented } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { shrink, hydrate, forget } from '../ui/images.js';

const POSES = [{ id: 'front', label: 'Front' }, { id: 'side', label: 'Side' }, { id: 'back', label: 'Back' }];
const hydratePhotos = (root) => hydrate(root, { attr: 'photo', host: '.photo' });

const byPose = (pose) => store.all('photos').filter((p) => p.pose === pose).sort((a, b) => (a.date < b.date ? -1 : 1));

export default {
  id: 'photos',
  title: 'Progress photos',
  render({ ui }) {
    const all = store.all('photos').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const pose = ui.pose || 'front';
    const list = byPose(pose);
    const mode = ui.mode || 'previous';
    const current = list[list.length - 1];
    const other = mode === 'first' ? list[0] : list[list.length - 2];
    const months = [...new Set(all.map((p) => monthKey(p.date)))];
    return html`
      ${pageHead({ title: 'Photos', back: { to: 'progress/body', label: 'Body' } })}
      <p class="privacy-line">${icon('lock', { size: 14 })} Stored only on this device. Never uploaded. Not included in backups unless you choose to.</p>
      <div class="photo-add card">
        <p class="section-label">Add this month’s photos</p>
        <p class="muted small">Same light, distance, pose and time of day.</p>
        <div class="photo-add-row">${POSES.map((p) => html`<label class="btn btn--soft btn--sm photo-pick">${icon('camera', { size: 16 })} ${p.label}
          <input type="file" accept="image/*" data-change="file" data-pose="${p.id}" class="sr-only"></label>`)}</div>
      </div>
      ${!all.length ? empty({ ic: 'camera', title: 'No photos yet', body: 'Photos show changes the scale misses. One set a month is plenty.' }) : html`
        <section class="block">
          <div class="block-head"><h2 class="block-title">Compare</h2></div>
          ${segmented(POSES, pose, { action: 'pose', name: 'Pose' })}
          ${list.length >= 2 ? html`
            <div class="block-tight">${segmented([{ id: 'previous', label: 'vs previous' }, { id: 'first', label: 'vs first' }], mode, { action: 'mode', name: 'Compare with', size: 'sm' })}</div>
            <div class="compare" data-static="${current.id}-${other.id}" style="--pos:50%">
              <img class="compare-a" data-photo="${other.id}" alt="${pose} photo from ${fmtMDY(other.date)}">
              <div class="compare-b"><img data-photo="${current.id}" alt="${pose} photo from ${fmtMDY(current.date)}"></div>
              <span class="compare-line" aria-hidden="true"></span>
              <span class="compare-tag compare-tag--a">${fmtMDY(other.date)}</span>
              <span class="compare-tag compare-tag--b">${fmtMDY(current.date)}</span>
              <input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Slide to compare">
            </div>`
            : html`<p class="muted block-tight">${list.length ? 'One more month and you can compare.' : `No ${pose} photos yet.`}</p>`}
        </section>
        ${months.map((m) => html`<section class="block" data-key="m-${m}"><div class="block-head"><h2 class="block-title">${fmtMonth(`${m}-01`)}</h2></div>
          <div class="photo-grid">${all.filter((p) => monthKey(p.date) === m).map((p) => html`<figure class="photo" data-key="${p.id}" data-static="${p.id}">
            <img data-photo="${p.id}" alt="${p.pose} photo, ${fmtMDY(p.date)}" loading="lazy">
            <figcaption>${POSES.find((x) => x.id === p.pose)?.label} · ${fmtMDY(p.date)}</figcaption>
            <button type="button" class="photo-del icon-btn icon-btn--sm" data-action="del" data-id="${p.id}" aria-label="Delete photo">${icon('trash-2', { size: 15 })}</button>
          </figure>`)}</div></section>`)}`}`;
  },
  mount(el) {
    hydratePhotos(el);
    el.addEventListener('input', (e) => {
      if (!e.target.matches('.compare-range')) return;
      e.target.closest('.compare').style.setProperty('--pos', `${e.target.value}%`);
    });
  },
  update(el) { hydratePhotos(el); },
  actions: {
    pose: ({ data, ui }) => { ui.pose = data.value; app.refresh(); },
    mode: ({ data, ui }) => { ui.mode = data.value; app.refresh(); },
    del: ({ data }) => {
      // The image file stays until the chance to undo has passed.
      deleteWithUndo([{ store: 'photos', id: data.id }], 'Photo deleted', {
        onGone: async () => {
          if (store.get('photos', data.id)) return;
          await blobs.del(data.id);
          forget(data.id);
        },
      });
    },
  },
  inputs: {
    file: async ({ el }) => {
      const file = el.files?.[0];
      if (!file) return;
      try {
        const { blob, w, h } = await shrink(file);
        const id = store.uid();
        await blobs.put(id, blob);
        store.put('photos', { id, date: today(), pose: el.dataset.pose, w, h, size: blob.size, type: blob.type });
        hap.success();
        app.toast('Photo saved on this device', { icon: 'lock' });
      } catch (err) {
        console.error(err);
        app.toast('Couldn’t save that photo. Nothing else was affected. Try a smaller image.', { tone: 'danger' });
      } finally {
        el.value = '';
      }
    },
  },
};
