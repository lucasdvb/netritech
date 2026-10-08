// An insight as a card: what your logs show, then one button that changes your plan (with Undo)
// and "Not now", which keeps it quiet for two weeks. Shared by Reflect and the Insights page.
import * as I from '../domain/insights.js';
import { html } from '../ui/dom.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export const insightCard = (i) => html`<li class="insight-card" data-key="ins-${i.id}" data-insight="${i.id}">
  <p class="insight-eyebrow">${i.area}</p>
  <p class="insight-title">${i.title}</p>
  <p class="insight-detail">${i.detail}</p>
  <div class="insight-actions">
    <button type="button" class="btn btn--primary btn--sm" data-action="ins-apply" data-id="${i.id}">${i.action.label}</button>
    <button type="button" class="link-btn" data-action="ins-later" data-id="${i.id}">Not now</button>
  </div>
</li>`;

const find = (id) => I.insights().find((i) => i.id === id);

export const insightActions = {
  'ins-apply': ({ data }) => {
    const ins = find(data.id);
    if (!ins) return;
    const undo = I.apply(ins);
    hap.success();
    app.toast(ins.action.done || 'Done', { icon: 'check', action: { label: 'Undo', fn: undo } });
  },
  'ins-later': ({ data }) => {
    const ins = find(data.id);
    if (!ins) return;
    const undo = I.dismiss(ins);
    hap.tap();
    app.toast('Set aside for two weeks', { action: { label: 'Undo', fn: undo } });
  },
};
