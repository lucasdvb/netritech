// Plan › Meals: the week's meals, day by day, from your recipes (or a meal in words); the protein
// each day's plan adds up to against your target; and one tap writes the week's groceries into a
// list in Lists, added up across recipes. Recipes keep their ingredients and protein per serving.
import * as MP from '../domain/meal-plan.js';
import { today, addDays, startOfWeek, fmtMD, fmtDayShort, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const weekOf = (params) => (params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? startOfWeek(params.week) : startOfWeek(today()));

export function openRecipe(id = null) {
  const cur = id ? MP.recipe(id) : null;
  app.sheet({
    title: cur ? cur.name : 'New recipe',
    size: 'tall',
    ui: { name: cur?.name || '', servings: cur?.servings ?? 2, protein: cur?.protein ?? '', kcal: cur?.kcal ?? '', ingredients: (cur?.ingredients || []).join('\n'), method: cur?.method || '' },
    render: (s) => html`<form class="form" data-submit="rc-save">
      <label class="field"><span class="field-label">Name</span><input class="input" required maxlength="60" value="${s.ui.name}" data-input="rc-f" data-f="name" placeholder="Chicken, rice and greens"></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Serves</span><input class="input" type="number" inputmode="numeric" min="1" max="20" value="${s.ui.servings}" data-input="rc-f" data-f="servings"></label>
        <label class="field"><span class="field-label">Protein <small>g per serving</small></span><input class="input" type="number" inputmode="numeric" min="0" value="${s.ui.protein}" data-input="rc-f" data-f="protein"></label>
      </div>
      <label class="field"><span class="field-label">Calories <small>per serving, optional</small></span><input class="input" type="number" inputmode="numeric" min="0" value="${s.ui.kcal}" data-input="rc-f" data-f="kcal"></label>
      <label class="field"><span class="field-label">Ingredients <small>one per line, for the whole recipe</small></span>
        <textarea class="input" rows="6" data-input="rc-f" data-f="ingredients" placeholder="${'400 g chicken breast\n150 g rice\n2 tbsp olive oil\n1 bag spinach'}">${s.ui.ingredients}</textarea></label>
      <p class="field-hint">Write an amount first (400 g, 2 tbsp, 3) and the grocery list adds the same items up across the week.</p>
      <label class="field"><span class="field-label">Method <small>optional</small></span><textarea class="input" rows="3" data-input="rc-f" data-f="method">${s.ui.method}</textarea></label>
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add recipe'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block" data-action="rc-archive">Remove recipe</button>` : ''}
    </form>`,
    inputs: { 'rc-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; } },
    actions: {
      'rc-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim()) { app.toast('Give the recipe a name.'); return; }
        MP.saveRecipe(cur?.id || null, { name: u.name, servings: u.servings, protein: u.protein, kcal: u.kcal, ingredients: u.ingredients, method: String(u.method).slice(0, 2000) });
        hap.success();
        app.closeSheet(sheet);
      },
      'rc-archive': ({ sheet }) => {
        MP.saveRecipe(cur.id, { archived: true });
        app.closeSheet(sheet);
        app.toast(`${cur.name} removed`, { action: { label: 'Undo', fn: () => MP.saveRecipe(cur.id, { archived: false }) } });
      },
    },
  });
}

function openSlot(date, slot) {
  const cur = MP.planned(date, slot);
  const label = MP.SLOTS.find((x) => x.id === slot)?.label;
  app.sheet({
    title: `${label} · ${relativeDay(date) || fmtDayShort(date)}`,
    ui: { text: cur?.recipeId ? '' : cur?.text || '', servings: cur?.servings || 1 },
    render: (s) => html`<div class="form">
      ${MP.recipes().length ? html`<ul class="list">${MP.recipes().map((r) => html`<li data-key="sr-${r.id}"><button type="button" class="${cx('row', cur?.recipeId === r.id && 'is-on')}" data-action="ms-pick" data-id="${r.id}">
          <span class="row-main"><span class="row-title">${r.name}</span><span class="row-sub">${r.protein ? `${r.protein} g protein a serving` : 'No protein noted'}${r.kcal ? ` · ${r.kcal} kcal` : ''}</span></span>
          ${cur?.recipeId === r.id ? html`<span class="row-right">${icon('check', { size: 16 })}</span>` : ''}</button></li>`)}</ul>` : html`<p class="muted">No recipes yet: write the meal below, or add a recipe so it builds the grocery list.</p>`}
      <div class="field"><span class="field-label">Servings for you</span>
        <div class="seg seg--wrap" role="radiogroup" aria-label="Servings">${[1, 2, 3, 4].map((n) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${s.ui.servings === n}" data-action="ms-serv" data-n="${n}">${n}</button>`)}</div></div>
      <label class="field"><span class="field-label">Or in words</span><input class="input" maxlength="80" value="${s.ui.text}" data-input="ms-text" placeholder="Leftovers · eating out" enterkeyhint="done" data-enter="ms-save"></label>
      <button type="button" class="btn btn--primary btn--block" data-action="ms-save">Save</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block" data-action="ms-clear">Clear this meal</button>` : ''}
      <button type="button" class="btn btn--ghost btn--block" data-action="ms-recipe">${icon('plus', { size: 16 })} New recipe</button>
    </div>`,
    inputs: { 'ms-text': ({ value, sheet }) => { sheet.ui.text = value; } },
    actions: {
      'ms-pick': ({ data, sheet }) => { MP.set(date, slot, { recipeId: data.id, servings: sheet.ui.servings }); hap.tap(); app.closeSheet(sheet); },
      'ms-serv': ({ data, sheet }) => { sheet.ui.servings = Number(data.n); if (cur?.recipeId) MP.set(date, slot, { recipeId: cur.recipeId, servings: sheet.ui.servings }); sheet.refresh(); },
      'ms-save': ({ sheet }) => { if (sheet.ui.text.trim()) MP.set(date, slot, { text: sheet.ui.text, servings: sheet.ui.servings }); hap.tap(); app.closeSheet(sheet); },
      'ms-clear': ({ sheet }) => { const undo = MP.set(date, slot, {}); app.closeSheet(sheet); app.toast('Meal cleared', { action: { label: 'Undo', fn: undo } }); },
      'ms-recipe': ({ sheet }) => { app.closeSheet(sheet); openRecipe(); },
    },
  });
}

export default {
  id: 'meal-plan',
  title: 'Meals',
  render({ params }) {
    const ws = weekOf(params);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const groceries = MP.groceries(ws);
    const recipes = MP.recipes();
    return html`
      ${pageHead({ title: 'Meals', back: { to: 'plan', label: 'Plan' },
        info: 'Plan the week’s meals once, from your recipes or in words. Each day shows the protein its plan adds up to against your target, and one tap writes the week’s groceries into Lists, the same items added up across recipes. What you then eat is still logged in Nutrition.' })}
      <div class="cal-head block-tight">
        <button type="button" class="icon-btn" data-action="nav" data-to="plan/meals/${addDays(ws, -7)}" aria-label="Previous week">${icon('chevron-left', { size: 20 })}</button>
        <h2 class="block-title">Week of ${fmtMD(ws)}</h2>
        <button type="button" class="icon-btn" data-action="nav" data-to="plan/meals/${addDays(ws, 7)}" aria-label="Next week">${icon('chevron-right', { size: 20 })}</button>
      </div>
      <div class="btn-row block-tight">
        <button type="button" class="btn btn--primary btn--sm" data-action="mp-list" data-week="${ws}" ${groceries.length ? '' : 'disabled'}>${icon('list-checks', { size: 16 })} Grocery list${groceries.length ? ` · ${groceries.length}` : ''}</button>
        <button type="button" class="btn btn--soft btn--sm" data-action="mp-repeat" data-week="${ws}">Repeat last week</button>
      </div>
      <ol class="meal-week">${days.map((d) => { const t = MP.totals(d); return html`<li class="${cx('meal-day', d === today() && 'is-today')}" data-key="md-${d}">
        <div class="meal-day-head"><span class="meal-day-name">${relativeDay(d) || fmtDayShort(d)}</span>
          ${t.meals ? html`<span class="${cx('meal-protein tnum', t.short === 0 && 'is-hit')}">${t.protein ? `${t.protein} g protein${t.short ? ` · ${t.short} short` : ''}` : ''}</span>` : ''}</div>
        <ul class="meal-slots">${MP.day(d).map(({ slot, entry }) => { const r = entry?.recipeId && MP.recipe(entry.recipeId); return html`<li><button type="button" class="${cx('meal-slot', !entry && 'is-empty')}" data-action="mp-slot" data-date="${d}" data-slot="${slot.id}" aria-label="${slot.label}, ${r ? r.name : entry?.text || 'nothing planned'}">
          <span class="meal-slot-label">${slot.label}</span><span class="meal-slot-what">${r ? `${r.name}${entry.servings > 1 ? ` × ${entry.servings}` : ''}` : entry?.text || '+'}</span></button></li>`; })}</ul>
      </li>`; })}</ol>
      <section class="block"><div class="block-head"><h2 class="block-title">Recipes</h2><button type="button" class="link-btn" data-action="mp-recipe">Add</button></div>
        ${recipes.length ? html`<ul class="list">${recipes.map((r) => html`<li data-key="rc-${r.id}"><button type="button" class="row" data-action="mp-recipe" data-id="${r.id}">
          <span class="row-main"><span class="row-title">${r.name}</span><span class="row-sub">Serves ${r.servings}${r.protein ? ` · ${r.protein} g protein each` : ''} · ${r.ingredients.length} ingredients</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul>`
          : empty({ ic: 'chef-hat', title: 'Your recipes', body: 'The meals you cook, with what goes in them. Planned in the week, they write your grocery list.', cta: 'Add a recipe', action: 'mp-recipe' })}</section>`;
  },
  actions: {
    'mp-slot': ({ data }) => openSlot(data.date, data.slot),
    'mp-recipe': ({ data }) => openRecipe(data.id || null),
    'mp-list': ({ data }) => {
      const { list, added } = MP.toList(data.week);
      hap.success();
      app.toast(`${list.name}: ${added ? `${added} added` : 'up to date'}`, { icon: 'check', action: { label: 'Open', fn: () => app.go(`plan/lists/${list.id}`) } });
    },
    'mp-repeat': ({ data }) => {
      const undo = MP.repeatLastWeek(data.week);
      hap.tap();
      app.toast('Last week’s meals copied into the empty ones', { action: { label: 'Undo', fn: undo } });
    },
  },
};
