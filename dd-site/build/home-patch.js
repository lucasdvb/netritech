// Exact-string patches for the homepage (marcus-vane.js): nav and footer restyled to
// the inner-page system. Each `find` must occur exactly once.
const NAV_FOOT_CSS = `
/* ===== nav and footer, matched to the inner pages (dd-core) ===== */
.site-nav .nav-row { align-items: center; height: 80px; padding: 16px var(--gutter); }
.site-nav .nav-logo-cell { padding-inline: 4px; }
.site-nav .nav-mid { border: 0; }
.site-nav .cmk { display: none; }
.site-nav .nav-center { height: 80px; }
.site-nav .nav-center ul { gap: 2px; height: 48px; padding: 0 6px; border-radius: 999px; background: rgba(18,18,21,.58); backdrop-filter: blur(22px) saturate(150%); -webkit-backdrop-filter: blur(22px) saturate(150%); border: 1px solid rgba(255,255,255,.09); box-shadow: 0 10px 30px -12px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.06) inset; }
.site-nav .nav-center a { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 999px; font-size: 14px; font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(243,241,234,.78); transition: color .3s, background .3s; }
.site-nav .nav-center a:hover { color: #f3f1ea; background: rgba(255,255,255,.07); }
.site-nav .nav-center a .b { color: inherit; }
@media (min-width: 900px) {
  .site-nav .nav-action { flex-direction: row-reverse; gap: 10px; width: auto; height: 48px; padding: 0 22px; border: 0; border-radius: 999px; background: #f3f1ea; color: #08080a; font-size: 14px; font-weight: 500; text-transform: none; letter-spacing: 0; box-shadow: 0 10px 30px -12px rgba(0,0,0,.6); transition: transform .5s cubic-bezier(.16,1,.3,1), background .3s; }
  .site-nav .nav-action:hover { background: #fff; transform: translateY(-1px); }
}
.site-nav .burger { width: 48px; height: 48px; border: 1px solid rgba(255,255,255,.09); border-radius: 50%; background: rgba(18,18,21,.58); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
.site-nav .burger span { background: #f3f1ea; }
.contact { position: relative; z-index: 2; margin-top: 4rem; padding-top: clamp(80px, 9vw, 140px); background: #060607; border-radius: clamp(28px, 3.2vw, 48px) clamp(28px, 3.2vw, 48px) 0 0; box-shadow: 0 -1px 0 rgba(255,255,255,.08), 0 -40px 80px -30px rgba(0,0,0,.6); overflow: hidden; }
.contact .footer-bar { padding-bottom: 0; }
.mv-word { display: block; width: 100%; margin-top: clamp(56px, 7vw, 110px); font-family: var(--font-sans); font-size: 15vw; line-height: .74; letter-spacing: -.065em; white-space: nowrap; color: #f3f1ea; transform: translateY(.14em); user-select: none; }
.mv-word b { font-weight: 600; }
.mv-word span { font-weight: 300; }
/* the shared dd-core nav and footer replace these on the homepage */
.site-nav, .mobile-menu, footer.contact { display: none !important; }
`;
module.exports = [
  {
    find: '.dz-card-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }\n`;',
    replace: '.dz-card-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }\n' + NAV_FOOT_CSS + '`;',
  },
  {
    find: '      <div class="footer-copy">\n        <p>© 2026 Disruptive Dodo. All rights reserved.</p>\n      </div>\n    </div>\n  </footer>',
    replace: '      <div class="footer-copy">\n        <p>© 2026 Disruptive Dodo. All rights reserved.</p>\n      </div>\n    </div>\n    <p class="mv-word" aria-hidden="true"><span>disruptive</span><b>dodo.</b></p>\n  </footer>',
  },
  {
    find: 'function mvApp(R) {',
    replace: `// the footer wordmark fills the footer's width exactly
function mvFit(R) {
  const el = R.querySelector('.mv-word');
  if (!el) return;
  const run = () => {
    el.style.fontSize = '100px';
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const w = rg.getBoundingClientRect().width;
    if (w > 0) el.style.fontSize = (100 * el.clientWidth / w).toFixed(2) + 'px';
  };
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 120); }, { passive: true });
}

function mvApp(R) {`,
  },
  {
    find: '      mvApp(shadow);\n      dzInit(shadow);',
    replace: '      mvApp(shadow);\n      dzInit(shadow);\n      mvFit(shadow);',
  },
];
if (require.main === module) {
  const fs = require('fs');
  let s = fs.readFileSync(__dirname + '/../current/marcus-vane.js', 'utf8');
  for (const p of module.exports) {
    const n = s.split(p.find).length - 1;
    if (n !== 1) throw new Error('find occurs ' + n + 'x: ' + p.find.slice(0, 60));
    s = s.replace(p.find, () => p.replace);
  }
  fs.writeFileSync(__dirname + '/../out/marcus-vane.js', s);
  console.log('patched', s.length);
}
