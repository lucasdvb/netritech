// Pull the copy of the 6 service pages out of the current markup into data, so the
// new templates never retype a word. Runs in Chromium's DOMParser.
const fs=require('fs');const {chromium}=require('/opt/node-tools/node_modules/playwright');
const keys=['websites','social-media','paid-ads','automation','ai','branding'];
const load=k=>{global.window={};eval(fs.readFileSync(`current/dd-page-${k}.js`,'utf8').replace('if (DD.mount) DD.mount();',''));return window.__DD.pages[k];};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage();
for(const k of keys){const pg=load(k);
 const data=await p.evaluate((html)=>{
  const doc=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
  doc.querySelectorAll('svg').forEach(s=>s.remove());
  const T=e=>e?e.innerHTML.replace(/<span class="dot"><\/span>/g,'').replace(/\s+/g,' ').trim():null;
  const secs=[...doc.querySelectorAll('main > section, main > div')];
  const by=sel=>doc.querySelector(sel);
  const hero=by('.sp-hero');
  const out={};
  out.crumb=T(hero.querySelector('[aria-current]'));
  out.eyebrow=T(hero.querySelector('.eb'));
  out.h1=T(hero.querySelector('h1'));
  out.lead=T(hero.querySelector('.ld'));
  out.btns=[...hero.querySelectorAll('.btn-row a')].map(a=>({href:a.getAttribute('href'),t:T(a),p:a.classList.contains('btn-a')}));
  out.partCap=T(hero.querySelector('.sp-part .cap'));out.partTags=[...hero.querySelectorAll('.sp-part .tag')].map(T);
  out.banner=T(by('.sp-banner .ph'));out.bannerCls=by('.sp-banner .ph').className;
  const plain=by('.sp-plain');out.plain={eb:T(plain.querySelector('.eb')),h2:T(plain.querySelector('h2')),p:T(plain.querySelector('.sp-plain-p')),facts:[...plain.querySelectorAll('dl > div')].map(d=>({k:T(d.querySelector('dt')),v:T(d.querySelector('dd'))}))};
  const sf=by('.sp-sf');out.sf={h2:T(sf.querySelector('h2')),q:[...sf.querySelectorAll('blockquote p')].map(T)};
  const inc=by('.on-sf');out.inc={eb:T(inc.querySelector('.eb')),h2:T(inc.querySelector('h2')),items:[...inc.querySelectorAll('ol > li')].map(li=>({n:T(li.querySelector('.cap')),h:T(li.querySelector('h3')),p:T(li.querySelector('.tx'))}))};
  const how=[...doc.querySelectorAll('section.lt.panel')].find(s=>s.querySelector('.principle'));out.how={eb:T(how.querySelector('.eb')),h2:T(how.querySelector('h2')),steps:[...how.querySelectorAll('.principle')].map(li=>({n:T(li.querySelector('.idx')),h:T(li.querySelector('h3')),p:T(li.querySelector('p'))}))};
  const ch=by('.sp-choose').closest('section');out.choose={eb:T(ch.querySelector('.eb')),h2:T(ch.querySelector('h2')),items:[...ch.querySelectorAll('.sp-choose > li')].map(li=>({n:T(li.querySelector('.cap')),h:T(li.querySelector('h3')),p:T(li.querySelector('.tx'))}))};
  const fl=by('.sp-flsec');out.fl={eb:T(fl.querySelector('.sp-fl .eb')),h2:T(fl.querySelector('h2')),p:T(fl.querySelector('.sp-fl .tx')),link:{href:fl.querySelector('.sp-fl .lnk').getAttribute('href'),t:T(fl.querySelector('.sp-fl .lnk'))},
    stagesLabel:fl.querySelector('.sp-stages').getAttribute('aria-label'),
    stages:[...fl.querySelectorAll('.sp-st')].map(li=>({n:T(li.querySelector('.n')),nm:T(li.querySelector('.nm')),ln:T(li.querySelector('.ln')),on:li.classList.contains('on'),this:T(li.querySelector('.this'))})),
    withCap:T(fl.querySelector('.sp-with .cap')),sibs:[...fl.querySelectorAll('.sp-sibs a')].map(a=>({href:a.getAttribute('href'),img:a.querySelector('img').getAttribute('src'),h:T(a.querySelector('h3')),sub:T(a.querySelector('.sub'))}))};
  const pr=by('.sp-proof');out.proof={eb:T(pr.querySelector('.eb')),h2:T(pr.querySelector('h2')),href:pr.querySelector('.sp-pcard').getAttribute('href'),ph:T(pr.querySelector('.sp-pcard .ph')),phCls:pr.querySelector('.sp-pcard .ph').className,
    client:T(pr.querySelector('.sp-pcard h3')),sector:T(pr.querySelector('.sp-pcard .cap')),line:T(pr.querySelector('.sp-pcard > .tx')),note:T(pr.querySelector('.sp-proof-foot .sm')),link:{href:pr.querySelector('.sp-proof-foot .lnk').getAttribute('href'),t:T(pr.querySelector('.sp-proof-foot .lnk'))}};
  const fq=[...doc.querySelectorAll('section')].find(s=>s.querySelector('details'));out.faq={eb:T(fq.querySelector('.eb')),h2:T(fq.querySelector('h2')),items:[...fq.querySelectorAll('details')].map(d=>({q:T(d.querySelector('h3')),a:T(d.querySelector('.ans')),open:d.open}))};
  const cta=by('.sp-cta');out.cta={eb:T(cta.querySelector('.eb')),h2:T(cta.querySelector('h2')),btn:{href:cta.querySelector('.btn').getAttribute('href'),t:T(cta.querySelector('.btn'))}};
  return out;},pg.html);
 fs.writeFileSync(`src/data/${k}.json`,JSON.stringify(data,null,1));console.log(k,Object.keys(data).length, data.inc.items.length, data.faq.items.length, data.fl.sibs.map(s=>s.h).join('/'));}
await b.close();})();
