// src/scripts/v3f-spm-feature-sweep.js
(function() {
  var list = document.querySelector(".v3f-ti-feature-list");
  if (!list) return;
  var feats = list.querySelectorAll(".v3f-ti-feature");
  if (!feats.length) return;
  feats.forEach(function(feat) {
    var els = feat.querySelectorAll("h4, p");
    var idx = 0;
    els.forEach(function(el) {
      if (el.querySelector(".v3f-ti-char")) return;
      var text = el.textContent;
      el.setAttribute("aria-label", text);
      while (el.firstChild) el.removeChild(el.firstChild);
      text.split(/(\s+)/).forEach(function(tok) {
        if (tok === "") return;
        if (/^\s+$/.test(tok)) {
          el.appendChild(document.createTextNode(tok));
          idx += tok.length;
          return;
        }
        var word = document.createElement("span");
        word.className = "v3f-ti-word";
        word.setAttribute("aria-hidden", "true");
        for (var i = 0; i < tok.length; i++) {
          var ch = document.createElement("span");
          ch.className = "v3f-ti-char";
          ch.setAttribute("aria-hidden", "true");
          ch.style.setProperty("--v-delay", (idx * 0.013).toFixed(3) + "s");
          ch.textContent = tok[i];
          word.appendChild(ch);
          idx++;
        }
        el.appendChild(word);
      });
    });
  });
})();
(function() {
  var title = document.querySelector(".v3f-spm-lead .v3f-spm-lead-title");
  if (!title || title.querySelector(".v3f-ti-char")) return;
  var text = title.textContent;
  title.setAttribute("aria-label", text);
  while (title.firstChild) title.removeChild(title.firstChild);
  var idx = 0;
  text.split(/(\s+)/).forEach(function(tok) {
    if (tok === "") return;
    if (/^\s+$/.test(tok)) {
      title.appendChild(document.createTextNode(tok));
      idx += tok.length;
      return;
    }
    var word = document.createElement("span");
    word.className = "v3f-ti-word";
    word.setAttribute("aria-hidden", "true");
    for (var i = 0; i < tok.length; i++) {
      var ch = document.createElement("span");
      ch.className = "v3f-ti-char";
      ch.setAttribute("aria-hidden", "true");
      ch.style.setProperty("--v-delay", (idx * 0.013).toFixed(3) + "s");
      ch.textContent = tok[i];
      word.appendChild(ch);
      idx++;
    }
    title.appendChild(word);
  });
})();
(function() {
  var h2s = document.querySelectorAll(".v3f-ti-modular .v3f-ti-h2.v3f-ti-reveal");
  var h2 = null;
  for (var n = 0; n < h2s.length; n++) {
    if (/Une\s+.quipe\s+SPM\s+pens.e/i.test(h2s[n].textContent)) {
      h2 = h2s[n];
      break;
    }
  }
  if (!h2 || h2.querySelector(".v3f-ti-char")) return;
  var full = h2.textContent.replace(/\s+/g, " ").trim();
  var SPLIT = "Une \xE9quipe SPM pens\xE9e";
  var line1 = full.slice(0, SPLIT.length);
  var line2 = full.slice(SPLIT.length).trim();
  h2.setAttribute("aria-label", full);
  while (h2.firstChild) h2.removeChild(h2.firstChild);
  h2.classList.add("v3f-ti-h2sweep");
  var l1 = document.createElement("span");
  l1.className = "v3f-h2-l1";
  l1.setAttribute("aria-hidden", "true");
  var idx = 0;
  line1.split(/(\s+)/).forEach(function(tok) {
    if (tok === "") return;
    if (/^\s+$/.test(tok)) {
      l1.appendChild(document.createTextNode(tok));
      idx += tok.length;
      return;
    }
    var word = document.createElement("span");
    word.className = "v3f-ti-word";
    word.setAttribute("aria-hidden", "true");
    for (var i = 0; i < tok.length; i++) {
      var ch = document.createElement("span");
      ch.className = "v3f-ti-char";
      ch.setAttribute("aria-hidden", "true");
      ch.style.setProperty("--v-delay", (idx * 0.013).toFixed(3) + "s");
      ch.textContent = tok[i];
      word.appendChild(ch);
      idx++;
    }
    l1.appendChild(word);
  });
  h2.appendChild(l1);
  if (line2) {
    var l2 = document.createElement("span");
    l2.className = "v3f-h2-l2";
    l2.setAttribute("aria-hidden", "true");
    l2.textContent = line2;
    h2.appendChild(l2);
  }
})();
