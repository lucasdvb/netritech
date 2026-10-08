// Goals: a new goal takes three questions (what outcome, by when, how you'll know). Every goal
// shows where it's heading, or says what data it needs to tell you.
import * as store from '../data/store.js';
import * as G from '../domain/goals.js';
import * as H from '../domain/habits.js';
import { CATEGORIES, catColor, catLabel } from '../domain/taxonomy.js';
import { today, addDays, addMonths, fmtMD } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, ring } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { num, kgIn, kgOut, weightUnit } from '../ui/format.js';

/** A goal's value in your units ("76.2 kg", "18%", "34 workouts"). */
export function valueText(g, v) {
  if (v == null) return '—';
  const m = G.measureOf(g);
  if (m === 'weight') return `${num(kgOut(v), 1)} ${weightUnit()}`;
  if (m === 'bodyFat') return `${num(v, 1)}%`;
  const unit = m === 'workouts' ? 'workouts' : m === 'pages' ? 'pages' : m === 'habitCount' ? 'times' : g.unit || '';
  return `${num(v, Number.isInteger(v) ? 0 : 1)}${unit ? (unit === '%' ? '%' : ` ${unit}`) : ''}`;
}

/** Where the goal is heading, in one sentence. */
export function projectionLine(g, date = today()) {
  const p = G.projection(g, date);
  const target = valueText(g, p.target ?? g.target);
  switch (p.status) {
    case 'needs': return p.needs;
    case 'done': return `Reached: ${valueText(g, p.current)}.`;
    case 'on-pace': return `On pace for ${target} by ${fmtMD(p.eta)}${p.deadline ? `, ${p.daysEarly ? `${p.daysEarly} days before` : 'right on'} your deadline` : ''}.`;
    case 'behind': return `${p.weeksBehind} week${p.weeksBehind === 1 ? '' : 's'} behind: at this pace ${target} arrives ${fmtMD(p.eta)}, with ${p.daysLeft} days left.`;
    case 'flat': return `Not moving towards ${target} yet. Now ${valueText(g, p.current)}.`;
    case 'milestones': return `${p.done} of ${p.total} milestones${p.daysLeft != null ? `, ${Math.max(0, p.daysLeft)} days left` : ''}.`;
    case 'improving': return `Improving: ${Math.round(p.now * 100)}% over two weeks, up from ${Math.round((p.now - p.delta) * 100)}%.`;
    case 'slipping': return `Slipping: ${Math.round(p.now * 100)}% over two weeks, down from ${Math.round((p.now - p.delta) * 100)}%.`;
    case 'steady': return `Holding steady at ${Math.round(p.now * 100)}% over two weeks.`;
    default: return '';
  }
}

const HOW = [
  ...G.MEASURES.map((m) => ({ id: m.id, label: m.label })),
  { id: 'milestones', label: 'Milestones I tick off' },
  { id: 'consistency', label: 'Keeping habits going' },
];
const WHEN = () => [['In a month', addMonths(today(), 1)], ['In 3 months', addMonths(today(), 3)], ['In 6 months', addMonths(today(), 6)], ['End of the year', `${today().slice(0, 4)}-12-31`], ['No date', '']];

/** A new goal in three questions. */
export function newGoal() {
  const lastKg = store.all('weightEntries').reduce((a, b) => (!a || b.date > a.date ? b : a), null)?.kg ?? null;
  const ui = { i: 0, name: '', area: 'body', deadline: addMonths(today(), 3), how: null, target: '', start: lastKg != null ? Math.round(kgOut(lastKg) * 10) / 10 : '', unit: '', habitId: '', milestone: '' };
  const STEPS = ['What outcome?', 'By when?', 'How will you know?'];
  app.sheet({
    title: 'New goal',
    size: 'detent',
    ui,
    render: (s) => {
      const u = s.ui;
      const step = u.i;
      return html`<div class="ritual goal-new" data-step="${step}" data-key="gn-${step}">
        <div class="ritual-progress" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${step + 1}" aria-label="Question ${step + 1} of 3">${STEPS.map((_, j) => html`<span class="${cx(j < step && 'is-done', j === step && 'is-now')}"></span>`)}</div>
        <h3 class="ritual-q">${STEPS[step]}</h3>
        <div class="ritual-body">
          ${step === 0 ? html`<input class="input" value="${u.name}" data-input="gn" data-f="name" placeholder="e.g. Get to 15% body fat" maxlength="60" aria-label="The outcome" enterkeyhint="next">
            <div class="chips">${CATEGORIES.filter((c) => c.id !== 'core').map((c) => html`<button type="button" class="${cx('chip chip--area', u.area === c.id && 'is-active')}" style="--ic:${catColor(c.id)}" aria-pressed="${u.area === c.id}" data-action="gn-area" data-id="${c.id}"><i class="chip-dot" aria-hidden="true"></i>${c.label}</button>`)}</div>` : ''}
          ${step === 1 ? html`<div class="chips">${WHEN().map(([label, d]) => html`<button type="button" class="${cx('chip', u.deadline === d && 'is-active')}" aria-pressed="${u.deadline === d}" data-action="gn-when" data-d="${d}">${label}</button>`)}</div>
            <input class="input" type="date" min="${addDays(today(), 1)}" value="${u.deadline}" data-change="gn" data-f="deadline" aria-label="Deadline">` : ''}
          ${step === 2 ? html`<div class="chips">${HOW.map((m) => html`<button type="button" class="${cx('chip', u.how === m.id && 'is-active')}" aria-pressed="${u.how === m.id}" data-action="gn-how" data-id="${m.id}">${m.label}</button>`)}</div>
            ${howFields(u)}` : ''}
        </div>
        <div class="ritual-foot">
          ${step > 0 ? html`<button type="button" class="link-btn" data-action="gn-back">Back</button>` : html`<span></span>`}
          ${step < 2 ? html`<button type="button" class="btn btn--primary" data-action="gn-next">Next</button>` : html`<button type="button" class="btn btn--primary" data-action="gn-save">Create goal</button>`}
        </div>
      </div>`;
    },
    inputs: { gn: ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; if (el.tagName === 'SELECT' || el.type === 'date') sheet.refresh(); } },
    actions: {
      'gn-area': ({ data, sheet }) => { sheet.ui.area = data.id; sheet.refresh(); },
      'gn-when': ({ data, sheet }) => { sheet.ui.deadline = data.d; sheet.refresh(); },
      'gn-how': ({ data, sheet }) => { sheet.ui.how = data.id; hap.tap(); sheet.refresh(); },
      'gn-back': ({ sheet }) => { sheet.ui.i--; sheet.refresh(); },
      'gn-next': ({ sheet }) => {
        if (sheet.ui.i === 0 && !sheet.ui.name.trim()) { app.toast('Name the outcome first.'); return; }
        sheet.ui.i++;
        sheet.refresh();
      },
      'gn-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.how) { app.toast('Choose how you’ll know.'); return; }
        const n = (v) => (v === '' || v == null ? null : Number(v));
        const measure = G.MEASURES.some((m) => m.id === u.how) ? u.how : null;
        if (measure && n(u.target) == null) { app.toast('Set the target.'); return; }
        if (measure === 'habitCount' && !u.habitId) { app.toast('Choose the habit.'); return; }
        const weight = measure === 'weight';
        const start = weight ? kgIn(n(u.start)) : n(u.start);
        const target = weight ? kgIn(n(u.target)) : n(u.target);
        const g = store.put('goals', {
          name: u.name.trim(), category: u.area, deadline: u.deadline || null, since: today(), status: 'active', order: 99, description: '',
          type: measure ? 'numeric' : u.how, measure, target, start, unit: measure === 'number' ? u.unit.trim() : measure === 'bodyFat' ? '%' : '',
          direction: start != null && target != null ? (target < start ? 'down' : 'up') : null, habitId: measure === 'habitCount' ? u.habitId : null,
          history: measure === 'number' && start != null ? [{ date: today(), value: start }] : [], current: measure === 'number' ? start : null,
          habitIds: measure === 'habitCount' ? [u.habitId] : [],
          milestones: u.how === 'milestones' && u.milestone.trim() ? [{ id: store.uid(), title: u.milestone.trim(), done: false, doneAt: null }] : [],
        });
        hap.success();
        app.closeSheet(sheet);
        app.go(`plan/goals/${g.id}`);
      },
    },
  });
}

function howFields(u) {
  const field = (label, f, o = {}) => html`<label class="field"><span class="field-label">${label}</span>
    ${o.unit ? html`<span class="input-unit"><input type="number" inputmode="decimal" step="any" value="${u[f]}" data-input="gn" data-f="${f}"><span>${o.unit}</span></span>`
      : html`<input class="input" ${raw(o.type === 'text' ? '' : 'type="number" inputmode="decimal" step="any"')} value="${u[f]}" data-input="gn" data-f="${f}" placeholder="${o.ph || ''}">`}</label>`;
  switch (u.how) {
    case 'weight': return html`<div class="grid-2">${field('Now', 'start', { unit: weightUnit() })}${field('Target', 'target', { unit: weightUnit() })}</div>`;
    case 'bodyFat': return html`<div class="grid-2">${field('Now (estimate)', 'start', { unit: '%' })}${field('Target', 'target', { unit: '%' })}</div>`;
    case 'habitCount': return html`<label class="field"><span class="field-label">Habit</span><select class="input" data-change="gn" data-f="habitId"><option value="">Choose…</option>
        ${H.activeHabits().map((h) => html`<option value="${h.id}" ${raw(u.habitId === h.id ? 'selected' : '')}>${h.name}</option>`)}</select></label>
      ${field('How many times', 'target', { unit: 'times' })}`;
    case 'workouts': return field('Workouts', 'target', { unit: 'workouts' });
    case 'pages': return field('Pages', 'target', { unit: 'pages' });
    case 'number': return html`<div class="grid-2">${field('Now', 'start')}${field('Target', 'target')}</div>${field('Unit', 'unit', { type: 'text', ph: 'clients, €, km…' })}`;
    case 'milestones': return field('First milestone', 'milestone', { type: 'text', ph: 'e.g. 15 strict push-ups' });
    case 'consistency': return html`<p class="ritual-note">Link the habits that carry it on the goal’s page; their consistency is the measure.</p>`;
    default: return html`<p class="ritual-note">Pick one. A number gives you a projection; milestones and habits give you a direction.</p>`;
  }
}

/** Edit the basics of a goal (name, area, deadline, target). */
export function goalSheet(existing) {
  if (!existing) return newGoal();
  const m = G.measureOf(existing);
  const weight = m === 'weight';
  const show = (v) => (v == null ? '' : weight ? Math.round(kgOut(v) * 10) / 10 : v);
  app.sheet({
    title: 'Edit goal',
    render: () => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Outcome</span><input class="input" name="name" value="${existing.name || ''}" required maxlength="60"></label>
      <label class="field"><span class="field-label">Why it matters <small>optional</small></span><textarea class="input" name="description" rows="2">${existing.description || ''}</textarea></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Area</span><select class="input" name="category">${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(existing.category === c.id ? 'selected' : '')}>${c.label}</option>`)}</select></label>
        <label class="field"><span class="field-label">By <small>optional</small></span><input class="input" type="date" name="deadline" value="${existing.deadline || ''}"></label>
        ${m ? html`<label class="field"><span class="field-label">Start</span><input class="input" name="start" type="number" step="any" value="${show(existing.start)}"></label>
          <label class="field"><span class="field-label">Target</span><input class="input" name="target" type="number" step="any" value="${show(existing.target)}"></label>` : ''}
      </div>
      <button type="submit" class="btn btn--primary btn--block">Save</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        if (!form.name?.trim()) { app.toast('Give the goal a name.'); return; }
        const n = (v) => (v === '' || v == null ? null : weight ? kgIn(Number(v)) : Number(v));
        const patch = { name: form.name.trim(), description: form.description || '', category: form.category, deadline: form.deadline || null };
        if (m) Object.assign(patch, { start: n(form.start), target: n(form.target) });
        store.put('goals', { ...existing, ...patch });
        hap.tap();
        app.closeSheet(sheet);
      },
    },
  });
}

export default {
  id: 'goals',
  title: 'Goals',
  render() {
    const all = G.goals();
    const active = all.filter((g) => g.status === 'active');
    const other = all.filter((g) => g.status !== 'active');
    const card = (g) => {
      const p = G.progress(g);
      return html`<li><a class="goal-card" href="#/plan/goals/${g.id}" data-action="nav" data-to="plan/goals/${g.id}" style="--ic:${catColor(g.category)}">
        <span class="goal-ring">${ring(p.ratio || 0, { size: 46, stroke: 4.5, color: 'var(--ic)' })}<span class="goal-ic">${icon(CATEGORIES.find((c) => c.id === g.category)?.icon || 'target', { size: 16 })}</span></span>
        <span class="row-main"><span class="row-title" data-morph="goal-${g.id}">${g.name}</span><span class="row-sub">${projectionLine(g) || p.label || catLabel(g.category)}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
    };
    return html`
      ${pageHead({ title: 'Goals', back: { to: 'plan', label: 'Plan' }, actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New goal">${icon('plus', { size: 20 })}</button>` })}
      <p class="lead">Where each goal is heading, from your own data. A new goal takes three questions.</p>
      ${active.length ? html`<ul class="goal-list">${active.map(card)}</ul>` : empty({ ic: 'target', title: 'No active goals', cta: 'Add a goal', action: 'new' })}
      ${other.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Paused or done</h2></div><ul class="goal-list">${other.map(card)}</ul></section>` : ''}`;
  },
  actions: { new: () => newGoal() },
};
