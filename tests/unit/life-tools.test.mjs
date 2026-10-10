// The planning and life tools: self-correcting estimates, the energy curve, sleep regularity and
// the plan guard, your calendar (.ics), bills, net worth and savings, supplements, the meal plan and
// its groceries, trips, takeaways, decisions, the life wheel, the honest habit timeline and the
// morning briefing that brings them together.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, startOfWeek } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as ES from '../../js/domain/estimates.js';
import * as EN from '../../js/domain/energy.js';
import * as SR from '../../js/domain/sleep-regularity.js';
import * as ICS from '../../js/domain/ics-import.js';
import * as BL from '../../js/domain/bills.js';
import * as WE from '../../js/domain/wealth.js';
import * as SU from '../../js/domain/supplements.js';
import * as MP from '../../js/domain/meal-plan.js';
import * as TR from '../../js/domain/trips.js';
import * as TK from '../../js/domain/takeaways.js';
import * as DC from '../../js/domain/decisions.js';
import * as WH from '../../js/domain/wheel.js';
import * as HT from '../../js/domain/habit-timeline.js';
import * as BR from '../../js/domain/briefing.js';
import * as P from '../../js/domain/day-plans.js';
import * as H from '../../js/domain/habits.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const start = (extra = {}) => fresh({ profile: [{ ...profileSeed(), trackingStart: d(-120) }], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()), ...extra });

test('estimates learn your ratio from finished tasks and adjust new ones', async () => {
  await start({ tasks: [30, 45, 60, 20].map((e, i) => ({ id: `t${i}`, title: `T${i}`, done: true, doneAt: `${d(-i)}T10:00:00Z`, estimate: e, spent: Math.round(e * 1.5) })) });
  const c = ES.calibration();
  assert.equal(c.n, 4);
  assert.equal(c.ratio, 1.5);
  assert.equal(ES.realistic(30), 45);
  assert.match(ES.realisticLine(30), /50% longer/);
  store.put('tasks', { id: 'x', title: 'X', done: false, estimate: 25 });
  ES.addSpent('x', 10);
  ES.addSpent('x', 15);
  assert.equal(store.get('tasks', 'x').spent, 25);
});

test('too few finished tasks: estimates are left as they are', async () => {
  await start({ tasks: [{ id: 'a', title: 'A', done: true, estimate: 30, spent: 60 }] });
  assert.equal(ES.calibration(), null);
  assert.equal(ES.realistic(30), 30);
});

test('energy check-ins name a peak once there are enough of them, and not on a flat curve', async () => {
  await start();
  const put = (day, time, level) => store.put('energyLogs', { id: `${d(day)}:${time}`, date: d(day), time, level });
  for (let i = 0; i < 6; i++) { put(-i, '09:30', 5); put(-i, '15:00', 2); put(-i, '19:00', 3); }
  const p = EN.peak();
  assert.deepEqual([p.from, p.to, p.low.from], ['08:00', '10:00', '14:00']);
  assert.match(EN.peakLine(p), /08:00–10:00/);
  await start();
  for (let i = 0; i < 6; i++) { put(-i, '09:30', 3); put(-i, '15:00', 3); }
  assert.equal(EN.peak(), null);
  assert.equal(EN.daysToPeak(), 0);
});

test('sleep regularity rates the spread of bed and wake times; the plan guard flags wake times over an hour apart', async () => {
  await start({ sleepEntries: Array.from({ length: 10 }, (_, i) => ({ id: d(-i), date: d(-i), wake: i % 2 ? '06:00' : '06:10', bedtime: i % 2 ? '23:50' : '00:10', hours: 6 })) });
  const r = SR.regularity();
  assert.equal(r.rating, 'steady');
  assert.ok(r.bed.spread < 15, 'midnight doesn’t split the bedtimes');
  assert.equal(SR.planGuard(), null);
  const { id } = P.create('Late');
  P.setWeekday(6, id);
  P.edit({ plan: id }, P.blocksOf({ plan: id }).find((b) => b.kind === 'wake').id, { time: '08:30' });
  const g = SR.planGuard();
  assert.equal(g.gap, 150);
  assert.match(g.line, /2 h 30 min apart/);
});

const ICAL = (body) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}END:VCALENDAR\r\n`;
const ymd = (iso) => iso.replace(/-/g, '');

test('a calendar: timed, all-day, weekly with an exception and a moved occurrence, cancelled ones left out', async () => {
  await start();
  const mon = startOfWeek(T);
  const text = ICAL([
    `BEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Dentist\r\nDTSTART:${ymd(mon)}T091500\r\nDTEND:${ymd(mon)}T100000\r\nEND:VEVENT\r\n`,
    `BEGIN:VEVENT\r\nUID:b\r\nSUMMARY:Holiday\r\nDTSTART;VALUE=DATE:${ymd(addDays(mon, 2))}\r\nDTEND;VALUE=DATE:${ymd(addDays(mon, 3))}\r\nEND:VEVENT\r\n`,
    `BEGIN:VEVENT\r\nUID:c\r\nSUMMARY:Team call\r\nDTSTART:${ymd(mon)}T140000\r\nDURATION:PT30M\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,TH;COUNT=6\r\nEXDATE:${ymd(addDays(mon, 3))}T140000\r\nEND:VEVENT\r\n`,
    `BEGIN:VEVENT\r\nUID:c\r\nRECURRENCE-ID:${ymd(addDays(mon, 7))}T140000\r\nSUMMARY:Team call (moved)\r\nDTSTART:${ymd(addDays(mon, 8))}T160000\r\nDTEND:${ymd(addDays(mon, 8))}T163000\r\nEND:VEVENT\r\n`,
    `BEGIN:VEVENT\r\nUID:d\r\nSUMMARY:Called off\r\nSTATUS:CANCELLED\r\nDTSTART:${ymd(mon)}T120000\r\nDTEND:${ymd(mon)}T130000\r\nEND:VEVENT\r\n`,
    'BEGIN:VEVENT\r\nUID:e\r\nSUMMARY:Long title\r\n  folded\r\nDTSTART:20991231T235000Z\r\nDTEND:20991231T235500Z\r\nEND:VEVENT\r\n',
  ].join(''));
  const parsed = ICS.parse(text);
  assert.equal(parsed.find((e) => e.uid === 'e').title, 'Long title folded');
  const rows = ICS.expand(text, 'cal', new Date(`${mon}T08:00:00`));
  ICS.save('cal', rows);
  assert.deepEqual(ICS.on(mon).map((e) => [e.start, e.end, e.title]), [['09:15', '10:00', 'Dentist'], ['14:00', '14:30', 'Team call']]);
  assert.deepEqual(ICS.on(addDays(mon, 2)).map((e) => [e.allDay, e.title]), [[true, 'Holiday']]);
  assert.equal(ICS.on(addDays(mon, 3)).length, 0, 'the exception is left out');
  assert.equal(ICS.on(addDays(mon, 7)).length, 0, 'the moved one isn’t at its old time');
  assert.deepEqual(ICS.on(addDays(mon, 8)).map((e) => [e.start, e.title]), [['16:00', 'Team call (moved)']]);
  assert.deepEqual(ICS.busy(mon), [[555, 600], [840, 870]]);
  // Saving again replaces that source's events.
  ICS.save('cal', []);
  assert.equal(ICS.on(mon).length, 0);
});

test('bills: due dates move on when paid (the 31st stays the end of the month), the expense lands in Money, tasks appear once', async () => {
  await start();
  const b = BL.save(null, { name: 'Rent', amount: 15000, every: 'month', next: '2026-01-31' });
  assert.equal(BL.after('2026-01-31', 'month', 31), '2026-02-28');
  assert.equal(BL.after('2026-02-28', 'month', 31), '2026-03-31');
  assert.equal(BL.after('2026-03-10', 'year'), '2027-03-10');
  const undo = BL.pay(b.id, '2026-01-30');
  assert.equal(BL.bill(b.id).next, '2026-02-28');
  assert.equal(store.get('expenses', `bill:${b.id}:2026-01-31`).amount, 15000);
  undo();
  assert.equal(BL.bill(b.id).next, '2026-01-31');
  assert.ok(!store.get('expenses', `bill:${b.id}:2026-01-31`));
  const s = BL.save(null, { name: 'Streaming', amount: 300, every: 'month', kind: 'subscription', next: d(2) });
  BL.save(null, { name: 'Insurance', amount: 12000, every: 'year', kind: 'renewal', next: d(30) });
  assert.equal(BL.ensureTasks(T), 2, 'rent (overdue) and the subscription; the renewal isn’t near yet');
  assert.equal(BL.ensureTasks(T), 0, 'once');
  assert.match(store.get('tasks', `t-bill-${s.id}-${d(2)}`).title, /keep it\?/);
  assert.equal(Math.round(BL.monthly().total), 15000 + 300 + 1000);
});

test('net worth from balances (debts subtracted), and a savings goal says what it needs a month', async () => {
  await start();
  const cur = WE.saveAccount(null, { name: 'Current', kind: 'cash' });
  const card = WE.saveAccount(null, { name: 'Card', kind: 'card' });
  WE.setBalance(cur.id, 50000, d(-40));
  WE.setBalance(cur.id, 60000, d(-1));
  WE.setBalance(card.id, 8000, d(-1));
  assert.deepEqual([WE.netWorth().own, WE.netWorth().owe, WE.netWorth().net], [60000, 8000, 52000]);
  assert.equal(WE.netWorth(d(-20)).net, 50000);
  const g = WE.saveGoal(null, { name: 'Emergency fund', target: 120000, by: addDays(T, 365), saved: 0 });
  WE.contribute(g.id, 10000, d(-60));
  WE.contribute(g.id, 10000, d(-30));
  const p = WE.progress(WE.goal(g.id));
  assert.equal(p.left, 100000);
  assert.ok(Math.abs(p.perMonth - 100000 / (365 / 30.44)) < 1);
  assert.equal(p.onTrack, false);
});

test('supplements: a dose counts the stock down (and back up when untaken); running low makes one reorder task', async () => {
  await start();
  const s = SU.save(null, { name: 'Vitamin D', times: ['08:00'], stock: 8, perDose: 1, reorderDays: 7 });
  const undo = SU.toggle(s.id, '08:00');
  assert.ok(SU.taken(s.id, '08:00'));
  assert.equal(SU.one(s.id).stock, 7);
  assert.equal(SU.daysLeft(SU.one(s.id)), 7);
  assert.ok(SU.runningLow(SU.one(s.id)));
  assert.equal(SU.ensureTasks(), 1);
  assert.equal(SU.ensureTasks(), 0);
  undo();
  assert.equal(SU.one(s.id).stock, 8);
  SU.restock(s.id, 60);
  assert.equal(SU.one(s.id).stock, 68);
  assert.equal(store.all('tasks').filter((t) => t.source === `supplement:${s.id}` && !t.done).length, 0, 'restocking ticks the reorder task');
});

test('the meal plan adds up the week’s groceries into a list, keeps your own items, and checks protein', async () => {
  await start();
  assert.deepEqual(MP.parseIngredient('200 g chicken breast'), { qty: 200, unit: 'g', name: 'chicken breast' });
  assert.deepEqual(MP.parseIngredient('2 eggs'), { qty: 2, unit: '', name: 'eggs' });
  assert.deepEqual(MP.parseIngredient('salt'), { qty: null, unit: '', name: 'salt' });
  const r = MP.saveRecipe(null, { name: 'Chicken rice', servings: 2, protein: 45, kcal: 600, ingredients: '400 g chicken breast\n150 g rice\nsalt' });
  const ws = startOfWeek(T);
  MP.set(ws, 'lunch', { recipeId: r.id, servings: 1 });
  MP.set(addDays(ws, 1), 'dinner', { recipeId: r.id, servings: 2 });
  MP.set(addDays(ws, 1), 'breakfast', { text: 'Oats' });
  const g = MP.groceries(ws);
  assert.deepEqual(g.map((x) => x.text), ['chicken breast · 600 g', 'rice · 225 g', 'salt']);
  const { list } = MP.toList(ws);
  assert.equal(list.items.length, 3);
  store.put('lists', { ...list, items: [...list.items, { id: 'mine', text: 'Coffee', done: false }] });
  MP.set(ws, 'lunch', {});
  const again = MP.toList(ws).list;
  assert.deepEqual(again.items.map((i) => i.text), ['chicken breast · 400 g', 'rice · 150 g', 'salt', 'Coffee']);
  const t = MP.totals(addDays(ws, 1));
  assert.deepEqual([t.protein, t.meals, t.short], [90, 2, 60]);
});

test('a trip: packing list, away days, the pack task and legs; deleting it gives the days back', async () => {
  await start();
  const { trip, undo } = await TR.save(null, { name: 'Paris', from: d(3), to: d(6), mode: 'away', flags: ['train'], legs: [{ date: d(3), time: '07:40', what: 'Flight MK 015' }] });
  const l = store.get('lists', trip.packingListId);
  assert.ok(l.items.some((i) => i.text === 'Training shoes'));
  assert.ok(l.items.some((i) => i.text === '3 × underwear and socks'));
  assert.equal(H.dayMode(d(4)), 'away');
  assert.equal(TR.on(d(4)).id, trip.id);
  assert.equal(store.get('tasks', `t-trip-${trip.id}-pack`).date, d(2));
  assert.equal(store.get('tasks', `t-trip-${trip.id}-leg-0`).title, '07:40 · Flight MK 015');
  // Shorter: the last day goes back to normal.
  await TR.save(trip.id, { to: d(5) });
  assert.equal(H.dayMode(d(6)), 'normal');
  undo();
  assert.equal(TR.trip(trip.id), null);
  assert.equal(H.dayMode(d(4)), 'normal');
  const second = (await TR.save(null, { name: 'Work trip', from: d(1), to: d(2), mode: 'travel', pause: true })).trip;
  assert.equal(P.on(d(1)).name, 'Travel');
  assert.ok(TR.remindersPaused(d(2)));
  await TR.remove(second.id);
  assert.equal(P.on(d(1)).base, true);
});

test('takeaways come back on a widening schedule; forgetting starts again; retiring stops it', async () => {
  await start();
  const t = TK.add({ text: 'Make it obvious', source: 'book:atomic' }, T);
  assert.equal(t.due, d(1));
  assert.equal(TK.forMorning(T), null);
  assert.equal(TK.forMorning(d(1)).id, t.id);
  TK.answer(t.id, 'kept', d(1));
  assert.equal(TK.one(t.id).due, addDays(d(1), 3));
  TK.answer(t.id, 'used', addDays(d(1), 3));
  assert.equal(TK.one(t.id).box, 3);
  TK.answer(t.id, 'forgot', d(10));
  assert.equal(TK.one(t.id).due, d(11));
  TK.answer(t.id, 'retire', d(11));
  assert.equal(TK.due(d(400)).length, 0);
});

test('decisions come up for review after three months, and the scorecard catches overconfidence', async () => {
  await start();
  const a = DC.save(null, { title: 'Take the job', expect: 'More growth', confidence: 4 }, d(-100));
  DC.save(null, { title: 'Recent', confidence: 2 }, d(-10));
  assert.deepEqual(DC.dueForReview(T).map((x) => x.id), [a.id]);
  DC.later(a.id, T);
  assert.equal(DC.dueForReview(T).length, 0);
  for (let i = 0; i < 3; i++) { const x = DC.save(null, { title: `Sure ${i}`, confidence: 5 }, d(-120)); DC.review(x.id, { outcome: 'worse', quality: 'poor' }); }
  assert.equal(DC.scorecard().calibration, 'over');
});

test('the life wheel: the weakest area (ties go to the one that fell most) becomes the season suggestion', async () => {
  await start();
  const date = T;
  for (const a of WH.AREAS) WH.rate(a.id, a.id === 'mind' || a.id === 'relationships' ? 4 : 7, date);
  // Last quarter: relationships was 7, mind 4.
  const prevQ = WH.quarterOf(addDays(date, -95));
  store.put('wheelChecks', { id: prevQ, date: addDays(date, -95), scores: Object.fromEntries(WH.AREAS.map((a) => [a.id, a.id === 'relationships' ? 7 : 4])) });
  assert.ok(WH.complete(WH.check()));
  assert.equal(WH.due(date), false);
  const w = WH.weakest();
  assert.equal(w.id, 'relationships');
  const s = WH.seasonSuggestion();
  assert.match(s.intention, /from 4 to 6/);
  assert.equal(WH.radar(WH.check().scores).length, 8);
});

test('the habit timeline counts from focus and tells the truth about two months', async () => {
  await start();
  const h = { ...H.habit('h-prayer'), focusSince: d(-22) };
  const t = HT.timeline(h);
  assert.deepEqual([t.day, t.of, t.phase], [23, 66, 'middle']);
  assert.equal(HT.label(t), 'Day 23 of about 66');
  assert.equal(HT.timeline({ ...h, focusSince: d(-4) }).phase, 'early');
  assert.equal(HT.timeline({ ...h, focusSince: d(-70) }).phase, 'around');
});

test('the morning briefing brings the day together', async () => {
  await start();
  BL.save(null, { name: 'Electricity', amount: 2000, next: T });
  SU.save(null, { name: 'Creatine', times: ['07:00'] });
  ICS.save('cal', [{ id: 'cal:x', date: T, start: '11:00', end: '12:00', allDay: false, title: 'Client call', source: 'cal' }]);
  const l = BR.lines(T);
  const text = l.map((x) => x.text).join('\n');
  assert.match(text, /Up at/);
  assert.match(text, /1 in your calendar: 11:00 Client call/);
  assert.match(text, /Electricity due today/);
  assert.match(text, /Creatine this morning/);
  assert.ok(BR.short(T).length <= 160);
});
