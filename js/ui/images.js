// Images kept on this device: shrink a picked file before saving it, and object URLs for stored
// blobs (shared, so a picture loads once however many screens show it).
import { blobs } from '../data/blobs.js';

/** The file as a JPEG no larger than `max` pixels on its long side, with its size. */
export async function shrink(file, max = 1600, quality = 0.85) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, w: null, h: null };
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  return { blob: blob || file, w, h };
}

export const urls = new Map();

export async function urlFor(id) {
  if (urls.has(id)) return urls.get(id);
  const rec = await blobs.get(id);
  if (!rec?.blob) return null;
  const u = URL.createObjectURL(rec.blob);
  urls.set(id, u);
  return u;
}

export function forget(id) {
  const u = urls.get(id);
  if (u) { URL.revokeObjectURL(u); urls.delete(id); }
}

/** Fill every <img data-{attr}="id"> under root that has no picture yet; a lost one marks its host. */
export async function hydrate(root, { attr = 'blob', host = '' } = {}) {
  for (const img of root.querySelectorAll(`img[data-${attr}]:not([src])`)) {
    const u = await urlFor(img.dataset[attr]);
    if (u) img.src = u;
    else if (host) img.closest(host)?.classList.add('is-missing');
  }
}
