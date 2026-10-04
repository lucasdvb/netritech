// Disruptive Dodo · privacy page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["privacy"] = {
  path: "/privacy",
  title: "Privacy and terms · Disruptive Dodo",
  description: "How Disruptive Dodo collects, uses and protects your personal data, and the terms for using this website.",
  ld: null,
  css: `.legal{margin-top:24px;border-radius:32px 32px 0 0;padding:clamp(72px,8.4vw,120px) var(--gt) clamp(120px,10.5vw,152px)}
.legal-col{max-width:760px;margin:0 auto}
.legal .h1{margin-top:24px}
.legal .sm{margin-top:20px}
.note{margin-top:40px;padding:20px 24px;border:1px dashed var(--ls);border-radius:16px;background:var(--sf2);font-size:16px;line-height:1.55;color:var(--fg)}
.legal-sec{margin-top:clamp(40px,4.45vw,56px);padding-top:clamp(32px,3.34vw,40px);border-top:1px solid var(--ln)}
.legal-sec .tx{margin-top:12px;max-width:62ch}
.legal-sec:first-of-type{margin-top:clamp(48px,5.56vw,72px)}`,
  html: `<main class="lt legal">
  <div class="legal-col">
    <p class="eb"><span class="dot"></span>Legal</p>
    <h1 class="h1">Privacy and terms</h1>
    <p class="sm">Last updated <span class="todo">[date]</span></p>
    <p class="note">Draft structure. The final text must be written or reviewed by our lawyer before the site goes live.</p>

    <section class="legal-sec">
      <h2 class="h3">Who we are</h2>
      <p class="tx">Disruptive Dodo <span class="todo">[legal name and registration number]</span>, <span class="todo">[registered address]</span>, Mauritius. Contact: info@disruptivedodo.mu.</p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">What we collect</h2>
      <p class="tx">When you fill in the contact form, we collect your name, your company name, your phone or WhatsApp number, the challenge you choose and your message.</p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">Why we collect it</h2>
      <p class="tx">To reply to your enquiry and to prepare your free growth call. We do not sell your details.</p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">Who sees it</h2>
      <p class="tx">Our team, and the tools we use to run our business: <span class="todo">[list the tools, for example the CRM and the email provider]</span>.</p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">How long we keep it</h2>
      <p class="tx"><span class="todo">[Retention period, to confirm.]</span></p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">Your rights</h2>
      <p class="tx">You can ask to see, correct or delete your details at any time. Write to info@disruptivedodo.mu. <span class="todo">[Reference to the Mauritius Data Protection Act 2017, to confirm with our lawyer.]</span></p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">Cookies and analytics</h2>
      <p class="tx"><span class="todo">[Which cookies and analytics tools the site uses, to confirm before launch.]</span></p>
    </section>
    <section class="legal-sec">
      <h2 class="h3">Using this website</h2>
      <p class="tx"><span class="todo">[Terms of use: ownership of the content, links to other sites, limits of liability. Text to supply.]</span></p>
    </section>
  </div>
</main>`,
};
DD.current = "privacy";
if (DD.mount) DD.mount();
