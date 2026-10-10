// The honest habit timeline: how far a habit is along the road to automatic, with the real numbers
// rather than "21 days". In the first study that tracked it, habits took a median of 66 days to
// reach their plateau of automaticity, from 18 to 254 (Lally et al. 2010); a 2024 systematic review
// across 20 studies found medians of 59–66 days and means of 106–154, ranging from 4 to 335
// (Singh et al. 2024, Healthcare). Missing a day now and then didn't change the outcome (Lally).
import { today, diffDays } from './dates.js';
import { consistency } from './habits.js';

export const MEDIAN = 66;      // Lally 2010; Singh 2024 medians 59–66
export const TYPICAL = [59, 154];

/** When you started building it: in focus since, or when it was made. */
export const startOf = (h) => h.focusSince || (h.createdAt ? h.createdAt.slice(0, 10) : null);

/**
 * { day, of, share, phase, line } for a habit you're building (in focus), or null.
 * phase: 'early' (first 3 weeks), 'middle', 'around' (near the median), 'beyond' (past it).
 */
export function timeline(h, date = today()) {
  const start = startOf(h);
  if (!start || start > date) return null;
  const day = diffDays(date, start) + 1;
  const share = Math.min(1, day / MEDIAN);
  const c = consistency(h, date, 28)?.ratio;
  const phase = day < 21 ? 'early' : day < MEDIAN - 7 ? 'middle' : day <= MEDIAN + 14 ? 'around' : 'beyond';
  const lines = {
    early: 'The first weeks take the most effort. Missing a day now and then doesn’t undo it.',
    middle: 'Most habits take about two months to feel automatic, often longer. Keep the cue the same.',
    around: 'Around when habits usually start to feel automatic.',
    beyond: c != null && c >= 0.85 ? 'Steady past the usual two months: ready to run on autopilot.' : 'Past the usual two months. Harder habits take up to five or more; keep going.',
  };
  return { day, of: MEDIAN, share, phase, line: lines[phase] };
}

/** "Day 23 of about 66" */
export const label = (t) => (t ? (t.day <= MEDIAN ? `Day ${t.day} of about ${MEDIAN}` : `Day ${t.day} · past the usual ${MEDIAN}`) : '');
