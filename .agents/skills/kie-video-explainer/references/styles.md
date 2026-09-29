# Styles and narrators

Local catalog used in Turn 1 and Turn 2. Every STYLE below already ends with the mandatory non-realism tail. A user may also describe a custom style or attach style-reference images (see `prompts.md`, "Style key").

Preview swatches are not pre-rendered. If the user wants to see a style before choosing, offer one 1K swatch per style using the abstract swatch template in `prompts.md`, and generate only after they approve the list.

## Style presets

| # | Name | Best for |
|---|---|---|
| 1 | Flat vector | Tech, business, how-it-works, product explainers |
| 2 | Ink marker on paper | Ideas, philosophy, personal stories, essays |
| 3 | Monochrome silhouette | Dramatic, reflective, history, big-question topics |
| 4 | Storybook gouache | Warm stories, education, kids, culture |
| 5 | Paper cut-out collage | Playful, science, nature, tactile explainers |
| 6 | Isometric diagram | Systems, processes, infrastructure, data |
| 7 | Chalkboard | Teaching, maths, step-by-step logic |
| 8 | Two-colour risograph | Editorial, culture, punchy opinion pieces |
| 9 | SPM Human & AI | SPM content (read `docs/spm-brand-brief.md` first) |

### STYLE descriptors (paste verbatim into every prompt)

1. **Flat vector**
   `flat 2D vector animation, bold clean outlines, solid vibrant flat fills, no shading, no gradients, simple geometric shapes, non-photorealistic, illustrated, not a photo, no live-action, no realism`
2. **Ink marker on paper**
   `hand-inked black marker on off-white paper, solid jet-black fills, thin white scratch highlights, visible marker grain, strictly monochrome, non-photorealistic, illustrated, not a photo, no live-action, no realism`
3. **Monochrome silhouette**
   `strict monochrome minimalism, solid black silhouettes on an absolute white void, high contrast, lots of negative space, matte, non-photorealistic, illustrated, not a photo, no live-action, no realism`
4. **Storybook gouache**
   `hand-painted storybook gouache, soft paper texture, warm muted palette, visible brush strokes, gentle rounded shapes, non-photorealistic, illustrated, not a photo, no live-action, no realism`
5. **Paper cut-out collage**
   `layered paper cut-out collage, torn and scissor-cut edges, flat coloured paper with subtle fibre texture, small soft drop shadows between layers, stop-motion feel, non-photorealistic, illustrated, not a photo, no live-action, no realism`
6. **Isometric diagram**
   `clean isometric vector illustration, 30-degree grid, flat pastel fills with one darker side per shape, thin uniform outlines, tidy infographic composition, no gradients, non-photorealistic, illustrated, not a photo, no live-action, no realism`
7. **Chalkboard**
   `white and pastel chalk drawings on a dark slate chalkboard, dusty smudged strokes, hand-drawn line quality, slightly wobbly geometry, visible chalk grain, non-photorealistic, illustrated, not a photo, no live-action, no realism`
8. **Two-colour risograph**
   `two-colour risograph print, fluorescent orange and deep blue on cream paper, halftone dots, slight ink misregistration, grainy overprint, flat shapes, non-photorealistic, illustrated, not a photo, no live-action, no realism`
9. **SPM Human & AI**
   `flat 2D vector illustration, clean geometric shapes with softly rounded corners, matte flat fills, thin light-grey line accents, strict palette of ink navy #0D141F, deep navy #1B2A38, steel blue #43617A, teal #22808A and light grey #DADDE0, calm and warm-but-sophisticated mood, generous negative space, no gradients, non-photorealistic, illustrated, not a photo, no live-action, no realism`

Style-specific extra NEGATIVE terms (append to the standard NEGATIVE line):

| Style | Extra bans |
|---|---|
| 2, 3 | color, gray midtones |
| 4 | glossy digital look, sharp vector edges |
| 5 | smooth vector gradients, 3D render |
| 6 | perspective distortion, realistic shadows |
| 7 | written words, chalk-drawn letters, bright colored backgrounds |
| 8 | more than two ink colors, smooth gradients |
| 9 | colors outside the palette, red, orange, neon, stock-photo look, corporate handshake clichés |

SPM notes: narrate in French unless told otherwise; "Human & AI" is never translated; warmth comes from people and gesture, sophistication from the palette and space. Mascot mode is optional for SPM; prefer faceless scenes or a simple human figure in palette colours.

## Mascot ideas (character mode)

A mascot is one recurring silent character (the narrator is an off-screen voice, so its mouth stays closed). Write a HOST descriptor once and paste it verbatim in every prompt and in the style-key prompt. Suggestions, always drawn in the chosen style:

- a round-bodied fox in a scarf, curious and quick
- a tall thin robot with a lamp head
- a small owl with round glasses
- a simple human figure with one signature accessory (yellow cap, red backpack)

Faceless mode: no recurring character; each block is a stylistic scene of its narration beat (objects, shapes, landscapes, diagrams, anonymous silhouettes).

## Narrators

The narrator is described in words and repeated identically in every clip prompt (there is no voice catalog and no cloning). Pick one, or the user describes their own.

| # | Narrator descriptor | Best for |
|---|---|---|
| 1 | `warm calm female voice-over, mid-thirties, clear and unhurried, documentary pace` | Most topics |
| 2 | `deep steady male voice-over, forties, authoritative and measured, documentary pace` | History, science, serious topics |
| 3 | `friendly upbeat young male voice-over, natural and conversational, light smile in the voice` | Tech, product, casual explainers |
| 4 | `soft reflective female voice-over, intimate and thoughtful, slightly slower pace` | Personal stories, philosophy |
| 5 | `bright energetic female voice-over, quick and enthusiastic, crisp diction` | Short punchy explainers, education |
| 6 | `dry witty male voice-over, understated humour, deadpan timing` | Opinion pieces, myth-busting |

Voice consistency across separate clips is best effort: identical descriptor text, identical language wording, and optionally the same `--seed` on every block. Only if the user supplies a KIE voice/audio id, add `--audio-id <id>` to every block.
