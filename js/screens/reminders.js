// Every reminder on one timeline (27, 52): the check-in, training, close the day, the weekly review
// and each habit's reminder, in the order of your day, plus the nudges that repeat during work. One
// time for everything: a reminder that hangs off a block in Your day shows that block, and changing
// its time moves the block (and the habit, the routine window and the other reminders on it) with
// it, so the plan, Today, the calendar file, the iPhone cues and the reminders never disagree.
import * as store from '../data/store.js';
import * as D from '../domain/day-blocks.js';
import * as F from '../domain/fitness-core.js';
import { activeHabits, dueOn } from '../domain/habits.js';
import { scheduleLabel } from '../domain/habits-more.js';
import { LINKED } from '../domain/reminder-rules.js';
import { parseHM, fmtHM, today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const wrap = (m) => ((m % 1440) + 1440) % 1440;
const shift = (hm, mins) => fmtHM(wrap(parseHM(hm) + mins));
const blockWith = (habitId) => D.blocks().find((b) => b.ref === habitId || (b.also || []).includes(habitId)) || null;

/** The timed reminders, in the order of the day from waking: [{ key, time, title, sub, on, block, cat?, habitId? }]. */
export function timeline() {
  const nt = store.settings().notifications || {};
  const p = store.profile();
  const list = D.blocks();
  const wake = list.find((b) => b.kind === 'wake') || null;
  const train = list.find((b) => b.kind === 'train') || null;
  const plan = p.plan || {};
  const trainDays = Object.entries(plan).filter(([, id]) => id && ['strength', 'cardio'].includes(F.template(id)?.kind)).length;
  const rows = [];
  const cat = (k, title, sub, block, fallback) => rows.push({ key: k, cat: k, title, sub, block, on: !!nt[k]?.on, time: nt[k]?.time || fallback });
  cat('morning', 'Morning check-in', 'Every day', wake, wake ? shift(wake.time, 15) : '06:15');
  if (trainDays) cat('workout', 'Training', `${trainDays} day${trainDays === 1 ? '' : 's'} a week`, train, p.trainTime || '07:00');
  cat('evening', 'Close the day', 'Every day', blockWith(LINKED.evening), '21:00');
  cat('weeklyReview', 'Weekly review', 'Sundays', null, '18:00');
  for (const h of activeHabits()) {
    if (!h.reminder || Object.values(LINKED).includes(h.id)) continue;
    rows.push({ key: `habit:${h.id}`, habitId: h.id, title: h.name, sub: `${scheduleLabel(h)}${dueOn(h, today()) ? '' : ' · not today'}`, block: blockWith(h.id), on: nt.habits?.on !== false, time: h.reminder });
  }
  const from = parseHM(wake?.time || p.wakeTime || '06:00');
  const order = (t) => wrap(parseHM(t) - from);
  return rows.sort((a, b) => order(a.time) - order(b.time));
}

const NUDGES = [['water', 'Water', 'droplet', 120], ['movement', 'Move for a minute', 'person-standing', 50], ['eyes', 'Look away', 'scan-eye', 20]];

export default {
  id: 'reminders',
  title: 'Reminders',
  render() {
    const nt = store.settings().notifications || {};
    const rows = timeline();
    const row = (r) => html`<li class="${cx('rem-row', !r.on && 'is-off')}" data-key="rem-${r.key}">
      <input class="input input--inline rem-time tnum" type="time" value="${r.time}" data-change="rm-time" data-k="${r.key}" aria-label="${r.title} time" ${r.on ? '' : 'disabled'}>
      <span class="row-main"><span class="row-title">${r.title}</span>
        <span class="row-sub">${r.block ? html`${icon('link', { size: 12 })}Your day · ${r.block.title}` : `${r.sub} · its own time`}</span></span>
      ${r.cat ? toggle(r.on, { action: 'rm-on', data: { k: r.key }, label: r.title })
        : html`<button type="button" class="icon-btn icon-btn--sm" data-action="rm-off" data-k="${r.key}" aria-label="Turn off the reminder for ${r.title}">${icon('bell-off', { size: 16 })}</button>`}
    </li>`;
    return html`
      ${pageHead({ title: 'Reminders', back: { to: 'you/settings', label: 'Settings' },
        info: 'Everything that reminds you, in the order of your day. A reminder linked to Your day moves with its block: change the time here and the block, its habit and Today move too.' })}
      ${nt.enabled ? '' : html`<div class="notice">${icon('bell-off', { size: 16 })} Reminders are off. <button type="button" class="link-btn" data-action="rm-enable">Turn them on</button></div>`}
      <section class="block" data-key="timed"><div class="block-head"><h2 class="block-title">At a time</h2><span class="block-meta tnum">${rows.filter((r) => r.on).length} on</span></div>
        <ul class="list rem-list">${rows.map(row)}</ul>
        <p class="block-hint block-hint--after">Add a reminder to a habit from its page, under Edit.</p></section>
      <section class="block" data-key="nudges"><div class="block-head"><h2 class="block-title">Through the day</h2></div>
        <ul class="list">${NUDGES.map(([k, title, ic, every]) => html`<li class="row row--static" data-key="nudge-${k}">
          <span class="row-ic">${icon(ic, { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${title}</span><span class="row-sub tnum">Every ${nt[k]?.every || every} min${k === 'water' ? ' when you’re behind' : ' in work hours'}</span></span>
          ${toggle(!!nt[k]?.on, { action: 'rm-on', data: { k }, label: title })}</li>`)}</ul></section>
      <a class="card card--link sort-cta" href="#/you/settings?find=Advanced" data-action="nav" data-to="you/settings?find=Advanced">
        <span class="sort-cta-text"><span class="card-title">How they reach you</span><span class="row-sub">In the app, notifications, your calendar or your own server</span></span>
        ${icon('chevron-right', { size: 18 })}</a>`;
  },
  actions: {
    'rm-on': ({ data }) => {
      const nt = store.settings().notifications || {};
      store.setSettings({ notifications: { ...nt, [data.k]: { ...(nt[data.k] || {}), on: !nt[data.k]?.on, since: new Date().toISOString() } } });
      hap.tap();
    },
    'rm-off': ({ data }) => {
      const id = data.k.slice(6);
      const h = store.get('habits', id);
      if (!h) return;
      store.update('habits', id, { reminder: null });
      hap.tap();
      app.toast(`Reminder off for ${h.name}`, { action: { label: 'Undo', fn: () => store.update('habits', id, { reminder: h.reminder }) } });
    },
    'rm-enable': async () => {
      const { requestPermission } = await import('../domain/reminders.js');
      await requestPermission();
      store.setSettings({ notifications: { ...store.settings().notifications, enabled: true } });
    },
  },
  inputs: {
    'rm-time': ({ el, value }) => {
      if (parseHM(value) == null) return;
      const r = timeline().find((x) => x.key === el.dataset.k);
      if (!r || r.time === value) return;
      if (r.block) {
        // One time for everything: the block moves by the same amount, and with it everything on it.
        const undo = D.edit(r.block.id, { time: shift(r.block.time, parseHM(value) - parseHM(r.time)) });
        // A reminder the block doesn't carry (one set apart from it) is set here too.
        const now = timeline().find((x) => x.key === r.key);
        if (now && now.time !== value) setOwn(r, value);
        hap.tap();
        app.toast(`${r.block.title} moved too`, { action: { label: 'Undo', fn: undo } });
        return;
      }
      setOwn(r, value);
      hap.tap();
    },
  },
};

function setOwn(r, value) {
  if (r.habitId) { store.update('habits', r.habitId, { reminder: value }); return; }
  const nt = store.settings().notifications || {};
  store.setSettings({ notifications: { ...nt, [r.cat]: { ...(nt[r.cat] || {}), time: value, since: new Date().toISOString() } } });
}
