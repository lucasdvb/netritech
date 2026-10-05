// CPU profile of page load (4x throttle, 390px): self time by function, top entries.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const p of process.argv.slice(2)){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const pg=await ctx.newPage();
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});await cdp.send('Profiler.start');
 await pg.goto('http://localhost:8787'+p,{waitUntil:'load'});await pg.waitForTimeout(3000);
 const {profile}=await cdp.send('Profiler.stop');
 const self={};const byId={};profile.nodes.forEach(n=>byId[n.id]=n);
 const dt=profile.timeDeltas;const cnt={};profile.samples.forEach((s,i)=>{cnt[s]=(cnt[s]||0)+(dt[i]||0)});
 for(const id in cnt){const n=byId[id];const f=n.callFrame;const k=(f.functionName||'(anon)')+' '+(f.url.split('/').pop()||'')+':'+f.lineNumber;self[k]=(self[k]||0)+cnt[id]/1000;}
 const top=Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,22);
 console.log('==',p);top.forEach(([k,v])=>console.log(v.toFixed(0).padStart(6)+'ms',k));
 await ctx.close();}
await b.close();})();
