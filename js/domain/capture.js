// Capture (U2): one line of text in; what you meant out, or a question when it could mean more
// than one thing. Pure functions only (no store, no DOM), so the phrase table runs in node.
//
// parse(text, ctx) → { status: 'empty' | 'ok' | 'ask', items, options, question, fallback }
//   ok:  items are what will be saved (one or more), always shown before saving.
//   ask: options are full alternatives to pick from; nothing is saved until you choose.
// ctx: { today, weightUnit, lengthUnit, lastWeightKg, habits, foods, partnerName, planned, wakeTime }
import { addDays, weekday, startOfWeek, fromISO, toISO, diffDays } from './dates.js';

/* ---------- words ---------- */

const NUMS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 3 };
const NUM = String.raw`(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten)`;
const count = (w) => (w == null ? null : /^\d/.test(w) ? Number(w) : NUMS[w] ?? null);

const STOP = new Set(['a', 'an', 'the', 'my', 'of', 'and', 'or', 'with', 'by', 'to', 'for', 'in', 'on', 'at', 'your', 'some', 'i', 'did', 'do', 'done', 'just', 'had', 'have', 'got', 'went', 'some', 'today', 'this', 'that', 'it', 'is', 'was', 'up', 'min', 'mins', 'minutes', 'log', 'logged']);
// Words in habit names too common to identify a habit on their own.
const GENERIC = new Set(['morning', 'evening', 'night', 'daily', 'weekly', 'monthly', 'time', 'check', 'care', 'reset', 'review', 'session', 'routine', 'break', 'breaks', 'setup', 'out', 'day', 'longer', 'business', 'body', 'progress', 'top', 'priorities', 'lights', 'work']);

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Lower case, plain quotes, 8,000 → 8000 and 82,4 → 82.4. */
export function normalize(s) {
  return fold(String(s || '')).toLowerCase()
    .replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
    .replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2')
    .replace(/[!?]+$/g, '').replace(/\s+/g, ' ').trim();
}
const stem = (w) => w.replace(/(ations?|ings?|ed|er|es|s)$/, '') || w;
/** Two words name the same thing: equal, or one stem extends the other by a few letters. */
export function sameWord(a, b) {
  if (a === b) return true;
  const x = stem(a), y = stem(b);
  if (x === y) return x.length >= 3;
  const [s, l] = x.length <= y.length ? [x, y] : [y, x];
  return s.length >= 4 && l.startsWith(s) && l.length - s.length <= 3;
}
const words = (s) => fold(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !/^\d/.test(w));
const sig = (s) => words(s).filter((w) => !STOP.has(w));
const cap = (s) => { const t = s.trim(); return t ? t[0].toUpperCase() + t.slice(1) : t; };
const clean = (s) => s.replace(/\s+/g, ' ').replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '').trim();
const AMOUNT_WORDS = new Set(['h', 'hr', 'hrs', 'hour', 'hours', 'm', 'mn', 'km', 'kms', 'k', 'mi', 'mile', 'miles', 'pages', 'page', 'went', 'for', 'quick', 'long', 'short', 'little', 'bit', 'half', 'morning', 'evening', 'afternoon', 'again']);
/** Words left once the recognised ones are gone: "ran errands" has one ("errands"), "went for a run" none. */
const extraWords = (s, re) => sig(s.replace(re, ' ')).filter((w) => !AMOUNT_WORDS.has(w));

/* ---------- dates ---------- */

const DAYS = { monday: 1, mon: 1, tuesday: 2, tues: 2, tue: 2, wednesday: 3, weds: 3, wed: 3, thursday: 4, thurs: 4, thur: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6, sunday: 7, sun: 7 };
const MONTHS = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const MON = Object.keys(MONTHS).join('|');
const ORD = '(?:st|nd|rd|th)?';

// Each rule: a pattern and what it means. Short day names (sat, sun, wed) need "on/this/next/last"
// or the end of the line, so "sat in the sun" stays a sentence.
const DATE_RULES = [
  [/\b(?:the )?day after tomorrow\b/i, () => ({ offset: 2 })],
  [/\b(?:tomorrow|tmrw|tmr|tomorow)(?: (?:morning|afternoon|evening|night))?\b/i, () => ({ offset: 1 })],
  [/\blast night\b/i, () => ({ offset: -1, lastNight: true })],
  [/\b(?:yesterday|yday)(?: (?:morning|afternoon|evening))?\b/i, () => ({ offset: -1 })],
  [/\b(?:today|tonight|this (?:morning|afternoon|evening)|right now|just now)\b/i, () => ({ offset: 0 })],
  [new RegExp(String.raw`\b${NUM} days? ago\b`, 'i'), (m) => ({ offset: -count(m[1].toLowerCase()) })],
  [new RegExp(String.raw`\bin ${NUM} (days?|weeks?)\b`, 'i'), (m) => ({ offset: count(m[1].toLowerCase()) * (/^w/i.test(m[2]) ? 7 : 1) })],
  [/\bnext week\b/i, () => ({ nextWeek: true })],
  [/\b(?:(?:on|this|next|by) )?(?:the )?weekend\b/i, () => ({ weekday: 6, q: 'on' })],
  [/\b(?:(on|this|next|last|coming|by) )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, (m) => ({ weekday: DAYS[m[2].toLowerCase()], q: (m[1] || '').toLowerCase() })],
  [/\b(on|this|next|last|coming|by) (mon|tues?|weds?|thu(?:rs?)?|fri|sat|sun)\b/i, (m) => ({ weekday: DAYS[m[2].toLowerCase()], q: m[1].toLowerCase() })],
  [/\b(mon|tues?|weds?|thu(?:rs?)?|fri)$/i, (m) => ({ weekday: DAYS[m[1].toLowerCase()], q: '' })],
  [new RegExp(String.raw`\b(?:on |by )?(?:the )?(\d{1,2})${ORD} (?:of )?(${MON})\b`, 'i'), (m) => ({ month: MONTHS[m[2].toLowerCase()], day: Number(m[1]) })],
  [new RegExp(String.raw`\b(?:on |by )?(${MON}) (\d{1,2})${ORD}\b`, 'i'), (m) => ({ month: MONTHS[m[1].toLowerCase()], day: Number(m[2]) })],
  [/\b(?:on|by) (\d{1,2})\/(\d{1,2})\b/i, (m) => ({ month: Number(m[2]), day: Number(m[1]) })],
  [/\b(?:on|by) the (\d{1,2})(?:st|nd|rd|th)\b/i, (m) => ({ day: Number(m[1]) })],
];

/** Finds the first date phrase; returns the text without it and what it said. */
export function takeDate(s) {
  for (const [re, fn] of DATE_RULES) {
    const m = s.match(re);
    if (!m) continue;
    const when = fn(m);
    if (when.day && (when.day > 31 || when.day < 1)) continue;
    if (when.month && (when.month > 12 || when.month < 1)) continue;
    return { rest: clean(s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)), when: { ...when, text: m[0].trim() } };
  }
  return { rest: s, when: null };
}

const validISO = (y, m, d) => { const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; return toISO(fromISO(iso)) === iso ? iso : null; };

/** The date a phrase means. Logs look back (Monday = the last one); tasks look ahead. */
export function resolveDate(when, today, purpose) {
  if (!when) return today;
  const past = purpose === 'log';
  if (when.offset != null) return addDays(today, when.offset);
  if (when.nextWeek) return addDays(startOfWeek(today), 7);
  if (when.weekday) {
    const wd = weekday(today);
    const diff = when.weekday - wd;
    if (when.q === 'last') return addDays(today, diff < 0 ? diff : diff - 7);
    if (when.q === 'next') return addDays(startOfWeek(today), 7 + when.weekday - 1);
    if (when.q === 'this') return addDays(today, diff >= 0 || past ? diff : diff + 7);
    return past ? addDays(today, diff <= 0 ? diff : diff - 7) : addDays(today, diff >= 0 ? diff : diff + 7);
  }
  if (when.day) {
    const [y, m] = today.split('-').map(Number);
    if (when.month) {
      let iso = validISO(y, when.month, when.day);
      if (iso && !past && iso < today) iso = validISO(y + 1, when.month, when.day);
      if (iso && past && iso > today) iso = validISO(y - 1, when.month, when.day);
      return iso || today;
    }
    let iso = validISO(y, m, when.day);
    if (!past && (!iso || iso < today)) iso = validISO(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, when.day);
    if (past && (!iso || iso > today)) iso = validISO(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, when.day);
    return iso || today;
  }
  return today;
}

/* ---------- amounts ---------- */

/** Minutes in "45 min", "1h30", "1.5 hours", "an hour", "half an hour", "1 hour 20 minutes". */
export function duration(s) {
  let m;
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:h|hrs?|hours?) ?(?:and )?(\d{1,2}) ?(?:m|mins?|minutes?)?\b/))) return Math.round(Number(m[1]) * 60 + Number(m[2]));
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:h|hrs?|hours?)\b/))) return Math.round(Number(m[1]) * 60);
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:mins?|minutes?|mn)\b/))) return Math.round(Number(m[1]));
  if (/\bhalf an? hour\b/.test(s)) return 30;
  if (/\b(?:an|one) hour and a half\b/.test(s)) return 90;
  if (/\b(?:an|one) hour\b/.test(s)) return 60;
  return null;
}
/** Kilometres in "5 km", "5k", "3 miles". */
function distance(s) {
  let m;
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:km|kms|k|kilomet(?:er|re)s?)\b/))) return Number(m[1]);
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:mi|miles?)\b/))) return Math.round(Number(m[1]) * 1.609 * 10) / 10;
  return null;
}
const round1 = (n) => Math.round(n * 10) / 10;

/** "10:30pm", "6", "06:15", "11 pm" → minutes after midnight; evening guesses for bedtimes. */
function clock(t, role) {
  const m = t.match(/^(\d{1,2})(?:[:.h](\d{2}))? ?(am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (h > 23 || min > 59) return null;
  const mer = m[3]?.[0];
  if (mer === 'p' && h < 12) h += 12;
  else if (mer === 'a' && h === 12) h = 0;
  else if (!mer && role === 'bed' && h >= 6 && h <= 11) h += 12;
  else if (!mer && role === 'bed' && h === 12) h = 0;
  return h * 60 + min;
}
const hm = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/* ---------- recognisers: each returns an intent, an { ask } or null ---------- */

const ask = (question, options) => ({ ask: question, options: options.filter(Boolean) });

const NEG = /^(?:i )?(?:didn'?t|did not|no|not|skip(?:ped|ping)?|missed|couldn'?t|could not|won'?t|will not|not today:?)\b\s*/;

function negation(s, w, ctx) {
  const notToday = /\bnot today\b/.test(s);
  if (!NEG.test(s) && !notToday) return null;
  const rest = clean(s.replace(NEG, '').replace(/\bnot today\b/, ''));
  const h = matchHabit(rest, ctx);
  if (h?.habit && !DATA_SOURCES.has(h.habit.source) && !h.extra) return { kind: 'skip', habitId: h.habit.id };
  // "didn't drink water" must never log water: ask what to do instead.
  return ask('Nothing to log. Save it as a note?', [{ kind: 'note', text: cap(s) }]);
}

const FAMILY = 'mum|mom|mother|mam|mummy|dad|father|papa|parents|family|brother|bro|sister|sis|grandma|grandmother|nan|nana|granny|grandpa|grandfather|aunt|auntie|uncle|cousin|in-laws|my folks';
const SON = 'son|my boy|the boy|my kid|the kids|my kids';
const PARTNER = 'fiancee|fiance|partner|girlfriend|wife|my love|my girl|her';
const PAST_TALK = String.raw`(?:called|phoned|rang|facetimed|face-timed|video[- ]called|talked (?:to|with)|spoke (?:to|with)|chatted (?:to|with)|caught up with|messaged|texted)`;
const PAST_TIME = String.raw`(?:visited|saw|met|hung out|spent time|had (?:dinner|lunch|breakfast|coffee|a meal)|went (?:out|for a walk|for dinner|on a walk)|walked|prayed|played|read to)`;

function relation(s, w, ctx) {
  const partner = ctx.partnerName ? `|${normalize(ctx.partnerName)}` : '';
  const who = s.match(new RegExp(String.raw`\b(?:(${FAMILY})|(${SON})|(${PARTNER}${partner}))\b`));
  const dateNight = /\b(?:date night|went on a date|couple time|date with)\b/.test(s);
  const talk = new RegExp(String.raw`\b${PAST_TALK}\b`).test(s);
  const time = new RegExp(String.raw`\b${PAST_TIME}\b`).test(s);
  if (!dateNight && !(who && (talk || time))) return null;
  const person = dateNight ? 'date' : who[1] ? 'family' : who[2] ? 'son' : 'fiancee';
  const minutes = duration(s);
  const kind = person === 'date' ? (/\bwalk/.test(s) ? 'Walk' : /\bcoffee/.test(s) ? 'Coffee' : /\bmovie|film|cinema/.test(s) ? 'Movie' : 'Dinner')
    : person === 'family' ? (/\b(?:visited|saw|met)\b/.test(s) ? 'Visit' : /\b(?:messaged|texted)\b/.test(s) ? 'Message' : /\bdinner|lunch|breakfast|meal/.test(s) ? 'Meal' : 'Call')
      : person === 'son' ? (/\bplayed|game|football|park/.test(s) ? 'Shared activity' : 'Conversation')
        : /\bwalk/.test(s) ? 'Walk' : /\bdinner|lunch|breakfast|meal/.test(s) ? 'Meal together' : /\bprayed/.test(s) ? 'Prayer together' : 'Conversation';
  return { kind: 'relation', person, type: kind, minutes };
}

const TASK_VERBS = String.raw`call|ring|phone|text|message|email|e-mail|mail|buy|get|pick up|drop off|book|pay|renew|cancel|order|send|post|schedule|arrange|organi[sz]e|fix|repair|clean|tidy|wash|return|collect|submit|finish|prepare|prep|write|check|ask|tell|follow up|sort out|sort|update|print|sign|file|apply|register|research|find|look into|contact|reply to|reply|respond to|confirm|invite|take out|bring|make|plan|review|draft|change|move|replace|install|set up|backup|back up`;
const TASK_START = new RegExp(String.raw`^(?:(?:please |i need to |need to |i have to |have to |must |remember to |remind me to |don'?t forget to |todo:? |to do:? |task:? )*)(?:${TASK_VERBS})\b`);
const TASK_CUE = /\b(?:remind me|don'?t forget|need to|have to|must|todo|to-do|to do)\b/;

function taskStart(s) {
  return TASK_START.test(s) ? { kind: 'task' } : null;
}

function sleep(s, w, ctx) {
  if (!/\b(?:slept|sleep|asleep|bed|bedtime|woke|wake|waking)\b/.test(s) || /\bnap(?:ped|s)?\b/.test(s)) return null;
  const q = s.match(/\bquality (?:was |of |is )?(\d{1,2})(?: ?\/ ?10)?\b/) || s.match(/\bsleep (\d{1,2}) ?\/ ?10\b/);
  const quality = q && Number(q[1]) <= 10 ? Number(q[1]) : null;
  const T = String.raw`(\d{1,2}(?:[:.h]\d{2})? ?(?:am|pm|a\.m\.|p\.m\.)?)`;
  const range = s.match(new RegExp(String.raw`(?:bed|slept|sleep|asleep|from)?(?: at)? ${T} ?(?:-|to|until|till|and woke(?: up)?(?: at)?|woke(?: up)?(?: at)?|wake(?: up)?(?: at)?) ?${T}`))
    || s.match(new RegExp(String.raw`\bbed(?:time)? (?:at )?${T}.*?\b(?:woke|wake|up)(?: up)?(?: at)? ${T}`));
  let bedtime = null, wake = null, mins = null;
  if (range) {
    const b = clock(range[1].trim(), 'bed'), wk = clock(range[2].trim(), 'wake');
    if (b != null && wk != null) { bedtime = hm(b); wake = hm(wk); mins = (wk - b + 1440) % 1440; }
  }
  if (mins == null) {
    if (q) s = s.replace(q[0], ' ');
    mins = duration(s);
    if (mins == null) { const m = s.match(/\b(?:slept|sleep|got) (\d{1,2}(?:\.\d+)?)\b(?! ?\/)/); if (m) mins = Math.round(Number(m[1]) * 60); }
  }
  if (mins == null && quality == null) return null;
  if (mins != null && (mins < 60 || mins > 16 * 60)) return ask('That’s an unusual amount of sleep. Save it as a note?', [{ kind: 'note', text: cap(s) }]);
  return { kind: 'sleep', hours: mins == null ? null : Math.round((mins / 60) * 100) / 100, bedtime, wake, quality };
}

const FAITH = [
  [/\b(?:bible|scripture) study\b|\bstudied (?:the )?(?:bible|scripture)\b/, 'study'],
  [/\b(?:pray|prayed|praying|prayer|prayers)\b/, 'prayer'],
  [/\b(?:scripture|bible|devotional|devotions?|psalms?|gospel)\b/, 'scripture'],
  [/\b(?:church|mass|worship|church service)\b/, 'church'],
  [/\b(?:gratitude|grateful|thankful)\b/, 'gratitude'],
];
const FAITH_HABIT = { prayer: 'h-prayer', scripture: 'h-scripture', gratitude: 'h-gratitude', church: 'h-church', study: 'h-study' };

function faith(s, w, ctx) {
  const hit = FAITH.find(([re]) => re.test(s));
  if (!hit) return null;
  const kind = hit[1];
  const minutes = duration(s);
  if (minutes) return { kind: 'faith', type: kind, minutes };
  const h = ctx.habits?.find((x) => x.id === FAITH_HABIT[kind] && !x.archived);
  // "prayed" ticks Prayer; "pray for dad" might be a reminder, so it asks.
  if (h && extraWords(s, new RegExp(hit[0].source, 'g')).filter((x) => !['went', 'to', 'at'].includes(x)).length) return ask(`Log ${h.name}?`, [{ kind: 'habit', habitId: h.id }, { kind: 'task' }]);
  if (h) return { kind: 'habit', habitId: h.id };
  return ask('How long?', [10, 20, 30].map((m) => ({ kind: 'faith', type: kind, minutes: m })));
}

function sessions(s, w, ctx) {
  const minutes = duration(s);
  if (/\b(?:meditat\w*|breathwork|breathing exercises?|box breathing|mindfulness)\b/.test(s)) {
    const type = /\bguided|headspace|calm app\b/.test(s) ? 'guided' : /\bsilen/.test(s) ? 'silence' : /\bcontemplat|centering prayer/.test(s) ? 'contemplative' : 'breath';
    if (minutes) return { kind: 'meditation', type, minutes };
    return ask('How long did you meditate?', [5, 10, 15].map((m) => ({ kind: 'meditation', type, minutes: m })));
  }
  if (/\b(?:read|reading|reads)\b/.test(s) && !/\bread(?:ing)? (?:the )?(?:news|email|emails|messages)\b/.test(s)) {
    const p = s.match(/\b(\d+) ?(?:pages?|pgs?|pp)\b/);
    const ch = s.match(new RegExp(String.raw`\b${NUM} chapters?\b`));
    const pages = p ? Number(p[1]) : null;
    const book = bookOf(s);
    if (!minutes && !pages && !ch) return ask('How long did you read?', [...[10, 20, 30].map((m) => ({ kind: 'reading', minutes: m, pages: null, book })), !book && extraWords(s, /\b(?:read|reading|reads)\b/g).length ? { kind: 'task' } : null]);
    return { kind: 'reading', minutes, pages, book, notes: ch ? `${count(ch[1])} chapter${count(ch[1]) === 1 ? '' : 's'}` : '' };
  }
  if (/\b(?:learn|learned|learnt|learning|studied|study|studying|course|lesson|duolingo|practi[sc]ed)\b/.test(s)) {
    const topic = cap(clean(s.replace(/\b(?:i |did |some |a |an )?(?:learn|learned|learnt|learning|studied|study|studying|practi[sc]ed)\b/g, ' ')
      .replace(/\b\d+(?:\.\d+)? ?(?:h|hrs?|hours?|mins?|minutes?)\b|\bhalf an? hour\b|\ban hour\b/g, ' ')).replace(/^(?:of|on|for|about)\b ?/, ''));
    if (minutes) return { kind: 'learning', minutes, topic };
    return ask('How long did you learn?', [15, 30, 45].map((m) => ({ kind: 'learning', minutes: m, topic })));
  }
  return null;
}
function bookOf(s) {
  const m = s.match(/\b(?:of|from) (?:the book )?["']?([a-z][^"',]*?)["']?$/) || s.match(/["']([^"']+)["']/);
  return m ? cap(m[1].replace(/\b\d+(?:\.\d+)? ?(?:h|hrs?|hours?|mins?|minutes?|pages?)\b/g, '').trim()) : '';
}

function steps(s) {
  const m = s.match(/\b(\d+(?:\.\d+)?) ?(k)? ?steps?\b/) || s.match(/\bsteps? ?[:=]? ?(?:count |total )?(?:of |was |is |at )?(\d+(?:\.\d+)?) ?(k)?\b/);
  if (!m) return null;
  const n = Math.round(Number(m[1]) * (m[2] ? 1000 : 1));
  if (!n || n > 100000) return ask('That’s more steps than a day holds. Check the number?', []);
  return { kind: 'steps', steps: n };
}

const ACTIVITIES = [
  [/\b(?:walked|walking|went for a walk|strolled)\b|\bwalk\b/, 'Walk', 'cardio'],
  [/\b(?:ran|running|jogged|jogging|went for a run)\b|\b(?:run|jog)\b/, 'Run', 'cardio'],
  [/\b(?:cycled|cycling|biked|biking|rode|spin class|spinning)\b|\b(?:cycle|bike|ride)\b/, 'Ride', 'cardio'],
  [/\b(?:swam|swimming)\b|\bswim\b/, 'Swim', 'cardio'],
  [/\b(?:rowed|rowing)\b|\brow\b/, 'Row', 'cardio'],
  [/\b(?:hiked|hiking)\b|\bhike\b/, 'Hike', 'cardio'],
  [/\b(?:hiit|cardio|elliptical|treadmill|jump rope|skipping rope)\b/, 'Cardio', 'cardio'],
  [/\b(?:yoga|pilates)\b/, 'Yoga', 'recovery'],
  [/\b(?:gym|lifted|lifting|weights|strength training|worked out|workout|trained|leg day|push day|pull day|upper body|lower body)\b/, 'Workout', 'strength'],
];
// Base forms ("walk", "run") only count as a log with an amount; on their own they read as plans.
const BASE = /^(?:walk|run|jog|cycle|bike|ride|swim|row|hike)$/;

function activity(s, w, ctx) {
  for (const [re, title, type] of ACTIVITIES) {
    const m = s.match(re);
    if (!m) continue;
    const minutes = duration(s);
    const km = distance(s);
    const word = m[0];
    if (!minutes && !km && (BASE.test(word) || word === 'row')) return null;
    if (/\bthe (?:dog|kids|son|plants)\b/.test(s) && !minutes && !km) return null;
    // "ran errands" isn't a run: without an amount, any other word makes it a question.
    if (!minutes && !km && extraWords(s, new RegExp(re.source, 'g')).length) return ask(`Log a ${title.toLowerCase()}?`, [{ kind: 'workout', title, type, minutes: null, km: null }, { kind: 'note', text: cap(s) }]);
    if (type === 'strength' && ctx.planned && /^(?:workout|trained|worked out)$/.test(word)) {
      return { kind: 'workout', title: ctx.planned.title, type: ctx.planned.kind || 'strength', minutes, km: null, templateId: ctx.planned.id || null };
    }
    return { kind: 'workout', title, type, minutes, km };
  }
  return null;
}

const DRINKS = /\b(?:coffee|tea|juice|milk|wine|beer|soda|coke|shake|smoothie|alcohol|cola|latte|espresso|kombucha)\b/;
function water(s) {
  const named = /\b(?:water|h2o|hydrat\w*)\b/.test(s);
  if (/\bwater (?:the|my) (?:plants|garden|lawn|flowers)\b/.test(s)) return null;
  let ml = null, m;
  if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:ml|mls|millilit(?:er|re)s?)\b/))) ml = Number(m[1]);
  else if ((m = s.match(/\b(\d+(?:\.\d+)?) ?(?:l|lt|ltr|lit(?:er|re)s?)\b/))) ml = Number(m[1]) * 1000;
  else if (named && (m = s.match(new RegExp(String.raw`\b${NUM} (?:large )?(glass(?:es)?|cups?|mugs?|bottles?)\b`)))) ml = count(m[1]) * (/^b/.test(m[2]) ? 500 : 250);
  else if (named && (m = s.match(/\b(?:a|one) (?:glass|cup)\b/))) ml = 250;
  else if (named && (m = s.match(/\b(?:a|one) bottle\b/))) ml = 500;
  if (!named && (ml == null || DRINKS.test(s))) return null;
  if (named && ml == null) {
    if (/\d/.test(s)) { const n = Number(s.match(/\d+(?:\.\d+)?/)[0]); ml = n <= 5 ? n * 1000 : n; }
    else ml = 500;
  }
  ml = Math.round(ml);
  if (ml < 20 || ml > 5000) return ask('That’s an unusual amount of water. Check the number?', []);
  return { kind: 'water', ml };
}

const FRUITS = 'fruits?|apples?|bananas?|oranges?|mangoe?s?|pineapples?|papayas?|pears?|grapes|berries|strawberries|blueberries|kiwis?|lychees?|litchis?|guavas?|watermelon|melon|peach(?:es)?|plums?|clementines?|tangerines?|avocados?';
const VEG = 'veg|veggies|vegetables?|salads?|broccoli|carrots?|spinach|greens|bredes|cabbage|green beans|peas|tomato(?:es)?|cucumbers?|lettuce|pumpkin|zucchini|courgettes?|cauliflower|peppers?|kale|lalo|chouchou|eggplant|aubergines?';
const EAT = /\b(?:ate|eat|eaten|eating|had|have|having|drank|drink|for (?:breakfast|lunch|dinner|a snack)|breakfast|lunch|dinner|snack)\b/;

function food(s, w, ctx) {
  const pr = s.match(/\b(\d+(?:\.\d+)?) ?g(?:rams?)? ?(?:of )?protein\b/) || s.match(/\bprotein (?:of )?(\d+(?:\.\d+)?) ?(?:g|grams?)?\b/);
  const kc = s.match(/\b(\d+(?:\.\d+)?) ?(?:kcal|cals?|calories)\b/) || s.match(/\b(?:calories|kcal) (\d+(?:\.\d+)?)\b/);
  if (pr || kc) {
    const meal = s.match(/\b(breakfast|lunch|dinner|snack)\b/)?.[1];
    let name = s;
    for (const m of [pr, kc]) if (m) name = name.replace(m[0], ' ');
    name = clean(name.replace(EAT, ' ').replace(/\b(?:a|an|some|my|of|with|and|for|meal)\b/g, ' '));
    return { kind: 'food', name: cap(name) || (meal ? cap(meal) : 'Meal'), protein: pr ? Number(pr[1]) : 0, kcal: kc ? Math.round(Number(kc[1])) : 0, fruit: 0, veg: 0 };
  }
  const lib = libraryFood(s, ctx);
  if (lib) return lib;
  return produce(s);
}

function libraryFood(s, ctx) {
  const input = sig(s);
  if (!input.length || !ctx.foods?.length) return null;
  const scored = [];
  for (const f of ctx.foods) {
    const toks = sig(f.name.split('·')[0]).filter((t) => !['cooked', 'plate', 'cup', 'plain', 'lean', 'serving'].includes(t));
    if (!toks.length) continue;
    const hit = toks.filter((t) => input.some((u) => sameWord(t, u))).length;
    if (hit) scored.push({ f, score: hit / toks.length, hit });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score || b.hit - a.hit);
  const [top, next] = scored;
  const sure = top.score === 1 || !next || (top.hit >= 2 && top.score > next.score);
  const qty = (f) => {
    const m = s.match(new RegExp(String.raw`\b${NUM} (?:x )?(?:scoops?|slices?|cups?|plates?|bowls?|servings?|portions?|pieces?)?`));
    const n = m ? count(m[1]) : 1;
    const base = Number(f.name.match(/^(\d+)/)?.[1] || f.name.match(/· (\d+) (?:scoop|slice|cup|plate)/)?.[1] || 1);
    return n && n !== base ? n / base : 1;
  };
  const make = (f) => {
    const k = qty(f);
    const lead = f.name.match(/^(\d+) /);
    const name = k === 1 ? f.name : lead ? f.name.replace(/^\d+/, String(round1(Number(lead[1]) * k))) : `${f.name} × ${round1(k)}`;
    return { kind: 'food', name, foodId: f.id, protein: round1(f.protein * k), kcal: Math.round(f.kcal * k), fruit: round1((f.fruit || 0) * k), veg: round1((f.veg || 0) * k) };
  };
  if (sure) return make(top.f);
  return ask('Which one?', scored.slice(0, 3).map((x) => make(x.f)));
}

function produce(s) {
  const out = { fruit: 0, veg: 0 };
  const re = new RegExp(String.raw`(?:\b${NUM} (?:(?:portions?|servings?|pieces?) (?:of )?)?)?\b(${FRUITS}|${VEG})\b(?: ${NUM}\b)?`, 'g');
  let m, any = false;
  while ((m = re.exec(s))) {
    const n = count(m[1]) ?? count(m[3]) ?? 1;
    const isFruit = new RegExp(String.raw`^(?:${FRUITS})$`).test(m[2]);
    out[isFruit ? 'fruit' : 'veg'] += n;
    any = true;
  }
  if (!any) return null;
  if (out.fruit + out.veg > 15) return ask('That’s a lot of servings. Check the number?', []);
  return { kind: 'produce', ...out };
}

const LIFTS = /\b(?:deadlift|squat|bench|press|curl|row|dumbbells?|db|kettlebells?|kb|barbell|lifted|carried|bag|suitcase|baby|plates?)\b/;
function weight(s, w, ctx) {
  const bf = s.match(/\b(?:body ?fat|bf)\b\D{0,12}(\d{1,2}(?:\.\d+)?) ?%?/) || s.match(/\b(\d{1,2}(?:\.\d+)?) ?% ?(?:body ?fat|bf)\b/);
  if (bf) {
    const percent = Number(bf[1]);
    if (percent < 3 || percent > 60) return ask('Body fat between 3 and 60%?', []);
    return { kind: 'bodyfat', percent };
  }
  const kg = s.match(/\b(\d{2,3}(?:\.\d+)?) ?(?:kg|kgs|kilos?|kilograms?)\b/);
  const lb = s.match(/\b(\d{2,3}(?:\.\d+)?) ?(?:lb|lbs|pounds?)\b/);
  const word = /\b(?:weigh|weighed|weighing|weight|weighs|weigh-in|scale|bodyweight|bw)\b/.test(s);
  if (!kg && !lb && !word) return null;
  if (LIFTS.test(s)) return null;
  let v;
  if (kg) v = Number(kg[1]);
  else if (lb) v = Number(lb[1]) / 2.20462;
  else {
    const m = s.match(/\b(\d{2,3}(?:\.\d+)?)\b/);
    if (!m) return null;
    v = ctx.weightUnit === 'lb' ? Number(m[1]) / 2.20462 : Number(m[1]);
  }
  if (v < 20 || v > 400) return ask('A weight between 20 and 400 kg?', []);
  return { kind: 'weight', kg: Math.round(v * 100) / 100 };
}

const MEAS = { waist: 'waist', belly: 'waist', chest: 'chest', arm: 'arms', arms: 'arms', bicep: 'arms', biceps: 'arms', thigh: 'thighs', thighs: 'thighs', calf: 'calves', calves: 'calves', neck: 'neck' };
function measure(s, w, ctx) {
  const names = Object.keys(MEAS).join('|');
  const re = new RegExp(String.raw`\b(${names})\b(?: (?:is|was|at|=|:))? ?(\d{1,3}(?:\.\d+)?) ?(cm|cms|in|inch|inches|")?(?! ?x)|\b(\d{1,3}(?:\.\d+)?) ?(cm|cms|in|inch|inches|") (${names})\b`, 'g');
  const fields = {};
  let m;
  while ((m = re.exec(s))) {
    const key = MEAS[m[1] || m[6]];
    const v = Number(m[2] || m[4]);
    const unit = m[3] || m[5] || (ctx.lengthUnit === 'in' ? 'in' : 'cm');
    const cm = /^(?:in|inch|inches|")$/.test(unit) ? v * 2.54 : v;
    if (cm < 10 || cm > 250) return ask('That measurement looks off. Check the number?', []);
    fields[key] = round1(cm);
  }
  return Object.keys(fields).length ? { kind: 'measure', fields } : null;
}

function mood(s) {
  const re = /\b(energy|mood|stress|stressed|feeling|felt)(?: level)?(?: (?:is|was|at|=|:))? ?(\d{1,2})(?: ?\/ ?10| out of 10)?\b/g;
  const out = {};
  let m;
  while ((m = re.exec(s))) {
    const v = Number(m[2]);
    if (v < 1 || v > 10) return ask('Energy, mood and stress go from 1 to 10.', []);
    const k = m[1].startsWith('stress') ? 'stress' : m[1] === 'energy' ? 'energy' : 'mood';
    if (/^f/.test(m[1]) && !/\/ ?10|out of 10/.test(m[0])) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? { kind: 'mood', ...out } : null;
}

const COUNTERS = [
  [new RegExp(String.raw`\b(?:${NUM} )?(?:eye|visual|screen) breaks?(?: ${NUM}\b)?|\b20[- ]20[- ]20\b`), 'eyeBreaks'],
  [new RegExp(String.raw`\b(?:${NUM} )?(?:movement|walking|stretch(?:ing)?|standing) breaks?(?: ${NUM}\b)?`), 'breaks'],
  [new RegExp(String.raw`\b(?:${NUM} )?(?:deep[- ]?work|focus)(?: blocks?| sessions?)(?: ${NUM}\b)?|\b(?:${NUM} )?deep[- ]?work(?: ${NUM}\b)?`), 'deepWork'],
];
function counters(s) {
  for (const [re, field] of COUNTERS) {
    const m = s.match(re);
    if (!m) continue;
    const n = [...m].slice(1).map((x) => count(x)).find((x) => x != null) ?? 1;
    if (n < 1 || n > 20) return ask('Check the number?', []);
    return { kind: 'counter', field, delta: n };
  }
  return null;
}

/* ---------- habits by name ---------- */

// Habits fed by logged numbers: their own recognisers read the amount, so a bare name isn't a tick.
const DATA_SOURCES = new Set(['water', 'protein', 'produce', 'steps', 'sleep', 'mind', 'meditation']);

const HABIT_ALIASES = {
  'h-mobility': ['stretch', 'stretched', 'stretching', 'mobility', 'posture'],
  'h-lights-out': ['lights out', 'in bed by', 'bed by'],
  'h-home': ['tidied', 'tidy up', 'cleaned the house', 'house reset'],
  'h-mealprep': ['meal prepped', 'meal-prepped', 'prepped meals'],
  'h-journal': ['journaled', 'journalled', 'wrote in my journal'],
};

/** The habit a phrase names: a full match (every word of the name) or one telling word. */
export function matchHabit(s, ctx, { exactOnly = false, skipData = false } = {}) {
  const input = sig(s);
  if (!input.length) return null;
  const found = [];
  for (const h of ctx.habits || []) {
    if (h.archived || (skipData && DATA_SOURCES.has(h.source))) continue;
    const alias = (HABIT_ALIASES[h.id] || []).find((a) => new RegExp(`\\b${a}\\b`).test(s));
    const toks = sig(h.name);
    const hits = toks.filter((t) => input.some((u) => sameWord(t, u)));
    // Words you typed that aren't part of the name: "skip prayer" is not just "prayer".
    const aliasWords = alias ? sig(alias) : [];
    const extra = input.filter((u) => !toks.some((t) => sameWord(t, u)) && !aliasWords.includes(u)).length;
    const full = (toks.length > 0 && hits.length === toks.length) || !!alias;
    const telling = hits.filter((t) => !GENERIC.has(t)).length;
    if (exactOnly && (!full || extra)) continue;
    if (full) found.push({ habit: h, score: 1 + hits.length / 10, extra });
    else if (telling) found.push({ habit: h, score: hits.length / toks.length, extra });
  }
  if (!found.length) return null;
  found.sort((a, b) => b.score - a.score || a.extra - b.extra);
  const [top, next] = found;
  if (next && next.score === top.score && next.extra === top.extra) return { candidates: found.filter((x) => x.score === top.score).slice(0, 3).map((x) => x.habit) };
  return { habit: top.habit, full: top.score >= 1, extra: top.extra };
}

const COUNTER_SOURCES = { deepWork: 'deepWork', breaks: 'breaks', eyeBreaks: 'eyeBreaks' };
/** What logging a habit by name does: tick it, count it, or open the place its data comes from. */
function habitIntent(h, s) {
  const src = h.source || '';
  if (COUNTER_SOURCES[src]) return { kind: 'counter', field: src, delta: count(s.match(new RegExp(`\\b${NUM}\\b`))?.[1]) || 1 };
  if (src.startsWith('rel:')) return { kind: 'relation', person: src.slice(4), type: null, minutes: duration(s) };
  if (src && src !== 'top3') return { kind: 'open', habitId: h.id };
  const numeric = ['numeric', 'duration', 'quantity'].includes(h.type);
  if (numeric) {
    const n = h.type === 'duration' ? duration(s) ?? Number(s.match(/\b(\d+(?:\.\d+)?)\b/)?.[1] ?? NaN) : Number(s.match(/\b(\d+(?:\.\d+)?)\b/)?.[1] ?? NaN);
    return Number.isFinite(n) ? { kind: 'habit', habitId: h.id, value: n } : { kind: 'open', habitId: h.id };
  }
  if (h.type === 'rating') return { kind: 'open', habitId: h.id };
  return { kind: 'habit', habitId: h.id };
}

function habitsByName(s, w, ctx, { exactOnly = false } = {}) {
  const r = matchHabit(s, ctx, { exactOnly, skipData: exactOnly });
  if (!r) return null;
  if (r.candidates) return ask('Which habit?', [...r.candidates.map((h) => habitIntent(h, s)), { kind: 'task' }]);
  // One word of a habit's name among other words could be something else: ask, with a task as the other reading.
  if (r.extra && !r.full) return ask(`Did you mean ${r.habit.name}?`, [habitIntent(r.habit, s), { kind: 'task' }]);
  if (r.extra) return ask(`Log ${r.habit.name}?`, [habitIntent(r.habit, s), { kind: 'task' }]);
  return habitIntent(r.habit, s);
}

/* ---------- the pipeline ---------- */

const DATA = new Set(['water', 'weight', 'bodyfat', 'steps', 'food', 'produce', 'sleep', 'reading', 'learning', 'meditation', 'faith', 'workout', 'measure', 'mood', 'counter', 'relation', 'habit', 'skip']);
const LOGS = new Set([...DATA, 'open', 'note', 'win']);

// Order matters: the most specific readings first, habits by name late, tasks and numbers last.
const RECOGNISERS = [
  (s, w, c) => (/\d/.test(s.replace(/\b\d{1,2}:\d{2}\b/g, '')) ? null : habitsByName(s, w, c, { exactOnly: true })),
  negation, relation, taskStart, sleep, faith, sessions, steps, activity, water, food, weight, measure, mood, counters,
  habitsByName,
];

function titleOf(raw) {
  let t = raw;
  for (let i = 0; i < 2; i++) { const d = takeDate(t); if (!d.when) break; t = d.rest; }
  t = t.replace(/^(?:please |todo:? |to do:? |task:? |remind me to |remember to |don'?t forget to |i need to |need to |i have to |have to |i must |must )+/i, '');
  return cap(clean(t));
}
const AREAS = [
  [/\b(?:client|proposal|invoice|meeting|email|report|accountant|project|deck|contract|quote|tax|vat|boss|team|presentation|deadline|website|brief|pitch|work)\b/, 'work'],
  [/\b(?:doctor|dentist|gp|physio|pharmacy|prescription|optician|eye specialist|clinic|hospital|blood test|vaccine|checkup|check-up)\b/, 'health'],
  [/\b(?:mum|mom|dad|son|family|fiancee|wife|partner|birthday|anniversary|gift|wedding)\b/, 'relationships'],
  [/\b(?:church|pastor|bible|prayer)\b/, 'spirit'],
];
const areaOf = (s) => AREAS.find(([re]) => re.test(s))?.[1] || 'life';

function finish(intent, ctx, when, raw, s) {
  if (intent.kind === 'task') return { ...intent, title: intent.title || titleOf(raw), date: resolveDate(when, ctx.today, 'task'), area: intent.area || areaOf(s) };
  if (intent.kind === 'note' || intent.kind === 'win') return { ...intent, date: resolveDate(when, ctx.today, 'log') };
  let date = resolveDate(when, ctx.today, 'log');
  // Sleep belongs to the morning you woke up: "slept 7 h last night" is today's sleep.
  if (intent.kind === 'sleep' && when?.lastNight) date = addDays(date, 1);
  // A log for a day that hasn't happened yet is a plan: "run 5k tomorrow" becomes a task.
  if (date > ctx.today) return { kind: 'task', title: titleOf(raw), date, area: areaOf(s) };
  return { ...intent, date };
}

function one(raw, s, when, ctx) {
  for (const rec of RECOGNISERS) {
    const r = rec(s, when, ctx);
    if (!r) continue;
    if (r.ask) return { status: 'ask', question: r.ask, options: r.options.map((o) => finish(o, ctx, when, raw, s)), items: [] };
    return { status: 'ok', items: [finish(r, ctx, when, raw, s)], options: [] };
  }
  // A plan or a reminder.
  if (when && resolveDate(when, ctx.today, 'task') > ctx.today) return { status: 'ok', items: [finish({ kind: 'task' }, ctx, when, raw, s)], options: [] };
  if (TASK_CUE.test(s)) return { status: 'ok', items: [finish({ kind: 'task' }, ctx, when, raw, s)], options: [] };
  // A number on its own: your weight if it's near your last one, otherwise ask.
  const bare = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return { status: 'ask', ...bareNumber(Number(bare[1]), { ...ctx, date: resolveDate(when, ctx.today, 'log') }), items: [] };
  const task = finish({ kind: 'task' }, ctx, when, raw, s);
  const note = finish({ kind: 'note', text: cap(raw.trim()) }, ctx, when, raw, s);
  if (/\d/.test(s)) return { status: 'ask', question: 'Not sure what to log. Save it as:', options: [task, note], items: [] };
  // Something that happened ("emailed the client", "tired") is a note; anything else reads as a task.
  return statement(s) ? { status: 'ok', items: [note], options: [task], fallback: true } : { status: 'ok', items: [task], options: [note], fallback: true };
}

const PAST = /^(?:i )?(?:\w+ed|took|had|went|was|were|got|felt|made|did|saw|met|ate|drank|slept|woke|ran|swam|wrote|spent|bought|paid|sent|gave|told|found|left|came|kept|lost|won|finally|today was|it was)\b/;
const FEEL = /\b(?:tired|exhausted|great|good|bad|low|sore|sick|stressed|happy|sad|anxious|calm|grateful|mood|energy|feeling|felt|headache|ill|proud|frustrated|overwhelmed)\b/;
const statement = (s) => !TASK_START.test(s) && (PAST.test(s) || FEEL.test(s));

function bareNumber(n, ctx) {
  const unit = ctx.weightUnit === 'lb' ? 'lb' : 'kg';
  const last = ctx.lastWeightKg != null ? (unit === 'lb' ? ctx.lastWeightKg * 2.20462 : ctx.lastWeightKg) : null;
  const kg = unit === 'lb' ? n / 2.20462 : n;
  const near = last != null && Math.abs(n - last) <= Math.max(3, last * 0.08);
  const options = [];
  if (kg >= 20 && kg <= 400) options.push({ kind: 'weight', kg: Math.round(kg * 100) / 100, date: ctx.date });
  if (Number.isInteger(n) && n >= 100 && n <= 100000) options.push({ kind: 'steps', steps: n, date: ctx.date });
  if (n >= 50 && n <= 3000) options.push({ kind: 'water', ml: Math.round(n), date: ctx.date });
  if (near) return { question: null, sure: true, options: options.filter((o) => o.kind === 'weight') };
  return { question: `What is ${n}?`, options };
}

/** Text in, what it means out. Never saves anything. */
export function parse(input, ctx) {
  const raw = String(input || '').trim();
  if (!raw) return { status: 'empty', items: [], options: [] };
  const lower = normalize(raw);
  // Forced kinds: "task: …", "note: …", "win: …".
  const pre = lower.match(/^(task|todo|to do|note|journal|diary|win)\s*:\s*(.+)$/);
  if (pre) {
    const body = raw.slice(raw.indexOf(':') + 1).trim();
    const { rest, when } = takeDate(normalize(body));
    if (/^(?:task|todo|to do)$/.test(pre[1])) return { status: 'ok', items: [finish({ kind: 'task', title: titleOf(body) }, ctx, when, body, rest)], options: [] };
    return { status: 'ok', items: [{ kind: pre[1] === 'win' ? 'win' : 'note', text: cap(body), date: ctx.today }], options: [] };
  }
  const { rest, when } = takeDate(lower);
  if (!rest) return { status: 'ask', question: 'What happened then?', options: [], items: [] };
  // "2 fruit and 3 veg", "water 500, protein 30g": several logs in one line.
  const parts = rest.split(/\s*(?:,|;|\band\b|\bplus\b|&|\+(?!\d)|\bthen\b)\s*/).filter(Boolean);
  if (parts.length > 1) {
    const each = parts.map((p) => one(p, p, when, ctx));
    const usable = each.every((r) => r.status === 'ok' && !r.fallback && r.items.every((i) => DATA.has(i.kind)));
    if (usable) {
      const items = dedupe(each.flatMap((r) => r.items));
      return { status: 'ok', items, options: [] };
    }
  }
  const r = one(raw, rest, when, ctx);
  if (r.status === 'ask' && r.sure) return { status: 'ok', items: r.options, options: [] };
  return r;
}

/** Same habit twice ("Mobility & posture") is one log. */
function dedupe(items) {
  const seen = new Set();
  return items.filter((i) => {
    const k = i.habitId ? `${i.kind}:${i.habitId}` : null;
    if (!k) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const isLog = (i) => LOGS.has(i.kind);

/* ---------- describing what was understood ---------- */

const n0 = (n) => Number(n).toLocaleString('en-GB', { maximumFractionDigits: 1 });
const PEOPLE = { family: 'Family', son: 'Son', fiancee: 'Fiancée', date: 'Couple time' };
const FAITH_LABEL = { prayer: 'Prayer', scripture: 'Scripture', church: 'Church', gratitude: 'Gratitude', study: 'Scripture study' };
const MEAS_LABEL = { waist: 'Waist', chest: 'Chest', arms: 'Arms', thighs: 'Thighs', calves: 'Calves', neck: 'Neck' };
const COUNTER_LABEL = { deepWork: ['Deep work', 'block'], breaks: ['Movement breaks', 'break'], eyeBreaks: ['Visual breaks', 'break'] };
const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

/** A short, human line for an intent: { icon, title, value }. */
export function describe(i, ctx = {}) {
  const lb = ctx.weightUnit === 'lb';
  const cmUnit = ctx.lengthUnit === 'in';
  const habit = (id) => ctx.habits?.find((h) => h.id === id);
  switch (i.kind) {
    case 'water': return { icon: 'droplet', title: 'Water', value: i.ml >= 1000 ? `${n0(i.ml / 1000)} L` : `${i.ml} ml` };
    case 'weight': return { icon: 'scale', title: 'Weight', value: lb ? `${n0(i.kg * 2.20462)} lb` : `${n0(i.kg)} kg` };
    case 'bodyfat': return { icon: 'scale', title: 'Body fat', value: `${n0(i.percent)}%` };
    case 'steps': return { icon: 'footprints', title: 'Steps', value: n0(i.steps) };
    case 'food': return { icon: 'utensils', title: i.name, value: [i.protein ? `${n0(i.protein)} g protein` : '', i.kcal ? `${n0(i.kcal)} kcal` : '', i.fruit ? 'fruit' : '', i.veg ? 'veg' : ''].filter(Boolean).join(' · ') || 'Food' };
    case 'produce': return { icon: 'apple', title: i.fruit && i.veg ? 'Fruit & veg' : i.fruit ? 'Fruit' : 'Veg', value: [i.fruit ? `${i.fruit} fruit` : '', i.veg ? `${i.veg} veg` : ''].filter(Boolean).join(' · ') };
    case 'sleep': return { icon: 'bed', title: 'Sleep', value: [i.hours != null ? mins(Math.round(i.hours * 60)) : '', i.bedtime ? `${i.bedtime}–${i.wake}` : '', i.quality != null ? `quality ${i.quality}/10` : ''].filter(Boolean).join(' · ') };
    case 'reading': return { icon: 'book-open', title: i.book ? `Reading · ${i.book}` : 'Reading', value: [i.pages ? `${i.pages} pages` : '', i.minutes ? mins(i.minutes) : '', i.notes || ''].filter(Boolean).join(' · ') };
    case 'learning': return { icon: 'graduation-cap', title: i.topic ? `Learning · ${i.topic}` : 'Learning', value: mins(i.minutes) };
    case 'meditation': return { icon: 'leaf', title: 'Meditation', value: mins(i.minutes) };
    case 'faith': return { icon: 'church', title: FAITH_LABEL[i.type] || 'Faith', value: mins(i.minutes) };
    case 'workout': return { icon: i.type === 'strength' ? 'dumbbell' : i.title === 'Ride' ? 'bike' : 'footprints', title: i.title, value: [i.km ? `${n0(i.km)} km` : '', i.minutes ? mins(i.minutes) : ''].filter(Boolean).join(' · ') || 'Done' };
    case 'measure': return { icon: 'ruler', title: 'Measurements', value: Object.entries(i.fields).map(([k, v]) => `${MEAS_LABEL[k]} ${n0(cmUnit ? v / 2.54 : v)} ${cmUnit ? 'in' : 'cm'}`).join(' · ') };
    case 'mood': return { icon: 'heart-pulse', title: 'How you feel', value: ['energy', 'mood', 'stress'].filter((k) => i[k] != null).map((k) => `${k[0].toUpperCase() + k.slice(1)} ${i[k]}/10`).join(' · ') };
    case 'counter': { const [t, u] = COUNTER_LABEL[i.field]; return { icon: i.field === 'deepWork' ? 'focus' : i.field === 'eyeBreaks' ? 'scan-eye' : 'person-standing', title: t, value: `+${i.delta} ${u}${i.delta === 1 ? '' : 's'}` }; }
    case 'relation': return { icon: 'heart', title: PEOPLE[i.person] || 'Time together', value: [i.type || 'Time together', i.minutes ? mins(i.minutes) : ''].filter(Boolean).join(' · ') };
    case 'habit': { const h = habit(i.habitId); return { icon: h?.icon || 'check', title: h?.name || 'Habit', value: i.value != null ? `${n0(i.value)} ${h?.unit || ''}`.trim() : 'Done' }; }
    case 'skip': { const h = habit(i.habitId); return { icon: 'x', title: h?.name || 'Habit', value: 'Not today' }; }
    case 'open': { const h = habit(i.habitId); return { icon: h?.icon || 'arrow-right', title: h?.name || 'Open', value: 'Open to log' }; }
    case 'task': return { icon: 'list-todo', title: i.title, value: 'Task' };
    case 'note': return { icon: 'notebook-pen', title: i.text, value: 'Note' };
    case 'win': return { icon: 'star', title: i.text, value: 'Today’s win' };
    default: return { icon: 'circle', title: '', value: '' };
  }
}

/** "today", "yesterday", "Fri 9 Oct". */
export function dayWord(date, today) {
  const d = diffDays(date, today);
  if (d === 0) return 'today';
  if (d === -1) return 'yesterday';
  if (d === 1) return 'tomorrow';
  const dt = fromISO(date);
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekday(date) - 1];
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
  return `${wd} ${dt.getDate()} ${mo}`;
}

/* ---------- suggestions as you type ---------- */

/** Up to four completions for what you've typed: your recent lines first, then common ones. */
export function suggest(text, ctx = {}) {
  const t = normalize(text);
  if (!t) return (ctx.history || []).slice(0, 4);
  const unit = ctx.weightUnit === 'lb' ? 'lb' : 'kg';
  const w = ctx.lastWeightKg != null ? n0(unit === 'lb' ? ctx.lastWeightKg * 2.20462 : ctx.lastWeightKg) : null;
  const common = [
    'water 500 ml', 'water 250 ml', w ? `weight ${w} ${unit}` : null, 'slept 7h', `steps ${ctx.lastSteps || 8000}`, 'read 20 pages', 'read 30 min',
    'meditated 10 min', 'prayed', 'walked 30 min', 'ran 5k', '30g protein', '2 fruit', '3 veg', 'energy 7', 'mood 7', 'deep work block',
    'movement break', 'called mum', 'note: ', 'win: ', 'task: ',
    ...(ctx.habits || []).filter((h) => !h.archived && !DATA_SOURCES.has(h.source)).map((h) => h.name.toLowerCase()),
  ].filter(Boolean);
  const last = t.split(' ').pop();
  const seen = new Set([t]);
  const out = [];
  for (const c of [...(ctx.history || []), ...common]) {
    const n = normalize(c);
    if (seen.has(n)) continue;
    const hit = n.startsWith(t) || (!t.includes(' ') && t.length >= 2 && n.split(' ').some((x) => x.startsWith(last)));
    if (!hit) continue;
    seen.add(n);
    out.push(c);
    if (out.length === 4) break;
  }
  return out;
}
