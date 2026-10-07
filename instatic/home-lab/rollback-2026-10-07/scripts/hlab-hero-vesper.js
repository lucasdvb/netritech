/* hlab-hero-vesper.js — Home Lab hero only.
   Vesper (GetLayers template) scroll scene: orb -> spiral galaxy -> brain, with the
   three text overlays timed to the same 0->4 scroll clock. The scene code below
   (helpers .. CameraRig) is the template's portable port, verbatim; only the page
   wiring at the end is new: the clock reads the scroll inside .hlab-hero (a
   700lvh pinned track) instead of Vesper's four page tracks, no Lenis (the page
   keeps its own smooth scroll), no full-page loader, and rendering pauses once
   the hero has scrolled away. Scene colours: ORB / GALAXY / *_CONFIG below. */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const HERO=document.querySelector('.hlab-hero')
const CANVAS=document.querySelector('.hlab-hero-canvas')
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
const linVec=(hex)=>{const c=new THREE.Color(hex);return new THREE.Vector3(c.r,c.g,c.b)}

/* ================================================================
   Exact scene constants — verbatim from src/lib/scene/constants.ts
   and color-store.ts. Do NOT approximate.
================================================================ */
const ORB={bg:'#0D141F',flameA:'#2F5E9E',flameB:'#1FA39C',flameAmt:0.5,atmo:'#DCEBF2',
  atmoSpread:2.2,atmoFadeNear:2.0,atmoFadeFar:3.2,atmoAlpha:0.5}
const GALAXY={bg:'#0D141F',flameA:'#2F5E9E',flameB:'#1FA39C',flameAmt:0.195,atmo:'#DCEBF2',
  atmoSpread:4.0,atmoFadeNear:5.0,atmoFadeFar:6.5,atmoAlpha:0.6}
const SCENE_BACKGROUND=ORB.bg
const ORB_CONFIG={colorTop:'#45D6C4',colorBottom:'#3A6FD0',colorEdge:'#2B4F9A',deform:0.135,
  brightness:1.24,opacity:1,spin:0.17,tilt:0.39,pointerRadius:1.76,oilBulge:0.46,oilRipple:0.34,
  oilDrag:0.95,rippleFreq:11,rippleSpeed:4,iridescence:0.25,radius:1,approach:2.6,distortGain:3.4}
const GALAXY_CONFIG={colorEdge:'#3A6FD0',colorCore:'#45D6C4',opacity:0.55,pointSize:6,brightness:1.02,
  armSpin:0.4,tilt:-0.5,scale:0.18,cameraZ:48,dive:30,diveTilt:0.5,parallax:4,pointerRadius:5,pointerStrength:2}
const BRAIN_CONFIG={colorCool:'#3A6FD0',colorWarm:'#45D6C4',colorEdge:'#2B4F9A',colorCenter:'#0D141F',
  colorSynapse:'#DCEBF2',colorDeep:'#0D141F',colorCursor:'#5ED6DE',centerRadius:0.37,centerFalloff:4,
  size:0.067,synapseRate:0.1,flowSpeed:2.3,flowAmount:0.025,glow:1.4,depthDarkness:1,radius:1.15,
  count:140000,cursorTilt:0.22,scrollSpin:2.4,baseRotationY:-1.309-1.5708,approach:2.5}
const ORB_PARALLAX=0.35
const INTRO_DOLLY=10

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

/* Intro / Outro clocks (port of lib/scene/intro.ts + outro.ts) */
const INTRO_DURATION_MS=2900
let introStart=null
const startIntro=()=>{ if(introStart===null) introStart=performance.now() }
const getIntro=()=>{ if(introStart===null) return 0
  const t=clamp01((performance.now()-introStart)/INTRO_DURATION_MS); return 1-Math.pow(1-t,3) }
let outro=0
const setOutro=v=>{outro=v}
const getOutro=()=>outro

/* ================================================================
   Renderer / scene / camera
================================================================ */
const canvas=CANVAS
const clampDpr=()=>{const d=window.devicePixelRatio||1;const[lo,hi]=PARAMS.dpr;return Math.min(Math.max(d,lo),hi)}
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'})
renderer.setPixelRatio(clampDpr())
renderer.toneMapping=THREE.ACESFilmicToneMapping
renderer.toneMappingExposure=1
renderer.outputColorSpace=THREE.SRGBColorSpace
const scene=new THREE.Scene()
scene.background=new THREE.Color(SCENE_BACKGROUND)
const camera=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.1,400)
camera.position.set(0,0,PARAMS.orbCameraZ+INTRO_DOLLY)
scene.add(camera)

/* Bloom composer — port of scene/postprocessing.tsx (the source blooms the
   additive forms; this is what lifts the cyan flame corners into the soft teal
   nebula wash). RenderPass -> UnrealBloomPass -> OutputPass (ACES + sRGB, once).
   Weakest tier renders direct (no bloom), matching adaptive.bloom. */
const composer=new EffectComposer(renderer)
composer.addPass(new RenderPass(scene,camera))
const bloomPass=new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth,window.innerHeight),
  0.62,  // strength — soft teal nebula wash, not a green blow-out
  0.6,   // radius
  0.6)   // luminance threshold (linear) — only hot cores/flames bloom
const outputPass=new OutputPass()
if(PARAMS.bloom){ composer.addPass(bloomPass); composer.addPass(outputPass) }
else { composer.addPass(outputPass) }

/* Pointer in NDC (y up), matching r3f's `pointer`. */
const pointer=new THREE.Vector2(0,0)
let pointerHas=false
addEventListener('pointermove',e=>{
  pointerHas=true
  pointer.x=(e.clientX/window.innerWidth)*2-1
  pointer.y=-((e.clientY/window.innerHeight)*2-1)
},{passive:true})

/* ================================================================
   GLSL — verbatim ports of scene/shaders/snoise.ts
================================================================ */
const SNOISE=`
  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }`
const WARP3D=`
  vec3 warp3d(vec3 pos, float t){
    float curv = 0.8, a = 1.9, b = 0.7;
    pos *= 2.0;
    pos.x += curv*sin(t + a*pos.y) + t*b; pos.y += curv*cos(t + a*pos.x);
    pos.y += curv*sin(t + a*pos.z) + t*b; pos.z += curv*cos(t + a*pos.y);
    pos.z += curv*sin(t + a*pos.x) + t*b; pos.x += curv*cos(t + a*pos.z);
    return 0.5 + 0.5*cos(pos.xyz + vec3(1, 2, 4));
  }`

/* ================================================================
   BACKDROP — clip-space flame quad (port of backdrop.tsx)
================================================================ */
const Backdrop=(()=>{
  const orb={bg:linVec(ORB.bg),flameA:linVec(ORB.flameA),flameB:linVec(ORB.flameB),flameAmt:ORB.flameAmt}
  const gal={bg:linVec(GALAXY.bg),flameA:linVec(GALAXY.flameA),flameB:linVec(GALAXY.flameB),flameAmt:GALAXY.flameAmt}
  const u={iTime:{value:0},uBg:{value:orb.bg.clone()},uFlameA:{value:orb.flameA.clone()},
    uFlameB:{value:orb.flameB.clone()},uFlameAmt:{value:orb.flameAmt}}
  const mat=new THREE.ShaderMaterial({uniforms:u,depthTest:false,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
    fragmentShader:`uniform float iTime;uniform vec3 uBg;uniform vec3 uFlameA;uniform vec3 uFlameB;uniform float uFlameAmt;varying vec2 vUv;
      ${WARP3D}
      void main(){
        vec2 uv=2.0*vUv-1.0;
        vec3 w=pow(warp3d(vec3(uv.x,sin(uv.y),uv.y),iTime*1.5),vec3(1.5));
        vec3 flame=1.5*uFlameA*w.x; flame*=w.y; flame+=uFlameB*w.z;
        flame*=smoothstep(0.25,1.0,abs(uv.y));
        float md=smoothstep(-0.7,1.0,-uv.y*uv.x); flame*=md*md;
        vec3 bg=uBg*(1.0-0.4*length(uv));
        gl_FragColor=vec4(bg+flame*uFlameAmt,1.0);
      }`})
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat)
  mesh.frustumCulled=false; mesh.renderOrder=-1; scene.add(mesh)
  return{ render(t){ const p=galaxyPresence(timeline.getState())
    u.iTime.value=t
    u.uBg.value.lerpVectors(orb.bg,gal.bg,p)
    u.uFlameA.value.lerpVectors(orb.flameA,gal.flameA,p)
    u.uFlameB.value.lerpVectors(orb.flameB,gal.flameB,p)
    u.uFlameAmt.value=orb.flameAmt+(gal.flameAmt-orb.flameAmt)*p } }
})()

/* ================================================================
   HERO LINE — thin rule behind the orb (port of hero-line.tsx)
================================================================ */
const HeroLine=(()=>{
  const u={uY:{value:0.33},uThickness:{value:0.0015},uMaskRadius:{value:0.2},uAlpha:{value:0}}
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
    fragmentShader:`uniform float uY;uniform float uThickness;uniform float uMaskRadius;uniform float uAlpha;varying vec2 vUv;
      void main(){
        float d=abs(vUv.y-uY);
        float line=1.0-smoothstep(0.0,uThickness,d);
        float side=smoothstep(uMaskRadius*0.6,uMaskRadius,abs(vUv.x-0.5));
        gl_FragColor=vec4(vec3(1.0),line*side*0.2*uAlpha);
      }`})
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat)
  mesh.frustumCulled=false; mesh.renderOrder=-0.5; scene.add(mesh)
  const DESIGN_WIDTH=1440,LINE_FROM_BOTTOM=264
  return{ render(){ const w=window.innerWidth,h=window.innerHeight
    const intro=getIntro(),clock=timeline.getProgress()
    const fromBottomPx=(LINE_FROM_BOTTOM*w)/DESIGN_WIDTH
    u.uY.value=Math.min(Math.max(fromBottomPx/Math.max(1,h),0.02),0.95)
    u.uThickness.value=0.6/Math.max(1,h)
    u.uMaskRadius.value=(0.36*h)/Math.max(1,w)
    const revealed=clamp01((intro-0.35)/0.65),gone=clamp01((clock-0.08)/0.2)
    u.uAlpha.value=revealed*(1-gone)
    mesh.visible=u.uAlpha.value>0.002 } }
})()

/* ================================================================
   ORB — noise-displaced point sphere (port of orb.tsx + orb-shaders.ts)
================================================================ */
const oilPointer=(radius=>{
  const smooth=new THREE.Vector3(0,0,radius),prev=new THREE.Vector3(0,0,radius)
  const velocity=new THREE.Vector3(),rawVel=new THREE.Vector3()
  const ndc=new THREE.Vector3(),dir=new THREE.Vector3(),o2c=new THREE.Vector3()
  const target=new THREE.Vector3(),radial=new THREE.Vector3(),ptr=new THREE.Vector2()
  const st={energy:0,idle:0}
  return{cursor:smooth,velocity,get energy(){return st.energy},
    step(cam,pn,centre,enabled,delta){
      const ease=b=>1-Math.pow(1-b,delta*60)
      ptr.lerp(pn,ease(0.11))
      target.copy(smooth)
      if(enabled){
        ndc.set(ptr.x,ptr.y,0.5).unproject(cam)
        dir.copy(ndc).sub(cam.position).normalize()
        o2c.copy(cam.position).sub(centre)
        const b=2*dir.dot(o2c),c=o2c.lengthSq()-radius*radius,disc=b*b-4*c
        if(disc>=0){const t=(-b-Math.sqrt(disc))/2;target.copy(o2c).addScaledVector(dir,t)}
        else{const tc=Math.max(0,-dir.dot(o2c));target.copy(o2c).addScaledVector(dir,tc).normalize().multiplyScalar(radius)}
      }
      prev.copy(smooth); smooth.lerp(target,ease(0.1))
      rawVel.subVectors(smooth,prev).multiplyScalar(2.5)
      radial.copy(smooth).normalize()
      rawVel.addScaledVector(radial,-rawVel.dot(radial))
      if(rawVel.length()>0.6) rawVel.setLength(0.6)
      velocity.lerp(rawVel,ease(0.16))
      const speed=smooth.distanceTo(prev)
      const drive=clamp(speed*8,0,1)
      if(drive>st.energy) st.energy+=(drive-st.energy)*ease(0.08)
      else st.energy*=Math.pow(0.97,delta*60)
      st.idle=speed<0.0005?st.idle+delta:0
      if(!enabled||st.idle>2.5) st.energy*=Math.pow(0.9,delta*60)
    }}
})(ORB_CONFIG.radius)

const Orb=(()=>{
  const count=PARAMS.orbCount,radius=ORB_CONFIG.radius
  const positions=new Float32Array(count*3),randoms=new Float32Array(count*3)
  const golden=Math.PI*(3-Math.sqrt(5))
  for(let i=0;i<count;i++){
    const y=1-(i/(count-1))*2,r=Math.sqrt(Math.max(0,1-y*y)),th=golden*i
    positions[i*3]=Math.cos(th)*r*radius;positions[i*3+1]=y*radius;positions[i*3+2]=Math.sin(th)*r*radius
    randoms[i*3]=Math.random()-0.5;randoms[i*3+1]=Math.random()-0.5;randoms[i*3+2]=Math.random()-0.5
  }
  const geo=new THREE.BufferGeometry()
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3))
  geo.setAttribute('aRandom',new THREE.BufferAttribute(randoms,3))
  const u={
    uTime:{value:0},uPR:{value:renderer.getPixelRatio()},uSize:{value:PARAMS.orbPointSize},
    uDeform:{value:ORB_CONFIG.deform},uOut:{value:0},uAssemble:{value:0},uCore:{value:0},
    uCentre:{value:new THREE.Vector3()},uCamLocal:{value:new THREE.Vector3(0,0,1)},
    uColTop:{value:linVec(ORB_CONFIG.colorTop)},uColBottom:{value:linVec(ORB_CONFIG.colorBottom)},
    uColEdge:{value:linVec(ORB_CONFIG.colorEdge)},uBrightness:{value:ORB_CONFIG.brightness},
    uOpacity:{value:ORB_CONFIG.opacity},uAppear:{value:0},
    uCursor:{value:new THREE.Vector3(0,0,ORB_CONFIG.radius)},uCursorVel:{value:new THREE.Vector3()},uEnergy:{value:0},
    uPointerRadius:{value:ORB_CONFIG.pointerRadius},uOilBulge:{value:ORB_CONFIG.oilBulge},
    uOilRipple:{value:ORB_CONFIG.oilRipple},uOilDrag:{value:ORB_CONFIG.oilDrag},
    uRippleFreq:{value:ORB_CONFIG.rippleFreq},uRippleSpeed:{value:ORB_CONFIG.rippleSpeed},uIri:{value:ORB_CONFIG.iridescence},
  }
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      uniform float uTime;uniform float uSize;uniform float uPR;uniform float uDeform;
      uniform float uOut;uniform float uAssemble;uniform float uCore;
      uniform vec3 uCentre;uniform vec3 uCamLocal;uniform vec3 uCursor;uniform vec3 uCursorVel;
      uniform float uEnergy;uniform float uPointerRadius;uniform float uOilBulge;uniform float uOilRipple;
      uniform float uOilDrag;uniform float uRippleFreq;uniform float uRippleSpeed;
      attribute vec3 aRandom;
      varying float vAlpha;varying float vLit;varying float vVert;varying float vSide;varying float vOil;
      ${SNOISE}
      void main(){
        vec3 p=position;
        float n1=snoise(p*1.6+vec3(0.0,uTime*0.18,0.0));
        float n2=snoise(p*3.3-vec3(uTime*0.12));
        float disp=n1*0.72+n2*0.28;
        vec3 pos=p*(1.0+uDeform*disp);
        float lit=smoothstep(-0.25,0.5,disp); vLit=lit;
        vec3 axis=normalize(uCamLocal);
        float axial=dot(pos,axis);
        float radial=length(pos-axis*axial);
        float bore=mix(0.36,0.56,uCore)*(1.0+disp*0.55);
        float hole=smoothstep(bore,bore+0.10,radial);
        float delay=(aRandom.z+0.5)*0.55;
        float t=clamp((uAssemble-delay)/(1.0-delay),0.0,1.0);
        float ease=1.0-pow(1.0-t,3.0);
        vec3 spawn=uCamLocal*0.92+vec3(aRandom.x*1.9,-1.7+aRandom.y*1.3,0.0);
        pos=mix(spawn,pos,ease);
        float assembleFade=ease;
        float out2=uOut*uOut;
        vec3 flow=normalize(p+aRandom*0.4);
        float sheet=snoise(p*1.9+vec3(uTime*0.25));
        float ripple=sin(length(p)*6.0-uTime*1.6+sheet*3.0);
        float travel=out2*(9.0+sheet*5.0+ripple*1.6);
        pos+=flow*travel;
        pos+=vec3(sheet,ripple,sheet*ripple)*uOut*0.55;
        vec4 wpos=modelMatrix*vec4(pos,1.0);
        vec3 wN=normalize(wpos.xyz-uCentre);
        float ang=acos(clamp(dot(wN,normalize(uCursor)),-1.0,1.0));
        float fall=smoothstep(uPointerRadius,0.0,ang);
        float bulge=fall*fall;
        float oilRipple=sin(ang*uRippleFreq-uTime*uRippleSpeed)*fall;
        float oil=(bulge*uOilBulge+oilRipple*uOilRipple)*uEnergy;
        wpos.xyz+=wN*oil;
        wpos.xyz+=uCursorVel*fall*uOilDrag*uEnergy;
        vOil=(bulge+max(oilRipple,0.0)*0.5)*uEnergy;
        vec4 mv=viewMatrix*wpos;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uSize*uPR*(1.0/max(0.1,-mv.z));
        vVert=mv.y; vSide=abs(mv.x);
        float depth=pos.z*0.5+0.5;
        float outFade=1.0-smoothstep(0.0,0.92,uOut);
        vAlpha=hole*(0.28+0.32*depth)*(0.38+0.72*lit)*outFade*assembleFade;
      }`,
    fragmentShader:`
      precision highp float;
      uniform vec3 uColTop;uniform vec3 uColBottom;uniform vec3 uColEdge;
      uniform float uBrightness;uniform float uOpacity;uniform float uAppear;uniform float uIri;
      varying float vAlpha;varying float vLit;varying float vVert;varying float vSide;varying float vOil;
      void main(){
        vec2 uv=gl_PointCoord-0.5;
        float d=length(uv);
        if(d>0.5) discard;
        float soft=smoothstep(0.5,0.0,d);
        soft=soft*soft*1.2;
        float core=smoothstep(0.13,0.0,d);
        float vt=clamp(vVert*0.5+0.5,0.0,1.0);
        vec3 col=mix(uColBottom,uColTop,vt);
        col=mix(col,uColEdge,smoothstep(0.72,1.15,vSide));
        col*=(0.78+0.42*vLit);
        col+=smoothstep(0.6,1.0,vLit)*core*vec3(0.45);
        float cap=smoothstep(0.55,1.05,abs(vVert));
        col+=col*cap*1.1;
        float capA=1.0+0.6*cap;
        float oilMask=clamp(vOil,0.0,1.0);
        vec3 iri=0.5+0.5*cos(6.2831853*(vOil*2.4+abs(vVert)*0.3+vec3(0.0,0.33,0.67)));
        col=mix(col,iri,oilMask*uIri);
        col+=oilMask*0.3;
        col*=uBrightness;
        gl_FragColor=vec4(col,soft*vAlpha*capA*uOpacity*uAppear*(1.0+oilMask*0.5));
      }`})
  const group=new THREE.Group()
  const points=new THREE.Points(geo,mat); points.frustumCulled=false
  group.add(points); scene.add(group)
  const centre=new THREE.Vector3(),camLocal=new THREE.Vector3()
  return{ render(t,delta){
    const state=timeline.getState(),progress=timeline.getProgress(),intro=getIntro()
    const handoff=1-getOutro()
    u.uTime.value=t; u.uPR.value=renderer.getPixelRatio(); u.uAppear.value=handoff
    u.uAssemble.value=intro; u.uOut.value=orbDissolve(state); u.uCore.value=orbCoreOpen(progress)
    points.rotation.y=t*ORB_CONFIG.spin; points.rotation.x=Math.sin(t*0.1)*ORB_CONFIG.tilt
    const approach=orbApproach(progress)
    group.position.z=PARAMS.orbMoveY*ORB_CONFIG.approach*approach
    u.uDeform.value=ORB_CONFIG.deform*(1+approach*ORB_CONFIG.distortGain)
    points.updateMatrixWorld()
    camLocal.copy(camera.position); points.worldToLocal(camLocal); u.uCamLocal.value.copy(camLocal)
    centre.set(0,group.position.y,0); u.uCentre.value.copy(centre)
    oilPointer.step(camera,pointer,centre,PARAMS.pointerReaction,delta)
    u.uCursor.value.copy(oilPointer.cursor); u.uCursorVel.value.copy(oilPointer.velocity); u.uEnergy.value=oilPointer.energy
    group.visible=intro>0.001&&handoff>0.002&&orbAlpha(state)>0.002
  }}
})()

/* ================================================================
   GALAXY — two-arm spiral (port of galaxy.tsx + galaxy-shaders.ts)
================================================================ */
const Galaxy=(()=>{
  const sphere=new THREE.SphereGeometry(4.2,PARAMS.galaxyWidthSegments,PARAMS.galaxyHeightSegments)
  const vertexCount=sphere.attributes.position.count
  const duplicates=sphere.index?sphere.index.count/vertexCount:1
  sphere.setIndex(null)
  const opacity=GALAXY_CONFIG.opacity*duplicates
  const u={
    uTime:{value:0},uAppear:{value:0},uFade:{value:1},uBlow:{value:0},uAssemble:{value:1},
    uColEdge:{value:linVec(GALAXY_CONFIG.colorEdge)},uColCore:{value:linVec(GALAXY_CONFIG.colorCore)},
    uOpacity:{value:opacity},uSize:{value:GALAXY_CONFIG.pointSize},uBrightness:{value:GALAXY_CONFIG.brightness},
    uArmSpin:{value:GALAXY_CONFIG.armSpin},uScale:{value:GALAXY_CONFIG.scale},uCursor:{value:new THREE.Vector3()},
    uRepelRadius:{value:GALAXY_CONFIG.pointerRadius},uRepelStrength:{value:GALAXY_CONFIG.pointerStrength},uActivity:{value:0},
  }
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      uniform float uTime;uniform float uSize;uniform float uArmSpin;uniform float uScale;uniform float uBlow;uniform float uAssemble;
      uniform vec3 uColEdge;uniform vec3 uColCore;uniform vec3 uCursor;uniform float uRepelRadius;uniform float uRepelStrength;uniform float uActivity;
      varying float vFade;varying vec3 vColor;
      void main(){
        float gRnd1=fract(sin(dot(position.xyz,vec3(12.989,78.233,45.164)))*43758.545);
        float gRnd2=fract(sin(dot(position.xyz,vec3(93.989,67.345,54.256)))*24634.634);
        float gRnd3=fract(sin(dot(position.xyz,vec3(43.332,11.235,89.234)))*56475.234);
        float gRnd4=fract(sin(dot(position.xyz,vec3(75.321,32.123,23.456)))*35432.123);
        float galaxyR=pow(gRnd1,2.0)*60.0+pow(gRnd2,3.0)*30.0;
        float swirl=pow(galaxyR,1.1)*0.08;
        float armIndex=floor(gRnd2*2.0);
        float baseAngle=armIndex*3.14159265;
        float uniformTheta=gRnd3*2.0-1.0;
        float dTheta=pow(uniformTheta,5.0)*3.14159;
        float theta=baseAngle+swirl+dTheta+uTime*uArmSpin;
        float gx=galaxyR*cos(theta);
        float gz=galaxyR*sin(theta);
        float gyDisc=pow(gRnd4*2.0-1.0,3.0)*1.5;
        vec3 basePos=vec3(gx,gyDisc,gz);
        float bulgeStrength=smoothstep(25.0,0.0,galaxyR);
        float gRnd5=fract(sin(gRnd1*44.44+gRnd2)*555.55);
        float gRnd6=fract(sin(gRnd3*66.66+gRnd4)*777.77);
        float gRnd7=fract(sin(gRnd5*88.88+gRnd6)*999.99);
        float phi=acos(gRnd5*2.0-1.0);
        float thetaS=gRnd6*6.2831853+uTime*(uArmSpin*2.0);
        float rS=pow(gRnd7,2.0)*18.0;
        vec3 bulge=vec3(rS*sin(phi)*cos(thetaS),rS*cos(phi),rS*sin(phi)*sin(thetaS));
        vec3 galaxyPos=mix(basePos,bulge,bulgeStrength);
        vec3 blowDir=normalize(vec3(gRnd1,gRnd2,gRnd3)-0.5+0.0001);
        float delay=gRnd4*0.45;
        float at=clamp((1.0-uAssemble-delay)/(1.0-delay),0.0,1.0);
        float aEase=1.0-pow(1.0-at,3.0);
        vec3 spawn=galaxyPos+blowDir*70.0+vec3(0.0,(gRnd3-0.5)*26.0,0.0);
        galaxyPos=mix(spawn,galaxyPos,aEase);
        galaxyPos+=blowDir*uBlow*90.0;
        vec3 finalPos=galaxyPos*uScale;
        vec4 modelPosition=modelMatrix*vec4(finalPos,1.0);
        vec3 toP=modelPosition.xyz-uCursor;
        float cd=length(toP);
        float fall=smoothstep(uRepelRadius,0.0,cd);
        modelPosition.xyz+=normalize(toP+vec3(0.0001))*fall*uRepelStrength*uActivity;
        vec4 mvPosition=viewMatrix*modelPosition;
        float coreMix=smoothstep(80.0,0.0,galaxyR);
        vColor=mix(uColEdge,uColCore,clamp(coreMix,0.0,1.0));
        float isOrb=step(0.98,fract(gRnd1*77.77));
        float starSize=mix(1.0,3.0,isOrb);
        vFade=mix(0.7,1.0,isOrb);
        gl_PointSize=uSize*starSize*(10.0/-mvPosition.z);
        gl_PointSize=max(gl_PointSize,1.5);
        gl_Position=projectionMatrix*mvPosition;
      }`,
    fragmentShader:`
      uniform float uOpacity;uniform float uBrightness;uniform float uAppear;uniform float uFade;
      varying float vFade;varying vec3 vColor;
      void main(){
        vec2 xy=gl_PointCoord-0.5;
        float ll=length(xy);
        if(ll>0.5) discard;
        float a=smoothstep(0.5,0.1,ll);
        gl_FragColor=vec4(vColor*uBrightness,vFade*a*uOpacity*uAppear*uFade);
      }`})
  const group=new THREE.Group()
  const points=new THREE.Points(sphere,mat); points.frustumCulled=false
  group.add(points); scene.add(group)
  const cursor=new THREE.Vector3(),cursorTarget=new THREE.Vector3(),ndc=new THREE.Vector3(),rayDir=new THREE.Vector3()
  let activity=0
  return{ render(t,delta){
    const state=timeline.getState()
    const appear=galaxyAppear(state),blow=galaxyBlow(state),assemble=galaxyAssemble(state)
    u.uTime.value=t; u.uAppear.value=appear; u.uBlow.value=blow; u.uFade.value=1-blow; u.uAssemble.value=assemble
    group.rotation.x=-(GALAXY_CONFIG.tilt+state.galaxyDive*GALAXY_CONFIG.diveTilt)
    group.rotation.z=PARAMS.pointerReaction?pointer.x*0.12:0
    cursorTarget.set(0,0,0)
    if(PARAMS.pointerReaction){
      ndc.set(pointer.x,pointer.y,0.5).unproject(camera)
      rayDir.copy(ndc).sub(camera.position).normalize()
      if(Math.abs(rayDir.z)>1e-4){const tt=-camera.position.z/rayDir.z; if(tt>0&&Number.isFinite(tt)) cursorTarget.copy(camera.position).addScaledVector(rayDir,tt)}
    }
    cursor.lerp(cursorTarget,0.12); u.uCursor.value.copy(cursor)
    const wanted=PARAMS.pointerReaction?1:0
    activity+=(wanted-activity)*Math.min(1,delta*4); u.uActivity.value=activity
    group.visible=(appear>0.001||assemble<0.999)&&blow<0.999
  }}
})()

/* ================================================================
   BRAIN — the REAL baked mesh (port of brain-geometry.ts), embedded as
   a base64 VBRN container and area-sampled at runtime. Shaders are the
   verbatim brain-shaders.ts (cool→warm tint, edge, synapse flashes,
   tangential flow, explode assembly).
================================================================ */
const BRAIN_MESH_B64='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kACRAJAAjQCMAI0AkgCPAJIAjQCRAJMAlACVAJUAlgCTAJcAlACTAJQAlwCYAJMAlgCZAJkAlwCTADMAmgA0AJoAMwA1AJsAnACdAJ0AngCbAJ4AnwCbAJ8AngCgAJ8AoQCbAKEAnACbAKIAowCkAKIApQCjAKYApwCoAKcApgCpAKYAqgCpAKoApgCrAKgAqwCmAKsAqACsAK0ArgCvAK4ArQCwAK4AsQCvALEAsgCvALIAswCvALMArQCvALQAtQC2ALQAtgC3ALcAuAC5ALgAtwC2ALoAuwC2ALsAuAC2ALwAvQC+AL0AvwC+AMAAwQC+AMEAvAC+AL8AwgC+AMIAwAC+AMMAAwAAAAMAwwDEAMUAwwDGAMYAwwDHAMQAxQDIAMUAxADDAMkAygDLAMoAzADLAM0AyQDLAMkAzQDOAMsAzADPAM8AzQDLANAA0QDSANEA0ADTANAA1ADTANQA1QDTANEA0wDWANUA1gDTAHEA1wDYANcAcQDZANoA1wDbANcA2gDYANwA2gDdANoA3ADYANgA3ADeANgA3gDfAHEA3wBvAN8AcQDYAOAA4QDiAOEA4ADjAOQA5QDjAOQA4wDgAOMA5gDnAOYA4wDlAOMA6ADpAOMA6QDhAOoA6wDsAOsA6gDtAO0A6gDuAO0A7gDvAPAA7wDxAO8A8ADtAO0A8gDrAPIA7QDzAPAA8wDtAPMA8AD0APUA9gD3APUA9wD4APkA+gD1APkA9QD4APsA9gD1APYA+wD8APsA/QD+AP0A+wD1APoA/QD1AP0A+gD/AAABAQECAQEBAAEDAQABBAEDAQQBAAEFAQABBgEFAQYBAAECAQcBCAEJAQoBCQEIAQsBDAENAQwBCwEIAQcBDAEIAQwBBwEOAQsBDwEIAQ8BCwEQAQoBDwERAQ8BCgEIARIBEwEUARMBEgEVARIBFgEVARYBEgEXARIBGAEXARgBEgEUAcwAGQHPAMoAGgHMAMwAGgEbARwBHQEeARwBHwEdASABIQEcASEBIAEiARwBIQEjAR8BIwEkASMBHwEcASABHgElAR4BIAEcAXEAbgAmAXEAJgHZAG4AgQCDAG4AgwAnASgBKQEqASkBKAErASgBLAEtASwBKAEqASoBLgEsAS4BKgEvATABLwExASoBMQEvATEBKQEyASkBMQEqATMBKAAmACgAMwE0ATUBJQA2ASUANQEmADMBNQE3ATUBMwEmADgBOQE6ATkBOAE7ATwBOgE9AToBPAE4ATkBPgE6AT4BPQE6AT8BQAFBAUABPwFCAUIBQwFEAUMBQgE/AUUBRAFGAUQBRQFCAUUB1gBCAdYARQFHAUABQgHVANUAQgHWAEgBSQFKAUkBSAFLAUgBTAFLAUwBSAFNAUgBTgFNAU4BSAFKAU8BUAFRAVABUgFRAVIBUwFRAVMBUgFUAVMBVQFRAVUBTwFRAUcAVgFXAVYBRwBJAFgBWQFaAVkBWwFaAVoBXAFdAVoBXQFYAVoBWwFeAVoBXgFcAV8BYAFhAWABXwFiAWMBZAFgAWMBYAFiAWUBYAFkAWABZQFhAVEAMgBQADIAUQBmAWcBUQBSAFEAZwFmAWgBaQFmAWgBZgFnAWoBawFsAWsBagFtAWoBbgFtAW4BagFvAXABcQFtAXEBcAFyAWsBbQFzAXMBbQFxAXABbgF0AW4BcAFtAfoAdQF2AXUB+gD5APkAdwF1AXcB+QD4AHgBeQF6AXoBewF4AXgBfAF9AX0BeQF4AXgBewF+AX4BfAF4AX8BgAGBAYABfwGCAYMBgQGAAYEBgwGEAQUBhQGGAYUBBQEGAT0AhwGIAYcBPQA8ADwAiQGHAYkBPAA6AIoBiwGMAYsBjQGMAYwBjgGPAY8BigGMAY0BjgGMAY4BjQGQAZEBkgGTAZIBkQGUAZMBlQGRAZUBkwGWAZUBlwGRAZcBlAGRAZgBmQGaAZkBmwGaAZwBnQGaAZ0BnAGeAZgBnQGfAZ0BmAGaAaABoQGiAaEBowGiAaIBpAGgAaUBpAGiAaIBpgGlAaYBogGjAVsApwGoAacBWwBaAKgBqQGqAakBqAGnAasBqAGsAawBqAGqAagBqwGtAVsArQFfAK0BWwCoAa4BrwGwAa4BsAGxAbIBsQGzAbEBsgGuAa4BsgG0Aa4BtAG1AbYBtwG4AbcBtgG5AbYBugG5AboBtgG7AbYBvAG7AbwBtgG4Ab0BvgG/Ab4BvQHAAcEBvQHCAb0BwQHAAcABwQHDAcABwwHEAcUBxgHHAcYBxQHIAcUByQHIAckBxQHKAcUBywHKAcsBxQHHAcwBqgDNAaoAzgHNAc8BzAHNAcwBzwHQAc0BzgHRAdEBzwHNAdIB0wHUAdMB0gHVAdIB1AHWAdYB1AHXARYB1wHUAdcBFgEkARYB2AEVAdgBFgHUAdkB2gHbAdoB3AHbAd0B3gHbAd4B2QHbAdwB3QHbAd0B3AHfAeAB4QHiAeEB4AHjATAB4QEvAeEBMAHiAeQB4gHlAeIBMAHmAeYB5QHiAecB6AHpAeoB6QHoAegB5wGhAegBoQGgAegBpAHqAaQB6AGgAX4B6wF8AesBfgHsAe0B7gF8Ae4BfQF8Ae0B6wHvAesB7QF8AfAB8QHyAfEB8AHzAfMB9AH1AfQB8wHwAfMBKgDxAfMB9gEqAPcB+AH5AfgB9wH6AVwBXgH6AV4B+AH6AfoBXQFcAV0B+gH3AfsBVwD8AVcA+wH9Af4B+wH/AfsB/gH9Af0BAAJVAP0BVQBXAAACAQICAgECAAL9Af4BAQL9AQEC/gEDAr0ABALOAL0AzgDNAAQCvAAFArwABAK9AAYCzQDPAM0ABgK9AAcCCAIJAggCBwIKAgcCCwIMAgcCDQILAg0CCQIOAgkCDQIHAg8CEAIRAhACDwISAg8CCgASAgoADwIIABMCFAIVAhQCFgIVAhMCFQIXAgkBGAIZAhgCCQEaArsAGgIbAhoCuwAYAhgCugAZAroAGAK7AJ4BnwGdAZ8BngEcAh0CHgIfAh4CHQIgAiACIQIeAiECIAIiAh0CIwIgAiMCHQIkAiUCJgInAiYCJQIoAiUC9gEoAvYBJQIpAiUCKgIpAioCJQInAosBKwIsAisCiwGKAYoBjwEtAi0CLgKKAS4CKwKKASsCLgIvAjACMQIyAjMCMgIxAjQCNQIxAjUCMwIxAjYCowA3AqMANgI4Ar8BOQI4AjkCvwE6Ar8BNgK9ATYCvwE4AjsCPAI9AjwCPgI9Aj8COwI9AjsCPwJAAj0CPgJBAkECPwI9AkICQwJEAkMCRQJEArABRAKxAbEBRAJFAkICsAFGArABQgJEAkcCSAJJAkcCSQJKAkkCSAJLAksCTAJJAkkCTAJNAk0CSgJJAk4CTwJQAk8CTgJRAlECAwJPAgMCUQJSAk8C/gFQAv4BTwIDAlICUQJTAlICUwJUAlUCVAJWAlQCVQJSAlICAQIDAgECUgJVAlYCVwJVAlcCVgJYAlUCAgIBAgICVQJXAlgCWQJXAlkCWAJaAgICVwJbAlsCVwJZAlwCAgJbAgICXAIAAl0CXgJbAl0CWwJZAlwCXgJfAl4CXAJbAl8CNAFYAF8CWABcAl8CYAJhAmACXwJeAjQBYQIoAGECNAFfAmICYQJjAmMCYQJgAigAYQIpACkAYQJiAmIC8gHxAfIBYgJjAikAYgIqACoAYgLxAWACZAJjAmQCYAJlAvIBYwJmAmYCYwJkAmQCZwJmAmcCZAJoAmkCZgJqAmoCZgJnAvIBaQLwAWkC8gFmAmsCagJsAmoCawJpAmsC8AFpAvABawL0AW0CawJuAm4CawJsAm0C9AFrAvQBbQJvAnACbwJxAm0CcQJvAnICbwJwAm8CcgJzAvQBbwL1AXMC9QFvAnQCcgJ1AnICdAJzAvUBdAJ2AnQC9QFzAnYCdwJ4AncCdgJ0AnkCeAJ6AngCeQJ2AnYCeQLzAfMB9QF2AnoCKAJ5AigCegImAvYBeQIoAnkC9gHzAXsCegJ8AnwCegJ4AiYCewJ9AnsCJgJ6AtgBfQJ+An4CfQJ7AtgB1AF9AtQB0wF9AtMBJwJ9AicCJgJ9An8CewJ8AnsCfwJ+AhMBfwKAAn8CEwF+An4CEwEVARUB2AF+AoACgQKCAoECgAJ/AjsBggI5AYICOwGAAjsBFAGAAhQBEwGAAoICgwKEAoMCggKBAjkBhAKFAoQCOQGCAoUChgKHAoYChQKEAogChwKJAocCiAKFAogCOQGFAjkBiAI+AYkCNwKIAjcCiQI2AogCNwKlAIgCpQA+AYoCwgGJAooCiQKHAjYCwgG9AcIBNgKJAosCjAKKAowCjQKKAo0CwgGKAsIBjQLBAYcCiwKKAosChwKGAo0CjALLAcsBjgKNAsEBjgLDAY4CwQGNAssBjwKOAo8CywHHAcMBjwIjAI8CwwGOAo8CxgGQAsYBjwLHASMAkAIhAJACIwCPAiEAkQIiAJECIQCQApECxgGSAsYBkQKQApMClAKSApQCkQKSApICyAGVAsgBkgLGAZMClQKWApUCkwKSApcCmAKWApgCkwKWApkClgKaApoClgKVApcCmQKbApkClwKWApcCnAKdApwClwKbApsCngKfAp4CmwKZApwCnwKgAp8CnAKbApwCoQKiAqECnAKgAqMCnwKkAp8CowKgAqMCoQKgAqECowKlAqUCpgKhAqYCpQKnAqMCqAKlAqgCowKpAqcCqAKqAqgCpwKlAqcCqgKrAqsCqgKsAq0CqAJxAqgCrQKqAqoCrgKsAq4CqgKtAqwCrwKwAq8CrAKuAq0CsQKuArECrQJuAq4CsgKvArICrgKxAq8CswK0ArMCrwKyArECtQKyArUCsQK2ArICtwKzArcCsgK1ArMCuAK5ArgCswK3ArUCRAG3AkQBtQJGAbcCRAFDAbcCQwG4AroCVAFSAVQBugK5AroCtAK5ArQCswK5ArkCuAK7ArkCuwJUAbwCvQK7Ar0CvgK7Ar4CVAG7AlQBvgJTAbgCvAK7ArwCuAJDAb0CvwK+Ar8CwAK+AsACUwG+AlMBwAJVAb8CwQLAAsECwgLAAsICVQHAAlUBwgLDAsICxALDAsQCxQLDAsUCxgLDAsYCxQLHAsMCTwFVAcMCxgJPAccCyALGAsgCyQLGAskCTwHGAk8ByQJQAcgCygLJAsoCywLJAssCUAHJAlABywLMAssCzQLMAs0CzgLMAs4CugLMAroCzgK0AswCUgFQAcwCugJSAc0CzwLOAs8CsALOArACtALOArQCsAKvAtACzQLRAs0C0ALPAs8C0ALSAtICqwLPAqsCrALPAs8CrAKwAtMC0gLUAtQC0gLQAqYC0wLVAtMCpgLSAqYCpwLSAtICpwKrAtYC1QLXAtcC1QLTAtYCogLVAqIC1gLYAqICoQLVAqECpgLVAtkC1gLaAtYC2QLYAtkCnQLYAp0C2QLbAp0CnALYApwCogLYAtwC3QLbAtwC2wLZAt0CmALbApgC3QLeApgCnQLbAp0CmAKXAt8C4ALeAt8C3gLdAuAClALeApQC4ALhApgC3gKTApMC3gKUAuAC4gLhAuIC4wLhAuMCIgDhAiIA4wIdAOECkQKUApEC4QIiAOIC5ALjAuQC5QLjAuUCHQDjAh0A5QIeAOQC5gLlAuYC5ALnAuUC5gLoAugCHgDlAukC5gLqAuYC6QLoAukCxAHoAsQB6QLAAegCIAAeAOgCxAEgAOsC6gLsAuoC6wLpAukCvgHAAb4B6QLrAu0C7ALuAuwC7QLrAr4B7QLvAu0CvgHrAu8C7QIGAO8CBgAJAO8CCQA6Au8CvwG+Ab8B7wI6AgYA7gIHAO4CBgDtAvACBwDuAgcA8ALxAvAC7ALyAuwC8ALuAvIC8wL0AvQC8ALyAuwC9QLyAvUC7ALqAvMC9QL2AvUC8wLyAvYCTAH3AvYC9wLzAvgC9QLnAvUC+AL2AvgCTAH2AkwB+AJLAfgC5AL5AuQC+ALnAksB+QJJAfkCSwH4AvkC4gL6AuIC+QLkAkkB+gL7AvoCSQH5AvwCSgH7AkoBSQH7AvsC3wL9At8C+wL6AvwC/QL+Av0C/AL7Av8C/AL+Av8C/gIAAwED/gLcAtwC/gL9AgADAQMCAwEDAAP+AgADAwMEAwMDAAMCAwEDBQMCAwUDAQPaAgMDBQMGAwUDAwMCAwMDBgMHAwcDBgMIAwYDBQPXAtcCCQMGAwkDCAMGAwgDCQMKAwgDCgMLAwsDCgMMAwoDCQPUAtQCDQMKAw0DDAMKAwwDDQMOAwwDDwMQAw8DDAMOAw0DygIOA8oCDQPRAg4DyAIPA8gCDgPKAhEDEgMkAhIDEQMQAxEDDAMQAwwDEQMLAxADEwMSAxMDEAMPAxIDFAMVAxQDEgMTAw8DxwITA8cCDwPIAhMDxQIUA8UCEwPHAiMCFgMXAxYDIwIVAyMCJAIVAyQCEgMVAxYDFQMYAxgDFQMUAxkDFgMYAxYDGQMaAxQDxAIYA8QCFAPFAhkDGAMbAxsDGAPEAhwDHQMbAx0DGQMbAxsDwgLBAsICGwPEAhwDwQIeA8ECHAMbAx8DIAMeAyADHAMeAx4DvwIhA78CHgPBAh8DIQMiAyEDHwMeAyMDJAMiAyQDHwMiAyIDJQMmAyUDIgMhAyMDJgMnAyYDIwMiAygDKQMnAykDIwMnAyoDJgMrAyYDKgMnAyoDLAMnAywDKAMnAy0DLgMsAy4DKAMsAy8DKgMwAyoDLwMsAzEDLQMsAzEDLAMvAzIDMwMxAzMDLQMxAzQDLwM1Ay8DNAMxAzIDNAM2AzQDMgMxAzcDOAM2AzgDMgM2AzYDOQP0ADkDNgM0AzcD9ADwAPQANwM2AzQDOgM5AzoDNAM1AzkDOwM8AzsDOQM6A/QAPAPzADwD9AA5AzwDPQM+Az0DPAM7A/MAPgPyAD4D8wA8A/IAPwNAAz8D8gA+Az4DQQM/A0EDPgM9Az8DQgNDA0IDPwNBAz0DRANBA0QDPQPSAEEDRQNCA0UDQQNEA0IDRgNaAkYDQgNFA0UDRwNIA0cDRQNEA0YDSANJA0gDRgNFA0YDZQJdAmUCRgNJA0gDaAJJA2gCSANKA2UCSQNkAmQCSQNoAkgDRwFKA0cBSANHA0oDRQFLA0UBSgNHAWgCSwNnAksDaAJKA0wDRQFGAUUBTANLA0wDagJLA2oCZwJLA7YCRgG1AkYBtgJMA7YCbAJMA2wCagJMA0QD0gBHA9IA0QBHA0cB0QDWANEARwFHA1oCXQJZAl0CWgJGA00DWAJWAlgCTQNDA00DQANDA0ADPwNDA0MDWgJYAloCQwNCA1YCTgNNA04DVgJUAk0DTgNPA08DQANNA04DUANPA1ADTgNRA08DUAPsAOwA6wBPA+sAQANPA0AD6wDyAFEDUgNQA1IDUQNTA1ADUgNUA1ADVAPsAFIDVQNUA1UDVgNUA1QDVgNXA1QDVwNYA+wAWAPqAFgD7ABUA1cDWQNYA1kDVwNaA+oAWQPuAFkD6gBYA1oDWwNZA1sDWgNcA1kDXQPuAF0DWQNbA1sD7wFdA+8BWwPtAV0DXgNfA14DXQPvAe4AXwPvAF8D7gBdA2ADXgNhA14DYANfA2AD8QBfA/EA7wBfA2IDYQNjA2EDYgNgA2ID8QBgA/EAYgNkA4kAYgOHAGIDiQBkA4kANwNkAzcDiQA4A2QDNwPwAGQD8ADxAIcAYwOFAGMDhwBiA2MDYQNlA2MDZQNmA4UAZgNnA2YDhQBjA2cDZgNoA2cDaANpA2kDagNnA2oDaQNrA4UAZwOIAIgAZwNqA2wDawNtA2sDbANqA4gAbAOLAGwDiABqA24DbQNvA20DbgNsA2wDcAOLAHADbANuA24DcQNwA3EDbgNyA3ADMwNzAzMDcANxA4sAcwOKAHMDiwBwA3MDMgM4AzIDcwMzA4oAOAOJADgDigBzA3QDcQNyA3EDdAMuAzMDLgMtAy4DMwNxA3QDcgN1A3UDdgN0A3YDKQN0AykDdgN3Ay4DKQMoAykDLgN0A3cDdgN4A3gDeQN3A3kDJAN3AyQDeQN6A3cDIwMpAyMDdwMkA3oDeQN7A3oDewN8A3wDIAN6AyADfAN9A3oDHwMkAx8DegMgA30DfAN+A34DfwN9A38DHQN9Ax0DfwOAA30DHAMgAxwDfQMdA4ADfwOBA4EDggOAA4IDGgOAAxoDggODAx0DGgMZAxoDHQOAA4IDhAODA4QDhQODA4MDhQOGA4MDhgMXAxoDFwMWAxcDGgODA4UDhwOGA4cDhQOIA4YDhwMiAiICIAKGAyACFwOGAxcDIAIjAogDiQOHA4kDiAOKA4cDiwMiAocDiQOLA4kDUgCLA1IAiQNnAYsDUwCMA4sDUgBTACICjAMhAowDIgKLA4wDVACNA1QAjANTACECjQOOA40DIQKMA44DjwOQA48DjgONA5EDkAOSA5ADkQOOA5EDHgKOAx4CIQKOA5MDkgOUA5IDkwORA5EDkwMfAh8CHgKRA5UDlAMQAJQDlQOTA5MDlQOWA5YDHwKTA5UDlwOWA5cDlQOYA5cDmQOWA5kDlwOaA5kDHwKWAx8CmQMdApoDEQOZAxEDmgMLAx0CEQMkAhEDHQKZA5cDBwOaAwcDlwObAwcDCwOaAwsDBwMIA5wDmwOYA5gDmwOXA5wDnQObA50DBAObA5sDBAMDA5sDAwMHA54DnAMSAJwDngOdA54DTgGdA04B/wKdA/8CBAOdAwQD/wIAA58DEgARABIAnwOeA58DTQGeA00BTgGeA/cCEQATABEA9wKfA0wBTQGfA0wBnwP3AhIAmAMPAJgDEgCcAw8AmAMQABAAmAOVA6ADlAOhA6EDlAOSA6ADEACUAxAAoAMOAKIDoQOjA6EDogOgA6IDCwCgAwsADgCgA6QDowOlA6MDpAOiA6QDpgOiA6YDCwCiA6YDpwOoA6cDpgOkA6gDqQOmA6kDqAOqA6YDDAALAAwApgOpA6oDqwOpA6sDqgN0AQwAqQMVABUAqQOrA6wDdAFuAXQBrAOrA6sDrQMVAK4DrQOvA6wDrwOtA60D8QKwAxUAsAMUALADFQCtA7AD8AL0AvACsAPxAhQA9AITAPQCFACwA68DBACuAwQArwMFAK4DBAAHAK4DBwDxAm8BrANuAawDbwGvA28BBQCvAwUAbwGxA7EDbwFqAWoBsgOxA8MAsgPHALIDwwCxA7EDAAAFAAAAsQPDAGwBswOyA2wBsgNqAccAswO0A7MDxwCyA7QDswO1A7QDtQO2A7QDtwO4A7cDtAO2A8cAuAPGALgDxwC0A7cDuQO4A7kDtwO6A7gDuQO7A7sDxgC4A7sDxQDGAMUAuwO8A70DuwO+A7kDvgO7A70DvAO7A7wDvQO/A78DwAO8A8ADvwPBA8IDvwMLAr0DCwK/A8EDwgPDA8IDwQO/A8QDwQPDA8EDxAPFA8MDxgPHA8YDwwPCA8gDxAPDA8gDwwPHA8kDxAPIA8QDyQPKA8sDxwPMA8cDywPIA8kDywPNA8sDyQPIA8kDzQPOA88DzgPNA80D0APRA9ADzQPLA80D0QPPA9ID0wPUA9MDzwPUA0IA0QNAANEDQgDUA9UD0gPUA9UD1ANCANYD0gPVA9ID1gPXA0IA2APVA9gDQgBEANYD2APZA9gD1gPVA9YD2QPaA9oD2QPbA9wD2QPYA9sD3QPeA90D2wPZA94D3wPbA98D3gPgA94D3QPhA+ED4gPeA+MD3gPiA94D4wPgA+MD5APgA+QD4wPlA+ID5gPjA+YD4gPnA+MD6APlA+gD4wPmA+UD6QPqA+kD5QPoA+YD6wPoA+sD5gMNAesD6QPoA+kD6wPsA+kD7QPuA+0D6QPsA+sD7wPsA+8D8APsA/AD7QPsA+0D8APxA18B7QPxA+0DXwHyA/MD8QPwA/ED8wP0A18B8QNiAWIB8QP0A/UD9APzA/QD9QP2A2IB9gNjAfYDYgH0A/YD9wP4A/cD9gP1A2MB+APjAfgDYwH2A/kD9wP6A/cD+QP4A+MB+APhAeEB+AP5Ay4B+gP7A/oDLgH5A+EB+QMvAS8B+QMuAfoD/AP7A/sD/AP9A/4D/wP7A/4D+wP9A/8DLAH7AywBLgH7AwAEAQT/AwAE/wP+AwEELQH/Ay0BLAH/AwAEGgABBBoAAAQCBAEEGgAYABgALQEBBAMEAAQEBAAEAwQCBAMEBQQCBAUEAwQGBAIEBQQbAAIEGwAaAAYEBwQFBAcEBgQIBAUEBwQcAAUEHAAbAAgEZAAHBGQACAQJBAcEZABmAGYAHAAHBAgECgQJBAoECwQJBAsEDAQJBAwECwQNBAkEZQBkAGUACQQMBA0EDgQMBA4EDQQPBAwEEARlABAEDAQOBGUAEQRhABEEZQAQBA4EEgQQBBIEDgQTBBAEFAQRBBQEEAQSBBEEFQQWBBUEEQQUBBIEFwQUBBcEEgQYBBQEGQQVBBkEFAQXBBUEmACXAJgAFQQZBBcEGgQZBBoEFwQbBBkEHASYABwEGQQaBJgAHQSUAB0EmAAcBBoEHgQcBB4EGgQfBCAEHAQeBBwEIAQdBB0EIQQiBCEEHQQgBB4EIwQgBCMEHgQkBCUEIAQjBCAEJQQhBCUEJgQhBCYEJQQnBCMEKAQlBCgEIwQpBCgEJwQlBCcEKAQqBCoEKwQnBCsEKgQsBCgELQQqBC0EKAQuBCoELQQvBCoELwQsBDAELAQvBCwEMAQxBC0EMgQvBDIELQQzBC8EMgQ0BDQEMAQvBNYBMAQ0BDAE1gE1BDIENgQ0BDYEMgQ3BDQENgTSATQE0gHWATcENgE2BDYBNwQ1ATYENgHVATYE1QHSATgEMgQzBDIEOAQ3BDgENQE3BDUBOAQ3ATkEMwQ6BDMEOQQ4BDkENwE4BDcBOQQ7BPwBOQQ8BDkE/AE7BDsE/AFXAFcAVgA7BDcBVgAzAVYANwE7BDwEOgQ9BDoEPAQ5BD4EPQQ/BD0EPgQ8BD4E/AE8BPwBPgT7AT4EPwRABD4EQAT/Af8B+wE+BEEEmwGZAZsBQQRABEEE/wFABP8BQQRCBEMEQgREBEEERARCBEIETgJQAk4CQgRDBFAC/wFCBP8BUAL+AUQERQRDBEUERARGBEMERwROAkcEQwRFBEUEUwNHBFMDRQRIBFMCUwNRA1MDUwJHBE4CUwJRAlMCTgJHBEgERQRGBEYESQRIBEkEVQNIBFUDSQRKBEgEUgNTA1IDSARVA0kESwRKBEsESQRMBE0ESgRLBEoETQROBEoEVgNVA1YDSgROBE4ETQRPBE4ETwRQBE4EVwNWA1cDTgRQBE8EUQRQBFEETwRSBFAEWgNXA1oDUARRBFIEUwRRBFMEUgRUBFEEXANaA1wDUQRTBFQEVQRTBFUEVARWBFME7gFcA+4BUwRVBFYEVwRVBFcEVgRYBFUEfQHuAX0BVQRXBFgEWQRXBFkEWARaBFcEeQF9AXkBVwRZBFkEWgRbBFkEWwRcBFkEegF5AXoBWQRcBFwEWwQ3ADcANgBcBFwENgA9AFwEPQB6AVoEXQRbBF0EWgReBFsEXQRfBFsEXwQ3AGAEXQRhBF0EYARfBF8EYARiBF8EYgRjBDcAYwQ4AGMENwBfBGMEZARlBGMEYgRkBDgAZQRmBGUEOABjBGYEZwRoBGYEZQRnBGkEaARqBGgEaQRmBDgAZgQ5ADkAZgRpBGsEagRsBGoEawRpBDkAaQQ7ADsAaQRrBG0EbARuBGwEbQRrBDsAawRvBG8EawRtBHAEbQRxBG0EcARvBIkBbwRyBHIEbwRwBIkBOwBvBDsAiQE6AHMEcAR0BHAEcwRyBHUEcwR2BHMEdQRyBHIEdQSHAYcBiQFyBHcEdgR4BHYEdwR1BHcEiAF1BIgBhwF1BHcE7AF+AewBdwR4BHsBiAF3BHsBdwR+AXgEeQR6BHkEeAR2BOwBeAR7BHsEeAR6BHwEegR9BHoEfAR7BH4EewRlA2UDewR8BOwBfgTrAX4E7AF7BF4DfgRhA2EDfgRlA14D6wF+BOsBXgPvAWgDfQR/BH0EaAN8BGUDfARmA2YDfARoA4AEfwR9BH8EgASBBIIEgQSDBIEEggR/BGgDfwRpA2kDfwSCBIIEhASFBIQEggSDBGkDggRrA2sDggSFBIYEhASHBIQEhgSFBGsDhQRtA20DhQSGBIgEhwSJBIcEiASGBIYEbwNtA28DhgSIBIoEiQSLBIkEigSIBG8DiAR1A3UDiASKBIoEjAR4A4wEigSLBIoEdgN1A3YDigR4A4sEjQSMBI0EiwSOBI0EewOMBHsDjQSPBHgDewN5A3sDeAOMBI8EjQSQBI8EkASRBH4DkQSSBJEEfgOPBHsDjwR8A3wDjwR+A5IEkQSTBJMElASSBJQEgQOSBIEDlASVBJIEfwN+A38DkgSBA5UElASWBJYElwSVBJcEhAOVBIQDlwSYBJUEggOBA4IDlQSEA5gElwSZBJkEmgSYBJoEiAOYBIgDmgSKA4QDiAOFA4gDhAOYBJoEmQSbBJsEnASaBJwEigOaBIoDnARoAZwEmwSdBJ0EngScBJ4EaAGcBGgBngRpAZ4EnQSfBJ4EnwSgBGkBoAShBKAEaQGeBKEEoASiBKEEogSjBKEEpASlBKQEoQSjBGkBpQRmAaUEaQGhBKUENQAxADUApQSkBGYBpQQyADIApQQxAKMEpgSkBKYEowSnBDUApgSaAKYENQCkBKYEpwSoBKYEqASpBKYEqgSaAKoEpgSpBKkEqwSqBKsEqQSsBKoErQSuBK0EqgSrBJoArgQ0AK4EmgCqBK4ErwSwBK8ErgStBDQAsAQsALAENACuBLAEsQSyBLAErwSxBCwAsgQtALIELACwBLIEsQSzBLMEtASyBLQELQCyBC0AtAS1BLUEtAS2BLYEtwS1BLgEtwS5BLcEuAS1BC4ALQC1BC4AtQS4BLoEuQS7BLkEugS4BDAALgC4BDAAuAS6BLwEugR/AX8BugS7BDAAvAS9BLwEMAC6BL4ELwC9BC8AMAC9BL8EvQTABMAEvQS8BL4EvwTBBL8EvgS9BMIEwQTDBMMEwQS/BE4AwgRUAMIETgDBBE4AvgTBBL4ETgBQAI8DwgTEBMQEwgTDBI8DVADCBFQAjwONA8UEwwTGBMMExQTEBMcExATIBMUEyATEBMcEjwPEBI8DxwSQA6EDxwSjA8gEowPHBKEDkAPHBJADoQOSA8kExQTKBMUEyQTIBMkEpQPIBKUDowPIBMsEygTMBMoEywTJBMkEzQSlA80EyQTLBM4EywTPBMsEzgTNBKcDzgTQBM4EpwPNBKcDpAPNBKQDpQPNBNEEzgTSBM4E0QTQBNME0QTUBNEE0wTQBKcD0ASoA6gD0ATTBNME1QTWBNUE0wTUBKgD0wSqA6oD0wTWBNYEcgFwAXIB1gTVBNYEdAGqA3QB1gRwAdUE1ATXBNUE1wTYBNUE2QRyAdkE1QTYBNgE2gTZBNoE2ATbBNkE3ATdBNwE2QTaBHIB3QRxAd0EcgHZBN4E3ATfBNwE3gTdBHEB3gRzAd4EcQHdBH0A3wR7AN8EfQDeBHMB3gTgBOAE3gR9AOAEfADhBOIE4QTjBOEE4gTgBOIEcwHgBHMB4gRrAeQE4wTlBOME5ATiBGwBawHiBGwB4gTkBOQE5gS1A+YE5ATlBGwB5ASzA7MD5AS1A+YE5QTnBOYE5wToBOkE6ATqBOgE6QTmBLUD5gS2A7YD5gTpBOkE6wTsBOsE6QTqBLYD7AS3A+wEtgPpBOwE6wTtBOwE7QTuBLcD7gS6A+4EtwPsBO4E7wTwBO4E7QTvBLoD8ATxBPAEugPuBLoDvgO5A74DugPxBPEE3ADdAN0AvgPxBL4D3QAMAvAE3gDcAN4A8ATvBO0E8gTvBPIE7QTzBPIE3gDvBN4A8gT0BPIE9QT0BPUE9gT0BPYE9wT0BPcE9gT4BN4A9ATfAN8A9AT3BPgEcgD3BHIA+AT5BPcEcgBvAPcEbwDfAPoE+QT7BPsE+QT4BPoE/AT5BPwE+gT9BPkE/ARzAPkEcwByAP0E/gT8BP4E/QT/BPwE/gQABfwEAAVzAH8AcwAABXMAfwBwAP4EAQUABQEFAgUABQIFfwAABX8AAgWAAAIFAwUEBQMFAgUBBYAABAUFBQQFgAACBYAA4QR8AOEEgAAFBQUFBgUHBQYFBQUEBQUF4wThBOMEBQUHBecEBgUIBQYF5wQHBeMEBwXlBOcE5QQHBQgFCQUKBQkFCAUGBQgFCwUMBQsFCAUKBecEDAXoBAwF5wQIBQwFDQUOBQ0FDAULBegEDgXqBA4F6AQMBQ4FDwUQBQ8FDgUNBeoEEAXrBBAF6gQOBRAFDwURBRAFEQXzBOsE8wTtBPME6wQQBQ8FEgURBRIFDwUTBRIF9QQRBfUEEgUUBfME9QTyBPUE8wQRBV0BFAVYARIFWAEUBV0BFQUUBRUFXQH3ARQF9gT1BPYEFAUVBfcB+wQVBfsE9wH5ARUF+AT2BPgEFQX7BBMFWAESBVgBEwVZAQ8FDQUTBQ0FFgUTBRYFWQETBVkBFgUXBRYFGAUXBRgFGQUXBRkFGgUXBRoFGQUbBRcFWwFZAVsBFwUaBRoFGwUcBRoFHAUdBVsBHQVeAR0FWwEaBR0FHAUeBR0FHgUfBV4BHwX4AR8FXgEdBR8FHgUgBR8FIAUhBSEF+AEfBfgBIQX5AfkB+gT7BPoE+QEhBSEFIAX9BCEF/QT6BKYBHgWlAR4FpgEgBSAFpgH/BCAF/wT9BBwFpQEeBaUBHAWkARsF6gEcBeoBpAEcBRkF6gEbBeoBGQXpARgF6QEZBekBGAUiBQoFIwUiBSMFCgUJBSIFIwXnASIF5wHpAQoFIgULBQsFIgUYBSMFCQUDBSMFAwUkBecBJAWhASQF5wEjBSQFAwUBBSQFAQUlBSQFowGhAaMBJAUlBSUF/gT/BP4EJQUBBaMB/wSmAf8EowElBQsFFgUNBRYFCwUYBQkFBgUEBQkFBAUDBdwEJgXfBCYF3AQnBYQA3wQmBd8EhAB7ACcFKAUmBSgFJwUpBSYFKAUqBSYFKgWEACgFuwEqBbsBKAW6ASoFvAErBbwBKgW7ASoFggCEAIIAKgUrBYMAggArBYMAKwUsBSwFvAEtBbwBLAUrBSwFLQUuBS4FLQUvBS0FvAG4AS0FuAEwBS8FMAUxBTAFLwUtBS8FMQUyBTIFMQUzBTAFNAUxBTQFMAU1BTMFNAU2BTQFMwUxBTMFNgU3BTcFNgU4BTQFOQU2BTkFNAU6BTgFOQU7BTkFOAU2BTgFOwU8BTwFOwU9BT4FOwU5BTsFPgU/BTsFQAU9BUAFOwU/BT0FQQVCBUEFPQVABT8FQwVABUMFPwVEBUAFRQVBBUUFQAVDBUEFRgVHBUYFQQVFBUMFsQBFBbEAQwVIBUYFRQWuAK4ARQWxAEMFSQVIBUkFQwVEBUgFSQVKBUgFSgVLBUgFsgCxALIASAVLBUsFSgVMBUwFTQVLBU0FsgBLBbIATQWzAE4FswBNBbMATgVPBUwFUAVNBVAFTgVNBVEFTgVQBU4FUQVSBRUCTAUXAkwFFQJQBRUCUQVQBVEFFQIWAlMFVAVVBVQFUwVSBVIFTwVOBU8FUgVTBVEFVAVSBVQFUQVWBVQFVwVYBVcFVAVWBVkFVgUWAhYCVgVRBVkFVwVWBVcFWQVaBVcFWwVcBVsFVwVaBV0FWgVZBVoFXQVeBV4FWwVaBVsFXgVfBVsFYAVhBWAFWwVfBWIFXwVjBV8FYgVgBWQFYAViBWAFZAVlBWMFZgViBWYFZwViBWIFZwVoBWIFaAVkBWgFaQVkBWkFaAVqBWsFaAVsBWcFbAVoBWgFawVtBWgFbQVqBW0FbgVqBW4FbQVvBWsFcAVtBXAFawVxBXAFbwVtBW8FcAVyBXMFcgV0BXIFcwVvBXAFdQVyBXUFcAV2BXIFdQV3BXIFdwV0BXgFdAV3BXQFeAV5Ba0EdQWvBHUFrQR3BXcFrQSrBHcFqwR4BXoFewV5BXsFegV8BXkFcwV0BXMFeQV7BXkFeAV9BX0FegV5BXoFfgV/BX4FegV9BXgFrAR9BawEeAWrBH0FrASABYAFfgV9BX4FgQWCBYEFfgWABagErASpBKwEqASABYAFqASDBYMFgQWABYEFhAWFBYQFgQWDBYYFqASnBKgEhgWDBYMFhgWHBYMFhwWEBYQFiAWJBYgFhAWHBYoFhgWiBIYFigWHBYoFiAWHBYgFigWLBYsFjAWIBYwFiwWNBY4FiwWfBJ8EiwWKBY4FjQWLBY0FjgWPBY8FkAWRBY8FkQWNBY8FkgWTBZIFjwWOBZMFkAWPBZAFkwWUBZQFlQWWBZQFlgWQBZcFlAWYBZgFlAWTBZUFlwWZBZcFlQWUBZkFmgWbBZsFlQWZBZwFmQWdBZ0FmQWXBZoFnAWeBZwFmgWZBZ4FnwWgBZ4FoAWaBaEFngWiBaIFngWcBaEFnwWeBZ8FoQWjBaMFpAWlBaMFpQWfBaYFoQWnBaEFpgWjBaYFqAWjBagFpAWjBakFpAWoBaQFqQWqBasFpgWsBaYFqwWoBasFrQWoBa0FqQWoBa4FqQWtBakFrgWvBbAFqwWxBasFsAWtBbAFsgWtBbIFrgWtBbMFrgWyBa4FswW0BYEEsAWDBLAFgQSyBYEEgASyBYAEswWyBbUFtgW0BbYFtQW3Ba4FtgWvBbYFrgW0BbMFuAW0BbgFtQW0BXMEtQW4BbUFcwR0BHkEswWABLMFeQS4BbgFeQR2BHYEcwS4BbcFuQW2BbkFtwW6BbYFuwWvBbsFtgW5BbkFvAW7BbwFuQW9BbsFvgWqBb4FuwW8Ba8FqgWpBaoFrwW7BbwFvwW+Bb8FvAXABb4FwQWlBcEFvgW/BaoFpQWkBaUFqgW+Bb8FwgXBBcIFwwXBBcEFxAWgBcQFwQXDBaUFwQWfBZ8FwQWgBcMFlgHEBZYBwwWVAcQFxQWbBcUFxAWWAZoFoAXEBZoFxAWbBcYFlgGTAZYBxgXFBcYFlgXFBZYFxgXHBcUFlQWbBZUFxQWWBcYFyAXHBcgFxgXJBccFygWRBcoFxwXIBZYFkQWQBZEFlgXHBcgFywXKBcsFyAXMBcoFzQWMBc0FygXLBZEFjAWNBYwFkQXKBc4FywXPBcsFzgXNBYkFzQXQBdAFzQXOBYkFjAXNBYwFiQWIBdEFzgXSBc4F0QXQBdMFhQXQBdMF0AXRBYUFiQXQBYkFhQWEBdQF0QXVBdEF1AXTBYIF0wXWBdYF0wXUBYIFhQXTBYUFggWBBdcF1AXYBdQF1wXWBX8F1gXZBdkF1gXXBX8FggXWBYIFfwV+BdkF2gXbBdoF2QXXBXwF2wXcBdsFfAXZBXwFegXZBXoFfwXZBdwF3QXeBd0F3AXbBd8F3AXgBeAF3AXeBXwF3wV7Bd8FfAXcBeEF3wXiBeIF3wXgBXsF4QVzBeEFewXfBeEF4wVuBeMF4QXiBXMF4QVvBW8F4QVuBeIF5AXjBeQF4gXlBWkF4wXmBeYF4wXkBWkFagXjBWoFbgXjBecF5gXkBeYF5wXoBWUF6AXpBegFZQXmBWUFaQXmBWkFZQVkBeoF6AXrBegF6gXpBWEF6gXsBeoFYQXpBWAFZQXpBWAF6QVhBewF7QXuBe0F7AXqBVwF7gXvBe4FXAXsBVwFWwXsBVsFYQXsBe8F7gXwBe8F8AXxBe8F8gVYBfIF7wXxBVwFWAVXBVgFXAXvBfIFqwGsAVUFrAHzBawBVQXyBVUFWAXyBVgFVQVUBfMFqgH0BaoB8wWsAfMF9QX2BfUF8wX0BVUF8wVTBVMF8wX2BfYF9wX4BfcF9gX1BVMF+AVPBfgFUwX2BbAA+AX3BfgFsACtAE8FrQCzAK0ATwX4BfUF+QX3BfkF9QX6BfkFsAD3BbAA+QX7BfkF/AX7BfwF/QX7BfsF/QVHBUcFRgX7BbAARgWuAEYFsAD7BfwF/gX9Bf4F/wX9Bf8FAAb9BQAGRwX9BQEGAAYCBgIGAAb/BQEGAwYABgMGQgUABkIFRwUABkcFQgVBBQMGBAYFBgQGAwYBBgUGBgYDBgYGPAUDBjwFQgUDBkIFPAU9BQYGBwYIBgcGBgYFBggGNwUGBjcFCAYJBgYGNwU4BQYGOAU8BQoGCAYLBggGCgYJBgoGDAYJBgwGMgUJBgkGMgUzBQkGMwU3BSYBCgbZAAoGJgEMBicBDAYmAQwGJwEuBS4FLwUMBgwGLwUyBdkACwbXAAsG2QAKBtcADQbbAA0G1wALBgsGBwYNBgcGCwYIBtsADgYKAg4G2wANBg4GBwYPBgcGDgYNBg4GDwYQBhAGDwYRBg8GBwYFBg8GBQYEBhEGBAYSBgQGEQYPBhEGEgYTBhMGEgYUBhIGBAYBBhIGAQYCBhQGAgYVBgIGFAYSBhQGFQYWBhYGFQYXBhUGAgb/BRUG/wX+BRcG/gUYBv4FFwYVBhcGGAYZBhkGGAYaBhgG/AUbBvwFGAb+BRsGGgYYBhoGGwYcBhoGHAYdBh0GHAYeBh8GHAb6BfoFHAYbBh8GHgYcBh4GHwapAfQF+gX1BfoF9AUfBvQFqQEfBqkB9AWqASAGHQYGAQYBHQaFARoGIAYZBiAGGgYdBh4GhQEdBoUBHgYhBoUBIQaGASIGhgEhBiEGqQGnASEGHgapAacBIgYhBiIGpwFaACIGXAAjBiIGWgBcACIGJAaGASQGIgYjBoYBBAEFAQQBhgEkBiQGJQYmBiUGJAYjBiQGJwYEAQQBJwYDAQMBJwYoBicGKQYqBikGJwYmBigGJwYrBisGJwYqBisGLAYtBi0GKAYrBi4GKwYvBi8GKwYqBiwGKwYwBjAGKwYuBjEGLAYwBiwGMQYyBi4GMwYwBjMGLgY0BjEGMAY1BjUGMAYzBjYGMQY1BjEGNgZFADMGNwY1BjcGMwY4BjYGNwY5BjcGNgY1BjoGOwY5BjsGNgY5BjkGPAY9BjwGOQY3BjoGPQY+Bj0GOgY5Bj8GQAY+BkAGOgY+Bj4GQQZCBkEGPgY9Bj8GQgZDBkIGPwY+BkQGRQZDBkUGPwZDBkMGRgZHBkYGQwZCBkQGRwZIBkcGRAZDBg8BEAFIBhABRAZIBkgGSQZKBkkGSAZHBg8BSAYRAREBSAZKBkkGSwZKBksGSQZMBhEBSgZNBk0GSgZLBk4GEQFNBhEBTgYKAU8GSwZQBksGTwZNBk4GTQZRBlEGTQZPBhsCTgZRBk4GGwIaAlEGUgZTBlIGUQZPBhsCUQZUBlQGUQZTBrgAGwJUBhsCuAC7AFQGVQZWBlUGVAZTBrgAVAa5ALkAVAZWBlcGVQZYBlUGVwZWBrkAVgZZBlkGVgZXBloGuQBZBrkAWga3AFsGVwZcBlcGWwZZBloGWQZdBl0GWQZbBl4GWgZdBloGXgZfBmAGWwZhBlsGYAZdBl4GYAZiBmAGXgZdBl4GYwZkBmMGXgZiBmUGYAZmBmAGZQZiBmMGYgZnBmcGYgZlBmMGaAZpBmgGYwZnBmUGagZnBmoGZQZrBmcGbAZoBmwGZwZqBmgGbQZuBm0GaAZsBmoGbwZsBm8GagZwBmwGcQZtBnEGbAZvBm0GcgZzBnIGbQZxBnEGdAZ1BnQGcQZvBnEGdgZyBnYGcQZ1BnIGdwZ4BncGcgZ2BnYGeQZ6BnkGdgZ1BncGegZ7BnoGdwZ2BncGfAZ9BnwGdwZ7BnsGfgZ/Bn4GewZ6BnwGfwaABn8GfAZ7BnwGgQaCBoEGfAaABoAGgwaEBoMGgAZ/BoEGhAaFBoQGgQaABoYGhwaFBocGgQaFBoUGiAYcAogGhQaEBoYGHAKeARwChgaFBoQGiQaIBokGhAaDBogGigaLBooGiAaJBosGHAKIBhwCiwafAYoGjAaLBowGigaNBosGjAaYAYsGmAGfAY0GjgaMBo4GjwaMBpgBjwaZAY8GmAGMBo4GRgSPBkYERASPBpkBRARBBEQEmQGPBo0GTASOBkwEjQaQBkYETARJBEwERgSOBo0GigaQBooGkQaQBpEGkgaQBpIGkQaTBpAGSwRMBEsEkAaSBpMGlAaSBpQGkwaVBpIGTQRLBE0EkgaUBpUGlgaUBpYGlQaXBpQGTwRNBE8ElAaWBpcGmAaWBpgGlwaZBpYGUgRPBFIElgaYBpkGmgaYBpoGmQabBpgGVARSBFQEmAaaBpsGnAaaBpwGmwadBpoGVgRUBFYEmgacBpwGnQaeBpwGngafBlYEnwZYBJ8GVgScBp8GngagBp8GoAZeBJ8GWgRYBFoEnwZeBJ4GoQagBqEGngaiBqAGoQajBqAGowZhBF4EYQRdBGEEXgSgBqEGpAajBqQGoQalBqMGpAamBqMGpganBqcGYQSjBmEEpwZgBKcGpgaoBqcGqAapBmAEqQZiBKkGYASnBqkGqgarBqkGqAaqBmIEqwZkBKsGYgSpBqsGqgasBqwGrQarBq0GZASrBmQErQauBq4GrwawBq8GrgatBmcEsAaxBrAGZwSuBmQErgZlBGUErgZnBLEGsgazBrIGsQawBrQGswa1BrMGtAaxBmcEsQZoBLQGaASxBrQGtga3BrYGtAa1BmgEtAZqBGoEtAa3BrcGuAa5BrgGtwa2BmoEuQZsBLkGagS3BrkGuga7BroGuQa4BmwEuQZuBG4EuQa7BrwGuga9BroGvAa7BrsGvgZuBL4Guwa8BnEEbgS+Bm4EcQRtBL8Gvga8Br4GvwbABnEEwAbBBsAGcQS+BsEGugW3BboFwQbABnQEtwW1BbcFdATBBnQEcATBBnAEcQTBBsAGwga6BcAGvwbCBr8GwwbCBsMGvwbEBsIGxQa9BcUGwgbDBroFvQW5Bb0FugXCBsMGxgbFBsYGwwbHBsUGyAbABcgGxQbGBr0FwAW8BcAFvQXFBsYGyQbIBskGxgbKBsgGlwHCBcgGyQaXAcAFwgW/BcIFwAXIBsoGywbJBssGygbMBskGlAGXAckGywaUAc0GywbOBs4GywbMBpQBzQaSAc0GlAHLBs8GzgbQBs4GzwbNBpIBzwbJBc8GkgHNBswF0AbRBtAGzAXPBskFzAXIBcwFyQXPBtEG0gbTBtIG0QbQBs8F0wbUBtMGzwXRBs8FywXRBssFzAXRBtMG1QbUBtUG0wazAdIF1AbWBtYG1AbVBtIFzwXUBs8F0gXOBUMC1QZFAtUGQwLWBkMC1wbWBtcG1QXWBtUF0QXWBtEF0gXWBtcGQgLYBkIC1wZDAtgF2AbZBtgG2AXXBtgF1QXXBtUF2AXUBdkG2gbbBtoG2QbYBtoF2wbcBtsG2gXZBtoF2AXZBtgF2gXXBd0G2wbeBtsG3QbcBt0F3QbfBt0G3QXcBt0F2wXcBtsF2gXcBt8G4AbhBuAG3wbdBuIG4QbjBuEG4gbfBuIG3gXfBt4F3QXfBuIG5AblBuQG4gbjBuUG3gXiBt4F5QbgBeUG5gblBeYG5QbkBuAF5QXiBeUF4AXlBuQG5wbmBucG5AboBuYG6QbnBekG5gbnBuUF5wXkBecF5QXmBucG6gbpBuoG5wbrBukG7AbrBewG6QbqBugF5wXpBugF6QbrBeoG7QbsBu0G6gbuBuwG7wbtBe8G7AbtBusF7AbqBe0F6gXsBu0G8AbvBvAG7QbxBu8G8gbwBfIG7wbwBu0F7wbuBfAF7gXvBvMG8Qb0BvEG8wbwBvIG8watAfMG8gbwBvQG9QbzBvUG9gbzBvYGrQHzBq0B9gZfAPUG9wb2BvcG+Ab2BvgGXwD2Bl8A+AZeAPkG9wb6BvcG+Qb4BvgGXQBeAF0A+Ab5BvsG+gb8BvoG+wb5BvkG+wYlBvkGJQZdACkGJQb7BiUGKQYmBikG+wb9BvwG/Qb7Bv0GLwYqBioGKQb9Bv4G/Ab/BvwG/gb9Bi8G/QYABwAH/Qb+BgAHLgYvBi4GAAc0Bv4GAQcABwEH/gb+ADQGAAcCBwIHAAcBBzQGOAYzBjgGNAYCBwEHAwcCBwMHAQcEBwIHBQc4BgUHAgcDBzgGPAY3BjwGOAYFBwUHAwcGBwUHBgcHBzwGBwcIBwcHPAYFBz0GPAYIBz0GCAdBBgkHCAcHBwgHCQcKB0EGCgcLBwoHQQYIB0YGQgYLB0IGQQYLBwwHCwcKBwsHDAcNB0YGDQcOBw0HRgYLB0kGRwYOB0cGRgYOBw8HDgcNBw4HDwcQB0kGEAdMBhAHSQYOBxEHEAcPBxAHEQcSB0wGEgcTBxIHTAYQB0wGUAZLBlAGTAYTBxQHEwcSBxMHFAcVB1AGFQcWBxUHUAYTB1IGTwYWB08GUAYWBxUHFwcWBxcHFQcYBxYHGQdSBhkHFgcXB1UGUwYZB1MGUgYZBxcHGgcZBxoHFwcbB1UGGQdYBlgGGQcaBxsHHAcaBxwHGwcdB1gGGgceBx4HGgccB1wGWAYeB1gGXAZXBh8HHAcgBxwHHwceB1wGHgchByEHHgcfB2EGXAYhB1wGYQZbBh8HIgchByIHHwcjB2EGIQckByQHIQciB2EGZgZgBmYGYQYkByUHIgcmByIHJQckByQHJwdmBicHJAclB2YGawZlBmsGZgYnBycHKAcpBygHJwclBycHKgdrBioHJwcpB2sGcAZqBnAGawYqByoHKwcsBysHKgcpB3AGLActBywHcAYqB3AGdAZvBnQGcAYtBy0HLgcvBy4HLQcsB3QGLwcwBy8HdAYtB3kGdQYwB3UGdAYwBzAHMQcyBzEHMAcvB3kGMgczBzIHeQYwB34GegYzB3oGeQYzBzMHNAc1BzQHMwcyB34GNQc2BzUHfgYzB4MGfwY2B38GfgY2BzYHNwc4BzcHNgc1B4MGOAeJBjgHgwY2BzgHkwaRBpMGOAc3B4kGkQaKBpEGiQY4BzUHOQc3BzkHNQc0BzcHlQaTBpUGNwc5BzkHNAc6BzkHOgc7B5UGOweXBjsHlQY5BzoHPAc7BzwHOgc9B5cGPAeZBjwHlwY7Bz0HPgc8Bz4HPQc/BzwHmwaZBpsGPAc+Bz4HPwdABz4HQAdBBz4HnQabBp0GPgdBB0EHQAdCB0EHQgeiBp0GogaeBqIGnQZBB0AHQwdCB0MHQAdEB0IHQwdFB0IHRQelBqIGpQahBqUGogZCB0MHRgdFB0YHQwdHB0UHRgdIB0UHSAdJB0kHpQZFB6UGSQekBkkHSAdKB0kHSgdLB0sHpAZJB6QGSwemBksHSgdMB0sHTAdNB6YGTQeoBk0HpgZLB00HTAdOB00HTgdPB6gGTweqBk8HqAZNB08HTgdQB08HUAdRB1EHqgZPB6oGUQesBlEHUAdSB1EHUgdTB6wGUwdUB1MHrAZRB1QHVQdWB1UHVAdTB68GVgdXB1YHrwZUB68GrQZUB60GrAZUB1cHWAdZB1gHVwdWB7IGWQdaB1kHsgZXB7IGsAZXB7AGrwZXB1oHWwdcB1sHWgdZB10HXAdeB1wHXQdaB10HswZaB7MGsgZaB10HXwdgB18HXQdeB2AHtQZdB7UGswZdB2AHYQdiB2EHYAdfB7UGYge2BmIHtQZgB2IHYwdkB2MHYgdhB7YGZAe4BmQHtgZiB2QHZQdmB2UHZAdjB7gGZge6BmYHuAZkB2cHZQdoB2UHZwdmB7oGZge9Br0GZgdnB2cHaQdqB2kHZwdoB70GagfEBmoHvQZnB2oHawfHBmsHagdpB8QGxwbDBscGxAZqB2kHbAdrB2wHaQdtB2sHbAfMBmsHzAbKBscGygbGBsoGxwZrB2wHbQe0AbQBbgdsB2wHbgfOBmwHzgbMBtIGbgeyAbIBbge0AdIGzgZuB84G0gbQBm8HaQdoB2kHbwdtB20Hbwe1AbUBtAFtB2gHcAdvB3AHaAdlB28HcAdxB3EHtQFvB3IHcQdzB3AHcwdxB3QHcgd1B3IHdAdxB3QHrgFxB64BtQFxB3YHdQd3B3UHdgd0B3YHrwF0B68BrgF0B3gHdwd5B3cHeAd2B3YHeAd6B3oHrwF2B3sHeAd8B3gHewd6B3sH2gZ6B9oGRgJ6B0YCrwF6B68BRgKwAd4Gewd9B30Hewd8B94G2wZ7B9sG2gZ7B30Hfgd/B34HfQd8B+AGfweAB38H4AZ9B+AG3QZ9B90G3gZ9B4AHgQeCB4EHgAd/B4MHggeEB4IHgweAB4MH4QaAB+EG4AaAB4UHgweGB4YHgweEB4UH4waDB+MG4QaDB4UHhwfoBocHhQeGB+gG4waFB+MG6AbkBoYHiAeHB4gHhgeJB+sGhweKB4oHhweIB+gG6wbnBusG6AaHB4sHiAeMB4gHiweKB+4GigeNB40HigeLB+sG7gbqBu4G6waKB4sHjgeNB44HiwePB/EGjQf0BvQGjQeOB+4G8QbtBvEG7gaNB5AHjweRB48HkAeOB44HkAf1BvUG9AaOB5IHkQeTB5EHkgeQB5IH9QaQB/UGkgf3BpQHkwf8AJMHlAeSB5QH9waSB/cGlAf6Bv8G/AD7APwA/waUB/8G+gaUB/oG/wb8BvwAlQf2AJUH/ACTB5MHlgeVB5YHkweRB5YHlweVB5cHlgeYB5EHmQeWB5kHkQePB5YHmgeYB5oHlgeZB5sHmAeaB5gHmwecB5kHnQeaB50HmQeMB50HmweaB5sHnQeeB54HnwebB58HngegB50HiQeeB4kHoQeeB6EHoAeeB6AHoQeiB6IHowegB6MHogekB6EHhAeiB4QHggeiB4IHpAeiB6QHggeBB6MHpQemB6UHowenB6AHpgefB6YHoAejB6QHpwejB6cHpAeoB6gHqQenB6kHqAeqB6QHgQeoB4EHqweoB6sHqgeoB6oHqwesB6wHrQeqB60HrAeuB6sHfgesB34HeQesB3kHrgesB64HeQd3B60HrwewB68HrQexB6oHsAepB7AHqgetB64HsQetB7EHrgeyB7IHswexB7MHsge0B64HdweyB3cHdQeyB3UHtAeyB7QHdQdyB7UHtgezB7YHtQe3B7EHtgevB7YHsQezB7QHtQezB7UHtAe4B2EHXwe4B18HtQe4B7gHcgdzB3IHuAe0B2EHcwdjB3MHYQe4B7cHuQe2B7kHtwe6B68HuQe7B7kHrwe2B7kHvAe7B7wHuQe9B74HvAe/B7wHvge7B74HsAe7B7AHrwe7B8AHvwfBB78HwAe+B8AHqQe+B6kHsAe+B6UHwQfCB8EHpQfAB6UHpwfAB6cHqQfAB8MHwQfEB8EHwwfCB8UHwgfGB8MHxgfCB8UHpgfCB6YHpQfCB8cHxQfIB8gHxQfGB8cHnwfFB58HpgfFB8gHnAfHB5wHyAfJB5wHmwfHB5sHnwfHB8oHyQfLB8sHyQfIB8oH9wDJB/cAlwfJB5wHlweYB5cHnAfJB8sHdwHKB3cBywfMB/cAygf4APgAygd3Ac0HzgfPB84HzQfMB80HdQHMB3UBdwHMB8wH0AfOB9AHzAfLB84H0QfSB9EHzgfQB8sHxgfQB8YHywfIB9AHwwfRB8MH0AfGB9MH1AfVB9QH0wfSB9MHzwfSB88HzgfSB9IH0QfWB9IH1gfUB9QH1wfYB9cH1AfWB9EHxAfWB8QH0QfDB8QH1wfWB9cHxAfZB9kH2gfXB9oH2QfbB8QHvwfZB78HxAfBB78H2wfZB9sHvwe8B9wH3QfaB90H3AfeB9cH2gfYB90H2AfaB9oH2wffB98H3AfaB+AH3AffB9wH4AfhB70H2we8B9sHvQffB70H4gffB+IH4AffB+IH4wfgB+MH4gdbB7oHvQe5B70HugfiB7oHWwfiB1sHugdcB1gH5AfjB+QHWAflB+MH4QfgB+EH4wfkB1sHWQfjB1kHWAfjB+UH5gfkB+YH5QfnB+QH6AfhB+gH5AfmB+YH6QfoB+kH5gfqB+gH6wfeB+sH6AfpB+EH3gfcB94H4QfoB+kH7AfrB+wH6QftB+4H6wfvB+8H6wfsB+4H3gfrB94H7gfdB/AH7gfxB/EH7gfvB/AH3QfuB90H8AfYB9UH8AfyB/IH8AfxB9UH2AfwB9gH1QfUB/MH8Qf0B/EH8wfyB/UH8gf2B/YH8gfzB/UH1QfyB9UH9QfTB/cH9gf4B/YH9wf1B/cH0wf1B9MH9wfPB/kH+Af6B/gH+Qf3B/kHzwf3B88H+QfNB3YB+gf7B/oHdgH5B/kHdgF1AfkHdQHNB/8A+wf8B/wH+wf9B/8AdgH7B3YB/wD6APsH/gf9B/4H+wf6B/0H/wcACP8H/Qf+B/oHAQj+BwEI+gf4B/4HAgj/BwII/gcBCP8HAwgECAMI/wcCCAEIBQgCCAUIAQgGCAIIBwgDCAcIAggFCAMICAgJCAgIAwgHCAcIBQgKCAcICggLCAgICwgMCAsICAgHCBEHCAgMCBEHDAgNCAwICwgOCAwIDggPCA0IDwgQCA8IDQgMCBEIFAcQCBQHDQgQCBAIEggTCBIIEAgPCBEIEwgUCBMIEQgQCBUIGAcUCBgHEQgUCBYIFAgTCBQIFggXCBUIFwgYCBcIFQgUCB0HFQgYCBUIHQcbBxgIGQgaCBkIGAgXCBgIGwgdBxsIGAgaCCAHHQcbCB0HIAccBxwIGggdCBoIHAgbCCAHGwgeCB4IGwgcCCMHIAceCCAHIwcfBx8IHAggCBwIHwgeCCMHHgghCCEIHggfCCEIJgciByIHIwchCCIIHwgjCB8IIgghCCEIJAgmByQIIQgiCCYHKAclBygHJgckCCQIJQgmCCUIJAgiCCgHJggnCCYIKAckCCkHKAcnCCkHJwgrByYIKAgnCCgIJghHBysHKAgpCCgIKwcnCC4HLAcpCCwHKwcpCCoIKAhEBygIKggpCC4HKggrCCoILgcpCDEHLwcrCC8HLgcrCCsIPwc9Bz8HKwgqCCsIOgcxBzoHKwg9Bz8HRAdAB0QHPwcqCCgIQwdEB0MHKAhHB0cHJQhGByUIRwcmCCUIIggjCCUIIwgsCEYHLAhIBywIRgclCCwIIwgtCC0ILggsCEgHLghKBy4ISAcsCC4ILwgwCC4ILQgvCEoHMAhMBzAISgcuCDAIMQgyCDAILwgxCEwHMghOBzIITAcwCDIIMwg0CDMIMggxCE4HNAhQBzQITgcyCDQINQg2CDUINAgzCFAHNghSBzYIUAc0CDYINwg4CDcINgg1CFIHOAg5CDgIUgc2CDkIOgjnBzoIOQg4CFUH5wflB+cHVQc5CFMHUgc5CFMHOQhVBzgIOwg6CDsIOAg3CDoIPAjqBzwIOgg7COcH6gfmB+oH5wc6CDsINAI8CDQCOwg1AjwIPQjtBz0IPAg0AuoH7QfpB+0H6gc8CDACNAIxAjQCMAI9CD4IMAI/CDACPgg9CO0HPgjsBz4I7Qc9CEAIPwhBCD8IQAg+CEAI7wc+CO8H7Ac+CPQHQQhCCEEI9AdACO8H9AfxB/QH7wdACEIICghDCAoIQghECPQHQwjzB0MI9AdCCEQIQQhFCEEIRAhCCEQIRQgOCA4IRQhGCEUIQQg/CEUIPwhHCEYIRwhICEcIRghFCEYISAgSCEkIEghICEgIMgJKCEgIRwgyAkkISghLCEoISQhICEwIFghLCBYISQhLCEsITQhOCE0ISwhKCEwISwhPCE8ISwhOCFAITAhPCEwIUAgZCFEITghSCE4IUQhPCFMIUAhPCFMITwhRCFQIUAhTCFAIVAgdCFMIMwgxCDMIUwhRCDEILwhTCC8IVAhTCCAIHQhUCB0IIAgcCC0IIAhUCC0IVAgvCDMIUgg1CFIIMwhRCFIITghNCFIITQhVCDUIVQg3CFUINQhSCDUCTQgzAk0INQJVCFUIOwg3CDsIVQg1Ah0IGQhQCBkIHQgaCEoIMwJNCDMCSggyAhYIGQgXCBkIFghMCBIISQgTCBYIEwhJCEcIPwgwAkcIMAIyAg4IRggPCBIIDwhGCAYICggFCAoIBghDCAYI9gdDCPYH8wdDCAsICghECAsIRAgOCCMIIAgtCCAIIwgfCBgHGwcXBxsHGAcVCBgHFQcRCBUHFAcRCBQHEgcNCBIHEQcNCAwHCQgNBw0HCQgPBwkIDAcECAQIAwgJCAkIEQcPBxEHCQgICAYIAQj4B/gH9gcGCAkHDAcKBwwHCQcECAkH/wcECP8HCQcACAYHCQcHBwkHBgcACAYH/QcACP0HBgf8BwQH/AcDBwMH/AcGBwQH/wD8B/8ABAf9AFgHVgflB1YHVQflB7cHXge6B14HXAe6B7UHXwe3B18HXge3B4EHfwerB38HfgerB4kHhgehB4YHhAehB4kHjAeIB4wHiQedB48HjAeZB4wHjweLB/cA9gCXB/YAlQeXB3wHeQd+B3kHfAd4B2MHcAdlB3AHYwdzBzQHMgc6BzIHMQc6BwEH/gAEB/4A/QAEB/8G/gD+Bv4A/wb7ANgGRgLaBkYC2AZCArMBRQLVBkUCswGxAdIGswHTBrMB0gayAb8GvAbEBrwGvQbEBhsEHwQaBB8EGwSHBhsEgQaHBoEGGwSCBocGVggfBFYIhwaGBh8EJAQeBCQEHwRWCFYIngGcAZ4BVgiGBlcIVgicAVYIVwgkBCQEKQQjBCkEJARXCJwBWAhXCFgInAGaAVkIVwhYCFcIWQgpBCkELgQoBC4EKQRZCFgIPwRZCD8EPQRZCD0ELgRZCC4EPQQ6BFgImgGbAZsBPwRYCBsEFwSCBhcEGASCBhgEfQaCBn0GfAaCBhMEGAQSBBgEEwR9BhMEeAZ9BngGdwZ9Bg8EEwQOBBMEDwR4Bg8EcwZ4BnMGcgZ4BloIDwQNBA8EWghzBloIbgZzBm4GbQZzBlsIDQQLBA0EWwhaCFsIXAhaCFwIbgZaCF0IWwheCFsIXQhcCF0IXwhcCF8IaQZcCGkGbgZcCG4GaQZoBm0AXQhsAF0IbQBfCF8IbQBgCGAIZAZfCGQGaQZfCGkGZAZjBmEIbQBqAG0AYQhgCGAIYQi0AGAItABfBl4GYAhfBmAIXgZkBmIIagBnAGoAYghhCGEIYgi1AGEItQC0AGIIYwi1AGMIYghkCGcAZAhiCGQIZwBlCGUIZghkCGYIZQgEBGcAaQBlCGkAZwhlCGcIBARlCAQEZwgDBGkAaAhnCGgIaQBrAAMEaAgGBGgIAwRnCGsACgRoCAoEawBeCAoEBgRoCAYECgQIBGYI/QNpCP0DZgj+A2QIaQhjCGkIZAhmCAQE/gNmCP4DBAQABGoI/QP8A/0DaghpCGoIawhpCGsIYwhpCGwIaghtCGoIbAhrCLYAawi6AGwIugBrCGsItgC1ALUAYwhrCG4IbQhvCG0IbghsCLoAbAgZAhkCbAhuCG4IDgEHAQ4BbghvCBkCBwEJAQcBGQJuCA4BbwhwCHAIbwhxCG0IcQhvCHEIbQhyCHEI9wP1A/cDcQhyCG0I/ANyCPwDbQhqCPcD/AP6A/wD9wNyCO8D8wPwA/MD7wNwCA4B7wMMAe8DDgFwCPMDcQj1A3EI8wNwCGwAXghrAF4IbABdCAoEWwgLBFsICgReCF8GtAC3AF8GtwBaBhoCCgFOBgoBGgIJAXMI4QNFBuEDdAhFBnQIPwZFBj8GdAhABnMIRAYQAUQGcwhFBuED3QN0CN0D3AN0CNwDQAZ0CEAG3AN1CNwD2AN1CNgDRAB1CEQAOwZ1CDsGRABDAHUIOgZABjoGdQg7BucD4gNzCOID4QNzCOcDEAELARAB5wNzCDsGQwBFADsGRQA2BnYIQQA/AEEAdggyBnYILAYyBiwGdggtBkEAMQZFADEGQQAyBncIPwB4CD8Adwh2CHcILQZ2CC0GdwgBAXkIeAh6CHgIeQh3CHcIeQgCAQIBAQF3CHsIegh8CHoIewh5CHkIewh9CHkIfQgCAXsIfgh9CH4Iewh/CH0IfggZBn0IGQYgBgIBIAYGASAGAgF9CH8IFgZ+CBYGfwiACH4IFgYXBn4IFwYZBp4AfwigAH8IngCACBMGngCdAJ4AEwaACIAIEwYUBoAIFAYWBqAAfwh8CHwIfwh7CIEIfAiCCIIIfAh6CIEInwB8CJ8AoAB8CIIIgwiBCIMIhAiBCIQInwCBCJ8AhAihAIMIhQiECIUIDgKECA4CoQCECKEADgIJAswDxwOFCMcDxgOFCMYDDgKFCA4CxgMNAswDgwiGCIMIzAOFCNADywOGCMsDzAOGCIYIggiHCIIIhgiDCNADhwg+AIcI0AOGCIIIeAiHCHgIggh6CD4AeAg/AHgIPgCHCAEBKAYtBigGAQEDASMGXQAlBl0AIwZcAPoF/AX5BfwF+gUbBp0AEQYTBhEGnQAQBpwACAIQBpwAEAadAAgCDgYQBg4GCAIKAvEF8AXyBvIGqwHxBZIByQWTAcYFkwHJBcIFlQHDBZUBwgWXAYMEsQWEBLEFgwSwBbEFrAWICKwFsQWrBbEFhwSEBIcEsQWICIgIiQiKCIkIiAisBYcEiAiJBIkEiAiKCIkIjgSKCI4EiQiLCIkEigiLBIsEigiOBIsIiQinBYsIpwWMCIwIkASLCJAEjAiNCI4EkASNBJAEjgSLCIwIogWNCKIFjgiNCI4IkwSNCJMEjgiPCI0IkQSQBJEEjQiTBI4InQWPCJ0FkAiPCJAIlgSPCJYEkAiRCI8IlASTBJQEjwiWBJEIkAiYBZgFkgiRCJIImQSRCJkEkgibBJYEkQiXBJcEkQiZBJIImAWTBZMFkgWSCJIFmwSSCJsEkgWdBJAInQWXBZcFmAWQCI4IogWcBZwFnQWOCKcFogWMCKIFpwWhBYkIrAWmBYkIpgWnBZ0EjgWfBI4FnQSSBZ8EigWgBKAEigWiBKcEogSGBaIEpwSjBHYFrwR1Ba8EdgWxBJMIdgVxBXEFdgVwBZMIswR2BbMEsQR2BXEFlAiTCJQIlQiTCJUIswSTCLMElQiWCJYIlQiXCJcImAiWCJYImAi2BJYItASzBLQElgi2BJkImgibCJoImQiYCJwImwidCJsInAiZCJkItwS2BJ4InAifCJ8InAidCLcEngi5BJ4ItwScCJ4IoAihCKAIngifCJ4IoQi7BLsEuQSeCIIBoAiiCKAIggGhCIIBuwShCLsEggF/AaMInwikCJ8IowigCKIIoAilCKUIoAijCKYIowinCKMIpgilCKgIpQhHAkcCpQimCKgIogilCKIIqAipCEoCqgioCEoCqAhHAqoIqQioCKkIqgjPBEoCTQKqCE0C0gSqCNIEzwSqCM8E0gTOBKYIqwisCKsIpginCKYISAJHAkgCpgisCK0IrAirCKwIrQiuCEgCrghLAq4ISAKsCK4IrQivCK4IrwiwCEsCsAixCLAISwKuCLEIsAiyCLIIswixCLQIswi1CLMItAixCEsCsQhMAkwCsQi0CLUItgi0CLYItQjXBLQITQJMAk0CtAi2CNEEtgjUBNQEtgjXBLYI0gRNAtIEtgjRBLUIswi3CLUItwjbBNcE2wTYBNsE1wS1CLMIuAi3CLgIswiyCLcIuAi5CLcIuQi6CNsEugjaBLoI2wS3CLoIuQgpBboIKQUnBdoEJwXcBCcF2gS6CLgIuwi5CLsIuAi8CLkIuwi9CLkIvQgpBb4Iuwi/CLsIvgi9CL4IuQG9CLkBugG9CCkFugEoBboBKQW9CMAIvgjBCMEIvgi/CMAIuQG+CLkBwAi3AcIIwAjpAOkAwAjBCLcBwgg1BcIItwHACDUFOgU0BToFNQXCCMII6AA6BegAwgjpAOkAwQjhAOEAwQjDCMMIvwjECL8IwwjBCMMIxAjFCMYIxQjECMQIuwi8CLsIxAi/CMYIvAjHCLwIxgjECK8IyAjHCMgIxgjHCLIIvAi4CLwIsgjHCK8IxwiwCLAIxwiyCMkIygjICMoIywjICMsIxgjICMYIywjFCMkIrwitCK8IyQjICMoIzAjLCMwIzQjLCM0IxQjLCMUIzQjiAMwIzgjNCM4IzwjNCM8I4gDNCOIAzwjgAM4I0AjPCNAI0QjPCNEI4ADPCOAA0QjkAKgA0QisAKwA0QjQCKgA5ADRCOQAqACnANAI0gisANII0AjTCM4I0wjQCNMIzgjUCNQI1QjTCNUI1AjWCNQIzgjMCMwI1wjUCNcI1gjUCNYI1wjYCNgI2QjWCNkI2AjaCNgI2wjcCNsI2AjXCNgI3QjaCN0I2AjcCN0ImwjaCJsI3QidCN0I3AjeCN4IpAjdCKQInQjdCJ0IpAifCN4I2wjfCNsI3gjcCKcI3wirCN8IpwjeCKcIowjeCKMIpAjeCN8IygjJCMoI3wjbCKsIyQitCMkIqwjfCMoI1wjMCNcIygjbCNkI4AjhCOAI2QiaCNYI4QjVCOEI1gjZCNoImgjZCJoI2gibCOEI4gjjCOII4QjgCNUI4wjkCOMI1QjhCOQI5QjmCOUI5AjjCNII5gjnCOYI0gjkCNII0wjkCNMI1QjkCOcI0QHOAdEB5wjmCKsAzgGqAM4BqwDnCKsArADnCKwA0gjnCOYI6AjRAegI5gjlCOkI6AjqCOoI6AjrCNEB6AjPAc8B6AjpCOUI6wjoCOsI5QjsCOwIZgXrCGYF7AjtCOII7AjjCOUI4wjsCOII7QjsCO0I4gjuCO4IbAXtCGwF7giUCJcI7gjgCOII4AjuCO4IlQiUCJUI7giXCO0IZwVmBWcF7QhsBekI0AHPAesIYwXqCGMF6whmBeAImgiYCOAImAiXCOIAwwjFCMMI4gDhAGwFcQVrBXEFbAWUCBQCWQUWAlkFFAJdBRcCSgXvCEoFFwJMBe8ISQXmAEkF7whKBfAI7wjlAOYA5QDvCPAIFwLvCBcC8AjxCKcA5QDkAOUApwDwCKcAqQDwCKkA8QjwCEQF5wBJBecA5gBJBT8FPgVEBT4F5wBEBTkFOgU+BToF6AA+BT4F6ADnADUFMAW4AbgBtwE1BS4FJwGDAIMALAUuBc8EzASpCMwEzwTLBMwEhAGDAYQBzATKBMUExgTKBMoExgSEAYQBwASBAcAEhAHGBMMEvwTGBL8EwATGBMAEfwGBAX8BwAS8BFAALwC+BC8AUAAyAIAEfQR6BHoEeQSABDoELQQuBC0EOgQzBPII8wg1BPMI8gj0CDUEMQQwBDEENQTzCDUE1gHXAdcB8gg1BPQI9QjzCPUI9Aj2CDEE8wj3CPcI8wj1CN8B9QjdAfUI3wH3CCsE9wj4CPgI9wjfATEEKwQsBCsEMQT3CPkI3wHcAd8B+Qj4CCYE+Aj6CPoI+Aj5CCYEJwT4CCcEKwT4CPsI+Qj8CPkI+wj6CJUAIgT6CJUA+gj7CCIEJgT6CCYEIgQhBPsI/Qj+CP0I+wj8CJUA+wiWAJYA+wj+CJYA/wiZAP8IlgD+CP4IAAn/CAAJ/gj9CGMA/wgACf8IYwBiAAEJ/QgCCf0IAQkACWMAAQkDCQEJYwAACQMJBAlmAAMJZgBjAAMJBQkGCQUJAwkBCQQJBgkHCQYJBAkDCRcABAkHCQQJFwAZAAcJCAkrAQgJBwkGCRcAKwEoASsBFwAHCQYJCQkICQkJBgkFCQgJCgkLCQoJCAkJCSsBCwkpAQsJKwEICSIBCgkhAQoJIgELCSIBMgELCTIBKQELCQoJDAkNCQwJCgkJCSEBDQkOCQ0JIQEKCQ0J3gH2CN4BDQkMCQ4J9gj0CPYIDgkNCQkJBQkMCQUJDwkMCd4BDwnZAQ8J3gEMCQUJAQkPCQEJAgkPCQIJ2QEPCdkBAgnaARkAHAAECRwAZgAECQIJ/Qj8CPwI2gECCWIAmQD/CJkAYgAWBPwI3AHaAfwI+QjcAfYI3QH1CN0B9gjeAfIIIwH0CCMBDgn0CPII1wEkASQBIwHyCJQAHQQiBJQAIgSVABYEYgBhAGEAEQQWBBYElwCZAJcAFgQVBBAJEQnyAxEJEAkSCfID7gPtA+4D8gMRCV8BYQHyA2EBEAnyAxIJEwkRCRMJEgkUCREJFQnuAxUJEQkTCRMJFgkVCRYJEwkXCeoDFgkYCRYJ6gMVCeoD7gMVCe4D6gPpAxYJGQkYCRkJFgkaCeQDGQkbCRkJ5AMYCRgJ5APlA+UD6gMYCRwJGQlAAhkJHAkbCRwJHQkbCR0J3wMbCRsJ3wPgA+AD5AMbCR4JHAkfCRwJHgkdCR0JHgkgCSAJ2gMdCdsDHQnaAx0J2wPfAyEJHgkiCR4JIQkgCSAJIQkjCSAJIwnXA9cD2gMgCdoD1wPWA00AIQlMACEJTQAjCSMJTQAkCSMJJAnTAyMJ0gPXA9IDIwnTA1cBTQBHAE0AVwEkCVcBzgMkCc4DVwFWAdMDzgPPA84D0wMkCUwAIglKACIJTAAhCUoAJQkmCSUJSgAiCSIJHwklCR8JIgkeCScJJgkoCSgJJgkpCUsAJgknCSYJSwBKACYJQQIpCUECJgklCZABKAmOASgJkAEnCScJKglLACoJJwmQAZABKwkqCSsJkAGNASoJLAktCSwJKgkrCUsALQlIAC0JSwAqCS0JLgkvCS4JLQksCUgALQlGAEYALQkvCS8JMAkxCUYALwkyCTEJMgkvCTIJMQkzCTMJNAkyCTQJNQkyCTUJNAnFA0kAMgk1CTIJSQBGAMoDxQPEA8UDygM1CVYBSQA1CVYBNQnKAzQJMwnIAMgAwAM0CcADxQM0CcUDwAPBAzEJMAkzCTAJNgkzCTYJyAAzCcgANgnEADYJNwk4CTcJNgkwCcQAOAkDADgJxAA2CTkJNwk6CTcJOQk4CQMAOQkBADkJAwA4CTsJOgk8CToJOwk5CTsJCgA5CQoAAQA5CT0JPAk+CTwJPQk7CT0JEgI7CRICCgA7CXUAPgl3AD4JdQA9CRICdQAQAnUAEgI9CT8JQAl6AD8JygBACcoAPwkaAUAJyQBBCckAQAnKAHoAQQlCCUEJegBACUMJQglECUQJQglBCUMJRQlCCUUJQwlGCUIJeAB6AHgAQglFCUYJRwlFCUcJRglICUcJeABFCXgARwl5AEgJpABHCaQASAmiAKQASQlHCUcJSQl5AEoJSAlLCUYJSwlICUoJogBICaIASgk9AUwJSglNCUsJTQlKCUwJPQFKCT0BTAk8AU0JJQFMCSUBHgFMCR4BPAFMCTwBHgEdAU4JTwlNCU8JJQFNCU4JSwlQCUsJTglNCVEJUAlSCVAJUQlOCVAJRglDCUYJUAlLCVAJQwlSCVEJUwlUCVQJTglRCU4JVAlPCVIJBQJRCQUCUgkEAlUJVAnmAVMJ5gFUCVUJTwlUCU8JVQlWCVUJMgFWCTIBVQkxATIBIAFWCSABMgEiAVYJJQFPCSUBVgkgAeYBMQFVCTEB5gEwAeYBwQDlAcEA5gFTCVMJvADBALwAUwkFAlIJzgAEAs4AUglECUEJzgBECc4AQQnJAFcJMAkuCTAJVwk3CSwJVwkuCVcJLAkZASsJGQEsCRkBKwlYCYsBBgJYCQYCiwEsAlgJzwAZAc8AWAkGAlgJKwmNAY0BiwFYCY4BWQmPAVkJjgEoCSgJWglZCVoJKAkpCVsJWQlaCVkJWwlcCSkJPgJaCT4CKQlBAlsJPgI8Aj4CWwlaCZIALQJcCS0CkgCRAFwJjwFZCY8BXAktApIAWwldCVsJkgBcCV4JXQk8AjwCXQlbCV8JXgkXCV4JXwldCV0JXwmPAI8AkgBdCRQJFwkTCRcJFAlfCRQJjwBfCY8AFAmOABoJXgk7AjsCXgk8AhcJGgkWCRoJFwleCUECJQk/Aj8CJQkfCR8JQAI/Ah8JHAlAAhoJQAIZCUACGgk7AhIJYAkUCWAJjgAUCWEJEgkQCRIJYQlgCWEJYglgCWIJYQljCWAJYgmMAGAJjACOAGMJZAliCWQJYwllCWIJZAmQAJAAjABiCWUJLwJkCS8CZQlmCS8CkABkCZAALwIuAmUJZwlmCWcJ5AFmCcIA5AHAAOQBwgBmCS8CZgkrAsIAKwJmCWcJYwloCWMJZwllCWUBaAlhCWEJaAljCWUBZAFoCWQB4AFoCeABZwloCWcJ4AHiAWUBEAlhARAJZQFhCQwB7wMNAQ0B7wPrA+cDDQHmAw0B5wMLAdEDPgBAAM4DVgHKA84DygPJAw0CwgMLAsIDDQLGA7wDyADFAMgAvAPAAwsCvQMMAr4DDAK9A4oDZwGJA2cBigNoAW8DcgNuA3IDbwN1A1wD7QFbA+0BXAPuAVMCUQNUAlQCUQNOAzsD0gA9A9IAOwPQADoD0AA7A9AAOgPUADoDNQNpCToDaQnUADUDMANpCTADNQMvA2kJMANBAWkJQQFAAdQAQAHVAEAB1ABpCTADKgMrAzADKwNBASsDJQNqCSUDKwMmA0EBagk/AWoJQQErA70CagklA2oJvQK8Aj8BvAJDAbwCPwFqCSEDvQIlA70CIQO/Ag0D1ALQAg0D0ALRAgkD1wLTAgkD0wLUAgUD2gLWAtYC1wIFA9kCAQPcAgED2QLaAk4B/AL/AvwCTgFKAf0C3QLcAt0C/QLfAvoC4ALfAuAC+gLiAhMA8wL3AvMCEwD0AucC6gLmAuoC5wL1AtECywLKAssC0QLNArECbgK2Am4CbAK2Aq0CbQJuAm0CrQJxAnECqQJwAqkCcQKoAqQCqQKjAqkCpAJrCXACawlyAmsJcAKpAmsJbAltCWsJpAJsCWsJdQJyAnUCawltCW0JbglvCW4JbQlsCXUCbQlwCXAJbQlvCXEJbwlyCW8JcQlwCXcCcQlzCXEJdwJwCXcCdQJwCXUCdwJ0AoECcQmDAnEJgQJzCYECfAJzCXwCgQJ/AnwCeAJzCXgCdwJzCYMCcgl0CXIJgwJxCXQJdQl2CXUJdAlyCYYCdgmLAnYJhgJ0CXQJhgKEAoQCgwJ0CXYJdQl3CXYJdwl4CYsCeAmMAngJiwJ2CXcJygF4CcoBdwnJAcoBjAJ4CYwCygHLAXcJeQmaApoCyQF3CXUJeQl3CXkJdQluCXkJngKZApkCmgJ5CW4JngJ5CZ4CbglsCXIJbgl1CW4JcglvCaQCngJsCZ4CpAKfApUCyQGaAskBlQLIAWUCYAJeAmUCXgJdAlwCWABVAFwCVQAAAnkASQl6CXkAegl0ADkCEAJ6CRACOQIRAnQAegkQAhACdQB0AC4CLQKRAC4CkQCQAMIALAIrAiwCwgC/AAYCvwC9AL8ABgIsAtUBJwLTAScC1QEqAtUBNgEqAjYBJQAqAiUAKQIqAikCJQAnAPYBJwAqACcA9gEpAqkAzAHxCMwBqQCqAA8CCQAIAAkADwIRAt0A2gAMAtoABwIMAgkCnAChAJwACQIIAtsACgLaAAcC2gAKAuUBwADkAcAA5QHBAGQBYwHjAWQB4wHgAcQBwwEjAMQBIwAgAHoBPQCIAXoBiAF7AaIIgAGCAYABogiDAcwEgwGpCKIIqQiDAR0BOAE8ATgBHQEYAT0BPgGlAD0BpQCiADgBGAE7ARgBFAE7ATMBWAA0AVgAMwFWABgAKAEtASgBGAAXACQBFgEXARcBHwEkAR8BGAEdARgBHwEXAaMAOAKkAKQAOAJJCTgCOQJJCUkJOQJ6CaUANwKjADkCOgIRAvEE8ATcAHAAgQBuAOAEfQB8AOgA4wDnACQGJgYnBtED0AM+ANED1APPA6sDrAOtA60DrgPxApgImQi2BEMJRAlSCT8EmwFABFEJBQJTCasB8gatASEBDgkjAS8JLgkwCZkInAi3BPIF8QWrAW4AJwEmAfEIEwIXAhMC8QjMAcwB0AETAhMC0AEUAukIXgVdBV4F6QjqCF4FYwVfBdABXQUUAl0F0AHpCF4F6ghjBQkAEQI6AncAPwl6AD8JdwA+CRoBPwk+CT4JPAkaARsBGgE8CTwJOgkbATcJGwE6CRsBNwlXCRkBGwFXCRsBGQHMAOQBZwniAdwD3QPZAw=='
function decodeBrainMesh(buffer){
  const view=new DataView(buffer)
  const MAGIC=0x4e524256, HEADER_BYTES=16, QUANT=32767
  if(view.getUint32(0,true)!==MAGIC) throw new Error('brain mesh: bad magic')
  if(view.getUint32(4,true)!==1) throw new Error('brain mesh: bad version')
  const vertexCount=view.getUint32(8,true), indexCount=view.getUint32(12,true)
  const quant=new Int16Array(buffer,HEADER_BYTES,vertexCount*3)
  const positions=new Float32Array(vertexCount*3)
  for(let i=0;i<positions.length;i++) positions[i]=quant[i]/QUANT
  const indexBase=HEADER_BYTES+vertexCount*3*2
  const indices=new Uint16Array(buffer.slice(indexBase,indexBase+indexCount*2))
  return {positions,indices}
}
function buildBrainGeometry(mesh,count,radius){
  const verts=mesh.positions, indices=mesh.indices, triCount=indices.length/3
  const cdf=new Float32Array(triCount); let total=0
  for(let t=0;t<triCount;t++){
    const a=indices[t*3]*3,b=indices[t*3+1]*3,c=indices[t*3+2]*3
    const ux=verts[b]-verts[a],uy=verts[b+1]-verts[a+1],uz=verts[b+2]-verts[a+2]
    const vx=verts[c]-verts[a],vy=verts[c+1]-verts[a+1],vz=verts[c+2]-verts[a+2]
    total+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)*0.5; cdf[t]=total
  }
  for(let t=0;t<triCount;t++) cdf[t]/=total
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3)
  const seeds=new Float32Array(count),occl=new Float32Array(count)
  for(let s=0;s<count;s++){
    const pick=Math.random(); let lo=0,hi=triCount-1
    while(lo<hi){const mid=(lo+hi)>>1; if(cdf[mid]<pick) lo=mid+1; else hi=mid}
    const a=indices[lo*3]*3,b=indices[lo*3+1]*3,c=indices[lo*3+2]*3
    let u=Math.random(),v=Math.random(); if(u+v>1){u=1-u;v=1-v} const w=1-u-v
    positions[s*3]=(w*verts[a]+u*verts[b]+v*verts[c])*radius
    positions[s*3+1]=(w*verts[a+1]+u*verts[b+1]+v*verts[c+1])*radius
    positions[s*3+2]=(w*verts[a+2]+u*verts[b+2]+v*verts[c+2])*radius
    const e1x=verts[b]-verts[a],e1y=verts[b+1]-verts[a+1],e1z=verts[b+2]-verts[a+2]
    const e2x=verts[c]-verts[a],e2y=verts[c+1]-verts[a+1],e2z=verts[c+2]-verts[a+2]
    const nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x
    const len=Math.hypot(nx,ny,nz)||1
    normals[s*3]=nx/len; normals[s*3+1]=ny/len; normals[s*3+2]=nz/len
    seeds[s]=Math.random()
  }
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.BufferAttribute(positions,3))
  g.setAttribute('aNormal',new THREE.BufferAttribute(normals,3))
  g.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1))
  g.setAttribute('aOcclusion',new THREE.BufferAttribute(occl,1))
  return g
}
const Brain=(()=>{
  const count=PARAMS.brainCount,radius=BRAIN_CONFIG.radius
  const bin=Uint8Array.from(atob(BRAIN_MESH_B64),c=>c.charCodeAt(0))
  const mesh=decodeBrainMesh(bin.buffer)
  const geo=buildBrainGeometry(mesh,count,radius)
  const u={
    iTime:{value:0},iAlpha:{value:0},iResolutionY:{value:window.innerHeight*renderer.getPixelRatio()},
    uCool:{value:linVec(BRAIN_CONFIG.colorCool)},uWarm:{value:linVec(BRAIN_CONFIG.colorWarm)},
    uEdgeColor:{value:linVec(BRAIN_CONFIG.colorEdge)},uCenterColor:{value:linVec(BRAIN_CONFIG.colorCenter)},
    uSynapse:{value:linVec(BRAIN_CONFIG.colorSynapse)},uDeepColor:{value:linVec(BRAIN_CONFIG.colorDeep)},
    uCursorColor:{value:linVec(BRAIN_CONFIG.colorCursor)},uHighlightColor:{value:linVec('#22808A')},
    uCenterRadius:{value:BRAIN_CONFIG.centerRadius},uCenterFalloff:{value:BRAIN_CONFIG.centerFalloff},
    uSize:{value:BRAIN_CONFIG.size},uSynapseRate:{value:BRAIN_CONFIG.synapseRate},uFlowSpeed:{value:BRAIN_CONFIG.flowSpeed},
    uFlowAmount:{value:BRAIN_CONFIG.flowAmount},uGlow:{value:BRAIN_CONFIG.glow},uDepthDarkness:{value:BRAIN_CONFIG.depthDarkness},
    uOcclusionStrength:{value:0},uHighlightPos:{value:new THREE.Vector3()},uHighlightRadius:{value:0.6},
    uHighlightStrength:{value:0},uFocusFadeStrength:{value:0.55},uIsolateStrength:{value:0.88},
    uExplode:{value:1},uExplodeDist:{value:5},uMouse:{value:new THREE.Vector2(-10,-10)},uCursor:{value:0},
    uAspect:{value:1},uCursorRadius:{value:0.1},
  }
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute float aSeed;attribute float aOcclusion;attribute vec3 aNormal;
      uniform float iTime;uniform float iResolutionY;uniform float uSize;uniform float uSynapseRate;
      uniform float uCenterRadius;uniform float uFlowSpeed;uniform float uFlowAmount;
      uniform vec3 uHighlightPos;uniform float uHighlightRadius;uniform float uHighlightStrength;
      uniform float uExplode;uniform float uExplodeDist;
      uniform vec2 uMouse;uniform float uCursor;uniform float uAspect;uniform float uCursorRadius;
      varying float vSeed;varying float vSynapse;varying float vHemi;varying float vDepth;
      varying float vFrontness;varying float vCenterness;varying float vOcclusion;varying float vHighlight;
      varying float vFar;varying float vCursor;varying vec3 vWorldPos;
      void main(){
        vSeed=aSeed; vOcclusion=aOcclusion;
        vec3 p=position; vWorldPos=p; vHemi=step(0.0,p.x);
        vHighlight=(1.0-smoothstep(0.0,uHighlightRadius,distance(position,uHighlightPos)))*uHighlightStrength;
        vec3 focalDir=normalize(uHighlightPos+vec3(1e-5));
        float align=dot(normalize(position+vec3(1e-5)),focalDir);
        vFar=smoothstep(0.55,-0.35,align);
        vec3 rad=normalize(p+vec3(1e-5));
        float breathe=sin(iTime*1.6+aSeed*6.0)*0.012;
        p+=rad*breathe;
        vec3 nrm=normalize(aNormal+vec3(1e-5));
        vec3 ref=abs(nrm.y)<0.95?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
        vec3 tA=normalize(cross(nrm,ref));
        vec3 tB=cross(nrm,tA);
        float ph=iTime*uFlowSpeed+aSeed*6.2831;
        vec3 loopDir=tA*cos(ph)+tB*sin(ph);
        p+=loopDir*uFlowAmount;
        vec3 exDir=normalize(rad+vec3(sin(aSeed*41.0),cos(aSeed*57.0),sin(aSeed*73.0))*0.45);
        p+=exDir*uExplode*uExplodeDist;
        float period=mix(3.0,9.0,aSeed);
        float firePhase=aSeed*period;
        float ft=mod(iTime+firePhase,period);
        float fire=pow(clamp(1.0-ft/0.4,0.0,1.0),2.5);
        if(aSeed>uSynapseRate) fire=0.0;
        vSynapse=fire;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vec4 centerMv=modelViewMatrix*vec4(0.0,0.0,0.0,1.0);
        float rel=centerMv.z-mv.z;
        vFrontness=clamp(rel*0.6+0.5,0.0,1.0);
        gl_Position=projectionMatrix*mv;
        vec4 centerClip=projectionMatrix*centerMv;
        vec2 centerNDC=centerClip.xy/max(0.0001,centerClip.w);
        vec2 pNDC=gl_Position.xy/max(0.0001,gl_Position.w);
        float screenDist=length(pNDC-centerNDC);
        vCenterness=1.0-clamp(screenDist/max(0.05,uCenterRadius),0.0,1.0);
        vec2 dMouse=pNDC-uMouse; dMouse.x*=uAspect;
        vCursor=(1.0-smoothstep(0.0,uCursorRadius,length(dMouse)))*uCursor;
        float baseSize=uSize*(iResolutionY/720.0)*(200.0/-mv.z);
        gl_PointSize=baseSize*(1.0+fire*0.8+vHighlight*1.8+vCursor*1.3);
        vDepth=-mv.z;
      }`,
    fragmentShader:`
      uniform vec3 uCool;uniform vec3 uWarm;uniform vec3 uEdgeColor;uniform vec3 uCenterColor;
      uniform float uCenterFalloff;uniform vec3 uSynapse;uniform float iAlpha;uniform float uGlow;
      uniform float uDepthDarkness;uniform vec3 uDeepColor;uniform float uOcclusionStrength;
      uniform vec3 uHighlightColor;uniform float uHighlightStrength;uniform float uFocusFadeStrength;
      uniform float uIsolateStrength;uniform float uExplode;uniform vec3 uCursorColor;
      varying float vSeed;varying float vSynapse;varying float vHemi;varying float vDepth;
      varying float vFrontness;varying float vCenterness;varying float vOcclusion;varying float vHighlight;
      varying float vFar;varying float vCursor;varying vec3 vWorldPos;
      void main(){
        vec2 p=gl_PointCoord-0.5;
        float r=length(p);
        if(r>0.5) discard;
        float core=pow(smoothstep(0.5,0.0,r),2.2);
        float t=pow(vCenterness,max(0.05,uCenterFalloff));
        float vt=clamp(smoothstep(-0.7,0.9,vWorldPos.y)+vSeed*0.12,0.0,1.0);
        vec3 grad=mix(uCool,uWarm,vt);
        vec3 base=mix(grad,uCenterColor,t);
        base=mix(base,uEdgeColor,(1.0-t)*0.18);
        base=mix(base,uDeepColor,clamp(vOcclusion*uOcclusionStrength,0.0,1.0));
        vec3 col=base+uSynapse*vSynapse*2.0;
        col=mix(col,uHighlightColor,vHighlight*0.5);
        col+=uHighlightColor*vHighlight*0.7;
        float nonFocus=(1.0-vHighlight)*uHighlightStrength;
        col=mix(col,uDeepColor,nonFocus*uIsolateStrength);
        float depthMul=mix(1.0-uDepthDarkness,1.0,vFrontness);
        col*=depthMul;
        float alphaOut=core*iAlpha*mix(1.0-uDepthDarkness*0.7,1.0,vFrontness);
        alphaOut*=1.0+vHighlight*0.8;
        float focusDim=1.0-uHighlightStrength*uFocusFadeStrength*vFar;
        col*=focusDim; alphaOut*=focusDim;
        col+=uCursorColor*vCursor*0.8;
        alphaOut+=vCursor*core*0.32;
        alphaOut*=1.0-smoothstep(0.0,1.0,uExplode)*0.8;
        gl_FragColor=vec4(col*uGlow,alphaOut);
      }`})
  const group=new THREE.Group(); group.visible=false
  const points=new THREE.Points(geo,mat); points.frustumCulled=false
  group.add(points); scene.add(group)
  const par={ry:0,rx:0}
  return{ render(t){
    const progress=timeline.getProgress(),appear=brainAppear(progress),o=getOutro()
    const exit=smoothstep(0.12,1,o)
    u.iTime.value=t
    u.iAlpha.value=appear*(1-smoothstep(0.55,1,o))
    u.uExplode.value=Math.max(1-appear,exit)
    group.position.z=exit*BRAIN_CONFIG.approach
    u.iResolutionY.value=window.innerHeight*renderer.getPixelRatio()
    u.uAspect.value=window.innerWidth/Math.max(1,window.innerHeight)
    u.uCursorRadius.value=clamp((0.1*4.6)/camera.position.length(),0.04,0.13)
    if(PARAMS.pointerReaction){
      u.uMouse.value.x+=(pointer.x-u.uMouse.value.x)*0.18
      u.uMouse.value.y+=(pointer.y-u.uMouse.value.y)*0.18
    }
    const cursorTarget=PARAMS.pointerReaction?1:0
    u.uCursor.value+=(cursorTarget-u.uCursor.value)*0.1
    const spin=clamp((progress-2.7)/1.3,0,1)*BRAIN_CONFIG.scrollSpin
    const cursor=u.uCursor.value
    const targetRy=clamp(pointer.x,-1,1)*BRAIN_CONFIG.cursorTilt*cursor
    const targetRx=-clamp(pointer.y,-1,1)*BRAIN_CONFIG.cursorTilt*0.65*cursor
    par.ry+=(targetRy-par.ry)*0.05; par.rx+=(targetRx-par.rx)*0.05
    group.rotation.y=BRAIN_CONFIG.baseRotationY+spin+par.ry
    group.rotation.x=par.rx
    group.visible=appear>0.001&&o<0.998
  }}
})()

/* ================================================================
   ATMOSPHERE — camera-attached motes (port of atmosphere.tsx)
================================================================ */
const Atmosphere=(()=>{
  const N=PARAMS.atmoCount
  const positions=new Float32Array(N*3),sizes=new Float32Array(N)
  for(let i=0;i<N;i++){
    positions[i*3]=2*Math.random()-1;positions[i*3+1]=2*Math.random()-1;positions[i*3+2]=2*Math.random()-1
    sizes[i]=PARAMS.atmoSize*(0.4+Math.random())
  }
  const geo=new THREE.BufferGeometry()
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3))
  geo.setAttribute('size',new THREE.BufferAttribute(sizes,1))
  const orbColor=linVec(ORB.atmo),galColor=linVec(GALAXY.atmo)
  const u={uTime:{value:0},uColor:{value:orbColor.clone()},uAlpha:{value:ORB.atmoAlpha},
    uSpread:{value:ORB.atmoSpread},uFadeNear:{value:ORB.atmoFadeNear},uFadeFar:{value:ORB.atmoFadeFar},
    uRes:{value:new THREE.Vector2(1,1)}}
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute float size;uniform float uTime;uniform vec2 uRes;uniform float uSpread;uniform float uFadeNear;uniform float uFadeFar;
      varying float vA;
      vec3 warp(vec3 p,float t){
        float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.0;
        p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x);
        p.y+=c*sin(s*t+a*p.z)+t*b; p.z+=c*cos(s*t+a*p.y);
        p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
        return cos(p+vec3(1,2,4));
      }
      void main(){
        vec3 v=position*uSpread+warp(position,uTime)*(uSpread*0.28);
        vec4 mv=modelViewMatrix*vec4(v,1.0);
        float r=length(v);
        float farF=1.0-smoothstep(uFadeNear,uFadeFar,r);
        float nearF=smoothstep(0.0,0.3,-mv.z);
        vA=farF*nearF;
        gl_PointSize=size*uRes.y/900.0/-mv.z; gl_PointSize=max(gl_PointSize,1.0);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`
      uniform vec3 uColor;uniform float uAlpha;varying float vA;
      void main(){
        vec2 p=gl_PointCoord-0.5; float l=length(p);
        if(l>0.5) discard;
        float tex=smoothstep(0.5,0.0,l);
        gl_FragColor=vec4(uColor*tex,tex*vA*uAlpha);
      }`})
  const points=new THREE.Points(geo,mat); points.frustumCulled=false; scene.add(points)
  return{ render(t){
    const p=galaxyPresence(timeline.getState()),dpr=renderer.getPixelRatio()
    u.uTime.value=t*8
    u.uRes.value.set(window.innerWidth*dpr,window.innerHeight*dpr)
    u.uColor.value.lerpVectors(orbColor,galColor,p)
    u.uAlpha.value=lerp(ORB.atmoAlpha,GALAXY.atmoAlpha,p)
    u.uSpread.value=lerp(ORB.atmoSpread,GALAXY.atmoSpread,p)
    u.uFadeNear.value=lerp(ORB.atmoFadeNear,GALAXY.atmoFadeNear,p)
    u.uFadeFar.value=lerp(ORB.atmoFadeFar,GALAXY.atmoFadeFar,p)
    points.position.copy(camera.position)
  }}
})()

/* ================================================================
   CAMERA RIG — travels orb↔galaxy (port of main-scene.tsx CameraRig)
================================================================ */
const CameraRig={ update(delta){
  const state=timeline.getState(),presence=galaxyPresence(state)
  const intro=getIntro(),eased=1-Math.pow(1-intro,2)
  const galaxyZ=GALAXY_CONFIG.cameraZ-state.galaxyDive*GALAXY_CONFIG.dive
  const targetZ=lerp(PARAMS.orbCameraZ,galaxyZ,presence)+(1-eased)*INTRO_DOLLY
  camera.position.z+=(targetZ-camera.position.z)*Math.min(1,delta*8)
  const sway=lerp(ORB_PARALLAX,GALAXY_CONFIG.parallax,presence)
  const targetX=PARAMS.pointerReaction?pointer.x*sway*eased:0
  const targetY=PARAMS.pointerReaction?pointer.y*sway*0.55*eased:0
  const follow=Math.min(1,delta*3)
  camera.position.x+=(targetX-camera.position.x)*follow
  camera.position.y+=(targetY-camera.position.y)*follow
  camera.lookAt(0,0,0)
}}


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
  if(loaded&&introStartT===null) introStartT=performance.now()
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
  if(loaded&&!heroRevealed){ heroRevealed=true; setReveal(ovHero,true) }
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
   Resize
================================================================ */
function resize(){
  const w=window.innerWidth,hh=window.innerHeight
  HERO.style.height=(7*hh)+'px'   // 6 tracks of travel + the pinned stage (Vesper: 700lvh)
  renderer.setPixelRatio(clampDpr())
  renderer.setSize(w,hh,false)
  composer.setPixelRatio(clampDpr())
  composer.setSize(w,hh)
  bloomPass.setSize(w,hh)
  camera.aspect=w/hh; camera.updateProjectionMatrix()
  measure()
}
addEventListener('resize',resize,{passive:true})
addEventListener('load',measure)
resize()

/* Ready once the first frame has actually been drawn (shaders compiled),
   then the intro dolly + hero copy reveal play. */
let loaded=false, framesDrawn=0
function onReady(){ if(loaded) return; startIntro(); loaded=true; HERO.classList.add('hlab-vx-ready') }

/* ================================================================
   Main loop — pauses rendering while the hero is off screen
================================================================ */
let lastNow=performance.now()
function tick(now){
  requestAnimationFrame(tick)
  const dt=Math.min(0.05,Math.max(0.001,(now-lastNow)/1000)); lastNow=now
  const t=now/1000
  const y=updateClock()
  timeline.advance(dt)
  const clock=timeline.getProgress()
  updateOverlays(clock,loaded)
  paintBeats(clock)
  if(loaded && (y>7*vh+2 || y<-vh)) return   // hero not on screen: skip the GPU work
  CameraRig.update(dt)
  Backdrop.render(t)
  HeroLine.render()
  Orb.render(t,dt)
  Galaxy.render(t,dt)
  Brain.render(t)
  Atmosphere.render(t)
  composer.render()
  if(!loaded && ++framesDrawn===2) setTimeout(onReady,120)
}
requestAnimationFrame(tick)
}
