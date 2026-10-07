// "+": log anything from anywhere. Weight and a workout are pinned first so body logging stays
// one tap away now that Body is no longer a tab. Every action lands you back where you were.
import { today } from '../domain/dates.js';
import * as F from '../domain/fitness.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';

const sheets = () => import('./sheets.js');
const ACTIONS = [
  { id: 'water', ic: 'droplet', label: 'Water', sub: '+500 ml', run: async () => (await sheets()).addWater(today(), 500) },
  { id: 'food', ic: 'utensils', label: 'Food', run: async () => (await sheets()).openFood(today()) },
  { id: 'steps', ic: 'footprints', label: 'Steps', run: async () => (await sheets()).openSteps(today()) },
  { id: 'checkin', ic: 'sunrise', label: 'Check-in', run: async () => (await sheets()).openCheckin(today()) },
  { id: 'task', ic: 'list-todo', label: 'Task', run: async () => (await import('./task-ui.js')).openTask(null, { date: today() }) },
  { id: 'habit', ic: 'list-checks', label: 'Habit', run: async () => (await import('./habit-new.js')).openNewHabit() },
  { id: 'journal', ic: 'notebook-pen', label: 'Journal', run: async () => (await import('./journal.js')).newEntry('free') },
  { id: 'reading', ic: 'book-open', label: 'Reading', run: async () => (await sheets()).openSession('reading', today()) },
  { id: 'measure', ic: 'ruler', label: 'Measurements', run: () => app.go('progress/body/measurements') },
];

export function openCapture() {
  const active = F.activeWorkout?.();
  app.sheet({
    title: 'Log something',
    render: () => html`<div class="capture">
      <div class="capture-pinned">
        <button type="button" class="capture-big" data-action="weight">${icon('scale', { size: 22 })}<span>Log weight</span></button>
        <button type="button" class="capture-big" data-action="workout">${icon('dumbbell', { size: 22 })}<span>${active ? `Resume ${active.title}` : 'Start workout'}</span></button>
      </div>
      <ul class="capture-grid">${ACTIONS.map((a) => html`<li><button type="button" class="capture-btn" data-action="run" data-id="${a.id}">
        <span class="capture-ic">${icon(a.ic, { size: 20 })}</span><span class="capture-label">${a.label}</span>${a.sub ? html`<span class="capture-sub">${a.sub}</span>` : ''}</button></li>`)}</ul>
      <button type="button" class="capture-search" data-action="search">${icon('search', { size: 18 })}<span>Search everything</span><kbd>⌘K</kbd></button>
    </div>`,
    actions: {
      weight: async ({ sheet }) => { app.closeSheet(sheet); (await sheets()).openWeight(today()); },
      workout: async ({ sheet }) => {
        app.closeSheet(sheet);
        const w = F.activeWorkout?.();
        if (w) return app.go(`workout/${w.id}`);
        (await import('./workout-actions.js')).openStartSheet(today());
      },
      run: async ({ data, sheet }) => { app.closeSheet(sheet); await ACTIONS.find((a) => a.id === data.id)?.run(); },
      search: ({ sheet }) => { app.closeSheet(sheet); app.search(); },
    },
  });
}
