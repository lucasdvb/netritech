// Gym mode (U9): one set at a time, big controls for one hand, the screen kept awake, and a rest
// timer that starts when you log a set. The timer is a timestamp on the workout, so it stays right
// to the second across app switches and reloads. The full list is one tap away.
import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { empty } from '../ui/components.js';
import { num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

// Rest between sets by kind of exercise, in seconds.
const REST = { core: 45, calves: 60, mobility: 30, posture: 30, cardio: 0 };
const restFor = (e) => (e && REST[e.category] != null ? REST[e.category] : 90);

let tick = 0;
let lock = null;
let lockState = 'off';

/** Every set in order, with its exercise. */
function sequence(workoutId) {
  return F.setsOf(workoutId).slice().sort((a, b) => a.order - b.order || a.setIndex - b.setIndex).map((s) => ({ s, e: F.exercise(s.exerciseId) }));
}

/** What a set will be logged as: what you've entered, or last time's numbers, or the goal. */
function suggested(w, s, e) {
  const prev = F.previousPerformance(s.exerciseId, { excludeWorkoutId: w.id, before: w.date });
  const prevSets = prev ? F.setsOf(prev.workout.id).filter((x) => x.exerciseId === prev.exerciseId && x.completed) : [];
  const p = prevSets[s.setIndex] || prevSets[prevSets.length - 1];
  // Within this session, the set before carries forward (next set prefilled).
  const before = F.setsOf(w.id).filter((x) => x.order === s.order && x.setIndex < s.setIndex && x.completed).pop();
  const goal = Number(String(s.target || '').match(/\d+/)?.[0]) || null;
  const pick = (f) => s[f] ?? before?.[f] ?? p?.[f] ?? null;
  return {
    reps: e?.metric === 'reps' ? pick('reps') ?? goal ?? 10 : null,
    load: e?.metric === 'reps' ? pick('load') ?? e?.defaultLoad ?? null : null,
    seconds: e?.metric === 'time' ? pick('seconds') ?? goal ?? 30 : null,
    minutes: e?.metric === 'minutes' ? pick('minutes') ?? goal ?? 10 : null,
  };
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;
const restLeft = (w) => (w?.restUntil ? Math.max(0, Math.ceil((new Date(w.restUntil).getTime() - Date.now()) / 1000)) : 0);

async function keepAwake() {
  if (!('wakeLock' in navigator)) { lockState = 'unsupported'; return; }
  try {
    lock = await navigator.wakeLock.request('screen');
    lockState = 'on';
    lock.addEventListener?.('release', () => { if (lockState === 'on') lockState = 'released'; });
  } catch { lockState = 'failed'; }
}
const onVisible = () => { if (document.visibilityState === 'visible' && document.querySelector('.gym')) { keepAwake().then(() => app.refresh()); } };

function control(label, f, value, step, unit) {
  return html`<div class="gym-ctl" data-key="ctl-${f}">
    <button type="button" class="gym-step" data-action="g-step" data-f="${f}" data-d="${-step}" aria-label="${label}: ${step} less">${icon('minus', { size: 28 })}</button>
    <p class="gym-val"><span class="tnum">${value ?? '—'}</span><small>${unit}</small></p>
    <button type="button" class="gym-step" data-action="g-step" data-f="${f}" data-d="${step}" aria-label="${label}: ${step} more">${icon('plus', { size: 28 })}</button>
  </div>`;
}

export default {
  id: 'gym',
  title: 'Gym mode',
  render({ params, ui }) {
    const w = store.get('workouts', params.id);
    if (!w) return empty({ ic: 'dumbbell', title: 'This session doesn’t exist anymore.' });
    const seq = sequence(w.id);
    const done = seq.filter((x) => x.s.completed).length;
    // The set in front of you: the one you moved to, or the first one not done.
    const curIdx = Math.max(0, ui.at != null ? Math.min(ui.at, seq.length - 1) : seq.findIndex((x) => !x.s.completed));
    const allDone = seq.length > 0 && done === seq.length;
    const cur = seq[curIdx];
    const resting = restLeft(w) > 0;
    const exIndex = cur ? [...new Set(seq.map((x) => x.s.order))].indexOf(cur.s.order) : 0;
    const exCount = new Set(seq.map((x) => x.s.order)).size;
    const setsOfEx = cur ? seq.filter((x) => x.s.order === cur.s.order) : [];
    const v = cur ? suggested(w, cur.s, cur.e) : {};
    return html`<div class="gym" data-key="gym">
      <header class="gym-top">
        <button type="button" class="gym-ghost" data-action="g-list" aria-label="Back to the full session">${icon('chevron-left', { size: 22 })}<span>List</span></button>
        <p class="gym-meta tnum"><span id="gym-elapsed">${clock(Math.round((Date.now() - new Date(w.startedAt).getTime()) / 1000))}</span> · ${done}/${seq.length} sets</p>
        <button type="button" class="gym-ghost" data-action="g-finish">Finish</button>
      </header>
      ${lockState === 'unsupported' || lockState === 'failed' ? html`<p class="gym-warn" role="status">${icon('circle-alert', { size: 16 })} This browser can’t keep the screen on. Set Auto-Lock to Never while you train (Settings › Display & Brightness).</p>` : ''}
      ${!cur ? html`<div class="gym-empty"><p class="gym-name">No exercises yet</p><button type="button" class="gym-ghost" data-action="g-list">Add them in the list</button></div>`
        : allDone && !resting ? html`<div class="gym-card gym-card--done">
            <p class="gym-eyebrow">Every set done</p><p class="gym-name">${w.title}</p>
            <button type="button" class="gym-go" data-action="g-finish">Finish session</button></div>`
        : html`<div class="${cx('gym-card', resting && 'is-resting')}" data-key="card-${cur.s.id}">
          <p class="gym-eyebrow">Exercise ${exIndex + 1} of ${exCount} · set ${cur.s.setIndex + 1} of ${setsOfEx.length}${cur.s.target ? ` · goal ${cur.s.target}` : ''}</p>
          <p class="gym-name">${cur.e?.name || 'Exercise'}</p>
          ${resting ? html`<div class="gym-rest" aria-live="polite">
              <p class="gym-rest-label">Rest</p>
              <p class="gym-rest-time tnum" id="gym-rest">${clock(restLeft(w))}</p>
              <div class="gym-rest-ctl">
                <button type="button" class="gym-ghost" data-action="g-rest" data-d="30">+30 s</button>
                <button type="button" class="gym-ghost" data-action="g-rest-skip">Skip rest</button>
              </div>
              <p class="gym-next">Next: ${cur.s.completed ? 'all done' : `set ${cur.s.setIndex + 1}${v.reps != null ? ` · ${v.reps} reps` : ''}${v.load ? ` · ${num(v.load, v.load % 1 ? 1 : 0)} kg` : ''}`}</p>
            </div>`
          : html`<div class="gym-ctls">
              ${cur.e?.metric === 'time' ? control('Seconds', 'seconds', v.seconds, 5, 's') : cur.e?.metric === 'minutes' ? control('Minutes', 'minutes', v.minutes, 1, 'min') : control('Reps', 'reps', v.reps, 1, cur.e?.unilateral ? 'reps / side' : 'reps')}
              ${cur.e?.metric === 'reps' ? control('Load', 'load', v.load ?? 0, cur.e?.loadStep || 1, cur.e?.defaultLoad ? 'kg' : 'kg added') : ''}
            </div>
            <button type="button" class="gym-go" data-action="g-done" data-id="${cur.s.id}">${cur.s.completed ? 'Log it again' : `Done · set ${cur.s.setIndex + 1}`}</button>`}
        </div>`}
      ${cur && !allDone ? html`<nav class="gym-nav" aria-label="Sets">
        <button type="button" class="gym-ghost" data-action="g-move" data-d="-1" ${curIdx === 0 ? 'disabled' : ''}>${icon('chevron-left', { size: 20 })} Previous</button>
        <button type="button" class="gym-ghost" data-action="g-move" data-d="1" ${curIdx >= seq.length - 1 ? 'disabled' : ''}>Next ${icon('chevron-right', { size: 20 })}</button>
      </nav>` : ''}
    </div>`;
  },
  mount(el, { params }) {
    document.documentElement.classList.add('in-gym');
    keepAwake().then(() => app.refresh());
    document.addEventListener('visibilitychange', onVisible);
    clearInterval(tick);
    tick = setInterval(() => {
      const w = store.get('workouts', params.id);
      if (!w) return;
      const t = document.getElementById('gym-elapsed');
      if (t) t.textContent = clock(Math.round((Date.now() - new Date(w.startedAt).getTime()) / 1000));
      const left = restLeft(w);
      const r = document.getElementById('gym-rest');
      if (r) r.textContent = clock(left);
      // Rest over while it's on screen: a firm buzz, and the next set's controls come back.
      if (r && !left) { hap.success(); app.refresh(); }
    }, 250);
  },
  unmount() {
    clearInterval(tick);
    document.documentElement.classList.remove('in-gym');
    document.removeEventListener('visibilitychange', onVisible);
    lockState = 'off';
    lock?.release?.().catch(() => {});
    lock = null;
  },
  actions: {
    'g-step': ({ data, params, ui }) => {
      const w = store.get('workouts', params.id);
      const seq = sequence(w.id);
      const target = ui.at != null ? seq[Math.min(ui.at, seq.length - 1)] : seq[Math.max(0, seq.findIndex((x) => !x.s.completed))];
      if (!target) return;
      const v = suggested(w, target.s, target.e);
      const f = data.f;
      const next = Math.max(0, Math.round(((Number(v[f]) || 0) + Number(data.d)) * 10) / 10);
      store.update('workoutSets', target.s.id, { [f]: next });
      hap.tap();
    },
    'g-done': ({ data, params, ui }) => {
      const w = store.get('workouts', params.id);
      const s = store.get('workoutSets', data.id);
      const e = F.exercise(s.exerciseId);
      const before = { ...s };
      const wBefore = { ...w };
      store.update('workoutSets', s.id, { ...suggested(w, s, e), completed: true });
      const rest = restFor(e);
      const seq = sequence(w.id);
      const more = seq.some((x) => !x.s.completed);
      if (rest && more) store.update('workouts', w.id, { restUntil: new Date(Date.now() + rest * 1000).toISOString(), restFor: rest });
      ui.at = null;
      hap.success();
      app.toast(more ? `Set done${rest ? ` · rest ${clock(rest)}` : ''}` : 'Last set done', {
        action: { label: 'Undo', fn: () => { store.put('workoutSets', before); store.put('workouts', wBefore); } } });
    },
    'g-rest': ({ data, params }) => {
      const w = store.get('workouts', params.id);
      const base = Math.max(Date.now(), new Date(w.restUntil || 0).getTime());
      store.update('workouts', w.id, { restUntil: new Date(base + Number(data.d) * 1000).toISOString() });
      hap.tap();
    },
    'g-rest-skip': ({ params }) => { store.update('workouts', params.id, { restUntil: null }); hap.tap(); },
    'g-move': ({ data, params, ui }) => {
      const seq = sequence(params.id);
      const cur = ui.at != null ? ui.at : Math.max(0, seq.findIndex((x) => !x.s.completed));
      ui.at = Math.max(0, Math.min(seq.length - 1, cur + Number(data.d)));
      store.update('workouts', params.id, { restUntil: null });
      hap.tap();
      app.refresh();
    },
    'g-list': ({ params }) => app.replace(`workout/${params.id}`),
    'g-finish': async ({ params }) => {
      const sets = F.setsOf(params.id).filter((s) => s.completed).length;
      if (!sets) { app.toast('Log at least one set first.'); return; }
      (await import('./workout.js')).finishSheet(params.id, true);
    },
  },
};
