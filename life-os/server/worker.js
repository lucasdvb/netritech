// Life OS server: sync between your devices, and (optionally) reminders while the app is closed.
// A Cloudflare Worker you deploy to your own account, with one D1 database bound as DB. Setup
// steps: server/README.md, or You › Sync in the app. Reminders also need its once-a-minute
// trigger (a cron of "* * * * *").
//
// It never sees your data. Each device encrypts every record with a key derived from your sync
// key before sending it, and names it with a keyed hash, so all this server holds is opaque
// names, timestamps and ciphertext. It keeps the newest version of each record (by its own
// timestamp) and numbers changes so a device can ask for everything since it last looked.
//
// The first sync key that uses the server owns it; others are turned away (set OPEN = "1" in the
// Worker's variables to allow more than one).
//
// Reminders (Web Push) are the one thing it can read, because it has to send them: for each device
// that turned them on, its push address and the times, titles and words of its reminders, plus
// which were done today so they aren't sent. Nothing else, and no history.

const VERSION = 3;
const PAGE = 400;                 // records per answer when a device catches up
const MAX_ITEM = 2_600_000;       // an encrypted record (base64): D1 rows stop at 2 MB of data
const MAX_BODY = 40_000_000;

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS spaces (space TEXT PRIMARY KEY, auth TEXT NOT NULL, created INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS items (seq INTEGER PRIMARY KEY AUTOINCREMENT, space TEXT NOT NULL, k TEXT NOT NULL, ts TEXT NOT NULL, dev TEXT, data TEXT NOT NULL, UNIQUE (space, k))',
  'CREATE INDEX IF NOT EXISTS items_by_seq ON items (space, seq)',
  'CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  "CREATE TABLE IF NOT EXISTS push (space TEXT NOT NULL, dev TEXT NOT NULL, sub TEXT NOT NULL, plan TEXT NOT NULL, sent TEXT NOT NULL DEFAULT '{}', updated INTEGER NOT NULL, PRIMARY KEY (space, dev))",
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });
const bad = (error, status = 400) => json({ error }, status);

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/;
const HEX64 = /^[0-9a-f]{64}$/;
const KEY = /^[A-Za-z0-9_-]{16,64}$/;

async function sha256(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ready = new WeakMap();
/** Create the tables on first use, so setting up the database takes no SQL. */
function ensure(db) {
  if (!ready.has(db)) ready.set(db, db.batch(SCHEMA.map((s) => db.prepare(s))).catch((e) => { ready.delete(db); throw e; }));
  return ready.get(db);
}

/** Check the space's key, or claim the server for it if nobody has. */
async function admit(db, env, space, auth) {
  const hash = await sha256(auth);
  const row = await db.prepare('SELECT auth FROM spaces WHERE space = ?').bind(space).first();
  if (row) return row.auth === hash ? { ok: true } : { error: 'That sync key doesn’t match this server.', status: 403 };
  const n = await db.prepare('SELECT COUNT(*) AS n FROM spaces').first();
  if (n?.n > 0 && env.OPEN !== '1') return { error: 'This server already belongs to another sync key.', status: 403 };
  await db.prepare('INSERT INTO spaces (space, auth, created) VALUES (?, ?, ?)').bind(space, hash, Date.now()).run();
  return { ok: true, created: true };
}

/**
 * POST /sync { space, auth, dev, since, push: [{ k, ts, d }] }
 * Stores what's pushed (a record replaces the stored one only when its timestamp is newer), then
 * answers with what changed after `since`, leaving out what this device itself last wrote.
 */
async function sync(req, env) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_BODY) return bad('Too much at once.', 413);
  // Measured as it arrives too: a request sent in chunks has no length up front.
  let body;
  try { const text = await req.text(); if (text.length > MAX_BODY) return bad('Too much at once.', 413); body = JSON.parse(text); } catch { return bad('Not JSON.'); }
  const { space, auth, dev = null, since = 0, push = [] } = body || {};
  if (!HEX64.test(space || '') || !HEX64.test(auth || '')) return bad('Missing or malformed key.');
  if (!Number.isInteger(since) || since < 0 || !Array.isArray(push) || push.length > 2000) return bad('Malformed request.');
  if (dev != null && !KEY.test(dev)) return bad('Malformed device.');
  const db = env.DB;
  if (!db) return bad('The server has no database bound as DB.', 500);
  await ensure(db);
  const a = await admit(db, env, space, auth);
  if (a.error) return bad(a.error, a.status);
  const stmts = [];
  // A timestamp from the future would pin a record so nothing could ever replace it.
  const soon = new Date(Date.now() + 86400000).toISOString();
  for (const it of push) {
    if (!it || !KEY.test(it.k || '') || typeof it.ts !== 'string' || it.ts.length > 40 || typeof it.d !== 'string' || it.d.length > MAX_ITEM) return bad('Malformed record.');
    // A timestamp that isn't one, or is from the future, would pin the record forever: set aside.
    if (!ISO.test(it.ts) || it.ts > soon) continue;
    // Newer wins: drop an older copy, then insert (ignored if a newer copy is still there). The
    // fresh row takes the next number, so it's seen by every device that looked before.
    stmts.push(db.prepare('DELETE FROM items WHERE space = ? AND k = ? AND ts < ?').bind(space, it.k, it.ts));
    stmts.push(db.prepare('INSERT OR IGNORE INTO items (space, k, ts, dev, data) VALUES (?, ?, ?, ?, ?)').bind(space, it.k, it.ts, dev, it.d));
  }
  if (stmts.length) await db.batch(stmts);
  const rows = (await db.prepare('SELECT seq, k, dev, data FROM items WHERE space = ? AND seq > ? ORDER BY seq LIMIT ?').bind(space, since, PAGE + 1).all()).results || [];
  const page = rows.slice(0, PAGE);
  const top = page.length ? page[page.length - 1].seq : since;
  return json({
    v: VERSION,
    // A server that's new to this key while the device has been here before was reset: send everything again.
    reset: !!a.created && since > 0,
    seq: top,
    more: rows.length > PAGE,
    items: page.filter((r) => !dev || r.dev !== dev).map((r) => ({ k: r.k, d: r.data })),
  });
}

/* ---------- reminders while the app is closed (Web Push: RFC 8030, 8291, 8292) ---------- */

const te = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (String(s).length % 4)) % 4)), (c) => c.charCodeAt(0));
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let i = 0; for (const p of parts) { out.set(p, i); i += p.length; } return out; };

const vapidCache = new WeakMap();
/** The server's own signing key for push (made the first time, then kept in the database). */
async function vapid(db) {
  if (vapidCache.has(db)) return vapidCache.get(db);
  let row = await db.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  if (!row) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const v = JSON.stringify({ jwk: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) });
    await db.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('vapid', ?)").bind(v).run();
    row = await db.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  }
  const { jwk, pub } = JSON.parse(row.v);
  const out = { pub, key: await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']) };
  vapidCache.set(db, out);
  return out;
}

const hkdf = async (salt, ikm, info, bytes) => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info },
  await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), bytes * 8));

/** Encrypt a message for one browser (RFC 8291, aes128gcm): only that browser can read it. */
export async function encrypt(keys, plain) {
  const uaPub = unb64u(keys.p256dh);
  const secret = unb64u(keys.auth);
  const mine = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', mine.publicKey));
  const theirs = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: theirs }, mine.privateKey, 256));
  const ikm = await hkdf(secret, shared, concat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await crypto.subtle.importKey('raw', await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16), 'AES-GCM', false, ['encrypt']);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, concat(plain, new Uint8Array([2]))));
  const head = new Uint8Array(86);
  head.set(salt);
  new DataView(head.buffer).setUint32(16, 4096);
  head[20] = 65;
  head.set(asPub, 21);
  return concat(head, body);
}

/** Send one message to a push address, signed with the server's key (VAPID). */
async function send(sub, message, v, subject) {
  const aud = new URL(sub.endpoint).origin;
  const part = (o) => b64u(te.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.key, te.encode(unsigned));
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { authorization: `vapid t=${unsigned}.${b64u(sig)}, k=${v.pub}`, 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '3600', urgency: 'normal' },
    body: await encrypt(sub.keys, te.encode(JSON.stringify(message))),
  });
  return { ok: res.ok, gone: res.status === 404 || res.status === 410, status: res.status };
}

const ITEM = /^[A-Za-z0-9_:-]{1,64}$/;
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const minutes = (hm) => { const m = HM.exec(hm || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

/** The date, minute of the day and weekday (1 = Monday) at `now` in a time zone. */
export function localTime(now, tz) {
  let parts;
  try {
    parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(now).map((p) => [p.type, p.value]));
  } catch { return localTime(now, 'UTC'); }
  return { date: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute), wd: WEEKDAY[parts.weekday] };
}

/** The reminders due now from one device's plan: at their time (up to 10 minutes late), on their day, not done, not sent. */
export function due(plan, sent, now) {
  const t = localTime(now, plan.tz);
  const done = plan.done?.date === t.date ? new Set(plan.done.ids || []) : new Set();
  return { t, items: (plan.items || []).filter((it) => {
    const at = minutes(it.at);
    if (at == null || t.min < at || t.min > at + 10) return false;
    if (it.days?.length && !it.days.includes(t.wd)) return false;
    if (it.dates && !it.dates.includes(t.date)) return false;
    return sent[it.id] !== t.date && !done.has(it.id);
  }) };
}

/** Send what's due on every device. Runs once a minute from the Worker's cron trigger. */
export async function sendDue(env, now = new Date()) {
  const db = env.DB;
  if (!db) return 0;
  await ensure(db);
  const rows = (await db.prepare('SELECT space, dev, sub, plan, sent FROM push').all()).results || [];
  let count = 0;
  for (const row of rows) {
    let plan, sent, sub;
    try { plan = JSON.parse(row.plan); sent = JSON.parse(row.sent); sub = JSON.parse(row.sub); } catch { continue; }
    const { t, items } = due(plan, sent, now);
    if (!items.length) continue;
    const v = await vapid(db);
    const subject = /^https:\/\//.test(plan.origin || '') ? plan.origin : 'mailto:life-os@example.com';
    let gone = false;
    for (const it of items) {
      const r = await send(sub, { title: it.title, body: it.body || '', url: it.url || '', tag: it.id }, v, subject).catch(() => ({ ok: false }));
      if (r.gone) { gone = true; break; }
      if (r.ok) { sent[it.id] = t.date; count++; }
    }
    if (gone) { await db.prepare('DELETE FROM push WHERE space = ? AND dev = ?').bind(row.space, row.dev).run(); continue; }
    const keep = Object.fromEntries(Object.entries(sent).filter(([, d]) => d === t.date));
    await db.prepare('UPDATE push SET sent = ? WHERE space = ? AND dev = ?').bind(JSON.stringify(keep), row.space, row.dev).run();
  }
  return count;
}

/** Check a device's plan: only times, days, short words and links, and not too many. */
function cleanPlan(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.items) || p.items.length > 120) return null;
  const str = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
  const items = [];
  for (const it of p.items) {
    if (!it || !ITEM.test(it.id || '') || minutes(it.at) == null) return null;
    const days = Array.isArray(it.days) ? it.days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7) : null;
    const dates = Array.isArray(it.dates) ? it.dates.filter((d) => DAY.test(d)).slice(0, 31) : null;
    items.push({ id: `${it.id}`, at: it.at, ...(days?.length ? { days } : {}), ...(dates ? { dates } : {}), title: str(it.title, 80), body: str(it.body, 160), url: str(it.url, 300) });
  }
  const ids = Array.isArray(p.done?.ids) ? p.done.ids.filter((x) => typeof x === 'string').slice(0, 200) : [];
  return { tz: str(p.tz, 60), origin: str(p.origin, 200), items, done: { date: DAY.test(p.done?.date || '') ? p.done.date : '', ids } };
}

/**
 * POST /push { space, auth, dev, sub, plan } turns reminders on for this device or updates them;
 * with sub: null it turns them off. GET /push/key is the key browsers subscribe with.
 */
async function push(req, env) {
  let body;
  try { body = await req.json(); } catch { return bad('Not JSON.'); }
  const { space, auth, dev, sub = null, plan = null } = body || {};
  if (!HEX64.test(space || '') || !HEX64.test(auth || '') || !KEY.test(dev || '')) return bad('Missing or malformed key.');
  const db = env.DB;
  if (!db) return bad('The server has no database bound as DB.', 500);
  await ensure(db);
  const a = await admit(db, env, space, auth);
  if (a.error) return bad(a.error, a.status);
  if (!sub) {
    await db.prepare('DELETE FROM push WHERE space = ? AND dev = ?').bind(space, dev).run();
    return json({ ok: true, on: false });
  }
  let url;
  try { url = new URL(sub.endpoint); } catch { return bad('Malformed push address.'); }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !local) || !sub.keys?.p256dh || !sub.keys?.auth) return bad('Malformed push address.');
  const clean = cleanPlan(plan);
  if (!clean) return bad('Malformed reminders.');
  const s = JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } });
  await db.prepare("INSERT INTO push (space, dev, sub, plan, sent, updated) VALUES (?, ?, ?, ?, '{}', ?) ON CONFLICT (space, dev) DO UPDATE SET sub = excluded.sub, plan = excluded.plan, updated = excluded.updated")
    .bind(space, dev, s, JSON.stringify(clean), Date.now()).run();
  return json({ ok: true, on: true, count: clean.items.length });
}

/**
 * POST /calendar { space, auth, url } reads a calendar subscription (.ics) for a device of this
 * space and passes it back as it is: most calendars don't let a web page read them directly. The
 * server keeps nothing; the calendar's text passes through once per refresh.
 */
const MAX_ICS = 4_000_000;
async function calendar(req, env) {
  let body;
  try { body = await req.json(); } catch { return bad('Not JSON.'); }
  const { space, auth, url } = body || {};
  if (!HEX64.test(space || '') || !HEX64.test(auth || '')) return bad('Missing or malformed key.');
  let u;
  try { u = new URL(String(url || '').replace(/^webcal:/i, 'https:')); } catch { return bad('That isn’t a calendar link.'); }
  if (u.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(u.hostname) || /^(10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(u.hostname)) return bad('A calendar link has to be a public https:// address.');
  const db = env.DB;
  if (!db) return bad('The server has no database bound as DB.', 500);
  await ensure(db);
  const a = await admit(db, env, space, auth);
  if (a.error) return bad(a.error, a.status);
  let res;
  try { res = await fetch(u.toString(), { headers: { accept: 'text/calendar, */*' }, redirect: 'follow', cf: { cacheTtl: 0 } }); } catch { return bad('Couldn’t reach that calendar.', 502); }
  if (!res.ok) return bad(`The calendar answered ${res.status}. Check the link is the calendar’s public or secret address.`, 502);
  const text = await res.text();
  if (text.length > MAX_ICS) return bad('That calendar is too large to read.', 413);
  if (!/BEGIN:VCALENDAR/.test(text)) return bad('That link isn’t a calendar (.ics).', 422);
  return json({ ics: text });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const { pathname } = new URL(req.url);
    try {
      if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) return json({ app: 'life-os-server', v: VERSION, ok: true, db: !!env.DB, push: true });
      if (req.method === 'POST' && pathname === '/sync') return await sync(req, env);
      if (req.method === 'GET' && pathname === '/push/key') {
        if (!env.DB) return bad('The server has no database bound as DB.', 500);
        await ensure(env.DB);
        return json({ key: (await vapid(env.DB)).pub });
      }
      if (req.method === 'POST' && pathname === '/push') return await push(req, env);
      if (req.method === 'POST' && pathname === '/calendar') return await calendar(req, env);
      return bad('Not found.', 404);
    } catch (err) {
      console.error(err);
      return bad('The server hit a problem. Nothing was lost; try again.', 500);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env, new Date(event.scheduledTime)).catch((err) => console.error(err)));
  },
};
