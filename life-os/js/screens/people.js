// The people you @mention: everything you've written about one person, newest first, from the brain
// dump and the journal.
import { html } from '../ui/dom.js';
import { app } from '../ui/app-api.js';
import { mentionsOfPerson, people } from '../domain/mentions.js';
import { relativeDay } from '../domain/dates.js';
import { mentionText } from '../ui/mention-text.js';

export function openPerson(name) {
  const hits = mentionsOfPerson(name);
  const known = people().find((p) => p.name.toLowerCase() === String(name).toLowerCase());
  app.sheet({
    title: `@${known?.name || name}`,
    render: () => html`${hits.length ? html`<p class="sheet-note">${hits.length} mention${hits.length === 1 ? '' : 's'} in your notes and journal.</p>
      <ul class="list">${hits.map((m) => html`<li><a class="row" href="#/${m.to}" data-action="go" data-to="${m.to}">
        <span class="row-main"><span class="row-title linked-snippet">${mentionText(m.snippet)}</span><span class="row-sub">${m.source === 'note' ? 'Brain dump' : 'Journal'} · ${relativeDay(m.date)}</span></span></a></li>`)}</ul>`
      : html`<p class="sheet-note">Nothing written about ${name} yet. Write @${name} in a note or your journal and it shows here.</p>`}`,
    actions: { go: ({ data, sheet }) => { app.closeSheet(sheet); app.go(data.to); } },
  });
}
