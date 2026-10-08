// Starting and resuming workouts from anywhere in the app.
import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import { app } from '../ui/app-api.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { today, fmtDay } from '../domain/dates.js';
import { trainingCall } from '../domain/coach.js';
import { nextStep, parseRange } from '../domain/next-step.js';
import { weightUnit } from '../ui/format.js';

export function startWorkout(templateId, date = today()) {
  const active = F.activeWorkout();
  if (active) { app.go(`workout/${active.id}`); return active; }
  const tpl = F.template(templateId);
  const call = trainingCall(date);
  const lighter = tpl && call.kind === 'lighter' && call.template?.id === tpl.id;
  const w = store.put('workouts', {
    date, templateId: tpl?.id || null, title: tpl?.name || 'Workout', kind: tpl?.kind || 'strength',
    status: 'active', startedAt: new Date().toISOString(), notes: '', difficulty: null, rpe: null,
    adjusted: lighter ? `Lighter today: one set fewer per exercise. ${call.reason}` : null,
  });
  if (tpl) {
    const ops = [];
    tpl.items.forEach((it, order) => {
      const e = F.exercise(it.exerciseId);
      const prev = F.previousPerformance(it.exerciseId, { before: date });
      const prevSets = prev ? F.setsOf(prev.workout.id).filter((s) => s.exerciseId === prev.exerciseId && s.completed) : [];
      const sets = lighter ? Math.max(2, it.sets - 1) : it.sets;
      // The next step (13d): heavier when every set reached the top of the range, else one more rep.
      const step = lighter ? null : nextStep(it.exerciseId, it.reps, { before: date, unit: weightUnit() });
      const high = parseRange(it.reps)?.high ?? Infinity;
      for (let i = 0; i < sets; i++) {
        const last = prevSets[i] || prevSets[prevSets.length - 1];
        const p = !last || !step ? last
          : step.kind === 'load' ? { ...last, load: step.load, reps: step.reps }
            // One more rep (or 5 more seconds), up to the top of the range; past it once every set got there.
            : step.kind === 'reps' ? { ...last, reps: Math.max(Number(last.reps) || 0, Math.min(step.reps > high ? Infinity : high, (Number(last.reps) || 0) + 1)) }
              : step.kind === 'seconds' ? { ...last, seconds: Math.max(Number(last.seconds) || 0, Math.min(step.seconds > high ? step.seconds : high, (Number(last.seconds) || 0) + 5)) }
                : last;
        ops.push({ store: 'workoutSets', value: {
          workoutId: w.id, date, exerciseId: prev?.exerciseId && prev.exerciseId !== it.exerciseId ? prev.exerciseId : it.exerciseId, order, setIndex: i,
          target: it.reps, reps: e?.metric === 'reps' ? (p?.reps ?? null) : null,
          seconds: e?.metric === 'time' ? (p?.seconds ?? null) : null,
          minutes: e?.metric === 'minutes' ? (p?.minutes ?? null) : null,
          load: p?.load ?? it.load ?? e?.defaultLoad ?? null, rest: it.rest ?? null, completed: false,
        } });
      }
    });
    store.batch(ops);
  }
  app.go(`workout/${w.id}`);
  return w;
}

export function openStartSheet(date = today()) {
  const call = trainingCall(date);
  app.sheet({
    title: 'Start a session',
    render: () => html`<div class="form">
      ${call.reason ? html`<p class="sheet-note">${call.reason}</p>` : ''}
      <ul class="tpl-list">${F.templates().map((t) => html`<li data-key="${t.id}"><button type="button" class="${cx('tpl-item', call.template?.id === t.id && 'is-suggested')}" data-action="start" data-id="${t.id}">
        <span class="tpl-name">${t.name}</span>
        <span class="tpl-meta">${t.items.length} exercises · ~${t.minutes} min${call.template?.id === t.id ? ` · suggested for ${fmtDay(date)}` : ''}</span>
        <span class="tpl-go">${icon('play', { size: 16 })}</span></button></li>`)}</ul>
      <div class="btn-row"><button type="button" class="btn btn--ghost" data-action="blank">Empty session</button>
        <button type="button" class="btn btn--ghost" data-action="edit">Edit workouts</button></div>
    </div>`,
    actions: {
      start: ({ data, sheet }) => { app.closeSheet(sheet); startWorkout(data.id, date); },
      blank: ({ sheet }) => { app.closeSheet(sheet); startWorkout(null, date); },
      edit: ({ sheet }) => { app.closeSheet(sheet); app.go('plan/training'); },
    },
  });
}
