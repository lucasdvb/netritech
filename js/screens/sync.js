// You › Sync: your Life OS on every device, through a server you own (server/worker.js). Set up once
// per device with the server's address and your sync key; after that it runs by itself. Each
// device keeps its full copy and works offline, and everything is encrypted before it leaves.
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { num } from '../ui/format.js';
import { fmtTime, dayInline, dayOf, today } from '../domain/dates.js';
import * as S from '../sync/engine.js';
import { newKey, isKey } from '../sync/crypto.js';

/** When it last synced, in words: just now, 12 min ago, at 09:40, yesterday at 21:15. */
function ago(iso) {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const d = new Date(iso);
  return dayOf(d) === today() ? `at ${fmtTime(d)}` : `${dayInline(dayOf(d))} at ${fmtTime(d)}`;
}

const STATUS = {
  ok: (s) => (s.at ? `Synced ${ago(s.at)}.` : 'Synced.'),
  idle: () => 'Ready.',
  syncing: () => 'Syncing…',
  offline: () => 'Offline. Changes wait on this device and go out when you’re back online.',
  error: (s) => `Couldn’t sync: ${s.error}`,
};

const copy = async (text, what) => {
  try { await navigator.clipboard.writeText(text); hap.success(); app.toast(`${what} copied`, { icon: 'check' }); } catch { app.toast('This browser didn’t allow copying. Select it and copy by hand.'); }
};

/** The server, step by step: a free Cloudflare account, one database, one Worker. */
export function openServerGuide() {
  app.sheet({
    title: 'Your sync server',
    render: () => html`<div class="form recipe">
      <p class="sheet-note">Once, about five minutes, free. The server is yours: it holds only encrypted data it can’t read.</p>
      <ol class="recipe-steps">
        <li>Sign in at <b>dash.cloudflare.com</b> (a free account is enough).</li>
        <li><b>Storage & databases › D1</b>: create a database named <code>lifeos</code>.</li>
        <li><b>Workers & Pages › Create</b>: start from <b>Hello World</b>, name it <code>lifeos-sync</code>, and deploy.</li>
        <li><b>Edit code</b>: replace everything with the server code (copy it below), then <b>Deploy</b>.</li>
        <li>The Worker’s <b>Settings › Bindings › Add</b>: a <b>D1 database</b>, variable name <code>DB</code>, database <code>lifeos</code>.</li>
        <li>Copy the Worker’s address (it ends in <code>workers.dev</code>) and paste it here.</li>
      </ol>
      <p class="field-hint">For reminders while Life OS is closed (optional): the Worker’s <b>Settings › Trigger events › Add › Cron triggers</b>, with <code>* * * * *</code>.</p>
      <button type="button" class="btn btn--primary btn--block" data-action="sy-code">${icon('copy', { size: 18 })} Copy the server code</button>
      <p class="field-hint">The first sync key to use the server becomes its owner, so nobody else can use it.</p>
    </div>`,
    actions: {
      'sy-code': async () => {
        try {
          const res = await fetch('./server/worker.js', { cache: 'no-store' });
          if (!res.ok) throw new Error();
          await copy(await res.text(), 'Server code');
        } catch { app.toast('Couldn’t load the server code. Try again when you’re online.'); }
      },
    },
  });
}

function onView(ui) {
  const c = S.config();
  const s = S.status();
  return html`
    <section class="card sync-card" data-key="sync-status">
      <p class="sync-state">${icon(s.status === 'error' ? 'circle-alert' : s.status === 'offline' ? 'wifi-off' : 'refresh-cw', { size: 18 })}<span role="status">${(STATUS[s.status] || STATUS.idle)(s)}</span></p>
      <p class="card-lead">Every change here goes to your other devices within seconds, encrypted on this device first. Each device keeps its full copy and works offline.</p>
      <button type="button" class="btn btn--soft btn--block" data-action="sy-now"${s.status === 'syncing' ? ' disabled' : ''}>Sync now</button>
    </section>
    <section class="block" data-key="sync-add"><div class="block-head"><h2 class="block-title">Add another device</h2></div>
      <ol class="recipe-steps">
        <li>Open Life OS on it, then <b>You › Sync</b>.</li>
        <li>Paste the server address and your sync key, and choose <b>Join</b>.</li>
      </ol>
      <div class="sync-key">
        <p class="field-label">Your sync key</p>
        <p class="sync-key-val tnum">${ui.showKey ? c.key.match(/.{5}/g).join('-') : '•••••-•••••-•••••-•••••'}</p>
        <div class="btn-row"><button type="button" class="btn btn--soft btn--sm" data-action="sy-show">${ui.showKey ? 'Hide' : 'Show'}</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="sy-copy-key">Copy key</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="sy-copy-url">Copy address</button></div>
        <p class="field-hint">Keep it somewhere safe, like a password manager. It’s the only way to add a device, and the only way to read your data: without it, nobody can, not even the server.</p>
      </div>
    </section>
    <button type="button" class="btn btn--ghost btn--block" data-action="sy-off">Turn off sync on this device</button>`;
}

function offView(ui) {
  const checked = ui.checked === ui.url && ui.url;
  return html`
    <p class="lead">Your Life OS on your phone and your computer, the same everywhere. Each device keeps its full copy and works offline; changes travel through a small server you own, encrypted on the device first, so the server can’t read them.</p>
    <section class="block" data-key="sync-server"><div class="block-head"><h2 class="block-title">1 · Your server</h2><button type="button" class="link-btn" data-action="sy-guide">How to set it up</button></div>
      <label class="field"><span class="field-label">Server address</span>
        <input class="input" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://lifeos-sync.you.workers.dev" value="${ui.url || ''}" data-input="sy-url"></label>
      <button type="button" class="btn btn--soft btn--block" data-action="sy-check"${ui.busy ? ' disabled' : ''}>Check the server</button>
      ${ui.serverNote ? html`<p class="${ui.serverOk ? 'field-hint' : 'field-error'}" role="status">${ui.serverNote}</p>` : ''}
    </section>
    <section class="block" data-key="sync-key"><div class="block-head"><h2 class="block-title">2 · This device</h2></div>
      <button type="button" class="btn btn--primary btn--block" data-action="sy-start"${checked && !ui.busy ? '' : ' disabled'}>Start sync here (first device)</button>
      <label class="field"><span class="field-label">Or join with your sync key</span>
        <input class="input tnum" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value="${ui.key || ''}" data-input="sy-key"></label>
      <button type="button" class="btn btn--soft btn--block" data-action="sy-join"${checked && isKey(ui.key || '') && !ui.busy ? '' : ' disabled'}>Join</button>
      ${ui.joinNote ? html`<p class="field-error" role="alert">${ui.joinNote}</p>` : ''}
    </section>`;
}

let stopWatching = null;

export default {
  id: 'sync',
  title: 'Sync',
  render({ ui }) {
    return html`${pageHead({ title: 'Sync', back: { to: 'today', label: 'Today' } })}
      ${S.config() ? onView(ui) : offView(ui)}`;
  },
  mount() { stopWatching = S.onStatus(() => app.refresh()); },
  unmount() { stopWatching?.(); stopWatching = null; },
  inputs: {
    'sy-url': ({ value, ui }) => { ui.url = value.trim(); },
    'sy-key': ({ value, ui }) => { ui.key = value; ui.joinNote = ''; app.refresh(); },
  },
  actions: {
    'sy-guide': () => openServerGuide(),
    'sy-check': async ({ ui }) => {
      ui.busy = true; app.refresh();
      try { await S.check(ui.url); ui.checked = ui.url; ui.serverOk = true; ui.serverNote = 'Your server is ready.'; hap.success(); } catch (err) { ui.serverOk = false; ui.serverNote = err.message; }
      ui.busy = false; app.refresh();
    },
    'sy-start': async ({ ui }) => {
      ui.busy = true; app.refresh();
      try {
        const ctx = await S.connect(ui.url, newKey());
        await S.begin(ctx);
        ui.showKey = true;
        hap.success();
        app.toast('Sync is on. Your sync key is below: keep it safe.', { icon: 'check' });
      } catch (err) { ui.serverOk = false; ui.serverNote = err.message; }
      ui.busy = false; app.refresh();
    },
    'sy-join': async ({ ui }) => {
      ui.busy = true; app.refresh();
      let ctx;
      try { ctx = await S.connect(ui.url, ui.key); } catch (err) { ui.joinNote = err.message; ui.busy = false; app.refresh(); return; }
      ui.busy = false; app.refresh();
      if (!ctx.existing) {
        app.sheet({
          title: 'Nothing synced yet',
          render: () => html`<div class="form"><p class="sheet-note">Nothing is synced with this key yet. Start with this device’s data?</p>
            <button type="button" class="btn btn--primary btn--block" data-action="sy-begin">Start sync here</button></div>`,
          actions: { 'sy-begin': async ({ sheet }) => { app.closeSheet(sheet); await S.begin(ctx); hap.success(); app.toast('Sync is on.', { icon: 'check' }); app.refresh(); } },
        });
        return;
      }
      app.sheet({
        title: 'Use your synced data?',
        render: () => html`<div class="form"><p class="sheet-note">Your other device has ${num(ctx.count)} entries. They replace what’s on this device now, which is kept as a safety copy in <b>You › Data</b>.</p>
          <button type="button" class="btn btn--primary btn--block" data-action="sy-take">Use the synced data</button></div>`,
        actions: {
          'sy-take': async ({ sheet }) => {
            app.closeSheet(sheet);
            try { await S.join(ctx); hap.success(); app.toast('Joined. This device is in sync.', { icon: 'check' }); } catch (err) { app.toast(`Couldn’t join: ${err.message} Nothing was changed.`, { tone: 'danger' }); }
            app.refresh();
          },
        },
      });
    },
    'sy-now': () => S.syncNow(),
    'sy-show': ({ ui }) => { ui.showKey = !ui.showKey; app.refresh(); },
    'sy-copy-key': () => copy(S.config().key.match(/.{5}/g).join('-'), 'Sync key'),
    'sy-copy-url': () => copy(S.config().url, 'Server address'),
    'sy-off': () => app.sheet({
      title: 'Turn off sync here?',
      render: () => html`<div class="form"><p class="sheet-note">This device keeps everything it has and stops syncing. Your other devices carry on. You can join again any time with your key.</p>
        <button type="button" class="btn btn--primary btn--block" data-action="sy-stop">Turn off</button></div>`,
      actions: { 'sy-stop': ({ sheet }) => { S.stop(); app.closeSheet(sheet); app.refresh(); } },
    }),
  },
};
