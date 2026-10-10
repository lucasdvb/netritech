// A weekly meal plan that writes the grocery list. Recipes hold their ingredients (with amounts)
// and protein and calories per serving; the week is a grid of days and meals; the grocery list adds
// up every planned recipe's ingredients for the week (same item, same unit → one line with the
// total) into a list in Lists; and the plan says whether each day's planned protein reaches your
// target before you've eaten anything. Planning meals ahead goes with better diet quality and more
// variety (Ducrot et al. 2017, NutriNet-Santé), and deciding once a week removes daily decisions.
import * as store from '../data/store.js';
import { today, addDays, startOfWeek, fmtMD } from './dates.js';
import * as L from './lists.js';

export const SLOTS = [
  { id: 'breakfast', label: 'Breakfast' }, { id: 'lunch', label: 'Lunch' }, { id: 'dinner', label: 'Dinner' }, { id: 'snack', label: 'Snack' },
];

export const recipes = () => store.memo('recipes-sorted', ['recipes'], () => store.all('recipes').filter((r) => !r.archived).sort((a, b) => a.name.localeCompare(b.name)));
export const recipe = (id) => store.get('recipes', id);

/**
 * "200 g chicken" → { qty: 200, unit: 'g', name: 'chicken' }; "2 eggs" → { qty: 2, unit: '', name: 'eggs' };
 * "salt" → { qty: null, unit: '', name: 'salt' }.
 */
export function parseIngredient(line) {
  const t = String(line || '').trim().replace(/\s+/g, ' ');
  if (!t) return null;
  const m = /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(kg|g|mg|l|ml|cl|tbsp|tsp|cups?|cans?|tins?|packs?|pcs?|x)?\b\s*(?:of\s+)?(.*)$/i.exec(t);
  if (!m || !m[3]) return { qty: null, unit: '', name: t.slice(0, 80) };
  const q = m[1].includes('/') ? m[1].split('/').reduce((a, b) => Number(a) / Number(b)) : Number(m[1].replace(',', '.'));
  const unit = (m[2] || '').toLowerCase().replace(/^x$/, '').replace(/s$/, '').replace(/^pc$/, '');
  return { qty: q, unit, name: m[3].trim().slice(0, 80) };
}

export function saveRecipe(id, patch) {
  const cur = id ? recipe(id) : null;
  const v = { servings: 1, protein: null, kcal: null, ingredients: [], ...cur, ...patch };
  v.name = String(v.name || 'Recipe').trim().slice(0, 60) || 'Recipe';
  v.servings = Math.max(1, Math.round(Number(v.servings) || 1));
  v.protein = v.protein === '' || v.protein == null ? null : Math.max(0, Number(v.protein) || 0);
  v.kcal = v.kcal === '' || v.kcal == null ? null : Math.max(0, Number(v.kcal) || 0);
  v.ingredients = (Array.isArray(v.ingredients) ? v.ingredients : String(v.ingredients).split('\n')).map((x) => (typeof x === 'string' ? x.trim() : x)).filter(Boolean).slice(0, 60);
  return store.put('recipes', v);
}

const slotId = (date, slot) => `${date}:${slot}`;
export const planned = (date, slot) => store.get('mealPlan', slotId(date, slot)) || null;
/** A day's plan: [{ slot, entry }] for every slot. */
export const day = (date) => SLOTS.map((s) => ({ slot: s, entry: planned(date, s.id) }));

/** Plan a recipe (or a plain meal in words) for a meal. Returns an undo. */
export function set(date, slot, { recipeId = null, text = '', servings = 1 } = {}) {
  const id = slotId(date, slot);
  const before = store.get('mealPlan', id);
  if (!recipeId && !String(text).trim()) store.remove('mealPlan', id);
  else store.put('mealPlan', { id, date, slot, recipeId, text: String(text).trim().slice(0, 80), servings: Math.max(1, Number(servings) || 1) });
  return () => (before ? store.put('mealPlan', before) : store.remove('mealPlan', id));
}

/** Last week's plan onto this week (only empty meals). Returns an undo. */
export function repeatLastWeek(ws = startOfWeek(today())) {
  const ops = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i);
    for (const s of SLOTS) {
      const prev = planned(addDays(d, -7), s.id);
      if (!prev || planned(d, s.id)) continue;
      const { createdAt, updatedAt, rev, tz, ...rest } = prev;
      ops.push({ store: 'mealPlan', value: { ...rest, id: slotId(d, s.id), date: d } });
    }
  }
  if (ops.length) store.batch(ops);
  return () => store.batch(ops.map((o) => ({ store: 'mealPlan', delete: o.value.id })));
}

/** Planned protein and calories on a date, and whether protein reaches the target. */
export function totals(date) {
  let protein = 0;
  let kcal = 0;
  let meals = 0;
  for (const { entry } of day(date)) {
    if (!entry) continue;
    meals++;
    const r = entry.recipeId ? recipe(entry.recipeId) : null;
    if (r?.protein) protein += r.protein * entry.servings;
    if (r?.kcal) kcal += r.kcal * entry.servings;
  }
  const target = store.settings().targets?.proteinG || null;
  return { protein: Math.round(protein), kcal: Math.round(kcal), meals, target, short: target && meals ? Math.max(0, Math.round(target - protein)) : null };
}

/** The week's groceries: [{ name, qty, unit, text }] (same name and unit added up). */
export function groceries(ws = startOfWeek(today())) {
  const map = new Map();
  for (let i = 0; i < 7; i++) {
    for (const { entry } of day(addDays(ws, i))) {
      const r = entry?.recipeId && recipe(entry.recipeId);
      if (!r) continue;
      const scale = (entry.servings || 1) / (r.servings || 1);
      for (const line of r.ingredients) {
        const p = parseIngredient(line);
        if (!p) continue;
        const key = `${p.name.toLowerCase()}|${p.unit}`;
        const cur = map.get(key) || { name: p.name, unit: p.unit, qty: null };
        if (p.qty != null) cur.qty = (cur.qty || 0) + p.qty * scale;
        map.set(key, cur);
      }
    }
  }
  const nice = (q) => (q == null ? '' : Number.isInteger(Math.round(q * 4) / 4) ? String(Math.round(q)) : String(Math.round(q * 4) / 4));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => ({ ...g, text: g.qty != null ? `${g.name} · ${nice(g.qty)}${g.unit ? ` ${g.unit}` : ''}` : g.name }));
}

/**
 * Write the week's groceries into its list in Lists ("Groceries · week of 12 Oct"), keeping what you
 * already ticked and anything you added by hand. Returns { list, added }.
 */
export function toList(ws = startOfWeek(today())) {
  const name = `Groceries · week of ${fmtMD(ws)}`;
  const id = `l-groceries-${ws}`;
  let l = L.list(id);
  if (!l) {
    const order = Math.max(-1, ...L.lists().map((x) => x.order ?? 0)) + 1;
    l = store.put('lists', { id, name, order, items: [], week: ws });
  }
  const want = groceries(ws);
  const items = [...(l.items || [])];
  const keyOf = (t) => String(t).split(' · ')[0].toLowerCase();
  let added = 0;
  for (const g of want) {
    const at = items.findIndex((i) => i.fromPlan && keyOf(i.text) === g.name.toLowerCase());
    if (at >= 0) { if (items[at].text !== g.text) items[at] = { ...items[at], text: g.text }; }
    else { items.push({ id: store.uid(), text: g.text, done: false, fromPlan: true }); added++; }
  }
  // Planned items that are no longer in the plan go (if not ticked); your own stay.
  const names = new Set(want.map((g) => g.name.toLowerCase()));
  const kept = items.filter((i) => !i.fromPlan || i.done || names.has(keyOf(i.text)));
  store.put('lists', { ...l, items: kept });
  return { list: L.list(id), added };
}
