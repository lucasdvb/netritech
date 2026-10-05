// Disruptive Dodo · work page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["work"] = {
  path: "/work",
  title: "Our work · Disruptive Dodo, marketing agency in Mauritius",
  description: "See how Disruptive Dodo helps Mauritian businesses get found, get chosen and win more customers, with websites, ads, CRM and AI.",
  ld: null,
  css: `.work-hero .dsp{max-width:12ch}
.work-hero .sm{margin-top:20px;max-width:56ch}

.ctrl{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 32px;padding-top:24px;padding-bottom:24px;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}
.chips{display:flex;flex-wrap:wrap;gap:8px}

.wgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gt);row-gap:72px;padding-top:clamp(56px,5.6vw,80px);padding-bottom:var(--sec)}
.wcard{display:block;color:inherit;text-decoration:none}
.wcard.off{margin-top:96px}
.wcard .ph{transition:border-color .3s}
.wcard:hover .ph{border-color:var(--fg)}
.wrow{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-top:24px;padding-top:20px;border-top:1px solid var(--ln)}
.band{grid-column:1/-1;padding:clamp(32px,4.45vw,64px) 0;text-align:center}
.band .dsp{max-width:16ch;margin:0 auto}

.wlist{padding-top:clamp(40px,4.45vw,64px);padding-bottom:var(--sec)}
.wlist li{border-bottom:1px solid var(--ln)}
.wlist li:first-child{border-top:1px solid var(--ln)}
.wl{display:grid;grid-template-columns:72px minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.5fr) 96px 24px;align-items:center;gap:24px;min-height:88px;padding:16px 0;color:inherit;text-decoration:none}
.wl .h4{font-size:clamp(18px,1.53vw,22px)}
.wl .ar{width:14px;height:14px;justify-self:end;color:var(--mu);transition:color .2s,transform .3s}
.wl:hover .ar{color:var(--fg);transform:translate(2px,-2px)}
.cta .head-row{align-items:flex-end}
.cta .h2{max-width:18ch}
@media (max-width:899px){
  .wgrid{grid-template-columns:minmax(0,1fr);row-gap:56px}
  .wcard.off{margin-top:0}
  .wl{grid-template-columns:48px minmax(0,1fr) 20px;gap:8px 16px;padding:20px 0}
  .wl>:nth-child(3),.wl>:nth-child(4),.wl>:nth-child(5){grid-column:2}
  .wl>:nth-child(6){grid-column:3;grid-row:1}
}`,
  html: `<main>
  <section class="hero-in work-hero">
    <p class="eb"><span class="dot"></span>Our work</p>
    <h1 class="dsp">Businesses we helped grow.</h1>
    <p class="ld">Each project starts with the same question: where is this business losing customers? Here is what we found, what we built, and what changed.</p>
    <p class="sm">Client names and results appear only with each client's written consent.</p>
  </section>

  <div class="ctrl gt">
    <div class="chips" role="group" aria-label="Filter by stage">
      <button class="chip" type="button" aria-pressed="true" data-filter="all">All</button>
      <button class="chip" type="button" aria-pressed="false" data-filter="found">Get Found</button>
      <button class="chip" type="button" aria-pressed="false" data-filter="chosen">Get Chosen</button>
      <button class="chip" type="button" aria-pressed="false" data-filter="business">Get The Business</button>
      <button class="chip" type="button" aria-pressed="false" data-filter="keep">Keep &amp; Grow</button>
    </div>
    <div class="seg" role="group" aria-label="View">
      <button class="chip" type="button" aria-pressed="true" data-view="full">Full view</button>
      <button class="chip" type="button" aria-pressed="false" data-view="list">List view</button>
    </div>
  </div>

  <!-- Full view -->
  <div class="wgrid gt" id="view-full">
    <a class="wcard" href="/work/case-study" data-stages="found chosen">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">01</p></div>
      <div class="tags mt-16"><span class="tag">Get Found</span><span class="tag">Get Chosen</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
    <a class="wcard off" href="/work/case-study" data-stages="business">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">02</p></div>
      <div class="tags mt-16"><span class="tag">Get The Business</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
    <a class="wcard" href="/work/case-study" data-stages="chosen">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">03</p></div>
      <div class="tags mt-16"><span class="tag">Get Chosen</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
    <a class="wcard off" href="/work/case-study" data-stages="keep found">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">04</p></div>
      <div class="tags mt-16"><span class="tag">Keep &amp; Grow</span><span class="tag">Get Found</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
    <div class="band"><p class="dsp">Local team. Real specialists. No outsourcing.</p></div>
    <a class="wcard" href="/work/case-study" data-stages="business keep">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">05</p></div>
      <div class="tags mt-16"><span class="tag">Get The Business</span><span class="tag">Keep &amp; Grow</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
    <a class="wcard off" href="/work/case-study" data-stages="found">
      <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
      <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><p class="cap">06</p></div>
      <div class="tags mt-16"><span class="tag">Get Found</span></div>
      <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
    </a>
  </div>

  <!-- List view -->
  <ol class="wlist gt" id="view-list" hidden>
    <li data-stages="found chosen"><a class="wl" href="/work/case-study"><span class="cap">01</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Found</span><span class="tag">Get Chosen</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
    <li data-stages="business"><a class="wl" href="/work/case-study"><span class="cap">02</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get The Business</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
    <li data-stages="chosen"><a class="wl" href="/work/case-study"><span class="cap">03</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Chosen</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
    <li data-stages="keep found"><a class="wl" href="/work/case-study"><span class="cap">04</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Keep &amp; Grow</span><span class="tag">Get Found</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
    <li data-stages="business keep"><a class="wl" href="/work/case-study"><span class="cap">05</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get The Business</span><span class="tag">Keep &amp; Grow</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
    <li data-stages="found"><a class="wl" href="/work/case-study"><span class="cap">06</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Found</span></span><span class="cap"><span class="todo">[Year]</span></span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
  </ol>

  <section class="lt panel sec cta" aria-labelledby="cta-h">
    <div class="head-row">
      <h2 class="h2" id="cta-h">Want your business on this page next?</h2>
      <div class="btn-row">
        <a class="btn btn-a" href="/contact">Book a free growth call</a>
        <a class="btn" href="/services">See our services</a>
      </div>
    </div>
  </section>
</main>`,
  init: function (R) {
    /* filters and view toggle: everything is in the HTML, the script only toggles hidden */
    var chips = R.querySelectorAll('[data-filter]'), views = R.querySelectorAll('[data-view]');
    var cards = R.querySelectorAll('.wcard'), rows = R.querySelectorAll('.wlist li'), band = R.querySelector('.band');
    var full = R.getElementById('view-full'), list = R.getElementById('view-list');
    function match(el, f) { return f === 'all' || el.dataset.stages.split(' ').indexOf(f) > -1; }
    function filter(f) {
      var n = 0;
      cards.forEach(function (c) { var on = match(c, f); c.hidden = !on; if (on) { c.classList.toggle('off', n % 2 === 1); n++; } });
      rows.forEach(function (r) { r.hidden = !match(r, f); });
      if (band) band.hidden = f !== 'all';
    }
    chips.forEach(function (b) { b.addEventListener('click', function () { chips.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); filter(b.dataset.filter); }); });
    views.forEach(function (b) { b.addEventListener('click', function () { views.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); var l = b.dataset.view === 'list'; full.hidden = l; list.hidden = !l; }); });
  },
};
DD.current = "work";
if (DD.mount) DD.mount();
