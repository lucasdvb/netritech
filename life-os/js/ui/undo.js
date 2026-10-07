// One delete pattern: things go at once, with Undo in the toast. No "are you sure?" for anything
// that Undo can bring back; confirmations are kept for whole-device actions (restore, erase).
import * as store from '../data/store.js';
import { app } from './app-api.js';

/** Delete records ([{ store, id }]) in one write. Undo puts every one of them back.
 *  onGone runs when the chance to undo has passed (to free files, for example). */
export function deleteWithUndo(records, message, { onUndo, onGone } = {}) {
  const saved = records.map(({ store: s, id }) => ({ store: s, value: store.get(s, id) })).filter((r) => r.value);
  if (!saved.length) return;
  store.batch(saved.map((r) => ({ store: r.store, delete: r.value.id })));
  app.toast(message, {
    action: { label: 'Undo', fn: () => { store.batch(saved.map((r) => ({ store: r.store, value: r.value }))); onUndo?.(); } },
    onExpire: onGone,
  });
}
