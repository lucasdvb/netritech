import * as store from '../data/store.js';

const nf = new Map();
const numFmt = (d) => {
  if (!nf.has(d)) nf.set(d, new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));
  return nf.get(d);
};

export const num = (n, d = 0) => (n == null || !Number.isFinite(Number(n)) ? '—' : numFmt(d).format(Number(n)));
export const pct = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);
export const signed = (n, d = 1, unit = '') => {
  if (n == null || !Number.isFinite(n)) return '—';
  const v = Math.abs(n) < 0.5 * 10 ** -d ? 0 : n;
  return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${numFmt(d).format(Math.abs(v))}${unit}`;
};

const units = () => store.settings()?.units || { weight: 'kg', length: 'cm' };
export const weightUnit = () => units().weight;
export const lengthUnit = () => units().length;

export const kgOut = (kg) => (kg == null ? null : weightUnit() === 'lb' ? kg * 2.20462 : kg);
export const kgIn = (v) => (v == null || v === '' ? null : weightUnit() === 'lb' ? Number(v) / 2.20462 : Number(v));
export const cmOut = (cm) => (cm == null ? null : lengthUnit() === 'in' ? cm / 2.54 : cm);
export const cmIn = (v) => (v == null || v === '' ? null : lengthUnit() === 'in' ? Number(v) * 2.54 : Number(v));

/** A lifting load in your unit ("22.5 kg", "50 lb"); empty for none. */
export const loadText = (kg) => { if (!kg) return ''; const v = kgOut(kg); return `${num(v, Math.abs(v - Math.round(v)) > 0.05 ? 1 : 0)} ${weightUnit()}`; };
export const weight = (kg, d = 1) => (kg == null ? '—' : `${num(kgOut(kg), d)} ${weightUnit()}`);
export const length = (cm, d = 1) => (cm == null ? '—' : `${num(cmOut(cm), d)} ${lengthUnit()}`);
export const litres = (ml, d = 1) => (ml == null ? '—' : `${num(ml / 1000, d)} L`);

export function habitValue(h, v) {
  if (v == null) return '—';
  if (h.unit === 'ml') return litres(v);
  if (h.unit === 'h') return `${num(v, 1)} h`;
  if (h.unit === 'steps') return num(v);
  return `${num(v, Number.isInteger(v) ? 0 : 1)}${h.unit ? ` ${h.unit}` : ''}`;
}

export function habitTarget(h, t) {
  if (h.unit === 'ml') return litres(t);
  if (h.unit === 'h') return `${num(t, 1)} h`;
  if (h.unit === 'steps') return num(t);
  return `${num(t)}${h.unit ? ` ${h.unit}` : ''}`;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
