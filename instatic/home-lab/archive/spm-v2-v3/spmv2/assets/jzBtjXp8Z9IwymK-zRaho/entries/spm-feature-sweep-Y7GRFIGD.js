// src/scripts/spm-feature-sweep.js
(function() {
  var list = document.querySelector(".ti-feature-list");
  if (!list) return;
  var feats = list.querySelectorAll(".ti-feature");
  if (!feats.length) return;
  feats.forEach(function(feat) {
    var els = feat.querySelectorAll("h4, p");
    var idx = 0;
    els.forEach(function(el) {
      if (el.querySelector(".ti-char")) return;
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
        word.className = "ti-word";
        word.setAttribute("aria-hidden", "true");
        for (var i = 0; i < tok.length; i++) {
          var ch = document.createElement("span");
          ch.className = "ti-char";
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
  var title = document.querySelector(".spm-lead .spm-lead-title");
  if (!title || title.querySelector(".ti-char")) return;
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
    word.className = "ti-word";
    word.setAttribute("aria-hidden", "true");
    for (var i = 0; i < tok.length; i++) {
      var ch = document.createElement("span");
      ch.className = "ti-char";
      ch.setAttribute("aria-hidden", "true");
      ch.style.setProperty("--v-delay", (idx * 0.013).toFixed(3) + "s");
      ch.textContent = tok[i];
      word.appendChild(ch);
      idx++;
    }
    title.appendChild(word);
  });
})();
