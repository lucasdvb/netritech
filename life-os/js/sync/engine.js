// Sync between your devices through your own server (server/worker.js). Each device keeps its full
// copy and works offline; whenever it's online it sends what changed here (from the outbox) and
// takes what changed elsewhere. A record's newest version wins, by when it was last changed.
// Settings and your profile sync field by field, so a change on one device never undoes another
// field changed elsewhere, and a few settings (theme, notifications) stay with the device.
// Loaded only once sync is set up.
import * as store from '../data/store.js';
import { STORES, LOCAL_ONLY, DERIVED, DB_VERSION } from '../data/schema.js';
import { keysFrom, normalize, unb64, b64 } from './crypto.js';

const CFG = 'lifeos.sync';
const FIELDS = 'lifeos.sync.fields';
const FIELDWISE = { settings: 'app', profile: 'me' };
/** Settings that belong to this device, not to you: never sent, never replaced. */
export const DEVICE_KEYS = new Set(['theme', 'notifications', 'installDismissed', 'lastBackupAt', 'push']);
const ENVELOPE = new Set(['id', 'createdAt', 'updatedAt', 'rev', 'tz']);
/** The stores that sync record by record: all of your data but this device's own bookkeeping. */
export const SYNCED = Object.keys(STORES).filter((s) => !LOCAL_ONLY.has(s) && !DERIVED.has(s) && s !== 'photoBlobs' && !FIELDWISE[s]);
const MAX_BLOB = 1_800_000;   // photos past this (rare: pictures are shrunk) stay on their device
const CHUNK = 250;

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

/** { url, key, dev, seq, seeded } or null when sync is off on this device. */
export const config = () => read(CFG, null);
const saveConfig = (patch) => write(CFG, { ...config(), ...patch });

/* ---------- status, for the Sync screen ---------- */
let state = { status: config() ? 'idle' : 'off', at: read(`${CFG}.at`, null), error: null };
const watchers = new Set();
export const status = () => state;
export const onStatus = (fn) => { watchers.add(fn); return () => watchers.delete(fn); };
const setState = (patch) => { state = { ...state, ...patch }; if (patch.at) write(`${CFG}.at`, patch.at); watchers.forEach((f) => f(state)); };

let keys = null;
let keysFor = null;
async function keysOf(key) {
  if (keysFor !== key) { keys = await keysFrom(key); keysFor = key; }
  return keys;
}

const endpoint = (url, path) => `${String(url).trim().replace(/\/+$/, '')}${path}`;
async function call(url, body) {
  let res;
  try {
    res = await fetch(endpoint(url, '/sync'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Can’t reach your server. Check the address, or try again when you’re online.');
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out.error || `The server answered ${res.status}.`), { status: res.status });
  return out;
}

/** Is there a Life OS server at this address? Resolves to true, or throws with a readable reason. */
export async function check(url) {
  let res;
  try { res = await fetch(endpoint(url, '/health')); } catch { throw new Error('Nothing answered at that address.'); }
  const out = await res.json().catch(() => null);
  if (out?.app !== 'life-os-server') throw new Error('That address answers, but it isn’t a Life OS server.');
  if (!out.db) throw new Error('The server is there, but its database isn’t connected yet (binding DB).');
  return true;
}

const hash = (v) => { const s = JSON.stringify(v ?? null); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return `${s.length}:${h}`; };

/* ---------- what goes out ---------- */

async function sealRecord(K, s, rec) {
  return { k: await K.name(`${s}:${rec.id}`), ts: rec.updatedAt || rec.createdAt || '', d: await K.seal({ s, r: rec }) };
}

async function blobRecord(rec) {
  if (rec.deletedAt || !rec.blob) return rec.deletedAt ? rec : null;
  if (rec.blob.size > MAX_BLOB) return null;
  const { blob, ...rest } = rec;
  return { ...rest, type: blob.type, b64: b64(await blob.arrayBuffer()) };
}

/**
 * What this device has to send: settings and profile fields that changed since they last synced,
 * and every record in the outbox (or, the first time, every record there is). Returns the items
 * and `sent()`, which clears what went out once the server has it.
 */
async function outgoing(K, seeded) {
  const items = [];
  const snap = read(FIELDS, {});
  const fields = {};
  const ts = new Date().toISOString();
  for (const [s, id] of Object.entries(FIELDWISE)) {
    const rec = store.get(s, id);
    if (!rec) continue;
    for (const [f, v] of Object.entries(rec)) {
      if (ENVELOPE.has(f) || (s === 'settings' && DEVICE_KEYS.has(f))) continue;
      const key = `${s}.${f}`;
      const h = hash(v);
      if (snap[key]?.h === h) continue;
      items.push({ k: await K.name(key), ts, d: await K.seal({ s, f, v, at: ts }) });
      fields[key] = { at: ts, h };
    }
  }
  const disk = store.disk();
  const box = seeded ? await disk.getAll('outbox') : [];
  if (!seeded) {
    for (const s of SYNCED) for (const rec of store.all(s)) items.push(await sealRecord(K, s, rec));
    for (const rec of await disk.getAll('photoBlobs')) { const r = await blobRecord(rec); if (r) items.push(await sealRecord(K, 'photoBlobs', r)); }
  } else {
    for (const e of box) {
      if (FIELDWISE[e.store]) continue;
      if (e.store === 'photoBlobs') { const r = await blobRecord(await disk.get('photoBlobs', e.recId) || {}); if (r?.id) items.push(await sealRecord(K, 'photoBlobs', r)); continue; }
      if (!SYNCED.includes(e.store)) continue;
      const rec = store.get(e.store, e.recId) || store.deleted(e.store, e.recId);
      if (rec) items.push(await sealRecord(K, e.store, rec));
    }
  }
  const sent = async () => {
    write(FIELDS, { ...read(FIELDS, {}), ...fields });
    if (!box.length && seeded) return;
    // Clear the outbox, except entries changed again while this was on its way.
    const now = new Map((await disk.getAll('outbox')).map((e) => [e.id, e.at]));
    const gone = (seeded ? box : [...now.keys()].map((id) => ({ id, at: now.get(id) }))).filter((e) => now.get(e.id) === e.at);
    if (gone.length) await disk.write(gone.map((e) => ({ store: 'outbox', delete: e.id })));
  };
  return { items, sent };
}

/* ---------- what comes in ---------- */

let quietUntil = 0;
/** Apply what other devices sent: newer records, changed fields, and pictures. Returns how many changed here. */
async function incoming(K, items) {
  const recs = [];
  const blobs = [];
  const fields = {};
  for (const it of items) {
    let m;
    try { m = await K.open(it.d); } catch { continue; } // sealed with another key, or damaged
    if (m.f) (fields[m.s] ||= []).push(m);
    else if (m.s === 'photoBlobs') blobs.push(m.r);
    else if (SYNCED.includes(m.s) && m.r?.id) recs.push({ store: m.s, value: m.r });
  }
  quietUntil = Date.now() + 800;
  let n = recs.length ? store.adopt(recs) : 0;
  const snap = read(FIELDS, {});
  for (const [s, list] of Object.entries(fields)) {
    if (!FIELDWISE[s]) continue;
    const patch = {};
    for (const m of list) {
      const key = `${s}.${m.f}`;
      if (s === 'settings' && DEVICE_KEYS.has(m.f)) continue;
      if (snap[key] && snap[key].at >= m.at) continue;
      patch[m.f] = m.v;
      snap[key] = { at: m.at, h: hash(m.v) };
    }
    if (Object.keys(patch).length) { store.put(s, { ...(store.get(s, FIELDWISE[s]) || { id: FIELDWISE[s] }), ...patch }); n++; }
  }
  write(FIELDS, snap);
  if (blobs.length) {
    const disk = store.disk();
    const landed = [];
    for (const r of blobs) {
      const cur = await disk.get('photoBlobs', r.id);
      if (cur && (cur.updatedAt || '') >= (r.updatedAt || '')) continue;
      const { b64: data, type, ...rest } = r;
      await disk.write([{ store: 'photoBlobs', value: r.deletedAt ? rest : { ...rest, blob: new Blob([unb64(data)], { type }) } }]);
      landed.push(r.id);
    }
    if (landed.length) {
      const img = await import('../ui/images.js');
      landed.forEach((id) => img.forget?.(id));
      n += landed.length;
      store.put('meta', { id: 'syncPictures', at: new Date().toISOString() }); // lets screens showing pictures redraw
    }
  }
  return n;
}

/* ---------- the cycle ---------- */

let running = null;
let again = false;

/** Sync now (or right after the sync already running). Resolves when done; never throws. */
export function syncNow() {
  if (running) { again = true; return running; }
  running = cycle().finally(() => {
    running = null;
    if (again) { again = false; syncNow(); }
  });
  return running;
}

async function cycle() {
  const c = config();
  if (!c) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState({ status: 'offline' }); return; }
  setState({ status: 'syncing' });
  try {
    await store.complete();
    await store.flush();
    const K = await keysOf(c.key);
    const { items, sent } = await outgoing(K, c.seeded);
    let since = c.seq || 0;
    let more = true;
    // Everything goes out in parts; each answer brings back what changed elsewhere.
    for (let i = 0; i < items.length || more; i += CHUNK) {
      const r = await call(c.url, { space: K.space, auth: K.auth, dev: c.dev, since, push: items.slice(i, i + CHUNK) });
      if (r.reset) { saveConfig({ seq: 0, seeded: false }); write(FIELDS, {}); again = true; return; }
      await incoming(K, r.items || []);
      since = r.seq;
      more = !!r.more;
      if (i + CHUNK >= items.length && !more) break;
    }
    await sent();
    saveConfig({ seq: since, seeded: true });
    setState({ status: 'ok', at: new Date().toISOString(), error: null });
  } catch (err) {
    setState({ status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error', error: err.message });
  }
}

/* ---------- turning it on and off ---------- */

const newDev = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * First contact with a server and key: reads everything already there, without sending anything.
 * Returns { existing, records, fields, blobs, seq } for join() or begin().
 */
export async function connect(url, key) {
  await check(url);
  const K = await keysFrom(key);
  const dev = newDev();
  const got = [];
  let since = 0;
  for (let more = true; more;) {
    const r = await call(url, { space: K.space, auth: K.auth, dev, since, push: [] });
    got.push(...(r.items || []));
    since = r.seq;
    more = !!r.more;
  }
  const records = {};
  const fields = {};
  const blobs = [];
  for (const it of got) {
    let m;
    try { m = await K.open(it.d); } catch { continue; }
    if (m.f) fields[`${m.s}.${m.f}`] = m;
    else if (m.s === 'photoBlobs') blobs.push(m.r);
    else if (SYNCED.includes(m.s)) (records[m.s] ||= []).push(m.r);
  }
  const count = Object.values(records).reduce((n, l) => n + l.length, 0);
  return { url, key: normalize(key), dev, seq: since, existing: count > 0, count, records, fields, blobs };
}

/** This device starts the synced data: everything here goes up. */
export async function begin(ctx) {
  write(CFG, { url: ctx.url, key: ctx.key, dev: ctx.dev, seq: ctx.seq, seeded: false });
  write(FIELDS, {});
  setState({ status: 'idle', error: null });
  start();
  await syncNow();
}

/** This device takes the synced data: what's here now is kept as a safety copy, then replaced. */
export async function join(ctx) {
  const { safetyBackup } = await import('../data/migrations.js');
  const { restore } = await import('../data/backup.js');
  await safetyBackup('Before joining sync');
  const data = { ...ctx.records, meta: store.all('meta') };
  const snap = {};
  for (const [s, id] of Object.entries(FIELDWISE)) {
    const mine = store.get(s, id) || { id };
    const rec = { ...mine };
    for (const [key, m] of Object.entries(ctx.fields)) {
      if (m.s !== s || (s === 'settings' && DEVICE_KEYS.has(m.f))) continue;
      rec[m.f] = m.v;
      snap[key] = { at: m.at, h: hash(m.v) };
    }
    data[s] = [rec];
  }
  const live = ctx.blobs.filter((b) => !b.deletedAt && b.b64);
  if (live.length) data.photoBlobs = live.map((b) => ({ id: b.id, dataUrl: `data:${b.type || 'image/jpeg'};base64,${b.b64}` }));
  await restore({ app: 'life-os', kind: 'backup', schema: DB_VERSION, includesPhotos: true, data }, 'replace');
  await store.disk().replaceAll({ outbox: [] });
  write(CFG, { url: ctx.url, key: ctx.key, dev: ctx.dev, seq: ctx.seq, seeded: true });
  write(FIELDS, snap);
  setState({ status: 'ok', at: new Date().toISOString(), error: null });
  start();
}

/** Stop syncing on this device. Its data stays exactly as it is. */
export function stop() {
  try { localStorage.removeItem(CFG); localStorage.removeItem(FIELDS); localStorage.removeItem(`${CFG}.at`); } catch { /* blocked */ }
  setState({ status: 'off', error: null, at: null });
}

let started = false;
let timer = 0;
/** Keep in sync: on changes here, when the app comes back to the screen or online, and once a minute. */
export function start() {
  if (started || !config()) { if (config()) syncNow(); return; }
  started = true;
  store.subscribe((e) => {
    if (e.type !== 'change' || Date.now() < quietUntil || !config()) return;
    if ([...e.stores].every((s) => s === 'daySnapshots' || s === 'meta')) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, 1500);
  });
  addEventListener('online', () => syncNow());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  setInterval(() => { if (document.visibilityState === 'visible' && config()) syncNow(); }, 60000);
  syncNow();
}
