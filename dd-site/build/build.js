// Build the Instatic code assets into out/: dd-core.js and dd-page-<key>.js.
// SEO fields (path, title, description, robots, section, ld) are copied from the
// current live files untouched; copy comes from src/pages and src/data.
const fs = require('fs');
const path = require('path');
const port = require('./gl-port.js');
const { mono } = require('./mono.js');
const ROOT = path.join(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '').replace(/\s*([{};])\s*/g, '$1').trim();
const tl = (s) => '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';

function oldPage(key) {
  global.window = {};
  eval(rd(`current/dd-page-${key}.js`).replace('if (DD.mount) DD.mount();', ''));
  return window.__DD.pages[key];
}

// gradient per page: id, exposure of the greyscale tint, poster for no-WebGL
const POST = (n) => ({ antipode: '/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp', gnomon: '/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp', meridian: '/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp', cynosure: '/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp', hearth: '/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp', firmament: '/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp' })[n] || '';
const GL = {
  antipode: { lift: 0.82 }, gnomon: { lift: 0.9 }, meridian: { lift: 0.4 }, cynosure: { lift: 0.26 }, hearth: { lift: 0.42, gamma: 1.4 }, firmament: { lift: 0.8 },
  reeded: { lift: 0.78 }, antumbra: { lift: 0.9 }, chatoyance: { lift: 0.6 },
};
function glFor(id) {
  const src = rd(`gl/${id}.html`);
  const m = src.match(/const CONFIG = (\{[\s\S]*?\n\})/);
  const def = eval('(' + m[1] + ')');
  const opt = GL[id] || {};
  const cfg = mono(def, { lift: opt.lift, gamma: opt.gamma || 1, bg: '#08080a' });
  return { id, cfg, poster: POST(id), fn: port(id) };
}
async function glForClean(id) {
  const g = glFor(id);
  g.fn = await port.clean(g.fn);
  return g;
}

const SERVICES = {
  websites: { gl: 'antipode', inc: 'bento' },
  'paid-ads': { gl: 'gnomon', inc: 'ledger' },
  branding: { gl: 'meridian', inc: 'tiles' },
  ai: { gl: 'cynosure', inc: 'chat' },
  automation: { gl: 'hearth', inc: 'flow' },
  'social-media': { gl: 'firmament', inc: 'rail' },
};
const PAGES = ['work', 'case-study', 'services', 'about', 'contact', 'privacy', 'fledge', ...Object.keys(SERVICES)];

function buildCore() {
  const css = minCss(rd('src/core.css'));
  const js = rd('src/core.js').replace('`/*@CSS@*/`', tl(css));
  fs.writeFileSync(path.join(ROOT, 'out/dd-core.js'), js);
  return js.length;
}

async function buildPage(key) {
  const old = oldPage(key);
  let p;
  if (SERVICES[key]) {
    const d = JSON.parse(rd(`src/data/${key}.json`));
    p = require('../src/pages/_service.js')(d, SERVICES[key]);
    p.gl = SERVICES[key].gl;
  } else {
    delete require.cache[require.resolve(`../src/pages/${key}.js`)];
    p = require(`../src/pages/${key}.js`);
  }
  const g = p.gl ? await glForClean(p.gl) : null;
  const meta = ['path', 'title', 'description', 'robots', 'section'].filter((k) => old[k] !== undefined)
    .map((k) => `  ${k}: ${JSON.stringify(old[k])},`).join('\n');
  const out = `// Disruptive Dodo · ${key} page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in \`html\` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages[${JSON.stringify(key)}] = {
${meta}
  ld: ${JSON.stringify(old.ld)},
  css: ${tl(minCss(p.css || ''))},
  html: ${tl(p.html)},${g ? `
  // Hero gradient: GetLayers "${g.id}", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: ${JSON.stringify(g.cfg)}, poster: ${JSON.stringify(g.poster)}, mount: ${g.fn} },` : ''}${p.init ? `
  init: ${p.init.toString()},` : ''}
};
DD.current = ${JSON.stringify(key)};
if (DD.mount) DD.mount();
`;
  fs.writeFileSync(path.join(ROOT, `out/dd-page-${key}.js`), out);
  new Function(out.replace(/^const DD/m, 'var DD')); // syntax check
  return out.length;
}

(async () => {
  const only = process.argv.slice(2);
  console.log('dd-core.js', buildCore());
  for (const k of PAGES) {
    if (only.length && !only.includes(k)) continue;
    if (!SERVICES[k] && !fs.existsSync(path.join(ROOT, `src/pages/${k}.js`))) { console.log('skip', k); continue; }
    try { console.log(`dd-page-${k}.js`, await buildPage(k)); } catch (e) { console.error('FAIL', k, e.message); process.exitCode = 1; }
  }
})();
