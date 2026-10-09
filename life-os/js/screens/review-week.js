// The weekly review (flow 11), about three minutes as five short screens: the week in one sentence,
// what went well and where it slipped (computed, not remembered), one change that is applied to
// your plan rather than noted, and next week's three. A finished review, or "See it all", shows
// every number and question on one page.
import * as store from '../data/store.js';
import { saver, applyPatches } from '../ui/save-later.js';
import * as H from '../domain/habits.js';
import * as T from '../domain/tasks.js';
import * as S from '../domain/story.js';
import { weekFacts, weekHighlights } from '../domain/review-data.js';
import { weeklyInsights } from '../domain/coach.js';
import { today, startOfWeek, endOfWeek, addDays, fmtMD, weekday, dayAt, dayInline } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { num, signed, kgOut, weightUnit, cmOut, lengthUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export const QUESTIONS = [
  ['worked', 'What worked?'], ['didnt', 'What didn’t?'], ['drained', 'What drained me?'], ['energy', 'What gave me energy?'],
  ['stop', 'What should I stop?'], ['start', 'What should I start?'], ['one', 'What is the ONE change for next week?'],
];
const BUSINESS = ['Revenue', 'Pipeline', 'Sales activity', 'Client delivery', 'Marketing', 'Cash flow', 'Outstanding tasks', 'Strategic priority'];
const STEPS = [
  ['week', 'The week in a sentence'], ['well', 'What went well'], ['slipped', 'Where it slipped'], ['change', 'One change for next week'], ['next', 'Next week’s three'],
];

export function defaultWeek() {
  const cur = startOfWeek(today());
  const prev = addDays(cur, -7);
  if (weekday(today()) <= 3 && !store.get('weeklyReviews', prev)?.completedAt && prev >= startOfWeek(H.trackingStart())) return prev;
  return cur;
}

const saving = saver((id, patches) => store.put('weeklyReviews', applyPatches(store.get('weeklyReviews', id) || { id, weekStart: id }, patches)), 400);
const saveLater = (id, patch) => saving.later(id, patch);
const flush = (ws) => saving.now(ws);
const reviewOf = (ws) => store.get('weeklyReviews', ws) || { id: ws, weekStart: ws };

// Resolve the week once per visit so completing last week's review doesn't flip the screen to this week.
const weekOf = (params) => (params.date ? startOfWeek(params.date) : (params.date = defaultWeek()));
const weekEnd = (ws) => (endOfWeek(ws) > today() ? today() : endOfWeek(ws));

const kg = (v) => (v == null ? '—' : `${signed(kgOut(v), 1)} ${weightUnit()}`);
const answer = (k, r, { rows = 2, placeholder = '' } = {}) => html`<textarea class="prompt-a" rows="${rows}" data-input="answer" data-k="${k}" placeholder="${placeholder}" aria-label="${QUESTIONS.find(([q]) => q === k)?.[1] || k}">${r.answers?.[k] || ''}</textarea>`;
const facts = (list, empty) => (list.length ? html`<ul class="review-facts">${list.map((x) => html`<li>${icon(x.ic, { size: 16 })}<span>${x.text}</span></li>`)}</ul>` : html`<p class="quiet-line">${empty}</p>`);

/** Planning the week ahead: three things, the first one onto Monday. */
function nextWeek(ws) {
  const nw = addDays(ws, 7);
  const next = store.get('weeklyReviews', nw) || {};
  const plan = next.plan || [];
  return html`<section class="block" data-key="next-week"><div class="block-head"><h2 class="block-title">Next week</h2><span class="block-meta">${fmtMD(nw)} – ${fmtMD(endOfWeek(nw))}</span></div>
    <div class="card">
      <p class="muted small">Three things for the week. They stay on Plan all week.</p>
      <ol class="plan-three">${[0, 1, 2].map((i) => html`<li data-key="wk-${i}"><span class="tnum">${i + 1}</span>
        <input class="plan-three-input" value="${plan[i] || ''}" data-change="wk-plan" data-i="${i}" placeholder="${['The one that matters most', 'Second', 'Third'][i]}" aria-label="Next week, thing ${i + 1}" maxlength="140"></li>`)}</ol>
      <button type="button" class="btn btn--soft btn--sm" data-action="wk-monday">Make the first one Monday’s priority</button>
      <div class="wk-obstacle">
        <label class="field"><span class="field-label">What’s most likely to get in the way? <small>optional</small></span>
          <input class="input" value="${next.obstacle || ''}" data-change="wk-ob" data-f="obstacle" placeholder="e.g. A heavy week of client work" maxlength="100"></label>
        <label class="field"><span class="field-label">When it does, I will…</span>
          <input class="input" value="${next.ifThen || ''}" data-change="wk-ob" data-f="ifThen" placeholder="e.g. Do the first one before email" maxlength="100"></label>
      </div>
    </div>
  </section>`;
}

/** One change: the insights that apply now, or your own words. */
function changeStep(r, ui, list) {
  const applied = r.applied?.id;
  return html`${list.length ? html`<ul class="pick-list" role="list">${list.map((i) => html`<li><button type="button" class="${cx('pick', (ui.pick === i.id || applied === i.id) && 'is-on')}" data-action="rv-pick" data-id="${i.id}" aria-pressed="${ui.pick === i.id || applied === i.id}">
      <span class="pick-area">${i.area}</span><span class="pick-title">${i.action.label}</span><span class="pick-why">${i.title}. ${i.detail}</span></button></li>`)}</ul>`
    : html`<p class="quiet-line">No suggestions from your logs this week. Name your own.</p>`}
    ${applied ? html`<p class="notice">${icon('check', { size: 16 })} Applied: ${r.answers?.one}</p>` : ''}
    <label class="prompt prompt--key"><span class="prompt-q">${list.length ? 'Or in your own words' : 'Your one change'}</span>${answer('one', r, { placeholder: 'One change. Not five.' })}</label>`;
}

function guided(ws, r, ui) {
  const i = Math.min(ui.step || 0, STEPS.length - 1);
  const [step, q] = STEPS[i];
  const last = i === STEPS.length - 1;
  let body = '';
  if (step === 'week') {
    const w = S.week(weekEnd(ws));
    const f = weekFacts(ws);
    body = html`<p class="review-sentence">${S.sentence(w)}</p>
      <dl class="facts facts--plain">
        <div><dt>Plan done</dt><dd>${w.ratio != null ? `${Math.round(w.ratio * 100)}%` : '—'}${w.ghost != null ? ` · ${Math.round(w.ghost * 100)}% the week before` : ''}</dd></div>
        <div><dt>Days sealed</dt><dd>${w.sealed} of ${w.elapsed}</dd></div>
        <div><dt>Training</dt><dd>${f.training.sessions} sessions</dd></div>
        <div><dt>Weight</dt><dd>${f.weight.change != null ? `${kg(f.weight.change)} (7-day avg)` : '—'}</dd></div>
        <div><dt>Sleep</dt><dd>${f.sleep.avg != null ? `${num(f.sleep.avg, 1)} h a night` : '—'}</dd></div>
      </dl>
      <div><p class="form-label">Business check <small>optional</small></p>
        <div class="weekly-chips">${BUSINESS.map((b) => html`<button type="button" class="${cx('wchip', r.business?.[b] && 'is-done')}" data-action="biz" data-k="${b}" aria-pressed="${!!r.business?.[b]}">${icon(r.business?.[b] ? 'check' : 'circle', { size: 14 })}<span>${b}</span></button>`)}</div></div>`;
  } else if (step === 'well') {
    body = html`${facts(weekHighlights(ws).well, 'Nothing stood out in the logs. A quiet week still counts.')}
      <label class="prompt"><span class="prompt-q">Anything else that worked?</span>${answer('worked', r, { placeholder: 'Optional' })}</label>`;
  } else if (step === 'slipped') {
    body = html`${facts(weekHighlights(ws).slip, 'Nothing slipped in the logs. Well done.')}
      <label class="prompt"><span class="prompt-q">What got in the way?</span>${answer('didnt', r, { placeholder: 'Optional' })}</label>`;
  } else if (step === 'change') {
    body = changeStep(r, ui, ui.suggestions || []);
  } else {
    body = nextWeek(ws);
  }
  const primary = step === 'change' && ui.pick && r.applied?.id !== ui.pick ? 'Apply and continue' : last ? (r.completedAt ? 'Update review' : 'Complete review') : 'Next';
  return html`<div class="guide" data-key="guide-${step}" data-step="${step}">
    <div class="ritual-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${i + 1}" aria-label="Step ${i + 1} of ${STEPS.length}">
      ${STEPS.map((x, j) => html`<span class="${cx(j < i && 'is-done', j === i && 'is-now')}"></span>`)}</div>
    <h2 class="guide-q" tabindex="-1">${q}</h2>
    <div class="guide-body">${body}</div>
    <div class="ritual-foot guide-foot">
      ${i > 0 ? html`<button type="button" class="link-btn" data-action="rv-back">Back</button>` : html`<span></span>`}
      <span class="ritual-go">${!last ? html`<button type="button" class="btn btn--ghost" data-action="rv-skip">Skip</button>` : ''}
        <button type="button" class="btn btn--primary" data-action="${last ? 'complete' : 'rv-next'}">${primary}</button></span>
    </div>
  </div>
  <button type="button" class="link-btn block" data-action="rv-all">See it all on one page</button>`;
}

/** Days since the last backup (Infinity when there has never been one). */
const backupAge = () => { const at = store.settings().lastBackupAt; return at ? Math.floor((Date.now() - Date.parse(at)) / 864e5) : Infinity; };

/** After the review: a backup when the last one is more than two weeks old. */
function backupNudge() {
  const age = backupAge();
  if (age <= 14) return '';
  return html`<div class="notice notice--action" data-key="backup-nudge">${icon('hard-drive-download', { size: 16 })}
    <span>${age === Infinity ? 'No backup yet.' : `Your last backup was ${age} days ago.`} One file keeps all of this safe if the phone is lost.</span>
    <button type="button" class="btn btn--soft btn--sm" data-action="rv-backup">Save a backup</button></div>`;
}

function full(ws, r) {
  const f = weekFacts(ws);
  const ins = weeklyInsights(ws);
  const sections = [
    ['Body', 'activity', [
      ['Weight trend', f.weight.change != null ? `${kg(f.weight.change)} (7-day avg)` : '—'],
      ['Waist', f.waist.latest != null ? `${num(cmOut(f.waist.latest), 1)} ${lengthUnit()}${f.waist.change != null ? ` · ${signed(cmOut(f.waist.change), 1)}` : ''}` : 'Not measured'],
      ['Steps', f.steps != null ? `${num(f.steps)} a day` : '—'],
      ['Training', `${f.training.sessions} sessions · ${f.training.improved} with progression`],
      ['Protein', f.protein.avg != null ? `${num(f.protein.avg)} g avg · ${f.protein.hitDays}/${f.protein.logged} days on target` : '—'],
      ['Sleep', f.sleep.avg != null ? `${num(f.sleep.avg, 1)} h avg${f.sleep.short ? ` · ${f.sleep.short} short nights` : ''}` : '—']]],
    ['Mind', 'book-open', [['Reading', `${num(f.reading)} min`], ['Learning', `${num(f.learning)} min`], ['Meditation', `${num(f.meditation)} min`]]],
    ['Spirit', 'sparkle', [['Prayer', `${f.prayer} of ${f.days} days`], ['Scripture', `${f.scripture} of ${f.days} days`], ['Church', f.church ? 'Yes' : 'Not this week']]],
    ['Relationships', 'heart', [['Fiancée', `${f.fiancee} of ${f.days} days`], ['Son', f.son ? `${f.son}×` : '—'], ['Family', f.family ? `${f.family}×` : '—'], ['Couple time', f.couple ? 'Yes' : '—']]],
    ['Work', 'briefcase', [['Priorities', f.priorities.set ? `${f.priorities.done} of ${f.priorities.set} done` : '—'], ['Focus blocks', `${f.deepWork}`], ['Wins', f.wins.length ? f.wins.map((w) => w.text).join(' · ') : '—']]],
  ];
  return html`
    ${r.completedAt ? html`<div class="notice">${icon('check', { size: 16 })} Completed ${dayInline(dayAt(r.completedAt))}. You can still edit it.</div>${backupNudge()}` : html`<p class="lead">Everything on one page. The guided review takes about three minutes.</p>`}
    <div class="review-grid">${sections.map(([title, ic, rows]) => html`<section class="card review-sec">
      <p class="section-label">${icon(ic, { size: 13 })} ${title}</p>
      <dl class="facts facts--plain">${rows.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></section>`)}</div>
    ${ins.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">What the data says</h2></div>
      <div class="card"><ul class="insight-list">${ins.map((i) => html`<li><span class="insight-area">${i.area}</span><span>${i.text}</span></li>`)}</ul></div></section>` : ''}
    <section class="block"><div class="block-head"><h2 class="block-title">Business check</h2><span class="block-meta">${Object.values(r.business || {}).filter(Boolean).length}/${BUSINESS.length}</span></div>
      <div class="weekly-chips">${BUSINESS.map((b) => html`<button type="button" class="${cx('wchip', r.business?.[b] && 'is-done')}" data-action="biz" data-k="${b}" aria-pressed="${!!r.business?.[b]}">${icon(r.business?.[b] ? 'check' : 'circle', { size: 14 })}<span>${b}</span></button>`)}</div>
    </section>
    <section class="block"><div class="block-head"><h2 class="block-title">Reflect</h2></div>
      <div class="journal-form">${QUESTIONS.map(([k, q]) => html`<label class="${cx('prompt', k === 'one' && 'prompt--key')}"><span class="prompt-q">${q}</span>
        ${answer(k, r, { placeholder: k === 'one' ? 'One change. Not five.' : '' })}</label>`)}</div>
    </section>
    ${nextWeek(ws)}
    <button type="button" class="btn ${r.completedAt ? 'btn--soft' : 'btn--primary'} btn--block block" data-action="complete">${r.completedAt ? 'Update review' : 'Complete review'}</button>`;
}

/** Collect what's typed on screen (the guided step or the full page) into the review. */
function collect(ws) {
  flush(ws);
  const cur = reviewOf(ws);
  const answers = { ...(cur.answers || {}) };
  document.querySelectorAll('[data-view="review-week"] textarea[data-k]').forEach((t) => { answers[t.dataset.k] = t.value; });
  return { ...cur, answers };
}

function go(ui, d) {
  ui.step = Math.max(0, Math.min(STEPS.length - 1, (ui.step || 0) + d));
  app.refresh();
  requestAnimationFrame(() => document.querySelector('.guide-q')?.focus({ preventScroll: true }));
}

export default {
  id: 'review-week',
  title: 'Weekly review',
  render({ params, ui }) {
    const ws = weekOf(params);
    const r = reviewOf(ws);
    const isCurrent = ws === startOfWeek(today());
    const showAll = ui.all || (r.completedAt && !ui.guided);
    return html`
      ${pageHead({ title: 'Weekly review', eyebrow: `${fmtMD(ws)} – ${fmtMD(endOfWeek(ws))}${isCurrent ? ' · this week' : ''}`, back: { to: 'reflect', label: 'Reflect' },
        actions: html`<div class="seg-mini"><button type="button" class="icon-btn icon-btn--sm" data-action="week" data-delta="-7" aria-label="Previous week">${icon('chevron-left', { size: 18 })}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-action="week" data-delta="7" aria-label="Next week" ${ws >= startOfWeek(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button></div>` })}
      ${showAll ? full(ws, r) : guided(ws, r, ui)}
      ${showAll && !r.completedAt ? html`<button type="button" class="link-btn block" data-action="rv-guided">Back to the guided review</button>` : ''}
      ${showAll && r.completedAt ? html`<button type="button" class="link-btn block" data-action="rv-guided">Go through it step by step</button>` : ''}`;
  },
  // Whatever is still waiting to save goes in when you leave a field or the review.
  unmount() { saving.now(); },
  async mount(el, { ui }) {
    el.addEventListener('focusout', () => saving.now());
    // The suggestions for the one change are worked out once per visit, so applying one doesn't reshuffle the list.
    if (!ui.suggestions) {
      const I = await import('../domain/insights.js');
      ui.suggestions = I.insights(today(), { limit: 3 });
      ui.insights = I;
      if (ui.step === 3) app.refresh();
    }
  },
  inputs: {
    // Next week's three: kept on next week's review record, shown on Plan all week.
    'wk-plan': ({ el, value, params }) => {
      const nw = addDays(weekOf(params), 7);
      const cur = store.get('weeklyReviews', nw) || { id: nw, weekStart: nw };
      const plan = [...(cur.plan || ['', '', ''])];
      plan[Number(el.dataset.i)] = value.trim();
      store.put('weeklyReviews', { ...cur, id: nw, weekStart: nw, plan });
    },
    // ...and the obstacle to plan for (13f), on the same record.
    'wk-ob': ({ el, value, params }) => {
      const nw = addDays(weekOf(params), 7);
      const cur = store.get('weeklyReviews', nw) || { id: nw, weekStart: nw };
      store.put('weeklyReviews', { ...cur, id: nw, weekStart: nw, [el.dataset.f]: value.trim() || null });
    },
    answer: ({ el, value, params }) => {
      const ws = weekOf(params);
      saveLater(ws, (cur) => ({ answers: { ...(cur.answers || {}), [el.dataset.k]: value } }));
    },
  },
  actions: {
    'rv-next': async ({ params, ui }) => {
      const ws = weekOf(params);
      store.put('weeklyReviews', collect(ws));
      const pick = ui.step === 3 && ui.pick && (ui.suggestions || []).find((i) => i.id === ui.pick);
      if (pick && reviewOf(ws).applied?.id !== pick.id) {
        const undo = ui.insights.apply(pick);
        const cur = reviewOf(ws);
        store.put('weeklyReviews', { ...cur, answers: { ...(cur.answers || {}), one: pick.action.label }, applied: { id: pick.id, on: today() } });
        hap.success();
        app.toast(pick.action.done, { icon: 'check', action: { label: 'Undo', fn: () => { undo(); const c = reviewOf(ws); store.put('weeklyReviews', { ...c, applied: null }); } } });
      } else hap.tap();
      go(ui, 1);
    },
    'rv-skip': ({ ui }) => { hap.tap(); go(ui, 1); },
    'rv-backup': async () => {
      try {
        const { buildBackup, saveFile } = await import('../data/backup.js');
        const res = await saveFile(`life-os-backup-${today()}.json`, JSON.stringify(await buildBackup({ includePhotos: false })));
        if (res !== 'cancelled') { store.setSettings({ lastBackupAt: new Date().toISOString() }); hap.success(); app.toast('Backup saved', { icon: 'check' }); }
      } catch (err) {
        console.error(err);
        app.toast('Couldn’t create the backup. Your data is untouched. Try again.', { tone: 'danger' });
      }
    },
    'rv-back': ({ params, ui }) => { store.put('weeklyReviews', collect(weekOf(params))); go(ui, -1); },
    'rv-pick': ({ data, ui }) => { ui.pick = ui.pick === data.id ? null : data.id; hap.tap(); app.refresh(); },
    'rv-all': ({ params, ui }) => { store.put('weeklyReviews', collect(weekOf(params))); ui.all = true; ui.guided = false; app.refresh(); },
    'rv-guided': ({ ui }) => { ui.all = false; ui.guided = true; ui.step = 0; app.refresh(); },
    'wk-monday': ({ params }) => {
      const nw = addDays(weekOf(params), 7);
      const first = (store.get('weeklyReviews', nw)?.plan || []).find(Boolean);
      if (!first) { app.toast('Write next week’s first thing above.'); return; }
      T.setPriority(nw, 0, first);
      hap.success();
      app.toast(`Monday starts with: ${first}`, { icon: 'check' });
    },
    week: ({ data, params, ui }) => {
      const ws = weekOf(params);
      const next = addDays(ws, Number(data.delta));
      if (next > startOfWeek(today())) return;
      Object.assign(ui, { step: 0, pick: null, all: false, guided: false });
      app.replace(`reflect/review/week/${next}`);
    },
    biz: ({ data, params }) => {
      const ws = weekOf(params);
      const cur = reviewOf(ws);
      store.put('weeklyReviews', { ...cur, business: { ...(cur.business || {}), [data.k]: !cur.business?.[data.k] } });
      hap.tap();
    },
    complete: async ({ params, ui }) => {
      const ws = weekOf(params);
      await new Promise((r) => setTimeout(r, 0));
      const cur = collect(ws);
      const doneDate = ws === startOfWeek(today()) ? today() : endOfWeek(ws);
      const ops = [{ store: 'weeklyReviews', value: { ...cur, id: ws, weekStart: ws, completedAt: cur.completedAt || new Date().toISOString(), facts: weekFacts(ws), insights: weeklyInsights(ws) } }];
      const fin = H.habit('h-finance');
      if (fin && Object.values(cur.business || {}).filter(Boolean).length >= 4 && !H.isDone(fin, doneDate)) {
        ops.push({ store: 'habitLogs', value: { id: H.logId(fin.id, doneDate), habitId: fin.id, date: doneDate, value: 1, completed: true } });
      }
      const rh = H.habit('h-weekly-review');
      if (rh && !H.isDone(rh, doneDate) && H.dueOn(rh, doneDate)) ops.push({ store: 'habitLogs', value: { id: H.logId(rh.id, doneDate), habitId: rh.id, date: doneDate, value: 1, completed: true } });
      store.batch(ops);
      hap.success();
      ui.all = true; ui.guided = false;
      app.toast(cur.answers.one ? `Next week’s one change: ${cur.answers.one.slice(0, 60)}` : 'Weekly review saved', { icon: 'check' });
    },
  },
};
