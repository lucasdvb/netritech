# Card prompt templates

Local prompt generator for the 13 marketplace assets. Rules for compliance, sizes and claims are in `marketplace-rules.md`. Prompts are prose, 100–200 words, written for GPT Image 2.5 Flare. One prompt per card, one `kie_image.py` call per card.

## 1. Shared pieces

### Reference line
First line of every prompt: `IMAGE REFERENCES: image 1 = <approved main image | product photo>; image 2 = product photo.` (For the main image only: `image 1 = product photo`.)

### Product-lock clause
```
The product is the exact item shown in the references: reproduce its shape, proportions, colors, materials, finish, logo, label layout and every printed word exactly. Do not redesign, recolor, simplify or invent text on it.
```

### Visual system block (sets: paste verbatim in every secondary/A+ card)
```
VISUAL SYSTEM: palette <3 colors from brand_context, hex if known>; background <treatment>; type <bold geometric sans | elegant serif | rounded friendly>, headline color <x>, body color <y>; icons <thin line | solid | duotone>, one accent color for callouts; product always shown with <soft shadow, same scale rules>; 6% margins; clean, uncluttered, high-contrast.
```
Derive it once from `brand_context` and `visual_style` and show it in the plan. For SPM work, use the SPM palette from `docs/spm-brand-brief.md`.

### Text rules
- Put exact strings in quotes: `headline reads exactly "Keeps drinks cold 24 hours"`.
- Headline max 6 words, callouts max 4 words each, max 5 callouts per card. Body copy only on A+ modules, max 3 short lines.
- Text comes from `product_context` (see claims policy). Language = `language`.
- Say `No other text.` at the end of any card with text, and `No text, no watermark, no added logos.` on cards without.

### Skeleton
```
IMAGE REFERENCES: ...
FORMAT: <aspect> marketplace <asset> card for <marketplace>.
PRODUCT: <product-lock clause>
[VISUAL SYSTEM: ... (sets)]
LAYOUT: <what is where>
COPY: <exact strings>
STYLE: <light, mood, materials>
AVOID: <asset-specific negatives>
```

## 2. Main image

`main_image` — `-a 1:1`. Follow `marketplace-rules.md` section 1.

```
IMAGE REFERENCES: image 1 = the product photo.
FORMAT: 1:1 marketplace main image, product only, pure white RGB 255,255,255 seamless background.
PRODUCT: <lock clause> Show it <front view | three-quarter view> exactly as sold, complete and uncropped, centered, filling about 85% of the frame, sharp from front to back.
LAYOUT: nothing else in the frame: no props, no hands, no text, no badges, no logos other than the product's own, no watermark, no border.
STYLE: even soft studio lighting, true colors, faint natural contact shadow directly under the product only, no floor reflection, no gradient.
AVOID: tinted background, vignette, extra items, cropped edges, color shift on the packaging.
```

Non-Amazon marketplaces: keep the same prompt unless the rules table allows more (Etsy: styled background allowed; Shopify: brand background).

## 3. Secondary images

### infographic — `-a 1:1`
Product + 3–5 callouts with icons and lines pointing to real features.
```
LAYOUT: product large at center-left on <clean background>, 3–5 callouts around it, each a small icon plus a 2–4 word label, connected by thin lines to the exact product part it describes.
COPY: headline reads exactly "<headline>"; callouts read exactly "<c1>", "<c2>", "<c3>". No other text.
STYLE: <visual system>, crisp vector-like icons, generous spacing.
AVOID: paragraphs, tiny text, ratings, badges, unsupported claims.
```

### multi_angle — `-a 1:1`
2×2 or 1+3 grid of the same product from different angles (front, side, back, top or 45 degrees).
```
LAYOUT: clean grid of <4> views of the identical product: front, left side, back, top-down, equal scale, same lighting, thin light-grey separators, small label under each view ("Front", "Side", "Back", "Top").
```
Needs a reference photo of any side that has printed text (back label). Without it, tell the user the invented sides may be inaccurate and limit the grid to the sides shown in the photos.

### detail_shot — `-a 1:1`
Macro on the feature that sells: texture, stitching, closure, ingredient, port, material.
```
LAYOUT: macro closeup of <the feature> on the product, 100mm macro look, feature in razor focus, product context still recognizable, one thin callout line and a 2–4 word label "<label>" (optional).
STYLE: soft directional light that reveals texture, shallow depth of field.
```

### lifestyle — `-a 1:1` (or `4:5`)
Product in use in a believable setting for the target buyer.
```
LAYOUT: <person or hands using the product | product placed in the room where it is used>, product clearly visible and identifiable in the lower or center third, <setting>, natural candid feel, max 3 props.
STYLE: <window daylight | golden hour>, warm, aspirational, realistic scale.
COPY: none (or one short headline reads exactly "<...>").
AVOID: hidden product, invented brand marks on props, unnatural hands (five fingers, natural grip).
```

### whats_in_box — `-a 1:1`
Flat lay of everything included, each item labeled, nothing extra.
```
LAYOUT: top-down flat lay on <clean surface>, every included item neatly arranged with equal spacing: <item list with quantities>, a small label under each item ("<item> x <qty>"), headline reads exactly "What's in the box".
AVOID: items not in the list, duplicates beyond the stated quantity.
```

## 4. A+ modules

Always use the VISUAL SYSTEM block. Copy from `product_context` only.

### aplus_hero_banner — `-a 21:9`
```
LAYOUT: brand hero: product large on the <right> third in an aspirational setting matching the brand, left 45% calm negative space with headline reads exactly "<headline>" and subline "<subline>".
```

### aplus_pain_points — `-a 16:9`
Problem to solution, 3 panels.
```
LAYOUT: three equal panels left to right, each an icon or small scene of a real customer frustration with a 2–4 word label ("<p1>", "<p2>", "<p3>"), and a final strip beneath with the product and "<solution line>". Neutral tones for problems, brand accent for the solution.
```

### aplus_features — `-a 16:9`
```
LAYOUT: product centered, four feature blocks around it (two left, two right), each with an icon, a 2–3 word title and a one-line description, thin connector lines to the product parts.
COPY: "<t1>" — "<d1>"; "<t2>" — "<d2>"; "<t3>" — "<d3>"; "<t4>" — "<d4>".
```

### aplus_ingredients — `-a 16:9`
```
LAYOUT: product on one side, on the other the real ingredients/materials as beautiful still-life items (whole and cut), each with a small label "<name>" and a 3–5 word benefit only when supplied.
AVOID: ingredients or percentages not provided, medical claims.
```

### aplus_efficacy — `-a 16:9`
Only with user-provided data; otherwise qualitative.
```
LAYOUT: clean data-visual panel: <supplied stat> shown as a large number with a short label, or a simple 3-step "<step 1> > <step 2> > <step 3>" timeline, product at the side.
COPY: exactly "<stat text as provided>". Source note reads exactly "<source as provided>" (if given).
AVOID: invented numbers, before/after imagery of people, clinical language not supplied.
```

### aplus_how_to_use — `-a 16:9`
```
LAYOUT: numbered 3–4 step strip, each step a clear illustrated or photographic frame (hands and product only) with a number badge and a 3–6 word instruction, arrows between steps.
COPY: "1 <step>", "2 <step>", "3 <step>".
```

### aplus_endorsement — `-a 16:9`
Brand trust module: brand story, values or user-provided quotes/certifications.
```
LAYOUT: <quote card with the provided quote and attribution, or a values strip with 3 icons and labels from brand_context, or provided certification marks reproduced from references>, product beside it.
COPY: exactly "<quote or values as provided>".
AVOID: invented reviewers, celebrity or influencer likeness, fake certifications, star ratings.
```

## 5. Worked example (product-images scope, beverage)

Intake: peach lemonade 6-pack of cans, Amazon, clean bright style, facts: "0 sugar", "12 fl oz", "Real peach juice", "6 cans". Palette: coral #FF7F6B, white, teal #22808A.

Plan (main + 5 secondary = 6 images, all `1:1`, `-r 1K`):
1. Main: the main-image prompt with `<front view>`.
2. Infographic: callouts `"0 sugar"`, `"12 fl oz"`, `"Real peach juice"`, headline `"Peach lemonade, zero sugar"`.
3. Multi-angle: only front and back (back photo provided) as a 1×2 grid.
4. Detail: macro on the condensation beading and the peach illustration.
5. Lifestyle: hand lifting the can from a picnic cooler in golden hour.
6. What's in the box: six cans in a row, label `"Can x 6"`, headline `"What's in the box"`.

Show the plan and prompts, wait for yes, generate the main, get approval, then generate the rest with the main URL as first `-i`.
