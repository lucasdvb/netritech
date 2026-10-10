// Review: how it's going and what you learned, in one place (it was Progress and Reflect). Today's
// page to write first, then this week's story and the reviews that are due, what's moving and the
// measures that drive a decision, insights, your experiments, and down the page Body, the areas,
// the journal and the films. Every deeper page keeps its address (progress/…, reflect/…).
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { progressTop, progressMore } from './progress.js';
import * as Rf from './reflect.js';

export default {
  id: 'review',
  title: 'Review',
  render() {
    return html`
      ${pageHead({ title: 'Review', info: 'How it’s going and what you learned: today’s page, this week, the reviews that are due, what’s moving and why, and everything you’ve logged further down.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${Rf.write()}
      ${Rf.memoryCard()}
      ${progressTop()}
      ${Rf.reviewsDue()}
      ${Rf.insights()}
      ${Rf.experimentBlock()}
      ${progressMore()}
      ${Rf.recent()}
      ${Rf.films()}`;
  },
  ...Rf.behaviour,
};
