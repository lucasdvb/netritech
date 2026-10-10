import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import { html, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import { kgOut, kgIn, weightUnit, loadText } from '../ui/format.js';
import * as X from '../domain/exercise-media.js';
import { picsEditor, addTiles, PICS_HINT, mediaActions, mediaInputs, hydrateMedia, addTo, pasted } from './exercise-media-ui.js';
import * as hap from '../ui/haptics.js';

/** Pictures for an exercise that doesn't exist yet: held here, kept once it's saved. */
const pendingPics = (pics) => html`<div class="field"><p class="field-label">How it’s done <small>optional · up to ${X.MAX} pictures</small></p>
  <div class="exm-thumbs exm-thumbs--edit">${pics.map((p, i) => html`<span class="exm-thumb-wrap" data-key="pp-${p.key}">
      <span class="exm-thumb"><img src="${p.url}" alt="Picture ${i + 1}"></span>
      <button type="button" class="icon-btn icon-btn--sm exm-del" data-action="pp-del" data-i="${i}" aria-label="Remove picture ${i + 1}">${icon('x', { size: 14 })}</button></span>`)}
    ${addTiles({ room: X.MAX - pics.length, change: 'pp-add', action: 'pp-paste' })}</div>
  <p class="field-hint">${PICS_HINT}</p></div>`;

export function exerciseSheet(existing = null) {
  const ui = { pics: [], name: existing?.name || '', category: existing?.category || 'chest', metric: existing?.metric || 'reps', unilateral: !!existing?.unilateral, load: existing?.defaultLoad ? Math.round(kgOut(existing.defaultLoad) * 2) / 2 : '', cues: existing?.cues || '' };
  // What's typed so far is kept when the sheet redraws with a new picture.
  const keep = (sheet) => {
    const f = sheet.el.querySelector('form');
    if (!f) return;
    for (const k of ['name', 'category', 'metric', 'load', 'cues']) if (f.elements[k]) ui[k] = f.elements[k].value;
    if (f.elements.unilateral) ui.unilateral = f.elements.unilateral.checked;
  };
  const hold = (sheet, files) => {
    keep(sheet);
    for (const file of files.slice(0, X.MAX - sheet.ui.pics.length)) sheet.ui.pics.push({ file, url: URL.createObjectURL(file), key: store.uid() });
    hap.tap();
    sheet.refresh();
  };
  const s = app.sheet({
    title: existing ? 'Edit exercise' : 'New exercise',
    ui,
    onClose: () => ui.pics.forEach((p) => URL.revokeObjectURL(p.url)),
    render: (s) => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" value="${s.ui.name}" required maxlength="60" placeholder="e.g. Archer push-up"></label>
      <label class="field"><span class="field-label">Category</span><select class="input" name="category">${F.CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(s.ui.category === c.id ? 'selected' : '')}>${c.label}</option>`)}</select></label>
      <label class="field"><span class="field-label">Measured in</span><select class="input" name="metric">
        <option value="reps" ${raw(s.ui.metric === 'reps' ? 'selected' : '')}>Reps (and load)</option>
        <option value="time" ${raw(s.ui.metric === 'time' ? 'selected' : '')}>Seconds (holds)</option>
        <option value="minutes" ${raw(s.ui.metric === 'minutes' ? 'selected' : '')}>Minutes (cardio)</option></select></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Default load</span><span class="input-unit"><input name="load" type="number" inputmode="decimal" step="0.5" min="0" value="${s.ui.load}"><span>${weightUnit()}</span></span></label>
        <label class="check-line"><input type="checkbox" name="unilateral" ${raw(s.ui.unilateral ? 'checked' : '')}> Per side</label>
      </div>
      <label class="field"><span class="field-label">Cues <small>optional</small></span><input class="input" name="cues" value="${s.ui.cues}" placeholder="What good form feels like"></label>
      ${existing && store.get('exercises', existing.id) ? picsEditor(store.get('exercises', existing.id)) : pendingPics(s.ui.pics)}
      <div class="btn-row">
        ${existing ? html`<button type="button" class="btn btn--ghost" data-action="archive">Archive</button>` : ''}
        <button type="submit" class="btn btn--primary">Save</button>
      </div>
    </form>`,
    actions: {
      ...mediaActions,
      'pp-del': ({ data, sheet }) => { keep(sheet); const [p] = sheet.ui.pics.splice(Number(data.i), 1); if (p) URL.revokeObjectURL(p.url); sheet.refresh(); },
      'pp-paste': async ({ sheet }) => { const f = await pasted(); if (f) hold(sheet, [f]); },
      save: async ({ form, sheet }) => {
        if (!form.name?.trim()) { app.toast('Give the exercise a name.'); return; }
        const saved = store.put('exercises', { ...((existing && store.get('exercises', existing.id)) || existing || { family: null, level: 0, archived: false }), name: form.name.trim(), category: form.category, metric: form.metric,
          unilateral: !!form.unilateral, defaultLoad: form.load === '' ? 0 : Math.round(kgIn(Number(form.load)) * 100) / 100, cues: form.cues || '' });
        const files = sheet.ui.pics.map((p) => p.file);
        app.closeSheet(sheet);
        if (files.length && saved?.id) await addTo(saved.id, files);
      },
      archive: ({ sheet }) => {
        store.update('exercises', existing.id, { archived: true });
        app.closeSheet(sheet);
        app.toast(`${existing.name} archived. Past sessions keep it.`, { action: { label: 'Undo', fn: () => store.update('exercises', existing.id, { archived: false }) } });
      },
    },
    inputs: {
      ...mediaInputs,
      'pp-add': ({ el, sheet }) => { const files = [...(el.files || [])]; el.value = ''; if (files.length) hold(sheet, files); },
    },
  });
  if (existing) hydrateMedia(s.el);
  return s;
}

export default {
  id: 'exercises',
  title: 'Exercises',
  render({ ui }) {
    const cat = ui.cat || 'all';
    const q = (ui.q || '').toLowerCase();
    const list = F.exercises().filter((e) => (cat === 'all' || e.category === cat) && (!q || e.name.toLowerCase().includes(q)));
    const groups = F.CATEGORIES.map((c) => ({ ...c, items: list.filter((e) => e.category === c.id) })).filter((g) => g.items.length);
    return html`
      ${pageHead({ title: 'Exercises', back: { to: 'plan/training', label: 'Training' },
        actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New exercise">${icon('plus', { size: 20 })}</button>` })}
      <div class="search-field">${icon('search', { size: 16 })}<input type="search" placeholder="Search ${F.exercises().length} exercises" value="${ui.q || ''}" data-input="q" aria-label="Search exercises"></div>
      <div class="block-tight">${segmented([{ id: 'all', label: 'All' }, ...F.CATEGORIES], cat, { action: 'cat', name: 'Category' })}</div>
      ${groups.map((g) => html`<section class="block" data-key="g-${g.id}"><div class="block-head"><h2 class="block-title">${g.label}</h2><span class="block-meta">${g.items.length}</span></div>
        <ul class="list">${g.items.map((e) => html`<li><a class="row" href="#/plan/training/exercises/${e.id}" data-action="nav" data-to="plan/training/exercises/${e.id}">
          <span class="row-main"><span class="row-title">${e.name}</span><span class="row-sub">${[e.metric === 'time' ? 'Seconds' : e.metric === 'minutes' ? 'Minutes' : 'Reps', e.unilateral ? 'per side' : '', e.defaultLoad ? loadText(e.defaultLoad) : '', e.family ? `level ${e.level}` : ''].filter(Boolean).join(' · ')}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul></section>`)}
      ${!groups.length ? html`<p class="muted center block">No exercises match.</p>` : ''}`;
  },
  actions: {
    cat: ({ data, ui }) => { ui.cat = data.value; app.refresh(); },
    new: () => exerciseSheet(),
  },
  inputs: { q: ({ value, ui }) => { ui.q = value; app.refresh(); } },
};
