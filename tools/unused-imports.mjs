// Lists named imports a file never uses. Run: node tools/unused-imports.mjs   (exits 1 if any)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(p); } })('js');
let found = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/^import\s+(?:(\w+)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"][^'"]+['"];?$/gm)) {
    const body = src.slice(0, m.index) + src.slice(m.index + m[0].length);
    const names = [m[1], m[3], m[4], ...(m[2] || '').split(',').map((x) => x.trim().split(/\s+as\s+/).pop())].filter(Boolean);
    for (const n of names) if (!new RegExp(`\\b${n}\\b`).test(body)) { console.log(`${f}: ${n}`); found++; }
  }
}
process.exit(found ? 1 : 0);
