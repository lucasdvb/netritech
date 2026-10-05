// Seek each page's vignette to fixed times and screenshot it (deterministic frames).
const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
(async()=>{const [w,...paths]=process.argv.slice(2);const W=+w;fs.mkdirSync('shots/vg',{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for(const p of paths){const pg=await b.newPage({viewport:{width:W,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push(m.text())});
 await pg.goto('http://localhost:8788'+p,{waitUntil:'networkidle'});await pg.waitForTimeout(800);
 const sel=process.env.SEL||'.vg';
 await pg.evaluate(s=>document.getElementById('dd-root').shadowRoot.querySelector(s).scrollIntoView({block:'center'}),sel);await pg.waitForTimeout(1600);
 const n=await pg.evaluate(s=>{const R=document.getElementById('dd-root').shadowRoot;const v=R.querySelector(s);return R.getAnimations().filter(a=>a.effect&&v.contains(a.effect.target)).length},sel);
 const times=(process.env.T||'1200,2800,4600,6400,8200').split(',').map(Number);
 const name=p.replace(/\//g,'_');const files=[];
 for(const t of times){await pg.evaluate(([s,t])=>{const R=document.getElementById('dd-root').shadowRoot;const v=R.querySelector(s);R.getAnimations().filter(a=>a.effect&&v.contains(a.effect.target)).forEach(a=>{a.pause();a.currentTime=t})},[sel,t]);
  await pg.waitForTimeout(120);const el=await pg.evaluateHandle(s=>document.getElementById('dd-root').shadowRoot.querySelector(s),sel);const f=`shots/vg/${name}-${W}-${t}.png`;await el.screenshot({path:f});files.push(f);}
 console.log(p,'anims',n,errs.length?'ERR '+errs.slice(0,3).join(' | '):'');await pg.close();}
await b.close();})();
