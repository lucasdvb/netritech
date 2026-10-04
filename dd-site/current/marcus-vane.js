// Disruptive Dodo: self-contained single-file site, mounted in a Shadow DOM on
// #mv-root for full style isolation. Loads as a normal Instatic module (no
// iframe, no injected inline script → CSP-safe). Inert on every other page.

const GLOBAL_CSS = `
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 400; font-display: swap; src: url("/uploads/omJGqkQH2HmXNSQfbAzJu-Switzer-Regular.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: italic; font-weight: 400; font-display: swap; src: url("/uploads/b5s6M9eMkB4o5eHMO2BBc-Switzer-Italic.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 500; font-display: swap; src: url("/uploads/XMolNpeQj8mWtCYl6S3hH-Switzer-Medium.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 600; font-display: swap; src: url("/uploads/FChqSYdv-vGwYA1WBuYg7-Switzer-Semibold.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 700; font-display: swap; src: url("/uploads/egFdUYtvUmJ40F2pke2w--Switzer-Bold.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 800; font-display: swap; src: url("/uploads/GjcCvVQ0cTOMMgfUX6f0B-Switzer-Extrabold.otf") format("opentype"); }
@font-face { font-family: "Switzer"; font-style: normal; font-weight: 900; font-display: swap; src: url("/uploads/XDy2ozhdbpIlWOPJqXA8M-Switzer-Black.otf") format("opentype"); }
@font-face { font-family: "Switzer Display"; font-style: normal; font-weight: 400 900; font-display: swap; src: url("/uploads/omJGqkQH2HmXNSQfbAzJu-Switzer-Regular.otf") format("opentype"); }
html { font-size: 16px; background: #08080a; }
@media (max-width: 1920px) { html { font-size: 0.833333vw; } }
@media (max-width: 1440px) { html { font-size: 1.111111vw; } }
@media (max-width: 1024px) { html { font-size: 1.5625vw; } }
@media (max-width: 640px) { html { font-size: 4.444444vw; } }
body { margin: 0; background: #08080a; overflow-x: clip; }
`;

const SHADOW_CSS = `
:host {
  display: block; position: relative; width: 100%;
  --background: #08080a;
  --foreground: #f3f1ea;
  --surface: #111114;
  --surface-2: #17171b;
  --muted: #807f78;
  --line: rgba(243, 241, 234, 0.1);
  --line-strong: rgba(243, 241, 234, 0.22);
  --accent: #d7d5cd;
  --accent-2: #f3f1ea;
  --font-display: "Switzer Display", "Switzer", sans-serif;
  --font-sans: "Switzer", sans-serif;
  --text-hero: 28rem;   --lh-hero: 0.78;
  --text-mega: 13rem;   --lh-mega: 0.86;
  --text-display: 7.5rem; --lh-display: 0.9;
  --text-h1: 5rem;      --lh-h1: 0.95;
  --text-h2: 3.25rem;   --lh-h2: 1;
  --text-h3: 1.75rem;   --lh-h3: 1.15;
  --text-lead: 1.375rem; --lh-lead: 1.55;
  --text-body: 1.0625rem; --lh-body: 1.7;
  --text-eyebrow: 0.8125rem; --lh-eyebrow: 1.2;
  --gutter: 3rem;
  --section: 12rem;
  color: var(--foreground);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--lh-body);
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
}
@media (max-width: 640px) { :host { --gutter: 20px; --section: 8rem; } }
* { margin: 0; padding: 0; box-sizing: border-box; }
img, video { display: block; max-width: 100%; }
ul, ol { list-style: none; }
button, a { font: inherit; color: inherit; background: none; border: none; cursor: pointer; text-decoration: none; -webkit-appearance: none; appearance: none; }
::selection { background: var(--accent); color: var(--background); }
main { position: relative; width: 100%; overflow-x: clip; }
.eyebrow { display: flex; align-items: center; gap: 0.75rem; font-size: var(--text-eyebrow); line-height: var(--lh-eyebrow); font-weight: 500; text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
.eyebrow .dot { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--accent); flex-shrink: 0; }
.ru-clip { display: inline-block; overflow: hidden; vertical-align: top; }
.ru-inner { display: inline-block; transform: translateY(var(--ru-off, 110%)); opacity: 0; will-change: transform, opacity; }
.inview { opacity: 0; transform: translateY(var(--iv-y, 24px)) scale(var(--iv-s, 1)); transition: opacity var(--iv-dur, 560ms) var(--iv-ease, cubic-bezier(0.16,1,0.3,1)) var(--iv-delay, 0ms), transform var(--iv-dur, 560ms) var(--iv-ease, cubic-bezier(0.16,1,0.3,1)) var(--iv-delay, 0ms); }
.inview.in-view { opacity: 1; transform: translateY(0) scale(1); }
.preloader { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: 0.75rem; padding: var(--gutter); transform: translateY(0); }
.preloader .bg { position: absolute; inset: 0; z-index: -10; background: var(--background); }
.preloader .brand { font-family: var(--font-display); font-size: var(--text-h3); line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; color: var(--foreground); }
.preloader .counter { flex-shrink: 0; font-family: var(--font-display); font-size: var(--text-display); line-height: 1; font-variant-numeric: tabular-nums; color: var(--foreground); }
.preloader .counter .pct { color: var(--accent); }
@media (min-width: 640px) { .preloader { flex-direction: row; align-items: flex-end; justify-content: space-between; gap: 1rem; } }
.site-nav { position: fixed; inset-inline: 0; top: 0; z-index: 50; pointer-events: none; }
.site-nav nav { pointer-events: auto; display: flex; align-items: center; justify-content: space-between; padding: 1.5rem var(--gutter); }
.nav-logo { display: flex; align-items: center; gap: 0.75rem; color: var(--foreground); }
.nav-logo .mono { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 9999px; border: 1px solid var(--line-strong); font-weight: 600; letter-spacing: -0.01em; }
.nav-logo .name { display: none; font-size: var(--text-eyebrow); font-weight: 500; text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
@media (min-width: 640px) { .nav-logo .name { display: block; } }
.nav-links { display: none; align-items: center; gap: 2.5rem; }
@media (min-width: 768px) { .nav-links { display: flex; } }
.nav-links a { position: relative; font-size: var(--text-eyebrow); font-weight: 500; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
.nav-links a:hover { color: var(--foreground); }
.nav-links a .underline { position: absolute; bottom: -0.25rem; left: 0; height: 1px; width: 0; background: var(--accent); transition: width 300ms ease-out; }
.nav-links a:hover .underline { width: 100%; }
.burger { position: relative; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem; width: 2.5rem; height: 2.5rem; }
@media (min-width: 768px) { .burger { display: none; } }
.burger span { height: 0.125rem; width: 1.5rem; background: var(--foreground); transition: transform 300ms ease-out, opacity 200ms ease-out; }
.burger.open span:nth-child(1) { transform: translateY(0.5rem) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-0.5rem) rotate(-45deg); }
.mobile-menu { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; justify-content: center; gap: 0.5rem; background: var(--background); padding-inline: var(--gutter); opacity: 0; pointer-events: none; transition: opacity 450ms ease-out; }
@media (min-width: 768px) { .mobile-menu { display: none; } }
.mobile-menu.open { opacity: 1; pointer-events: auto; }
.mobile-menu ul { display: flex; flex-direction: column; gap: 0.25rem; }
.mobile-menu li { overflow: hidden; }
.mobile-menu li > div { transform: translateY(48px); opacity: 0; transition: transform 420ms ease-out, opacity 420ms ease-out; }
.mobile-menu.open li > div { transform: translateY(0); opacity: 1; }
.mobile-menu a { display: block; padding: 0.375rem 0; font-family: var(--font-display); font-size: var(--text-h2); text-transform: uppercase; line-height: 1; letter-spacing: -0.01em; }
.site-nav { position: fixed; inset-inline: 0; top: 0; z-index: 50; pointer-events: none; height: 4rem; color: var(--nv-ink); --nv-ink: var(--foreground); --nv-line: rgba(243,241,234,0.4); --nv-fill: var(--foreground); --nv-fill-ink: var(--background); transition: color 260ms cubic-bezier(0.2,0,0,1); }
.site-nav[data-nav="light"] { --nv-ink: #0f0f12; --nv-line: rgba(15,15,18,0.42); --nv-fill: #0f0f12; --nv-fill-ink: #f5f3ec; }
.site-nav .nav-row { pointer-events: auto; display: flex; align-items: stretch; height: 100%; padding: 0; gap: 0; }
.site-nav .nav-cell { position: relative; display: flex; align-items: center; }
.site-nav .nav-logo-cell { flex: none; padding-inline: var(--gutter); }
.site-nav .nav-logo { display: flex; align-items: center; gap: 0; }
.site-nav .nav-logo-img { mix-blend-mode: normal; transition: filter 260ms cubic-bezier(0.2,0,0,1); }
.site-nav[data-nav="light"] .nav-logo-img { filter: brightness(0); }
.site-nav .nav-mid { flex: 1 1 auto; border-left: 1px dashed var(--nv-line); border-bottom: 1px dashed var(--nv-line); }
.site-nav .cmk { position: absolute; left: -2px; width: 4px; height: 4px; background: var(--nv-ink); transition: transform 300ms cubic-bezier(0.2,0,0,1); pointer-events: none; }
.site-nav .cmk-tl { top: -2px; }
.site-nav .cmk-bl { bottom: -2px; }
.site-nav .nav-action { flex: none; display: none; }
.site-nav .nav-swap { position: relative; display: block; width: 0.66rem; height: 0.66rem; overflow: hidden; flex: none; }
.site-nav .nav-swap svg { position: absolute; inset: 0; width: 0.66rem; height: 0.66rem; transition: transform 340ms cubic-bezier(0.2,0,0,1); }
.site-nav .nav-swap svg:nth-child(2) { transform: translateX(-150%); }
.site-nav .roll { position: relative; display: inline-block; overflow: hidden; vertical-align: bottom; }
.site-nav .roll .a, .site-nav .roll .b { display: block; transition: transform 440ms cubic-bezier(0.2,0,0,1); }
.site-nav .roll .b { position: absolute; inset: 0; transform: translateY(112%); }
.site-nav .nav-center { position: absolute; left: 0; right: 0; top: 0; height: 4rem; display: none; align-items: center; justify-content: center; padding: 0; pointer-events: none; }
.site-nav .nav-center ul { pointer-events: auto; display: flex; align-items: center; gap: 2.25rem; }
.site-nav .nav-center a { font-size: var(--text-eyebrow); font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: var(--nv-ink); }
.site-nav .nav-center a .b { color: var(--accent); }
.site-nav .nav-center a:hover .a { transform: translateY(-112%); }
.site-nav .nav-center a:hover .b { transform: translateY(0); }
@media (min-width: 900px) {
  .site-nav .nav-center { display: flex; }
  .site-nav .nav-action { display: flex; align-items: center; justify-content: center; gap: 0.55rem; width: 11rem; border-left: 1px dashed var(--nv-line); background: var(--nv-fill); color: var(--nv-fill-ink); font-size: var(--text-eyebrow); font-weight: 600; text-transform: uppercase; letter-spacing: 0.13em; transition: background 260ms cubic-bezier(0.2,0,0,1), color 260ms cubic-bezier(0.2,0,0,1); }
}
.site-nav .nav-action .cmk { background: var(--nv-fill-ink); }
.site-nav .nav-action:hover .nav-swap svg:nth-child(1) { transform: translateX(150%); }
.site-nav .nav-action:hover .nav-swap svg:nth-child(2) { transform: translateX(0); }
.site-nav .nav-action:hover .roll .a { transform: translateY(-112%); }
.site-nav .nav-action:hover .roll .b { transform: translateY(0); }
.site-nav .nav-action:hover .cmk-tl { transform: translate(-3px,-3px); }
.site-nav .nav-action:hover .cmk-bl { transform: translate(-3px,3px); }
.site-nav .burger { position: relative; z-index: 60; display: flex; flex: none; align-items: center; justify-content: center; width: 4rem; height: 4rem; gap: 0; border-left: 1px dashed var(--nv-line); }
@media (min-width: 900px) { .site-nav .burger { display: none; } }
.site-nav .burger span { position: absolute; left: 50%; top: 50%; width: 1.4rem; height: 1.5px; margin-left: -0.7rem; background: var(--foreground); transition: transform 300ms cubic-bezier(0.2,0,0,1), opacity 200ms; }
.site-nav .burger span:nth-child(1) { transform: translateY(-4px); }
.site-nav .burger span:nth-child(2) { transform: translateY(4px); }
.site-nav .burger.open span { opacity: 1; }
.site-nav .burger.open span:nth-child(1) { transform: rotate(45deg); }
.site-nav .burger.open span:nth-child(2) { transform: rotate(-45deg); }
.mobile-menu { position: fixed; inset: 0; top: 4rem; z-index: 40; display: flex; flex-direction: column; justify-content: space-between; background: var(--background); padding: 1.75rem var(--gutter) 2.25rem; opacity: 0; pointer-events: none; transition: opacity 400ms ease-out; }
@media (min-width: 900px) { .mobile-menu { display: none; } }
.mobile-menu.open { opacity: 1; pointer-events: auto; }
.mobile-menu ul { display: flex; flex-direction: column; }
.mobile-menu li { overflow: hidden; border-top: 1px dashed rgba(243,241,234,0.2); }
.mobile-menu li:last-child { border-bottom: 1px dashed rgba(243,241,234,0.2); }
.mobile-menu li > div { transform: translateY(40px); opacity: 0; transition: transform 420ms ease-out, opacity 420ms ease-out; }
.mobile-menu.open li > div { transform: translateY(0); opacity: 1; }
.mobile-menu a { display: flex; align-items: center; justify-content: space-between; padding: 1.05rem 0; font-family: var(--font-sans); font-size: 1.55rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; color: var(--foreground); }
.mobile-menu .m-arw { width: 1rem; height: 1rem; color: var(--accent); flex: none; }
.mobile-menu .mm-action { justify-content: center; gap: 0.6rem; padding: 1rem 0; background: var(--foreground); color: var(--background); font-size: 1rem; letter-spacing: 0.13em; }
.mobile-menu .mm-action .mm-arw { width: 0.9rem; height: 0.9rem; }
.hero { position: sticky; top: 0; z-index: 0; display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; overflow: hidden; }
.stack-reveal { position: relative; z-index: 2; background: var(--background); border-radius: 2rem 2rem 0 0; border-top: 1px solid var(--line); }
.hero-top { position: relative; z-index: 30; display: flex; flex-direction: column; gap: 2rem; padding: 7rem var(--gutter) 0; }
@media (min-width: 640px) { .hero-top { flex-direction: row; align-items: flex-start; justify-content: space-between; padding-top: 8rem; } }
.hero-roles { font-family: var(--font-display); line-height: 1.05; letter-spacing: -0.01em; color: var(--foreground); font-size: var(--text-h3); }
@media (min-width: 640px) { .hero-roles { font-size: var(--text-h2); } }
.hero-roles .line { display: block; }
.hero-left { display: flex; flex-direction: column; gap: 2rem; }
.hero-cta { position: absolute; left: 0; right: 0; bottom: 6vh; z-index: 46; display: flex; flex-direction: column; flex-wrap: wrap; gap: 0.9rem; align-items: center; justify-content: center; padding: 0 var(--gutter); pointer-events: auto; }
@media (min-width: 640px) { .hero-cta { flex-direction: row; } }
.hero-btn-2 { display: inline-flex; align-items: center; justify-content: center; height: 3.4rem; padding: 0 1.9rem; border: 1px solid var(--foreground); border-radius: 9999px; background: var(--foreground); font-family: var(--font-sans); font-size: 1.0625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--background); transition: background 300ms ease, color 300ms ease, border-color 300ms ease, transform 300ms cubic-bezier(0.16,1,0.3,1); }
.hero-btn-2:hover { background: #ffffff; border-color: #ffffff; color: var(--background); transform: translateY(-2px); }
.manifesto { position: relative; display: flex; align-items: center; justify-content: center; min-height: 62vh; padding: var(--section) var(--gutter); background: var(--background); overflow: hidden; }
.manifesto-statement { max-width: 55ch; text-align: center; font-family: var(--font-sans); font-weight: 400; font-size: clamp(1.4rem, 3.1vw, 2.95rem); line-height: 1.3; letter-spacing: -0.01em; color: var(--foreground); }
.manifesto-statement .ltr { display: inline-block; will-change: transform, opacity; }
.manifesto-statement .ru-clip { overflow: visible; }
@media (prefers-reduced-motion: reduce) { .hero-btn-2 { transition: none; } }
.hero-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; height: 3.4rem; padding: 0 1.9rem; border: 1px solid rgba(243,241,234,0.55); border-radius: 9999px; background: rgba(243,241,234,0.03); font-family: var(--font-sans); font-size: 1.0625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--foreground); transition: border-color 360ms ease, box-shadow 420ms ease, transform 420ms cubic-bezier(0.16,1,0.3,1); will-change: transform; }
.hero-btn .hero-btn-fill { position: absolute; inset: 0; z-index: 0; transform: scaleY(0); transform-origin: bottom; background: linear-gradient(180deg, var(--accent-2), var(--accent)); transition: transform 460ms cubic-bezier(0.22,1,0.36,1); }
.hero-btn .hero-btn-roll { position: relative; z-index: 1; display: block; overflow: hidden; }
.hero-btn .hero-btn-roll .a, .hero-btn .hero-btn-roll .b { display: block; transition: transform 460ms cubic-bezier(0.22,1,0.36,1); }
.hero-btn .hero-btn-roll .b { position: absolute; inset: 0; transform: translateY(105%); color: #08080a; }
.hero-btn:hover { border-color: transparent; transform: translateY(-2px); box-shadow: 0 18px 38px -14px rgba(243,241,234,0.28), 0 4px 10px rgba(0,0,0,0.4); }
.hero-btn:hover .hero-btn-fill { transform: scaleY(1); }
.hero-btn:hover .hero-btn-roll .a { transform: translateY(-105%); }
.hero-btn:hover .hero-btn-roll .b { transform: translateY(0); }
.hero-btn:active { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .hero-btn, .hero-btn .hero-btn-fill, .hero-btn .hero-btn-roll .a, .hero-btn .hero-btn-roll .b { transition: none; } }
.hero-desc { max-width: 26rem; font-size: var(--text-body); line-height: var(--lh-body); color: var(--muted); }
@media (min-width: 640px) { .hero-desc { text-align: right; } }
.hero-portrait { pointer-events: none; position: absolute; top: 0; bottom: auto; left: 50%; z-index: 40; height: 100vh; width: 80vw; transform: translateX(-50%); perspective: 1100px; }
.dodo-glow { position: absolute; left: 50%; top: 52%; width: 132%; height: 80%; transform: translate(-50%, -50%); background: radial-gradient(50% 50% at 50% 50%, rgba(120,120,132,0.32), rgba(90,90,102,0.10) 46%, transparent 72%); pointer-events: none; z-index: 0; will-change: transform; }
.dodo-parallax { position: absolute; inset: 0; z-index: 1; display: flex; align-items: flex-start; justify-content: center; transform-style: preserve-3d; will-change: transform; }
.dodo-img { height: 150%; width: auto; max-width: none; object-fit: contain; object-position: top center; filter: drop-shadow(0 24px 55px rgba(0,0,0,0.5)); opacity: 0; animation: dodoFade 1000ms ease-out 350ms forwards; will-change: transform, opacity; }
.dodo-parallax video.dodo-img { position: absolute; bottom: 0; top: auto; left: 50%; height: 100vh; width: auto; max-width: none; transform: translateX(-50%); object-fit: contain; object-position: bottom center; animation: none; opacity: 0; transition: opacity 0.45s ease; }
@media (min-width: 640px) { .hero-portrait { width: 48vw; } }
@media (min-width: 1024px) { .hero-portrait { width: 36vw; } }
.hero-gradient { pointer-events: none; position: absolute; inset-inline: 0; bottom: 0; z-index: 45; height: 31vh; background: linear-gradient(to bottom, transparent 0%, var(--background) 62%, var(--background) 100%); }
.hero-name { position: absolute; inset-inline: 0; bottom: 18vh; z-index: 10; display: flex; flex-direction: column; align-items: center; transform: translateY(6%); font-family: var(--font-display); line-height: 0.78; letter-spacing: -0.01em; color: var(--accent); font-size: var(--text-mega); }
@media (min-width: 640px) { .hero-name { font-size: var(--text-hero); } }
.hero-name .line { display: block; white-space: nowrap; }
.scroll-cue { position: absolute; bottom: 2rem; left: var(--gutter); z-index: 50; display: flex; align-items: center; gap: 0.75rem; font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
.scroll-cue .rule { display: inline-block; height: 1px; width: 2.5rem; background: var(--accent); }
.marquee { overflow: hidden; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding-top: 2rem; padding-bottom: 2rem; }
.marquee-track { display: flex; width: max-content; flex-wrap: nowrap; animation: mvmarquee 22s linear infinite; }
.marquee-track .item { display: flex; align-items: center; }
.marquee-track .word { font-family: var(--font-display); font-size: var(--text-h2); letter-spacing: -0.01em; }
.marquee-track .sep { margin-inline: 2rem; display: inline-block; width: 0.625rem; height: 0.625rem; flex-shrink: 0; border-radius: 9999px; background: var(--accent); }
@keyframes mvmarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes dodoFade { from { opacity: 0; } to { opacity: 1; } }
.section { padding: var(--section) var(--gutter); }
.head-row { display: flex; flex-direction: column; gap: 1rem; }
@media (min-width: 640px) { .head-row { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
.head-count { font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
.story-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; }
@media (min-width: 1024px) { .story-grid { grid-template-columns: repeat(12, 1fr); gap: var(--gutter); } }
@media (min-width: 1024px) { .story-left { grid-column: span 6; } }
.story-heading { margin-top: 1.5rem; max-width: 16ch; font-family: var(--font-display); line-height: 0.95; letter-spacing: -0.01em; font-size: var(--text-h2); }
@media (min-width: 640px) { .story-heading { font-size: var(--text-h1); } }
.story-body { margin-top: 2rem; max-width: 46ch; font-size: var(--text-lead); line-height: var(--lh-lead); color: var(--muted); }
@media (min-width: 1024px) { .story-list { grid-column: span 6; padding-top: 0.5rem; } }
.principle { display: grid; grid-template-columns: auto 1fr; column-gap: 1.5rem; border-top: 1px solid var(--line); padding: 2rem 0; }
.principle:last-child { border-bottom: 1px solid var(--line); }
.principle .idx { font-family: var(--font-sans); font-size: var(--text-h3); font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); }
.principle h3 { font-family: var(--font-sans); font-size: var(--text-h3); line-height: var(--lh-h3); font-weight: 600; letter-spacing: -0.01em; }
.principle p { margin-top: 0.75rem; max-width: 44ch; font-size: var(--text-body); color: var(--muted); }
.ventures-heading { margin-top: 1.5rem; max-width: 14ch; font-family: var(--font-display); line-height: 0.95; letter-spacing: -0.01em; font-size: var(--text-h2); }
@media (min-width: 640px) { .ventures-heading { font-size: var(--text-h1); } }
.ventures-grid { margin-top: 4rem; display: grid; grid-template-columns: 1fr; column-gap: var(--gutter); row-gap: 4rem; }
@media (min-width: 768px) { .ventures-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 768px) { .ventures-grid > li:nth-child(2n) { margin-top: 6rem; } }
.venture .row { margin-top: 1.5rem; border-top: 1px solid var(--line); padding-top: 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
.venture h3 { font-family: var(--font-sans); font-size: var(--text-h3); line-height: var(--lh-h3); font-weight: 600; letter-spacing: -0.01em; }
.venture .name { transition: color 340ms ease-out; }
.venture:hover .name { color: var(--accent); }
.venture .blurb { margin-top: 0.5rem; max-width: 42ch; font-size: var(--text-body); color: var(--muted); }
.venture .meta { flex-shrink: 0; text-align: right; }
.venture .year { font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
.venture .outcome { margin-top: 0.5rem; font-size: var(--text-eyebrow); font-weight: 500; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); }
.venture .cat { margin-top: 0.75rem; font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
.impact-heading { font-family: var(--font-display); line-height: 1; letter-spacing: -0.01em; font-size: var(--text-h2); }
.impact-grid { margin-top: 4rem; display: grid; grid-template-columns: 1fr; border-top: 1px solid var(--line); }
@media (min-width: 640px) { .impact-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .impact-grid { grid-template-columns: repeat(4, 1fr); } }
.stat { display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid var(--line); padding: 2.5rem 0; }
@media (min-width: 640px) { .stat:nth-child(2n) { border-left: 1px solid var(--line); padding-left: 2rem; } }
@media (min-width: 1024px) { .stat { padding-top: 3rem; padding-bottom: 3rem; } .stat:not(:nth-child(4n+1)) { border-left: 1px solid var(--line); padding-left: 2rem; } .stat:nth-child(4n+1) { border-left: 0; padding-left: 0; } }
.stat .figure { display: block; font-family: var(--font-display); font-size: var(--text-display); line-height: 1; letter-spacing: -0.01em; transition: color 340ms ease-out; }
.stat:hover .figure { color: var(--accent); }
.stat .label { max-width: 20ch; font-size: var(--text-body); text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
.voices-heading { font-family: var(--font-display); line-height: 1; letter-spacing: -0.01em; font-size: var(--text-h2); }
.voices-body { margin-top: 4rem; display: grid; grid-template-columns: 1fr; gap: 3rem; }
@media (min-width: 1024px) { .voices-body { grid-template-columns: repeat(12, 1fr); gap: var(--gutter); } }
@media (min-width: 1024px) { .voices-list { grid-column: span 5; } }
.voice-btn { display: flex; align-items: baseline; gap: 1.25rem; width: 100%; border-top: 1px solid var(--line); padding: 1.75rem 0; text-align: left; }
.voices-list li:last-child .voice-btn { border-bottom: 1px solid var(--line); }
.voice-btn .num { font-size: var(--text-eyebrow); font-variant-numeric: tabular-nums; letter-spacing: 0.18em; color: var(--muted); }
.voice-btn.active .num { color: var(--accent); }
.voice-btn .who { flex: 1; }
.voice-btn .vname { display: block; font-family: var(--font-sans); font-size: var(--text-h3); line-height: var(--lh-h3); font-weight: 600; letter-spacing: -0.01em; color: var(--muted); }
.voice-btn.active .vname { color: var(--foreground); }
.voice-btn .vrole { margin-top: 0.25rem; display: block; font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
.voice-btn .vrule { margin-top: 0.5rem; height: 1px; width: 0; background: var(--accent); transition: width 340ms ease-out; }
.voice-btn.active .vrule { width: 2.5rem; }
@media (min-width: 1024px) { .voices-feature { grid-column: span 7; } }
.voices-feature .inner { display: grid; grid-template-columns: 1fr; gap: 2rem; }
@media (min-width: 640px) { .voices-feature .inner { grid-template-columns: 1fr auto; align-items: flex-start; } }
.voices-quote { order: 2; }
@media (min-width: 640px) { .voices-quote { order: 1; } }
.voices-quote p { max-width: 30ch; font-family: var(--font-sans); font-size: var(--text-h3); font-weight: 500; line-height: 1.3; letter-spacing: -0.01em; color: var(--foreground); }
.voices-quote footer { margin-top: 2rem; font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
.voices-portrait { order: 1; width: 100%; }
@media (min-width: 640px) { .voices-portrait { order: 2; width: 16rem; } }
.contact { padding-top: var(--section); padding-inline: var(--gutter); }
.contact-heading { margin-top: 1.5rem; max-width: 18ch; font-family: var(--font-display); line-height: 0.95; letter-spacing: -0.01em; font-size: var(--text-h1); white-space: pre-line; }
@media (min-width: 640px) { .contact-heading { font-size: var(--text-display); } }
.contact-body { margin-top: 2rem; max-width: 44ch; font-size: var(--text-lead); line-height: var(--lh-lead); color: var(--muted); }
.contact-email-wrap { margin-top: 3rem; }
.contact-email { display: inline-flex; align-items: baseline; gap: 0.75rem; max-width: 100%; font-family: var(--font-sans); font-size: var(--text-h3); font-weight: 600; letter-spacing: -0.01em; word-break: break-all; transition: transform 340ms ease-out, color 340ms ease-out; }
@media (min-width: 640px) { .contact-email { gap: 1rem; font-size: var(--text-h1); } }
.contact-email:hover { transform: translateX(14px); color: var(--accent); }
.contact-email .arrow { color: var(--accent); }
.footer-bar { margin-top: var(--section); display: grid; grid-template-columns: 1fr; gap: 2.5rem; border-top: 1px solid var(--line); padding: 3rem 0; }
@media (min-width: 1024px) { .footer-bar { grid-template-columns: repeat(12, 1fr); } }
@media (min-width: 1024px) { .footer-sig { grid-column: span 6; } }
.footer-sig .sig { font-family: var(--font-display); font-size: var(--text-h2); text-transform: uppercase; line-height: 1; letter-spacing: -0.01em; }
.footer-sig .credit { margin-top: 1rem; font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.22em; color: var(--muted); }
@media (min-width: 1024px) { .footer-social { grid-column: span 3; } }
.footer-social ul { display: flex; flex-direction: column; gap: 0.75rem; }
.footer-social a { display: inline-flex; align-items: center; gap: 0.75rem; font-size: var(--text-body); color: var(--muted); }
.footer-social a:hover { color: var(--foreground); }
.footer-social a .rule { display: inline-block; height: 1px; width: 0; background: var(--accent); transition: width 340ms ease-out; }
.footer-social a:hover .rule { width: 1.5rem; }
@media (min-width: 1024px) { .footer-copy { grid-column: span 3; text-align: right; } }
.footer-copy p { font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
.liquid { position: relative; overflow: hidden; }
.liquid:not(.bare) { background: var(--surface); }
.liquid .lq-filter { position: absolute; width: 0; height: 0; pointer-events: none; }
.liquid .lq-leaf { position: absolute; inset: 0; width: 100%; height: 100%; }
.liquid .lq-placeholder { position: absolute; inset: 0; background: radial-gradient(130% 130% at 30% 15%, var(--surface-2), var(--background)); }
.liquid .lq-veil { position: absolute; inset: 0; pointer-events: none; background: var(--background); mix-blend-mode: color; opacity: 0.88; transition: opacity 380ms ease-out; }
.liquid.hover .lq-veil { opacity: 0; }
.liquid .lq-glow { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(120deg, transparent 30%, color-mix(in srgb, var(--accent) 35%, transparent) 50%, transparent 70%); opacity: 0; transition: opacity 340ms ease-out; }
.liquid.hover .lq-glow { opacity: 1; }
.liquid .lq-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 120% at 50% 120%, color-mix(in srgb, var(--background) 70%, transparent), transparent 60%); }
.liquid .lq-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1.5rem; text-align: center; pointer-events: none; }
.liquid .lq-label span { font-family: var(--font-display); font-size: var(--text-h3); line-height: 1.15; letter-spacing: -0.01em; color: var(--line-strong); }
.rounded { border-radius: 0.125rem; }
.ar-16-11 { aspect-ratio: 16 / 11; width: 100%; }
.ar-4-5 { aspect-ratio: 4 / 5; width: 100%; }
.full { width: 100%; height: 100%; }
/* ===================== DANTORA-PORT SECTIONS (dz-*) =====================
   Ported from GetLayers "Dantora" sections 2-5, re-skinned to the DD dark
   brand. Motion preserved (image-trail, horizontal scrub, count-up, drag).
   All selectors namespaced dz- and live inside the shadow root. */

/* contact rides up over the sticky team rail (Dantora mechanic) */
#contact { position: relative; z-index: 10; background: var(--background); }

.dz-words { display: flex; flex-wrap: wrap; }
.dz-words.center { justify-content: center; text-align: center; }
.dz-words .dz-w { display: inline-block; will-change: transform, opacity, filter; }
.dz-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.dz-eyebrow { display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-sans); font-size: var(--text-eyebrow); font-weight: 500; text-transform: uppercase; letter-spacing: 0.22em; color: var(--accent); }
.dz-eyebrow.center { justify-content: center; }
.dz-display { font-family: var(--font-display); line-height: 0.95; letter-spacing: -0.01em; color: var(--foreground); font-size: var(--text-h2); }
.dz-lead { font-family: var(--font-sans); font-size: var(--text-lead); line-height: var(--lh-lead); color: var(--muted); }

.dz-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 3.25rem; padding: 0 1.6rem; border-radius: 9999px; font-family: var(--font-sans); font-size: var(--text-body); font-weight: 500; letter-spacing: 0.01em; border: 1px solid transparent; transition: transform 300ms ease-out, background 300ms ease-out, color 300ms ease-out; }
.dz-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.dz-btn.primary:hover { transform: translateY(-2px); }
.dz-btn.secondary { background: transparent; color: var(--foreground); border-color: var(--line-strong); }
.dz-btn.secondary:hover { border-color: var(--accent); color: var(--accent); }

/* ---- Section 2: WHY / image trail ---- */
#dz-why { position: sticky; top: 0; height: 100vh; height: 100lvh; overflow: hidden; background: var(--background); border-top: 1px solid var(--line); }
#dz-trail { position: relative; height: 100%; }
#dz-trail .dz-cards { pointer-events: none; position: absolute; inset: 0; }
#dz-trail .dz-cards img { position: absolute; top: 0; left: 0; width: 8.25rem; height: 8.25rem; object-fit: contain; will-change: transform; }
#dz-why-copy { position: absolute; top: 50%; left: 50%; display: flex; width: min(100% - 2.5rem, 46rem); transform: translate(-50%, -50%); flex-direction: column; align-items: center; gap: 2rem; text-align: center; z-index: 2; }
#dz-why-copy .dz-head { display: flex; width: 100%; flex-direction: column; align-items: center; gap: 1.25rem; }
#dz-why-copy .dz-display { max-width: 18ch; }
#dz-why-copy .dz-lead { max-width: 46ch; }
#dz-why-copy .dz-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
@media (min-width: 640px) { #dz-why-copy { gap: 3rem; } #dz-why-copy .dz-head { gap: 2rem; } }

/* ---- Section 3: SERVICES / horizontal scrub ---- */
#dz-services { position: relative; background: var(--background); }
#dz-svc-runway { position: relative; height: 480lvh; }
#dz-svc-panel { position: sticky; top: 0; height: 100vh; height: 100lvh; overflow: hidden; border-radius: 2rem 2rem 0 0; background: var(--surface); border-top: 1px solid var(--line); }
#dz-svc-head { display: flex; flex-direction: column; gap: 1rem; padding: 5rem var(--gutter) 0; }
#dz-svc-head .dz-display { max-width: 20ch; }
#dz-svc-head .dz-lead { max-width: 44ch; }
@media (min-width: 1024px) {
  #dz-svc-head { display: grid; grid-template-columns: 1.3fr 1fr; align-items: end; gap: 2rem 3rem; padding: 5rem var(--gutter) 0; }
  #dz-svc-head .dz-eyebrow { grid-column: 2; order: -1; }
  #dz-svc-head .dz-display { grid-row: 2; grid-column: 1; margin: 0; }
  #dz-svc-head .dz-lead { grid-row: 2; grid-column: 2; }
}
#dz-svc-rail { position: absolute; top: 44%; right: 0; bottom: 1.25rem; left: var(--gutter); display: flex; gap: 0.75rem; will-change: transform; }
@media (min-width: 1024px) { #dz-svc-rail { top: 40%; bottom: 2.5rem; } }
.dz-svc-card { position: relative; display: flex; height: 100%; width: 78vw; max-width: 24rem; flex: none; flex-direction: column; justify-content: space-between; overflow: hidden; border-radius: 1rem; padding: 1.5rem; }
@media (min-width: 1024px) { .dz-svc-card { width: 30rem; max-width: none; padding: 2rem; } .dz-svc-card.photo, .dz-svc-card.brand { width: 26rem; } }
.dz-svc-card.lime { border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--foreground); }
.dz-svc-card.brand { background: var(--accent); color: #fff; }
.dz-svc-card.photo { color: #fff; }
.dz-svc-card.photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,10,0.85), rgba(8,8,10,0.15) 55%, rgba(8,8,10,0.35)); z-index: 1; }
.dz-svc-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.15); }
.dz-svc-card .dz-top { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 1rem; }
.dz-svc-card .dz-idx { font-family: var(--font-sans); font-size: 1rem; opacity: 0.7; }
.dz-svc-card h3 { font-family: var(--font-sans); font-size: 1.5rem; line-height: 1.1; font-weight: 600; letter-spacing: -0.01em; }
@media (min-width: 1024px) { .dz-svc-card h3 { font-size: 2rem; } .dz-svc-card .dz-idx, .dz-svc-card .dz-drow, .dz-svc-card .dz-disc p { font-size: 1.25rem; } }
.dz-svc-card ul { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 1rem; list-style: none; margin: 0; padding: 0; }
.dz-svc-card ul .dz-rule { height: 1px; width: 100%; background: var(--line); }
.dz-svc-card ul .dz-drow { display: flex; align-items: center; justify-content: space-between; font-size: 1rem; }
.dz-svc-card ul .dz-drow svg { width: 1.1rem; height: 1.1rem; }
.dz-svc-card .dz-disc { position: relative; z-index: 10; display: flex; align-items: flex-end; justify-content: space-between; }
.dz-svc-card .dz-disc p { font-size: 1rem; }
.dz-svc-card .dz-ring { display: grid; width: 3.5rem; height: 3.5rem; place-items: center; border-radius: 9999px; border: 1px solid currentColor; color: inherit; }
@media (min-width: 1024px) { .dz-svc-card .dz-ring { width: 4.5rem; height: 4.5rem; } }
.dz-svc-card .dz-ring svg { width: 1.1rem; height: 1.1rem; }
.dz-svc-card .dz-tt { display: flex; flex-direction: column; gap: 1.75rem; }
.dz-svc-card .dz-sub { font-family: var(--font-sans); font-size: 1.125rem; line-height: 1.45; font-weight: 400; opacity: 0.82; max-width: 36ch; }
@media (min-width: 1024px) { .dz-svc-card .dz-sub { font-size: 1.35rem; } }
.dz-svc-card.lime, .dz-svc-card.brand { background: #08080a; color: #fff; border: 1px solid rgba(255,255,255,0.12); }
@media (min-width: 1024px) { .dz-svc-card, .dz-svc-card.brand, .dz-svc-card.photo { width: 33rem; max-width: none; } }
.dz-svc-card .dz-bg { position: absolute; inset: -8%; z-index: 0; background-size: cover; background-position: center; filter: grayscale(1) brightness(0.9); transition: filter 0.55s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1); }
.dz-svc-card .dz-bg::after { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 95% at 50% 22%, rgba(255,255,255,0.10) 0%, rgba(20,20,22,0.36) 40%, rgba(4,4,5,0.74) 100%); }
.dz-svc-card:hover .dz-bg { filter: blur(18px) grayscale(1) brightness(1.05); transform: scale(1.1); }
.dz-svc-card .dz-idx { color: #fff; opacity: 0.6; }
.dz-svc-card h3 { color: #fff; font-size: clamp(2.3rem, 7vw, 2.9rem); letter-spacing: -0.02em; line-height: 1.03; transition: font-size 0.45s cubic-bezier(0.16,1,0.3,1); }
.dz-svc-card:hover h3 { font-size: 1.5rem; }
@media (min-width: 1024px) { .dz-svc-card h3 { font-size: 3.2rem; } .dz-svc-card:hover h3 { font-size: 2rem; } }
.dz-svc-card .dz-sub { opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1); }
.dz-svc-card:hover .dz-sub { opacity: 0.9; transform: none; }
@media (hover: none) { .dz-svc-card h3, .dz-svc-card:hover h3 { font-size: 1.65rem; } .dz-svc-card .dz-sub { opacity: 0.9; transform: none; } .dz-svc-card .dz-disc { opacity: 1; } }

/* ---- Section 4: ABOUT / stats + parallax banner ---- */
#dz-about { position: relative; z-index: 10; margin-top: -3.5rem; border-radius: 2rem 2rem 0 0; background: var(--surface-2); padding: 4rem var(--gutter); }
#dz-about-banner { position: relative; height: 24rem; overflow: hidden; border-radius: 1rem; }
@media (min-width: 768px) { #dz-about-banner { height: 44rem; } }
#dz-about-banner .dz-layer { position: absolute; left: 0; right: 0; will-change: transform; }
#dz-about-banner img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.2) contrast(1.02); }
#dz-about-row { margin-top: 3rem; display: flex; flex-direction: column; gap: 3rem; }
@media (min-width: 1024px) { #dz-about-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 4rem; } }
#dz-about-left { display: flex; flex-direction: column; gap: 2.5rem; }
@media (min-width: 1024px) { #dz-about-left { width: 40%; } }
#dz-about-stats { display: grid; grid-template-columns: repeat(2, 1fr); column-gap: 1rem; row-gap: 2.5rem; margin: 0; }
#dz-about-stats > div { display: flex; flex-direction: column; gap: 0.75rem; border-left: 1px solid var(--accent); padding-left: 1rem; }
#dz-about-stats dd { margin: 0; font-family: var(--font-display); font-size: var(--text-display); line-height: 1; letter-spacing: -0.01em; color: var(--foreground); }
#dz-about-stats dt { font-family: var(--font-sans); font-size: var(--text-eyebrow); text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); max-width: 18ch; }
#dz-about-right { display: flex; flex-direction: column; gap: 2.5rem; }
@media (min-width: 1024px) { #dz-about-right { width: 52%; } }
#dz-about-para { font-family: var(--font-sans); font-size: var(--text-lead); line-height: 1.4; color: var(--foreground); font-weight: 400; }
#dz-about-para .muted { color: var(--muted); }
#dz-about-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }

/* ---- Section 5: TEAM / draggable rail ---- */
#dz-team { position: sticky; top: 0; z-index: 10; display: flex; height: 100vh; height: 100lvh; flex-direction: column; justify-content: center; background: var(--surface); border-top: 1px solid var(--line); padding-top: 6rem; }
#dz-team-box { display: flex; height: 74%; flex-direction: column; }
#dz-team-rail { display: flex; min-height: 0; flex: 1; cursor: grab; gap: 0.75rem; overflow-x: auto; overscroll-behavior-x: contain; padding-left: var(--gutter); touch-action: pan-y; user-select: none; -webkit-user-select: none; scrollbar-width: none; -ms-overflow-style: none; }
#dz-team-rail:active { cursor: grabbing; }
#dz-team-rail::-webkit-scrollbar { display: none; }
#dz-team-rail img { pointer-events: none; }
.dz-team-intro { display: flex; height: 100%; width: 80vw; max-width: 24rem; flex: none; flex-direction: column; justify-content: space-between; border-radius: 1rem; background: var(--accent); padding: 1.75rem; color: #fff; }
@media (min-width: 1024px) { .dz-team-intro { width: 26rem; max-width: none; padding: 2rem; } }
.dz-team-intro .dz-head { display: flex; flex-direction: column; gap: 1.5rem; }
.dz-team-intro .dz-eyebrow { color: #fff; opacity: 0.8; }
.dz-team-intro h2 { font-family: var(--font-display); font-size: 2rem; line-height: 0.98; letter-spacing: -0.01em; font-weight: 400; }
@media (min-width: 1024px) { .dz-team-intro h2 { font-size: 2.6rem; max-width: 12ch; } }
.dz-team-intro ul { display: flex; gap: 0.75rem; list-style: none; margin: 0; padding: 0; }
.dz-team-intro ul a { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.4); color: #fff; transition: opacity 150ms ease-out; }
.dz-team-intro ul a:hover { opacity: 0.75; }
.dz-team-intro ul a svg { width: 1.15rem; height: 1.15rem; }
.dz-team-card { position: relative; height: 100%; width: 70vw; max-width: 21rem; flex: none; overflow: hidden; border-radius: 1rem; background: var(--surface-2); }
@media (min-width: 1024px) { .dz-team-card { width: 21rem; } }
.dz-team-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.25) contrast(1.03); }
.dz-team-card figcaption { position: absolute; left: 1.5rem; right: 1.5rem; bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem; border-radius: 0.6rem; background: rgba(10,10,12,0.92); padding: 0.9rem 1.25rem; text-align: center; border: 1px solid var(--line); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.dz-team-card figcaption .n { font-family: var(--font-sans); font-size: 1.1rem; font-weight: 600; letter-spacing: -0.01em; color: var(--foreground); }
.dz-team-card figcaption .r { font-family: var(--font-sans); font-size: 0.85rem; font-weight: 500; text-transform: none; letter-spacing: 0.01em; color: rgba(243,241,234,0.8); }
.dz-team-more { display: flex; height: 100%; width: 70vw; max-width: 21rem; flex: none; flex-direction: column; justify-content: space-between; border-radius: 1rem; border: 1px solid var(--line-strong); background: var(--surface-2); padding: 1.75rem; color: var(--foreground); }
@media (min-width: 1024px) { .dz-team-more { width: 21rem; padding: 2rem; } }
.dz-team-more p { font-family: var(--font-display); font-size: 2rem; line-height: 0.98; letter-spacing: -0.01em; }
.dz-team-more .dz-foot { display: flex; align-items: flex-end; justify-content: space-between; }
.dz-team-more .dz-foot span:first-child { font-size: 1rem; color: var(--muted); }
.dz-team-more .dz-ring { display: grid; width: 4rem; height: 4rem; place-items: center; border-radius: 9999px; border: 1px solid var(--accent); color: var(--accent); }
.dz-team-more .dz-ring svg { width: 1.1rem; height: 1.1rem; }
#dz-team-bar { position: relative; margin: 1.5rem var(--gutter) 0; height: 2px; flex: none; background: var(--line); }
#dz-team-bar .dz-fill { height: 100%; transform-origin: left; background: var(--accent); }

/* ---- Section 6: CONTACT / lead-gen form (rides up over Team) ---- */
#dz-contact { position: relative; z-index: 20; margin-top: -3.5rem; display: flex; min-height: 100vh; min-height: 100lvh; flex-direction: column; gap: 2.5rem; overflow: hidden; border-radius: 2rem 2rem 0 0; background: var(--surface); border-top: 1px solid var(--line); padding: 6rem var(--gutter) 5rem; }
#dz-contact .dz-glow { position: absolute; left: 8%; top: 20%; width: 60%; height: 70%; background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%); pointer-events: none; z-index: 0; filter: blur(30px); }
#dz-contact-copy { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }
#dz-contact-copy .dz-head { display: flex; flex-direction: column; gap: 1rem; }
#dz-contact-copy .dz-display { max-width: 20ch; }
#dz-contact-copy .dz-lead { max-width: 40ch; }
#dz-form-panel { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 2rem; border-radius: 1rem; background: rgba(17,17,20,0.72); border: 1px solid var(--line); padding: 1.75rem; -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
#dz-form-panel .dz-head { display: flex; align-items: center; gap: 1rem; }
#dz-form-panel .dz-mark { display: grid; width: 2.625rem; height: 2.625rem; place-items: center; border-radius: 0.4rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 1.1rem; }
#dz-form-panel h3 { font-family: var(--font-sans); font-size: 1.92rem; line-height: 1.1; font-weight: 600; letter-spacing: -0.01em; color: var(--foreground); }
#dz-form-panel form { display: flex; flex: 1; flex-direction: column; gap: 1.5rem; }
#dz-form-panel .dz-field { display: flex; flex-direction: column; gap: 0.75rem; }
#dz-form-panel label { font-family: var(--font-sans); font-size: var(--text-eyebrow); font-weight: 500; color: var(--accent); text-transform: uppercase; letter-spacing: 0.14em; }
#dz-form-panel input, #dz-form-panel textarea, #dz-form-panel select { width: 100%; border-radius: 0.6rem; border: 1px solid var(--line-strong); background: transparent; padding: 1.1rem 1.4rem; font-family: var(--font-sans); font-size: 1rem; font-weight: 400; color: var(--foreground); outline: none; }
#dz-form-panel select { -webkit-appearance: none; appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23807f78' stroke-width='1.5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1.4rem center; padding-right: 3rem; }
#dz-form-panel select option { color: #111114; }
#dz-form-panel textarea { resize: none; }
#dz-form-panel input::placeholder, #dz-form-panel textarea::placeholder { color: var(--muted); }
#dz-form-panel input:focus-visible, #dz-form-panel textarea:focus-visible { border-color: var(--accent); }
#dz-form-panel .dz-consent { font-family: var(--font-sans); font-size: var(--text-body); line-height: 1.5; color: var(--muted); }
#dz-form-panel .dz-consent a { color: var(--foreground); text-decoration: underline; }
#dz-form-submit { margin-top: auto; display: flex; height: 3.4rem; flex: none; align-items: center; justify-content: space-between; border-radius: 9999px; border: 1px solid var(--accent); background: var(--accent); padding-left: 1.6rem; padding-right: 0.3rem; font-family: var(--font-sans); font-size: 1.15rem; font-weight: 500; color: #fff; cursor: pointer; transition: filter 150ms ease-out; }
#dz-form-submit:hover { filter: brightness(1.08); }
#dz-form-submit .dz-disc { display: grid; width: 2.8rem; height: 2.8rem; flex: none; place-items: center; border-radius: 9999px; background: #fff; color: var(--accent); }
#dz-form-submit .dz-disc svg { width: 1rem; height: 1rem; }
#dz-form-done { display: none; flex-direction: column; gap: 0.75rem; }
#dz-form-panel.done form { display: none; }
#dz-form-panel.done #dz-form-done { display: flex; }
#dz-form-done h3 { font-family: var(--font-sans); font-size: 1.4rem; font-weight: 600; color: var(--foreground); }
#dz-form-done p { font-family: var(--font-sans); font-size: var(--text-body); color: var(--muted); line-height: 1.5; }
#dz-form-done a { color: var(--accent); text-decoration: underline; }
@media (min-width: 900px) {
  #dz-contact { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; gap: 4.5rem; padding: 7rem var(--gutter); }
  #dz-contact-copy { align-self: center; gap: 2.75rem; }
  #dz-contact-copy .dz-head { gap: 2rem; }
  #dz-contact-copy .dz-display { font-size: 3.75rem; }
  #dz-contact-copy .dz-lead { font-size: 1.6rem; max-width: 34ch; }
  #dz-form-panel { height: 100%; padding: 2.75rem; gap: 2rem; }
  #dz-form-panel h3 { font-size: 2.7rem; }
  #dz-form-panel input, #dz-form-panel textarea, #dz-form-panel select { padding: 1.35rem 1.6rem; font-size: 1.1rem; }
  #dz-form-panel label { font-size: 0.9rem; }
  #dz-form-submit { height: 3.75rem; font-size: 1.3rem; }
}

/* ---- Light theme: About → Team → Contact form (rest of page stays dark) ---- */
#dz-about, #dz-team, #dz-contact {
  --foreground: #0f0f12;
  --surface: #ffffff;
  --surface-2: #f4f2ec;
  --muted: #5b5a54;
  --line: rgba(15,15,18,0.12);
  --line-strong: rgba(15,15,18,0.20);
  --background: #ffffff;
}
#dz-about { background: #ffffff; }
#dz-team { background: #ffffff; }
#dz-contact { background: #ffffff; }
#dz-about-banner img, #dz-about-banner video { width: 100%; height: 100%; object-fit: cover; }
#dz-about-banner video { filter: none; }
#dz-team-rail { padding-top: 1.25rem; padding-bottom: 1.5rem; padding-right: var(--gutter); }
.dz-team-card { border: 1px solid var(--line-strong); box-shadow: 0 18px 42px -18px rgba(15,15,18,0.45), 0 4px 14px -8px rgba(15,15,18,0.26); }
.dz-team-intro, .dz-team-more { box-shadow: 0 18px 42px -18px rgba(15,15,18,0.45), 0 4px 14px -8px rgba(15,15,18,0.26); }
#dz-form-panel { background: #ffffff; border: 1px solid var(--line-strong); box-shadow: 0 26px 60px -24px rgba(15,15,18,0.4), 0 6px 18px -10px rgba(15,15,18,0.24); }
.dz-team-card figcaption .n { color: #f5f3ec; }
.dz-team-more { background: #0f0f12; color: #f3f1ea; border-color: rgba(243,241,234,0.22); }
.dz-team-more .dz-foot span:first-child { color: rgba(243,241,234,0.6); }
#dz-form-panel img.dz-mark { width: auto; height: 2.8rem; background: transparent; border-radius: 0; }
@media (min-width: 900px) {
  #dz-contact { min-height: auto; padding: 4.5rem var(--gutter); gap: 4rem; }
  #dz-contact-copy .dz-display { font-size: 3rem; }
  #dz-contact-copy .dz-lead { font-size: 1.3rem; }
  #dz-form-panel { padding: 1.9rem; gap: 1.1rem; }
  #dz-form-panel h3 { font-size: 2.04rem; }
  #dz-form-panel form { gap: 1rem; }
  #dz-form-panel .dz-field { gap: 0.4rem; }
  #dz-form-panel input, #dz-form-panel textarea, #dz-form-panel select { padding: 0.85rem 1.2rem; font-size: 1rem; }
  #dz-form-panel label { font-size: 0.8rem; }
  #dz-form-panel .dz-consent { font-size: 0.85rem; line-height: 1.4; }
  #dz-form-submit { height: 3.2rem; font-size: 1.15rem; }
}

@media (prefers-reduced-motion: reduce) {
  .dz-words .dz-w { opacity: 1 !important; transform: none !important; filter: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
  .dodo-img { animation: none !important; opacity: 1 !important; }
  .ru-inner { transform: none !important; opacity: 1 !important; }
  .inview { opacity: 1 !important; transform: none !important; }
  .preloader { display: none !important; }
}

/* ===================== MOBILE REFINEMENTS (<= 639px) =====================
   Mobile-only overrides. Desktop (>= 640px) is intentionally untouched:
   none of these rules match above 639px. Appended last so they win by
   cascade order without editing the existing desktop rules. */
@media (max-width: 639px) {
  :host { --section: 5rem; }

  /* Hero: keep the giant kinetic wordmark, but size it to the phone so it no
     longer collides with the intro copy or bleed-clips off both edges. */
  .hero-top { padding-top: 5.25rem; gap: 1.25rem; }
  .hero-desc { font-size: 1rem; }
  .hero-name { font-size: 6.75rem; bottom: 11vh; }

  /* Hero art-direction for mobile: the dodo video (z-40) sits ABOVE the intro
     copy (z-30) and, at 80vw, covers it. Lift the copy above the dodo and lay a
     soft cinematic scrim behind it so the text is crisp while the character
     still fills the frame. */
  .hero-top {
    position: relative;
    z-index: 46;
    background: linear-gradient(180deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.72) 45%, rgba(8,8,10,0.32) 78%, rgba(8,8,10,0) 100%);
    padding-bottom: 2.5rem;
  }
  .hero-desc { color: #d7d5cd; }

  /* "Stages" (ventures): the meta column crushed the blurb into a 2-word
     ribbon. Stack heading/blurb above the meta so copy uses the full width. */
  .ventures-grid { margin-top: 2rem; row-gap: 2.5rem; }
  .venture .row { flex-direction: column; gap: 0.75rem; }
  .venture .meta { text-align: left; }
  .venture .blurb { max-width: none; }

  /* About stats: figures were --text-display (7.5rem) inside a 2-col grid, so
     "24/7" / "EN.FR" overflowed their cell. Fit them to the column. */
  #dz-about-stats { column-gap: 0.75rem; row-gap: 2rem; }
  #dz-about-stats dd { font-size: 3.5rem; }

  /* Services: the desktop version is a 400lvh pinned horizontal SCROLL-JACK
     (heading fixed, cards scrubbed sideways as you scroll) - heavy and janky on
     touch. Rebuild it as a mobile-native swipe carousel: the section returns to
     normal flow, the heading sits above, and the cards become a scroll-snap
     rail you flick through. The JS scrub keeps running but its transform is
     neutralised, so desktop is untouched and mobile just swipes. */
  #dz-svc-runway { height: auto; }
  #dz-svc-panel {
    position: static; height: auto; overflow: visible;
    border-radius: 1.5rem 1.5rem 0 0; padding-bottom: 2.75rem;
  }
  #dz-svc-head { position: static; padding: 3.5rem var(--gutter) 1.75rem; }
  #dz-svc-head .dz-display { font-size: 2.5rem; }
  #dz-svc-rail {
    position: static; inset: auto; top: auto; transform: none !important;
    overflow-x: auto; overflow-y: hidden;
    scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    padding: 0 var(--gutter) 0.5rem; gap: 0.85rem;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  #dz-svc-rail::-webkit-scrollbar { display: none; }
  .dz-svc-card {
    height: 64vh; max-height: 30rem; width: 80vw;
    scroll-snap-align: center;
  }

  /* De-scroll-jack the rest of the dz- choreography on mobile. On desktop these
     sections coordinate with sticky pins + negative margins (About rides up
     -100lvh over Services, Team pins full-height, Contact rides over Team). Once
     Services is normal-flow that coordination breaks (About covered the rail).
     On mobile we want a clean vertical stack anyway - scroll-jacking fights
     touch. Each returns to normal flow; desktop keeps every pin. */
  #dz-why { height: auto; }
  #dz-why-copy {
    position: static; transform: none; width: auto;
    padding: 4.5rem var(--gutter); gap: 1.75rem;
  }
  #dz-about { margin-top: 0; }
  #dz-team {
    position: static; height: auto;
    padding-top: 3.5rem; padding-bottom: 3rem;
  }
  #dz-team-box { height: auto; }
  #dz-team-rail { height: 62vh; flex: none; }
  #dz-contact { min-height: 0; }

  /* Contact email: avoid the awkward ".mu" orphan wrap. */
  .contact-email { font-size: 1.5rem; overflow-wrap: anywhere; word-break: normal; }

  /* Nav logo + toggle stay visible over both dark and light sections on
     mobile (the wordmark is white, so it vanished on the white sections). */
  .nav-logo-img { mix-blend-mode: difference; }
  .burger span { mix-blend-mode: difference; }

  /* ---- Stage 2: touch micro-interactions + swipe polish ---- */

  /* Press feedback: on touch there is no hover, so give the primary tap targets
     a subtle, quick scale-in on :active. Restrained by design. */
  .dz-btn, .dz-svc-card, .dz-team-intro, .dz-team-more,
  .voice-btn, .contact-email, .dz-btn.primary, .footer-social a {
    transition: transform 140ms cubic-bezier(0.22,1,0.36,1), color 200ms ease, background 200ms ease, border-color 200ms ease;
  }
  .dz-btn:active, .dz-svc-card:active,
  .dz-team-intro:active, .dz-team-more:active { transform: scale(0.97); }
  .contact-email:active { color: var(--accent); }
  .voice-btn:active .vname { color: var(--foreground); }

  /* Swipe rails: snap the cards to a comfortable resting point and keep the
     left gutter as the snap edge so a card never rests half-off-screen. */
  #dz-svc-rail { scroll-padding-left: var(--gutter); }
  #dz-team-rail {
    scroll-snap-type: x proximity; scroll-padding-left: var(--gutter);
  }
  .dz-team-intro, .dz-team-card, .dz-team-more { scroll-snap-align: start; }

  /* Footer social links were 28px tall - below a comfortable touch target.
     Give them a 44px min height without changing their look. */
  .footer-social a { min-height: 44px; }

  /* ---- Stage 3: staggered reveal for the rebuilt swipe-rail cards ---- */
  /* The hidden state is gated behind main.dz-rv-ready, which the script adds
     ONLY on mobile + no-reduced-motion. If the script never runs, the class is
     never added and the cards stay visible - content is never trapped hidden.
     Classes are stripped after entry so tap-feedback stays snappy, and a
     failsafe reveals them if the observer never fires. */
  main.dz-rv-ready .dz-rv { opacity: 0; transform: translateY(26px); }
  main.dz-rv-ready .dz-rv.dz-in {
    opacity: 1; transform: none;
    transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1),
                transform 0.6s cubic-bezier(0.16,1,0.3,1);
  }

  /* ---- Stage 4: typography refinement ---- */
  /* Closing headline: the user's "DO IT ONCE, / DO IT RIGHT" pre-line break
     wrapped to 4 lines at 5rem. Size it so each line sits on one clean line
     (measured: "DO IT ONCE," needs <= 3.37rem to fit; 3.3rem holds to 320px). */
  .contact-heading { font-size: 3.3rem; }
  /* Dark-section body copy was #807f78 (~4.3:1 on the near-black ground, just
     under WCAG AA). Lift the reading text to a readable secondary tone; the
     subtle eyebrows/labels and the light dz- sections keep their own colour. */
  .story-body, .principle p, .venture .blurb, .contact-body,
  #dz-why .dz-lead, #dz-services .dz-lead { color: #9e9c93; }
}
/* Black and white: light sections use ink as the accent */
#dz-about, #dz-team, #dz-contact, .site-nav[data-nav="light"] { --accent: #0f0f12; --accent-2: #2a2a2e; }
#dz-why .dz-btn.primary { color: #08080a; }
.dz-card-link { position: absolute; inset: 0; z-index: 5; border-radius: inherit; }
.dz-card-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -4px; }
`;

const MARKUP = `
<div class="preloader" id="preloader">
  <div class="bg"></div>
  <img class="brand" id="pre-brand" src="/uploads/Y3UuFxigO0lcmzzyC5TG1-dd-wordmark-white.webp" alt="Disruptive Dodo" style="height:8.4rem;width:auto;display:block" loading="eager" decoding="async" />
  <p class="counter" id="pre-counter"><span id="pre-num">0</span><span class="pct">%</span></p>
</div>
<header class="site-nav" data-nav="dark">
  <div class="nav-row">
    <div class="nav-cell nav-logo-cell"><a class="nav-logo" href="#top" aria-label="Disruptive Dodo home"><img class="nav-logo-img" src="/uploads/djPiXfadxex2__L1ISamo-DD_Logos_final__4_.png" alt="Disruptive Dodo" style="height:2.34rem;width:auto;display:block" loading="eager" decoding="async" /></a></div>
    <div class="nav-cell nav-mid"><i class="cmk cmk-tl"></i><i class="cmk cmk-bl"></i></div>
    <a class="nav-cell nav-action" href="#dz-contact"><span class="nav-swap" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><svg viewBox="0 0 12 12" fill="none"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="roll"><span class="a">Contact</span><span class="b" aria-hidden="true">Contact</span></span><i class="cmk cmk-tl"></i><i class="cmk cmk-bl"></i></a>
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
  </div>
  <nav class="nav-center" aria-label="Primary">
    <ul>
      <li><a href="/services"><span class="roll"><span class="a">Services</span><span class="b">Services</span></span></a></li>
      <li><a href="/fledge"><span class="roll"><span class="a">Fledge</span><span class="b">Fledge</span></span></a></li>
      <li><a href="/work"><span class="roll"><span class="a">Work</span><span class="b">Work</span></span></a></li>
      <li><a href="/about"><span class="roll"><span class="a">About</span><span class="b">About</span></span></a></li>
    </ul>
  </nav>
  <div class="mobile-menu" id="mobile-menu">
    <ul>
      <li><div><a href="/services"><span>Services</span><svg class="m-arw" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div></li>
      <li><div><a href="/fledge"><span>Fledge</span><svg class="m-arw" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div></li>
      <li><div><a href="/work"><span>Work</span><svg class="m-arw" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div></li>
      <li><div><a href="/about"><span>About</span><svg class="m-arw" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div></li>
    </ul>
    <a class="mm-action" href="#dz-contact"><svg class="mm-arw" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Get in touch</span></a>
  </div>
</header>
<main>
  <section class="hero" id="top">
    <div class="hero-top">
      <div class="hero-left">
        <h2 class="hero-roles">
          <span class="line reveal" data-unit="line" data-dur="760" data-hero-delay="2700">Websites</span>
          <span class="line reveal" data-unit="line" data-dur="760" data-hero-delay="2780">Advertising</span>
          <span class="line reveal" data-unit="line" data-dur="760" data-hero-delay="2860">Automation</span>
          <span class="line reveal" data-unit="line" data-dur="760" data-hero-delay="2940">Growth</span>
        </h2>
      </div>
    </div>
    <div class="hero-portrait">
      <div class="dodo-glow" aria-hidden="true"></div>
      <div class="dodo-parallax" id="dodo-parallax">
        <video class="dodo-img" autoplay muted playsinline preload="auto" poster="/uploads/MSjZSDd6t4yM7WEEPNOCG-hero-poster.webp" src="/uploads/QBjf886yyosr0c73Ud0ND-tlg8V9xpnNt4jwXezM_qHQ.webm"></video>
      </div>
    </div>
    <div class="hero-gradient" aria-hidden="true"></div>
    <div class="hero-cta inview" style="--iv-y:16px;--iv-dur:520ms;--iv-delay:3050ms">
      <a class="hero-btn" href="#dz-contact"><span class="hero-btn-fill" aria-hidden="true"></span><span class="hero-btn-roll"><span class="a">Get more clients</span><span class="b" aria-hidden="true">Get more clients</span></span></a>
      <a class="hero-btn-2" href="#dz-services">See what we do</a>
    </div>
    <p class="scroll-cue inview" style="--iv-y:0px;--iv-dur:600ms;--iv-delay:3400ms">
      <span class="rule" aria-hidden="true"></span>Scroll to begin
    </p>
  </section>
  <div class="stack-reveal">
  <section class="marquee" aria-label="Operating principles">
    <div class="marquee-track" id="marquee-track"></div>
  </section>
  <section class="manifesto" id="manifesto" data-section>
    <h2 class="manifesto-statement" id="manifesto-statement">Disruptive Dodo is a marketing and business growth agency based in Mauritius, working with businesses locally and globally 🌍. We build systems that generate leads, close deals, and scale operations. Our team has done it across 20+ industries 🚀.</h2>
  </section>
  <section id="dz-services" data-dz>
    <div id="dz-svc-runway">
      <div id="dz-svc-panel">
        <div id="dz-svc-head">
          <p class="dz-eyebrow" data-dz-words="eyebrow">What We Build</p>
          <h2 class="dz-display" data-dz-words="heading">Everything you need to grow, under one roof</h2>
          <p class="dz-lead" data-dz-words="body">Six services that get you found, win you the sale, and keep customers coming back. Take one, or let us run the lot.</p>
        </div>
        <div id="dz-svc-rail">
          <article class="dz-svc-card lime">
            <a class="dz-card-link" href="/services/web-design" aria-label="Discover Websites and SEO"></a><span class="dz-bg" style="background-image:url('/uploads/rQj-rf6y8kzmTrOq8tCz6-svc-gradient-antipode.webp')"></span><div class="dz-top"><p class="dz-idx">01</p><div class="dz-tt"><h3>Get Found.<br>Get Chosen.</h3><p class="dz-sub">Websites, SEO, and content that put your business in front of the right people.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
          <article class="dz-svc-card brand">
            <a class="dz-card-link" href="/services/facebook-google-ads" aria-label="Discover Paid ads"></a><span class="dz-bg" style="background-image:url('/uploads/pRFJj72VWCnd0T9r_233u-svc-gradient-gnomon.webp')"></span><div class="dz-top"><p class="dz-idx">02</p><div class="dz-tt"><h3>Get More<br>Customers.</h3><p class="dz-sub">Client acquisition systems that turn attention into enquiries, sales, and growth.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
          <article class="dz-svc-card lime">
            <a class="dz-card-link" href="/services/branding-logo-design" aria-label="Discover Branding"></a><span class="dz-bg" style="background-image:url('/uploads/a77k9D6QYeB_rsP9prFT5-svc-gradient-meridian.webp')"></span><div class="dz-top"><p class="dz-idx">03</p><div class="dz-tt"><h3>Look Like<br>the Leader.</h3><p class="dz-sub">Branding that makes your business stand out, build trust, and get remembered.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
          <article class="dz-svc-card brand">
            <a class="dz-card-link" href="/services/ai-chatbots" aria-label="Discover AI implementation"></a><span class="dz-bg" style="background-image:url('/uploads/jynwU4ZlUcvkFo7HdezFK-svc-gradient-cynosure.webp')"></span><div class="dz-top"><p class="dz-idx">04</p><div class="dz-tt"><h3>Grow Without<br>Growing Your Team.</h3><p class="dz-sub">Automate repetitive work and streamline your business so you can handle more without hiring more people.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
          <article class="dz-svc-card lime">
            <a class="dz-card-link" href="/services/marketing-automation-crm" aria-label="Discover Automation and CRM"></a><span class="dz-bg" style="background-image:url('/uploads/BVywNC3ExdKpfgDNuKj1K-svc-gradient-hearth.webp')"></span><div class="dz-top"><p class="dz-idx">05</p><div class="dz-tt"><h3>Close More<br>Sales.</h3><p class="dz-sub">CRM and sales automation that keeps leads moving, follows up faster, and helps you close more business.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
          <article class="dz-svc-card brand">
            <a class="dz-card-link" href="/services/social-media-management" aria-label="Discover Social media"></a><span class="dz-bg" style="background-image:url('/uploads/ZbsQomRpOljHSJxUMYvdQ-svc-gradient-firmament.webp')"></span><div class="dz-top"><p class="dz-idx">06</p><div class="dz-tt"><h3>Stay Top<br>of Mind.</h3><p class="dz-sub">Social media and content that keep your brand visible, trusted, and relevant.</p></div></div>
            <div class="dz-disc"><p>Discover</p><span class="dz-ring" data-dz-arrow></span></div>
          </article>
        </div>
      </div>
    </div>
  </section>


  <section class="section" id="story" data-section>
    <div class="story-grid">
      <div class="story-left">
        <p class="eyebrow"><span class="dot"></span>The Real Problem</p>
        <h2 class="story-heading reveal" data-unit="line" data-linestagger="90" data-dur="900">Growth shouldn't feel this hard.</h2>
        <p class="story-body inview" style="--iv-y:24px;--iv-dur:560ms">You don't need more random marketing. You need to know what's holding your business back. Maybe you're not getting enough enquiries. Maybe you're getting them but not closing enough. Maybe your team is buried in manual work. We find the bottleneck, fix it, and build a system that helps your business grow.</p>
      </div>
      <ul class="story-list">
        <li class="principle inview" style="--iv-y:40px;--iv-dur:560ms;--iv-delay:0ms">
          <span class="idx">01</span>
          <div><h3>We find what's holding you back</h3><p>Before we recommend anything, we look at your marketing, sales, systems, and operations to find where growth is getting stuck.</p></div>
        </li>
        <li class="principle inview" style="--iv-y:40px;--iv-dur:560ms;--iv-delay:90ms">
          <span class="idx">02</span>
          <div><h3>We fix the biggest problem first</h3><p>You don't need everything at once. We focus on the changes that can make the biggest difference to your business.</p></div>
        </li>
        <li class="principle inview" style="--iv-y:40px;--iv-dur:560ms;--iv-delay:180ms">
          <span class="idx">03</span>
          <div><h3>We build for growth</h3><p>From websites and client acquisition to CRM, automation, and AI, we build systems that work together as your business grows.</p></div>
        </li>
        <li class="principle inview" style="--iv-y:40px;--iv-dur:560ms;--iv-delay:270ms">
          <span class="idx">04</span>
          <div><h3>We measure what matters</h3><p>More enquiries. More sales. Less wasted time. Better systems. We focus on the numbers that actually move your business forward.</p></div>
        </li>
      </ul>
    </div>
  </section>
  <section class="section" id="ventures" data-section>
    <div class="head-row">
      <div class="vent-head-left">
        <p class="eyebrow"><span class="dot"></span>How Growth Works</p>
        <h2 class="ventures-heading reveal" data-unit="line" data-linestagger="90" data-dur="900">Growth is a loop, not luck.</h2>
      </div>
      <p class="head-count">04 / Stages</p>
    </div>
    <ul class="ventures-grid" id="ventures-grid"></ul>
  </section>
  <section class="section" id="impact" data-section>
    <div class="head-row">
      <p class="eyebrow"><span class="dot"></span>By The Numbers</p>
      <h2 class="impact-heading reveal" data-unit="line" data-linestagger="90" data-dur="800">Proof, not promises.</h2>
    </div>
    <dl class="impact-grid" id="impact-grid"></dl>
  </section>
  <section class="section" id="voices" data-section>
    <div class="head-row">
      <p class="eyebrow"><span class="dot"></span>Common Situations</p>
      <h2 class="voices-heading reveal" data-unit="line" data-linestagger="90" data-dur="800">Sound familiar?</h2>
    </div>
    <div class="voices-body">
      <ul class="voices-list" id="voices-list"></ul>
      <div class="voices-feature">
        <div class="inner">
          <blockquote class="voices-quote">
            <p id="voice-quote"></p>
            <footer id="voice-footer"></footer>
          </blockquote>
          <div class="voices-portrait inview" id="voices-portrait-wrap" style="--iv-y:0px;--iv-s:1.06;--iv-dur:640ms">
            <figure class="liquid rounded ar-4-5" id="voice-portrait" data-strength="22" role="img" aria-label="Portrait">
              <img class="lq-leaf" alt="" style="object-fit:cover;object-position:center"
                src="https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/ventures/venture-01.webp" />
            </figure>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section id="dz-why" data-dz>
    <div id="dz-trail">
      <div class="dz-cards" aria-hidden="true"></div>
      <div id="dz-why-copy">
        <div class="dz-head">
          <p class="dz-eyebrow center" data-dz-words="eyebrow" data-dz-center>Partners &amp; Tools</p>
          <h2 class="dz-display" data-dz-words="heading" data-dz-center>The partners and tools we use to bring you more clients</h2>
        </div>
        <p class="dz-lead" data-dz-words="body" data-dz-center>The platforms, tools and partners we put to work every day, turning attention into real clients for your business.</p>
        <div class="dz-row">
          <a class="dz-btn primary" href="#dz-services">See what we build</a>
          <a class="dz-btn secondary" href="#dz-about">How we work</a>
        </div>
      </div>
    </div>
  </section>



  <section id="dz-about" data-dz>
    <div id="dz-about-banner">
      <div class="dz-layer"><video class="dz-about-video" src="/uploads/IQzHSDYrM4K_U-bTGOt-d-1111__1_.webm" muted loop playsinline preload="none"></video></div>
    </div>
    <div id="dz-about-row">
      <div id="dz-about-left">
        <p class="dz-eyebrow" data-dz-words="eyebrow">About Disruptive Dodo</p>
        <dl id="dz-about-stats">
          <div><dd data-count="1 hr"></dd><dt>Every enquiry answered within a business hour</dt></div>
          <div><dd data-count="24/7"></dd><dt>Automated follow-up that never sleeps</dt></div>
          <div><dd data-count="4"></dd><dt>Growth stages, handled by one team</dt></div>
          <div><dd data-count="EN·FR"></dd><dt>We work in English and French</dt></div>
        </dl>
      </div>
      <div id="dz-about-right">
        <p id="dz-about-para" data-dz-words="body"><span class="muted">We're a Mauritian growth agency built on one idea:</span><span> your website, your marketing and your follow-up should work as one. </span><span class="muted">We find where your business is quietly losing customers</span><span>, and we build the system that wins them back.</span></p>
        <div id="dz-about-actions">
          <a class="dz-btn primary" href="#dz-contact">Get your free audit</a>
          <a class="dz-btn secondary" href="#dz-services">See our services</a>
        </div>
      </div>
    </div>
  </section>

  <section id="dz-team" data-dz>
    <div id="dz-team-box">
      <div id="dz-team-rail">
        <div class="dz-team-intro">
          <div class="dz-head">
            <p class="dz-eyebrow" data-dz-words="eyebrow">Our Team</p>
            <h2>The team doing the actual work.</h2>
          </div>
          <ul>
            <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.5 8h4V24h-4V8zM8 8h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-6.9c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.8-2.65 3.65V24H8V8z"/></svg></a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg></a></li>
            <li><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm4.6 10.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.7 2.7 4.2 3.7 1.6.6 2.2.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z"/></svg></a></li>
          </ul>
        </div>
        <figure class="dz-team-card"><img src="/uploads/TcCvtPpdfRSQ40SXzgmKg-lucas.webp" alt="Lucas" /><figcaption><p class="n">Lucas</p><p class="r">Creative Director</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/hrvF8MipKOOMuq5llX4-7-jean-claude.webp" alt="Jean-Claude" /><figcaption><p class="n">Jean-Claude</p><p class="r">Technology Director</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/r6T3hk_tWmTKFV--9lfmI-kipchoge.webp" alt="Kipchoge" /><figcaption><p class="n">Kipchoge</p><p class="r">Content Strategist &amp; Copywriter</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/Y4F8XEexEYhIoqDIX-iq4-karen.webp" alt="Karen" /><figcaption><p class="n">Karen</p><p class="r">Admin Manager</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/CrkYysWGiObmGuyENP1d3-ali.webp" alt="Ali" /><figcaption><p class="n">Ali</p><p class="r">Automations Specialist</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/ZWWXdhwHVCWj5BnpoZYl6-nigel.webp" alt="Nigel" /><figcaption><p class="n">Nigel</p><p class="r">Global Business Developer</p></figcaption></figure>
        <figure class="dz-team-card"><img src="/uploads/l3T8jR3_BUunVlm3uP6OT-portrait_braidedhair.png" alt="Amara" /><figcaption><p class="n">Amara</p><p class="r">Graphic Designer</p></figcaption></figure>
        <a class="dz-team-more" href="#dz-contact">
          <p>Local team. Real specialists. No outsourcing.</p>
          <span class="dz-foot"><span>Say hello</span><span class="dz-ring" data-dz-arrow></span></span>
        </a>
        <span aria-hidden="true" style="width:2.5rem;flex:none"></span>
      </div>
      <div id="dz-team-bar"><div class="dz-fill"></div></div>
    </div>
  </section>

  <section id="dz-contact" data-dz>
    <div class="dz-glow" aria-hidden="true"></div>
    <div id="dz-contact-copy">
      <div class="dz-head">
        <p class="dz-eyebrow" data-dz-words="eyebrow">Get In Touch</p>
        <h2 class="dz-display" data-dz-words="heading">Tell us where your business is leaking customers</h2>
      </div>
      <p class="dz-lead" data-dz-words="body">Leave your details and we'll come back within one business hour: a straight read on what's costing you customers, and what we'd fix first. No jargon, no hard sell.</p>
    </div>
    <div id="dz-form-panel">
      <div class="dz-head">
        <h3>BOOK A FREE GROWTH CALL</h3>
      </div>
      <form id="dz-contact-form" novalidate>
        <div class="dz-field"><label for="dz-name">Your name</label><input id="dz-name" name="name" type="text" placeholder="Name" autocomplete="name" /></div>
        <div class="dz-field"><label for="dz-company">Company name</label><input id="dz-company" name="company" type="text" placeholder="Your business" autocomplete="organization" /></div>
        <div class="dz-field"><label for="dz-phone">Phone / WhatsApp</label><input id="dz-phone" name="phone" type="tel" placeholder="+230 …" autocomplete="tel" /></div>
        <div class="dz-field"><label for="dz-problem">What's slowing your growth?</label><select id="dz-problem" name="problem"><option value="" disabled selected>Choose one…</option><option>Getting more customers</option><option>A website that converts</option><option>Following up on enquiries</option><option>Brand &amp; positioning</option><option>Too much manual admin</option><option>Not sure, help me diagnose</option></select></div>
        <div class="dz-field"><label for="dz-message">Anything else?</label><textarea id="dz-message" name="message" rows="2" placeholder="Tell us a little about your business"></textarea></div>
        <p class="dz-consent">By submitting, you agree to our <a href="/privacy">privacy policy</a> and to be contacted about your enquiry.</p>
        <button id="dz-form-submit" type="submit"><span>Send request</span><span class="dz-disc" data-dz-arrow></span></button>
      </form>
      <div id="dz-form-done">
        <h3>Thanks, message ready.</h3>
        <p>We've opened WhatsApp so you can send it in one tap. Prefer email? Write to <a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a> and we'll reply within one business hour.</p>
      </div>
    </div>
  </section>

  <footer class="contact" id="contact" data-section>
    <p class="eyebrow"><span class="dot"></span>Prefer Email?</p>
    <h2 class="contact-heading reveal" data-unit="line" data-linestagger="90" data-dur="950">Do it once,
do it right</h2>
    <p class="contact-body inview" style="--iv-y:20px;--iv-dur:560ms">Built properly the first time. One team, no wasted spend, nothing to redo later. Email us and let's get started.</p>
    <div class="contact-email-wrap">
      <a class="contact-email" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu<span class="arrow" aria-hidden="true">↗</span></a>
    </div>
    <div class="footer-bar">
      <div class="footer-sig">
        <img class="sig-logo" src="/uploads/djPiXfadxex2__L1ISamo-DD_Logos_final__4_.png" alt="Disruptive Dodo" style="height:4.2rem;width:auto;display:block" loading="eager" decoding="async" />
        <p class="credit">Built in Mauritius. Made to grow.</p>
      </div>
      <nav class="footer-social" aria-label="Social">
        <ul>
          <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener"><span class="rule" aria-hidden="true"></span>LinkedIn</a></li>
          <li><a href="https://instagram.com" target="_blank" rel="noreferrer noopener"><span class="rule" aria-hidden="true"></span>Instagram</a></li>
          <li><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener"><span class="rule" aria-hidden="true"></span>WhatsApp</a></li>
        </ul>
      </nav>
      <div class="footer-copy">
        <p>© 2026 Disruptive Dodo. All rights reserved.</p>
      </div>
    </div>
  </footer>
  </div>
</main>
`;

function mvApp(R) {
  const byId = (id) => R.getElementById(id);
  const qa = (s) => R.querySelectorAll(s);
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE_EXPO = "cubic-bezier(0.16,1,0.3,1)";
  const EASE_QUART = "cubic-bezier(0.165,0.84,0.44,1)";
  const BASE = "https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6";
  const marqueeWords = ["More Customers","Less Chaos","No Lost Enquiries","Found On Google","Top Of Mind","Made In Mauritius"];
  const venturesData = [
    { name:"Get Found", category:"Visibility & Demand", year:"01", outcome:"SEO · Ads · Social", blurb:"Websites, SEO, content and paid ads that put your business in front of the right people, the moment they're searching or scrolling.", image:"/uploads/Mrdu1P-elI1S_QBDYt8vW-get-found.webp" },
    { name:"Get Chosen", category:"Brand & Websites", year:"02", outcome:"Brand · Web · Proof", blurb:"Branding and websites that make you look like the leader, build trust and turn visitors into enquiries.", image:"/uploads/XSXX-id9BHcKW0_VRjO0Z-get-chosen.webp" },
    { name:"Get The Business", category:"Capture & Convert", year:"03", outcome:"CRM · AI · Follow-up", blurb:"Client acquisition and CRM automation that keep leads moving, follow up faster and help you close more sales.", image:"/uploads/8NZBFRArbOQoiXmVStfKq-get-business.webp" },
    { name:"Keep & Grow", category:"Retain & Refer", year:"04", outcome:"Reviews · Repeat", blurb:"Automation and social content that streamline your work, keep you top of mind and bring customers back, without growing your team.", image:"/uploads/R1HX5bNVX-GilKHdxJM_T-keep-grow.webp" },
  ];
  const impactData = [
    { value:"117+", label:"Mauritian businesses helped" },
    { value:"7 yrs", label:"Building growth systems here" },
    { value:"3x", label:"More online orders for a client" },
    { value:"20h+", label:"Saved every week with automation" },
  ];
  const voicesData = [
    { quote:"You get in front of the right companies, but too often it ends with 'we went with someone else', and you rarely find out why.", name:"Losing deals you should win", role:"Chosen second, one too many times", fix:"Positioning and follow-up that win the deals you're already in.", image:"/uploads/Q_-xFlqyW9x-S9fdXR1TD-voice-1.webp" },
    { quote:"There just aren't enough qualified opportunities coming in, and forecasting next quarter is mostly guesswork.", name:"A pipeline that runs dry", role:"Too few deals, no way to predict them", fix:"A client-acquisition system that brings in leads you can forecast.", image:BASE+"/ventures/venture-03.webp" },
    { quote:"Leads, approvals and handoffs cross three departments and two systems, so deals stall in the gaps between them.", name:"Lost in the handoffs", role:"Complexity is quietly costing you deals", fix:"Connected CRM and automation so nothing stalls between teams.", image:BASE+"/ventures/venture-02.webp" },
    { quote:"A prospect asks for a proposal Tuesday; it goes out Friday. By then they've had two calls with a competitor who replied in an hour.", name:"The follow-up that came too late", role:"No system, no second chance", fix:"Automated follow-up that replies in minutes, not days.", image:BASE+"/ventures/venture-04.webp" },
    { quote:"The business still runs on paper, spreadsheets and tools that don't connect. It still gets the job done, but it's starting to look dated next to competitors who've already modernised.", name:"Too outdated for the market", role:"Overdue for a digital overhaul", fix:"A modern website and systems that bring the business up to date.", image:BASE+"/ventures/venture-01.webp" },
  ];

  const FONT_BASE = 16, BASE_W = 1920, COEF = 0.6666;
  function applyAdaptiveGrid(){
    const w = window.innerWidth;
    const reduction = ((BASE_W - w) / BASE_W) * 100 * COEF;
    const size = FONT_BASE - (FONT_BASE * reduction) / 100;
    if (size > FONT_BASE) document.documentElement.style.fontSize = size + "px";
    else document.documentElement.style.removeProperty("font-size");
  }
  applyAdaptiveGrid();
  addEventListener("resize", applyAdaptiveGrid);

  let lenis = null, scrollLocked = false;
  const scrollApi = {
    stop(){ scrollLocked = true; document.documentElement.style.overflow = "hidden"; if (lenis) lenis.stop(); },
    start(){ scrollLocked = false; document.documentElement.style.overflow = ""; if (lenis) lenis.start(); },
    scrollTo(t){ if (lenis) lenis.scrollTo(t); else if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };
  import("https://esm.sh/lenis@1.3.19").then((m) => {
    lenis = new m.default({ smoothWheel: true });
    window.lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (scrollLocked) lenis.stop(); else lenis.start();
  }).catch(() => {});

  qa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = id === "#top" ? R.querySelector(".hero") : R.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollApi.scrollTo(target);
    });
  });

  (function buildMarquee(){
    const track = byId("marquee-track");
    const frag = document.createDocumentFragment();
    ["a","b"].forEach(() => {
      marqueeWords.forEach((word) => {
        const item = document.createElement("span"); item.className = "item";
        const w = document.createElement("span"); w.className = "word"; w.textContent = word;
        const sep = document.createElement("span"); sep.className = "sep"; sep.setAttribute("aria-hidden","true");
        item.append(w, sep); frag.appendChild(item);
      });
    });
    track.appendChild(frag);
  })();

  (function buildVentures(){
    const grid = byId("ventures-grid");
    venturesData.forEach((v, i) => {
      const li = document.createElement("li");
      li.className = "inview";
      li.style.setProperty("--iv-y", "60px");
      li.style.setProperty("--iv-dur", "620ms");
      li.style.setProperty("--iv-delay", ((i % 2) * 120) + "ms");
      li.innerHTML =
        '<article class="venture">' +
        '<figure class="liquid rounded ar-16-11" data-strength="28" role="img" aria-label="' + v.name + ', ' + v.category + '">' +
        '<img class="lq-leaf" alt="" style="object-fit:cover;object-position:center" src="' + v.image + '" data-label="' + v.name + '" />' +
        '</figure>' +
        '<div class="row"><div><h3><span class="name">' + v.name + '</span></h3>' +
        '<p class="blurb">' + v.blurb + '</p></div>' +
        '<div class="meta"><p class="year">' + v.year + '</p>' +
        '<p class="outcome">' + v.outcome + '</p></div></div>' +
        '<p class="cat">' + v.category + '</p></article>';
      grid.appendChild(li);
    });
  })();

  (function buildImpact(){
    const grid = byId("impact-grid");
    impactData.forEach((s, i) => {
      const cell = document.createElement("div");
      cell.className = "stat inview";
      cell.style.setProperty("--iv-y", "40px");
      cell.style.setProperty("--iv-dur", "560ms");
      cell.style.setProperty("--iv-delay", (i * 110) + "ms");
      cell.innerHTML = '<dd class="figure">' + s.value + '</dd><dt class="label">' + s.label + '</dt>';
      grid.appendChild(cell);
    });
  })();

  let activeVoice = 0;
  (function buildVoicesList(){
    const list = byId("voices-list");
    voicesData.forEach((v, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "voice-btn" + (i === 0 ? " active" : "");
      btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      btn.innerHTML =
        '<span class="num">' + String(i+1).padStart(2,"0") + '</span>' +
        '<span class="who"><span class="vname">' + v.name + '</span>' +
        '<span class="vrole">' + v.role + '</span></span>' +
        '<span class="vrule" aria-hidden="true"></span>';
      const setActive = () => selectVoice(i);
      btn.addEventListener("mouseenter", setActive);
      btn.addEventListener("focus", setActive);
      btn.addEventListener("click", setActive);
      li.appendChild(btn);
      list.appendChild(li);
    });
  })();

  function splitReveal(el){
    const unit = el.dataset.unit;
    const off = el.dataset.off || "110%";
    const raw = el.textContent;
    el.textContent = "";
    el.style.setProperty("--ru-off", off);
    const units = [];
    const tokens = raw.split(/(\s+)/);
    if (unit === "letter") {
      tokens.forEach((tok) => {
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
        const wWrap = document.createElement("span");
        wWrap.style.display = "inline-block";
        wWrap.style.whiteSpace = "nowrap";
        [...tok].forEach((ch) => {
          const clip = document.createElement("span"); clip.className = "ru-clip";
          const inner = document.createElement("span"); inner.className = "ru-inner"; inner.textContent = ch;
          clip.appendChild(inner); wWrap.appendChild(clip);
          units.push({ clip, inner });
        });
        el.appendChild(wWrap);
      });
    } else {
      tokens.forEach((tok) => {
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
        const clip = document.createElement("span"); clip.className = "ru-clip";
        const inner = document.createElement("span"); inner.className = "ru-inner"; inner.textContent = tok;
        clip.appendChild(inner); el.appendChild(clip);
        units.push({ clip, inner });
      });
    }
    el._units = units;
  }

  function playReveal(el, baseDelay){
    const unit = el.dataset.unit;
    const dur = +(el.dataset.dur || 800);
    const stagger = +(el.dataset.stagger || 0);
    const lineStagger = +(el.dataset.linestagger || 0);
    const easing = el.dataset.easing === "quart" ? EASE_QUART : EASE_EXPO;
    const units = el._units || [];
    baseDelay = baseDelay || 0;
    const fire = (inner, delay) => {
      inner.style.transition = "transform " + dur + "ms " + easing + " " + delay + "ms, opacity " + dur + "ms " + easing + " " + delay + "ms";
      requestAnimationFrame(() => { inner.style.transform = "translateY(0)"; inner.style.opacity = "1"; });
    };
    if (unit === "line" && lineStagger > 0) {
      const groups = new Map();
      units.forEach((u) => {
        const top = u.clip.offsetTop;
        if (!groups.has(top)) groups.set(top, []);
        groups.get(top).push(u);
      });
      [...groups.keys()].sort((a,b)=>a-b).forEach((top, li) => {
        groups.get(top).forEach((u) => fire(u.inner, baseDelay + li * lineStagger));
      });
    } else {
      units.forEach((u, i) => fire(u.inner, baseDelay + i * stagger));
    }
  }

  qa(".reveal").forEach(splitReveal);
  (function(){
    const h = byId("manifesto-statement");
    if (!h) return;
    const raw = h.textContent; h.textContent = "";
    const letters = [];
    raw.split(/(\s+)/).forEach((tok) => {
      if (/^\s+$/.test(tok)) { h.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement("span"); w.style.display = "inline-block"; w.style.whiteSpace = "nowrap";
      [...tok].forEach((ch) => { const s = document.createElement("span"); s.className = "ltr"; s.textContent = ch; s.style.opacity = "0"; s.style.transform = "translateY(6px)"; w.appendChild(s); letters.push(s); });
      h.appendChild(w);
    });
    if (REDUCE) { letters.forEach((s) => { s.style.opacity = "1"; s.style.transform = "none"; }); return; }
    const K = 420, C = 34, PACE = 7;
    const st = letters.map(() => ({ v: 0, vel: 0, goal: 0 }));
    let raf = null, last = 0;
    function frame(now){
      if (!last) last = now; const dt = Math.min((now - last) / 1000, 0.05); last = now;
      let done = true;
      for (let i = 0; i < st.length; i++){
        const s = st[i];
        if (s.goal === 1 && s.v < 1){ const a = K * (1 - s.v) - C * s.vel; s.vel += a * dt; s.v += s.vel * dt; if (Math.abs(s.vel) < 0.002 && Math.abs(1 - s.v) < 0.002){ s.v = 1; s.vel = 0; } }
        const el = letters[i], vv = Math.min(1, Math.max(0, s.v));
        el.style.opacity = vv < 0.001 ? "0" : vv.toFixed(3);
        el.style.transform = "translateY(" + (6 * (1 - vv)).toFixed(2) + "px)";
        if (vv < 0.999) done = false;
      }
      raf = done ? null : requestAnimationFrame(frame);
    }
    let played = false;
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || played) return; played = true;
      letters.forEach((_, i) => { setTimeout(() => { st[i].goal = 1; if (raf == null){ last = 0; raf = requestAnimationFrame(frame); } }, i * PACE); });
    }, { threshold: 0.2 }).observe(h);
  })();

  function revealAllInstant(){
    qa(".ru-inner").forEach((i) => { i.style.transform = "none"; i.style.opacity = "1"; });
    qa(".inview").forEach((i) => i.classList.add("in-view"));
  }

  function critSpring(from, cfg, onUpdate){
    let x = from, v = 0, target = from, rafId = null, last = 0;
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.064); last = now;
      const a = (cfg.tension * (target - x) - cfg.friction * v) / (cfg.mass || 1);
      v += a * dt; x += v * dt;
      onUpdate(x);
      if (Math.abs(v) < 0.001 && Math.abs(target - x) < 0.001) { x = target; onUpdate(x); rafId = null; return; }
      rafId = requestAnimationFrame(step);
    };
    return (to) => { target = to; if (rafId == null) { last = performance.now(); rafId = requestAnimationFrame(step); } };
  }

  let liquidUid = 0;
  function initLiquid(fig){
    if (fig._liquidInit) return;
    fig._liquidInit = true;
    const bare = fig.classList.contains("bare");
    const strength = +(fig.dataset.strength || 26);
    const id = "liquid-" + (liquidUid++);
    const REST_FREQ = 0.009, REST_SCALE = 1, HOVER_FREQ = 0.022;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "lq-filter"); svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<filter id="' + id + '"><feTurbulence type="fractalNoise" baseFrequency="' + REST_FREQ + '" numOctaves="2" result="noise"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="' + REST_SCALE + '"></feDisplacementMap></filter>';
    fig.insertBefore(svg, fig.firstChild);
    const turb = svg.querySelector("feTurbulence");
    const disp = svg.querySelector("feDisplacementMap");
    const leaf = fig.querySelector(".lq-leaf");
    if (!bare) {
      const ph = document.createElement("div");
      ph.className = "lq-placeholder";
      ph.style.filter = "url(#" + id + ")";
      fig.insertBefore(ph, leaf);
    }
    if (leaf) leaf.style.filter = "url(#" + id + ")";
    if (!bare) {
      const label = leaf && leaf.dataset.label;
      const veil = document.createElement("div"); veil.className = "lq-veil"; fig.appendChild(veil);
      const glow = document.createElement("div"); glow.className = "lq-glow"; fig.appendChild(glow);
      let labelEl = null;
      if (label) {
        labelEl = document.createElement("figcaption");
        labelEl.className = "lq-label"; labelEl.style.display = "none";
        labelEl.innerHTML = "<span>" + label + "</span>";
        fig.appendChild(labelEl);
      }
      if (leaf && leaf.tagName === "IMG") {
        leaf.addEventListener("error", () => { leaf.dataset.errored = "1"; leaf.style.opacity = "0"; if (labelEl) labelEl.style.display = "flex"; });
      }
      const vig = document.createElement("div"); vig.className = "lq-vignette"; fig.appendChild(vig);
    }
    const setP = critSpring(0, { tension: 140, friction: 13 }, (p) => {
      const scale = REST_SCALE + p * (strength - REST_SCALE);
      const freq = REST_FREQ + p * (HOVER_FREQ - REST_FREQ);
      disp.setAttribute("scale", String(scale));
      turb.setAttribute("baseFrequency", String(freq));
    });
    const disabled = () => window.innerWidth <= 768;
    fig.addEventListener("mouseenter", () => { if (disabled()) return; fig.classList.add("hover"); setP(1); });
    fig.addEventListener("mouseleave", () => { fig.classList.remove("hover"); setP(0); });
  }
  qa(".liquid").forEach(initLiquid);

  const quoteEl = byId("voice-quote");
  const footerEl = byId("voice-footer");
  const portraitFig = byId("voice-portrait");
  const portraitImg = portraitFig.querySelector(".lq-leaf");

  function playQuote(){
    const v = voicesData[activeVoice];
    quoteEl.textContent = "“" + v.quote + "”";
    quoteEl.dataset.unit = "word";
    quoteEl.dataset.off = "18px";
    quoteEl.dataset.dur = "520";
    quoteEl.dataset.stagger = "22";
    quoteEl.dataset.easing = "quart";
    if (REDUCE) return;
    splitReveal(quoteEl);
    playReveal(quoteEl, 0);
  }

  function selectVoice(i){
    qa(".voice-btn").forEach((b, bi) => {
      b.classList.toggle("active", bi === i);
      b.setAttribute("aria-pressed", bi === i ? "true" : "false");
    });
    const changed = i !== activeVoice || !quoteEl._initialized;
    activeVoice = i;
    const v = voicesData[i];
    footerEl.textContent = "The fix: " + v.fix;
    portraitImg.setAttribute("src", v.image);
    portraitFig.setAttribute("aria-label", "Portrait of " + v.name);
    if (changed) { quoteEl._initialized = true; playQuote(); }
  }
  footerEl.textContent = "The fix: " + voicesData[0].fix;

  function initObservers(){
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        if (el.classList.contains("reveal")) { playReveal(el, 0); }
        else if (el.classList.contains("inview")) { el.classList.add("in-view"); }
      });
    }, { threshold: 0 });
    qa("[data-section]").forEach((section) => {
      section.querySelectorAll(".reveal, .inview").forEach((el) => io.observe(el));
    });
    const voicesSection = byId("voices") || R.querySelector("#voices");
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        vio.unobserve(entry.target);
        selectVoice(0);
      });
    }, { threshold: 0 });
    if (voicesSection) vio.observe(voicesSection);
  }

  function playHero(){
    R.querySelectorAll(".hero .reveal").forEach((el) => {
      playReveal(el, +(el.dataset.heroDelay || 2500));
    });
    R.querySelectorAll(".hero .inview").forEach((el) => el.classList.add("in-view"));
  }

  function initPreloader(){
    const pre = byId("preloader");
    const numEl = byId("pre-num");
    const brandEl = byId("pre-brand");
    const counterEl = byId("pre-counter");
    scrollApi.stop();
    window.scrollTo(0, 0);
    const DURATION = 2000;
    const startT = performance.now();
    function count(now){
      const p = Math.min((now - startT) / DURATION, 1);
      numEl.textContent = String(Math.round(p * 100));
      if (p < 1) { requestAnimationFrame(count); }
      else { onCountDone(); }
    }
    requestAnimationFrame(count);
    function onCountDone(){
      brandEl.style.transition = "opacity 300ms ease-out";
      counterEl.style.transition = "opacity 300ms ease-out";
      brandEl.style.opacity = "0";
      counterEl.style.opacity = "0";
      setTimeout(() => {
        pre.style.transition = "transform 650ms cubic-bezier(0.22,1,0.36,1)";
        pre.style.transform = "translateY(-100%)";
        const onEnd = () => {
          pre.removeEventListener("transitionend", onEnd);
          pre.style.pointerEvents = "none";
          pre.setAttribute("aria-hidden", "true");
          scrollApi.start();
        };
        pre.addEventListener("transitionend", onEnd);
        setTimeout(onEnd, 900);
      }, 200);
    }
    playHero();
  }

  // Hero dodo: spatial parallax that follows the mouse (desktop pointer only)
  (function heroParallax(){
    const par = R.querySelector(".dodo-parallax");
    const glow = R.querySelector(".dodo-glow");
    const name = R.querySelector(".hero-name");
    if (!par) return; try{var __v=par.querySelector("video.dodo-img"); if(__v){var __ua=navigator.userAgent||""; var __sf=(/^((?!chrome|android|crios|fxios).)*safari/i.test(__ua))||(/iPad|iPhone|iPod/.test(__ua)); if(__sf && !__v.querySelector('source[type="video/quicktime"]')){var __img=document.createElement("img"); __img.className="dodo-img"; __img.src=__v.getAttribute("poster"); __img.setAttribute("alt","Disruptive Dodo mascot"); __v.replaceWith(__img);}}}catch(e){} try{var __rv=par.querySelector("video.dodo-img"); if(__rv){var __show=function(){__rv.style.opacity="1";}; ["playing","canplay","loadeddata"].forEach(function(ev){__rv.addEventListener(ev,__show,{once:true});}); if(__rv.readyState>=2)__show(); setTimeout(__show,2000);}}catch(e){}
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const enabled = () => !(window.matchMedia("(hover: none)").matches) && window.innerWidth > 768;
    window.addEventListener("mousemove", (e) => {
      if (!enabled()) { tx = 0; ty = 0; return; }
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("mouseleave", () => { tx = 0; ty = 0; }, { passive: true });
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      var sp = Math.min(1, Math.max(0, (window.pageYOffset||0)/Math.max(1,window.innerHeight))); par.style.transform = "translate3d(" + (cx*22).toFixed(2) + "px," + (cy*14 - sp*80).toFixed(2) + "px,0) scale(" + (1 - sp*0.05).toFixed(3) + ") rotateY(" + (cx*7).toFixed(2) + "deg) rotateX(" + (-cy*5 + sp*6).toFixed(2) + "deg)";
      if (glow) glow.style.transform = "translate(-50%,-50%) translate3d(" + (cx*34).toFixed(2) + "px," + (cy*22).toFixed(2) + "px,0)";
      if (name) name.style.transform = "translateY(6%) translateX(" + (cx*-16).toFixed(2) + "px)";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  const burger = byId("burger");
  const mobileMenu = byId("mobile-menu");
  burger.addEventListener("click", () => {
    const open = burger.classList.toggle("open");
    mobileMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    burger.classList.remove("open");
    mobileMenu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));

  (function(){
    const navEl = R.querySelector(".site-nav");
    if (!navEl) return;
    const lightEls = ["dz-about", "dz-team", "dz-contact"].map((id) => R.getElementById(id)).filter(Boolean);
    let cur = "dark";
    const upd = () => {
      let light = false;
      for (let i = 0; i < lightEls.length; i++) { const r = lightEls[i].getBoundingClientRect(); if (r.top <= 32 && r.bottom > 32) { light = true; break; } }
      const next = light ? "light" : "dark";
      if (next !== cur) { cur = next; navEl.setAttribute("data-nav", next); }
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd, { passive: true });
    upd();
  })();

  if (REDUCE) {
    byId("preloader").style.display = "none";
    revealAllInstant();
    selectVoice(0);
    scrollApi.start();
  } else {
    initPreloader();
    initObservers();
  }
}

function dzInit(R) {
  const BASE = "https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  const subscribers = new Set();
  let rafId = null;
  const liveSprings = new Set();
  let springClock = 0;
  function advanceSprings(time) {
    const dt = springClock ? Math.min((time - springClock) / 1000, 0.064) : 0;
    springClock = time;
    if (dt <= 0) return;
    for (const s of liveSprings) s.advance(dt, time);
  }
  function frame(time) {
    advanceSprings(time);
    for (const sub of [...subscribers]) {
      if (!subscribers.has(sub)) continue;
      try { sub(time); } catch (e) { console.error("[dz ticker]", e); }
    }
    rafId = requestAnimationFrame(frame);
  }
  function subscribe(cb) {
    subscribers.add(cb);
    if (rafId === null) rafId = requestAnimationFrame(frame);
    return () => { subscribers.delete(cb); };
  }

  class Spring {
    constructor(config = {}, value = 0) {
      this.setConfig(config);
      this.value = value; this.goal = value; this.velocity = 0;
      this.done = true; this.pending = null;
      liveSprings.add(this);
    }
    setConfig(c) { this.k = c.tension ?? 170; this.c = c.friction ?? 26; this.m = c.mass ?? 1; }
    get() { return this.value; }
    set(v) { this.value = v; this.goal = v; this.velocity = 0; this.done = true; this.pending = null; }
    start(goal, options = {}) {
      if (options.config) this.setConfig(options.config);
      if (options.delay > 0) { this.pending = { goal, at: performance.now() + options.delay }; return; }
      this.pending = null;
      if (this.goal === goal && this.done) return;
      this.goal = goal; this.done = false;
    }
    advance(dt, now) {
      if (this.pending && now >= this.pending.at) { this.goal = this.pending.goal; this.pending = null; this.done = false; }
      if (this.done) return this.value;
      if (REDUCED) { this.value = this.goal; this.velocity = 0; this.done = true; return this.value; }
      let remaining = dt; const step = 1 / 120;
      while (remaining > 0) {
        const h = Math.min(step, remaining); remaining -= h;
        const a = (-this.k * (this.value - this.goal) - this.c * this.velocity) / this.m;
        this.velocity += a * h; this.value += this.velocity * h;
      }
      if (Math.abs(this.velocity) < 0.01 && Math.abs(this.value - this.goal) < 0.0001) {
        this.value = this.goal; this.velocity = 0; this.done = true;
      }
      return this.value;
    }
  }

  const ARROW = 'M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z';
  const ARROW_SVG = '<svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="' + ARROW + '" fill="currentColor"/></svg>';
  R.querySelectorAll("[data-dz-arrow]").forEach((n) => { n.innerHTML = ARROW_SVG; });
  const dzBind = (img) => { img.loading = "eager"; img.decoding = "async"; img.addEventListener("error", () => { if (img.dataset.dzr) return; img.dataset.dzr = "1"; const s = img.getAttribute("src"); if (s) img.src = s + (s.indexOf("?") < 0 ? "?" : "&") + "r=1"; }); };
  R.querySelectorAll("[data-dz-img]").forEach((img) => { dzBind(img); img.src = BASE + img.dataset.dzImg; });
  R.querySelectorAll("#dz-team img").forEach(dzBind);

  const SOFT = { tension: 150, friction: 30 };
  const DISPLAY = { tension: 130, friction: 24 };
  const LABEL = { tension: 220, friction: 28 };
  const PRESETS = {
    eyebrow: { y: 12, blur: 12, stagger: 45, config: LABEL, gap: 0.3 },
    heading: { y: 60, blur: 20, stagger: 55, config: DISPLAY, gap: 0.25 },
    body: { y: 16, blur: 12, stagger: 26, config: SOFT, gap: 0.3 },
  };
  function splitWords(host) {
    const out = [];
    const walk = (node, cls) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach((chunk) => {
            if (!chunk.trim()) return;
            const span = document.createElement("span");
            span.className = "dz-w" + (cls ? " " + cls : "");
            span.textContent = chunk;
            out.push(span);
          });
        } else if (child.nodeType === 1) { walk(child, child.className || cls); }
      });
    };
    walk(host, "");
    return out;
  }
  function mountWords(host) {
    const preset = PRESETS[host.dataset.dzWords];
    if (!preset) return;
    const label = host.textContent;
    const words = splitWords(host);
    host.textContent = "";
    host.classList.add("dz-words");
    if (host.dataset.dzCenter !== undefined) host.classList.add("center");
    host.style.columnGap = preset.gap + "em";
    host.setAttribute("aria-hidden", "true");
    const sr = document.createElement("span");
    sr.className = "dz-sr"; sr.textContent = label;
    host.parentNode.insertBefore(sr, host);
    const items = words.map((w) => { host.appendChild(w); return { node: w, spring: new Spring(preset.config, 0) }; });
    const write = () => {
      items.forEach(({ node, spring }) => {
        const t = spring.get();
        node.style.opacity = t.toFixed(4);
        node.style.transform = "translate3d(0," + (preset.y * (1 - t)).toFixed(2) + "px,0)";
        node.style.filter = t > 0.999 ? "blur(0px)" : "blur(" + (preset.blur * (1 - t)).toFixed(2) + "px)";
      });
    };
    write();
    let running = null;
    const play = (on) => {
      items.forEach(({ spring }, i) => spring.start(on ? 1 : 0, { delay: on ? i * preset.stagger : 0 }));
      if (running) return;
      running = subscribe(() => { write(); if (items.every(({ spring }) => spring.done && !spring.pending)) { running(); running = null; } });
    };
    new IntersectionObserver(([e]) => play(e.isIntersecting)).observe(host);
  }
  R.querySelectorAll("[data-dz-words]").forEach(mountWords);

  (function () {
    const root = R.getElementById("dz-trail");
    if (!root) return;
    const layer = root.querySelector(".dz-cards");
    const SPAWN = 90, LEN = 5, TILT = 12;
    const ENTER = { tension: 130, friction: 28 }, LEAVE = { tension: 300, friction: 24 }, OP = { tension: 900, friction: 40 };
    const IMAGES = ["/uploads/kctKRTHkChHomMFuWJylS-google.png","/uploads/dSs_1xWp3cXcRXU8Z9VIv-meta.png","/uploads/3X9kxBGGAEgTeX6pUjoZa-linkedin.png","/uploads/tgyVqb4E_l04s8F7osVRg-hubspot.png","/uploads/MHkbdT2ijg1GXwEf739Ny-salesforce.png","/uploads/m4uM_h_tVZZUtEFXOh1SR-semrush.png","/uploads/G9DeJdazRu6Q1a-MZBSLu-ahrefs.png","/uploads/DI98hATZY8XQV-Prd1yTe-figma.png","/uploads/cgWn-LImG5Pg9jKMLymxz-adobe.png","/uploads/JVwRBYu5m77FQt1mtWJ3t-canva.png","/uploads/P5EyybpIDHx_d-eUGMwQT-zapier.png","/uploads/vvWjtAt_dX6GvZcrKJ79U-mailchimp.png","/uploads/ldpzYSRj7UxDBddzVWTzD-klaviyo.png","/uploads/nP1KYG_y5m0ShOB_aWrh6-shopify.png","/uploads/I2qFzicacGGXR1mi-gNaZ-wordpress.png"];
    const loaded = new Array(IMAGES.length).fill(false);
    let preloadStarted = false;
    const startPreload = () => {
      if (preloadStarted) return; preloadStarted = true;
      IMAGES.forEach((src, idx) => { const pre = new Image(); pre.decoding = "async"; pre.addEventListener("load", () => { loaded[idx] = true; }); pre.src = src; });
    };
    new IntersectionObserver((es, ob) => { if (es.some((e) => e.isIntersecting)) { startPreload(); ob.disconnect(); } }, { rootMargin: "600px 0px 600px 0px" }).observe(root);
    const cards = []; let nextId = 0, last = null;
    root.addEventListener("pointermove", (ev) => {
      if (ev.pointerType !== "mouse") return;
      const b = root.getBoundingClientRect();
      const x = ev.clientX - b.left, y = ev.clientY - b.top;
      if (last && Math.hypot(x - last.x, y - last.y) < SPAWN) return;
      last = { x, y };
      const id = nextId++;
      const img = document.createElement("img");
      img.alt = ""; img.decoding = "async"; img.src = IMAGES[id % IMAGES.length];
      layer.appendChild(img);
      const card = { node: img, x, y, tilt: (Math.random() - 0.5) * 2 * TILT, scale: new Spring(ENTER, 0.4), opacity: new Spring(OP, 0), leaving: false };
      card.scale.start(1); card.opacity.start(1); cards.push(card);
      while (cards.filter((c) => !c.leaving).length > LEN) {
        const o = cards.find((c) => !c.leaving); if (!o) break;
        o.leaving = true; o.scale.start(0.4, { config: LEAVE }); o.opacity.start(0);
      }
    });
    root.addEventListener("pointerleave", () => {
      last = null;
      cards.forEach((c) => { if (c.leaving) return; c.leaving = true; c.scale.start(0.4, { config: LEAVE }); c.opacity.start(0); });
    });
    subscribe(() => {
      for (let i = cards.length - 1; i >= 0; i -= 1) {
        const c = cards[i];
        c.node.style.transform = "translate3d(" + c.x + "px," + c.y + "px,0) translate(-50%,-50%) rotate(" + c.tilt + "deg) scale(" + c.scale.get() + ")";
        c.node.style.opacity = c.opacity.get().toFixed(3);
        if (c.leaving && c.opacity.done && c.scale.done) { c.node.remove(); liveSprings.delete(c.scale); liveSprings.delete(c.opacity); cards.splice(i, 1); }
      }
    });
  })();

  (function () {
    const wrapper = R.getElementById("dz-svc-runway");
    const track = R.getElementById("dz-svc-rail");
    if (!wrapper || !track) return;
    const OVERLAY = 1, DWELL = 1;
    const x = new Spring({ tension: 220, friction: 42 }, 0);
    subscribe(() => {
      const vh = window.innerHeight;
      const scrubbable = wrapper.offsetHeight - vh * (1 + OVERLAY + DWELL);
      if (scrubbable > 0) {
        const progress = clamp01(-wrapper.getBoundingClientRect().top / scrubbable);
        const travel = Math.max(track.scrollWidth - track.clientWidth, 0);
        x.start(-progress * travel);
      }
      track.style.transform = "translate3d(" + x.get().toFixed(2) + "px,0,0)";
    });
  })();

  (function () {
    const frame2 = R.getElementById("dz-about-banner");
    if (!frame2) return;
    const layer = frame2.querySelector(".dz-layer");
    const OVERSCAN = 0.06;
    layer.style.top = (-OVERSCAN * 100) + "%";
    layer.style.height = ((1 + OVERSCAN * 2) * 100) + "%";
    const shift = new Spring({ tension: 180, friction: 40 }, 0);
    subscribe(() => {
      const rect = frame2.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      if (span > 0) shift.start(clamp01((window.innerHeight - rect.top) / span) - 0.5);
      layer.style.transform = "translate3d(0," + (shift.get() * OVERSCAN * 100).toFixed(3) + "%,0)";
    });
  })();

  (function () {
    const v = R.querySelector("#dz-about-banner video");
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(function(){}); }
      else { v.pause(); }
    }, { threshold: 0.01, rootMargin: "400px 0px 400px 0px" });
    io.observe(v);
  })();

  (function () {
    const imgs = R.querySelectorAll("#dz-team-rail img");
    imgs.forEach((im) => {
      im.loading = "eager";
      im.decoding = "async";
      let tries = 0;
      const retry = () => {
        if (tries >= 3) return;
        tries += 1;
        const base = im.src.split("#")[0].split("?")[0];
        im.src = base + "?r=" + Date.now();
      };
      im.addEventListener("error", retry);
      if (im.complete && im.naturalWidth === 0) retry();
    });
  })();

  (function () {
    const SPLIT = /^(\D*)(\d+)(\D*)$/;
    R.querySelectorAll("[data-count]").forEach((node) => {
      const value = node.dataset.count;
      const m = SPLIT.exec(value);
      if (!m) { node.textContent = value; return; }
      const [, prefix, digits, suffix] = m;
      const target = Number(digits);
      node.setAttribute("aria-label", value);
      const spring = new Spring({ tension: 22, friction: 26 }, 0);
      const write = () => { node.textContent = prefix + Math.round(spring.get()) + suffix; };
      write();
      new IntersectionObserver(([e]) => spring.start(e.isIntersecting ? target : 0), { threshold: 0.2 }).observe(node);
      subscribe(write);
    });
  })();

  (function () {
    const rail = R.getElementById("dz-team-rail");
    const fillNode = R.querySelector("#dz-team-bar .dz-fill");
    if (!rail || !fillNode) return;
    const GLIDE = 0.18, MOMENTUM = 14, SETTLE = 0.5, THRESH = 4, MIN_FILL = 890 / 1360;
    const fill = new Spring({ tension: 260, friction: 38 }, MIN_FILL);
    const clampScroll = (v) => Math.min(Math.max(v, 0), rail.scrollWidth - rail.clientWidth);
    let dragging = false, moved = false, target = null, velocity = 0, startX = 0, startScroll = 0, lastX = 0, pointerId = -1;
    const syncProgress = () => {
      const scrollable = rail.scrollWidth - rail.clientWidth;
      if (scrollable <= 0) return;
      fill.start(MIN_FILL + (1 - MIN_FILL) * (rail.scrollLeft / scrollable));
    };
    rail.addEventListener("scroll", syncProgress);
    rail.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType === "touch") return;
      ev.preventDefault();
      dragging = true; moved = false; pointerId = ev.pointerId;
      startX = lastX = ev.clientX; velocity = 0; startScroll = rail.scrollLeft; target = rail.scrollLeft;
      rail.setPointerCapture(ev.pointerId);
    });
    rail.addEventListener("pointermove", (ev) => {
      if (!dragging || ev.pointerId !== pointerId) return;
      const travelled = ev.clientX - startX;
      if (Math.abs(travelled) > THRESH) moved = true;
      velocity = lastX - ev.clientX; lastX = ev.clientX;
      target = clampScroll(startScroll - travelled);
    });
    const endDrag = (ev) => {
      if (!dragging || ev.pointerId !== pointerId) return;
      dragging = false;
      if (rail.hasPointerCapture(ev.pointerId)) rail.releasePointerCapture(ev.pointerId);
      target = clampScroll((target ?? rail.scrollLeft) + velocity * MOMENTUM); velocity = 0;
    };
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("click", (ev) => { if (!moved) return; ev.preventDefault(); ev.stopPropagation(); moved = false; }, true);
    subscribe(() => {
      if (target !== null) {
        const d = target - rail.scrollLeft;
        if (!dragging && Math.abs(d) < SETTLE) target = null;
        else rail.scrollLeft += d * GLIDE;
      }
      fillNode.style.transform = "scaleX(" + fill.get().toFixed(4) + ")";
    });
    syncProgress();
  })();

  (function () {
    const form = R.getElementById("dz-contact-form");
    const panel = R.getElementById("dz-form-panel");
    if (!form || !panel) return;
    const val = (id) => { const el = R.getElementById(id); return (el && el.value || "").trim(); };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const body = "Hi Disruptive Dodo, I'd like a growth audit. Name: " + val("dz-name") + ". Company: " + val("dz-company") + ". Phone: " + val("dz-phone") + ". Challenge: " + val("dz-problem") + ". Notes: " + val("dz-message");
      try { window.open("https://wa.me/23058065315?text=" + encodeURIComponent(body), "_blank", "noopener"); } catch (e2) {}
      panel.classList.add("done");
    });
  })();

  (function mobileCardReveal(){
    try {
      if (!window.matchMedia("(max-width: 639px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var main = R.querySelector("main"); if (!main) return;
      var groups = [["#dz-svc-rail", ".dz-svc-card"], ["#dz-team-rail", ".dz-team-intro, .dz-team-card, .dz-team-more"]];
      var armed = false;
      groups.forEach(function(g){
        var box = R.querySelector(g[0]); if (!box) return;
        var items = Array.prototype.slice.call(box.querySelectorAll(g[1]));
        if (!items.length) return;
        armed = true;
        items.forEach(function(it){ it.classList.add("dz-rv"); });
        var done = false;
        var fire = function(){
          if (done) return; done = true;
          items.forEach(function(it, i){ setTimeout(function(){ it.classList.add("dz-in"); }, i * 70); });
          setTimeout(function(){ items.forEach(function(it){ it.classList.remove("dz-rv"); it.classList.remove("dz-in"); }); }, items.length * 70 + 900);
        };
        try {
          var io = new IntersectionObserver(function(ents){
            ents.forEach(function(e){
              if (e.isIntersecting && window.pageYOffset > 300){ io.disconnect(); fire(); }
            });
          }, { threshold: 0.12 });
          io.observe(box);
        } catch (e2) { fire(); }
        setTimeout(fire, 8000);
      });
      if (armed) main.classList.add("dz-rv-ready");
    } catch (e) {}
  })();
}

(function boot() {
  function mount() {
    const host = document.getElementById("mv-root");
    if (!host || host._mvDone) return true;
    host._mvDone = true;
    try {
      if (!document.getElementById("mv-fonts")) {
        const l = document.createElement("link");
        l.id = "mv-fonts"; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Anton&family=Onest:wght@400;500;600&display=swap";
        document.head.appendChild(l);
      }
      if (!document.getElementById("mv-global")) {
        const st = document.createElement("style");
        st.id = "mv-global"; st.textContent = GLOBAL_CSS;
        document.head.appendChild(st);
      }
      document.body.style.margin = "0";
      document.body.style.background = "#08080a";
      document.title = "Disruptive Dodo · Marketing and growth agency in Mauritius";
      if (!document.getElementById("mv-meta-desc")) {
        const md = document.createElement("meta");
        md.id = "mv-meta-desc"; md.name = "description";
        md.content = "Marketing and growth agency in Mauritius. Websites, social media, ads, CRM and AI that bring you customers, built and run by one local team.";
        if (!document.querySelector('link[rel="canonical"]')) { const cl = document.createElement("link"); cl.rel = "canonical"; cl.href = location.origin + "/"; document.head.appendChild(cl); }
        document.head.appendChild(md);
      }
      if (!document.getElementById("mv-jsonld")) {
        const ld = document.createElement("script");
        ld.id = "mv-jsonld"; ld.type = "application/ld+json";
        ld.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": "Disruptive Dodo",
          "description": "Mauritian digital marketing agency helping local businesses win more customers with websites, advertising and AI-powered lead follow-up.",
          "url": "https://disruptivedodo.mu",
          "email": "info@disruptivedodo.mu",
          "telephone": "+230 5806 5315",
          "areaServed": "Mauritius",
          "knowsLanguage": ["en", "fr"],
          "address": { "@type": "PostalAddress", "addressCountry": "MU" },
          "serviceType": ["Web design", "SEO", "Content marketing", "Google and paid ads", "Social media marketing", "Branding", "Business automation", "CRM and sales automation", "AI lead follow-up"]
        });
        document.head.appendChild(ld);
      }
      host.removeAttribute("style");
      host.innerHTML = "";
      const shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = SHADOW_CSS;
      shadow.appendChild(style);
      const wrap = document.createElement("div");
      wrap.innerHTML = MARKUP;
      while (wrap.firstChild) shadow.appendChild(wrap.firstChild);
      mvApp(shadow);
      dzInit(shadow);
    } catch (e) { console.error("MV mount failed", e); }
    return true;
  }
  if (document.getElementById("mv-root")) { mount(); return; }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    // marker may be inserted slightly after script runs; retry briefly
    let tries = 0;
    const iv = setInterval(() => {
      if (document.getElementById("mv-root") || tries++ > 40) { clearInterval(iv); mount(); }
    }, 100);
  }
})();
