// Homepage (marcus-vane.js) patches, applied to the byte-exact original in current/.
// Rejouice layout: a wordmark hero, the video as section 2 (it grows to full bleed as
// it scrolls in), the statement set large and light, and a two-row banner driven by
// scroll speed. The shared dd-core nav and footer are appended at the end.
// Each `find` (or `from`..`to` range) must occur exactly once.
const port = require('./gl-port.js');
const { mono } = require('./mono.js');
const fs = require('fs');

// ===== type and spacing: light weights, open tracking, more air (rejouice metrics) =====
const RJ_CSS = `
/* ===== rejouice layer ===== */
:host { --font-display: "Switzer", sans-serif; --gutter: 2.5rem; --section: 13rem; --text-body: 1.125rem; --lh-body: 1.45; --text-lead: 1.25rem; --lh-lead: 1.32; letter-spacing: -0.01em; }
@media (max-width: 640px) { :host { --gutter: 1.15rem; --section: 7.5rem; --text-body: 1rem; --text-lead: 1.1rem; } }
.eyebrow, .dz-eyebrow { font-size: 1rem; font-weight: 300; text-transform: none; letter-spacing: -0.01em; color: var(--muted); }
.eyebrow .dot { display: none; }
.dz-display, .story-heading, .ventures-heading, .impact-heading, .voices-heading, .contact-heading { font-weight: 300; letter-spacing: -0.025em; line-height: 1.04; }
.dz-lead, .story-body, .principle p, .venture p, #dz-about-para, .voices-quote p { font-weight: 300; }
.principle h3, .venture h3, .voice-btn .vname, .dz-team-card figcaption .n, #dz-form-panel h3, #dz-form-done h3, .contact-email { font-weight: 400; letter-spacing: -0.015em; }
.principle .idx { font-weight: 300; }
.venture .outcome, #dz-form-panel label { font-weight: 400; text-transform: none; letter-spacing: -0.005em; font-size: 0.9rem; }
.dz-btn, .hero-btn, .hero-btn-2, #dz-form-submit { font-weight: 400; text-transform: none; letter-spacing: -0.01em; }
#dz-about-row { margin-top: 0; }
/* service cards: the image fills the card under a light veil, the title big and bold; on hover the image blurs, the veil darkens and the text appears */
.dz-svc-card, .dz-svc-card.lime, .dz-svc-card.brand { background: #020202; color: #fff; border-color: rgba(243,241,234,.12); }
.dz-svc-card .dz-bg { inset: 0; background-size: cover; background-position: center; filter: none; transform: scale(1.001); transition: filter .6s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
.dz-svc-card .dz-bg::after { background-color: rgba(2,2,2,0); background-image: linear-gradient(180deg, rgba(2,2,2,.5) 0%, rgba(2,2,2,.1) 38%, rgba(2,2,2,.08) 62%, rgba(2,2,2,.45) 100%); transition: background-color .6s ease; }
.dz-svc-card:hover .dz-bg { filter: blur(16px) brightness(.9); transform: scale(1.08); }
.dz-svc-card:hover .dz-bg::after { background-color: rgba(2,2,2,.5); }
.dz-svc-card h3 { font-weight: 600; letter-spacing: -0.03em; }
.dz-svc-card:not(.ph) .dz-bg { filter: grayscale(1); }
.dz-svc-card:not(.ph):hover .dz-bg { filter: blur(16px) grayscale(1) brightness(.9); }
.dz-svc-card.ph .dz-bg { background-position: center 18%; }
.dz-svc-card.ph-low .dz-bg { background-position: var(--xm, var(--x, 58%)) center; }
@media (min-width: 768px) { .dz-svc-card.ph-low .dz-bg { background-size: auto var(--s, 86%); background-position: var(--x, 58%) 100%; background-repeat: no-repeat; } }
/* an image narrower than its card: fade its side edges into the card (desktop) */
@media (min-width: 768px) { .dz-svc-card.ph-fade { container-type: size; } .dz-svc-card.ph-fade .dz-bg { -webkit-mask-image: linear-gradient(90deg, transparent calc(50cqw - 38cqh), #000 calc(50cqw - 26cqh), #000 calc(50cqw + 26cqh), transparent calc(50cqw + 38cqh)); mask-image: linear-gradient(90deg, transparent calc(50cqw - 38cqh), #000 calc(50cqw - 26cqh), #000 calc(50cqw + 26cqh), transparent calc(50cqw + 38cqh)); } }
/* a light photo (white base): dark text, a white veil, a frosted blur on hover */
.dz-svc-card.ph-light { background: #fff; color: #08080a; border-color: rgba(8,8,10,.1); }
.dz-svc-card.ph-light h3, .dz-svc-card.ph-light .dz-idx { color: #08080a; }
.dz-svc-card.ph-light .dz-bg::after { background-image: linear-gradient(180deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,.12) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,.35) 100%); }
.dz-svc-card.ph-light:hover .dz-bg, .dz-svc-card.ph-light.is-on .dz-bg { filter: blur(16px) brightness(1.03); }
.dz-svc-card.ph-light:hover .dz-bg::after, .dz-svc-card.ph-light.is-on .dz-bg::after { background-color: rgba(255,255,255,.6); }
/* a lime photo: lime card, dark text, a lime veil on hover */
.dz-svc-card.ph-lime { background: #d9fb03; color: #08080a; border-color: rgba(8,8,10,.12); }
.dz-svc-card.ph-lime h3, .dz-svc-card.ph-lime .dz-idx { color: #08080a; }
.dz-svc-card.ph-lime .dz-bg::after { background-image: none; }
.dz-svc-card.ph-lime:hover .dz-bg, .dz-svc-card.ph-lime.is-on .dz-bg { filter: blur(16px); }
.dz-svc-card.ph-lime:hover .dz-bg::after, .dz-svc-card.ph-lime.is-on .dz-bg::after { background-color: rgba(217,251,3,.6); }
/* image under the title, never behind it: a wide image pinned to the bottom, full width, whole and uncut */
.dz-svc-card.ph-under .dz-bg { inset: 50% 0 0 0; background-size: cover; background-position: center bottom; background-repeat: no-repeat; }
@supports (aspect-ratio: 1) { .dz-svc-card.ph-under .dz-bg { top: auto; aspect-ratio: 16 / 9; } }
/* card 05: the collage enlarged so its art reaches the top edge (the empty top of the image is cropped off) and the hand
   rests on the bottom; a smooth black gradient on top of the picture keeps the title readable */
.dz-svc-card.ph-drop { container-type: size; }
.dz-svc-card.ph-drop .dz-bg { background-size: cover; background-position: 30% 0; background-repeat: no-repeat; }
/* cq units measure the card's content box, so add the card padding back (1.5rem, 2rem from 768px) to get the image layer's size */
@supports (width: 1cqw) { .dz-svc-card.ph-drop .dz-bg { --p: 3rem; --S: max(calc(100cqw + var(--p)), calc((100cqh + var(--p)) * 1.39)); background-size: var(--S) var(--S); background-position: var(--x, 41%) calc(var(--S) * -0.21); } }
@media (min-width: 768px) { .dz-svc-card.ph-drop .dz-bg { --p: 4rem; --x: 30%; } }
.dz-svc-card.ph-drop .dz-bg::after { background-image: linear-gradient(180deg, rgba(2,2,2,.94) 0%, rgba(2,2,2,.9) 8%, rgba(2,2,2,.8) 16%, rgba(2,2,2,.64) 24%, rgba(2,2,2,.45) 32%, rgba(2,2,2,.27) 40%, rgba(2,2,2,.13) 48%, rgba(2,2,2,.04) 56%, rgba(2,2,2,0) 64%, rgba(2,2,2,0) 76%, rgba(2,2,2,.3) 100%); }
/* touch screens have no hover: the card that settles mid-screen opens up the same way */
@media (hover: none) {
  .dz-svc-card h3 { font-size: clamp(2.3rem, 7vw, 2.9rem); }
  .dz-svc-card .dz-sub { opacity: 0; transform: translateY(10px); }
  .dz-svc-card.is-on h3 { font-size: 1.65rem; }
  .dz-svc-card.is-on .dz-sub { opacity: .9; transform: none; }
  .dz-svc-card.is-on .dz-bg { filter: blur(16px) brightness(.9); transform: scale(1.08); }
  .dz-svc-card.is-on:not(.ph) .dz-bg { filter: blur(16px) grayscale(1) brightness(.9); }
  .dz-svc-card.is-on .dz-bg::after { background-color: rgba(2,2,2,.5); }
}
#dz-about-stats dt, .head-count, .stat .label, .venture .cat, .venture .year, .voice-btn .vrole, .voices-quote footer { text-transform: none; letter-spacing: -0.005em; font-weight: 300; font-size: 0.95rem; line-height: 1.25; }

/* preloader: a light curtain with the mark, lifting onto the black hero */
.preloader { align-items: center; justify-content: center; }
@media (min-width: 640px) { .preloader { flex-direction: column; align-items: center; justify-content: center; } }
.preloader .bg { background: #f3f1ea; }
.preloader .brand { height: 2.4rem !important; filter: invert(1); animation: rjpre 1.1s cubic-bezier(.16,1,.3,1) both; }
.preloader .counter { display: none; }
@keyframes rjpre { from { opacity: 0; filter: invert(1) blur(8px); transform: translateY(8px); } to { opacity: 1; filter: invert(1) blur(0); transform: none; } }

/* hero: the wordmark across the top, two small captions, the calls to action and the cue at the foot */
.hero.rj-hero { justify-content: space-between; height: 100vh; height: 100svh; min-height: 36rem; padding: 9.25rem var(--gutter) 2.25rem; background: var(--background); }
.rj-gl { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 2.4s cubic-bezier(.16,1,.3,1); pointer-events: none; }
.rj-gl.on { opacity: 0.5; }
.rj-word { position: relative; z-index: 1; display: block; margin: 0 -0.03em -0.12em; padding-bottom: 0.12em; overflow: hidden; white-space: nowrap; font-family: var(--font-sans); font-size: 15vw; line-height: 0.8; letter-spacing: -0.065em; color: var(--foreground); user-select: none; will-change: transform; }
.rj-word .l { font-weight: 300; }
.rj-word .b { font-weight: 600; }
.rj-ch { display: inline-block; font-style: normal; transform: translate3d(0, 112%, 0); transition: transform 1.3s cubic-bezier(.16,1,.3,1) var(--d, 0ms); }
.rj-in .rj-ch { transform: none; }
.rj-foot { position: relative; z-index: 1; display: grid; grid-template-columns: auto auto 1fr auto; align-items: end; gap: 1rem 3.5rem; }
.rj-cap { font-size: 1rem; line-height: 1.12; font-weight: 300; letter-spacing: -0.01em; color: var(--foreground); }
.rj-ctas { justify-self: end; display: flex; gap: 0.6rem; }
.rj-hero .hero-btn, .rj-hero .hero-btn-2 { height: 2.9rem; padding: 0 1.35rem; font-size: 0.95rem; }
.rj-cue { display: flex; align-items: center; gap: 0.55rem; font-size: 1rem; font-weight: 300; color: var(--foreground); }
.rj-cue svg { width: 0.8rem; height: 0.8rem; animation: rjbob 2.4s cubic-bezier(.65,0,.35,1) infinite; }
@keyframes rjbob { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(3px); } }
.rj-fade { opacity: 0; transform: translateY(12px); transition: opacity 0.9s ease var(--d, 0ms), transform 1.1s cubic-bezier(.16,1,.3,1) var(--d, 0ms); }
.rj-in .rj-fade { opacity: 1; transform: none; }
@media (max-width: 640px) {
  .hero.rj-hero { padding: 7rem var(--gutter) 1.4rem; min-height: 30rem; }
  .rj-foot { grid-template-columns: auto auto 1fr; gap: 1.6rem 1.4rem; }
  .rj-ctas { grid-column: 1 / -1; grid-row: 1; justify-self: stretch; }
  .rj-ctas a { flex: 1; padding: 0 0.9rem; }
  .rj-cap { font-size: 0.9rem; }
  .rj-cue { justify-self: end; }
  .rj-cue span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}

/* section 2: the film, opening from an inset frame to full bleed */
.stack-reveal { border-top: 0; }
.rj-reel { position: relative; height: 175vh; height: 175svh; }
.rj-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
.rj-frame { position: absolute; inset: 0; overflow: hidden; background: #111114; clip-path: inset(14% 10% round 1.75rem); will-change: clip-path; }
.rj-frame video { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; transform: scale(1.18); will-change: transform; }
.rj-frame::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,8,10,.4), rgba(8,8,10,.12) 42%, rgba(8,8,10,.5)); pointer-events: none; }
.rj-tag { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; padding: 0 var(--gutter); text-align: center; pointer-events: none; }
.rj-tag p { max-width: 15ch; font-size: 3.875rem; line-height: 1.08; font-weight: 300; letter-spacing: -0.025em; color: #fff; opacity: var(--to, 0); transform: translateY(calc((1 - var(--to, 0)) * 28px)); filter: blur(calc((1 - var(--to, 0)) * 8px)); }
@media (max-width: 640px) { .rj-reel { height: 150svh; } .rj-tag p { font-size: 2rem; } }

/* the statement: large, light, first line indented */
.manifesto { display: block; min-height: 0; padding: 11rem var(--gutter) 10rem; }
.manifesto-statement { max-width: none; text-align: left; font-weight: 300; font-size: 3.875rem; line-height: 1.08; letter-spacing: -0.025em; text-indent: 18%; }
.manifesto-statement > span { text-indent: 0; }
@media (max-width: 640px) { .manifesto { padding: 6.5rem var(--gutter) 6rem; } .manifesto-statement { font-size: 1.9rem; text-indent: 0; } }

/* the banner: two rows, solid and outlined, pushed by scroll speed */
.marquee.rj-mq { display: flex; flex-direction: column; gap: 0.2rem; padding: 3rem 0 4.5rem; border: 0; overflow: hidden; }
.rj-mq .marquee-track { animation: none; will-change: transform; }
.rj-mq .word { font-family: var(--font-sans); font-size: 8.4rem; line-height: 1.02; font-weight: 300; letter-spacing: -0.045em; white-space: nowrap; color: var(--foreground); transition: color 0.5s ease; }
.rj-mq .rj-alt .word { color: transparent; -webkit-text-stroke: 1px rgba(243,241,234,.5); }
.rj-mq .rj-alt .item:hover .word { color: var(--foreground); }
.rj-mq .sep { display: inline-grid; width: 3rem; height: 3rem; margin-inline: 2.6rem; border-radius: 0; background: none; color: var(--accent); }
.rj-mq .sep svg { width: 100%; height: 100%; transform: rotate(var(--rot, 0deg)); }
@media (max-width: 640px) { .marquee.rj-mq { padding: 2rem 0 3rem; } .rj-mq .word { font-size: 3.6rem; } .rj-mq .sep { width: 1.5rem; height: 1.5rem; margin-inline: 1.2rem; } }
@media (prefers-reduced-motion: reduce) { .rj-ch, .rj-fade { transition: none; transform: none; opacity: 1; } .rj-cue svg { animation: none; } }

/* the shared dd-core nav and footer replace these on the homepage */
.site-nav, .mobile-menu, footer.contact { display: none !important; }
`;

// ===== hero markup =====
const ARROW_DN = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.5v8.6M2.4 6.6 6 10.2l3.6-3.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let n = 0;
// two voices: even letters early and staggered, odd letters later and together
const chars = (s) => [...s].map((c) => { const i = n++; const d = i % 2 ? 300 + i * 10 : 80 + i * 34; return `<i class="rj-ch" style="--d:${d}ms">${c}</i>`; }).join('');
const WORD = `<span class="l">${chars('disruptive')}</span><span class="b">${chars('dodo.')}</span>`;
const HERO = `  <section class="hero rj-hero" id="top">
    <canvas class="rj-gl" aria-hidden="true"></canvas>
    <h1 class="rj-word"><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Disruptive Dodo</span><span aria-hidden="true">${WORD}</span></h1>
    <div class="rj-foot">
      <p class="rj-cap rj-fade" style="--d:900ms">Websites<br>Advertising</p>
      <p class="rj-cap rj-fade" style="--d:980ms">Automation<br>Growth</p>
      <div class="rj-ctas rj-fade" style="--d:1060ms">
        <a class="hero-btn" href="#dz-contact"><span class="hero-btn-fill" aria-hidden="true"></span><span class="hero-btn-roll"><span class="a">Get more clients</span><span class="b" aria-hidden="true">Get more clients</span></span></a>
        <a class="hero-btn-2" href="#dz-services">See what we do</a>
      </div>
      <p class="rj-cue rj-fade" style="--d:1140ms"><span>Scroll to begin</span>${ARROW_DN}</p>
    </div>
  </section>
`;
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 7.4 4.6 11.4 12 12-7.4.6-11.4 4.6-12 12-.6-7.4-4.6-11.4-12-12 7.4-.6 11.4-4.6 12-12Z" fill="currentColor"/></svg>';
const REEL_AND_STATEMENT = `  <div class="stack-reveal">
  <section class="rj-reel" id="reel" aria-label="Local team. Real specialists. No outsourcing.">
    <div class="rj-stage">
      <div class="rj-frame"><video src="/uploads/IQzHSDYrM4K_U-bTGOt-d-1111__1_.webm" muted loop playsinline preload="none"></video></div>
      <div class="rj-tag"><p>Local team. Real specialists. No outsourcing.</p></div>
    </div>
  </section>
  <section class="manifesto" id="manifesto" data-section>
    <h2 class="manifesto-statement" id="manifesto-statement">Disruptive Dodo is a marketing and business growth agency based in Mauritius, working with businesses locally and globally 🌍. We build systems that generate leads, close deals, and scale operations. Our team has done it across 20+ industries 🚀.</h2>
  </section>
  <section class="marquee rj-mq" aria-label="Operating principles">
    <div class="marquee-track" id="marquee-track"></div>
    <div class="marquee-track rj-alt" id="marquee-track-2" aria-hidden="true"></div>
  </section>
`;

// ===== behaviour =====
const RJ_JS = (gl) => `// ===== rejouice hero, film, banner =====
const RJ_GL = { cfg: ${JSON.stringify(gl.cfg)}, mount: ${gl.fn} };
function rjInit(R) {
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = R.querySelector(".rj-hero");
  const word = R.querySelector(".rj-word");
  // the wordmark fills the hero's width exactly
  const fitWord = () => {
    if (!word) return;
    word.style.fontSize = "100px";
    const rg = document.createRange();
    rg.selectNodeContents(word.lastElementChild);
    const w = rg.getBoundingClientRect().width;
    const box = hero.clientWidth - parseFloat(getComputedStyle(hero).paddingLeft) * 2;
    if (w > 0) word.style.fontSize = (100 * box / w).toFixed(2) + "px";
  };
  fitWord();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
  let ft = 0;
  addEventListener("resize", () => { clearTimeout(ft); ft = setTimeout(fitWord, 120); }, { passive: true });

  // the hero gives way: the wordmark drifts up as the film slides over it
  const film = R.querySelector(".rj-reel"), frame = film && film.querySelector(".rj-frame"), vid = film && film.querySelector("video"), tag = film && film.querySelector(".rj-tag");
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    if (word && !RM) { const p = Math.min(1, scrollY / vh); word.style.transform = "translate3d(0," + (-p * vh * 0.22).toFixed(1) + "px,0)"; }
    // the hero stays pinned under the page: once it is covered, the gradient stops drawing
    const glc = R.querySelector(".rj-gl"), off = scrollY > vh * 1.15;
    if (glc && glc._off !== off) { glc._off = off; glc.style.display = off ? "none" : ""; }
    if (film) {
      const r = film.getBoundingClientRect();
      const p = RM ? 1 : Math.min(1, Math.max(0, (vh - r.top) / vh));
      const e = 1 - Math.pow(1 - p, 3);
      frame.style.clipPath = "inset(" + ((1 - e) * 14).toFixed(2) + "% " + ((1 - e) * 10).toFixed(2) + "% round " + ((1 - e) * 1.75).toFixed(3) + "rem)";
      if (vid) vid.style.transform = "scale(" + (1.18 - 0.18 * e).toFixed(4) + ")";
      tag.style.setProperty("--to", Math.min(1, Math.max(0, (p - 0.55) / 0.35)).toFixed(3));
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
  if (vid) {
    vid.muted = true;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } else vid.pause();
    }, { rootMargin: "200px 0px" }).observe(film);
  }

  // GetLayers "Demilune": a soft light the cursor carries, tinted to the greys, mounted once the curtain lifts
  const cv = R.querySelector(".rj-gl");
  if (cv) {
    const go = () => {
      try { if (RJ_GL.mount(cv, RJ_GL.cfg, { still: RM, t: 6 })) requestAnimationFrame(() => cv.classList.add("on")); else cv.remove(); }
      catch (err) { cv.remove(); }
    };
    setTimeout(() => { if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 800 }); else go(); }, RM ? 0 : 2600);
  }

  // touch screens: the service card nearest the middle opens after a short pause, so the image is seen first
  if (window.matchMedia("(hover: none)").matches) {
    const cards = [...R.querySelectorAll(".dz-svc-card")];
    let busy = false, cur = null, next = null, wait = 0;
    const pick = () => {
      busy = false;
      const mid = innerWidth / 2;
      let best = null, bd = 1e9;
      cards.forEach((c) => { const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const d = Math.abs(r.left + r.width / 2 - mid); if (d < bd && d < r.width * 0.35) { bd = d; best = c; } });
      if (best === next) return;
      next = best; clearTimeout(wait);
      if (cur && cur !== best) { cur.classList.remove("is-on"); cur = null; }
      if (best) wait = setTimeout(() => { best.classList.add("is-on"); cur = best; }, 700);
    };
    const ask = () => { if (!busy) { busy = true; requestAnimationFrame(pick); } };
    addEventListener("scroll", ask, { passive: true });
    const rail = R.getElementById("dz-svc-rail");
    if (rail) rail.addEventListener("scroll", ask, { passive: true });
    pick();
  }

  // the banner: a slow drift, pushed by scroll speed, turning with the scroll, leaning into it
  const mq = R.querySelector(".rj-mq");
  if (mq && !RM) {
    const rows = [...mq.querySelectorAll(".marquee-track")].map((t, i) => ({ t, x: 0, dir: i ? 1 : -1, w: 0 }));
    const measure = () => rows.forEach((s) => { s.w = s.t.scrollWidth / 2; if (s.dir > 0) s.x = -s.w * 0.37; });
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    addEventListener("resize", measure, { passive: true });
    let on = false, raf = 0, last = 0, lastY = scrollY, vel = 0, sk = 0, rot = 0, sign = 1;
    const step = (now) => {
      if (!on) { raf = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
      const y = scrollY, v = dt ? (y - lastY) / dt : 0; lastY = y;
      vel += (v - vel) * Math.min(1, dt * 8);
      if (Math.abs(vel) > 40) sign = vel > 0 ? 1 : -1;
      const speed = 55 + Math.min(Math.abs(vel) * 0.55, 1500);
      sk += (-Math.max(-1, Math.min(1, vel / 2600)) * 8 - sk) * Math.min(1, dt * 6);
      rot += speed * dt * 0.3 * sign;
      rows.forEach((s) => {
        if (!s.w) return;
        s.x += s.dir * sign * speed * dt;
        s.x = ((s.x % s.w) + s.w) % s.w - s.w;
        s.t.style.transform = "translate3d(" + s.x.toFixed(1) + "px,0,0) skewX(" + sk.toFixed(2) + "deg)";
      });
      mq.style.setProperty("--rot", rot.toFixed(1) + "deg");
      raf = requestAnimationFrame(step);
    };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on && !raf) { last = 0; lastY = scrollY; raf = requestAnimationFrame(step); } }, { rootMargin: "120px 0px" }).observe(mq);
  }
}

function mvApp(R) {`;

const MARQUEE_OLD_START = '  (function buildMarquee(){';
const MARQUEE_OLD_END = '  (function buildVentures(){';
const MARQUEE_NEW = `  (function buildMarquee(){
    const STAR = ${JSON.stringify(STAR)};
    const fill = (track, words) => {
      if (!track) return;
      const frag = document.createDocumentFragment();
      ["a","b"].forEach(() => {
        words.forEach((word) => {
          const item = document.createElement("span"); item.className = "item";
          const w = document.createElement("span"); w.className = "word"; w.textContent = word;
          const sep = document.createElement("span"); sep.className = "sep"; sep.setAttribute("aria-hidden","true"); sep.innerHTML = STAR;
          item.append(w, sep); frag.appendChild(item);
        });
      });
      track.appendChild(frag);
    };
    fill(byId("marquee-track"), marqueeWords);
    fill(byId("marquee-track-2"), marqueeWords.slice(3).concat(marqueeWords.slice(0, 3)));
  })();

`;

function patches(gl) {
  return [
    {
      find: '.dz-card-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }\n`;',
      replace: '.dz-card-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }\n' + RJ_CSS + '`;',
    },
    { from: '  <section class="hero" id="top">', to: '  <div class="stack-reveal">', replace: HERO },
    { from: '  <div class="stack-reveal">', to: '  <section id="dz-services" data-dz>', replace: REEL_AND_STATEMENT },
    { from: '    <div id="dz-about-banner">', to: '    <div id="dz-about-row">', replace: '' },
    { from: MARQUEE_OLD_START, to: MARQUEE_OLD_END, replace: MARQUEE_NEW },
    {
      find: '    R.querySelectorAll(".hero .inview").forEach((el) => el.classList.add("in-view"));\n  }',
      replace: '    R.querySelectorAll(".hero .inview").forEach((el) => el.classList.add("in-view"));\n    const rjh = R.querySelector(".rj-hero");\n    if (rjh) setTimeout(() => rjh.classList.add("rj-in"), 2350);\n  }',
    },
    {
      find: '    qa(".inview").forEach((i) => i.classList.add("in-view"));\n  }',
      replace: '    qa(".inview").forEach((i) => i.classList.add("in-view"));\n    qa(".rj-hero").forEach((h) => h.classList.add("rj-in"));\n  }',
    },
    { find: 'function mvApp(R) {', replace: RJ_JS(gl) },
    {
      find: `<article class="dz-svc-card lime">\n            <a class="dz-card-link" href="/services/marketing-automation-crm" aria-label="Discover Automation and CRM"></a><span class="dz-bg" style="background-image:url('/uploads/BVywNC3ExdKpfgDNuKj1K-svc-gradient-hearth.webp')"></span>`,
      replace: `<article class="dz-svc-card lime ph ph-drop">\n            <a class="dz-card-link" href="/services/marketing-automation-crm" aria-label="Discover Automation and CRM"></a><span class="dz-bg" role="img" aria-label="A hand holding a stack of coins in a collage of leaves, engraved banknote pieces and a cone of light" style="background-image:url('/uploads/Li4cZA7TOd5NO4dqCY0tU-svc-05-close-more-sales.webp')"></span>`,
    },
    {
      find: `<article class="dz-svc-card brand">\n            <a class="dz-card-link" href="/services/ai-chatbots" aria-label="Discover AI implementation"></a><span class="dz-bg" style="background-image:url('/uploads/jynwU4ZlUcvkFo7HdezFK-svc-gradient-cynosure.webp')"></span>`,
      replace: `<article class="dz-svc-card brand ph ph-lime ph-under">\n            <a class="dz-card-link" href="/services/ai-chatbots" aria-label="Discover AI implementation"></a><span class="dz-bg" role="img" aria-label="A white and chrome robotic hand typing on a keyboard on a lime background" style="background-image:url('/uploads/v3myoSUdgXACOKm9jF2E_-svc-04-robot-keyboard-wide.webp')"></span>`,
    },
    {
      find: `<article class="dz-svc-card lime">\n            <a class="dz-card-link" href="/services/branding-logo-design" aria-label="Discover Branding"></a><span class="dz-bg" style="background-image:url('/uploads/a77k9D6QYeB_rsP9prFT5-svc-gradient-meridian.webp')"></span>`,
      replace: `<article class="dz-svc-card lime ph ph-low">\n            <a class="dz-card-link" href="/services/branding-logo-design" aria-label="Discover Branding"></a><span class="dz-bg" role="img" aria-label="A tiny ant walks into a lone door and a huge elephant walks out, lit by a thin lime light" style="background-image:url('/uploads/lswKF9BnskEC0aCrz1hvP-svc-03-look-like-leader.webp')"></span>`,
    },
    {
      find: `<article class="dz-svc-card brand">\n            <a class="dz-card-link" href="/services/facebook-google-ads" aria-label="Discover Paid ads"></a><span class="dz-bg" style="background-image:url('/uploads/pRFJj72VWCnd0T9r_233u-svc-gradient-gnomon.webp')"></span>`,
      replace: `<article class="dz-svc-card brand ph">\n            <a class="dz-card-link" href="/services/facebook-google-ads" aria-label="Discover Paid ads"></a><span class="dz-bg" role="img" aria-label="Streams of people seen from above converging on one glowing lime point on a black floor" style="background-image:url('/uploads/qXcz1kpuNDfZZunGNJ81I-svc-02-more-customers.webp');background-position:68% center"></span>`,
    },
    {
      find: `<article class="dz-svc-card lime">\n            <a class="dz-card-link" href="/services/web-design" aria-label="Discover Websites and SEO"></a><span class="dz-bg" style="background-image:url('/uploads/rQj-rf6y8kzmTrOq8tCz6-svc-gradient-antipode.webp')"></span>`,
      replace: `<article class="dz-svc-card lime ph">\n            <a class="dz-card-link" href="/services/web-design" aria-label="Discover Websites and SEO"></a><span class="dz-bg" role="img" aria-label="A hand holding binoculars whose lenses show Google search results and Google Maps for My Business" style="background-image:url('/uploads/4SsE3nR2FS5MUv6PTN_CR-svc-01-get-found.webp')"></span>`,
    },
    { find: '<div><dd data-count="EN·FR"></dd><dt>We work in English and French</dt></div>', replace: '<div><dd data-count="EN·FR·KR"></dd><dt>We work in English, French and Creole</dt></div>' },
    { find: '      mvApp(shadow);\n      dzInit(shadow);', replace: '      mvApp(shadow);\n      dzInit(shadow);\n      rjInit(shadow);' },
  ];
}

function count(s, t) { return s.split(t).length - 1; }
function apply(s, list) {
  for (const p of list) {
    if (p.find !== undefined) {
      const k = count(s, p.find);
      if (k !== 1) throw new Error('find occurs ' + k + 'x: ' + p.find.slice(0, 60));
      s = s.replace(p.find, () => p.replace);
    } else {
      if (count(s, p.from) !== 1 || count(s, p.to) !== 1) throw new Error('range markers not unique: ' + p.from.slice(0, 50) + ' / ' + p.to.slice(0, 50));
      const a = s.indexOf(p.from), b = s.indexOf(p.to);
      if (b <= a) throw new Error('range out of order: ' + p.from.slice(0, 50));
      s = s.slice(0, a) + p.replace + s.slice(b);
    }
  }
  return s;
}

async function build() {
  const src = fs.readFileSync(__dirname + '/../gl/demilune.html', 'utf8');
  const def = eval('(' + src.match(/const CONFIG = (\{[\s\S]*?\n\})/)[1] + ')');
  const gl = { cfg: Object.assign(mono(def, { lift: 0.06, bg: '#08080a' }), { maxDpr: 1 }), fn: await port.clean(port('demilune')) };
  let s = apply(fs.readFileSync(__dirname + '/../current/marcus-vane.js', 'utf8'), patches(gl));
  // the shared nav and footer: the exact dd-core.js, in its own block scope so none of
  // its names meet the homepage's (the site will not scope dd-core.js to the homepage)
  const core = fs.readFileSync(__dirname + '/../out/dd-core.js', 'utf8');
  s = s + '\n// ===== shared nav and footer: identical to src/scripts/dd-core.js (generated, do not edit here) =====\n{\n' + core + '}\n';
  if (/—/.test(s)) throw new Error('em dash in homepage output');
  fs.writeFileSync(__dirname + '/../out/marcus-vane.js', s);
  new Function(s.replace(/^const /gm, 'var ')); // syntax check
  console.log('patched', s.length);
}
module.exports = { build };
if (require.main === module) build().catch((e) => { console.error(e.message); process.exit(1); });
