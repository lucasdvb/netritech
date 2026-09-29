# DTC Ads Engine

A flexible ad-image generator for DTC brands, run locally on the image model (GPT Image 2.5 Flare). It composes a prompt from a picked ad format, an optional brand kit, and optionally reference media, a presenter and a product, and produces a branded still.

## End-to-end flow

There is no fixed order, but **picking an ad format is mandatory**: no auto-default. Everything else (brand kit, presenter, product, media) is optional and only applied when the user provides it.

1. **Ask the user for an ad format.** Show the list below and let them pick by name. Don't auto-pick from the user's phrasing; the list is short and the choice is creative.
2. **Pick or create a brand kit (optional).** See `marketing-brand-kits.md`.
3. **Offer optional inputs.** A presenter (`marketing-avatars.md`), a product (`marketing-products.md`), reference media, if it suits the brief.
4. **Confirm the output settings**: aspect ratio, resolution (`1K` default, `2K`/`4K` on request) and number of variants. Each variant is a separate run and needs approval; don't silently default to several.
5. **Assemble the prompt** with the generator below, show it (Permission rule), then run:
   ```bash
   python3 scripts/kie_image.py "<assembled prompt>" -a 1:1 -r 1K -o ad.png \
     -i <product image url> -i <presenter image url> -i <logo url>
   ```
6. **Review** the result against the checklist; if it fails, propose the prompt change and ask before regenerating.

## Ad formats

| Format (`type`) | Structure | Text budget |
|---|---|---|
| `headline` | Hero image or product with one large headline and a small CTA | headline 3-8 words, CTA 2-3 words |
| `bullet-points` | Product center, 3-4 benefit callouts with icons/lines pointing to it | 3-4 x 2-4 words |
| `us-vs-them` | Split layout: our product vs generic alternative, check vs cross rows | 3-4 short rows each side |
| `testimonial` | Quote card with stars and name, product or portrait beside it | quote under 20 words |
| `before-after` | Two panels labeled Before / After with the product's effect | 2 labels + one line |
| `offer` | Promo: big offer figure, product, urgency line, CTA | offer 2-4 words, line under 8 |
| `feature-callout` | Annotated product close-up with 2-3 leader lines | 2-3 labels of 1-3 words |
| `social-proof` | Review screenshot style, rating and count, product | rating + 1 quote |
| `listicle` | "3 reasons ..." numbered list over a lifestyle image | title + 3 short lines |
| `lifestyle-hero` | Product in use, minimal or no text, logo only | none or logo |
| `founder-quote` | Portrait of the founder or team member with a quote | quote under 20 words |

Extra formats the user asks for are built the same way: structure + text budget.

## Generator template

```
{BRAND prefix from the kit, if any}
FORMAT: {aspect} {format name} ad for {product title}. {Structure line from the table}.
SUBJECT: {product card look line; presenter sentence if any}. Product exactly as in image {n}: same shape, colors, label, logo; do not redraw.
COMPOSITION: {layout: where product, text blocks, whitespace; rule of thirds; safe margins for crop}.
TEXT: headline "{exact words}" in {font style, weight, color, position}. {other text elements with exact words and positions}.
STYLE: {photography/illustration style, light, palette hexes, background}.
RULES: render only the text above, spelled exactly; no extra words, no watermarks; clean edges.
```

Rules:

1. Write the copy first (headline, bullets, CTA) within the format's text budget; the user approves copy before generation for anything beyond a headline.
2. Put every text string in quotes with position and style; the image model renders it well when short.
3. Colors as hex with roles; fonts as style words (geometric sans, editorial serif).
4. Pass product/logo images with "exactly as in image N". If the logo must be exact, leave a clean area and composite it locally with Pillow.
5. Aspect: `1:1` and `4:5` feed, `9:16` stories, `16:9` banner/web, `21:9` wide banner.

## Examples

**headline, 1:1, SPM**
```
BRAND: SPM. Palette: background Ink navy #0D141F, accent Teal #22808A, text Light grey #DADDE0. Type: modern geometric sans.
FORMAT: 1:1 headline ad for SPM dedicated teams. Large headline, small CTA, calm premium feel.
SUBJECT: two colleagues in a bright office reviewing a screen, warm natural light, faces relaxed.
COMPOSITION: photo fills the right two thirds, dark navy panel on the left with text, generous margins.
TEXT: headline "Une équipe qui reste." in bold sans-serif Light grey, left panel top; CTA "Parlons-en" in a Teal pill button bottom-left.
STYLE: editorial photography, soft grade, subtle grain.
RULES: render only the text above, spelled exactly; no extra words or watermarks.
```

**us-vs-them, 4:5**
```
FORMAT: 4:5 us-vs-them ad for AeroRun Pro running shoe. Two columns: left "AeroRun" with green check rows, right "Others" with grey cross rows; the shoe from image 1 large on the left.
TEXT: column titles "AeroRun" / "Others"; rows "Ultra light", "Free returns", "Recycled foam" with matching negatives "Heavy", "Fees", "Virgin plastic", exactly as written.
STYLE: clean flat graphic, white background, accent #22808A, sans-serif.
```

## Review checklist

- All text present, spelled correctly, inside safe margins
- Product/logo unchanged, legible
- Brand palette respected, contrast readable
- Aspect right for the channel

Report misses with a proposed prompt fix; ask before regenerating.

## Errors

- No format chosen -> ask; there is no default.
- More than 16 reference images -> trim.
- Text garbled after a run -> shorten the copy, fewer text blocks, restate positions; propose, ask, then rerun.
