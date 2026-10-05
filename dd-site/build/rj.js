// Shoot rejouice.com at 1440 and 390: screenshots down the page + computed type/spacing of every visible text block.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const OUT='/tmp/claude-0/-home-user-netritech/5eac3cb4-1bb4-51ac-9ffa-ec718893bad6/scratchpad/rj/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [w,h] of [[1440,900],[390,844]]){const pg=await b.newPage({viewport:{width:w,height:h}});
 await pg.goto('https://www.rejouice.com/',{waitUntil:'networkidle',timeout:90000}).catch(e=>console.log('goto',e.message));
 await pg.waitForTimeout(6000);
 const H=await pg.evaluate(()=>document.documentElement.scrollHeight);console.log(w,'height',H);
 let i=0;for(let y=0;y<H&&i<40;y+=h*0.9,i++){await pg.mouse.wheel(0,h*0.9);await pg.waitForTimeout(1300);await pg.screenshot({path:OUT+`${w}-${String(i).padStart(2,'0')}.jpg`,quality:60});}
 if(w===1440){await pg.evaluate(()=>window.scrollTo(0,0));await pg.waitForTimeout(1500);
  const info=await pg.evaluate(()=>{const out=[];const seen=new Set();
   document.querySelectorAll('h1,h2,h3,h4,p,a,span,li,button,div').forEach(e=>{const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim();if(!t||t.length<2)return;const cs=getComputedStyle(e);const r=e.getBoundingClientRect();if(!r.width)return;
    const k=cs.fontSize+cs.fontWeight+cs.letterSpacing+cs.lineHeight+cs.fontFamily+cs.textTransform;if(seen.has(k))return;seen.add(k);
    out.push({tag:e.tagName,t:t.slice(0,60),fs:cs.fontSize,fw:cs.fontWeight,ls:cs.letterSpacing,lh:cs.lineHeight,ff:cs.fontFamily.slice(0,40),tt:cs.textTransform,y:Math.round(r.top+scrollY),color:cs.color});});
   return out.sort((a,b)=>a.y-b.y);});
  require('fs').writeFileSync(OUT+'type.json',JSON.stringify(info,null,1));
  const secs=await pg.evaluate(()=>[...document.querySelectorAll('section, header, footer, main > div, [class*=section]')].slice(0,60).map(s=>{const cs=getComputedStyle(s);const r=s.getBoundingClientRect();return {tag:s.tagName,cls:(s.className+'').slice(0,60),y:Math.round(r.top+scrollY),h:Math.round(r.height),pt:cs.paddingTop,pb:cs.paddingBottom,px:cs.paddingLeft,bg:cs.backgroundColor,rad:cs.borderRadius}}));
  require('fs').writeFileSync(OUT+'secs.json',JSON.stringify(secs,null,1));
  require('fs').writeFileSync(OUT+'page.html',await pg.content());}
 await pg.close();}
await b.close();})();
