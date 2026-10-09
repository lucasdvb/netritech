// A session's clock: it runs while you're in the session (its list or gym mode), pauses when you
// leave it or tap the time, and stops for good when the session is finished. Stored on the
// workout as `activeMs` (time counted so far) and `runningSince` (when the current stretch began,
// or null while paused). Sessions from before this kept only startedAt and endedAt; they read the
// same as before.
const legacy = (w) => w.activeMs == null;
// A stretch longer than this was a session left open by mistake: it counts as this much at most.
export const MAX_STRETCH = 4 * 3600000;

/** Milliseconds of training counted so far. */
export function activeMs(w, now = Date.now()) {
  if (!w) return 0;
  if (legacy(w)) {
    if (w.status === 'done' && w.minutes != null && !w.endedAt) return w.minutes * 60000;
    const end = w.endedAt ? Date.parse(w.endedAt) : now;
    const ms = Math.max(0, end - Date.parse(w.startedAt));
    return w.status === 'active' ? Math.min(ms, MAX_STRETCH) : ms;
  }
  const live = w.status === 'active' && w.runningSince ? Math.min(MAX_STRETCH, Math.max(0, now - Date.parse(w.runningSince))) : 0;
  return Math.max(0, w.activeMs + live);
}

export const isRunning = (w) => !!w && w.status === 'active' && (legacy(w) || !!w.runningSince);

/** The fields that pause it (null when it isn't running). */
export const pausePatch = (w, now = Date.now()) => (isRunning(w) ? { activeMs: activeMs(w, now), runningSince: null } : null);

/** The fields that set it running again (null when it already is, or the session is over). */
export const resumePatch = (w, now = Date.now()) => (w?.status === 'active' && !isRunning(w) ? { activeMs: activeMs(w, now), runningSince: new Date(now).toISOString() } : null);

/** The fields that stop it when the session is finished. */
export const stopPatch = (w, now = Date.now()) => ({ activeMs: activeMs(w, now), runningSince: null });

/** "12:05" or "1:02:05". */
export function clockText(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

/** Set the clock running when you come into the session, and pause it when you leave it. */
export function enter(store, id) { const p = resumePatch(store.get('workouts', id)); if (p) store.update('workouts', id, p); }
export function leave(store, id, stillIn) {
  // After the route has changed: going between the session's list and gym mode keeps it running.
  setTimeout(() => { if (stillIn()) return; const p = pausePatch(store.get('workouts', id)); if (p) store.update('workouts', id, p); }, 0);
}
/** Tap the time: pause, or carry on. */
export function toggle(store, id) {
  const w = store.get('workouts', id);
  const p = isRunning(w) ? pausePatch(w) : resumePatch(w);
  if (p) store.update('workouts', id, p);
  return isRunning(store.get('workouts', id));
}
