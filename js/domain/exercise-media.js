// Your own reference for an exercise: up to two photos (how the machine is set up, the position)
// and a note (seat height, grip, what to watch). Kept on the exercise, so they show every time
// you do it. The pictures are blobs ("ex-…") next to the moodboard's, in every backup and synced.
import * as store from '../data/store.js';
import { blobs } from '../data/blobs.js';
import { shrink, forget } from '../ui/images.js';

export const MAX = 2;
export const NOTE_MAX = 500;
export const photosOf = (e) => (e?.photos || []).slice(0, MAX);
export const noteOf = (e) => (e?.note || '').trim();
export const hasMedia = (e) => !!(photosOf(e).length || noteOf(e));

/** Add picked files, as many as fit. Returns { added, skipped }. */
export async function addPhotos(exerciseId, files) {
  const e = store.get('exercises', exerciseId);
  if (!e) return { added: 0, skipped: files.length };
  const room = MAX - photosOf(e).length;
  const take = [...files].filter((f) => !f.type || f.type.startsWith('image/')).slice(0, Math.max(0, room));
  const added = [];
  for (const file of take) {
    const { blob, w, h } = await shrink(file, 1400, 0.82);
    const id = `ex-${store.uid()}`;
    await blobs.put(id, blob);
    added.push({ id, w, h });
  }
  if (added.length) store.update('exercises', exerciseId, { photos: [...photosOf(store.get('exercises', exerciseId)), ...added].slice(0, MAX) });
  return { added: added.length, skipped: files.length - added.length };
}

/** Take a photo off the exercise. Returns an undo; the picture itself goes once Undo has passed. */
export function removePhoto(exerciseId, photoId) {
  const e = store.get('exercises', exerciseId);
  if (!e) return () => {};
  const before = photosOf(e);
  store.update('exercises', exerciseId, { photos: before.filter((p) => p.id !== photoId) });
  setTimeout(async () => {
    if (photosOf(store.get('exercises', exerciseId)).some((p) => p.id === photoId)) return;
    await blobs.del(photoId);
    forget(photoId);
  }, 12000);
  return () => store.update('exercises', exerciseId, { photos: before });
}

export function setNote(exerciseId, text) {
  if (!store.get('exercises', exerciseId)) return;
  store.update('exercises', exerciseId, { note: String(text || '').trim().slice(0, NOTE_MAX) });
}
