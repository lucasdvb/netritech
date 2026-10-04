// Disruptive Dodo · case-study page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["case-study"] = {
  path: "/work/case-study",
  title: "Case study · Disruptive Dodo",
  description: "A Disruptive Dodo project: where the business was losing customers, what we built, and what changed.",
  robots: "noindex, follow",
  ld: null,
  css: `.cs-hero .ld{max-width:40ch}
.cs-hero .eb{margin-top:clamp(32px,3.34vw,48px)}
.cs-cover{padding-bottom:clamp(48px,4.45vw,64px)}
.cs-meta dd{font-size:clamp(18px,1.39vw,20px);line-height:1.35;font-weight:500}
.problem .h2{max-width:20ch}
.problem .tx{align-self:end;max-width:46ch;font-size:clamp(17px,1.39vw,20px);line-height:1.6}
.pgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gt)}
.pgrid .principle:nth-last-child(-n+2){border-bottom:1px solid var(--ln)}
.gallery-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gt);margin-top:var(--gt)}
.gallery{padding-bottom:clamp(40px,4.45vw,64px)}
.results .sm{margin-top:24px}
.quote blockquote{max-width:1040px;margin:0 auto;text-align:center}
.quote .h2{font-weight:400}
.next{padding-top:clamp(64px,6.67vw,96px)}
.next-link{display:flex;flex-direction:column;gap:20px;padding:40px 0;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln);color:inherit;text-decoration:none}
.next-row{display:flex;align-items:center;justify-content:space-between;gap:32px}
.next-link .ring{width:96px;height:96px}
.next-link .ring svg{width:24px;height:24px}
.next-link:hover .ring{background:var(--fg);color:var(--bg)}
@media (max-width:767px){
  .pgrid,.gallery-2{grid-template-columns:minmax(0,1fr)}
  .pgrid .principle:nth-last-child(2){border-bottom:0}
  .next-link .ring{width:60px;height:60px}
  .next-link .ring svg{width:16px;height:16px}
}`,
  html: `<main>
  <section class="hero-in cs-hero">
    <a class="lnk" href="/work"><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M10 6H2M5.4 2.6L2 6l3.4 3.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>All work</a>
    <p class="eb"><span class="dot"></span>Case study · <span class="todo">[Sector]</span></p>
    <h1 class="dsp"><span class="todo">[Client name]</span></h1>
    <p class="ld"><span class="todo">[One line on what changed for the business, in plain words.]</span></p>
    <p class="cap mt-48">Stages we worked on</p>
    <div class="tags mt-16"><span class="tag on">Get Found</span><span class="tag">Get Chosen</span><span class="tag on">Get The Business</span><span class="tag">Keep &amp; Grow</span></div>
  </section>

  <div class="gt cs-cover">
    <div class="ph r16x9"><div class="lb"><b>Cover</b><span>The finished work in context: the website on a laptop, the campaign on a phone, or the client at work</span><i>16:9</i></div></div>
    <dl class="meta cs-meta mt-64">
      <div><dt class="cap">Client</dt><dd><span class="todo">[Client name]</span></dd></div>
      <div><dt class="cap">Sector</dt><dd><span class="todo">[Sector]</span></dd></div>
      <div><dt class="cap">Year</dt><dd><span class="todo">[Year]</span></dd></div>
      <div><dt class="cap">What we did</dt><dd><span class="todo">[Services]</span></dd></div>
      <div><dt class="cap">Live site</dt><dd><span class="todo">[Link]</span></dd></div>
    </dl>
  </div>

  <section class="sec problem" aria-labelledby="problem-h">
    <div class="g12">
      <div class="span-6">
        <p class="eb"><span class="dot"></span>The problem</p>
        <h2 class="h2 mt-24" id="problem-h"><span class="todo">[Where the business was losing customers, in one sentence.]</span></h2>
      </div>
      <p class="tx span-5 from-8"><span class="todo">[Two or three sentences in the owner's words: what was going wrong, and what it was costing them.]</span></p>
    </div>
  </section>

  <section class="lt panel sec" aria-labelledby="did-h">
    <h2 class="eb" id="did-h"><span class="dot"></span>What we did</h2>
    <ol class="pgrid mt-48">
      <li class="principle"><span class="idx">01</span><div><h3>We found what was holding them back</h3><p><span class="todo">[What we looked at, and what we found.]</span></p></div></li>
      <li class="principle"><span class="idx">02</span><div><h3>We fixed the biggest problem first</h3><p><span class="todo">[The first change, and why it came first.]</span></p></div></li>
      <li class="principle"><span class="idx">03</span><div><h3>We built for growth</h3><p><span class="todo">[What we built: website, campaigns, CRM, automation.]</span></p></div></li>
      <li class="principle"><span class="idx">04</span><div><h3>We measured what matters</h3><p><span class="todo">[What we tracked, and how often we reported.]</span></p></div></li>
    </ol>
  </section>

  <section class="sec gallery" aria-label="Gallery">
    <div class="ph r16x9"><div class="lb"><b>Desktop page or campaign</b><span>Full width</span><i>16:9</i></div></div>
    <div class="gallery-2">
      <div class="ph r4x5"><div class="lb"><b>Phone screens</b><span>Two or three screens of the site or ads</span><i>4:5</i></div></div>
      <div class="ph r4x5"><div class="lb"><b>Detail</b><span>A form, an ad or a dashboard, close up</span><i>4:5</i></div></div>
    </div>
  </section>

  <section class="sec results" aria-labelledby="results-h">
    <p class="eb"><span class="dot"></span>Results</p>
    <h2 class="h2 mt-24" id="results-h">What changed.</h2>
    <div class="stats mt-64">
      <div class="stat"><p class="fig"><span class="todo">[+00%]</span></p><p class="lab"><span class="todo">[More enquiries per month]</span></p></div>
      <div class="stat"><p class="fig"><span class="todo">[00 h]</span></p><p class="lab"><span class="todo">[Saved every week]</span></p></div>
      <div class="stat"><p class="fig"><span class="todo">[0x]</span></p><p class="lab"><span class="todo">[More online orders]</span></p></div>
    </div>
    <p class="sm">Only figures we measured, shown with the client's consent.</p>
  </section>

  <section class="panel on-sf sec quote" aria-label="Client quote">
    <blockquote>
      <p class="h2">"<span class="todo">[A sentence from the client about working with us, with their permission.]</span>"</p>
      <footer class="cap mt-40"><span class="todo">[Name]</span> · <span class="todo">[Role]</span>, <span class="todo">[Company]</span></footer>
    </blockquote>
  </section>

  <section class="panel sec next" aria-label="Next project">
    <a class="next-link" href="/work/case-study">
      <span class="cap">Next project</span>
      <span class="next-row"><span class="dsp"><span class="todo">[Client name]</span></span><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></span>
    </a>
    <a class="lnk mt-24" href="/work">All work<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  </section>
</main>`,
};
DD.current = "case-study";
if (DD.mount) DD.mount();
