// node shoot.js <base> <outdir> <w> path1 path2 ... — viewport frames down each page
const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
(async()=>{const [base,out,w,...paths]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const W=+w,H=W<600?844:900;
for(const p of paths){const pg=await b.newPage({viewport:{width:W,height:H}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(base+p,{waitUntil:'networkidle'});await pg.waitForTimeout(1500);
 let Hd=await pg.evaluate(()=>document.documentElement.scrollHeight);const name=(p.replace(/\//g,'_')||'_')+'-'+W;let i=0;
 for(let y=0;y<Hd&&i<40;y+=H-100){await pg.evaluate(y=>window.scrollTo(0,y),y);await pg.waitForTimeout(700);await pg.screenshot({path:`${out}/${name}-${String(i++).padStart(2,'0')}.jpg`,type:'jpeg',quality:62});Hd=await pg.evaluate(()=>document.documentElement.scrollHeight);}
 console.log(p,W,'h',Hd,'frames',i,errs.length?'ERR '+errs.slice(0,3).join(' | '):'');await pg.close();}
await b.close();})();
