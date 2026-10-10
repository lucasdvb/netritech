// The morning briefing: your day in a few lines before it starts. Which kind of day it is, what's
// in your calendar, the training, the first thing to do, when your energy peaks, and anything due
// (bills, a reorder, a decision to review, a trip). It's on Today in the morning, and the morning
// reminder carries its first lines. Reviewing the day ahead in the morning is the "planning" half of
// the plan-do-review loop that improves follow-through (Gollwitzer 1999; Ludwig & Geller on
// prompting), and one short look beats opening five screens.
import * as store from '../data/store.js';
import { on as planOn } from './day-plans-core.js';
import { trainingCall } from './day-plan.js';
import * as T from './tasks.js';
import * as ICS from './ics-import.js';
import * as EN from './energy.js';
import * as BL from './bills.js';
import * as SU from './supplements.js';
import * as DC from './decisions.js';
import * as TR from './trips.js';
import * as DL from './deload.js';
import { today, addDays } from './dates.js';
import { fmt } from './money.js';

/** [{ ic, text, to }] for a date (in order of the day). */
export function lines(date = today()) {
  const out = [];
  const o = planOn(date);
  const p = o.profile || store.profile();
  const trip = TR.on(date);
  if (trip) out.push({ ic: 'map', text: `${trip.name}${trip.where && trip.where !== trip.name ? ` · ${trip.where}` : ''}: day ${Math.max(1, Math.round((Date.parse(date) - Date.parse(trip.from)) / 864e5) + 1)} of ${TR.nights(trip) + 1}.`, to: `plan/trips/${trip.id}` });
  else {
    const soon = TR.upcoming(date).find((t) => t.from > date && t.from <= addDays(date, 2));
    if (soon) out.push({ ic: 'map', text: `${soon.name} starts ${soon.from === addDays(date, 1) ? 'tomorrow' : 'in two days'}.`, to: `plan/trips/${soon.id}` });
  }
  out.push({ ic: 'sunrise', text: `${o.base ? '' : `${o.name}: `}up at ${p.wakeTime || '—'}${o.work ? `, work ${p.workStart}–${p.workEnd}` : ''}, lights out ${p.bedTime || '—'}.`, to: 'plan/playbook' });
  const events = ICS.on(date);
  if (events.length) {
    const timed = events.filter((e) => !e.allDay);
    const first = timed.slice(0, 3).map((e) => `${e.start} ${e.title}`).join(' · ');
    out.push({ ic: 'calendar', text: `${events.length} in your calendar${first ? `: ${first}` : ''}${timed.length > 3 ? '…' : ''}`, to: 'plan/calendar' });
  }
  const call = trainingCall(date);
  if (call.kind !== 'rest' && call.kind !== 'done') {
    const dl = DL.active(date);
    out.push({ ic: 'dumbbell', text: `${call.title}${o.train ? ` at ${p.trainTime}` : ''}${dl ? ' · deload week: half the sets, 10% lighter' : ''}.`, to: 'plan/training' });
  }
  const first = T.forToday(date).find((t) => !t.done && t.rank === 1) || T.forToday(date).find((t) => !t.done);
  if (first) out.push({ ic: 'list-todo', text: `First: ${first.title}`, to: 'plan/tasks' });
  const peak = EN.peak();
  if (peak) out.push({ ic: 'zap', text: `Energy peaks ${peak.from}–${peak.to}: deep work there.`, to: 'progress/energy' });
  const bills = BL.upcoming(3, date);
  if (bills.length) out.push({ ic: 'receipt', text: bills.length === 1 ? `${bills[0].name} due ${bills[0].next === date ? 'today' : bills[0].next < date ? 'overdue' : `on ${bills[0].next}`}${bills[0].amount ? ` (${fmt(bills[0].amount)})` : ''}.` : `${bills.length} bills due in the next 3 days.`, to: 'plan/money/bills' });
  const doses = SU.doses(date).filter((x) => !x.taken);
  if (doses.length) {
    const morning = doses.filter((x) => x.time < '12:00');
    if (morning.length) out.push({ ic: 'pill', text: `${morning.map((x) => x.s.name).slice(0, 3).join(', ')}${morning.length > 3 ? '…' : ''} this morning.`, to: 'body/supplements' });
  }
  const low = SU.all().filter(SU.runningLow);
  if (low.length) out.push({ ic: 'pill', text: `Running low: ${low.map((s) => s.name).slice(0, 2).join(', ')}.`, to: 'body/supplements' });
  const dec = DC.dueForReview(date);
  if (dec.length) out.push({ ic: 'scale', text: `Review a decision from three months ago: ${dec[0].title}`, to: `reflect/decisions/${dec[0].id}` });
  return out;
}

/** The first lines in one sentence, for the morning reminder. */
export function short(date = today()) {
  return lines(date).filter((l) => l.ic !== 'sunrise').slice(0, 3).map((l) => l.text.replace(/[.:]$/, '')).join(' · ').slice(0, 160) || null;
}
