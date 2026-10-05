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
