// Quiet, adaptive reminders.
// • Fires only when something is actually undone.
// • If a habit is usually done before its reminder, the reminder pauses itself.
// • If a reminder is ignored three times in a row, it stops and suggests a new time.
// Delivery: in-app banner when Life OS is visible; a system notification when it
// isn't and permission was granted. No push server, so nothing arrives while iOS
// has fully suspended the app — the settings screen says so plainly.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import { habit, isDone, dueOn, activeHabits, logId } from './habits.js';
import { today, minutesOfDay, parseHM, weekday, lastNDays, fmtHM } from './dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

const LINKED = { morning: 'h-morning-reset', workout: 'h-training', evening: 'h-evening', weeklyReview: 'h-weekly-review' };
let timer = null;
let banner = null;

export const permissionState = () => (!('Notification' in window) ? 'unsupported' : Notification.permission);
export async function requestPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') return permissionState();
  try { return await Notification.requestPermission(); } catch { return permissionState(); }
}

export function start() {
  clearInterval(timer);
  timer = setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  setTimeout(tick, 4000);
}

const logsFor = (key) => store.all('reminderLog').filter((r) => r.key === key).sort((a, b) => (a.at < b.at ? 1 : -1));
const firedToday = (slot) => store.onDate('reminderLog', today()).some((r) => r.slot === slot);
const lastFired = (key) => store.onDate('reminderLog', today()).filter((r) => r.key.startsWith(key)).sort((a, b) => (a.at < b.at ? 1 : -1))[0];

/** Done before the reminder time on most recent days → no longer needed. */
function learned(habitId, time) {
  const h = habit(habitId);
  if (!h || !time) return false;
  const t = parseHM(time);
  const days = lastNDays(today(), 8).slice(0, 7);
  let early = 0;
  for (const d of days) {
    const l = store.get('habitLogs', logId(h.id, d));
    if (l && isDone(h, d) && l.updatedAt && l.updatedAt.slice(0, 10) === d && minutesOfDay(new Date(l.updatedAt)) <= t) early++;
  }
  return early >= 5;
}

/** Ignored three times in a row (dismissed, or never acted on). */
// Changing a reminder's time or switching it back on gives it a fresh start.
function ignoredStreak(key) {
  const since = store.settings()?.notifications?.[key]?.since || '';
  const recent = logsFor(key).filter((r) => r.outcome !== 'skipped' && r.at >= since).slice(0, 3);
  if (recent.length < 3) return false;
  return recent.every((r) => r.outcome === 'dismissed' || (r.outcome === 'shown' && r.habitId && !isDone(habit(r.habitId) || {}, r.date)));
}

function candidates(now) {
  const s = store.settings();
  const nt = s.notifications || {};
  const p = store.profile();
  const d = today();
  const m = minutesOfDay(now);
  const work = (p.workDays || []).includes(weekday(d));
  const inWork = work && m >= parseHM(p.workStart) && m < parseHM(p.workEnd);
  const out = [];
  const at = (cat, time, habitId, title, body, url) => {
    if (!nt[cat]?.on || !time) return;
    const tm = parseHM(time);
    if (m < tm || m > tm + 90) return;
    const h = habitId ? habit(habitId) : null;
    if (h && (!dueOn(h, d) || isDone(h, d))) return;
    out.push({ key: cat, cat, habitId, title, body, url, time });
  };
  const tpl = F.plannedTemplate(d);
  at('morning', nt.morning?.time, LINKED.morning, 'Morning reset', 'Water, light, prayer, then mobility.', './#/today');
  if (tpl) at('workout', nt.workout?.time, LINKED.workout, `Training at ${p.trainTime}`, tpl.name, './#/body/training');
  at('evening', nt.evening?.time, LINKED.evening, 'Evening routine', 'Kit ready, tomorrow reviewed, screens down soon.', './#/today');
  if (weekday(d) === 7) at('weeklyReview', nt.weeklyReview?.time, LINKED.weeklyReview, 'Weekly review', '15–30 minutes. One change for next week.', './#/more/review/week');

  const every = (cat, minutes, cond, make) => {
    if (!nt[cat]?.on || !cond) return;
    const last = lastFired(cat);
    const since = last ? (now - new Date(last.at)) / 60000 : Infinity;
    if (since < (nt[cat].every || minutes)) return;
    const item = make();
    if (item) out.push({ cat, key: `${cat}:${Math.floor(m / (nt[cat].every || minutes))}`, ...item });
  };
  every('movement', 50, inWork && m >= parseHM(p.workStart) + 45, () => {
    const r = M.review(d);
    const target = s.targets.movementBreaks || 8;
    if ((r?.breaks || 0) >= target) return null;
    return { title: 'Move for 1–2 minutes', body: 'Stand, walk, roll the shoulders, a few chin tucks.', counter: 'breaks', url: './#/today' };
  });
  every('eyes', 20, inWork, () => ({ title: 'Look away for 20 seconds', body: 'Something about 20 feet away. A comfort habit, not a treatment.', counter: 'eyeBreaks', url: './#/today' }));
  const wake = parseHM(p.wakeTime);
  every('water', 120, m >= wake + 60 && m < parseHM(p.workEnd), () => {
    const target = s.targets.waterMl;
    const pace = target * Math.min(1, (m - wake) / (parseHM(p.workEnd) - wake));
    const have = M.waterMl(d);
    if (have >= pace - 300) return null;
    return { title: 'Water', body: `${(have / 1000).toFixed(1)} L so far. A bottle now keeps you on pace.`, water: true, url: './#/today' };
  });
  if (nt.habits?.on) {
    for (const h of activeHabits()) {
      if (!h.reminder || LINKED[h.id]) continue;
      const tm = parseHM(h.reminder);
      if (m < tm || m > tm + 90 || !dueOn(h, d) || isDone(h, d)) continue;
      out.push({ cat: 'habits', key: `habit:${h.id}`, habitId: h.id, title: h.name, body: h.description || 'Still open for today.', url: `./#/habits/${h.id}`, time: h.reminder });
    }
  }
  return out;
}

function record(c, outcome) {
  store.put('reminderLog', { date: today(), key: c.key.split(':').length > 1 && c.cat !== 'habits' ? c.cat : c.key, slot: c.key, cat: c.cat, habitId: c.habitId || null, at: new Date().toISOString(), outcome });
}

async function tick() {
  const s = store.settings();
  if (!s?.notifications?.enabled) return;
  const now = new Date();
  for (const c of candidates(now)) {
    if (firedToday(c.key)) continue;
    const baseKey = c.cat === 'habits' ? c.key : c.cat;
    if (c.habitId && c.time && learned(c.habitId, c.time)) { record(c, 'skipped'); continue; }
    if (ignoredStreak(baseKey)) { record(c, 'skipped'); continue; }
    await deliver(c);
    return; // one at a time, never a pile-up
  }
}

async function deliver(c) {
  if (document.visibilityState === 'visible') { showBanner(c); return; }
  if (permissionState() === 'granted' && navigator.serviceWorker?.ready) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(c.title, { body: c.body, tag: c.cat, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', data: { url: c.url }, silent: false });
      record(c, 'shown');
    } catch (err) { console.warn('notification failed', err); }
  }
}

function showBanner(c) {
  banner?.remove();
  const el = document.createElement('div');
  el.className = 'reminder';
  el.setAttribute('role', 'status');
  el.innerHTML = String(html`<span class="reminder-ic">${icon(c.counter === 'eyeBreaks' ? 'scan-eye' : c.counter ? 'person-standing' : c.water ? 'droplet' : 'bell', { size: 18 })}</span>
    <span class="reminder-text"><strong>${c.title}</strong><span>${c.body}</span></span>
    <button type="button" class="btn btn--primary btn--sm" data-r="done">${c.water ? '+500 ml' : c.counter ? 'Done' : 'Open'}</button>
    <button type="button" class="icon-btn icon-btn--sm" data-r="no" aria-label="Not now">${icon('x', { size: 16 })}</button>`);
  document.body.appendChild(el);
  banner = el;
  requestAnimationFrame(() => el.classList.add('is-open'));
  let settled = false;
  const close = (outcome) => {
    if (settled) return;
    settled = true;
    record(c, outcome);
    el.classList.remove('is-open');
    setTimeout(() => el.remove(), 300);
  };
  el.querySelector('[data-r="done"]').addEventListener('click', async () => {
    const S = await import('../screens/sheets.js');
    if (c.water) S.addWater(today(), 500);
    else if (c.counter) S.bumpCounter(today(), c.counter, 1);
    else location.hash = c.url.replace('./', '');
    close('acted');
  });
  el.querySelector('[data-r="no"]').addEventListener('click', () => close('dismissed'));
  setTimeout(() => close('dismissed'), 45000);
}

/** Human notes for the settings screen. */
export function stats() {
  const s = store.settings();
  const nt = s?.notifications || {};
  const out = {};
  for (const [cat, hid] of Object.entries(LINKED)) {
    if (!nt[cat]?.on) continue;
    if (learned(hid, nt[cat].time)) out[cat] = { note: `Paused — you’ve been doing this before ${nt[cat].time} without a nudge.` };
    else if (ignoredStreak(cat)) out[cat] = { note: `Skipped 3 times in a row. Would a different time than ${nt[cat].time} suit you better?` };
  }
  return out;
}

/** Suggestions surfaced on Today when a reminder isn't working. */
export function suggestions() {
  const s = store.settings();
  if (!s?.notifications?.enabled) return [];
  const out = [];
  for (const cat of Object.keys(LINKED)) {
    if (s.notifications[cat]?.on && ignoredStreak(cat)) {
      out.push({ cat, time: s.notifications[cat].time, title: `The ${s.notifications[cat].time} ${cat === 'weeklyReview' ? 'review' : cat} reminder isn’t landing`,
        body: 'You’ve skipped it three times. Rather than nudging harder, try a time that fits your day better.' });
    }
  }
  return out;
}

export { fmtHM };
