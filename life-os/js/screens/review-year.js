// Review › Your year (13f): the year in numbers, its picture, three questions, and one word for the
// year ahead. Saved as you type; Complete marks it done, and the word goes to the top of Plan.
import * as Y from '../domain/year-review.js';
import { today } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { num, signed, kgOut, weightUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const yearOf = (params) => (/^\d{4}$/.test(params.year || '') ? Number(params.year) : Y.due(today()) ?? Number(today().slice(0, 4)));

export default {
  id: 'review-year',
  title: 'Your year',
  render({ params }) {
    const y = yearOf(params);
    const r = Y.review(y) || { answers: {} };
    const n = Y.numbers(y);
    const facts = [
      ['Days you showed up', num(n.showedUp)],
      ['Days sealed', num(n.sealed)],
      ['Workouts', num(n.workouts)],
      n.books ? ['Books finished', num(n.books)] : null,
      n.pages ? ['Journal pages', num(n.pages)] : null,
      n.wins ? ['Wins written down', num(n.wins)] : null,
      n.weight != null ? ['Weight', `${signed(kgOut(n.weight), 1)} ${weightUnit()}`] : null,
      n.steps ? ['Steps a day', num(Math.round(n.steps))] : null,
    ].filter(Boolean);
    return html`
      ${pageHead({ title: `Your ${y}`, eyebrow: 'Yearly review', back: { to: 'review', label: 'Review' } })}
      ${r.completedAt ? html`<p class="notice">${icon('check', { size: 16 })} Done. ${r.word ? html`Your word for ${y + 1}: <b>${r.word}</b>, at the top of Plan.` : ''}</p>` : html`<p class="lead">About ten minutes, once a year. Look back, then choose one word to carry into ${y + 1}.</p>`}
      <section class="block" data-key="numbers"><div class="block-head"><h2 class="block-title">The year in numbers</h2></div>
        <dl class="facts">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd class="tnum">${v}</dd></div>`)}</dl>
        <a class="btn btn--soft btn--block block-tight" href="#/progress/year/${y}" data-action="nav" data-to="progress/year/${y}">${icon('sparkles', { size: 16 })} See your year’s picture</a>
      </section>
      <section class="block" data-key="questions"><div class="block-head"><h2 class="block-title">Three questions</h2></div>
        ${Y.QUESTIONS.map(([k, q]) => html`<label class="prompt" data-key="q-${k}"><span class="prompt-q">${q}</span>
          <textarea class="prompt-a" rows="2" data-input="yr-a" data-k="${k}" aria-label="${q}">${r.answers?.[k] || ''}</textarea></label>`)}
      </section>
      <section class="block" data-key="word"><div class="block-head"><h2 class="block-title">One word for ${y + 1}</h2></div>
        <p class="muted small">A word to steer by: Strength, Present, Build, Steady. It sits at the top of Plan all year.</p>
        <input class="input year-word" value="${r.word || ''}" data-input="yr-word" placeholder="Your word" maxlength="24" autocapitalize="words" aria-label="One word for ${y + 1}">
      </section>
      <button type="button" class="btn btn--primary btn--block block" data-action="yr-done">${r.completedAt ? 'Update' : 'Complete the review'}</button>`;
  },
  inputs: {
    'yr-a': ({ el, value, params }) => { Y.save(yearOf(params), { answers: { [el.dataset.k]: value } }); },
    'yr-word': ({ value, params }) => { Y.save(yearOf(params), { word: value.trim().split(/\s+/)[0] || '' }); },
  },
  actions: {
    'yr-done': ({ params }) => {
      const y = yearOf(params);
      const r = Y.save(y, { completedAt: Y.review(y)?.completedAt || new Date().toISOString() });
      hap.success();
      app.toast(r.word ? `${y + 1}: ${r.word}` : 'Your year, reviewed.', { icon: 'check' });
      app.refresh();
    },
  },
};
