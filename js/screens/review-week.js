import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as T from '../domain/tasks.js';
import { weekFacts } from '../domain/review-data.js';
import { weeklyInsights } from '../domain/coach.js';
import { today, startOfWeek, endOfWeek, addDays, fmtMD, weekday, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, check } from '../ui/components.js';
import { num, pct, signed, kgOut, weightUnit, cmOut, lengthUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export const QUESTIONS = [
  ['worked', 'What worked?'], ['didnt', 'What didn’t?'], ['drained', 'What drained me?'], ['energy', 'What gave me energy?'],
  ['stop', 'What should I stop?'], ['start', 'What should I start?'], ['one', 'What is the ONE change for next week?'],
];
const BUSINESS = ['Revenue', 'Pipeline', 'Sales activity', 'Client delivery', 'Marketing', 'Cash flow', 'Outstanding tasks', 'Strategic priority'];

export function defaultWeek() {
  const cur = startOfWeek(today());
  const prev = addDays(cur, -7);
  if (weekday(today()) <= 3 && !store.get('weeklyReviews', prev)?.completedAt && prev >= startOfWeek(H.trackingStart())) return prev;
  return cur;
}

const timers = new Map();
function saveLater(id, patch) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => store.put('weeklyReviews', { ...(store.get('weeklyReviews', id) || { id, weekStart: id }), ...patch(store.get('weeklyReviews', id) || {}) }), 400));
}

// Resolve the week once per visit so completing last week's review doesn't flip the screen to this week.
const weekOf = (params) => (params.date ? startOfWeek(params.date) : (params.date = defaultWeek()));

const kg = (v) => (v == null ? '—' : `${signed(kgOut(v), 1)} ${weightUnit()}`);

/** Planning the week ahead inside the review: three things, the first one onto Monday. */
function nextWeek(ws) {
  const nw = addDays(ws, 7);
  const plan = store.get('weeklyReviews', nw)?.plan || [];
  return html`<section class="block" data-key="next-week"><div class="block-head"><h2 class="block-title">Next week</h2><span class="block-meta">${fmtMD(nw)} – ${fmtMD(endOfWeek(nw))}</span></div>
    <div class="card">
      <p class="muted small">Three things for the week. They stay on Plan all week.</p>
      <ol class="plan-three">${[0, 1, 2].map((i) => html`<li data-key="wk-${i}"><span class="tnum">${i + 1}</span>
        <input class="plan-three-input" value="${plan[i] || ''}" data-change="wk-plan" data-i="${i}" placeholder="${['The one that matters most', 'Second', 'Third'][i]}" aria-label="Next week, thing ${i + 1}" maxlength="140"></li>`)}</ol>
      <button type="button" class="btn btn--soft btn--sm" data-action="wk-monday">Make the first one Monday’s priority</button>
    </div>
  </section>`;
}

export default {
  id: 'review-week',
  title: 'Weekly review',
  render({ params }) {
    const ws = weekOf(params);
    const r = store.get('weeklyReviews', ws) || {};
    const f = weekFacts(ws);
    const ins = weeklyInsights(ws);
    const isCurrent = ws === startOfWeek(today());
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
      ${pageHead({ title: 'Weekly review', eyebrow: `${fmtMD(ws)} – ${fmtMD(endOfWeek(ws))}${isCurrent ? ' · this week' : ''}`, back: { to: 'reflect/reviews', label: 'Reviews' },
        actions: html`<div class="seg-mini"><button type="button" class="icon-btn icon-btn--sm" data-action="week" data-delta="-7" aria-label="Previous week">${icon('chevron-left', { size: 18 })}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-action="week" data-delta="7" aria-label="Next week" ${ws >= startOfWeek(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button></div>` })}
      ${r.completedAt ? html`<div class="notice">${icon('check', { size: 16 })} Completed ${relativeDay(r.completedAt.slice(0, 10)).toLowerCase()}. You can still edit it.</div>` : html`<p class="lead">15–30 minutes. Look at what happened, then choose one change. Only one.</p>`}
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
          <textarea class="prompt-a" rows="2" data-input="answer" data-k="${k}" placeholder="${k === 'one' ? 'One change. Not five.' : ''}">${r.answers?.[k] || ''}</textarea></label>`)}</div>
      </section>
      ${nextWeek(ws)}
      <button type="button" class="btn ${r.completedAt ? 'btn--soft' : 'btn--primary'} btn--block block" data-action="complete">${r.completedAt ? 'Update review' : 'Complete review'}</button>`;
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
    answer: ({ el, value, params }) => {
      const ws = weekOf(params);
      saveLater(ws, (cur) => ({ answers: { ...(cur.answers || {}), [el.dataset.k]: value } }));
    },
  },
  actions: {
    'wk-monday': ({ params }) => {
      const nw = addDays(weekOf(params), 7);
      const first = (store.get('weeklyReviews', nw)?.plan || []).find(Boolean);
      if (!first) { app.toast('Write next week’s first thing above.'); return; }
      T.setPriority(nw, 0, first);
      hap.success();
      app.toast(`Monday starts with: ${first}`, { icon: 'check' });
    },
    week: ({ data, params }) => {
      const ws = weekOf(params);
      const next = addDays(ws, Number(data.delta));
      if (next > startOfWeek(today())) return;
      app.replace(`reflect/review/week/${next}`);
    },
    biz: ({ data, params }) => {
      const ws = weekOf(params);
      const cur = store.get('weeklyReviews', ws) || { id: ws, weekStart: ws };
      store.put('weeklyReviews', { ...cur, business: { ...(cur.business || {}), [data.k]: !cur.business?.[data.k] } });
      hap.tap();
    },
    complete: async ({ params }) => {
      const ws = weekOf(params);
      clearTimeout(timers.get(ws));
      await new Promise((r) => setTimeout(r, 0));
      const area = document.querySelectorAll('textarea[data-k]');
      const answers = {};
      area.forEach((t) => { answers[t.dataset.k] = t.value; });
      const cur = store.get('weeklyReviews', ws) || { id: ws, weekStart: ws };
      const doneDate = ws === startOfWeek(today()) ? today() : endOfWeek(ws);
      const ops = [{ store: 'weeklyReviews', value: { ...cur, id: ws, weekStart: ws, answers, completedAt: cur.completedAt || new Date().toISOString(), facts: weekFacts(ws), insights: weeklyInsights(ws) } }];
      const fin = H.habit('h-finance');
      if (fin && Object.values(cur.business || {}).filter(Boolean).length >= 4 && !H.isDone(fin, doneDate)) {
        ops.push({ store: 'habitLogs', value: { id: H.logId(fin.id, doneDate), habitId: fin.id, date: doneDate, value: 1, completed: true } });
      }
      store.batch(ops);
      hap.success();
      app.toast(answers.one ? `Next week’s one change: ${answers.one.slice(0, 60)}` : 'Weekly review saved', { icon: 'check' });
    },
  },
};
