import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayOf, setDayEnd, dayEndMinutes, addDays, startOfWeek, weekday } from '../../js/domain/dates.js';

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
