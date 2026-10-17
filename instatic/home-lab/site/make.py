"""Home Lab becomes the SPM homepage: patches for the Instatic code files.

Writes out/<file> (the patched copy) and patches.json (exact replacements, with the
hash each file must have before and after), like ../perf/patches/make.py.

- Page guards: the site scripts (menu, drawer, buttons, reveals, FAQ) run on the
  homepage and on the inner pages; the homepage-only scripts run on / (and /home-lab,
  the old address). Nothing runs on SPM V2 / V3.
- Links: menu, mobile drawer, footer and cards point to the real pages.
- Hero: "une" starts the third line on desktop, new mobile layout, the orb sits
  further back on portrait screens (scene file rebuilt by ../perf/build.py).
- V3 files that also served the inner pages now stand down off /spmv3; V2 / V3 get noindex.
"""
import hashlib, json, pathlib, re

HERE = pathlib.Path(__file__).parent
HL = HERE.parent
ROLL = HL / 'rollback-2026-10-07' / 'scripts'
PERF = HL / 'perf'
OUT = HERE / 'out'
OUT.mkdir(exist_ok=True)

sha = lambda t: hashlib.sha256(t.encode()).hexdigest()

# the current Instatic text of each file (hashes checked against the site listing)
SRC = {
    'hlab-buttons.js': ROLL / 'hlab-buttons.js',
    'hlab-fs.js': ROLL / 'hlab-fs.js',
    'hlab-hero-nav.js': ROLL / 'hlab-hero-nav.js',
    'hlab-review.js': ROLL / 'hlab-review.js',
    'hlab-sections.js': ROLL / 'hlab-sections.js',
    'hlab-spm-a11y.js': ROLL / 'hlab-spm-a11y.js',
    'hlab-spm-faq.js': ROLL / 'hlab-spm-faq.js',
    'hlab-spm-footer-fx.js': ROLL / 'hlab-spm-footer-fx.js',
    'hlab-spm-scroll.js': ROLL / 'hlab-spm-scroll.js',
    'hlab-tm2.js': ROLL / 'hlab-tm2.js',
    'hlab-spm-chrome.js': PERF / 'patches' / 'patched-hlab-spm-chrome.js',
    'hlab-spm-feature-sweep.js': PERF / 'patches' / 'patched-hlab-spm-feature-sweep.js',
    'hlab-spm-lazy-video.js': PERF / 'patches' / 'patched-hlab-spm-lazy-video.js',
    'hlab-spm-seo.js': PERF / 'patches' / 'patched-hlab-spm-seo.js',
    'hlab-spm-teams.js': PERF / 'patches' / 'patched-hlab-spm-teams.js',
}
EXPECT = {   # Instatic hashes before this change (site_list_code_assets, 2026-10-17)
    'hlab-buttons.js': '087a8873', 'hlab-fs.js': 'e2a451a6', 'hlab-hero-nav.js': '7a7ad934',
    'hlab-review.js': '1fe65708', 'hlab-sections.js': 'a806f4af', 'hlab-spm-a11y.js': 'be085eb2',
    'hlab-spm-faq.js': 'e2c380e6', 'hlab-spm-footer-fx.js': 'bd29bbc2', 'hlab-spm-scroll.js': '05366312',
    'hlab-tm2.js': '37bb795a', 'hlab-spm-chrome.js': '2a1d313c', 'hlab-spm-feature-sweep.js': '058b5d3d',
    'hlab-spm-lazy-video.js': 'e4b9ebbf', 'hlab-spm-seo.js': 'c29ee11f', 'hlab-spm-teams.js': '150276a2',
}

OLD_GUARD = "!/\\/home-lab(\\/|\\.html)?$/.test(location.pathname)"
HOME_GUARD = "!/^\\/(index\\.html)?$|^\\/home-lab(\\/|\\.html)?$/.test(location.pathname)"   # homepage only
SITE_GUARD = "/^\\/spmv[23](\\/|\\.html)?$/.test(location.pathname)"                       # any page but V2 / V3
OLD_NOTE = "/* hlab: Home Lab page only, inert on every other page */"
HOME_NOTE = "/* hlab: SPM homepage only, inert on every other page */"
SITE_NOTE = "/* hlab: the SPM site (homepage + inner pages), inert on SPM V2 / V3 */"
SITE_FILES = {'hlab-buttons.js', 'hlab-hero-nav.js', 'hlab-sections.js', 'hlab-spm-faq.js', 'hlab-spm-chrome.js'}

CONTACT = '/contact'
TEL = 'tel:+33481659845'
PAGES = [('Solutions', '/solutions'), ('Pourquoi SPM', '/pourquoi-spm'), ('Clients & Partenaires', '/clients-partenaires'),
         ('Secteurs', '/secteurs'), ('Actualités', '/actualites'), ('Carrières', '/carrieres')]

R = {}   # file -> list of (old, new)

def add(f, old, new):
    R.setdefault(f, []).append((old, new))

for f in SRC:
    t = SRC[f].read_text()
    if OLD_GUARD in t:
        add(f, OLD_GUARD, SITE_GUARD if f in SITE_FILES else HOME_GUARD)
    if OLD_NOTE in t:
        add(f, OLD_NOTE, SITE_NOTE if f in SITE_FILES else HOME_NOTE)

# ---------- hlab-spm-chrome.js: menu, CTAs and footer links ----------
add('hlab-spm-chrome.js',
    '    { label: "Solutions", href: "#", active: true },\n'
    '    { label: "Pourquoi SPM", href: "#" },\n'
    '    { label: "Clients & Partenaires", href: "#" },\n'
    '    { label: "Secteurs", href: "#" },\n'
    '    { label: "Actualités", href: "#" }\n',
    '    { label: "Solutions", href: "/solutions" },\n'
    '    { label: "Pourquoi SPM", href: "/pourquoi-spm" },\n'
    '    { label: "Clients & Partenaires", href: "/clients-partenaires" },\n'
    '    { label: "Secteurs", href: "/secteurs" },\n'
    '    { label: "Actualités", href: "/actualites" }\n')
add('hlab-spm-chrome.js',
    '    \'<a class="hlab-nav-icon" aria-label="Nous appeler" href="#contact" target="_self">\' +',
    '    \'<a class="hlab-nav-icon" aria-label="Nous appeler" href="' + TEL + '" target="_self">\' +')
add('hlab-spm-chrome.js',
    '    \'<a class="hlab-nav-btn hlab-nav-btn-white" href="#contact" target="_self">Prendre rendez-vous</a>\' +\n'
    '    \'<a class="hlab-nav-btn hlab-nav-btn-grey" href="#contact" target="_self">Nous contacter</a>\';',
    '    \'<a class="hlab-nav-btn hlab-nav-btn-white" href="' + CONTACT + '" target="_self">Prendre rendez-vous</a>\' +\n'
    '    \'<a class="hlab-nav-btn hlab-nav-btn-grey" href="' + CONTACT + '" target="_self">Nous contacter</a>\';')
add('hlab-spm-chrome.js',
    "      '<li><a href=\"#contact\">Nous contacter</a></li>';",
    "      '<li><a href=\"" + CONTACT + "\">Nous contacter</a></li>';")
add('hlab-spm-chrome.js',
    '  var TILES = ["Accueil", "Solutions", "Pourquoi SPM", "Clients & Partenaires",\n'
    '    "Secteurs & études de cas", "Actualités", "Carrières", "Contact"];',
    '  var TILES = [["Accueil", "/"], ["Solutions", "/solutions"], ["Pourquoi SPM", "/pourquoi-spm"],\n'
    '    ["Clients & Partenaires", "/clients-partenaires"], ["Secteurs & études de cas", "/secteurs"],\n'
    '    ["Actualités", "/actualites"], ["Carrières", "/carrieres"], ["Contact", "/contact"]];')
add('hlab-spm-chrome.js',
    '      return \'<a class="hlab-ft-tile" href="#">\' + esc(t) + \'<span class="hlab-ft-ar" aria-hidden="true">→</span></a>\';',
    '      return \'<a class="hlab-ft-tile" href="\' + t[1] + \'">\' + esc(t[0]) + \'<span class="hlab-ft-ar" aria-hidden="true">→</span></a>\';')
add('hlab-spm-chrome.js',
    '            \'<a class="hlab-ft-cta" href="#"><span>PRENDRE RENDEZ-VOUS</span>\' +',
    '            \'<a class="hlab-ft-cta" href="' + CONTACT + '"><span>PRENDRE RENDEZ-VOUS</span>\' +')
add('hlab-spm-chrome.js',
    '\'<a class="hlab-ft-logo" href="#hlab-top" aria-label="SPM">',
    '\'<a class="hlab-ft-logo" href="/" aria-label="SPM, accueil">')
add('hlab-spm-chrome.js',
    '   Runs on SPM V3 and on the inner pages (shared shell). */',
    '   Runs on the homepage and on the inner pages (shared shell, hlab-0-shell.js). */')

# ---------- hlab-hero-nav.js: the mobile drawer ----------
add('hlab-hero-nav.js', "    { label: 'Solutions', href: '#', sub: [", "    { label: 'Solutions', href: '/solutions', sub: [")
for label, href in PAGES[1:]:
    add('hlab-hero-nav.js', "    { label: '%s', href: '#' }" % label, "    { label: '%s', href: '%s' }" % (label, href))
add('hlab-hero-nav.js',
    "    sol.sub.map(function (s) { return '<li><a class=\"hlab-dw-it\" href=\"#\"><span>' + esc(s) + '</span></a></li>'; }).join('');",
    "    sol.sub.map(function (s, k) { return '<li><a class=\"hlab-dw-it\" href=\"/solutions#s' + (k + 1) + '\"><span>' + esc(s) + '</span></a></li>'; }).join('');   // the Solutions page sections, in order")
add('hlab-hero-nav.js', "href=\"#contact\">Prendre rendez-vous</a>' +", "href=\"" + CONTACT + "\">Prendre rendez-vous</a>' +")
add('hlab-hero-nav.js', "href=\"#contact\">Nous contacter</a>' +", "href=\"" + CONTACT + "\">Nous contacter</a>' +")
add('hlab-hero-nav.js', 'href="/spmv3" aria-label="SPM, accueil"', 'href="/" aria-label="SPM, accueil"')

# ---------- hlab-spm-teams.js: each card's "En savoir plus" opens its team on the Solutions page ----------
add('hlab-spm-teams.js',
    "  Array.prototype.slice.call(root.querySelectorAll('.hlab-tm2-card-inner')).forEach(function (inner) {\n"
    "    if (inner.querySelector('.hlab-tm2-cta')) return;\n"
    "    var a = document.createElement('a');\n"
    "    a.className = 'hlab-tm2-cta';\n"
    "    a.href = '#';\n"
    "    a.innerHTML = 'En savoir plus <span aria-hidden=\"true\">→</span>';\n"
    "    a.addEventListener('click', function (e) {\n"
    "      e.preventDefault();\n"
    "      var t = document.querySelector('.hlab-spm-lead');\n"
    "      if (t) t.scrollIntoView({ behavior: 'smooth' });\n"
    "    });\n"
    "    inner.appendChild(a);\n",
    "  // tabs in order: relation client, back-office, commercial, recrutement -> their section on /solutions\n"
    "  var TEAM_HREF = ['/solutions#s1', '/solutions#s4', '/solutions#s2', '/solutions#s6'];\n"
    "  Array.prototype.slice.call(root.querySelectorAll('.hlab-tm2-card-inner')).forEach(function (inner) {\n"
    "    if (inner.querySelector('.hlab-tm2-cta')) return;\n"
    "    var a = document.createElement('a');\n"
    "    a.className = 'hlab-tm2-cta';\n"
    "    a.href = TEAM_HREF[panels.indexOf(inner.closest('.hlab-tm2-panel'))] || '/solutions';\n"
    "    a.innerHTML = 'En savoir plus <span aria-hidden=\"true\">→</span>';\n"
    "    inner.appendChild(a);\n")

# ---------- apply ----------
patches = {}
for f, reps in R.items():
    t0 = SRC[f].read_text()
    assert sha(t0).startswith(EXPECT[f]), (f, sha(t0)[:8])
    t = t0
    for old, new in reps:
        assert t.count(old) == 1, (f, old[:80], t.count(old))
        t = t.replace(old, new)
    (OUT / f).write_text(t)
    patches[f] = {'from': sha(t0), 'to': sha(t), 'replacements': [{'oldText': o, 'newText': n} for o, n in reps]}

# hero page script + scene: rebuilt by ../perf/build.py; patched in place on Instatic
import difflib
def line_patch(name, old_text, new_text):
    a, b = old_text.split('\n'), new_text.split('\n')
    reps = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == 'equal':
            continue
        # widen to whole lines, with one line of context so oldText is unique
        lo, hi = max(0, i1 - 1), min(len(a), i2 + 1)
        jlo, jhi = j1 - (i1 - lo), j2 + (hi - i2)
        reps.append(('\n'.join(a[lo:hi]), '\n'.join(b[jlo:jhi])))
    t = old_text
    for o, n in reps:
        assert t.count(o) == 1, (name, o[:80])
        t = t.replace(o, n)
    assert t == new_text, name
    patches[name] = {'from': sha(old_text), 'to': sha(new_text), 'replacements': [{'oldText': o, 'newText': n} for o, n in reps]}

line_patch('hlab-hero-vesper.js', (HERE / 'base' / 'hlab-hero-vesper.js').read_text(), (PERF / 'hlab-hero-vesper.js').read_text())
line_patch('hlab-webgl-scene.js', (HERE / 'base' / 'hlab-webgl-scene.js').read_text(), (PERF / 'hlab-webgl-scene.js').read_text())
line_patch('hlab-x8-hero-vesper.css', (HERE / 'base' / 'hlab-x8-hero-vesper.css').read_text(), (HERE / 'src' / 'hlab-x8-hero-vesper.css').read_text())

(HERE / 'patches.json').write_text(json.dumps(patches, ensure_ascii=False, indent=1))
for f, p in patches.items():
    print(f.ljust(28), p['from'][:8], '->', p['to'][:8], len(p['replacements']), 'replacements')
