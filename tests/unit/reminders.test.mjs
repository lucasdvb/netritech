// Reminders: named like the calendar's, and quiet once their moment has passed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import { candidates } from '../../js/domain/reminders.js';
import { markRitual, seal } from '../../js/domain/rituals.js';

setDayEnd('03:00');
const at = (hm) => { const [h, m] = hm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; };
const due = (hm) => candidates(at(hm)).map((c) => c.title);

test('the morning and evening reminders are the check-in and Close the day, until each is done', async () => {
  const s = settingsSeed();
  await fresh({ profile: [profileSeed()], settings: [{ ...s, notifications: { ...s.notifications, enabled: true } }] });
  // At least an hour after the day's start, so it's still today whatever the clock says.
  if (new Date().getHours() < 4) return;
  assert.ok(due('06:15').includes('Morning check-in'), due('06:15').join(', '));
  assert.ok(due('21:10').includes('Close the day'), due('21:10').join(', '));
  markRitual(today(), 'morning');
  assert.ok(!due('06:15').includes('Morning check-in'), 'quiet after the check-in');
  seal(today());
  assert.ok(!due('21:10').includes('Close the day'), 'quiet once the day is sealed');
});
