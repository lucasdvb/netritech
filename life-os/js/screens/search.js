// Global search: go to any screen or setting, and find anything you've logged (habits, tasks,
// journal, workouts, measurements, goals, books and reviews).
import * as store from '../data/store.js';
import { relativeDay, fmtMDY, fmtMD, fmtMonth } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import { dueLabel, repeatLabel } from '../domain/tasks.js';

const norm = (s) => String(s || '').toLowerCase();

// Every place, with the everyday words people use for it.
const SCREENS = [
  ['Today', 'today', 'calendar-check', 'home now cockpit'], ['Plan', 'plan', 'map', ''], ['Review', 'review', 'chart-spline', 'progress reflect week story'],
  ['Habits', 'plan/habits', 'list-checks', 'routines'], ['Your three', 'plan/habits/sort', 'target', 'focus in focus'],
  ['Your plan', 'plan/playbook', 'scroll-text', 'your day schedule playbook routines rules'], ['Goals', 'plan/goals', 'target', ''],
  ['Projects', 'plan/projects', 'layers', ''], ['Tasks', 'plan/tasks', 'list-todo', 'to do todo chores'], ['Lists', 'plan/lists', 'list-checks', 'shopping packing groceries checklist'],
  ['Brain dump', 'plan/notes', 'brain', 'notes ideas'], ['Training', 'plan/training', 'dumbbell', 'workouts gym sessions plan'],
  ['Exercises', 'plan/training/exercises', 'activity', 'lifts movements'], ['Books', 'plan/books', 'book-open', 'reading'],
  ['Money', 'plan/money', 'wallet', 'spending spent budget expenses'], ['Dates', 'plan/dates', 'calendar-heart', 'birthdays anniversaries countdown events'],
  ['Moodboard', 'plan/moodboard', 'image', 'pictures images'], ['Commitments', 'plan/commitments', 'hand', 'pledges'], ['Rewards', 'plan/rewards', 'trophy', ''],
  ['Body', 'progress/body', 'activity', 'health'], ['Weight', 'progress/body/weight', 'scale', 'weigh-in scale'],
  ['Food', 'progress/body/nutrition', 'utensils', 'nutrition calories protein meals'], ['Sleep', 'progress/body/sleep', 'bed', ''],
  ['Measurements', 'progress/body/measurements', 'ruler', 'waist body fat'], ['Progress photos', 'progress/body/photos', 'camera', 'pictures'],
  ['Trends', 'progress/trends', 'chart-spline', 'charts graphs'], ['Calendar', 'progress/calendar', 'calendar', 'history days'],
  ['Records & mastery', 'progress/records', 'medal', 'personal bests pb'], ['Season', 'progress/season', 'flag', ''], ['Your year', 'progress/year', 'sun', 'artwork print'],
  ['Journal', 'reflect/journal', 'notebook-pen', 'diary entries writing'], ['Reviews', 'reflect/reviews', 'calendar-days', 'weekly monthly yearly review'],
  ['Insights', 'reflect/insights', 'lightbulb', 'patterns'], ['Mind', 'progress/areas/mind', 'brain', 'learning meditation'],
  ['Spirit', 'progress/areas/spirit', 'church', 'faith prayer scripture'], ['Relationships', 'progress/areas/relationships', 'heart', 'family people'],
  ['Work', 'progress/areas/work', 'briefcase', 'deep work focus'], ['Settings', 'you/settings', 'settings', 'preferences options'], ['Reminders', 'you/reminders', 'bell', 'notifications alerts times timeline'],
  ['Data & backup', 'you/data', 'database', 'export import backup restore csv'], ['Privacy', 'you/privacy', 'shield-check', ''], ['Sync', 'you/sync', 'refresh-cw', 'devices server'],
];
// Every setting, by the label it has in Settings.
const SETTINGS = ['Name', 'Age', 'Height', 'Wake', 'Training', 'Work starts', 'Work ends', 'Lights out', 'My day ends at', 'Work days', 'Habits in focus',
  'Targets', 'Weight', 'Length', 'Theme', 'Show explanations', 'Haptics', 'Sound', 'Race against', 'Safety nets', 'Reminders', 'In your calendar',
  'Cues from your iPhone', 'When Life OS is closed', 'Badge on the app icon'];

/** Screens and settings matching what's typed. */
function places(t) {
  const out = SCREENS.filter(([name, , , words]) => norm(name).includes(t) || norm(words).split(' ').some((w) => w.startsWith(t)) || norm(words).includes(t))
    .map(([name, to, ic]) => ({ ic, title: name, sub: 'Go to', to }));
  const sets = SETTINGS.filter((x) => norm(x).includes(t)).map((x) => ({ ic: 'sliders-horizontal', title: x, sub: 'Setting', to: `you/settings?find=${encodeURIComponent(x)}` }));
  return [...out, ...sets];
}

function search(q) {
  const t = norm(q).trim();
  if (t.length < 2) return [];
  const hit = (...xs) => xs.some((x) => norm(x).includes(t));
  const snippet = (text) => {
    const s = String(text || '');
    const i = norm(s).indexOf(t);
    if (i < 0) return s.slice(0, 80);
    return `${i > 30 ? '…' : ''}${s.slice(Math.max(0, i - 30), i + 60)}${i + 60 < s.length ? '…' : ''}`;
  };
  const groups = [];
  const add = (title, items) => { if (items.length) groups.push({ title, items: items.slice(0, 8) }); };
  add('Go to', places(t));
  add('Habits', store.all('habits').filter((h) => hit(h.name, h.description)).map((h) => ({ ic: h.icon, title: h.name, sub: h.archived ? 'Archived' : h.description, to: `plan/habits/${h.id}` })));
  add('Tasks', store.all('tasks').filter((x) => hit(x.title, x.notes)).sort((a, b) => Number(a.done) - Number(b.done) || (a.date || '9999').localeCompare(b.date || '9999'))
    .map((x) => ({ ic: x.done ? 'circle-check' : 'list-todo', title: x.title, sub: `${x.done ? 'Done' : dueLabel(x.date)}${x.repeat ? ` · ${repeatLabel(x.repeat)}` : ''}`, to: 'plan/tasks' })));
  add('Brain dump', store.all('notes').filter((n) => hit(n.text, n.category)).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .map((n) => ({ ic: 'brain', title: snippet(n.text), sub: n.category || 'Unsorted', to: `plan/notes?open=${n.id}` })));
  add('Goals', store.all('goals').filter((g) => hit(g.name, g.description, ...(g.milestones || []).map((m) => m.title))).map((g) => ({ ic: 'target', title: g.name, sub: g.description, to: `plan/goals/${g.id}` })));
  add('Journal', store.all('journalEntries').filter((j) => hit(j.text, ...Object.values(j.answers || {}))).sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((j) => ({ ic: 'notebook-pen', title: `${relativeDay(j.date)} · ${j.kind}`, sub: snippet([j.text, ...Object.values(j.answers || {})].find((x) => norm(x).includes(t))), to: `reflect/journal/${j.id}` })));
  add('Workouts', store.all('workouts').filter((w) => w.status === 'done' && hit(w.title, w.notes)).sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((w) => ({ ic: 'dumbbell', title: w.title, sub: `${fmtMDY(w.date)}${w.notes ? ` · ${snippet(w.notes)}` : ''}`, to: `workout/${w.id}` })));
  add('Exercises', store.all('exercises').filter((e) => hit(e.name, e.cues)).map((e) => ({ ic: 'activity', title: e.name, sub: e.cues, to: `plan/training/exercises/${e.id}` })));
  const books = new Map();
  store.all('readingSessions').filter((r) => hit(r.book, r.notes)).forEach((r) => books.set(r.book || r.notes, r));
  add('Books & learning', [...[...books.values()].map((r) => ({ ic: 'book-open', title: r.book || 'Reading', sub: snippet(r.notes) || relativeDay(r.date), to: 'progress/areas/mind' })),
    ...store.all('learningSessions').filter((l) => hit(l.topic, l.notes)).map((l) => ({ ic: 'graduation-cap', title: l.topic || 'Learning', sub: `${relativeDay(l.date)} · ${snippet(l.notes)}`, to: 'progress/areas/mind' }))]);
  add('Measurements', store.all('measurements').filter((m) => hit(m.note, fmtMDY(m.date), m.date)).map((m) => ({ ic: 'ruler', title: fmtMDY(m.date), sub: m.note || `Waist ${m.waist ?? '—'} cm`, to: 'progress/body/measurements' })));
  add('Reviews', [...store.all('weeklyReviews').filter((r) => hit(...Object.values(r.answers || {}))).map((r) => ({ ic: 'calendar-days', title: `Week of ${fmtMD(r.id)}`, sub: snippet(Object.values(r.answers || {}).find((x) => norm(x).includes(t))), to: `reflect/review/week/${r.id}` })),
    ...store.all('monthlyReviews').filter((r) => hit(...Object.values(r.answers || {}))).map((r) => ({ ic: 'calendar', title: fmtMonth(`${r.id}-01`), sub: snippet(Object.values(r.answers || {}).find((x) => norm(x).includes(t))), to: `reflect/review/month/${r.id}` }))]);
  add('Moments & wins', [...store.all('relationshipEntries').filter((r) => hit(r.note, r.kind)).map((r) => ({ ic: 'heart', title: `${r.kind} · ${relativeDay(r.date)}`, sub: r.note, to: 'progress/areas/relationships' })),
    ...store.all('dailyReviews').filter((r) => hit(r.win)).map((r) => ({ ic: 'star', title: r.win, sub: relativeDay(r.date), to: `today/${r.date}` }))]);
  return groups;
}

export function openSearch() {
  const sh = app.sheet({
    title: 'Search',
    size: 'tall',
    ui: { q: '' },
    render: (s) => {
      const groups = search(s.ui.q);
      return html`<div class="form">
        <div class="search-field search-field--lg">${icon('search', { size: 18 })}<input type="search" placeholder="Anything: a screen, a setting, a habit, a note…" value="${s.ui.q}" data-input="q" autofocus aria-label="Search everything" enterkeyhint="search"></div>
        ${s.ui.q.trim().length < 2 ? html`<p class="muted small center">Search everything you’ve logged. It all stays on this device.</p>`
          : !groups.length ? html`<p class="muted center">Nothing matches “${s.ui.q}”.</p>`
            : groups.map((g) => html`<section><p class="section-label">${g.title}</p><ul class="list">${g.items.map((it) => html`<li><button type="button" class="row" data-action="go" data-to="${it.to}">
              <span class="row-ic">${icon(it.ic, { size: 16 })}</span><span class="row-main"><span class="row-title">${it.title}</span>${it.sub ? html`<span class="row-sub">${it.sub}</span>` : ''}</span></button></li>`)}</ul></section>`)}
      </div>`;
    },
    inputs: { q: ({ value, sheet }) => { sheet.ui.q = value; sheet.refresh(); } },
    actions: { go: ({ data, sheet }) => { app.closeSheet(sheet); app.go(data.to); } },
  });
  // Search wants the keyboard up straight away, unless the sheet was closed first.
  setTimeout(() => { if (sh.el?.classList.contains('is-open')) sh.el.querySelector('input[type="search"]')?.focus(); }, 80);
}
