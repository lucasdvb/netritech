// Case study template (noindex until real projects are in). Editorial layout.
module.exports = {
  css: `
.csh .mega{font-size:clamp(64px,11vw,190px);line-height:.88}
.csh .back{display:inline-flex;align-items:center;gap:10px;font-size:14px;color:rgba(243,241,234,.7)}
.csh .back .ar{width:10px;height:10px;transform:rotate(-135deg);transition:transform .5s var(--e)}
.csh .back:hover{color:#f3f1ea}
.csh .back:hover .ar{transform:rotate(-135deg) translate(2px,-2px)}
.csh .row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap);align-items:end;margin-top:clamp(40px,5vw,72px)}
.csh .row>*{grid-column:1/-1}
@media (min-width:1024px){.csh .row .lead{grid-column:1/span 6}.csh .row .st{grid-column:8/-1}}
@media (max-width:1023px){.csh .row .st{margin-top:32px}}
.cs-meta{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--gap);border-top:1px solid var(--ln)}
.cs-meta>div{padding-top:20px}
.cs-meta dd{margin-top:8px;font-size:17px}
@media (max-width:767px){.cs-meta{grid-template-columns:1fr 1fr}}
.problem .h2{max-width:18ch}
.did{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.did li{display:flex;flex-direction:column;gap:40px;justify-content:space-between;min-height:260px;padding:28px;border-radius:var(--r2);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.did .i{font-size:clamp(48px,4.6vw,76px);font-weight:var(--w-dsp);letter-spacing:-.06em;line-height:.8;color:var(--su)}
.did h3{font-size:clamp(20px,1.6vw,24px);font-weight:400;letter-spacing:-.02em}
.did p{margin-top:10px;color:var(--mu)}
@media (max-width:767px){.did{grid-template-columns:1fr}}
.gal{display:grid;gap:var(--gap)}
.gal .two{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
@media (max-width:639px){.gal .two{grid-template-columns:1fr}}
.res .stats{grid-template-columns:repeat(3,minmax(0,1fr))}
.res .stat{padding-top:24px;border-top:1px solid var(--ln)}
@media (max-width:767px){.res .stats{grid-template-columns:1fr}}
.quote .q{max-width:22ch;font-size:clamp(34px,4.2vw,68px);font-weight:var(--w-dsp);letter-spacing:-.04em;line-height:1.05}
.next-link{display:block;padding:clamp(16px,2vw,28px) 0}
.next-row{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-top:16px}
.next-row .mega{font-size:clamp(56px,9vw,150px);line-height:.9;transition:transform .9s var(--e)}
.next-link:hover .next-row .mega{transform:translateX(16px)}
.next-link .ring{width:clamp(64px,7vw,110px);height:clamp(64px,7vw,110px)}
.next-link .ring .ar{width:18px;height:18px}
.next-link:hover .ring{background:var(--fg);color:var(--bg);border-color:var(--fg)}`,
  html: `<main>
  <section class="hero auto csh">
    <a class="back" href="/work">{{ar}}All work</a>
    <p class="kick mt-48">Case study · <span class="todo">[Sector]</span></p>
    <h1 class="mega mt-24"><span class="todo">[Client name]</span></h1>
    <div class="row">
      <p class="lead"><span class="todo">[One line on what changed for the business, in plain words.]</span></p>
      <div class="st"><p class="cap">Stages we worked on</p><div class="tags mt-16"><span class="tag on">Get Found</span><span class="tag">Get Chosen</span><span class="tag on">Get The Business</span><span class="tag">Keep &amp; Grow</span></div></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-label="Project details">
    <div class="ph r16x9" data-r="x"><div class="lb"><b>Cover</b><span>The finished work in context: the website on a laptop, the campaign on a phone, or the client at work</span><i>16:9</i></div></div>
    <dl class="cs-meta mt-64" data-r="s">
      <div><dt class="cap">Client</dt><dd><span class="todo">[Client name]</span></dd></div>
      <div><dt class="cap">Sector</dt><dd><span class="todo">[Sector]</span></dd></div>
      <div><dt class="cap">Year</dt><dd><span class="todo">[Year]</span></dd></div>
      <div><dt class="cap">What we did</dt><dd><span class="todo">[Services]</span></dd></div>
      <div><dt class="cap">Live site</dt><dd><span class="todo">[Link]</span></dd></div>
    </dl>
    <div class="g12 problem mt-128" aria-labelledby="problem-h">
      <div class="c1-6"><p class="kick">The problem</p><h2 class="h2 mt-24" id="problem-h"><span class="todo">[Where the business was losing customers, in one sentence.]</span></h2></div>
      <p class="lead fg c8-12"><span class="todo">[Two or three sentences in the owner's words: what was going wrong, and what it was costing them.]</span></p>
    </div>
  </section>

  <section class="sheet sf sec" aria-labelledby="did-h">
    <h2 class="kick" id="did-h">What we did</h2>
    <ol class="did mt-48" data-r="s">
      <li><span class="i">01</span><div><h3>We found what was holding them back</h3><p><span class="todo">[What we looked at, and what we found.]</span></p></div></li>
      <li><span class="i">02</span><div><h3>We fixed the biggest problem first</h3><p><span class="todo">[The first change, and why it came first.]</span></p></div></li>
      <li><span class="i">03</span><div><h3>We built for growth</h3><p><span class="todo">[What we built: website, campaigns, CRM, automation.]</span></p></div></li>
      <li><span class="i">04</span><div><h3>We measured what matters</h3><p><span class="todo">[What we tracked, and how often we reported.]</span></p></div></li>
    </ol>
  </section>

  <section class="sheet dk sec" aria-label="Gallery">
    <div class="gal">
      <div class="ph r16x9" data-r="x"><div class="lb"><b>Desktop page or campaign</b><span>Full width</span><i>16:9</i></div></div>
      <div class="two" data-r="s">
        <div class="ph r4x5"><div class="lb"><b>Phone screens</b><span>Two or three screens of the site or ads</span><i>4:5</i></div></div>
        <div class="ph r4x5"><div class="lb"><b>Detail</b><span>A form, an ad or a dashboard, close up</span><i>4:5</i></div></div>
      </div>
    </div>
    <div class="inset res mt-96" aria-labelledby="results-h" data-r="u">
      <p class="kick">Results</p>
      <h2 class="h2 mt-24" id="results-h">What changed.</h2>
      <div class="stats mt-64">
        <div class="stat"><p class="fig"><span class="todo">[+00%]</span></p><p class="lab"><span class="todo">[More enquiries per month]</span></p></div>
        <div class="stat"><p class="fig"><span class="todo">[00 h]</span></p><p class="lab"><span class="todo">[Saved every week]</span></p></div>
        <div class="stat"><p class="fig"><span class="todo">[0x]</span></p><p class="lab"><span class="todo">[More online orders]</span></p></div>
      </div>
      <p class="sm mt-48">Only figures we measured, shown with the client's consent.</p>
    </div>
  </section>

  <section class="sheet lt sec quote" aria-label="Client quote">
    <blockquote>
      <p class="q" data-r="l">"<span class="todo">[A sentence from the client about working with us, with their permission.]</span>"</p>
      <footer class="cap mt-40"><span class="todo">[Name]</span> · <span class="todo">[Role]</span>, <span class="todo">[Company]</span></footer>
    </blockquote>
  </section>

  <section class="sheet dk sec" aria-label="Next project">
    <a class="next-link" href="/work/case-study">
      <span class="cap">Next project</span>
      <span class="next-row"><span class="mega"><span class="todo">[Client name]</span></span><span class="ring">{{ar}}</span></span>
    </a>
    <a class="lnk mt-24" href="/work">All work{{ar}}</a>
  </section>
</main>`,
};
