# Mode templates

One section per mode. Each gives defaults and a template that plugs into the skeleton of `prompt-assembly.md` (slots in `<angle brackets>`, banks in section 4 there). Always keep the product-lock clause (section 3) in `PRODUCT`. Aspect is the `-a` value; `-r 1K` unless the user asks otherwise.

Default aspects and counts:

| Mode | Aspect | Typical count | Reference inputs |
|---|---|---|---|
| `product_shot` | `1:1` (Shopify/catalog), `4:5` for IG | 1–5 | image 1 = product |
| `lifestyle_scene` | `4:5` (feed), `3:2` for web | 1–5 | image 1 = product |
| `closeup_product_with_person` | `4:5` | 1–3 | image 1 = product, optional image 2 = person/skin reference |
| `moodboard_pin` | `2:3` | 1–3 | image 1 = product |
| `hero_banner` | `21:9` (site), `16:9` (email / mobile-safe) | 1–3 | image 1 = product |
| `social_carousel` | `4:5` (or `1:1`) | 3–10 slides | image 1 = product, then previous slide |
| `ad_creative_pack` | `1:1` feed, `4:5` Meta, `9:16` Stories/TikTok | 3–6 variants | image 1 = product, then previous ad |
| `virtual_model_tryout` | `3:4` (or `2:3` full body) | 1–4 | image 1 = product, optional image 2 = model/face |
| `conceptual_product` | `4:5` or `1:1` | 1–4 | image 1 = product |
| `restyle` | keep the source ratio (nearest, or `auto`) | 1–3 | image 1 = the existing image |

---

## product_shot

Product on a neutral, clean background, catalog-grade. Presets to rotate: pure white sweep, soft gradient sweep, colored seamless, mirror/glossy surface, hard-shadow graphic, podium/pedestal, flat lay.

```
FORMAT: <aspect> catalog product image for <use>, product only.
PRODUCT: <lock clause>
SCENE: <preset: e.g. seamless warm-grey paper sweep, product on a low honed-stone plinth>; no props (or <one supporting prop and why>).
HUMAN: no people.
CAMERA: <catalog or hero framing from the bank>, product centered, 10% margin all around.
LIGHT: <soft studio | high-key catalog>, soft contact shadow and a faint reflection under the product.
PALETTE & MATERIALS: <backdrop color> with the product's own colors as the only accent; <surface texture>.
MOOD: clean, premium, tactile.
TEXT: No text, no watermark, no added logos.
AVOID: clutter, extra products, harsh reflections hiding the label, tilted horizon, color cast on the product.
```

Rules: pure-white backgrounds say "pure white RGB 255 background, faint contact shadow only". For marketplace-compliant mains use `kie-marketplace-cards` instead.

Example: "1:1 catalog image, matte-black aluminium water bottle (image 1), warm-grey paper sweep, honed-stone plinth, eye-level 85mm, softbox left with white bounce right, soft contact shadow."

---

## lifestyle_scene

Product in a believable real-world context with atmosphere, hands or action.

```
FORMAT: <aspect> lifestyle photograph for <use>.
PRODUCT: <lock clause>
SCENE: <specific place and moment, e.g. sunlit kitchen counter at 8am, half-drunk coffee, open window>; props: <max 3>, none covering the product.
HUMAN: <no people | a hand reaching in from frame edge | person in background, out of focus>.
CAMERA: <lifestyle candid or hero>, product in the lower-third power point or center, background softly blurred.
LIGHT: <window daylight | golden hour>, natural falloff, warm bounce.
PALETTE & MATERIALS: <3 colors from the scene that flatter the product>; <textures: linen, wood, ceramic>.
MOOD: <2–3 words, e.g. calm, morning, effortless>.
TEXT: No text, no watermark, no added logos.
AVOID: staged stock-photo feel, product hidden behind props, oversized product, second competing hero object.
```

Rules: the scene must make sense for how the product is actually used (kitchen for beverages, gym bench for shakers). Scale must be realistic.

Example: "4:5 lifestyle photo, cold-brew bottle (image 1) on a sunlit kitchen counter, sweating with condensation, a hand reaching from the right edge, oat-milk glass and a linen towel, 35mm handheld feel, morning window light from the left, cream and oak palette, calm and fresh."

---

## closeup_product_with_person

Tight crop with hands or a partial face: applying, holding, demonstrating. Never a full identifiable portrait unless the user provides a face reference.

```
FORMAT: <aspect> tight closeup for <use>, product in use.
PRODUCT: <lock clause, closeup variant: label and logo stay legible>
SCENE: <where, one detail, blurred>.
HUMAN: <hands only | lower half of face and neck | one hand and forearm>; <action: applying serum drop to cheek | holding tube between thumb and forefinger | pouring>; natural skin texture with pores, no plastic smoothing, five fingers per hand, natural grip; <skin tone / age range / nails styling>.
CAMERA: 100mm macro-portrait feel, shallow depth of field, focus on the point of contact and the product label, subject cropped by the frame edge on purpose.
LIGHT: <beauty | window daylight>, soft specular on skin and product surface.
PALETTE & MATERIALS: <skin tones + product colors + one neutral>.
MOOD: intimate, tactile, real.
TEXT: No text, no watermark, no added logos.
AVOID: extra fingers, waxy skin, product label facing away, face fully visible, distorted hands.
```

With a person reference (`image 2`): add `The person is the one in image 2: same skin tone, facial structure, hair, keep the identity, show only <crop>.` Only when the user supplied that photo and consents to its use.

Example: "4:5 closeup, a hand pressing a serum dropper bottle (image 1) over a cheek, lower face only, dewy skin, 100mm macro, soft frontal beauty light, blush and cream palette, label facing camera."

---

## moodboard_pin

Pinterest-native vertical image: aesthetic first, product integrated as a quiet hero.

```
FORMAT: 2:3 vertical Pinterest image, editorial moodboard aesthetic, product integrated not advertised.
PRODUCT: <lock clause>
SCENE: <styled vignette from the preset bank: e.g. cottagecore breakfast table with wildflowers, gingham, wooden tray>; layered depth: foreground blur element, mid-ground product, background texture.
HUMAN: <no people | hands only, editorial>.
CAMERA: three-quarter view slightly above, 50mm, vertical composition with the product in the lower-center and open airy space above (room for an overlay title).
LIGHT: <preset light>, soft and dreamy, gentle grain.
PALETTE & MATERIALS: <preset palette>, film-like tones.
MOOD: <preset feel>, saveable, aspirational.
TEXT: No text, no watermark, no added logos. (Add a title only if the user gave the words; see prompt-assembly section 7.)
AVOID: hard advertising look, logos other than the product's own, busy background competing with the product.
```

Example: "2:3 pin, candle (image 1) on a wooden tray with dried wildflowers, linen and a ceramic cup, cottagecore, golden-hour light through gauze, sage/butter/cream palette, empty space above."

---

## hero_banner

Wide header for a website, email or campaign, with negative space for copy.

```
FORMAT: <21:9 or 16:9> hero banner for <site / email / campaign>, wide composition.
PRODUCT: <lock clause>
SCENE: <environment that supports the brand story>; the product sits on the <left|right> third; the opposite 45% of the frame is calm, low-detail negative space reserved for headline and CTA.
HUMAN: <none | small figure for scale, far from the copy zone>.
CAMERA: wide framing, 35–50mm, gentle depth, strong leading lines toward the product.
LIGHT: <directional, brand-appropriate>, gradient falloff into the copy zone.
PALETTE & MATERIALS: <brand palette>, copy zone is a smooth gradient of <color> so text stays legible.
MOOD: <brand tone>.
TEXT: <No text, no watermark, no added logos. | HEADLINE reads exactly "<...>" ... (rules: prompt-assembly section 7)>
AVOID: product in the center, busy detail in the copy zone, product cropped by the frame edge.
```

Rules: default is clean image and text added by the user's design tool; add baked text only when copy is provided. For an email hero, keep the product away from the outer 15% so a mobile crop works.

Example: "21:9 site hero, matte-black bottle (image 1) on the right third on wet slate, mist and low teal light, left 45% smooth dark-navy gradient for copy, no text."

---

## social_carousel

3–10 connected slides that read as one system. Build the SYSTEM block (prompt-assembly section 6) first and show it to the user with the slide list.

```
SYSTEM: <palette>, <background>, <light>, <type style/color>, <product treatment>, <margins/motif>.
FORMAT: <aspect> carousel slide <n> of <N> for <platform>.
ROLE: <slide role from prompt-assembly section 6>.
PRODUCT: <lock clause, or "product not shown on this slide" for problem/proof slides>
SCENE: <slide-specific scene, consistent with SYSTEM>.
CAMERA / LIGHT: <same as SYSTEM, only framing changes>.
TEXT: <exact slide copy in quotes, max 8 words, or none>
AVOID: style drift between slides, changing product scale or color, text outside safe margins.
```

Rules: generate slide 1, get approval, then slides 2..N with slide 1 as extra reference. Add a subtle continuity device (a line or shape that runs across the slide edge) only if the user wants a panoramic swipe effect. Deliver in order with labels `1 hook`, `2 problem`, etc.

---

## ad_creative_pack

Coordinated static ads for Meta / TikTok / Pinterest / Google. Same SYSTEM block, different angle per ad.

```
SYSTEM: <palette>, <background>, <light>, <type style>, <product treatment>, <CTA style>.
FORMAT: <aspect> paid social static ad, placement <Meta feed | Stories | TikTok | Pinterest | Google display>.
ANGLE: <hero benefit | social proof | offer | problem-solution | comparison | seasonal | UGC-style>.
PRODUCT: <lock clause>
SCENE: <scene that dramatizes the angle>; safe zones respected (prompt-assembly section 7).
HUMAN: <none | hands | person reacting>.
TEXT: HEADLINE reads exactly "<hook, max 6 words>"; CTA button reads exactly "<CTA>". No other text. (Omit both if the user wants a clean visual.)
AVOID: invented claims, prices, ratings, awards or competitor names; clutter; more than one focal point.
```

Ask for the offer/hook and the CTA; never invent them. Vary angle and scene per ad but keep SYSTEM identical. Generate ad 1 first, then the rest with ad 1 as extra reference. Deliver labelled by angle and placement.

Example: "4:5 Meta ad, hero-benefit angle: bottle (image 1) frosted with condensation on a teal gradient, headline 'Cold brew, zero bitter' upper left, CTA 'Shop now' lower left."

---

## virtual_model_tryout

Product worn or used by a rendered model: fashion, accessories, eyewear, jewelry, bags.

```
FORMAT: <3:4 or 2:3> fashion product photograph for <use>.
PRODUCT: <lock clause>; worn/carried exactly as designed, fit and drape realistic, fabric texture and stitching visible.
HUMAN: <model archetype: age range, look, hair, styling that doesn't compete>; <pose: standing three-quarter, walking, seated>; expression <relaxed / confident / candid>; natural skin texture, correct anatomy, five fingers per hand. <If image 2 is a model reference: same person as image 2, keep identity.>
SCENE: <environment: studio clean | outdoor natural | street style | editorial | home cozy>, blurred background that does not compete.
CAMERA: <full body 50mm | three-quarter 85mm | waist-up | closeup on product area 100mm>; the product area is the sharpest and best-lit part of the frame.
LIGHT: <soft studio | golden hour | window daylight>.
PALETTE & MATERIALS: <neutral wardrobe around the product so it stands out>.
MOOD: <editorial | casual | premium>.
TEXT: No text, no watermark, no added logos.
AVOID: distorted body proportions, product fused with skin or clothing, changed product color or cut, extra accessories with visible brands.
```

Rules: suggest 2–3 model archetypes matched to the brand audience during the interview. Only use a real person's photo (image 2) when the user supplied it themselves. For lookbook sets, keep the model description string identical across prompts and vary pose, framing and environment.

---

## conceptual_product

Surreal / CGI-style hero: levitating, splash, frozen motion, sculptural, impossible physics.

```
FORMAT: <aspect> conceptual advertising image, high-end CGI look with photoreal materials.
PRODUCT: <lock clause>; product itself stays intact and unaltered, the concept happens around it.
SCENE: <the concept in one sentence: e.g. bottle levitating above a still pool while a crown of water splashes upward, frozen mid-motion>; supporting elements: <particles, droplets, ingredients, fabric ribbons, geometric forms> that relate to the product.
CAMERA: <low hero angle | symmetrical front>, 50mm, product centered, dramatic scale.
LIGHT: <dramatic low-key | neon accent | high-speed flash freeze>, strong rim light, specular highlights on liquids and glass, subtle volumetric haze.
PALETTE & MATERIALS: <2 saturated colors + product colors>, <glossy / wet / metallic materials>.
MOOD: bold, impossible, premium.
TEXT: No text, no watermark, no added logos.
AVOID: distorting or melting the product, unreadable label, cluttered debris hiding the product, cartoon look.
```

Rules: one idea per image, elements must be related to what the product is (citrus for a citrus drink). Ask which concept the user prefers or offer 3 one-line concepts.

Example: "4:5, can (image 1) levitating over black water, a ring of peach slices and droplets frozen in orbit, low hero angle, teal rim light and warm peach key, wet glossy surfaces."

---

## restyle

Change the aesthetic, mood or season of an existing image without changing the subject. Image-to-image with the existing image as `image 1`.

```
FORMAT: <source ratio> image edit.
EDIT: Restyle image 1: keep the product and its exact shape, colors, label and printed text, the subject, the pose and the core composition unchanged. Change only <background / palette / lighting / props / season / mood> to <target aesthetic from the preset bank or season cue list>.
NEW LOOK: <palette, props (max 3), light, texture, mood words>.
KEEP: <list from the interview: e.g. the product, the hand, the camera angle>.
CHANGE: <list: e.g. the kitchen becomes a snowy window sill, warm fairy lights, pine sprigs>.
TEXT: No new text, no watermark.
AVOID: altering the product, changing its label, changing identity of any person in the image.
```

Rules: no mask exists, so be explicit about KEEP vs CHANGE. If the product drifts, propose a stricter KEEP line and add the original product photo as `image 2` (`reproduce the product from image 2 exactly`); ask before regenerating.

Example: "Christmas quiet-luxury version: keep the bottle, hand and framing; replace the counter with grey stone, add two pine sprigs and out-of-focus warm lights, taupe and ivory palette, low soft directional light."
