const {chromium}=require('/opt/node-tools/node_modules/playwright');
const OUT='/tmp/claude-0/-home-user-netritech/5eac3cb4-1bb4-51ac-9ffa-ec718893bad6/scratchpad/rj/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [w,h] of [[1440,900],[390,844]]){const pg=await b.newPage({viewport:{width:w,height:h}});
 await pg.goto('https://www.rejouice.com/',{waitUntil:'domcontentloaded',timeout:90000});
 for(let t=0;t<6;t++){await pg.waitForTimeout(t?700:300);await pg.screenshot({path:OUT+`top${w}-t${t}.jpg`,quality:60});}
 await pg.waitForTimeout(3000);
 for(let i=0;i<8;i++){await pg.screenshot({path:OUT+`top${w}-s${i}.jpg`,quality:60});await pg.mouse.wheel(0,h/4);await pg.waitForTimeout(900);}
 if(w===1440){const d=await pg.evaluate(()=>{window.scrollTo(0,0);const v=[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||v.src,cls:v.className,r:JSON.stringify(v.getBoundingClientRect())}));
   const hero=document.querySelector('main')?.firstElementChild;return {v,hero:hero?hero.outerHTML.slice(0,3000):null}});console.log(JSON.stringify(d,null,1).slice(0,5000));}
 await pg.close();}
await b.close();})();
