// Disruptive Dodo · shared shell for the inner pages (Work, Services, Fledge, About,
// Contact, Privacy, case study, service pages). Mounted in a Shadow DOM on #dd-root,
// like the homepage (marcus-vane.js). Each page's content lives in its own
// src/scripts/dd-page-<key>.js, scoped to that page only. This file holds the design
// system (tokens, sheets, cards, type), nav, services mega-panel, mobile menu, footer,
// the reveal engine, the hero gradient runner and the SEO tags. Black and white only.

const FONT_CSS = `@font-face{font-family:"Switzer";font-style:normal;font-weight:300;font-display:swap;src:url("/uploads/b3T5Mu16B0S-WBpd0RySE-Switzer-Light.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:400;font-display:swap;src:url("/uploads/omJGqkQH2HmXNSQfbAzJu-Switzer-Regular.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:500;font-display:swap;src:url("/uploads/XMolNpeQj8mWtCYl6S3hH-Switzer-Medium.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:600;font-display:swap;src:url("/uploads/FChqSYdv-vGwYA1WBuYg7-Switzer-Semibold.otf") format("opentype")}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;background:#08080a}
body{margin:0;background:#08080a}
#dd-root{display:block;min-height:100vh;background:#08080a}`;

const CSS = `/*@CSS@*/`;

const AR = '<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV = '<svg class="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHK = '<svg class="ck" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOGO = '/uploads/kmkF0MdsNjve7VQIBhT9w-dd-logo-white.png';
const DODO = '/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp';

// The six services, in homepage order, each with its gradient poster.
const SERVICES = [
  { path: '/services/web-design', name: 'Websites and SEO', sub: 'Websites and SEO that put your business in front of the right people.', img: '/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp' },
  { path: '/services/facebook-google-ads', name: 'Paid ads', sub: 'Facebook, Instagram and Google ads that turn attention into enquiries.', img: '/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp' },
  { path: '/services/branding-logo-design', name: 'Branding', sub: 'Branding that makes your business stand out, build trust, and get remembered.', img: '/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp' },
  { path: '/services/ai-chatbots', name: 'AI implementation', sub: 'AI assistants that reply to your customers on WhatsApp and your website, day and night.', img: '/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp' },
  { path: '/services/marketing-automation-crm', name: 'Automation and CRM', sub: 'CRM, follow-up and automation, so you handle more enquiries without hiring more people.', img: '/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp' },
  { path: '/services/social-media-management', name: 'Social media', sub: 'Social media and content that keep your brand visible, trusted, and relevant.', img: '/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp' },
];
const SERVICE_PATHS = SERVICES.map((s) => s.path);

const NAV = `<header class="nav">
  <a class="nav-logo" href="/" aria-label="Disruptive Dodo, home"><img src="${LOGO}" alt="Disruptive Dodo" width="176" height="37"></a>
  <nav class="nav-pill glass" aria-label="Main">
    <button class="nav-svc" type="button" aria-expanded="false" aria-controls="dd-mp">Services${CHEV}</button>
    <a href="/fledge"><i class="sig" aria-hidden="true"></i>Fledge</a>
    <a href="/work">Work</a>
    <a href="/about">About</a>
  </nav>
  <a class="nav-cta" href="/contact">Let's talk${AR}</a>
  <button class="burger glass" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="dd-mm"><span></span><span></span></button>
</header>
<div class="mp" id="dd-mp" role="region" aria-label="Services">
  <a class="mp-feat" href="/fledge"><img src="${DODO}" alt="" width="921" height="1228" loading="lazy"><span class="cap">Our signature system</span><b>Fledge</b><span class="sub">Your full marketing system, built and run by one team.</span></a>
  <div class="mp-list">
    ${SERVICES.map((s) => `<a href="${s.path}"><img src="${s.img}" alt="" width="960" height="684" loading="lazy"><span><b>${s.name}</b><span>${s.sub}</span></span></a>`).join('')}
    <a class="mp-all" href="/services"><span>All services</span>${AR}</a>
  </div>
</div>
<div class="mm" id="dd-mm" aria-label="Menu">
  <ul class="mm-links">
    <li style="--i:0"><button type="button" class="mm-svc" aria-expanded="false" aria-controls="dd-mm-sub">Services${CHEV}</button>
      <div class="mm-sub" id="dd-mm-sub"><ul>${SERVICES.map((s) => `<li><a href="${s.path}">${s.name}</a></li>`).join('')}<li><a href="/services">All services</a></li></ul></div></li>
    <li style="--i:1"><a href="/fledge">Fledge</a></li>
    <li style="--i:2"><a href="/work">Work</a></li>
    <li style="--i:3"><a href="/about">About</a></li>
    <li style="--i:4"><a href="/contact">Contact</a></li>
  </ul>
  <div class="mm-foot">
    <div><p class="cap">New business</p><a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a></div>
    <div><p class="cap">Mauritius · GMT+4</p><time class="ft-time" data-clock></time></div>
    <a class="btn" href="/contact">Book a free growth call</a>
  </div>
</div>`;

const FOOTER = `<footer class="ft">
  <div class="ft-top">
    <div class="a">
      <p class="kick">Prefer email?</p>
      <h2 class="d1 mt-24">Do it once,<br>do it right</h2>
    </div>
    <div class="b">
      <p class="tx">Built properly the first time. One team, no wasted spend, nothing to redo later. Email us and let's get started.</p>
      <a class="ft-mail mt-32" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu${AR}</a>
    </div>
  </div>
  <div class="ft-cols">
    <div class="ft-col w ft-sig"><img src="${LOGO}" alt="Disruptive Dodo" width="266" height="56" loading="lazy"><p class="cap">Built in Mauritius. Made to grow.</p><p class="cap">Mauritius · GMT+4 · <time class="ft-time" data-clock></time></p></div>
    <nav class="ft-col" aria-label="Services"><p class="cap">Services</p><a href="/fledge">Fledge</a>${SERVICES.map((s) => `<a href="${s.path}">${s.name}</a>`).join('')}</nav>
    <nav class="ft-col" aria-label="Pages"><p class="cap">Pages</p><a href="/">Home</a><a href="/work">Work</a><a href="/services">Services</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
    <nav class="ft-col" aria-label="Social"><p class="cap">Follow</p><a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener">LinkedIn</a><a href="https://instagram.com" target="_blank" rel="noreferrer noopener">Instagram</a><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener">WhatsApp</a></nav>
    <div class="ft-col"><p class="cap">© 2026 Disruptive Dodo</p><a href="/privacy">Privacy and terms</a></div>
  </div>
  <p class="ft-word" data-fit aria-hidden="true"><span>disruptive</span><b>dodo.</b></p>
</footer>`;

// ===== SEO =====
function headTag(sel, make) {
  let el = document.head.querySelector(sel);
  if (!el) { el = make(); document.head.appendChild(el); }
  return el;
}
function setMeta(attr, key, value) {
  const el = headTag('meta[' + attr + '="' + key + '"]', () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  el.setAttribute('content', value);
}
function applySeo(page) {
  const url = location.origin + page.path;
  document.documentElement.lang = 'en';
  document.title = page.title;
  setMeta('name', 'description', page.description);
  setMeta('property', 'og:title', page.title);
  setMeta('property', 'og:description', page.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:site_name', 'Disruptive Dodo');
  setMeta('name', 'twitter:card', 'summary_large_image');
  if (page.robots) setMeta('name', 'robots', page.robots);
  const canon = headTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; });
  canon.href = url;
  if (page.ld && !document.getElementById('dd-jsonld')) {
    const s = document.createElement('script');
    s.id = 'dd-jsonld'; s.type = 'application/ld+json';
    s.textContent = JSON.stringify(page.ld).split('https://disruptivedodo.mu').join(location.origin);
    document.head.appendChild(s);
  }
}

const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const raf = (fn) => requestAnimationFrame(fn);

// ===== nav: hide on scroll down, mega-panel, mobile menu =====
function navBehaviour(R, wrap) {
  const nav = R.querySelector('.nav');
  const mp = R.getElementById('dd-mp');
  const svcBtn = R.querySelector('.nav-svc');
  const burger = R.querySelector('.burger');
  const mmSvc = R.querySelector('.mm-svc');
  const mmSub = R.getElementById('dd-mm-sub');
  const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let closeT = 0;

  function setMp(open) {
    clearTimeout(closeT);
    mp.classList.toggle('open', open);
    svcBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  const later = () => { clearTimeout(closeT); closeT = setTimeout(() => setMp(false), 180); };
  svcBtn.addEventListener('click', () => setMp(!mp.classList.contains('open')));
  if (fine) {
    svcBtn.addEventListener('pointerenter', () => setMp(true));
    svcBtn.addEventListener('pointerleave', later);
    mp.addEventListener('pointerenter', () => clearTimeout(closeT));
    mp.addEventListener('pointerleave', later);
    R.querySelectorAll('.nav-pill a').forEach((a) => a.addEventListener('pointerenter', () => setMp(false)));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mp.classList.contains('open')) { setMp(false); svcBtn.focus(); }
    if (wrap.classList.contains('mm-open')) { setMm(false); burger.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    if (mp.classList.contains('open') && path.indexOf(mp) < 0 && path.indexOf(svcBtn) < 0) setMp(false);
  });

  function setMm(open) {
    wrap.classList.toggle('mm-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    nav.classList.remove('hide');
  }
  burger.addEventListener('click', () => setMm(!wrap.classList.contains('mm-open')));
  mmSvc.addEventListener('click', () => {
    const open = !mmSub.classList.contains('open');
    mmSub.classList.toggle('open', open);
    mmSvc.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  const mq = window.matchMedia('(min-width: 1024px)');
  const onMq = () => { if (mq.matches) setMm(false); else setMp(false); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);

  // hide while scrolling down, come back on the way up
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    raf(() => {
      ticking = false;
      const y = scrollY, dy = y - lastY;
      if (Math.abs(dy) > 6) {
        const hide = dy > 0 && y > 240 && !mp.classList.contains('open') && !wrap.classList.contains('mm-open');
        nav.classList.toggle('hide', hide);
        if (hide) setMp(false);
        lastY = y;
      }
    });
  }, { passive: true });
}

function markCurrent(R, page) {
  const here = page.path;
  R.querySelectorAll('.nav-pill a[href], .mp-list a[href], .mm-links a[href]').forEach((a) => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
  if (here.indexOf('/work/') === 0) {
    const w = R.querySelector('.nav-pill a[href="/work"]');
    if (w) w.setAttribute('aria-current', 'page');
  }
  if (page.section === 'services' || here === '/services' || SERVICE_PATHS.indexOf(here) > -1) {
    R.querySelector('.nav-svc').classList.add('is-sec');
  }
}

// In-page links (#inside) cannot reach ids inside a shadow root on their own.
function hashLinks(R) {
  const go = (id, smooth) => {
    const el = id && R.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !RM() ? 'smooth' : 'auto', block: 'start' });
    return true;
  };
  R.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (go(id, true)) { e.preventDefault(); history.replaceState(null, '', '#' + id); }
  });
  if (location.hash) raf(() => go(decodeURIComponent(location.hash.slice(1)), false));
}

// ===== reveal engine: line blur-rise for headings, fade-up for blocks =====
// Words are wrapped in place (inner markup kept), then grouped into lines by their
// offsetTop so each line rises as one. Blurred words are never clipped.
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        if (parts.length < 2 && !n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w') && n.tagName !== 'BR' && n.tagName !== 'SVG' && n.tagName !== 'svg') {
        if (getComputedStyle(n).display === 'inline-block') n.classList.add('w');
        else if (n.classList.contains('todo')) n.classList.add('wf');
        else walk(n);
      }
    });
  };
  walk(el);
}
function indexLines(el) {
  let line = -1, top = null;
  el.querySelectorAll('.w, .wf').forEach((w) => {
    const t = Math.round(w.offsetTop);
    if (top === null || Math.abs(t - top) > 4) { line++; top = t; }
    w.style.setProperty('--i', line);
  });
}
function reveal(R) {
  const rm = RM();
  const heads = R.querySelectorAll('main h1, main .mega, main .d1, main .d2, main .h2, main .lead, .ft .d1, [data-r="l"]');
  const lines = [];
  heads.forEach((el) => {
    if (el.closest('[data-r="s"], [data-r="u"], .mp, .mm, details') || el.dataset.r === '0' || el.querySelector('[data-r]')) return;
    el.classList.add('rv'); lines.push(el);
  });
  const run = () => lines.forEach((el) => { splitWords(el); indexLines(el); });
  R.querySelectorAll('[data-r="s"]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8))));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  const start = () => {
    run();
    raf(() => {
      lines.concat([...R.querySelectorAll('[data-r="u"], [data-r="s"], [data-r="x"]')]).forEach((el) => {
        if (rm) { el.classList.add('in'); return; }
        io.observe(el);
      });
    });
  };
  // split after fonts settle, so lines are measured with the real face
  const f = document.fonts && document.fonts.ready;
  let done = false;
  const go = () => { if (!done) { done = true; start(); } };
  if (f) { f.then(go); setTimeout(go, 900); } else go();
}

// ===== stacked sheets: the sheet being covered recedes a touch =====
function sheets(R) {
  if (RM()) return;
  const list = [...R.querySelectorAll('main > .sheet, main > .hero, .ft')];
  if (list.length < 2) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (let i = 0; i < list.length - 1; i++) {
      const cur = list[i], next = list[i + 1];
      if (cur.classList.contains('hero')) continue;
      const nt = next.getBoundingClientRect().top;
      const k = Math.min(1, Math.max(0, (vh * 0.7 - nt) / (vh * 0.7)));
      if (k > 0.001) { cur.style.setProperty('--k', k.toFixed(3)); cur.classList.add('is-k'); }
      else if (cur.classList.contains('is-k')) { cur.style.removeProperty('--k'); cur.classList.remove('is-k'); }
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
}

// ===== FAQ: animated open and close =====
function faq(R) {
  R.querySelectorAll('.faq details').forEach((d) => {
    const s = d.querySelector('summary'), a = d.querySelector('.ans');
    if (!s || !a) return;
    s.addEventListener('click', (e) => {
      if (RM()) return;
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      if (!d.open) {
        d.open = true;
        const h = a.scrollHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => { delete d.dataset.busy; };
      } else {
        const h = a.scrollHeight;
        a.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.39,.575,.565,1)' }).onfinish = () => { d.open = false; delete d.dataset.busy; };
      }
    });
  });
}

// ===== giant type that fills its box exactly =====
function fit(R) {
  const els = R.querySelectorAll('[data-fit]');
  if (!els.length) return;
  const run = () => els.forEach((el) => {
    el.style.fontSize = '100px';
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const w = rg.getBoundingClientRect().width, box = el.clientWidth;
    const capVh = parseFloat(el.getAttribute('data-fit')) || 0;
    let px = w > 0 ? 100 * box / w : 100;
    if (capVh) px = Math.min(px, innerHeight * capVh / 100);
    el.style.fontSize = px.toFixed(2) + 'px';
  });
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 120); }, { passive: true });
}

// ===== Mauritius local time =====
function clocks(R) {
  const els = R.querySelectorAll('[data-clock]');
  if (!els.length || !window.Intl) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Mauritius', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { const now = new Date(); els.forEach((t) => { t.textContent = fmt.format(now); t.setAttribute('datetime', now.toISOString()); }); };
  tick(); setInterval(tick, 20000);
}

// ===== hero gradient: a GetLayers shader, tinted through its CONFIG =====
// Mounted once the hero is on screen; the shader pauses itself offscreen; reduced
// motion draws one still frame; no WebGL2 keeps the poster.
function heroGradient(R, page) {
  const g = page.gl, box = R.querySelector('.hero-bg');
  if (!g || !box || typeof g.mount !== 'function') return;
  if (g.poster) box.style.backgroundImage = 'url("' + g.poster + '")';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  box.prepend(canvas);
  let started = false;
  const start = () => {
    if (started) return; started = true;
    try {
      const api = g.mount(canvas, g.cfg || {}, { still: RM(), t: g.t || 6 });
      if (!api) { canvas.remove(); return; }
      raf(() => raf(() => box.classList.add('on')));
    } catch (err) { canvas.remove(); console.warn('[dd] gradient off', err); }
  };
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 700 }); else setTimeout(start, 60); } });
  io.observe(box);
}

const DD = (window.__DD = window.__DD || { pages: {} });
DD.ui = { AR, CHK, SERVICES, RM };

DD.mount = function () {
  const host = document.getElementById('dd-root');
  if (!host || host._ddDone) return;
  const key = host.getAttribute('data-page') || DD.current;
  const page = DD.pages[key];
  if (!page) return;
  host._ddDone = true;
  try {
    if (!document.getElementById('dd-global')) {
      const st = document.createElement('style');
      st.id = 'dd-global'; st.textContent = FONT_CSS;
      document.head.appendChild(st);
    }
    applySeo(page);
    host.removeAttribute('style');
    host.innerHTML = '';
    const R = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const html = page.html.split('{{ar}}').join(AR).split('{{ck}}').join(CHK);
    R.innerHTML = '<style>' + CSS + '\n' + (page.css || '') + '</style><div class="r">' + NAV + html + FOOTER + '</div>';
    const wrap = R.querySelector('.r');
    markCurrent(R, page);
    navBehaviour(R, wrap);
    hashLinks(R);
    faq(R);
    clocks(R);
    fit(R);
    heroGradient(R, page);
    if (typeof page.init === 'function') { try { page.init(R, DD.ui); } catch (e) { console.error('[dd] page init', e); } }
    reveal(R);
    sheets(R);
  } catch (e) { console.error('[dd] mount failed', e); }
};

(function boot() {
  if (document.getElementById('dd-root')) { DD.mount(); return; }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => DD.mount(), { once: true }); return; }
  let tries = 0;
  const iv = setInterval(() => {
    if (document.getElementById('dd-root') || tries++ > 40) { clearInterval(iv); DD.mount(); }
  }, 100);
})();
