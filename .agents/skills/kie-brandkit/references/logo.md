# Logo system

Load this module only when the user asks to create, extend, document, or apply a logo. A request for other branded graphics does not authorize a redesign.

## Route

### Existing official logo

Use the supplied file as authoritative.

1. Analyze source geometry, variants, colors, clear space, and minimum-size guidance from source files/brandbook.
2. Record its exact local path or public URL in the Brand Lock. Upload it (`scripts/kie_upload.py`, with the user's yes) only when a generation stage needs it as an `-i` reference.
3. Reuse or deterministically place the exact asset.
4. Generate only requested variants/applications.

Never ask an image model to redraw a logo merely to change its background, size, placement, or colorway. Use SVG/PPTX/image compositing when the source supports it.

### Partial logo system

Examples: only a primary logo exists; no monochrome/reverse version, symbol, clear-space rule, or lockup.

- Preserve the primary mark.
- Propose only missing variants.
- Derive variants from source geometry rather than inventing a second style.
- Ask before separating a symbol from a wordmark if the source does not demonstrate that they may be used independently.

### New logo

Run only when explicitly requested.

1. In an interactive new-identity flow, complete the palette review in `concept-boards.md` first. Require a user-selected and persisted palette before generating logo candidates. Color/style preferences from intake are not palette selection. Only explicit auto/no-question mode may select the palette internally; it must call `approve_palette` and receive a successful state response before generating logo candidates.
2. Load `brandkit-design-brain.md` and run `PROPOSE_LOGO_MECHANISMS` with the brief, references, visual axes, and selected palette.
3. Require exactly three distinct symbol-only candidate specifications.
4. Apply `logo-prompt-enhancer.md` exactly once per candidate, building one complete structured candidate input per application.
5. Show the user the three enhanced prompts with the settings (GPT Image 2.5 Flare, `-a 1:1 -r 1K --background opaque`, three outputs, one call each) and wait for an explicit yes. Then run the three prompts as three separate `python3 scripts/kie_image.py "<prompt>" -a 1:1 -r 1K --background opaque -o "$BRANDKIT_WORKDIR/logo/candidate-N.png"` calls. The palette hex codes and the flat solid background color are written into each prompt as color roles (see `logo-prompt-enhancer.md`).
6. Use the three PNG results directly. Do not pass them through the HTML preview script or any image editor.
7. Show all three per the logo review in `inline-widgets.md` in every mode, including explicit auto/no-question mode; never return them only as bare URLs. Then send a normal message inviting the user to review and comment when interaction is allowed.
8. When the user selects one candidate, run `logo-inspect --source <absolute path of the selected PNG>`. It fingerprints the exact file (SHA-256) without modifying it.
9. If the user needs SVG or production files, trace the selected PNG with `logo-vectorize` (below), show the traced SVG/PNG beside the original, and continue with the SVG only if the user accepts the trace. Otherwise the PNG stays the approved logo.
10. Immediately save the approved asset (PNG, or accepted traced SVG) and the returned fingerprint with the Brandkit state script's `approve_logo` action. Continue to typography only when the original request requires text/type; a logo-only request does not.

## Enhancer contract

For each of the three Design Brain mechanisms, assemble the complete structured candidate input defined in `logo-prompt-enhancer.md`:

```text
{
  brand_context: {
    name,
    offering,
    industry,
    positioning,
    audience,
    values
  },
  visual_axes: {
    restrained_expressive,
    geometric_organic,
    familiar_experimental
  },
  candidate: {
    mark_type,
    central_idea,
    visual_mechanism,
    distinctive_element,
    shape_logic,
    treatment,
    style_register,
    user_style_directive,
    composition
  },
  palette: {
    count,
    user_requested_more_than_three,
    roles
  },
  reference_signals,
  forbidden_elements
}
```

Apply that reference's full contract to produce one enhanced prompt per candidate. Use only that enhanced prompt as the candidate's image prompt. Never merge the three enhanced prompts into one request.

The palette hex codes enter the prompt only inside one color-role sentence (for example "locked primary #0D141F, locked accent #22808A, flat solid background #DADDE0"); the image model has no separate color parameters.

Set `user_requested_more_than_three: true` only when the user explicitly asks for a logo with more than three colors. Otherwise pass exactly the one, two, or three logo colors the concept requires, even if the broader brand palette contains more. Never add colors merely to reach three.

In explicit no-question mode, rank the three candidates privately but still show all three and stop for the user's logo selection. Never write approval state for an unselected brand mark.

## Exactly three comparable candidates

All three must:

- Be flat, vector-style marks returned directly by GPT Image 2.5 Flare on a flat solid background
- Use the same aspect ratio (1:1), palette roles, background, and resolution
- Belong to the selected draft palette and user-defined direction
- Differ in mark construction, not presentation quality
- Stay simple enough to trace faithfully into vector geometry
- Express one visual concept only; never fuse two metaphors unless the user's own request explicitly described that exact fusion
- Include one concrete distinctive silhouette, negative-space device, motif treatment, or unexpected locked color-role pairing
- Preserve any explicit user-requested style in the candidate and enhanced prompt
- Use one, two, or three logo colors as the concept requires; three is a maximum, not a default, unless the user explicitly requested more
- Avoid generic swooshes, arbitrary initials, stock startup symbols, tiny details, gradients/effects unless concept-critical, and mockup scenes

Typography is selected afterward. Every enhancer prompt must include “no text” in its constraint tail. Monograms may contain only their explicitly requested initials.

If prompt enhancement or the generation call fails, propose one retry with the same candidate specification and ask before running it. If it fails again, stop and report the error. Never select a winner for the user yourself.

During typography selection, the mark and wordmark must feel like one lockup:

- Match stroke/weight and corner character
- Balance mark height against cap/x-height
- Use deliberate gap and optical alignment
- Avoid a detailed/heavy mark beside a weak or unrelated wordmark

Never reproduce or cite a reference mark as the target.

## Local tracing to SVG (optional)

The image model returns raster PNGs. Trace only the user-selected candidate, only when SVG or production files are needed, and only for flat marks (no gradients, glows, or photographic detail). Requires ImageMagick and `potrace` (see [prerequisites](prerequisites.md)).

1. Write `"$BRANDKIT_WORKDIR/logo-vectorize.json"`:

   ```json
   {
     "source": "/abs/path/brandkit/logo/candidate-2.png",
     "name": "northline-symbol",
     "colors": ["#0D141F", "#22808A"],
     "fuzz": 18,
     "detail": 10
   }
   ```

   `colors` lists the foreground hex colors of the mark (never the background), one to four, drawn in order. `fuzz` (1–40) is the color tolerance used to isolate each color; `detail` is potrace's speckle size (0–100).
2. Run `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-vectorize --input "$BRANDKIT_WORKDIR/logo-vectorize.json" --output-dir "$BRANDKIT_WORKDIR/logo"`. It writes `<name>-traced.svg` and a transparent 2048×2048 PNG, and returns the geometry fingerprint.
3. Compare the traced PNG with the original candidate. Reject the trace when edges, counters, or proportions drift; propose a different `fuzz`/`detail` and rerun locally, or keep the PNG as the approved logo and say the vector trace is unavailable. Never hand-edit the SVG.

## Color revision and optional variant export

Logo approval requires only the selected color logo (PNG, or accepted traced SVG). Monochrome/reverse variants need an SVG source and are optional. Do not announce, prepare, generate, or save them unless the user explicitly requested them.

When logo files or a confirmed production method require export (SVG source only):

1. Load [exact logo-export payloads](logo-export-payloads.md), then keep the exact approved SVG as the geometry source.
2. Write `"$BRANDKIT_WORKDIR/logo-export.json"`, then run `python3 "$SKILL_ROOT/scripts/brandkit.py" logo-export` with `include_monochrome: false` by default. This creates only the approved color SVG and transparent 2048×2048 PNG.
3. Set `include_monochrome: true` only after an explicit request for monochrome/reverse files or when a user-confirmed output requires one-color production. Then set `primary_color` to the dominant approved source color.
4. Pass `replacements` only for a requested full-color revision.
5. Do not call the image model for a color-only change.

`logo-inspect` and `logo-export` use the same canonical fingerprint, so a removed full-canvas background cannot create a false geometry mismatch. The export script fingerprints every generated variant. Any geometry mismatch is a hard stop. Optional black/white variants are deterministic derivatives of the approved color SVG, not separate concepts or image-model recolors.

For a user-requested solid palette-color/one-color variant, pass that target hex once as `single_color`. The script recolors every actual SVG paint automatically and adds the SVG/transparent PNG pair. Never inspect source paints or construct per-fill `replacements` for a monochrome variant.

The script accepts hex, `rgb()`, and `rgba()` paint values and removes a detected full-canvas background. A failed color match reports the available source colors itself. If export still fails, stop and report the exact error. Never inspect or create copies with ad-hoc shell commands, `grep`, `sed`, regex scripts, or manual SVG rewriting.

Only when the user explicitly requests logo files, deliver the requested local SVG/PNG paths. Use the PNG as a later `-i` image reference (upload it with `scripts/kie_upload.py` after the user's yes). Keep the SVG (when one exists) as the authoritative editable source.

## System deliverables

Produce only requested items:

- Primary horizontal lockup
- Secondary/stacked lockup
- Symbol/monogram
- Wordmark
- Small-size/favicon treatment
- Clear-space diagram
- Minimum-size guidance
- Approved backgrounds
- Incorrect-use examples

## Clear space and minimum size

For an existing identity, copy official rules. If none exist, propose rules and mark them `inferred`:

- Define a repeatable unit `x` from a stable feature (symbol width, cap height, or dominant stroke), not an arbitrary pixel count.
- Apply `x` consistently around each lockup.
- Test at intended digital and print sizes.
- Create a simplified small-size treatment only with user approval; do not silently remove details from the primary mark.

## Editable output

- Three original PNG candidates
- Approved PNG (and, when traced, the accepted SVG) for the selected mark
- Full-color SVG and 2048×2048 PNG exports (only when an SVG exists)
- Black/white SVG and PNG variants only when explicitly requested or production-required
- PPTX brand-guide pages when requested

SVG wordmarks remain editable text and require the approved font to be installed. Do not promise native AI/EPS/Figma/Canva/PSD.

## Logo QA

- Exact spelling and glyph order
- No altered proportions or invented details
- No unintended gradients, shadows, bevels, or effects
- Correct palette and contrast
- Black and white variants (SVG source only) have the exact approved geometry and one solid color
- A traced SVG matches its source PNG in silhouette, counters, and proportions
- Exactly three candidates generated with identical parameters
- Selected mark and later wordmark treatment look optically complete together
- Legible silhouette at small size
- Clear-space and minimum-size examples match the actual asset
- Every mockup/template uses the approved anchor, not a regenerated copy
