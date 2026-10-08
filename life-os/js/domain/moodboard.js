// Your moodboard: up to five images that remind you why, kept on this device. The list (order,
// captions) lives in settings; the pictures are blobs ("mb-…") next to the progress photos, and
// every backup carries them.
import * as store from '../data/store.js';
import { blobs } from '../data/blobs.js';
import { shrink, urls, urlFor, forget } from '../ui/images.js';

export const MAX = 5;
export const items = () => store.settings().moodboard || [];
const save = (list) => store.setSettings({ moodboard: list });

/** Add picked files, as many as fit. Returns how many were added and how many didn't fit. */
export async function add(files) {
  const room = MAX - items().length;
  const take = [...files].slice(0, Math.max(0, room));
  const added = [];
  for (const file of take) {
    const { blob, w, h } = await shrink(file, 1600, 0.84);
    const id = `mb-${store.uid()}`;
    await blobs.put(id, blob);
    added.push({ id, caption: '', w, h });
  }
  if (added.length) save([...items(), ...added]);
  return { added: added.length, skipped: files.length - take.length };
}

export const caption = (id, text) => save(items().map((x) => (x.id === id ? { ...x, caption: text.trim().slice(0, 80) } : x)));

export function move(from, to) {
  const list = [...items()];
  const [x] = list.splice(from, 1);
  if (!x) return;
  list.splice(to, 0, x);
  save(list);
}

/** Take one off the board. Returns an undo; the picture itself goes once Undo has passed. */
export function remove(id) {
  const before = items();
  save(before.filter((x) => x.id !== id));
  setTimeout(async () => {
    if (items().some((x) => x.id === id)) return;
    await blobs.del(id);
    forget(id);
  }, 12000);
  return () => save(before);
}

/** Load the pictures for every moodboard <img> under root, then ask for a redraw so they stay. */
export async function hydrate(root, onReady) {
  let fresh = false;
  for (const img of root.querySelectorAll('img[data-mb]')) {
    if (img.getAttribute('src')) continue;
    const had = urls.has(img.dataset.mb);
    const u = await urlFor(img.dataset.mb);
    if (u) { img.src = u; if (!had) fresh = true; }
    else img.closest('.mb-tile')?.classList.add('is-missing');
  }
  if (fresh) onReady?.();
}
