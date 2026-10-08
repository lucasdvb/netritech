// Cues from your iPhone (13c): the Shortcuts app can fire on real events (an alarm stopped, wind
// down beginning, arriving somewhere, an NFC sticker), which works with Life OS closed and needs no
// server. This picks the event that matches a habit's "When" and writes the recipe and the words.
// Why events and not clock times: an event cue builds the habit into the moment; a timed reminder
// builds a dependence on the reminder (Stawarz et al. 2015; Wood & Neal 2007).
import * as H from './habits-more.js';
import * as R from './routines.js';
import { parseHM } from './dates.js';

/** The events Shortcuts can start an automation from, as you'll find them in its list. */
export const TRIGGERS = {
  alarm: { ic: 'alarm-clock', name: 'Alarm', short: 'when your alarm stops', pick: 'Choose **Alarm**, then **Is Stopped**, and pick your wake-up alarm.' },
  sleep: { ic: 'moon', name: 'Sleep', short: 'when wind down begins', pick: 'Choose **Sleep**, then **Wind Down Begins**. It follows the sleep schedule in the Health app.' },
  arrive: { ic: 'map', name: 'Arrive', short: 'when you arrive', pick: 'Choose **Arrive**, then pick the place.' },
  leave: { ic: 'map', name: 'Leave', short: 'when you leave', pick: 'Choose **Leave**, then pick the place.' },
  nfc: { ic: 'smartphone', name: 'NFC', short: 'when you tap a sticker', pick: 'Choose **NFC**, tap **Scan** and hold the top of your iPhone to the sticker. Name it after the place.' },
  charger: { ic: 'zap', name: 'Charger', short: 'when you plug in', pick: 'Choose **Charger**, then **Is Connected**.' },
  time: { ic: 'clock', name: 'Time of Day', short: 'at a set time', pick: 'Choose **Time of Day** and set the time.' },
};

// Matched against the habit's "When" first, then its name; the first rule that fits wins.
const RULES = [
  [/wake|alarm|get up|out of bed|first thing/, 'alarm'],
  [/teeth|brush|shower|bathroom|floss/, 'nfc', 'on the bathroom mirror'],
  [/coffee|kettle|tea\b|breakfast/, 'nfc', 'on the coffee machine'],
  [/desk|laptop|sit down/, 'nfc', 'on your desk'],
  [/gym|training|workout|lift/, 'arrive', 'your gym'],
  [/leave work|after work|finish work|leave the office|end of work/, 'leave', 'work'],
  [/get home|arrive home|come home|home from/, 'arrive', 'home'],
  [/plug|charg/, 'charger'],
  [/bed|sleep|lights|wind down|night|evening routine/, 'sleep'],
  [/lunch|dinner|supper|meal|eat/, 'time'],
];
const FALLBACK_TIMES = { lunch: '12:30', dinner: '19:00', supper: '19:00' };

/** The cue that fits: { trigger, place, time }. A clock time only when nothing else fits. */
export function cueFor({ anchor = '', name = '', time = null, kind = null } = {}) {
  const text = `${anchor} ${name}`.toLowerCase();
  if (kind === 'morning' && !anchor) return { trigger: 'alarm' };
  if (kind === 'evening' && !anchor) return { trigger: 'sleep' };
  for (const [re, trigger, place] of RULES) {
    if (!re.test(text)) continue;
    if (trigger !== 'time') return { trigger, place: place || null };
    const word = Object.keys(FALLBACK_TIMES).find((w) => text.includes(w));
    return { trigger, time: time || FALLBACK_TIMES[word] || '12:30' };
  }
  return time && parseHM(time) != null ? { trigger: 'time', time } : { trigger: 'nfc', place: 'where you do it' };
}

/** The words the notification shows: short, and it names the smallest version. */
export function cueText(h) {
  const tiny = h ? H.tinyOf(h) : null;
  const name = h?.name || '';
  if (h && H.isLimit(h)) return h.instead ? `${name}: ${h.instead}` : `${name}: notice the urge, and let it pass.`;
  return tiny?.label ? `${name} now. Even just: ${tiny.label.replace(/\.$/, '')}.` : `${name} now.`;
}

/** The steps in the Shortcuts app, in order (markdown-light: **bold** marks the words on screen). */
export function steps(cue) {
  const t = TRIGGERS[cue.trigger];
  const pick = cue.trigger === 'time' ? `Choose **Time of Day**, set **${cue.time}** and how often it repeats.`
    : cue.place && ['arrive', 'leave'].includes(cue.trigger) ? `${t.pick.replace('the place', `the place (${cue.place})`)}`
      : t.pick;
  return [
    'Open the **Shortcuts** app, tap **Automation**, then **+**.',
    pick,
    'Choose **Run Immediately**, then **Next**.',
    'Tap **New Blank Automation**, then **Add Action**. Search for **Show Notification** and tap it.',
    'Tap the words in the action, paste the text below, then tap **Done**.',
  ];
}

/** One habit as a cue item. */
export const habitItem = (h) => ({ id: `habit:${h.id}`, kind: 'habit', habitId: h.id, name: h.name, ic: h.icon,
  cue: cueFor({ anchor: h.anchor, name: h.name, time: h.time || h.reminder }), text: cueText(h), done: !!h.cueSetAt });

/** What needs a cue: your focus habits and your routines, each with its suggested cue. */
export function list() {
  const out = [];
  for (const r of R.routines()) {
    if (r.archived) continue;
    out.push({ id: `routine:${r.id}`, kind: 'routine', name: r.name, ic: R.iconOf(r), cue: cueFor({ anchor: r.anchor, name: r.name, time: r.window?.from, kind: r.kind }),
      text: `${r.name}: ${(r.steps || []).length} steps. Open Life OS to go through them.`, done: !!r.cueSetAt });
  }
  for (const h of H.focusHabits()) out.push(habitItem(h));
  return out;
}
