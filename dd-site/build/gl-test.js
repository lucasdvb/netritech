const fs=require('fs');const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ported=require('./gl-ported.json');const {mono}=require('./mono.js');
const names=Object.keys(ported);
const cfg=n=>{const src=fs.readFileSync(`${__dirname}/../gl/${n}.html`,'utf8');const m=src.match(/const CONFIG = (\{[\s\S]*?\n\})/);return eval('('+m[1]+')');};
const lift=+(process.argv[2]||1), gamma=+(process.argv[3]||1);
const mons={};names.forEach(n=>mons[n]=mono(cfg(n),{lift,gamma,bg:'#08080a'}));
const html=`<!doctype html><body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(3,480px);gap:4px">
${names.map(n=>`<div style="position:relative;width:480px;height:300px"><canvas id="${n}" style="width:100%;height:100%;display:block"></canvas><b style="position:absolute;left:8px;top:6px;color:#fff;font:12px sans-serif">${n}</b></div>`).join('')}
<script>window.ERR=[];const P={${names.map(n=>`${n}:${ported[n]}`).join(',\n')}};const M=${JSON.stringify(mons)};
for(const n in P){try{P[n](document.getElementById(n),M[n],{})}catch(e){ERR.push(n+': '+e.message)}}</script>`;
fs.writeFileSync(__dirname+'/gl-test.html',html);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1448,height:912}});p.on('console',m=>{if(m.type()==='error')console.log('console',m.text().slice(0,200))});p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto('file://'+__dirname+'/gl-test.html');await p.mouse.move(700,400);await p.waitForTimeout(5000);await p.mouse.move(300,200,{steps:10});await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>ERR));await p.screenshot({path:__dirname+'/gl-test.png'});await b.close();console.log(JSON.stringify(mons));})();
