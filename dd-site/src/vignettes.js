// Service vignettes: small live UI films that show what each service does.
// Black and white, glass panels, one loop each. Positions are % of a 21:9 stage,
// sizes are cqw (1% of the stage width), so every vignette scales as one picture.
// Each exports html (stage markup), css (layout only) and spec (the timeline, see
// motion() in dd-core). Microcopy is short, plain English, and makes no claims.
const P = (l, t, w, h) => `style="left:${l}%;top:${t}%${w != null ? `;width:${w}%` : ''}${h != null ? `;height:${h}%` : ''}"`;
const CUR = `<svg class="v-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6 1.6L10 19z" fill="#f3f1ea" stroke="#0c0c0e" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const CHECK = `<svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const fadeIn = (t0, t1, y = '1.5cqw') => [t0, t1, { opacity: 0, transform: `translateY(${y}) scale(.97)` }, { opacity: 1, transform: 'none' }, 'sg'];
const grow = (t0, t1) => [t0, t1, { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }];
const pop = (t0, t1) => [t0, t1, { opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }, 'sp'];
const GROUP = (D) => ['.v-g', 0, [[0, 500, { opacity: 0 }, { opacity: 1 }, 'io'], [D - 700, D - 100, { opacity: 1 }, { opacity: 0 }, 'io']]];

// ---------- 1. Websites: a site builds itself, is found on Google, brings an enquiry
const web = {
  label: 'A website being designed, found on Google, and bringing in an enquiry',
  css: `
.vg-web .br{left:5%;top:9%;width:58%;height:82%}
.vg-web .dots{display:flex;gap:.6cqw}.vg-web .dots i{width:.8cqw;height:.8cqw;border-radius:50%;background:rgba(243,241,234,.25)}
.vg-web .url{height:2.4cqw;padding:0 1.2cqw;border-radius:2cqw;background:rgba(255,255,255,.07);display:flex;align-items:center;font-size:.95cqw;color:rgba(243,241,234,.7)}
.vg-web .img{background-image:url(/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp)}
.vg-web .tile{border-radius:.8cqw;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.vg-web .phone{left:68%;top:6%;width:15%;height:88%;border-radius:2.4cqw;padding:0}
.vg-web .notch{left:73.5%;top:8.4%;width:6%;height:3%;border-radius:2cqw;background:#0a0a0c}
.vg-web .q{left:39%;top:56%;width:29%;height:31%;padding:1.4cqw}
.vg-web .g{width:2.2cqw;height:2.2cqw;border-radius:50%;border:2px solid #f3f1ea;flex:none}
.vg-web .type{font-size:1.15cqw;white-space:nowrap}
.vg-web .one{width:2.4cqw;height:2.4cqw;border-radius:50%;background:#f3f1ea;color:#0c0c0e;display:grid;place-items:center;font-size:1.1cqw;font-weight:600}
.vg-web .toast{left:62%;top:68%;width:30%;padding:1.2cqw 1.4cqw}
.vg-web .cur{left:14.6%;top:68.5%}
@media (max-width:767px){.vg-web{--fx:-3%}}`,
  html: `<div class="v-g">
    <div class="v-win br"></div>
    <div class="dots" ${P(7.5, 14)}><i></i><i></i><i></i></div>
    <div class="url" ${P(20, 12.6, 26)}>yourbusiness.mu</div>
    <span class="v-bar hi nb" ${P(9, 24, 6)}></span><span class="v-bar nb" ${P(42, 24, 4)}></span><span class="v-bar nb" ${P(48, 24, 4)}></span><span class="v-bar nb" ${P(54, 24, 4)}></span>
    <span class="v-bar hi th hb" ${P(9, 36, 23)}></span><span class="v-bar hi th hb" ${P(9, 44.5, 17)}></span>
    <span class="v-bar sb" ${P(9, 55, 22)}></span><span class="v-bar sb" ${P(9, 59.5, 15)}></span>
    <span class="v-pill btn" ${P(9, 66)}>Book a call</span>
    <div class="v-img img" ${P(36, 33, 23, 42)}></div>
    <div class="tile rw" ${P(9, 79, 15, 7)}></div><div class="tile rw" ${P(25.5, 79, 15, 7)}></div><div class="tile rw" ${P(42, 79, 17, 7)}></div>
    <div class="v-win phone"></div><div class="notch"></div>
    <div class="v-img img pp" ${P(69.5, 15, 12, 25)}></div>
    <span class="v-bar hi pp" ${P(69.5, 45, 9)}></span><span class="v-bar pp" ${P(69.5, 50, 7)}></span>
    <span class="v-pill pp" style="left:69.5%;top:56%;height:2cqw;font-size:.8cqw">Book a call</span>
    <div class="tile pp" ${P(69.5, 66, 12, 9)}></div><div class="tile pp" ${P(69.5, 77, 12, 9)}></div>
    <div class="v-win v-solid q">
      <div class="v-row"><span class="g"></span><span class="type">web design mauritius</span></div>
      <div class="v-row" style="margin-top:2.2cqw"><span class="one">1</span><div style="display:grid;gap:.7cqw;width:100%"><span class="v-bar hi rb" style="width:80%"></span><span class="v-bar rb" style="width:55%"></span></div></div>
    </div>
    <div class="v-win v-solid toast"><div class="v-row"><span class="v-dot"></span><span class="v-t">New enquiry</span></div><p class="v-s" style="margin-top:.5cqw">From your website, just now</p></div>
    <div class="cur">${CUR}</div>
  </div>`,
  spec: (D = 9000) => ({
    D, still: 0.8, tracks: [
      GROUP(D),
      ['.br', 0, [fadeIn(0, 900, '2cqw')]],
      ['.dots, .url', 120, [fadeIn(400, 1000, '.6cqw')]],
      ['.nb', 70, [grow(600, 1300)]],
      ['.hb', 140, [grow(850, 1700)]],
      ['.sb', 110, [grow(1250, 2000)]],
      ['.btn', 0, [pop(1700, 2300), [5900, 6060, {}, { transform: 'scale(.92)' }, 'io'], [6060, 6500, {}, { transform: 'scale(1)' }, 'sp']]],
      ['.img:not(.pp)', 0, [[1100, 2300, { clipPath: 'inset(0 0 100% 0 round 1cqw)' }, { clipPath: 'inset(0 0 0% 0 round 1cqw)' }]]],
      ['.rw', 90, [fadeIn(1900, 2600, '1cqw')]],
      ['.phone, .notch', 0, [fadeIn(1000, 1900, '3cqw')]],
      ['.pp', 80, [fadeIn(1500, 2200, '1cqw')]],
      ['.q', 0, [fadeIn(2700, 3300, '2cqw')]],
      ['.type', 0, [[3100, 4500, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }, 'steps(20, end)']]],
      ['.one', 0, [pop(4600, 5100)]],
      ['.rb', 110, [grow(4700, 5400)]],
      ['.cur', 0, [[4900, 5100, { opacity: 0, transform: 'translate(26cqw,14cqw)' }, { opacity: 1, transform: 'translate(26cqw,14cqw)' }], [5100, 5900, {}, { transform: 'translate(0,0)' }, 'io'], [5900, 6060, {}, { transform: 'translate(0,0) scale(.85)' }, 'io'], [6060, 6300, {}, { transform: 'translate(0,0) scale(1)' }], [6900, 7400, {}, { opacity: 0, transform: 'translate(4cqw,6cqw)' }, 'io']]],
      ['.toast', 0, [[6200, 6800, { opacity: 0, transform: 'translateY(1.6cqw) scale(.95)' }, { opacity: 1, transform: 'none' }, 'sp']]],
    ],
  }),
};

// ---------- 2. Social media: a month of posts fills the grid
const socialTiles = [1, 6, 3, 0, 2, 5, 4, 0, 6];
const IMG = ['', '1qEcUtH4lHDuqfDdPiAdS-svc-01', 'Y3s6CQVkiDaxrn8gIgp9C-svc-02', 'd-Q_kvQRPH8ATZhTFd1Yt-svc-03', 'scHUo4gyKrkiEYNTf-8EU-svc-04', 'nCS7Kte6VC1XCoepoHERN-svc-05', 'EmxO1Byhcnx4qSVf0rF7I-svc-06'];
const social = {
  label: 'A month of social media posts being planned and published',
  css: `
.vg-soc .phn{left:9%;top:5%;width:19%;height:90%;border-radius:2.6cqw}
.vg-soc .post{background-image:url(/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp)}
.vg-soc .heart{left:16.6%;top:33%;width:4cqw;height:4cqw;color:#f3f1ea;filter:drop-shadow(0 .5cqw 1cqw rgba(0,0,0,.6))}
.vg-soc .tl{width:9.4cqw;height:9.4cqw;border-radius:1cqw;background:linear-gradient(140deg,#2b2b30,#141417);border:1px solid rgba(255,255,255,.08);background-size:cover;background-position:center}
.vg-soc .tl.txt{display:grid;align-content:end;padding:1cqw;gap:.5cqw}
.vg-soc .cal{left:68%;top:8%;width:25%;height:50%;padding:1.4cqw}
.vg-soc .days{display:grid;grid-template-columns:repeat(7,1fr);gap:.7cqw;margin-top:1.4cqw}
.vg-soc .days i{aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.08)}
.vg-soc .days i.on{background:#f3f1ea}
.vg-soc .plat{left:68%;top:63%;width:25%;height:29%;padding:1.2cqw 1.4cqw;display:grid;gap:.9cqw}
.vg-soc .ck{width:1.8cqw;height:1.8cqw;border-radius:50%;background:#f3f1ea;color:#0c0c0e;padding:.3cqw;flex:none}
@media (max-width:767px){.vg-soc{--fx:-8%}}`,
  html: () => {
    const tiles = socialTiles.map((n, i) => {
      const l = 33 + (i % 3) * 10.4, t = 9 + Math.floor(i / 3) * 27;
      const hl = i === 4 ? ' hl' : '';
      return n ? `<div class="tl${hl}" style="left:${l}%;top:${t}%;background-image:url(/uploads/${IMG[n]}.webp)"></div>`
        : `<div class="tl txt${hl}" style="left:${l}%;top:${t}%"><span class="v-bar hi" style="width:80%"></span><span class="v-bar" style="width:55%"></span></div>`;
    }).join('');
    const days = Array.from({ length: 28 }, (_, i) => `<i class="${[1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26].includes(i) ? 'on' : ''}"></i>`).join('');
    return `<div class="v-g">
    <div class="v-win phn"></div>
    <div class="v-row ph-h" ${P(10.6, 9.5)}><span class="v-av" style="width:2.2cqw;height:2.2cqw"></span><span class="v-bar hi" style="width:5cqw"></span></div>
    <div class="v-img post" ${P(10.6, 18, 15.8, 40)}></div>
    <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.6 4 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.7 1.2-1.6 2.7-2.7 4.7-2.7 3.3 0 5.9 3.1 4.6 6.7-1.8 4.7-9.3 9.3-9.3 9.3z" fill="currentColor"/></svg>
    <div class="v-row ph-a" ${P(10.6, 62)}><span class="v-bar hi" style="width:3cqw"></span><span class="v-bar" style="width:3cqw"></span><span class="v-bar" style="width:3cqw"></span></div>
    <span class="v-bar ph-c hi" ${P(10.6, 69, 12)}></span><span class="v-bar ph-c" ${P(10.6, 73.5, 14)}></span><span class="v-bar ph-c" ${P(10.6, 78, 9)}></span>
    ${tiles}
    <div class="v-win v-solid cal"><div class="v-row" style="justify-content:space-between"><span class="v-t">This month</span><span class="v-s">Planned</span></div><div class="days">${days}</div></div>
    <div class="v-win v-solid plat">
      <div class="v-row"><span class="ck">${CHECK}</span><span class="v-t">Instagram</span></div>
      <div class="v-row"><span class="ck">${CHECK}</span><span class="v-t">Facebook</span></div>
      <div class="v-row"><span class="ck">${CHECK}</span><span class="v-t">LinkedIn</span></div>
    </div>
  </div>`;
  },
  spec: (D = 9000) => ({
    D, still: 0.75, tracks: [
      GROUP(D),
      ['.phn', 0, [fadeIn(0, 900, '3cqw')]],
      ['.ph-h, .post, .ph-a, .ph-c', 80, [fadeIn(400, 1100, '1cqw')]],
      ['.tl', 60, [[900, 1600, { opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'scale(1)' }, 'sp']]],
      ['.cal', 0, [fadeIn(1500, 2100, '2cqw')]],
      ['.days i.on', 70, [[2100, 2500, { transform: 'scale(0)' }, { transform: 'scale(1)' }, 'sp']]],
      ['.plat', 0, [fadeIn(2600, 3200, '2cqw')]],
      ['.ck', 220, [pop(3100, 3500)]],
      ['.heart', 0, [[4200, 4550, { opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.25)' }, 'sp'], [4550, 4800, {}, { transform: 'scale(1)' }], [5600, 6000, {}, { opacity: 0, transform: 'scale(1.1)' }]]],
      ['.tl.hl', 0, [[6000, 6400, { transform: 'scale(1)' }, { transform: 'scale(1.06)' }, 'sp'], [6400, 7200, {}, { transform: 'scale(1)' }, 'io']]],
    ],
  }),
};

// ---------- 3. Paid ads: an ad goes live and the curves move the right way
const ads = {
  label: 'An ad going live while enquiries rise and the cost per enquiry falls',
  css: `
.vg-ads .ad{left:5%;top:8%;width:24%;height:84%;padding:1.4cqw}
.vg-ads .adimg{background-image:url(/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp)}
.vg-ads .chart{left:33%;top:8%;width:40%;height:58%;padding:1.4cqw 1.6cqw}
.vg-ads .chart svg{position:absolute;left:4%;right:4%;bottom:10%;width:92%;height:62%}
.vg-ads .grid line{stroke:rgba(255,255,255,.07);stroke-width:1}
.vg-ads .ln{fill:none;stroke:#f3f1ea;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.vg-ads .area{fill:url(#vgAdsFill)}
.vg-ads .pt{transform-box:fill-box;transform-origin:center}
.vg-ads .kpi{width:19.4%;height:22%;top:70%;padding:1.2cqw 1.4cqw}
.vg-ads .arw{width:1.6cqw;height:1.6cqw;flex:none}
.vg-ads .meter{position:absolute;left:1.4cqw;right:1.4cqw;bottom:1.4cqw;height:.75cqw;border-radius:1cqw;background:rgba(255,255,255,.08);overflow:hidden}
.vg-ads .meter i{position:absolute;inset:0;border-radius:inherit;background:#f3f1ea;transform-origin:0 50%}
.vg-ads .wk{left:77%;top:8%;width:18%;height:84%;padding:1.4cqw}
.vg-ads .bars{position:absolute;left:1.4cqw;right:1.4cqw;bottom:2.4cqw;height:60%;display:flex;align-items:flex-end;gap:.9cqw}
.vg-ads .bars i{flex:1;border-radius:.5cqw .5cqw .2cqw .2cqw;background:linear-gradient(#f3f1ea,rgba(243,241,234,.35));transform-origin:50% 100%}
@media (max-width:767px){.vg-ads{--fx:-40%}}`,
  html: `<div class="v-g">
    <div class="v-win ad">
      <div class="v-row"><span class="v-av"></span><div style="display:grid;gap:.5cqw"><span class="v-bar hi" style="width:7cqw"></span><span class="v-s">Sponsored</span></div></div>
      <div class="v-img adimg" style="position:relative;margin-top:1.4cqw;height:52%"></div>
      <span class="v-bar hi" style="margin-top:1.4cqw;width:85%"></span><span class="v-bar" style="margin-top:.7cqw;width:60%"></span>
      <span class="v-pill adcta" style="position:absolute;left:1.4cqw;right:1.4cqw;bottom:1.4cqw">Book now</span>
    </div>
    <div class="v-win chart"><div class="v-row" style="justify-content:space-between"><span class="v-t">Enquiries</span><span class="v-s">Last 30 days</span></div>
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="vgAdsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f1ea" stop-opacity=".22"/><stop offset="1" stop-color="#f3f1ea" stop-opacity="0"/></linearGradient></defs>
        <g class="grid"><line x1="0" y1="40" x2="400" y2="40"/><line x1="0" y1="80" x2="400" y2="80"/><line x1="0" y1="120" x2="400" y2="120"/></g>
        <path class="area" d="M0 140 C40 136 60 128 90 124 S150 120 180 104 S240 92 270 70 S330 44 360 34 L400 22 L400 160 L0 160 Z"/>
        <path class="ln" pathLength="1" stroke-dasharray="1" d="M0 140 C40 136 60 128 90 124 S150 120 180 104 S240 92 270 70 S330 44 360 34 L400 22"/>
        <circle class="pt" cx="400" cy="22" r="5" fill="#f3f1ea"/>
      </svg></div>
    <div class="v-win v-solid kpi" style="left:33%"><div class="v-row"><svg class="arw" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="#f3f1ea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="v-t">Enquiries</span></div><span class="meter"><i class="up"></i></span></div>
    <div class="v-win v-solid kpi" style="left:53.6%"><div class="v-row"><svg class="arw" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" fill="none" stroke="#f3f1ea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="v-t">Cost per enquiry</span></div><span class="meter"><i class="dn"></i></span></div>
    <div class="v-win wk"><span class="v-t">This week</span><div class="bars"><i style="height:38%"></i><i style="height:52%"></i><i style="height:46%"></i><i style="height:68%"></i><i style="height:74%"></i><i style="height:88%"></i><i style="height:100%"></i></div></div>
  </div>`,
  spec: (D = 9000) => ({
    D, still: 0.78, tracks: [
      GROUP(D),
      ['.ad', 0, [fadeIn(0, 900, '3cqw')]],
      ['.adimg', 0, [[300, 1300, { clipPath: 'inset(0 0 100% 0 round 1cqw)' }, { clipPath: 'inset(0 0 0% 0 round 1cqw)' }]]],
      ['.adcta', 0, [pop(1100, 1600), [2200, 2350, {}, { transform: 'scale(.94)' }, 'io'], [2350, 2700, {}, { transform: 'scale(1)' }, 'sp']]],
      ['.chart', 0, [fadeIn(700, 1500, '2cqw')]],
      ['.ln', 0, [[1600, 4200, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 'io']]],
      ['.area', 0, [[2600, 4400, { opacity: 0 }, { opacity: 1 }, 'io']]],
      ['.pt', 0, [pop(4100, 4500)]],
      ['.kpi', 140, [fadeIn(1300, 2000, '2cqw')]],
      ['.up', 0, [[2400, 4600, { transform: 'scaleX(.18)' }, { transform: 'scaleX(.82)' }, 'io']]],
      ['.dn', 0, [[2400, 4600, { transform: 'scaleX(.86)' }, { transform: 'scaleX(.34)' }, 'io']]],
      ['.wk', 0, [fadeIn(1000, 1800, '2cqw')]],
      ['.bars i', 70, [[1900, 2700, { transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }, 'sp']]],
    ],
  }),
};

// ---------- 4. Automation and CRM: one lead travels the pipeline to Won
const crm = {
  label: 'A new enquiry moving through a sales pipeline until the sale is won',
  css: `
.vg-crm .board{left:4%;top:7%;width:63%;height:86%}
.vg-crm .colh{width:13.6%;top:12%;display:flex;justify-content:space-between;align-items:center}
.vg-crm .lane{width:13.6%;top:20%;height:68%;border-radius:1cqw;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.08)}
.vg-crm .cd{width:13.6%;padding:1cqw;border-radius:1cqw;background:#1b1b20;border:1px solid rgba(255,255,255,.1);box-shadow:0 1cqw 2cqw -1cqw rgba(0,0,0,.8);display:grid;gap:.6cqw}
.vg-crm .cd.pri{background:#f3f1ea;color:#0c0c0e;z-index:3}
.vg-crm .cd.pri .v-s{color:#62615b}
.vg-crm .won{left:63.2%;top:24.4%;z-index:4;height:2cqw;font-size:.85cqw;background:#0c0c0e;color:#f3f1ea;padding:0 .9cqw}
.vg-crm .alert{left:70%;top:9%;width:26%;padding:1.2cqw 1.4cqw}
.vg-crm .fu{left:70%;top:40%;width:26%;padding:1.2cqw 1.4cqw;display:grid;gap:1cqw}
.vg-crm .ck{width:1.8cqw;height:1.8cqw;border-radius:50%;background:#f3f1ea;color:#0c0c0e;padding:.3cqw;flex:none}
@media (max-width:767px){.vg-crm{--fx:-6%}}`,
  html: () => {
    const cols = ['New', 'Contacted', 'Quote sent', 'Won'];
    const L = (i) => 6 + i * 15.2;
    const heads = cols.map((c, i) => `<div class="colh" style="left:${L(i)}%"><span class="v-t">${c}</span><span class="v-s">${[3, 2, 2, 1][i]}</span></div><div class="lane" style="left:${L(i)}%"></div>`).join('');
    const card = (i, t, name, cls = '') => `<div class="cd ${cls}" style="left:${L(i)}%;top:${t}%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">${name}</span></div><span class="v-bar" style="width:80%"></span></div>`;
    return `<div class="v-g">
    <div class="v-win board"></div>
    ${heads}
    ${card(0, 40, 'Jean', 'st')}${card(0, 55, 'Aisha', 'st')}${card(1, 23, 'Kevin', 'st')}${card(1, 38, 'Marie', 'st')}${card(2, 23, 'Ravi', 'st')}${card(2, 38, 'Sophie', 'st')}${card(3, 38, 'Leo', 'st')}
    <div class="cd pri" style="left:${L(0)}%;top:23%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Priya</span></div><span class="v-s">Villa rental</span></div>
    <span class="v-pill won">Won</span>
    <div class="v-win v-solid alert"><div class="v-row"><span class="v-dot"></span><span class="v-t">New enquiry on WhatsApp</span></div><p class="v-s" style="margin-top:.6cqw">Priya wants a villa for June</p></div>
    <div class="v-win v-solid fu"><span class="v-t">Follow-up</span>
      <div class="v-row fr"><span class="ck">${CHECK}</span><span class="v-s" style="color:#f3f1ea">Reply sent in 2 minutes</span></div>
      <div class="v-row fr"><span class="ck">${CHECK}</span><span class="v-s" style="color:#f3f1ea">Quote sent</span></div>
      <div class="v-row fr"><span class="ck">${CHECK}</span><span class="v-s" style="color:#f3f1ea">Reminder after 2 days</span></div>
    </div>
  </div>`;
  },
  spec: (D = 10000) => {
    const step = 15.2 * 21 / 21; // one lane = 15.2% of the stage = 15.2cqw
    const at = (n) => `translate(${(step * n).toFixed(1)}cqw,${n ? '-.6cqw' : '0'}) scale(${n ? 1.04 : 1})`;
    const rest = (n) => `translate(${(step * n).toFixed(1)}cqw,0) scale(1)`;
    return {
      D, still: 0.8, tracks: [
        GROUP(D),
        ['.board', 0, [fadeIn(0, 900, '2cqw')]],
        ['.colh, .lane', 60, [fadeIn(300, 900, '.8cqw')]],
        ['.cd.st', 70, [fadeIn(700, 1300, '1cqw')]],
        ['.alert', 0, [fadeIn(1200, 1800, '2cqw')]],
        ['.cd.pri', 0, [[1600, 2200, { opacity: 0, transform: 'translate(0,0) scale(.8)' }, { opacity: 1, transform: rest(0) }, 'sp'],
          [3000, 3500, {}, { transform: at(0.5) }, 'i'], [3500, 3950, {}, { transform: rest(1) }, 'sg'],
          [4900, 5400, {}, { transform: at(1.5) }, 'i'], [5400, 5850, {}, { transform: rest(2) }, 'sg'],
          [6800, 7300, {}, { transform: at(2.5) }, 'i'], [7300, 7750, {}, { transform: rest(3) }, 'sg']]],
        ['.fu', 0, [fadeIn(2600, 3200, '2cqw')]],
        ['.fr', 0, []],
        ['.fr:nth-of-type(1)', 0, [fadeIn(3700, 4200, '.6cqw')]],
        ['.fr:nth-of-type(2)', 0, [fadeIn(5600, 6100, '.6cqw')]],
        ['.fr:nth-of-type(3)', 0, [fadeIn(7000, 7500, '.6cqw')]],
        ['.won', 0, [pop(7800, 8300)]],
      ],
    };
  },
};

// ---------- 5. AI: the assistant answers and books, at any hour
const ai = {
  label: 'An AI assistant answering a customer on WhatsApp and booking a visit',
  css: `
.vg-ai .phn{left:38%;top:3%;width:24%;height:94%;border-radius:2.8cqw}
.vg-ai .hdr{left:39.5%;top:7%;width:21%;padding-bottom:1cqw;border-bottom:1px solid rgba(255,255,255,.08)}
.vg-ai .onl{color:rgba(243,241,234,.55);font-size:.85cqw}
.vg-ai .bub{max-width:17cqw;padding:.9cqw 1.1cqw;border-radius:1.4cqw;font-size:1.02cqw;line-height:1.35;white-space:normal}
.vg-ai .cu{left:40%;background:rgba(255,255,255,.09);border-bottom-left-radius:.4cqw}
.vg-ai .bo{right:40%;background:#f3f1ea;color:#0c0c0e;border-bottom-right-radius:.4cqw;text-align:left}
.vg-ai .typ{right:40%;display:flex;gap:.4cqw;padding:1cqw 1.2cqw;border-radius:1.4cqw;background:#f3f1ea}
.vg-ai .typ i{width:.6cqw;height:.6cqw;border-radius:50%;background:#0c0c0e;opacity:.5}
.vg-ai .bk{left:6%;top:30%;width:26%;padding:1.4cqw}
.vg-ai .tm{left:68%;top:52%;width:26%;padding:1.4cqw}
.vg-ai .cal{width:3.4cqw;height:3.4cqw;border-radius:.8cqw;background:#f3f1ea;color:#0c0c0e;display:grid;place-items:center;font-weight:600;font-size:1.2cqw;flex:none}
@media (max-width:767px){.vg-ai{--fx:-45%}}`,
  html: `<div class="v-g">
    <div class="v-win phn"></div>
    <div class="v-row hdr"><span class="v-av"></span><div><p class="v-t">Your business</p><p class="onl">Online</p></div></div>
    <p class="bub cu m1" style="top:20%">Hi, are you open on Sunday?</p>
    <div class="typ t1" style="top:32%"><i></i><i></i><i></i></div>
    <p class="bub bo m2" style="top:32%">Yes, from 9:00 to 13:00. Would you like to book a visit?</p>
    <p class="bub cu m3" style="top:51%">Yes, Sunday at 10:00 please.</p>
    <div class="typ t2" style="top:63%"><i></i><i></i><i></i></div>
    <p class="bub bo m4" style="top:63%">Done. You are booked for Sunday at 10:00.</p>
    <div class="v-win v-solid bk"><div class="v-row"><span class="cal">10</span><div><p class="v-t">Booked</p><p class="v-s">Sunday at 10:00</p></div></div></div>
    <div class="v-win v-solid tm"><div class="v-row"><span class="v-av"></span><div><p class="v-t">Team notified</p><p class="v-s">The full chat is in your CRM</p></div></div></div>
  </div>`,
  spec: (D = 10000) => ({
    D, still: 0.82, tracks: [
      GROUP(D),
      ['.phn', 0, [fadeIn(0, 900, '3cqw')]],
      ['.hdr', 0, [fadeIn(400, 1000, '.8cqw')]],
      ['.m1', 0, [[1000, 1500, { opacity: 0, transform: 'translateY(1.2cqw) scale(.94)' }, { opacity: 1, transform: 'none' }, 'sp']]],
      ['.t1', 0, [[1900, 2200, { opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)' }, 'sp'], [3000, 3150, {}, { opacity: 0 }, 'l']]],
      ['.t1 i', 150, [[2100, 2400, { transform: 'translateY(0)' }, { transform: 'translateY(-.4cqw)' }, 'io'], [2400, 2700, {}, { transform: 'translateY(0)' }, 'io']]],
      ['.m2', 0, [[3050, 3550, { opacity: 0, transform: 'translateY(1.2cqw) scale(.94)' }, { opacity: 1, transform: 'none' }, 'sp']]],
      ['.m3', 0, [[4500, 5000, { opacity: 0, transform: 'translateY(1.2cqw) scale(.94)' }, { opacity: 1, transform: 'none' }, 'sp']]],
      ['.t2', 0, [[5300, 5600, { opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)' }, 'sp'], [6300, 6450, {}, { opacity: 0 }, 'l']]],
      ['.t2 i', 150, [[5500, 5800, { transform: 'translateY(0)' }, { transform: 'translateY(-.4cqw)' }, 'io'], [5800, 6100, {}, { transform: 'translateY(0)' }, 'io']]],
      ['.m4', 0, [[6350, 6850, { opacity: 0, transform: 'translateY(1.2cqw) scale(.94)' }, { opacity: 1, transform: 'none' }, 'sp']]],
      ['.bk', 0, [[7000, 7600, { opacity: 0, transform: 'translateX(2cqw) scale(.95)' }, { opacity: 1, transform: 'none' }, 'sp']]],
      ['.tm', 0, [[7600, 8200, { opacity: 0, transform: 'translateX(-2cqw) scale(.95)' }, { opacity: 1, transform: 'none' }, 'sp']]],
    ],
  }),
};

// ---------- 6. Branding: a mark is constructed on a grid, then applied
const brand = {
  label: 'A logo being drawn on a grid, then given colours, type and a business card',
  css: `
.vg-brd .cv{left:5%;top:7%;width:43%;height:86%}
.vg-brd .cvs{left:5%;top:7%;width:43%;height:86%}
.vg-brd .gd{fill:none;stroke:rgba(243,241,234,.16);stroke-width:1}
.vg-brd .gc{fill:none;stroke:rgba(243,241,234,.55);stroke-width:1.2}
.vg-brd .mk{fill:#f3f1ea;transform-box:fill-box;transform-origin:center}
.vg-brd .sw{top:7%;width:9.1%;height:34%;border-radius:1cqw;border:1px solid rgba(255,255,255,.1);display:flex;align-items:flex-end;padding:.9cqw;font-size:.8cqw}
.vg-brd .ty{left:52%;top:45%;width:20%;height:48%;padding:1.4cqw}
.vg-brd .aa{font-size:5.4cqw;line-height:1;font-weight:300;letter-spacing:-.06em}
.vg-brd .fl{left:75%;top:45%;width:20%;height:48%;perspective:60cqw}
.vg-brd .card3{position:absolute;inset:0;transform-style:preserve-3d}
.vg-brd .face{position:absolute;inset:0;border-radius:1.2cqw;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);box-shadow:0 2cqw 4cqw -2cqw rgba(0,0,0,.8)}
.vg-brd .front{background:#f3f1ea}
.vg-brd .back{background:#141417;transform:rotateY(180deg);align-content:center;gap:.8cqw;justify-items:start;padding:0 1.6cqw}
@media (max-width:767px){.vg-brd{--fx:-4%}}`,
  html: `<div class="v-g">
    <div class="v-win cv"></div>
    <svg class="cvs" viewBox="0 0 430 370" aria-hidden="true">
      <g class="gd"><line pathLength="1" stroke-dasharray="1" x1="40" y1="65" x2="390" y2="65"/><line pathLength="1" stroke-dasharray="1" x1="40" y1="305" x2="390" y2="305"/><line pathLength="1" stroke-dasharray="1" x1="95" y1="25" x2="95" y2="345"/><line pathLength="1" stroke-dasharray="1" x1="335" y1="25" x2="335" y2="345"/><line pathLength="1" stroke-dasharray="1" x1="40" y1="185" x2="390" y2="185"/><line pathLength="1" stroke-dasharray="1" x1="215" y1="25" x2="215" y2="345"/></g>
      <circle class="gc" pathLength="1" stroke-dasharray="1" cx="215" cy="185" r="120"/>
      <rect class="gc" pathLength="1" stroke-dasharray="1" x="95" y="65" width="120" height="240"/>
      <path class="mk" d="M125 95h90a90 90 0 0 1 0 180h-90z M165 135v100h50a50 50 0 0 0 0-100z" fill-rule="evenodd"/>
      <circle class="mk eye" cx="318" cy="262" r="13"/>
    </svg>
    <div class="sw" style="left:52%;background:#0c0c0e"><span>Ink</span></div>
    <div class="sw" style="left:62.5%;background:#3a3a40"><span>Graphite</span></div>
    <div class="sw" style="left:73%;background:#8c8b84;color:#0c0c0e"><span>Stone</span></div>
    <div class="sw" style="left:83.5%;width:11.5%;background:#f3f1ea;color:#0c0c0e"><span>Paper</span></div>
    <div class="v-win v-solid ty"><p class="aa">Aa</p><span class="v-bar hi" style="margin-top:1.2cqw;width:80%"></span><span class="v-bar" style="margin-top:.7cqw;width:60%"></span><span class="v-bar" style="margin-top:.7cqw;width:70%"></span></div>
    <div class="fl"><div class="card3">
      <div class="face front"><svg viewBox="0 0 430 370" width="56%" aria-hidden="true"><path d="M125 95h90a90 90 0 0 1 0 180h-90z M165 135v100h50a50 50 0 0 0 0-100z" fill="#0c0c0e" fill-rule="evenodd"/><circle cx="318" cy="262" r="13" fill="#0c0c0e"/></svg></div>
      <div class="face back"><span class="v-bar hi" style="width:7cqw;height:1.2cqw"></span><span class="v-bar" style="width:10cqw"></span><span class="v-bar" style="width:8cqw"></span></div>
    </div></div>
  </div>`,
  spec: (D = 10000) => ({
    D, still: 0.6, tracks: [
      GROUP(D),
      ['.cv', 0, [fadeIn(0, 900, '2cqw')]],
      ['.gd line', 90, [[500, 1400, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 'io']]],
      ['circle.gc', 0, [[1400, 2600, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 'io'], [4200, 5000, {}, { opacity: 0.25 }, 'io']]],
      ['rect.gc', 0, [[1900, 2900, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 'io'], [4200, 5000, {}, { opacity: 0.25 }, 'io']]],
      ['.gd', 0, [[4200, 5000, { opacity: 1 }, { opacity: 0.35 }, 'io']]],
      ['path.mk', 0, [[2900, 3800, { opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }, 'sp']]],
      ['.eye', 0, [pop(3700, 4100)]],
      ['.sw', 90, [[4400, 5100, { opacity: 0, transform: 'translateY(2.4cqw)' }, { opacity: 1, transform: 'none' }, 'o']]],
      ['.ty', 0, [fadeIn(5000, 5700, '2cqw')]],
      ['.fl', 0, [fadeIn(5400, 6100, '2cqw')]],
      ['.card3', 0, [[6800, 7700, { transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }, 'io']]],
    ],
  }),
};

const ALL = { websites: web, 'social-media': social, 'paid-ads': ads, automation: crm, ai, branding: brand };
const CLS = { websites: 'vg-web', 'social-media': 'vg-soc', 'paid-ads': 'vg-ads', automation: 'vg-crm', ai: 'vg-ai', branding: 'vg-brd' };

// returns { html, css, spec } for a service key; `brief` is the photo brief kept hidden
module.exports = function vignette(key, brief) {
  const v = ALL[key];
  const html = typeof v.html === 'function' ? v.html() : v.html;
  const spec = Object.assign({ root: '.' + CLS[key] }, v.spec());
  // the whole scene breathes slowly while it holds (sine-like, two eased halves)
  spec.tracks.push(['.v-g', 0, [[0, spec.D / 2, { transform: 'translateY(0)' }, { transform: 'translateY(-.35cqw)' }, 'io'], [spec.D / 2, spec.D, {}, { transform: 'translateY(0)' }, 'io']]]);
  spec.tracks = spec.tracks.filter((t) => t[2].length);
  return {
    html: `<div class="vg ${CLS[key]}" role="img" aria-label="${v.label}" data-r="x"><div class="vg-in">${html}</div><div class="lb" hidden>${brief}</div></div>`,
    css: v.css,
    spec,
  };
};
