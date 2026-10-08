// Choose your three: one screen to sort every habit into Focus, Autopilot or Later.
// Nothing is saved until you tap Save; "I'll decide later" leaves everything as it was.
import * as store from '../data/store.js';
import * as HS from '../domain/habit-system.js';
import * as H from '../domain/habits.js';
import { SECTIONS, habitColor } from '../domain/taxonomy.js';
import { today, addDays, fmtMD } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const CHOICES = [
  { id: 'focus', label: 'Focus' },
  { id: 'autopilot', label: 'Autopilot' },
  { id: 'queue', label: 'Later' },
];

function draft(ui) {
  if (!ui.sort) {
    ui.sort = {};
    ui.suggested = false;
    if (!H.focusHabits().length) {
      for (const h of HS.suggestFocus()) ui.sort[h.id] = 'focus';
      ui.suggested = Object.keys(ui.sort).length > 0;
    }
  }
  return ui.sort;
}

const stateIn = (map, h) => map[h.id] ?? H.stateOf(h);

function slot(h, i) {
  if (!h) {
    return html`<li class="sort-slot is-empty" data-key="slot-${i}"><span class="sort-slot-n tnum">${i + 1}</span>
      <span class="sort-slot-text">Free slot</span></li>`;
  }
  return html`<li class="sort-slot" data-key="slot-${i}" style="--ic:${habitColor(h)}">
    <span class="row-ic">${icon(h.icon, { size: 18 })}</span>
    <span class="sort-slot-text"><span class="row-title">${h.name}</span><span class="row-sub">${H.scheduleLabel(h)}${H.tinyOf(h)?.label ? ` · tiny: ${H.tinyOf(h).label}` : ''}</span></span>
    <button type="button" class="icon-btn icon-btn--sm" data-action="set" data-id="${h.id}" data-state="autopilot" aria-label="Take ${h.name} out of your three">${icon('x', { size: 16 })}</button>
  </li>`;
}

function row(h, map, full) {
  const st = stateIn(map, h);
  const paused = st === 'paused';
  return html`<li class="sort-row" data-key="${h.id}">
    <span class="row-ic" style="--ic:${habitColor(h)}">${icon(h.icon, { size: 18 })}</span>
    <span class="sort-row-main"><span class="row-title">${h.name}</span>
      <span class="row-sub">${paused ? `Paused${h.pausedUntil ? ` · back ${fmtMD(h.pausedUntil)}` : ''}` : H.scheduleLabel(h)}</span></span>
    <span class="sort-pick" role="radiogroup" aria-label="${h.name}">${CHOICES.map((c) => html`<button type="button" role="radio" aria-checked="${st === c.id}"
      class="${cx('sort-opt', st === c.id && 'is-on', c.id === 'focus' && full && st !== 'focus' && 'is-full')}" data-action="set" data-id="${h.id}" data-state="${c.id}">${c.label}</button>`)}</span>
  </li>`;
}

export default {
  id: 'habit-sort',
  title: 'Choose your three',
  render({ ui }) {
    const map = draft(ui);
    const all = H.activeHabits();
    const focus = all.filter((h) => stateIn(map, h) === 'focus')
      .sort((a, b) => (map[a.id] === 'focus') - (map[b.id] === 'focus') || (a.focusSince || '').localeCompare(b.focusSince || ''));
    const full = focus.length >= H.FOCUS_LIMIT;
    const counts = { autopilot: 0, queue: 0, paused: 0 };
    for (const h of all) { const st = stateIn(map, h); if (st in counts) counts[st]++; }
    const changed = Object.entries(map).some(([id, st]) => H.habit(id) && H.stateOf(H.habit(id)) !== st);
    return html`
      ${pageHead({ title: 'Choose your three', back: { to: 'plan/habits', label: 'Habits' },
        sub: 'Three habits get your full attention and count in your score. Everything else runs on autopilot and never counts against you.' })}

      <section class="sort-three" data-key="three" aria-label="Your three">
        <div class="block-head"><h2 class="block-title">Your three</h2><span class="block-meta tnum">${focus.length} of ${H.FOCUS_LIMIT}</span></div>
        <ol class="sort-slots">${[0, 1, 2].map((i) => slot(focus[i], i))}</ol>
        <p class="block-hint">${ui.suggested ? 'Suggested from what matters most and isn’t automatic yet. Swap any of them.' : 'Pick the ones you most want to become automatic. You can change them any time.'}</p>
      </section>

      ${SECTIONS.map((sec) => {
        const list = all.filter((h) => h.section === sec.id);
        if (!list.length) return '';
        return html`<section class="block" data-key="g-${sec.id}" aria-label="${sec.label}">
          <div class="block-head"><h2 class="block-title">${sec.label}</h2><span class="block-meta tnum">${list.length}</span></div>
          <ul class="list sort-list">${list.map((h) => row(h, map, full))}</ul>
        </section>`;
      })}

      <p class="foot-note">${counts.autopilot} on autopilot · ${counts.queue} for later${counts.paused ? ` · ${counts.paused} paused` : ''}. Autopilot habits stay in their group on Today. Later ones wait off Today until you bring them in.</p>
      <div class="sort-bar">
        <button type="button" class="btn btn--ghost" data-action="later">I’ll decide later</button>
        <button type="button" class="btn btn--primary" data-action="save"${changed ? '' : ' aria-disabled="true"'}>Save</button>
      </div>`;
  },
  actions: {
    set: ({ data, ui }) => {
      const map = draft(ui);
      const h = H.habit(data.id);
      if (!h) return;
      const focusNow = H.activeHabits().filter((x) => stateIn(map, x) === 'focus').length;
      if (data.state === 'focus' && stateIn(map, h) !== 'focus' && focusNow >= H.FOCUS_LIMIT) {
        app.toast('Your three are full. Take one out first.');
        return;
      }
      map[h.id] = data.state;
      ui.suggested = false;
      hap.tap();
      app.refresh();
    },
    save: ({ ui }) => {
      try {
        const n = HS.applyStates(ui.sort || {});
        ui.sort = null;
        const three = H.focusHabits().length;
        hap.success();
        app.toast(n ? (three ? `Your ${three === 3 ? 'three are' : three === 1 ? 'one is' : 'two are'} set. Everything else is on autopilot.` : 'Saved.') : 'Nothing changed.', { icon: 'check' });
        app.back('today');
      } catch (err) {
        app.toast(err.message);
      }
    },
    later: ({ ui }) => {
      ui.sort = null;
      // Today stops asking for a week; the score explains how to start when you tap it.
      store.setSettings({ focusPromptUntil: addDays(today(), 7) });
      app.back('today');
    },
  },
};
