// Shared Playwright harness for the Life OS browser tests.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

export async function setup({ base = 'http://localhost:4173/', out = './test-shots', device = 'iPhone 14', scheme = 'light' } = {}) {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices[device], colorScheme: scheme });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const step = async (name, fn) => {
    try { await fn(); console.log(`ok   ${name}`); }
    catch (e) {
      await page.screenshot({ path: `${out}/fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});
      console.log(`FAIL ${name}: ${e.message.split('\n').slice(0, 12).join(' | ')}`);
      errors.push(`${name}: ${e.message.split('\n')[0]}`);
    }
  };
  const shot = async (n) => {
    await page.waitForTimeout(450);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) errors.push(`${n}: page is ${over}px wider than the screen`);
    await page.screenshot({ path: `${out}/${n}.png`, fullPage: true });
  };
  const go = async (hash, sel) => {
    await page.goto(base + hash);
    await page.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
    if (sel) await page.waitForSelector(sel);
  };
  const a11y = async (label) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll('button, [role="switch"], [role="checkbox"]')]
      .filter((b) => b.offsetParent !== null && !b.textContent.trim() && !b.getAttribute('aria-label'))
      .map((b) => b.outerHTML.slice(0, 100)));
    if (bad.length) errors.push(`${label}: unlabeled controls: ${bad.slice(0, 3).join(' | ')}`);
  };
  const finish = async () => {
    console.log(errors.length ? `\nERRORS (${errors.length}):\n${errors.join('\n')}` : '\nno errors');
    await browser.close();
    process.exit(errors.length ? 1 : 0);
  };
  return { browser, ctx, page, errors, step, shot, go, a11y, finish, base };
}
