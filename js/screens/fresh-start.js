// Fresh start (H9): back after three or more days away. The days away are already marked "away"
// (not missed, and runs carry on over them); you choose one to three habits for this week.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as HS from '../domain/habit-system.js';
import { fmtMD } from '../domain/dates.js';
import { habitColor } from '../domain/taxonomy.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export function openFreshStart(away) {
  const focus = H.focusHabits().map((h) => h.id);
  // Your three first, then the rest of what you track by hand.
  const list = [...H.focusHabits(), ...H.activeHabits().filter((h) => !focus.includes(h.id) && !h.source && !['paused'].includes(H.stateOf(h)))].slice(0, 12);
  app.sheet({
    title: 'Welcome back',
    size: 'detent',
    ui: { pick: focus.slice(0, 3) },
    render: (s) => html`<div class="form fresh">
      <p class="fresh-lead">You were away ${away.days} days (${fmtMD(away.from)}–${fmtMD(away.to)}). They’re marked as away, not missed, and your runs carry on from where they were.</p>
      <p class="form-label">Pick one to three habits for this week</p>
      <div class="fresh-picks">${list.map((h) => {
        const on = s.ui.pick.includes(h.id);
        return html`<button type="button" class="${cx('chip chip--area', on && 'is-active')}" style="--ic:${habitColor(h)}" data-action="fs-pick" data-id="${h.id}" aria-pressed="${on}" data-key="fs-${h.id}">
          ${on ? icon('check', { size: 15 }) : html`<i class="chip-dot" aria-hidden="true"></i>`}${h.name}</button>`;
      })}</div>
      <p class="field-hint">${s.ui.pick.length ? `${s.ui.pick.length} of 3. Everything else keeps running on autopilot.` : 'Choose at least one.'}</p>
      <button type="button" class="btn btn--primary btn--block" data-action="fs-go"${s.ui.pick.length ? '' : ' aria-disabled="true"'}>Start the week</button>
      <div class="fresh-foot">
        <button type="button" class="link-btn" data-action="fs-keep">Keep things as they are</button>
        <button type="button" class="link-btn" data-action="fs-off">Don’t offer this again</button>
      </div>
    </div>`,
    actions: {
      'fs-pick': ({ data, sheet }) => {
        const p = sheet.ui.pick;
        sheet.ui.pick = p.includes(data.id) ? p.filter((x) => x !== data.id) : p.length >= 3 ? p : [...p, data.id];
        if (p.length >= 3 && !p.includes(data.id)) app.toast('Three at most. Unpick one first.');
        hap.tap();
        sheet.refresh();
      },
      'fs-go': ({ sheet }) => {
        const pick = sheet.ui.pick;
        if (!pick.length) return;
        const before = H.habits().filter((h) => pick.includes(h.id) || focus.includes(h.id)).map((h) => ({ ...h }));
        // Your three this week: the ones you picked; any others in focus wait in Later.
        const ops = [];
        for (const id of focus) if (!pick.includes(id)) ops.push({ store: 'habits', value: { ...H.habit(id), ...HS.statePatch(H.habit(id), 'queue') } });
        for (const id of pick) if (!focus.includes(id)) ops.push({ store: 'habits', value: { ...H.habit(id), ...HS.statePatch(H.habit(id), 'focus', { focusCount: 0 }) } });
        if (ops.length) store.batch(ops);
        hap.success();
        app.closeSheet(sheet);
        app.toast('A fresh start. One day at a time.', { icon: 'sunrise', action: ops.length ? { label: 'Undo', fn: () => store.batch(before.map((value) => ({ store: 'habits', value }))) } : undefined });
      },
      'fs-keep': ({ sheet }) => app.closeSheet(sheet),
      'fs-off': ({ sheet }) => {
        store.setSettings({ nets: { ...(store.settings()?.nets || {}), freshStart: false } });
        app.closeSheet(sheet);
        app.toast('Fresh start is off. Settings can turn it back on.');
      },
    },
  });
}
