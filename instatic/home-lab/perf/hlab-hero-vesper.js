/* hlab-hero-vesper.js — Home Lab hero only.
   Vesper (GetLayers template) scroll scene: orb -> spiral galaxy -> brain, with the
   three text overlays timed to the same 0->4 scroll clock. The scene code below
   (helpers .. CameraRig) is the template's portable port, verbatim; only the page
   wiring at the end is new: the clock reads the scroll inside .hlab-hero (a
   700lvh pinned track) instead of Vesper's four page tracks, no Lenis (the page
   keeps its own smooth scroll), no full-page loader, and rendering pauses once
   the hero has scrolled away. Scene colours: ORB / GALAXY / *_CONFIG below. */
/* Since the performance pass, the WebGL scene lives in hlab-webgl-scene.js and renders in a
   Web Worker (OffscreenCanvas) when the browser supports it, otherwise on the main thread as
   before. This file keeps the page side: scroll clock, overlays, headline sweeps, pointer.
   Built by instatic/home-lab/perf/build.py; do not edit by hand. */

const HERO=document.querySelector('.hlab-hero')
let CANVAS=document.querySelector('.hlab-hero-canvas')
/* Inside the Instatic editor canvas (an iframe) the WebGL scene is not started,
   so editing stays light: the hero copy is simply shown. */
const IN_EDITOR=(()=>{ try{ return window.self!==window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname) }catch(e){ return true } })()
if(HERO&&CANVAS&&!window.__hlabVesper){
  window.__hlabVesper=true
  if(IN_EDITOR){ const ov=HERO.querySelector('.hlab-vx-ov-hero'); if(ov){ ov.style.opacity='1'; ov.style.visibility='visible'; ov.classList.add('hlab-vx-static') } }
  else boot()
}

function boot(){
/* ================================================================
   Small helpers
================================================================ */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v))
const clamp01=v=>Math.min(1,Math.max(0,v))
const lerp=(a,b,t)=>a+(b-a)*t
const smoothstep=(a,b,x)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t)}
const smootherstep=x=>{const t=clamp01(x);return t*t*t*(t*(t*6-15)+10)}
/** sRGB hex -> linear-RGB Vector3 (THREE.Color converts on construction). */

/* ================================================================
   Viewport-adaptive params — port of scene/adaptive.ts
================================================================ */
const ADAPTIVE=[
  {point:Infinity,orbCount:23000,orbPointSize:28,orbCameraZ:3.8,orbMoveY:0.8,galaxyWidthSegments:160,galaxyHeightSegments:420,brainCount:130000,atmoCount:260,atmoSize:23,pointerReaction:true,dpr:[1,2],progressLerp:0.07,bloom:true},
  {point:1440,orbCount:17000,orbPointSize:27,orbCameraZ:3.8,orbMoveY:0.8,galaxyWidthSegments:130,galaxyHeightSegments:330,brainCount:90000,atmoCount:210,atmoSize:22,pointerReaction:true,dpr:[1,1.75],progressLerp:0.08,bloom:true},
  {point:1024,orbCount:11000,orbPointSize:24,orbCameraZ:4.5,orbMoveY:0.9,galaxyWidthSegments:100,galaxyHeightSegments:250,brainCount:50000,atmoCount:150,atmoSize:20,pointerReaction:false,dpr:[0.9,1.25],progressLerp:0.13,bloom:true},
  {point:640,orbCount:6500,orbPointSize:21,orbCameraZ:5.4,orbMoveY:1.0,galaxyWidthSegments:70,galaxyHeightSegments:170,brainCount:26000,atmoCount:90,atmoSize:18,pointerReaction:false,dpr:[0.75,1.1],progressLerp:0.15,bloom:false},
]
const getParams=(w)=>{let r=ADAPTIVE[0];for(const e of ADAPTIVE) if(w<=e.point) r=e;return r}
const PARAMS=getParams(window.innerWidth)

/* ================================================================
   Scene timeline — port of lib/scene/timeline.ts (0→4 clock)
================================================================ */
const KEYFRAMES=[
  {orbOut:0,galaxyIn:0,galaxyOut:0,galaxyDive:0},
  {orbOut:1,galaxyIn:1,galaxyOut:0,galaxyDive:0.5},
  {orbOut:1,galaxyIn:1,galaxyOut:0.5,galaxyDive:1},
  {orbOut:1,galaxyIn:1,galaxyOut:1,galaxyDive:1},
  {orbOut:1,galaxyIn:1,galaxyOut:1,galaxyDive:1},
]
const KEYS=['orbOut','galaxyIn','galaxyOut','galaxyDive']
const TIMELINE_END=4
const sampleScene=(g)=>{
  const c=clamp(g,0,TIMELINE_END)
  const lower=Math.min(Math.floor(c),KEYFRAMES.length-2)
  const t=c-lower,from=KEYFRAMES[lower],to=KEYFRAMES[lower+1],out={}
  for(const k of KEYS) out[k]=lerp(from[k],to[k],t)
  return out
}
const orbDissolve=s=>smootherstep(s.orbOut)
const orbAlpha=s=>1-orbDissolve(s)
const orbCoreOpen=p=>smoothstep(2.9,3.6,p)
const orbApproach=p=>smoothstep(3.4,4.0,p)
const galaxyAppear=s=>smootherstep(smoothstep(0.55,0.95,s.galaxyIn))
const galaxyAssemble=s=>1-smootherstep(smoothstep(0.5,1.0,s.galaxyIn))
const galaxyBlow=s=>smootherstep(clamp01((s.galaxyOut-0.5)*2))
const galaxyPresence=s=>galaxyAppear(s)*(1-galaxyBlow(s))
const brainAppear=p=>smootherstep(smoothstep(2.6,3.4,p))

const timeline={
  tracks:[0,0,0,0],state:{...KEYFRAMES[0]},target:0,progress:0,smoothing:PARAMS.progressLerp,
  setTrack(i,v){this.tracks[i]=v;let s=0;for(const t of this.tracks) s+=t;this.target=s},
  advance(dt){
    const dist=this.target-this.progress
    if(Math.abs(dist)<0.00005){ if(this.progress!==this.target) this.progress=this.target }
    else if(this.smoothing>=1){ this.progress=this.target }
    else { const a=1-Math.pow(1-this.smoothing,dt*60); this.progress+=dist*a }
    Object.assign(this.state,sampleScene(this.progress))
  },
  getState(){return this.state}, getProgress(){return this.progress},
}

let outro=0
const setOutro=v=>{outro=v}
const getOutro=()=>outro

/* Pointer in NDC (y up), sent to the scene each frame. */
const pointer={x:0,y:0}
let pointerHas=false
addEventListener('pointermove',e=>{
  pointerHas=true
  pointer.x=(e.clientX/window.innerWidth)*2-1
  pointer.y=-((e.clientY/window.innerHeight)*2-1)
},{passive:true})

/* textGo: the hero copy reveals right away; loaded: the scene has drawn its first frames */
const textGo=true
let loaded=false
/* ================================================================
   DOM — text splitting for the reveals (scoped to the hero overlays)
================================================================ */
const STAGE=HERO.querySelector('.hlab-hero-stage')||HERO
function splitLetters(el){
  const stagger=+(el.dataset.stagger||26), delay=+(el.dataset.delay||0)
  const words=el.textContent.trim().split(/\s+/)
  el.textContent=''
  let idx=0
  words.forEach((w,wi)=>{
    const word=document.createElement('span'); word.className='hlab-vx-word'
    ;[...w].forEach(ch=>{
      const s=document.createElement('span'); s.className='hlab-vx-ch'; s.textContent=ch
      s.style.transitionDelay=(delay+idx*stagger)+'ms'; idx++
      word.appendChild(s)
    })
    el.appendChild(word)
    if(wi<words.length-1){ el.appendChild(document.createTextNode(' ')); idx++ }
  })
}
function splitWords(el){
  const stagger=42, delay=+(el.dataset.delay||0)
  const words=el.textContent.trim().split(/\s+/)
  el.textContent=''
  words.forEach((w,i)=>{
    const s=document.createElement('span'); s.className='hlab-vx-wd'; s.textContent=w
    s.style.transitionDelay=(delay+i*stagger)+'ms'
    el.appendChild(s)
  })
}
/* ================================================================
   Main headlines: SPM V3's scroll text sweep (ported from v3f-hero-scroll.js
   paintText). Letters fade in left to right with an electric-teal trailing
   band, hold, then sweep out. Galaxy + brain lines are scrubbed by the scroll
   clock; the hero line sweeps in on load (intro) and out on scroll.
================================================================ */
const SWEEP={ accent:'#16E6D0', TAIL:0.18, V:0.82, INTRO_MS:1700 }
const ACC=[0x16,0xE6,0xD0]
const pow2out=x=>1-(1-x)*(1-x), pow2in=x=>x*x
const tealMix=a=>'rgb('+Math.round(lerp(255,ACC[0],a))+','+Math.round(lerp(255,ACC[1],a))+','+Math.round(lerp(255,ACC[2],a))+')'
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches
function makeBeat(els,win){
  const chars=[]
  els.forEach(el=>{
    if(!el) return
    el.classList.remove('hlab-vx-tl')
    const words=el.textContent.trim().split(/\s+/)
    el.textContent=''
    words.forEach((w,wi)=>{
      const word=document.createElement('span'); word.className='hlab-vx-word'
      for(const ch of w){ const c=document.createElement('span'); c.className='hlab-vx-bch'; c.textContent=ch; word.appendChild(c); chars.push(c) }
      el.appendChild(word)
      if(wi<words.length-1) el.appendChild(document.createTextNode(' '))
    })
  })
  for(const c of chars){ c.style.opacity=REDUCED?'1':'0'; c.style.color=REDUCED?'#fff':SWEEP.accent }
  return {chars,n:chars.length,o:[],c:[],win}
}
/* win: [a,b] reveal (C 0 -> V), [b,c] hold (V -> V+0.1), [c,d] exit (V+0.1 -> 1), in scroll-clock units */
const BEATS=[
  makeBeat([STAGE.querySelector('.hlab-vx-ov-hero .hlab-vx-title')],{intro:true,c:0.02,d:0.2}),
  makeBeat([STAGE.querySelector('.hlab-vx-ov-galaxy .hlab-vx-title')],{a:0.36,b:0.95,c:1.75,d:2.12}),
  makeBeat([STAGE.querySelector('.hlab-vx-ov-brain .hlab-vx-tl-left'),STAGE.querySelector('.hlab-vx-ov-brain .hlab-vx-tl-right')],{a:2.3,b:2.95,c:3.5,d:3.92}),
]
function beatC(w,clock,introT){
  const V=SWEEP.V, A=V+0.1
  if(clock>=w.c) return A+(1-A)*clamp01((clock-w.c)/(w.d-w.c))
  if(w.intro) return V*introT
  if(clock<w.a) return 0
  if(clock<w.b) return V*(clock-w.a)/(w.b-w.a)
  return V+0.1*clamp01((clock-w.b)/(w.c-w.b))
}
function setCh(bt,j,o,col){
  if(bt.o[j]!==o){ bt.o[j]=o; bt.chars[j].style.opacity=o }
  if(bt.c[j]!==col){ bt.c[j]=col; bt.chars[j].style.color=col }
}
function paintBeat(bt,C){
  // verbatim V3 paintText math for one beat at local progress C
  const V=SWEEP.V, A=V+0.1
  const G=Math.min(C/V,1)
  let L=(C-A)/(1-A); L*=2
  const Y=clamp(L,0,1), R=bt.n||1, front=C/V
  for(let g=0;g<bt.n;g++){
    const q=g/R, O=(g+1)/R
    const B=clamp((G-q)/(O-q),0,1), Z=clamp((Y-q)/(O-q),0,1)
    const T=pow2out(B)*(1-pow2in(Z))
    const recency=front-(g+0.5)/R
    const tealAmt=recency<0?1:clamp(1-recency/SWEEP.TAIL,0,1)
    setCh(bt,g,T.toFixed(3),tealMix(tealAmt))
  }
}
let introStartT=null
function paintBeats(clock){
  if(REDUCED) return
  if(textGo&&introStartT===null) introStartT=performance.now()
  const introT=introStartT===null?0:clamp01((performance.now()-introStartT)/SWEEP.INTRO_MS)
  for(const bt of BEATS) paintBeat(bt,beatC(bt.win,clock,introT))
}

STAGE.querySelectorAll('.hlab-vx-tl').forEach(splitLetters)
STAGE.querySelectorAll('.hlab-vx-tw').forEach(splitWords)
const REVEAL='.hlab-vx-tl,.hlab-vx-tw,.hlab-vx-ur'
function setReveal(root,on){
  if(!root) return
  const els=root.matches(REVEAL)?[root]:[]
  root.querySelectorAll(REVEAL).forEach(e=>els.push(e))
  for(const e of els) e.classList.toggle('hlab-vx-in',on)
}

/* ================================================================
   Overlay opacity + reveal windows — Vesper's exact clock windows
================================================================ */
const ovHero=STAGE.querySelector('.hlab-vx-ov-hero')
const ovGalaxy=STAGE.querySelector('.hlab-vx-ov-galaxy')
const ovBrain=STAGE.querySelector('.hlab-vx-ov-brain')
let heroRevealed=false
function applyOverlay(el,op){
  if(!el) return
  const on=op>0.001
  el.style.opacity=op.toFixed(3)
  el.style.visibility=on?'visible':'hidden'
  el.style.pointerEvents=on?'':'none'
}
function updateOverlays(clock,loaded){
  // Hero: 1 -> 0 across clock 0.08-0.28.
  applyOverlay(ovHero,1-clamp01((clock-0.12)/0.2))
  if(textGo&&!heroRevealed){ heroRevealed=true; setReveal(ovHero,true) }
  // Galaxy: shown 0.32-0.52, gone 1.9-2.3.
  applyOverlay(ovGalaxy,smoothstep(0.32,0.52,clock)*(1-smoothstep(1.9,2.3,clock)))
  setReveal(ovGalaxy, clock>0.45&&clock<2.05)
  // Brain: shown 2.2-2.65, gone 3.6-4.1.
  applyOverlay(ovBrain,smoothstep(2.2,2.65,clock)*(1-smoothstep(3.6,4.1,clock)))
  setReveal(ovBrain, clock>2.55&&clock<3.7)
}

/* ================================================================
   Scroll clock — Vesper's four tracks, measured inside .hlab-hero.
   Vesper: track1/2/3 are 200lvh each from the top, track4 is track3
   read "from bottom", then a 100lvh spacer; the outro scrubs over the
   next viewport. Here y is the scroll distance into the hero, so the
   hero is 700lvh (6 tracks of travel + the pinned stage itself).
================================================================ */
let heroTop=0, vh=window.innerHeight
function measure(){ vh=window.innerHeight; heroTop=HERO.getBoundingClientRect().top+window.scrollY }
function updateClock(){
  const y=window.scrollY-heroTop, h=2*vh
  timeline.setTrack(0,clamp01(y/h))
  timeline.setTrack(1,clamp01((y-h)/h))
  timeline.setTrack(2,clamp01((y-2*h)/h))
  timeline.setTrack(3,clamp01((y-(2*h-vh))/h))
  setOutro(clamp01((y-6*vh)/vh))
  return y
}


/* ================================================================
   The woman's headline glow: the scene sends her face position on screen
================================================================ */
let glowChars=null,glowRects=[],glowN=0,glowW=0,glowH=0
function applyGlow(d){
  if(!glowChars) glowChars=[...STAGE.querySelectorAll('.hlab-vx-ov-galaxy .hlab-vx-title .hlab-vx-ch')]
  if(!glowChars.length) return
  if(glowW!==innerWidth||glowH!==innerHeight||++glowN%30===0){
    glowW=innerWidth; glowH=innerHeight
    glowRects=glowChars.map(c=>{const r=c.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]})
  }
  const fx=d.x*innerWidth, fy=d.y*innerHeight
  glowChars.forEach((c,i)=>{
    const r=glowRects[i]; if(!r) return
    const dd=Math.hypot(r[0]-fx,r[1]-fy)/innerHeight
    const g=d.shine*(0.15*d.sweep+0.65*Math.exp(-((dd/0.38)**2)))
    const v=g>0.02?'0 0 '+(6+18*g).toFixed(1)+'px rgba(69,214,196,'+(0.75*g).toFixed(3)+')':''
    if(c.__glow!==v){ c.__glow=v; c.style.textShadow=v }
  })
}

/* ================================================================
   Scene: a Web Worker on an OffscreenCanvas, or the main thread
================================================================ */
let scene=null, worker=null, busy=false
function onSceneMessage(m){
  if(m.type==='drawn') busy=false
  else if(m.type==='ready'){ if(!loaded){ loaded=true; HERO.classList.add('hlab-vx-ready') } }
  else if(m.type==='glow') applyGlow(m.data)
  else if(m.type==='fail') mainThread()
}
const viewport=()=>({w:window.innerWidth,h:window.innerHeight,dpr:window.devicePixelRatio||1})
function sceneUrl(){ if(window.__hlabSceneUrl) return window.__hlabSceneUrl; const s=document.querySelector('script[src*="hlab-webgl-scene"]'); return s&&s.src }
/* three.js: the copy Instatic already serves (the page's import map), minified build */
function threeUrl(){
  try{ const im=JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports['three']
    return new URL(im.replace(/three\.module\.js$/,'three.module.min.js'),location.href).href }catch(e){ return null }
}
function mainThread(){
  if(worker){ worker.terminate(); worker=null; const c=CANVAS.cloneNode(false); CANVAS.replaceWith(c); CANVAS=c }
  const go=create=>{ if(!create||scene) return
    scene=create(CANVAS,{...viewport(),noLite:!!window.__hlabNoLite},(type,data)=>onSceneMessage({type,data})) }
  const url=sceneUrl(), tu=threeUrl(); if(!tu) return
  const load=window.__hlabLoadScene?Promise.resolve(window.__hlabLoadScene):url?import(url).then(m=>m.loadScene||window.__hlabLoadScene):Promise.reject()
  load.then(fn=>fn(tu)).then(go).catch(()=>{})
}
function startScene(){
  const url=sceneUrl()
  const tu=threeUrl()
  if(url&&tu&&CANVAS.transferControlToOffscreen&&typeof Worker!=='undefined'&&!window.__hlabNoWorker){
    try{
      const off=CANVAS.transferControlToOffscreen()
      worker=new Worker(url,{type:'module'})
      worker.onmessage=e=>onSceneMessage(e.data)
      worker.onerror=()=>mainThread()
      worker.postMessage({type:'init',canvas:off,threeUrl:tu,init:{...viewport(),noLite:!!window.__hlabNoLite}},[off])
      return
    }catch(e){ worker=null }
  }
  mainThread()
}

/* ================================================================
   Resize
================================================================ */
function resize(){
  const v=viewport()
  HERO.style.height=(7*v.h)+'px'   // 6 tracks of travel + the pinned stage (Vesper: 700lvh)
  if(worker) worker.postMessage({type:'resize',...v})
  else if(scene) scene.resize(v.w,v.h,v.dpr)
  measure()
}
addEventListener('resize',resize,{passive:true})
addEventListener('load',measure)
resize()
/* the scene starts once the hero copy has painted (two frames), so its downloads never
   compete with the page's first paint */
requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(startScene,0)))

/* ================================================================
   Main loop — sends the scene one frame of state; pauses while the hero is off screen
================================================================ */
let lastNow=performance.now()
function tick(now){
  requestAnimationFrame(tick)
  const dt=Math.min(0.05,Math.max(0.001,(now-lastNow)/1000)); lastNow=now
  const y=updateClock()
  timeline.advance(dt)
  const clock=timeline.getProgress()
  updateOverlays(clock,loaded)
  paintBeats(clock)
  if(loaded && (y>7*vh+2 || y<-vh)) return   // hero not on screen: skip the GPU work
  const st={now,progress:clock,outro:getOutro(),px:pointer.x,py:pointer.y,ph:pointerHas}
  if(worker){ if(!busy){ busy=true; worker.postMessage({type:'frame',st}) } }
  else if(scene) scene.frame(st)
}
requestAnimationFrame(tick)
}
