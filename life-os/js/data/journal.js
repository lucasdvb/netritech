// Writes still on their way to the disk when the app is hidden or closed are copied to
// localStorage (which saves at once) and written again on the next start, wherever they're still
// newer than what's on the disk. Once they've landed, the copy is dropped.
import * as store from './store.js';

const KEY = 'lifeos.unsaved';
const drop = () => { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

function keep() {
  const ops = store.unlanded();
  if (!ops.length) return;
  try { localStorage.setItem(KEY, JSON.stringify(ops)); } catch { return; } // full or blocked: the database may still finish
  store.flush().then(() => { if (!store.unlanded().length) drop(); });
}

/** From now on, keep a copy of unsaved writes whenever the app is hidden or closed. */
export function watch() {
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keep(); });
}

/** On start, before anything is read: write back what was kept and never landed. Never blocks the start. */
export async function replay() {
  try {
    const ops = JSON.parse(localStorage.getItem(KEY));
    const disk = store.disk();
    const when = (r) => r?.updatedAt || r?.at || '';
    const todo = [];
    for (const op of ops) if (op?.store && ('delete' in op || when(op.value) > when(await disk.get(op.store, op.value?.id)))) todo.push(op);
    if (todo.length) await disk.write(todo);
  } catch (err) {
    console.error(err);
  }
  drop();
}
