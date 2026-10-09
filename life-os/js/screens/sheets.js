// Quick-log bottom sheets shared by Today, Body and the life modules.
import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import * as H from '../domain/habits-more.js';
import * as R from '../domain/routines.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { check, scale10, segmented, stepper, ring, bar, toggle } from '../ui/components.js';
import * as T from '../domain/tasks-more.js';
import { num, litres, kgIn, kgOut, weightUnit, habitValue, habitTarget, plural, fieldNum } from '../ui/format.js';
import { today, relativeDay, parseHM, durationHM, addDays, fmtTime, dayInline } from '../domain/dates.js';
import { MODES, habitColor } from '../domain/taxonomy.js';
import { dayScore } from '../domain/scoring.js';

const setField = ({ el, ui, value }) => {
  const f = el.dataset.field;
  ui[f] = el.type === 'number' || el.inputMode === 'decimal' || el.inputMode === 'numeric' ? (value === '' ? '' : value) : value;
};
const n = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const dayLabel = (date) => (date === today() ? 'today' : dayInline(date));

import { reviewOf, saveReview } from '../domain/day.js';
export { reviewOf, saveReview };

/* ---------- morning check-in ---------- */
export function openCheckin(date = today()) {
  const prevSleep = M.sleep(date);
  const prevMood = M.mood(date);
  const p = store.profile();
  const last = store.all('sleepEntries').sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const ui = {
    bedtime: prevSleep?.bedtime || last?.bedtime || p.bedTime || '22:00',
    wake: prevSleep?.wake || last?.wake || p.wakeTime || '06:00',
    quality: prevSleep?.quality ?? null,
    energy: prevMood?.energy ?? null,
    stress: prevMood?.stress ?? null,
    mood: prevMood?.mood ?? null,
    body: prevMood?.body ?? null,
    weight: M.weight(date) != null ? fieldNum(kgOut(M.weight(date))) : '',
  };
  const hours = () => {
    const b = parseHM(ui.bedtime), w = parseHM(ui.wake);
    if (b == null || w == null) return null;
    return ((w - b + 1440) % 1440) / 60;
  };
  const BODY = [{ id: 'great', label: 'Great' }, { id: 'good', label: 'Good' }, { id: 'normal', label: 'Normal' }, { id: 'tired', label: 'Tired' }, { id: 'poor', label: 'Poor' }];
  app.sheet({
    title: date === today() ? 'Morning check-in' : `Check-in · ${relativeDay(date)}`,
    ui,
    render: (s) => html`<div class="form">
      <div class="ci-sleep">
        <div class="ci-head"><p class="form-label">Sleep</p><p class="ci-dur tnum" aria-live="polite">${durationHM(hours() * 60)}</p></div>
        <div class="ci-times">
          <label class="time-field"><span>Bedtime</span><input type="time" value="${s.ui.bedtime}" data-input="field" data-field="bedtime"></label>
          <span class="ci-arrow">${icon('arrow-right', { size: 16 })}</span>
          <label class="time-field"><span>Woke</span><input type="time" value="${s.ui.wake}" data-input="field" data-field="wake"></label>
        </div>
      </div>
      <div><p class="form-label">Sleep quality</p>${scale10(s.ui.quality, { action: 'pick', data: { field: 'quality' }, low: 'Restless', high: 'Deep', name: 'Sleep quality' })}</div>
      <div><p class="form-label">Energy</p>${scale10(s.ui.energy, { action: 'pick', data: { field: 'energy' }, low: 'Drained', high: 'Charged', name: 'Energy' })}</div>
      <div><p class="form-label">Stress</p>${scale10(s.ui.stress, { action: 'pick', data: { field: 'stress' }, low: 'Calm', high: 'Overloaded', name: 'Stress' })}</div>
      <div><p class="form-label">Mood</p>${scale10(s.ui.mood, { action: 'pick', data: { field: 'mood' }, low: 'Low', high: 'Great', name: 'Mood' })}</div>
      <div><p class="form-label">Body feels</p>${segmented(BODY, s.ui.body, { action: 'pick-body', name: 'Body feeling', size: 'wrap' })}</div>
      <label class="field field--inline"><span class="field-label">Weight <small>optional · after bathroom, before food</small></span>
        <span class="input-unit"><input type="number" inputmode="decimal" step="0.1" placeholder="—" value="${s.ui.weight}" data-input="field" data-field="weight"><span>${weightUnit()}</span></span></label>
      <button type="button" class="btn btn--primary btn--block" data-action="save">Save check-in</button>
    </div>`,
    inputs: { field: (c) => { setField(c); if (c.el.type === 'time') app.refresh(); } },
    actions: {
      pick: ({ data, sheet }) => { sheet.ui[data.field] = sheet.ui[data.field] === Number(data.value) ? null : Number(data.value); hap.tap(); sheet.refresh(); },
      'pick-body': ({ data, sheet }) => { sheet.ui.body = sheet.ui.body === data.value ? null : data.value; hap.tap(); sheet.refresh(); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        const ops = [{ store: 'sleepEntries', value: { ...(prevSleep || {}), id: date, date, bedtime: u.bedtime, wake: u.wake, hours: Math.round(hours() * 100) / 100, quality: u.quality } },
          { store: 'moodEntries', value: { ...(prevMood || {}), id: date, date, energy: u.energy, stress: u.stress, mood: u.mood, body: u.body } }];
        const w = kgIn(n(u.weight));
        if (w) ops.push({ store: 'weightEntries', value: { ...(store.get('weightEntries', date) || {}), id: date, date, kg: Math.round(w * 100) / 100 } });
        store.batch(ops);
        hap.success();
        app.closeSheet(sheet);
        app.toast('Check-in saved', { icon: 'check' });
      },
    },
  });
}

/* ---------- water ---------- */
export function addWater(date, ml) {
  const rec = store.put('waterLogs', { date, ml, at: new Date().toISOString() });
  hap.tap();
  const total = M.waterMl(date);
  const target = M.targets().waterMl;
  const reached = total >= target && total - ml < target;
  app.toast(reached ? `Water target reached · ${litres(total)}` : `Water · +${ml} ml · ${litres(total)} today`, { icon: 'droplet', action: { label: 'Undo', fn: () => store.remove('waterLogs', rec.id) } });
}

export function openWater(date = today()) {
  const ui = { custom: '' };
  app.sheet({
    title: 'Water',
    ui,
    render: (s) => {
      const total = M.waterMl(date);
      const t = M.targets();
      const logs = store.onDate('waterLogs', date).sort((a, b) => (a.at < b.at ? 1 : -1));
      return html`<div class="form">
        <div class="metric-hero">
          ${ring(total / t.waterMl, { size: 84, stroke: 7, color: 'var(--c-health)' })}
          <div><p class="metric-hero-val tnum">${litres(total)} <span>/ ${litres(t.waterMl)}</span></p>
          <p class="metric-hero-sub">${total >= t.waterHitMl ? 'On target. More if it’s hot or you sweated.' : `${litres(t.waterHitMl - total)} to reach ${litres(t.waterHitMl)}`}</p></div>
        </div>
        <div class="quick-grid">${[250, 500, 750, 1000].map((ml) => html`<button type="button" class="quick-btn${ml === 500 ? ' is-primary' : ''}" data-action="add" data-ml="${ml}">+${ml >= 1000 ? '1 L' : `${ml} ml`}</button>`)}</div>
        <form class="inline-form" data-submit="custom">
          <span class="input-unit"><input name="ml" type="number" inputmode="numeric" placeholder="Custom" min="1" max="3000" aria-label="Custom amount in millilitres"><span>ml</span></span>
          <button class="btn btn--soft" type="submit">Add</button>
        </form>
        ${logs.length ? html`<ul class="log-list">${logs.map((l) => html`<li class="log-item" data-key="${l.id}">
          <span class="tnum">${l.ml} ml</span><span class="log-meta">${fmtTime(new Date(l.at))}</span>
          <button type="button" class="icon-btn" data-action="del" data-id="${l.id}" aria-label="Remove ${l.ml} ml">${icon('x', { size: 16 })}</button></li>`)}</ul>` : ''}
      </div>`;
    },
    actions: {
      add: ({ data }) => addWater(date, Number(data.ml)),
      custom: ({ form, el }) => { const ml = n(form.ml); if (ml && ml > 0 && ml <= 3000) { addWater(date, ml); el.reset(); } },
      del: ({ data }) => removeWithUndo('waterLogs', data.id, 'Water entry removed'),
    },
  });
}

export function removeWithUndo(storeName, id, message) {
  const rec = store.get(storeName, id);
  if (!rec) return;
  store.remove(storeName, id);
  app.toast(message, { action: { label: 'Undo', fn: () => store.put(storeName, rec) } });
}

/* ---------- food / protein ---------- */
export function openFood(date = today()) {
  const ui = { name: '', protein: '', kcal: '', fruit: 0, veg: 0, q: '' };
  app.sheet({
    title: 'Log food',
    size: 'tall',
    ui,
    render: (s) => {
      const nut = M.nutrition(date);
      const t = M.targets();
      const foods = store.all('foods').sort((a, b) => (b.uses || 0) - (a.uses || 0) || a.order - b.order)
        .filter((f) => !s.ui.q || f.name.toLowerCase().includes(s.ui.q.toLowerCase()));
      return html`<div class="form">
        <div class="macro-row">
          <div class="macro"><p class="macro-label">Protein</p><p class="macro-val tnum">${num(nut.protein)}<small> / ${t.proteinG} g</small></p>${bar(nut.protein / t.proteinG, { color: 'var(--c-health)', label: 'Protein' })}</div>
          <div class="macro"><p class="macro-label">Calories</p><p class="macro-val tnum">${num(nut.kcal)}<small> / ${num(t.kcal)}</small></p>${bar(nut.kcal / t.kcal, { color: 'var(--c-body)', label: 'Calories' })}</div>
        </div>
        ${!s.ui.q && store.onDate('nutritionLogs', addDays(date, -1)).length && !store.onDate('nutritionLogs', date).some((l) => l.repeated)
          ? html`<button type="button" class="btn btn--soft btn--block" data-action="same" data-key="same">${icon('repeat', { size: 16 })} Same as yesterday</button>` : ''}
        <div class="food-tools" data-key="food-tools"><div class="search-field">${icon('search', { size: 16 })}<input type="search" placeholder="Find a quick food" value="${s.ui.q}" data-input="q" aria-label="Find a quick food"></div>
          <button type="button" class="link-btn" data-action="manage" aria-pressed="${!!s.ui.manage}">${s.ui.manage ? 'Done' : 'Edit'}</button></div>
        <ul class="food-list">${foods.map((f) => html`<li data-key="${f.id}"${s.ui.manage ? raw(' class="food-row"') : ''}><button type="button" class="food-item" data-action="${s.ui.manage ? 'food-edit' : 'quick'}" data-id="${f.id}"${s.ui.manage ? html` aria-label="Edit ${f.name}"` : ''}>
          <span class="food-name">${f.name}</span><span class="food-meta tnum">${num(f.protein, f.protein % 1 ? 1 : 0)} g · ${num(f.kcal)} kcal${f.approx ? ' · approx.' : ''}</span>
          <span class="food-add">${icon(s.ui.manage ? 'pencil' : 'plus', { size: 18 })}</span></button>
          ${s.ui.manage ? html`<button type="button" class="icon-btn icon-btn--sm" data-action="food-del" data-id="${f.id}" aria-label="Delete ${f.name}">${icon('trash-2', { size: 16 })}</button>` : ''}</li>`)}</ul>
        <details class="disclosure" ${s.ui.open ? raw('open') : ''}>
          <summary>Custom entry</summary>
          <form class="form" data-submit="custom">
            <input class="input" name="name" placeholder="What did you eat?" autocomplete="off" maxlength="60" aria-label="What you ate">
            <div class="grid-2">
              <label class="field"><span class="field-label">Protein</span><span class="input-unit"><input name="protein" type="number" inputmode="decimal" step="any" min="0"><span>g</span></span></label>
              <label class="field"><span class="field-label">Calories</span><span class="input-unit"><input name="kcal" type="number" inputmode="numeric" min="0"><span>kcal</span></span></label>
              <label class="field"><span class="field-label">Fruit</span><span class="input-unit"><input name="fruit" type="number" inputmode="numeric" min="0" max="10" value="0"><span>serv.</span></span></label>
              <label class="field"><span class="field-label">Veg</span><span class="input-unit"><input name="veg" type="number" inputmode="numeric" min="0" max="10" value="0"><span>serv.</span></span></label>
            </div>
            <label class="check-line"><input type="checkbox" name="save"> Save as a quick food</label>
            <button class="btn btn--primary btn--block" type="submit">Add</button>
          </form>
        </details>
        ${nut.logs.length ? html`<p class="form-label">${date === today() ? 'Today' : relativeDay(date)}</p><ul class="log-list">${nut.logs.sort((a, b) => (a.at < b.at ? 1 : -1)).map((l) => html`<li class="log-item" data-key="${l.id}">
          <span class="log-name">${l.name || 'Food'}</span><span class="log-meta tnum">${num(l.protein, l.protein % 1 ? 1 : 0)} g · ${num(l.kcal)} kcal</span>
          <button type="button" class="icon-btn" data-action="del" data-id="${l.id}" aria-label="Remove ${l.name}">${icon('x', { size: 16 })}</button></li>`)}</ul>` : ''}
      </div>`;
    },
    inputs: { q: ({ value, sheet }) => { sheet.ui.q = value; sheet.refresh(); } },
    actions: {
      same: ({ sheet }) => { app.closeSheet(sheet); repeatYesterday(date); },
      quick: ({ data }) => {
        const f = store.get('foods', data.id);
        store.batch([
          { store: 'nutritionLogs', value: { date, name: f.name, protein: f.protein, kcal: f.kcal, fruit: f.fruit || 0, veg: f.veg || 0, foodId: f.id, at: new Date().toISOString() } },
          { store: 'foods', value: { ...f, uses: (f.uses || 0) + 1 } },
        ]);
        hap.tap();
        app.toast(`${f.name} added`, { icon: 'check' });
      },
      custom: ({ form, el }) => {
        const protein = n(form.protein) || 0, kcal = n(form.kcal) || 0;
        if (!protein && !kcal && !n(form.fruit) && !n(form.veg)) { app.toast('Add protein, calories or a serving first.'); return; }
        const name = (form.name || '').trim() || 'Meal';
        const ops = [{ store: 'nutritionLogs', value: { date, name, protein, kcal, fruit: n(form.fruit) || 0, veg: n(form.veg) || 0, at: new Date().toISOString() } }];
        if (form.save) ops.push({ store: 'foods', value: { name, protein, kcal, fruit: n(form.fruit) || 0, veg: n(form.veg) || 0, approx: false, order: 999, uses: 1 } });
        store.batch(ops);
        hap.tap();
        el.reset();
      },
      del: ({ data }) => removeWithUndo('nutritionLogs', data.id, 'Entry removed'),
      manage: ({ sheet }) => { sheet.ui.manage = !sheet.ui.manage; hap.tap(); sheet.refresh(); },
      'food-edit': ({ data }) => editFood(data.id),
      'food-del': ({ data }) => removeWithUndo('foods', data.id, 'Quick food deleted. Past entries stay.'),
    },
  });
}

/** Change a quick food's name or numbers. Entries already logged keep what they were. */
function editFood(id) {
  const f = store.get('foods', id);
  if (!f) return;
  app.sheet({
    title: 'Quick food',
    render: () => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" value="${f.name}" maxlength="60" required></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Protein</span><span class="input-unit"><input name="protein" type="number" inputmode="decimal" step="any" min="0" value="${f.protein ?? 0}"><span>g</span></span></label>
        <label class="field"><span class="field-label">Calories</span><span class="input-unit"><input name="kcal" type="number" inputmode="numeric" min="0" value="${f.kcal ?? 0}"><span>kcal</span></span></label>
        <label class="field"><span class="field-label">Fruit</span><span class="input-unit"><input name="fruit" type="number" inputmode="numeric" min="0" max="10" value="${f.fruit || 0}"><span>serv.</span></span></label>
        <label class="field"><span class="field-label">Veg</span><span class="input-unit"><input name="veg" type="number" inputmode="numeric" min="0" max="10" value="${f.veg || 0}"><span>serv.</span></span></label>
      </div>
      <button class="btn btn--primary btn--block" type="submit">Save</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const name = (form.name || '').trim();
        if (!name) return;
        store.put('foods', { ...f, name, protein: n(form.protein) || 0, kcal: n(form.kcal) || 0, fruit: n(form.fruit) || 0, veg: n(form.veg) || 0, approx: false });
        hap.tap();
        app.closeSheet(sheet);
      },
    },
  });
}

/** Same as yesterday: the day before's food onto `date`, with Undo. */
export async function repeatYesterday(date = today(), { onDone } = {}) {
  const Meals = await import('../domain/meals.js');
  const ids = Meals.repeatDayBefore(date);
  if (!ids.length) { app.toast('Nothing logged the day before.'); return; }
  hap.success();
  onDone?.();
  const sum = Meals.summary(ids.map((id) => store.get('nutritionLogs', id)).filter(Boolean));
  app.toast(`Same as yesterday · ${sum.protein} g protein`, { icon: 'check', action: { label: 'Undo', fn: () => { store.batch(ids.map((id) => ({ store: 'nutritionLogs', delete: id }))); onDone?.(); } } });
}

export function addServing(date, kind) {
  store.put('nutritionLogs', { date, name: kind === 'fruit' ? 'Fruit' : 'Vegetables', protein: kind === 'veg' ? 2 : 0, kcal: kind === 'fruit' ? 90 : 30, fruit: kind === 'fruit' ? 1 : 0, veg: kind === 'veg' ? 1 : 0, approx: true, at: new Date().toISOString() });
  hap.tap();
}

/* ---------- steps ---------- */
export function openSteps(date = today()) {
  const cur = M.steps(date);
  app.sheet({
    title: `Steps · ${relativeDay(date)}`,
    render: () => html`<form class="form" data-submit="save">
      <p class="sheet-note">Enter the total from your phone or watch. Life OS doesn’t read Apple Health yet, so this stays manual.</p>
      <label class="field"><span class="field-label">Steps ${dayLabel(date)}</span>
        <input class="input input--xl tnum" name="steps" type="number" inputmode="numeric" min="0" max="100000" value="${cur ?? ''}" placeholder="0" autofocus></label>
      <p class="field-hint">Target ${dayLabel(date)}: ${num(M.stepsTarget(date))}</p>
      <button class="btn btn--primary btn--block" type="submit">Save</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const v = n(form.steps);
        if (v == null) store.remove('stepLogs', date);
        else store.put('stepLogs', { ...(store.get('stepLogs', date) || {}), id: date, date, steps: Math.round(v) });
        hap.tap();
        app.closeSheet(sheet);
      },
    },
  });
}

/* ---------- weight ---------- */
export function openWeight(date = today()) {
  const cur = store.get('weightEntries', date);
  app.sheet({
    title: cur ? 'Edit weight' : 'Log weight',
    render: () => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Morning weight</span>
        <span class="input-unit input-unit--xl"><input class="tnum" name="w" type="number" inputmode="decimal" step="0.1" min="20" max="400" value="${cur ? fieldNum(kgOut(cur.kg)) : ''}" placeholder="0.0" autofocus><span>${weightUnit()}</span></span></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${date}" max="${today()}"></label>
        <label class="field"><span class="field-label">Note</span><input class="input" name="note" value="${cur?.note || ''}" placeholder="Optional"></label>
      </div>
      <p class="field-hint">After the bathroom, before food or drink, similar clothing. One reading doesn’t mean much; the 7-day average does.</p>
      <div class="btn-row">
        ${cur ? html`<button type="button" class="btn btn--ghost" data-action="del">Delete</button>` : ''}
        <button class="btn btn--primary" type="submit">Save</button>
      </div>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const kg = kgIn(n(form.w));
        const d = form.date && form.date <= today() ? form.date : date;
        if (!kg || kg < 20 || kg > 400) { app.toast('Enter a weight between 20 and 400.'); return; }
        const existing = store.get('weightEntries', d);
        const ops = [{ store: 'weightEntries', value: { ...(existing || {}), id: d, date: d, kg: Math.round(kg * 100) / 100, note: form.note || '' } }];
        if (cur && d !== date) ops.push({ store: 'weightEntries', delete: date });
        store.batch(ops);
        hap.tap();
        app.closeSheet(sheet);
      },
      del: ({ sheet }) => { removeWithUndo('weightEntries', date, 'Weight entry deleted'); app.closeSheet(sheet); },
    },
  });
}

/* ---------- work shutdown ---------- */
export function openShutdown(date = today()) {
  const r = reviewOf(date);
  const top3 = T.priorities(date).map((t) => ({ text: t.title, done: t.done }));
  const unfinished = () => T.open().filter((t) => t.date && t.date <= date);
  app.sheet({
    title: 'Close the work day',
    ui: { completed: r.shutdown?.completed || top3.filter((p) => p.done).map((p) => p.text).join('\n'), remains: r.shutdown?.remains || top3.filter((p) => !p.done).map((p) => p.text).join('\n'), first: r.shutdown?.first || '', move: true },
    render: (s) => {
      const left = unfinished().length;
      return html`<div class="form">
      <label class="field"><span class="field-label">What did I complete?</span><textarea class="input" rows="3" data-input="field" data-field="completed">${s.ui.completed}</textarea></label>
      <label class="field"><span class="field-label">What remains?</span><textarea class="input" rows="2" data-input="field" data-field="remains">${s.ui.remains}</textarea></label>
      <label class="field"><span class="field-label">Tomorrow’s first priority</span><input class="input" value="${s.ui.first}" data-input="field" data-field="first" placeholder="The one thing to start with"></label>
      ${left ? html`<div class="set-row set-row--plain"><span class="set-text"><span class="set-label">Move ${plural(left, 'unfinished task')} to tomorrow</span><span class="set-hint">So nothing lingers as overdue tonight.</span></span>
        <span class="set-ctl">${toggle(s.ui.move, { action: 'move', label: 'Move unfinished tasks to tomorrow' })}</span></div>` : ''}
      <button type="button" class="btn btn--primary btn--block" data-action="done">${icon('power', { size: 18 })} Work is done for today</button>
    </div>`;
    },
    inputs: { field: setField },
    actions: {
      move: ({ sheet }) => { sheet.ui.move = !sheet.ui.move; sheet.refresh(); },
      done: ({ sheet }) => {
        if (sheet.ui.move) T.moveUnfinished(date, addDays(date, 1));
        const first = (sheet.ui.first || '').trim();
        const ops = [{ store: 'dailyReviews', value: { ...reviewOf(date), id: date, date, shutdown: { done: true, at: new Date().toISOString(), completed: sheet.ui.completed, remains: sheet.ui.remains, first } } }];
        store.batch(ops);
        if (first) T.addFirstPriority(addDays(date, 1), first);
        hap.success();
        app.closeSheet(sheet);
        document.documentElement.classList.add('life-shift');
        setTimeout(() => document.documentElement.classList.remove('life-shift'), 1400);
        app.toast('Work closed. The evening is yours.', { icon: 'moon' });
      },
    },
  });
}

/* ---------- day mode ---------- */
export function openMode(date = today()) {
  app.sheet({
    title: 'How is today?',
    render: () => {
      const cur = H.dayMode(date);
      return html`<div class="mode-list">${Object.entries(MODES).filter(([, m]) => !m.auto).map(([id, m]) => html`<button type="button" class="${cx('mode-opt', cur === id && 'is-on')}" data-action="set" data-mode="${id}" aria-pressed="${cur === id}">
        <span class="mode-ic">${icon(m.icon, { size: 20 })}</span>
        <span class="mode-text"><span class="mode-name">${m.label}</span><span class="mode-hint">${m.hint || 'The full system, shown by time of day.'}</span></span>
        ${cur === id ? html`<span class="mode-check">${icon('check', { size: 18 })}</span>` : ''}</button>`)}</div>`;
    },
    actions: {
      set: ({ data, sheet }) => { setMode(date, data.mode); app.closeSheet(sheet); },
    },
  });
}

export function setMode(date, mode) {
  saveReview(date, { mode: mode === 'normal' ? null : mode });
  hap.tap();
  if (mode === 'minimum') app.toast('Minimum day. Just the essentials. That’s enough.', { icon: 'leaf' });
  if (mode === 'sick') app.toast('Sick day. Scoring is paused. Rest well.', { icon: 'thermometer' });
}

/* ---------- habit quick sheet ---------- */
/* ---------- what counts today (the score, explained) ---------- */
const KIND = { focus: 'Your three', essential: 'Essential', top3: 'Top 3' };
export function openPlan(date = today()) {
  app.sheet({
    title: date === today() ? 'What counts today' : `What counted ${dayInline(date)}`,
    render: () => {
      const s = dayScore(date);
      const note = {
        minimum: 'Minimum day: the tiny versions of your three, plus your essentials.',
        rest: 'Rest day: training is out of the plan. Walking and mobility still help.',
        sick: 'Sick day: the score is paused. Rest is the plan.',
      }[s.mode];
      return html`<div class="form">
        <p class="sheet-note">Your score is the share of today’s plan that’s done: each routine (part-way counts), your three and your Top 3. Tiny versions count. Habits on autopilot outside a routine never lower it.</p>
        ${note ? html`<p class="notice">${icon(MODES[s.mode].icon, { size: 16 })} ${note}</p>` : ''}
        ${s.items.length ? html`<ul class="counts-list">${s.items.map((it) => {
          const name = it.kind === 'top3' ? it.text : it.kind === 'routine' ? it.routine.name : it.habit.name;
          const kind = it.kind === 'top3' ? KIND.top3 : it.kind === 'routine' ? `Routine · ${it.stepsDone} of ${it.steps} steps`
            : H.stateOf(it.habit, date) === 'focus' ? KIND.focus : KIND.essential;
          const st = it.level === 'tiny' ? 'tiny' : it.done ? 'done' : it.kind === 'routine' && it.stepsDone ? 'part' : 'open';
          return html`<li class="counts-item" data-key="${it.kind}-${it.kind === 'top3' ? it.index : it.kind === 'routine' ? it.routine.id : it.habit.id}">
            <span class="${cx('counts-state', `counts-state--${st}`)}" ${st === 'part' ? raw(`style="--part:${Math.round(it.credit * 100)}%"`) : ''}>${st === 'done' ? icon('check', { size: 14, stroke: 2.4 }) : ''}</span>
            <span class="counts-main"><span class="counts-name">${name}</span><span class="counts-kind">${kind}${st === 'tiny' ? ' · tiny version' : st === 'done' && it.kind !== 'routine' ? ' · done' : ''}</span></span>
          </li>`;
        })}</ul>
        <p class="counts-total tnum">${s.done} of ${s.total} done${s.tiny ? ` · ${s.tiny} tiny` : ''} · ${s.ratio == null ? '—' : `${Math.round(s.ratio * 100)}%`}</p>`
          : html`<p class="empty-body">${s.mode === 'sick' ? 'Nothing is counted today.' : 'Nothing is planned yet. Choose your three, or write today’s Top 3.'}</p>`}
        <button type="button" class="btn btn--soft btn--block" data-action="sort">${H.focusHabits(date).length ? 'Change your three' : 'Choose your three'}</button>
      </div>`;
    },
    actions: { sort: ({ sheet }) => { app.closeSheet(sheet); app.go('plan/habits/sort'); } },
  });
}

export function openHabit(id, date = today()) {
  const h = H.habit(id);
  if (!h) return;
  app.sheet({
    title: h.name,
    ui: { value: '' },
    render: (s) => {
      const hb = H.habit(id);
      const mode = H.dayMode(date);
      const done = H.isDone(hb, date, mode);
      const lv = H.level(hb, date, mode);
      const tiny = H.tinyOf(hb);
      const stretch = H.stretchOf(hb);
      const v = H.value(hb, date);
      const l = H.log(hb.id, date);
      const r = H.runs(hb, date);
      return html`<div class="form">
        <div class="habit-sheet-head" style="--ic:${habitColor(hb)}">
          <span class="row-ic">${icon(hb.icon, { size: 18 })}</span>
          <p class="habit-sheet-desc">${hb.description || H.scheduleLabel(hb)}</p>
        </div>
        ${H.isNumeric(hb) && hb.type !== 'rating' ? html`<div class="metric-hero metric-hero--compact">
          ${ring(H.progress(hb, date, mode), { size: 64, stroke: 6, color: habitColor(hb) })}
          <div><p class="metric-hero-val tnum">${habitValue(hb, v)} <span>/ ${habitTarget(hb, H.displayTarget(hb, date, mode))}</span></p>
          <p class="metric-hero-sub">${done ? 'Done' : `Counts as done at ${habitTarget(hb, H.threshold(hb, date, mode))}`}</p></div></div>` : ''}
        ${hb.type === 'rating' ? scale10(v, { action: 'rate', name: hb.name }) : ''}
        ${H.isNumeric(hb) && !hb.source && hb.type !== 'rating' ? html`<form class="inline-form" data-submit="set-value">
          <span class="input-unit"><input name="v" type="number" inputmode="decimal" step="any" value="${v ?? ''}" aria-label="Value"><span>${hb.unit}</span></span>
          <button class="btn btn--soft" type="submit">Set</button>
          <button class="btn btn--soft" type="button" data-action="inc">+${hb.step || 1}</button></form>` : ''}
        ${hb.source && H.isNumeric(hb) ? html`<button type="button" class="btn btn--soft btn--block" data-action="source">${sourceCta(hb)}</button>` : ''}
        ${hb.checklist?.length ? html`<ul class="checklist">${hb.checklist.map((item, i) => html`<li data-key="cl-${i}">
          ${check(!!l?.checklist?.[i] || (l?.value === 1 && !l?.checklist), { action: 'cl', data: { i }, label: item })}<span>${item}</span></li>`)}</ul>` : ''}
        ${hb.type === 'binary' || hb.type === 'check' ? html`<button type="button" class="${cx('btn btn--block', done ? 'btn--ghost' : 'btn--primary')}" data-action="toggle">
          ${done ? (hb.type === 'check' ? 'Clear' : 'Mark as not done') : (hb.type === 'check' ? 'Yes, done' : 'Mark done')}</button>` : ''}
        ${H.isNumeric(hb) && hb.type !== 'rating' ? html`<button type="button" class="btn btn--ghost btn--block" data-action="toggle">${l?.completed ? 'Remove manual completion' : 'Mark done anyway'}</button>` : ''}
        ${tiny && !done && hb.type !== 'check' && hb.type !== 'rating' ? (lv === 'tiny' && l?.tiny
          ? html`<p class="tiny-line">${icon('check', { size: 15, stroke: 2.2 })} Tiny version logged${tiny.label ? html` · ${tiny.label}` : ''}. It counts. <button type="button" class="link-btn" data-action="tiny-off">Undo</button></p>`
          : lv === 'tiny' ? html`<p class="tiny-line">${icon('check', { size: 15, stroke: 2.2 })} Past the tiny amount${tiny.label ? html` · ${tiny.label}` : ''}. It counts.</p>`
            : html`<button type="button" class="btn btn--soft btn--block" data-action="tiny-on">Did the tiny version${tiny.label ? html`<span class="btn-sub">${tiny.label}</span>` : ''}</button>`) : ''}
        ${stretch && lv === 'stretch' ? html`<p class="tiny-line">${icon('check', { size: 15, stroke: 2.2 })} Stretch version${stretch.label ? html` · ${stretch.label}` : ''}. A great day.${l?.stretch ? html` <button type="button" class="link-btn" data-action="stretch-off">Undo</button>` : ''}</p>`
          : stretch && !hb.source && hb.type !== 'check' && hb.type !== 'rating' && (!H.isNumeric(hb) || stretch.min == null)
            ? html`<button type="button" class="btn btn--soft btn--block" data-action="stretch-on">Did the stretch version${stretch.label ? html`<span class="btn-sub">${stretch.label}</span>` : ''}</button>`
            : stretch?.min != null && H.isNumeric(hb) ? html`<p class="field-hint">Stretch at ${habitTarget(hb, stretch.min)}${stretch.label ? ` · ${stretch.label}` : ''}.</p>` : ''}
        ${!lv && hb.type !== 'check' ? (H.skipped(hb, date, mode)
          ? html`<p class="tiny-line">Set aside for ${dayLabel(date)}. <button type="button" class="link-btn" data-action="unskip">Bring it back</button></p>`
          : html`<button type="button" class="btn btn--ghost btn--block" data-action="skip">Not today</button>`) : ''}
        <label class="field"><span class="field-label">Note for ${dayLabel(date)}</span>
          <input class="input" value="${l?.note || ''}" data-change="note" placeholder="Optional"></label>
        <div class="sheet-foot">
          <span class="muted">${H.STATES[H.stateOf(hb, date)]?.label || ''} · ${r.current ? `${r.current}-${r.unit} run` : H.scheduleLabel(hb)}${r.comebacks ? ` · ${plural(r.comebacks, 'comeback')}` : ''}</span>
          <button type="button" class="link-btn" data-action="details">Details ${icon('chevron-right', { size: 16 })}</button>
        </div>
      </div>`;
    },
    inputs: { note: ({ value }) => H.setLog(H.habit(id), date, { note: value }) },
    actions: {
      toggle: () => { const now = H.toggle(H.habit(id), date); if (now) hap.success(); else hap.tap(); },
      'tiny-on': () => { H.setTiny(H.habit(id), date, true); hap.success(); },
      'tiny-off': () => { H.setTiny(H.habit(id), date, false); hap.tap(); },
      'stretch-on': () => { H.setStretch(H.habit(id), date, true); settleRoutine(id, date); hap.success(); },
      'stretch-off': () => { H.setStretch(H.habit(id), date, false); hap.tap(); },
      skip: async ({ sheet }) => { app.closeSheet(sheet); (await import('./pads.js')).notToday(H.habit(id), date, { onDone: () => settleRoutine(id, date) }); },
      unskip: () => { H.setSkip(H.habit(id), date, false); settleRoutine(id, date); hap.tap(); },
      cl: ({ data }) => { H.toggleChecklistItem(H.habit(id), date, Number(data.i)); hap.tap(); },
      rate: ({ data }) => { H.setValue(H.habit(id), date, Number(data.value)); hap.tap(); },
      'set-value': ({ form }) => { H.setValue(H.habit(id), date, form.v); hap.tap(); },
      inc: ({ sheet }) => {
        const hb = H.habit(id);
        const next = (Number(H.value(hb, date)) || 0) + (hb.step || 1);
        H.setValue(hb, date, next);
        // The Set field shows the new total, even if something was typed in it.
        const f = sheet.el.querySelector('input[name="v"]');
        if (f) f.value = String(next);
        hap.tap();
      },
      source: ({ sheet }) => { app.closeSheet(sheet); openSource(H.habit(id), date); },
      details: ({ sheet }) => { app.closeSheet(sheet); app.go(`plan/habits/${id}`); },
    },
  });
}

function settleRoutine(habitId, date) {
  const r = R.routineOf(habitId);
  if (r) R.settle(r.routine, date);
}

function sourceCta(h) {
  return {
    water: 'Add water', protein: 'Log food', steps: 'Enter steps', sleep: 'Open check-in', mind: 'Log reading or learning',
    meditation: 'Log meditation', produce: 'Log fruit or veg', deepWork: '+1 focus block', breaks: '+1 break', eyeBreaks: '+1 visual break',
  }[h.source] || 'Log';
}

/** Route a sourced habit to the place its data comes from. */
export function openSource(h, date = today()) {
  const src = h.source || '';
  if (src === 'water') return openWater(date);
  if (src === 'protein' || src === 'produce') return openFood(date);
  if (src === 'steps') return openSteps(date);
  if (src === 'sleep') return openCheckin(date);
  if (src === 'mind') return openSession('reading', date);
  if (src === 'meditation') return openSession('meditation', date);
  if (src === 'journal') return app.go('reflect/journal');
  if (src === 'shutdown') return openShutdown(date);
  if (src.startsWith('rel:')) return openRelationship(src.slice(4), date);
  if (src.startsWith('workout:')) return app.go('plan/training');
  if (src === 'measurements') return app.go('progress/body/measurements');
  if (src === 'photos') return app.go('progress/body/photos');
  if (src === 'weeklyReview') return app.go('reflect/review/week');
  if (src === 'monthlyReview') return app.go('reflect/review/month');
  if (['deepWork', 'breaks', 'eyeBreaks'].includes(src)) return bumpCounter(date, src, 1);
  return openHabit(h.id, date);
}

export function bumpCounter(date, field, delta) {
  const r = reviewOf(date);
  const v = Math.max(0, (r[field] || 0) + delta);
  saveReview(date, { [field]: v });
  hap.tap();
}

/* ---------- sessions: reading, learning, meditation, spiritual ---------- */
const SESSIONS = {
  reading: { store: 'readingSessions', title: 'Reading', fields: ['book', 'minutes', 'pages', 'notes', 'rating'] },
  learning: { store: 'learningSessions', title: 'Learning', fields: ['topic', 'minutes', 'notes'] },
  meditation: { store: 'meditationSessions', title: 'Meditation', fields: ['kind', 'minutes', 'notes'] },
  spiritual: { store: 'spiritualSessions', title: 'Faith', fields: ['kind', 'minutes', 'passage', 'notes'] },
};
const MED_KINDS = [{ id: 'breath', label: 'Breath' }, { id: 'contemplative', label: 'Contemplative prayer' }, { id: 'silence', label: 'Silence' }, { id: 'guided', label: 'Guided' }];
const FAITH_KINDS = [{ id: 'prayer', label: 'Prayer' }, { id: 'scripture', label: 'Scripture' }, { id: 'gratitude', label: 'Gratitude' }, { id: 'study', label: 'Study' }, { id: 'church', label: 'Church' }, { id: 'reflection', label: 'Reflection' }];

export function openSession(kind, date = today(), existing = null, prefill = {}) {
  const cfg = SESSIONS[kind];
  const books = [...new Set(store.all('readingSessions').map((r) => r.book).filter(Boolean))].slice(-6).reverse();
  const ui = { ...(existing || {}), ...prefill, kind: existing?.kind || prefill.kind || (kind === 'meditation' ? 'breath' : kind === 'spiritual' ? 'prayer' : undefined),
    minutes: existing?.minutes ?? prefill.minutes ?? (kind === 'meditation' ? 10 : 20), switchTo: prefill.switchTo || kind };
  app.sheet({
    title: existing ? `Edit ${cfg.title.toLowerCase()}` : (kind === 'reading' ? 'Reading or learning' : cfg.title),
    ui,
    render: (s) => {
      const k = s.ui.switchTo;
      return html`<div class="form">
        ${kind === 'reading' && !existing ? segmented([{ id: 'reading', label: 'Reading' }, { id: 'learning', label: 'Learning' }], k, { action: 'switch', name: 'Type' }) : ''}
        ${k === 'reading' ? html`<label class="field"><span class="field-label">Book</span><input class="input" list="books" value="${s.ui.book || ''}" data-input="field" data-field="book" placeholder="Title">
          <datalist id="books">${books.map((b) => html`<option value="${b}"></option>`)}</datalist></label>` : ''}
        ${k === 'learning' ? html`<label class="field"><span class="field-label">Topic</span><input class="input" value="${s.ui.topic || ''}" data-input="field" data-field="topic" placeholder="AI, marketing, design, sales…"></label>` : ''}
        ${k === 'meditation' ? segmented(MED_KINDS, s.ui.kind, { action: 'kind', name: 'Kind', size: 'wrap' }) : ''}
        ${k === 'spiritual' ? segmented(FAITH_KINDS, s.ui.kind, { action: 'kind', name: 'Kind', size: 'wrap' }) : ''}
        <div class="field"><span class="field-label">Minutes</span>${stepper(s.ui.minutes || 0, { action: 'mins', step: 5, unit: 'min' })}</div>
        ${k === 'reading' ? html`<label class="field"><span class="field-label">Pages <small>optional</small></span><input class="input" type="number" inputmode="numeric" min="0" value="${s.ui.pages ?? ''}" data-input="field" data-field="pages"></label>` : ''}
        ${k === 'spiritual' ? html`<label class="field"><span class="field-label">Passage <small>optional</small></span><input class="input" value="${s.ui.passage || ''}" data-input="field" data-field="passage" placeholder="e.g. Psalm 23"></label>` : ''}
        <label class="field"><span class="field-label">Notes</span><textarea class="input" rows="2" data-input="field" data-field="notes">${s.ui.notes || ''}</textarea></label>
        ${k === 'reading' ? html`<label class="check-line"><input type="checkbox" ${s.ui.finished ? raw('checked') : ''} data-change="finished"> Finished this book</label>` : ''}
        <div class="btn-row">
          ${existing ? html`<button type="button" class="btn btn--ghost" data-action="del">Delete</button>` : ''}
          <button type="button" class="btn btn--primary" data-action="save">Save</button>
        </div>
      </div>`;
    },
    inputs: { field: setField, finished: ({ value, sheet }) => { sheet.ui.finished = value; } },
    actions: {
      switch: ({ data, sheet }) => { sheet.ui.switchTo = data.value; sheet.refresh(); },
      kind: ({ data, sheet }) => { sheet.ui.kind = data.value; hap.tap(); sheet.refresh(); },
      mins: ({ data, sheet }) => { sheet.ui.minutes = Math.max(0, (Number(sheet.ui.minutes) || 0) + Number(data.delta)); sheet.refresh(); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        const k = u.switchTo;
        const target = SESSIONS[k];
        const rec = { ...(existing || {}), date: existing?.date || date, minutes: Number(u.minutes) || 0, notes: u.notes || '' };
        if (k === 'reading') Object.assign(rec, { book: (u.book || '').trim(), pages: n(u.pages), finished: !!u.finished });
        if (k === 'learning') rec.topic = (u.topic || '').trim();
        if (k === 'meditation' || k === 'spiritual') rec.kind = u.kind;
        if (k === 'spiritual') rec.passage = u.passage || '';
        if (!rec.minutes && !rec.pages && !rec.notes) { app.toast('Add minutes or a note first.'); return; }
        store.put(target.store, rec);
        if (k === 'spiritual') markFaithHabit(rec.kind, rec.date);
        hap.success();
        app.closeSheet(sheet);
      },
      del: ({ sheet }) => { removeWithUndo(cfg.store, existing.id, 'Session deleted'); app.closeSheet(sheet); },
    },
  });
}

function markFaithHabit(kind, date) {
  const map = { prayer: 'h-prayer', scripture: 'h-scripture', gratitude: 'h-gratitude', church: 'h-church', study: 'h-study' };
  const h = H.habit(map[kind]);
  if (h && !H.isDone(h, date)) H.setLog(h, date, { value: 1 });
}

/* ---------- relationships ---------- */
const PEOPLE = {
  fiancee: { label: 'Fiancée', prompt: 'How are you really doing?', kinds: ['Conversation', 'Walk', 'Meal together', 'Quiet time', 'Prayer together'] },
  date: { label: 'Couple time', prompt: 'Time just for the two of you.', kinds: ['Dinner', 'Walk', 'Coffee', 'Movie', 'Day trip', 'Shared activity'] },
  son: { label: 'Son', prompt: 'Connection, not policing.', kinds: ['Conversation', 'Shared activity', 'Guidance', 'Encouragement'] },
  family: { label: 'Family', prompt: 'One meaningful conversation.', kinds: ['Call', 'Visit', 'Meal', 'Message'] },
};

export function openRelationship(person = 'fiancee', date = today(), existing = null) {
  const ui = { person: existing?.person || person, kind: existing?.kind || PEOPLE[person].kinds[0], minutes: existing?.minutes ?? 20, note: existing?.note || '' };
  app.sheet({
    title: existing ? 'Edit moment' : 'Time together',
    ui,
    render: (s) => {
      const p = PEOPLE[s.ui.person];
      return html`<div class="form">
        ${segmented(Object.entries(PEOPLE).map(([id, x]) => ({ id, label: x.label })), s.ui.person, { action: 'person', name: 'Who', size: 'wrap' })}
        <p class="sheet-note">${p.prompt}</p>
        ${segmented(p.kinds.map((k) => ({ id: k, label: k })), s.ui.kind, { action: 'kind', name: 'What', size: 'wrap' })}
        <div class="field"><span class="field-label">Minutes <small>optional</small></span>${stepper(s.ui.minutes || 0, { action: 'mins', step: 5, unit: 'min' })}</div>
        <label class="field"><span class="field-label">A line to remember <small>optional</small></span><input class="input" value="${s.ui.note}" data-input="field" data-field="note"></label>
        <div class="btn-row">
          ${existing ? html`<button type="button" class="btn btn--ghost" data-action="del">Delete</button>` : ''}
          <button type="button" class="btn btn--primary" data-action="save">Save</button>
        </div>
      </div>`;
    },
    inputs: { field: setField },
    actions: {
      person: ({ data, sheet }) => { sheet.ui.person = data.value; sheet.ui.kind = PEOPLE[data.value].kinds[0]; hap.tap(); sheet.refresh(); },
      kind: ({ data, sheet }) => { sheet.ui.kind = data.value; hap.tap(); sheet.refresh(); },
      mins: ({ data, sheet }) => { sheet.ui.minutes = Math.max(0, (Number(sheet.ui.minutes) || 0) + Number(data.delta)); sheet.refresh(); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        store.put('relationshipEntries', { ...(existing || {}), date: existing?.date || date, person: u.person, kind: u.kind, minutes: Number(u.minutes) || 0, note: u.note || '' });
        hap.success();
        app.closeSheet(sheet);
      },
      del: ({ sheet }) => { removeWithUndo('relationshipEntries', existing.id, 'Moment deleted'); app.closeSheet(sheet); },
    },
  });
}

export const PEOPLE_LABELS = Object.fromEntries(Object.entries(PEOPLE).map(([k, v]) => [k, v.label]));
export { plural };
