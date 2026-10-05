// Disruptive Dodo · about page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["about"] = {
  path: "/about",
  title: "About Disruptive Dodo · Growth agency in Mauritius",
  description: "Disruptive Dodo is a Mauritian growth agency. One local team builds and runs your website, marketing and follow-up as one system.",
  ld: null,
  css: `.about-hero .h1{max-width:24ch}
.banner{padding-bottom:clamp(64px,6.67vw,96px)}

.rules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:48px var(--gt)}
.rules li{padding-top:24px;border-top:1px solid var(--ls)}
.rules .tx{max-width:38ch}
@media (max-width:899px){.rules{grid-template-columns:minmax(0,1fr)}}

.team-head .tx{max-width:32ch}
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:24px}
.tgrid .tcard{width:auto;height:auto;aspect-ratio:2/3}
.tjoin{display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:2/3;padding:32px;border-radius:16px;border:1px solid rgba(243,241,234,.22);background:#0f0f12;box-shadow:0 18px 42px -18px rgba(15,15,18,.45),0 4px 14px -8px rgba(15,15,18,.26)}
.tjoin h3{font-size:32px;line-height:.98;font-weight:400;letter-spacing:-.01em;max-width:11ch}
.tjoin .tx{margin-top:20px}
.tjoin .lnk{align-self:flex-start}
@media (max-width:639px){.tgrid .tcard,.tjoin{aspect-ratio:3/4}.tjoin{padding:24px}}

.glance .stat .fig{font-size:clamp(56px,6.67vw,96px)}

.made{align-items:center}
.made-dodo{width:100%;max-width:420px;margin:0 auto;background:transparent}
.made-dodo img{width:128%;max-width:none;height:auto;margin-left:-14%}
.made .tx{max-width:44ch}
@media (max-width:1023px){.made-dodo{max-width:300px}}`,
  html: `<main>
  <section class="hero-in about-hero">
    <p class="eb"><span class="dot"></span>About Disruptive Dodo</p>
    <h1 class="h1"><span class="mu">We're a Mauritian growth agency built on one idea:</span> your website, your marketing and your follow-up should work as one.</h1>
  </section>

  <div class="gt banner">
    <div class="ph r21x9"><div class="lb"><b>Team photo</b><span>The team together, in the office or on a shoot</span><i>21:9</i></div></div>
  </div>

  <section class="lt panel sec" aria-labelledby="believe-h">
    <p class="eb"><span class="dot"></span>What we believe</p>
    <h2 class="h2 mt-24" id="believe-h">Three rules we work by.</h2>
    <ol class="rules mt-64">
      <li><p class="cap">(01)</p><h3 class="h3 mt-24">Find the problem first.</h3><p class="tx mt-16">Before we recommend anything, we look at your marketing, sales, systems and operations to find where growth is getting stuck.</p></li>
      <li><p class="cap">(02)</p><h3 class="h3 mt-24">Do it once, do it right.</h3><p class="tx mt-16">Built properly the first time. One team, no wasted spend, nothing to redo later.</p></li>
      <li><p class="cap">(03)</p><h3 class="h3 mt-24">Measure what matters.</h3><p class="tx mt-16">More enquiries. More sales. Less wasted time. We focus on the numbers that actually move your business forward.</p></li>
    </ol>
  </section>

  <section class="sec glance" aria-labelledby="glance-h">
    <h2 class="eb" id="glance-h"><span class="dot"></span>At a glance</h2>
    <div class="stats mt-48">
      <div class="stat"><p class="fig">1 hr</p><p class="lab">Every enquiry answered within a business hour</p></div>
      <div class="stat"><p class="fig">24/7</p><p class="lab">Automated follow-up that never sleeps</p></div>
      <div class="stat"><p class="fig">4</p><p class="lab">Growth stages, handled by one team</p></div>
      <div class="stat"><p class="fig">EN·FR</p><p class="lab">We work in English and French</p></div>
    </div>
  </section>

  <section class="lt panel sec" aria-labelledby="team-h">
    <div class="head-row team-head">
      <div>
        <p class="eb"><span class="dot"></span>Our team</p>
        <h2 class="h2 mt-24" id="team-h">The team doing the actual work.</h2>
      </div>
      <p class="tx">Local team. Real specialists. No outsourcing.</p>
    </div>
    <div class="tgrid mt-64">
      <figure class="tcard"><img src="/uploads/VxKLOkHcsbq18S-g9CxP9-team-lucas.webp" alt="Lucas" width="400" height="600"><figcaption><span class="n">Lucas</span><span class="ro">Creative Director</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/psReDm2EvFIPMWKDtl_W6-team-jean-claude.webp" alt="Jean-Claude" width="400" height="600"><figcaption><span class="n">Jean-Claude</span><span class="ro">Technology Director</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/ac4eJpQFBHbU6W8ToNFk7-team-kipchoge.webp" alt="Kipchoge" width="400" height="600"><figcaption><span class="n">Kipchoge</span><span class="ro">Content Strategist &amp; Copywriter</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/qZbOLp5Sdl92rE4eTsAKn-team-karen.webp" alt="Karen" width="400" height="600"><figcaption><span class="n">Karen</span><span class="ro">Admin Manager</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/ctcTzB-_AQJ2WqckaQUsh-team-ali.webp" alt="Ali" width="512" height="768"><figcaption><span class="n">Ali</span><span class="ro">Automations Specialist</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/4Ur1DibNeUPgkczTSysdt-team-nigel.webp" alt="Nigel" width="400" height="600"><figcaption><span class="n">Nigel</span><span class="ro">Global Business Developer</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/TNLv57W53is5HT2vkH3Ak-team-amara.webp" alt="Amara" width="400" height="600"><figcaption><span class="n">Amara</span><span class="ro">Graphic Designer</span></figcaption></figure>
      <div class="tjoin dk">
        <div>
          <h3>Want to join the team?</h3>
          <p class="tx">Send us your work at <span class="todo">[careers email, to confirm]</span>.</p>
        </div>
        <a class="lnk" href="/contact">Say hello<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="made-h">
    <div class="g12 made">
      <div class="span-5">
        <div class="dodo made-dodo"><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228"></div>
      </div>
      <div class="span-6 from-7">
        <h2 class="dsp" id="made-h">Built in Mauritius. Made to grow.</h2>
        <p class="tx mt-32">We're based in Mauritius and work with businesses here and abroad, in English and French.</p>
        <div class="btn-row mt-48">
          <a class="btn btn-a" href="/contact">Book a free growth call</a>
          <a class="btn" href="/work">See our work</a>
        </div>
      </div>
    </div>
  </section>
</main>`,
};
DD.current = "about";
if (DD.mount) DD.mount();
