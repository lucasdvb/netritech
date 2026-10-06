# SPM hero films

Two silent, text-free hero films for the SPM website, built to be scroll-scrubbed (scroll position = time).
Palette: ink navy #0D141F, deep navy #1B2A38, steel blue #43617A, teal #22808A (AI only), light grey #DADDE0, on white.

| Film | Engine | Source | Length |
|---|---|---|---|
| #10 The Juggler | Motion Reel (`.claude/skills/motion-reel`) | `spm-juggler/film/film.js` (+ `cast.js`, `timeline.json`) | 11 s |
| #6 Origami Office | HyperFrames 0.8.138 | `spm-origami/index.html` + `origami.js` (+ `cast.js`) | 10 s |

Both films are pure functions of time: the same `t` always paints the same frame, so they can be rendered, scrubbed or re-timed safely.
`cast.js` (the five cartoon people) is shared; keep the two copies identical.

## Render
```sh
# The Juggler (Motion Reel): checks, then a 60 fps master
cd videos/spm-juggler
node scripts/render.mjs --verify      # determinism
node scripts/render.mjs --sheet       # contact sheet → review/sheets/
node scripts/render.mjs               # master → renders/16x9.mp4

# Origami Office (HyperFrames)
cd videos/spm-origami
npx hyperframes check                 # lint + runtime + layout + motion
npx hyperframes render --fps 60 -q delivery -o renders/master.mp4
```
GSAP is vendored as `spm-origami/gsap.min.js` (the render sandbox cannot reach jsDelivr).

## Export for the website
```sh
sh videos/export-scroll.sh videos/spm-juggler/renders/16x9.mp4   videos/web/juggler 30
sh videos/export-scroll.sh videos/spm-origami/renders/master.mp4 videos/web/origami 30
```
Each output folder holds:
- `hero-1920-allintra.mp4`: every frame is a keyframe. Scrub it by setting `video.currentTime`; seeks are instant and exact.
- `hero-1600-g4.mp4`: a lighter scrub encode for mobile.
- `frames/0001.webp …`: an image sequence for an Apple-style `<canvas>` scrubber.
- `poster-first.jpg` / `poster-last.jpg`: use the last frame as the poster for `prefers-reduced-motion`.

## Embed (video scrub)
```html
<section class="hero-track" style="height:320vh">
  <video class="hero" src="hero-1920-allintra.mp4" muted playsinline preload="auto"
         style="position:sticky;top:0;width:100%;aspect-ratio:16/9"></video>
</section>
<script>
  const track = document.querySelector('.hero-track'), v = track.querySelector('video');
  let shown = 0;
  (function tick() {
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    if (v.duration) { const target = p * (v.duration - 0.04); shown += (target - shown) * 0.25; if (!v.seeking) v.currentTime = shown; }
    requestAnimationFrame(tick);
  })();
</script>
```
The film ends on a calm resting frame, so put the page's call to action directly below the track.
