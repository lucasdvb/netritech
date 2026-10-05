// Contact. Quiet page: no gradient. The form opens WhatsApp with the request filled in.
module.exports = {
  css: `
.cth .mega{font-size:clamp(84px,15vw,250px)}
.cth .lead{max-width:44ch}
.cmain{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:48px var(--gap);align-items:start}
.cmain>*{grid-column:1/-1}
@media (min-width:1024px){.cmain .clist{grid-column:1/span 5;position:sticky;top:120px}.cmain .formp{grid-column:6/-1}}
.clist>div{padding:22px 0;border-top:1px solid var(--ln)}
.clist>div:last-child{border-bottom:1px solid var(--ln)}
.clist dd{margin-top:8px;font-size:clamp(20px,1.7vw,26px);letter-spacing:-.02em;line-height:1.25}
.clist dd a{background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .7s var(--e2)}
.clist dd a:hover{background-size:100% 1px}
.clist .sub{display:block;font-size:15px;color:var(--mu);margin-top:4px}
.formp{padding:clamp(24px,3.6vw,56px);border-radius:var(--rx);background:#fff;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;--ln:rgba(12,12,14,.12);--ls:rgba(12,12,14,.22);--inv:#0c0c0e;--inv-fg:#f3f1ea;box-shadow:0 2px 4px rgba(20,18,12,.05),0 50px 90px -40px rgba(20,18,12,.4)}
.formp h3{font-size:13px;font-weight:600;letter-spacing:.1em}
.lead-form{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px;margin-top:36px}
.field{display:flex;flex-direction:column;gap:6px}
.field:nth-child(4),.field:nth-child(5),.lead-form .consent,.lead-form .submit{grid-column:1/-1}
.field label{font-size:13px;color:var(--mu)}
.inp{font:inherit;font-size:19px;letter-spacing:-.01em;color:var(--fg);background:transparent;border:0;border-bottom:1px solid var(--ls);border-radius:0;padding:10px 0 12px;outline:none;transition:border-color .4s;width:100%;-webkit-appearance:none;appearance:none}
.inp::placeholder{color:#a3a29b}
.inp:focus{border-color:var(--fg)}
select.inp{cursor:pointer;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2362615b' stroke-width='1.5'/%3E%3C/svg%3E") right 4px center no-repeat}
textarea.inp{resize:vertical;min-height:52px}
.consent{font-size:13px;color:var(--mu)}
.consent a{text-decoration:underline;text-underline-offset:3px}
.submit{display:flex;justify-content:space-between;align-items:center;height:68px;padding:0 10px 0 28px;border-radius:999px;background:#0c0c0e;color:#f3f1ea;font-size:16px;font-weight:500;transition:transform .5s var(--e),box-shadow .5s var(--e)}
.submit:hover{transform:translateY(-2px);box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
.submit .disc{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#f3f1ea;color:#0c0c0e;transition:transform .6s var(--e)}
.submit .disc .ar{width:12px;height:12px}
.submit:hover .disc{transform:rotate(45deg)}
@media (max-width:639px){.lead-form{grid-template-columns:1fr}.field{grid-column:1/-1}}
.form-done{margin-top:32px}
.form-done h3{font-size:clamp(28px,2.6vw,40px);font-weight:var(--w-dsp);letter-spacing:-.03em}
.form-done .tx{margin-top:16px}
.form-done a{text-decoration:underline;text-underline-offset:3px}`,
  html: `<main>
  <section class="hero short cth">
    <div class="hero-bg"></div>
    <p class="kick">Get In Touch</p>
    <h1 class="mega mt-24">Let's talk.</h1>
    <p class="lead mt-40">Tell us where your business is leaking customers. We'll come back within one business hour with a straight read on what's costing you customers, and what we'd fix first. No jargon, no hard sell.</p>
  </section>

  <section class="sheet lt sec" aria-label="Contact details and form">
    <div class="cmain">
      <dl class="clist" data-r="s">
        <div><dt class="cap">New business</dt><dd><a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a></dd></div>
        <div><dt class="cap">WhatsApp</dt><dd><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener">+230 5806 5315</a></dd></div>
        <div><dt class="cap">Office</dt><dd><span class="todo">[Office address]</span><span class="sub">Mauritius</span></dd></div>
        <div><dt class="cap">Local time</dt><dd><span>Mauritius · GMT+4</span> · <time class="ft-time" data-clock></time></dd></div>
        <div><dt class="cap">Join the team</dt><dd><span class="todo">[careers email, to confirm]</span></dd></div>
      </dl>
      <div class="formp" data-r="u">
        <h3>BOOK A FREE GROWTH CALL</h3>
        <form class="lead-form" action="/contact" novalidate>
          <div class="field"><label for="c-name">Your name</label><input class="inp" id="c-name" name="name" type="text" placeholder="Name" autocomplete="name"></div>
          <div class="field"><label for="c-company">Company name</label><input class="inp" id="c-company" name="company" type="text" placeholder="Your business" autocomplete="organization"></div>
          <div class="field"><label for="c-phone">Phone / WhatsApp</label><input class="inp" id="c-phone" name="phone" type="tel" placeholder="+230 ..." autocomplete="tel"></div>
          <div class="field"><label for="c-problem">What's slowing your growth?</label><select class="inp" id="c-problem" name="problem"><option value="" disabled selected>Choose one...</option><option>Getting more customers</option><option>A website that converts</option><option>Following up on enquiries</option><option>Brand &amp; positioning</option><option>Too much manual admin</option><option>Not sure, help me diagnose</option></select></div>
          <div class="field"><label for="c-message">Anything else?</label><textarea class="inp" id="c-message" name="message" rows="2" placeholder="Tell us a little about your business"></textarea></div>
          <p class="consent">By submitting, you agree to our <a href="/privacy">privacy policy</a> and to be contacted about your enquiry.</p>
          <button class="submit" type="submit"><span>Send request</span><span class="disc">{{ar}}</span></button>
        </form>
        <div class="form-done" hidden>
          <h3>Thanks, message ready.</h3>
          <p class="tx">We've opened WhatsApp so you can send it in one tap. Prefer email? Write to <a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a> and we'll reply within one business hour.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sheet dk sec">
    <div class="ph r21x9" data-r="x"><div class="lb"><b>Office photo or map</b><span>Where to find us</span><i>21:9</i></div></div>
  </section>
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
  },
};
