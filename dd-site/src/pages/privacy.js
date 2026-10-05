// Privacy and terms: a long read with a sticky contents list.
const SECS = [
  ['who', 'Who we are', 'Disruptive Dodo <span class="todo">[legal name and registration number]</span>, <span class="todo">[registered address]</span>, Mauritius. Contact: info@disruptivedodo.mu.'],
  ['collect', 'What we collect', 'When you fill in the contact form, we collect your name, your company name, your phone or WhatsApp number, the challenge you choose and your message.'],
  ['why', 'Why we collect it', 'To reply to your enquiry and to prepare your free growth call. We do not sell your details.'],
  ['sees', 'Who sees it', 'Our team, and the tools we use to run our business: <span class="todo">[list the tools, for example the CRM and the email provider]</span>.'],
  ['keep', 'How long we keep it', '<span class="todo">[Retention period, to confirm.]</span>'],
  ['rights', 'Your rights', 'You can ask to see, correct or delete your details at any time. Write to info@disruptivedodo.mu. <span class="todo">[Reference to the Mauritius Data Protection Act 2017, to confirm with our lawyer.]</span>'],
  ['cookies', 'Cookies and analytics', '<span class="todo">[Which cookies and analytics tools the site uses, to confirm before launch.]</span>'],
  ['terms', 'Using this website', '<span class="todo">[Terms of use: ownership of the content, links to other sites, limits of liability. Text to supply.]</span>'],
];
module.exports = {
  css: `
.pvh .d1{max-width:12ch}
.pvh .note{margin-top:28px;max-width:52ch;padding:16px 18px;border-radius:14px;border:1px solid rgba(243,241,234,.16);background:rgba(243,241,234,.04);font-size:14px;color:rgba(243,241,234,.75)}
.toc a{display:flex;gap:14px;padding:10px 0;font-size:15px;color:var(--mu);border-bottom:1px solid var(--ln);transition:color .3s,padding .5s var(--e)}
.toc a span{font-size:12px;width:20px;padding-top:2px}
.toc a:hover,.toc a.on{color:var(--fg);padding-left:6px}
@media (max-width:1023px){.toc{display:none}}
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
      <nav class="c1-4" aria-label="On this page"><div class="stick toc">${SECS.map((s, i) => `<a href="#${s[0]}"><span>${String(i + 1).padStart(2, '0')}</span>${s[1]}</a>`).join('')}</div></nav>
      <div class="c6-12">${SECS.map((s) => `
        <section class="legal-sec" id="${s[0]}"><h2 class="h3">${s[1]}</h2><p class="tx">${s[2]}</p></section>`).join('')}
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
