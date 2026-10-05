global.window={};const fs=require('fs');
const f=process.argv[2];eval(fs.readFileSync(f,'utf8').replace('if (DD.mount) DD.mount();',''));
const DD=window.__DD;const k=DD.current;const p=DD.pages[k];
const html=p.html;
console.log('##',k,p.path,'|',p.title,'| css',p.css.length,'html',html.length,'init',!!p.init,'ld',!!p.ld);
const secs=html.split(/<section/).slice(1);
const hero=html.split(/<section/)[0];
for(const s of [hero,...secs]){
  const cls=(s.match(/class="([^"]+)"/)||[])[1];
  const hs=[...s.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>m[1]+': '+m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,90));
  const np=(s.match(/<p[ >]/g)||[]).length, nli=(s.match(/<li[ >]/g)||[]).length, nimg=(s.match(/<img/g)||[]).length, ndet=(s.match(/<details/g)||[]).length;
  console.log(' -',cls,`p${np} li${nli} img${nimg} faq${ndet}`, hs.slice(0,6).join(' || '));
}
