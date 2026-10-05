const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const out='shots/ix';require('fs').mkdirSync(out,{recursive:true});
let p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8787/services/ai-chatbots',{waitUntil:'networkidle'});await p.waitForTimeout(1500);
await p.mouse.move(600,20);await p.hover('#dd-root >> .nav-svc');await p.waitForTimeout(900);await p.screenshot({path:out+'/mega.jpg',type:'jpeg',quality:70});
// faq toggle
await p.mouse.move(10,500);await p.evaluate(()=>{const R=document.getElementById('dd-root').shadowRoot;R.querySelectorAll('.faq details')[1].scrollIntoView({block:'center'})});await p.waitForTimeout(800);
await p.click('#dd-root >> .faq details:nth-of-type(2) summary');await p.waitForTimeout(900);
console.log('faq open:',await p.evaluate(()=>[...document.getElementById('dd-root').shadowRoot.querySelectorAll('.faq details')].map(d=>d.open).join(',')));
await p.screenshot({path:out+'/faq.jpg',type:'jpeg',quality:70});
console.log('seo',await p.evaluate(()=>({t:document.title,c:document.querySelector('link[rel=canonical]').href,ld:!!document.getElementById('dd-jsonld'),d:document.querySelector('meta[name=description]').content.slice(0,40)})));
const m=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});m.on('pageerror',e=>errs.push(e.message));
await m.goto('http://localhost:8787/fledge',{waitUntil:'networkidle'});await m.waitForTimeout(1200);
await m.tap('#dd-root >> .burger');await m.waitForTimeout(1200);await m.tap('#dd-root >> .mm-svc');await m.waitForTimeout(900);await m.screenshot({path:out+'/mm.jpg',type:'jpeg',quality:70});
const rm=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});rm.on('pageerror',e=>errs.push(e.message));
await rm.goto('http://localhost:8787/services/web-design',{waitUntil:'networkidle'});await rm.waitForTimeout(2500);await rm.screenshot({path:out+'/rm.jpg',type:'jpeg',quality:70});
console.log('errors',errs);await b.close();})();
