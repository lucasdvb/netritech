const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
(async()=>{fs.mkdirSync('shots/home2',{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[];
for (const [w,h] of [[1440,900],[390,844]]){
 const p=await b.newPage({viewport:{width:w,height:h},isMobile:w<600,hasTouch:w<600});p.on('pageerror',e=>errs.push(w+' '+e.message));
 await p.goto('http://localhost:8788/',{waitUntil:'networkidle'});await p.waitForTimeout(6500);
 await p.screenshot({path:`shots/home2/top-${w}.jpg`,type:'jpeg',quality:65});
 const info=await p.evaluate(()=>({top:!!document.getElementById('dd-chrome-top'),foot:!!document.getElementById('dd-chrome-foot'),
   oldNav:getComputedStyle(document.getElementById('mv-root').shadowRoot.querySelector('.site-nav')).display,
   oldFoot:getComputedStyle(document.getElementById('mv-root').shadowRoot.querySelector('footer.contact')).display,
   navLinks:[...document.getElementById('dd-chrome-top').shadowRoot.querySelectorAll('.nav-pill a,.nav-pill button,.nav-cta')].map(a=>a.textContent.trim()),
   H:document.documentElement.scrollHeight}));
 console.log(w,JSON.stringify(info));
 if(w>600){await p.hover('#dd-chrome-top >> .nav-svc');await p.waitForTimeout(800);await p.screenshot({path:`shots/home2/mega-${w}.jpg`,type:'jpeg',quality:65});await p.mouse.move(700,600);}
 else {await p.tap('#dd-chrome-top >> .burger');await p.waitForTimeout(1100);await p.screenshot({path:`shots/home2/mm-${w}.jpg`,type:'jpeg',quality:65});await p.tap('#dd-chrome-top >> .burger');await p.waitForTimeout(900);}
 await p.evaluate(()=>{if(window.lenis)window.lenis.scrollTo(document.documentElement.scrollHeight,{immediate:true});window.scrollTo(0,document.documentElement.scrollHeight)});await p.waitForTimeout(2500);
 await p.screenshot({path:`shots/home2/foot-${w}.jpg`,type:'jpeg',quality:65});
 await p.close();}
console.log('errors',errs);await b.close();})();
