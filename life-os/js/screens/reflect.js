// Reflect's sections, shown in Review: today's page, ready to write (saved as you type, mood one
// optional tap), the reviews that are due (day, week, month), insights that each end in one change
// to your plan, and the journal.
import * as store from '../data/store.js';
import * as I from '../domain/insights.js';
import * as Rt from '../domain/rituals.js';
import { today, relativeDay, fmtMD, fmtLong, endOfWeek, monthKey, fmtMonth, weekday, addDays, diffDays, fmtTime, cmp } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import * as hap from '../ui/haptics.js';
import { app } from '../ui/app-api.js';
import { newEntry, KIND_LABEL } from './journal.js';
import { defaultWeek } from './review-week.js';
import { insightCard, insightActions } from './insight-ui.js';
import { filmMonths, monthFilm } from '../domain/film.js';
import { memoryCard, experimentBlock, experimentActions } from './experiment-ui.js';
export { memoryCard, experimentBlock };
import { due as dueYear, review as yearReview } from '../domain/year-review.js';

const PROMPTS = {
  morning: ['What matters most today?', 'What would make today a good day?', 'What could get in the way, and what will you do about it?'],
  day: ['What’s going well so far?', 'What needs your attention this afternoon?', 'What are you putting off, and why?'],
  evening: ['What did today teach you?', 'What are you grateful for today?', 'What will you do differently tomorrow?', 'What went right today, however small?'],
};
export const MOODS = [[1, 'Low'], [2, 'Flat'], [3, 'Okay'], [4, 'Good'], [5, 'Great']];

function promptFor(date, now = new Date()) {
  const h = now.getHours();
  const list = PROMPTS[h < 12 ? 'morning' : h < 17 ? 'day' : 'evening'];
  return list[Math.abs(diffDays(date, '2026-01-01')) % list.length];
}

/** Today's page: the first free entry of the day (made when you start typing). */
const todayEntry = (date = today()) => store.onDate('journalEntries', date).find((j) => j.kind === 'free') || null;

let timer = 0;
let stopHelps = null;
let pending = null;
function save(patch) {
  const t = today();
  const cur = todayEntry(t);
  const next = { ...(cur || { date: t, kind: 'free', answers: {}, text: '', prompt: promptFor(t) }), ...patch };
  // A page wiped clean, with no mood either, goes away rather than sitting in the journal empty.
  if (cur && !(next.text || '').trim() && !next.mood) store.remove('journalEntries', cur.id);
  else if (cur || (next.text || '').trim() || next.mood) store.put('journalEntries', next);
}
function flush() {
  clearTimeout(timer);
  if (pending == null) return;
  const v = pending;
  pending = null;
  const was = todayEntry()?.text || '';
  if (was === v) return;
  // More words on a page that's already there: on screen already, so no redraw while you write.
  if (was.trim() && v.trim()) store.quietly(() => save({ text: v }));
  else save({ text: v });
}

export function write() {
  const t = today();
  const j = todayEntry(t);
  const guided = store.onDate('journalEntries', t).filter((e) => e.kind !== 'free');
  return html`<section class="write" data-key="write" aria-label="Today’s page">
    <p class="section-label">${fmtLong(t)}</p>
    <p class="write-prompt">${j?.prompt || promptFor(t)}</p>
    <textarea class="write-area" data-input="write" rows="5" placeholder="Start writing. A sentence is enough." aria-label="Today’s reflection" enterkeyhint="enter">${j?.text || ''}</textarea>
    <div class="write-foot">
      <div class="mood-row" role="group" aria-label="Mood, optional">${MOODS.map(([v, label]) => html`<button type="button" class="${cx('mood-chip', j?.mood === v && 'is-on')}" data-action="mood" data-v="${v}" aria-pressed="${j?.mood === v}">${label}</button>`)}</div>
      <p class="write-saved" aria-live="polite">${j?.updatedAt ? `Saved ${fmtTime(new Date(j.updatedAt))}` : ''}</p>
    </div>
    <div class="write-more">
      <span class="write-guided">Guided entry:
        <button type="button" class="link-btn" data-action="new" data-kind="morning">${guided.some((e) => e.kind === 'morning') ? html`${icon('check', { size: 13 })} Morning` : 'Morning'}</button> ·
        <button type="button" class="link-btn" data-action="new" data-kind="evening">${guided.some((e) => e.kind === 'evening') ? html`${icon('check', { size: 13 })} Evening` : 'Evening'}</button></span>
      <span>${icon('lock', { size: 13 })} Private, on this device</span></div>
  </section>`;
}

export function reviewsDue() {
  const t = today();
  const ws = defaultWeek();
  const wk = store.get('weeklyReviews', ws);
  const m = monthKey(t);
  const monthEnd = monthKey(addDays(t, 3)) !== m;
  const mId = monthEnd ? m : monthKey(addDays(`${m}-01`, -1));
  const mr = store.get('monthlyReviews', mId);
  const sealed = Rt.sealedAt(t);
  const hour = new Date().getHours();
  const items = [
    { action: 'close-day', ic: 'moon', title: 'Close the day', done: !!sealed,
      sub: sealed ? `Sealed at ${fmtTime(new Date(sealed))}` : hour >= 17 ? 'About a minute: what’s left, one win, tomorrow’s first task' : 'This evening: what’s left, one win, tomorrow’s first task' },
    { to: `reflect/review/week/${ws}`, ic: 'calendar-days', title: `Weekly review · ${fmtMD(ws)} – ${fmtMD(endOfWeek(ws))}`, done: !!wk?.completedAt,
      sub: wk?.completedAt ? `Done${wk.answers?.one ? ` · ${wk.answers.one}` : ''}` : weekday(t) === 7 ? 'Sunday evening is the moment · about 3 minutes' : 'About 3 minutes, best on Sunday evening' },
    { to: `reflect/review/month/${mId}`, ic: 'calendar', title: `Monthly review · ${fmtMonth(`${mId}-01`)}`, done: !!mr?.completedAt,
      sub: mr?.completedAt ? 'Done · tap to revisit' : 'Stop · start · continue · one focus' },
  ];
  // The yearly review, from mid-December to the end of January (13f).
  const yr = dueYear(t);
  if (yr) {
    const rv = yearReview(yr);
    items.push({ to: `reflect/review/year/${yr}`, ic: 'sparkles', title: `Your ${yr}`, done: !!rv?.completedAt,
      sub: rv?.completedAt ? (rv.word ? `Done · ${yr + 1}: ${rv.word}` : 'Done') : `The year in numbers, three questions, one word for ${yr + 1}` });
  }
  const rowBody = (it) => html`<span class="${cx('row-ic', it.done && 'row-ic--done')}">${icon(it.done ? 'check' : it.ic, { size: 18 })}</span>
    <span class="row-main"><span class="row-title">${it.title}</span><span class="row-sub">${it.sub}</span></span>
    <span class="row-chev">${icon('chevron-right', { size: 18 })}</span>`;
  return html`<section class="block" data-key="reviews">
    <div class="block-head"><h2 class="block-title">Reviews</h2><a class="link-btn" href="#/reflect/reviews" data-action="nav" data-to="reflect/reviews">Past reviews</a></div>
    <ul class="list">${items.map((it) => html`<li>${it.to ? html`<a class="row" href="#/${it.to}" data-action="nav" data-to="${it.to}">${rowBody(it)}</a>`
      : html`<button type="button" class="row" data-action="${it.action}">${rowBody(it)}</button>`}</li>`)}</ul>
  </section>`;
}

export function insights() {
  const list = I.insights(today());
  if (!list.length) return '';
  return html`<section class="block" data-key="insights">
    <div class="block-head"><h2 class="block-title">Insights</h2>${list.length > 2 ? html`<a class="link-btn" href="#/reflect/insights" data-action="nav" data-to="reflect/insights">All ${list.length}</a>` : ''}</div>
    <ul class="insight-cards">${list.slice(0, 2).map(insightCard)}</ul>
  </section>`;
}

const preview = (j) => [j.mood ? `Mood: ${MOODS.find(([v]) => v === j.mood)?.[1]}` : '', ...Object.values(j.answers || {}), j.text || ''].map((s) => (s || '').trim()).filter(Boolean).join(' · ').slice(0, 120);

/** Monthly films (G10): each month as a short story, at your request. */
export function films() {
  const months = filmMonths(4);
  if (!months.length) return '';
  const cur = monthKey(today());
  return html`<section class="block" data-key="films">
    <div class="block-head"><h2 class="block-title">Monthly films</h2></div>
    <ul class="list">${months.map((m) => html`<li><button type="button" class="row" data-action="film" data-m="${m}">
      <span class="row-ic">${icon('play', { size: 16 })}</span>
      <span class="row-main"><span class="row-title">${fmtMonth(`${m}-01`)}${m === cur ? ' · so far' : ''}</span><span class="row-sub">Under a minute · save it as a video</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul>
  </section>`;
}

export function recent() {
  const t = today();
  const list = store.all('journalEntries').filter((j) => !(j.date === t && j.kind === 'free'))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : cmp(b.createdAt || '', a.createdAt || ''))).slice(0, 4);
  return html`<section class="block" data-key="journal">
    <div class="block-head"><h2 class="block-title">Journal</h2><a class="link-btn" href="#/reflect/journal" data-action="nav" data-to="reflect/journal">All entries</a></div>
    ${list.length ? html`<ul class="list">${list.map((j) => html`<li><a class="row journal-row" href="#/reflect/journal/${j.id}" data-action="nav" data-to="reflect/journal/${j.id}">
      <span class="row-main"><span class="row-title" data-morph="journal-${j.id}">${KIND_LABEL[j.kind]} <span class="muted">· ${relativeDay(j.date)}</span></span><span class="row-sub journal-preview">${preview(j) || 'Empty'}</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>`
      : html`<p class="quiet-line">Past pages collect here, newest first.</p>`}
  </section>`;
}

// What Reflect does (today's page saving as you type, moods, reviews, insights, films), now in Review.
export const behaviour = {
  mount(el) {
    stopHelps = I.onHelps(() => app.refresh());
    // The page grows with what you write: by itself where the browser can (field-sizing), otherwise
    // measured, and only measured from scratch when text was taken away (a full measure is slow on a long page).
    if (CSS.supports?.('field-sizing', 'content')) return;
    const grow = (t, shrink = true) => {
      if (shrink) t.style.height = 'auto';
      const h = Math.max(t.scrollHeight, 132);
      if (shrink || h > t.offsetHeight) t.style.height = `${h}px`;
    };
    el.querySelectorAll('.write-area').forEach((t) => grow(t));
    el.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.matches?.('.write-area')) return;
      grow(t, t.value.length < (t.lastLength ?? 0));
      t.lastLength = t.value.length;
    });
  },
  unmount() { flush(); stopHelps?.(); stopHelps = null; },
  inputs: {
    write: ({ value }) => {
      clearTimeout(timer);
      // The first words make the page; after that, saving waits for a pause in typing.
      if (!todayEntry() && value.trim()) { pending = null; save({ text: value }); return; }
      pending = value;
      timer = setTimeout(flush, 350);
    },
  },
  actions: {
    new: ({ data }) => newEntry(data.kind),
    mood: ({ data }) => { flush(); const v = Number(data.v); save({ mood: todayEntry()?.mood === v ? null : v }); hap.tap(); },
    'close-day': async () => (await import('./ritual.js')).openRitual('evening', today()),
    film: async ({ data }) => (await import('../ceremony/film.js')).playFilm(monthFilm(data.m)),
    ...insightActions,
    ...experimentActions,
  },
};
