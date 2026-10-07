import * as store from '../data/store.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, toggle, settingRow, segmented } from '../ui/components.js';
import { kgOut, kgIn, weightUnit, num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { requestPermission, permissionState, stats as reminderStats } from '../domain/reminders.js';

const n = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_ENDS = [['00:00', 'Midnight'], ['01:00', '01:00'], ['02:00', '02:00'], ['03:00', '03:00'], ['04:00', '04:00'], ['05:00', '05:00']];
const NOTIFS = [
  ['morning', 'Morning routine', 'time'], ['workout', 'Workout', 'time'], ['water', 'Water', 'every'], ['movement', 'Movement breaks (work hours)', 'every'],
  ['eyes', 'Visual breaks (work hours)', 'every'], ['evening', 'Evening routine', 'time'], ['weeklyReview', 'Weekly review (Sunday)', 'time'], ['habits', 'Habit reminders (per habit)', null],
];

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

export default {
  id: 'settings',
  title: 'Settings',
  render() {
    const s = store.settings();
    const p = store.profile();
    const nt = s.notifications;
    const perm = permissionState();
    const rs = reminderStats();
    return html`
      ${pageHead({ title: 'Settings', back: { to: 'more', label: 'More' } })}
      <section class="block block--first"><p class="section-label">Profile</p>
        <div class="set-list">
          ${profileField('Name', 'name')}
          ${profileField('Age', 'age', 'number', { attrs: 'inputmode="numeric" min="10" max="100"' })}
          ${profileField('Height', 'heightCm', 'number', { unit: 'cm', attrs: 'inputmode="numeric"' })}
          <label class="set-row"><span class="set-text"><span class="set-label">Starting weight</span></span><span class="set-ctl"><input class="input input--inline input--num" type="number" step="0.1" inputmode="decimal" value="${num(kgOut(p.startWeightKg), 1).replace(/,/g, '')}" data-change="start-weight" aria-label="Starting weight"><span class="muted small">${weightUnit()}</span></span></label>
          ${profileField('Body fat (estimate)', 'startBodyFat', 'number', { unit: '%', attrs: 'step="0.5"' })}
          ${profileField('Goal body fat', 'goalBodyFat', 'number', { unit: '%', attrs: 'step="0.5"' })}
        </div></section>
      <section class="block"><p class="section-label">Day</p>
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
      <section class="block"><p class="section-label">Targets</p>
        <div class="set-list">
          ${targetField('Protein', 'proteinG', 'g')}
          ${targetField('Calories', 'kcal', 'kcal', 50)}
          ${targetField('Calorie floor', 'kcalFloor', 'kcal', 50)}
          ${targetField('Water', 'waterMl', 'ml', 100)}
          ${targetField('Sleep', 'sleepH', 'h', 0.5)}
          ${targetField('Movement breaks', 'movementBreaks', '/day')}
        </div>
        <p class="fine-print">Steps adapt on their own: 7,000 → 8,000 → 9,000 over your first three weeks. Calories adapt from your weight trend in Nutrition.</p></section>
      <section class="block"><p class="section-label">Units</p>
        <div class="set-list">
          ${settingRow('Weight', segmented([{ id: 'kg', label: 'kg' }, { id: 'lb', label: 'lb' }], s.units.weight, { action: 'unit', name: 'Weight unit', size: 'sm', cls: 'seg--compact' }), { key: 'u-w' })}
          ${settingRow('Length', segmented([{ id: 'cm', label: 'cm' }, { id: 'in', label: 'in' }], s.units.length, { action: 'unit-len', name: 'Length unit', size: 'sm', cls: 'seg--compact' }), { key: 'u-l' })}
        </div></section>
      <section class="block"><p class="section-label">Appearance</p>
        <div class="set-list">
          ${settingRow('Theme', segmented([{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], s.theme, { action: 'theme', name: 'Theme', cls: 'seg--compact' }))}
          ${settingRow('Haptics', toggle(s.haptics !== false, { action: 'haptics', label: 'Haptics' }), { hint: 'Subtle taps where the device supports them.' })}
          ${settingRow('Show every section on Today', toggle(s.showAllSections, { action: 'all-sections', label: 'Show every section' }), { hint: 'Off: Today shows what fits the time of day.' })}
        </div></section>
      <section class="block"><p class="section-label">Reminders</p>
        <div class="card">
          <p class="card-lead" style="margin-top:0">Quiet and adaptive: if you already do something without the nudge, Life OS stops nudging. If you keep dismissing one, it asks whether a different time would suit you better.</p>
          <p class="fine-print">${perm === 'unsupported' ? 'This browser doesn’t support notifications. Reminders show inside the app while it’s open.'
            : 'Reminders arrive while Life OS is open or recently used. Reliable background notifications on iPhone need a push server, which this private, local-only version doesn’t use.'}</p>
        </div>
        <div class="set-list block-tight">
          ${settingRow('Reminders', toggle(nt.enabled, { action: 'notif-master', label: 'Reminders' }), { hint: perm === 'granted' ? 'System notifications allowed' : perm === 'denied' ? 'Notifications are blocked in system settings — in-app only' : 'In-app, plus system notifications if you allow them' })}
          ${nt.enabled ? NOTIFS.map(([k, label, kind]) => settingRow(label, html`${kind === 'time' && nt[k]?.on ? html`<input class="input input--inline" type="time" value="${nt[k].time}" data-change="notif-time" data-k="${k}" aria-label="${label} time">` : ''}
            ${kind === 'every' && nt[k]?.on ? html`<select class="input input--inline" data-change="notif-every" data-k="${k}" aria-label="${label} interval">${(k === 'eyes' ? [20, 30, 45] : k === 'water' ? [90, 120, 180] : [45, 50, 60]).map((m) => html`<option value="${m}" ${raw(nt[k].every === m ? 'selected' : '')}>every ${m} min</option>`)}</select>` : ''}
            ${toggle(nt[k]?.on, { action: 'notif', data: { k }, label })}`, { key: `n-${k}`, hint: rs[k]?.note || '' })) : ''}
        </div></section>
      <section class="block"><p class="section-label">About</p>
        <dl class="facts">
          <div><dt>Version</dt><dd>1.0 · local-first</dd></div>
          <div><dt>Habit system</dt><dd>Imported from your Life OS workbook</dd></div>
          <div><dt>Equipment</dt><dd>${p.equipment}</dd></div>
          <div><dt>Food</dt><dd>${p.diet}</dd></div>
        </dl></section>`;
  },
  actions: {
    workday: ({ data }) => {
      const v = Number(data.v);
      const set = new Set(store.profile().workDays || []);
      set.has(v) ? set.delete(v) : set.add(v);
      store.setProfile({ workDays: [...set].sort() });
      hap.tap();
    },
    unit: ({ data }) => store.setSettings({ units: { ...store.settings().units, weight: data.value } }),
    'unit-len': ({ data }) => store.setSettings({ units: { ...store.settings().units, length: data.value } }),
    theme: ({ data }) => { store.setSettings({ theme: data.value }); hap.tap(); },
    haptics: () => { const v = store.settings().haptics === false; store.setSettings({ haptics: v }); hap.setEnabled(v); },
    'all-sections': () => store.setSettings({ showAllSections: !store.settings().showAllSections }),
    'notif-master': async () => {
      const nt = store.settings().notifications;
      if (!nt.enabled) await requestPermission();
      store.setSettings({ notifications: { ...store.settings().notifications, enabled: !nt.enabled } });
    },
    notif: ({ data }) => {
      const nt = store.settings().notifications;
      store.setSettings({ notifications: { ...nt, [data.k]: { ...(nt[data.k] || {}), on: !nt[data.k]?.on, since: new Date().toISOString() } } });
    },
  },
  inputs: {
    profile: ({ el, value }) => {
      const k = el.dataset.k;
      const numeric = ['age', 'heightCm', 'startBodyFat', 'goalBodyFat'].includes(k);
      if (numeric && n(value) == null) return;
      if (!numeric && !value.trim()) return;
      store.setProfile({ [k]: numeric ? n(value) : value.trim() });
    },
    'start-weight': ({ value }) => { const kg = kgIn(n(value)); if (kg) store.setProfile({ startWeightKg: Math.round(kg * 10) / 10 }); },
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
