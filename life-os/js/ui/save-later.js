// Saving as you type, a moment after you stop. Edits to different fields of the same record
// collect together (switching fields quickly never drops the first one), and whatever is still
// waiting is written at once when you leave a field or the screen.
/** write(id, patches): apply each patch in order (patch(cur) → fields) and save the result. */
export function saver(write, delay = 350) {
  const pending = new Map();
  const run = (id) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    clearTimeout(p.timer);
    write(id, p.patches);
  };
  return {
    later(id, patch) {
      const p = pending.get(id) || { patches: [], timer: 0 };
      p.patches.push(patch);
      clearTimeout(p.timer);
      p.timer = setTimeout(() => run(id), delay);
      pending.set(id, p);
    },
    /** Save now: one record, or everything waiting. */
    now(id) { if (id == null) [...pending.keys()].forEach(run); else run(id); },
    /** Forget what's waiting (the record is being deleted, or saved another way). */
    cancel(id) { const p = pending.get(id); if (p) { clearTimeout(p.timer); pending.delete(id); } },
  };
}

/** Apply patches in order to a record. */
export const applyPatches = (cur, patches) => patches.reduce((r, p) => ({ ...r, ...p(r) }), cur);
