// Disruptive Dodo · shared shell for the inner pages (Work, Services, Fledge, About,
// Contact, Privacy, service pages). Mounted in a Shadow DOM on #dd-root, like the
// homepage (marcus-vane.js). Each page's content is in its own
// src/scripts/dd-page-<name>.js, scoped to that page only; this file holds the shared
// styles, nav, footer, nav behaviour and SEO tags. Black and white: --ac is neutral.

const FONT_CSS = `@font-face{font-family:"Switzer";font-style:normal;font-weight:400;font-display:swap;src:url("/uploads/omJGqkQH2HmXNSQfbAzJu-Switzer-Regular.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:500;font-display:swap;src:url("/uploads/XMolNpeQj8mWtCYl6S3hH-Switzer-Medium.otf") format("opentype")}
@font-face{font-family:"Switzer";font-style:normal;font-weight:600;font-display:swap;src:url("/uploads/FChqSYdv-vGwYA1WBuYg7-Switzer-Semibold.otf") format("opentype")}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:#08080a}
#dd-root{display:block;min-height:100vh;background:#08080a}`;

const CSS = `






:host{--ac:#d7d5cd;--ac-ink:#08080a}

@supports (color:oklch(from white l c h)){:host,.r{--ac-ink:oklch(from var(--ac) clamp(0,(.66 - l) * 1000,1) 0 0)}}

*,*::before,*::after{box-sizing:border-box}


img{display:block;max-width:100%;height:auto}
[hidden]{display:none !important}

.r{--bg:#08080a;--fg:#f3f1ea;--sf:#111114;--sf2:#17171b;--mu:#8c8b84;--ln:rgba(243,241,234,.1);--ls:rgba(243,241,234,.22);--acx:var(--ac);--gt:clamp(20px,3.34vw,48px);--sec:clamp(80px,10.5vw,152px);font-family:"Switzer",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:17px;line-height:1.7;letter-spacing:-.011em;color:var(--fg);background:var(--bg);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:clip}
.lt{--bg:#ffffff;--fg:#0f0f12;--sf:#ffffff;--sf2:#f4f2ec;--mu:#5b5a54;--ln:rgba(15,15,18,.12);--ls:rgba(15,15,18,.2);--acx:color-mix(in srgb,var(--ac) 45%,#0f0f12);color:var(--fg);background:var(--bg)}
.dk{--bg:#08080a;--fg:#f3f1ea;--sf:#111114;--sf2:#17171b;--mu:#8c8b84;--ln:rgba(243,241,234,.1);--ls:rgba(243,241,234,.22);--acx:var(--ac);color:var(--fg);background:var(--bg)}


:where(.r) :where(p,h1,h2,h3,h4,ul,ol,figure,blockquote,dl,dd,dt){margin:0;padding:0}
:where(.r) :where(ul,ol){list-style:none}
:where(.r) :where(h1,h2,h3,h4){font-size:inherit;line-height:1.15;font-weight:600}
:where(.r) a{color:inherit}
:where(.r) :where(button,input,select,textarea){font:inherit;letter-spacing:inherit}
.r ::selection{background:var(--ac);color:var(--ac-ink)}
.r :focus-visible{outline:2px solid var(--acx);outline-offset:3px}
.lt :focus-visible{outline-color:var(--fg)}


.gt{padding-left:var(--gt);padding-right:var(--gt)}
.sec{padding:var(--sec) var(--gt)}

.panel{position:relative;z-index:1;margin-top:-32px;border-radius:32px 32px 0 0;border-top:1px solid var(--ln);background:var(--bg)}
.on-sf{background:var(--sf)} .on-sf2{background:var(--sf2)}
.head-row{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px 48px}
.g12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:var(--gt)}

.span-4{grid-column-end:span 4}.span-5{grid-column-end:span 5}.span-6{grid-column-end:span 6}.span-7{grid-column-end:span 7}.span-8{grid-column-end:span 8}.from-7{grid-column-start:7}.from-8{grid-column-start:8}
@media (max-width:1023px){.g12{grid-template-columns:minmax(0,1fr)}.g12>*{grid-column:auto !important}}
.c-center{text-align:center;margin-left:auto;margin-right:auto}
.mt-8{margin-top:8px}.mt-12{margin-top:12px}.mt-16{margin-top:16px}.mt-24{margin-top:24px}.mt-32{margin-top:32px}.mt-40{margin-top:40px}.mt-48{margin-top:48px}.mt-64{margin-top:clamp(40px,4.45vw,64px)}.mt-96{margin-top:clamp(56px,6.67vw,96px)}


.eb{display:flex;align-items:center;gap:12px;font-size:13px;line-height:1.2;font-weight:500;text-transform:uppercase;letter-spacing:.22em;color:var(--mu)}
.eb .dot{width:8px;height:8px;border-radius:50%;background:var(--acx);flex:none}
.mega{font-weight:400;font-size:clamp(64px,14.45vw,208px);line-height:.86;letter-spacing:-.03em}
.dsp{font-weight:400;font-size:clamp(46px,8.34vw,120px);line-height:.92;letter-spacing:-.02em;text-wrap:balance}
.h1{font-weight:400;font-size:clamp(42px,5.56vw,80px);line-height:.95;letter-spacing:-.015em;text-wrap:balance}
.h2{font-weight:400;font-size:clamp(34px,3.62vw,52px);line-height:1.02;letter-spacing:-.01em;text-wrap:balance}
.h3{font-weight:600;font-size:clamp(22px,1.95vw,28px);line-height:1.15;letter-spacing:-.01em}
.h4{font-weight:600;font-size:20px;line-height:1.3;letter-spacing:-.01em}
.ld{font-size:clamp(18px,1.53vw,22px);line-height:1.55;color:var(--mu);text-wrap:pretty}
.tx{font-size:17px;line-height:1.7;color:var(--mu);text-wrap:pretty}
.sm{font-size:14px;line-height:1.55;color:var(--mu)}
.cap{font-size:13px;line-height:1.35;text-transform:uppercase;letter-spacing:.18em;color:var(--mu)}
.fg{color:var(--fg)} .mu{color:var(--mu)}
.eba,.acx{color:var(--acx)}


.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 30px;border-radius:999px;border:1px solid var(--ls);background:transparent;color:var(--fg);font:inherit;font-size:15px;font-weight:600;line-height:1;text-transform:uppercase;letter-spacing:.07em;text-decoration:none;white-space:nowrap;cursor:pointer;transition:border-color .3s,background .3s,color .3s,transform .3s cubic-bezier(.16,1,.3,1)}
.btn:hover{border-color:var(--fg);transform:translateY(-2px)}
.btn-s{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.btn-a{background:var(--ac);border-color:var(--ac);color:var(--ac-ink)}
.btn-a:hover{border-color:var(--ac)}
.btn-row{display:flex;flex-wrap:wrap;gap:14px}
.ar{width:12px;height:12px;flex:none}
.lnk{display:inline-flex;align-items:center;gap:10px;min-height:44px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;color:var(--fg)}
.lnk:hover{text-decoration:underline;text-decoration-color:var(--acx);text-underline-offset:6px}
@media (max-width:479px){.btn{white-space:normal;text-align:center;line-height:1.25;padding:10px 24px}}


.hero-in{padding:clamp(72px,8.4vw,120px) var(--gt) clamp(80px,8.4vw,120px)}
.hero-in>.dsp,.hero-in>.h1,.hero-in>.mega{margin-top:28px}
.hero-in>.ld{margin-top:36px;max-width:46ch}

.seg{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--ls);border-radius:999px}
.seg .chip{border-color:transparent}


.nav{position:sticky;top:0;z-index:50;display:flex;align-items:stretch;height:64px;background:rgba(8,8,10,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#f3f1ea}
.nav-logo{display:flex;align-items:center;flex:none;padding:0 var(--gt);text-decoration:none}
.nav-logo img{height:37px;width:auto}
.nav-mid{position:relative;flex:1;min-width:0;display:flex;align-items:center;justify-content:center;border-left:1px dashed rgba(243,241,234,.4);border-bottom:1px dashed rgba(243,241,234,.4)}
.cmk{position:absolute;left:-2px;width:4px;height:4px;background:#f3f1ea;pointer-events:none}
.cmk-t{top:-2px}.cmk-b{bottom:-2px}
.nav-links{display:flex;align-items:center;gap:36px}
.nav-links a{display:inline-flex;align-items:center;min-height:44px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:#f3f1ea;text-decoration:none}
.nav-links a:hover{color:var(--ac)}
.nav-links a[aria-current="page"]{text-decoration:underline;text-decoration-color:var(--ac);text-decoration-thickness:1px;text-underline-offset:8px}
.nav-act{position:relative;display:flex;align-items:center;justify-content:center;gap:9px;flex:none;width:176px;border-left:1px dashed rgba(243,241,234,.4);background:#f3f1ea;color:#08080a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.13em;text-decoration:none;transition:background .26s}
.r .nav-act{color:#08080a}
.nav-act:hover{background:#ffffff}
.nav-act[aria-current="page"]{background:var(--ac);color:var(--ac-ink)}
.nav-act .cmk{background:#08080a}
.burger{display:none;position:relative;align-items:center;justify-content:center;flex:none;width:64px;padding:0;border:0;border-left:1px dashed rgba(243,241,234,.4);background:transparent;cursor:pointer}
.burger span{position:absolute;left:50%;top:50%;width:22px;height:1.5px;margin-left:-11px;background:#f3f1ea;transition:transform .3s cubic-bezier(.2,0,0,1)}
.burger span:first-child{transform:translateY(-4px)}.burger span:last-child{transform:translateY(4px)}
.nav.open .burger span:first-child{transform:rotate(45deg)}.nav.open .burger span:last-child{transform:rotate(-45deg)}

@media (min-width:900px){.nav-links{position:absolute;top:0;bottom:0;left:calc(50% - var(--gt));transform:translateX(-50%)}}
@media (max-width:899px){
  .nav-links{display:none}
  .nav-act{width:auto;padding:0 18px}
  .burger{display:flex}
  
  .nav.open .nav-links{display:flex;position:fixed;top:64px;left:0;right:0;flex-direction:column;align-items:stretch;gap:0;padding:12px var(--gt) 28px;background:#08080a;border-bottom:1px dashed rgba(243,241,234,.4)}
  .nav.open .nav-links a{justify-content:space-between;min-height:60px;font-size:22px;letter-spacing:.04em;border-bottom:1px dashed rgba(243,241,234,.2)}
}
@media (max-width:639px){.nav-logo img{height:28px}.nav-act{padding:0 14px;gap:8px}.burger{width:56px}}


.ph{position:relative;display:flex;align-items:center;justify-content:center;padding:20px;border-radius:16px;border:1px dashed var(--ls);overflow:hidden;background:linear-gradient(to top right,transparent calc(50% - .7px),var(--ln) 50%,transparent calc(50% + .7px)),linear-gradient(to bottom right,transparent calc(50% - .7px),var(--ln) 50%,transparent calc(50% + .7px)),var(--sf2)}
.lb{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:340px;padding:14px 18px;border-radius:12px;background:var(--bg);border:1px solid var(--ln);text-align:center}
.lb b{font-size:11px;line-height:1.3;letter-spacing:.16em;text-transform:uppercase;color:var(--fg);font-weight:600}
.lb span{font-size:14px;line-height:1.45;color:var(--fg)}
.lb i{font-style:normal;font-size:12px;line-height:1.3;color:var(--mu)}
.todo{border:1px dashed var(--ls);background:var(--ln);color:var(--fg);border-radius:6px;padding:0 .2em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.logo-ph{display:flex;align-items:center;justify-content:center;min-height:88px;padding:0 16px;border-radius:14px;border:1px dashed var(--ls);color:var(--mu);font-size:11px;line-height:1.4;letter-spacing:.16em;text-transform:uppercase;text-align:center}
.cov{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.r16x9{aspect-ratio:16/9}.r16x10{aspect-ratio:16/10}.r21x9{aspect-ratio:21/9}.r4x5{aspect-ratio:4/5}.r16x11{aspect-ratio:16/11}
@media (max-width:639px){.r21x9{aspect-ratio:4/3}}


.svc{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:space-between;gap:32px;overflow:hidden;min-height:520px;padding:32px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:#08080a;color:#ffffff;text-decoration:none}
.svc .cov{z-index:0;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.svc:hover .cov{transform:scale(1.04)}
.svc::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(to bottom,rgba(8,8,10,.72) 0%,rgba(8,8,10,.46) 46%,rgba(8,8,10,0) 72%),linear-gradient(to top,rgba(8,8,10,.8),rgba(8,8,10,0) 48%)}
.svc>*:not(.cov){position:relative;z-index:2}
.svc .idx{font-size:20px;line-height:1.2;color:rgba(255,255,255,.66)}
.svc h3{margin-top:16px;font-size:clamp(34px,3.55vw,51px);line-height:1.03;font-weight:600;letter-spacing:-.02em;color:#ffffff}
.svc .sub{margin-top:24px;max-width:30ch;font-size:clamp(17px,1.39vw,20px);line-height:1.45;color:rgba(255,255,255,.9)}
.svc .disc{display:flex;align-items:flex-end;justify-content:space-between;font-size:18px;line-height:1.2;color:#ffffff}
.ring{display:grid;place-items:center;flex:none;width:72px;height:72px;border-radius:50%;border:1px solid currentColor;transition:background .3s,color .3s}
.ring svg{width:18px;height:18px}
.svc:hover .ring{background:#ffffff;color:#08080a}


.rail{display:flex;gap:12px;overflow-x:auto;overscroll-behavior-x:contain;padding:0 var(--gt) 16px;scroll-padding-left:var(--gt);scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:var(--ls) transparent}
.rail>*{flex:none;scroll-snap-align:start}
.rail .svc{width:528px;height:560px;min-height:0}
@media (max-width:639px){.rail .svc{width:min(82vw,340px);height:470px}}


.principle{display:grid;grid-template-columns:auto 1fr;column-gap:24px;padding:32px 0;border-top:1px solid var(--ln)}
.principle:last-child{border-bottom:1px solid var(--ln)}
.principle .idx{font-size:clamp(22px,1.95vw,28px);font-weight:600;line-height:1.15;font-variant-numeric:tabular-nums;color:var(--acx)}
.principle h3{font-size:clamp(22px,1.95vw,28px);font-weight:600;line-height:1.15;letter-spacing:-.01em}
.principle p{margin-top:12px;max-width:44ch;font-size:17px;line-height:1.7;color:var(--mu)}


.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));border-top:1px solid var(--ln)}
.stat{display:flex;flex-direction:column;gap:16px;padding:48px 0;border-bottom:1px solid var(--ln)}
.stats .stat+.stat{border-left:1px solid var(--ln);padding-left:32px}
.stat .fig{font-size:clamp(56px,8.34vw,120px);line-height:1;letter-spacing:-.02em;font-weight:400;white-space:nowrap}
.stat .lab{text-wrap:balance;max-width:30ch;font-size:15px;line-height:1.5;text-transform:uppercase;letter-spacing:.14em;color:var(--mu)}
@media (min-width:640px) and (max-width:1023px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stats .stat:nth-child(odd){border-left:0;padding-left:0}}
@media (max-width:639px){.stat{padding:32px 0}.stats .stat+.stat{border-left:0;padding-left:0}}


.chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:999px;border:1px solid var(--ls);background:transparent;color:var(--fg);font:inherit;font-size:14px;font-weight:500;line-height:1.2;letter-spacing:0;cursor:pointer;transition:border-color .2s,background .2s,color .2s}
.chip:hover{border-color:var(--fg)}
.chip[aria-pressed="true"]{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.tag{display:inline-flex;align-items:center;min-height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--ls);font-size:13px;line-height:1.2;font-weight:500;letter-spacing:0;color:var(--fg);white-space:nowrap}
.tag.on{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));border-top:1px solid var(--ln)}
.meta>div{display:flex;flex-direction:column;gap:8px;padding:24px 24px 24px 0;border-bottom:1px solid var(--ln)}


.form-panel{display:flex;flex-direction:column;gap:18px;padding:clamp(24px,2.2vw,32px);border-radius:16px;background:var(--sf);border:1px solid var(--ls)}
.form-panel.raised{box-shadow:0 26px 60px -24px rgba(15,15,18,.4),0 6px 18px -10px rgba(15,15,18,.24)}
.form-panel h3{font-size:clamp(26px,2.3vw,33px);line-height:1.1;font-weight:600;letter-spacing:-.01em}
.form-panel form{display:flex;flex-direction:column;gap:16px}
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:13px;line-height:1.3;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:var(--acx)}
.inp{width:100%;min-height:52px;padding:14px 19px;border-radius:10px;border:1px solid var(--ls);background:transparent;color:var(--fg);font:inherit;font-size:16px;line-height:1.4;letter-spacing:0;outline:none;transition:border-color .2s}
.inp:focus-visible{border-color:var(--fg);outline:none}
.inp::placeholder{color:var(--mu);opacity:1}
select.inp{-webkit-appearance:none;appearance:none;cursor:pointer;padding-right:48px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238c8b84' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 20px center}
select.inp option{color:#111114;background:#ffffff}
textarea.inp{resize:vertical;min-height:84px}
.consent{font-size:14px;line-height:1.45;color:var(--mu)}
.consent a{color:var(--fg);text-decoration:underline;text-underline-offset:3px}
.submit{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;min-height:60px;padding:0 6px 0 26px;border-radius:999px;border:1px solid var(--ac);background:var(--ac);color:var(--ac-ink);font:inherit;font-size:19px;font-weight:500;line-height:1.2;letter-spacing:-.005em;cursor:pointer;transition:filter .15s}
.submit:hover{filter:brightness(1.06)}
.submit .disc{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:50%;background:#ffffff;color:#08080a}
.submit .disc svg{width:15px;height:15px}
.form-done{display:flex;flex-direction:column;gap:12px}
.form-done[hidden]{display:none}
.form-done h3{font-size:clamp(24px,1.95vw,28px)}
.form-done a{color:var(--fg);text-decoration:underline;text-underline-offset:3px}


.tcard{position:relative;overflow:hidden;width:336px;height:520px;border-radius:16px;background:var(--sf2);border:1px solid var(--ls)}
.lt .tcard{box-shadow:0 18px 42px -18px rgba(15,15,18,.45),0 4px 14px -8px rgba(15,15,18,.26)}
.tcard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;filter:grayscale(.25) contrast(1.03)}
.tcard figcaption{position:absolute;left:24px;right:24px;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 20px;border-radius:10px;background:rgba(10,10,12,.92);border:1px solid rgba(243,241,234,.1);text-align:center}
.tcard .n{font-size:18px;line-height:1.3;font-weight:600;color:#f5f3ec}
.tcard .ro{font-size:14px;line-height:1.35;font-weight:500;color:rgba(243,241,234,.8)}


.dodo{position:relative;isolation:isolate;background:var(--bg)}
.dodo::before{content:"";position:absolute;left:50%;top:52%;width:132%;height:86%;transform:translate(-50%,-50%);background:radial-gradient(50% 50% at 50% 50%,rgba(120,120,132,.32),rgba(90,90,102,.1) 46%,transparent 72%);z-index:-1;pointer-events:none}



.faq{border-top:1px solid var(--ln)}
.faq details{border-bottom:1px solid var(--ln)}
.faq summary{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:44px;padding:26px 0;cursor:pointer;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary h3{font-size:clamp(22px,1.95vw,28px);line-height:1.2;font-weight:600;letter-spacing:-.01em}
.faq .pm{position:relative;flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--ls);transition:background .25s,border-color .25s}
.faq .pm::before,.faq .pm::after{content:"";position:absolute;left:50%;top:50%;width:14px;height:1.5px;margin:-.75px 0 0 -7px;background:var(--fg);transition:transform .3s cubic-bezier(.2,0,0,1)}
.faq .pm::after{transform:rotate(90deg)}
.faq details[open] .pm::after{transform:rotate(0deg)}
.faq summary:hover .pm{border-color:var(--fg)}
.faq .ans{max-width:58ch;padding:0 68px 30px 0}


.ft{position:relative;z-index:1;margin-top:-32px;padding:var(--sec) var(--gt) 0;border-radius:32px 32px 0 0;border-top:1px solid rgba(243,241,234,.1);background:#08080a;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;--bg:#08080a;--ln:rgba(243,241,234,.1);--ls:rgba(243,241,234,.22);--acx:var(--ac)}
.ft-h{margin-top:24px;max-width:14ch}
.ft-b{margin-top:32px;max-width:44ch}
.ft-mail{display:inline-flex;align-items:baseline;gap:16px;max-width:100%;margin-top:40px;padding:8px 0;font-size:clamp(26px,5.56vw,80px);font-weight:600;line-height:1.1;letter-spacing:-.015em;color:#f3f1ea;text-decoration:none;overflow-wrap:anywhere;transition:color .34s}
.ft-mail svg{width:.42em;height:.42em;flex:none;color:var(--ac);transition:transform .34s cubic-bezier(.16,1,.3,1)}
.ft-mail:hover svg{transform:translate(4px,-4px)}
.ft-bar{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-top:var(--sec);padding:48px 0;border-top:1px solid rgba(243,241,234,.1)}
.ft-sig img{height:56px;width:auto}
.ft-sig .cap{margin-top:16px}
.ft-col{display:flex;flex-direction:column;align-items:flex-start;gap:0}
.ft-col .cap{margin-bottom:8px}
.ft-col a{display:inline-flex;align-items:center;min-height:44px;min-width:44px;font-size:16px;line-height:1.3;color:#8c8b84;text-decoration:none;transition:color .2s}
.ft-col a:hover{color:#f3f1ea}
@media (max-width:899px){.ft-bar{grid-template-columns:1fr 1fr}.ft-sig{grid-column:1/-1}}
@media (max-width:479px){.ft-bar{grid-template-columns:1fr;gap:28px}.ft-sig img{height:44px}}


@keyframes ddmarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.marquee{overflow:hidden;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln);padding:32px 0}
.marquee-track{display:flex;width:max-content;animation:ddmarquee 30s linear infinite}
.mq-set{display:flex;flex:none}
.marquee-track span{display:flex;align-items:center;font-size:clamp(34px,3.62vw,52px);line-height:1.1;letter-spacing:-.01em;white-space:nowrap}
.marquee-track i{display:inline-block;flex:none;width:10px;height:10px;margin:0 32px;border-radius:50%;background:var(--ac)}

@media (prefers-reduced-motion:reduce){.marquee-track{animation:none}.btn,.btn:hover,.svc .cov,.svc:hover .cov{transition:none;transform:none}}
@media (max-width:639px){.svc{min-height:440px;padding:24px}.ring{width:60px;height:60px}.tcard{width:280px;height:440px}.faq .ans{padding-right:0}}




.nav-dd{position:relative;display:flex;align-items:center;align-self:stretch}
.nav-links a.is-sec{text-decoration:underline;text-decoration-color:var(--ac);text-decoration-thickness:1px;text-underline-offset:8px}
.nav-dd-btn{display:inline-grid;place-items:center;flex:none;width:44px;height:44px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#f3f1ea;cursor:pointer;transition:color .2s}
.nav-dd-btn:hover{color:var(--ac)}

@media (min-width:900px){.nav-dd-btn{margin-right:-12px}}
.nav-dd-btn svg{width:12px;height:12px;transition:transform .25s cubic-bezier(.2,0,0,1)}
.nav-dd-btn[aria-expanded="true"] svg{transform:rotate(180deg)}

.nav-dd-panel{position:absolute;z-index:2;top:calc(100% + 9px);left:-24px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:640px;max-width:calc(100vw - 32px);padding:8px;border-radius:16px;border:1px solid rgba(243,241,234,.12);background:#111114;color:#f3f1ea;box-shadow:0 28px 64px -24px rgba(0,0,0,.85),0 8px 22px -12px rgba(0,0,0,.6);visibility:hidden;opacity:0;transform:translateY(6px);transition:opacity .18s ease,transform .22s cubic-bezier(.16,1,.3,1),visibility 0s linear .22s}

.nav-dd-panel::before{content:"";position:absolute;left:0;right:0;bottom:100%;height:12px}
.nav-dd.open .nav-dd-panel,
.nav:not(.nav-js) .nav-dd:hover .nav-dd-panel,
.nav:not(.nav-js) .nav-dd:focus-within .nav-dd-panel{visibility:visible;opacity:1;transform:none;transition:opacity .18s ease,transform .22s cubic-bezier(.16,1,.3,1),visibility 0s}

.nav-links .nav-dd-feat{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:0;min-height:236px;padding:24px;border-radius:12px;border:1px solid rgba(243,241,234,.08);background:#17171b;font-size:14px;font-weight:400;line-height:1.5;text-transform:none;letter-spacing:-.005em;color:#f3f1ea;text-decoration:none;transition:background .2s,border-color .2s}
.nav-links .nav-dd-feat:hover{color:#f3f1ea;background:#1c1c21;border-color:rgba(243,241,234,.18)}
.nav-dd-feat .cap{display:flex;align-items:center;gap:10px;padding-right:28px;font-size:12px;line-height:1.3;letter-spacing:.18em;color:#8c8b84}
.nav-dd-feat .cap::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--ac)}
.nav-dd-feat b{margin-top:auto;padding-top:32px;font-size:34px;font-weight:500;line-height:1;letter-spacing:-.02em;color:#f3f1ea}
.nav-dd-sub{margin-top:12px;max-width:30ch;font-size:14px;line-height:1.5;color:#8c8b84}
.nav-dd-feat .ar{position:absolute;top:24px;right:24px;width:14px;height:14px;color:var(--ac);transition:transform .3s cubic-bezier(.16,1,.3,1)}
.nav-dd-feat:hover .ar{transform:translate(2px,-2px)}

.nav-dd-list{display:flex;flex-direction:column;justify-content:center;padding:4px 8px}
.nav-dd-list li+li{border-top:1px solid rgba(243,241,234,.1)}
.nav-links .nav-dd-list a{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:44px;padding:0 8px;font-size:15px;font-weight:500;line-height:1.3;text-transform:none;letter-spacing:-.005em;color:#f3f1ea;text-decoration:none}
.nav-links .nav-dd-list a:hover{color:#ffffff;text-decoration:underline;text-decoration-color:var(--ac);text-decoration-thickness:1px;text-underline-offset:5px}
.nav-links .nav-dd-list a[aria-current="page"]{font-weight:600;text-decoration:none}
.nav-links .nav-dd-list a[aria-current="page"]::after{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--ac)}
.nav-links .nav-dd-list .nav-dd-all{color:#8c8b84}
.nav-links .nav-dd-list .nav-dd-all:hover{color:#f3f1ea}
.nav-links .nav-dd-list .nav-dd-all::after{content:"";flex:none;width:12px;height:12px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2' fill='none' stroke='%23000' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2' fill='none' stroke='%23000' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}

.nav-links .nav-sig{gap:10px}
.nav-sig-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--ac)}

@media (min-width:900px) and (max-width:1199px){.nav-links{gap:20px}}
@media (min-width:1200px) and (max-width:1399px){.nav-links{gap:30px}}


@media (max-width:899px){
  .nav.open .nav-links{max-height:calc(100vh - 64px);max-height:calc(100dvh - 64px);overflow-y:auto;overscroll-behavior:contain}
  .nav-dd{display:block}
  .nav-dd-btn{display:none}
  .nav.open .nav-links .nav-dd-top{border-bottom:0}
  .nav-dd-panel{position:static;display:block;width:auto;max-width:none;margin:0;padding:0 0 14px 20px;border:0;border-bottom:1px dashed rgba(243,241,234,.2);border-radius:0;background:transparent;box-shadow:none;visibility:visible;opacity:1;transform:none;transition:none}
  .nav-dd-panel::before{display:none}
  .nav-dd-list{padding:0}
  .nav-dd-list li+li{border-top:0}
  .nav.open .nav-links .nav-dd-panel a{justify-content:flex-start;gap:10px;width:100%;min-height:44px;padding:0;border:0;border-radius:0;background:transparent;font-size:17px;font-weight:500;line-height:1.3;letter-spacing:0;text-transform:none;color:#f3f1ea}
  .nav.open .nav-links .nav-dd-panel .nav-dd-feat{flex-direction:row;align-items:center;gap:0}
  .nav.open .nav-links .nav-dd-panel .nav-dd-all{color:#8c8b84}
  .nav-dd-feat .nav-dd-sub,.nav-dd-feat .ar{display:none}
  .nav-dd-feat b{order:1;margin:0;padding:0;font-size:inherit;font-weight:inherit;line-height:inherit;letter-spacing:inherit}
  .nav-dd-feat .cap{order:2;display:block;padding:0;font-size:inherit;line-height:inherit;letter-spacing:0;text-transform:lowercase;color:#8c8b84}
  .nav-dd-feat .cap::before{content:"\\00a0\\00b7\\00a0";display:inline;width:auto;height:auto;border-radius:0;background:none}
  .nav.open .nav-links .nav-sig{justify-content:flex-start;gap:12px}
}

@media (prefers-reduced-motion:reduce){
  .nav-dd-panel{transform:none !important;transition:none !important}
  .nav-dd-btn svg,.nav-dd-feat .ar,.nav-dd-feat:hover .ar{transition:none;transform:none}
  .nav-dd-btn[aria-expanded="true"] svg{transform:rotate(180deg)}
}


@media (min-width:1200px){.ft-bar{grid-template-columns:minmax(0,1.8fr) repeat(3,minmax(0,1fr)) minmax(0,1.2fr)}}
@media (min-width:900px) and (max-width:1199px){.ft-bar{grid-template-columns:repeat(4,minmax(0,1fr))}.ft-sig{grid-column:1/-1}}


.sr-only{position:absolute !important;width:1px !important;height:1px !important;margin:-1px !important;padding:0 !important;border:0 !important;overflow:hidden !important;clip:rect(0,0,0,0) !important;clip-path:inset(50%) !important;white-space:nowrap !important}

.crumbs{font-size:13px;line-height:1.35;color:var(--mu)}
.crumbs ol{display:flex;flex-wrap:wrap;align-items:center;margin:0;padding:0;list-style:none}
.crumbs li{display:inline-flex;align-items:center;min-width:0}
.crumbs li+li::before{content:"/";content:"/" / "";margin:0 10px;color:var(--mu)}
.crumbs a{position:relative;display:inline-flex;align-items:center;min-height:44px;color:var(--mu);text-decoration:none;transition:color .2s}

.crumbs a::after{content:"";position:absolute;top:0;bottom:0;left:-8px;right:-8px}
.crumbs a:hover{color:var(--fg);text-decoration:underline;text-decoration-color:var(--acx);text-underline-offset:4px}
.crumbs [aria-current="page"]{color:var(--fg)}


.nav-lang{display:inline-flex;align-items:center}
.nav-lang>a,.nav-lang>span{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0 6px;font-size:13px;font-weight:600;line-height:1;letter-spacing:.16em;text-transform:uppercase;text-decoration:none}
.nav-lang>*+*::before{content:"";position:absolute;left:0;top:50%;height:14px;margin-top:-7px;border-left:1px solid var(--ls)}
.nav-links .nav-lang>span{color:#f3f1ea}
.nav-links .nav-lang>a{color:#8c8b84}
.nav-links .nav-lang>a:hover{color:#f3f1ea;text-decoration:underline;text-decoration-color:var(--ac);text-decoration-thickness:1px;text-underline-offset:6px}
@media (max-width:899px){
  .nav.open .nav-links .nav-lang{align-self:flex-start;padding-top:4px}
  .nav.open .nav-links .nav-lang>a,.nav.open .nav-links .nav-lang>span{justify-content:center;min-width:56px;min-height:60px;font-size:13px;letter-spacing:.16em;border-bottom:0}
}
.nav-links>a,.nav-links .nav-dd-top,.nav-lang{white-space:nowrap}
@media (min-width:900px) and (max-width:1099px){.nav-links{gap:14px}.nav-links a{letter-spacing:.1em}.nav-lang>a,.nav-lang>span{min-width:40px}}
@media (min-width:1100px) and (max-width:1299px){.nav-links{gap:22px}}
@media (min-width:900px) and (max-width:1049px){.nav-links{gap:8px;left:calc(50% - var(--gt) + 6px)}.nav-links a{font-size:11.5px;letter-spacing:.06em}.nav-dd-btn{margin-left:-4px}.nav-lang>a,.nav-lang>span{min-width:34px;font-size:11.5px}}




.sp-hero{padding-top:clamp(28px,3.34vw,48px);padding-bottom:clamp(64px,6.67vw,96px)}
.sp-hero>.eb{margin-top:clamp(32px,3.34vw,48px)}
.sp-hero>.h1{max-width:18ch}
.sp-hero>.ld{max-width:50ch}
.sp-hero .btn-row{margin-top:48px}

.sp-part{display:inline-flex;flex-wrap:wrap;align-items:center;gap:10px 14px;min-height:44px;margin-top:40px;color:inherit;text-decoration:none}
.sp-part .tags{gap:8px}
.sp-part .tag{transition:border-color .2s}
.sp-part:hover .cap{color:var(--fg)}
.sp-part:hover .tag{border-color:var(--fg)}


.sp-banner{padding-bottom:calc(clamp(56px,6.67vw,96px) + 32px)}


.sp-plain .h2{max-width:14ch}
.sp-plain-p{align-self:end;max-width:52ch}
.sp-facts dd{color:var(--fg)}
.sp-facts .tx{color:var(--fg)}


.sp-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sp-q{padding:32px;border-radius:16px;border:1px solid var(--ln);background:var(--sf2)}
.sp-q p{max-width:28ch;font-size:clamp(22px,1.95vw,28px);font-weight:500;line-height:1.3;letter-spacing:-.01em;color:var(--fg);text-wrap:pretty}
@media (min-width:768px){.sp-q{min-height:200px}}
@media (max-width:767px){.sp-quotes{grid-template-columns:minmax(0,1fr)}.sp-q{padding:24px}}


.sp-inc-head .h2{max-width:18ch}
.sp-inc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:56px var(--gt)}
.sp-inc.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.sp-inc li{padding-top:24px;border-top:1px solid var(--ls)}
.sp-inc .h4{margin-top:20px}
.sp-inc .tx{margin-top:10px}
@media (max-width:1199px){.sp-inc,.sp-inc.c3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:639px){.sp-inc,.sp-inc.c3{grid-template-columns:minmax(0,1fr);row-gap:40px}}


.sp-how-h{align-self:start}
.sp-how-h .h2{max-width:12ch}
@media (min-width:1024px){.sp-how-h{position:sticky;top:112px}}


.sp-choose-head .h2{max-width:20ch}
.sp-choose{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gt)}
.sp-choose li{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:24px;padding:36px 0 40px;border-top:1px solid var(--ln)}
.sp-choose li:nth-last-child(-n+2){border-bottom:1px solid var(--ln)}
.sp-choose .cap{padding-top:8px;color:var(--acx);font-variant-numeric:tabular-nums}
.sp-choose .tx{margin-top:12px;max-width:46ch}
@media (max-width:767px){.sp-choose{grid-template-columns:minmax(0,1fr)}.sp-choose li:nth-last-child(2){border-bottom:0}.sp-choose li{padding:28px 0 32px;column-gap:16px}}



.sp-flsec{padding-top:0}
.sp-fl{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:48px clamp(48px,6.67vw,96px);padding:clamp(28px,4.45vw,64px);border-radius:16px;border:1px solid var(--ls);background:var(--sf)}
.sp-fl .h2{max-width:14ch}
.sp-fl .tx{max-width:44ch}
.sp-fl .lnk{margin-top:28px}
@media (max-width:1023px){.sp-fl{grid-template-columns:minmax(0,1fr)}}


.sp-stages{display:flex;flex-direction:column}
.sp-st{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) auto;column-gap:20px;align-items:start;padding:18px 0}
.sp-st::before,.sp-st::after{content:"";position:absolute;left:21.5px;width:1px;background:var(--ls)}
.sp-st::before{top:0;height:40px}
.sp-st::after{top:40px;bottom:0}
.sp-st:first-child::before,.sp-st:last-child::after{display:none}
.sp-st.on+.sp-st.on::before,.sp-st.on:has(+ .sp-st.on)::after{width:2px;left:21px;background:var(--acx)}
.sp-st .n{position:relative;z-index:1;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:1px solid var(--ls);background:var(--sf);font-size:13px;line-height:1;font-weight:600;letter-spacing:.06em;font-variant-numeric:tabular-nums;color:var(--mu)}
.sp-st .bd{padding-top:6px}
.sp-st .nm{font-size:clamp(22px,1.95vw,28px);line-height:1.15;font-weight:600;letter-spacing:-.01em;color:var(--mu)}
.sp-st .ln{margin-top:6px;font-size:17px;line-height:1.55;color:var(--mu)}
.sp-st .this{padding-top:15px;white-space:nowrap}
.sp-st.on .n{border-color:var(--ac);background:var(--ac);color:var(--ac-ink)}
.sp-st.on .nm,.sp-st.on .ln{color:var(--fg)}
.sp-st.on .this{color:var(--fg)}
@media (max-width:639px){
  .sp-st{grid-template-columns:44px minmax(0,1fr);column-gap:16px}
  .sp-st .this{grid-column:2;grid-row:1;padding:0 0 10px}
  .sp-st.on .bd{padding-top:0}
  .sp-st.on .n{grid-row:1 / span 2;align-self:start}
}


.sp-with{margin-top:clamp(48px,5vw,72px)}
.sp-sibs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}
.sp-sibs .svc{min-height:280px;padding:28px;gap:24px}
.sp-sibs .svc h3{margin-top:0;font-size:28px;line-height:1.1;letter-spacing:-.015em}
.sp-sibs .svc .sub{margin-top:12px;max-width:32ch;font-size:17px;line-height:1.5}
.sp-sibs .svc .disc{justify-content:flex-end}
.sp-sibs .ring{width:56px;height:56px}
.sp-sibs .ring svg{width:14px;height:14px}
@media (max-width:899px){.sp-sibs{grid-template-columns:minmax(0,1fr)}.sp-sibs .svc{min-height:240px;padding:24px}}


.sp-proof{padding-top:0}
.sp-proof-in{padding-top:clamp(56px,5.56vw,80px);border-top:1px solid var(--ln)}

.sp-proof-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);grid-template-rows:auto 1fr;grid-template-areas:"head card" "foot card";gap:40px clamp(32px,4.45vw,64px)}
.sp-proof-head{grid-area:head}
.sp-proof-head .h2{max-width:10ch}
.sp-pcard{grid-area:card;display:block;color:inherit;text-decoration:none}
.sp-pcard .ph{transition:border-color .3s}
.sp-pcard:hover .ph{border-color:var(--fg)}
.sp-prow{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-top:24px;padding-top:20px;border-top:1px solid var(--ln)}
.sp-pgo{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--ls);color:var(--fg);transition:background .3s,color .3s,border-color .3s}
.sp-pgo .ar{width:13px;height:13px}
.sp-pcard:hover .sp-pgo{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.sp-proof-foot{grid-area:foot;align-self:end;display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.sp-proof-foot .sm{max-width:32ch}
@media (max-width:899px){.sp-proof-g{grid-template-columns:minmax(0,1fr);grid-template-rows:none;grid-template-areas:"head" "card" "foot";row-gap:40px}}


.sp-faq-head .h2{max-width:14ch}
.faq .ans a{color:var(--fg);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}


.sp-cta{text-align:center}
.sp-cta .eb{justify-content:center}
.sp-cta .h2{max-width:18ch;margin-left:auto;margin-right:auto}
.sp-cta .btn-row{justify-content:center}

@media (prefers-reduced-motion:reduce){.sp-part .tag,.sp-pcard .ph{transition:none}}

[id]{scroll-margin-top:84px}
`;

const NAV = `<header class="nav">
  <a class="nav-logo" href="/" aria-label="Disruptive Dodo, home"><img src="/uploads/kmkF0MdsNjve7VQIBhT9w-dd-logo-white.png" alt="Disruptive Dodo" width="176" height="37"></a>
  <div class="nav-mid"><i class="cmk cmk-t"></i><i class="cmk cmk-b"></i>
    <nav class="nav-links" id="nav-links" aria-label="Main">
      <div class="nav-dd">
        <a class="nav-dd-top" href="/services">Services</a>
        <button class="nav-dd-btn" type="button" aria-expanded="false" aria-controls="nav-dd-panel" aria-label="Show the services"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="nav-dd-panel" id="nav-dd-panel">
          <a class="nav-dd-feat" href="/fledge"><span class="cap">Our signature system</span><b>Fledge</b><span class="nav-dd-sub">Your full marketing system, built and run by one team.</span><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
          <ul class="nav-dd-list">
            <li><a href="/services/web-design">Websites and SEO</a></li>
            <li><a href="/services/social-media-management">Social media</a></li>
            <li><a href="/services/facebook-google-ads">Paid ads</a></li>
            <li><a href="/services/marketing-automation-crm">Automation and CRM</a></li>
            <li><a href="/services/ai-chatbots">AI implementation</a></li>
            <li><a href="/services/branding-logo-design">Branding</a></li>
            <li><a class="nav-dd-all" href="/services">All services</a></li>
          </ul>
        </div>
      </div>
      <a class="nav-sig" href="/fledge"><i class="nav-sig-dot" aria-hidden="true"></i>Fledge</a>
      <a href="/work">Work</a>
      <a href="/about">About</a>
    </nav>
  </div>
  <a class="nav-act" href="/contact"><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Contact<i class="cmk cmk-t"></i><i class="cmk cmk-b"></i></a>
  <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
</header>`;

const FOOTER = `<footer class="ft">
  <p class="eb"><span class="dot"></span>Prefer email?</p>
  <h2 class="dsp ft-h">Do it once,<br>do it right</h2>
  <p class="ld ft-b">Built properly the first time. One team, no wasted spend, nothing to redo later. Email us and let's get started.</p>
  <a class="ft-mail" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
  <div class="ft-bar">
    <div class="ft-sig"><img src="/uploads/kmkF0MdsNjve7VQIBhT9w-dd-logo-white.png" alt="Disruptive Dodo" width="266" height="56"><p class="cap">Built in Mauritius. Made to grow.</p></div>
    <nav class="ft-col" aria-label="Services"><p class="cap">Services</p><a href="/fledge">Fledge</a><a href="/services/web-design">Websites and SEO</a><a href="/services/social-media-management">Social media</a><a href="/services/facebook-google-ads">Paid ads</a><a href="/services/marketing-automation-crm">Automation and CRM</a><a href="/services/ai-chatbots">AI implementation</a><a href="/services/branding-logo-design">Branding</a></nav>
    <nav class="ft-col" aria-label="Pages"><p class="cap">Pages</p><a href="/">Home</a><a href="/work">Work</a><a href="/services">Services</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
    <nav class="ft-col" aria-label="Social"><p class="cap">Follow</p><a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener">LinkedIn</a><a href="https://instagram.com" target="_blank" rel="noreferrer noopener">Instagram</a><a href="https://wa.me/23058065315" target="_blank" rel="noreferrer noopener">WhatsApp</a></nav>
    <div class="ft-col"><p class="cap">© 2026 Disruptive Dodo</p><a href="/privacy">Privacy and terms</a></div>
  </div>
</footer>`;

const SERVICE_PATHS = ["/services/web-design", "/services/social-media-management", "/services/facebook-google-ads", "/services/marketing-automation-crm", "/services/ai-chatbots", "/services/branding-logo-design"];

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

// Nav behaviour from the design's nav.js, adapted to run inside a shadow root.
function navBehaviour(R) {
  const nav = R.querySelector('.nav');
  if (!nav) return;
  const links = nav.querySelector('.nav-links');
  const burger = nav.querySelector('.burger');
  const dd = nav.querySelector('.nav-dd');
  const ddBtn = dd ? dd.querySelector('.nav-dd-btn') : null;
  const panel = dd ? dd.querySelector('.nav-dd-panel') : null;
  const CLOSE_DELAY = 150;
  const desktopMq = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  const isDesktop = () => (desktopMq ? desktopMq.matches : true);
  const isEsc = (e) => e.key === 'Escape' || e.key === 'Esc';
  const active = () => R.activeElement || document.activeElement;
  const target = (e) => (e.composedPath ? e.composedPath()[0] : e.target);

  nav.classList.add('nav-js');

  let pointerAt = 0;
  document.addEventListener('pointerdown', () => { pointerAt = Date.now(); }, true);
  function keyboardFocus(el) {
    try { return el.matches(':focus-visible'); } catch (err) { return Date.now() - pointerAt > 600; }
  }
  function focusQuietly(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
  }

  const menuOpen = () => nav.classList.contains('open');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (burger) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', (e) => {
      const open = !menuOpen();
      setMenu(open);
      if (open && e.detail === 0 && links) focusQuietly(links.querySelector('a[href]'));
    });
  }

  let ddOpen = false, openedBy = '', hovering = false, closeTimer = 0, quietFocus = false;
  function place() {
    if (!panel) return;
    panel.style.left = '';
    if (!isDesktop()) return;
    const vw = document.documentElement.clientWidth, m = 16;
    const r = panel.getBoundingClientRect();
    let shift = 0;
    if (r.right > vw - m) shift = (vw - m) - r.right;
    if (r.left + shift < m) shift = m - r.left;
    if (shift) panel.style.left = (parseFloat(getComputedStyle(panel).left) || 0) + shift + 'px';
  }
  function setDd(open, by) {
    if (!dd) return;
    clearTimeout(closeTimer); closeTimer = 0;
    openedBy = open ? (by || openedBy || 'click') : '';
    if (open === ddOpen) return;
    ddOpen = open;
    dd.classList.toggle('open', open);
    if (ddBtn) ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) place();
  }
  function closeDdSoon() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      closeTimer = 0;
      if (hovering) return;
      const a = active();
      if (dd.contains(a) && keyboardFocus(a)) return;
      setDd(false);
    }, CLOSE_DELAY);
  }
  if (dd && ddBtn && panel) {
    ddBtn.setAttribute('aria-expanded', 'false');
    dd.addEventListener('mouseenter', () => {
      hovering = true;
      if (!isDesktop()) return;
      clearTimeout(closeTimer); closeTimer = 0;
      if (!ddOpen) setDd(true, 'hover');
    });
    dd.addEventListener('mouseleave', () => {
      hovering = false;
      if (!isDesktop() || !ddOpen || openedBy !== 'hover') return;
      closeDdSoon();
    });
    dd.addEventListener('focusin', (e) => {
      if (!isDesktop() || quietFocus || ddOpen) return;
      if (keyboardFocus(e.target)) setDd(true, 'focus');
    });
    dd.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!ddOpen || !isDesktop() || !document.hasFocus()) return;
        if (dd.contains(active()) || hovering) return;
        setDd(false);
      }, 0);
    });
    ddBtn.addEventListener('click', (e) => {
      if (!ddOpen) { setDd(true, 'click'); return; }
      if (openedBy === 'hover' && e.detail !== 0) { openedBy = 'click'; return; }
      setDd(false);
    });
    window.addEventListener('resize', () => { if (ddOpen) place(); });
  }

  document.addEventListener('keydown', (e) => {
    if (!isEsc(e) || e.defaultPrevented) return;
    if (ddOpen) {
      const a = active();
      const refocus = !a || a === document.body || dd.contains(a);
      setDd(false);
      if (refocus) { quietFocus = true; focusQuietly(ddBtn); quietFocus = false; }
      e.preventDefault();
      return;
    }
    if (menuOpen()) { setMenu(false); focusQuietly(burger); e.preventDefault(); }
  }, true);

  document.addEventListener('click', (e) => {
    const t = target(e);
    if (ddOpen && !(t && dd.contains(t))) setDd(false);
    if (menuOpen() && !(t && nav.contains(t))) setMenu(false);
  });

  if (desktopMq) {
    const onChange = () => {
      if (isDesktop()) setMenu(false); else setDd(false);
      if (panel) panel.style.left = '';
    };
    if (desktopMq.addEventListener) desktopMq.addEventListener('change', onChange);
    else if (desktopMq.addListener) desktopMq.addListener(onChange);
  }
}

function markCurrent(R, page) {
  const here = page.path;
  R.querySelectorAll('.nav a[href]').forEach((a) => {
    if (a.getAttribute('href') === here && !a.classList.contains('nav-dd-all')) a.setAttribute('aria-current', 'page');
  });
  // the case study sits under Work
  if (here.indexOf('/work/') === 0) {
    const w = R.querySelector('.nav-links > a[href="/work"]');
    if (w) w.setAttribute('aria-current', 'page');
  }
  // a service page marks the Services menu as the current section
  if (page.section === 'services' || SERVICE_PATHS.indexOf(here) > -1) {
    const top = R.querySelector('.nav-dd-top');
    if (top) top.classList.add('is-sec');
  }
}

// In-page links (#inside) cannot reach ids inside a shadow root on their own.
function hashLinks(R) {
  const go = (id, smooth) => {
    const el = id && R.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    return true;
  };
  R.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (go(id, true)) { e.preventDefault(); history.replaceState(null, '', '#' + id); }
  });
  if (location.hash) requestAnimationFrame(() => go(decodeURIComponent(location.hash.slice(1)), false));
}

const DD = (window.__DD = window.__DD || { pages: {} });

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
    R.innerHTML = '<style>' + CSS + '\n' + (page.css || '') + '</style><div class="r">' + NAV + page.html + FOOTER + '</div>';
    markCurrent(R, page);
    navBehaviour(R);
    hashLinks(R);
    if (typeof page.init === 'function') page.init(R);
  } catch (e) { console.error('[dd] mount failed', e); }
};

(function boot() {
  if (document.getElementById('dd-root')) { DD.mount(); return; }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => DD.mount(), { once: true }); return; }
  let tries = 0;
  const iv = setInterval(() => {
    if (document.getElementById('dd-root') || tries++ > 40) { clearInterval(iv); DD.mount(); }
  }, 100);
})();
