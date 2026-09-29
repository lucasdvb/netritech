# Mockups

Create believable applications of the Brand Lock. Preserve the approved logo and colors; do not let the scene generator invent branding. Every generation step below needs the user's explicit yes on the final prompt, settings, and output count first (see the Permission rule in `SKILL.md`).

Before planning, require only an approved logo through the Brandkit state script's `get_logo` action. Read approved palette/visual axes when available or when color/application decisions need them. Require typography only when readable text must appear. Use the exact approved logo path or URL returned by state everywhere; never substitute a newer generation or a recreated mark.

Mockups are rendered images, not fully editable layered documents. If the user needs editable source artwork, use that asset's dedicated reference (for example `packaging.md` or `social-templates.md`) first.

## Plan the application from brand input

Use the approved Brand Lock, user brief, persisted visual axes, preferences, and uploaded references before choosing mockup objects, materials, framing, or art direction.

- Choose applications people in that category credibly use.
- Extract useful composition/material cues from user-provided references.
- Never recreate a reference's exact scene, layout, or branded object.

Each mockup needs one clear art-directed idea tied to this brand. “Put the logo on a generic object” is not a concept.

## Anti-slop rules

Avoid the common synthetic/generic look:

- Arbitrary gradients or neon glows unrelated to the Brand Lock
- Plastic sheen on every material
- Floating products and physically meaningless props
- Excessive bloom, haze, depth of field, or cinematic lighting
- Generic marble/pedestal “luxury” staging
- Fake microcopy, pseudo-labels, invented claims, or decorative UI
- Impossible folds, embossing, reflections, print edges, or scale
- Too many props competing with the branded surface
- Warped logos or a different visual device in every mockup

Prefer believable materials, restrained lighting, purposeful negative space, specific environments, and one focal branded application.

## Generation route

Use **GPT Image 2.5 Flare** through `scripts/kie_image.py` (1K unless the user asks for more) for every mockup. It handles both the photoreal scene and readable text, so a finished mockup is normally one image-to-image call with the approved logo as a reference. Use the same model and settings for every mockup in the set.

## Ask for aspect ratio

Before proposing any mockup generation, ask which ratio the user wants unless their current request already states it. Offer 1:1, 4:5, 3:4, 4:3, 16:9, 9:16, 3:2, and 2:3. For several mockups, use one ratio for the set unless the user assigns ratios per item. Lock the selected ratio across every stage.

### Existing photograph

When the user explicitly supplies the exact photograph to mock up, upload it (with the user's yes) and pass it as the first `-i` (Image 1) and the selected logo variant as the second (Image 2). Preserve subject, camera, lighting, materials, folds, shadows, perspective, crop, background, and selected ratio.

## Logo variant routing

Call the Brandkit state script's `get_logo` action and use one of its exact approved variant assets:

- Full-color logo: smooth surfaces and production methods that credibly support accurate multicolor printing.
- Black monochrome logo: light kraft paper, natural cardboard, pale fabric, stamps, dark-ink screen printing, engraving masks, and light uncoated stock.
- White monochrome logo: dark paper, dark boxes, dark fabric, reverse marks, light-ink screen printing, and dark signage.
- Embossing, debossing, foil, laser engraving, and one-color printing always use a monochrome variant. Never send the full-color mark as the application reference for those processes.

Only after the user confirms a mockup whose physical production requires one-color/reverse artwork, run `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-export` with `include_monochrome: true` and the approved color SVG when the required variant is absent. Never pre-generate monochrome assets for future mockups. Never ask the image model to invent/recolor them or use manual SVG edits. Monochrome variants need an SVG logo source (an official SVG or an accepted `logo-vectorize` trace); with a PNG-only logo, say so and use the full-color mark.

## Mockup prompt contract

Pass references with repeated `-i <public url>` flags in a fixed order: Image 1 is the first `-i`, Image 2 the second, and so on. For a new scene, upload the PNG of the selected logo variant (`python3 scripts/kie_upload.py <png>`, with the user's yes) and pass it as Image 1; add approved product/artwork references afterward. For an existing photograph, the photograph is Image 1 and the logo PNG Image 2. State each role explicitly. Never pass an SVG as an image reference (export a PNG first).

```text
[CREATE ONE FINISHED BRANDED MOCKUP]
<specific object/application, credible setting, camera, material, lighting,
composition, and one brand-specific art-direction idea>

[AUTHORITATIVE LOGO]
Image N is the exact approved <full-color/black/white> logo. Preserve its
spelling, silhouette, geometry, proportions, internal negative space, and exact
color. Do not redraw, simplify, crop, stretch, outline, or add effects.

[PLACEMENT LOCK]
Target surface: <exact object panel/face/material>.
Position: <exact alignment and location, e.g. horizontally centered, upper
third, optical center aligned to panel>.
Scale: logo occupies <specific proportion> of the target surface while keeping
<specific clear-space margin>.
Orientation: align to <panel edge/seam/baseline>; follow surface perspective
without changing logo proportions.
Color: use the supplied <full-color/black/white> variant exactly. State why it
contrasts correctly with the material/background.

[PHYSICAL APPLICATION]
Render the logo using <credible print/emboss/foil/engraving/ink behavior>.
Respect folds, grain, perspective, occlusion, reflections, scale, and
manufacturing limits.

No extra logos, pseudo-text, invented labels, warped marks, floating print,
unrelated props, arbitrary gradients, plastic sheen, or generic luxury staging.
```

The prompt must contain concrete placement, scale, alignment, clear-space, color-variant, and material-application instructions. “Place the logo on the bag/box” is insufficient.

Typical one-stage call (after the user's yes):

```bash
python3 scripts/kie_image.py "<complete mockup prompt>" \
  -a 3:4 -r 1K -o "$BRANDKIT_WORKDIR/mockups/tote-primary-v1.png" \
  -i "<public URL of the approved logo PNG>"
```

Keep the printed result URL: a later stage can use it directly as an `-i` reference without re-uploading.

## Locked base scene route (sets, colorways, exact copy)

Use two stages only when a set must share one scene or the final image carries a lot of exact text (wordmark, tagline, packaging label, signage, product copy, interface text):

1. Generate the same-ratio scene with the target surface blank: no logo, letters, pseudo-text, or invented graphics. Ask the user to approve the base scene.
2. Propose the application call, then after the user's yes run image-to-image with the approved base scene URL as Image 1 and the approved logo/artwork PNG as Image 2. The prompt preserves Image 1's camera, crop, objects, lighting, material, folds, shadows, perspective, and background exactly, and states the exact literal text, logo variant, placement, scale, alignment, clear space, color, and physical print/application behavior.
3. Keep the ratio identical to the user-approved ratio.

```bash
python3 scripts/kie_image.py "<exact controlled text/detail application prompt>" \
  -a 3:4 -r 1K -o "$BRANDKIT_WORKDIR/mockups/tote-primary-v2.png" \
  -i "<base scene result URL>" -i "<public URL of the approved logo PNG>"
```

For one-off mockups without a lot of exact text, keep the single call above.

## Deterministic compositing

Prefer deterministic placement over generative editing when:

- The target is a flat poster, screen, card, sign, or front-facing package
- The source logo already has transparency
- No physical deformation, folds, reflections, or occlusion are required

Use image/SVG tooling to scale and place the official logo exactly. Preserve clear space and color. Add masks/perspective only when they can be controlled reliably.

Use the image model when the branding must interact with:

- Fabric folds
- Curved packaging
- Embossing/debossing
- Foil, print texture, reflections, or surface wear
- Occlusion and realistic perspective

If the model corrupts the logo, propose one retry with stronger placement, geometry, and color constraints and the same references, and ask before running it. If it fails again, stop and use deterministic compositing when possible.

## Mockup-specific guidance

### Packaging

- Use the actual dieline/package proportions when supplied.
- Preserve material, closure, label area, and required legal/copy regions.
- Do not invent claims, ingredients, certifications, or regulatory text.

### Apparel/merch

- Use the image model for the finished branded person/garment mockup.
- Define print/embroidery location, size, and material behavior.
- Preserve the person and garment between variants.

### Signage/environment

- Respect viewing distance, perspective, mounting, and lighting.
- Use the correct approved logo version for background contrast.

### Device/screen

- Treat the screen graphic as a separate editable asset from its dedicated module when possible, then composite it into the device.
- Do not ask the image model to invent interface copy that should be exact.

## Variant discipline

For several mockups:

- Lock one base scene per mockup family.
- Vary only the requested application or colorway.
- Keep camera, lighting, material, and composition fixed for comparison sets.
- Do not generate a new person or environment for every colorway.

## Mockup QA

- Official logo matches the reference exactly
- No misspelling, extra glyph, warped geometry, or invented mark
- Correct colorway and sufficient contrast
- Physical application follows folds/perspective/material
- No floating print, impossible reflections, or duplicated graphics
- One brand-specific art-directed idea; not a generic logo-on-object scene
- Materials, props, lighting, and setting are credible for the industry
- No arbitrary gradients, plastic sheen, bloom, fake microcopy, or generic luxury staging
- When an existing photograph was supplied, every non-target scene element is unchanged
- Product/package proportions match supplied references
- All mockups use the same Brand Lock
- Rendered output is clearly labeled as non-editable unless a separate editable overlay/template is also delivered

After QA, ask the user to approve the final mockup or set. Only then save it with the Brandkit state script's `approve_brandbook_element` action and `required_slots: ["logo"]`; add palette/typography only when the mockup actually used them. Generated or model-praised mockups are drafts until that approval.
