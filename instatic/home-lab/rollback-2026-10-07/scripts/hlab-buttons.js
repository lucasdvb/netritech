/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
/* SPM V3 — button system: tags every CTA / tab / nav button with an Apple-style
   variant and wraps its label so the Terminal-Industries hover (slide-up panel
   + drawn underline, styled in src/styles/hlab-buttons.css) can run.
   Menu, footer, tabs and forms are rebuilt by other scripts after load, so a
   MutationObserver tags anything that appears later. */
(function () {
  var MAP = [
    // [selector, variant, shape]
    ['.hlab-nav-btn-white', 'dark', 'pill'],
    ['.hlab-nav-btn-grey', 'light', 'pill'],
    ['.hlab-nav-icon', 'teal', 'round'],
    ['.hlab-ti-card-cta', 'dark', 'pill'],
    ['.hlab-ti-panel-cta', 'light-ondark', 'pill'],
    ['.hlab-spm-lead-submit', 'teal-ondark', 'pill'],
    ['.hlab-tm2-cta', 'light', 'pill'],
    ['.hlab-tm2-arrow', 'light', 'round'],
    ['.hlab-tm2-tab', 'tab', 'pill'],
    ['.hlab-sf-tab', 'tab', 'pill'],
    ['.hlab-ft-cta', 'teal-ondark', 'pill'],
    ['.hlab-ft-tile', 'tile', ''],
    ['.hlab-ti-btn', 'dark', 'pill']            // any other section button
  ];
  var SEL = MAP.map(function (m) { return m[0]; }).join(',');

  // "PRENDRE RENDEZ-VOUS" → "Prendre rendez-vous" (Apple-style sentence case)
  function sentence(t) {
    return /[a-zà-ÿ]/.test(t) || !/[A-ZÀ-Ý]{3}/.test(t) ? t : t.charAt(0) + t.slice(1).toLowerCase();
  }
  function fixCase(node) {
    if (node.nodeType === 3) node.nodeValue = sentence(node.nodeValue);
    else if (node.nodeType === 1) for (var c = node.firstChild; c; c = c.nextSibling) fixCase(c);
  }
  // Decorations (arrows, icons) stay outside the label so they keep their own
  // layout (e.g. right-aligned arrows) and are not underlined.
  function isDeco(n) {
    return n.nodeType === 1 && (n.getAttribute('aria-hidden') === 'true' || /(^|-)(ic|ar|arrow|icon)(\b|$)/.test(n.className && n.className.baseVal === undefined ? n.className : ''));
  }
  function wrap(el) {
    if (el.querySelector(':scope > .hlab-bx-l')) return;
    var hasText = (el.textContent || '').replace(/\s+/g, '').length > 1;
    el.classList.toggle('hlab-bx-icon', !hasText);
    var span = document.createElement('span');
    span.className = 'hlab-bx-l';
    var first = el.firstChild;
    if (!hasText) {                                   // icon-only: wrap everything
      while (el.firstChild) span.appendChild(el.firstChild);
      el.appendChild(span);
      return;
    }
    // wrap the leading run of label content, stop at the first decoration
    var run = [];
    for (var n = first; n && !isDeco(n); n = n.nextSibling) run.push(n);
    if (!run.length) return;
    el.insertBefore(span, run[0]);
    for (var i = 0; i < run.length; i++) { fixCase(run[i]); span.appendChild(run[i]); }
    // trim trailing whitespace inside the label so the underline hugs the text
    var last = span.lastChild;
    if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
  }

  function tag(el) {
    if (el.__hlabBx) { wrap(el); return; }
    for (var i = 0; i < MAP.length; i++) {
      if (el.matches(MAP[i][0])) {
        el.__hlabBx = 1;
        el.classList.add('hlab-bx', 'hlab-bx--' + MAP[i][1]);
        if (MAP[i][2]) el.classList.add('hlab-bx-' + MAP[i][2]);
        wrap(el);
        return;
      }
    }
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches(SEL)) tag(root);
    var list = root.querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) tag(list[i]);
  }

  scan(document.body);
  var queued = [], pending = false;
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      // a script replaced a tagged button's label (e.g. textContent) → re-wrap it
      if (m.target.nodeType === 1 && m.target.__hlabBx) queued.push(m.target);
      for (var j = 0; j < m.addedNodes.length; j++) queued.push(m.addedNodes[j]);
    }
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var q = queued; queued = [];
      for (var k = 0; k < q.length; k++) scan(q[k]);
    });
  }).observe(document.body, { childList: true, subtree: true });
})();

})();
