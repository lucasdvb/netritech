import * as store from '../core/store.js';
import * as G from '../core/goals.js';
import * as T from '../core/tasks.js';
import { today } from '../core/dates.js';
import { defaultWeek } from './review-week.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, row } from '../ui/components.js';
import { isInstalled } from '../ui/install.js';
import { app } from '../ui/app-api.js';

const link = (to, ic, title, sub, color) => html`<li>${row({ ic, color, title, sub, action: 'nav', data: { to } })}</li>`;

export default {
  id: 'more',
  title: 'More',
  render() {
    const goals = G.goals().filter((g) => g.status === 'active');
    const weekDone = !!store.get('weeklyReviews', defaultWeek())?.completedAt;
    const journal = store.all('journalEntries').length;
    const demo = store.settings()?.demo;
    const due = T.forToday(today()).filter((t) => !t.done).length;
    const openN = T.open().length;
    return html`
      ${pageHead({ title: 'More', actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>` })}
      ${demo ? html`<div class="notice notice--warn">${icon('info', { size: 16 })} Sample data is loaded. <a class="link-btn" href="#/more/data" data-action="nav" data-to="more/data">Remove it</a></div>` : ''}
      <section class="block block--first"><p class="section-label">Life</p>
        <ul class="list">
          ${link('more/tasks', 'list-todo', 'Tasks', due ? `${due} for today · ${openN} open` : openN ? `${openN} open · chores and one-offs` : 'Chores and one-off jobs', 'var(--c-life)')}
          ${link('more/journal', 'notebook-pen', 'Journal', journal ? `${journal} entr${journal === 1 ? 'y' : 'ies'} · private` : 'Morning and evening prompts', 'var(--c-mind)')}
          ${link('more/mind', 'book-open', 'Mind', 'Reading, learning, meditation', 'var(--c-mind)')}
          ${link('more/faith', 'hand-heart', 'Faith', 'Prayer, Scripture, gratitude', 'var(--c-spirit)')}
          ${link('more/relationships', 'heart', 'Relationships', 'Fiancée, son, family', 'var(--c-relationships)')}
          ${link('more/work', 'briefcase', 'Work', 'Top 3, focus blocks, shutdown', 'var(--c-work)')}
        </ul></section>
      <section class="block"><p class="section-label">Direction</p>
        <ul class="list">
          ${link('more/plan', 'map', 'Your plan', 'Schedule, routines, training, rules', 'var(--accent)')}
          ${link('more/goals', 'target', 'Goals', `${goals.length} active`, 'var(--accent)')}
          ${link('more/reviews', 'calendar-days', 'Reviews', weekDone ? 'This week’s review is done' : 'Weekly and monthly', 'var(--c-life)')}
          ${link('progress/calendar', 'calendar', 'Calendar & history', 'Every day, every metric', 'var(--c-life)')}
        </ul></section>
      <section class="block"><p class="section-label">System</p>
        <ul class="list">
          ${link('more/settings', 'settings', 'Settings', 'Profile, targets, reminders, appearance', 'var(--text-2)')}
          ${link('more/data', 'database', 'Data & backup', 'Export, import, backup', 'var(--text-2)')}
          ${link('more/privacy', 'shield-check', 'Privacy', 'Everything stays on this device', 'var(--text-2)')}
          ${!isInstalled() ? html`<li>${row({ ic: 'smartphone', title: 'Add to Home Screen', sub: 'Full screen, works offline', action: 'install' })}</li>` : ''}
        </ul></section>
      <p class="foot-note">Life OS · local-first · version 1.0</p>`;
  },
  actions: {
    install: async () => {
      const m = await import('../ui/install.js');
      if (m.canPromptNative()) { await m.promptNative(); return; }
      app.sheet({
        title: 'Add to Home Screen',
        render: () => html`<ol class="steps steps--big">
          <li>Open Life OS in <strong>Safari</strong>.</li>
          <li>Tap ${icon('share', { size: 16, cls: 'inline-ic' })} <strong>Share</strong>.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li></ol>
          <p class="sheet-note">It opens full screen, works offline, and your data stays exactly where it is.</p>`,
      });
    },
  },
};
