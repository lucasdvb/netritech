global.window={};const fs=require('fs');const k=process.argv[2];
eval(fs.readFileSync(`current/dd-page-${k}.js`,'utf8').replace('if (DD.mount) DD.mount();',''));
const p=window.__DD.pages[k];
if(process.argv[3]==='meta'){console.log(JSON.stringify({path:p.path,title:p.title,description:p.description,robots:p.robots,section:p.section,ld:p.ld},null,0));process.exit()}
if(process.argv[3]==='css'){console.log(p.css);process.exit()}
if(process.argv[3]==='init'){console.log(String(p.init));process.exit()}
console.log(p.html.replace(/<svg[\s\S]*?<\/svg>/g,'<svg/>').replace(/ aria-hidden="true"/g,'').replace(/\n\s*\n/g,'\n').replace(/^\s+/gm,''));
