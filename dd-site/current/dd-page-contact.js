// Disruptive Dodo · contact page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["contact"] = {
  path: "/contact",
  title: "Contact Disruptive Dodo · Book a free growth call",
  description: "Talk to Disruptive Dodo in Mauritius. Book a free growth call by WhatsApp, phone or email. We reply within one business hour.",
  ld: null,
  css: `.contact-hero .ld{max-width:40ch}
.contact-main{padding-top:0}
.clist>div{display:flex;flex-direction:column;gap:10px;padding:28px 0;border-top:1px solid var(--ln)}
.clist>div:last-child{border-bottom:1px solid var(--ln)}
.clist dd{font-size:clamp(22px,1.95vw,28px);line-height:1.25;font-weight:600;letter-spacing:-.01em;overflow-wrap:anywhere}
.clist dd a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none;background-image:linear-gradient(currentColor,currentColor);background-size:0 1px;background-position:0 calc(100% - 6px);background-repeat:no-repeat;transition:background-size .3s}
.clist dd a:hover{background-size:100% 1px}
.clist .sub{display:block;margin-top:4px;font-size:17px;line-height:1.5;font-weight:400;letter-spacing:0;color:var(--mu)}
.clock-t{font-variant-numeric:tabular-nums}
.map{padding-bottom:clamp(96px,8.4vw,120px)}`,
  html: `<main>
  <section class="hero-in contact-hero">
    <p class="eb"><span class="dot"></span>Get In Touch</p>
    <h1 class="mega">Let's talk.</h1>
    <p class="ld">Tell us where your business is leaking customers. We'll come back within one business hour with a straight read on what's costing you customers, and what we'd fix first. No jargon, no hard sell.</p>
  </section>

  <section class="sec contact-main" aria-label="Contact details and form">
    <div class="g12">
      <dl class="span-5 clist">
        <div><dt class="cap">New business</dt><dd><a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a></dd></div>
        <div><dt class="cap">WhatsApp</dt><dd><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener">+230 5806 5315</a></dd></div>
        <div><dt class="cap">Office</dt><dd><span class="todo">[Office address]</span><span class="sub">Mauritius</span></dd></div>
        <div><dt class="cap">Local time</dt><dd><span>Mauritius · GMT+4</span><span class="clock-sep" hidden> · </span><time class="clock-t"></time></dd></div>
        <div><dt class="cap">Join the team</dt><dd><span class="todo">[careers email, to confirm]</span></dd></div>
      </dl>
      <div class="span-7 form-panel">
        <h3>BOOK A FREE GROWTH CALL</h3>
        <form class="lead-form" action="/contact" novalidate>
          <div class="field"><label for="c-name">Your name</label><input class="inp" id="c-name" name="name" type="text" placeholder="Name" autocomplete="name"></div>
          <div class="field"><label for="c-company">Company name</label><input class="inp" id="c-company" name="company" type="text" placeholder="Your business" autocomplete="organization"></div>
          <div class="field"><label for="c-phone">Phone / WhatsApp</label><input class="inp" id="c-phone" name="phone" type="tel" placeholder="+230 ..." autocomplete="tel"></div>
          <div class="field"><label for="c-problem">What's slowing your growth?</label><select class="inp" id="c-problem" name="problem"><option value="" disabled selected>Choose one...</option><option>Getting more customers</option><option>A website that converts</option><option>Following up on enquiries</option><option>Brand &amp; positioning</option><option>Too much manual admin</option><option>Not sure, help me diagnose</option></select></div>
          <div class="field"><label for="c-message">Anything else?</label><textarea class="inp" id="c-message" name="message" rows="2" placeholder="Tell us a little about your business"></textarea></div>
          <p class="consent">By submitting, you agree to our <a href="/privacy">privacy policy</a> and to be contacted about your enquiry.</p>
          <button class="submit" type="submit"><span>Send request</span><span class="disc" aria-hidden="true"><svg viewBox="0 0 19.0049 19" fill="none"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></button>
        </form>
        <div class="form-done" hidden>
          <h3>Thanks, message ready.</h3>
          <p class="tx">We've opened WhatsApp so you can send it in one tap. Prefer email? Write to <a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a> and we'll reply within one business hour.</p>
        </div>
      </div>
    </div>
  </section>

  <div class="gt map">
    <div class="ph r21x9"><div class="lb"><b>Office photo or map</b><span>Where to find us</span><i>21:9</i></div></div>
  </div>
</main>`,
  init: function (R) {
    /* form: opens WhatsApp with the request filled in, then shows the thank-you block */
    R.querySelectorAll('.lead-form').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = function (n) { var el = f.elements[n]; return (el && el.value || '').trim(); };
        var body = "Hi Disruptive Dodo, I'd like a free growth call. Name: " + v('name') + '. Company: ' + v('company') + '. Phone: ' + v('phone') + '. Challenge: ' + v('problem') + '. Notes: ' + v('message');
        try { window.open('https://wa.me/23058065315?text=' + encodeURIComponent(body), '_blank', 'noopener'); } catch (err) {}
        f.hidden = true;
        f.parentNode.querySelector('.form-done').hidden = false;
      });
    });
    /* live clock for Mauritius: the static text stays, the time is appended */
    var t = R.querySelector('.clock-t'), s = R.querySelector('.clock-sep');
    if (!t || !window.Intl) return;
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Mauritius', hour: '2-digit', minute: '2-digit', hour12: false });
    function tick() { var now = new Date(); t.textContent = fmt.format(now); t.setAttribute('datetime', now.toISOString()); s.hidden = false; }
    tick(); setInterval(tick, 30000);
  },
};
DD.current = "contact";
if (DD.mount) DD.mount();
