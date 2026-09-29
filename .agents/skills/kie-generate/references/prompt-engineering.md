# Prompt Engineering

## Basics

Both models reward concrete, sensory prompts, written as plain prose (not keyword soup).

- **Subject + setting + style**: "a red fox curled in a snowy pine forest, golden hour, cinematic"
- **Camera**: lens (35mm, 85mm), angle (low, overhead), motion (dolly in, tracking shot)
- **Lighting**: rim light, neon glow, moody backlight
- **Style/medium**: oil painting, watercolor, photograph, anime, 3D render, flat vector

Keep image prompts under ~200 words and video prompts under ~250. Put the most important thing first; very long prompts get partially ignored.

## Image prompt frame

`[format/medium] of [subject + action], [setting], [composition/camera], [lighting], [palette/style], [text to render], [constraints]`

- **Text on image**: put the exact words in quotes, say where and how ("headline 'Une équipe qui reste' in bold sans-serif, top-left, Light grey on Ink navy"). Keep it short (under ~8 words per line). Check spelling on the result; propose a corrected prompt if wrong.
- **Palette**: give hex codes and roles ("background #0D141F, accent #22808A").
- **Characters/cartoons**: describe once, precisely (age, hair, outfit, palette, style "flat 2D, thick outlines, cel shading"), and reuse the same wording, or pass the approved image as `-i` for consistency.
- **Logos/marks**: describe shape, meaning and palette; for a supplied logo, pass it as `-i` and say "use the logo from the reference exactly; do not redraw"; if it must be exact, composite it locally with Pillow.
- **Transparent assets**: `--background transparent` and "isolated on a plain background".

## Image-to-image

When passing `-i`, the prompt describes what changes and what stays, not the whole input again.

Bad: "a man with brown hair in a leather jacket holding coffee, made into anime"
Good: "transform into anime style, vibrant colors, soft cel shading; keep the pose, jacket and composition unchanged"

- Edits: "Keep everything unchanged except [change]."
- Multiple references: number them by order ("image 1 is the product, image 2 is the room; place the product on the table in image 2, keep both exactly").
- Identity consistency: pass the same reference image(s) every time plus the same descriptive wording.

## Video prompt frame

`[format + length] [subject/presenter] [action beats with timing] [setting] [camera] [light/style] [audio: dialogue in quotes, sound effects, music mood] [constraints]`

- Beats by time for 8-10s clips: "0-2s hook..., 2-6s demo..., 6-8s payoff...".
- Camera verbs: zooms in, dollies left, sweeping pan, slow push, handheld, whip pan.
- Subject motion: "the dancer spins", "smoke rises slowly".
- **Audio lives in the prompt.** Dialogue in quotes with delivery ("says warmly, 'It just works.'"), sound effects ("soft click, fabric rustle"), music mood ("light upbeat lo-fi bed, low in the mix"). Say "no music" or "no voice" when you want silence. Keep spoken lines short: about 2.5 words per second (an 8s clip fits ~18 words).
- On-screen text and logos are unreliable in video: keep them out of the prompt ("no text or logos on screen") and add them in post.
- One clip = one continuous take or one simple sequence. Don't ask for 6 cuts in 8 seconds.
- Long pieces: one prompt per clip, identical style/character/product wording, previous last frame as `--first-frame` (see `workflows.md`).

## Image-to-video

`--first-frame` anchors the first frame (and `--last-frame` the end). The prompt describes motion and audio, not the static frame again. `-i` reference images guide subject/product/style without fixing the first frame.

## Negative phrasing

Neither model has a `negative_prompt`. Phrase positively:
- Instead of "no blur" -> "tack sharp"
- Instead of "no people" -> "uninhabited landscape"
- Instead of "no text" -> "clean surface, no lettering" (for video, plus "no on-screen text")

## Aspect ratio guidance

- Image: `16:9` landscape, `9:16` vertical/social, `1:1` square, `4:5` feed, `3:4`/`2:3` portrait, `21:9` banner/cinematic.
- Video: only `16:9` or `9:16`; crop the rest locally.

## Safety

Prompts can be rejected (content policy). Avoid:
- Real public figures and likenesses of people who did not consent
- Sexual content
- Trademarks / branded characters

## SPM

For SPM work, read `docs/spm-brand-brief.md` first and use the SPM palette (Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0).
