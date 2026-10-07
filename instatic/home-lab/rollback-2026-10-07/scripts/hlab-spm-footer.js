/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]')) return;
// SPM footer newsletter — injects the email <input> (Instatic's HTML importer
// strips <input>/<form>) and handles submit client-side only (no backend):
// validates the address, then swaps the row for a "Merci" confirmation.
(function () {
  function init() {
    var mount = document.querySelector('.hlab-spmf2-mail-mount');
    if (!mount || mount.dataset.ready) return;
    mount.dataset.ready = '1';

    var input = document.createElement('input');
    input.type = 'email';
    input.className = 'hlab-spmf2-mail-input';
    input.placeholder = 'Votre email professionnel';
    input.setAttribute('aria-label', 'Votre email professionnel');
    input.autocomplete = 'email';
    mount.appendChild(input);

    var btn = document.querySelector('.hlab-spmf2-mail-btn');

    function valid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function submit(e) {
      if (e) e.preventDefault();
      var row = document.querySelector('.hlab-spmf2-mail-row');
      if (!valid(input.value.trim())) {
        input.style.borderColor = '#e0674f';
        input.focus();
        return;
      }
      if (row) {
        var done = document.createElement('div');
        done.className = 'hlab-spmf2-mail-done';
        done.textContent = 'Merci ! Votre inscription est confirmée.';
        row.replaceWith(done);
      }
    }

    if (btn) btn.addEventListener('click', submit);
    input.addEventListener('input', function () { input.style.borderColor = ''; });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

})();
