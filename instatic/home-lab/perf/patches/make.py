"""Small patches for the Home Lab perf / agentic / SEO pass. Each entry: Instatic file, the
source it applies to (sha256 prefix), and exact [oldText, newText] replacements.
Run: python3 -I patches/make.py  -> writes patches/*.json and patched copies for the mirror."""
import hashlib, json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent.parent / 'rollback-2026-10-07'
SEO_SRC = HERE.parent.parent / 'hero-copy' / 'hlab-spm-seo.js'

P = {}
P['hlab-spm-chrome.js'] = ('scripts/hlab-spm-chrome.js', [
  ('    mountFooterFX(footer.querySelector(".hlab-ft"));',
   '    // the footer background is set up as the footer nears the viewport (no layout read at load)\n'
   '    var ftRoot = footer.querySelector(".hlab-ft");\n'
   '    if (ftRoot && "IntersectionObserver" in window) {\n'
   '      var ftIO = new IntersectionObserver(function (es) {\n'
   '        if (es.some(function (e) { return e.isIntersecting; })) { ftIO.disconnect(); mountFooterFX(ftRoot); }\n'
   '      }, { rootMargin: "1500px 0px" });\n'
   '      ftIO.observe(ftRoot);\n'
   '    } else mountFooterFX(ftRoot);'),
  ('    draw();\n    window.addEventListener("resize", draw, { passive: true });',
   '    requestAnimationFrame(draw);   // first draw on the next frame: no layout read during load\n    window.addEventListener("resize", draw, { passive: true });'),
])
P['hlab-spm-logos.js'] = ('scripts/hlab-spm-logos.js', [
  ('    g.el.innerHTML = html;\n    measure(g);',
   '    g.el.innerHTML = html;\n'
   '    // first build: the ResizeObserver below measures after the browser\'s own layout\n'
   '    if (g.built || !(\'ResizeObserver\' in window)) measure(g);\n'
   '    g.built = true;'),
])
P['hlab-spm-lazy-video.js'] = ('scripts/hlab-spm-lazy-video.js', [
  ('  vids.forEach(function (v) { io.observe(v); });\n})();\n',
   '  vids.forEach(function (v) { io.observe(v); });\n})();\n'
   '\n'
   '/* Section photos (CSS backgrounds) wait until their section is ~1.5 screens away, so the\n'
   '   first screen loads without them; the CSS keeps them off until .hlab-bg-in is added. */\n'
   '(function () {\n'
   '  var secs = Array.prototype.slice.call(document.querySelectorAll(\'[data-tm2], .hlab-ti-cards3, .hlab-spm-review\'));\n'
   '  if (!secs.length) return;\n'
   '  function show(s) { s.classList.add(\'hlab-bg-in\'); }\n'
   '  if (!(\'IntersectionObserver\' in window)) { secs.forEach(show); return; }\n'
   '  var lead = Math.max(1000, Math.round((window.innerHeight || 800) * 1.5));\n'
   '  var io = new IntersectionObserver(function (entries) {\n'
   '    entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });\n'
   '  }, { rootMargin: lead + \'px 0px\' });\n'
   '  secs.forEach(function (s) { io.observe(s); });\n'
   '})();\n'),
])
P['hlab-spm-teams.js'] = ('scripts/hlab-spm-teams.js', [
  ('  var current = 0;\n',
   '  // Accessible cards: a card holds a heading and a link, so it is not a button itself;\n'
   '  // its title is (same look, the whole card stays clickable).\n'
   '  Array.prototype.slice.call(root.querySelectorAll(\'.hlab-tm2-card\')).forEach(function (c) {\n'
   '    c.removeAttribute(\'role\'); c.removeAttribute(\'tabindex\'); c.removeAttribute(\'aria-expanded\');\n'
   '    var t = c.querySelector(\'.hlab-tm2-title\');\n'
   '    if (t && !t.querySelector(\'.hlab-tm2-toggle\')) {\n'
   '      var b = document.createElement(\'button\');\n'
   '      b.type = \'button\'; b.className = \'hlab-tm2-toggle\';\n'
   '      while (t.firstChild) b.appendChild(t.firstChild);\n'
   '      t.appendChild(b);\n'
   '    }\n'
   '  });\n'
   '\n'
   '  var current = 0;\n'),
  ("      c.setAttribute('aria-expanded', String(on));",
   "      var tg = c.querySelector('.hlab-tm2-toggle');\n      if (tg) tg.setAttribute('aria-expanded', String(on));"),
  ("      c.addEventListener('keydown', function (e) {\n        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(panel, idx, true); }",
   "      c.addEventListener('keydown', function (e) {\n        if (e.target.closest && e.target.closest('a')) return;   // the card's link keeps its own Enter\n        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(panel, idx, true); }"),
])
P['hlab-spm-feature-sweep.js'] = ('scripts/hlab-spm-feature-sweep.js', [
  ("      var text = el.textContent;\n      el.setAttribute('aria-label', text);\n      while (el.firstChild) el.removeChild(el.firstChild);\n",
   "      var text = el.textContent;\n"
   "      // a heading may carry a label; a paragraph may not, so it keeps a visually hidden copy\n"
   "      if (el.tagName !== 'P') el.setAttribute('aria-label', text);\n"
   "      if (el.tagName === 'H4') el.setAttribute('aria-level', '3');   // outline: h2 > these feature titles\n"
   "      while (el.firstChild) el.removeChild(el.firstChild);\n"
   "      if (el.tagName === 'P') {\n"
   "        var sr = document.createElement('span');\n"
   "        sr.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';\n"
   "        sr.textContent = text;\n"
   "        el.style.position = 'relative';   // keeps the hidden copy inside its paragraph\n"
   "        el.appendChild(sr);\n"
   "      }\n"),
])
P['hlab-x5-tm2.css'] = ('styles/hlab-x5-tm2.css', None)   # appended below
APPEND_CSS = (
  "\n/* Accessible card toggle (hlab-spm-teams.js wraps each title in a real button): same look */\n"
  ".hlab-tm2 .hlab-tm2-toggle { all: unset; cursor: pointer; }\n"
  ".hlab-tm2 .hlab-tm2-toggle:focus-visible { outline: 2px solid rgba(34,128,138,.6); outline-offset: 3px; border-radius: 4px; }\n"
  "\n/* Header logo: its width is reserved before the image arrives (no layout shift) */\n"
  ".hlab-nav-logo img { aspect-ratio: 640 / 256; }\n"
  "\n/* Performance: section photos load as their section nears the viewport\n"
  "   (hlab-spm-lazy-video.js adds .hlab-bg-in about 1.5 screens ahead, so they are there before you are) */\n"
  "[data-tm2]:not(.hlab-bg-in) .hlab-tm2-card[data-tone],\n"
  "[data-tm2]:not(.hlab-bg-in) .hlab-tm2-card[data-tone]::before,\n"
  ".hlab-ti-cards3:not(.hlab-bg-in) .hlab-ti-card-media,\n"
  ".hlab-spm-review:not(.hlab-bg-in) .hlab-spm-review-bg { background-image: none !important; }\n")
P['hlab-spm-seo.js'] = (None, [
  ("    // Home Lab is an experimental page: keep it out of search results until it is promoted.\n    meta('name', 'robots', 'noindex, nofollow');\n",
   "    function link(rel, href, sizes) {\n"
   "      if (document.querySelector('link[rel=\"' + rel + '\"]')) return;\n"
   "      var l = document.createElement('link'); l.rel = rel; l.href = href; if (sizes) l.setAttribute('sizes', sizes); head.appendChild(l);\n"
   "    }\n"
   "    link('icon', '/uploads/pA0UhXiw9EQPZ6zHnsBay-spm-favicon-192.png', '192x192');\n"
   "    link('apple-touch-icon', '/uploads/FiB325gE1ympAW4T8D4tn-spm-apple-touch-icon-180.png', '180x180');\n"),
])

out = {}
for name, (rel, reps) in P.items():
    src = (SRC / rel).read_text() if rel else SEO_SRC.read_text()
    h0 = hashlib.sha256(src.encode()).hexdigest()
    if reps is None:
        new = src.rstrip('\n') + '\n' + APPEND_CSS; reps = [(src[-120:], (src.rstrip('\n') + '\n' + APPEND_CSS)[-(120 + len(APPEND_CSS) + (len(src.rstrip(chr(10))) + 1 - len(src))):])]
        reps = [(src[-120:], new[len(src) - 120:])]
    else:
        new = src
        for o, n in reps:
            assert new.count(o) == 1, (name, o[:60], new.count(o)); new = new.replace(o, n)
    chk = src
    for o, n in reps: assert chk.count(o) == 1, (name, 'verify'); chk = chk.replace(o, n)
    assert chk == new
    (HERE / ('patched-' + name)).write_text(new)
    out[name] = {'from': h0, 'to': hashlib.sha256(new.encode()).hexdigest(), 'replacements': [{'oldText': o, 'newText': n} for o, n in reps]}
    print(f"{name:28s} {h0[:12]} -> {out[name]['to'][:12]}  ({len(reps)} replacements)")
(HERE / 'patches.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
