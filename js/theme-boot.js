// The saved theme, set before the first paint so the screen never flashes the wrong colours.
// A plain script (not a module) so it runs at once, before the styles are applied.
(function () {
  try {
    var t = localStorage.getItem('lifeos.theme') || 'system';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: the system theme applies */ }
})();
