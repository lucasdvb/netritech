---
name: kie-product-photoshoot
description: |
  Generate brand-quality product images with a local product-photoshoot prompt
  generator on GPT Image 2.5 Flare via KIE AI. Entry point for professional
  brand/product visuals.
  Use when: "product photo", "studio shot", "lifestyle image", "Pinterest pin",
  "hero/banner", "carousel", "ad creative", "Meta ads", "virtual try-on",
  "model wearing", "person holding product", "closeup with hands",
  "levitating/floating/splash product", "CGI/surreal product", "restyle",
  "seasonal/aesthetic variation", or any product, brand, or paid-social creative.
  Modes: product_shot, lifestyle_scene, closeup_product_with_person,
  moodboard_pin, hero_banner, social_carousel, ad_creative_pack,
  virtual_model_tryout, conceptual_product, restyle. The prompt is assembled from
  the skill's references (never freehanded).
  NOT for: no-product text-to-image (use kie-generate), branded avatar/UGC video
  (use kie-generate), marketplace listing cards (use kie-marketplace-cards).
argument-hint: "[--mode <mode>] [--count N] [prompt]"
allowed-tools: Bash
---

# Product Photoshoot

Brand-image generation in two local steps: assemble a mode-specific prompt from `references/`, then render it with GPT Image 2.5 Flare (KIE AI) through `scripts/kie_image.py`. The product photo is passed as a reference image (`-i`) so the product stays faithful.

Scripts (run from repo root): `scripts/kie_image.py`, `scripts/kie_upload.py`. The key comes from `KIE_AI_API_KEY` or `.mcp.json`.

When the work is about SPM, read `docs/spm-brand-brief.md` first. SPM palette: Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0.

## Permission (generation costs credits)

Before running `scripts/kie_image.py` (or uploading a file with `scripts/kie_upload.py`), show the user: the final prompt (full text), the model (GPT Image 2.5 Flare, text-to-image or image-to-image), aspect ratio, resolution, number of images, and which local files will be uploaded. Wait for an explicit yes. A yes covers only what was listed. Never batch variants or retry a failed/poor result without asking; propose the fix and ask first.

## UX Rules

1. Be concise. Detect the user's language and respond in it. Mode names and script flags stay English.
2. Ask at most 4 short questions before proposing the generation. Use labeled options, never open-ended.
3. Skip questions whose answer is obvious from context (uploaded image, prior turn, brand memory, SPM brief).
4. Never freehand the image prompt: assemble it from `references/prompt-assembly.md` and the mode's template in `references/mode-templates.md`.
5. Show the assembled prompt at the permission step; after generation, deliver the URLs.

## Modes

| Mode | When user wants… |
|---|---|
| `product_shot` | Product on neutral / studio / catalog background |
| `lifestyle_scene` | Product in real-world environment, hands, action, atmosphere |
| `closeup_product_with_person` | Tight crop with hands / partial face — beauty application, holding, demonstrating |
| `moodboard_pin` | Vertical 2:3 Pinterest-native aesthetic, moodboard feel |
| `hero_banner` | Wide-format website / email / campaign header |
| `social_carousel` | 3–10 connected slides for IG / LinkedIn / Facebook |
| `ad_creative_pack` | Coordinated pack of static ad variants for Meta / TikTok / Pinterest / Google Ads |
| `virtual_model_tryout` | Product worn or used by an AI-rendered model |
| `conceptual_product` | Surreal / CGI-style / levitating / splash / sculptural product |
| `restyle` | Transform an existing image's aesthetic, mood, or seasonal context |

## Mode selection

Pick by intent, not surface keyword. When two modes could apply, prefer the more specific one.

- product + neutral / clean / white / studio / catalog / Shopify → `product_shot`
- product + scene / in use / kitchen / outdoor / cafe / gym → `lifestyle_scene`
- hands holding / face with product / beauty application / demonstrating → `closeup_product_with_person`
- Pinterest, pin, vertical pin → `moodboard_pin`
- hero, banner, website header, landing page, email header, wide format → `hero_banner`
- carousel, slide post, multi-slide, swipeable → `social_carousel`
- ads, ad pack, paid social, Meta / TikTok / Pinterest ads → `ad_creative_pack`
- model wearing, virtual try-on, on body, fashion shoot, lookbook → `virtual_model_tryout`
- levitating, floating, splash, frozen motion, surreal, CGI, sculptural → `conceptual_product`
- modify EXISTING image's aesthetic, mood, season — without changing subject → `restyle`

Tie-breakers:
- "Pinterest pin of my product on a kitchen counter" → `moodboard_pin` (Pinterest is the platform)
- "Hero banner showing my product in use" → `hero_banner` (banner format wins)
- "Carousel of my product in different scenes" → `social_carousel` (multi-slide wins)
- "Closeup of person applying my serum" → `closeup_product_with_person` (specific genre wins)

## Pre-generation interview

Ask 3–4 short questions before proposing the generation. Always labeled options, never open-ended. Skip a question whose answer is obvious from context.

### Type A — uploaded a product photo, "make me images / photoshoots"

1. How many? `[1 / 3 / 5]`
2. What style/mood? `[Clean studio / Lifestyle / Conceptual / With a model / Other]`
3. Where will you use them? `[Shopify / Instagram / Pinterest / Paid ads / Website hero]`
4. Brand colors to match? (skip if obvious)

### Type B — uploaded a product photo, named a use case

E.g. "make ads for my product", "make a Pinterest pin", "make a hero banner". Mode is obvious. Ask only the gaps:

1. How many? (if multi-output mode)
2. What's the offer / mood / hook?
3. Anything in particular to emphasize?

### Type C — text only, no product photo

1. Can you upload a product photo? (preferred — much higher fidelity)
2. If not, describe the product — category, packaging, color, distinctive features.
3. What style? (same options as Type A)
4. Where will you use it?

### Type D — uploaded existing image, "redo / change vibe / different version"

→ `restyle`

1. What aesthetic? `[Clean girl / Cottagecore / Quiet luxury / Dark academia / Y2K / Other]`
2. Seasonal context? `[Christmas / Valentine's / Halloween / Black Friday / None]`
3. What to preserve, what to change? (only if ambiguous)

### Type E — model wearing a product (fashion, accessories)

→ `virtual_model_tryout`

1. Model archetype? (suggest 2–3 based on brand audience)
2. Environment? `[Studio clean / Outdoor natural / Street style / Editorial / Home cozy]`
3. Framing? `[Full body / Three-quarter / Waist up / Closeup on product area]`

### Type F — vague request, unclear subject

E.g. "make me something cool for my brand".

1. What product or topic?
2. Goal? `[Sell on a marketplace / Build awareness / Run paid ads / Update website]`
3. Upload a reference image?

After answers → return to the relevant Type A–E.

## Generation

1. **Assemble the prompt.** Read `references/prompt-assembly.md` (slots, product-lock clause, vocabulary banks, variant and multi-slide rules), then the mode's section in `references/mode-templates.md`. Fill every slot from the interview answers and the product photo; write one prompt per output image.
2. **Permission gate.** Show prompt(s) + model + aspect + resolution + count (see Permission above). Wait for yes.
3. **Uploads.** Reference inputs must be public URLs. For each local file, after the yes: `python3 scripts/kie_upload.py path/to/product.png` prints a public URL (temporary, ~3 days). URLs the user already gave are used as-is.
4. **Render, one call per image.**

```bash
# with the product photo (image-to-image; up to 16 references, product photo first)
python3 scripts/kie_image.py "<assembled prompt>" -a 4:5 -r 1K -o out/lifestyle-1.png -i <product photo url> [-i <extra ref url> ...]

# no product photo (text-to-image; product described in the prompt)
python3 scripts/kie_image.py "<assembled prompt>" -a 4:5 -r 1K -o out/lifestyle-1.png
```

The script creates the task, waits, prints `url ...` and saves the `-o` file when the result host is reachable. If the download is blocked by the sandbox network policy, give the user the URL.

## Image inputs

Every input is a public URL passed with `-i`, repeat the flag for multiple references. Order matters and the prompt must say what each one is (`image 1 = product`, `image 2 = model / style reference`). For local files use `scripts/kie_upload.py` first. There is no mask or seed parameter: a "keep X, change Y" edit is an image-to-image call with the source as `-i` and an edit-style prompt.

## Multi-variant

There is no `--count` on the script: `--count 3` means three calls, each with its own prompt. `references/prompt-assembly.md` (Variants) defines the axes to vary (preset, lighting, angle, palette) so the outputs are distinct rather than paraphrases. Ask for approval of the whole batch once, listing every prompt.

For `social_carousel` and `ad_creative_pack`, count = number of slides / variants in the pack. Lock the visual system by pasting the same SYSTEM block into every slide prompt (see `references/prompt-assembly.md`, Multi-slide systems); pass the first approved slide as an extra `-i` on the following slides to keep the look consistent.

## Aspect ratio

Defaults per mode are in `references/mode-templates.md`. Override only if the user explicitly asks. Common values for `-a`: `1:1`, `4:5`, `5:4`, `3:4`, `4:3`, `2:3`, `3:2`, `9:16`, `16:9`, `21:9`, `auto`.

## Resolution

Default `-r 1K`. Go to `2K` / `4K` only when the user asks (print, large banner) and say it in the permission step.

## Review

Look at each result (host vision when available) against the QA list in `references/prompt-assembly.md`: product fidelity, label text, hands/anatomy, stray text, composition. If something is off, propose the specific fix line and ask before regenerating.

## Delivering results

Print the image URLs as a short bulleted list with one label each. No JSON, no task ids.

```
3 lifestyle shots ready:
- https://tempfile.aiquickdraw.com/.../a.png
- https://tempfile.aiquickdraw.com/.../b.png
- https://tempfile.aiquickdraw.com/.../c.png
```

## What this skill does NOT do

- Does not freehand prompts: assembly always goes through the references.
- Does not use a different image model: always GPT Image 2.5 Flare.
- Does not produce video or avatar/UGC content (use kie-generate).
- Does not do raw text-to-image without a product or brand context (use kie-generate).

## Common mistakes to avoid

- Asking more than 4 interview questions in a single message.
- Picking the wrong mode (e.g. `product_shot` when the user wants a Pinterest pin).
- Running the script before the user approved the prompt, or re-running after a bad result without asking.
- Sending the product photo without labelling it in the prompt (`image 1 = product`), or without the product-lock clause.
- Passing a local path to `-i` (must be a public URL: upload first).
- Using a mode value not in the table above.

## Reference files

- `references/prompt-assembly.md` — prompt slots, product-lock clause, vocabulary banks, variants, multi-slide systems, text rules, QA fixes.
- `references/mode-templates.md` — the ten mode templates with default aspects, rules and worked examples.
