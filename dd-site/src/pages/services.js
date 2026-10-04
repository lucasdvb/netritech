// Services hub. Hero runs the "reeded" gradient; the six services sit in a colonnade
// of expanding columns; the four stages stack as sticky cards.
const COLS = [
  ['/services/web-design', '/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp', '01 · Websites and SEO', 'Get Found.<br>Get Chosen.', 'Websites and SEO that put your business in front of the right people.'],
  ['/services/social-media-management', '/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp', '02 · Social media', 'Stay Top<br>of Mind.', 'Social media and content that keep your brand visible, trusted, and relevant.'],
  ['/services/facebook-google-ads', '/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp', '03 · Paid ads', 'Get More<br>Customers.', 'Facebook, Instagram and Google ads that turn attention into enquiries.'],
  ['/services/marketing-automation-crm', '/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp', '04 · Automation and CRM', 'Grow Without<br>Growing Your Team.', 'CRM, follow-up and automation, so you handle more enquiries without hiring more people.'],
  ['/services/ai-chatbots', '/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp', '05 · AI implementation', 'Answer Every<br>Message.', 'AI assistants that reply to your customers on WhatsApp and your website, day and night.'],
  ['/services/branding-logo-design', '/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp', '06 · Branding', 'Look Like<br>the Leader.', 'Branding that makes your business stand out, build trust, and get remembered.'],
];
const STAGES = [
  ['(01)', 'Get Found', 'Visibility and demand', '<li><a href="/services/web-design">Websites{{ar}}</a></li><li><a href="/services/web-design">SEO{{ar}}</a></li><li><span>Content</span></li><li><a href="/services/facebook-google-ads">Google ads{{ar}}</a></li><li><a href="/services/facebook-google-ads">Facebook and Instagram ads{{ar}}</a></li><li><a href="/services/social-media-management">Social media{{ar}}</a></li>'],
  ['(02)', 'Get Chosen', 'Brand and websites', '<li><a href="/services/branding-logo-design">Brand identity{{ar}}</a></li><li><span>Positioning</span></li><li><a href="/services/web-design">Websites that turn visitors into enquiries{{ar}}</a></li><li><span>Reviews and proof</span></li>'],
  ['(03)', 'Get The Business', 'Capture and convert', '<li><a href="/services/marketing-automation-crm">Client acquisition systems{{ar}}</a></li><li><a href="/services/marketing-automation-crm">CRM and sales pipeline{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Automated follow-up{{ar}}</a></li><li><a href="/services/ai-chatbots">AI assistant for enquiries{{ar}}</a></li>'],
  ['(04)', 'Keep &amp; Grow', 'Retain and refer', '<li><a href="/services/social-media-management">Social media and content{{ar}}</a></li><li><span>Review requests</span></li><li><span>Repeat business</span></li><li><a href="/services/marketing-automation-crm">Automation of repetitive work{{ar}}</a></li>'],
];

module.exports = {
  gl: 'reeded',
  css: `
.svh .d1{max-width:13ch}
.col{display:flex;gap:10px;height:clamp(520px,44vw,640px)}
.col>a{position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;justify-content:space-between;padding:24px;border-radius:var(--r3);overflow:hidden;isolation:isolate;color:#f3f1ea;background:#0b0b0d;
  box-shadow:var(--sh1);transition:flex-grow .9s var(--e),box-shadow .7s var(--e)}
.col>a.on{flex-grow:3.4;box-shadow:var(--sh2)}
.col .cov{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform 1.6s var(--e)}
.col>a::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.05) 40%,rgba(0,0,0,.6));transition:opacity .8s}
.col>a.on .cov{transform:scale(1.05)}
.col .idx{font-size:13px;color:rgba(243,241,234,.75);white-space:nowrap}
.col .bd{opacity:0;transform:translateY(16px);transition:opacity .5s var(--e3),transform .9s var(--e);width:min(420px,100%)}
.col>a.on .bd{opacity:1;transform:none;transition-delay:.18s}
.col h3{font-size:clamp(30px,2.8vw,46px);font-weight:var(--w-dsp);letter-spacing:-.04em;line-height:1}
.col .sub{margin-top:14px;font-size:15px;color:rgba(243,241,234,.75);max-width:34ch}
.col .disc{display:flex;align-items:center;gap:14px;margin-top:28px;font-size:14px}
.col .ring{border-color:rgba(243,241,234,.4)}
.col>a.on .ring{background:#f3f1ea;color:#08080a;border-color:#f3f1ea}
.col .vl{position:absolute;left:24px;bottom:24px;writing-mode:vertical-rl;transform:rotate(180deg);font-size:15px;white-space:nowrap;transition:opacity .4s}
.col>a.on .vl{opacity:0}
.col>a:not(.on) .idx{opacity:0}
.col .idx{transition:opacity .4s}
@media (max-width:1023px){.col{flex-direction:column;height:auto}.col>a,.col>a.on{flex:none;min-height:300px}.col .bd{opacity:1;transform:none}.col .vl{display:none}}
.fband{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px var(--gap);align-items:center;padding:clamp(28px,5vw,80px);border-radius:var(--rx);background:#0b0b0d;border:1px solid var(--ln);box-shadow:var(--sh2);overflow:hidden;position:relative;isolation:isolate}
.fband::before{content:"";position:absolute;right:-10%;bottom:-30%;width:70%;height:120%;background:radial-gradient(closest-side,rgba(215,213,205,.18),transparent);z-index:-1}
.fband .t{grid-column:1/-1}.fband .art{grid-column:1/-1}
@media (min-width:1024px){.fband .t{grid-column:1/span 6}.fband .art{grid-column:8/-1}}
.fband .mega{font-size:clamp(96px,13vw,210px)}
.fband .art img{width:min(420px,80%);margin-inline:auto;filter:drop-shadow(0 40px 60px rgba(0,0,0,.6))}
.stack .st{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px var(--gap);min-height:clamp(340px,30vw,420px);padding:clamp(26px,3.4vw,52px);border-radius:var(--r3)}
.stack .st:nth-child(even){background:#0c0c0e;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;--ln:rgba(243,241,234,.12);border-color:transparent}
.stack .st .a{grid-column:1/-1}.stack .st .b{grid-column:1/-1}
@media (min-width:1024px){.stack .st .a{grid-column:1/span 5}.stack .st .b{grid-column:7/-1}}
.stack .h3{font-size:clamp(34px,3.6vw,58px);letter-spacing:-.04em}
.caplist{display:grid;grid-template-columns:1fr 1fr;gap:0 var(--gap);border-top:1px solid var(--ln)}
.caplist li{border-bottom:1px solid var(--ln)}
.caplist a,.caplist span{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 0;font-size:16px}
.caplist span{color:var(--mu)}
.caplist a .ar{width:10px;height:10px;opacity:.5;transition:transform .5s var(--e),opacity .3s}
.caplist a:hover .ar{opacity:1;transform:translate(2px,-2px)}
@media (max-width:639px){.caplist{grid-template-columns:1fr}}
.ways{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.way{display:flex;flex-direction:column;padding:clamp(28px,3.4vw,52px);border-radius:var(--r3)}
.way ul{margin:32px 0 40px;border-top:1px solid var(--ln)}
.way li{display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--ln);font-size:16px}
.way .ck{width:16px;height:16px;flex:none}
.way .btn{margin-top:auto;align-self:flex-start}
.way.inv{background:#f3f1ea;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;--ln:rgba(12,12,14,.12);--ls:rgba(12,12,14,.24);--inv:#0c0c0e;--inv-fg:#f3f1ea;border-color:transparent}
@media (max-width:1023px){.ways{grid-template-columns:1fr}}`,
  html: `<main>
  <section class="hero svh">
    <div class="hero-bg"></div>
    <div class="hero-grid">
      <div class="hl"><p class="kick">Services</p><h1 class="d1 mt-24">One team for every stage of growth.</h1></div>
      <div class="hr"><p class="lead">Six services that get you found, win you the sale, and keep customers coming back. Take one, or let us run them all as one system: Fledge.</p>
        <div class="btn-row mt-32"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/work">See our work</a></div></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="build-h">
    <div class="head"><div><p class="kick">What We Build</p><h2 class="h2 mt-24" id="build-h" style="max-width:20ch">Everything you need to grow, under one roof</h2></div></div>
    <div class="col mt-64" data-r="u">${COLS.map((c, i) => `
      <a href="${c[0]}" class="${i === 0 ? 'on' : ''}"><img class="cov" src="${c[1]}" alt="" width="960" height="684" loading="lazy">
        <p class="idx">${c[2]}</p><span class="vl" aria-hidden="true">${c[2].split(' · ')[1]}</span>
        <div class="bd"><h3>${c[3]}</h3><p class="sub">${c[4]}</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>`).join('')}
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="fl-band-h">
    <div class="fband" data-r="u">
      <div class="t">
        <p class="cap">Our signature system</p>
        <h2 class="mega mt-24" id="fl-band-h">Fledge.</h2>
        <p class="lead mt-32" style="max-width:34ch">Your full marketing system: website, social media, ads, CRM, follow-up and AI, built as one and run by one team.</p>
        <div class="btn-row mt-40"><a class="btn btn-p" href="/fledge">Discover Fledge{{ar}}</a></div>
      </div>
      <div class="art"><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228" loading="lazy"></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="cap-h">
    <div class="head"><div><p class="kick">Capabilities</p><h2 class="h2 mt-24" id="cap-h">Four stages, one system.</h2></div></div>
    <div class="stack mt-64">${STAGES.map((s, i) => `
      <article class="st card" style="--i:${i}">
        <div class="a"><p class="cap">${s[0]}</p><h3 class="h3 mt-24">${s[1]}</h3><p class="sm mt-8">${s[2]}</p></div>
        <ul class="caplist b">${s[3]}</ul>
      </article>`).join('')}
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="ways-h">
    <div class="head"><div><p class="kick">Ways to work with us</p><h2 class="h2 mt-24" id="ways-h">Two ways to work with us.</h2></div></div>
    <div class="ways mt-64" data-r="s">
      <article class="way card">
        <p class="cap">(01) A project</p>
        <h3 class="h3 mt-24">Build it once, properly.</h3>
        <p class="tx mt-16">One clear piece of work: a website, a brand, a CRM, a set of automations. We agree the scope and the price before we start, then we deliver it. Every project plugs into Fledge later, so nothing is built twice.</p>
        <ul><li>{{ck}}Fixed scope</li><li>{{ck}}Price agreed up front</li><li>{{ck}}<span class="todo">[Typical timeline, to confirm]</span></li></ul>
        <a class="btn" href="/contact">Ask about a project</a>
      </article>
      <article class="way card inv">
        <p class="cap">(02) Fledge, the full system</p>
        <h3 class="h3 mt-24">Grow with us every month.</h3>
        <p class="tx mt-16">We build your full marketing system, then run it with you: content, ads, follow-up and reporting. A setup fee, then a monthly fee.</p>
        <ul><li>{{ck}}Setup, then monthly</li><li>{{ck}}<span>Minimum term: <span class="todo">[3 months, to confirm]</span></span></li><li>{{ck}}A report every month</li></ul>
        <a class="btn btn-p" href="/fledge">Discover Fledge{{ar}}</a>
      </article>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">How we work</p><h2 class="h2 mt-24" id="how-h" style="max-width:11ch">How every project runs.</h2></div></div>
      <ol class="steps c7-12">
        <li data-r="u"><span class="i">01</span><div><h3>We find what's holding you back</h3><p>Before we recommend anything, we look at your marketing, sales, systems, and operations to find where growth is getting stuck.</p></div></li>
        <li data-r="u"><span class="i">02</span><div><h3>We fix the biggest problem first</h3><p>You don't need everything at once. We focus on the changes that can make the biggest difference to your business.</p></div></li>
        <li data-r="u"><span class="i">03</span><div><h3>We build for growth</h3><p>From websites and client acquisition to CRM, automation, and AI, we build systems that work together as your business grows.</p></div></li>
        <li data-r="u"><span class="i">04</span><div><h3>We measure what matters</h3><p>More enquiries. More sales. Less wasted time. Better systems. We focus on the numbers that actually move your business forward.</p></div></li>
      </ol>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">Questions</p><h2 class="h2 mt-24" id="faq-h" style="max-width:12ch">Good questions. Straight answers.</h2></div></div>
      <div class="faq c7-12">
        <details open><summary><h3>How fast do you reply?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Within one business hour, by email or WhatsApp.</p></details>
        <details><summary><h3>Do I need all six services?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. Take one, or let us run them all as one system with Fledge. We start with the problem that costs you the most.</p></details>
        <details><summary><h3>How much does it cost?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">It depends on what you need. After a free growth call, we send a clear proposal with the price before any work starts.</p></details>
        <details><summary><h3>Do you work in French?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We work in English and French.</p></details>
        <details><summary><h3>Do you only work with businesses in Mauritius?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. We're based in Mauritius and work with businesses here and abroad.</p></details>
        <details><summary><h3>Who does the work?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Our own team, in Mauritius. Local team. Real specialists. No outsourcing.</p></details>
      </div>
    </div>
  </section>

  <section class="sheet lt cta" aria-labelledby="cta-h">
    <p class="kick">Get In Touch</p>
    <h2 class="d1 mt-32" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a></div>
  </section>
</main>`,
  init: function (R) {
    // colonnade: the hovered or focused column opens; on touch the first stays open
    var cols = R.querySelectorAll('.col > a');
    function open(a) { cols.forEach(function (c) { c.classList.toggle('on', c === a); }); }
    cols.forEach(function (a) {
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') open(a); });
      a.addEventListener('focus', function () { open(a); });
    });
  },
};
