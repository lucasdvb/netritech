# Home Lab performance pass (2026-10-17)

Goal: mobile and desktop Lighthouse into the 90s without changing quality or UX.

## What changed

- **Hero WebGL moved off the main thread.** `build.py` splits the v5 hero
  (`../woman-headset/hlab-hero-vesper.js`, sha c7f990b6) into:
  - `hlab-hero-vesper.js`: the page side (scroll clock, overlays, headline sweeps, pointer).
  - `hlab-webgl-scene.js`: the scene. It runs in a module Worker on an OffscreenCanvas,
    or on the main thread when that is not supported. three.js comes from the copy
    Instatic already serves (the page's import map, minified build).
  - The meshes are lossless PNGs in the media library (`mesh-woman.png`, `mesh-brain.png`).
  - The scene starts after first-contentful-paint, or after 2.5 s at the latest.
  - The hero copy now reveals straight away instead of waiting for the first WebGL frame.
- **`patches/`** (`make.py` → `patches.json`): small edits to the other page scripts and CSS:
  - chrome: footer FX mounts near the viewport; first draw on the next frame.
  - logos: the first measure is left to the ResizeObserver.
  - lazy-video: section background photos load about 1.5 screens ahead.
  - teams: each card title is a real button (accessibility).
  - feature-sweep: label fixes for the accessibility tree.
  - x5-tm2.css: toggle styles, logo aspect ratio, lazy-background rule.
  - seo: removes `noindex` and adds the 192 and 180 icons (`icons/`).
- **Header logo:** `loading=eager`, `fetchpriority=high`.

## Results (local Lighthouse 13.5, HTTP/2 mirror of the draft)

| | Before | After |
|---|---|---|
| Mobile performance | 30 | 86–88 |
| Desktop performance | 53 | 99 |
| Accessibility / Best practices / SEO | 96 / 96 / 66 | 100 / 100 / 100 |
| Agentic browsing | 1/2 | 2/2 |

On mobile, Speed Index (about 6 s) is what's left. It comes from the hero entrance
animations, which are kept on purpose.

## Rollback

- Hero: restore `../woman-headset/hlab-hero-vesper.js` to `src/scripts/hlab-hero-vesper.js`
  and disable `src/scripts/hlab-webgl-scene.js`.
- Other files: the originals are in `../rollback-2026-10-07/`.
