// Your own reference for an exercise: up to two pictures (how the machine is set up, the position,
// or a GIF of the movement found online) and a note (seat height, grip, what to watch). Kept on the
// exercise, so they show every time you do it, large in gym mode. The pictures are blobs ("ex-…")
// next to the moodboard's, in every backup and synced (a GIF over 1.8 MB stays on its device).
import * as store from '../data/store.js';
import { blobs } from '../data/blobs.js';
import { shrink, forget } from '../ui/images.js';

export const MAX = 2;
export const NOTE_MAX = 500;
/** A GIF is kept as it is (shrinking it would stop the movement), up to this size. */
export const GIF_MAX = 6 * 1024 * 1024;
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
  let tooBig = 0;
  for (const file of take) {
    const pic = await prepare(file);
    if (!pic) { tooBig += 1; continue; }
    const id = `ex-${store.uid()}`;
    await blobs.put(id, pic.blob);
    added.push({ id, w: pic.w, h: pic.h, ...(pic.gif ? { gif: true } : {}) });
  }
  if (added.length) store.update('exercises', exerciseId, { photos: [...photosOf(store.get('exercises', exerciseId)), ...added].slice(0, MAX) });
  return { added: added.length, skipped: files.length - added.length - tooBig, tooBig };
}

/** A picked or pasted picture, ready to keep: photos shrunk to 1400 px, a GIF as it is (null if too big). */
async function prepare(file) {
  if (file.type !== 'image/gif') return shrink(file, 1400, 0.82);
  if (file.size > GIF_MAX) return null;
  const bmp = await createImageBitmap(file).catch(() => null);
  const size = bmp ? { w: bmp.width, h: bmp.height } : { w: null, h: null };
  bmp?.close?.();
  return { blob: file, ...size, gif: true };
}

/** The picture on the clipboard (copied from a web page or Photos), as a file, or null. */
export async function clipboardPicture() {
  if (!navigator.clipboard?.read) return null;
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t === 'image/gif') || item.types.find((t) => t.startsWith('image/'));
    if (type) { const blob = await item.getType(type); return new File([blob], `pasted.${type.split('/')[1]}`, { type }); }
  }
  return null;
}
export const canPaste = () => !!globalThis.navigator?.clipboard?.read;

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
