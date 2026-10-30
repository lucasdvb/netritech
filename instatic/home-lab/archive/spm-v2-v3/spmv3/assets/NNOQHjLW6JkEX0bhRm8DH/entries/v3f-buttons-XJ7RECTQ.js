// src/scripts/v3f-buttons.js
(function() {
  if (!/^\/spmv3(\/|\.html)?$/.test(location.pathname) && window.self === window.top) return;
  var MAP = [
    // [selector, variant, shape]
    [".v3f-nav-btn-white", "dark", "pill"],
    [".v3f-nav-btn-grey", "light", "pill"],
    [".v3f-nav-icon", "teal", "round"],
    [".v3f-ti-card-cta", "dark", "pill"],
    [".v3f-ti-panel-cta", "light-ondark", "pill"],
    [".v3f-spm-lead-submit", "teal-ondark", "pill"],
    [".v3f-tm2-cta", "light", "pill"],
    [".v3f-tm2-arrow", "light", "round"],
    [".v3f-tm2-tab", "tab", "pill"],
    [".v3f-sf-tab", "tab", "pill"],
    [".v3f-ft-cta", "teal-ondark", "pill"],
    [".v3f-ft-tile", "tile", ""],
    [".v3f-ti-btn", "dark", "pill"]
    // any other section button
  ];
  var SEL = MAP.map(function(m) {
    return m[0];
  }).join(",");
  function sentence(t) {
    return /[a-zà-ÿ]/.test(t) || !/[A-ZÀ-Ý]{3}/.test(t) ? t : t.charAt(0) + t.slice(1).toLowerCase();
  }
  function fixCase(node) {
    if (node.nodeType === 3) node.nodeValue = sentence(node.nodeValue);
    else if (node.nodeType === 1) for (var c = node.firstChild; c; c = c.nextSibling) fixCase(c);
  }
  function isDeco(n) {
    return n.nodeType === 1 && (n.getAttribute("aria-hidden") === "true" || /(^|-)(ic|ar|arrow|icon)(\b|$)/.test(n.className && n.className.baseVal === void 0 ? n.className : ""));
  }
  function wrap(el) {
    if (el.querySelector(":scope > .v3f-bx-l")) return;
    var hasText = (el.textContent || "").replace(/\s+/g, "").length > 1;
    el.classList.toggle("v3f-bx-icon", !hasText);
    var span = document.createElement("span");
    span.className = "v3f-bx-l";
    var first = el.firstChild;
    if (!hasText) {
      while (el.firstChild) span.appendChild(el.firstChild);
      el.appendChild(span);
      return;
    }
    var run = [];
    for (var n = first; n && !isDeco(n); n = n.nextSibling) run.push(n);
    if (!run.length) return;
    el.insertBefore(span, run[0]);
    for (var i = 0; i < run.length; i++) {
      fixCase(run[i]);
      span.appendChild(run[i]);
    }
    var last = span.lastChild;
    if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, "");
  }
  function tag(el) {
    if (el.__v3fBx) {
      wrap(el);
      return;
    }
    for (var i = 0; i < MAP.length; i++) {
      if (el.matches(MAP[i][0])) {
        el.__v3fBx = 1;
        el.classList.add("v3f-bx", "v3f-bx--" + MAP[i][1]);
        if (MAP[i][2]) el.classList.add("v3f-bx-" + MAP[i][2]);
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
  new MutationObserver(function(muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.target.nodeType === 1 && m.target.__v3fBx) queued.push(m.target);
      for (var j = 0; j < m.addedNodes.length; j++) queued.push(m.addedNodes[j]);
    }
    if (pending) return;
    pending = true;
    requestAnimationFrame(function() {
      pending = false;
      var q = queued;
      queued = [];
      for (var k = 0; k < q.length; k++) scan(q[k]);
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
