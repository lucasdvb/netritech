---
name: kie-youtube-thumbnail
description: |
  Create high-click-through YouTube thumbnails and vertical video covers with GPT Image 2.5 Flare via KIE AI. Builds a truthful information-gap concept, preserves up to three referenced identities, supports logos and controlled variants, renders the main image with text-to-image or reference-guided image-to-image, and applies focused edits with image-to-image. Use when: "make a YouTube thumbnail", "thumbnail for this video", "MrBeast-style cover", "Shorts cover", or "Instagram video cover". Chain after any video workflow once its truthful topic and visual direction are known. NOT for producing the video itself (use kie-generate), product catalog photos (use kie-product-photoshoot), or marketplace cards (use kie-marketplace-cards).
argument-hint: "[video-topic-or-title] [--image <face-or-logo>] [--ratio 16:9|9:16|4:5]"
allowed-tools: Bash
---

# KIE YouTube Thumbnail

Create a clean thumbnail concept, generate each variant with `scripts/kie_image.py`, inspect it, and make only requested surgical edits.

Scripts (run from repo root): `scripts/kie_image.py`, `scripts/kie_upload.py`. The key comes from `KIE_AI_API_KEY` or `.mcp.json`. Model: GPT Image 2.5 Flare, `-r 1K` by default (higher only when the user asks).

When the thumbnail is for SPM, read `docs/spm-brand-brief.md` first. SPM palette: Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0.

## Permission (generation costs credits)

Before running `scripts/kie_image.py` (or uploading a file with `scripts/kie_upload.py`), show the user: the final prompt (full text), the model (GPT Image 2.5 Flare, text-to-image or image-to-image), aspect ratio, resolution, the number of images, and which local files will be uploaded. Wait for an explicit yes. A yes covers only what was listed. Never generate variants, retries or tweaks without approval. When the post-render gate fails, propose the fix and ask before regenerating.

## UX rules

1. Match the user's language. Keep script/model mechanics out of normal chat, except at the permission step.
2. Do not ask for facts already present in the brief. Ask one compact question only when a missing choice changes the result.
3. Never invent claims, outcomes, products, people, screenshots, or statistics that are not true of the video.
4. Do not print raw JSON or task ids to the user. Deliver the image URL and a short variant label.
5. A style-reference thumbnail is for visual analysis only. Never pass it with `-i`; copying its identity or exact composition is forbidden.
6. Every concept, emotion, or camera take gets its own prompt and its own `kie_image.py` call.

## Intake gates

Collect only what the brief does not answer:

- The video's topic/title and the truthful promise the thumbnail may imply.
- Exact scene requirements, if any.
- Who appears: 0–3 people. If a concept needs a person and no face photo was provided, ask whether to use the user, another provided person, or a generic generated character. Never choose silently.
- Optional style-reference thumbnail. Analyze it with host vision for energy, framing, split layout, palette, and emotion; do not send it to the model.
- Optional logo and whether it stays flat or becomes a 3D object.
- Optional headline, 2–4 words. Default delivery is a clean image with no text. Use a deterministic overlay when the user requests an overlay; bake text into the generated image only when explicitly requested.
- Ratio: `16:9` for YouTube by default, `9:16` for Shorts, or `4:5` for Instagram.
- One final concept or a variant set. If unspecified and alternatives would materially help, offer a set of about four. Hard cap: 16 total generations, each one approved.

If the user gives an emotion count without names, use this ladder: shock, hype, rage, awe, laugh, fear, smug, charisma, confusion, determination, disgust.

## Concept gate

Read `references/thumbnail-frameworks.md`. Brainstorm at least five truthful concepts internally, across multiple frameworks, then select the strongest information gap with one focal subject and minimal clutter. Combine frameworks only when the result still reads in under one second at roughly 120px wide.

When a reference thumbnail exists, extract this structure before prompting:

```text
brief, generic subject pose/action, elements, location, composition, background,
split (true/false), split_count, person_count, emotion, emotion_detail
```

The reference supplies art direction, never a specific identity. User instructions override it field by field.

## Reference order

Face and logo inputs are public URLs. For local files, after the user's yes, run `python3 scripts/kie_upload.py path/to/face-1.png` to get a URL (temporary, ~3 days). Pass face photos first in character order, then the logo, each with `-i` (up to 16 references; this workflow uses at most four). When two or more references are attached, the prompt's first line must be a manifest such as:

```text
IMAGE REFERENCES: image 1 = CHARACTER 1 face reference; image 2 = brand logo.
```

A previously generated result URL (printed as `url ...`) is public and can be passed as `-i` for edits or as the 3D logo reference.

## Prompt contract

Assemble every main-render prompt in this order:

1. **Frame:** `Bold, punchy YouTube-thumbnail composite — poster-grade, photoreal and high-impact, NOT a muted cinematic movie still, <ratio>, single unified frame — no split-screen, no diagonal divide, everything blends smoothly and organically across the same continuous shot.` For `9:16`, add `faces in the upper two-thirds`. A requested graphical representation replaces photoreal language with a clean diagram/graphic brief.
2. **Scene brief:** depict the user's exact content.
3. **Text:** default `No text, no readable UI labels, no watermark.` For explicit baked headline: `TEXT: bold thumbnail headline text baked into the image, reading exactly "<TEXT>" — massive, ultra-legible sans-serif with a clean outline/glow treatment, placed where it never covers the subject's face. No other text, no watermark.` For an explicit baked UI element (generic chat bubble, review card, `DAY N` badge, news lower-third): `BAKED UI: a generic <element> reading exactly "<short truthful text>", no real platform or network branding. No other text.`
4. **Subjects:** large, foreground-dominant, chest-up or medium-close, filling about 40–60% of the frame. End with `All faces crisply sharp as the anchors of the shot.`
5. **Key elements:** only signature props/effects that explain the information gap. A featured product keeps its own packaging text exactly as in its reference (its label is exempt from the no-text rule).
6. **Logo:** preserve exact shapes, colors, proportions, and letterforms; keep it away from faces.
7. **Location:** place, time, weather, and atmosphere when relevant.
8. **Composition:** one power-third hero, clear scale hierarchy, depth, and strong subject/background separation.
9. **Background:** vivid high-contrast color field or environment, soft vignette and edge falloff; do not divide it unless a split layout was explicitly requested.
10. **Lighting on people:** `signature YouTube thumbnail lighting rig — strong key light sculpting the face, soft dreamy fill lifting shadows, and defined back light plus hair light tracing a clean bright rim around hair, shoulders and silhouette.` Only the rim may use a colored accent.
11. **Grade:** vivid, bright, glossy, poster-punchy, deep blacks, crisp highlights, rich saturated colors, cohesive as one image. Restrain it only for an explicit calm/premium/muted brief.

For each photo-referenced person, include:

```text
CHARACTER N: the person from attached face reference #K — IDENTITY LOCK: reproduce
this exact person with a photographic identity match — same bone structure, eye shape,
nose, lips, jawline, skin tone, hairline and hair texture. Do not beautify, average,
or restyle the face. Expression: <emotion phrase>.
```

### Split layouts

Use a split only when the user asks for `split`, `before/after`, `versus`, `side by side`, or the analyzed reference is split. A topical phrase such as `X vs Y` does not itself require a split. Replace the normal frame block with a clear halves/panels contract and keep all labels out unless short, truthful baked UI was explicitly requested.

## Optional 3D logo

First create a 1:1 logo render (permission step applies), then use its result URL as the last `-i` on every thumbnail call:

```bash
python3 scripts/kie_image.py "Transform the attached 2D logo into a premium 3D logo render: extrude the exact logo shapes into glossy dimensional volumes; preserve every letterform, proportion and brand color; soft studio reflections, subtle bevels, crisp edges, clean dark neutral background, soft contact shadow, centered, generous margins, no extra text, no watermark." \
  -a 1:1 -r 1K -o logo-3d.png -i <logo url>
```

## Main render

Write the final prompt to a temporary text file (multiline blocks and punctuation stay intact), then pass it to the script:

```bash
python3 scripts/kie_image.py "$(cat thumbnail-prompt.txt)" \
  -a 16:9 -r 1K -o thumbnail-1.png \
  -i <face-1 url> -i <logo url>
```

With references the script runs image-to-image; omit all `-i` flags when there are none (text-to-image). For a variant set, make one call per distinct prompt. Keep the same references and settings; vary only the selected concept, expression, or camera-take line.

The script prints `url ...` and saves `-o` when the result host is reachable. Keep the URL: it is what gets delivered and the source for later edits. If the download is blocked by the sandbox network policy, give the user the URL.

## Post-render gate

Inspect every result with host vision when available:

- Referenced identities visibly match.
- No stray text or watermark exists unless baked text was ordered.
- Explicit baked text matches character-for-character.
- The face/emotion and hero element remain readable at about 120px wide.
- The concept truthfully matches the video promise.

On a failure, name the problem, propose a concrete prompt fix, and ask before regenerating. If visual inspection is unavailable, do not claim it passed; deliver the result for user review. Present every passing variant and let the user pick before making optional tweaks.

## Surgical tweaks

Tweaks are image-to-image edits with the single image model. Pass the picked result URL as `image 1`; there is no mask, so keep the edit prompt narrowly scoped and state that everything else stays unchanged. When a person is in the frame, add their face reference as `image 2` to re-anchor identity.

```bash
python3 scripts/kie_image.py "IMAGE REFERENCES: image 1 = the thumbnail to edit; image 2 = CHARACTER 1 face reference. Change ONLY the person's facial expression to: <phrase>. Keep identity (match image 2), face structure, hair, pose, body, clothing, logo, background, lighting and composition EXACTLY unchanged, pixel-faithful. Keep the YouTube thumbnail lighting rig intact." \
  -a 16:9 -r 1K -o thumbnail-1-edit.png -i <picked thumbnail url> -i <face-1 url>
```

Use the same `-a` as the picked image. Each accepted edit becomes the source for the next tweak. Because the whole image is re-rendered, small drift is possible: compare against the pick, and if something changed that should not have, propose a stricter "unchanged" list and ask before retrying.

Allowed tweak scopes: expression only, background replacement only, background recolor only, or rim-light recolor only. Never silently regenerate the full composition for a surgical request.

## Text overlay

Keep the generated image text-free by default. When a headline overlay is requested, read `references/text-overlay-bake.md` and use one of its five presets: Beast, Fire, Neon Lime, Clean Glass, or Marker. The overlay is local work (no generation credits). It requires an environment capable of rendering HTML canvas; if unavailable, offer either the clean image or an explicitly approved baked-text regeneration (a paid call, with the text contract in the prompt). Never pretend an HTML preview is a flattened PNG.

## Delivery

Return the passing result URLs with short semantic labels such as `shock / close-up` or `product / size contrast`. Mention the selected ratio and whether the deliverable is clean, overlay-ready, or text-baked. Do not expose internal prompts, task ids, or retry mechanics unless the user asks.

## Reference files

- `references/thumbnail-frameworks.md` — 16 concept frameworks, information-gap rule, truthfulness law.
- `references/text-overlay-bake.md` — five deterministic text-overlay styles and canvas-bake recipe.
