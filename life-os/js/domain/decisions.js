// The decision journal: a decision written down when you make it (the choice, the options you
// weighed, why, what you expect to happen and how sure you are), then a review three months on that
// compares what happened with what you expected. Judging decisions by their outcome alone teaches
// the wrong lessons; writing the reasoning and the expectation down first is what lets you learn
// from it (Kahneman, Lovallo & Sibony 2011; Annie Duke, Thinking in Bets, 2018; Tetlock & Gardner
// 2015 on keeping score of forecasts).
import * as store from '../data/store.js';
import { today, addDays } from './dates.js';

export const REVIEW_AFTER = 90;
export const OUTCOMES = [
  { id: 'better', label: 'Better than expected' }, { id: 'expected', label: 'As expected' }, { id: 'worse', label: 'Worse than expected' },
];
export const QUALITY = [
  { id: 'good', label: 'Good decision', hint: 'Sound reasons with what you knew then, whatever the outcome' },
  { id: 'mixed', label: 'Partly' },
  { id: 'poor', label: 'Poor decision', hint: 'You’d decide differently with what you knew then' },
];

export const all = () => store.memo('decisions-sorted', ['decisions'], () => store.all('decisions').sort((a, b) => String(b.date).localeCompare(String(a.date))));
export const one = (id) => store.get('decisions', id);

export function save(id, patch, date = today()) {
  const cur = id ? one(id) : null;
  const v = { date, options: '', why: '', expect: '', confidence: 3, area: '', ...cur, ...patch };
  v.title = String(v.title || 'A decision').trim().slice(0, 120) || 'A decision';
  for (const k of ['options', 'why', 'expect']) v[k] = String(v[k] || '').slice(0, 1200);
  v.confidence = Math.max(1, Math.min(5, Math.round(Number(v.confidence) || 3)));
  v.reviewOn = v.reviewOn || addDays(v.date, REVIEW_AFTER);
  return store.put('decisions', v);
}

/** Decisions whose review is due (not reviewed yet), oldest first. */
export const dueForReview = (date = today()) => all().filter((d) => !d.review && d.reviewOn <= date).reverse();

/** Review a decision: { outcome, quality, learned }. Returns an undo. */
export function review(id, { outcome, quality, learned = '' }, date = today()) {
  const d = one(id);
  if (!d) return () => {};
  store.put('decisions', { ...d, review: { on: date, outcome, quality, learned: String(learned).slice(0, 1200) } });
  return () => store.put('decisions', d);
}

/** Put the review off (two weeks). Returns an undo. */
export function later(id, date = today()) {
  const d = one(id);
  if (!d) return () => {};
  store.put('decisions', { ...d, reviewOn: addDays(date, 14) });
  return () => store.put('decisions', d);
}

export function remove(id) {
  const d = one(id);
  if (!d) return () => {};
  store.remove('decisions', id);
  return () => store.put('decisions', d);
}

/**
 * How your calls hold up, from reviewed decisions: { n, good, asExpected, calibration } where
 * calibration compares confidence with outcomes (sure ones that went worse = overconfidence).
 */
export function scorecard() {
  const r = all().filter((d) => d.review);
  if (!r.length) return null;
  const good = r.filter((d) => d.review.quality === 'good').length;
  const asExpected = r.filter((d) => d.review.outcome !== 'worse').length;
  const sure = r.filter((d) => d.confidence >= 4);
  const sureWorse = sure.filter((d) => d.review.outcome === 'worse').length;
  const calibration = sure.length >= 3 ? (sureWorse / sure.length > 0.34 ? 'over' : 'fine') : null;
  return { n: r.length, good, asExpected, calibration };
}
