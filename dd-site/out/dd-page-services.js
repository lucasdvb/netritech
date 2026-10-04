// Disruptive Dodo · services page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["services"] = {
  path: "/services",
  title: "Marketing services in Mauritius · Disruptive Dodo",
  description: "Websites, social media, Facebook and Google ads, CRM, automation and AI for Mauritian businesses. Take one service, or let us run them all as one system.",
  ld: null,
  css: `.svh .d1{max-width:13ch}
.col{display:flex;gap:10px;height:clamp(520px,44vw,640px)}
.col>a{position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;justify-content:space-between;padding:24px;border-radius:var(--r3);overflow:hidden;isolation:isolate;color:#f3f1ea;background:#0b0b0d;box-shadow:var(--sh1);transition:flex-grow .9s var(--e),box-shadow .7s var(--e)}
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
@media (max-width:1023px){.col{flex-direction:column;height:auto}
.col>a,.col>a.on{flex:none;min-height:300px}
.col .bd{opacity:1;transform:none}
.col .vl{display:none}
}
.fband{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px var(--gap);align-items:center;padding:clamp(28px,5vw,80px);border-radius:var(--rx);background:#0b0b0d;border:1px solid var(--ln);box-shadow:var(--sh2);overflow:hidden;position:relative;isolation:isolate}
.fband::before{content:"";position:absolute;right:-10%;bottom:-30%;width:70%;height:120%;background:radial-gradient(closest-side,rgba(215,213,205,.18),transparent);z-index:-1}
.fband .t{grid-column:1/-1}
.fband .art{grid-column:1/-1}
@media (min-width:1024px){.fband .t{grid-column:1/span 6}
.fband .art{grid-column:8/-1}
}
.fband .mega{font-size:clamp(96px,13vw,210px)}
.fband .art{position:relative;display:grid;place-items:center;min-height:clamp(340px,34vw,500px)}
.fband .art img{position:relative;z-index:1;width:min(340px,62%);margin-inline:auto;filter:drop-shadow(0 40px 60px rgba(0,0,0,.6))}
.orb-wrap{position:absolute;left:50%;top:58%;width:0;height:0;transform:scaleY(.36)}
.orb{position:absolute;left:0;top:0;width:0;height:0}
.orb .trk{position:absolute;left:calc(var(--R) * -1);top:calc(var(--R) * -1);width:calc(var(--R) * 2);height:calc(var(--R) * 2);border-radius:50%;border:1px dashed rgba(243,241,234,.18)}
.orb-wrap{--R:clamp(150px,17vw,250px)}
.oc{position:absolute;left:0;top:0;transform:rotate(var(--a)) translateX(var(--R)) rotate(calc(var(--a) * -1))}
.oi{display:block;transform:scaleY(2.78)}
.oi .chip{transform:translate(-50%,-50%);background:rgba(18,18,21,.75);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-color:rgba(243,241,234,.18);color:#f3f1ea;font-size:12.5px;height:32px}
.stack .st{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px var(--gap);min-height:clamp(340px,30vw,420px);padding:clamp(26px,3.4vw,52px);border-radius:var(--r3)}
.stack .st:nth-child(even){background:#0c0c0e;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;--ln:rgba(243,241,234,.12);border-color:transparent}
.stack .st .a{grid-column:1/-1}
.stack .st .b{grid-column:1/-1}
@media (min-width:1024px){.stack .st .a{grid-column:1/span 5}
.stack .st .b{grid-column:7/-1}
}
.stack .h3{font-size:clamp(34px,3.6vw,58px);letter-spacing:-.04em}
.caplist{display:grid;grid-template-columns:1fr 1fr;gap:0 var(--gap);border-top:1px solid var(--ln)}
.caplist li{border-bottom:1px solid var(--ln)}
.caplist a,.caplist span{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 0;font-size:16px}
.caplist span{color:var(--mu)}
.caplist a .ar{width:10px;height:10px;opacity:.5;transition:transform .5s var(--e),opacity .3s}
.caplist a:hover .ar{opacity:1;transform:translate(2px,-2px)}
@media (max-width:639px){.caplist{grid-template-columns:1fr}
}
.ways{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.way{display:flex;flex-direction:column;padding:clamp(28px,3.4vw,52px);border-radius:var(--r3)}
.way ul{margin:32px 0 40px;border-top:1px solid var(--ln)}
.way li{display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--ln);font-size:16px}
.way .ck{width:16px;height:16px;flex:none}
.way .btn{margin-top:auto;align-self:flex-start}
.way.inv{background:#f3f1ea;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;--ln:rgba(12,12,14,.12);--ls:rgba(12,12,14,.24);--inv:#0c0c0e;--inv-fg:#f3f1ea;border-color:transparent}
@media (max-width:1023px){.ways{grid-template-columns:1fr}
}`,
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
    <div class="col mt-64" data-r="u">
      <a href="/services/web-design" class="on"><img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">01 · Websites and SEO</p><span class="vl" aria-hidden="true">Websites and SEO</span>
        <div class="bd"><h3>Get Found.<br>Get Chosen.</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
      <a href="/services/social-media-management" class=""><img class="cov" src="/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">02 · Social media</p><span class="vl" aria-hidden="true">Social media</span>
        <div class="bd"><h3>Stay Top<br>of Mind.</h3><p class="sub">Social media and content that keep your brand visible, trusted, and relevant.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
      <a href="/services/facebook-google-ads" class=""><img class="cov" src="/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">03 · Paid ads</p><span class="vl" aria-hidden="true">Paid ads</span>
        <div class="bd"><h3>Get More<br>Customers.</h3><p class="sub">Facebook, Instagram and Google ads that turn attention into enquiries.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
      <a href="/services/marketing-automation-crm" class=""><img class="cov" src="/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">04 · Automation and CRM</p><span class="vl" aria-hidden="true">Automation and CRM</span>
        <div class="bd"><h3>Grow Without<br>Growing Your Team.</h3><p class="sub">CRM, follow-up and automation, so you handle more enquiries without hiring more people.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
      <a href="/services/ai-chatbots" class=""><img class="cov" src="/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">05 · AI implementation</p><span class="vl" aria-hidden="true">AI implementation</span>
        <div class="bd"><h3>Answer Every<br>Message.</h3><p class="sub">AI assistants that reply to your customers on WhatsApp and your website, day and night.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
      <a href="/services/branding-logo-design" class=""><img class="cov" src="/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp" alt="" width="960" height="684" loading="lazy">
        <p class="idx">06 · Branding</p><span class="vl" aria-hidden="true">Branding</span>
        <div class="bd"><h3>Look Like<br>the Leader.</h3><p class="sub">Branding that makes your business stand out, build trust, and get remembered.</p><div class="disc"><span class="ring">{{ar}}</span><span>Discover</span></div></div></a>
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
      <div class="art"><div class="orb-wrap" aria-hidden="true"><div class="orb"><i class="trk"></i><span class="oc" style="--a:0deg"><span class="oi"><span class="chip">Websites and SEO</span></span></span><span class="oc" style="--a:60deg"><span class="oi"><span class="chip">Social media</span></span></span><span class="oc" style="--a:120deg"><span class="oi"><span class="chip">Paid ads</span></span></span><span class="oc" style="--a:180deg"><span class="oi"><span class="chip">Automation and CRM</span></span></span><span class="oc" style="--a:240deg"><span class="oi"><span class="chip">AI implementation</span></span></span><span class="oc" style="--a:300deg"><span class="oi"><span class="chip">Branding</span></span></span></div></div><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228" loading="lazy"></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="cap-h">
    <div class="head"><div><p class="kick">Capabilities</p><h2 class="h2 mt-24" id="cap-h">Four stages, one system.</h2></div></div>
    <div class="stack mt-64">
      <article class="st card" style="--i:0">
        <div class="a"><p class="cap">(01)</p><h3 class="h3 mt-24">Get Found</h3><p class="sm mt-8">Visibility and demand</p></div>
        <ul class="caplist b"><li><a href="/services/web-design">Websites{{ar}}</a></li><li><a href="/services/web-design">SEO{{ar}}</a></li><li><span>Content</span></li><li><a href="/services/facebook-google-ads">Google ads{{ar}}</a></li><li><a href="/services/facebook-google-ads">Facebook and Instagram ads{{ar}}</a></li><li><a href="/services/social-media-management">Social media{{ar}}</a></li></ul>
      </article>
      <article class="st card" style="--i:1">
        <div class="a"><p class="cap">(02)</p><h3 class="h3 mt-24">Get Chosen</h3><p class="sm mt-8">Brand and websites</p></div>
        <ul class="caplist b"><li><a href="/services/branding-logo-design">Brand identity{{ar}}</a></li><li><span>Positioning</span></li><li><a href="/services/web-design">Websites that turn visitors into enquiries{{ar}}</a></li><li><span>Reviews and proof</span></li></ul>
      </article>
      <article class="st card" style="--i:2">
        <div class="a"><p class="cap">(03)</p><h3 class="h3 mt-24">Get The Business</h3><p class="sm mt-8">Capture and convert</p></div>
        <ul class="caplist b"><li><a href="/services/marketing-automation-crm">Client acquisition systems{{ar}}</a></li><li><a href="/services/marketing-automation-crm">CRM and sales pipeline{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Automated follow-up{{ar}}</a></li><li><a href="/services/ai-chatbots">AI assistant for enquiries{{ar}}</a></li></ul>
      </article>
      <article class="st card" style="--i:3">
        <div class="a"><p class="cap">(04)</p><h3 class="h3 mt-24">Keep &amp; Grow</h3><p class="sm mt-8">Retain and refer</p></div>
        <ul class="caplist b"><li><a href="/services/social-media-management">Social media and content{{ar}}</a></li><li><span>Review requests</span></li><li><span>Repeat business</span></li><li><a href="/services/marketing-automation-crm">Automation of repetitive work{{ar}}</a></li></ul>
      </article>
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
  // Live motion: looping scenes played by dd-core's motion engine (see motion()).
  motion: [
 {
  "root": ".fband",
  "D": 48000,
  "still": 0.04,
  "tracks": [
   [
    ".orb",
    0,
    [
     [
      0,
      48000,
      {
       "transform": "rotate(0deg)"
      },
      {
       "transform": "rotate(360deg)"
      },
      "l"
     ]
    ]
   ],
   [
    ".oi",
    0,
    [
     [
      0,
      48000,
      {
       "transform": "rotate(0deg) scaleY(2.78)"
      },
      {
       "transform": "rotate(-360deg) scaleY(2.78)"
      },
      "l"
     ]
    ]
   ]
  ]
 }
],
  // Hero gradient: GetLayers "reeded", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: {"bgColor":"#08080a","colorA":"#1f1f1e","colorB":"#575754","colorC":"#84837f","colorD":"#e5e3dc"}, poster: "", mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#0e0722",
  colorA: "#2a1046",
  colorB: "#6b2bc8",
  colorC: "#e02bc8",
  colorD: "#fbd2f2",
  scale: .85,
  speed: .33,
  angle: -1.65,
  pitch: 7.2,
  taper: .42,
  facet: .1,
  bow: .16,
  bowScale: 1.1,
  bowStretch: .24,
  drift: .42,
  lightAim: .2,
  sweep: .62,
  polish: 11,
  second: .18,
  aa: 170,
  ambient: .07,
  gleam: .8,
  veil: .12,
  veilScale: 1.4,
  veilStretch: .26,
  tilt: -.25,
  horizon: -.1,
  spread: 1.85,
  falloff: 1.5,
  lightGrad: .96,
  contrast: 1.35,
  midpoint: .52,
  sink: .2,
  glow: .28,
  grain: 0,
  grainAnim: 0,
  dither: 1.15,
  vignette: .2,
  cursor: 1,
  pointerRadius: .5,
  pointerSwing: .3,
  pointerLift: .14,
  parallax: .003,
  maxDpr: 1
 };
 Object.assign(CONFIG, __ovr || {});
 function hexToVec3(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [ (n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255 ];
 }
 const gl = canvas.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance"
 });
 if (!gl) return null;
 const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
 const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uAngle, uPitch, uTaper, uFacet;
uniform float uBow, uBowScale, uBowStretch, uDrift;
uniform float uLightAim, uSweep, uPolish, uSecond, uAA, uAmbient, uGleam;
uniform float uVeil, uVeilScale, uVeilStretch;
uniform float uTilt, uHorizon, uSpread, uFalloff, uLightGrad;
uniform float uContrast, uMidpoint, uSink, uGlow;
uniform float uGrain, uDither, uVignette;
uniform float uPointerRadius, uPointerSwing, uPointerLift, uParallax;
#define OCTAVES 4
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec2 p) {
  const float K1 = 0.366025404, K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += amp * snoise(p);
    p *= 2.02;
    amp *= 0.52;
  }
  return v;
}
vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
uniform float uGrainAnim;
float houseGrain(vec2 fc) {
  uvec2 q = uvec2(fc) * uvec2(1597334677u, 3812015801u)
          + uint(floor(iTime * 24.0 * uGrainAnim)) * 2654435769u;
  uint n = q.x ^ q.y; n = n * 1664525u + 1013904223u; n ^= n >> 16u; n *= 2246822519u; n ^= n >> 13u;
  float a = float(n & 0xffffu) / 65535.0;
  n *= 3266489917u; n ^= n >> 16u;
  float b = float(n & 0xffffu) / 65535.0;
  return a + b - 1.0;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 p = (uv - iMouse * uParallax) * uScale;
  vec2 md = uv - iMouse;
  float near = exp(-dot(md, md) / max(1e-4, uPointerRadius * uPointerRadius));
  float ang = uAngle + near * uPointerSwing;
  vec2 ax = vec2(cos(ang), sin(ang));
  vec2 al = vec2(-ax.y, ax.x);
  float s = dot(p, ax);
  float l = dot(p, al);
  float bow = fbm(vec2(s * uBowScale, l * uBowScale * uBowStretch + t * uDrift));
  s += bow * uBow;
  float ph = uPitch * (s + uTaper * s * s);
  float sw  = sin(6.2831853 * ph);
  float tri = 0.6366198 * asin(clamp(sw, -1.0, 1.0));
  float slope = mix(sw, tri, uFacet);
  float sd = fwidth(slope);
  float polish = uPolish / (1.0 + uPolish * sd * sd * uAA);
  float aim = uLightAim + sin(t * 0.70) * uSweep;
  float m1 = slope - aim;
  float m2 = slope + aim * 0.60;
  float spec = exp(-m1 * m1 * polish) + uSecond * exp(-m2 * m2 * polish * 0.30);
  float veil = fbm(vec2(s * uVeilScale, l * uVeilScale * uVeilStretch - t * 0.22));
  float axis = dot(uv, vec2(-sin(uTilt), cos(uTilt)));
  float alt = clamp(0.5 + (axis - uHorizon) * uSpread, 0.0, 1.0);
  alt = pow(alt, uFalloff);
  float f = uAmbient + spec * uGleam;
  f *= mix(1.0, alt, uLightGrad);
  f += veil * uVeil;
  f += near * uPointerLift;
  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(f);
  col += uColorD * uGlow * pow(f, 4.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), f) * 0.90 + 0.10);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
 function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
 }
 const program = gl.createProgram();
 gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
 gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
 gl.linkProgram(program);
 if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 gl.bindVertexArray(gl.createVertexArray());
 const LOC = {};
 const loc = n => n in LOC ? LOC[n] : LOC[n] = gl.getUniformLocation(program, n);
 const u1f = (n, v) => gl.uniform1f(loc(n), v);
 const u2f = (n, x, y) => gl.uniform2f(loc(n), x, y);
 const u3c = (n, hex) => {
  const c = hexToVec3(hex);
  gl.uniform3f(loc(n), c[0], c[1], c[2]);
 };
 function applyConfig() {
  gl.useProgram(program);
  u3c("uBg", CONFIG.bgColor);
  u3c("uColorA", CONFIG.colorA);
  u3c("uColorB", CONFIG.colorB);
  u3c("uColorC", CONFIG.colorC);
  u3c("uColorD", CONFIG.colorD);
  u1f("uScale", CONFIG.scale);
  u1f("uSpeed", CONFIG.speed);
  u1f("uAngle", CONFIG.angle);
  u1f("uPitch", CONFIG.pitch);
  u1f("uTaper", CONFIG.taper);
  u1f("uFacet", CONFIG.facet);
  u1f("uBow", CONFIG.bow);
  u1f("uBowScale", CONFIG.bowScale);
  u1f("uBowStretch", CONFIG.bowStretch);
  u1f("uDrift", CONFIG.drift);
  u1f("uLightAim", CONFIG.lightAim);
  u1f("uSweep", CONFIG.sweep);
  u1f("uPolish", CONFIG.polish);
  u1f("uSecond", CONFIG.second);
  u1f("uAA", CONFIG.aa);
  u1f("uAmbient", CONFIG.ambient);
  u1f("uGleam", CONFIG.gleam);
  u1f("uVeil", CONFIG.veil);
  u1f("uVeilScale", CONFIG.veilScale);
  u1f("uVeilStretch", CONFIG.veilStretch);
  u1f("uTilt", CONFIG.tilt);
  u1f("uHorizon", CONFIG.horizon);
  u1f("uSpread", CONFIG.spread);
  u1f("uFalloff", CONFIG.falloff);
  u1f("uLightGrad", CONFIG.lightGrad);
  u1f("uContrast", CONFIG.contrast);
  u1f("uMidpoint", CONFIG.midpoint);
  u1f("uSink", CONFIG.sink);
  u1f("uGlow", CONFIG.glow);
  u1f("uGrain", CONFIG.grain);
  u1f("uGrainAnim", CONFIG.grainAnim);
  u1f("uDither", CONFIG.dither);
  u1f("uVignette", CONFIG.vignette);
  u1f("uPointerRadius", CONFIG.pointerRadius);
  u1f("uPointerSwing", CONFIG.pointerSwing);
  u1f("uPointerLift", CONFIG.pointerLift);
  u1f("uParallax", CONFIG.parallax);
  resize();
 }
 let dpr = 1;
 function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
  const w = Math.max(1, Math.round(__W() * dpr));
  const h = Math.max(1, Math.round(__H() * dpr));
  if (canvas.width !== w || canvas.height !== h) {
   canvas.width = w;
   canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  gl.useProgram(program);
  u2f("iResolution", w, h);
 }
 let resizeQueued = false;
 addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
   resizeQueued = false;
   resize();
  });
 }, {
  passive: true
 });
 const mouse = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  tx: 0,
  ty: 0
 };
 const SPRING_K = .02, SPRING_C = .205;
 const aim = e => {
  const a = __W() / __H();
  mouse.tx = ((e.clientX - __R().left) / __W() - .5) * a;
  mouse.ty = .5 - (e.clientY - __R().top) / __H();
 };
 addEventListener("pointermove", aim, {
  passive: true
 });
 addEventListener("pointerdown", aim, {
  passive: true
 });
 const fadeEl = __dummy;
 const fpsEl = __dummy;
 let visible = true;
 new IntersectionObserver(es => {
  visible = es[0].isIntersecting;
 }, {
  threshold: 0
 }).observe(canvas);
 const t0 = performance.now();
 let prevT = t0, clock = 0, fpsT = t0, fpsN = 0;
 function frame(now) {
  requestAnimationFrame(frame);
  const raw = now - prevT;
  prevT = now;
  if (!visible || document.hidden) return;
  const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw;
  const s = ms > 36.7 ? 2.2 : ms * .06;
  clock += ms * .001;
  mouse.vx += ((mouse.tx - mouse.x) * SPRING_K - mouse.vx * SPRING_C) * s;
  mouse.vy += ((mouse.ty - mouse.y) * SPRING_K - mouse.vy * SPRING_C) * s;
  mouse.x += mouse.vx * s;
  mouse.y += mouse.vy * s;
  u1f("iTime", clock);
  if (mouse.rest === undefined) mouse.rest = {
   x: mouse.tx,
   y: mouse.ty
  };
  if (!CONFIG.cursor) {
   mouse.tx = mouse.rest.x;
   mouse.ty = mouse.rest.y;
  }
  u2f("iMouse", mouse.x, mouse.y);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  fpsN++;
  if (now - fpsT > 500) {
   fpsEl.textContent = Math.round(fpsN * 1e3 / (now - fpsT)) + " fps · " + dpr.toFixed(1) + "×";
   fpsT = now;
   fpsN = 0;
  }
 }
 applyConfig();
 gl.drawArrays(gl.TRIANGLES, 0, 3);
 fadeEl.style.opacity = 0;
 new ResizeObserver(() => resize()).observe(canvas);
 if (__opts && __opts.still) {
  gl.useProgram(program);
  u1f("iTime", __opts.t || 6);
  u1f("iIntro", 1);
  u2f("iMouse", 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
 } else requestAnimationFrame(frame);
 return {
  gl: gl
 };
} },
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
DD.current = "services";
if (DD.mount) DD.mount();
