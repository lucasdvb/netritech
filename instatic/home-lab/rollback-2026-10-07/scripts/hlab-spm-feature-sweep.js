/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
(function () {
  var list = document.querySelector('.hlab-ti-feature-list');
  if (!list) return;
  var feats = list.querySelectorAll('.hlab-ti-feature');
  if (!feats.length) return;

  // ---- Split each heading + paragraph into per-character spans ----
  feats.forEach(function (feat) {
    var els = feat.querySelectorAll('h4, p');
    var idx = 0; // continuous index across the whole feature so one wave flows through it
    els.forEach(function (el) {
      if (el.querySelector('.hlab-ti-char')) return; // already split
      var text = el.textContent;
      el.setAttribute('aria-label', text);
      while (el.firstChild) el.removeChild(el.firstChild);
      text.split(/(\s+)/).forEach(function (tok) {
        if (tok === '') return;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); idx += tok.length; return; }
        var word = document.createElement('span');
        word.className = 'hlab-ti-word';
        word.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < tok.length; i++) {
          var ch = document.createElement('span');
          ch.className = 'hlab-ti-char';
          ch.setAttribute('aria-hidden', 'true');
          ch.style.setProperty('--v-delay', (idx * 0.013).toFixed(3) + 's');
          ch.textContent = tok[i];
          word.appendChild(ch);
          idx++;
        }
        el.appendChild(word);
      });
    });
  });

  // Reveal is driven by the section's own active-feature logic in sections.js, which adds
  // .ti-active to the single feature nearest the viewport centre. So exactly ONE feature
  // reveals (bright + teal sweep) at a time while the others stay faded. No extra observer.
})();

// ---- Lead-gen title: same per-character teal sweep as .ti-feature ----
// Split .spm-lead-title into .ti-word/.ti-char spans with a staggered --v-delay.
// The reveal itself is driven by sections.js adding .ti-in to this .ti-reveal
// heading when it scrolls into view, so no extra observer is needed here.
(function () {
  var title = document.querySelector('.hlab-spm-lead .hlab-spm-lead-title');
  if (!title || title.querySelector('.hlab-ti-char')) return;
  var text = title.textContent;
  title.setAttribute('aria-label', text);
  while (title.firstChild) title.removeChild(title.firstChild);
  var idx = 0; // continuous index so one wave flows through the whole title
  text.split(/(\s+)/).forEach(function (tok) {
    if (tok === '') return;
    if (/^\s+$/.test(tok)) { title.appendChild(document.createTextNode(tok)); idx += tok.length; return; }
    var word = document.createElement('span');
    word.className = 'hlab-ti-word';
    word.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < tok.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'hlab-ti-char';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.setProperty('--v-delay', (idx * 0.013).toFixed(3) + 's');
      ch.textContent = tok[i];
      word.appendChild(ch);
      idx++;
    }
    title.appendChild(word);
  });
})();

// ---- Modular section H2: sweep ONLY the first line "Une équipe SPM pensée" ----
// Same per-character teal sweep as the lead title, but applied to just line 1 of
// the "Une équipe SPM pensée pour chaque métier." heading. Line 2 stays static.
// Reveal is driven by sections.js adding .hlab-ti-in to this .hlab-ti-reveal h2.
(function () {
  var h2s = document.querySelectorAll('.hlab-ti-modular .hlab-ti-h2.hlab-ti-reveal');
  var h2 = null;
  for (var n = 0; n < h2s.length; n++) {
    if (/Une\s+.quipe\s+SPM\s+pens.e/i.test(h2s[n].textContent)) { h2 = h2s[n]; break; }
  }
  if (!h2 || h2.querySelector('.hlab-ti-char')) return;
  var full = h2.textContent.replace(/\s+/g, ' ').trim();
  var SPLIT = 'Une équipe SPM pensée';
  var line1 = full.slice(0, SPLIT.length);
  var line2 = full.slice(SPLIT.length).trim(); // "pour chaque métier."
  h2.setAttribute('aria-label', full);
  while (h2.firstChild) h2.removeChild(h2.firstChild);
  h2.classList.add('hlab-ti-h2sweep');

  // line 1 — per-character word/char spans with staggered --v-delay (the sweep)
  var l1 = document.createElement('span');
  l1.className = 'hlab-h2-l1';
  l1.setAttribute('aria-hidden', 'true');
  var idx = 0; // continuous index so one wave flows across the whole line
  line1.split(/(\s+)/).forEach(function (tok) {
    if (tok === '') return;
    if (/^\s+$/.test(tok)) { l1.appendChild(document.createTextNode(tok)); idx += tok.length; return; }
    var word = document.createElement('span');
    word.className = 'hlab-ti-word';
    word.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < tok.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'hlab-ti-char';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.setProperty('--v-delay', (idx * 0.013).toFixed(3) + 's');
      ch.textContent = tok[i];
      word.appendChild(ch);
      idx++;
    }
    l1.appendChild(word);
  });
  h2.appendChild(l1);

  // line 2 — static, no sweep
  if (line2) {
    var l2 = document.createElement('span');
    l2.className = 'hlab-h2-l2';
    l2.setAttribute('aria-hidden', 'true');
    l2.textContent = line2;
    h2.appendChild(l2);
  }
})();

})();
