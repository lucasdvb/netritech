// Deploy the Life OS server to your Cloudflare account in one go, through Cloudflare's API:
// the D1 database `lifeos` (created if it's missing), the Worker `lifeos-sync` with the database
// bound as DB, its workers.dev address switched on, and (with --cron) the once-a-minute trigger
// that reminders use. Prints the address to paste into You › Sync.
//
//   CLOUDFLARE_API_TOKEN=… node server/deploy.mjs [--account <id>] [--subdomain <name>] [--cron]
//
// The token needs: Account › Workers Scripts › Edit, Account › D1 › Edit, and Account › Account
// Settings › Read (the "Edit Cloudflare Workers" template plus D1). It's read from the environment
// only, never written anywhere.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.cloudflare.com/client/v4';
const NAME = 'lifeos-sync';
const DB_NAME = 'lifeos';
const here = dirname(fileURLToPath(import.meta.url));
const arg = (flag) => { const i = process.argv.indexOf(flag); return i > 0 ? process.argv[i + 1] : null; };

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) { console.error('Set CLOUDFLARE_API_TOKEN first.'); process.exit(1); }

async function cf(path, { method = 'GET', body, form } = {}) {
  const headers = { authorization: `Bearer ${token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${API}${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.success === false) {
    const why = (out.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || res.statusText;
    throw Object.assign(new Error(`${method} ${path} → ${res.status} ${why}`), { status: res.status, errors: out.errors || [] });
  }
  return out.result;
}

// 1. The account
let account = arg('--account') || process.env.CLOUDFLARE_ACCOUNT_ID;
if (!account) {
  const list = await cf('/accounts');
  if (list.length !== 1) { console.error(`The token sees ${list.length} accounts; pass --account <id>: ${list.map((a) => `${a.id} (${a.name})`).join(', ')}`); process.exit(1); }
  account = list[0].id;
}
console.log(`account   ${account}`);

// 2. The database
let db = (await cf(`/accounts/${account}/d1/database?name=${DB_NAME}`)).find((d) => d.name === DB_NAME);
if (!db) db = await cf(`/accounts/${account}/d1/database`, { method: 'POST', body: { name: DB_NAME } });
const dbId = db.uuid || db.id;
console.log(`database  ${DB_NAME} (${dbId})`);

// 3. The Worker, with the database bound as DB
const code = readFileSync(join(here, 'worker.js'), 'utf8');
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-09-01', bindings: [{ type: 'd1', name: 'DB', id: dbId }] })], { type: 'application/json' }));
form.append('worker.js', new Blob([code], { type: 'application/javascript+module' }), 'worker.js');
await cf(`/accounts/${account}/workers/scripts/${NAME}`, { method: 'PUT', form });
console.log(`worker    ${NAME} uploaded`);

// 4. Its workers.dev address (the account picks a subdomain once)
let sub = null;
try { sub = (await cf(`/accounts/${account}/workers/subdomain`)).subdomain; } catch (e) { if (e.status !== 404) throw e; }
if (!sub) {
  const want = arg('--subdomain');
  if (!want) { console.error('This account has no workers.dev subdomain yet. Run again with --subdomain <a-name-you-like>.'); process.exit(1); }
  sub = (await cf(`/accounts/${account}/workers/subdomain`, { method: 'PUT', body: { subdomain: want } })).subdomain;
}
await cf(`/accounts/${account}/workers/scripts/${NAME}/subdomain`, { method: 'POST', body: { enabled: true } });

// 5. Reminders run once a minute (only with --cron)
if (process.argv.includes('--cron')) {
  await cf(`/accounts/${account}/workers/scripts/${NAME}/schedules`, { method: 'PUT', body: [{ cron: '* * * * *' }] });
  console.log('cron      every minute');
}

const url = `https://${NAME}.${sub}.workers.dev`;
console.log(`address   ${url}`);
// A fresh workers.dev address can take a minute to answer.
for (let i = 0; i < 12; i++) {
  try {
    const h = await (await fetch(`${url}/health`)).json();
    if (h.app === 'life-os-server') { console.log(`health    ok (database ${h.db ? 'bound' : 'MISSING'})`); process.exit(h.db ? 0 : 1); }
  } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('health    not answering yet; try the address in a minute.');
