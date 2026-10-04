// About. Hero runs the "antumbra" gradient (soft lamp shadows that follow the hand).
const TEAM = [
  ['/uploads/VxKLOkHcsbq18S-g9CxP9-team-lucas.webp', 400, 600, 'Lucas', 'Creative Director'],
  ['/uploads/psReDm2EvFIPMWKDtl_W6-team-jean-claude.webp', 400, 600, 'Jean-Claude', 'Technology Director'],
  ['/uploads/ac4eJpQFBHbU6W8ToNFk7-team-kipchoge.webp', 400, 600, 'Kipchoge', 'Content Strategist &amp; Copywriter'],
  ['/uploads/qZbOLp5Sdl92rE4eTsAKn-team-karen.webp', 400, 600, 'Karen', 'Admin Manager'],
  ['/uploads/ctcTzB-_AQJ2WqckaQUsh-team-ali.webp', 512, 768, 'Ali', 'Automations Specialist'],
  ['/uploads/4Ur1DibNeUPgkczTSysdt-team-nigel.webp', 400, 600, 'Nigel', 'Global Business Developer'],
  ['/uploads/TNLv57W53is5HT2vkH3Ak-team-amara.webp', 400, 600, 'Amara', 'Graphic Designer'],
];

module.exports = {
  gl: 'antumbra',
  css: `
.abh .d1{max-width:22ch}
.abh .d1 .mu{color:rgba(243,241,234,.5)}
.rules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:48px var(--gap)}
.rules li{padding-top:28px;border-top:1px solid var(--ls)}
.rules .h3{font-size:clamp(28px,2.6vw,42px);letter-spacing:-.035em}
.rules .tx{max-width:36ch}
@media (max-width:899px){.rules{grid-template-columns:1fr}}
.glance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.glance .stat{display:flex;flex-direction:column;justify-content:space-between;min-height:clamp(260px,22vw,340px);padding:28px;border-radius:var(--r2);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.glance .stat:nth-child(2){background:#f3f1ea;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;border-color:transparent}
.glance .stat:nth-child(3){background:#0b0b0d url(/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp) center/cover}
.glance .lab{margin-top:0}
@media (max-width:1023px){.glance{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(240px,72%);overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--gt) * -1);padding:4px var(--gt) 24px;scrollbar-width:none}.glance::-webkit-scrollbar{display:none}.glance .stat{scroll-snap-align:start}}
.tgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
@media (max-width:1023px){.tgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tcard{position:relative;aspect-ratio:2/3;border-radius:var(--r2);overflow:hidden;background:#151518;box-shadow:var(--sh1);isolation:isolate}
.tcard img{width:100%;height:100%;object-fit:cover;transition:transform 1.4s var(--e),filter 1s var(--e);filter:grayscale(1) contrast(1.02)}
.tcard::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.72));transition:opacity .6s}
.tcard figcaption{position:absolute;left:20px;right:20px;bottom:18px;z-index:1;color:#f3f1ea}
.tcard .n{display:block;font-size:clamp(20px,1.6vw,24px);letter-spacing:-.02em}
.tcard .ro{display:block;font-size:13.5px;color:rgba(243,241,234,.7);margin-top:2px;transform:translateY(6px);opacity:.8;transition:transform .6s var(--e),opacity .6s}
.tcard:hover img{transform:scale(1.05)}
.tcard:hover .ro{transform:none;opacity:1}
.tjoin{display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:2/3;padding:28px;border-radius:var(--r2);background:#0c0c0e;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;box-shadow:var(--sh2)}
.tjoin h3{font-size:clamp(28px,2.4vw,38px);font-weight:var(--w-dsp);line-height:1;letter-spacing:-.035em;max-width:10ch}
.tjoin .tx{margin-top:20px}
.tjoin .lnk{align-self:flex-start}
.made{align-items:center}
.made .dodo img{width:min(460px,90%);margin-inline:auto;filter:drop-shadow(0 50px 70px rgba(0,0,0,.7))}
.made .glow{position:relative}
.made .glow::before{content:"";position:absolute;inset:10% 0 0;background:radial-gradient(closest-side,rgba(215,213,205,.16),transparent);z-index:-1}`,
  html: `<main>
  <section class="hero short abh">
    <div class="hero-bg"></div>
    <p class="kick">About Disruptive Dodo</p>
    <h1 class="d1 mt-24"><span class="mu">We're a Mauritian growth agency built on one idea:</span> your website, your marketing and your follow-up should work as one.</h1>
  </section>

  <section class="sheet lt sec" aria-labelledby="believe-h">
    <div class="ph r21x9" data-r="x"><div class="lb"><b>Team photo</b><span>The team together, in the office or on a shoot</span><i>21:9</i></div></div>
    <div class="head mt-128"><div><p class="kick">What we believe</p><h2 class="h2 mt-24" id="believe-h">Three rules we work by.</h2></div></div>
    <ol class="rules mt-64" data-r="s">
      <li><p class="cap">(01)</p><h3 class="h3 mt-24">Find the problem first.</h3><p class="tx mt-16">Before we recommend anything, we look at your marketing, sales, systems and operations to find where growth is getting stuck.</p></li>
      <li><p class="cap">(02)</p><h3 class="h3 mt-24">Do it once, do it right.</h3><p class="tx mt-16">Built properly the first time. One team, no wasted spend, nothing to redo later.</p></li>
      <li><p class="cap">(03)</p><h3 class="h3 mt-24">Measure what matters.</h3><p class="tx mt-16">More enquiries. More sales. Less wasted time. We focus on the numbers that actually move your business forward.</p></li>
    </ol>
  </section>

  <section class="sheet dk sec" aria-labelledby="glance-h">
    <div class="head"><h2 class="kick" id="glance-h">At a glance</h2><a class="lnk" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu{{ar}}</a></div>
    <div class="glance mt-48" data-r="s">
      <div class="stat"><p class="fig">1 hr</p><p class="lab">Every enquiry answered within a business hour</p></div>
      <div class="stat"><p class="fig">24/7</p><p class="lab">Automated follow-up that never sleeps</p></div>
      <div class="stat"><p class="fig">4</p><p class="lab">Growth stages, handled by one team</p></div>
      <div class="stat"><p class="fig">EN·FR</p><p class="lab">We work in English and French</p></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="team-h">
    <div class="head"><div><p class="kick">Our team</p><h2 class="h2 mt-24" id="team-h" style="max-width:14ch">The team doing the actual work.</h2></div>
      <p class="lead fg">Local team. Real specialists. No outsourcing.</p></div>
    <div class="tgrid mt-64" data-r="s">${TEAM.map((t) => `
      <figure class="tcard"><img src="${t[0]}" alt="${t[3]}" width="${t[1]}" height="${t[2]}" loading="lazy"><figcaption><span class="n">${t[3]}</span><span class="ro">${t[4]}</span></figcaption></figure>`).join('')}
      <div class="tjoin">
        <div><h3>Want to join the team?</h3><p class="tx">Send us your work at <span class="todo">[careers email, to confirm]</span>.</p></div>
        <a class="lnk" href="/contact">Say hello{{ar}}</a>
      </div>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="made-h">
    <div class="g12 made">
      <div class="c1-5 glow" data-r="u"><div class="dodo"><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228" loading="lazy"></div></div>
      <div class="c7-12">
        <h2 class="d2" id="made-h">Built in Mauritius. Made to grow.</h2>
        <p class="lead mt-32">We're based in Mauritius and work with businesses here and abroad, in English and French.</p>
        <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/work">See our work</a></div>
      </div>
    </div>
  </section>
</main>`,
};
