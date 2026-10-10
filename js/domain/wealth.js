// Savings goals and net worth. Net worth is a snapshot now and then (monthly is plenty): each
// account's balance on a date, what you own minus what you owe, so the line shows the direction
// rather than every transaction. A savings goal has a target, a date and what's put aside so far;
// it says what a month it still needs, so the goal turns into one number you can act on (a specific
// target with a deadline beats "save more": Locke & Latham 2002; Thaler & Benartzi 2004, Save More
// Tomorrow, on automatic monthly amounts).
import * as store from '../data/store.js';
import { today, monthKey, addDays, diffDays, fromISO } from './dates.js';

export const KINDS = [
  { id: 'cash', label: 'Cash & current', owe: false }, { id: 'savings', label: 'Savings', owe: false },
  { id: 'investments', label: 'Investments', owe: false }, { id: 'property', label: 'Property', owe: false },
  { id: 'other', label: 'Other asset', owe: false },
  { id: 'card', label: 'Credit card', owe: true }, { id: 'loan', label: 'Loan', owe: true }, { id: 'mortgage', label: 'Mortgage', owe: true },
];
export const isDebt = (a) => !!KINDS.find((k) => k.id === a.kind)?.owe;

export const accounts = () => store.memo('accounts-sorted', ['accounts'], () => store.all('accounts').filter((a) => !a.archived).sort((a, b) => Number(isDebt(a)) - Number(isDebt(b)) || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)));
export const account = (id) => store.get('accounts', id);

export function saveAccount(id, patch) {
  const cur = id ? account(id) : null;
  const order = cur?.order ?? Math.max(-1, ...store.all('accounts').map((a) => a.order ?? 0)) + 1;
  return store.put('accounts', { kind: 'cash', ...cur, ...patch, order, name: String(patch.name ?? cur?.name ?? 'Account').trim().slice(0, 40) || 'Account' });
}

/** An account's balance on a date (debts as positive amounts owed). One per account per day. */
export function setBalance(accountId, amount, date = today()) {
  const id = `${accountId}:${date}`;
  const before = store.get('balances', id);
  const v = Math.round((Number(amount) || 0) * 100) / 100;
  store.put('balances', { id, accountId, date, amount: Math.abs(v) });
  return () => (before ? store.put('balances', before) : store.remove('balances', id));
}

/** The latest balance of an account on or before a date: { amount, date } or null. */
export function balanceOn(accountId, date = today()) {
  let best = null;
  for (const b of store.all('balances')) if (b.accountId === accountId && b.date <= date && (!best || b.date > best.date)) best = b;
  return best ? { amount: best.amount, date: best.date } : null;
}

/** Net worth on a date: { own, owe, net, stale } (stale: accounts not updated in 45 days). */
export function netWorth(date = today()) {
  let own = 0;
  let owe = 0;
  const stale = [];
  for (const a of accounts()) {
    const b = balanceOn(a.id, date);
    if (!b) continue;
    if (isDebt(a)) owe += b.amount; else own += b.amount;
    if (diffDays(date, b.date) > 45) stale.push(a.name);
  }
  return { own, owe, net: own - owe, stale };
}

/** Net worth at the end of each of the last `n` months: [{ month, net }] (months with any balance). */
export function series(n = 12, end = today()) {
  const out = [];
  const d = fromISO(end);
  for (let i = n - 1; i >= 0; i--) {
    const last = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
    const iso = i === 0 ? end : `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    const any = store.all('balances').some((b) => b.date <= iso);
    if (any) out.push({ month: monthKey(iso), date: iso, net: netWorth(iso).net });
  }
  return out;
}

/** Accounts that haven't had a balance this month (for the monthly snapshot). */
export const dueForSnapshot = (date = today()) => accounts().filter((a) => !store.all('balances').some((b) => b.accountId === a.id && monthKey(b.date) === monthKey(date)));

/* ---------- savings goals ---------- */

export const goals = () => store.memo('savings-sorted', ['savingsGoals'], () => store.all('savingsGoals').filter((g) => !g.archived).sort((a, b) => String(a.by || '9999').localeCompare(String(b.by || '9999'))));
export const goal = (id) => store.get('savingsGoals', id);

export function saveGoal(id, patch) {
  const cur = id ? goal(id) : null;
  const v = { saved: 0, ...cur, ...patch };
  v.name = String(v.name || 'Savings goal').trim().slice(0, 60) || 'Savings goal';
  v.target = Math.max(0, Math.round((Number(v.target) || 0) * 100) / 100);
  v.saved = Math.max(0, Math.round((Number(v.saved) || 0) * 100) / 100);
  return store.put('savingsGoals', v);
}

/** Put money towards a goal (or take it out with a negative amount). Returns an undo. */
export function contribute(id, amount, date = today()) {
  const g = goal(id);
  if (!g) return () => {};
  const a = Math.round((Number(amount) || 0) * 100) / 100;
  const log = [...(g.log || []), { date, amount: a }].slice(-120);
  store.put('savingsGoals', { ...g, saved: Math.max(0, (g.saved || 0) + a), log, ...((g.saved || 0) + a >= g.target && !g.reachedOn ? { reachedOn: date } : {}) });
  return () => store.put('savingsGoals', g);
}

/**
 * Where a goal stands: { left, share, monthsLeft, perMonth, onTrack, line }. perMonth is what it
 * needs a month from now to reach the target by its date; onTrack compares the last three months'
 * pace with it.
 */
export function progress(g, date = today()) {
  const left = Math.max(0, g.target - (g.saved || 0));
  const share = g.target ? Math.min(1, (g.saved || 0) / g.target) : 0;
  if (!left) return { left, share: 1, monthsLeft: 0, perMonth: 0, onTrack: true, line: 'Reached.' };
  const monthsLeft = g.by ? Math.max(0, diffDays(g.by, date) / 30.44) : null;
  const perMonth = monthsLeft ? left / Math.max(1, monthsLeft) : null;
  const since = addDays(date, -91);
  const recent = (g.log || []).filter((x) => x.date >= since).reduce((s, x) => s + x.amount, 0) / 3;
  const onTrack = perMonth == null ? null : recent >= perMonth * 0.95;
  return { left, share, monthsLeft, perMonth, pace: recent, onTrack };
}
