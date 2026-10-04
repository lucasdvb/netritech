// Every piece of text in the old page must still be in the new page (whitespace and
// line breaks aside). Also flags any em dash in the new output.
const fs=require('fs');
const load=(f,k)=>{global.window={};eval(fs.readFileSync(f,'utf8').replace('if (DD.mount) DD.mount();',''));return window.__DD.pages[k];};
const ent=s=>s.replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;|&rsquo;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const runs=h=>ent(h.replace(/<!--[\s\S]*?-->/g,'').replace(/<svg[\s\S]*?<\/svg>/g,' ')).split(/<[^>]+>/).map(s=>s.replace(/\s+/g,' ').trim()).filter(s=>s.length>1);
const flat=h=>ent(h.replace(/<svg[\s\S]*?<\/svg>/g,' ').replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'')).replace(/\s+/g,' ');
const attrs=h=>[...h.matchAll(/\b(alt|aria-label|href)="([^"]*)"/g)].map(m=>m[1]+'='+m[2]);
let bad=0;
for(const k of process.argv.slice(2)){
  const o=load(`current/dd-page-${k}.js`,k), n=load(`out/dd-page-${k}.js`,k);
  const nf=flat(n.html);const miss=runs(o.html).filter(r=>!nf.includes(r));
  const na=new Set(attrs(n.html));const missA=[...new Set(attrs(o.html))].filter(a=>!na.has(a)&&!/^href=#/.test(a));
  const seo=['path','title','description','robots','section'].filter(f=>o[f]!==n[f]).concat(JSON.stringify(o.ld)!==JSON.stringify(n.ld)?['ld']:[]);
  const dash=fs.readFileSync(`out/dd-page-${k}.js`,'utf8').includes('—');
  console.log(k.padEnd(13),'missing text',miss.length,'| missing attrs',missA.length,'| seo diff',seo.join(',')||'none','| em dash',dash);
  miss.forEach(m=>console.log('   TEXT:',m));missA.forEach(m=>console.log('   ATTR:',m));
  if(miss.length||seo.length||dash)bad++;
}
const core=fs.readFileSync('out/dd-core.js','utf8');console.log('core em dash',core.includes('—'));
process.exitCode=bad?1:0;
