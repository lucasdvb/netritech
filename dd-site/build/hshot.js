// Homepage frames: after the loader, then at fixed scroll depths (in viewport heights).
const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
(async()=>{const [out,w,...ys]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const W=+w,H=W<600?844:900;const pg=await b.newPage({viewport:{width:W,height:H}});const errs=[];
pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text())});
await pg.goto('http://localhost:8787/',{waitUntil:'load'});
for(const t of [600,1800]){await pg.waitForTimeout(t===600?600:1200);await pg.screenshot({path:`${out}/h${W}-load${t}.jpg`,quality:62});}
await pg.waitForTimeout(3200);
for(const y of (ys.length?ys:['0'])){const px=Math.round(parseFloat(y)*H);await pg.evaluate(px=>window.scrollTo(0,px),px);await pg.waitForTimeout(1300);
 await pg.screenshot({path:`${out}/h${W}-s${String(ys.indexOf(y)).padStart(2,'0')}.jpg`,quality:62});}
console.log(W,'errors:',errs.length?errs.slice(0,5).join(' | '):'none');await b.close();})();
