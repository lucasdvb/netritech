// Service page template. Copy comes from src/data/<key>.json (extracted from the
// previous markup); each service gets its own hero gradient and its own composition
// for the "What's included" section.
const esc = (s) => s;
const btn = (b) => `<a class="btn${b.p ? ' btn-p' : ''}" href="${b.href}">${b.t}${b.p ? '{{ar}}' : ''}</a>`;
const pad = (n) => String(n).padStart(2, '0');

const INC = {
  // websites: bento grid
  bento: (d) => `<ol class="bento mt-64" data-r="s">${d.inc.items.map((it, i) => `
      <li class="card lift b${i + 1}"><p class="cap">${it.n}</p><div><h3 class="h4">${it.h}</h3><p class="tx mt-12">${it.p}</p></div></li>`).join('')}
    </ol>`,
  // social: horizontal rail of tall cards
  rail: (d) => `<div class="rail-wrap mt-64"><ol class="rail" data-r="s">${d.inc.items.map((it) => `
      <li class="card lift"><p class="rn">${it.n}</p><div><h3 class="h4">${it.h}</h3><p class="tx mt-12">${it.p}</p></div></li>`).join('')}
    </ol><div class="rail-ctl"><button class="ring" type="button" data-rail="-1" aria-label="Previous">{{ar}}</button><button class="ring" type="button" data-rail="1" aria-label="Next">{{ar}}</button></div></div>`,
  // paid ads: numbered ledger
  ledger: (d) => `<ol class="ledger mt-64">${d.inc.items.map((it) => `
      <li data-r="u"><span class="ln">${it.n}</span><h3 class="h3">${it.h}</h3><p class="tx">${it.p}</p></li>`).join('')}
    </ol>`,
  // automation: connected flow, the line fills as you scroll
  flow: (d) => `<ol class="flow mt-64"><i class="flow-line" aria-hidden="true"><i></i></i>${d.inc.items.map((it, i) => `
      <li class="${i % 2 ? 'fr' : 'fl'}"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">${it.n}</p><h3 class="h4 mt-12">${it.h}</h3><p class="tx mt-12">${it.p}</p></div></li>`).join('')}
    </ol>`,
  // ai: a conversation
  chat: (d) => `<ol class="chat mt-64">${d.inc.items.map((it, i) => `
      <li class="${i % 2 ? 'cb' : 'ca'}" data-r="u"><div class="bub"><p class="cap">${it.n}</p><h3 class="h4 mt-8">${it.h}</h3><p class="tx mt-8">${it.p}</p></div></li>`).join('')}
      <li class="ca typing" aria-hidden="true" data-r="u"><div class="bub"><i></i><i></i><i></i></div></li>
    </ol>`,
  // branding: specimen tiles
  tiles: (d) => `<ol class="tiles mt-64" data-r="s">${d.inc.items.map((it) => `
      <li class="card lift"><p class="tn">${it.n}</p><div><h3 class="h4">${it.h}</h3><p class="tx mt-12">${it.p}</p></div></li>`).join('')}
    </ol>`,
};

const CSS = {
  bento: `.bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.bento>li{display:flex;flex-direction:column;justify-content:space-between;gap:56px;min-height:280px;padding:28px}
.bento .b1,.bento .b6{grid-column:span 2}
.bento .b1{grid-row:span 2;background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b;border-color:transparent}
.bento .b1 .h4{font-size:clamp(26px,2.4vw,40px);font-weight:var(--w-dsp);letter-spacing:-.035em;line-height:1.05}
.bento .b1 .tx{max-width:40ch}
@media (max-width:1023px){.bento{grid-template-columns:1fr 1fr}.bento .b1{grid-row:auto}.bento .b6{grid-column:span 1}}
@media (max-width:639px){.bento{grid-template-columns:1fr}.bento>li{grid-column:auto!important;min-height:0}}`,
  rail: `.rail-wrap{position:relative}
.rail{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(270px,27vw,400px);gap:var(--gap);overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:var(--gt);margin-inline:calc(var(--gt) * -1);padding:6px var(--gt) 32px;scrollbar-width:none;cursor:grab}
.rail::-webkit-scrollbar{display:none}
.rail>li{scroll-snap-align:start;aspect-ratio:3/4;display:flex;flex-direction:column;justify-content:space-between;padding:28px}
.rail>li:nth-child(3n+1){background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b;border-color:transparent}
.rn{font-size:clamp(64px,6vw,104px);font-weight:var(--w-dsp);letter-spacing:-.06em;line-height:.85;color:var(--fg)}
.rail-ctl{display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
.rail-ctl [data-rail="-1"] .ar{transform:rotate(-135deg)}
.rail-ctl [data-rail="1"] .ar{transform:rotate(45deg)}
.rail-ctl .ring:hover{background:var(--fg);color:var(--bg)}
@media (max-width:767px){.rail>li{aspect-ratio:auto;min-height:340px}}`,
  ledger: `.ledger{border-top:1px solid var(--ln)}
.ledger>li{display:grid;grid-template-columns:clamp(70px,9vw,150px) minmax(0,5fr) minmax(0,6fr);gap:var(--gap);align-items:baseline;padding:clamp(26px,2.8vw,40px) 0;border-bottom:1px solid var(--ln);position:relative;transition:padding .6s var(--e)}
.ledger .ln{font-size:clamp(44px,5vw,84px);font-weight:var(--w-dsp);letter-spacing:-.06em;line-height:.8;color:var(--su);transition:color .5s}
.ledger>li:hover .ln{color:var(--fg)}
.ledger>li::after{content:"";position:absolute;left:0;bottom:-1px;height:1px;width:100%;background:var(--fg);transform:scaleX(0);transform-origin:0 50%;transition:transform .9s var(--e2)}
.ledger>li:hover::after{transform:scaleX(1)}
@media (min-width:1024px){.ledger>li:hover{padding-left:12px}}
@media (max-width:767px){.ledger>li{grid-template-columns:64px minmax(0,1fr)}.ledger .tx{grid-column:2}}`,
  flow: `.flow{position:relative;display:grid;gap:clamp(20px,2.4vw,36px);max-width:1180px;margin-inline:auto}
.flow-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--ln);transform:translateX(-50%)}
.flow-line>i{position:absolute;inset:0;background:var(--fg);transform-origin:top;transform:scaleY(var(--p,0))}
.flow>li{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:clamp(48px,7vw,120px)}
.flow>li .card{padding:28px;max-width:470px}
.flow>li.fl .card{grid-column:1;justify-self:end}
.flow>li.fr .card{grid-column:2;justify-self:start}
.flow .node{position:absolute;left:50%;top:34px;width:13px;height:13px;margin-left:-6.5px;border-radius:50%;background:var(--bg);border:1px solid var(--ls);transition:background .5s,border-color .5s,box-shadow .5s;z-index:1}
.flow>li.on .node{background:var(--fg);border-color:var(--fg);box-shadow:0 0 0 6px rgba(243,241,234,.08)}
@media (min-width:768px){.flow>li+li{margin-top:-72px}}
@media (max-width:767px){.flow-line{left:6px}.flow>li{grid-template-columns:1fr;padding-left:32px}.flow>li .card{grid-column:1!important;justify-self:stretch!important;max-width:none}.flow .node{left:6px}}`,
  chat: `.chat{display:flex;flex-direction:column;gap:14px;max-width:880px;margin-inline:auto}
.chat>li{display:flex}
.chat>li.cb{justify-content:flex-end}
.chat .bub{max-width:min(560px,86%);padding:22px 26px;border-radius:26px;background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.chat>li.ca .bub{border-bottom-left-radius:8px}
.chat>li.cb .bub{border-bottom-right-radius:8px;background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b;border-color:transparent}
.chat .typing .bub{display:flex;gap:6px;padding:18px 22px}
.chat .typing i{width:7px;height:7px;border-radius:50%;background:var(--mu);animation:dot 1.4s infinite ease-in-out}
.chat .typing i:nth-child(2){animation-delay:.18s}.chat .typing i:nth-child(3){animation-delay:.36s}
@keyframes dot{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}
@media (prefers-reduced-motion:reduce){.chat .typing i{animation:none}}`,
  tiles: `.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.tiles>li{aspect-ratio:1/1.08;display:flex;flex-direction:column;justify-content:space-between;padding:26px;transition:background .6s var(--e),color .6s var(--e),transform .7s var(--e),box-shadow .7s var(--e)}
.tn{font-size:clamp(72px,7.4vw,128px);font-weight:var(--w-dsp);letter-spacing:-.07em;line-height:.8;color:var(--fg)}
.tiles>li:hover{background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b}
@media (max-width:1023px){.tiles{grid-template-columns:1fr 1fr}}
@media (max-width:639px){.tiles{grid-template-columns:1fr}.tiles>li{aspect-ratio:auto;min-height:260px}}`,
};

const SHARED_CSS = `.sp-part{display:flex;flex-wrap:wrap;align-items:center;gap:10px;color:rgba(243,241,234,.6)}
.sp-part .cap{color:inherit}
.sp-part .tag{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#f3f1ea;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sp-part:hover .tag{border-color:rgba(255,255,255,.3)}
.sp-ban{margin-bottom:clamp(64px,8vw,120px)}
.flc{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px var(--gap);padding:clamp(28px,4vw,64px);border-radius:var(--rx);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh2);position:relative;overflow:hidden;isolation:isolate}
.flc>*{grid-column:1/-1}
@media (min-width:1024px){.flc .a{grid-column:1/span 5}.flc .b{grid-column:7/-1}}
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
@media (max-width:639px){.stg>li{grid-template-columns:32px minmax(0,1fr)}.stg .this{grid-column:2}}
.pcard{display:block;padding:12px;border-radius:var(--r3)}
.pcard .ph{border-radius:20px;box-shadow:none}
.pcard .row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:20px 12px 8px}
.pcard .tx{padding:0 12px 10px}`;

module.exports = function service(d, o) {
  const inc = INC[o.inc](d);
  const html = `<main>
  <section class="hero">
    <div class="hero-bg shade"></div>
    <div class="hero-grid">
      <div class="hl">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/services">Services</a></li><li aria-current="page">${d.crumb}</li></ol></nav>
        <p class="kick mt-48">${d.eyebrow}</p>
        <h1 class="d1 mt-24">${d.h1}</h1>
      </div>
      <div class="hr">
        <p class="lead">${d.lead}</p>
        <div class="btn-row mt-32">${d.btns.map(btn).join('')}</div>
        <a class="sp-part mt-32" href="/fledge"><span class="cap">${d.partCap}</span><span class="tags">${d.partTags.map((t) => `<span class="tag">${t}</span>`).join('')}</span></a>
      </div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="plain-h">
    <div class="sp-ban"><div class="${d.bannerCls}" data-r="x">${d.banner}</div></div>
    <div class="g12">
      <div class="c1-5"><p class="kick">${d.plain.eb}</p><h2 class="h2 mt-24" id="plain-h">${d.plain.h2}</h2></div>
      <p class="lead fg c7-12">${d.plain.p}</p>
    </div>
    <dl class="facts mt-96" data-r="s">${d.plain.facts.map((f) => `<div><dt class="cap">${f.k}</dt><dd>${f.v}</dd></div>`).join('')}</dl>
  </section>

  <section class="sheet dk sec" aria-labelledby="sf-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><h2 class="d2" id="sf-h">${d.sf.h2}</h2></div></div>
      <ol class="qlist c5-12">${d.sf.q.map((q, i) => `<li data-r="u"><span class="n">${pad(i + 1)}</span><p>${q}</p></li>`).join('')}</ol>
    </div>
  </section>

  <section class="sheet sf sec inc-${o.inc}" aria-labelledby="inc-h">
    <div class="head"><div><p class="kick">${d.inc.eb}</p><h2 class="h2 mt-24" id="inc-h" style="max-width:18ch">${d.inc.h2}</h2></div></div>
    ${inc}
  </section>

  <section class="sheet lt sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">${d.how.eb}</p><h2 class="h2 mt-24" id="how-h" style="max-width:12ch">${d.how.h2}</h2></div></div>
      <ol class="steps c7-12">${d.how.steps.map((s) => `<li data-r="u"><span class="i">${s.n}</span><div><h3>${s.h}</h3><p>${s.p}</p></div></li>`).join('')}</ol>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="choose-h">
    <div class="head"><div><p class="kick">${d.choose.eb}</p><h2 class="h2 mt-24" id="choose-h" style="max-width:20ch">${d.choose.h2}</h2></div></div>
    <ol class="rows hov mt-64">${d.choose.items.map((it) => `<li data-r="u"><span class="n">(${it.n})</span><h3 class="h3 t">${it.h}</h3><p class="tx b">${it.p}</p></li>`).join('')}</ol>
  </section>

  <section class="sheet sf sec" aria-labelledby="fl-h">
    <div class="flc" data-r="u">
      <div class="a">
        <p class="kick">${d.fl.eb}</p>
        <h2 class="h2 mt-24" id="fl-h">${d.fl.h2}</h2>
        <p class="tx mt-24">${d.fl.p}</p>
        <a class="lnk mt-32" href="${d.fl.link.href}">${d.fl.link.t}{{ar}}</a>
      </div>
      <ol class="stg b" aria-label="${d.fl.stagesLabel}">${d.fl.stages.map((s) => `<li class="${s.on ? 'on' : ''}"><span class="n">${s.n}</span><div><p class="nm">${s.nm}</p><p class="lnn">${s.ln}</p></div>${s.this ? `<p class="this">${s.this}</p>` : ''}</li>`).join('')}</ol>
    </div>
    <div class="head mt-128"><p class="kick">${d.fl.withCap}</p><a class="lnk" href="/services">All services{{ar}}</a></div>
    <div class="svcs mt-32" data-r="s">${d.fl.sibs.map((s) => `
      <a class="card lift svc" href="${s.href}"><img class="cov" src="${s.img}" alt="" width="960" height="684" loading="lazy"><div><h3>${s.h}</h3><p class="sub">${s.sub}</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>`).join('')}
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="proof-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><p class="kick">${d.proof.eb}</p><h2 class="h2 mt-24" id="proof-h">${d.proof.h2}</h2>
        <p class="sm mt-32" style="max-width:30ch">${d.proof.note}</p><a class="lnk mt-24" href="${d.proof.link.href}">${d.proof.link.t}{{ar}}</a></div></div>
      <a class="card lift pcard c5-12" href="${d.proof.href}" data-r="u">
        <div class="${d.proof.phCls}">${d.proof.ph}</div>
        <div class="row"><div><h3 class="h3">${d.proof.client}</h3><p class="cap mt-12">${d.proof.sector}</p></div><span class="ring">{{ar}}</span></div>
        <p class="tx">${d.proof.line}</p>
      </a>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">${d.faq.eb}</p><h2 class="h2 mt-24" id="faq-h" style="max-width:12ch">${d.faq.h2}</h2></div></div>
      <div class="faq c7-12">${d.faq.items.map((f) => `
        <details${f.open ? ' open' : ''}><summary><h3>${f.q}</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">${f.a}</p></details>`).join('')}
      </div>
    </div>
  </section>

  <section class="sheet lt cta" aria-labelledby="cta-h">
    <p class="kick">${d.cta.eb}</p>
    <h2 class="d1 mt-32" id="cta-h">${d.cta.h2}</h2>
    <div class="btn-row mt-48"><a class="btn btn-p" href="${d.cta.btn.href}">${d.cta.btn.t}{{ar}}</a></div>
  </section>
</main>`;
  const init = INIT[o.inc] || null;
  return { css: SHARED_CSS + '\n' + CSS[o.inc], html, init };
};

const INIT = {
  rail: function (R) {
    var rail = R.querySelector('.rail');
    if (!rail) return;
    R.querySelectorAll('[data-rail]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = rail.querySelector('li');
        var step = card ? card.getBoundingClientRect().width + 20 : 320;
        rail.scrollBy({ left: step * +b.getAttribute('data-rail'), behavior: 'smooth' });
      });
    });
    // drag to scroll with a mouse
    var down = false, x0 = 0, s0 = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = rail.scrollLeft; rail.style.scrollSnapType = 'none'; });
    addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = s0 - dx; });
    addEventListener('pointerup', function () { if (!down) return; down = false; rail.style.scrollSnapType = ''; });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  },
  flow: function (R) {
    var list = R.querySelector('.flow'), fill = R.querySelector('.flow-line');
    if (!list || !fill) return;
    var items = list.querySelectorAll(':scope > li'), ticking = false;
    function update() {
      ticking = false;
      var r = list.getBoundingClientRect(), mid = innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(4));
      items.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top + 40 < mid); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  },
};
