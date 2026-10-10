// "+": log anything in one line (U2), or with one tap below. What you type is read on this device
// and shown back before anything is saved; when a line could mean two things, it asks. Weight and
// a workout stay pinned first so body logging is one tap away. Every save has Undo.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as F from '../domain/fitness.js';
import { today } from '../domain/dates.js';
import { trainingCall } from '../domain/day-plan.js';
import { parse, describe, dayWord, suggest } from '../domain/capture.js';
import { html, cx } from '../ui/dom.js';
import { icon, hasIcon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as usage from '../ui/usage.js';
import { canListen, listen } from '../ui/speech.js';
import { weightUnit, lengthUnit } from '../ui/format.js';

const sheets = () => import('./sheets.js');
const ACTIONS = [
  { id: 'water', ic: 'droplet', label: 'Water', sub: '+500 ml', run: async () => (await sheets()).addWater(today(), 500) },
  { id: 'food', ic: 'utensils', label: 'Food', run: async () => (await sheets()).openFood(today()) },
  { id: 'steps', ic: 'footprints', label: 'Steps', run: async () => (await import('./pads.js')).stepsPad(today()) },
  { id: 'checkin', ic: 'sunrise', label: 'Check-in', run: async () => (await sheets()).openCheckin(today()) },
  { id: 'task', ic: 'list-todo', label: 'Task', run: async () => (await import('./task-ui.js')).openTask(null, { date: today() }) },
  { id: 'focus', ic: 'timer', label: 'Focus', run: async () => (await import('./focus-sheet.js')).openFocus() },
  { id: 'spend', ic: 'wallet', label: 'Spent', run: async () => (await import('./money.js')).openExpense() },
  { id: 'habit', ic: 'list-checks', label: 'Habit', run: async () => (await import('./habit-new.js')).openNewHabit() },
  { id: 'journal', ic: 'notebook-pen', label: 'Journal', run: async () => (await import('./journal.js')).newEntry('free') },
  { id: 'dump', ic: 'brain', label: 'Brain dump', run: () => app.go('plan/notes') },
  { id: 'reading', ic: 'book-open', label: 'Reading', run: async () => (await sheets()).openSession('reading', today()) },
  { id: 'measure', ic: 'ruler', label: 'Measurements', run: () => app.go('progress/body/measurements') },
  { id: 'health', ic: 'heart-pulse', label: 'From Health', run: async () => (await import('./health.js')).openHealthPaste() },
];

const HISTORY = 'captureHistory';
const history = () => store.get('meta', HISTORY)?.items || [];
function remember(text, items) {
  // Lines that logged something are worth offering again; notes and one-off tasks aren't.
  if (!items.every((i) => !['note', 'dump', 'win', 'task'].includes(i.kind))) return;
  const t = text.trim().toLowerCase();
  const items2 = [t, ...history().filter((x) => x !== t)].slice(0, 12);
  store.put('meta', { id: HISTORY, items: items2 });
}

/** What the parser needs to know about you: units, last values, habits, foods, today's session. */
function context() {
  const t = today();
  const lastW = store.all('weightEntries').reduce((a, b) => (!a || b.date > a.date ? b : a), null);
  const lastS = store.all('stepLogs').reduce((a, b) => (!a || b.date > a.date ? b : a), null);
  const call = trainingCall(t);
  const tpl = call.kind !== 'done' && call.kind !== 'rest' ? call.template : null;
  return {
    today: t, weightUnit: weightUnit(), lengthUnit: lengthUnit(), lastWeightKg: lastW?.kg ?? null, lastSteps: lastS?.steps || null,
    habits: H.habits(), foods: store.all('foods'), partnerName: store.profile()?.partnerName || null, history: history(),
    planned: tpl ? { id: tpl.id, title: tpl.name, kind: tpl.kind } : null,
  };
}

function itemRow(i, ctx, { button = false, index } = {}) {
  const d = describe(i, ctx);
  const day = i.date ? dayWord(i.date, ctx.today) : '';
  const body = html`<span class="cap-ic">${icon(hasIcon(d.icon) ? d.icon : 'check', { size: 18 })}</span>
    <span class="cap-text"><span class="cap-title">${d.title}</span><span class="cap-value">${d.value}</span></span>
    ${day ? html`<span class="cap-day">${day}</span>` : ''}`;
  return button
    ? html`<li><button type="button" class="cap-item cap-item--pick" data-action="pick" data-i="${index}">${body}</button></li>`
    : html`<li class="cap-item">${body}</li>`;
}

function preview(r, ctx) {
  if (r.status === 'ask') {
    return html`<div class="cap-preview" data-key="cap-preview">
      <p class="cap-label">${r.question || 'Which one?'}</p>
      ${r.options.length ? html`<ul class="cap-list">${r.options.map((o, i) => itemRow(o, ctx, { button: true, index: i }))}</ul>` : ''}
    </div>`;
  }
  const alt = r.options[0];
  return html`<div class="cap-preview" data-key="cap-preview">
    <p class="cap-label">${r.items.length > 1 ? `${r.items.length} things to log` : 'Understood'}</p>
    <ul class="cap-list">${r.items.map((i) => itemRow(i, ctx))}</ul>
    <div class="cap-actions">
      <button type="submit" form="cap-form" class="btn btn--primary">${r.items.every((i) => i.kind === 'open') ? 'Open' : r.items.length > 1 ? `Save ${r.items.length}` : 'Save'}</button>
      ${alt ? html`<button type="button" class="link-btn" data-action="pick" data-i="0">${alt.kind === 'note' ? 'Save as a note instead' : 'Add as a task instead'}</button>` : ''}
    </div>
  </div>`;
}

/** The capture sheet. With { listen: true } it starts listening straight away. */
export function openCapture(initial = '', { listen: speak = false } = {}) {
  const active = F.activeWorkout?.();
  // Fresh numbers each time it opens (a weight logged a minute ago is the new "last weight").
  const ctx = context();
  const opened = app.sheet({
    title: 'Log something',
    ui: { text: initial, listening: false, heard: '' },
    render: (s) => {
      const text = s.ui.text;
      const r = text.trim() ? parse(text, ctx) : null;
      const sug = suggest(text, ctx).filter((x) => x.trim().toLowerCase() !== text.trim().toLowerCase());
      return html`<div class="capture">
        <form id="cap-form" class="cap-form" data-submit="save" autocomplete="off">
          <span class="cap-field">${icon('plus', { size: 20 })}
            <input class="cap-input" name="q" value="${text}" data-input="q" placeholder="Log anything…" aria-label="Log anything: type what you did or need to do"
              autocapitalize="sentences" autocorrect="on" spellcheck="true" enterkeyhint="done" ${speak ? '' : 'autofocus'} aria-describedby="cap-live">
            ${canListen() ? html`<button type="button" class="${cx('icon-btn icon-btn--sm cap-mic', s.ui.listening && 'is-on')}" data-action="listen" aria-pressed="${s.ui.listening}" aria-label="${s.ui.listening ? 'Stop listening' : 'Speak instead of typing'}">${icon('mic', { size: 18 })}</button>` : ''}</span>
          ${s.ui.listening ? html`<p class="cap-listening" data-key="cap-listening" role="status">${icon('mic', { size: 14 })} Listening… say it the way you’d type it.</p>` : ''}
          ${s.ui.heard && !s.ui.listening ? html`<p class="cap-listening" data-key="cap-heard" role="status">${s.ui.heard}</p>` : ''}
        </form>
        <div id="cap-live" class="cap-live" aria-live="polite">${r ? preview(r, ctx) : html`<p class="cap-hint" data-key="cap-hint">Try “water 500”, “slept 7h”, “read 20 pages” or “call mum Friday”. Your keyboard’s microphone works here too.</p>`}</div>
        ${sug.length ? html`<div class="cap-sugs" data-key="cap-sugs" aria-label="Suggestions">${sug.map((x) => html`<button type="button" class="chip" data-action="suggest" data-text="${x}">${x}</button>`)}</div>` : ''}
        ${r ? '' : html`<div class="capture-pinned" data-key="cap-pinned">
          <button type="button" class="capture-big" data-action="weight">${icon('scale', { size: 22 })}<span>Log weight</span></button>
          <button type="button" class="capture-big" data-action="workout">${icon('dumbbell', { size: 22 })}<span>${active ? `Resume ${active.title}` : 'Start workout'}</span></button>
        </div>
        <ul class="capture-grid" data-key="cap-grid">${ACTIONS.map((a) => html`<li><button type="button" class="capture-btn" data-action="run" data-id="${a.id}">
          <span class="capture-ic">${icon(a.ic, { size: 20 })}</span><span class="capture-label">${a.label}</span>${a.sub ? html`<span class="capture-sub">${a.sub}</span>` : ''}</button></li>`)}</ul>
        <button type="button" class="capture-search" data-action="search" data-key="cap-search">${icon('search', { size: 18 })}<span>Search everything</span><kbd>⌘K</kbd></button>`}
      </div>`;
    },
    inputs: { q: ({ value, sheet }) => { sheet.ui.text = value; sheet.refresh(); } },
    actions: {
      save: ({ sheet }) => {
        const r = parse(sheet.ui.text, ctx);
        if (r.status !== 'ok') { hap.warn(); return; }
        commit(r.items, sheet, ctx);
      },
      pick: ({ data, sheet }) => {
        const r = parse(sheet.ui.text, ctx);
        const o = r.options[Number(data.i)];
        if (o) commit([o], sheet, ctx);
      },
      suggest: ({ data, sheet }) => {
        sheet.ui.text = data.text;
        sheet.refresh();
        const input = sheet.el.querySelector('.cap-input');
        input?.focus();
        input?.setSelectionRange(data.text.length, data.text.length);
      },
      weight: async ({ sheet }) => { app.closeSheet(sheet); (await import('./pads.js')).weightPad(today()); },
      workout: async ({ sheet }) => {
        app.closeSheet(sheet);
        const w = F.activeWorkout?.();
        if (w) return app.go(`workout/${w.id}`);
        (await import('./workout-actions.js')).openStartSheet(today());
      },
      run: async ({ data, sheet }) => { app.closeSheet(sheet); await ACTIONS.find((a) => a.id === data.id)?.run(); },
      search: ({ sheet }) => { app.closeSheet(sheet); app.search(); },
      listen: ({ sheet }) => toggleListening(sheet),
    },
    onClose: () => opened?.ui.stop?.(),
  });
  if (speak && canListen() && opened) toggleListening(opened);
}

/** Start or stop listening; the words go into the field as they're heard. */
function toggleListening(sheet) {
  if (sheet.ui.listening) { sheet.ui.stop?.(); return; }
  sheet.ui.listening = true;
  sheet.ui.heard = '';
  sheet.refresh();
  sheet.ui.stop = listen({
    onText: (t) => {
      sheet.ui.text = t;
      // The field is yours while you type, so what's heard is written into it directly.
      const input = sheet.el.querySelector('.cap-input');
      if (input) input.value = t;
      sheet.refresh();
    },
    onEnd: (why) => {
      sheet.ui.listening = false;
      sheet.ui.stop = null;
      if (why === 'not-allowed' || why === 'service-not-allowed') sheet.ui.heard = 'Microphone not allowed. Use the keyboard’s microphone, or allow it in Settings › Safari.';
      else if (why !== 'done' && why !== 'aborted' && !sheet.ui.text.trim()) sheet.ui.heard = 'Didn’t catch that. Tap the microphone to try again.';
      sheet.refresh();
      sheet.el.querySelector('.cap-input')?.focus();
    },
  });
}

async function commit(items, sheet, ctx) {
  // A second tap (or Enter) while the first is still on its way logs nothing twice.
  if (sheet.ui.saving) return;
  sheet.ui.saving = true;
  const { save } = await import('../domain/capture-save.js');
  const res = save(items, ctx);
  // What you log teaches Today's quick row (this device only).
  const Q = { water: 'water', food: 'food', steps: 'steps', weight: 'weight', workout: 'workout', note: 'journal', reading: 'reading', meditation: 'meditation', task: 'task' };
  for (const i of items) if (Q[i.kind]) usage.track(`q:${Q[i.kind]}`);
  remember(sheet.ui.text, items);
  app.closeSheet(sheet);
  if (res.saved) {
    hap.success();
    app.toast(res.message, { icon: 'check', action: { label: 'Undo', fn: () => { res.undo(); hap.tap(); } } });
  }
  if (res.open) openPlace(H.habit(res.open), items.find((i) => i.kind === 'open')?.date || today());
}

/** Things logged where they live (the journal, a workout, the shutdown) open there. */
async function openPlace(h, date) {
  if (!h) return;
  if (h.id === 'h-training' || h.source?.startsWith('workout:')) {
    const w = F.activeWorkout?.();
    if (w) return app.go(`workout/${w.id}`);
    return (await import('./workout-actions.js')).openStartSheet(date);
  }
  const s = await sheets();
  if (h.source === 'shutdown') return s.openShutdown(date);
  if (h.source === 'journal') return (await import('./journal.js')).newEntry('free');
  if (h.source) return s.openSource(h, date);
  return s.openHabit(h.id, date);
}
