(function () {
  try {
    var h = document.head || document.getElementsByTagName('head')[0];
    if (!h) return;
    function add(a) {
      var l = document.createElement('link');
      for (var k in a) { if (a[k] === true) l.setAttribute(k, ''); else l.setAttribute(k, a[k]); }
      h.appendChild(l);
    }
    add({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    add({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true });
    add({ rel: 'preload', as: 'image', href: '/uploads/Y3UuFxigO0lcmzzyC5TG1-dd-wordmark-white.webp', fetchpriority: 'high' });
  } catch (e) {}
})();