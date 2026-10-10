import * as store from '../data/store.js';
import { html, raw, cx } from '../ui/dom.js';
import { pageHead, toggle, settingRow, segmented } from '../ui/components.js';
import { kgOut, kgIn, weightUnit, fieldNum } from '../ui/format.js';
import * as hap from '../ui/haptics.js';
import { requestPermission, permissionState, stats as reminderStats } from '../domain/reminders.js';
import * as badge from '../ui/badge.js';
import * as M from '../domain/metrics-core.js';
import { focusLimit, focusHabits } from '../domain/habits.js';
import { today } from '../domain/dates.js';
import { app } from '../ui/app-api.js';
import { icon } from '../ui/icons.js';

const n = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_ENDS = [['00:00', 'Midnight'], ['01:00', '01:00'], ['02:00', '02:00'], ['03:00', '03:00'], ['04:00', '04:00'], ['05:00', '05:00']];
const NOTIFS = [
  ['morning', 'Morning check-in', 'time'], ['workout', 'Workout', 'time'], ['water', 'Water', 'every'], ['movement', 'Movement breaks (work hours)', 'every'],
  ['eyes', 'Visual breaks (work hours)', 'every'], ['evening', 'Close the day', 'time'], ['weeklyReview', 'Weekly review (Sunday)', 'time'], ['habits', 'Habit reminders (per habit)', null],
  ['supplements', 'Supplements & medication (their times)', null],
];
// Supplement and medication reminders are on unless you turn them off (they only exist once you add one).
const isOn = (nt, k) => (k === 'supplements' ? nt[k]?.on !== false : !!nt[k]?.on);

const profileField = (label, key, type = 'text', opts = {}) => {
  const p = store.profile();
  return html`<label class="set-row"><span class="set-text"><span class="set-label">${label}</span></span>
    <span class="set-ctl"><input class="input input--inline" type="${type}" value="${p[key] ?? ''}" data-change="profile" data-k="${key}" ${raw(opts.attrs || '')} aria-label="${label}">${opts.unit ? html`<span class="muted small">${opts.unit}</span>` : ''}</span></label>`;
};
const targetField = (label, key, unit, step = 1) => {
  const t = store.settings().targets;
  return html`<label class="set-row"><span class="set-text"><span class="set-label">${label}</span></span>
    <span class="set-ctl"><input class="input input--inline input--num" type="number" inputmode="decimal" step="${step}" value="${t[key] ?? ''}" data-change="target" data-k="${key}" aria-label="${label}"><span class="muted small">${unit}</span></span></label>`;
};

/** Steps: the ramp's number until you set your own. */
function stepsField() {
  const h = store.get('habits', 'h-steps');
  if (!h) return '';
  const v = h.ramp ? M.stepsTarget(today(), h.ramp) : h.target;
  return html`<label class="set-row"><span class="set-text"><span class="set-label">Steps</span></span>
    <span class="set-ctl"><input class="input input--inline input--num" type="number" inputmode="numeric" step="500" min="1000" value="${v ?? ''}" data-change="steps" aria-label="Steps"><span class="muted small">/day</span></span></label>`;
}

// Each safety net shows at most once per occasion; these turn one off for good (or back on).
const NETS = [
  ['catchUp', 'Catch up on yesterday', 'In the morning, tap what you did yesterday but didn’t log.'],
  ['freshStart', 'Fresh start after time away', 'After three days or more away, start again without a list of misses.'],
  ['adapt', 'Shrink and grow suggestions', 'A smaller target after a rough week, a step up after two steady ones.'],
  ['tidy', 'Weekly tidy-up', 'Habits untouched for two weeks, once a week.'],
];

const pushOn = () => { try { return !!JSON.parse(localStorage.getItem('lifeos.push'))?.on; } catch { return false; } };

// A setting opened from search: which one, and until when it's pointed out.
let found = null;
function pointOut(el) {
  const hit = [...el.querySelectorAll('.set-label, .set-section, .set-sub, .field-label')].find((x) => x.textContent.trim().toLowerCase() === found.label);
  if (!hit) return;
  const inside = hit.closest('details');
  if (inside) inside.open = true;
  const row = hit.closest('.set-row, .field, .block') || hit;
  row.classList.add('is-found');
  if (!found.scrolled) { found.scrolled = true; row.scrollIntoView({ block: 'center' }); }
  setTimeout(() => { if (Date.now() >= found.until) row.classList.remove('is-found'); }, found.until - Date.now() + 20);
}

// The version running: the offline copy's name (from sw.js), shown in About.
let build = '';
async function readBuild() {
  try {
    const key = (await caches.keys()).find((k) => k.startsWith('lifeos-'));
    const v = key ? key.slice(7) : '';
    if (v && v !== build) { build = v; app.refresh(); }
  } catch { /* no offline copy here */ }
}

export default {
  id: 'settings',
  title: 'Settings',
  render() {
    const s = store.settings();
    const p = store.profile();
    const nt = s.notifications;
    const perm = permissionState();
    const rs = reminderStats();
    const steps = store.get('habits', 'h-steps');
    return html`
      ${pageHead({ title: 'Settings', back: { to: 'today', label: 'Today' } })}
      <section class="block block--first"><h2 class="set-section">Profile</h2>
        <div class="set-list">
          ${profileField('Name', 'name')}
          ${profileField('Age', 'age', 'number', { attrs: 'inputmode="numeric" min="10" max="100"' })}
          ${profileField('Height', 'heightCm', 'number', { unit: 'cm', attrs: 'inputmode="numeric"' })}
          <label class="set-row"><span class="set-text"><span class="set-label">Starting weight</span></span><span class="set-ctl"><input class="input input--inline input--num" type="number" step="0.1" inputmode="decimal" value="${fieldNum(kgOut(p.startWeightKg))}" data-change="start-weight" aria-label="Starting weight"><span class="muted small">${weightUnit()}</span></span></label>
          ${profileField('Body fat (estimate)', 'startBodyFat', 'number', { unit: '%', attrs: 'step="any"' })}
          ${profileField('Goal body fat', 'goalBodyFat', 'number', { unit: '%', attrs: 'step="any"' })}
        </div></section>
      <section class="block"><h2 class="set-section">Day</h2>
        <div class="set-list">
          ${profileField('Wake', 'wakeTime', 'time')}
          ${profileField('Training', 'trainTime', 'time')}
          ${profileField('Work starts', 'workStart', 'time')}
          ${profileField('Work ends', 'workEnd', 'time')}
          ${profileField('Lights out', 'bedTime', 'time')}
          ${settingRow('My day ends at', html`<select class="input input--inline" data-change="profile" data-k="dayEndsAt" aria-label="My day ends at">
            ${DAY_ENDS.map(([v, l]) => html`<option value="${v}" ${(p.dayEndsAt || '00:00') === v ? 'selected' : ''}>${l}</option>`)}</select>`, { hint: 'Anything you log before then counts for the day before.' })}
          <div class="set-row"><span class="set-text"><span class="set-label">Work days</span></span><span class="set-ctl"><div class="day-pick day-pick--sm">${DAYS.map(([v, l]) => html`<button type="button" class="${cx('day-opt', (p.workDays || []).includes(v) && 'is-on')}" aria-pressed="${(p.workDays || []).includes(v)}" data-action="workday" data-v="${v}" aria-label="${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][v]}">${l}</button>`)}</div></span></div>
        </div></section>
      <section class="block"><h2 class="set-section">Habits</h2>
        <div class="set-list">
          ${settingRow('Habits in focus', segmented([2, 3, 4, 5].map((v) => ({ id: String(v), label: String(v) })), String(focusLimit()), { action: 'focus-limit', name: 'Habits in focus', size: 'sm', cls: 'seg--compact' }),
            { hint: 'Three suits most people.', key: 'focus-limit' })}
        </div></section>
      <section class="block"><h2 class="set-section">Targets</h2>
        <div class="set-list">
          ${targetField('Protein', 'proteinG', 'g')}
          ${targetField('Calories', 'kcal', 'kcal', 50)}
          ${targetField('Calorie floor', 'kcalFloor', 'kcal', 50)}
          ${targetField('Water', 'waterMl', 'ml', 100)}
          ${targetField('Sleep', 'sleepH', 'h', 0.5)}
          ${targetField('Movement breaks', 'movementBreaks', '/day')}
          ${stepsField()}
        </div>
        <p class="fine-print">${steps?.ramp ? 'Steps adapt on their own (7,000 → 8,000 → 9,000 over your first three weeks) until you set your own. ' : ''}Calories adapt from your weight trend in Nutrition.</p></section>
      <section class="block"><h2 class="set-section">Units</h2>
        <div class="set-list">
          ${settingRow('Weight', segmented([{ id: 'kg', label: 'kg' }, { id: 'lb', label: 'lb' }], s.units.weight, { action: 'unit', name: 'Weight unit', size: 'sm', cls: 'seg--compact' }), { key: 'u-w' })}
          ${settingRow('Length', segmented([{ id: 'cm', label: 'cm' }, { id: 'in', label: 'in' }], s.units.length, { action: 'unit-len', name: 'Length unit', size: 'sm', cls: 'seg--compact' }), { key: 'u-l' })}
        </div></section>
      <section class="block"><h2 class="set-section">Appearance</h2>
        <div class="set-list">
          ${settingRow('Theme', segmented([{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], s.theme, { action: 'theme', name: 'Theme', cls: 'seg--compact' }))}
          ${settingRow('Show explanations', toggle(s.showTips === true, { action: 'tips', label: 'Show explanations' }), { hint: 'Keep the text behind every ⓘ open. Off, tap an ⓘ to read one.', key: 'tips' })}
          ${settingRow('Morning briefing on Today', toggle(s.briefing !== false, { action: 'briefing', label: 'Morning briefing on Today' }), { hint: 'Until noon: the kind of day, your calendar, training, the first task, your energy peak and anything due.', key: 'briefing' })}
          ${settingRow('Haptics', toggle(s.haptics !== false, { action: 'haptics', label: 'Haptics' }), { hint: 'Subtle taps where the device supports them.' })}
          ${settingRow('Sound', toggle(s.sound === true, { action: 'sound', label: 'Sound' }), { hint: 'Soft sounds made on the phone for completions, moments and sealing the day. Off by default.', key: 'sound' })}
          ${settingRow('Race against', segmented([{ id: 'four', label: 'A month ago' }, { id: 'best', label: 'Best week' }, { id: 'last', label: 'Last week' }], s.ghost || 'four', { action: 'ghost', name: 'Race against', cls: 'seg--compact' }), { hint: 'Your past self at the same point of the week, on Review. A quiet marker, never an alarm.', key: 'ghost' })}
        </div></section>
      <section class="block"><h2 class="set-section">Reminders</h2>
        <div class="card block-tight">
          <p class="card-lead" style="margin-top:0">Quiet and adaptive: if you already do something without the nudge, Life OS stops nudging. If you keep dismissing one, it asks whether a different time would suit you better.</p>
          <p class="fine-print">${perm === 'unsupported' ? 'This browser doesn’t support notifications. Reminders show inside the app while it’s open.'
            : pushOn() ? 'Your server sends the timed reminders below, even when Life OS is closed. The nudges (move, eyes, water) arrive while it’s open or recently used.'
              : 'In-app reminders arrive while Life OS is open or recently used. For when it’s closed, use your calendar, or turn on reminders from your own server above.'}</p>
        </div>
        <a class="card card--link sort-cta block-tight" href="#/you/reminders" data-action="nav" data-to="you/reminders">
          <span class="sort-cta-text"><span class="card-title">All your reminders, in one timeline</span><span class="row-sub">In the order of your day, each moving with Your day</span></span>
          ${icon('chevron-right', { size: 18 })}</a>
        <div class="set-list block-tight">
          ${settingRow('Reminders', toggle(nt.enabled, { action: 'notif-master', label: 'Reminders' }), { hint: perm === 'granted' ? 'System notifications allowed' : perm === 'denied' ? 'Notifications are blocked in system settings — in-app only' : 'In-app, plus system notifications if you allow them' })}
          ${nt.enabled ? NOTIFS.map(([k, label, kind]) => settingRow(label, html`${kind === 'time' && nt[k]?.on ? html`<input class="input input--inline" type="time" value="${nt[k].time}" data-change="notif-time" data-k="${k}" aria-label="${label} time">` : ''}
            ${kind === 'every' && nt[k]?.on ? html`<select class="input input--inline" data-change="notif-every" data-k="${k}" aria-label="${label} interval">${(k === 'eyes' ? [20, 30, 45] : k === 'water' ? [90, 120, 180] : [45, 50, 60]).map((m) => html`<option value="${m}" ${raw(nt[k].every === m ? 'selected' : '')}>every ${m} min</option>`)}</select>` : ''}
            ${toggle(isOn(nt, k), { action: 'notif', data: { k }, label })}`, { key: `n-${k}`, hint: rs[k]?.note || '' })) : ''}
        </div></section>
      <details class="block set-advanced" data-key="advanced"><summary class="set-section">Advanced</summary>
        <h3 class="set-sub">Reminders when Life OS is closed</h3>
        <div class="set-list">
          ${settingRow('In your calendar', html`<button type="button" class="btn btn--soft btn--sm" data-action="calendar-file">${s.calendarAddedAt ? 'Add again' : 'Set up'}</button>`,
            { hint: 'The way that always works on iPhone: your calendar alerts you, even when Life OS is closed, and nothing is sent anywhere.', key: 'n-cal' })}
          ${settingRow('Cues from your iPhone', html`<button type="button" class="btn btn--soft btn--sm" data-action="cues">Set up</button>`,
            { hint: 'A nudge at the real moment: when your alarm stops, when you get to the gym. Made in the Shortcuts app; nothing is sent anywhere.', key: 'n-cues' })}
          ${settingRow('When Life OS is closed', html`<button type="button" class="btn btn--soft btn--sm" data-action="push">${pushOn() ? 'On' : 'Set up'}</button>`,
            { hint: 'Your reminders, sent by your own sync server even when the app is closed. Optional.', key: 'n-push' })}
          ${badge.supported() ? settingRow('Badge on the app icon', toggle(s.badge !== false, { action: 'badge', label: 'Badge on the app icon' }),
            { hint: perm === 'granted' ? 'How much of today’s plan is still open.' : 'How much of today’s plan is still open. On iPhone it needs notifications allowed for Life OS.', key: 'n-badge' }) : ''}
        </div>
      <section class="block-tight"><h3 class="set-sub">Safety nets</h3>
        <div class="set-list">
          ${NETS.map(([k, label, hint]) => settingRow(label, toggle(s.nets?.[k] !== false, { action: 'net', data: { k }, label }), { hint, key: `net-${k}` }))}
        </div></section>
      </details>
      <section class="block"><h2 class="set-section">About</h2>
        <dl class="facts">
          <div><dt>Version</dt><dd><span class="tnum" data-key="sw-version">${build || '…'}</span></dd></div>
          <div><dt>Habit system</dt><dd>Imported from your Life OS workbook</dd></div>
          <div><dt>Equipment</dt><dd>${p.equipment}</dd></div>
          <div><dt>Food</dt><dd>${p.diet}</dd></div>
        </dl>
        <div class="btn-row set-update"><button type="button" class="btn btn--soft btn--sm" data-action="check-update">${icon('refresh-cw', { size: 16 })} Check for updates</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="updating">Updating without losing data</button></div>
      </section>`;
  },
  mount(el, { query }) {
    readBuild();
    // From search: open on the setting asked for, and point it out for a moment.
    if (query?.find) { found = { label: String(query.find).toLowerCase(), until: Date.now() + 2400, scrolled: false }; pointOut(el); }
  },
  // A redraw replaces the row's classes, so the pointer is put back while it's meant to show.
  update(el) { if (found && Date.now() < found.until) pointOut(el); },
  actions: {
    'check-update': async () => {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (!reg) { app.toast('Updates arrive when Life OS is opened from its web address.'); return; }
      app.toast('Checking for a new version…');
      try { await reg.update(); } catch { app.toast('Couldn’t check. Are you online?'); return; }
      // A new version takes over by itself and the app reloads into it; nothing new means none.
      setTimeout(() => { if (!reg.installing && !reg.waiting) app.toast(`You have the latest version (${build || 'this one'}).`); }, 2500);
    },
    updating: async () => (await import('./updating.js')).openUpdating(),
    'calendar-file': async () => (await import('./calendar-file.js')).openCalendarFile(),
    cues: async () => (await import('./cues.js')).openCues(),
    push: async () => (await import('./push-sheet.js')).openPushSheet({ onDone: () => app.refresh() }),
    badge: async () => {
      const on = store.settings().badge === false;
      if (on) await requestPermission();
      store.setSettings({ badge: on });
      badge.update();
      hap.tap();
    },
    net: ({ data }) => { const n = store.settings().nets || {}; store.setSettings({ nets: { ...n, [data.k]: n[data.k] === false } }); hap.tap(); },
    workday: ({ data }) => {
      const v = Number(data.v);
      const set = new Set(store.profile().workDays || []);
      set.has(v) ? set.delete(v) : set.add(v);
      store.setProfile({ workDays: [...set].sort() });
      hap.tap();
    },
    unit: ({ data }) => store.setSettings({ units: { ...store.settings().units, weight: data.value } }),
    'unit-len': ({ data }) => store.setSettings({ units: { ...store.settings().units, length: data.value } }),
    tips: () => store.setSettings({ showTips: store.settings().showTips !== true }),
    sound: async () => { const on = store.settings().sound !== true; store.setSettings({ sound: on }); if (on) (await import('../ui/sound.js')).play('moment'); },
    ghost: ({ data }) => { store.setSettings({ ghost: data.value }); hap.tap(); },
    theme: ({ data }) => { store.setSettings({ theme: data.value }); hap.tap(); },
    'focus-limit': ({ data }) => {
      const n = Number(data.value);
      store.setSettings({ focusLimit: n });
      hap.tap();
      const over = focusHabits().length - n;
      if (over > 0) app.toast(`${over} more in focus than the new limit. Choose which to keep.`, { action: { label: 'Choose', fn: () => app.go('plan/habits/sort') } });
    },
    briefing: () => store.setSettings({ briefing: store.settings().briefing === false }),
    haptics: () => { const v = store.settings().haptics === false; store.setSettings({ haptics: v }); hap.setEnabled(v); },
    'notif-master': async () => {
      const nt = store.settings().notifications;
      if (!nt.enabled) await requestPermission();
      store.setSettings({ notifications: { ...store.settings().notifications, enabled: !nt.enabled } });
    },
    notif: ({ data }) => {
      const nt = store.settings().notifications;
      store.setSettings({ notifications: { ...nt, [data.k]: { ...(nt[data.k] || {}), on: !isOn(nt, data.k), since: new Date().toISOString() } } });
    },
  },
  inputs: {
    profile: ({ el, value }) => {
      const k = el.dataset.k;
      const numeric = ['age', 'heightCm', 'startBodyFat', 'goalBodyFat'].includes(k);
      // Numbers outside what a person can be are refused; the field goes back to what's saved.
      const RANGE = { age: [10, 110], heightCm: [100, 250], startBodyFat: [3, 60], goalBodyFat: [3, 60] };
      if (numeric && (n(value) == null || n(value) < RANGE[k][0] || n(value) > RANGE[k][1])) return;
      if (!numeric && !value.trim()) return;
      // Your day's times are linked: wake, training, work and lights out move what hangs off them.
      if (['wakeTime', 'trainTime', 'workStart', 'workEnd', 'bedTime'].includes(k)) { import('../domain/day-blocks.js').then((D) => D.setTime(k, value.trim())); return; }
      store.setProfile({ [k]: numeric ? n(value) : value.trim() });
    },
    steps: ({ value }) => {
      const v = n(value);
      if (!v || v < 500) return;
      const t = Math.round(v / 100) * 100;
      store.update('habits', 'h-steps', { target: t, min: Math.round(t * 0.9 / 100) * 100, ramp: null });
    },
    'start-weight': ({ value }) => { const kg = kgIn(n(value)); if (kg >= 20 && kg <= 400) store.setProfile({ startWeightKg: Math.round(kg * 10) / 10 }); },
    target: ({ el, value }) => {
      const v = n(value);
      if (v == null || v <= 0) return;
      const t = store.settings().targets;
      const k = el.dataset.k;
      const patch = { [k]: v };
      if (k === 'proteinG') { patch.proteinHitG = Math.round(v * 0.9); }
      if (k === 'waterMl') { patch.waterHitMl = Math.round(v * 0.9 / 100) * 100; }
      if (k === 'sleepH') { patch.sleepMinH = Math.max(6, v - 0.5); }
      store.setSettings({ targets: { ...t, ...patch } });
      syncHabitTargets(k, v, patch);
    },
    'notif-time': ({ el, value }) => { const nt = store.settings().notifications; store.setSettings({ notifications: { ...nt, [el.dataset.k]: { ...nt[el.dataset.k], time: value, since: new Date().toISOString() } } }); },
    'notif-every': ({ el, value }) => { const nt = store.settings().notifications; store.setSettings({ notifications: { ...nt, [el.dataset.k]: { ...nt[el.dataset.k], every: Number(value), since: new Date().toISOString() } } }); },
  },
};

/** Keep the seeded habits in step with edited targets. */
function syncHabitTargets(k, v, patch) {
  const map = { proteinG: ['h-protein', { target: v, min: patch.proteinHitG }], waterMl: ['h-water', { target: v, min: patch.waterHitMl }],
    sleepH: ['h-sleep', { target: v, min: patch.sleepMinH }], movementBreaks: ['h-breaks', { target: v, min: Math.max(1, v - 2) }] };
  const m = map[k];
  if (m && store.get('habits', m[0])) store.update('habits', m[0], m[1]);
}
