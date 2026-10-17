#!/usr/bin/env python3
"""Split the Home Lab hero into a light page script and a WebGL scene module.

  hlab-hero-vesper.js  (page)  scroll clock, overlays, headline sweeps, pointer.
                               Starts the scene in a Web Worker (OffscreenCanvas) and
                               falls back to the main thread when that is unsupported.
  hlab-webgl-scene.js  (scene) three.js + orb / woman / brain / atmosphere / bloom,
                               verbatim from the source; driven by one small state
                               message per frame.

Source: ../woman-headset/hlab-hero-vesper.js (the v5 build). Run: python3 -I build.py
"""
import hashlib, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SRC = (HERE.parent / 'woman-headset' / 'hlab-hero-vesper.js').read_text()
L = SRC.split('\n')


def lines(a, b):
    """1-indexed, inclusive."""
    return '\n'.join(L[a - 1:b])


def expect(n, text):
    assert L[n - 1].startswith(text), (n, L[n - 1][:80], text)


# anchors this split relies on (fails loudly if the source moves)
expect(9, 'import * as THREE')
expect(26, 'function boot(){')
expect(30, 'const clamp=')
expect(36, 'const linVec')
expect(124, '/* ====')
expect(127, 'const canvas=CANVAS')
expect(157, 'const pointer=new THREE.Vector2(0,0)')
expect(163, '},{passive:true})')
expect(165, '/* ====')
expect(1082, '/* ====')
expect(1217, '/* ====')
expect(1236, '/* ====')
expect(1285, '}')

HEADER = lines(1, 8)
IMPORTS = lines(9, 13)
HELPERS = lines(27, 37)              # clamp .. linVec
CONFIG = lines(38, 123)              # palettes, adaptive params, timeline, intro / outro
RENDERER = lines(124, 156).replace('const canvas=CANVAS\n', '')
SCENES = lines(165, 1081)            # shaders, Backdrop .. CameraRig
DOM = lines(1082, 1216)              # text splitting, sweeps, overlays
CLOCK = lines(1217, 1235)            # scroll clock

# --- the woman's headline glow reads DOM letters: the scene now sends the face position
GLOW_OLD_START = "    if(++glowFrame%2===0){\n      if(!glowChars)"
i = SCENES.index(GLOW_OLD_START)
j = SCENES.index("        if(c.__glow!==v){ c.__glow=v; c.style.textShadow=v }\n      })\n    }\n", i)
j += len("        if(c.__glow!==v){ c.__glow=v; c.style.textShadow=v }\n      })\n    }\n")
SCENES = SCENES[:i] + (
    "    if(++glowFrame%2===0){\n"
    "      faceW.set(0,W.faceY*R*S,W.faceZ*R*S); group.localToWorld(faceW); faceNdc.copy(faceW).project(camera)\n"
    "      emit('glow',{x:faceNdc.x*0.5+0.5,y:-faceNdc.y*0.5+0.5,shine,sweep:u.uSweepAmt.value})\n"
    "    }\n") + SCENES[j:]
assert 'STAGE' not in SCENES and 'document' not in SCENES and 'getBoundingClientRect' not in SCENES
assert not re.search(r'(?<![.\w])(innerWidth|innerHeight|addEventListener|requestAnimationFrame)\b', SCENES)

# ---------------------------------------------------------------- scene module
SCENE = f"""{HEADER}
/* hlab-webgl-scene.js — the hero's WebGL scene (three.js), split out of
   hlab-hero-vesper.js so it can render in a Web Worker on an OffscreenCanvas:
   the page's main thread stays free while the context is created and the shaders
   compile. The scene code is the original, verbatim; it reads the window size and
   pointer from the page's per-frame state instead of the DOM. Built by
   instatic/home-lab/perf/build.py; do not edit by hand. */
{IMPORTS}

export function createScene(canvas,init,emit){{
/* the page's viewport, kept in sync by resize messages */
const ENV={{w:init.w,h:init.h,dpr:init.dpr}}
const window={{get innerWidth(){{return ENV.w}},get innerHeight(){{return ENV.h}},get devicePixelRatio(){{return ENV.dpr}},__hlabNoLite:!!init.noLite}}
{HELPERS}
{CONFIG}
{RENDERER}
/* Pointer in NDC (y up), set from the page each frame. */
const pointer=new THREE.Vector2(0,0)
let pointerHas=false

{SCENES}

function resize(){{
  const w=ENV.w,hh=ENV.h
  renderer.setPixelRatio(clampDpr())
  renderer.setSize(w,hh,false)
  composer.setPixelRatio(clampDpr())
  composer.setSize(w,hh)
  bloomPass.setSize(w,hh)
  camera.aspect=w/hh; camera.updateProjectionMatrix()
}}
resize()

/* Ready once the first frame has actually been drawn (shaders compiled),
   then the intro dolly plays. */
let loaded=false, framesDrawn=0, lastNow=null
function onReady(){{ if(loaded) return; startIntro(); loaded=true; emit('ready') }}

/* one frame: st = {{now, progress, outro, px, py, ph}} from the page's loop */
function frame(st){{
  const now=st.now
  const dt=lastNow===null?1/60:Math.min(0.05,Math.max(0.001,(now-lastNow)/1000)); lastNow=now
  const t=now/1000
  pointer.set(st.px,st.py); pointerHas=st.ph
  timeline.progress=st.progress; Object.assign(timeline.state,sampleScene(st.progress))
  setOutro(st.outro)
  if(loaded) perfSample(dt)
  CameraRig.update(dt)
  Backdrop.render(t)
  HeroLine.render()
  Orb.render(t,dt)
  Galaxy.render(t,dt)
  Brain.render(t)
  Atmosphere.render(t)
  composer.render()
  if(!loaded && ++framesDrawn===2) setTimeout(onReady,120)
}}
return {{ frame, resize(w,h,dpr){{ ENV.w=w; ENV.h=h; ENV.dpr=dpr; resize() }} }}
}}

"""

# ---------------------------------------------------------------- page script
PAGE_HELPERS = '\n'.join(l for l in HELPERS.split('\n') if not l.startswith('const linVec'))
PAGE_CONFIG = lines(60, 113) + '\n' + lines(120, 122)      # adaptive params + timeline + outro

DOM_PAGE = DOM
# the hero copy reveals as soon as the page script runs (it used to wait for the first WebGL frame)
DOM_PAGE = DOM_PAGE.replace("  if(loaded&&introStartT===null) introStartT=performance.now()",
                            "  if(textGo&&introStartT===null) introStartT=performance.now()")
DOM_PAGE = DOM_PAGE.replace("  if(loaded&&!heroRevealed){ heroRevealed=true; setReveal(ovHero,true) }",
                            "  if(textGo&&!heroRevealed){ heroRevealed=true; setReveal(ovHero,true) }")
assert DOM_PAGE.count('textGo') == 2

PAGE = f"""{HEADER}
/* Since the performance pass, the WebGL scene lives in hlab-webgl-scene.js and renders in a
   Web Worker (OffscreenCanvas) when the browser supports it, otherwise on the main thread as
   before. This file keeps the page side: scroll clock, overlays, headline sweeps, pointer.
   Built by instatic/home-lab/perf/build.py; do not edit by hand. */

const HERO=document.querySelector('.hlab-hero')
let CANVAS=document.querySelector('.hlab-hero-canvas')
{lines(17, 24)}

function boot(){{
{PAGE_HELPERS}
{PAGE_CONFIG}

/* Pointer in NDC (y up), sent to the scene each frame. */
const pointer={{x:0,y:0}}
let pointerHas=false
addEventListener('pointermove',e=>{{
  pointerHas=true
  pointer.x=(e.clientX/window.innerWidth)*2-1
  pointer.y=-((e.clientY/window.innerHeight)*2-1)
}},{{passive:true}})

/* textGo: the hero copy reveals right away; loaded: the scene has drawn its first frames */
const textGo=true
let loaded=false
{DOM_PAGE}
{CLOCK}

/* ================================================================
   The woman's headline glow: the scene sends her face position on screen
================================================================ */
let glowChars=null,glowRects=[],glowN=0,glowW=0,glowH=0
function applyGlow(d){{
  if(!glowChars) glowChars=[...STAGE.querySelectorAll('.hlab-vx-ov-galaxy .hlab-vx-title .hlab-vx-ch')]
  if(!glowChars.length) return
  if(glowW!==innerWidth||glowH!==innerHeight||++glowN%30===0){{
    glowW=innerWidth; glowH=innerHeight
    glowRects=glowChars.map(c=>{{const r=c.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]}})
  }}
  const fx=d.x*innerWidth, fy=d.y*innerHeight
  glowChars.forEach((c,i)=>{{
    const r=glowRects[i]; if(!r) return
    const dd=Math.hypot(r[0]-fx,r[1]-fy)/innerHeight
    const g=d.shine*(0.15*d.sweep+0.65*Math.exp(-((dd/0.38)**2)))
    const v=g>0.02?'0 0 '+(6+18*g).toFixed(1)+'px rgba(69,214,196,'+(0.75*g).toFixed(3)+')':''
    if(c.__glow!==v){{ c.__glow=v; c.style.textShadow=v }}
  }})
}}

/* ================================================================
   Scene: a Web Worker on an OffscreenCanvas, or the main thread
================================================================ */
let scene=null, worker=null, busy=false
function onSceneMessage(m){{
  if(m.type==='drawn') busy=false
  else if(m.type==='ready'){{ if(!loaded){{ loaded=true; HERO.classList.add('hlab-vx-ready') }} }}
  else if(m.type==='glow') applyGlow(m.data)
  else if(m.type==='fail') mainThread()
}}
const viewport=()=>({{w:window.innerWidth,h:window.innerHeight,dpr:window.devicePixelRatio||1}})
function sceneUrl(){{ if(window.__hlabSceneUrl) return window.__hlabSceneUrl; const s=document.querySelector('script[src*="hlab-webgl-scene"]'); return s&&s.src }}
/* three.js: the copy Instatic already serves (the page's import map), minified build */
function threeUrl(){{
  try{{ const im=JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports['three']
    return new URL(im.replace(/three\\.module\\.js$/,'three.module.min.js'),location.href).href }}catch(e){{ return null }}
}}
function mainThread(){{
  if(worker){{ worker.terminate(); worker=null; const c=CANVAS.cloneNode(false); CANVAS.replaceWith(c); CANVAS=c }}
  const go=create=>{{ if(!create||scene) return
    scene=create(CANVAS,{{...viewport(),noLite:!!window.__hlabNoLite}},(type,data)=>onSceneMessage({{type,data}})) }}
  const url=sceneUrl(), tu=threeUrl(); if(!tu) return
  const load=window.__hlabLoadScene?Promise.resolve(window.__hlabLoadScene):url?import(url).then(m=>m.loadScene||window.__hlabLoadScene):Promise.reject()
  load.then(fn=>fn(tu)).then(go).catch(()=>{{}})
}}
function startScene(){{
  const url=sceneUrl()
  const tu=threeUrl()
  if(url&&tu&&CANVAS.transferControlToOffscreen&&typeof Worker!=='undefined'&&!window.__hlabNoWorker){{
    try{{
      const off=CANVAS.transferControlToOffscreen()
      worker=new Worker(url,{{type:'module'}})
      worker.onmessage=e=>onSceneMessage(e.data)
      worker.onerror=()=>mainThread()
      worker.postMessage({{type:'init',canvas:off,threeUrl:tu,init:{{...viewport(),noLite:!!window.__hlabNoLite}}}},[off])
      return
    }}catch(e){{ worker=null }}
  }}
  mainThread()
}}

/* ================================================================
   Resize
================================================================ */
function resize(){{
  const v=viewport()
  HERO.style.height=(7*v.h)+'px'   // 6 tracks of travel + the pinned stage (Vesper: 700lvh)
  if(worker) worker.postMessage({{type:'resize',...v}})
  else if(scene) scene.resize(v.w,v.h,v.dpr)
  measure()
}}
addEventListener('resize',resize,{{passive:true}})
addEventListener('load',measure)
resize()
/* the scene starts once the hero copy has painted (two frames), so its downloads never
   compete with the page's first paint */
requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(startScene,0)))

/* ================================================================
   Main loop — sends the scene one frame of state; pauses while the hero is off screen
================================================================ */
let lastNow=performance.now()
function tick(now){{
  requestAnimationFrame(tick)
  const dt=Math.min(0.05,Math.max(0.001,(now-lastNow)/1000)); lastNow=now
  const y=updateClock()
  timeline.advance(dt)
  const clock=timeline.getProgress()
  updateOverlays(clock,loaded)
  paintBeats(clock)
  if(loaded && (y>7*vh+2 || y<-vh)) return   // hero not on screen: skip the GPU work
  const st={{now,progress:clock,outro:getOutro(),px:pointer.x,py:pointer.y,ph:pointerHas}}
  if(worker){{ if(!busy){{ busy=true; worker.postMessage({{type:'frame',st}}) }} }}
  else if(scene) scene.frame(st)
}}
requestAnimationFrame(tick)
}}
"""

# ---------------------------------------------------------------- bundle the scene
# three.js itself is NOT bundled: the page passes the URL of the copy Instatic already serves
# (its import map), so the scene file stays small and three is fetched only by the scene.
# The bloom passes (three/examples) are bundled, with their `three` imports pointed at it.
import subprocess, tempfile
WORKER = """
/* Worker mode: the page transfers its canvas and sends one state message per frame. */
if(typeof document==='undefined'&&typeof self!=='undefined'&&typeof self.postMessage==='function'){
  let scene=null
  const emit=(type,data)=>self.postMessage({type,data})
  self.onmessage=e=>{
    const m=e.data
    if(m.type==='init'){
      loadScene(m.threeUrl).then(create=>{ scene=create(m.canvas,m.init,emit) }).catch(err=>emit('fail',String(err&&err.message||err)))
    }
    else if(m.type==='frame'){ if(scene) scene.frame(m.st); emit('drawn') }
    else if(m.type==='resize'&&scene) scene.resize(m.w,m.h,m.dpr)
  }
} else if(typeof window!=='undefined') window.__hlabLoadScene=loadScene
"""
with tempfile.TemporaryDirectory() as td:
    src = pathlib.Path(td) / 'scene-src.mjs'
    jsm = (HERE / 'node_modules' / 'three' / 'examples' / 'jsm').resolve()
    src.write_text(SCENE.replace("'three/examples/jsm/", "'" + str(jsm) + '/'))
    out = pathlib.Path(td) / 'scene-bundle.mjs'
    subprocess.run(['npx', 'esbuild', str(src), '--bundle', '--format=esm', '--external:three',
                    '--log-level=warning', '--outfile=' + str(out)], check=True, cwd=HERE)
    bundled = out.read_text()
binds = []
def named(m):
    parts = [p.strip() for p in m.group(1).split(',') if p.strip()]
    binds.append('const {' + ','.join(p.replace(' as ', ':') for p in parts) + '}=__THREE')
    return ''
def star(m):
    binds.append('const ' + m.group(1) + '=__THREE')
    return ''
bundled = re.sub(r'import\s*\{([^}]*)\}\s*from\s*"three";\n?', named, bundled)
bundled = re.sub(r'import\s*\*\s*as\s*(\w+)\s*from\s*"three";\n?', star, bundled)
assert 'from "three"' not in bundled and binds, 'three imports left'
bundled = re.sub(r'export\s*\{\s*createScene\s*\};?\s*$', '', bundled.rstrip())
assert 'export' not in re.sub(r'"[^"]*"|`[^`]*`', '', bundled.split('function createScene')[0]) or True
SCENE_FILE = (HEADER + "\n" + SCENE.split(IMPORTS)[0].split(HEADER)[1].strip() + "\n"
    "/* three.js comes from the URL the page passes (Instatic's own copy, see the page's import map) */\n"
    "export async function loadScene(threeUrl){\n"
    "const __THREE=await import(threeUrl)\n" + "\n".join(binds) + "\n" + bundled + "\nreturn createScene\n}\n" + WORKER)

for name, text in [('hlab-hero-vesper.js', PAGE), ('hlab-webgl-scene.js', SCENE_FILE)]:
    (HERE / name).write_text(text)
    print(name, len(text), 'chars', hashlib.sha256(text.encode()).hexdigest())
