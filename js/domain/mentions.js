// #mentions and @mentions in the brain dump and the journal (53). "#Prayer" names a habit, goal,
// routine, workout or project by its name without spaces (case, spaces and punctuation don't
// matter); "@Sarah" names a person, anyone at all. A mention is just text: it is read from the words
// each time, so renaming, deleting or restoring never leaves a broken link behind, and the page of
// whatever is named lists where it was mentioned.
import * as store from '../data/store.js';

/** A name as a tag: lower case, accents and everything but letters and digits gone. */
export const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
/** A name as you'd type it after # or @: each word capitalised, no spaces ("Prayer & Scripture" → "PrayerScripture"). */
export const tagOf = (name) => String(name || '').normalize('NFC').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

// A mention starts a word: #word or @word, letters, digits, - and _ (so emails and "C#" aren't mentions).
const TOKEN = /(^|[^\p{L}\p{N}_@#&/])([#@])([\p{L}\p{N}][\p{L}\p{N}_-]{0,39})/gu;

/** The mentions in a text: [{ sign: '#' | '@', word, slug, index, length }] in order. */
export function scan(text) {
  const out = [];
  const s = String(text || '');
  for (const m of s.matchAll(TOKEN)) {
    const index = m.index + m[1].length;
    out.push({ sign: m[2], word: m[3], slug: slug(m[3]), index, length: m[3].length + 1 });
  }
  return out;
}

/** Kinds a # can name, with where each one's page is. */
export const KINDS = {
  habit: { store: 'habits', name: (x) => x.name, to: (x) => `plan/habits/${x.id}`, icon: 'repeat', live: (x) => !x.archived },
  goal: { store: 'goals', name: (x) => x.name, to: (x) => `plan/goals/${x.id}`, icon: 'target', live: () => true },
  routine: { store: 'routines', name: (x) => x.name, to: () => 'plan/playbook', icon: 'list-checks', live: (x) => !x.archived },
  workout: { store: 'templates', name: (x) => x.name, to: (x) => `plan/training/workouts/${x.id}`, icon: 'dumbbell', live: () => true },
  project: { store: 'projects', name: (x) => x.name, to: (x) => `plan/projects/${x.id}`, icon: 'layers', live: () => true },
};
const KIND_STORES = Object.values(KINDS).map((k) => k.store);

/** Everything a # can name, by tag: Map(slug → [{ kind, id, name, to, icon }]). */
export function things() {
  return store.memo('mention-things', KIND_STORES, () => {
    const map = new Map();
    for (const [kind, k] of Object.entries(KINDS)) {
      for (const x of store.all(k.store)) {
        if (!x?.name || !k.live(x)) continue;
        const key = slug(k.name(x));
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ kind, id: x.id, name: k.name(x), to: k.to(x), icon: k.icon });
      }
    }
    return map;
  });
}

/** What a #word names (a tag may name more than one thing), or []. */
export const resolve = (word) => things().get(slug(word)) || [];

/** The texts mentions live in: notes and journal pages, newest first. [{ source, id, date, text, to }] */
function texts() {
  const notes = store.all('notes').map((n) => ({ source: 'note', id: n.id, date: (n.updatedAt || n.createdAt || '').slice(0, 10), text: n.text || '', to: 'plan/notes' }));
  const pages = store.all('journalEntries').map((j) => ({ source: 'journal', id: j.id, date: j.date, to: `reflect/journal/${j.id}`,
    text: [j.text || '', ...Object.values(j.answers || {}).map((a) => (typeof a === 'string' ? a : ''))].filter(Boolean).join('\n') }));
  return [...notes, ...pages].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Every mention, read once per change: { things: Map(kind:id → hits), people: Map(slug → { name, hits }) }. */
function index() {
  return store.memo('mention-index', ['notes', 'journalEntries', ...KIND_STORES], () => {
    const byThing = new Map();
    const people = new Map();
    for (const t of texts()) {
      const seen = new Set();
      for (const m of scan(t.text)) {
        const key = `${m.sign}${m.slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const hit = { ...t, snippet: snippet(t.text, m.index) };
        if (m.sign === '@') {
          if (!people.has(m.slug)) people.set(m.slug, { name: m.word, hits: [] });
          people.get(m.slug).hits.push(hit);
        } else {
          for (const x of resolve(m.word)) {
            const k = `${x.kind}:${x.id}`;
            if (!byThing.has(k)) byThing.set(k, []);
            byThing.get(k).push(hit);
          }
        }
      }
    }
    return { byThing, people };
  });
}

/** Where a habit, goal, routine, workout or project is mentioned: [{ source, id, date, snippet, to }]. */
export const mentionsOf = (kind, id) => index().byThing.get(`${kind}:${id}`) || [];
/** Everyone you've @mentioned, most mentioned first: [{ slug, name, count, last }]. */
export function people() {
  return [...index().people].map(([s, p]) => ({ slug: s, name: p.name, count: p.hits.length, last: p.hits[0]?.date || '' }))
    .sort((a, b) => b.count - a.count || (a.last < b.last ? 1 : -1));
}
/** Where a person is mentioned. */
export const mentionsOfPerson = (name) => index().people.get(slug(name))?.hits || [];

/** A line around a mention, for lists. */
function snippet(text, at) {
  const start = Math.max(0, text.lastIndexOf('\n', at - 1) + 1, at - 60);
  let end = text.indexOf('\n', at);
  if (end < 0) end = text.length;
  end = Math.min(end, at + 80);
  return `${start > 0 && text[start - 1] !== '\n' ? '…' : ''}${text.slice(start, end).trim()}${end < text.length && text[end] !== '\n' ? '…' : ''}`;
}

/**
 * What to suggest while typing: the #word or @word being typed at the caret, and what it could be.
 * Returns null when the caret isn't in one. { sign, from, to, options: [{ label, insert, sub }] }
 */
export function suggest(text, caret) {
  const before = String(text || '').slice(0, caret);
  const m = before.match(/(^|[^\p{L}\p{N}_@#&/])([#@])([\p{L}\p{N}_-]{0,40})$/u);
  if (!m) return null;
  const sign = m[2];
  const typed = slug(m[3]);
  const from = caret - m[3].length - 1;
  let options = [];
  if (sign === '#') {
    for (const list of things().values()) for (const x of list) {
      const s = slug(x.name);
      if (!typed || s.startsWith(typed) || s.includes(typed)) options.push({ label: x.name, insert: `#${tagOf(x.name)}`, sub: x.kind, rank: s.startsWith(typed) ? 0 : 1 });
    }
  } else {
    const known = new Map(people().map((p) => [p.slug, p.name]));
    for (const [s, name] of known) if (!typed || s.startsWith(typed)) options.push({ label: name, insert: `@${name}`, sub: 'person', rank: 0 });
    if (m[3] && !known.has(typed)) options.push({ label: m[3], insert: `@${m[3]}`, sub: 'new person', rank: 1 });
  }
  options = options.sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label)).slice(0, 6);
  return options.length ? { sign, from, to: caret, options } : null;
}
