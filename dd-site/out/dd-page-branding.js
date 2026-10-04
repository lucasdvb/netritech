// Disruptive Dodo · branding page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["branding"] = {
  path: "/services/branding-logo-design",
  title: "Branding and logo design in Mauritius · Disruptive Dodo",
  description: "Branding for Mauritian businesses: three logo and colour options, typography, a simple brand book and every file you need, designed by our own team.",
  section: "services",
  ld: {
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": "Service",
   "@id": "https://disruptivedodo.mu/services/branding-logo-design#service",
   "name": "Branding",
   "serviceType": "Branding and logo design",
   "description": "Branding for Mauritian businesses: three logo and colour options, typography, a simple brand book and every file you need, designed by our own team.",
   "inLanguage": "en",
   "areaServed": {
    "@type": "Country",
    "name": "Mauritius"
   },
   "provider": {
    "@type": "Organization",
    "name": "Disruptive Dodo",
    "url": "https://disruptivedodo.mu/"
   },
   "url": "https://disruptivedodo.mu/services/branding-logo-design",
   "isRelatedTo": {
    "@type": "Service",
    "name": "Fledge",
    "url": "https://disruptivedodo.mu/fledge"
   }
  },
  {
   "@type": "BreadcrumbList",
   "itemListElement": [
    {
     "@type": "ListItem",
     "position": 1,
     "name": "Home",
     "item": "https://disruptivedodo.mu/"
    },
    {
     "@type": "ListItem",
     "position": 2,
     "name": "Services",
     "item": "https://disruptivedodo.mu/services"
    },
    {
     "@type": "ListItem",
     "position": 3,
     "name": "Branding",
     "item": "https://disruptivedodo.mu/services/branding-logo-design"
    }
   ]
  },
  {
   "@type": "FAQPage",
   "mainEntity": [
    {
     "@type": "Question",
     "name": "How much does a logo cost in Mauritius?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "It depends on what you need: a logo alone, or a full identity with colours, typography and a brand book. After a free growth call, we send a fixed price before any work starts."
     }
    },
    {
     "@type": "Question",
     "name": "How long does branding take?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "[About 3 to 4 weeks from the first call to the final files, to confirm.] We agree the dates with you before we start."
     }
    },
    {
     "@type": "Question",
     "name": "Do you help choose a business name?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "No. The name is yours: you choose it and you register it. We start from it and design everything around it."
     }
    },
    {
     "@type": "Question",
     "name": "Who owns the logo and the files?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "[You do. Once the project is paid, the logo and every file are yours. To confirm.]"
     }
    },
    {
     "@type": "Question",
     "name": "How many changes can I ask for?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Number of rounds of changes, to confirm.] We agree it before we start, and we ask the right questions first so the options are close from the start."
     }
    },
    {
     "@type": "Question",
     "name": "Can you refresh our existing brand?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. We keep what your customers already recognise and modernise the rest, so you look current without starting from zero."
     }
    },
    {
     "@type": "Question",
     "name": "What files will I get?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your logo in colour, black and white, as vector files for print and PNG files for screens, the colour codes for print and screen, and your brand book as a PDF."
     }
    },
    {
     "@type": "Question",
     "name": "Is branding worth it for a small business?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "A clear look that stays the same everywhere makes a small business look established, and it is often the first thing customers judge. It also makes every post, ad and page look like it comes from the same place."
     }
    }
   ]
  }
 ]
},
  css: `.sp-part{display:flex;flex-wrap:wrap;align-items:center;gap:10px;color:rgba(243,241,234,.6)}
.sp-part .cap{color:inherit}
.sp-part .tag{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#f3f1ea;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sp-part:hover .tag{border-color:rgba(255,255,255,.3)}
.sp-ban{margin-bottom:clamp(64px,8vw,120px)}
.flc{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px var(--gap);padding:clamp(28px,4vw,64px);border-radius:var(--rx);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh2);position:relative;overflow:hidden;isolation:isolate}
.flc>*{grid-column:1/-1}
@media (min-width:1024px){.flc .a{grid-column:1/span 5}
.flc .b{grid-column:7/-1}
}
.flc::before{content:"";position:absolute;inset:auto -10% -40% 30%;height:80%;background:radial-gradient(closest-side,rgba(215,213,205,.12),transparent);z-index:-1}
.flc .kick{color:var(--fg)}
.stg{display:grid;gap:10px}
.stg>li{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;border-radius:16px;border:1px solid var(--ln);background:var(--card2);color:var(--mu)}
.stg .n{font-size:13px}
.stg .nm{font-size:18px;color:var(--fg);letter-spacing:-.01em}
.stg .lnn{font-size:14px;margin-top:2px}
.stg>li.on{background:var(--inv);color:#62615b;border-color:transparent;--fg:var(--inv-fg)}
.stg .this{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;white-space:nowrap;color:var(--fg)}
.stg .this::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
@media (max-width:639px){.stg>li{grid-template-columns:32px minmax(0,1fr)}
.stg .this{grid-column:2}
}
.pcard{display:block;padding:12px;border-radius:var(--r3)}
.pcard .ph{border-radius:20px;box-shadow:none}
.pcard .row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:20px 12px 8px}
.pcard .tx{padding:0 12px 10px}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.tiles>li{aspect-ratio:1/1.08;display:flex;flex-direction:column;justify-content:space-between;padding:26px;transition:background .6s var(--e),color .6s var(--e),transform .7s var(--e),box-shadow .7s var(--e)}
.tn{font-size:clamp(72px,7.4vw,128px);font-weight:var(--w-dsp);letter-spacing:-.07em;line-height:.8;color:var(--fg)}
.tiles>li:hover{background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b}
@media (max-width:1023px){.tiles{grid-template-columns:1fr 1fr}
}
@media (max-width:639px){.tiles{grid-template-columns:1fr}
.tiles>li{aspect-ratio:auto;min-height:260px}
}`,
  html: `<main>
  <section class="hero">
    <div class="hero-bg shade"></div>
    <div class="hero-grid">
      <div class="hl">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/services">Services</a></li><li aria-current="page">Branding</li></ol></nav>
        <p class="kick mt-48">Branding · Mauritius</p>
        <h1 class="d1 mt-24">Branding and logo design in Mauritius that makes you look like the leader.</h1>
      </div>
      <div class="hr">
        <p class="lead">People judge a business in seconds, often before they read a word. We design your logo, your colours, your type and the rules to use them, so your business looks as good as the work you do, everywhere it shows up.</p>
        <div class="btn-row mt-32"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/fledge">See Fledge, the full system</a></div>
        <a class="sp-part mt-32" href="/fledge"><span class="cap">Part of Fledge ·</span><span class="tags"><span class="tag">Stage 02 · Get Chosen</span></span></a>
      </div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="plain-h">
    <div class="sp-ban"><div class="ph r21x9" data-r="x"><div class="lb"><b>Brand in use</b><span>A brand we designed: logo, colours and pages side by side</span><i>21:9</i></div></div></div>
    <div class="g12">
      <div class="c1-5"><p class="kick">In plain terms</p><h2 class="h2 mt-24" id="plain-h">What you get, in plain terms.</h2></div>
      <p class="lead fg c7-12">You bring the name and tell us about your business. We design three logo and colour options, you pick one, and we turn it into a full identity: logo, colours, typography and a simple brand book that shows how to use them. Then you get every file you need, for screens and for print.</p>
    </div>
    <dl class="facts mt-96" data-r="s"><div><dt class="cap">Who it's for</dt><dd>New businesses that need a look, and businesses whose look no longer matches the work they do.</dd></div><div><dt class="cap">What you get</dt><dd>Three logo and colour options, the final logo in every format, colours, typography, a simple brand book.</dd></div><div><dt class="cap">How long it takes</dt><dd><span class="todo">[About 3 to 4 weeks from the first call to the final files, to confirm]</span></dd></div><div><dt class="cap">How you pay</dt><dd>A fixed price agreed before we start.</dd></div></dl>
  </section>

  <section class="sheet dk sec" aria-labelledby="sf-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><h2 class="d2" id="sf-h">Sound familiar?</h2></div></div>
      <ol class="qlist c5-12"><li data-r="u"><span class="n">01</span><p>"We made our logo ourselves when we started. It shows."</p></li><li data-r="u"><span class="n">02</span><p>"Our website, our Facebook page and our van look like three different businesses."</p></li><li data-r="u"><span class="n">03</span><p>"Bigger competitors look more trustworthy than us, even when our work is better."</p></li><li data-r="u"><span class="n">04</span><p>"Every time we need a flyer, someone guesses the colours."</p></li></ol>
    </div>
  </section>

  <section class="sheet sf sec inc-tiles" aria-labelledby="inc-h">
    <div class="head"><div><p class="kick">What's included</p><h2 class="h2 mt-24" id="inc-h" style="max-width:18ch">What's in a Disruptive Dodo brand.</h2></div></div>
    <ol class="tiles mt-64" data-r="s">
      <li class="card lift"><p class="tn">01</p><div><h3 class="h4">A discovery call</h3><p class="tx mt-12">We ask about your business, your customers, the tone you want and the brands you like or don't. Everything we design starts from your answers.</p></div></li>
      <li class="card lift"><p class="tn">02</p><div><h3 class="h4">Three logo and colour options</h3><p class="tx mt-12">Three different directions, each with its logo and colour palette, shown in use. You pick the one that feels like your business.</p></div></li>
      <li class="card lift"><p class="tn">03</p><div><h3 class="h4">Refined with you</h3><p class="tx mt-12">We refine the direction you chose with your feedback, until the logo works small on a phone and large on a sign.</p></div></li>
      <li class="card lift"><p class="tn">04</p><div><h3 class="h4">Colours and typography</h3><p class="tx mt-12">A palette and a set of fonts that work together on screens and in print, with the codes your printer and your web team need.</p></div></li>
      <li class="card lift"><p class="tn">05</p><div><h3 class="h4">A simple brand book</h3><p class="tx mt-12">A short guide that shows how to use your logo, colours and type, and what to avoid, so everyone who works on your brand gets it right.</p></div></li>
      <li class="card lift"><p class="tn">06</p><div><h3 class="h4">How your brand speaks</h3><p class="tx mt-12">A few clear rules for your words: your tone, the languages you use, and the phrases that sound like you.</p></div></li>
      <li class="card lift"><p class="tn">07</p><div><h3 class="h4">Every file you need</h3><p class="tx mt-12">Your logo in every version: colour, black and white, for screens and for print, ready to send to a printer or a web designer.</p></div></li>
      <li class="card lift"><p class="tn">08</p><div><h3 class="h4">Your brand in use</h3><p class="tx mt-12">Your new look applied to your social media profiles and the documents you use every day. <span class="todo">[Business cards, email signature, signage and packaging, to confirm]</span></p></div></li>
    </ol>
  </section>

  <section class="sheet lt sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">How it works</p><h2 class="h2 mt-24" id="how-h" style="max-width:12ch">How we build your brand.</h2></div></div>
      <ol class="steps c7-12"><li data-r="u"><span class="i">01</span><div><h3>You bring the name</h3><p>You choose your business name and register it. We start from it and design everything around it.</p></div></li><li data-r="u"><span class="i">02</span><div><h3>We listen first</h3><p>A discovery call about your business, your customers, your competitors and the look you want.</p></div></li><li data-r="u"><span class="i">03</span><div><h3>Three directions</h3><p>We design three logo and colour options and show each one in use, on a phone, a sign and a page.</p></div></li><li data-r="u"><span class="i">04</span><div><h3>You choose, we refine</h3><p>You pick one direction. We refine it with you until it's right.</p></div></li><li data-r="u"><span class="i">05</span><div><h3>We hand it over</h3><p>The final logo, colours, typography, brand book and every file, ready to use.</p></div></li></ol>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="choose-h">
    <div class="head"><div><p class="kick">Before you choose</p><h2 class="h2 mt-24" id="choose-h" style="max-width:20ch">How to choose a branding agency in Mauritius.</h2></div></div>
    <ol class="rows hov mt-64"><li data-r="u"><span class="n">(01)</span><h3 class="h3 t">Ask how they start</h3><p class="tx b">A good agency asks about your business and your customers before it draws anything. A logo made without questions is a guess.</p></li><li data-r="u"><span class="n">(02)</span><h3 class="h3 t">Ask what you receive</h3><p class="tx b">A logo alone isn't a brand. Check that you get the colours, the fonts, the rules to use them and the files in every format.</p></li><li data-r="u"><span class="n">(03)</span><h3 class="h3 t">Ask who owns the files</h3><p class="tx b">Once the work is paid, the logo and the source files should be yours. Ask for that in writing.</p></li><li data-r="u"><span class="n">(04)</span><h3 class="h3 t">Look at their brands in real life</h3><p class="tx b">A logo can look good on a screen and fail on a sign or a phone. Ask to see brands they made, in use.</p></li></ol>
  </section>

  <section class="sheet sf sec" aria-labelledby="fl-h">
    <div class="flc" data-r="u">
      <div class="a">
        <p class="kick">Part of Fledge</p>
        <h2 class="h2 mt-24" id="fl-h">Your brand is how people recognise you.</h2>
        <p class="tx mt-24">Your brand shows up on your website, your posts, your ads and every message you send. In Fledge, it is set up once and used the same way everywhere, so people recognise you and trust you before they ever get in touch.</p>
        <a class="lnk mt-32" href="/fledge">Discover Fledge{{ar}}</a>
      </div>
      <ol class="stg b" aria-label="The four stages of Fledge"><li class=""><span class="n">01</span><div><p class="nm">Get Found</p><p class="lnn">People find you on Google, social media and ads.</p></div></li><li class="on"><span class="n">02</span><div><p class="nm">Get Chosen</p><p class="lnn">Your website and proof make them pick you.</p></div><p class="this">This service</p></li><li class=""><span class="n">03</span><div><p class="nm">Get The Business</p><p class="lnn">Every enquiry gets a fast reply and a follow-up.</p></div></li><li class=""><span class="n">04</span><div><p class="nm">Keep &amp; Grow</p><p class="lnn">Customers come back and send others.</p></div></li></ol>
    </div>
    <div class="head mt-128"><p class="kick">Works well with</p><a class="lnk" href="/services">All services{{ar}}</a></div>
    <div class="svcs mt-32" data-r="s">
      <a class="card lift svc" href="/services/web-design"><img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Websites and SEO</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/social-media-management"><img class="cov" src="/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Social media</h3><p class="sub">Social media and content that keep your brand visible, trusted, and relevant.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/facebook-google-ads"><img class="cov" src="/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Paid ads</h3><p class="sub">Facebook, Instagram and Google ads that turn attention into enquiries.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="proof-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><p class="kick">Our work</p><h2 class="h2 mt-24" id="proof-h">A project like this.</h2>
        <p class="sm mt-32" style="max-width:30ch">Client names and results appear only with each client's written consent.</p><a class="lnk mt-24" href="/work">See all our work{{ar}}</a></div></div>
      <a class="card lift pcard c5-12" href="/work/case-study" data-r="u">
        <div class="ph r16x9"><div class="lb"><b>Project cover</b><span>A branding project, shown in context</span><i>16:9</i></div></div>
        <div class="row"><div><h3 class="h3"><span class="todo">[Client name]</span></h3><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><span class="ring">{{ar}}</span></div>
        <p class="tx"><span class="todo">[What changed, in one line]</span></p>
      </a>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">Questions</p><h2 class="h2 mt-24" id="faq-h" style="max-width:12ch">Branding questions, answered.</h2></div></div>
      <div class="faq c7-12">
        <details open><summary><h3>How much does a logo cost in Mauritius?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">It depends on what you need: a logo alone, or a full identity with colours, typography and a brand book. After a free growth call, we send a fixed price before any work starts.</p></details>
        <details><summary><h3>How long does branding take?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[About 3 to 4 weeks from the first call to the final files, to confirm.]</span> We agree the dates with you before we start.</p></details>
        <details><summary><h3>Do you help choose a business name?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. The name is yours: you choose it and you register it. We start from it and design everything around it.</p></details>
        <details><summary><h3>Who owns the logo and the files?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[You do. Once the project is paid, the logo and every file are yours. To confirm.]</span></p></details>
        <details><summary><h3>How many changes can I ask for?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[Number of rounds of changes, to confirm.]</span> We agree it before we start, and we ask the right questions first so the options are close from the start.</p></details>
        <details><summary><h3>Can you refresh our existing brand?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We keep what your customers already recognise and modernise the rest, so you look current without starting from zero.</p></details>
        <details><summary><h3>What files will I get?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Your logo in colour, black and white, as vector files for print and PNG files for screens, the colour codes for print and screen, and your brand book as a PDF.</p></details>
        <details><summary><h3>Is branding worth it for a small business?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">A clear look that stays the same everywhere makes a small business look established, and it is often the first thing customers judge. It also makes every post, ad and page look like it comes from the same place.</p></details>
      </div>
    </div>
  </section>

  <section class="sheet lt cta" aria-labelledby="cta-h">
    <p class="kick">Get In Touch</p>
    <h2 class="d1 mt-32" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a></div>
  </section>
</main>`,
  // Hero gradient: GetLayers "meridian", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: {"bgColor":"#08080a","colorA":"#070606","colorB":"#51504e","colorC":"#3d3d3b","colorD":"#aaa8a3"}, poster: "/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp", mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#04050c",
  colorA: "#0c0e1c",
  colorB: "#e8342b",
  colorC: "#2b4be8",
  colorD: "#fffaf8",
  speed: .33,
  tilt: -.78,
  level: 0,
  arc: 0,
  centerX: 0,
  centerY: 0,
  sway: .07,
  core: .1,
  reach: .35,
  bright: 1.4,
  skirt: .28,
  ambient: .36,
  warp: .12,
  scale: .4,
  drift: .07,
  roughness: .5,
  lacunarity: 2,
  contrast: 1.5,
  midpoint: .42,
  sink: .12,
  glow: .18,
  seam: .15,
  split: 1,
  grain: .03,
  grainAnim: 1,
  dither: 1.5,
  vignette: .24,
  lift: .2,
  open: .3,
  pourRadius: .55,
  pour: .12,
  smear: .6,
  infuse: .06,
  cursor: 1,
  parallax: .002,
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
uniform vec2  iLead;
uniform float uPourRadius, uPour, uSmear, uInfuse;
uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uSpeed, uTilt, uLevel, uSway, uCore, uReach;
uniform float uBright, uSkirt, uAmbient, uWarp, uScale, uDrift;
uniform float uRoughness, uLacunarity, uContrast, uMidpoint, uSink, uGlow, uSeam, uSplit;
uniform float uGrain, uDither, uVignette, uLift, uOpen, uParallax;
uniform float uArc, uCenterX, uCenterY;
#define OCTAVES 3
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
    p *= uLacunarity;
    amp *= uRoughness;
  }
  return v;
}
vec3 ramp4(float t, float side) {
  vec3 acc = mix(uColorB, uColorC, side);
  vec3 lo  = mix(uColorB, acc, uSplit);
  vec3 hi  = mix(uColorC, acc, uSplit);
  vec3 c = mix(uColorA, lo, smoothstep(0.00, 0.36, t));
  float k = smoothstep(0.32, 0.70, t);
  c = mix(c, hi, k);
  c = mix(c, uColorD, uSeam * 4.0 * k * (1.0 - k));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
vec2 rot(vec2 p, float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c) * p; }
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
  vec2 tfD = uv - iMouse;
  vec2 tfStroke = iLead - iMouse;
  float tfR2 = max(1e-4, uPourRadius * uPourRadius);
  float tfWell = exp(-dot(tfD, tfD) / tfR2);
  float tfWide = exp(-dot(tfD, tfD) / (tfR2 * 3.0));
  vec2 tfPour = -tfD * tfWell * uPour + tfStroke * tfWide * uSmear;
  float tfInfuse = tfWide * uInfuse * (0.55 + 0.45 * smoothstep(0.0, 0.12, length(tfStroke)));
  vec2 p = uv + tfPour - iMouse * uParallax;
  vec2 n = vec2(-sin(uTilt), cos(uTilt));
  vec2 q = p - vec2(uCenterX, uCenterY);
  float air = fbm(p * uScale + vec2(-t * uDrift, t * uDrift * 0.5));
  float lvl = uLevel + sin(t * 0.13) * uSway + iMouse.y * uLift;
  float d = mix(dot(q, n) - lvl, length(q) - max(0.0, lvl), uArc) + air * uWarp;
  float w = max(0.004, uCore * (1.0 + iMouse.x * uOpen));
  float band = exp(-(d * d) / (w * w));
  float wide = exp(-abs(d) / max(0.02, uReach));
  float f = uAmbient + uBright * band + uSkirt * wide + tfInfuse;
  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  float side = smoothstep(-1.0, 1.0, d / max(0.03, uCore + uReach * 0.35));
  vec3 col = ramp4(f, side);
  col += uColorD * uGlow * pow(f, 4.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), f) * 0.90 + 0.10);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
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
  u1f("uSpeed", CONFIG.speed);
  u1f("uTilt", CONFIG.tilt);
  u1f("uLevel", CONFIG.level);
  u1f("uArc", CONFIG.arc);
  u1f("uCenterX", CONFIG.centerX);
  u1f("uCenterY", CONFIG.centerY);
  u1f("uSway", CONFIG.sway);
  u1f("uCore", CONFIG.core);
  u1f("uReach", CONFIG.reach);
  u1f("uBright", CONFIG.bright);
  u1f("uSkirt", CONFIG.skirt);
  u1f("uAmbient", CONFIG.ambient);
  u1f("uWarp", CONFIG.warp);
  u1f("uScale", CONFIG.scale);
  u1f("uDrift", CONFIG.drift);
  u1f("uRoughness", CONFIG.roughness);
  u1f("uLacunarity", CONFIG.lacunarity);
  u1f("uContrast", CONFIG.contrast);
  u1f("uMidpoint", CONFIG.midpoint);
  u1f("uSink", CONFIG.sink);
  u1f("uGlow", CONFIG.glow);
  u1f("uSeam", CONFIG.seam);
  u1f("uSplit", CONFIG.split);
  u1f("uGrain", CONFIG.grain);
  u1f("uGrainAnim", CONFIG.grainAnim);
  u1f("uDither", CONFIG.dither);
  u1f("uVignette", CONFIG.vignette);
  u1f("uLift", CONFIG.lift);
  u1f("uOpen", CONFIG.open);
  u1f("uParallax", CONFIG.parallax);
  u1f("uPourRadius", CONFIG.pourRadius);
  u1f("uPour", CONFIG.pour);
  u1f("uSmear", CONFIG.smear);
  u1f("uInfuse", CONFIG.infuse);
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
  ax: 0,
  ay: 0,
  tx: 0,
  ty: 0
 };
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
  const kLead = .105 * s, kBody = .043 * s;
  mouse.ax += (mouse.tx - mouse.ax) * kLead;
  mouse.ay += (mouse.ty - mouse.ay) * kLead;
  mouse.x += (mouse.ax - mouse.x) * kBody;
  mouse.y += (mouse.ay - mouse.y) * kBody;
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
  u2f("iLead", mouse.ax, mouse.ay);
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
};
DD.current = "branding";
if (DD.mount) DD.mount();
