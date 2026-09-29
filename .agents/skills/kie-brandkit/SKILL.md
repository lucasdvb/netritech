---
version: 1.0.0
name: kie-brandkit
description: |
  Create and extend complete visual brand systems through KIE AI (GPT Image 2.5 Flare) and bundled deterministic local tooling: palettes, logo marks (raster, optionally traced to SVG locally), typography, mockups, social graphics, packaging, signage, merchandise, posters, presentation decks, and editable PPTX/PDF brandbooks. Preserves official supplied assets, persists approvals locally, and regenerates only dependent outputs. Use when: "create a brand kit", "make a visual identity", "design a logo and brandbook", "apply this logo to branded assets", "make packaging or signage", or "extend our existing branding". Chain with kie-generate for general image production. NOT for unbranded image generation (use kie-generate), product catalog photography (use kie-product-photoshoot), website implementation (use kie-websites), or native Figma/Canva/PSD/AI delivery.
argument-hint: "[brand brief or existing assets] [requested deliverables]"
allowed-tools: Bash
---

# KIE Brandkit

Build a coherent identity and its requested applications. Treat supplied brand facts and official assets as fixed constraints. When the work is about SPM, read `docs/spm-brand-brief.md` first (palette: Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0).

## Permission (generation costs credits)

Before every `scripts/kie_image.py` run (and every `scripts/kie_upload.py` upload), show the user the final prompt, model (GPT Image 2.5 Flare), aspect ratio, resolution (1K unless asked), reference images, and number of outputs, then wait for an explicit yes. Never batch-generate variants or retries without approval. When a result fails QA, propose the fix and ask before regenerating. Local work (state, preview HTML, SVG/PNG export, tracing, PPTX/PDF build) needs no permission.

## Bootstrap

1. Resolve `SKILL_ROOT` to this skill's installed directory and create a durable project directory:

   ```bash
   BRANDKIT_WORKDIR="${PWD}/brandkit"
   BRANDKIT_STATE="${BRANDKIT_WORKDIR}/state.json"
   mkdir -p "${BRANDKIT_WORKDIR}"
   ```

2. Read [prerequisites](references/prerequisites.md). Check tools before the stage that needs them. Never install system packages without the user's permission.
3. Scripts: `scripts/kie_image.py`, `scripts/kie_video.py`, `scripts/kie_upload.py` (repo root); the key comes from `KIE_AI_API_KEY` or `.mcp.json`. Brandkit uses only `kie_image.py` and `kie_upload.py`; run them from the repo root.

## Tool mapping

| Operation | Command |
|---|---|
| Generate an image (text-to-image) | `python3 scripts/kie_image.py "<prompt>" -a <ratio> -r 1K -o <file.png>` |
| Reference-guided image / edit (image-to-image, up to 16 refs) | same, plus `-i <public url>` per reference |
| Make a local file usable as a reference | `python3 scripts/kie_upload.py <path>` (prints a temporary public URL, about 3 days) |
| Read/write approval state | `python3 "$SKILL_ROOT/scripts/brandkit.py" state ...` |
| Render review boards | `python3 "$SKILL_ROOT/scripts/brandkit.py" preview ...` |
| Inspect selected logo | `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-inspect ...` |
| Trace a raster logo to SVG (local) | `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-vectorize ...` |
| Export logo files | `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-export ...` |
| Build a Brandbook | `python3 "$SKILL_ROOT/scripts/brandkit.py" brandbook-build ...` |

`kie_image.py` prints `url ...` and saves `-o` when the result host is reachable (`tempfile.aiquickdraw.com` may be blocked by the sandbox: then give the user the URL). Reference and edit inputs must be public URLs; a previous result's printed URL can be reused directly. There is no mask, seed, or separate edit/text model: an edit is image-to-image with the source as `-i` and an edit-style prompt ("keep X unchanged, change Y"). Keep HTML, SVG, PPTX, and PDF deliverables as local project files.

## User-facing behavior

- Match the user's language. Keep Design Brain reasoning, state mechanics, scripts, and QA internals private; show only the final prompt, settings, and output count at each permission step.
- After approval, send at most one short status sentence per generation batch, then stay quiet until the result is ready.
- Ask one compact set of only unresolved blocking questions. Never repeat facts or force a complete identity questionnaire for a partial task.
- After each palette, logo, typography, or downstream review, stop and wait for ordinary user feedback.
- Never infer approval from silence, successful generation, or your own preference.
- Preserve exact user copy. Never invent positioning, values, claims, ingredients, prices, certifications, statistics, or regulatory content.

## Core workflow

1. **Classify the request.**
   - `apply-existing`: use supplied official assets without redesigning them.
   - `extend-partial`: create only missing slots required by the requested output.
   - `create-identity`: create a new logo or identity only when explicitly requested.
2. **Read state.** Run:

   ```bash
   python3 "$SKILL_ROOT/scripts/brandkit.py" state \
     --state-file "$BRANDKIT_STATE" --action get_status
   ```

   Local state is durable. Never paste, hand-edit, or recreate approvals when the state file exists.
3. **Run intake and asset analysis.** Read [intake](references/intake.md), [asset analysis](references/asset-analysis.md), [state routing](references/handoff.md), and [exact state payloads](references/state-payloads.md). Lock every user-declared official logo, palette, and typography slot immediately.
4. **Create the Brand Lock.** Read [Brand Lock](references/brand-lock.md). Record exact spelling, official assets, colors, fonts, layout/shape rules, requested outputs, and forbidden treatments.
5. **Require only the slots the output uses.**
   - logo-only → palette + logo for a new mark; official logo alone for an existing mark
   - palette-only → palette
   - typography-only → typography
   - copy-free mockup/merch → logo; add palette only when color/application requires it
   - text-bearing social/packaging/poster/signage → logo + palette + typography
   - Brandbook/deck → logo + palette + typography
6. **Build missing foundation slots.** Read [Design Brain](references/brandkit-design-brain.md), [concept boards](references/concept-boards.md), [inline reviews](references/inline-widgets.md), and only the needed [palette](references/palette.md), [logo](references/logo.md), or [typography](references/typography.md) module.
7. **Continue the original request** as soon as its required slots are approved. Never ask the user to choose scope again.
8. **Load only the requested production module:**
   - [mockups](references/mockups.md)
   - [social graphics](references/social-templates.md)
   - [posters/banners](references/posters-banners.md)
   - [packaging](references/packaging.md)
   - [signage](references/signage.md)
   - [merchandise](references/merchandise.md)
   - [presentation decks](references/presentation-deck.md)
   - [Brandbooks](references/brandbook.md)
9. **QA and approval.** Read [QA and iteration](references/qa-and-iteration.md). Repair only the failing output. Save a downstream element only after explicit approval with its exact foundation dependencies.

## New identity sequence

### 1. Palette

Render 2–3 exact palette options as deterministic HTML using [preview payloads](references/preview-payloads.md). Show PNG screenshots plus editable HTML files and wait. Persist the selected palette with `approve_palette` before logo generation.

### 2. Logo marks

Read [logo prompt enhancer](references/logo-prompt-enhancer.md). Produce exactly three distinct symbol-only mechanisms and one GPT Image 2.5 Flare prompt for each (the palette hex codes go in the prompt as color roles on a flat solid background). Write each prompt to a file, show all three with the settings, and after an explicit yes run them one at a time:

```bash
python3 scripts/kie_image.py "$(cat "${BRANDKIT_WORKDIR}/logo-candidate-1.txt")" \
  -a 1:1 -r 1K --background opaque -o "${BRANDKIT_WORKDIR}/logo/candidate-1.png"
```

Review the PNGs directly (or the printed URLs). After selection, fingerprint the exact file without altering it:

```bash
python3 "$SKILL_ROOT/scripts/brandkit.py" logo-inspect \
  --source "<absolute path of the selected PNG>"
```

When the user needs SVG or production files, trace the selected PNG locally with `logo-vectorize` (see [logo](references/logo.md)), show the trace beside the PNG, and approve the SVG only if the user accepts it. Otherwise the PNG is the approved logo. Persist the exact file path (and public URL if uploaded), name, palette revision, and returned fingerprint with `approve_logo`.

### 3. Typography

Propose 2–3 unique display/body pairs using supplied fonts or verified Google Fonts. Render the real brand name and sample copy through the preview script. Persist only the selected pair with `approve_typography`.

Interactive flows always stop for palette, logo, and typography selections. Explicit no-question mode may choose and persist a palette, but it still shows all three logo candidates and stops for the user's logo selection; exact brand marks are never self-approved.

## Consistency invariants

- Reuse the same approved logo source everywhere. Never redraw an official or selected logo when deterministic placement/export is possible.
- A generated logo depends on the palette revision used to create it. Changing that palette invalidates the generated logo and its dependents; changing typography does not invalidate the symbol mark.
- Changing a foundation slot invalidates only downstream elements that list that slot in `required_slots`.
- Copy the same Brand Lock values into every related generation prompt: exact hex, font roles, shape language, placement, clear space, composition, and forbidden treatments.
- Use GPT Image 2.5 Flare (`scripts/kie_image.py`, 1K) for every generated image: logo marks, mockups, and flattened graphics. It renders text well, but exact fonts and letterforms are never guaranteed.
- Use local deterministic SVG/PPTX/HTML construction for exact copy and editable layouts. Do not ask an image model to fake editable files.
- Do not promise native Figma, Canva, PSD, AI, or EPS files.

## Deterministic scripts

Create JSON input files under `"$BRANDKIT_WORKDIR"`; never interpolate user text directly into shell arguments.

```bash
python3 "$SKILL_ROOT/scripts/brandkit.py" preview \
  --input "$BRANDKIT_WORKDIR/reviews.json" \
  --output-dir "$BRANDKIT_WORKDIR/reviews"

python3 "$SKILL_ROOT/scripts/brandkit.py" logo-export \
  --input "$BRANDKIT_WORKDIR/logo-export.json" \
  --output-dir "$BRANDKIT_WORKDIR/logo"

python3 "$SKILL_ROOT/scripts/brandkit.py" brandbook-build \
  --state-file "$BRANDKIT_STATE" \
  --input "$BRANDKIT_WORKDIR/brandbook.json" \
  --output-dir "$BRANDKIT_WORKDIR/brandbook"
```

For logo export, load [logo export payloads](references/logo-export-payloads.md). For Brandbooks, use the bundled builder only; never substitute an improvised PowerPoint or PDF generator after a deterministic contract failure.

## Failure policy

- If an image-generation request fails or misses the Brand Lock, propose one corrected prompt with the same locked concept and ask before running it. Stop after the second equivalent failure.
- If preview, logo tracing, or logo export fails twice, report the concrete error; never replace it with ad-hoc SVG rewriting.
- If the Brandbook template, font, or conversion contract fails, stop immediately. Do not produce a visually different fallback and call it canonical.
- If exact typography or official-logo fidelity cannot be preserved, disclose the limitation instead of claiming completion.
- Never expose the API key or other credentials in files, logs, or chat.

## Delivery

For Brandbooks, follow the strict response contract in [brandbook](references/brandbook.md): PPTX link/path, PDF link/path, and font-install warning only.

For other outputs return:

1. The requested visual files and previews.
2. A compact Brand Lock summary.
3. Editable versus flattened format labels.
4. Required-font/import limitations.
5. Stable variant names for targeted revisions.

## Reference index

- [Prerequisites](references/prerequisites.md) — stage-specific local dependencies and install commands.
- [Intake](references/intake.md) — minimal questions and input routing.
- [Asset analysis](references/asset-analysis.md) — official/reference classification and measurement.
- [State routing](references/handoff.md) and [state payloads](references/state-payloads.md) — persistent approvals.
- [Brand Lock](references/brand-lock.md) — canonical visual constraints.
- [Design Brain](references/brandkit-design-brain.md) — private art direction.
- [Concept boards](references/concept-boards.md), [preview payloads](references/preview-payloads.md), and [inline reviews](references/inline-widgets.md) — selection stages.
- [Logo](references/logo.md), [logo prompt enhancer](references/logo-prompt-enhancer.md), and [logo export payloads](references/logo-export-payloads.md) — logo generation, local tracing, and deterministic variants.
- [Palette](references/palette.md) and [typography](references/typography.md) — foundation slots.
- [Mockups](references/mockups.md), [social graphics](references/social-templates.md), [posters/banners](references/posters-banners.md), [packaging](references/packaging.md), [signage](references/signage.md), and [merchandise](references/merchandise.md) — applications.
- [Presentation decks](references/presentation-deck.md) and [Brandbooks](references/brandbook.md) — editable documents.
- [QA and iteration](references/qa-and-iteration.md) — preflight, repair, approval, and delivery manifest.
