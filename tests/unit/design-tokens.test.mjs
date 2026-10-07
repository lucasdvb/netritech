// Guards for the design system: colour contrast and motion tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPRINGS } from '../../js/ui/motion.js';

const css = readFileSync(new URL('../../css/tokens.css', import.meta.url), 'utf8');

// Custom properties declared directly inside the first block that starts with `selector {`.
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing ${selector}`);
  let depth = 0;
  let i = css.indexOf('{', start);
  const from = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) break;
  }
  const body = css.slice(from, i);
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };

const resolve = (theme, v) => {
  for (let n = 0; n < 5; n++) {
    const m = /^var\(--([\w-]+)\)$/.exec(v);
    if (!m) break;
    v = theme[m[1]];
  }
  return v;
};
const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum]. 4.5:1 is the WCAG AA minimum for normal-size text.
const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5],
  ['text-2', 'bg', 4.5], ['text-2', 'surface', 4.5], ['text-2', 'surface-2', 4.5],
  ['text-3', 'bg', 4.5], ['text-3', 'surface', 4.5],
  ['accent-ink', 'bg', 4.5], ['accent-ink', 'surface', 4.5],
  ['on-accent', 'accent', 4.5], ['on-ink', 'ink', 4.5], ['danger', 'bg', 4.5],
];

for (const [name, theme] of [['light', light], ['dark', dark]]) {
  test(`${name} theme: text meets contrast minimums`, () => {
    const fails = [];
    for (const [fg, bg, min] of PAIRS) {
      const a = resolve(theme, theme[fg]);
      const b = resolve(theme, theme[bg]);
      const r = ratio(a, b);
      if (r < min) fails.push(`${fg} ${a} on ${bg} ${b}: ${r.toFixed(2)} < ${min}`);
    }
    assert.deepEqual(fails, []);
  });
}

test('springs in tokens.css match js/ui/motion.js', () => {
  const sup = css.slice(css.indexOf('@supports (transition-timing-function'));
  for (const [name, s] of Object.entries(SPRINGS)) {
    assert.ok(sup.includes(`--spring-${name}: ${s.easing};`), `--spring-${name} is out of date`);
    assert.equal(light[`dur-${name}`], `${s.duration}ms`);
  }
});

test('springs start at rest, end at rest and overshoot only a little', () => {
  for (const s of Object.values(SPRINGS)) {
    const v = s.easing.slice(7, -1).split(', ').map(Number);
    assert.equal(v[0], 0);
    assert.equal(v.at(-1), 1);
    assert.ok(Math.max(...v) < 1.08);
    assert.ok(s.duration > 200 && s.duration < 600);
  }
});

test('no text smaller than 11px in the type scale', () => {
  for (const [k, v] of Object.entries(light)) {
    if (!k.startsWith('fs-')) continue;
    for (const m of v.matchAll(/([\d.]+)rem/g)) assert.ok(Number(m[1]) * 17 >= 10.99, `${k} is ${Number(m[1]) * 17}px`);
  }
});
