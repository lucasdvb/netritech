// The monthly review as a guided flow: the month in numbers, then one question per screen (win and
// problem, stop · start · continue, who you're becoming, the business numbers) and next month's
// focus. "See it all" shows everything on one page, as does a finished review.
import * as store from '../data/store.js';
import { saver, applyPatches } from '../ui/save-later.js';
import * as H from '../domain/habits-more.js';
import * as HS from '../domain/habit-system.js';
import { monthFacts } from '../domain/review-data.js';
import { today, monthKey, fmtMonth, addMonths, dayAt, dayInline } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { num, pct, signed, kgOut, weightUnit, cmOut, lengthUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const QUESTIONS = [
  ['win', 'Biggest win'], ['problem', 'Biggest problem'], ['worked', 'What worked?'], ['didnt', 'What didn’t?'],
  ['stop', 'What should I stop doing?'], ['start', 'What should I start doing?'], ['continue', 'What should I continue?'],
  ['spirit', 'Am I becoming more disciplined, loving, truthful, patient and useful?'], ['focus', 'Next month’s focus'],
];
const BUSINESS = [['revenue', 'Revenue'], ['profit', 'Profit'], ['expenses', 'Expenses'], ['clients', 'New clients'], ['retention', 'Retention']];
const STEPS = [
  ['numbers', 'The month in numbers', []], ['auto', 'Does it feel automatic?', []], ['high', 'The high and the low', ['win', 'problem']], ['ssc', 'Stop · start · continue', ['stop', 'start', 'continue']],
  ['spirit', 'Who you’re becoming', ['spirit']], ['business', 'The business', []], ['focus', 'Next month’s focus', ['focus']],
];

const saving = saver((id, patches) => store.put('monthlyReviews', applyPatches(store.get('monthlyReviews', id) || { id }, patches)), 400);
const saveLater = (id, patch) => saving.later(id, patch);
const monthOf = (params) => (params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthKey(today()));
const reviewOf = (m) => store.get('monthlyReviews', m) || { id: m };
const question = (k) => QUESTIONS.find(([q]) => q === k)[1];
const prompt = (k, r) => html`<label class="${cx('prompt', k === 'focus' && 'prompt--key')}"><span class="prompt-q">${question(k)}</span>
  <textarea class="prompt-a" rows="2" data-input="answer" data-k="${k}">${r.answers?.[k] || r[k] || ''}</textarea></label>`;

function tiles(f) {
  const weeks = Math.max(1, f.days / 7);
  const list = [
    ['Weight change', f.weight.change != null ? `${signed(kgOut(f.weight.change), 1)} ${weightUnit()}` : '—', '7-day average'],
    ['Waist', f.waist.change != null ? `${signed(cmOut(f.waist.change), 1)} ${lengthUnit()}` : f.waist.latest != null ? `${num(cmOut(f.waist.latest), 1)} ${lengthUnit()}` : '—', 'since last measure'],
    ['Workouts', `${f.training.sessions}`, `${pct(Math.min(1, f.training.strength / (4 * weeks)))} of strength plan`],
    ['Protein', f.protein.logged ? `${pct(f.protein.hitDays / f.protein.logged)}` : '—', `days on target · avg ${num(f.protein.avg)} g`],
    ['Steps', f.steps != null ? num(f.steps) : '—', 'daily average'],
    ['Sleep', f.sleep.avg != null ? `${num(f.sleep.avg, 1)} h` : '—', 'average'],
    ['Habit consistency', pct(f.consistency), 'foundation score'],
    ['Reading', `${num(f.reading)} min`, f.books.length ? `${f.books.length} book${f.books.length === 1 ? '' : 's'} finished` : 'no books finished'],
    ['Learning', `${num(f.learning)} min`, ''],
    ['Prayer', f.days ? pct(f.prayer / f.days) : '—', `of days · church ${f.church}×`],
    ['Fiancée', f.days ? pct(f.fiancee / f.days) : '—', `of days · ${f.couple} couple time`],
    ['Son · family', `${f.son} · ${f.family}`, 'moments'],
  ];
  return html`<div class="report-grid">${list.map(([k, v, s]) => html`<div class="report-tile"><p class="stat-label">${k}</p><p class="report-val tnum">${v}</p><p class="stat-sub">${s}</p></div>`)}</div>
    ${f.books.length ? html`<p class="quiet-line">${icon('book-open', { size: 15 })} ${f.books.join(' · ')}</p>` : ''}`;
}

/** Focus habits close to automatic: four quick questions each (13b). */
function autoStep() {
  const focus = H.focusHabits();
  const due = focus.filter((h) => HS.autoDue(h));
  const asked = focus.filter((h) => !due.includes(h) && H.autoScore(h) != null);
  if (!due.length && !asked.length) return html`<p class="sheet-note">Nothing to ask this month. A habit is asked once it’s been in focus for three weeks and is getting strong.</p>`;
  return html`<p class="sheet-note">Four quick questions per habit. When one feels automatic, its reminders fade and it can move to autopilot, so the slot goes to the next habit.</p>
    <ul class="list">${[...due, ...asked].map((h) => html`<li class="row" data-key="auto-${h.id}"><span class="row-main"><span class="row-title">${h.name}</span>
      <span class="row-sub">${H.autoScore(h) != null ? `${H.autoScore(h)} of 5 · ${H.feelsAutomatic(h) ? 'feels automatic' : 'not yet'}` : `Strength ${H.strength(h)}%`}</span></span>
      ${due.includes(h) ? html`<button type="button" class="btn btn--soft btn--sm" data-action="auto-check" data-id="${h.id}">Ask</button>` : ''}</li>`)}</ul>`;
}

const business = (r) => html`<div class="grid-2">${BUSINESS.map(([k, label]) => html`<label class="field"><span class="field-label">${label}</span><input class="input" value="${r.business?.[k] || ''}" data-input="biz" data-k="${k}" placeholder="—"></label>`)}</div>`;

function guided(m, r, f, ui) {
  const i = Math.min(ui.step || 0, STEPS.length - 1);
  const [step, q, keys] = STEPS[i];
  const last = i === STEPS.length - 1;
  const body = step === 'numbers' ? tiles(f) : step === 'auto' ? autoStep() : step === 'business' ? business(r) : html`<div class="journal-form">${keys.map((k) => prompt(k, r))}</div>`;
  return html`<div class="guide" data-key="guide-${step}" data-step="${step}">
    <div class="ritual-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${i + 1}" aria-label="Step ${i + 1} of ${STEPS.length}">
      ${STEPS.map((x, j) => html`<span class="${cx(j < i && 'is-done', j === i && 'is-now')}"></span>`)}</div>
    <h2 class="guide-q" tabindex="-1">${q}</h2>
    <div class="guide-body">${body}</div>
    <div class="ritual-foot guide-foot">
      ${i > 0 ? html`<button type="button" class="link-btn" data-action="rv-back">Back</button>` : html`<span></span>`}
      <span class="ritual-go">${!last ? html`<button type="button" class="btn btn--ghost" data-action="rv-skip">Skip</button>` : ''}
        <button type="button" class="btn btn--primary" data-action="${last ? 'complete' : 'rv-next'}">${last ? (r.completedAt ? 'Update review' : 'Complete review') : 'Next'}</button></span>
    </div>
  </div>
  <button type="button" class="link-btn block" data-action="rv-all">See it all on one page</button>`;
}

function full(r, f) {
  return html`${r.completedAt ? html`<div class="notice">${icon('check', { size: 16 })} Completed ${dayInline(dayAt(r.completedAt))}.</div>` : ''}
    ${tiles(f)}
    <section class="block"><div class="block-head"><h2 class="block-title">Business</h2></div>${business(r)}</section>
    <section class="block"><div class="block-head"><h2 class="block-title">Reflect</h2></div>
      <div class="journal-form">${QUESTIONS.map(([k]) => prompt(k, r))}</div></section>
    <button type="button" class="btn ${r.completedAt ? 'btn--soft' : 'btn--primary'} btn--block block" data-action="complete">${r.completedAt ? 'Update review' : 'Complete review'}</button>`;
}

/** Everything typed on screen, merged into the review. */
function collect(m) {
  saving.now(m);
  const cur = reviewOf(m);
  const answers = { ...(cur.answers || {}) };
  const biz = { ...(cur.business || {}) };
  document.querySelectorAll('[data-view="review-month"] textarea[data-k]').forEach((t) => { answers[t.dataset.k] = t.value; });
  document.querySelectorAll('[data-view="review-month"] input[data-input="biz"]').forEach((t) => { biz[t.dataset.k] = t.value; });
  return { ...cur, id: m, month: m, answers, business: biz, spirit: answers.spirit ?? cur.spirit };
}

function go(ui, d) {
  ui.step = Math.max(0, Math.min(STEPS.length - 1, (ui.step || 0) + d));
  app.refresh();
  requestAnimationFrame(() => document.querySelector('.guide-q')?.focus({ preventScroll: true }));
}

export default {
  id: 'review-month',
  title: 'Monthly review',
  render({ params, ui }) {
    const month = monthOf(params);
    const r = reviewOf(month);
    const f = monthFacts(month);
    const showAll = ui.all || (r.completedAt && !ui.guided);
    return html`
      ${pageHead({ title: fmtMonth(`${month}-01`), eyebrow: 'Monthly review', back: { to: 'reflect', label: 'Reflect' },
        actions: html`<div class="seg-mini"><button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="-1" aria-label="Previous month">${icon('chevron-left', { size: 18 })}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="1" aria-label="Next month" ${month >= monthKey(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button></div>` })}
      ${showAll ? full(r, f) : guided(month, r, f, ui)}
      ${showAll ? html`<button type="button" class="link-btn block" data-action="rv-guided">${r.completedAt ? 'Go through it step by step' : 'Back to the guided review'}</button>` : ''}`;
  },
  // Whatever is still waiting to save goes in when you leave a field or the review.
  mount(el) { el.addEventListener('focusout', () => saving.now()); },
  unmount() { saving.now(); },
  inputs: {
    answer: ({ el, value, params }) => {
      saveLater(monthOf(params), (cur) => ({ answers: { ...(cur.answers || {}), [el.dataset.k]: value }, ...(el.dataset.k === 'spirit' ? { spirit: value } : {}) }));
    },
    biz: ({ el, value, params }) => {
      saveLater(monthOf(params), (cur) => ({ business: { ...(cur.business || {}), [el.dataset.k]: value } }));
    },
  },
  actions: {
    'auto-check': async ({ data }) => { const h = H.habit(data.id); if (h) (await import('./auto-check.js')).openAutoCheck(h, { onDone: () => app.refresh() }); },
    'rv-next': ({ params, ui }) => { store.put('monthlyReviews', collect(monthOf(params))); hap.tap(); go(ui, 1); },
    'rv-skip': ({ ui }) => { hap.tap(); go(ui, 1); },
    'rv-back': ({ params, ui }) => { store.put('monthlyReviews', collect(monthOf(params))); go(ui, -1); },
    'rv-all': ({ params, ui }) => { store.put('monthlyReviews', collect(monthOf(params))); ui.all = true; ui.guided = false; app.refresh(); },
    'rv-guided': ({ ui }) => { ui.all = false; ui.guided = true; ui.step = 0; app.refresh(); },
    month: ({ data, params, ui }) => {
      const next = monthKey(addMonths(`${monthOf(params)}-01`, Number(data.delta)));
      if (next > monthKey(today())) return;
      Object.assign(ui, { step: 0, all: false, guided: false });
      app.replace(`reflect/review/month/${next}`);
    },
    complete: ({ params, ui }) => {
      const m = monthOf(params);
      const cur = collect(m);
      store.put('monthlyReviews', { ...cur, completedAt: cur.completedAt || new Date().toISOString(), facts: monthFacts(m) });
      hap.success();
      ui.all = true; ui.guided = false;
      app.toast(cur.answers.focus ? `Next month: ${cur.answers.focus.slice(0, 60)}` : 'Monthly review saved', { icon: 'check',
        action: { label: 'Watch the month', fn: async () => { const [F, D] = await Promise.all([import('../ceremony/film.js'), import('../domain/film.js')]); F.playFilm(D.monthFilm(m)); } } });
    },
  },
};
