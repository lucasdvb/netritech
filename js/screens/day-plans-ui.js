// Your days, on Your plan: the plan each weekday follows, your plans (Every day, and any you make:
// "Long day", "Short day", "Saturday"), and the next two weeks, where any date can follow another
// plan or be adjusted on its own. The day planner below edits whichever plan or date is chosen here.
import * as P from '../domain/day-plans.js';
import { planGuard } from '../domain/sleep-regularity.js';
import * as F from '../domain/fitness-core.js';
import * as store from '../data/store.js';
import { today, addDays, weekday, fmtDayShort, fmtMD, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const DOW = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS = ['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
const hm = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);
const dateLabel = (d) => { const r = relativeDay(d); return /^(Today|Tomorrow)$/.test(r) ? `${r} · ${fmtDayShort(d)}` : `${fmtDayShort(d)} ${fmtMD(d)}`; };

/** Which plan or date the planner is editing: { plan } or { date }. Kept while the app is open. */
export const editing = { target: { plan: P.BASE } };
/** The target, checked: a plan that's gone, or a date that's passed, falls back to Every day. */
export function target() {
  const t = editing.target;
  if (t.date && t.date < today()) editing.target = { plan: P.BASE };
  else if (t.plan && !P.plan(t.plan)) editing.target = { plan: P.BASE };
  return editing.target;
}
export const targetName = (t = target()) => (t.date ? dateLabel(t.date) : P.nameOf(t.plan));

/** Training on a day whose plan has no time for it: said plainly, with the fix. */
function trainingGap(t) {
  if (P.blocksOf(t).some((b) => b.kind === 'train')) return '';
  const plan = store.profile().plan || {};
  const trains = (wd) => { const tpl = plan[wd] ? F.template(plan[wd]) : null; return tpl && ['strength', 'cardio'].includes(tpl.kind) ? tpl : null; };
  let days = [];
  if (t.date) { if (F.plannedTemplate(t.date) && ['strength', 'cardio'].includes(F.plannedTemplate(t.date).kind)) days = [weekday(t.date)]; }
  else days = Object.entries(P.week()).filter(([wd, id]) => id === t.plan && trains(Number(wd))).map(([wd]) => Number(wd));
  if (!days.length) return '';
  const where = t.date ? dateLabel(t.date) : days.map((d) => DAYS[d]).join(', ');
  return html`<div class="notice notice--action" data-key="dp-train-gap">${icon('dumbbell', { size: 16 })}
    <span>${where} ${t.date ? 'has' : 'have'} a workout in your training week, but ${t.date ? 'this day' : P.nameOf(t.plan)} has no time for training.</span>
    <button type="button" class="btn btn--soft btn--sm" data-action="dp-add-train">Add training</button></div>`;
}

/** The section above the planner. */
export function daysSection() {
  const t = target();
  const w = P.week();
  const list = P.plans();
  const ft = P.freeTime(t);
  const guard = list.length > 1 ? planGuard() : null;
  return html`<div class="days" data-key="days">
    <ol class="days-week" aria-label="The plan each weekday follows">${[1, 2, 3, 4, 5, 6, 7].map((d) => html`<li>
      <button type="button" class="${cx('dw-day', !t.date && w[d] === t.plan && 'is-on', weekday(today()) === d && 'is-today')}" data-action="dp-weekday" data-wd="${d}" aria-label="${DAYS[d].slice(0, -1)}: ${P.nameOf(w[d])}. Change">
        <span class="dw-dow">${DOW[d]}</span><span class="dw-plan">${P.nameOf(w[d])}</span></button></li>`)}</ol>
    ${guard ? html`<p class="notice notice--warn days-guard" data-key="days-guard">${icon('moon', { size: 16 })}<span>${guard.line}</span></p>` : ''}
    <div class="chips days-plans" role="group" aria-label="Your plans">
      ${list.map((p) => html`<button type="button" class="${cx('chip', !t.date && t.plan === p.id && 'is-active')}" data-action="dp-pick" data-id="${p.id}" aria-pressed="${!t.date && t.plan === p.id}">${p.name}</button>`)}
      <button type="button" class="chip chip--add" data-action="dp-new">${icon('plus', { size: 14 })} New plan</button>
    </div>
    <div class="days-editing" data-key="dp-editing">
      <p class="days-editing-what">Editing <strong>${targetName(t)}</strong>${t.date ? html` · ${P.adjusted(t.date) ? 'this day only' : P.nameOf(P.planIdFor(t.date))}` : ''}</p>
      ${ft ? html`<p class="days-free tnum">Awake ${hm(ft.awake)} · ${ft.free ? `${hm(ft.free)} free` : 'every hour planned'}</p>` : ''}
      <div class="days-editing-ctl">
        ${t.date ? html`<button type="button" class="link-btn" data-action="dp-date" data-date="${t.date}">Change this day</button>`
          : html`<button type="button" class="link-btn" data-action="dp-rename">Rename</button>${t.plan !== P.BASE ? html`<button type="button" class="link-btn link-btn--danger" data-action="dp-delete">Delete</button>` : ''}`}
      </div>
    </div>
    ${trainingGap(t)}
  </div>`;
}

/** The next two weeks, under the planner: each date's plan, tap to change one. */
export function aheadSection() {
  const t = target();
  return html`<ul class="card days-ahead" data-key="days-ahead">${P.ahead(today(), 14).map((d) => html`<li data-key="da-${d.date}">
    <button type="button" class="${cx('row', t.date === d.date && 'is-on')}" data-action="dp-date" data-date="${d.date}" aria-label="${dateLabel(d.date)}: ${d.name}${d.adjusted ? ', adjusted' : ''}. Change">
      <span class="row-main"><span class="row-title">${dateLabel(d.date)}</span><span class="row-sub">${d.name}${d.adjusted ? ' · adjusted for this day' : d.chosen ? ' · chosen for this day' : ''}</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul>`;
}

/** A list of plans to choose from, the current one marked. */
const choices = (current, action, extra = {}) => html`<ul class="list pick-plans">${P.plans().map((p) => html`<li>
  <button type="button" class="${cx('row', p.id === current && 'is-on')}" data-action="${action}" data-id="${p.id}"${Object.entries(extra).map(([k, v]) => html` data-${k}="${v}"`)} aria-pressed="${p.id === current}">
    <span class="row-main"><span class="row-title">${p.name}</span><span class="row-sub tnum">${planSummary(p.id)}</span></span>
    ${p.id === current ? html`<span class="row-ic row-ic--done">${icon('check', { size: 16 })}</span>` : ''}</button></li>`)}</ul>`;

function planSummary(id) {
  const list = P.blocksOf({ plan: id });
  const at = (k) => list.find((b) => b.kind === k);
  const work = at('work');
  return [at('wake') && `Up ${at('wake').time}`, work && `work ${work.time}–${work.end}`, at('train') && `training ${at('train').time}`, at('bed') && `lights out ${at('bed').time}`].filter(Boolean).join(' · ');
}

function weekdaySheet(wd) {
  app.sheet({
    title: DAYS[wd],
    size: 'detent',
    render: () => html`<div class="form">${choices(P.week()[wd], 'dp-set-weekday', { wd })}
      <p class="sheet-note">Every ${DAYS[wd].slice(0, -1)} follows this plan, unless you choose another for one date.</p></div>`,
    actions: {
      'dp-set-weekday': ({ data, sheet }) => {
        const undo = P.setWeekday(Number(data.wd), data.id);
        hap.tap();
        app.closeSheet(sheet);
        app.toast(`${DAYS[wd]}: ${P.nameOf(data.id)}`, { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

function dateSheet(date) {
  app.sheet({
    title: dateLabel(date),
    size: 'detent',
    render: () => {
      const usual = P.week()[weekday(date)];
      const changed = P.planIdFor(date) !== usual || P.adjusted(date);
      return html`<div class="form">
        ${choices(P.planIdFor(date), 'dp-set-date', { date })}
        <button type="button" class="btn btn--soft btn--block" data-action="dp-adjust" data-date="${date}">${icon('pencil', { size: 16 })} ${P.adjusted(date) ? 'Edit this day' : 'Adjust this day only'}</button>
        ${changed ? html`<button type="button" class="btn btn--ghost btn--block" data-action="dp-reset-date" data-date="${date}">Back to ${P.nameOf(usual)} (its usual plan)</button>` : ''}
        <p class="sheet-note">Choosing a plan changes this date only. Adjusting makes a copy of its plan for this date, to change without touching the plan.</p>
      </div>`;
    },
    actions: {
      'dp-set-date': ({ data, sheet }) => {
        const undo = P.setDate(date, data.id);
        hap.tap();
        app.closeSheet(sheet);
        app.toast(`${dateLabel(date)}: ${P.nameOf(data.id)}`, { action: { label: 'Undo', fn: undo } });
      },
      'dp-adjust': ({ sheet }) => {
        const undo = P.adjust(date);
        editing.target = { date };
        hap.tap();
        app.closeSheet(sheet);
        app.refresh();
        document.querySelector('[data-key="plan-day"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        app.toast(`Editing ${dateLabel(date)} only`, { action: { label: 'Undo', fn: () => { undo(); editing.target = { plan: P.BASE }; app.refresh(); } } });
      },
      'dp-reset-date': ({ sheet }) => {
        const undo = P.setDate(date, null);
        if (editing.target.date === date) editing.target = { plan: P.BASE };
        hap.tap();
        app.closeSheet(sheet);
        app.toast(`${dateLabel(date)} follows its usual plan`, { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

function nameSheet({ title, value = '', from = null, submit }) {
  app.sheet({
    title,
    size: 'detent',
    render: () => html`<form class="form" data-submit="dp-name">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" value="${value}" maxlength="40" required autofocus placeholder="e.g. Long day, Short day, Saturday"></label>
      ${from ? html`<label class="field"><span class="field-label">Start from</span><select class="input" name="from">${P.plans().map((p) => html`<option value="${p.id}" ${p.id === from ? 'selected' : ''}>${p.name}</option>`)}</select></label>
        <p class="field-hint">A copy of that plan’s blocks and times, to change for this kind of day.</p>` : ''}
      <button type="submit" class="btn btn--primary btn--block">${from ? 'Make the plan' : 'Save'}</button></form>`,
    actions: {
      'dp-name': ({ form, sheet }) => {
        if (!String(form.name || '').trim()) { app.toast('Give it a name.'); return; }
        app.closeSheet(sheet);
        submit(form);
      },
    },
  });
}

export const daysActions = {
  'dp-weekday': ({ data }) => weekdaySheet(Number(data.wd)),
  'dp-pick': ({ data }) => { editing.target = { plan: data.id }; hap.tap(); app.refresh(); },
  'dp-date': ({ data }) => dateSheet(data.date),
  'dp-new': () => nameSheet({ title: 'New plan', from: target().date ? P.planIdFor(target().date) : target().plan || P.BASE, submit: (form) => {
    const { id, undo } = P.create(form.name, form.from);
    editing.target = { plan: id };
    hap.success();
    app.refresh();
    app.toast(`${P.nameOf(id)} made. Give it its days above.`, { action: { label: 'Undo', fn: () => { undo(); editing.target = { plan: P.BASE }; app.refresh(); } } });
  } }),
  'dp-rename': () => { const t = target(); nameSheet({ title: 'Rename', value: P.nameOf(t.plan), submit: (form) => {
    const undo = P.rename(t.plan, form.name);
    app.toast('Renamed', { action: { label: 'Undo', fn: undo } });
  } }); },
  'dp-delete': () => {
    const t = target();
    const name = P.nameOf(t.plan);
    const undo = P.remove(t.plan);
    editing.target = { plan: P.BASE };
    hap.tap();
    app.refresh();
    app.toast(`${name} deleted. Its days follow Every day.`, { tone: 'default', action: { label: 'Undo', fn: () => { undo(); editing.target = t; app.refresh(); } } });
  },
  'dp-add-train': () => {
    const t = target();
    const { undo } = P.add(t, { kind: 'train', time: '18:00', mins: 60 });
    hap.success();
    app.toast('Training added at 18:00. Tap it to change the time.', { action: { label: 'Undo', fn: undo } });
  },
};

/** The plans for next week, for the weekly review: one row a day, its plan to change. */
export function nextWeekDays(weekStart) {
  return html`<div class="days-review" data-key="days-review"><p class="form-label">Your days next week</p>
    <ul class="list">${Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => html`<li data-key="dr-${d}">
      <button type="button" class="row" data-action="dp-date" data-date="${d}" aria-label="${dateLabel(d)}: ${P.nameOf(P.planIdFor(d))}. Change">
        <span class="row-main"><span class="row-title">${fmtDayShort(d)} ${fmtMD(d)}</span><span class="row-sub">${P.nameOf(P.planIdFor(d))}${P.adjusted(d) ? ' · adjusted' : ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul></div>`;
}
