// Performance audit: 4x CPU throttle (mid-range phone), scroll the whole page, and
// measure long tasks, layout shift, script time and frame pacing.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const paths=process.argv.slice(2);
for(const p of paths){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const pg=await ctx.newPage();
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
 await pg.addInitScript(()=>{window.__lt=[];window.__cls=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(e.duration))).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__cls+=e.value})).observe({type:'layout-shift',buffered:true});});
 const t0=Date.now();await pg.goto('http://localhost:8787'+p,{waitUntil:'load'});const load=Date.now()-t0;await pg.waitForTimeout(2500);
 const fcp=await pg.evaluate(()=>{const e=performance.getEntriesByName('first-contentful-paint')[0];return e?Math.round(e.startTime):null});
 // scroll in steps and sample frames
 const frames=await pg.evaluate(async()=>{const H=document.documentElement.scrollHeight;const gaps=[];let last=performance.now();let run=true;
  const tick=t=>{gaps.push(t-last);last=t;if(run)requestAnimationFrame(tick)};requestAnimationFrame(tick);
  for(let y=0;y<H;y+=180){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}
  run=false;gaps.sort((a,b)=>a-b);return {n:gaps.length,p50:gaps[Math.floor(gaps.length*.5)].toFixed(1),p95:gaps[Math.floor(gaps.length*.95)].toFixed(1)};});
 const m=await cdp.send('Performance.getMetrics');const g=k=>m.metrics.find(x=>x.name===k).value;
 const r=await pg.evaluate(()=>({lt:window.__lt.length,ltMax:Math.round(Math.max(0,...window.__lt)),ltSum:Math.round(window.__lt.reduce((a,b)=>a+b,0)),cls:window.__cls.toFixed(3)}));
 console.log(p.padEnd(36),'FCP',fcp+'ms','| long tasks',r.lt,'max',r.ltMax+'ms','sum',r.ltSum+'ms','| CLS',r.cls,'| frame p50/p95',frames.p50+'/'+frames.p95+'ms','| script',(g('ScriptDuration')*1000).toFixed(0)+'ms','layout',(g('LayoutDuration')*1000).toFixed(0)+'ms','heap',(g('JSHeapUsedSize')/1e6).toFixed(1)+'MB');
 await ctx.close();}
await b.close();})();
