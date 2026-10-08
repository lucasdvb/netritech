import * as store from '../data/store.js';
import { buildBackup, inspect, restore, CSV_SETS, saveFile } from '../data/backup.js';
import { loadDemo, removeDemo, hasDemo } from '../data/demo.js';
import { safetyBackup, safetyBackups, safetyBackupFile } from '../data/migrations.js';
import { today, fmtMDY, fmtTime, dayOf, dayAt, dayInline } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, toggle, settingRow } from '../ui/components.js';
import { num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

let storageInfo = null;
async function refreshStorage() {
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const persisted = await navigator.storage?.persisted?.().catch(() => null);
  storageInfo = { usage: est?.usage ?? null, quota: est?.quota ?? null, persisted };
  app.refresh();
}
let copies = [];
async function refreshCopies() {
  copies = await safetyBackups().catch(() => []);
  app.refresh();
}
const mb = (b) => (b == null ? '—' : `${num(b / 1024 / 1024, 1)} MB`);

export default {
  id: 'data',
  title: 'Data & backup',
  render({ ui }) {
    const s = store.settings();
    const last = s.lastBackupAt;
    const records = ['habitLogs', 'weightEntries', 'nutritionLogs', 'workouts', 'journalEntries', 'measurements'].reduce((a, k) => a + store.count(k), 0);
    return html`
      ${pageHead({ title: 'Data & backup', back: { to: 'today', label: 'Today' } })}
      <p class="lead">Your data lives in this browser’s storage on this device. A backup file is the way to move it or keep it safe.</p>
      <section class="card">
        <p class="section-label">Backup</p>
        <p class="card-lead" style="margin-top:0">${last ? `Last backup ${dayInline(last.slice(0, 10))}.` : 'No backup yet.'} ${records ? `${num(records)} entries so far.` : ''}</p>
        <div class="set-list block-tight">${settingRow('Include progress photos', toggle(ui.photos, { action: 'photos', label: 'Include progress photos' }), { hint: 'Makes the file much larger. Off by default for privacy.' })}</div>
        <button type="button" class="btn btn--primary btn--block block-tight" data-action="backup">${icon('hard-drive-download', { size: 18 })} Back up my Life OS</button>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Restore</h2></div>
        <div class="card">
          <p class="card-lead" style="margin-top:0">Choose a Life OS backup file. You’ll see what’s inside and confirm before anything changes.</p>
          <label class="btn btn--soft btn--block block-tight file-btn">${icon('upload', { size: 18 })} Choose backup file<input type="file" accept="application/json,.json" class="sr-only" data-change="restore-file"></label>
        </div>
      </section>
      ${copies.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Safety copies</h2></div>
        <p class="fine-print">Saved automatically, on this device, before Life OS updates how your data is stored and before a backup is restored. The last three are kept.</p>
        <ul class="list">${copies.map((c) => html`<li data-key="copy-${c.id}"><button type="button" class="row" data-action="copy-restore" data-id="${c.id}"><span class="row-ic">${icon('history', { size: 16 })}</span><span class="row-main"><span class="row-title">${fmtMDY(dayOf(new Date(c.id)))} · ${fmtTime(new Date(c.id))}</span><span class="row-sub">${c.reason}</span></span><span class="row-right">Restore</span></button></li>`)}</ul>
      </section>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Export as CSV</h2></div>
        <ul class="list">${Object.entries(CSV_SETS).map(([k, v]) => html`<li><button type="button" class="row" data-action="csv" data-k="${k}"><span class="row-ic">${icon('file-spreadsheet', { size: 16 })}</span><span class="row-main"><span class="row-title">${v.label}</span></span><span class="row-right">${icon('download', { size: 16 })}</span></button></li>`)}</ul>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Sample data</h2></div>
        <div class="card">${hasDemo()
          ? html`<p class="card-lead" style="margin-top:0">Six weeks of sample data is loaded and marked as sample. Removing it leaves everything you entered yourself.</p>
              <button type="button" class="btn btn--soft btn--block block-tight" data-action="demo-off">Remove sample data</button>`
          : html`<p class="card-lead" style="margin-top:0">Want to see the charts before you have history? Load six weeks of clearly labelled sample data and remove it any time.</p>
              <button type="button" class="btn btn--ghost btn--block block-tight" data-action="demo-on">Load sample data</button>`}</div>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Storage</h2><button type="button" class="link-btn" data-action="storage">Check</button></div>
        <dl class="facts">
          <div><dt>Used</dt><dd>${storageInfo ? mb(storageInfo.usage) : '—'}</dd></div>
          <div><dt>Protected from cleanup</dt><dd>${storageInfo?.persisted == null ? '—' : storageInfo.persisted ? 'Yes' : 'Not yet — install to Home Screen'}</dd></div>
        </dl>
        <p class="fine-print">Safari may clear website data that isn’t used for a while. Adding Life OS to your Home Screen and keeping regular backups avoids surprises.</p>
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">Reset</h2></div>
        <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="reset">Erase everything on this device</button>
      </section>`;
  },
  mount() { refreshStorage(); refreshCopies(); },
  actions: {
    photos: ({ ui }) => { ui.photos = !ui.photos; app.refresh(); },
    'copy-restore': async ({ data }) => {
      const ok = await app.confirm({ title: 'Restore this safety copy?', body: 'Your data goes back to how it was when the copy was saved. What’s here now is kept as a new safety copy first.', confirm: 'Restore', tone: 'danger' });
      if (!ok) return;
      try {
        await doRestore(await safetyBackupFile(data.id), 'replace', 'Before restoring a safety copy');
      } catch (err) {
        console.error(err);
        app.toast(`${err.message} Nothing was changed.`, { tone: 'danger' });
      }
    },
    backup: async ({ ui }) => {
      try {
        const data = await buildBackup({ includePhotos: !!ui.photos });
        const res = await saveFile(`life-os-backup-${today()}.json`, JSON.stringify(data));
        if (res !== 'cancelled') { store.setSettings({ lastBackupAt: new Date().toISOString() }); app.toast('Backup saved', { icon: 'check' }); }
      } catch (err) {
        console.error(err);
        app.toast('Couldn’t create the backup. Your data is untouched. Try again.', { tone: 'danger' });
      }
    },
    csv: async ({ data }) => {
      const set = CSV_SETS[data.k];
      await store.complete();
      await saveFile(`life-os-${data.k}-${today()}.csv`, set.make(), 'text/csv');
    },
    'demo-on': async () => { await loadDemo(); hap.success(); app.toast('Sample data loaded. Remove it here any time.'); },
    'demo-off': async () => { await removeDemo(); app.toast('Sample data removed'); },
    storage: () => { refreshStorage(); navigator.storage?.persist?.().then(refreshStorage); },
    reset: async () => {
      const ok = await app.confirm({ title: 'Erase everything?', body: 'Every habit, log, journal entry and photo on this device will be deleted. Back up first if you might want it. This can’t be undone.', confirm: 'Erase everything', tone: 'danger' });
      if (!ok) return;
      const sure = await app.confirm({ title: 'Last check', body: 'Life OS will restart with the original habit system and no history.', confirm: 'Yes, erase', tone: 'danger' });
      if (!sure) return;
      await store.flush();
      await store.disk().clearAll();
      try { localStorage.removeItem('lifeos.theme'); } catch { /* ignore */ }
      location.reload();
    },
  },
  inputs: {
    'restore-file': async ({ el }) => {
      const file = el.files?.[0];
      el.value = '';
      if (!file) return;
      let json, info;
      try {
        json = JSON.parse(await file.text());
        info = inspect(json);
      } catch (err) {
        app.toast(err instanceof SyntaxError ? 'That file isn’t valid JSON. Nothing was changed.' : `${err.message} Nothing was changed.`, { tone: 'danger', duration: 6000 });
        return;
      }
      const total = Object.values(info.counts).reduce((a, b) => a + b, 0);
      app.sheet({
        title: 'Restore backup',
        render: () => html`<div class="form">
          <p class="sheet-note">Backup from ${dayAt(info.exportedAt) ? fmtMDY(dayAt(info.exportedAt)) : 'an unknown date'} · ${num(total)} records${info.includesPhotos ? ' · includes photos' : ''}.</p>
          <dl class="facts facts--plain">${Object.entries(info.counts).filter(([, n]) => n).map(([k, n]) => html`<div><dt>${k}</dt><dd>${num(n)}</dd></div>`)}</dl>
          <button type="button" class="btn btn--primary btn--block" data-action="merge">Merge with what’s here</button>
          <p class="fine-print">Adds anything new and keeps the newer version of anything that exists in both.</p>
          <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="replace">Replace everything on this device</button>
        </div>`,
        actions: {
          merge: async ({ sheet }) => { app.closeSheet(sheet); await doRestore(json, 'merge'); },
          replace: async ({ sheet }) => {
            app.closeSheet(sheet);
            const ok = await app.confirm({ title: 'Replace everything?', body: 'All current data on this device will be swapped for the backup. A safety copy of it is kept first, under Safety copies.', confirm: 'Replace', tone: 'danger' });
            if (ok) await doRestore(json, 'replace');
          },
        },
      });
    },
  },
};

async function doRestore(json, mode, reason = mode === 'merge' ? 'Before merging a backup' : 'Before restoring a backup') {
  try {
    // What's here now is kept as a safety copy first, so any restore can be taken back.
    await safetyBackup(reason);
    await restore(json, mode);
    hap.success();
    app.toast(mode === 'merge' ? 'Backup merged' : 'Backup restored', { icon: 'check' });
    app.go('today');
  } catch (err) {
    console.error(err);
    app.toast('Couldn’t restore that backup. Your current data is unchanged.', { tone: 'danger', duration: 6000 });
  }
}
