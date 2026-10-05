// Disruptive Dodo · work page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["work"] = {
  path: "/work",
  title: "Our work · Disruptive Dodo, marketing agency in Mauritius",
  description: "See how Disruptive Dodo helps Mauritian businesses get found, get chosen and win more customers, with websites, ads, CRM and AI.",
  ld: null,
  css: `.wkh .mega{font-size:clamp(64px,10.4vw,176px);line-height:.88;max-width:12ch}
.wkh .meta{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap);margin-top:clamp(40px,5vw,72px)}
.wkh .meta>*{grid-column:1/-1}
.wkh .meta .sm{margin-top:20px}
@media (min-width:1024px){.wkh .meta .lead{grid-column:1/span 6}
.wkh .meta .sm{grid-column:9/-1;align-self:end}
}
.ctrl{position:sticky;top:12px;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px;border-radius:999px;margin-bottom:clamp(40px,5vw,72px);background:rgba(243,241,234,.72);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border:1px solid var(--ln);box-shadow:var(--sh1)}
.ctrl .chips,.ctrl .seg{display:flex;flex-wrap:wrap;gap:6px}
.ctrl .chip{border-color:transparent;height:38px;padding:0 16px}
.ctrl .chip[aria-pressed="false"]:hover{background:var(--sf2)}
@media (max-width:767px){.ctrl{position:static;border-radius:var(--r2)}
.ctrl .seg{display:none}
}
.wgrid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(56px,7vw,110px) var(--gap)}
.wcard{grid-column:1/span 7;display:block}
.wcard.off{grid-column:8/-1;margin-top:clamp(80px,14vw,240px)}
.wcard .ph{transition:transform 1.2s var(--e),box-shadow .8s var(--e);border-radius:var(--r3)}
.wcard:hover .ph{transform:scale(.985);box-shadow:var(--sh2)}
.wrow{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-top:22px}
.wcard .tx{max-width:46ch}
.v-end{display:flex;align-items:center;gap:16px}
.wcard:hover .ring{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.wcard:hover .ring .ar{transform:rotate(45deg)}
@media (max-width:1023px){.wcard,.wcard.off{grid-column:1/-1;margin-top:0}
}
.band{grid-column:1/-1;padding:clamp(24px,4vw,64px) 0;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}
.band p{font-size:clamp(40px,6vw,104px);font-weight:var(--w-dsp);letter-spacing:-.05em;line-height:.95;max-width:16ch}
.wlist{border-top:1px solid var(--ln)}
.wl{display:grid;grid-template-columns:60px minmax(0,3fr) minmax(0,2fr) minmax(0,3fr) 80px 24px;gap:16px;align-items:center;padding:26px 0;border-bottom:1px solid var(--ln);transition:padding .6s var(--e)}
.wl:hover{padding-left:14px}
.wl .ar{width:12px;height:12px;transition:transform .5s var(--e)}
.wl:hover .ar{transform:translate(3px,-3px)}
@media (max-width:767px){.wl{grid-template-columns:40px 1fr 20px}
.wl>:nth-child(3),.wl>:nth-child(4),.wl>:nth-child(5){display:none}
}
.wcta .h2{max-width:16ch}`,
  html: `<main>
  <section class="hero auto wkh">
    <p class="kick">Our work</p>
    <h1 class="mega mt-32">Businesses we helped grow.</h1>
    <div class="meta">
      <p class="lead">Each project starts with the same question: where is this business losing customers? Here is what we found, what we built, and what changed.</p>
      <p class="sm">Client names and results appear only with each client's written consent.</p>
    </div>
  </section>

  <section class="sheet lt sec">
    <div class="ctrl">
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
    <div class="wgrid" id="view-full">
      <a class="wcard" href="/work/case-study" data-stages="found chosen">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">01</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Get Found</span><span class="tag">Get Chosen</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
      <a class="wcard off" href="/work/case-study" data-stages="business">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">02</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Get The Business</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
      <a class="wcard" href="/work/case-study" data-stages="chosen">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">03</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Get Chosen</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
      <a class="wcard off" href="/work/case-study" data-stages="keep found">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">04</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Keep &amp; Grow</span><span class="tag">Get Found</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
      <div class="band"><p class="dsp">Local team. Real specialists. No outsourcing.</p></div>
      <a class="wcard" href="/work/case-study" data-stages="business keep">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">05</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Get The Business</span><span class="tag">Keep &amp; Grow</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
      <a class="wcard off" href="/work/case-study" data-stages="found">
        <div class="ph r16x10"><div class="lb"><b>Project cover</b><span>The finished website, campaign or system, shown in context</span><i>16:10</i></div></div>
        <div class="wrow"><div><h2 class="h3"><span class="todo">[Client name]</span></h2><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><div class="v-end"><p class="cap">06</p><span class="ring">{{ar}}</span></div></div>
        <div class="tags mt-16"><span class="tag">Get Found</span></div>
        <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
      </a>
    </div>
    <ol class="wlist" id="view-list" hidden>
      <li data-stages="found chosen"><a class="wl" href="/work/case-study"><span class="cap">01</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Found</span><span class="tag">Get Chosen</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
      <li data-stages="business"><a class="wl" href="/work/case-study"><span class="cap">02</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get The Business</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
      <li data-stages="chosen"><a class="wl" href="/work/case-study"><span class="cap">03</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Chosen</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
      <li data-stages="keep found"><a class="wl" href="/work/case-study"><span class="cap">04</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Keep &amp; Grow</span><span class="tag">Get Found</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
      <li data-stages="business keep"><a class="wl" href="/work/case-study"><span class="cap">05</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get The Business</span><span class="tag">Keep &amp; Grow</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
      <li data-stages="found"><a class="wl" href="/work/case-study"><span class="cap">06</span><span class="h4"><span class="todo">[Client name]</span></span><span class="cap"><span class="todo">[Sector]</span></span><span class="tags"><span class="tag">Get Found</span></span><span class="cap"><span class="todo">[Year]</span></span>{{ar}}</a></li>
    </ol>
  </section>

  <section class="sheet dk sec wcta" aria-labelledby="cta-h">
    <div class="head">
      <h2 class="d2" id="cta-h">Want your business on this page next?</h2>
      <div class="btn-row"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/services">See our services</a></div>
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
