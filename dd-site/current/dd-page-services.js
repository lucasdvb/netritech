// Disruptive Dodo · services page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["services"] = {
  path: "/services",
  title: "Marketing services in Mauritius · Disruptive Dodo",
  description: "Websites, social media, Facebook and Google ads, CRM, automation and AI for Mauritian businesses. Take one service, or let us run them all as one system.",
  ld: null,
  css: `.svc-hero .dsp{max-width:13ch}
.svc-hero .btn-row{margin-top:48px}

.capgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:48px var(--gt)}
.capcol{padding-top:24px;border-top:1px solid var(--ls)}
.caplist li{padding:14px 0;border-top:1px solid var(--ln);font-size:17px;line-height:1.45;color:var(--fg)}
.caplist li:last-child{border-bottom:1px solid var(--ln)}

.svc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.svc-grid .svc{min-height:540px}
.svc-grid .svc h3{font-size:clamp(32px,2.8vw,40px)}
@media (max-width:1023px){.svc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:639px){.svc-grid{grid-template-columns:minmax(0,1fr)}.svc-grid .svc{min-height:420px}}

.ways{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gt)}
.way{display:flex;flex-direction:column;padding:40px;border-radius:16px;border:1px solid var(--ls);background:var(--sf2)}
.way .tx{max-width:46ch}
@media (min-width:900px){.way .tx{min-height:5.1em}}
.way ul{margin:32px 0 40px}
.way li{display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid var(--ln);font-size:17px;line-height:1.45;color:var(--fg)}
.way li:last-child{border-bottom:1px solid var(--ln)}
.way li svg{width:16px;height:16px;flex:none;color:var(--acx)}
.way .btn{align-self:flex-start;margin-top:auto}
@media (max-width:899px){.ways{grid-template-columns:minmax(0,1fr)}}
@media (max-width:639px){.way{padding:24px}}

.fl-band-wrap{padding:0 var(--gt) clamp(80px,8.4vw,120px)}
.fl-band{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);align-items:center;gap:var(--gt);overflow:hidden;padding:clamp(28px,4.45vw,64px);border-radius:16px;border:1px solid var(--ls);background:var(--sf)}
.fl-band .tx{max-width:46ch}
.fl-band-art{display:flex;justify-content:center}
.fl-band-dodo{width:100%;max-width:340px;background:transparent}
.fl-band-dodo img{width:128%;max-width:none;height:auto;margin-left:-14%}
@media (max-width:899px){.fl-band{grid-template-columns:minmax(0,1fr)}.fl-band-dodo{max-width:240px}}

.caplist a{text-decoration:none}
.caplist a:hover{text-decoration:underline;text-decoration-color:var(--acx);text-underline-offset:4px}

.how .h2{max-width:14ch}

.faq-head .h2{max-width:16ch}

.cta{text-align:center}
.cta .eb{justify-content:center}
.cta .h2{max-width:18ch;margin-left:auto;margin-right:auto}
.cta .btn-row{justify-content:center}`,
  html: `<main>
  <section class="hero-in svc-hero">
    <p class="eb"><span class="dot"></span>Services</p>
    <h1 class="dsp">One team for every stage of growth.</h1>
    <p class="ld">Six services that get you found, win you the sale, and keep customers coming back. Take one, or let us run them all as one system: Fledge.</p>
    <div class="btn-row">
      <a class="btn btn-a" href="/contact">Book a free growth call</a>
      <a class="btn" href="/work">See our work</a>
    </div>
  </section>

  <section class="fl-band-wrap" aria-labelledby="fl-band-h">
    <div class="fl-band">
      <div class="fl-band-txt">
        <p class="cap">Our signature system</p>
        <h2 class="dsp mt-24" id="fl-band-h">Fledge.</h2>
        <p class="tx mt-32">Your full marketing system: website, social media, ads, CRM, follow-up and AI, built as one and run by one team.</p>
        <div class="btn-row mt-40"><a class="btn btn-a" href="/fledge">Discover Fledge</a></div>
      </div>
      <div class="fl-band-art">
        <div class="dodo fl-band-dodo"><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228"></div>
      </div>
    </div>
  </section>

  <section class="lt panel sec" aria-labelledby="cap-h">
    <p class="eb"><span class="dot"></span>Capabilities</p>
    <h2 class="h2 mt-24" id="cap-h">Four stages, one system.</h2>
    <div class="capgrid mt-64">
      <div class="capcol">
        <p class="cap">(01)</p>
        <h3 class="h3 mt-24">Get Found</h3>
        <p class="sm mt-8">Visibility and demand</p>
        <ul class="caplist mt-32"><li><a href="/services/web-design">Websites</a></li><li><a href="/services/web-design">SEO</a></li><li>Content</li><li><a href="/services/facebook-google-ads">Google ads</a></li><li><a href="/services/facebook-google-ads">Facebook and Instagram ads</a></li><li><a href="/services/social-media-management">Social media</a></li></ul>
      </div>
      <div class="capcol">
        <p class="cap">(02)</p>
        <h3 class="h3 mt-24">Get Chosen</h3>
        <p class="sm mt-8">Brand and websites</p>
        <ul class="caplist mt-32"><li><a href="/services/branding-logo-design">Brand identity</a></li><li>Positioning</li><li><a href="/services/web-design">Websites that turn visitors into enquiries</a></li><li>Reviews and proof</li></ul>
      </div>
      <div class="capcol">
        <p class="cap">(03)</p>
        <h3 class="h3 mt-24">Get The Business</h3>
        <p class="sm mt-8">Capture and convert</p>
        <ul class="caplist mt-32"><li><a href="/services/marketing-automation-crm">Client acquisition systems</a></li><li><a href="/services/marketing-automation-crm">CRM and sales pipeline</a></li><li><a href="/services/marketing-automation-crm">Automated follow-up</a></li><li><a href="/services/ai-chatbots">AI assistant for enquiries</a></li></ul>
      </div>
      <div class="capcol">
        <p class="cap">(04)</p>
        <h3 class="h3 mt-24">Keep &amp; Grow</h3>
        <p class="sm mt-8">Retain and refer</p>
        <ul class="caplist mt-32"><li><a href="/services/social-media-management">Social media and content</a></li><li>Review requests</li><li>Repeat business</li><li><a href="/services/marketing-automation-crm">Automation of repetitive work</a></li></ul>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="build-h">
    <p class="eb eba">What We Build</p>
    <h2 class="h2 mt-24" id="build-h" style="max-width:20ch">Everything you need to grow, under one roof</h2>
    <div class="svc-grid mt-64">
      <a class="svc" href="/services/web-design">
        <img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684">
        <div><p class="idx">01 · Websites and SEO</p><h3>Get Found.<br>Get Chosen.</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/social-media-management">
        <img class="cov" src="/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp" alt="" width="960" height="684">
        <div><p class="idx">02 · Social media</p><h3>Stay Top<br>of Mind.</h3><p class="sub">Social media and content that keep your brand visible, trusted, and relevant.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/facebook-google-ads">
        <img class="cov" src="/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp" alt="" width="960" height="684">
        <div><p class="idx">03 · Paid ads</p><h3>Get More<br>Customers.</h3><p class="sub">Facebook, Instagram and Google ads that turn attention into enquiries.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/marketing-automation-crm">
        <img class="cov" src="/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp" alt="" width="960" height="684">
        <div><p class="idx">04 · Automation and CRM</p><h3>Grow Without<br>Growing Your Team.</h3><p class="sub">CRM, follow-up and automation, so you handle more enquiries without hiring more people.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/ai-chatbots">
        <img class="cov" src="/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp" alt="" width="960" height="684">
        <div><p class="idx">05 · AI implementation</p><h3>Answer Every<br>Message.</h3><p class="sub">AI assistants that reply to your customers on WhatsApp and your website, day and night.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/branding-logo-design">
        <img class="cov" src="/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp" alt="" width="960" height="684">
        <div><p class="idx">06 · Branding</p><h3>Look Like<br>the Leader.</h3><p class="sub">Branding that makes your business stand out, build trust, and get remembered.</p></div>
        <div class="disc"><span>Discover</span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
    </div>
  </section>

  <section class="panel on-sf sec" aria-labelledby="ways-h">
    <p class="eb"><span class="dot"></span>Ways to work with us</p>
    <h2 class="h2 mt-24" id="ways-h">Two ways to work with us.</h2>
    <div class="ways mt-64">
      <article class="way">
        <p class="cap">(01) A project</p>
        <h3 class="h3 mt-24">Build it once, properly.</h3>
        <p class="tx mt-16">One clear piece of work: a website, a brand, a CRM, a set of automations. We agree the scope and the price before we start, then we deliver it. Every project plugs into Fledge later, so nothing is built twice.</p>
        <ul>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Fixed scope</li>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Price agreed up front</li>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="todo">[Typical timeline, to confirm]</span></li>
        </ul>
        <a class="btn" href="/contact">Ask about a project</a>
      </article>
      <article class="way">
        <p class="cap">(02) Fledge, the full system</p>
        <h3 class="h3 mt-24">Grow with us every month.</h3>
        <p class="tx mt-16">We build your full marketing system, then run it with you: content, ads, follow-up and reporting. A setup fee, then a monthly fee.</p>
        <ul>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Setup, then monthly</li>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Minimum term: <span class="todo">[3 months, to confirm]</span></span></li>
          <li><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>A report every month</li>
        </ul>
        <a class="btn btn-a" href="/fledge">Discover Fledge</a>
      </article>
    </div>
  </section>

  <section class="sec how" aria-labelledby="how-h">
    <div class="g12">
      <div class="span-6">
        <p class="eb"><span class="dot"></span>How we work</p>
        <h2 class="h2 mt-24" id="how-h">How every project runs.</h2>
      </div>
      <ol class="span-6">
        <li class="principle"><span class="idx">01</span><div><h3>We find what's holding you back</h3><p>Before we recommend anything, we look at your marketing, sales, systems, and operations to find where growth is getting stuck.</p></div></li>
        <li class="principle"><span class="idx">02</span><div><h3>We fix the biggest problem first</h3><p>You don't need everything at once. We focus on the changes that can make the biggest difference to your business.</p></div></li>
        <li class="principle"><span class="idx">03</span><div><h3>We build for growth</h3><p>From websites and client acquisition to CRM, automation, and AI, we build systems that work together as your business grows.</p></div></li>
        <li class="principle"><span class="idx">04</span><div><h3>We measure what matters</h3><p>More enquiries. More sales. Less wasted time. Better systems. We focus on the numbers that actually move your business forward.</p></div></li>
      </ol>
    </div>
  </section>

  <section class="lt panel sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="span-5 faq-head">
        <p class="eb"><span class="dot"></span>Questions</p>
        <h2 class="h2 mt-24" id="faq-h">Good questions. Straight answers.</h2>
      </div>
      <div class="span-6 from-7 faq">
        <details open><summary><h3>How fast do you reply?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Within one business hour, by email or WhatsApp.</p></details>
        <details><summary><h3>Do I need all six services?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. Take one, or let us run them all as one system with Fledge. We start with the problem that costs you the most.</p></details>
        <details><summary><h3>How much does it cost?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">It depends on what you need. After a free growth call, we send a clear proposal with the price before any work starts.</p></details>
        <details><summary><h3>Do you work in French?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We work in English and French.</p></details>
        <details><summary><h3>Do you only work with businesses in Mauritius?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. We're based in Mauritius and work with businesses here and abroad.</p></details>
        <details><summary><h3>Who does the work?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Our own team, in Mauritius. Local team. Real specialists. No outsourcing.</p></details>
      </div>
    </div>
  </section>

  <section class="sec cta" aria-labelledby="cta-h">
    <p class="eb eba">Get In Touch</p>
    <h2 class="h2 mt-24" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-a" href="/contact">Book a free growth call</a></div>
  </section>
</main>`,
};
DD.current = "services";
if (DD.mount) DD.mount();
