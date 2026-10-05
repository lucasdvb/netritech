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
.dz-svc-card h3 { font-size: 1.85rem; font-weight: 300; line-height: 1.08; letter-spacing: -0.025em; }
.dz-btn, .hero-btn, .hero-btn-2, #dz-form-submit { font-weight: 400; text-transform: none; letter-spacing: -0.01em; }
#dz-about-row { margin-top: 0; }
/* service cards with a generated photo: keep the accent colour, a soft fade under the title, a gentle zoom */
.dz-svc-card.ph { background: #020202; border-color: rgba(243,241,234,.12); }
.dz-svc-card.ph .dz-bg { inset: 0; background-size: auto 100%; background-position: right bottom; background-repeat: no-repeat; filter: none; }
.dz-svc-card.ph .dz-bg::after { background: linear-gradient(180deg, rgba(2,2,2,.55) 0%, rgba(2,2,2,0) 30%, rgba(2,2,2,0) 80%, rgba(2,2,2,.45) 100%); }
.dz-svc-card.ph:hover .dz-bg { filter: none; transform: scale(1.04); }
@media (min-width: 768px) { .dz-svc-card.ph .dz-bg { left: auto; width: auto; aspect-ratio: 2 / 3; background-size: cover; -webkit-mask-image: linear-gradient(90deg, transparent, #000 26%); mask-image: linear-gradient(90deg, transparent, #000 26%); } }
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
  <section class="hero rj-hero" id="top">
    <canvas class="rj-gl" aria-hidden="true"></canvas>
    <h1 class="rj-word"><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Disruptive Dodo</span><span aria-hidden="true"><span class="l"><i class="rj-ch" style="--d:80ms">d</i><i class="rj-ch" style="--d:310ms">i</i><i class="rj-ch" style="--d:148ms">s</i><i class="rj-ch" style="--d:330ms">r</i><i class="rj-ch" style="--d:216ms">u</i><i class="rj-ch" style="--d:350ms">p</i><i class="rj-ch" style="--d:284ms">t</i><i class="rj-ch" style="--d:370ms">i</i><i class="rj-ch" style="--d:352ms">v</i><i class="rj-ch" style="--d:390ms">e</i></span><span class="b"><i class="rj-ch" style="--d:420ms">d</i><i class="rj-ch" style="--d:410ms">o</i><i class="rj-ch" style="--d:488ms">d</i><i class="rj-ch" style="--d:430ms">o</i><i class="rj-ch" style="--d:556ms">.</i></span></span></h1>
    <div class="rj-foot">
      <p class="rj-cap rj-fade" style="--d:900ms">Websites<br>Advertising</p>
      <p class="rj-cap rj-fade" style="--d:980ms">Automation<br>Growth</p>
      <div class="rj-ctas rj-fade" style="--d:1060ms">
        <a class="hero-btn" href="#dz-contact"><span class="hero-btn-fill" aria-hidden="true"></span><span class="hero-btn-roll"><span class="a">Get more clients</span><span class="b" aria-hidden="true">Get more clients</span></span></a>
        <a class="hero-btn-2" href="#dz-services">See what we do</a>
      </div>
      <p class="rj-cue rj-fade" style="--d:1140ms"><span>Scroll to begin</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.5v8.6M2.4 6.6 6 10.2l3.6-3.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
    </div>
  </section>
  <div class="stack-reveal">
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
  <section id="dz-services" data-dz>
    <div id="dz-svc-runway">
      <div id="dz-svc-panel">
        <div id="dz-svc-head">
          <p class="dz-eyebrow" data-dz-words="eyebrow">What We Build</p>
          <h2 class="dz-display" data-dz-words="heading">Everything you need to grow, under one roof</h2>
          <p class="dz-lead" data-dz-words="body">Six services that get you found, win you the sale, and keep customers coming back. Take one, or let us run the lot.</p>
        </div>
        <div id="dz-svc-rail">
          <article class="dz-svc-card lime ph">
            <a class="dz-card-link" href="/services/web-design" aria-label="Discover Websites and SEO"></a><span class="dz-bg" role="img" aria-label="A hand holding binoculars whose lenses show Google search results and Google Maps for My Business" style="background-image:url('/uploads/4SsE3nR2FS5MUv6PTN_CR-svc-01-get-found.webp')"></span><div class="dz-top"><p class="dz-idx">01</p><div class="dz-tt"><h3>Get Found.<br>Get Chosen.</h3><p class="dz-sub">Websites, SEO, and content that put your business in front of the right people.</p></div></div>
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
    <div id="dz-about-row">
      <div id="dz-about-left">
        <p class="dz-eyebrow" data-dz-words="eyebrow">About Disruptive Dodo</p>
        <dl id="dz-about-stats">
          <div><dd data-count="1 hr"></dd><dt>Every enquiry answered within a business hour</dt></div>
          <div><dd data-count="24/7"></dd><dt>Automated follow-up that never sleeps</dt></div>
          <div><dd data-count="4"></dd><dt>Growth stages, handled by one team</dt></div>
          <div><dd data-count="EN·FR·KR"></dd><dt>We work in English, French and Creole</dt></div>
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

// ===== rejouice hero, film, banner =====
const RJ_GL = { cfg: {"bgColor":"#08080a","colorA":"#070707","colorB":"#2c2b2a","colorC":"#383836","colorD":"#454543","maxDpr":1}, mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#100a20",
  colorA: "#1a0f33",
  colorB: "#6b2bc8",
  colorC: "#8b3fe0",
  colorD: "#e02bc8",
  scale: .2,
  speed: .33,
  flow: .9,
  warp: 2.2,
  warpScale: 1.97,
  roughness: .44,
  lacunarity: 1.61,
  haloRadius: 1.11,
  coreRadius: .54,
  haloPower: 1.33,
  crescent: .76,
  crescentGap: .41,
  scatter: .71,
  tilt: .22,
  spread: .97,
  lightCurve: 1.49,
  amount: .38,
  contrast: .94,
  midpoint: .59,
  glow: .42,
  sink: .12,
  grain: 0,
  grainAnim: 0,
  dither: 1.46,
  vignette: .19,
  cursor: 1,
  pointerRadius: 1.67,
  pointerFollow: 1.12,
  pointerBloom: .3,
  pointerSmear: 1.3,
  parallax: .019,
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
uniform vec2  iMouseVel;
uniform vec3  uBgColor, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uFlow, uWarp, uWarpScale, uRoughness, uLacunarity;
uniform float uHaloRadius, uCoreRadius, uHaloPower, uCrescent, uCrescentGap, uScatter;
uniform float uTilt, uSpread, uLightCurve, uAmount;
uniform float uContrast, uMidpoint, uGlow, uSink;
uniform float uGrain, uDither, uVignette;
uniform float uPointerRadius, uPointerFollow, uPointerBloom, uPointerSmear, uParallax;
#define OCTAVES 4
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
  for (int i = 0; i < OCTAVES; i++) { v += amp * snoise(p); p *= uLacunarity; amp *= uRoughness; }
  return v;
}
vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
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
  vec2 sun = iMouse * uPointerFollow;
  vec2 ds = uv - sun;
  float swing = clamp(length(iMouseVel) * 10.0, 0.0, 1.0);
  ds += iMouseVel * uPointerSmear * 3.0 * exp(-dot(ds, ds) * 1.2);
  vec2 p = (uv - sun * uParallax) * uScale;
  vec2 q = vec2(fbm(p * uWarpScale + vec2(0.0, t * uFlow)),
                fbm(p * uWarpScale + vec2(5.2, 1.3) - t * uFlow * 0.7));
  float weather = fbm(p + uWarp * q + vec2(t * 0.13, -t * 0.09));
  float r = length(ds) * (1.0 + uScatter * weather * 0.55);
  float halo = exp(-pow(max(r, 0.0) / max(0.02, uHaloRadius), uHaloPower));
  float core = exp(-dot(ds, ds) / max(1e-4, uCoreRadius * uCoreRadius));
  vec2 dc = ds + normalize(vec2(0.62, 0.78)) * uCrescentGap;
  float limb = exp(-pow(length(dc) / max(0.02, uHaloRadius * 0.92), uHaloPower));
  float lune = clamp(halo - limb * uCrescent, 0.0, 1.0);
  float bloom = core * (uPointerBloom + swing * 0.18);
  float tilt = uTilt + iMouse.x * 0.20;
  float axis = dot(uv, vec2(-sin(tilt), cos(tilt)));
  float alt = pow(clamp(0.5 + axis * uSpread, 0.0, 1.0), uLightCurve);
  float f = clamp(alt * 0.55 + lune * 0.72 + bloom + weather * uAmount, 0.0, 1.0);
  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(f);
  col += uColorD * uGlow * (core * 0.9 + pow(lune, 3.0) * 0.5);
  col = mix(uBgColor, col, smoothstep(0.0, max(0.01, uSink), f) * 0.92 + 0.08);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
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
 const UNAME = k => "u" + k[0].toUpperCase() + k.slice(1);
 function applyConfig() {
  gl.useProgram(program);
  for (const k in CONFIG) {
   if (k === "maxDpr") continue;
   if (typeof CONFIG[k] === "string") u3c(UNAME(k), CONFIG[k]); else u1f(UNAME(k), CONFIG[k]);
  }
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
  const kLead = .085 * s, kBody = .035 * s;
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
  u2f("iMouseVel", mouse.ax - mouse.x, mouse.ay - mouse.y);
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
} };
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
    const STAR = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 0c.6 7.4 4.6 11.4 12 12-7.4.6-11.4 4.6-12 12-.6-7.4-4.6-11.4-12-12 7.4-.6 11.4-4.6 12-12Z\" fill=\"currentColor\"/></svg>";
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
    qa(".rj-hero").forEach((h) => h.classList.add("rj-in"));
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
    const rjh = R.querySelector(".rj-hero");
    if (rjh) setTimeout(() => rjh.classList.add("rj-in"), 2350);
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
      rjInit(shadow);
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

// ===== shared nav and footer: identical to src/scripts/dd-core.js (generated, do not edit here) =====
{
// Disruptive Dodo · shared shell for the inner pages (Work, Services, Fledge, About,
// Contact, Privacy, case study, service pages). Mounted in a Shadow DOM on #dd-root,
// like the homepage (marcus-vane.js). Each page's content lives in its own
// src/scripts/dd-page-<key>.js, scoped to that page only. This file holds the design
// system (tokens, sheets, cards, type), nav, services mega-panel, mobile menu, footer,
// the reveal engine, the hero gradient runner and the SEO tags. Black and white only.

const FONT_CSS = `@font-face{font-family:"Switzer";font-style:normal;font-weight:300;font-display:swap;src:url("/uploads/b3T5Mu16B0S-WBpd0RySE-Switzer-Light.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:400;font-display:swap;src:url("/uploads/omJGqkQH2HmXNSQfbAzJu-Switzer-Regular.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:500;font-display:swap;src:url("/uploads/XMolNpeQj8mWtCYl6S3hH-Switzer-Medium.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:600;font-display:swap;src:url("/uploads/FChqSYdv-vGwYA1WBuYg7-Switzer-Semibold.otf") format("opentype")}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;background:#08080a}
body{margin:0;background:#08080a}
#dd-root{display:block;min-height:100vh;background:#08080a}`;

const CSS = `:host{--ac:#d7d5cd}
*,*::before,*::after{box-sizing:border-box}
img,canvas,svg{display:block;max-width:100%}
img{height:auto}
[hidden]{display:none!important}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
ul,ol{list-style:none;margin:0;padding:0}
h1,h2,h3,h4,p,dl,dd,dt,figure,blockquote{margin:0}
table{border-collapse:collapse}
.ar{width:11px;height:11px;flex:none}
.ck{width:16px;height:16px;flex:none}
.chev{width:10px;height:10px;flex:none}
.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.r{--bg:#08080a;--fg:#f3f1ea;--mu:#8c8b84;--su:#5f5e59;--sf:#111114;--sf2:#18181c;--card:#121215;--card2:#1a1a1e;--ln:rgba(243,241,234,.1);--ls:rgba(243,241,234,.2);--inv:#f3f1ea;--inv-fg:#08080a;--sh1:0 1px 0 rgba(255,255,255,.04) inset,0 18px 40px -22px rgba(0,0,0,.75),0 4px 12px -6px rgba(0,0,0,.5);--sh2:0 1px 0 rgba(255,255,255,.06) inset,0 40px 80px -30px rgba(0,0,0,.85),0 10px 24px -10px rgba(0,0,0,.6);--f:"Switzer",ui-sans-serif,system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;--w-dsp:300;--gt:clamp(18px,2.8vw,40px);--gap:clamp(16px,1.7vw,24px);--pad:clamp(112px,13vw,216px);--r1:12px;--r2:20px;--r3:28px;--rx:clamp(28px,3.2vw,48px);--e:cubic-bezier(.16,1,.3,1);--e2:cubic-bezier(.85,0,.15,1);--e3:cubic-bezier(.39,.575,.565,1);font-family:var(--f);font-size:17px;line-height:1.5;font-weight:400;letter-spacing:-.01em;color:var(--fg);background:var(--bg);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-feature-settings:"ss01" 0;overflow-x:clip;min-height:100vh}
.lt{--bg:#f3f1ea;--fg:#0c0c0e;--mu:#62615b;--su:#8a8983;--sf:#ebe9e2;--sf2:#e4e2da;--card:#ffffff;--card2:#faf9f6;--ln:rgba(12,12,14,.1);--ls:rgba(12,12,14,.2);--inv:#0c0c0e;--inv-fg:#f3f1ea;--sh1:0 1px 2px rgba(20,18,12,.05),0 14px 34px -18px rgba(20,18,12,.22);--sh2:0 2px 4px rgba(20,18,12,.05),0 36px 70px -28px rgba(20,18,12,.32);color:var(--fg);background:var(--bg)}
.wt{--bg:#ffffff;--card:#f6f5f1;--card2:#efede7}
.dk{--bg:#08080a;--fg:#f3f1ea;--mu:#8c8b84;--su:#5f5e59;--sf:#111114;--sf2:#18181c;--card:#121215;--card2:#1a1a1e;--ln:rgba(243,241,234,.1);--ls:rgba(243,241,234,.2);--inv:#f3f1ea;--inv-fg:#08080a;--sh1:0 1px 0 rgba(255,255,255,.04) inset,0 18px 40px -22px rgba(0,0,0,.75),0 4px 12px -6px rgba(0,0,0,.5);--sh2:0 1px 0 rgba(255,255,255,.06) inset,0 40px 80px -30px rgba(0,0,0,.85),0 10px 24px -10px rgba(0,0,0,.6);color:var(--fg);background:var(--bg)}
.sf{--bg:#0f0f12;--card:#17171b;--card2:#1e1e23;background:var(--bg)}
::selection{background:var(--ac);color:#08080a}
.mega,.d1,.d2,.h2,.h3{font-weight:var(--w-dsp);text-wrap:balance}
.mega{font-size:clamp(76px,15.2vw,248px);line-height:.86;letter-spacing:-.05em}
.d1{font-size:clamp(44px,6.6vw,108px);line-height:1;letter-spacing:-.03em}
.d2{font-size:clamp(38px,4.8vw,78px);line-height:1.04;letter-spacing:-.026em}
.h2{font-size:clamp(32px,3.6vw,58px);line-height:1.08;letter-spacing:-.022em}
.h3{font-size:clamp(23px,2.1vw,33px);line-height:1.15;letter-spacing:-.016em}
.h4{font-size:clamp(19px,1.45vw,22px);line-height:1.28;letter-spacing:-.012em;font-weight:400}
.lead{font-size:clamp(19px,1.5vw,22px);line-height:1.32;letter-spacing:-.012em;font-weight:300;color:var(--mu);text-wrap:pretty}
.lead.fg,.fg{color:var(--fg)}
.tx{font-size:clamp(16px,1.2vw,18px);line-height:1.45;font-weight:300;color:var(--mu);text-wrap:pretty}
.sm{font-size:14px;line-height:1.5;color:var(--mu)}
.cap{font-size:14px;line-height:1.3;color:var(--mu);letter-spacing:-.005em}
.mu{color:var(--mu)}
.kick{display:inline-flex;align-items:center;gap:10px;font-size:14px;line-height:1;color:var(--mu);letter-spacing:-.005em}
.kick::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.9}
.kick.nodot::before{display:none}
.num{font-variant-numeric:tabular-nums}
.todo{background:rgba(215,213,205,.14);box-shadow:inset 0 -1px 0 rgba(215,213,205,.45);border-radius:4px;padding:0 .18em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.lt .todo{background:rgba(12,12,14,.06);box-shadow:inset 0 -1px 0 rgba(12,12,14,.3)}
.mt-8{margin-top:8px}
.mt-12{margin-top:12px}
.mt-16{margin-top:16px}
.mt-24{margin-top:24px}
.mt-32{margin-top:32px}
.mt-40{margin-top:40px}
.mt-48{margin-top:clamp(32px,3.4vw,48px)}
.mt-64{margin-top:clamp(40px,4.5vw,64px)}
.mt-96{margin-top:clamp(56px,6.7vw,96px)}
.mt-128{margin-top:clamp(72px,9vw,128px)}
.wrap{padding-inline:var(--gt)}
.sec{padding:var(--pad) var(--gt);position:relative}
.g12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap)}
.g12>*{grid-column:1/-1}
@media (min-width:1024px){.c1-4{grid-column:1/span 4}
.c1-5{grid-column:1/span 5}
.c1-6{grid-column:1/span 6}
.c1-7{grid-column:1/span 7}
.c1-8{grid-column:1/span 8}
.c5-12{grid-column:5/-1}
.c6-12{grid-column:6/-1}
.c7-12{grid-column:7/-1}
.c8-12{grid-column:8/-1}
.c9-12{grid-column:9/-1}
.c4-12{grid-column:4/-1}
.c4-10{grid-column:4/span 7}
}
.stick{position:sticky;top:120px}
@media (max-width:1023px){.stick{position:static}
.g12>*+*{margin-top:clamp(32px,6vw,48px)}
}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:32px 64px;flex-wrap:wrap}
.head>:last-child:not(:first-child){max-width:44ch}
.rule{border-top:1px solid var(--ln)}
.sheet{position:relative;border-radius:var(--rx) var(--rx) 0 0;margin-top:calc(var(--rx) * -1);z-index:1;box-shadow:0 -1px 0 rgba(255,255,255,.05),0 -30px 60px -24px rgba(0,0,0,.55);transform-origin:50% 100%;will-change:auto}
.sheet.lt{box-shadow:0 -1px 0 rgba(255,255,255,.4),0 -30px 60px -24px rgba(0,0,0,.45)}
.sheet::after{content:"";position:absolute;inset:0;border-radius:inherit;background:#000;opacity:calc(var(--k,0) * .38);pointer-events:none;z-index:5}
.sheet.is-k{transform:scale(calc(1 - var(--k,0) * .03))}
.sheet+.sheet,.hero+.sheet,.sheet+.ft{margin-top:calc(var(--rx) * -1)}
.sheet>.sec:first-child,.sheet.sec{padding-top:calc(var(--pad) + 8px)}
main>.sheet:last-child{padding-bottom:calc(var(--pad) + var(--rx))}
.btn-row{display:flex;flex-wrap:wrap;gap:12px}
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:54px;padding:0 26px;border-radius:999px;font-size:15px;font-weight:400;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;isolation:isolate;border:1px solid var(--ls);color:var(--fg);transition:border-color .4s var(--e),transform .5s var(--e),box-shadow .5s var(--e)}
.btn::before{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--fg);transform:translateY(101%);transition:transform .55s var(--e);z-index:-1}
.btn:hover{border-color:var(--fg);color:var(--bg)}
.btn:hover::before{transform:none}
.btn .ar{width:11px;height:11px;transition:transform .55s var(--e)}
.btn:hover .ar{transform:translate(2px,-2px)}
.btn-p{background:var(--inv);color:var(--inv-fg);border-color:var(--inv);box-shadow:0 10px 30px -14px rgba(0,0,0,.6)}
.btn-p::before{background:var(--inv-fg);opacity:.16}
.btn-p:hover{color:var(--inv-fg);border-color:var(--inv);transform:translateY(-1px)}
.lnk{position:relative;display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:400;padding-bottom:4px}
.lnk::before,.lnk::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor}
.lnk::before{opacity:.25}
.lnk::after{transform:scaleX(0);transform-origin:100% 50%;transition:transform .7s var(--e2)}
.lnk:hover::after{transform:scaleX(1);transform-origin:0 50%}
.lnk .ar{width:10px;height:10px;transition:transform .5s var(--e)}
.lnk:hover .ar{transform:translate(2px,-2px)}
.ring{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:50%;border:1px solid var(--ls);transition:background .5s var(--e),color .5s var(--e),border-color .5s var(--e),transform .6s var(--e);flex:none}
.ring .ar{width:13px;height:13px;transition:transform .6s var(--e)}
.lift:hover .ring{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.lift:hover .ring .ar{transform:rotate(45deg)}
.chip{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--ls);font-size:13px;color:var(--fg);white-space:nowrap;transition:background .35s var(--e),color .35s var(--e),border-color .35s var(--e)}
button.chip:hover{border-color:var(--fg)}
.chip[aria-pressed="true"],.chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tag{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:var(--card2);border:1px solid var(--ln);font-size:12.5px;color:var(--mu)}
.tag.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.card{position:relative;background:var(--card);border:1px solid var(--ln);border-radius:var(--r2);box-shadow:var(--sh1);overflow:hidden;isolation:isolate}
.lift{transition:transform .8s var(--sg,var(--e)),box-shadow .7s var(--e),border-color .7s var(--e)}
.lift:hover{transform:translateY(-6px);box-shadow:var(--sh2);border-color:var(--ls)}
.media{position:relative;overflow:hidden;border-radius:inherit;background:var(--sf2)}
.media img{width:100%;height:100%;object-fit:cover;transition:transform 1.4s var(--e),filter 1.4s var(--e)}
.lift:hover .media img{transform:scale(1.045)}
.ph{position:relative;display:grid;place-items:center;border-radius:var(--r3);overflow:hidden;background:radial-gradient(120% 90% at 30% 20%,#2a2a2f 0%,#151518 45%,#0c0c0e 100%);border:1px solid var(--ln);box-shadow:var(--sh1)}
.lt .ph{background:radial-gradient(120% 90% at 30% 20%,#ffffff 0%,#ecebe6 55%,#e2e0d8 100%)}
.ph::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.025) 0 1px,transparent 1px 22px);pointer-events:none}
.ph .lb{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:14px 18px;max-width:80%;border-radius:14px;background:rgba(8,8,10,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.08);color:#f3f1ea}
.lt .ph .lb{background:rgba(255,255,255,.7);border-color:rgba(12,12,14,.08);color:#0c0c0e}
.ph .lb b{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.ph .lb span{font-size:13px;line-height:1.35;opacity:.75}
.ph .lb i{font-style:normal;font-size:11px;opacity:.5}
.r21x9{aspect-ratio:21/9}
.r16x9{aspect-ratio:16/9}
.r16x10{aspect-ratio:16/10}
.r16x11{aspect-ratio:16/11}
.r4x5{aspect-ratio:4/5}
.r3x4{aspect-ratio:3/4}
@media (max-width:639px){.r21x9{aspect-ratio:4/3}
}
.hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:140px var(--gt) calc(var(--rx) + clamp(40px,5vw,72px));overflow:hidden;isolation:isolate;background:#08080a;color:#f3f1ea}
.hero.short{min-height:min(88svh,980px)}
.hero.auto{min-height:0;padding-top:clamp(150px,16vw,230px)}
.hero-bg{position:absolute;inset:0;z-index:-1;background:#08080a center/cover no-repeat}
.hero-bg canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.6s var(--e3)}
.hero-bg.on canvas{opacity:1}
.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,10,.55) 0%,rgba(8,8,10,0) 26%,rgba(8,8,10,0) 50%,rgba(8,8,10,.72) 100%)}
.hero-bg.shade::after{background:linear-gradient(180deg,rgba(8,8,10,.6) 0%,rgba(8,8,10,.12) 30%,rgba(8,8,10,.42) 58%,rgba(8,8,10,.93) 100%),linear-gradient(90deg,rgba(8,8,10,.25),rgba(8,8,10,0) 40%,rgba(8,8,10,0) 60%,rgba(8,8,10,.3))}
.crumbs ol{display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:rgba(243,241,234,.6)}
.crumbs li+li::before{content:"/";margin-right:8px;opacity:.5}
.crumbs a:hover{color:#f3f1ea}
.crumbs [aria-current]{color:#f3f1ea}
.hero .lead{color:rgba(243,241,234,.72)}
.hero-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap);align-items:end}
.hero-grid>*{grid-column:1/-1}
@media (min-width:1024px){.hero-grid .hl{grid-column:1/span 8}
.hero-grid .hr{grid-column:9/-1}
}
@media (max-width:1023px){.hero-grid .hr{margin-top:32px}
}
.scrollcue{position:absolute;right:var(--gt);top:50%;writing-mode:vertical-rl;font-size:12px;letter-spacing:.06em;color:rgba(243,241,234,.5);display:flex;align-items:center;gap:12px}
.scrollcue::after{content:"";width:1px;height:56px;background:linear-gradient(rgba(243,241,234,.6),transparent);animation:cue 2.4s var(--e) infinite}
@keyframes cue{0%{transform:scaleY(0);transform-origin:top}
50%{transform:scaleY(1);transform-origin:top}
51%{transform-origin:bottom}
100%{transform:scaleY(0);transform-origin:bottom}
}
@media (max-width:767px){.scrollcue{display:none}
}
.nav{position:fixed;inset:0 0 auto;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px var(--gt);pointer-events:none;transition:transform .7s var(--e)}
.nav>*{pointer-events:auto}
.nav.hide{transform:translateY(-120%)}
.nav-logo{display:flex;align-items:center;height:48px;padding:0 4px;color:#f3f1ea}
.nav-logo img{width:156px;height:auto;transition:opacity .4s}
.glass{background:rgba(18,18,21,.58);backdrop-filter:blur(22px) saturate(150%);-webkit-backdrop-filter:blur(22px) saturate(150%);border:1px solid rgba(255,255,255,.09);box-shadow:0 10px 30px -12px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.06) inset}
.nav-pill{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px;height:48px;padding:0 6px;border-radius:999px;color:#f3f1ea}
.nav-pill a,.nav-pill button{position:relative;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:500;color:rgba(243,241,234,.78);transition:color .3s,background .3s}
.nav-pill a:hover,.nav-pill button:hover,.nav-pill [aria-expanded="true"]{color:#f3f1ea;background:rgba(255,255,255,.07)}
.nav-pill [aria-current="page"],.nav-pill .is-sec{color:#f3f1ea;background:rgba(255,255,255,.1)}
.nav-pill .chev{width:10px;height:10px;transition:transform .4s var(--e)}
.nav-pill [aria-expanded="true"] .chev{transform:rotate(180deg)}
.nav-pill .sig{width:6px;height:6px;border-radius:50%;background:var(--ac);box-shadow:0 0 0 3px rgba(215,213,205,.16)}
.nav-cta{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 22px;border-radius:999px;background:#f3f1ea;color:#08080a;font-size:14px;font-weight:500;box-shadow:0 10px 30px -12px rgba(0,0,0,.6);transition:transform .5s var(--e),background .3s}
.nav-cta:hover{background:#fff;transform:translateY(-1px)}
.nav-cta .ar{width:10px;height:10px;transition:transform .5s var(--e)}
.nav-cta:hover .ar{transform:translate(2px,-2px)}
.burger{display:none;width:48px;height:48px;border-radius:50%;place-items:center;color:#f3f1ea}
.burger span{position:absolute;width:18px;height:1.5px;background:currentColor;border-radius:2px;transition:transform .5s var(--e)}
.burger span:first-child{transform:translateY(-3.5px)}
.burger span:last-child{transform:translateY(3.5px)}
.mm-open .burger span:first-child{transform:rotate(45deg)}
.mm-open .burger span:last-child{transform:rotate(-45deg)}
@media (max-width:1023px){.nav-pill,.nav-cta{display:none}
.burger{display:grid;position:relative}
.nav-logo img{width:140px}
}
.mp{position:fixed;left:50%;top:76px;width:min(1080px,calc(100% - 2 * var(--gt)));transform:translate(-50%,-8px) scale(.985);opacity:0;visibility:hidden;z-index:99;border-radius:var(--r3);padding:10px;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:10px;color:#f3f1ea;background:rgba(14,14,17,.86);backdrop-filter:blur(28px) saturate(150%);-webkit-backdrop-filter:blur(28px) saturate(150%);border:1px solid rgba(255,255,255,.09);box-shadow:0 40px 80px -30px rgba(0,0,0,.85),0 1px 0 rgba(255,255,255,.06) inset;transition:opacity .35s var(--e),transform .5s var(--e),visibility 0s .5s}
.mp.open{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1);transition:opacity .35s var(--e),transform .5s var(--e),visibility 0s}
.mp-feat{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:330px;padding:28px;border-radius:20px;overflow:hidden;background:#0a0a0c;isolation:isolate}
.mp-feat img{position:absolute;right:-6%;bottom:-8%;width:62%;z-index:-1;opacity:.9;transition:transform 1.2s var(--e)}
.mp-feat:hover img{transform:translateY(-6px) scale(1.03)}
.mp-feat::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(90% 80% at 80% 90%,rgba(215,213,205,.16),transparent 60%)}
.mp-feat b{display:block;font-weight:var(--w-dsp);font-size:56px;line-height:.9;letter-spacing:-.05em;margin:12px 0 10px}
.mp-feat .sub{max-width:24ch;font-size:14px;color:rgba(243,241,234,.65)}
.mp-list{display:grid;grid-template-columns:1fr 1fr;gap:4px;align-content:start}
.mp-list a{display:flex;align-items:center;gap:14px;padding:10px;border-radius:16px;transition:background .3s}
.mp-list a:hover,.mp-list a[aria-current="page"]{background:rgba(255,255,255,.06)}
.mp-list img{width:64px;height:46px;border-radius:10px;object-fit:cover;flex:none;transition:transform .8s var(--e)}
.mp-list a:hover img{transform:scale(1.06)}
.mp-list b{display:block;font-size:15px;font-weight:500}
.mp-list span{display:block;font-size:12.5px;line-height:1.35;color:rgba(243,241,234,.55);margin-top:2px}
.mp-all{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding:14px 12px 6px;border-top:1px solid rgba(255,255,255,.08);font-size:14px}
.mm{position:fixed;inset:0;z-index:98;background:#08080a;color:#f3f1ea;display:flex;flex-direction:column;padding:96px var(--gt) 28px;overflow-y:auto;clip-path:inset(0 0 100% 0 round 0 0 32px 32px);visibility:hidden;transition:clip-path .8s var(--e),visibility 0s .8s}
.mm-open .mm{clip-path:inset(0 0 0 0 round 0);visibility:visible;transition:clip-path .8s var(--e),visibility 0s}
.mm-links{display:flex;flex-direction:column}
.mm-links>li{border-bottom:1px solid rgba(243,241,234,.1)}
.mm-links>li>a,.mm-links>li>button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:14px 0;font-size:clamp(36px,10vw,56px);font-weight:var(--w-dsp);letter-spacing:-.045em;line-height:1.05;text-align:left}
.mm-links .chev{width:18px;height:18px;transition:transform .5s var(--e)}
.mm-links [aria-expanded="true"] .chev{transform:rotate(180deg)}
.mm-sub{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s var(--e)}
.mm-sub.open{grid-template-rows:1fr}
.mm-sub>ul{overflow:hidden}
.mm-sub a{display:block;padding:9px 0;font-size:19px;color:rgba(243,241,234,.75)}
.mm-sub li:last-child a{padding-bottom:20px}
.mm-links>li{opacity:0;transform:translateY(24px);transition:opacity .6s var(--e),transform .9s var(--e)}
.mm-open .mm-links>li{opacity:1;transform:none;transition-delay:calc(.15s + var(--i) * 60ms)}
.mm-foot{margin-top:auto;padding-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:14px;color:rgba(243,241,234,.6)}
.mm-foot a{color:#f3f1ea}
.mm-foot .btn{grid-column:1/-1;width:100%;background:#f3f1ea;color:#08080a;border-color:#f3f1ea}
.ft{position:relative;z-index:2;background:#060607;color:#f3f1ea;border-radius:var(--rx) var(--rx) 0 0;overflow:hidden;padding:clamp(80px,9vw,140px) var(--gt) 0;box-shadow:0 -1px 0 rgba(255,255,255,.08),0 -40px 80px -30px rgba(0,0,0,.6);--mu:#8c8b84;--ln:rgba(243,241,234,.12);--ls:rgba(243,241,234,.22);--fg:#f3f1ea;--bg:#060607;--inv:#f3f1ea;--inv-fg:#08080a}
.ft-top{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px var(--gap);align-items:end}
.ft-top>*{grid-column:1/-1}
@media (min-width:1024px){.ft-top .a{grid-column:1/span 7}
.ft-top .b{grid-column:8/-1}
}
.ft-mail{display:inline-flex;align-items:center;gap:14px;font-size:clamp(24px,2.7vw,44px);white-space:nowrap;font-weight:var(--w-dsp);letter-spacing:-.04em;line-height:1.1;padding-bottom:8px;position:relative;}
@media (max-width:479px){.ft-mail{white-space:normal;overflow-wrap:anywhere;font-size:24px}
}
.ft-mail::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(.18);transform-origin:0 50%;transition:transform .9s var(--e2)}
.ft-mail:hover::after{transform:scaleX(1)}
.ft-mail .ar{width:.5em;height:.5em;flex:none;transition:transform .6s var(--e)}
.ft-mail:hover .ar{transform:translate(4px,-4px)}
.ft-cols{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px var(--gap);margin-top:clamp(64px,8vw,120px);padding-top:32px;border-top:1px solid var(--ln)}
.ft-col{grid-column:span 6;display:flex;flex-direction:column;gap:8px;font-size:15px}
.ft-col .cap{margin-bottom:8px}
.ft-col a{color:rgba(243,241,234,.82);width:fit-content;transition:color .3s}
.ft-col a:hover{color:#fff}
@media (min-width:768px){.ft-col{grid-column:span 3}
}
@media (min-width:1024px){.ft-col{grid-column:span 2}
.ft-col.w{grid-column:span 4}
}
.ft-sig img{width:180px}
.ft-sig p{margin-top:16px}
.ft-time{font-variant-numeric:tabular-nums;color:var(--fg)}
.ft-word{display:block;width:100%;margin:clamp(56px,7vw,110px) 0 0;font-size:15vw;line-height:.74;letter-spacing:-.065em;white-space:nowrap;color:#f3f1ea;transform:translateY(.14em);user-select:none}
.ft-word b{font-weight:600}
.ft-word span{font-weight:var(--w-dsp)}
.ft-word i{font-style:normal;display:inline-block}
.rv .w{display:inline-block;opacity:0;transform:translate3d(0,.38em,0);filter:blur(9px);transition:opacity .75s var(--e3),transform 1.15s var(--e),filter 1.1s var(--e);transition-delay:calc(var(--d,0ms) + var(--i,0) * 95ms)}
.rv.in .w{opacity:1;transform:none;filter:none}
.rv .wf{opacity:0;transition:opacity 1s var(--e3);transition-delay:calc(var(--d,0ms) + var(--i,0) * 95ms)}
.rv.in .wf{opacity:1}
[data-r="u"]{opacity:0;transform:translate3d(0,28px,0);filter:blur(6px);transition:opacity .8s var(--e3),transform 1.2s var(--e),filter 1s var(--e);transition-delay:var(--d,0ms)}
[data-r="u"].in{opacity:1;transform:none;filter:none}
[data-r="s"]>*{opacity:0;transform:translate3d(0,32px,0);transition:opacity .8s var(--e3),transform 1.2s var(--e);transition-delay:calc(var(--d,0ms) + var(--i,0) * 80ms)}
[data-r="s"].in>*{opacity:1;transform:none}
[data-r="x"]{clip-path:inset(12% 6% 12% 6% round var(--r3));transition:clip-path 1.4s var(--e)}
[data-r="x"].in{clip-path:inset(0 0 0 0 round var(--r3))}
@media (prefers-reduced-motion:reduce){.rv .w,.rv .wf,[data-r="u"],[data-r="s"]>*{transform:none!important;filter:none!important;transition:opacity .4s linear!important;transition-delay:0s!important}
[data-r="x"]{clip-path:none!important}
.sheet.is-k{transform:none}
.sheet::after{opacity:0}
.lift:hover{transform:none}
.scrollcue::after{animation:none}
}
.split-h .h2{max-width:14ch}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.facts>div{display:flex;flex-direction:column;justify-content:space-between;gap:48px;min-height:220px;padding:26px;border-radius:var(--r2);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.facts dd{font-size:clamp(17px,1.3vw,20px);line-height:1.35;color:var(--fg);letter-spacing:-.01em}
.facts>div:first-child{background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:rgba(127,127,127,.95);border-color:transparent}
@media (max-width:1023px){.facts{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(260px,78%);overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--gt) * -1);padding:4px var(--gt) 24px;scrollbar-width:none}
.facts::-webkit-scrollbar{display:none}
.facts>div{scroll-snap-align:start;min-height:200px}
}
.rows>li{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap);padding:clamp(24px,2.6vw,36px) 0;border-top:1px solid var(--ln);position:relative}
.rows>li:last-child{border-bottom:1px solid var(--ln)}
.rows .n{grid-column:1/span 2;font-size:14px;color:var(--mu);padding-top:.5em}
.rows .t{grid-column:3/span 5}
.rows .b{grid-column:8/-1;max-width:52ch}
@media (max-width:767px){.rows .n{grid-column:1/-1;padding:0 0 10px}
.rows .t,.rows .b{grid-column:1/-1}
.rows .b{margin-top:12px}
}
.rows.hov>li::before{content:"";position:absolute;inset:0 calc(var(--gt) * -.5);border-radius:var(--r1);background:var(--card2);opacity:0;transition:opacity .4s var(--e);z-index:-1}
.rows.hov>li:hover::before{opacity:1}
.rows.hov{isolation:isolate}
.steps>li{display:grid;grid-template-columns:clamp(56px,7vw,110px) minmax(0,1fr);gap:var(--gap);padding:clamp(26px,3vw,40px) 0;border-top:1px solid var(--ln)}
.steps>li:last-child{border-bottom:1px solid var(--ln)}
.steps .i{font-size:clamp(40px,4.2vw,68px);font-weight:var(--w-dsp);letter-spacing:-.05em;line-height:.9;color:var(--su)}
.steps h3{font-size:clamp(21px,1.7vw,26px);font-weight:400;letter-spacing:-.02em;line-height:1.2}
.steps p{margin-top:10px;max-width:50ch;color:var(--mu)}
.faq{border-top:1px solid var(--ln)}
.faq details{border-bottom:1px solid var(--ln)}
.faq summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:26px 0;cursor:pointer}
.faq summary::-webkit-details-marker{display:none}
.faq summary h3{font-size:clamp(19px,1.5vw,23px);font-weight:400;letter-spacing:-.016em;line-height:1.3}
.faq .pm{position:relative;flex:none;width:40px;height:40px;border-radius:50%;border:1px solid var(--ls);transition:background .4s var(--e),border-color .4s,transform .6s var(--e)}
.faq .pm::before,.faq .pm::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:1.5px;margin:-.75px 0 0 -6px;background:currentColor;transition:transform .5s var(--e)}
.faq .pm::after{transform:rotate(90deg)}
.faq details[open] .pm{transform:rotate(180deg);background:var(--fg);color:var(--bg);border-color:var(--fg)}
.faq details[open] .pm::after{transform:rotate(0)}
.faq summary:hover .pm{border-color:var(--fg)}
.faq .ans{padding:0 64px 28px 0;max-width:62ch;overflow:hidden}
.qlist>li{padding:clamp(22px,2.4vw,34px) 0;border-top:1px solid var(--ln);display:grid;grid-template-columns:48px minmax(0,1fr);gap:16px;align-items:baseline}
.qlist>li:last-child{border-bottom:1px solid var(--ln)}
.qlist .n{font-size:14px;color:var(--mu)}
.qlist p{font-size:clamp(23px,2.3vw,38px);font-weight:var(--w-dsp);letter-spacing:-.03em;line-height:1.14;color:var(--fg);text-wrap:balance}
.svcs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap)}
@media (max-width:1023px){.svcs{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(270px,80%);overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--gt) * -1);padding:4px var(--gt) 28px;scrollbar-width:none}
.svcs::-webkit-scrollbar{display:none}
.svcs>*{scroll-snap-align:start}
}
.svc{display:flex;flex-direction:column;justify-content:space-between;min-height:clamp(300px,26vw,400px);padding:26px;color:#f3f1ea;background:#0b0b0d;border-color:rgba(255,255,255,.08)}
.svc .cov{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;opacity:.85;transition:transform 1.6s var(--e),opacity .8s}
.svc:hover .cov{transform:scale(1.06);opacity:1}
.svc::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,0) 40%,rgba(0,0,0,.5))}
.svc h3{font-size:clamp(24px,2vw,30px);font-weight:400;letter-spacing:-.025em;line-height:1.1}
.svc .sub{margin-top:10px;font-size:14.5px;line-height:1.45;color:rgba(243,241,234,.72);max-width:30ch}
.svc .ft-row{display:flex;justify-content:space-between;align-items:flex-end}
.svc .ring{border-color:rgba(243,241,234,.35)}
.svc:hover .ring{background:#f3f1ea;color:#08080a;border-color:#f3f1ea}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.stat .fig{font-size:clamp(52px,6vw,96px);font-weight:var(--w-dsp);letter-spacing:-.055em;line-height:.9;color:var(--fg)}
.stat .lab{margin-top:18px;font-size:15px;line-height:1.4;color:var(--mu);max-width:24ch}
@media (max-width:1023px){.stats{grid-template-columns:1fr 1fr;row-gap:48px}
}
.inset{border-radius:var(--rx);background:var(--inv);color:var(--inv-fg);padding:clamp(40px,6vw,96px) clamp(24px,5vw,80px);box-shadow:var(--sh2)}
.inset{--fg:var(--inv-fg);--mu:#62615b;--ln:rgba(12,12,14,.12);--ls:rgba(12,12,14,.22);--card:#fff;--card2:#ebe9e2}
.lt .inset{--mu:#8c8b84;--ln:rgba(243,241,234,.12);--ls:rgba(243,241,234,.24);--card:#121215;--card2:#1a1a1e}
.cta{text-align:center;padding-block:clamp(120px,14vw,220px)}
.cta .d1{max-width:16ch;margin-inline:auto}
.cta .btn-row{justify-content:center}
.stack{display:grid;gap:clamp(16px,2vw,28px)}
.stack>.st{position:sticky;top:calc(96px + var(--i,0) * 18px)}
@media (max-width:767px){.stack>.st{position:relative;top:auto}
}
.ghost{position:relative;overflow:hidden;isolation:isolate}
.ghost .gl{position:absolute;right:-.06em;top:50%;transform:translateY(-50%);font-size:clamp(360px,52vw,880px);line-height:.8;font-weight:600;letter-spacing:-.08em;color:transparent;-webkit-text-stroke:1px var(--ls);z-index:-1;user-select:none;pointer-events:none}
.card,.stat,.facts>div{background-image:radial-gradient(520px circle at var(--mx,-600px) var(--my,-600px),var(--spot,rgba(255,255,255,.07)),transparent 42%)}
.lt .card,.lt .stat,.lt .facts>div,.inset .card{--spot:rgba(12,12,14,.045)}
.btn-p,.nav-cta,.submit{transition:translate .7s var(--sg,var(--e)),transform .5s var(--e),background .3s,box-shadow .5s var(--e)}
.steps>li[data-r="u"],.rows>li[data-r="u"],.qlist>li[data-r="u"],.ledger>li[data-r="u"]{border-top-color:transparent;background-image:linear-gradient(var(--ln),var(--ln));background-repeat:no-repeat;background-position:0 0;background-size:0% 1px;transition:opacity .8s var(--e3),transform 1.2s var(--e),filter 1s var(--e),background-size 1.4s var(--e)}
.steps>li[data-r="u"].in,.rows>li[data-r="u"].in,.qlist>li[data-r="u"].in,.ledger>li[data-r="u"].in{background-size:100% 1px}
.ph::after{content:"";position:absolute;inset:-20% -60%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.07) 50%,transparent 60%);transform:translateX(-60%);animation:sheen 7s var(--e3) infinite;pointer-events:none}
.lt .ph::after{background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.75) 50%,transparent 60%)}
@keyframes sheen{0%{transform:translateX(-60%)}
55%,100%{transform:translateX(60%)}
}
@media (prefers-reduced-motion:reduce){.ph::after{animation:none;opacity:0}
}
.vg{position:relative;aspect-ratio:21/9;border-radius:var(--r3);overflow:hidden;isolation:isolate;color:#f3f1ea;user-select:none;-webkit-user-select:none;background:radial-gradient(80% 110% at 50% -10%,#26262b 0%,#141417 48%,#0a0a0c 100%);border:1px solid rgba(255,255,255,.08);box-shadow:var(--sh2)}
.vg::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 80% at 50% 50%,#000,transparent);-webkit-mask-image:radial-gradient(70% 80% at 50% 50%,#000,transparent);z-index:-1}
.vg-in{position:absolute;left:var(--fx,0%);top:50%;width:var(--z,100%);aspect-ratio:21/9;transform:translateY(-50%);container-type:inline-size;font-size:1.15cqw;line-height:1.3;letter-spacing:-.01em}
@media (max-width:767px){.vg{aspect-ratio:4/3}
.vg-in{--z:190%}
}
.vg-in>*,.v-g>*{position:absolute}
.v-g{position:absolute;inset:0}
.v-win{border-radius:1.3cqw;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12);box-shadow:0 2.4cqw 5cqw -2cqw rgba(0,0,0,.85),0 1px 0 rgba(255,255,255,.08) inset;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.v-solid{background:#17171b}
.v-bar{display:block;height:.75cqw;border-radius:1cqw;background:rgba(243,241,234,.2);transform-origin:0 50%}
.v-bar.hi{background:#f3f1ea}
.v-bar.th{height:1.9cqw;border-radius:.5cqw}
.v-pill{display:inline-flex;align-items:center;justify-content:center;gap:.6cqw;height:2.6cqw;padding:0 1.3cqw;border-radius:2cqw;background:#f3f1ea;color:#0c0c0e;font-size:1.05cqw;font-weight:500;white-space:nowrap}
.v-pill.ghost{background:rgba(255,255,255,.08);color:#f3f1ea;border:1px solid rgba(255,255,255,.14)}
.v-t{font-size:1.15cqw;font-weight:500;white-space:nowrap}
.v-s{font-size:.95cqw;color:rgba(243,241,234,.6);white-space:nowrap}
.v-dot{display:inline-block;width:.7cqw;height:.7cqw;border-radius:50%;background:#f3f1ea;flex:none}
.v-row{display:flex;align-items:center;gap:.8cqw}
.v-av{width:2.6cqw;height:2.6cqw;border-radius:50%;flex:none;background:linear-gradient(135deg,#d7d5cd,#6b6a65)}
.v-img{border-radius:1cqw;background:#222 center/cover no-repeat;overflow:hidden}
.v-cur{width:2.3cqw;height:2.3cqw;z-index:5;filter:drop-shadow(0 .4cqw .6cqw rgba(0,0,0,.6))}
.vg .lb{display:none}
.vg::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:6;border-radius:inherit;background:radial-gradient(120% 100% at 50% 40%,transparent 55%,rgba(0,0,0,.45) 100%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:normal}
.vg svg{overflow:visible}`;

const AR = '<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV = '<svg class="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHK = '<svg class="ck" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOGO = '/uploads/kmkF0MdsNjve7VQIBhT9w-dd-logo-white.png';
const DODO = '/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp';

// The six services, in homepage order, each with its gradient poster.
const SERVICES = [
  { path: '/services/web-design', name: 'Websites and SEO', sub: 'Websites and SEO that put your business in front of the right people.', img: '/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp' },
  { path: '/services/facebook-google-ads', name: 'Paid ads', sub: 'Facebook, Instagram and Google ads that turn attention into enquiries.', img: '/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp' },
  { path: '/services/branding-logo-design', name: 'Branding', sub: 'Branding that makes your business stand out, build trust, and get remembered.', img: '/uploads/d-Q_kvQRPH8ATZhTFd1Yt-svc-03.webp' },
  { path: '/services/ai-chatbots', name: 'AI implementation', sub: 'AI assistants that reply to your customers on WhatsApp and your website, day and night.', img: '/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp' },
  { path: '/services/marketing-automation-crm', name: 'Automation and CRM', sub: 'CRM, follow-up and automation, so you handle more enquiries without hiring more people.', img: '/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp' },
  { path: '/services/social-media-management', name: 'Social media', sub: 'Social media and content that keep your brand visible, trusted, and relevant.', img: '/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp' },
];
const SERVICE_PATHS = SERVICES.map((s) => s.path);

const NAV = `<header class="nav">
  <a class="nav-logo" href="/" aria-label="Disruptive Dodo, home"><img src="${LOGO}" alt="Disruptive Dodo" width="176" height="37"></a>
  <nav class="nav-pill glass" aria-label="Main">
    <button class="nav-svc" type="button" aria-expanded="false" aria-controls="dd-mp">Services${CHEV}</button>
    <a href="/fledge"><i class="sig" aria-hidden="true"></i>Fledge</a>
    <a href="/work">Work</a>
    <a href="/about">About</a>
  </nav>
  <a class="nav-cta" href="/contact">Let's talk${AR}</a>
  <button class="burger glass" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="dd-mm"><span></span><span></span></button>
</header>
<div class="mp" id="dd-mp" role="region" aria-label="Services">
  <a class="mp-feat" href="/fledge"><img src="${DODO}" alt="" width="921" height="1228" loading="lazy"><span class="cap">Our signature system</span><b>Fledge</b><span class="sub">Your full marketing system, built and run by one team.</span></a>
  <div class="mp-list">
    ${SERVICES.map((s) => `<a href="${s.path}"><img src="${s.img}" alt="" width="960" height="684" loading="lazy"><span><b>${s.name}</b><span>${s.sub}</span></span></a>`).join('')}
    <a class="mp-all" href="/services"><span>All services</span>${AR}</a>
  </div>
</div>
<div class="mm" id="dd-mm" aria-label="Menu">
  <ul class="mm-links">
    <li style="--i:0"><button type="button" class="mm-svc" aria-expanded="false" aria-controls="dd-mm-sub">Services${CHEV}</button>
      <div class="mm-sub" id="dd-mm-sub"><ul>${SERVICES.map((s) => `<li><a href="${s.path}">${s.name}</a></li>`).join('')}<li><a href="/services">All services</a></li></ul></div></li>
    <li style="--i:1"><a href="/fledge">Fledge</a></li>
    <li style="--i:2"><a href="/work">Work</a></li>
    <li style="--i:3"><a href="/about">About</a></li>
    <li style="--i:4"><a href="/contact">Contact</a></li>
  </ul>
  <div class="mm-foot">
    <div><p class="cap">New business</p><a href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu</a></div>
    <div><p class="cap">Mauritius · GMT+4</p><time class="ft-time" data-clock></time></div>
    <a class="btn" href="/contact">Book a free growth call</a>
  </div>
</div>`;

const FOOTER = `<footer class="ft">
  <div class="ft-top">
    <div class="a">
      <p class="kick">Prefer email?</p>
      <h2 class="d1 mt-24">Do it once,<br>do it right</h2>
    </div>
    <div class="b">
      <p class="tx">Built properly the first time. One team, no wasted spend, nothing to redo later. Email us and let's get started.</p>
      <a class="ft-mail mt-32" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu${AR}</a>
    </div>
  </div>
  <div class="ft-cols">
    <div class="ft-col w ft-sig"><img src="${LOGO}" alt="Disruptive Dodo" width="266" height="56" loading="lazy"><p class="cap">Built in Mauritius. Made to grow.</p><p class="cap">Mauritius · GMT+4 · <time class="ft-time" data-clock></time></p></div>
    <nav class="ft-col" aria-label="Services"><p class="cap">Services</p><a href="/fledge">Fledge</a>${SERVICES.map((s) => `<a href="${s.path}">${s.name}</a>`).join('')}</nav>
    <nav class="ft-col" aria-label="Pages"><p class="cap">Pages</p><a href="/">Home</a><a href="/work">Work</a><a href="/services">Services</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
    <nav class="ft-col" aria-label="Social"><p class="cap">Follow</p><a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener">LinkedIn</a><a href="https://instagram.com" target="_blank" rel="noreferrer noopener">Instagram</a><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener">WhatsApp</a></nav>
    <div class="ft-col"><p class="cap">© 2026 Disruptive Dodo</p><a href="/privacy">Privacy and terms</a></div>
  </div>
  <p class="ft-word" data-fit aria-hidden="true"><span>disruptive</span><b>dodo.</b></p>
</footer>`;

// ===== SEO =====
function headTag(sel, make) {
  let el = document.head.querySelector(sel);
  if (!el) { el = make(); document.head.appendChild(el); }
  return el;
}
function setMeta(attr, key, value) {
  const el = headTag('meta[' + attr + '="' + key + '"]', () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  el.setAttribute('content', value);
}
function applySeo(page) {
  const url = location.origin + page.path;
  document.documentElement.lang = 'en';
  document.title = page.title;
  setMeta('name', 'description', page.description);
  setMeta('property', 'og:title', page.title);
  setMeta('property', 'og:description', page.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:site_name', 'Disruptive Dodo');
  setMeta('name', 'twitter:card', 'summary_large_image');
  if (page.robots) setMeta('name', 'robots', page.robots);
  const canon = headTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; });
  canon.href = url;
  if (page.ld && !document.getElementById('dd-jsonld')) {
    const s = document.createElement('script');
    s.id = 'dd-jsonld'; s.type = 'application/ld+json';
    s.textContent = JSON.stringify(page.ld).split('https://disruptivedodo.mu').join(location.origin);
    document.head.appendChild(s);
  }
}

const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const raf = (fn) => requestAnimationFrame(fn);

// ===== nav: hide on scroll down, mega-panel, mobile menu =====
function navBehaviour(R, wrap) {
  const nav = R.querySelector('.nav');
  const mp = R.getElementById('dd-mp');
  const svcBtn = R.querySelector('.nav-svc');
  const burger = R.querySelector('.burger');
  const mmSvc = R.querySelector('.mm-svc');
  const mmSub = R.getElementById('dd-mm-sub');
  const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let closeT = 0;

  function setMp(open) {
    clearTimeout(closeT);
    mp.classList.toggle('open', open);
    svcBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  const later = () => { clearTimeout(closeT); closeT = setTimeout(() => setMp(false), 180); };
  svcBtn.addEventListener('click', () => setMp(!mp.classList.contains('open')));
  if (fine) {
    svcBtn.addEventListener('pointerenter', () => setMp(true));
    svcBtn.addEventListener('pointerleave', later);
    mp.addEventListener('pointerenter', () => clearTimeout(closeT));
    mp.addEventListener('pointerleave', later);
    R.querySelectorAll('.nav-pill a').forEach((a) => a.addEventListener('pointerenter', () => setMp(false)));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mp.classList.contains('open')) { setMp(false); svcBtn.focus(); }
    if (wrap.classList.contains('mm-open')) { setMm(false); burger.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    if (mp.classList.contains('open') && path.indexOf(mp) < 0 && path.indexOf(svcBtn) < 0) setMp(false);
  });

  function setMm(open) {
    wrap.classList.toggle('mm-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (window.lenis) { if (open) window.lenis.stop(); else window.lenis.start(); }
    nav.classList.remove('hide');
  }
  burger.addEventListener('click', () => setMm(!wrap.classList.contains('mm-open')));
  mmSvc.addEventListener('click', () => {
    const open = !mmSub.classList.contains('open');
    mmSub.classList.toggle('open', open);
    mmSvc.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  const mq = window.matchMedia('(min-width: 1024px)');
  const onMq = () => { if (mq.matches) setMm(false); else setMp(false); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);

  // hide while scrolling down, come back on the way up
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    raf(() => {
      ticking = false;
      const y = scrollY, dy = y - lastY;
      if (Math.abs(dy) > 6) {
        const hide = dy > 0 && y > 240 && !mp.classList.contains('open') && !wrap.classList.contains('mm-open');
        nav.classList.toggle('hide', hide);
        if (hide) setMp(false);
        lastY = y;
      }
    });
  }, { passive: true });
}

function markCurrent(R, page) {
  const here = page.path;
  R.querySelectorAll('.nav-pill a[href], .mp-list a[href], .mm-links a[href]').forEach((a) => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
  if (here.indexOf('/work/') === 0) {
    const w = R.querySelector('.nav-pill a[href="/work"]');
    if (w) w.setAttribute('aria-current', 'page');
  }
  if (page.section === 'services' || here === '/services' || SERVICE_PATHS.indexOf(here) > -1) {
    R.querySelector('.nav-svc').classList.add('is-sec');
  }
}

// In-page links (#inside) cannot reach ids inside a shadow root on their own.
function hashLinks(R) {
  const go = (id, smooth) => {
    const el = id && R.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !RM() ? 'smooth' : 'auto', block: 'start' });
    return true;
  };
  R.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (go(id, true)) { e.preventDefault(); history.replaceState(null, '', '#' + id); }
  });
  if (location.hash) raf(() => go(decodeURIComponent(location.hash.slice(1)), false));
}

// ===== reveal engine: line blur-rise for headings, fade-up for blocks =====
// Words are wrapped in place (inner markup kept), then grouped into lines by their
// offsetTop so each line rises as one. Blurred words are never clipped.
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        if (parts.length < 2 && !n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w') && n.tagName !== 'BR' && n.tagName !== 'SVG' && n.tagName !== 'svg') {
        if (getComputedStyle(n).display === 'inline-block') n.classList.add('w');
        else if (n.classList.contains('todo')) n.classList.add('wf');
        else walk(n);
      }
    });
  };
  walk(el);
}
function indexLines(el) {
  let line = -1, top = null;
  el.querySelectorAll('.w, .wf').forEach((w) => {
    const t = Math.round(w.offsetTop);
    if (top === null || Math.abs(t - top) > 4) { line++; top = t; }
    w.style.setProperty('--i', line);
  });
}
function reveal(R) {
  const rm = RM();
  const heads = R.querySelectorAll('main h1, main .mega, main .d1, main .d2, main .h2, main .lead, .ft .d1, [data-r="l"]');
  const lines = [];
  heads.forEach((el) => {
    if (el.closest('[data-r="s"], [data-r="u"], .mp, .mm, details') || el.dataset.r === '0' || el.querySelector('[data-r]')) return;
    el.classList.add('rv'); lines.push(el);
  });
  const run = () => lines.forEach((el) => { splitWords(el); indexLines(el); });
  R.querySelectorAll('[data-r="s"]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8))));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  const start = () => {
    run();
    raf(() => {
      lines.concat([...R.querySelectorAll('[data-r="u"], [data-r="s"], [data-r="x"]')]).forEach((el) => {
        if (rm) { el.classList.add('in'); return; }
        io.observe(el);
      });
    });
  };
  // split after fonts settle, so lines are measured with the real face
  const f = document.fonts && document.fonts.ready;
  let done = false;
  const go = () => { if (!done) { done = true; start(); } };
  if (f) { f.then(go); setTimeout(go, 900); } else go();
}

// ===== stacked sheets: the sheet being covered recedes a touch =====
function sheets(R) {
  if (RM()) return;
  const list = [...R.querySelectorAll('main > .sheet, main > .hero, .ft')];
  if (list.length < 2) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (let i = 0; i < list.length - 1; i++) {
      const cur = list[i], next = list[i + 1];
      if (cur.classList.contains('hero')) continue;
      const nt = next.getBoundingClientRect().top;
      const k = Math.min(1, Math.max(0, (vh * 0.7 - nt) / (vh * 0.7)));
      if (k > 0.001) { cur.style.setProperty('--k', k.toFixed(3)); cur.classList.add('is-k'); }
      else if (cur.classList.contains('is-k')) { cur.style.removeProperty('--k'); cur.classList.remove('is-k'); }
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
}

// ===== FAQ: animated open and close =====
function faq(R) {
  R.querySelectorAll('.faq details').forEach((d) => {
    const s = d.querySelector('summary'), a = d.querySelector('.ans');
    if (!s || !a) return;
    s.addEventListener('click', (e) => {
      if (RM()) return;
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      if (!d.open) {
        d.open = true;
        const h = a.scrollHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => { delete d.dataset.busy; };
      } else {
        const h = a.scrollHeight;
        a.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.39,.575,.565,1)' }).onfinish = () => { d.open = false; delete d.dataset.busy; };
      }
    });
  });
}

// ===== giant type that fills its box exactly =====
function fit(R) {
  const els = R.querySelectorAll('[data-fit]');
  if (!els.length) return;
  const run = () => els.forEach((el) => {
    el.style.fontSize = '100px';
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const w = rg.getBoundingClientRect().width, box = el.clientWidth;
    const capVh = parseFloat(el.getAttribute('data-fit')) || 0;
    let px = w > 0 ? 100 * box / w : 100;
    if (capVh) px = Math.min(px, innerHeight * capVh / 100);
    el.style.fontSize = px.toFixed(2) + 'px';
  });
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 120); }, { passive: true });
}

// ===== Mauritius local time =====
function clocks(R) {
  const els = R.querySelectorAll('[data-clock]');
  if (!els.length || !window.Intl) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Mauritius', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { const now = new Date(); els.forEach((t) => { t.textContent = fmt.format(now); t.setAttribute('datetime', now.toISOString()); }); };
  tick(); setInterval(tick, 20000);
}

// ===== hero gradient: a GetLayers shader, tinted through its CONFIG =====
// Mounted once the hero is on screen; the shader pauses itself offscreen; reduced
// motion draws one still frame; no WebGL2 keeps the poster.
function heroGradient(R, page) {
  const g = page.gl, box = R.querySelector('.hero-bg');
  if (!g || !box || typeof g.mount !== 'function') return;
  if (g.poster) box.style.backgroundImage = 'url("' + g.poster + '")';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  box.prepend(canvas);
  let started = false;
  const start = () => {
    if (started) return; started = true;
    try {
      const api = g.mount(canvas, g.cfg || {}, { still: RM(), t: g.t || 6 });
      if (!api) { canvas.remove(); return; }
      raf(() => raf(() => box.classList.add('on')));
    } catch (err) { canvas.remove(); console.warn('[dd] gradient off', err); }
  };
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 700 }); else setTimeout(start, 60); } });
  io.observe(box);
}

// ===== motion engine: looping vignettes on the compositor =====
// Follows the HyperFrames motion contract, adapted for a live page: one period per
// scene, explicit from/to states, transforms and opacity (plus clip-path and stroke
// for reveals), capped staggers. Each track compiles to Web Animations keyframes that
// loop seamlessly; scenes pause offscreen and show one still frame under reduced motion.
// spec = { root, D, still, tracks: [[selector, stagger, [[t0, t1, from, to, ease], ...]]] }
// Remotion-style spring(): the physics (stiffness, damping, mass) is simulated once and
// compiled into a CSS linear() curve, so a "spring" segment settles exactly like
// Remotion's spring() over whatever duration the timeline gives it. Older browsers get
// the closest cubic-bezier.
function springEase(stiffness, damping, mass) {
  const pts = [];
  let x = 0, v = 0;
  const dt = 1 / 240;
  for (let t = 0; t < 4; t += dt) {
    v += ((-stiffness * (x - 1) - damping * v) / mass) * dt;
    x += v * dt;
    pts.push(x);
    if (t > 0.2 && Math.abs(x - 1) < 4e-4 && Math.abs(v) < 4e-3) break;
  }
  const n = 48, out = [];
  for (let i = 0; i <= n; i++) out.push(i === n ? '1' : pts[Math.round((i / n) * (pts.length - 1))].toFixed(4));
  return 'linear(' + out.join(', ') + ')';
}
const HAS_LINEAR = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)'));
const SPRING = {
  sp: HAS_LINEAR ? springEase(160, 18, 1) : 'cubic-bezier(.34,1.56,.64,1)', // pop: a little overshoot
  sg: HAS_LINEAR ? springEase(170, 22, 1) : 'cubic-bezier(.22,1.2,.36,1)', // glide: settles with a whisper
};
const EASE = { o: 'cubic-bezier(.16,1,.3,1)', io: 'cubic-bezier(.65,0,.35,1)', i: 'cubic-bezier(.55,0,.75,.06)', sp: SPRING.sp, sg: SPRING.sg, l: 'linear' };
function frames(D, segs, off) {
  let st = {};
  segs.forEach((s) => Object.keys(s[2]).concat(Object.keys(s[3])).forEach((k) => { if (!(k in st)) st[k] = k in s[2] ? s[2][k] : s[3][k]; }));
  const ks = [Object.assign({ offset: 0 }, st)];
  let last = 0;
  segs.slice().sort((a, b) => a[0] - b[0]).forEach(([t0, t1, a, b, e]) => {
    t0 = Math.min(D, Math.max(last, t0 + off));
    t1 = Math.min(D, Math.max(t0, t1 + off));
    st = Object.assign({}, st, a);
    ks.push(Object.assign({ offset: t0 / D, easing: EASE[e || 'o'] || e }, st));
    st = Object.assign({}, st, b);
    ks.push(Object.assign({ offset: t1 / D }, st));
    last = t1;
  });
  ks.push(Object.assign({ offset: 1 }, st));
  return ks;
}
function motion(R, page) {
  const specs = (page.motion || []).concat(DD.motion || []);
  specs.forEach((spec) => {
    R.querySelectorAll(spec.root).forEach((root) => {
      const anims = [];
      spec.tracks.forEach(([sel, stag, segs]) => {
        root.querySelectorAll(sel).forEach((el, i) => {
          try { anims.push(el.animate(frames(spec.D, segs, i * (stag || 0)), { duration: spec.D, iterations: Infinity, fill: 'both' })); } catch (e) { /* unsupported keyframe value: leave the element static */ }
        });
      });
      anims.forEach((a) => a.pause());
      if (RM()) { anims.forEach((a) => { a.currentTime = spec.D * (spec.still || 0.75); }); return; }
      new IntersectionObserver((es) => {
        const on = es[0].isIntersecting;
        anims.forEach((a) => (on ? a.play() : a.pause()));
      }, { threshold: 0.12 }).observe(root);
    });
  });
}

// ===== small live touches: spotlight, magnetic buttons, hero parallax =====
function liveTouches(R) {
  const fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    // a soft light that follows the pointer across cards
    R.addEventListener('pointermove', (e) => {
      const c = e.target.closest && e.target.closest('.card, .vg, .stat, .facts > div');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
    // primary buttons lean toward the pointer
    if (!RM()) R.querySelectorAll('.btn-p, .nav-cta, .submit').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.translate = (x * 8).toFixed(1) + 'px ' + (y * 6).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }
  // the hero drifts up and dims as the first sheet slides over it
  const hero = R.querySelector('main > .hero');
  if (!hero || RM()) return;
  const parts = [...hero.children].filter((c) => !c.classList.contains('hero-bg'));
  const bg = hero.querySelector('.hero-bg');
  let ticking = false;
  const update = () => {
    ticking = false;
    const h = hero.offsetHeight, y = Math.min(Math.max(scrollY, 0), h);
    const p = y / h;
    parts.forEach((el) => { el.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)'; el.style.opacity = String(Math.max(0, 1 - p * 1.35).toFixed(3)); });
    if (bg) bg.style.transform = 'scale(' + (1 + p * 0.08).toFixed(4) + ')';
  };
  addEventListener('scroll', () => { if (!ticking && scrollY < innerHeight * 1.4) { ticking = true; raf(update); } }, { passive: true });
}

const DD = (window.__DD = window.__DD || { pages: {} });
DD.ui = { AR, CHK, SERVICES, RM };

DD.mount = function () {
  const host = document.getElementById('dd-root');
  if (!host || host._ddDone) return;
  const key = host.getAttribute('data-page') || DD.current;
  const page = DD.pages[key];
  if (!page) return;
  host._ddDone = true;
  try {
    if (!document.getElementById('dd-global')) {
      const st = document.createElement('style');
      st.id = 'dd-global'; st.textContent = FONT_CSS;
      document.head.appendChild(st);
    }
    applySeo(page);
    host.removeAttribute('style');
    host.innerHTML = '';
    const R = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const html = page.html.split('{{ar}}').join(AR).split('{{ck}}').join(CHK);
    R.innerHTML = '<style>' + CSS + '\n' + (page.css || '') + '</style><div class="r">' + NAV + html + FOOTER + '</div>';
    const wrap = R.querySelector('.r');
    wrap.style.setProperty('--sp', SPRING.sp);
    wrap.style.setProperty('--sg', SPRING.sg);
    markCurrent(R, page);
    navBehaviour(R, wrap);
    hashLinks(R);
    faq(R);
    clocks(R);
    fit(R);
    heroGradient(R, page);
    if (typeof page.init === 'function') { try { page.init(R, DD.ui); } catch (e) { console.error('[dd] page init', e); } }
    reveal(R);
    sheets(R);
    motion(R, page);
    liveTouches(R);
  } catch (e) { console.error('[dd] mount failed', e); }
};

// ===== the same nav and footer on the homepage =====
// The homepage (marcus-vane.js) renders into its own shadow root on #mv-root. Its old
// header and footer are hidden there; this mounts the shared NAV and FOOTER around it,
// each in its own shadow root so neither page's styles can reach the other.
function globalFonts() {
  if (document.getElementById('dd-global')) return;
  const st = document.createElement('style');
  st.id = 'dd-global'; st.textContent = FONT_CSS;
  document.head.appendChild(st);
}
DD.mountChrome = function () {
  const home = document.getElementById('mv-root');
  if (!home || document.getElementById('dd-chrome-top')) return;
  try {
    globalFonts();
    const make = (id, inner, where) => {
      const el = document.createElement('div');
      el.id = id;
      home.insertAdjacentElement(where, el);
      const R = el.attachShadow({ mode: 'open' });
      R.innerHTML = '<style>' + CSS + '\n.r.ddc{min-height:0;background:transparent;overflow:visible}.ddc .ft{margin-top:calc(var(--rx) * -1)}</style><div class="r ddc">' + inner + '</div>';
      const wrap = R.querySelector('.r');
      wrap.style.setProperty('--sp', SPRING.sp);
      wrap.style.setProperty('--sg', SPRING.sg);
      return { R, wrap };
    };
    // the header goes before the homepage so its loading curtain still covers it
    const top = make('dd-chrome-top', NAV, 'beforebegin');
    const foot = make('dd-chrome-foot', FOOTER, 'afterend');
    markCurrent(top.R, { path: '/' });
    navBehaviour(top.R, top.wrap);
    clocks(top.R);
    liveTouches(top.R);
    clocks(foot.R);
    fit(foot.R);
    reveal(foot.R);
    liveTouches(foot.R);
  } catch (e) { console.error('[dd] chrome mount failed', e); }
};

(function boot() {
  if (document.getElementById('mv-root')) { DD.mountChrome(); return; }
  if (document.getElementById('dd-root')) { DD.mount(); return; }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => (document.getElementById('mv-root') ? DD.mountChrome() : DD.mount()), { once: true }); return; }
  let tries = 0;
  const iv = setInterval(() => {
    if (document.getElementById('mv-root')) { clearInterval(iv); DD.mountChrome(); return; }
    if (document.getElementById('dd-root') || tries++ > 40) { clearInterval(iv); DD.mount(); }
  }, 100);
})();
}
