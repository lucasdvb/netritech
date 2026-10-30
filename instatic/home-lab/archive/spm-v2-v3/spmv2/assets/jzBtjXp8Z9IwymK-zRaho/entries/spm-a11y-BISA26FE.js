// src/scripts/spm-a11y.js
(function() {
  try {
    var ti = document.querySelector(".ti-root");
    if (ti && !document.querySelector('main, [role="main"]')) ti.setAttribute("role", "main");
    document.querySelectorAll(".ti-calc .ti-field").forEach(function(f, i) {
      var lab = f.querySelector("label"), inp = f.querySelector("input");
      if (lab && inp) {
        if (!inp.id) inp.id = "ti-calc-f" + i;
        lab.setAttribute("for", inp.id);
        if (!inp.getAttribute("aria-label")) inp.setAttribute("aria-label", lab.textContent.trim());
      }
    });
    var sl = document.querySelector(".ti-calc .ti-range");
    if (sl && !sl.getAttribute("aria-label")) sl.setAttribute("aria-label", "Part externalis\xE9e avec SPM");
    document.querySelectorAll(".sf-q").forEach(function(b) {
      if (!b.getAttribute("role")) b.setAttribute("role", "button");
      if (!b.hasAttribute("tabindex")) b.setAttribute("tabindex", "0");
      b.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          b.click();
        }
      });
    });
  } catch (e) {
  }
})();
