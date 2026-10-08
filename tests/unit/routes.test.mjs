// The map: every older address has a home, and start-up knows which addresses are old.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROUTES } from '../../js/routes.js';
import { REDIRECTS, LEGACY, target } from '../../js/redirects.js';
import { match } from '../../js/ui/router.js';

const sample = (path) => path.split('/').map((s) => (s.startsWith(':') ? 'x1' : s)).join('/');

test('app.js checks for old addresses with the same pattern as the redirect table', () => {
  const app = readFileSync(new URL('../../js/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes(`const LEGACY = ${LEGACY.toString()};`));
});

test('every redirect is recognised as old, and lands on a real route', () => {
  for (const r of REDIRECTS) {
    const from = sample(r.path).replace(/\/x1\?$/, '');
    assert.ok(LEGACY.test(from), `${from} is not recognised as old`);
    const m = match([{ path: r.path }], from.split('/'));
    const to = target(r.to, m.params).split('?')[0];
    assert.ok(match(ROUTES, to.split('/')), `${from} → ${to} has no route`);
  }
});

test('no current route looks old', () => {
  for (const r of ROUTES) assert.equal(LEGACY.test(sample(r.path).replace(/\/x1\?$/, '')), false, r.path);
});
