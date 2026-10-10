// Updating Life OS without losing anything: updates arrive by themselves at the address you
// installed from, and your data belongs to that address. This says so, shows the address, and
// walks through moving to a new one once (back up here, restore there).
import * as store from '../data/store.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { today } from '../domain/dates.js';

/** The address this copy of Life OS lives at (its data belongs to it). */
export const address = () => `${location.origin}${location.pathname}`.replace(/index\.html$/, '');

export function openUpdating() {
  app.sheet({
    title: 'Updating Life OS',
    size: 'tall',
    render: () => html`<div class="form updating">
      <p>Your data belongs to the address Life OS is opened from:</p>
      <p class="updating-address"><span class="tnum" data-key="address">${address()}</span>
        <button type="button" class="btn btn--soft btn--sm" data-action="up-copy">${icon('copy', { size: 16 })} Copy</button></p>
      <p class="section-label">Updates</p>
      <p>New versions arrive by themselves at this address: Life OS checks each time you open it, downloads in the background and reloads into the new version. Nothing is wiped, because it’s the same app at the same address. Settings › About › Check for updates looks right away.</p>
      <div class="notice">${icon('info', { size: 16 })}<span>A different address is a different, empty app. Updating by uploading to a new site (for example a new Netlify Drop) gives a new address, so always update the same site.</span></div>
      <p class="section-label">Moving to a new address, once</p>
      <ol class="steps">
        <li>Here: <strong>Back up now</strong> and save the file to Files.</li>
        <li>Open the new address in Safari, then <strong>Share → Add to Home Screen</strong>.</li>
        <li>Open it from the new icon: <strong>You → Data & backup → Choose backup file</strong>.</li>
        <li>Everything comes across. Delete the old icon.</li>
      </ol>
      <button type="button" class="btn btn--primary btn--block" data-action="up-backup">${icon('hard-drive-download', { size: 18 })} Back up now</button>
    </div>`,
    actions: {
      'up-copy': async () => {
        try { await navigator.clipboard.writeText(address()); hap.tap(); app.toast('Address copied', { icon: 'check' }); }
        catch { app.toast('Couldn’t copy. Press and hold the address to copy it.'); }
      },
      'up-backup': async () => {
        try {
          const { buildBackup, saveFile } = await import('../data/backup.js');
          const res = await saveFile(`life-os-backup-${today()}.json`, JSON.stringify(await buildBackup({ includePhotos: false })));
          if (res !== 'cancelled') { store.setSettings({ lastBackupAt: new Date().toISOString() }); hap.success(); app.toast('Backup saved', { icon: 'check' }); }
        } catch (err) {
          console.error(err);
          app.toast('Couldn’t create the backup. Your data is untouched. Try again.', { tone: 'danger' });
        }
      },
    },
  });
}
