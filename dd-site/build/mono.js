// Greyscale tint for a gradient CONFIG: every colour key keeps its default luminance
// (so the gradient keeps its tonal structure) and loses its hue, warmed slightly toward
// the site's off-white #f3f1ea. `lift` stretches the brightest key toward the off-white.
function lum(hex){const n=parseInt(hex.slice(1),16);const r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
  const f=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function toHex(L){const f=c=>c<=.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-.055;const w=[1,.992,.962];
  return '#'+w.map(k=>Math.max(0,Math.min(255,Math.round(f(Math.min(1,L))*255*k)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
function mono(config,{lift=1,gamma=1,bg}={}){const keys=Object.keys(config).filter(k=>typeof config[k]==='string'&&/^#/.test(config[k]));
  const Ls=keys.map(k=>lum(config[k]));const max=Math.max(...Ls);const out={};
  keys.forEach((k,i)=>{const L=Math.pow(Ls[i]/max,gamma)*lift; out[k]=toHex(L);});
  if(bg)out.bgColor=bg;return out;}
module.exports={mono,lum,toHex};
