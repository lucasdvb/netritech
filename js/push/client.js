// Reminders when Life OS is closed (13c, opt-in): this device's reminders go to the sender on your
// own server (the sync server), which sends each one at its time unless it's done. The plan is sent
// again whenever something changes here, so a habit you've done isn't reminded. Loaded only when
// reminders are on, or from Settings.
import * as store from '../data/store.js';
import { pushPlan } from '../domain/push-plan.js';
import * as S from '../sync/engine.js';

const KEY = 'lifeos.push';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* blocked */ } };

/** { on, sentAt, count } when reminders are on on this device, else null. */
export const config = () => (read()?.on ? read() : null);

const iOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** Can this device get them: 'ok', 'install' (iPhone: only from the Home Screen app), 'nosync' or 'unsupported'. */
export function support() {
  if (iOS() && !standalone()) return 'install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (!S.config()) return 'nosync';
  return 'ok';
}

const base = () => `${location.origin}${location.pathname}`;
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const sameKey = (sub, key) => {
  const k = sub?.options?.applicationServerKey;
  if (!k) return true;
  const a = new Uint8Array(k), b = unb64u(key);
  return a.length === b.length && a.every((x, i) => x === b[i]);
};

/** Exactly what goes to the server: shown on the Settings screen. */
export const plan = () => ({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, origin: location.origin, ...pushPlan(base()) });

async function post(c, body) {
  let res;
  try {
    res = await fetch(`${c.url}/push`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: c.space, auth: c.auth, dev: c.dev, ...body }) });
  } catch { throw new Error('Can’t reach your server. Try again when you’re online.'); }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(res.status === 404 ? 'Your server needs updating for reminders: deploy the latest server code.' : out.error || `The server answered ${res.status}.`);
  return out;
}

/** Turn reminders on here: ask to notify, subscribe with the server's key, send the plan. */
export async function enable() {
  const c = await S.credentials();
  if (!c) throw new Error('Turn on sync first: reminders go through the same server.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Notifications are off for Life OS. Allow them in your iPhone’s Settings › Notifications › Life OS, then try again.' : 'Notifications weren’t allowed.');
  let key;
  try { ({ key } = await (await fetch(`${c.url}/push/key`)).json()); } catch { /* below */ }
  if (!key) throw new Error('Your server needs updating for reminders: deploy the latest server code.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub, key)) { await sub.unsubscribe(); sub = null; }
  sub ||= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(key) });
  write({ on: true });
  await publish(sub);
  start();
}

/** Turn them off here: the server forgets this device. */
export async function disable() {
  const c = await S.credentials();
  write(null);
  try { await (await (await navigator.serviceWorker.ready).pushManager.getSubscription())?.unsubscribe(); } catch { /* already gone */ }
  if (c) await post(c, { sub: null }).catch(() => {});
}

let sending = null;
/** Send the current plan. Quiet when offline: the next change or visit sends it. */
export async function publish(sub = null) {
  if (!config()) return null;
  const c = await S.credentials();
  if (!c) return null;
  sub ||= await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) { write(null); return null; }
  const p = plan();
  const out = await post(c, { sub: sub.toJSON(), plan: p });
  write({ on: true, sentAt: new Date().toISOString(), count: p.items.length });
  return out;
}
const publishSoon = () => { sending = sending || setTimeout(() => { sending = null; publish().catch(() => {}); }, 2500); };

let started = false;
/** Keep the server's copy current: on changes here, and when the app comes back to the screen. */
export function start() {
  if (started || !config()) return;
  started = true;
  store.subscribe((e) => {
    if (e.type !== 'change' || !config()) return;
    if ([...e.stores].every((s) => s === 'daySnapshots' || s === 'meta' || s === 'reminderLog')) return;
    publishSoon();
  });
  addEventListener('online', publishSoon);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') publishSoon(); });
  publishSoon();
}
