/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
(function () {
  try {
    // 1. main landmark
    var ti = document.querySelector('.hlab-ti-root');
    if (ti && !document.querySelector('main, [role="main"]')) ti.setAttribute('role', 'main');

    // 2. associate calculator field labels with their inputs + accessible names
    document.querySelectorAll('.hlab-ti-calc .hlab-ti-field').forEach(function (f, i) {
      var lab = f.querySelector('label'), inp = f.querySelector('input');
      if (lab && inp) {
        if (!inp.id) inp.id = 'ti-calc-f' + i;
        lab.setAttribute('for', inp.id);
        if (!inp.getAttribute('aria-label')) inp.setAttribute('aria-label', lab.textContent.trim());
      }
    });

    // 3. slider accessible name
    var sl = document.querySelector('.hlab-ti-calc .hlab-ti-range');
    if (sl && !sl.getAttribute('aria-label')) sl.setAttribute('aria-label', 'Part externalisée avec SPM');

    // 4. FAQ toggles are divs with aria-expanded -> give them a button role + keyboard
    document.querySelectorAll('.hlab-sf-q').forEach(function (b) {
      if (!b.getAttribute('role')) b.setAttribute('role', 'button');
      if (!b.hasAttribute('tabindex')) b.setAttribute('tabindex', '0');
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
      });
    });
  } catch (e) {}
})();

})();
