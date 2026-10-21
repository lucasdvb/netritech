/* hlab: the SPM site's inner pages only (Solutions, Pourquoi SPM, Clients & Partenaires,
   Secteurs, Actualités, Carrières, Contact); inert on the homepage and on SPM V2 / V3.
   Shared shell: adds the homepage's top menu, its last two sections (contact form +
   FAQ) and its footer around the page content. Only the skeleton is added here;
   hlab-spm-chrome.js fills the menu items, footer content and FR·EN ball,
   hlab-hero-nav.js reveals the bar and runs the mobile drawer, hlab-buttons.js adds the
   button styling, hlab-spm-lead-form / hlab-spm-faq / hlab-sections build the form,
   the FAQ and the reveals: the same code as the homepage, so every page matches it.
   Named hlab-0-… so it runs before those scripts (same priority, alphabetical order). */
(function () {
  "use strict";
  if (window.self !== window.top) return;   // the Instatic editor canvas
  if (/^\/(index\.html)?$|^\/home-lab(\/|\.html)?$|^\/spmv[23](\/|\.html)?$/.test(location.pathname)) return;
  if (document.querySelector(".hlab-site-header")) return;
  var body = document.body;
  if (!body) return;
  body.classList.add("hlab-shell");

  var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

  var header = document.createElement("div");
  header.className = "hlab-site-header";
  header.id = "hlab-top";
  header.innerHTML =
    '<nav class="hlab-nav-bar" aria-label="Menu principal">' +
      '<a class="hlab-nav-logo" aria-label="SPM — Accueil" href="/" target="_self">' +
        '<img src="/uploads/Kfmabc-aPvy5DPJ-mSQC3-HUMAN___AI__1_-w640.webp" alt="" decoding="async" fetchpriority="high"></a>' +
      '<ul class="hlab-nav-links"></ul>' +
      '<div class="hlab-nav-actions">' +
        '<a class="hlab-nav-icon" aria-label="Nous appeler" href="tel:+33481659845" target="_self">' + PHONE + '</a>' +
        '<a class="hlab-nav-btn hlab-nav-btn-white" href="/contact" target="_self">Prendre rendez-vous</a>' +
        '<a class="hlab-nav-btn hlab-nav-btn-grey" href="/contact" target="_self">Nous contacter</a>' +
      '</div>' +
      '<button class="hlab-nav-menu-btn" type="button" aria-label="Menu"><span class="hlab-bar"></span><span class="hlab-bar"></span><span class="hlab-bar"></span></button>' +
    '</nav>' +
    '<div class="hlab-nav-dropdown"><ul></ul></div>';
  body.insertBefore(header, body.firstChild);

  // The homepage's closing sections (contact form + FAQ), then the footer, after the
  // page content. Their form, logos, FAQ and scroll reveals are built by the same
  // scripts as on the homepage (hlab-spm-lead-form, hlab-spm-logos, hlab-spm-faq, hlab-sections).
  var main = body.querySelector(":scope > main");
  var after = main ? main.nextSibling : null;

  // One FAQ per page: the shared FAQ just before the footer is the original, so any
  // FAQ section inside the page content is removed.
  if (main) {
    var secs = main.querySelectorAll("section");
    for (var i = 0; i < secs.length; i++) {
      var sec = secs[i], h = sec.querySelector("h1, h2, h3");
      var eb = sec.querySelector("p");
      if (sec.querySelector(".spmp-faq-q") ||
          (h && /questions\s+fr[ée]quentes/i.test(h.textContent)) ||
          (eb && /^\s*FAQ\s*$/.test(eb.textContent) && eb === sec.querySelector("p, h1, h2, h3"))) {
        sec.parentNode.removeChild(sec);
      }
    }
  }
  if (!document.querySelector(".hlab-spm-lead")) {
    var tail = document.createElement("div");
    tail.className = "hlab-ti-root hlab-shell-tail";
    tail.setAttribute("data-hlab-notch", "1");   // no hero notch here (hlab-spm-chrome.js)
    tail.innerHTML =
    '<section class="hlab-ti-sec hlab-spm-lead" aria-label="Demander une démonstration"><div class="hlab-ti-wrap"><h2 class="hlab-ti-h2 hlab-spm-lead-title hlab-ti-reveal">Contactez-nous : nous revenons vers vous sous 24 heures.</h2><div class="hlab-spm-lead-grid"><div class="hlab-spm-lead-intro"><p class="hlab-ti-lead hlab-spm-lead-sub hlab-ti-reveal">Remplissez le formulaire : nous verrons ensemble comment SPM peut transformer votre relation client, votre back-office et vos ventes.</p><ul class="hlab-spm-lead-list hlab-ti-reveal"><li>On lit votre demande et on vous recontacte sous 24 heures.</li><li>Un appel de découverte pour comprendre votre activité et vos besoins.</li><li>Une proposition d&#x27;équipe, construite autour de votre activité.</li></ul><p class="hlab-spm-lead-trust">La confiance des entreprises qui externalisent avec exigence.</p><div class="hlab-spm-lead-logos" aria-hidden="true"><div class="hlab-spm-lead-logo">Logo</div><div class="hlab-spm-lead-logo">Logo</div><div class="hlab-spm-lead-logo">Logo</div><div class="hlab-spm-lead-logo">Logo</div><div class="hlab-spm-lead-logo">Logo</div><div class="hlab-spm-lead-logo">Logo</div></div></div><div class="hlab-spm-lead-form-mount"></div></div></div></section>' +
    '<section class="hlab-ti-sec hlab-sf-sec" aria-label="Questions fréquentes"><div class="hlab-ti-wrap hlab-sf-wrap hlab-sf-tabbed"><div class="hlab-sf-head"><p class="hlab-ti-eyebrow hlab-sf-eyebrow hlab-ti-reveal">FAQ</p><h2 class="hlab-ti-h2 hlab-sf-title hlab-ti-reveal" data-delay="60">Questions fréquentes</h2><p class="hlab-ti-lead hlab-sf-intro hlab-ti-reveal" data-delay="100">Les réponses aux questions que se posent les entreprises avant de nous confier leur relation client, leur back-office ou leur développement commercial.</p></div><div class="hlab-sf-main" id="sf-mount"></div></div></section>';
    body.insertBefore(tail, after);
  }
  if (!document.querySelector(".hlab-ti-footer")) {
    var footer = document.createElement("footer");
    footer.className = "hlab-ti-footer";
    body.insertBefore(footer, after);
  }
})();
