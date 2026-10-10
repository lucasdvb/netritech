// Opening a habit from Today: the right sheet, pad or screen for what it measures. A hold on a row
// goes straight to the amount, the tiny version or the source. Loaded on first use.
import * as H from '../../domain/habits.js';
import * as F from '../../domain/fitness-core.js';
import { app } from '../../ui/app-api.js';
import * as hap from '../../ui/haptics.js';
import { COUNTER_SOURCES } from './rows.js';

const sheets = () => import('../sheets.js');

export async function openHabitOrSource(h, date) {
  if (H.isLimit(h)) return (await import('../less.js')).openLess(h, date);
  // A habit with its own workout plan starts that workout (or goes back to it).
  if (h.templateId && F.template?.(h.templateId)) {
    const active = F.activeWorkout();
    if (active && active.templateId === h.templateId) return app.go(`workout/${active.id}/gym`);
    if (!active) return (await import('../workout-actions.js')).startWorkout(h.templateId, date, { gym: true });
  }
  if (h.id === 'h-training' || h.source?.startsWith('workout:')) {
    const active = F.activeWorkout();
    if (active) return app.go(`workout/${active.id}/gym`);
    if (F.workoutsOn(date).length) return app.go('plan/training');
    return (await import('../workout-actions.js')).openStartSheet(date);
  }
  if (h.source === 'sleep') return (await sheets()).openCheckin(date);
  if (h.source === 'shutdown') return (await sheets()).openShutdown(date);
  if (h.source && !COUNTER_SOURCES.includes(h.source)) return (await sheets()).openSource(h, date);
  (await sheets()).openHabit(h.id, date);
}

/** A hold on a habit row; `settle` updates the routine it belongs to once it's logged. */
export async function holdHabit(id, date, settle) {
  const h = H.habit(id);
  if (!h) return;
  hap.hold();
  if (H.isLimit(h)) return (await import('../less.js')).openLess(h, date);
  const P = await import('../pads.js');
  const done = () => settle(h.id, date);
  if (H.isNumeric(h) && !h.source && h.type !== 'rating') return P.habitPad(h, date, { onDone: done });
  if (h.source === 'steps') return P.stepsPad(date);
  const tiny = H.tinyOf(h);
  if (tiny && !H.level(h, date) && !h.source && h.type !== 'check') return P.logTiny(h, date, { onDone: done });
  if (h.source && !COUNTER_SOURCES.includes(h.source)) return openHabitOrSource(h, date);
  (await sheets()).openHabit(h.id, date);
}
