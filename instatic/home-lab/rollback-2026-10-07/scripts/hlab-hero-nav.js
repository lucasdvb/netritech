/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
/* SPM V3 hero — sticky menu behaviour (restored from the original nav).
   Reveals the floating glass bar on load. Below 1080px the menu button opens a
   side drawer modelled on terminal-industries.com: a frosted dark panel that
   slides in from the right over a dimmed page, items rising in one after the
   other, a Solutions sub-level that slides in on its own, and the contact
   block at the bottom. Runs on SPM V3 and on the inner pages (shared shell). */
(function () {
  var header = document.querySelector('.hlab-site-header');
  if (header) requestAnimationFrame(function () { header.classList.add('hlab-revealed'); });

  // Failsafe for the photo hold in hlab-hero.css: the hero script releases it
  // when its preloader lifts; this guarantees it even if that never happens.
  setTimeout(function () { document.documentElement.classList.add('hlab-media-ready'); }, 8000);

  var btn = document.querySelector('.hlab-nav-menu-btn');
  if (!btn || document.querySelector('.hlab-drawer')) return;

  /* ---------- content ---------- */
  var NAV = [
    { label: 'Solutions', href: '#', sub: [
      'Service client & SAV', 'Développement commercial', 'Enquêtes de satisfaction',
      'Assistance administrative', 'Secrétariat téléphonique', 'Recrutement & RH'] },
    { label: 'Pourquoi SPM', href: '#' },
    { label: 'Clients & Partenaires', href: '#' },
    { label: 'Secteurs', href: '#' },
    { label: 'Actualités', href: '#' },
    { label: 'Carrières', href: '#' }
  ];
  var HERE = { 'solutions': 'Solutions', 'pourquoi-spm': 'Pourquoi SPM', 'clients-partenaires': 'Clients & Partenaires',
    'secteurs': 'Secteurs', 'actualites': 'Actualités', 'carrieres': 'Carrières' };
  var here = HERE[location.pathname.replace(/^\/+|\/+$/g, '')] || '';
  var LOGO = '/uploads/PaGiFRVvA4n8m82VPdnC1-HUMAN___AI__12_.png';   // colour logo for the dark panel, loaded on first use
  var PHONE = '04 81 65 98 45', TEL = '+33481659845';

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var CHEV = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BACK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 4L6 8l4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var CSS =
    '.hlab-nav-dropdown{display:none!important}' +
    '.hlab-drawer{position:fixed;inset:0;z-index:2147483647;visibility:hidden;pointer-events:none;font-family:inherit;color:#fff;-webkit-font-smoothing:antialiased}' +
    '.hlab-drawer.is-open,.hlab-drawer.is-closing{visibility:visible}' +
    '.hlab-drawer.is-open{pointer-events:auto}' +
    '.hlab-dw-ov{position:absolute;inset:0;background:rgba(5,9,14,.5);opacity:0;transition:opacity .25s ease-out}' +
    '.hlab-drawer.is-open .hlab-dw-ov{opacity:1}' +
    '.hlab-dw-panel{position:absolute;top:0;right:0;bottom:0;width:min(320px,86vw);display:flex;flex-direction:column;background:rgba(13,20,31,.42);-webkit-backdrop-filter:blur(30px) saturate(140%);backdrop-filter:blur(30px) saturate(140%);box-shadow:-4px 0 24px rgba(0,0,0,.2);transform:translate3d(100%,0,0);transition:transform .3s cubic-bezier(.32,.72,0,1);overscroll-behavior:contain;touch-action:pan-y}' +
    '.hlab-drawer.is-open .hlab-dw-panel{transform:translate3d(var(--dw-drag,0px),0,0)}' +
    '.hlab-drawer.is-drag .hlab-dw-panel{transition:none}' +
    '@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.hlab-dw-panel{background:rgba(13,20,31,.94)}}' +
    '.hlab-dw-head{position:relative;display:flex;align-items:center;justify-content:space-between;height:72px;padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.2);flex:none}' +
    '.hlab-dw-logo{display:flex;align-items:center;height:28px}' +
    '.hlab-dw-logo img{height:46px;width:auto;display:block;margin:-9px 0 -9px -2px}' +
    '.hlab-dw-back{display:flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 0;margin:0;border:0;background:none;color:#fff;font:500 16px/1 inherit;font-family:inherit;letter-spacing:-.01em;cursor:pointer}' +
    '.hlab-dw-back svg{width:16px;height:16px}' +
    '.hlab-dw-hl{position:absolute;left:20px;top:22px;transition:opacity .25s ease,transform .35s cubic-bezier(.32,.72,0,1)}' +
    '.hlab-dw-hl.is-off{opacity:0;transform:translate3d(-10px,0,0);pointer-events:none}' +
    '.hlab-dw-hl.is-off-r{opacity:0;transform:translate3d(10px,0,0);pointer-events:none}' +
    '.hlab-dw-x{margin-left:auto;width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;transition:background .2s}' +
    '.hlab-dw-x:hover{background:rgba(255,255,255,.16)}' +
    '.hlab-dw-x svg{width:14px;height:14px}' +
    '.hlab-dw-body{position:relative;flex:1 1 auto;min-height:0;overflow:hidden}' +
    '.hlab-dw-lv{position:absolute;inset:0;overflow-y:auto;padding:24px 20px;scrollbar-width:none;transition:transform .45s cubic-bezier(.32,.72,0,1),opacity .3s ease}' +
    '.hlab-dw-lv::-webkit-scrollbar{display:none}' +
    '.hlab-dw-lv2{transform:translate3d(40px,0,0);opacity:0;visibility:hidden}' +
    '.hlab-drawer.is-sub .hlab-dw-lv1{transform:translate3d(-40px,0,0);opacity:0;visibility:hidden}' +
    '.hlab-drawer.is-sub .hlab-dw-lv2{transform:none;opacity:1;visibility:visible}' +
    '.hlab-dw-lv ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}' +
    '.hlab-dw-it{display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;margin:0;border:0;border-radius:8px;background:transparent;color:#fff;font-family:inherit;font-size:16px;line-height:1.2;font-weight:500;letter-spacing:-.01em;text-align:left;text-decoration:none;cursor:pointer;transition:background .2s,color .3s cubic-bezier(0,0,.58,1)}' +
    '.hlab-dw-it svg{width:16px;height:16px;flex:none;opacity:.8;transition:transform .3s cubic-bezier(.32,.72,0,1)}' +
    '.hlab-dw-it:hover,.hlab-dw-it:focus-visible{background:rgba(255,255,255,.08);outline:none}' +
    '.hlab-dw-it:hover svg{transform:translate3d(2px,0,0)}' +
    '.hlab-dw-it[aria-current=page]{background:rgba(255,255,255,.1)}' +
    '.hlab-dw-it[aria-current=page]>span::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#5cc2c9;margin-left:10px;vertical-align:middle;transform:translateY(-1px)}' +
    '.hlab-dw-lv2 .hlab-dw-it{font-size:15px;font-weight:400;color:rgba(255,255,255,.86)}' +
    '.hlab-dw-lv2 .hlab-dw-all{color:#fff;font-weight:500;background:rgba(255,255,255,.08)}' +
    '.hlab-dw-foot{flex:none;display:grid;gap:12px;padding:20px 20px calc(20px + env(safe-area-inset-bottom))}' +
    '.hlab-dw-phone{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15)}' +
    '.hlab-dw-phone a{color:#fff;text-decoration:none;font-size:14px;letter-spacing:.06em;font-variant-numeric:tabular-nums}' +
    '.hlab-dw-copy{width:24px;height:24px;display:grid;place-items:center;padding:0;border:0;background:none;color:rgba(255,255,255,.45);cursor:pointer;transition:color .2s}' +
    '.hlab-dw-copy:hover,.hlab-dw-copy.is-done{color:#5cc2c9}' +
    '.hlab-dw-copy svg{width:14px;height:14px}' +
    '.hlab-dw-cta{display:flex;align-items:center;justify-content:center;height:46px;padding:0 20px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:background .3s cubic-bezier(0,0,.58,1),color .3s,border-color .3s}' +
    '.hlab-dw-cta-1{background:#fff;color:#0d141f}' +
    '.hlab-dw-cta-1:hover{background:#dff0f1}' +
    '.hlab-dw-cta-2{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3)}' +
    '.hlab-dw-cta-2:hover{border-color:#fff}' +
    '.hlab-dw-lang{display:flex;justify-content:center;padding-top:4px}' +
    '.hlab-dw-lang .hlab-lang{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,.5);font-size:12px;letter-spacing:.12em}' +
    '.hlab-dw-lang .hlab-lang-opt{padding:4px 6px;border:0;background:none;color:inherit;font:inherit;letter-spacing:inherit;cursor:pointer}' +
    '.hlab-dw-lang .hlab-lang-opt.is-on{color:#fff}' +
    /* entrance: rows rise in one after the other once the panel is moving */
    '.hlab-dw-rv{opacity:0;transform:translate3d(16px,0,0);transition:opacity .4s ease,transform .6s cubic-bezier(.32,.72,0,1)}' +
    '.hlab-drawer.is-open .hlab-dw-rv{opacity:1;transform:none;transition-delay:calc(90ms + var(--i,0) * 35ms)}' +
    'html.hlab-dw-lock,html.hlab-dw-lock body{overflow:hidden!important}' +
    'html.hlab-dw-lock .hlab-langball{opacity:0;pointer-events:none}' +
    '@media (min-width:1080px){.hlab-drawer{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.hlab-dw-panel,.hlab-dw-lv,.hlab-dw-rv,.hlab-dw-hl{transition-duration:.01s!important;transition-delay:0s!important}}';

  var st = document.createElement('style');
  st.setAttribute('data-hlab', 'drawer');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ---------- markup ---------- */
  var i = 0;
  function rv() { return ' class="hlab-dw-rv" style="--i:' + (i++) + '"'; }
  var lv1 = NAV.map(function (it) {
    var cur = it.label === here ? ' aria-current="page"' : '';
    if (it.sub) return '<li' + rv() + '><button type="button" class="hlab-dw-it" data-dw-sub aria-expanded="false"' + cur + '><span>' + esc(it.label) + '</span>' + CHEV + '</button></li>';
    return '<li' + rv() + '><a class="hlab-dw-it" href="' + it.href + '"' + cur + '><span>' + esc(it.label) + '</span></a></li>';
  }).join('');
  var sol = NAV[0];
  var lv2 = '<li><a class="hlab-dw-it hlab-dw-all" href="' + sol.href + '"><span>Toutes les solutions</span>' + CHEV + '</a></li>' +
    sol.sub.map(function (s) { return '<li><a class="hlab-dw-it" href="#"><span>' + esc(s) + '</span></a></li>'; }).join('');
  var foot =
    '<div class="hlab-dw-phone"' + rv() + '><a href="tel:' + TEL + '">' + PHONE + '</a>' +
      '<button type="button" class="hlab-dw-copy" aria-label="Copier le numéro"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/></svg></button></div>' +
    '<a class="hlab-dw-cta hlab-dw-cta-1 hlab-dw-rv" style="--i:' + (i++) + '" href="#contact">Prendre rendez-vous</a>' +
    '<a class="hlab-dw-cta hlab-dw-cta-2 hlab-dw-rv" style="--i:' + (i++) + '" href="#contact">Nous contacter</a>' +
    '<div class="hlab-dw-lang hlab-dw-rv" style="--i:' + (i++) + '"><div class="hlab-lang" role="group" aria-label="Langue">' +
      '<button type="button" class="hlab-lang-opt" data-lang="fr">FR</button><span aria-hidden="true">·</span>' +
      '<button type="button" class="hlab-lang-opt" data-lang="en">EN</button></div></div>';

  var dw = document.createElement('div');
  dw.className = 'hlab-drawer';
  dw.id = 'hlab-drawer';
  dw.innerHTML =
    '<div class="hlab-dw-ov" data-dw-close></div>' +
    '<aside class="hlab-dw-panel" role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">' +
      '<div class="hlab-dw-head">' +
        '<a class="hlab-dw-logo hlab-dw-hl" href="/spmv3" aria-label="SPM, accueil">' + '<img alt="SPM" data-src="' + LOGO + '" width="84" height="46" decoding="async">' + '</a>' +
        '<button type="button" class="hlab-dw-back hlab-dw-hl is-off-r" data-dw-back tabindex="-1">' + BACK + '<span>Solutions</span></button>' +
        '<button type="button" class="hlab-dw-x" data-dw-close aria-label="Fermer le menu"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
      '</div>' +
      '<div class="hlab-dw-body">' +
        '<nav class="hlab-dw-lv hlab-dw-lv1" aria-label="Menu principal"><ul>' + lv1 + '</ul></nav>' +
        '<nav class="hlab-dw-lv hlab-dw-lv2" aria-label="Solutions" inert><ul>' + lv2 + '</ul></nav>' +
      '</div>' +
      '<div class="hlab-dw-foot">' + foot + '</div>' +
    '</aside>';
  document.body.appendChild(dw);

  // the language buttons in the drawer follow the stored choice (chrome script owns the clicks)
  function syncLang() {
    var on = document.documentElement.getAttribute('lang') || 'fr';
    dw.querySelectorAll('.hlab-lang-opt').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-lang') === on); });
  }

  /* ---------- behaviour ---------- */
  var panel = dw.querySelector('.hlab-dw-panel'), lvA = dw.querySelector('.hlab-dw-lv1'), lvB = dw.querySelector('.hlab-dw-lv2');
  var logoA = dw.querySelector('.hlab-dw-logo'), backB = dw.querySelector('[data-dw-back]'), subBtn = dw.querySelector('[data-dw-sub]');
  var isOpen = false, closeT = 0, lastFocus = null;
  btn.setAttribute('aria-controls', 'hlab-drawer');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-haspopup', 'dialog');
  // the panel logo loads only when the menu is about to be used
  function loadLogo() { var im = dw.querySelector('.hlab-dw-logo img[data-src]'); if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); } }
  btn.addEventListener('pointerdown', loadLogo, { passive: true });
  btn.addEventListener('touchstart', loadLogo, { passive: true });

  function sub(on) {
    dw.classList.toggle('is-sub', on);
    if (on) { lvB.removeAttribute('inert'); lvA.setAttribute('inert', ''); } else { lvA.removeAttribute('inert'); lvB.setAttribute('inert', ''); }
    logoA.classList.toggle('is-off', on);
    backB.classList.toggle('is-off-r', !on);
    backB.tabIndex = on ? 0 : -1;
    subBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    (on ? backB : subBtn).focus({ preventScroll: true });
  }
  function open() {
    if (isOpen) return;
    isOpen = true; clearTimeout(closeT);
    lastFocus = document.activeElement;
    syncLang();
    loadLogo();
    dw.classList.remove('is-closing');
    dw.style.removeProperty('--dw-drag');
    document.documentElement.classList.add('hlab-dw-lock');
    void panel.offsetWidth;                       // start from the closed position
    dw.classList.add('is-open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    setTimeout(function () { if (isOpen) panel.focus({ preventScroll: true }); }, 60);
  }
  function close(instant) {
    if (!isOpen) return;
    isOpen = false;
    dw.classList.remove('is-open', 'is-drag');
    dw.classList.add('is-closing');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('hlab-dw-lock');
    closeT = setTimeout(function () { dw.classList.remove('is-closing'); if (dw.classList.contains('is-sub')) sub(false); dw.style.removeProperty('--dw-drag'); }, instant ? 0 : 340);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  btn.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); isOpen ? close() : open(); }, true);
  dw.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-dw-close]')) { close(); return; }
    if (t.closest('[data-dw-sub]')) { sub(true); return; }
    if (t.closest('[data-dw-back]')) { sub(false); return; }
    var cp = t.closest('.hlab-dw-copy');
    if (cp) {
      try { navigator.clipboard.writeText(PHONE); } catch (err) {}
      cp.classList.add('is-done'); setTimeout(function () { cp.classList.remove('is-done'); }, 1400);
      return;
    }
    if (t.closest('.hlab-lang-opt')) { setTimeout(syncLang, 0); return; }
    if (t.closest('a')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); if (dw.classList.contains('is-sub')) sub(false); else close(); return; }
    if (e.key !== 'Tab') return;                  // keep focus inside the panel
    var f = [].filter.call(panel.querySelectorAll('a[href],button:not([tabindex="-1"])'), function (el) { return el.offsetParent && !el.closest('[inert]'); });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === a || document.activeElement === panel)) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
  // swipe the panel back to the right to close it
  var sx = 0, sy = 0, dx = 0, dragging = false, decided = false;
  panel.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; dragging = false; decided = false; }, { passive: true });
  panel.addEventListener('touchmove', function (e) {
    var t = e.touches[0], mx = t.clientX - sx, my = t.clientY - sy;
    if (!decided) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; decided = true; dragging = mx > 0 && Math.abs(mx) > Math.abs(my); if (dragging) dw.classList.add('is-drag'); }
    if (!dragging) return;
    dx = Math.max(0, mx);
    dw.style.setProperty('--dw-drag', dx + 'px');
  }, { passive: true });
  panel.addEventListener('touchend', function () {
    if (!dragging) return;
    dw.classList.remove('is-drag');
    if (dx > Math.min(110, panel.offsetWidth * .3)) close(); else dw.style.removeProperty('--dw-drag');
    dragging = false;
  });
  // back to the desktop bar: put everything away
  var mq = matchMedia('(min-width: 1080px)');
  var onMq = function () { if (mq.matches) close(true); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
})();

})();
