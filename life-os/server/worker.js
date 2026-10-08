// Life OS server: sync between your devices, and (optionally) reminders while the app is closed.
// A Cloudflare Worker you deploy to your own account, with one D1 database bound as DB. Setup
// steps: server/README.md, or You › Sync in the app.
//
// It never sees your data. Each device encrypts every record with a key derived from your sync
// key before sending it, and names it with a keyed hash, so all this server holds is opaque
// names, timestamps and ciphertext. It keeps the newest version of each record (by its own
// timestamp) and numbers changes so a device can ask for everything since it last looked.
//
// The first sync key that uses the server owns it; others are turned away (set OPEN = "1" in the
// Worker's variables to allow more than one).

const VERSION = 1;
const PAGE = 400;                 // records per answer when a device catches up
const MAX_ITEM = 2_600_000;       // an encrypted record (base64): D1 rows stop at 2 MB of data
const MAX_BODY = 40_000_000;

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS spaces (space TEXT PRIMARY KEY, auth TEXT NOT NULL, created INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS items (seq INTEGER PRIMARY KEY AUTOINCREMENT, space TEXT NOT NULL, k TEXT NOT NULL, ts TEXT NOT NULL, dev TEXT, data TEXT NOT NULL, UNIQUE (space, k))',
  'CREATE INDEX IF NOT EXISTS items_by_seq ON items (space, seq)',
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });
const bad = (error, status = 400) => json({ error }, status);

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
  let body;
  try { body = await req.json(); } catch { return bad('Not JSON.'); }
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
  for (const it of push) {
    if (!it || !KEY.test(it.k || '') || typeof it.ts !== 'string' || it.ts.length > 40 || typeof it.d !== 'string' || it.d.length > MAX_ITEM) return bad('Malformed record.');
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

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const { pathname } = new URL(req.url);
    try {
      if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) return json({ app: 'life-os-server', v: VERSION, ok: true, db: !!env.DB });
      if (req.method === 'POST' && pathname === '/sync') return await sync(req, env);
      return bad('Not found.', 404);
    } catch (err) {
      console.error(err);
      return bad('The server hit a problem. Nothing was lost; try again.', 500);
    }
  },
};
