---
name: kie-marketplace-cards
description: |
  Generate marketplace product image cards with GPT Image 2.5 Flare via KIE AI:
  compliant main image, secondary product images, and A+ style content modules.
  Use when the user asks for marketplace listing images, product detail cards,
  secondary product images, product infographics, lifestyle listing shots,
  A+ style content, marketplace image sets, or sales-ready product visuals.
  Compliance rules and prompt templates live in this skill's references and are
  assembled locally.
  NOT for generic brand product photography without marketplace/listing context
  (use kie-product-photoshoot) or video generation and UGC ads (use
  kie-generate).
argument-hint: "[--scope main|product-images|aplus|full-set] [prompt]"
allowed-tools: Bash
---

# Marketplace Cards

Create marketplace-ready product visuals: pick the scope, assemble each card's prompt from the local references, then render each card with `scripts/kie_image.py` (GPT Image 2.5 Flare, image-to-image with the product photo as reference).

Scripts (run from repo root): `scripts/kie_image.py`, `scripts/kie_upload.py`. The key comes from `KIE_AI_API_KEY` or `.mcp.json`.

## Permission (generation costs credits)

Before running `scripts/kie_image.py` (or uploading a file with `scripts/kie_upload.py`), show the user: the list of cards with their final prompts, model (GPT Image 2.5 Flare, image-to-image), aspect ratio and resolution of each, the total number of images, and which local files will be uploaded. Wait for an explicit yes. A yes covers only what was listed. Never batch extra variants or retries without asking; when a card fails the checks, propose the fix and ask before regenerating. For bundles, generate the main image first, get approval, then the rest.

## UX Rules

1. Respond in the user's language.
2. Ask at most one concise question before proposing the plan, and only for what is missing (marketplace, product facts, claims). The permission step is the confirmation.
3. Prefer a product image. If the user provides only text or a URL, proceed only when the product details are clear.
4. Assemble prompts from `references/card-templates.md` and `references/marketplace-rules.md`; do not freehand them.
5. Final answer: the ready image URLs with short labels.

## Intake

Collect what the brief does not already answer:

| Field | Meaning |
|---|---|
| `prompt` | Short product and listing intent |
| `marketplace` | Amazon / Walmart / eBay / Etsy / Shopify-DTC / other (default: strictest rules, see rules file) |
| `category` | e.g. beverage, skincare, apparel |
| `product_context` | Facts the cards may state: features, dimensions, materials, ingredients, what's in the box, usage steps |
| `brand_context` | Palette, tone, logo, font feel |
| `visual_style` | Clean clinical / warm lifestyle / premium dark / playful |
| `language` | Language of any on-image text |

Only facts the user gave (or that are visible on the product photo) may appear as claims. See "Claims" in `references/marketplace-rules.md`.

## Scope Selection

Use a scope when the user asks for a common bundle:

| Scope | Creates |
|---|---|
| `main` | 1 marketplace main image |
| `product-images` | main image + 5 secondary images |
| `aplus` | main image + 7 A+ modules |
| `full-set` | main image + 5 secondary images + 7 A+ modules |

For custom subsets, pick from these assets:

- `main_image`
- `infographic`
- `multi_angle`
- `detail_shot`
- `lifestyle`
- `whats_in_box`
- `aplus_hero_banner`
- `aplus_pain_points`
- `aplus_features`
- `aplus_ingredients`
- `aplus_efficacy`
- `aplus_how_to_use`
- `aplus_endorsement`

`product-images` = `infographic`, `multi_angle`, `detail_shot`, `lifestyle`, `whats_in_box`. `aplus` = the seven `aplus_*` assets. Each asset's aspect, purpose and prompt template is in `references/card-templates.md`.

## Workflow

1. **Plan.** From the intake and scope, list the cards (asset, aspect, on-image copy). Read `references/marketplace-rules.md` for the marketplace's main-image rules and claims policy, and `references/card-templates.md` for each asset's template.
2. **Assemble** one prompt per card. For a set, define the VISUAL SYSTEM block (palette, fonts, icon style, product treatment) once and paste it in every card.
3. **Permission gate** (above).
4. **Uploads.** Reference inputs must be public URLs. After the yes, for each local file: `python3 scripts/kie_upload.py path/to/product.png` prints a public URL (temporary, ~3 days).
5. **Main image first.**

```bash
python3 scripts/kie_image.py "<main image prompt>" -a 1:1 -r 1K -o out/main.png -i <product photo url> [-i <extra angle url> ...]
```

6. **Secondary and A+ cards.** Pass the approved main image URL (printed as `url ...` by the previous call) first, then the original product photo(s), so the product stays identical across cards:

```bash
python3 scripts/kie_image.py "<card prompt>" -a 1:1 -r 1K -o out/infographic.png -i <main image url> -i <product photo url>
```

Use `-a 21:9` or `-a 16:9` for A+ banners and modules (see the card templates), then crop to the marketplace pixel size with `ffmpeg` if needed. If the result host is blocked by the sandbox network policy, give the user the URLs.

7. **Check** each card against the compliance checklist in `references/marketplace-rules.md`. Propose the fix for any failure and ask before regenerating.

## Delivery

Print URLs with labels:

```text
Marketplace cards ready:
- Main image: https://...
- Infographic: https://...
- Lifestyle: https://...
```

Mention which marketplace rules the main image was built for and any crop/resize still to do. Avoid JSON, task ids, or prompt text unless the user asks.

## Reference files

- `references/marketplace-rules.md` — main-image and secondary-image rules per marketplace, claims policy, compliance checklist, sizes.
- `references/card-templates.md` — prompt templates for the 13 assets, visual system block, copy limits, worked examples.
