// Same as yesterday (13d): one tap repeats yesterday's food on another day, at the same times of
// day, so a routine eater logs a whole day in one go. Undo takes all of it back.
import * as store from '../data/store.js';
import { addDays } from './dates.js';

/** What was eaten the day before `date`, in the order it was eaten. */
export const dayBefore = (date) => store.onDate('nutritionLogs', addDays(date, -1)).slice().sort((a, b) => ((a.at || '') < (b.at || '') ? -1 : 1));

/** Yesterday has food, and it hasn't been repeated onto `date` yet. */
export const canRepeat = (date) => store.onDate('nutritionLogs', addDays(date, -1)).length > 0 && !store.onDate('nutritionLogs', date).some((l) => l.repeated);

/** A one-line summary: "4 entries · 128 g protein · 1,830 kcal". */
export function summary(logs) {
  const p = logs.reduce((a, l) => a + (Number(l.protein) || 0), 0);
  const k = logs.reduce((a, l) => a + (Number(l.kcal) || 0), 0);
  return { count: logs.length, protein: Math.round(p), kcal: Math.round(k) };
}

/** Copy the day before's food onto `date`; returns the new entries' ids (for Undo). */
export function repeatDayBefore(date) {
  const ops = dayBefore(date).map((l) => {
    const at = new Date(l.at || NaN);
    const time = Number.isNaN(at.getTime()) ? 'T12:00:00' : `T${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}:00`;
    const { id: _id, createdAt: _c, updatedAt: _u, rev: _r, deletedAt: _d, demo: _demo, ...rest } = l;
    return { store: 'nutritionLogs', value: { ...rest, id: store.uid(), date, at: `${date}${time}`, repeated: true } };
  });
  if (ops.length) store.batch(ops);
  return ops.map((o) => o.value.id);
}
