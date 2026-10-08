// The habit rules the later screens need (labels, states, checklists), kept out of the first
// screen's code. Everything in habits.js comes through here too.
import { log, setLog } from './habits.js';

export * from './habits.js';

/** What each state means, for the screens that let you choose one. */
export const STATES = {
  focus: { label: 'Focus', hint: 'In training: logged every day and counted in your score.' },
  autopilot: { label: 'Autopilot', hint: 'Already part of your day. Never counted against you.' },
  queue: { label: 'Later', hint: 'Waiting for a free focus slot.' },
  paused: { label: 'Paused', hint: 'Off until the date you choose. Nothing is counted.' },
};

/** The schedule in words: "Weekdays", "3× a week", "Every 2 weeks". */
export function scheduleLabel(h) {
  const s = h.schedule || { kind: 'daily' };
  const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  switch (s.kind) {
    case 'daily': return 'Every day';
    case 'weekdays': {
      const d = [...(s.days || [])].sort();
      if (d.join() === '1,2,3,4,5') return 'Weekdays';
      if (d.join() === '6,7') return 'Weekends';
      if (d.length === 7) return 'Every day';
      return d.map((x) => names[x]).join(', ');
    }
    case 'perWeek': return `${s.count}× a week`;
    case 'perMonth': return `${s.count}× a month`;
    case 'interval': return s.every === 14 ? 'Every 2 weeks' : `Every ${s.every} days`;
    default: return '';
  }
}

export function toggleChecklistItem(h, date, index) {
  const l = log(h.id, date);
  const checklist = { ...(l?.checklist || {}) };
  checklist[index] = !checklist[index];
  const all = h.checklist.every((_, i) => checklist[i]);
  setLog(h, date, { checklist, value: all ? 1 : l?.value === 1 && all ? 1 : 0 });
}
