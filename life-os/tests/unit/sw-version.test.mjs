// The offline worker's file list and version must match the files: a change shipped without it is
// never downloaded by a phone that already has Life OS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('sw.js is up to date with the app’s files', () => {
  const tool = fileURLToPath(new URL('../../tools/build-sw.mjs', import.meta.url));
  assert.doesNotThrow(() => execFileSync(process.execPath, [tool, '--check'], { stdio: 'pipe' }), 'run: node tools/build-sw.mjs');
});
