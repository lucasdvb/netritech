// Export, import and backup. Nothing leaves the device unless you save or share the file.
import * as store from './store.js';
import * as idb from '../db/idb.js';
import { STORES, DB_VERSION } from '../db/schema.js';

export const APP_ID = 'life-os';
const DATA_STORES = Object.keys(STORES).filter((s) => s !== 'photoBlobs');

const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});
const dataURLToBlob = async (url) => (await fetch(url)).blob();

export async function buildBackup({ includePhotos = false } = {}) {
  await store.flush();
  const data = {};
  for (const s of DATA_STORES) data[s] = store.all(s);
  if (includePhotos) {
    const blobs = await store.blobs.all();
    data.photoBlobs = await Promise.all(blobs.map(async (b) => ({ id: b.id, dataUrl: await blobToDataURL(b.blob) })));
  }
  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
  return { app: APP_ID, kind: 'backup', schema: DB_VERSION, exportedAt: new Date().toISOString(), includesPhotos: includePhotos, counts, data };
}

/** Validates a parsed backup and returns counts, or throws a readable error. */
export function inspect(json) {
  if (!json || json.app !== APP_ID || !json.data || typeof json.data !== 'object') throw new Error('This file isn’t a Life OS backup.');
  if (json.schema > DB_VERSION) throw new Error('This backup comes from a newer version of Life OS. Update the app first.');
  const counts = {};
  for (const [k, v] of Object.entries(json.data)) {
    if (!STORES[k]) continue;
    if (!Array.isArray(v)) throw new Error(`The “${k}” section of this backup is damaged.`);
    if (v.some((r) => !r || typeof r !== 'object' || !r.id)) throw new Error(`Some “${k}” records in this backup are missing their ids.`);
    counts[k] = v.length;
  }
  return { counts, exportedAt: json.exportedAt, includesPhotos: !!json.includesPhotos };
}

/** mode 'replace' wipes current data first; 'merge' keeps the newer version of each record. */
export async function restore(json, mode = 'replace') {
  inspect(json);
  await store.flush();
  const incoming = {};
  for (const s of DATA_STORES) incoming[s] = Array.isArray(json.data[s]) ? json.data[s] : [];
  let photoBlobs = null;
  if (Array.isArray(json.data.photoBlobs)) {
    photoBlobs = await Promise.all(json.data.photoBlobs.map(async (p) => ({ id: p.id, blob: await dataURLToBlob(p.dataUrl), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
  }
  if (mode === 'replace') {
    const payload = { ...incoming };
    if (photoBlobs) payload.photoBlobs = photoBlobs;
    await idb.replaceAll(payload);
  } else {
    const ops = [];
    for (const s of DATA_STORES) {
      for (const rec of incoming[s]) {
        const cur = store.get(s, rec.id);
        if (!cur || (rec.updatedAt || '') > (cur.updatedAt || '')) ops.push({ store: s, value: rec });
      }
    }
    if (photoBlobs) photoBlobs.forEach((p) => ops.push({ store: 'photoBlobs', value: p }));
    await idb.batch(ops);
  }
  await store.reload();
}

/* ---------- CSV ---------- */
const csvCell = (v) => {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCSV(rows, columns) {
  const cols = columns || [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
}

export const CSV_SETS = {
  weight: { label: 'Weight', make: () => toCSV(store.all('weightEntries').sort(byDate), ['date', 'kg', 'note']) },
  measurements: { label: 'Measurements', make: () => toCSV(store.all('measurements').sort(byDate), ['date', 'waist', 'chest', 'arms', 'thighs', 'calves', 'neck', 'note']) },
  habits: { label: 'Habit log', make: () => toCSV(store.all('habitLogs').sort(byDate).map((l) => ({ ...l, habit: store.get('habits', l.habitId)?.name || l.habitId })), ['date', 'habit', 'value', 'completed', 'note']) },
  nutrition: { label: 'Nutrition', make: () => toCSV(store.all('nutritionLogs').sort(byDate), ['date', 'name', 'protein', 'kcal', 'fruit', 'veg', 'at']) },
  water: { label: 'Water', make: () => toCSV(store.all('waterLogs').sort(byDate), ['date', 'ml', 'at']) },
  steps: { label: 'Steps', make: () => toCSV(store.all('stepLogs').sort(byDate), ['date', 'steps']) },
  sleep: { label: 'Sleep & mood', make: () => toCSV(store.all('sleepEntries').sort(byDate).map((s) => ({ ...s, ...(store.get('moodEntries', s.date) || {}) })), ['date', 'bedtime', 'wake', 'hours', 'quality', 'energy', 'stress', 'mood', 'body']) },
  workouts: { label: 'Workout sets', make: () => toCSV(store.all('workoutSets').filter((s) => s.completed).sort(byDate).map((s) => ({ ...s, workout: store.get('workouts', s.workoutId)?.title, exercise: store.get('exercises', s.exerciseId)?.name })), ['date', 'workout', 'exercise', 'setIndex', 'reps', 'load', 'seconds', 'minutes']) },
  journal: { label: 'Journal', make: () => toCSV(store.all('journalEntries').sort(byDate).map((j) => ({ ...j, answers: Object.values(j.answers || {}).join(' | ') })), ['date', 'kind', 'answers', 'text']) },
  tasks: { label: 'Tasks', make: () => toCSV(store.all('tasks').sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')).map((t) => ({ ...t, repeat: t.repeat ? `${t.repeat.kind}:${t.repeat.day}` : '', doneAt: t.doneAt ? t.doneAt.slice(0, 10) : '' })), ['date', 'title', 'area', 'repeat', 'done', 'doneAt', 'notes']) },
};
function byDate(a, b) { return (a.date || '') < (b.date || '') ? -1 : 1; }

/** Save a file: share sheet where available (iOS "Save to Files"), download otherwise. */
export async function saveFile(name, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const file = typeof File !== 'undefined' ? new File([blob], name, { type }) : null;
  if (file && navigator.canShare?.({ files: [file] }) && /iP(hone|ad|od)/.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
