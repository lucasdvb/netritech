import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { monthFacts } from '../domain/review-data.js';
import { today, monthKey, fmtMonth, addMonths, relativeDay } from '../domain/dates.js';
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

const timers = new Map();
function saveLater(id, patch) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => store.put('monthlyReviews', { ...(store.get('monthlyReviews', id) || { id }), ...patch(store.get('monthlyReviews', id) || {}) }), 400));
}

export default {
  id: 'review-month',
  title: 'Monthly review',
  render({ params }) {
    const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthKey(today());
    const r = store.get('monthlyReviews', month) || {};
    const f = monthFacts(month);
    const weeks = Math.max(1, f.days / 7);
    const tiles = [
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
    return html`
      ${pageHead({ title: fmtMonth(`${month}-01`), eyebrow: 'Monthly review', back: { to: 'more/reviews', label: 'Reviews' },
        actions: html`<div class="seg-mini"><button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="-1" aria-label="Previous month">${icon('chevron-left', { size: 18 })}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="1" aria-label="Next month" ${month >= monthKey(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button></div>` })}
      ${r.completedAt ? html`<div class="notice">${icon('check', { size: 16 })} Completed ${relativeDay(r.completedAt.slice(0, 10)).toLowerCase()}.</div>` : ''}
      <div class="report-grid">${tiles.map(([k, v, s]) => html`<div class="report-tile"><p class="stat-label">${k}</p><p class="report-val tnum">${v}</p><p class="stat-sub">${s}</p></div>`)}</div>
      ${f.books.length ? html`<p class="quiet-line">${icon('book-open', { size: 15 })} ${f.books.join(' · ')}</p>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Business</h2></div>
        <div class="grid-2">${BUSINESS.map(([k, label]) => html`<label class="field"><span class="field-label">${label}</span><input class="input" value="${r.business?.[k] || ''}" data-input="biz" data-k="${k}" placeholder="—"></label>`)}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Reflect</h2></div>
        <div class="journal-form">${QUESTIONS.map(([k, q]) => html`<label class="${cx('prompt', k === 'focus' && 'prompt--key')}"><span class="prompt-q">${q}</span>
          <textarea class="prompt-a" rows="2" data-input="answer" data-k="${k}">${r.answers?.[k] || r[k] || ''}</textarea></label>`)}</div>
      </section>
      <button type="button" class="btn ${r.completedAt ? 'btn--soft' : 'btn--primary'} btn--block block" data-action="complete">${r.completedAt ? 'Update review' : 'Complete review'}</button>`;
  },
  inputs: {
    answer: ({ el, value, params }) => {
      const m = params.month || monthKey(today());
      saveLater(m, (cur) => ({ answers: { ...(cur.answers || {}), [el.dataset.k]: value }, ...(el.dataset.k === 'spirit' ? { spirit: value } : {}) }));
    },
    biz: ({ el, value, params }) => {
      const m = params.month || monthKey(today());
      saveLater(m, (cur) => ({ business: { ...(cur.business || {}), [el.dataset.k]: value } }));
    },
  },
  actions: {
    month: ({ data, params }) => {
      const m = params.month || monthKey(today());
      const next = monthKey(addMonths(`${m}-01`, Number(data.delta)));
      if (next > monthKey(today())) return;
      app.replace(`more/review/month/${next}`);
    },
    complete: async ({ params }) => {
      const m = params.month || monthKey(today());
      clearTimeout(timers.get(m));
      const answers = {};
      document.querySelectorAll('textarea[data-k]').forEach((t) => { answers[t.dataset.k] = t.value; });
      const business = {};
      document.querySelectorAll('input[data-input="biz"]').forEach((t) => { business[t.dataset.k] = t.value; });
      const cur = store.get('monthlyReviews', m) || { id: m };
      store.put('monthlyReviews', { ...cur, id: m, month: m, answers, business, spirit: answers.spirit, completedAt: cur.completedAt || new Date().toISOString(), facts: monthFacts(m) });
      hap.success();
      app.toast(answers.focus ? `Next month: ${answers.focus.slice(0, 60)}` : 'Monthly review saved', { icon: 'check' });
    },
  },
};
