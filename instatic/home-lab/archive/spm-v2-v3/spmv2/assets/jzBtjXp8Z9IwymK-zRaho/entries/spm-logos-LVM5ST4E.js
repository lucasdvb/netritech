// src/scripts/spm-logos.js
(function() {
  var LOGOS = [
    { n: "Norvel", m: '<circle cx="9" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' },
    { n: "Axendo", m: '<path d="M4 20 L12 5 L20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M8 15 H16" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: "Meridal", m: '<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>' },
    { n: "Kalveo", m: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 17 L17 7" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: "Vanteo", m: '<rect x="4" y="13" width="3.4" height="7" rx="1" fill="currentColor"/><rect x="10.3" y="8" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="16.6" y="3" width="3.4" height="17" rx="1" fill="currentColor"/>' },
    { n: "Solvae", m: '<path d="M12 3 L20 7.5 L20 16.5 L12 21 L4 16.5 L4 7.5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' }
  ];
  var html = LOGOS.map(function(l) {
    return '<span class="spm-clogo"><svg class="spm-clogo-ic" viewBox="0 0 24 24" aria-hidden="true">' + l.m + '</svg><span class="spm-clogo-name">' + l.n + "</span></span>";
  }).join("");
  [".spm-logos-grid", ".ti-logos", ".spm-lead-logos"].forEach(function(sel) {
    var grid = document.querySelector(sel);
    if (grid) {
      grid.innerHTML = html;
      grid.classList.add("spm-clogo-grid");
    }
  });
})();
