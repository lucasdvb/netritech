import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayOf, dayAt, setDayEnd, dayEndMinutes, addDays, startOfWeek, weekday } from '../../js/domain/dates.js';

const at = (y, m, d, h, min = 0) => new Date(y, m - 1, d, h, min);

test('until the day ends, a late night still belongs to the day before', () => {
  setDayEnd('03:00');
  assert.equal(dayOf(at(2026, 10, 8, 0, 30)), '2026-10-07');
  assert.equal(dayOf(at(2026, 10, 8, 2, 59)), '2026-10-07');
  assert.equal(dayOf(at(2026, 10, 8, 3, 0)), '2026-10-08');
  assert.equal(dayOf(at(2026, 10, 8, 23, 59)), '2026-10-08');
});

test('a day that ends at midnight behaves like the calendar', () => {
  setDayEnd('00:00');
  assert.equal(dayOf(at(2026, 10, 8, 0, 30)), '2026-10-08');
  setDayEnd(null);
  assert.equal(dayEndMinutes(), 0);
  setDayEnd('03:00');
});

test('the day can end no later than 06:00', () => {
  setDayEnd('09:00');
  assert.equal(dayEndMinutes(), 360);
  setDayEnd('03:00');
});

test('crossing months and years, and weeks starting on Monday', () => {
  setDayEnd('03:00');
  assert.equal(dayOf(at(2027, 1, 1, 1)), '2026-12-31');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(weekday('2026-10-05'), 1);
  assert.equal(startOfWeek('2026-10-11'), '2026-10-05');
});

test('a stored timestamp belongs to the local day, not its UTC date', () => {
  const tz = process.env.TZ;
  try {
    setDayEnd('03:00');
    process.env.TZ = 'Australia/Sydney'; // 06:30 on the 8th there is still the 7th in UTC
    assert.equal(dayAt('2026-10-07T20:30:00.000Z'), '2026-10-08');
    process.env.TZ = 'America/Los_Angeles'; // 21:00 on the 7th there is already the 8th in UTC
    assert.equal(dayAt('2026-10-08T04:00:00.000Z'), '2026-10-07');
    process.env.TZ = 'Indian/Mauritius'; // 01:30 on the 8th is still the 7th until the day ends
    assert.equal(dayAt('2026-10-07T21:30:00.000Z'), '2026-10-07');
    assert.equal(dayAt('2026-10-07'), '2026-10-07', 'a plain date stays as it is');
    assert.equal(dayAt('2026-10-07T18:00:00'), '2026-10-07', 'a local time without a zone too');
    assert.equal(dayAt(''), null);
    assert.equal(dayAt('not a date'), null);
  } finally {
    if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz;
  }
});
