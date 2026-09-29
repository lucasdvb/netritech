# Prompt assembly — product photoshoot

The local prompt generator. Every mode in `mode-templates.md` builds on the skeleton, clauses and banks below. Output: one prompt per image, 120–220 words, plain prose in labelled sentences (no markdown in the prompt itself), written for GPT Image 2.5 Flare.

## 1. Slots

Fill from the interview, the product photo (look at it) and any brand brief. Never leave a slot generic when the photo answers it.

| Slot | What goes in |
|---|---|
| `PRODUCT` | Name, category, shape, color, material, finish, visible label/logo text exactly as printed |
| `REFS` | What each `-i` image is, in order: `image 1 = product`, `image 2 = model / style / previous slide` |
| `MODE` | One of the ten modes |
| `USE` | Platform / placement (Shopify PDP, IG feed, Pinterest, Meta ad, website hero) |
| `SCENE` | Environment, surface, background, props (max 3 props, each with a reason) |
| `HUMAN` | None / hands only / partial face / full model (age range, look, styling, action) |
| `CAMERA` | Angle, lens, framing, depth of field |
| `LIGHT` | Key direction and quality, fill, rim, color temperature |
| `PALETTE` | 3 colors max, tied to brand colors when given |
| `MOOD` | Aesthetic preset and 2–3 feeling words |
| `TEXT` | Default none; else exact copy in quotes (see section 6) |
| `AVOID` | Mode-specific negatives (see templates) |

## 2. Skeleton

Write the prompt in this order. Each line is one or two sentences.

```
FORMAT: <aspect> <use> image, <mode intent in a few words>.
PRODUCT: <product lock clause, section 3>
SCENE: <environment, surface, props>
HUMAN: <hands / model description and action, or "no people">
CAMERA: <angle, lens, framing, depth of field>
LIGHT: <key / fill / rim, temperature, shadow quality>
PALETTE & MATERIALS: <3 colors, surface textures, reflections>
MOOD: <preset + feeling words>
TEXT: <"No text, no watermark, no added logos." or exact copy>
AVOID: <negatives>
```

Rules:
- Say what each reference is on the first line when there are two or more: `IMAGE REFERENCES: image 1 = the product; image 2 = model reference.`
- One hero. The product must be the largest, sharpest, best-lit element unless the mode says otherwise.
- Concrete over adjectival: "45-degree window light from camera left, soft shadow falling right" beats "beautiful lighting".
- Physical plausibility: product rests on something, casts a shadow or reflection, scale matches real life.
- No brand names or celebrity names in the scene; the only branding is the product's own.

## 3. Product-lock clause (paste into `PRODUCT`)

With a product photo:

```
The product is the exact item shown in image 1: reproduce its shape, proportions, colors, materials, finish, logo, label layout and every printed word exactly as in the reference. Do not redesign, recolor, simplify, add or invent text or logos on it. The whole product is visible and sharp, uncropped, upright unless the scene says otherwise, and clearly the hero.
```

For a closeup, replace "The whole product is visible" with "The product's front label and logo stay fully visible and legible".

Without a photo (text-only, lower fidelity, tell the user): describe `PRODUCT` as `<category>, <shape>, <color>, <material and finish>, <packaging details>, label reading exactly "<text>"` and keep the last sentence of the clause.

## 4. Vocabulary banks

### Camera and framing

| Need | Phrase |
|---|---|
| Catalog | eye-level front view, 85mm lens, product centered, 10% margin, deep focus |
| Hero | three-quarter view from slightly above, 50mm, shallow depth of field, background softly blurred |
| Low hero | low angle looking up, 35mm, product monumental against sky/wall |
| Flat lay | top-down 90 degrees, 35mm, items arranged with clear negative space |
| Macro / detail | 100mm macro, extreme close, texture and edge in focus, background melted |
| Lifestyle candid | handheld feel, 35mm, slight off-center framing, natural imperfection |
| Editorial | 85mm, waist-up or full body, shallow depth of field, deliberate negative space |

### Lighting

| Look | Phrase |
|---|---|
| Soft studio | large softbox from camera left, white bounce fill on right, soft graduated shadow |
| High-key catalog | evenly lit, shadowless white sweep, faint contact shadow only |
| Window daylight | soft north-window light from the side, gentle falloff, warm ambient bounce |
| Golden hour | low warm backlight, rim glow on edges, warm 3200K highlights, cool shadows |
| Hard sun shadow | direct sun, crisp graphic shadows cast across the surface (foliage or blinds pattern) |
| Dramatic low-key | single directional light, deep black falloff, specular edge highlights |
| Neon accent | dark scene, colored practical lights (teal / magenta) reflecting on the product |
| Beauty | large soft frontal source with subtle rim, luminous skin, clean specular on glass and liquid |

### Surfaces and backdrops

Paper seamless (any color), travertine, honed marble, brushed steel, oak or walnut wood, linen, terrazzo, frosted acrylic, wet slate, mirrored acrylic (reflection), sand, moss and stone, ceramic tile, concrete. Match the surface to the product's price tier: mass-market gets paper / wood / laminate, premium gets stone / metal / glass.

### Aesthetic presets

| Preset | Palette | Props | Light | Feel |
|---|---|---|---|---|
| Clean girl | cream, soft beige, white | fresh flowers, ceramic dish, linen | bright soft window | fresh, minimal, dewy |
| Cottagecore | sage, butter yellow, cream | wildflowers, wicker, gingham, wooden tray | golden hour through gauze | pastoral, nostalgic, handmade |
| Quiet luxury | taupe, charcoal, ivory | stone, silk, single sculptural object | low, soft, directional | restrained, expensive, silent |
| Dark academia | oxblood, forest green, walnut | old books, brass, candle, leather | warm low lamp, deep shadow | moody, scholarly, textured |
| Y2K | chrome silver, baby blue, hot pink | gel, glitter, translucent plastics, star shapes | flash-lit, glossy speculars | playful, glossy, maximal |
| Scandinavian | white, pale wood, grey | ceramics, wool, plant | daylight, even | calm, functional |
| Retro 70s | rust, mustard, brown | corduroy, rattan, arches | warm tungsten | warm, grainy |
| Brutalist tech | concrete grey, black, one accent | raw concrete, steel, cables | hard side light | cold, precise |

### Seasonal contexts

| Context | Cues |
|---|---|
| Christmas | pine sprigs, warm bokeh lights, red/green/gold restrained, wrapping paper texture |
| Valentine's | blush and red, satin ribbon, rose petals, soft glow |
| Halloween | deep orange and black, candlelight, pumpkins, fog, moody rim light |
| Black Friday | dark backdrop, high contrast, bold accent color, space for offer copy |
| Spring / Summer / Autumn / Winter | fresh blossoms and pastel daylight / sun-drenched citrus and hard shadows / amber leaves and knit textures / frost, cool light and warm interior contrast |

## 5. Variants

There is no batch flag: N images = N prompts. Keep `PRODUCT` and `FORMAT` identical and change axes on purpose.

| Axis | Examples |
|---|---|
| Preset / scene | studio sweep / kitchen counter / outdoor terrace |
| Lighting | window daylight / golden hour / dramatic low-key |
| Angle | eye-level / three-quarter high / flat lay / macro |
| Palette | brand color A / neutral / brand color B |

For N variants, vary at least two axes each, never the same pair twice. Example, 3 variants of a cold-brew bottle: (1) kitchen counter, window daylight, three-quarter high, cream and wood; (2) café terrace, golden hour, low angle, warm amber; (3) dark slate with condensation, low-key rim, macro on the label, black and copper.

## 6. Multi-slide systems (social_carousel, ad_creative_pack)

Build a SYSTEM block once, paste it verbatim at the top of every slide prompt, then add the per-slide `ROLE` line.

```
SYSTEM: <palette: 3 hex or names>, <background treatment>, <lighting>, <typeface feel and text color, if text>, <product treatment, e.g. always three-quarter view, same scale>, <corner/margin rules>, <recurring motif or shape>.
ROLE: <slide n of N: what this slide says and shows>
```

Also pass the first approved slide as an extra `-i` (`image 2 = previous slide, match its visual system exactly`) on slides 2..N. Generate slide 1, get approval, then the rest.

Carousel roles: 1 hook (bold claim or question), 2 problem or context, 3 product reveal, 4–N-1 feature/benefit/step (one per slide), N proof or result, final CTA. Ad-pack angles: hero benefit, social proof, offer / urgency, problem-solution, comparison (product vs generic, never named competitors), seasonal, UGC-style handheld.

## 7. Text on images

Default: no text beyond what is printed on the product (`No text, no watermark, no added logos.`). Add text only when the user provided the copy or asked for a headline/offer (banners, carousels, ads). Then:
- Put the exact string in quotes: `HEADLINE reads exactly "Cold brew, zero bitter" in bold sans-serif, white, upper left, on the calm area.`
- Headline max 6 words, one supporting line max, one CTA max. Never invent prices, discounts, claims, ratings or awards; use only what the user gave.
- Reserve a clear text zone in `SCENE` / `CAMERA` (negative space left/top) and keep faces and the product out of it.
- Platform safe zones: 9:16 keep the top 14% and bottom 20% free of text and key elements; 4:5 and 1:1 keep 6% margins.

## 8. QA and fixes

Check every result before delivery:

| Check | If it fails, propose |
|---|---|
| Product shape, color, label text match the reference | re-run with the lock clause first and one extra reference angle; or edit call: "Keep everything, restore the label to read exactly ..." |
| Text on the product garbled or invented | closeup ref of the label as `image 2`, "reproduce the label from image 2 exactly" |
| Hands / fingers / anatomy wrong | re-run with simpler grip, "five fingers per hand, natural grip, hand partly cropped by frame" |
| Stray text, logos, watermark | add `no other text` and re-run; or edit call removing it |
| Product cropped / off-center | add explicit margin: "product fully inside frame with 10% margin" |
| Looks pasted / no contact shadow | add "grounded with a soft contact shadow and matching reflection" |
| Variants look alike | change two axes (section 5) |

Every fix is a new paid call: state the change and ask before running it.
