// The calendar reader against what real calendars send: alarms inside events, time zones other than
// the device's (and their clock changes), monthly "first Monday" rules, weekday-only daily rules,
// date-only UNTIL, and cancelled or moved occurrences. Run as if on a phone in Mauritius.
process.env.TZ = 'Indian/Mauritius';
const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const ICS = await import('../../js/domain/ics-import.js');

const CAL = (...evs) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${evs.map((e) => `BEGIN:VEVENT\r\n${e.join('\r\n')}\r\nEND:VEVENT\r\n`).join('')}END:VCALENDAR\r\n`;
const NOW = new Date('2026-10-11T08:00:00');
const at = (rows) => rows.map((r) => `${r.date} ${r.start ?? 'day'}`);

test('an alarm inside an event leaves its title and length alone', () => {
  const rows = ICS.expand(CAL(['UID:a', 'SUMMARY:Board meeting', 'DTSTART:20261012T090000', 'DURATION:PT2H',
    'BEGIN:VALARM', 'ACTION:EMAIL', 'SUMMARY:Alarm notification', 'DURATION:PT5M', 'TRIGGER:-PT10M', 'END:VALARM']), 'c', NOW);
  assert.deepEqual(rows.map((r) => [r.title, r.start, r.end]), [['Board meeting', '09:00', '11:00']]);
});

test('a weekly event in New York lands on the right day and hour here, through New York’s clock change', () => {
  // Monday 20:00 in New York is Tuesday 04:00 in Mauritius (05:00 once New York leaves summer time on 1 Nov).
  const rows = ICS.expand(CAL(['UID:b', 'SUMMARY:Call', 'DTSTART;TZID=America/New_York:20261012T200000', 'DURATION:PT30M', 'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4']), 'c', NOW);
  assert.deepEqual(at(rows), ['2026-10-13 04:00', '2026-10-20 04:00', '2026-10-27 04:00', '2026-11-03 05:00']);
});

test('an exception in the event’s own zone removes that occurrence', () => {
  const rows = ICS.expand(CAL(['UID:c', 'SUMMARY:Standup', 'DTSTART;TZID=Europe/Paris:20261019T090000', 'DURATION:PT15M', 'RRULE:FREQ=WEEKLY;COUNT=3',
    'EXDATE;TZID=Europe/Paris:20261026T090000']), 'c', NOW);
  // 09:00 Paris is 11:00 here in summer time, 12:00 after Paris's change on 25 Oct.
  assert.deepEqual(at(rows), ['2026-10-19 11:00', '2026-11-02 12:00']);
});

test('Outlook zone names are understood', () => {
  const rows = ICS.expand(CAL(['UID:d', 'SUMMARY:Review', 'DTSTART;TZID=W. Europe Standard Time:20261013T100000', 'DURATION:PT1H']), 'c', NOW);
  assert.deepEqual(at(rows), ['2026-10-13 12:00']);
});

test('monthly on the first Monday, the last Friday and the last day; a yearly fourth Thursday', () => {
  const mon = ICS.expand(CAL(['UID:e', 'SUMMARY:First Monday', 'DTSTART:20261005T090000', 'DURATION:PT1H', 'RRULE:FREQ=MONTHLY;BYDAY=1MO']), 'c', NOW);
  assert.deepEqual(at(mon).slice(0, 2), ['2026-11-02 09:00', '2026-12-07 09:00']);
  const fri = ICS.expand(CAL(['UID:f', 'SUMMARY:Last Friday', 'DTSTART:20261030T170000', 'DURATION:PT1H', 'RRULE:FREQ=MONTHLY;BYDAY=-1FR']), 'c', NOW);
  assert.deepEqual(at(fri).slice(0, 2), ['2026-10-30 17:00', '2026-11-27 17:00']);
  const last = ICS.expand(CAL(['UID:g', 'SUMMARY:Rent', 'DTSTART;VALUE=DATE:20261031', 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-1']), 'c', NOW);
  assert.deepEqual(at(last).slice(0, 2), ['2026-10-31 day', '2026-11-30 day']);
  const tg = ICS.expand(CAL(['UID:h', 'SUMMARY:Thanksgiving', 'DTSTART;VALUE=DATE:20201126', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=4TH']), 'c', NOW);
  assert.deepEqual(at(tg), ['2026-11-26 day']);
});

test('a monthly rule from long ago still reaches today', () => {
  const rows = ICS.expand(CAL(['UID:i', 'SUMMARY:Old', 'DTSTART:19900115T090000', 'DURATION:PT1H', 'RRULE:FREQ=MONTHLY']), 'c', NOW);
  assert.deepEqual(at(rows).slice(0, 2), ['2026-10-15 09:00', '2026-11-15 09:00']);
});

test('a daily rule on weekdays skips the weekend; a date-only UNTIL includes its day', () => {
  const wk = ICS.expand(CAL(['UID:j', 'SUMMARY:Gym', 'DTSTART:20261008T060000', 'DURATION:PT1H', 'RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=5']), 'c', NOW);
  assert.deepEqual(at(wk), ['2026-10-12 06:00', '2026-10-13 06:00', '2026-10-14 06:00']);
  const until = ICS.expand(CAL(['UID:k', 'SUMMARY:Course', 'DTSTART:20261012T090000', 'DURATION:PT1H', 'RRULE:FREQ=DAILY;UNTIL=20261014']), 'c', NOW);
  assert.deepEqual(at(until), ['2026-10-12 09:00', '2026-10-13 09:00', '2026-10-14 09:00']);
});

test('a cancelled occurrence frees its time; one moved in from outside the window still shows', () => {
  const rows = ICS.expand(CAL(
    ['UID:l', 'SUMMARY:Standup', 'DTSTART:20261012T090000', 'DURATION:PT15M', 'RRULE:FREQ=DAILY;COUNT=3'],
    ['UID:l', 'RECURRENCE-ID:20261013T090000', 'STATUS:CANCELLED', 'SUMMARY:Standup', 'DTSTART:20261013T090000', 'DURATION:PT15M'],
    ['UID:m', 'SUMMARY:Quarterly', 'DTSTART:20260115T100000', 'DURATION:PT1H', 'RRULE:FREQ=MONTHLY;INTERVAL=3'],
    ['UID:m', 'RECURRENCE-ID:20270115T100000', 'SUMMARY:Quarterly (early)', 'DTSTART:20261201T100000', 'DURATION:PT1H'],
  ), 'c', NOW);
  assert.deepEqual(rows.filter((r) => r.title === 'Standup').map((r) => r.date), ['2026-10-12', '2026-10-14']);
  assert.ok(rows.some((r) => r.title === 'Quarterly (early)' && r.date === '2026-12-01'));
});
