// Two small sheets from You: Recent changes (everything this session offered Undo for, undoable
// after its message has gone) and Your usage (what the usage meter has counted on this device, and
// what you haven't opened in 30 days).
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { recentChanges, undoChange } from '../ui/toast.js';
import * as usage from '../ui/usage.js';
import { fmtTime } from '../domain/dates.js';

export function openRecent() {
  app.sheet({
    title: 'Recent changes',
    render: () => {
      const list = recentChanges();
      if (!list.length) return html`<p class="sheet-note">Nothing yet. Whatever you change from now on, with an Undo, is listed here until you close Life OS.</p>`;
      return html`<p class="sheet-note">Undo any of them, even after its message has gone. Kept until you close Life OS.</p>
        <ul class="list recent-list">${list.map((c, i) => html`<li class="${cx('recent-row', c.used && 'is-used')}" data-key="rc-${c.at}-${i}">
          <span class="row-main"><span class="row-title">${c.message}</span><span class="row-sub tnum">${fmtTime(new Date(c.at))}${c.used ? ' · undone' : ''}</span></span>
          ${c.used ? '' : html`<button type="button" class="btn btn--soft btn--sm" data-action="rc-undo" data-i="${i}">Undo</button>`}
        </li>`)}</ul>`;
    },
    actions: {
      'rc-undo': ({ data, sheet }) => {
        if (undoChange(recentChanges()[Number(data.i)])) { hap.tap(); app.toast('Undone'); }
        sheet.refresh();
      },
    },
  });
}

// The places the meter can tell you about, by their address.
const PLACES = [
  ['plan/habits', 'Habits'], ['plan/goals', 'Goals'], ['plan/projects', 'Projects'], ['plan/tasks', 'Tasks'], ['plan/lists', 'Lists'],
  ['plan/notes', 'Brain dump'], ['plan/books', 'Books'], ['plan/training', 'Training'], ['plan/playbook', 'Your plan'],
  ['plan/moodboard', 'Moodboard'], ['plan/money/:month?', 'Money'], ['plan/dates', 'Dates'], ['plan/commitments', 'Commitments'],
  ['plan/rewards', 'Rewards'], ['progress/body', 'Body'], ['progress/body/weight', 'Weight'], ['progress/body/sleep', 'Sleep'],
  ['progress/body/measurements', 'Measurements'], ['progress/body/photos', 'Progress photos'], ['progress/trends/:metric?', 'Trends'],
  ['progress/calendar', 'Calendar'], ['progress/records', 'Records'], ['progress/season', 'Season'], ['progress/year/:year?', 'Your year'],
  ['progress/areas/mind', 'Mind'], ['progress/areas/spirit', 'Spirit'], ['progress/areas/relationships', 'Relationships'], ['progress/areas/work', 'Work'],
  ['reflect/journal', 'Journal'], ['reflect/reviews', 'Reviews'], ['reflect/insights', 'Insights'],
];
const nameOf = (path) => PLACES.find(([p]) => p === path)?.[1] || null;

export function openUsage() {
  app.sheet({
    title: 'Your usage',
    render: () => {
      const days = usage.days();
      const top = usage.list('r:').map((x) => ({ ...x, name: nameOf(x.key.slice(2)) })).filter((x) => x.name).slice(0, 8);
      const unused = PLACES.filter(([p]) => !usage.usedWithin(`r:${p}`, 30)).map(([, n]) => n);
      return html`<p class="sheet-note">Counted on this device only. It never leaves it, isn’t synced and isn’t in backups. It teaches Today’s quick row and folds sections you don’t use.</p>
        <section class="block"><h2 class="block-title">Most opened</h2>
          ${top.length ? html`<ul class="list">${top.map((x) => html`<li class="row row--static"><span class="row-main"><span class="row-title">${x.name}</span></span><span class="row-right tnum">${x.n}</span></li>`)}</ul>`
            : html`<p class="sheet-note">Nothing counted yet.</p>`}</section>
        <section class="block"><h2 class="block-title">Not opened in 30 days</h2>
          ${days < 30 ? html`<p class="sheet-note tnum">Counting for ${days} of 30 days. Come back after that for an honest list.</p>`
            : unused.length ? html`<p class="sheet-note">${unused.join(' · ')}</p><p class="sheet-note">Candidates to hide. Nothing is removed unless you choose to.</p>`
              : html`<p class="sheet-note">You use everything. Nothing to hide.</p>`}</section>
        <button type="button" class="link-btn" data-action="usage-reset">${icon('rotate-ccw', { size: 16 })} Start counting again</button>`;
    },
    actions: {
      'usage-reset': ({ sheet }) => { usage.reset(); hap.tap(); sheet.refresh(); },
    },
  });
}
