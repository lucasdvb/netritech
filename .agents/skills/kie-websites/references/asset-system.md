# asset-system — the KIE-generated visual system (Phase 2)

The whole point of this skill: sites built here look expensive because **as much
of the visual layer as possible is bespoke-generated** — not stock, not icon
fonts, not CSS approximations. One brief -> one coherent generated visual system.
Treat this phase as designing a brand asset kit, not "getting a hero image".

**SPM sites:** read `docs/spm-brand-brief.md` first; the kit is derived from the
SPM palette (Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal
#22808A, Light grey #DADDE0) and the brief's visual universe. The user's own logo
and marks always win over generated ones.

**Permission (hard rule).** Every command below costs credits. Present the kit as
ONE itemized list (item, prompt, model, aspect, resolution/duration, count) and
wait for an explicit yes; the yes covers exactly that list. Re-rolls, variants,
retries, and uploads of local files are a new ask. Never batch beyond the list.

**Commands** (run from repo root; the scripts block until the result is ready and
print `url ...`, then save `-o` when the result host is reachable):

```bash
# stills: GPT Image 2.5 Flare, 1K default
python3 scripts/kie_image.py "prompt" -a 16:9 -r 1K -o site/refs/hero-a.png
# reference-guided / edit (image-to-image, up to 16 public URLs)
python3 scripts/kie_image.py "keep the composition, regrade to <palette>" -a 16:9 -o out.png -i <url> [-i <url> ...]
# transparent cutout (no separate background-remover model)
python3 scripts/kie_image.py "prompt" -a 1:1 --background transparent -o cutout.png
# host a local file so it can be used as -i / --first-frame
python3 scripts/kie_upload.py site/refs/hero-a.png
# motion: Gemini Omni Flash 1.1, 1080p; 4/6/8/10 s; 16:9 or 9:16 only
python3 scripts/kie_video.py "prompt" -a 16:9 -r 1080p -d 6 --first-frame <url> -o site/refs/hero-loop.mp4
```

Facts to plan around: `-a` accepts ratios like 1:1, 4:5, 3:4, 2:3, 9:16, 16:9,
21:9, auto; `-r` 1K|2K|4K (stay on 1K unless the user asks); references and
frames must be **public URLs** (uploaded files live about 3 days, so download
results into the site promptly); there is no mask, seed, upscaler, outpainting,
background-remover, or 3D model. Edits are image-to-image with an edit prompt
("keep X unchanged, change Y"). Video is only 16:9 / 9:16: for other shapes
generate the nearest ratio and crop with `ffmpeg`. The video model also produces
audio; the site strips it unless the brief wants sound.

## The asset kit (generate per tier; palette-locked to the boards)

**Precedence rule: the user's own assets always win.** Anything the user provides
(logo, brand marks, product photos, team photos, fonts, existing icon set) is used
as-is — never regenerate a replacement for something they gave you. Generation
fills the GAPS only. The one soft exception: if their photos clash with the chosen
direction, offer a re-grade of THEIR photos (image-to-image, the photo as `-i` plus
a board as grade reference) — don't substitute generated strangers for their real
product/team.

**Prompt skeleton (every kit image):** `[subject and action], [one locked style
preamble reused byte-identical across the kit], palette [named hexes/mood words],
[light direction, material finish], [composition, where the negative space is],
no text, no logos, no watermark`. Also carry the narrative spine motif. Type is
set in HTML, never baked into the image (exception: the OG card if the user wants
the wordmark in it).

Download everything into the assets folder (`site/public/assets/` for React,
`site/assets/` for plain HTML) and reference same-origin. Downscale: hero <=2k,
cutouts ~800px, icons ~256px (`ffmpeg -i in.png -vf scale=2000:-2 out.png`).

**Always (every build):**

1. **Hero visual** — the centerpiece. Generate 2 candidates, pick one, and
   consider an interaction pair (e.g. a dark/desaturated grade + a lit/color grade
   of the SAME composition for reveal effects: generate the base, then a re-grade
   via image-to-image with the base as `-i`, so they align).
2. **Section plates** — 2-3 background textures / atmospheric plates matching the
   boards' background modes (paper grain, graded gradients, material macro shots)
   so sections aren't flat CSS fills.
3. **Content imagery** — portraits, product shots, project screenshots, testimonial
   faces: everything the sections need, style-matched. Fictional project/product
   UIs are generated as images (never div-built fakes).
4. **Custom icon set** — do NOT default to an icon font. Generate the site's icons
   as ONE consistent set: a single image with a grid of 6-12 glyphs in the brand's
   stroke style + palette ("icon set, consistent 2px-stroke line glyphs, [motifs],
   flat on a solid #FF00FF background, 4 columns by 3 rows, no text"). Slice and key
   the ground out locally:
   ```bash
   # 4x3 sheet on a flat ground far from the palette -> 12 transparent PNGs
   for r in 0 1 2; do for c in 0 1 2 3; do
     ffmpeg -v error -y -i site/refs/icons-sheet.png \
       -vf "crop=iw/4:ih/3:iw/4*$c:ih/3*$r,colorkey=0xFF00FF:0.25:0.1,scale=256:-1" \
       site/public/assets/icons/icon-$((r*4+c+1)).png
   done; done
   ```
   Same visual weight, same corner language, sized on a shared grid. If a slice
   shows a fringe, regenerate the sheet on a ground further from the palette
   (ask first), or generate single glyphs with `--background transparent`.
   (Library icons — Phosphor/Radix — remain the fallback for dense functional UI
   like form chrome, where 20+ tiny consistent glyphs beat generated ones.)
5. **Logo / monogram** — ONLY when the user has no logo: a simple generated brand
   mark or monogram (`--background transparent`) for the nav and the head kit
   below. If they have one, use theirs everywhere and skip this item.
6. **OG / cover image** — a proper social card composed in the brand language:
   generate wide (16:9, not a crop of the hero), then crop to 1200x630:
   `ffmpeg -i og-src.png -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630" og.png`.
   Multi-page sites: distinct OG per major route (same template, swapped
   subject/title), not one card everywhere. The plain uncropped generation is the
   site's cover image (used by `references/cover-animator.md` if a cover clip is
   requested).
7. **Head kit (the full favicon/meta set — the FILES exist on every build).**
   Derived locally from the user's own logo when provided, from the generated
   monogram only as the fallback. Work from a high-res source (>=512px, downscale
   — never upscale a small render), background-removed or set on a solid brand
   ground:
   - `favicon.ico` (32) + `favicon.svg` if the mark is simple enough to vectorize,
     else `favicon-32.png` / `favicon-16.png` (`ffmpeg -i mark.png -vf scale=32:32
     favicon.ico`)
   - `apple-touch-icon.png` (180, opaque background, comfortable padding)
   - `icon-192.png` / `icon-512.png` + a **maskable** 512 variant (mark within the
     80% safe zone) referenced from a minimal `site.webmanifest` (name, colors,
     icons)
   - `<meta name="theme-color">` set to the brand ground (light + dark values when
     the page has both)
   - Full social block: `og:title/description/image/url/type` +
     `twitter:card=summary_large_image`, absolute image URLs (`references/seo.md`)
   Sanity-check the favicon at 16px: if the mark turns to noise, use a simplified
   glyph (initial letter on brand ground) for the small sizes rather than shrinking
   the full logo.

**Cinema tier adds:**

8. **Hero film — cinema tier REQUIRES the scroll-scrub, not the loop.** (The
   DEFAULT website is the **animated website** — the scroll-scrub film in
   `references/scroll-scrub.md` — which replaces this single-hero recipe; this item
   is the hero mechanic only when the user explicitly asked for a non-animated
   treatment.) A static image + CSS effect is the floor; an autoplay ambient loop is
   barely above it (it moves, but the user's scroll does nothing). The cinema-tier
   Tier-1 carrier is the **interactive scrub**: the user's scroll literally plays a
   film. Recipe:
   - Generate the approved hero image first, then image-to-video with a slow,
     cut-free 6 s move whose progression maps to scroll: push-in + rack focus
     soft->sharp, subject turn, light sweep, object assembling:
     `python3 scripts/kie_video.py "<prompt>" -a 16:9 -d 6 --first-frame <hero url> -o site/refs/hero-film.mp4`.
     START state != END state, or the scrub has no payoff. Prompt "no cuts, no
     camera shake, slow steady motion only, silent, no on-screen text" and name the
     grade/hexes.
   - ffmpeg: `ffmpeg -i site/refs/hero-film.mp4 -an -vf fps=20,scale=1280:-2 -q:v 4
     site/public/assets/frames/hero/f-%03d.jpg` -> ~120 frames, well under the size
     budget.
   - Canvas image-sequence renderer bound to the pinned hero's ScrollTrigger
     progress: preload+paint frame 1 IMMEDIATELY (capture-safe at scroll 0), stream
     the remaining frames, cover-fit draw, fall back to the nearest loaded frame
     while streaming. Reduced-motion: static final (sharp) frame, no pin.
   - **Ambient loop** (muted autoplay + poster, generated with `--first-frame` and
     `--last-frame` set to the same image for a seamless return) is the documented
     FALLBACK — acceptable only when the composition genuinely can't carry a scrub
     (dense collage heroes); say so in the report. A mid-page band may still use a
     loop freely.

For the **animated website (A4, the default)**, read `references/scroll-scrub.md`
and let its entry still, exact shipped-segment posters, and MP4 film replace the
ordinary single hero scrub above. Those posters also satisfy hero/content imagery
for their chapters. Continue the logo/icon, section-UI, head-kit, and OG work, but
do not generate a redundant second hero film. Independent stills can run together;
keep A's exact-frame leg handoffs sequential.

**Spectacle tier adds:**

9. **Depth/3D layer** — there is no 3D-model generation. Spectacle's 3D is
   procedural (three.js primitives, shaders, particle fields, instanced points
   morphing between generated silhouettes) or a video-frame turntable (an orbit
   clip from the approved hero image, `-d 8`, frames scrubbed like the hero film).
   Verify the source image BEFORE spending on the orbit clip.

## The personalization ladder — generate what the user doesn't have

When the user arrives with nothing but an idea, you are also the brand studio.
Read what they DO have from intake (logo? photos? brand colors?) and propose
everything missing. Beyond the core kit, reach for these whenever the site has a
natural slot for them — each one compounds the "this was made for me" effect:

- **Brand identity kit** — logo + wordmark + monogram as a consistent family (not
  three unrelated marks): generate the primary mark, then derive the others via
  image-to-image with the primary as `-i`. Favicon renders, ink/inverse variants
  for dark and light grounds.
- **Animated logo sting** — 4 s image-to-video of the mark assembling or a light
  sweep (`--first-frame` the mark); use as nav-load flourish or footer sign-off
  (frames or muted video, reduced-motion static).
- **Seamless brand pattern / texture** — a tileable motif in the palette for
  section dividers, card backs, packaging-style bands. Prompt "seamless repeating
  pattern" and check the tile edge (`ffmpeg` tile a 2x2 preview).
- **Spot illustration set** — 3-6 scene illustrations in ONE named style (same line
  weight, same palette, same perspective logic) for features, process steps, and
  about sections. Spell the style identically in every prompt.
- **State artwork** — 404 page art, empty states, success/confirmation moments,
  loading poster. These forgotten corners are where bespoke sites most obviously
  beat templates.
- **People** — founder/team portraits (stylized consistently if no real photos),
  testimonial faces, community shots — same grade as the rest of the kit,
  locale-appropriate.
- **Product universe** — multiple angles + lifestyle context shots derived from one
  approved product image via reference-driven generation (product image as `-i` in
  every prompt), so every view is recognizably the SAME product.
- **Restyle what they bring** — if the user has real photos that don't match the
  direction, re-grade them via image-to-image with the boards as the grade
  reference instead of discarding them.
- **Diagrams as images** — process flows, "how it works" panels composed as
  art-directed images in the brand language, not box-and-arrow divs.
- **Micro-animation sequences** — short generated clips (4 s) -> frame strips for
  hover/scroll micro-moments on signature components (the same pipeline as the hero
  scrub, smaller).

There is no standalone audio generation. If the brief wants a brand sound, the user
supplies the file (behind an explicit user-triggered toggle, never autoplay); the
only generated audio comes attached to a video clip.

Pick by fit, not by count: 3 ladder items executed coherently beat 8 scattered
ones. Everything joins the same coherence check as the core kit, and every
generated deliverable gets listed in the final report so the user knows what brand
property they now own.

## Rules

- **Approve once, then run.** The itemized list goes to the user right after the
  boards are chosen; once approved, run independent items concurrently in the
  background and build while they render. Nothing outside the list runs.
- **Coherence check — ONE batched pass, maximum.** When the kit lands, look at the
  assets TOGETHER in one pass (or hand the user the URLs when the result host is
  blocked) — never one look per asset. The storyboard and the scroll-scrub film are
  EXEMPT: you authored their prompts and the user reviews the storyboard. Any piece
  whose grade/palette fights the boards: propose a re-generation with the hexes
  named harder and ask before running it. **Off-grade video budget: ONE re-roll.**
  If the re-roll drifts scene/composition, keep the better take and color-grade it
  toward the palette in post with ffmpeg (`eq`/`colorbalance`/`curves`) — a graded
  first take beats a re-roll lottery; regenerate the poster from the graded frame 1
  so first paint matches playback.
- **Failures:** if a generation fails twice, restructure the prompt (ask before the
  next attempt) — never silently fall back to stock/picsum/CSS-only. If an asset is
  genuinely unavailable, say so in the final report. Known failure mode:
  **false-positive `nsfw` flags on innocuous product prompts** — the fix is removing
  mood/atmosphere words ("seamless loop feel", "ambient", "intimate") and
  re-describing the shot as a plain product film/photo.
- **Rejects live in `site/refs/`, not the assets folder.** Multi-candidate
  generations (e.g. the 2 hero candidates) leave exactly one winner in the assets
  folder; unpicked candidates and intermediates stay in `refs/` so the "everything
  shipped is referenced" gate stays clean.
- **Everything referenced.** Every downloaded asset must be used by a
  route/component/page (gate-checked). Unused generations are wasted credits;
  missing references are broken slots.
- **Durable copies only.** Result and upload URLs expire; the page references files
  saved in the assets folder, never those URLs.
- Monochrome direction -> force grayscale in the prompt AND on export.
- People imagery: locale-appropriate, believable, never watermarked stock faces;
  testimonial faces are generated.
