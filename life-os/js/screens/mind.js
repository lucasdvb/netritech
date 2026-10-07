import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import { today, lastNDays, startOfWeek, startOfMonth, relativeDay, fmtMD, fmtDayShort, range } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { num } from '../ui/format.js';
import { openSession } from './sheets.js';

const sumMin = (storeName, from, to = today()) => store.all(storeName).filter((s) => s.date >= from && s.date <= to).reduce((a, s) => a + (s.minutes || 0), 0);

export default {
  id: 'mind',
  title: 'Mind',
  render() {
    const wk = startOfWeek(today()), mo = startOfMonth(today());
    const reading = store.all('readingSessions').sort((a, b) => (a.date < b.date ? 1 : -1));
    const learning = store.all('learningSessions').sort((a, b) => (a.date < b.date ? 1 : -1));
    const meditation = store.all('meditationSessions').sort((a, b) => (a.date < b.date ? 1 : -1));
    const books = new Map();
    for (const r of [...reading].reverse()) {
      if (!r.book) continue;
      const b = books.get(r.book) || { title: r.book, minutes: 0, pages: 0, finished: false, last: r.date, ratings: [] };
      b.minutes += r.minutes || 0; b.pages += r.pages || 0; b.last = r.date; if (r.finished) b.finished = true; if (r.rating) b.ratings.push(r.rating);
      books.set(r.book, b);
    }
    const current = [...books.values()].filter((b) => !b.finished).sort((a, b) => (a.last < b.last ? 1 : -1));
    const finished = [...books.values()].filter((b) => b.finished);
    const days = lastNDays(today(), 14);
    const topics = [...new Set(learning.filter((l) => l.date >= wk).map((l) => l.topic).filter(Boolean))];
    const all = [...reading.map((r) => ({ ...r, k: 'reading' })), ...learning.map((r) => ({ ...r, k: 'learning' })), ...meditation.map((r) => ({ ...r, k: 'meditation' }))]
      .sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
    return html`
      ${pageHead({ title: 'Mind', back: { to: 'more', label: 'More' } })}
      <div class="quick-row quick-row--top">
        <button type="button" class="btn btn--primary btn--sm" data-action="log" data-kind="reading">${icon('book-open', { size: 16 })} Reading</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="log-learning">${icon('graduation-cap', { size: 16 })} Learning</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="log" data-kind="meditation">${icon('leaf', { size: 16 })} Meditation</button>
      </div>
      <div class="stat-row stat-row--3 block-tight">
        <div class="stat"><p class="stat-label">Reading · week</p><p class="stat-value tnum">${num(sumMin('readingSessions', wk))}<span class="stat-unit">min</span></p></div>
        <div class="stat"><p class="stat-label">Learning · week</p><p class="stat-value tnum">${num(sumMin('learningSessions', wk))}<span class="stat-unit">min</span></p></div>
        <div class="stat"><p class="stat-label">Meditation · week</p><p class="stat-value tnum">${num(sumMin('meditationSessions', wk))}<span class="stat-unit">min</span></p></div>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">Reading & learning · 14 days</h2><span class="block-meta">target 20 min/day</span></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: days.map((d) => M.mindMinutes(d) || null), color: 'var(--c-mind)', fmt: (v) => `${v} min`, goal: { value: 20, label: '20' } })}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Books</h2><span class="block-meta">${finished.filter((b) => b.last >= startOfMonth(today())).length} finished this month</span></div>
        ${current.length || finished.length ? html`<ul class="list">
          ${current.map((b) => html`<li class="row"><span class="row-ic" style="--ic:var(--c-mind)">${icon('book-open', { size: 16 })}</span><span class="row-main"><span class="row-title">${b.title}</span><span class="row-sub">Reading · ${num(b.minutes)} min${b.pages ? ` · ${b.pages} pages` : ''} · last ${relativeDay(b.last).toLowerCase()}</span></span>
            <button type="button" class="btn btn--soft btn--sm" data-action="continue" data-book="${b.title}">Log</button></li>`)}
          ${finished.map((b) => html`<li class="row"><span class="row-ic" style="--ic:var(--accent)">${icon('check', { size: 16 })}</span><span class="row-main"><span class="row-title">${b.title}</span><span class="row-sub">Finished ${relativeDay(b.last).toLowerCase()}${b.ratings.length ? ` · ${Math.max(...b.ratings)}/10` : ''}</span></span></li>`)}
        </ul>` : html`<p class="muted">Log a reading session with a title and your books collect here.</p>`}
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">What I learned this week</h2></div>
        <div class="card">${topics.length ? html`<div class="weekly-chips">${topics.map((t) => html`<span class="wchip">${t}</span>`)}</div>` : html`<p class="muted small">Topics from your learning sessions appear here. AI, marketing, design, sales, leadership…</p>`}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Recent sessions</h2></div>
        ${all.length ? html`<ul class="list">${all.map((s) => html`<li><button type="button" class="row" data-action="edit" data-kind="${s.k}" data-id="${s.id}">
          <span class="row-ic" style="--ic:var(--c-mind)">${icon(s.k === 'reading' ? 'book-open' : s.k === 'learning' ? 'graduation-cap' : 'leaf', { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${s.book || s.topic || (s.k === 'meditation' ? `Meditation · ${s.kind || ''}` : 'Session')}</span><span class="row-sub">${relativeDay(s.date)} · ${s.minutes || 0} min${s.notes ? ` · ${s.notes.slice(0, 50)}` : ''}</span></span></button></li>`)}</ul>`
          : empty({ ic: 'book-open', title: 'No sessions yet', body: '20 minutes a day. Minutes, not pages.' })}
      </section>`;
  },
  actions: {
    log: ({ data }) => openSession(data.kind, today()),
    'log-learning': () => openSession('reading', today(), null, { switchTo: 'learning' }),
    continue: ({ data }) => openSession('reading', today(), null, { book: data.book }),
    edit: ({ data }) => {
      const storeName = { reading: 'readingSessions', learning: 'learningSessions', meditation: 'meditationSessions' }[data.kind];
      openSession(data.kind, null, store.get(storeName, data.id));
    },
  },
};
