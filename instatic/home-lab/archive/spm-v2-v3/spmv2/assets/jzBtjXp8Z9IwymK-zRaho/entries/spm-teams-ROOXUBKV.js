// src/scripts/spm-teams.js
(function() {
  var root = document.querySelector("[data-tm2]");
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll(".tm2-tab"));
  var panels = Array.prototype.slice.call(root.querySelectorAll(".tm2-panel"));
  var arrows = Array.prototype.slice.call(root.querySelectorAll(".tm2-arrow"));
  if (!panels.length) return;
  Array.prototype.slice.call(root.querySelectorAll(".tm2-card-inner")).forEach(function(inner) {
    if (inner.querySelector(".tm2-cta")) return;
    var a = document.createElement("a");
    a.className = "tm2-cta";
    a.href = "#";
    a.innerHTML = 'En savoir plus <span aria-hidden="true">\u2192</span>';
    a.addEventListener("click", function(e) {
      e.preventDefault();
      var t = document.querySelector(".spm-lead");
      if (t) t.scrollIntoView({ behavior: "smooth" });
    });
    inner.appendChild(a);
  });
  var current = 0;
  function cardsOf(p) {
    return Array.prototype.slice.call(p.querySelectorAll(".tm2-card"));
  }
  function openCard(panel, i, scroll) {
    var cards = cardsOf(panel);
    cards.forEach(function(c, idx) {
      var on = idx === i;
      c.classList.toggle("is-open", on);
      c.setAttribute("aria-expanded", String(on));
    });
    panel._open = i;
    if (scroll) {
      var cont = panel.querySelector(".tm2-cards");
      if (cont && cards[i]) cont.scrollTo({ left: Math.max(0, cards[i].offsetLeft - 8), behavior: "smooth" });
    }
  }
  function showTab(t) {
    current = t;
    tabs.forEach(function(tb, idx) {
      tb.classList.toggle("is-on", idx === t);
      tb.setAttribute("aria-selected", String(idx === t));
    });
    panels.forEach(function(p, idx) {
      p.classList.toggle("is-on", idx === t);
    });
    var cont = panels[t].querySelector(".tm2-cards");
    if (cont) cont.scrollLeft = 0;
    openCard(panels[t], 0, false);
  }
  tabs.forEach(function(tb, idx) {
    tb.addEventListener("click", function() {
      showTab(idx);
    });
  });
  panels.forEach(function(panel) {
    cardsOf(panel).forEach(function(c, idx) {
      c.addEventListener("click", function() {
        openCard(panel, idx, true);
      });
      c.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCard(panel, idx, true);
        }
      });
    });
    panel._open = 0;
  });
  arrows.forEach(function(a) {
    a.addEventListener("click", function() {
      var dir = parseInt(a.getAttribute("data-dir"), 10) || 1;
      var cont = panels[current].querySelector(".tm2-cards");
      if (!cont) return;
      var card = cont.querySelector(".tm2-card");
      var step = card ? card.getBoundingClientRect().width + 16 : cont.clientWidth * 0.6;
      cont.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });
  showTab(0);
})();
