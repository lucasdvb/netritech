// Changing the habit system: creating habits, moving them between states, the sort, and
// graduation. Loaded by the screens that do this, so Today starts without it.
import * as store from '../data/store.js';
import { habits, activeHabits, habit, stateOf, focusHabits, queue, focusLimit, periodsOf, runs, consistency, isFlexible } from './habits.js';
import { today, addDays, diffDays } from './dates.js';

export function newHabit(overrides = {}) {
  return {
    id: store.uid(), name: '', description: '', section: 'life', category: 'life', icon: 'circle', color: null,
    type: 'binary', unit: '', target: 1, min: null, max: null, step: 1,
    schedule: { kind: 'daily' }, time: null, reminder: null, difficulty: 2, priority: 'high',
    goalId: null, affectsScore: false, showOnToday: true, optional: false, streaks: false, weekly: true,
    source: null, ramp: null, checklist: null, mvd: false, mvdMin: null, mvdLabel: null, archived: false,
    state: focusHabits().length < focusLimit() ? 'focus' : 'queue', focusSince: today(), tiny: null, anchor: null,
    startDate: today(), order: habits().length, ...overrides,
  };
}

/** The fields that move a habit into a state, or null when the three focus slots are full. */
export function statePatch(h, state, { until = null, focusCount = focusHabits().length } = {}) {
  const now = stateOf(h);
  if (state === 'focus') {
    if (now !== 'focus' && focusCount >= focusLimit()) return null;
    return { state, focusSince: now === 'focus' ? h.focusSince : today(), pausedUntil: null };
  }
  if (state === 'queue') {
    const last = Math.max(0, ...queue().map((q) => q.queueOrder ?? 0));
    return { state, queueOrder: now === 'queue' ? h.queueOrder : last + 1, pausedUntil: null };
  }
  if (state === 'paused') return { state, pausedUntil: until, stateBeforePause: now === 'paused' ? h.stateBeforePause : now };
  return { state, pausedUntil: null };
}

export function setState(h, state, opts) {
  const patch = statePatch(h, state, opts);
  return patch ? store.update('habits', h.id, patch) : null;
}

/** Move a focus habit to autopilot; the first habit waiting takes its slot. Returns that habit. */
export function graduate(h) {
  const next = queue().find((q) => q.id !== h.id) || null;
  const ops = [{ store: 'habits', value: { ...h, ...statePatch(h, 'autopilot'), graduatedAt: today() } }];
  if (next) ops.push({ store: 'habits', value: { ...next, state: 'focus', focusSince: today(), pausedUntil: null } });
  store.batch(ops);
  return next;
}

/**
 * Due for the "does it feel automatic?" check (13b): in focus for three weeks or more, strong
 * enough to be close (strength 50% or more), and not asked in the last four weeks.
 */
export function autoDue(h, date = today()) {
  if (stateOf(h, date) !== 'focus' || h.type === 'limit') return false;
  if (h.focusSince && diffDays(date, h.focusSince) < 21) return false;
  const last = h.auto?.at(-1)?.date;
  if (last && diffDays(date, last) < 28) return false;
  return runs(h, date).strength >= 0.5;
}

/** Save the four answers (1–5 each); keeps the last six. Returns the score, their average. */
export function recordAuto(h, answers, date = today()) {
  const score = Math.round((answers.reduce((a, b) => a + b, 0) / answers.length) * 10) / 10;
  store.update('habits', h.id, { auto: [...(h.auto || []), { date, score, answers }].slice(-6) });
  return score;
}

/** Apply a sort ({ id: state }) in one write. Refuses to leave more than three in focus. */
export function applyStates(map) {
  const after = activeHabits().filter((h) => (map[h.id] ?? stateOf(h)) === 'focus').length;
  if (after > focusLimit()) throw new Error(`At most ${focusLimit()} habits can be in focus.`);
  let order = Math.max(0, ...queue().map((q) => q.queueOrder ?? 0));
  const ops = [];
  for (const [id, state] of Object.entries(map)) {
    const h = habit(id);
    if (!h || h.archived || (h.state || 'autopilot') === state) continue;
    const patch = state === 'queue' ? { state, queueOrder: ++order, pausedUntil: null } : statePatch(h, state, { focusCount: 0 });
    ops.push({ store: 'habits', value: { ...h, ...patch } });
  }
  if (ops.length) store.batch(ops);
  return ops.length;
}

/** Graduation can be put off; it comes back two weeks later. */
export const graduationDue = (h, date = today()) => (h.graduationSnoozed && diffDays(date, h.graduationSnoozed) < 14 ? null : graduation(h, date));

/** Habits worth training first (as many as fit in focus): ones that matter, that aren't automatic yet. */
export function suggestFocus(n = focusLimit(), date = today()) {
  const candidates = activeHabits().filter((h) => {
    const st = stateOf(h, date);
    const s = h.schedule || { kind: 'daily' };
    return st !== 'paused' && (s.kind === 'daily' || s.kind === 'weekdays') && !['top3', 'weeklyReview', 'monthlyReview'].includes(h.source);
  });
  const ratio = (h) => consistency(h, date, 30).ratio;
  return candidates
    .filter((h) => (ratio(h) ?? 0) < 0.9)
    .sort((a, b) => Number(!a.affectsScore && a.priority !== 'core') - Number(!b.affectsScore && b.priority !== 'core')
      || (ratio(a) ?? 0.5) - (ratio(b) ?? 0.5) || (a.order ?? 0) - (b.order ?? 0))
    .slice(0, n);
}

/** Ready for autopilot: done on 85% or more of the last six weeks, with real repetition behind it. */
export function graduation(h, date = today()) {
  if (stateOf(h, date) !== 'focus') return null;
  const ps = periodsOf(h, addDays(date, -42), addDays(date, -1)).filter((p) => p.met !== null);
  if (ps.length < 6) return null;
  const met = ps.filter((p) => p.met).length;
  const ratio = met / ps.length;
  const enough = isFlexible(h) || runs(h, date).total >= 30;
  return ratio >= 0.85 && enough ? { ratio, met, of: ps.length } : null;
}

/* ---------- creating a habit in three questions (H2) ---------- */

export const ANCHORS = ['After I wake up', 'After my coffee', 'After lunch', 'After work', 'After dinner', 'Before bed'];

const AREA_WORDS = [
  ['spirit', /pray|scripture|bible|church|worship|gratitude|grateful|devotion|faith/],
  ['relationships', /call|son|daughter|fianc|wife|husband|partner|family|friend|mum|mom|dad|date night|kids/],
  ['mind', /read|learn|study|journal|meditat|write|course|book|language|podcast/],
  ['posture', /posture|mobility|stretch|neck|back pain/],
  ['body', /walk|run|gym|train|lift|steps|workout|push-?up|squat|plank|cycle|swim|sport|yoga/],
  ['health', /sleep|water|protein|vitamin|meal|eat|drink|food|veg|fruit|sugar|caffeine|alcohol|teeth|floss|skin|bed/],
  ['work', /work|email|inbox|deep|focus|desk|client|business|plan|sales/],
  ['life', /home|tidy|clean|laundry|finance|budget|money|bills|cook/],
];
const AREA_ICON = { spirit: 'hand-heart', relationships: 'heart', mind: 'book-open', posture: 'person-standing', body: 'activity', health: 'heart-pulse', work: 'briefcase', life: 'house' };

/** A best guess at a new habit's area, icon and Today group from what you typed. */
export function guessShape(name = '', anchor = '') {
  const text = `${name} ${anchor}`.toLowerCase();
  const area = AREA_WORDS.find(([, re]) => re.test(name.toLowerCase()))?.[0] || AREA_WORDS.find(([, re]) => re.test(text))?.[0] || 'life';
  const a = anchor.toLowerCase();
  const section = /wake|morning|coffee|breakfast|shower/.test(a) ? 'morning'
    : /dinner|bed|evening|night/.test(a) ? 'evening'
      : ({ body: 'body', health: 'body', posture: 'body', mind: 'mind', spirit: 'spirit' })[area] || 'life';
  return { category: area, icon: AREA_ICON[area] || 'circle', section };
}

/** Anchors already in use, then the common ones, without repeats. */
export const anchorSuggestions = () => [...new Set([...activeHabits().map((h) => h.anchor).filter(Boolean), ...ANCHORS])].slice(0, 8);
