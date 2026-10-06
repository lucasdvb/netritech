import base64
cells=[
 ("01","ESTABLISH","0.0–1.4s","Exact first frame. <b>The camera glides right</b>: laptop lids, people and room slide at different speeds (real parallax). No AI yet.","continuous"),
 ("02","RISE","1.4–2.6s","<b>Crane rise</b> while still drifting right; the dark wall and screen fill the top of frame, making room for the agents.","continuous"),
 ("03","SCAN","2.6–3.5s","<b>Anamorphic teal flare blooms on her microphone</b>; a hairline neon front ripples down the row, leaving glowing outlines and a point cloud.","continuous"),
 ("04","AGENTS RISE · HERO","3.5–4.9s","<b>Three teal agents assemble bottom-to-top</b>, each the person's own head-and-shoulders echo (ponytail, bald head, curls). Ribbons carry data from each headset; panels pop in: live call, ticket resolving, CSAT rising.","continuous"),
 ("05","DRAIN","4.9–5.9s","<b>Daylight drains to near-black</b>; people become wireframe silhouettes, agents and panels stay lit, the room shows as faint linework. Headline zone goes dark here.","continuous"),
 ("06","DIVE","5.9–7.0s","<b>Push into the woman's agent</b>: lines blow past and soften, bokeh, two rings ripple, ribbons curl in from the edges toward one point.","continuous"),
 ("07","GRID","7.0–8.0s","<b>Ribbons meet in a second flare</b> over a glossy floor reflection, everything fades, and the supplied SPM grid holds still from 7.6s (scroll end state).","end · hold"),
]
def img(n): return 'data:image/jpeg;base64,'+base64.b64encode(open(f'storyboard/frame-{n}.jpg','rb').read()).decode()
cards=''.join(f'''<figure class="cell" id="frame-{n}"><div class="shot"><img src="{img(n)}" alt="Frame {n} {name}"></div>
<figcaption><div class="lab"><span>{n} · {name}</span><span>{tm}</span></div><p>{note}</p><span class="chip">{seam}</span></figcaption></figure>''' for n,name,tm,note,seam in cells)
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SPM Agent Shadows · Storyboard v2</title>
<style>
:root{{--bg:#0D141F;--panel:#1B2A38;--steel:#43617A;--teal:#22808A;--neon:#5ED6DE;--ice:#DCEBF2;--pearl:#DADDE0;--mist:#F9FAFB}}
*{{box-sizing:border-box;margin:0}}
body{{background:var(--bg);color:var(--pearl);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:32px 16px 64px}}
header{{max-width:1500px;margin:0 auto 28px}}
h1{{font:600 30px/1.2 Georgia,"Libre Baskerville",serif;color:var(--mist)}} h1 em{{color:var(--neon)}}
.dek{{color:var(--pearl);opacity:.8;margin-top:6px;max-width:900px}}
.tag{{display:inline-block;margin-top:12px;border:1px solid var(--steel);border-radius:99px;padding:3px 12px;font-size:12px;letter-spacing:.06em;color:var(--ice)}}
.grid{{max-width:1500px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,440px),1fr));gap:22px}}
.cell{{background:var(--panel);border-radius:14px;overflow:hidden;border:1px solid rgba(94,214,222,.15)}}
.shot{{aspect-ratio:16/9;background:#020202;position:relative}} .shot img{{width:100%;height:100%;object-fit:cover;display:block}}
figcaption{{padding:14px 16px 16px}}
.lab{{display:flex;justify-content:space-between;font-size:12px;letter-spacing:.08em;color:var(--neon);font-weight:600}}
.lab span:last-child{{color:var(--pearl);opacity:.7;font-weight:500}}
figcaption p{{margin:8px 0 10px;font-size:14px}} figcaption b{{color:var(--mist)}}
.chip{{font-size:11px;border:1px solid var(--steel);border-radius:99px;padding:2px 10px;color:var(--ice)}}
.info h3{{font:600 13px/1.4 system-ui;letter-spacing:.08em;color:var(--neon);margin-bottom:10px}}
.info{{padding:18px}} .info li{{margin:4px 0 4px 18px;font-size:14px}}
.sw{{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}} .sw span{{width:56px;height:36px;border-radius:6px;font-size:10px;display:flex;align-items:end;padding:3px;color:#fff;border:1px solid rgba(255,255,255,.15)}}
.seam{{display:flex;flex-wrap:wrap;gap:6px;font-size:12px}} .seam span{{background:var(--bg);border-radius:6px;padding:4px 8px}}
</style></head><body>
<header><h1>SPM · <em>Agent Shadows</em> — storyboard v2</h1>
<p class="dek">Behind every SPM agent is AI that works alongside them. Seven beats, one unbroken camera, built from your edited team photo. These sketches are real frames from the current build: approve the layouts, or name the frames to change.</p>
<span class="tag">1920×1080 · 8.0 s · 30 fps · silent · 7 beats</span></header>
<main class="grid">{cards}
<section class="cell info"><h3>SEAM MAP</h3><div class="seam"><span>01 → 02 glide→rise</span><span>02 → 03 flare</span><span>03 → 04 build</span><span>04 → 05 drain</span><span>05 → 06 push-in</span><span>06 → 07 converge</span><span>07 hold 0.4 s</span></div>
<h3 style="margin-top:16px">ONE CAMERA</h3><p style="font-size:14px">No cuts. Left-to-right glide, then up, then down and in. Every frame works as a still for scroll-scrubbing.</p></section>
<section class="cell info"><h3>TOKENS</h3><div class="sw"><span style="background:#0D141F">Ink</span><span style="background:#1B2A38">Ardoise</span><span style="background:#43617A">Steel</span><span style="background:#22808A">Teal</span><span style="background:#5ED6DE;color:#0D141F">Neon</span><span style="background:#DADDE0;color:#0D141F">Perle</span></div>
<ul><li>UI type: Bricolage Grotesque (brand)</li><li>Allowed: UI panels and charts, anamorphic flare, teal neon</li><li>Banned: robot or android faces, off-brand hues, glitch, motion-blur streaks, anything busy in the centre-lower headline zone</li></ul></section>
</main></body></html>'''
open('storyboard.html','w').write(html)
import os; print(os.path.getsize('storyboard.html')//1024,'KB')
