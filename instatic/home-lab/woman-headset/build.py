#!/usr/bin/env python3
"""Build the Home Lab hero script with the woman-with-headset bust in the galaxy slot.

Usage: python3 -I build.py [out.js]
Inputs (all in this folder unless noted):
  ../rollback-2026-10-07/scripts/hlab-hero-vesper.js  the live hero before the swap (base)
  galaxy-woman.js                                     the replacement Galaxy module
  woman-headset.vbrn                                  baked bust (VBRN mesh + VIS1 + CRV1)
  config.json                                         WOMAN_CONFIG values
"""
import base64, hashlib, json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, '../rollback-2026-10-07/scripts/hlab-hero-vesper.js'), encoding='utf-8').read()
vb = open(os.path.join(H, 'woman-headset.vbrn'), 'rb').read()
W = json.load(open(os.path.join(H, 'config.json')))
wcfg = 'const WOMAN_CONFIG={' + ','.join('%s:%s' % (k, v) for k, v in W.items()) + '}\n'
a = src.index('const Galaxy=(()=>{')
b = src.index('/* ================================================================\n   BRAIN')
body = open(os.path.join(H, 'galaxy-woman.js'), encoding='utf-8').read()
new = src[:a] + "const WOMAN_MESH_B64='" + base64.b64encode(vb).decode() + "'\n" + body + src[b:]
gc = new.index('const BRAIN_CONFIG=')
new = new[:gc] + wcfg + new[gc:]
old = 'const galaxyZ=GALAXY_CONFIG.cameraZ-state.galaxyDive*GALAXY_CONFIG.dive'
assert new.count(old) == 1
new = new.replace(old, 'const galaxyZ=Galaxy.camZ(timeline.getProgress())')
# hooks for the woman extras: camera look-at, light mode (pixel ratio + brain thinning), fps sampling
HOOKS = [
    ('const clampDpr=()=>{const d=window.devicePixelRatio||1;const[lo,hi]=PARAMS.dpr;return Math.min(Math.max(d,lo),hi)}',
     'let DPR_SCALE=1\nconst clampDpr=()=>{const d=window.devicePixelRatio||1;const[lo,hi]=PARAMS.dpr;return Math.min(Math.max(d,lo),hi)*DPR_SCALE}'),
    ('  camera.lookAt(0,0,0)\n}}', '  camera.lookAt(0,Galaxy.lookY(timeline.getProgress())*presence,0)\n}}'),
    ('  return{ render(t){\n    const progress=timeline.getProgress(),appear=brainAppear',
     '  return{ setLite(on){ geo.setDrawRange(0,on?Math.floor(count*0.6):Infinity) }, render(t){\n    const progress=timeline.getProgress(),appear=brainAppear'),
    ('  if(loaded && (y>7*vh+2 || y<-vh)) return   // hero not on screen: skip the GPU work\n',
     '  if(loaded && (y>7*vh+2 || y<-vh)) return   // hero not on screen: skip the GPU work\n  if(loaded) perfSample(dt)\n'),
]
for a, b in HOOKS:
    assert new.count(a) == 1, a[:60]
    new = new.replace(a, b)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'hlab-hero-vesper.js')
open(out, 'w', encoding='utf-8').write(new)
print(out, len(new), hashlib.sha256(new.encode()).hexdigest())
