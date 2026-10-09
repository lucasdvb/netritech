// Runs Shopify Theme Check (the same engine as `shopify theme check`) on ../theme and prints offenses.
import { themeCheckRun } from '@shopify/theme-check-node';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'theme');
const { offenses } = await themeCheckRun(root, undefined, () => {});
const sev = ['error', 'warning', 'info'];
let errors = 0;
for (const o of offenses.sort((a, b) => a.severity - b.severity || a.uri.localeCompare(b.uri))) {
  if (o.severity === 0) errors++;
  console.log(`${sev[o.severity]}\t${o.check}\t${o.uri.replace('file://' + root + '/', '')}:${o.start.line + 1}\t${o.message}`);
}
console.log(`\n${offenses.length} offenses, ${errors} errors`);
process.exit(errors ? 1 : 0);
