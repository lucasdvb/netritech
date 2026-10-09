// Rewards you set (G7): something you'll give yourself once a real thing has happened (so many
// workouts, so many sealed days, a habit done so many times, a season's score, a goal reached).
// No points and no currency: progress is the count itself.
import * as H from '../domain/habits.js';
import * as G from '../domain/goals.js';
import * as S from '../domain/seasons.js';
import * as Rw from '../domain/rewards.js';
import { fmtMD } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, bar } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as store from '../data/store.js';

function rewardRow(r) {
  const p = Rw.progress(r);
  return html`<li class="reward" data-key="rw-${r.id}">
    <p class="reward-title">${r.title}</p>
    <p class="row-sub">${r.status === 'active' ? `For ${Rw.describe(r)} · ${p.value} of ${p.target}` : r.status === 'unlocked' ? `Unlocked ${fmtMD(r.unlockedAt)} · ${Rw.describe(r)}` : `Claimed ${fmtMD(r.claimedAt)}`}</p>
    ${r.status === 'active' ? bar(p.ratio, { label: `${p.value} of ${p.target}` }) : ''}
    ${r.status === 'unlocked' ? html`<button type="button" class="btn btn--primary btn--sm" data-action="rw-claim" data-id="${r.id}">${icon('check', { size: 16 })} I’ve had it</button>` : ''}
    ${r.status !== 'claimed' ? html`<button type="button" class="link-btn" data-action="rw-del" data-id="${r.id}">Remove</button>` : ''}
  </li>`;
}

export function openNewReward() {
  const habits = H.activeHabits().filter((h) => !['paused'].includes(H.stateOf(h)));
  const seasons = [S.current(), S.upcoming()].filter(Boolean);
  const goals = G.goals().filter((g) => g.status !== 'done' && G.progress(g).kind !== 'consistency');
  const kinds = Object.entries(Rw.KINDS).filter(([k]) => (k !== 'season' || seasons.length) && (k !== 'goal' || goals.length));
  const ui = { title: '', kind: 'workouts', ref: null, target: 12 };
  const refs = (k) => (k === 'habit' ? habits.map((h) => [h.id, h.name]) : k === 'season' ? seasons.map((s) => [s.id, s.name]) : k === 'goal' ? goals.map((g) => [g.id, g.name]) : []);
  app.sheet({
    title: 'A reward',
    size: 'detent',
    ui,
    render: (s) => {
      const list = refs(s.ui.kind);
      if (list.length && !list.some(([id]) => id === s.ui.ref)) s.ui.ref = list[0][0];
      const fixed = Rw.KINDS[s.ui.kind].target != null;
      return html`<div class="form reward-new">
        <p class="sheet-note">Something you’d enjoy, unlocked by something real. Counting starts today.</p>
        <label class="field"><span class="field-label">The reward</span><input class="input" data-input="rw-title" value="${s.ui.title}" placeholder="New running shoes" maxlength="80"></label>
        <label class="field"><span class="field-label">When I’ve done</span><select class="input" data-change="rw-kind" aria-label="Condition">${kinds.map(([k, v]) => html`<option value="${k}" ${k === s.ui.kind ? 'selected' : ''}>${v.label}</option>`)}</select></label>
        ${list.length ? html`<label class="field"><span class="field-label">${s.ui.kind === 'habit' ? 'Habit' : s.ui.kind === 'season' ? 'Season' : 'Goal'}</span><select class="input" data-change="rw-ref" aria-label="Which one">${list.map(([id, name]) => html`<option value="${id}" ${id === s.ui.ref ? 'selected' : ''}>${name}</option>`)}</select></label>` : ''}
        ${fixed ? '' : html`<label class="field"><span class="field-label">${s.ui.kind === 'season' ? 'Score (%)' : 'How many'}</span><input class="input input--num" type="number" inputmode="numeric" min="1" data-input="rw-target" value="${s.ui.target}" aria-label="Target"></label>`}
        <button type="button" class="btn btn--primary btn--block" data-action="rw-save">Set the reward</button>
      </div>`;
    },
    inputs: {
      'rw-title': ({ value, sheet }) => { sheet.ui.title = value; },
      'rw-kind': ({ value, sheet }) => { sheet.ui.kind = value; sheet.ui.ref = null; sheet.ui.target = value === 'season' ? 80 : value === 'sealed' ? 20 : 12; sheet.refresh(); },
      'rw-ref': ({ value, sheet }) => { sheet.ui.ref = value; },
      'rw-target': ({ value, sheet }) => { sheet.ui.target = Number(value); },
    },
    actions: {
      'rw-save': ({ sheet }) => {
        if (!sheet.ui.title.trim()) { app.toast('Name the reward first.'); return; }
        const r = Rw.create({ title: sheet.ui.title, kind: sheet.ui.kind, ref: sheet.ui.ref, target: sheet.ui.target });
        hap.success();
        app.closeSheet(sheet);
        app.toast(`Set: ${r.title}`, { icon: 'trophy', action: { label: 'Undo', fn: () => store.remove('rewards', r.id) } });
      },
    },
  });
}

export default {
  id: 'rewards',
  title: 'Rewards',
  render() {
    const list = Rw.rewards();
    const open = list.filter((r) => r.status !== 'claimed');
    const claimed = list.filter((r) => r.status === 'claimed').reverse().slice(0, 10);
    return html`
      ${pageHead({ title: 'Rewards', back: { to: 'plan', label: 'Plan' }, actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="rw-new">New reward</button>`, info: 'Rewards you set yourself, unlocked only by what really happened. No points, nothing to spend.' })}
      ${open.length ? html`<ul class="reward-list">${open.map(rewardRow)}</ul>`
        : html`<div class="card"><p class="card-lead">Pick something you’d enjoy and tie it to something real: twelve workouts, twenty sealed days, a goal reached.</p><button type="button" class="btn btn--soft btn--sm" data-action="rw-new">New reward</button></div>`}
      ${claimed.length ? html`<section class="block" data-key="claimed"><div class="block-head"><h2 class="block-title">Enjoyed</h2></div><ul class="reward-list">${claimed.map(rewardRow)}</ul></section>` : ''}`;
  },
  actions: {
    'rw-new': () => openNewReward(),
    'rw-claim': ({ data }) => { const r = store.get('rewards', data.id); if (r) { Rw.claim(r); hap.success(); app.toast(`Enjoy it: ${r.title}`, { icon: 'trophy' }); } },
    'rw-del': ({ data }) => { const r = store.get('rewards', data.id); if (!r) return; store.remove('rewards', r.id); app.toast('Reward removed', { action: { label: 'Undo', fn: () => store.put('rewards', r) } }); },
  },
};
