---
name: kie-generate
description: |
  Generate images and videos via KIE AI. Two models only:
  GPT Image 2.5 Flare for every image (design, text, photo,
  illustration, edits) and Gemini Omni Flash 1.1 for every
  video (1080p, 4-10s clips, native audio). Ads, UGC, avatar,
  product, DTC and brand-kit work run as local prompt recipes.
  Use when: "generate an image", "make a video", "animate
  this photo", "image-to-video", "edit/stylize/remix this
  image", "reframe this video", "edit this video", "create
  an ad", "make a UGC video", "unboxing", "presenter video",
  "product ad", "DTC ad", or "import product from URL".
  Supports generic generation, local workflows and the
  marketing recipes.
  NOT for: brand systems/brandbooks (use kie-brandkit),
  product photoshoots (use kie-product-photoshoot),
  marketplace cards (use kie-marketplace-cards), YouTube
  thumbnails (use kie-youtube-thumbnail), explainers (use
  kie-video-explainer), websites/games (use kie-websites),
  or 3D, TTS, standalone music/SFX, face training.
argument-hint: "[prompt-or-brief] [--image|--video] [--ref <path-or-url>]"
allowed-tools: Bash
---

# KIE Generate

Generate images and videos with KIE AI through three local scripts. Covers generic image/video generation, local video workflows (long video, reframe, edit) and the marketing recipes (UGC, avatar/presenter, product, DTC ads, brand kits, ad references, hooks/settings).

Scripts (run from the repo root): `scripts/kie_image.py`, `scripts/kie_video.py`, `scripts/kie_upload.py`. The API key comes from `KIE_AI_API_KEY` or `.mcp.json`. Do not use the kie-ai MCP tools unless the user asks.

When the work is about SPM (copy, design, images, strategy), read `docs/spm-brand-brief.md` first. SPM palette: Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0.

## Permission (hard rule)

Every generation costs credits. Before running `kie_image.py`, `kie_video.py` or `kie_upload.py`, show the user:

- the final prompt (verbatim)
- the model (GPT Image 2.5 Flare or Gemini Omni Flash 1.1), aspect ratio, resolution, duration (video) and number of outputs
- the reference images/videos that will be sent (uploading also needs a yes)

Then wait for an explicit yes. Never batch-generate variants, never retry or regenerate automatically after a failure or a weak result: propose the fix and ask first. Local-only work (ffmpeg, PIL, writing prompt cards) needs no permission.

## UX Rules

1. Be concise. No raw task ids, no JSON dumps in chat. Print the result URL (and the saved file path) for generated assets.
2. No internal jargon. Don't narrate "polling", "createTask".
3. Detect the user's language from the first message and reply in it. Technical args (`-a 16:9`) stay English.
4. Don't batch-ask. Pick a sane default and ask one thing at a time, only if genuinely missing.
5. Don't pre-estimate cost or push cheaper settings unless the user asks. Default to 1K images and 1080p video; go higher only when asked.
6. Both scripts create the task and poll until it finishes, then print `url ...` and save `-o`. There is no wait/get step and no flag beyond those listed below.
7. Result files are served from `tempfile.aiquickdraw.com`, which the sandbox may block. If the download fails, give the user the URL.

## Workflow: generic generation

1. **Route.**
   - Complete brand identity, logo system, brandbook, packaging/signage suite -> `kie-brandkit`.
   - Product photoshoot (pin, lifestyle, hero banner, ad pack, try-on) -> `kie-product-photoshoot`.
   - Marketplace listing cards -> `kie-marketplace-cards`. YouTube thumbnail / cover -> `kie-youtube-thumbnail`. Narrated explainer -> `kie-video-explainer`. Website, app, game -> `kie-websites`.
   - Ads, UGC, presenter, unboxing, product/DTC ads -> the marketing recipes below.
   - Any other still (design, UI, banner, typography, photo, illustration, character, logo-like graphic, edit of a supplied image) -> **GPT Image 2.5 Flare**.
   - Any other motion (clip, image-to-video, extend, edit a clip) -> **Gemini Omni Flash 1.1**.
   - Not possible with these models: 3D/GLB, standalone music/sound effects/voice-over, voice cloning, face training, upscaling, automated video scoring. Say so in one line and offer the closest local route (audio direction inside the video prompt, a still instead of 3D, a written hook/retention critique instead of scoring).
2. **Write the prompt** with `references/prompt-engineering.md`. Video audio (dialogue, effects, music mood) is written into the prompt.
3. **Prepare inputs.** Reference/edit inputs must be public URLs. For local files, after the user's yes run `python3 scripts/kie_upload.py path/to/file.png` (prints a temporary public URL, ~3 days). See `references/media-inputs.md`.
4. **Confirm** (Permission block above), then run one command.
5. **Deliver.** Send the result URL plus a one-line summary (model, aspect, duration for video). Review the result against the brief; if it misses, describe the miss and the proposed prompt change, and ask before regenerating.

## Commands

```bash
# Image: text-to-image
python3 scripts/kie_image.py "prompt" -a 21:9 -r 1K -o out.png
# Image: image-to-image / reference-guided / edit (up to 16 public URLs)
python3 scripts/kie_image.py "prompt" -a 1:1 -r 1K -o out.png -i <public url> [-i <public url> ...]
# Transparent background
python3 scripts/kie_image.py "prompt" -a 1:1 --background transparent -o out.png

# Video: text-to-video
python3 scripts/kie_video.py "prompt" -a 16:9 -r 1080p -d 8 -o out.mp4
# Video: reference images (up to 7) for subject / product / style
python3 scripts/kie_video.py "prompt" -a 9:16 -d 8 -i <image url> -o out.mp4
# Video: keyframes
python3 scripts/kie_video.py "prompt" --first-frame <url> [--last-frame <url>] -o out.mp4
# Video: extend or edit an existing clip (1 video max, counts as 2 image slots)
python3 scripts/kie_video.py "prompt" --video-url <url> [--video-start S --video-end S] -o out.mp4
```

| Setting | Image (`kie_image.py`) | Video (`kie_video.py`) |
|---|---|---|
| Aspect `-a` | `1:1`, `4:5`, `3:4`, `2:3`, `9:16`, `16:9`, `21:9`, `auto`, ... | `16:9` or `9:16` only |
| Resolution `-r` | `1K` (default), `2K`, `4K` | `1080p` (default), `360p`, `720p`, `4k` |
| Length | n/a | `-d` 4, 6, 8 or 10 seconds |
| References `-i` | up to 16 | up to 7 |
| Other | `--background` (opaque, transparent or auto), `-m` model override | `--first-frame`, `--last-frame`, `--video-url`, `--video-start`, `--video-end`, `--seed`, `--audio-id` (max 3), `--character-id` (max 3) |

No mask, inpaint or seed on images. Only use `--audio-id` / `--character-id` when the user supplies ids.

## Local post-processing (no permission needed)

Longer videos, other aspect ratios and continuity are handled locally with `ffmpeg` (and Pillow for stills). See `references/workflows.md`:

- long video = several clips joined with `ffmpeg` concat; continuity via the previous clip's last frame as `--first-frame`
- 1:1 / 4:5 / 21:9 video = generate 16:9 or 9:16, then crop
- reframe, draw-to-edit and clip editing recipes
- captions, logos and exact on-screen text are added in post rather than trusted to the model

## Marketing recipes

Ads, UGC, presenter videos, product videos, DTC images, brand kits and ad references run as local prompt recipes on the two models. There is no avatar library, product importer, hook catalog or ad-format catalog on the server side: the references below contain them as templates.

### Concepts (all kept as cards in the conversation, or as small files if the user wants them saved)

- **Presenter (avatar)**: a written description plus optional reference photo(s). Preset archetypes or a custom person from user photos. See `references/marketing-avatars.md`.
- **Product card**: title, description, key facts, 3-5 reference images. Built from a URL you read or from uploaded images. See `references/marketing-products.md`.
- **Hook**: the opening angle of an ad; **Setting**: the environment. Both are prompt blocks from `references/marketing-setup-items.md`.
- **Ad reference**: an inspiration video you break down into a shot card and rebuild. See `references/marketing-ad-references.md`.
- **Brand kit**: name, logo file, colors, fonts, tone, imagery rules, as a prompt prefix. See `references/marketing-brand-kits.md`.
- **Ad format**: the visual structure of a still ad (`headline`, `bullet-points`, `us-vs-them`, ...). See `references/marketing-dtc-ads.md`.

### UX rules (additional)

- One question per phase. Don't ask product + presenter + mode upfront.
- **Two ad approaches are mutually exclusive.** Either the user gives an ad reference video (reference-driven) or picks hook/setting blocks (composed-from-blocks), never both.
- **Ad reference source.** The only valid input is a local video file (or a clip generated earlier in this work). If the user gives a link, ask for the file.
- **DTC ad format is mandatory.** Always ask the user to pick one from the list in `references/marketing-dtc-ads.md`; no auto-default.
- Only attach what the user picks (presenter, product, brand kit, references). Only real people who consented; no real public figures.

### Workflow: quick ad video

1. **Get the product** (product card): from a URL you read (WebFetch if available, otherwise ask the user to paste the page text), or from uploaded images. Hooks work poorly without product context, so always have the card before choosing a hook.
2. **Pick a presenter if needed.** UGC modes may omit a specific presenter when the brief mentions a generic person; then write the presenter description into the prompt.
3. **Optionally pick hook and setting** (composed path) or an ad reference (reference path).
4. **Pick the mode** (default `ugc`): `ugc`, `ugc_how_to`, `ugc_unboxing`, `product_showcase`, `product_review`, `tv_spot`, `wild_card`, `ugc_virtual_try_on`, `virtual_try_on`. Hook/setting apply only to `ugc`, `ugc_how_to`, `ugc_unboxing`, `product_review`, `ugc_virtual_try_on`. See `references/marketing-modes.md`.
5. **Plan the clips.** One clip is 4-10s. A 15s ad is 10s + 6s, 30s is 3 x 10s; each clip is one `kie_video.py` call with the same presenter/product wording and the previous clip's last frame as `--first-frame`. Aspect is `9:16` for social, `16:9` for TV/web.
6. **Assemble the prompt** with the generator template in `references/marketing-modes.md`, show it (Permission block), and on a yes run:
   ```bash
   python3 scripts/kie_video.py "<assembled prompt>" -a 9:16 -r 1080p -d 10 \
     -i <product image url> -i <presenter image url> -o ad_clip1.mp4
   ```
7. **Join and finish locally** (`references/workflows.md`), add captions/logo in post, deliver the URL(s) or file plus a one-line summary (mode, total duration).

### Click-to-Ad shortcut (URL-driven)

When the user gives a product URL and wants a marketing video in one go: read the page, fill the product card, propose mode `ugc` at 9:16 with a hook and setting, show the assembled prompt and clip plan, and only then generate (Permission block).

### Workflow: marketing image

Same as above but on the image model, with an ad format and optional brand kit, using the DTC generator in `references/marketing-dtc-ads.md`:

```bash
python3 scripts/kie_image.py "<assembled prompt>" -a 1:1 -r 1K -o ad.png -i <product image url>
```

## Errors

- `KeyError` / file not found for the key -> set `KIE_AI_API_KEY` or add it to `.mcp.json`.
- `createTask failed: ...` -> read the message; usually credits, a bad parameter or an unreachable input URL. Explain and ask before retrying.
- `failed: <code> <msg>` -> the generation was rejected or failed (often content policy). Rephrase and ask before rerunning.
- `download failed` -> give the printed `url`.

See `references/troubleshooting.md` for more.

## Reference docs

Load on demand:

- `references/model-catalog.md` - the two models, limits, when to use which
- `references/workflows.md` - long video, reframe, draw-to-edit, extend, continuity (local ffmpeg recipes)
- `references/prompt-engineering.md` - writing prompts that work
- `references/media-inputs.md` - public URLs, uploads, reference roles and limits
- `references/troubleshooting.md` - common errors and fixes
- `references/marketing-avatars.md` - presenter archetypes and custom presenters
- `references/marketing-products.md` - product cards from a URL or images
- `references/marketing-setup-items.md` - hook and setting library
- `references/marketing-ad-references.md` - ad reference breakdown and rebuild
- `references/marketing-brand-kits.md` - brand kit cards and prompt prefix
- `references/marketing-dtc-ads.md` - DTC ad formats and the still-ad generator
- `references/marketing-modes.md` - every ad mode and the video ad prompt generator
