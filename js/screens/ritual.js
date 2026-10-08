// Morning and evening rituals (U4): one question per screen, about a minute in all, every step
// skippable. Answers save as you go, so closing half-way keeps what you said. The evening ends
// with sealing the day (G5), a press and hold.
import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import * as H from '../domain/habits-more.js';
import * as T from '../domain/tasks.js';
import * as Rt from '../domain/rituals.js';
import { dayScore } from '../domain/scoring.js';
import { nextAction } from '../domain/next-action.js';
import { today, addDays, parseHM, durationHM, relativeDay } from '../domain/dates.js';
import { reviewOf, saveReview } from '../domain/day.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { check, scale10 } from '../ui/components.js';
import { holdButton, attachHold } from '../ui/hold.js';
import { kgIn, kgOut, weightUnit } from '../ui/format.js';

const QUESTIONS = {
  sleep: 'How did you sleep?',
  feel: 'How do you feel?',
  weight: 'Weigh-in',
  three: 'Your three for today',
  start: 'Ready',
  habits: 'Anything left?',
  win: 'One win from today',
  tasks: 'Unfinished tasks',
  tomorrow: 'Tomorrow starts with',
  seal: 'Seal the day',
};

function prefill(which, date) {
  const p = store.profile() || {};
  if (which === 'morning') {
    const sl = M.sleep(date);
    const last = store.all('sleepEntries').reduce((a, b) => (!a || b.date > a.date ? b : a), null);
    const mood = M.mood(date) || {};
    const w = store.get('weightEntries', date) || store.all('weightEntries').reduce((a, b) => (!a || b.date > a.date ? b : a), null);
    return {
      bedtime: sl?.bedtime || last?.bedtime || p.bedTime || '22:00', wake: sl?.wake || last?.wake || p.wakeTime || '06:00', quality: sl?.quality ?? null,
      energy: mood.energy ?? null, mood: mood.mood ?? null, stress: mood.stress ?? null,
      weight: w ? Math.round(kgOut(w.kg) * 10) / 10 : null, weighed: !!store.get('weightEntries', date),
    };
  }
  const tm = addDays(date, 1);
  return {
    win: reviewOf(date).win || '',
    move: Object.fromEntries(Rt.unfinished(date).map((t) => [t.id, true])),
    first: T.priorities(tm).find((t) => t.rank === 1)?.title || '',
  };
}

const hours = (u) => {
  const b = parseHM(u.bedtime), w = parseHM(u.wake);
  return b == null || w == null ? null : ((w - b + 1440) % 1440) / 60;
};

function body(step, s, date) {
  const u = s.ui;
  switch (step) {
    case 'sleep': return html`<div class="ci-times">
        <label class="time-field"><span>Bedtime</span><input type="time" value="${u.bedtime}" data-input="rf" data-f="bedtime"></label>
        <span class="ci-arrow">${icon('arrow-right', { size: 16 })}</span>
        <label class="time-field"><span>Woke</span><input type="time" value="${u.wake}" data-input="rf" data-f="wake"></label>
      </div>
      <p class="ritual-big tnum" aria-live="polite">${hours(u) != null ? durationHM(hours(u) * 60) : '—'}</p>
      <div><p class="form-label">Quality</p>${scale10(u.quality, { action: 'r-pick', data: { f: 'quality' }, low: 'Restless', high: 'Deep', name: 'Sleep quality' })}</div>
      <button type="button" class="link-btn" data-action="r-health">${icon('heart-pulse', { size: 16 })} Paste from Health</button>
      ${u.healthNote ? html`<p class="field-hint" role="status">${u.healthNote}</p>` : ''}`;
    case 'feel': return html`<div><p class="form-label">Energy</p>${scale10(u.energy, { action: 'r-pick', data: { f: 'energy' }, low: 'Drained', high: 'Charged', name: 'Energy' })}</div>
      <div><p class="form-label">Mood</p>${scale10(u.mood, { action: 'r-pick', data: { f: 'mood' }, low: 'Low', high: 'Great', name: 'Mood' })}</div>
      <div><p class="form-label">Stress</p>${scale10(u.stress, { action: 'r-pick', data: { f: 'stress' }, low: 'Calm', high: 'Overloaded', name: 'Stress' })}</div>`;
    case 'weight': return html`<p class="ritual-note">Optional. After the bathroom, before food or drink.</p>
      <div class="ritual-weight">
        <button type="button" class="icon-btn numpad-step" data-action="r-w" data-d="-1" aria-label="0.1 less">${icon('minus', { size: 20 })}</button>
        <span class="input-unit input-unit--xl"><input class="tnum" type="number" inputmode="decimal" step="0.1" value="${u.weight ?? ''}" data-input="rf" data-f="weight" aria-label="Weight in ${weightUnit()}" placeholder="0.0"><span>${weightUnit()}</span></span>
        <button type="button" class="icon-btn numpad-step" data-action="r-w" data-d="1" aria-label="0.1 more">${icon('plus', { size: 20 })}</button>
      </div>`;
    case 'three': return html`<ol class="ritual-three">${T.slots(date).map((t, i) => html`<li data-key="r3-${i}">
        <span class="ritual-n tnum">${i + 1}</span>
        <input class="input" value="${t?.title || ''}" data-change="r-three" data-i="${i}" placeholder="${['The one that matters most', 'Second', 'Third'][i]}" aria-label="Priority ${i + 1}" enterkeyhint="next"></li>`)}</ol>`;
    case 'start': {
      const a = nextAction(date);
      return html`<p class="ritual-note">${a.id === 'done' ? 'Nothing needs you right now.' : 'First up:'}</p>
        ${a.id !== 'done' ? html`<p class="ritual-big">${a.title}</p>` : ''}
        <button type="button" class="btn btn--primary btn--block" data-action="r-finish">Start the day</button>`;
    }
    case 'habits': {
      const list = Rt.openHabits(date);
      const done = s.ui.ticked || [];
      return html`<ul class="hlist ritual-habits">${[...list, ...done.map((id) => H.habit(id)).filter((h) => h && !list.includes(h))].map((h) => {
        const lv = H.level(h, date);
        const off = H.skipped(h, date);
        return html`<li class="${cx('hrow', lv && 'is-done')}" data-key="rh-${h.id}">
          ${check(!!lv, { action: 'r-tick', data: { id: h.id }, label: `${h.name}${lv ? ', done' : ''}` })}
          <span class="hrow-main"><span class="hrow-name">${h.name}</span>${off ? html`<span class="hrow-sub">Not today</span>` : ''}</span>
          ${!lv ? html`<button type="button" class="${cx('chip', off && 'is-active')}" data-action="r-skip-habit" data-id="${h.id}" aria-pressed="${off}">Not today</button>` : ''}
        </li>`;
      })}</ul>`;
    }
    case 'win': return html`<textarea class="input input--grow" rows="2" data-grow data-input="rf" data-f="win" placeholder="Something that went right, however small" aria-label="One win from today" enterkeyhint="done">${u.win}</textarea>`;
    case 'tasks': return html`<p class="ritual-note">Ticked ones move to tomorrow, so nothing lingers as overdue tonight.</p>
      <ul class="ritual-tasks">${Rt.unfinished(date).map((t) => html`<li data-key="rt-${t.id}">
        ${check(!!u.move[t.id], { action: 'r-move', data: { id: t.id }, label: `Move ${t.title} to tomorrow` })}<span>${t.title}</span></li>`)}</ul>`;
    case 'tomorrow': return html`<input class="input" value="${u.first}" data-input="rf" data-f="first" placeholder="The first thing to start with" aria-label="Tomorrow’s first task" enterkeyhint="done">`;
    case 'seal': {
      const sc = dayScore(date);
      return html`<p class="ritual-note">${sc.total ? `${sc.done} of ${sc.total} done${sc.tiny ? ` · ${sc.tiny} tiny` : ''}.` : ''} ${u.win ? `Win: ${u.win}` : ''}</p>
        <div class="ritual-seal">${holdButton({ label: 'Seal the day', action: 'seal' })}</div>`;
    }
    default: return '';
  }
}

/** Save what a step collected (on Next, never on Skip). */
function commit(step, s, date) {
  const u = s.ui;
  if (step === 'sleep') {
    const h = hours(u);
    store.put('sleepEntries', { ...(M.sleep(date) || {}), id: date, date, bedtime: u.bedtime, wake: u.wake, hours: h != null ? Math.round(h * 100) / 100 : null, quality: u.quality });
  } else if (step === 'feel') {
    store.put('moodEntries', { ...(M.mood(date) || {}), id: date, date, energy: u.energy, mood: u.mood, stress: u.stress });
  } else if (step === 'weight') {
    const kg = kgIn(u.weight === '' ? null : u.weight);
    if (kg && kg >= 20 && kg <= 400) store.put('weightEntries', { ...(store.get('weightEntries', date) || {}), id: date, date, kg: Math.round(kg * 100) / 100 });
  } else if (step === 'win') {
    saveReview(date, { win: (u.win || '').trim() });
  } else if (step === 'tasks') {
    const tm = addDays(date, 1);
    const ops = Rt.unfinished(date).filter((t) => u.move[t.id]).map((t) => ({ store: 'tasks', value: { ...t, date: tm } }));
    if (ops.length) store.batch(ops);
  } else if (step === 'tomorrow') {
    const first = (u.first || '').trim();
    if (first) T.setPriority(addDays(date, 1), 0, first);
  }
}

export function openRitual(which = 'evening', date = today()) {
  const list = Rt.steps(which, date);
  const ui = { i: 0, ...prefill(which, date) };
  const sheet = app.sheet({
    title: which === 'morning' ? 'Morning' : 'Evening',
    size: 'detent',
    ui,
    render: (s) => {
      const step = list[s.ui.i];
      const last = s.ui.i === list.length - 1;
      return html`<div class="ritual" data-step="${step}" data-key="ritual-${step}">
        <div class="ritual-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${list.length}" aria-valuenow="${s.ui.i + 1}" aria-label="Step ${s.ui.i + 1} of ${list.length}">
          ${list.map((x, j) => html`<span class="${cx(j < s.ui.i && 'is-done', j === s.ui.i && 'is-now')}"></span>`)}</div>
        <h3 class="ritual-q" tabindex="-1">${QUESTIONS[step]}</h3>
        <div class="ritual-body">${body(step, s, date)}</div>
        <div class="ritual-foot">
          ${s.ui.i > 0 ? html`<button type="button" class="link-btn" data-action="r-back">Back</button>` : html`<span></span>`}
          ${step === 'start' ? '' : last ? html`<button type="button" class="btn btn--ghost" data-action="r-close">Not tonight</button>`
            : html`<span class="ritual-go"><button type="button" class="btn btn--ghost" data-action="r-skip">Skip</button>
              ${step !== 'start' ? html`<button type="button" class="btn btn--primary" data-action="r-next">Next</button>` : ''}</span>`}
        </div>
      </div>`;
    },
    inputs: {
      rf: ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; if (el.type === 'time') sheet.refresh(); },
      'r-three': ({ el, value }) => T.setPriority(date, Number(el.dataset.i), value),
    },
    actions: {
      // The Health Shortcut copies sleep, steps and weight: fill the check-in from it and keep the steps.
      'r-health': async ({ sheet }) => {
        const u = sheet.ui;
        let text = '';
        try { text = await navigator.clipboard.readText(); } catch { /* not shared */ }
        const { parseHealth } = await import('../domain/health-paste.js');
        const d = text && parseHealth(text, date);
        if (!d) { u.healthNote = 'Nothing from Health on the clipboard. Run the Shortcut first.'; sheet.refresh(); return; }
        const got = [];
        if (d.sleepHours != null) {
          const w = parseHM(u.wake) ?? 360;
          const b = (w - Math.round(d.sleepHours * 60) + 1440) % 1440;
          u.bedtime = `${String(Math.floor(b / 60)).padStart(2, '0')}:${String(b % 60).padStart(2, '0')}`;
          got.push('sleep');
        }
        if (d.weightKg != null) { u.weight = Math.round(kgOut(d.weightKg) * 10) / 10; got.push('weight'); }
        if (d.steps != null) { store.put('stepLogs', { ...(store.get('stepLogs', d.date) || {}), id: d.date, date: d.date, steps: d.steps, source: 'health' }); got.push('steps'); }
        u.healthNote = got.length ? `From Health: ${got.join(', ')}. Check it, then go on.` : 'Nothing from Health on the clipboard.';
        hap.success();
        sheet.refresh();
      },
      'r-pick': ({ data, sheet }) => { sheet.ui[data.f] = sheet.ui[data.f] === Number(data.value) ? null : Number(data.value); hap.tap(); sheet.refresh(); },
      'r-w': ({ data, sheet }) => { const v = Number(sheet.ui.weight) || 0; sheet.ui.weight = Math.round((v + Number(data.d) * 0.1) * 10) / 10; hap.tap(); sheet.refresh(); },
      'r-tick': ({ data, sheet }) => {
        const h = H.habit(data.id);
        if (!h) return;
        const on = H.tap(h, date);
        sheet.ui.ticked = [...new Set([...(sheet.ui.ticked || []), h.id])];
        on ? hap.success() : hap.tap();
        sheet.refresh();
      },
      'r-skip-habit': ({ data, sheet }) => {
        const h = H.habit(data.id);
        if (!h) return;
        if (H.skipped(h, date)) H.setSkip(h, date, false); else H.skipToday(h, date);
        sheet.ui.ticked = [...new Set([...(sheet.ui.ticked || []), h.id])];
        hap.tap();
        sheet.refresh();
      },
      'r-move': ({ data, sheet }) => { sheet.ui.move = { ...sheet.ui.move, [data.id]: !sheet.ui.move[data.id] }; hap.tap(); sheet.refresh(); },
      'r-next': ({ sheet }) => { commit(list[sheet.ui.i], sheet, date); go(sheet, 1); },
      'r-skip': ({ sheet }) => go(sheet, 1),
      'r-back': ({ sheet }) => go(sheet, -1),
      'r-finish': ({ sheet }) => { Rt.markRitual(date, which); hap.success(); app.closeSheet(sheet); },
      'r-close': ({ sheet }) => app.closeSheet(sheet),
    },
  });
  sheet.expand?.();
  attachHold(sheet.el, (action) => {
    if (action !== 'seal') return;
    const undo = Rt.seal(date);
    Rt.markRitual(date, which);
    setTimeout(async () => {
      app.closeSheet(sheet);
      // The ceremony (G5), then Undo, in case the hold was a slip.
      await (await import('../ceremony/seal.js')).sealCeremony(date);
      app.toast(`${relativeDay(date) === 'Today' ? 'Today' : relativeDay(date)} is sealed. Rest well.`, { icon: 'moon', action: { label: 'Undo', fn: undo } });
    }, 420);
  });
  return sheet;
}

function go(sheet, d) {
  const n = sheet.ui.i + d;
  if (n < 0) return;
  sheet.ui.i = n;
  sheet.refresh();
  sheet.el.querySelector('.ritual-q')?.focus({ preventScroll: true });
}
