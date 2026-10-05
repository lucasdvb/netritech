// Local stand-in for the Instatic site: GET /<slug> serves a page whose only node is
// <div id="dd-root" data-page="KEY">, plus the page's scripts. /uploads/<id>-<name> maps
// to the local copies of the media (drafts host) by file name.
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname+'/..';const SRC=process.env.SRC||'out';
const PAGES={'/':'home','/work':'work','/work/case-study':'case-study','/services':'services','/about':'about','/contact':'contact','/privacy':'privacy','/fledge':'fledge',
'/services/web-design':'websites','/services/social-media-management':'social-media','/services/facebook-google-ads':'paid-ads','/services/marketing-automation-crm':'automation','/services/ai-chatbots':'ai','/services/branding-logo-design':'branding'};
const types={'.js':'text/javascript','.webp':'image/webp','.png':'image/png','.otf':'font/otf','.html':'text/html','.jpg':'image/jpeg','.webm':'video/webm'};
http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
 if(u.startsWith('/uploads/')){const name=u.slice(9).replace(/^[A-Za-z0-9_-]{21}-/,'').replace('Switzer-Light.otf','Switzer-Regular.otf');
   const cand=[ROOT+'/drafts/assets/img/'+name,ROOT+'/drafts/assets/fonts/'+name,ROOT+'/media/'+name];const f=cand.find(fs.existsSync);
   if(!f){r.writeHead(404);return r.end('nf '+name)}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});return fs.createReadStream(f).pipe(r);}
 if(u.startsWith('/src/')){const f=ROOT+'/'+SRC+'/'+path.basename(u);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/javascript'});return fs.createReadStream(f).pipe(r);}
 const key=PAGES[u.replace(/\/$/,'')||'/'];if(!key){r.writeHead(404);return r.end('no page')}
 const scripts=key==='home'?['marcus-vane.js']:['dd-core.js','dd-page-'+key+'.js'];
 r.writeHead(200,{'content-type':'text/html'});
 r.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>local</title></head><body>${key==='home'?'<div id="mv-root"></div>':`<div id="dd-root" data-page="${key}"></div>`}${scripts.map(s=>`<script type="module" src="/src/${s}"></script>`).join('')}</body></html>`);
}).listen(+process.env.PORT||8787,()=>console.log('up'));
