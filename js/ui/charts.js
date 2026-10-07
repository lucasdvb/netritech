// Lightweight, responsive charts: SVG paths in a 0–1000 space stretched to the
// box (strokes stay crisp via non-scaling-stroke), labels and tooltips in HTML.
import { html, raw, esc } from './dom.js';

const registry = new Map();
let seq = 0;
const remember = (id, data) => {
  registry.set(id, data);
  while (registry.size > 200) registry.delete(registry.keys().next().value);
};
const W = 1000, HGT = 1000;

/** Monotone cubic (Fritsch–Carlson) path through points [[x,y]...] – no overshoot. */
export function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  const n = pts.length;
  const dx = [], dy = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / (dx[i] || 1); }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/** Compact axis labels: no units, at most one decimal, thousands as k. */
export function axisFmt(v) {
  const a = Math.abs(v);
  if (a >= 1000) return `${+(v / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return Number.isInteger(v) ? String(v) : String(+v.toFixed(1));
}

function niceRange(min, max, { zero = false, pad = 0.12 } = {}) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  let lo = zero ? Math.min(0, min) : min - span * pad;
  let hi = max + span * pad;
  const step = niceStep((hi - lo) / 3);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

/** Split into runs without nulls so gaps stay gaps. */
const runs = (pts) => pts.reduce((acc, p) => {
  if (p[1] == null) acc.push([]);
  else acc[acc.length - 1].push(p);
  return acc;
}, [[]]).filter((r) => r.length);

/**
 * series: [{ values: [number|null], color, area, dashed, width, label }]
 * labels: x-axis labels (same length as values); fmt: value formatter for tooltips/axis.
 */
export function lineChart({ labels, series, height = 180, fmt = (v) => v, yFmt = axisFmt, yMin, yMax, zero = false, goal, xTicks = 4, tipLabels, empty = 'Not enough data yet' }) {
  const all = series.flatMap((s) => s.values).filter((v) => v != null && Number.isFinite(v));
  if (!all.length) return html`<div class="chart chart--empty" style="height:${height}px"><p>${empty}</p></div>`;
  const lo0 = Math.min(...all, goal?.value ?? Infinity), hi0 = Math.max(...all, goal?.value ?? -Infinity);
  const r = niceRange(yMin ?? lo0, yMax ?? hi0, { zero });
  if (yMin != null) r.lo = yMin;
  if (yMax != null) r.hi = yMax;
  // A fixed range can cut the padded scale; drop ticks that would sit outside the plot.
  const eps = (r.hi - r.lo) * 1e-6;
  r.ticks = r.ticks.filter((t) => t >= r.lo - eps && t <= r.hi + eps);
  const n = labels.length;
  const X = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const Y = (v) => HGT - ((v - r.lo) / (r.hi - r.lo || 1)) * HGT;
  const id = `c${++seq}`;
  remember(id, { labels: tipLabels || labels, series: series.map((s) => ({ ...s })), fmt, n });

  const paths = series.map((s, si) => {
    if (s.line === false) return '';
    const pts = s.values.map((v, i) => [X(i), v == null ? null : Y(v)]);
    return runs(pts).map((run) => {
      const d = smoothPath(run);
      const area = s.area ? `${d}L${run[run.length - 1][0]},${HGT}L${run[0][0]},${HGT}Z` : null;
      return raw(`${area ? `<path class="chart-area" d="${area}" fill="url(#g-${id}-${si})"/>` : ''}
        <path class="chart-line${s.dashed ? ' is-dashed' : ''}" d="${d}" stroke="${s.color}" stroke-width="${s.width || 2}" vector-effect="non-scaling-stroke" pathLength="1"/>`);
    });
  });
  const lastIdx = (vals) => { for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i; return -1; };
  const dotsHtml = series.filter((s) => !s.noDot).map((s) => {
    const i = lastIdx(s.values);
    if (i < 0) return '';
    return raw(`<span class="chart-dot${s.fill ? ' chart-dot--accent' : ''}" style="left:${(X(i) / 10).toFixed(2)}%;top:${(Y(s.values[i]) / 10).toFixed(2)}%;--c:${s.color}"></span>`);
  });
  const marks = series.filter((s) => s.marks).map((s) => s.values.map((v, i) => (v == null ? '' : raw(`<span class="chart-mark" style="left:${(X(i) / 10).toFixed(2)}%;top:${(Y(v) / 10).toFixed(2)}%;--c:${s.color}"></span>`))));
  const step = Math.max(1, Math.ceil(n / xTicks));
  const xl = [];
  for (let i = 0; i < n; i += step) xl.push(i);
  if (n > 1 && xl[xl.length - 1] !== n - 1 && n - 1 - xl[xl.length - 1] >= step / 2) xl.push(n - 1);

  return html`<figure class="chart" data-chart="${id}" style="height:${height}px">
    <div class="chart-plot">
      <svg viewBox="0 0 ${W} ${HGT}" preserveAspectRatio="none" aria-hidden="true">
        <defs>${series.map((s, si) => raw(`<linearGradient id="g-${id}-${si}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.fill || s.color}" stop-opacity="${s.fill ? '.32' : '.18'}"/><stop offset="1" stop-color="${s.fill || s.color}" stop-opacity="0"/></linearGradient>`))}</defs>
        ${r.ticks.map((t) => raw(`<line class="chart-grid" x1="0" x2="${W}" y1="${Y(t)}" y2="${Y(t)}" vector-effect="non-scaling-stroke"/>`))}
        ${goal ? raw(`<line class="chart-goal-line" x1="0" x2="${W}" y1="${Y(goal.value)}" y2="${Y(goal.value)}" vector-effect="non-scaling-stroke"/>`) : ''}
        ${paths}
      </svg>
      ${marks}${dotsHtml}
      ${goal ? html`<span class="chart-goal" style="top:${(Y(goal.value) / 10).toFixed(2)}%">${goal.label}</span>` : ''}
      ${r.ticks.map((t) => html`<span class="chart-y" style="top:${(Y(t) / 10).toFixed(2)}%">${yFmt(t)}</span>`)}
      <span class="chart-cursor" hidden></span>
      <div class="chart-tip" hidden></div>
    </div>
    <div class="chart-x">${xl.map((i) => html`<span style="left:${(X(i) / 10).toFixed(2)}%">${labels[i]}</span>`)}</div>
    <figcaption class="sr-only">${chartSummary(series, tipLabels || labels, fmt)}</figcaption>
  </figure>`;
}

/** Every 7th index, ending on the last one: date labels under long bar charts. */
const weekly = (n) => { const out = []; for (let i = n - 1; i >= 0; i -= 7) out.unshift(i); return out; };

/** Vertical bars. values may contain null. Bars that meet a minimum goal are dark, the latest is lime. */
export function barChart({ labels, values, height = 150, color = 'var(--accent)', fmt = (v) => v, goal, max, highlightLast = true, tipLabels, colors, goalIsMin = true }) {
  const vals = values.map((v) => (v == null ? null : Number(v)));
  const hi = Math.max(max ?? 0, goal?.value ?? 0, ...vals.filter((v) => v != null), 1);
  const id = `c${++seq}`;
  remember(id, { labels: tipLabels || labels, series: [{ values: vals, color: 'var(--accent)', label: '' }], fmt, n: vals.length, bars: true });
  return html`<figure class="chart chart--bars" data-chart="${id}" style="height:${height}px">
    <div class="chart-plot">
      ${goal ? html`<span class="chart-goal-bar" style="bottom:${((goal.value / hi) * 100).toFixed(2)}%"><b>${goal.label}</b></span>` : ''}
      <div class="bars">${vals.map((v, i) => html`<span class="bar-col${highlightLast && i === vals.length - 1 ? ' is-last' : ''}${v == null ? ' is-empty' : ''}${goal && goalIsMin && v != null && v >= goal.value ? ' is-hit' : ''}">
        <i style="height:${v == null ? 0 : Math.max(2, (v / hi) * 100).toFixed(2)}%;${colors?.[i] ? `background:${colors[i]}` : ''}"></i></span>`)}</div>
      <span class="chart-cursor" hidden></span>
      <div class="chart-tip" hidden></div>
    </div>
    ${labels.length > 14
      ? html`<div class="chart-x chart-x--sparse">${weekly(labels.length).map((i) => html`<span style="left:${(((i + 0.5) / labels.length) * 100).toFixed(2)}%">${(tipLabels || labels)[i]}</span>`)}</div>`
      : html`<div class="chart-x chart-x--bars">${labels.map((l) => html`<span>${l}</span>`)}</div>`}
    <figcaption class="sr-only">${chartSummary([{ values: vals, label: '' }], tipLabels || labels, fmt)}</figcaption>
  </figure>`;
}

/** Small inline trend line. */
export function sparkline(values, { color = 'var(--accent)', width = 80, height = 28 } = {}) {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v);
  const pts = values.map((x, i) => [(i / (values.length - 1)) * width, x == null ? null : height - 3 - ((x - lo) / (hi - lo || 1)) * (height - 6)]);
  return html`<svg class="spark" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    ${runs(pts).map((r) => raw(`<path d="${smoothPath(r)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`))}</svg>`;
}

/** Calendar heatmap of states: weeks as columns, Mon–Sun as rows. */
export function heatmap(days, { label = (d) => d.date } = {}) {
  const weeks = [];
  days.forEach((d, i) => { const w = Math.floor(i / 7); (weeks[w] ||= []).push(d); });
  return html`<div class="heat" role="img" aria-label="Completion history">${weeks.map((w) => html`<div class="heat-col">${w.map((d) => html`<span class="heat-cell heat--${d.state}" title="${label(d)}"></span>`)}</div>`)}</div>`;
}

function chartSummary(series, labels, fmt) {
  return series.map((s) => {
    const vals = s.values.map((v, i) => (v == null ? null : `${labels[i]}: ${fmt(v)}`)).filter(Boolean);
    if (!vals.length) return '';
    return `${s.label ? `${s.label}. ` : ''}${vals.length} points. First ${vals[0]}. Latest ${vals[vals.length - 1]}.`;
  }).join(' ');
}

/* ---------- interaction (one listener for every chart) ---------- */
function showTip(plot, clientX) {
  const fig = plot.closest('.chart');
  const data = registry.get(fig?.dataset.chart);
  if (!data) return;
  const rect = plot.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const i = data.bars ? Math.min(data.n - 1, Math.floor(x * data.n)) : Math.round(x * (data.n - 1));
  const rows = data.series.map((s) => (s.values[i] == null ? null : `<span class="tip-row"><i style="background:${s.color}"></i>${s.label ? `${esc(s.label)} ` : ''}<b>${esc(data.fmt(s.values[i]))}</b></span>`)).filter(Boolean);
  const tip = plot.querySelector('.chart-tip');
  const cur = plot.querySelector('.chart-cursor');
  if (!rows.length) { tip.hidden = true; cur.hidden = true; return; }
  const left = data.bars ? ((i + 0.5) / data.n) * 100 : data.n === 1 ? 50 : (i / (data.n - 1)) * 100;
  cur.hidden = false;
  cur.style.left = `${left}%`;
  tip.hidden = false;
  tip.innerHTML = `<span class="tip-label">${esc(data.labels[i] ?? '')}</span>${rows.join('')}`;
  tip.style.left = `${Math.max(14, Math.min(86, left))}%`;
}

function hideTip(plot) {
  plot.querySelector('.chart-tip')?.setAttribute('hidden', '');
  plot.querySelector('.chart-cursor')?.setAttribute('hidden', '');
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointermove', (e) => {
    const plot = e.target.closest?.('.chart-plot');
    if (plot) showTip(plot, e.clientX);
  });
  document.addEventListener('pointerdown', (e) => {
    const plot = e.target.closest?.('.chart-plot');
    if (plot) showTip(plot, e.clientX);
  });
  document.addEventListener('pointerleave', (e) => {
    const plot = e.target.closest?.('.chart-plot');
    if (plot) hideTip(plot);
  }, true);
  document.addEventListener('pointerout', (e) => {
    const plot = e.target.closest?.('.chart-plot');
    if (plot && !plot.contains(e.relatedTarget)) hideTip(plot);
  });
}
