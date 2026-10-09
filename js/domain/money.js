// Money, kept light: what you spent, on what, against an optional monthly budget. Amounts are in
// one currency of your choosing; nothing is linked to a bank and nothing leaves the device.
import * as store from '../data/store.js';
import { today, monthKey, startOfMonth, endOfMonth, diffDays, cmp } from './dates.js';

export const DEFAULT_CATEGORIES = [
  { id: 'food', label: 'Eating out' }, { id: 'groceries', label: 'Groceries' }, { id: 'transport', label: 'Transport' },
  { id: 'home', label: 'Home & bills' }, { id: 'health', label: 'Health' }, { id: 'fun', label: 'Fun' },
  { id: 'shopping', label: 'Shopping' }, { id: 'other', label: 'Other' },
];

// A first guess at your currency from the device's time zone; change it on the Money page.
const BY_ZONE = [[/Mauritius/, 'MUR'], [/London|Dublin/, 'GBP'], [/Johannesburg/, 'ZAR'], [/Kolkata|Calcutta/, 'INR'], [/Dubai/, 'AED'],
  [/^Australia/, 'AUD'], [/^Europe/, 'EUR'], [/^America\/(Toronto|Vancouver)/, 'CAD'], [/^America/, 'USD']];
export function guessCurrency() {
  const z = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return BY_ZONE.find(([re]) => re.test(z))?.[1] || 'USD';
}

export const config = () => ({ currency: guessCurrency(), budget: null, categories: DEFAULT_CATEGORIES, ...(store.settings().money || {}) });
export const setConfig = (patch) => store.setSettings({ money: { ...config(), ...patch } });
export const category = (id) => config().categories.find((c) => c.id === id) || { id, label: 'Other' };

const formatters = new Map();
/** "Rs 1,250" (no cents when there are none). */
export function fmt(amount, { cents } = {}) {
  const cur = config().currency;
  const dp = cents ?? (Math.round(amount * 100) % 100 ? 2 : 0);
  const key = `${cur}:${dp}`;
  if (!formatters.has(key)) {
    try { formatters.set(key, new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: dp, maximumFractionDigits: dp })); }
    catch { formatters.set(key, { format: (v) => `${cur} ${v.toFixed(dp)}` }); }
  }
  // Anything under half a cent is nothing at all, never "-$0".
  return formatters.get(key).format(Math.abs(amount || 0) < 0.005 ? 0 : amount);
}

export const inMonth = (month = monthKey(today())) => store.all('expenses').filter((e) => monthKey(e.date) === month)
  .sort((a, b) => cmp(b.date, a.date) || cmp(b.createdAt || '', a.createdAt || ''));

export function save({ id, amount, category: cat = 'other', note = '', date = today() }) {
  // Rounded to cents in decimal, so 1.005 is 1.01 (binary halves would make it 1.00).
  const value = Number(`${Math.round(Number(`${Number(amount)}e2`))}e-2`);
  if (!(value > 0)) throw new Error('Enter an amount above zero.');
  const prev = id ? store.get('expenses', id) : null;
  return store.put('expenses', { ...(prev || {}), ...(id ? { id } : {}), amount: value, category: cat, note: note.trim().slice(0, 80), date });
}

/** A month at a glance: total, by category, and what's left of the budget per remaining day. */
export function summary(month = monthKey(today()), ref = today()) {
  const list = inMonth(month);
  const total = list.reduce((a, e) => a + e.amount, 0);
  const by = new Map();
  for (const e of list) by.set(e.category, (by.get(e.category) || 0) + e.amount);
  const byCategory = [...by.entries()].map(([id, sum]) => ({ ...category(id), total: sum })).sort((a, b) => b.total - a.total);
  const { budget } = config();
  const current = monthKey(ref) === month;
  const daysLeft = current ? diffDays(endOfMonth(ref), ref) + 1 : 0;
  const left = budget ? budget - total : null;
  return { month, total, count: list.length, byCategory, budget, left, daysLeft, perDay: budget && current && left > 0 ? left / daysLeft : null,
    elapsed: current ? diffDays(ref, startOfMonth(ref)) + 1 : null };
}
