// Insights (U8): every pattern your logs show right now, each with one change to make, and what
// you've acted on or set aside lately. Insights you can't act on are never listed.
import * as I from '../domain/insights.js';
import { relativeDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { insightCard, insightActions } from './insight-ui.js';

export default {
  id: 'insights',
  title: 'Insights',
  render() {
    const list = I.insights();
    const past = I.history().filter((h) => h.title).slice(0, 8);
    return html`
      ${pageHead({ title: 'Insights', back: { to: 'reflect', label: 'Reflect' } })}
      <p class="lead">Patterns in your own logs, each with one change to your plan. Acted on or set aside, an insight stays quiet for two weeks.</p>
      ${list.length ? html`<ul class="insight-cards">${list.map(insightCard)}</ul>`
        : empty({ ic: 'lightbulb', title: 'Nothing to change right now.', body: 'Your patterns will appear here as you use Life OS, each with one thing to do about it.' })}
      ${past.length ? html`<section class="block" data-key="past"><div class="block-head"><h2 class="block-title">Lately</h2></div>
        <ul class="list">${past.map((h) => html`<li class="row"><span class="${h.outcome === 'applied' ? 'row-ic row-ic--done' : 'row-ic row-ic--quiet'}">${icon(h.outcome === 'applied' ? 'check' : 'clock', { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${h.outcome === 'applied' ? h.label : h.title}</span><span class="row-sub">${h.outcome === 'applied' ? 'Applied' : 'Set aside'} ${relativeDay(h.on).toLowerCase()}</span></span></li>`)}</ul></section>` : ''}`;
  },
  actions: { ...insightActions },
};
