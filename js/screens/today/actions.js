// Today's buttons and fields: what each one does. Loaded just after the first screen (Today's
// first frame doesn't need them), and at once if you tap before then.
import * as store from '../../data/store.js';
import * as H from '../../domain/habits.js';
import * as F from '../../domain/fitness-core.js';
import * as R from '../../domain/routines.js';
import * as T from '../../domain/tasks.js';
import { today, addDays } from '../../domain/dates.js';
import { app } from '../../ui/app-api.js';
import * as hap from '../../ui/haptics.js';
import { saveReview } from '../../domain/day.js';
import { taskActions, openTask } from '../task-ui.js';

const sheets = () => import('../sheets.js');
const workouts = () => import('../workout-actions.js');
const pads = () => import('../pads.js');
const opener = () => import('./open.js');
/** An action that opens something from a module loaded on first use, for the day on screen. */
const open = (load, fn, ...args) => async ({ params }) => (await load())[fn](...args, params.date || today());
/** Re-check a routine's finished time after one of its habits changes. */
const settleFor = (habitId, date) => { const r = R.routineOf(habitId); if (r) R.settle(r.routine, date); };

export const actions = {
  ...taskActions,
  'task-new': ({ params }) => openTask(null, { date: params.date || today() }),
  'task-today': ({ data }) => { T.save(data.id, { date: today() }); hap.tap(); },
  'move-priority': ({ from, to, params }) => T.movePriority(params.date || today(), from, to),
  toggle: ({ data, params }) => {
    const date = params.date || today();
    const h = H.habit(data.id);
    const wasDone = H.isDone(h, date);
    const now = H.tap(h, date);
    settleFor(h.id, date);
    if (wasDone && now) { app.toast('Done from your logged data. Edit the entry to change it.'); return; }
    now ? hap.success() : hap.tap();
  },
  tiny: async ({ data, params }) => {
    const date = params.date || today();
    const h = H.habit(data.id);
    if (h) (await pads()).logTiny(h, date, { onDone: () => settleFor(h.id, date) });
  },
  // The safety nets' own actions (today/nets.js) join these when they load.
  'unskip-habit': ({ data, params }) => {
    const date = params.date || today();
    const h = H.habit(data.id);
    if (!h) return;
    H.setSkip(h, date, false);
    settleFor(h.id, date);
    hap.tap();
  },
  // A routine step: plain steps tick; habit steps complete like any habit.
  step: async ({ data, params }) => {
    const date = params.date || today();
    const r = R.routine(data.r);
    const s = r && R.progress(r, date).steps.find((x) => x.id === data.s);
    if (!s) return;
    if (s.kind === 'label') { R.toggleLabel(r, s, date) ? hap.success() : hap.tap(); return; }
    const h = s.habit;
    const needsInput = H.isNumeric(h) || ['sleep', 'shutdown'].includes(h.source) || h.id === 'h-training' || h.source?.startsWith('workout:');
    if (needsInput && !s.done) return (await opener()).openHabitOrSource(h, date);
    const now = H.tap(h, date);
    R.settle(r, date);
    now ? hap.success() : hap.tap();
  },
  'step-label': ({ data, params }) => {
    const date = params.date || today();
    const r = R.routine(data.r);
    const s = r && R.progress(r, date).steps.find((x) => x.id === data.s);
    if (s) { R.toggleLabel(r, s, date); hap.success(); }
  },
  'did-it-all': ({ data, params }) => {
    const date = params.date || today();
    const r = R.routine(data.r);
    if (!r) return;
    const undo = R.didItAll(r, date);
    hap.success();
    app.toast(`${r.name} done.`, { icon: 'check', action: { label: 'Undo', fn: undo } });
  },
  routine: ({ data, ui }) => {
    const open = document.querySelector(`[data-key="r-${data.id}"]`)?.classList.contains('is-open');
    ui.routines = { ...(ui.routines || {}), [data.id]: !open };
    app.refresh();
  },
  'edit-routine': async ({ data }) => (await import('../routine-edit.js')).openRoutineEditor(data.id),
  expand: ({ data, ui }) => { ui.expanded = { ...(ui.expanded || {}), [data.id]: !ui.expanded?.[data.id] }; app.refresh(); },
  habit: async ({ data, params }) => { const h = H.habit(data.id); if (h) await (await opener()).openHabitOrSource(h, params.date || today()); },
  source: async ({ data, params }) => (await sheets()).openSource(H.habit(data.id), params.date || today()),
  wchip: async ({ data, params }) => {
    const date = params.date || today();
    const h = H.habit(data.id);
    if (h.source) return (await sheets()).openSource(h, date);
    const now = H.toggle(h, date);
    now ? hap.success() : hap.tap();
  },
  counter: async ({ data, params }) => (await sheets()).bumpCounter(params.date || today(), data.source, Number(data.delta)),
  'more-today': ({ ui }) => { ui.moreOpen = !ui.moreOpen; app.refresh(); },
  'day-all': ({ ui }) => { ui.dayAll = !ui.dayAll; app.refresh(); },
  unfold: ({ data, ui }) => { ui.unfolded = { ...(ui.unfolded || {}), [data.id]: true }; app.refresh(); },
  skip: ({ data, ui }) => { ui.skipped = [...(ui.skipped || []), data.id]; hap.tap(); app.refresh(); },
  unskip: ({ ui }) => { ui.skipped = []; app.refresh(); },
  plan: open(sheets, 'openPlan'),
  'focus-later': () => store.setSettings({ focusPromptUntil: addDays(today(), 7) }),
  'edit-today': async () => (await import('./edit.js')).openEditToday(),
  'pick-day': open(() => import('./day-picker.js'), 'openDayPicker'),
  'add-water': async ({ data, params }) => (await sheets()).addWater(params.date || today(), Number(data.ml) || 500),
  'open-checkin': open(sheets, 'openCheckin'),
  ritual: async ({ data, params }) => (await import('../ritual.js')).openRitual(data.which === 'morning' ? 'morning' : 'evening', params.date || today()),
  'open-shutdown': open(sheets, 'openShutdown'),
  'log-steps': open(pads, 'stepsPad'),
  'log-food': open(sheets, 'openFood'),
  'log-weight': open(pads, 'weightPad'),
  'pin-workout': async ({ params }) => {
    const active = F.activeWorkout();
    if (active) return app.go(`workout/${active.id}`);
    (await workouts()).openStartSheet(params.date || today());
  },
  'pin-journal': async () => (await import('../journal.js')).newEntry('free'),
  'pin-focus': open(() => import('../focus-sheet.js'), 'openFocus'),
  'pin-money': async () => (await import('../money.js')).openExpense(),
  'pin-reading': open(sheets, 'openSession', 'reading'),
  'pin-meditation': open(sheets, 'openSession', 'meditation'),
  'start-workout': async ({ data, params }) => (await workouts()).startWorkout(data.template, params.date || today()),
  'set-mode': async ({ data, params }) => (await sheets()).setMode(params.date || today(), data.mode),
  mode: open(sheets, 'openMode'),
  'go-today': () => app.replace('today'),
  'top3-check': ({ data, params }) => {
    const date = params.date || today();
    const i = Number(data.i);
    const t = T.slots(date)[i];
    if (!t) { document.querySelector(`[data-i="${i}"].top3-input`)?.focus(); return; }
    T.toggle(t.id) ? hap.success() : hap.tap();
  },
};

export const inputs = {
  'task-add': ({ el, value, params }) => {
    const title = value.trim();
    if (!title) return;
    T.add({ title, date: params.date || today() });
    el.value = '';
    hap.tap();
  },
  'top3-text': ({ el, value, params }) => {
    const undo = T.setPriorityUndoable(params.date || today(), Number(el.dataset.i), value);
    if (undo) app.toast('Priority cleared', { action: { label: 'Undo', fn: undo } });
  },
  win: ({ value, params }) => saveReview(params.date || today(), { win: value.trim() }),
};
