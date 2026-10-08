// Side quests (G9): one optional suggestion a week, from a small library per area, leaning towards
// the area you've done least lately and never repeating one from the last twelve weeks. Accepting
// turns it into a task; "Not this week" simply lets it go.
import * as store from '../data/store.js';
import * as T from './tasks.js';
import { categoryConsistency } from './scoring.js';
import { CATEGORIES } from './taxonomy.js';
import { today, startOfWeek, addDays, diffDays } from './dates.js';

export const LIBRARY = [
  { id: 'body-new-route', area: 'body', title: 'Walk a route you’ve never taken' },
  { id: 'body-hill', area: 'body', title: 'Find a hill or stairs and climb them five times' },
  { id: 'body-new-move', area: 'body', title: 'Learn one new exercise and try three sets' },
  { id: 'health-recipe', area: 'health', title: 'Cook a new high-protein recipe' },
  { id: 'health-screens', area: 'health', title: 'One evening with no screens after 20:00' },
  { id: 'health-water', area: 'health', title: 'Carry a full bottle all day and finish it twice' },
  { id: 'posture-desk', area: 'posture', title: 'Raise your screen to eye level and check your chair' },
  { id: 'posture-stretch', area: 'posture', title: 'Ten minutes of slow stretching before bed' },
  { id: 'mind-chapter', area: 'mind', title: 'Read one chapter of a book you’ve never opened' },
  { id: 'mind-teach', area: 'mind', title: 'Explain something you learned this week to someone' },
  { id: 'mind-quiet', area: 'mind', title: 'Twenty minutes alone with a notebook, no phone' },
  { id: 'spirit-psalm', area: 'spirit', title: 'Read a Psalm aloud and write down one line' },
  { id: 'spirit-thanks', area: 'spirit', title: 'Write a thank-you note to God for this week' },
  { id: 'spirit-serve', area: 'spirit', title: 'Do one quiet act of service nobody will know about' },
  { id: 'work-inbox', area: 'work', title: 'Clear your inbox to zero, once' },
  { id: 'work-deep', area: 'work', title: 'Book a 90-minute focus block for the hardest task' },
  { id: 'work-mentor', area: 'work', title: 'Ask someone you admire one good question' },
  { id: 'rel-letter', area: 'relationships', title: 'Write a handwritten note to someone you love' },
  { id: 'rel-call', area: 'relationships', title: 'Call a friend you haven’t spoken to in months' },
  { id: 'rel-son', area: 'relationships', title: 'Let your son choose an afternoon plan, and say yes' },
  { id: 'rel-date', area: 'relationships', title: 'Plan a surprise evening for your fiancée' },
  { id: 'life-fix', area: 'life', title: 'Fix one thing at home you’ve been ignoring' },
  { id: 'life-declutter', area: 'life', title: 'Clear one drawer or shelf completely' },
  { id: 'life-money', area: 'life', title: 'Cancel one subscription you don’t use' },
];

export const quest = (weekStart = startOfWeek(today())) => store.get('quests', weekStart) || null;

/** The area to lean towards: the one done least over the last 30 days (with habits in it). */
function quietArea(date) {
  const scored = CATEGORIES.map((c) => ({ id: c.id, v: categoryConsistency(c.id, date, 30) })).filter((x) => x.v != null);
  return (scored.sort((a, b) => a.v - b.v)[0] || { id: CATEGORIES[0].id }).id;
}

/** This week's offer, chosen once and kept for the week. */
export function offer(date = today()) {
  const ws = startOfWeek(date);
  const have = quest(ws);
  if (have) return have;
  const recent = new Set(store.all('quests').filter((q) => diffDays(ws, q.id) < 84).map((q) => q.templateId));
  const area = quietArea(date);
  const pool = LIBRARY.filter((q) => !recent.has(q.id));
  const inArea = pool.filter((q) => q.area === area);
  const list = inArea.length ? inArea : pool.length ? pool : LIBRARY;
  const pick = list[Math.abs(diffDays(ws, '2026-01-05') / 7) % list.length];
  return store.put('quests', { id: ws, weekStart: ws, templateId: pick.id, title: pick.title, areaId: pick.area, status: 'offered' });
}

/** Accept: it becomes a task for the weekend (Saturday), with Undo. */
export function accept(q) {
  const before = { ...q };
  const t = T.add({ title: q.title, date: addDays(q.weekStart, 5) < today() ? today() : addDays(q.weekStart, 5), area: q.areaId });
  store.put('tasks', { ...t, questId: q.id });
  store.put('quests', { ...q, status: 'accepted', taskId: t.id });
  return () => { store.remove('tasks', t.id); store.put('quests', before); };
}

export function decline(q) {
  const before = { ...q };
  store.put('quests', { ...q, status: 'declined' });
  return () => store.put('quests', before);
}

/** Whether an accepted quest's task is done. */
export const isDone = (q) => q?.status === 'accepted' && !!T.task(q.taskId)?.done;
