// Disruptive Dodo · privacy page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["privacy"] = {
  path: "/privacy",
  title: "Privacy and terms · Disruptive Dodo",
  description: "How Disruptive Dodo collects, uses and protects your personal data, and the terms for using this website.",
  ld: null,
  css: `.pvh .d1{max-width:12ch}
.pvh .note{margin-top:28px;max-width:52ch;padding:16px 18px;border-radius:14px;border:1px solid rgba(243,241,234,.16);background:rgba(243,241,234,.04);font-size:14px;color:rgba(243,241,234,.75)}
.toc a{display:flex;gap:14px;padding:10px 0;font-size:15px;color:var(--mu);border-bottom:1px solid var(--ln);transition:color .3s,padding .5s var(--e)}
.toc a span{font-size:12px;width:20px;padding-top:2px}
.toc a:hover,.toc a.on{color:var(--fg);padding-left:6px}
@media (max-width:1023px){.toc{display:none}
}
.legal-sec{padding:40px 0;border-top:1px solid var(--ln);scroll-margin-top:110px}
.legal-sec:last-child{border-bottom:1px solid var(--ln)}
.legal-sec .h3{font-size:clamp(24px,2vw,32px)}
.legal-sec .tx{margin-top:16px;max-width:64ch;font-size:17px;color:var(--fg);opacity:.86}`,
  html: `<main>
  <section class="hero auto pvh">
    <p class="kick">Legal</p>
    <h1 class="d1 mt-24">Privacy and terms</h1>
    <p class="sm mt-32">Last updated <span class="todo">[date]</span></p>
    <p class="note">Draft structure. The final text must be written or reviewed by our lawyer before the site goes live.</p>
  </section>
  <section class="sheet lt sec">
    <div class="g12">
      <nav class="c1-4" aria-label="On this page"><div class="stick toc"><a href="#who"><span>01</span>Who we are</a><a href="#collect"><span>02</span>What we collect</a><a href="#why"><span>03</span>Why we collect it</a><a href="#sees"><span>04</span>Who sees it</a><a href="#keep"><span>05</span>How long we keep it</a><a href="#rights"><span>06</span>Your rights</a><a href="#cookies"><span>07</span>Cookies and analytics</a><a href="#terms"><span>08</span>Using this website</a></div></nav>
      <div class="c6-12">
        <section class="legal-sec" id="who"><h2 class="h3">Who we are</h2><p class="tx">Disruptive Dodo <span class="todo">[legal name and registration number]</span>, <span class="todo">[registered address]</span>, Mauritius. Contact: info@disruptivedodo.mu.</p></section>
        <section class="legal-sec" id="collect"><h2 class="h3">What we collect</h2><p class="tx">When you fill in the contact form, we collect your name, your company name, your phone or WhatsApp number, the challenge you choose and your message.</p></section>
        <section class="legal-sec" id="why"><h2 class="h3">Why we collect it</h2><p class="tx">To reply to your enquiry and to prepare your free growth call. We do not sell your details.</p></section>
        <section class="legal-sec" id="sees"><h2 class="h3">Who sees it</h2><p class="tx">Our team, and the tools we use to run our business: <span class="todo">[list the tools, for example the CRM and the email provider]</span>.</p></section>
        <section class="legal-sec" id="keep"><h2 class="h3">How long we keep it</h2><p class="tx"><span class="todo">[Retention period, to confirm.]</span></p></section>
        <section class="legal-sec" id="rights"><h2 class="h3">Your rights</h2><p class="tx">You can ask to see, correct or delete your details at any time. Write to info@disruptivedodo.mu. <span class="todo">[Reference to the Mauritius Data Protection Act 2017, to confirm with our lawyer.]</span></p></section>
        <section class="legal-sec" id="cookies"><h2 class="h3">Cookies and analytics</h2><p class="tx"><span class="todo">[Which cookies and analytics tools the site uses, to confirm before launch.]</span></p></section>
        <section class="legal-sec" id="terms"><h2 class="h3">Using this website</h2><p class="tx"><span class="todo">[Terms of use: ownership of the content, links to other sites, limits of liability. Text to supply.]</span></p></section>
      </div>
    </div>
  </section>
</main>`,
  init: function (R) {
    // mark the section being read in the contents list
    var links = R.querySelectorAll('.toc a');
    if (!links.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    R.querySelectorAll('.legal-sec').forEach(function (s) { io.observe(s); });
  },
};
DD.current = "privacy";
if (DD.mount) DD.mount();
