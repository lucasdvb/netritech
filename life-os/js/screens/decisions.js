// Review › Decisions: a decision journal. Write a decision down as you make it (what, the options,
// why, what you expect, how sure you are); three months later it comes back for a short review of
// what happened against what you expected, and the scorecard shows how your calls hold up.
import * as DC from '../domain/decisions.js';
import { today, fmtMD, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const SURE = ['', 'A guess', 'Unsure', 'Fairly sure', 'Sure', 'Certain'];

export function openDecision(id = null) {
  const cur = id ? DC.one(id) : null;
  app.sheet({
    title: cur ? 'Decision' : 'Write down a decision',
    size: 'tall',
    ui: { title: cur?.title || '', options: cur?.options || '', why: cur?.why || '', expect: cur?.expect || '', confidence: cur?.confidence || 3 },
    render: (s) => html`<form class="form" data-submit="dc-save">
      <label class="field"><span class="field-label">What did you decide?</span><input class="input" required maxlength="120" value="${s.ui.title}" data-input="dc-f" data-f="title" placeholder="Take the new role"></label>
      <label class="field"><span class="field-label">The options you weighed</span><textarea class="input" rows="2" data-input="dc-f" data-f="options" placeholder="Stay · move teams · the new role">${s.ui.options}</textarea></label>
      <label class="field"><span class="field-label">Why this one</span><textarea class="input" rows="3" data-input="dc-f" data-f="why" placeholder="What you know now, and what tipped it">${s.ui.why}</textarea></label>
      <label class="field"><span class="field-label">What you expect to happen</span><textarea class="input" rows="2" data-input="dc-f" data-f="expect" placeholder="In three months: …">${s.ui.expect}</textarea></label>
      <div class="field"><span class="field-label">How sure are you?</span>
        <div class="seg seg--wrap" role="radiogroup" aria-label="How sure are you?">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${s.ui.confidence === n}" data-action="dc-sure" data-n="${n}">${SURE[n]}</button>`)}</div></div>
      <p class="field-hint">It comes back for review on ${fmtMD(cur?.reviewOn || addMonths3())}.</p>
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Keep it'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="dc-delete">${icon('trash-2', { size: 16 })} Delete</button>` : ''}
    </form>`,
    inputs: { 'dc-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; } },
    actions: {
      'dc-sure': ({ data, sheet }) => { sheet.ui.confidence = Number(data.n); sheet.refresh(); },
      'dc-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.title.trim()) { app.toast('Name the decision.'); return; }
        DC.save(cur?.id || null, { title: u.title, options: u.options, why: u.why, expect: u.expect, confidence: u.confidence });
        hap.success();
        app.closeSheet(sheet);
        if (!cur) app.toast('Kept. It comes back in three months.', { icon: 'check' });
      },
      'dc-delete': ({ sheet }) => {
        const undo = DC.remove(cur.id);
        app.closeSheet(sheet);
        app.toast('Decision deleted', { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}
function addMonths3() {
  const d = new Date();
  d.setDate(d.getDate() + DC.REVIEW_AFTER);
  return d.toISOString().slice(0, 10);
}

export function openReview(id) {
  const d = DC.one(id);
  if (!d) return;
  app.sheet({
    title: 'Three months on',
    size: 'tall',
    ui: { outcome: d.review?.outcome || null, quality: d.review?.quality || null, learned: d.review?.learned || '' },
    render: (s) => html`<div class="form decision-review">
      <div class="card"><p class="section-label">${relativeDay(d.date) || fmtMD(d.date)} you decided</p><p class="card-title">${d.title}</p>
        ${d.why ? html`<p class="muted">Why: ${d.why}</p>` : ''}${d.expect ? html`<p class="muted">You expected: ${d.expect}</p>` : ''}
        <p class="muted small">You were ${SURE[d.confidence].toLowerCase()}.</p></div>
      <div class="field"><span class="field-label">How did it turn out?</span>
        <div class="seg seg--wrap" role="radiogroup" aria-label="How did it turn out?">${DC.OUTCOMES.map((o) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${s.ui.outcome === o.id}" data-action="dr-out" data-v="${o.id}">${o.label}</button>`)}</div></div>
      <div class="field"><span class="field-label">With what you knew then, was it a good decision?</span>
        <div class="seg seg--wrap" role="radiogroup" aria-label="Was it a good decision?">${DC.QUALITY.map((q) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${s.ui.quality === q.id}" data-action="dr-q" data-v="${q.id}">${q.label}</button>`)}</div>
        <span class="field-hint">A good decision can turn out badly, and a poor one well. Judge the reasons, not only the result.</span></div>
      <label class="field"><span class="field-label">What you’d keep for next time</span><textarea class="input" rows="3" data-input="dr-learned">${s.ui.learned}</textarea></label>
      <button type="button" class="btn btn--primary btn--block" data-action="dr-save" ${s.ui.outcome && s.ui.quality ? '' : 'disabled'}>Save the review</button>
      ${!d.review ? html`<button type="button" class="btn btn--ghost btn--block" data-action="dr-later">In two weeks</button>` : ''}
    </div>`,
    inputs: { 'dr-learned': ({ value, sheet }) => { sheet.ui.learned = value; } },
    actions: {
      'dr-out': ({ data, sheet }) => { sheet.ui.outcome = data.v; sheet.refresh(); },
      'dr-q': ({ data, sheet }) => { sheet.ui.quality = data.v; sheet.refresh(); },
      'dr-save': ({ sheet }) => {
        const undo = DC.review(id, sheet.ui);
        hap.success();
        app.closeSheet(sheet);
        app.toast('Reviewed', { icon: 'check', action: { label: 'Undo', fn: undo } });
      },
      'dr-later': ({ sheet }) => { const undo = DC.later(id); app.closeSheet(sheet); app.toast('Back in two weeks', { action: { label: 'Undo', fn: undo } }); },
    },
  });
}

export default {
  id: 'decisions',
  title: 'Decisions',
  render({ params }) {
    const list = DC.all();
    const due = DC.dueForReview();
    const sc = DC.scorecard();
    return html`
      ${pageHead({ title: 'Decisions', back: { to: 'review', label: 'Review' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="dc-new">${icon('plus', { size: 16 })} Add</button>`,
        info: 'Write a decision down when you make it: the options, why, what you expect and how sure you are. Three months later it comes back so you can compare what happened with what you expected, and learn from the reasoning rather than only the result.' })}
      ${due.length ? html`<section class="card decision-due" data-key="dc-due"><p class="section-label">Ready for review</p>
        ${due.map((d) => html`<button type="button" class="row" data-action="dc-review" data-id="${d.id}"><span class="row-main"><span class="row-title">${d.title}</span><span class="row-sub">Decided ${fmtMD(d.date)}</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button>`)}</section>` : ''}
      ${sc ? html`<p class="lead">${sc.n} reviewed: ${sc.good} good decision${sc.good === 1 ? '' : 's'}, ${sc.asExpected} as expected or better.${sc.calibration === 'over' ? ' When you’re sure, it goes worse than expected more than a third of the time: worth a second look at the confident ones.' : ''}</p>` : ''}
      ${list.length ? html`<ul class="list">${list.map((d) => html`<li data-key="dc-${d.id}"><button type="button" class="${cx('row', params.id === d.id && 'is-on')}" data-action="${!d.review && d.reviewOn > today() ? 'dc-open' : 'dc-review'}" data-id="${d.id}">
          <span class="row-main"><span class="row-title">${d.title}</span>
            <span class="row-sub">${fmtMD(d.date)} · ${d.review ? DC.OUTCOMES.find((o) => o.id === d.review.outcome)?.label : `review ${fmtMD(d.reviewOn)}`}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul>`
        : empty({ ic: 'scale', title: 'Your decision journal', body: 'The next time you make a call that matters, write it down here in a minute. In three months you’ll see how your judgement holds up.', cta: 'Write one down', action: 'dc-new' })}`;
  },
  // From the morning briefing: reflect/decisions/<id> opens it (its review when due).
  mount(el, { params }) {
    const d = params.id && DC.one(params.id);
    if (d) (!d.review && d.reviewOn > today() ? openDecision : openReview)(d.id);
  },
  actions: {
    'dc-new': () => openDecision(),
    'dc-open': ({ data }) => openDecision(data.id),
    'dc-review': ({ data }) => openReview(data.id),
  },
};
