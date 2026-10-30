// src/scripts/v3f-spm-a11y.js
(function() {
  try {
    var ti = document.querySelector(".v3f-ti-root");
    if (ti && !document.querySelector('main, [role="main"]')) ti.setAttribute("role", "main");
    document.querySelectorAll(".v3f-ti-calc .v3f-ti-field").forEach(function(f, i) {
      var lab = f.querySelector("label"), inp = f.querySelector("input");
      if (lab && inp) {
        if (!inp.id) inp.id = "ti-calc-f" + i;
        lab.setAttribute("for", inp.id);
        if (!inp.getAttribute("aria-label")) inp.setAttribute("aria-label", lab.textContent.trim());
      }
    });
    var sl = document.querySelector(".v3f-ti-calc .v3f-ti-range");
    if (sl && !sl.getAttribute("aria-label")) sl.setAttribute("aria-label", "Part externalis\xE9e avec SPM");
    document.querySelectorAll(".v3f-sf-q").forEach(function(b) {
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
