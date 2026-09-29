# Prompt Templates

Write every image and video prompt in English. Write only the narration line (the text inside the quotes) in the user's selected language.

Three things keep the film consistent: one identical STYLE descriptor, one identical NARRATOR descriptor (and HOST descriptor in mascot mode) pasted into every clip prompt, and visual continuity from block to block (first-frame chaining, or the style-key image attached to every clip).

Store each finished prompt as a text file (`p01.txt`, `p02.txt`, ...) and pass it with `"$(cat p01.txt)"` so quotes and apostrophes in the narration never break the shell.

## STYLE descriptor

Write the render style, palette, line character, and finish once, or take one from `styles.md`. Always end with:

```text
non-photorealistic, illustrated, not a photo, no live-action, no realism
```

Examples:

- `flat 2D vector animation, bold clean outlines, solid vibrant flat fills, no shading, no gradients`
- `hand-inked black marker on off-white paper, solid jet-black fills, thin white scratch highlights, marker grain, strictly monochrome`
- `strict monochrome minimalism, black silhouettes on white void, high contrast, lots of negative space`
- `hand-painted storybook gouache, soft textures, warm muted palette, visible brush strokes`

## Style key

One image, generated once (`kie_image.py`, 1K, same aspect as the video: 16:9 or 9:16). It is attached as `-i` to Block 1 and to any re-anchored block.

### Abstract swatch

```text
Pure {STYLE} STYLE REFERENCE plate. No characters, no faces, no people, no objects, no scene, no letters—an abstract style swatch only. A balanced arrangement that demonstrates the rendering grammar clearly: {line quality}, {fill behavior}, {highlight/edge behavior}, {texture/grain}. {palette constraint, with hex if strict}. High contrast, clean background, generous negative space. Flat, raw, hand-illustrated, non-photorealistic. No text, no logos, no watermark.
```

### Mascot key

```text
{STYLE}. Full-body character: {HOST}—a {species/persona} narrator, expressive, clear readable silhouette, looking at camera, centered, simple background. Recurring-character design. No text, no logos, no watermark.
```

### With style-reference images

The user's reference images must be public URLs (`scripts/kie_upload.py` for local files, after the user agrees to the upload). Pass each with a repeated `-i`, and prefix the prompt verbatim, then add the requested swatch or mascot instructions:

```text
Make an Animated Explainer. Take only the visual render style and color grading of the input image(s); mix the styles if there is more than one image. Never use the characters, inscriptions, etc. from the input image(s) unless the instructions below ask you to. Use only the render style, and follow the user's instructions below:
{raw user query / scene}
```

Use references as style donors only. Never copy their people, text, logos, or objects.

## Video block (one 10-second clip)

```text
STYLE: {STYLE tokens}. Every element below is rendered in this identical style, palette and finish.
CONTINUITY: {Block 1 or re-anchored block: "Match the attached reference image exactly." | chained block: "The supplied first frame is the opening image: start from it, keep its style, palette and characters, and evolve into the scene below."}
CHARACTER: {HOST descriptor, mouth closed, never speaks | "none, faceless stylistic scene"}
SCENE: {one scene and one clear action matching the narration}.
MOTION: {camera move and animation behavior: slow push-in, drift, scale shock, hard contrast cut}. Single continuous shot; the last second holds a stable composition.
NARRATION: Off-screen voice-over, {NARRATOR descriptor}, speaking {language}. The voice starts at about 0.5 seconds, finishes by 9 seconds, then a beat of ambient sound. It says exactly: "{narration line}"
AUDIO: {ambient SFX or music mood}, kept quiet under the voice. No other speech, no singing.
NEGATIVE: color drift, photorealism, 3D render, lip-sync, moving lips, subtitles, captions, on-screen text, logos, watermark{, plus style-specific bans}.
```

Rules:

- Paste the same STYLE, NARRATOR and HOST text into every block, character for character.
- The narration line is the only speech. The voice-over belongs to no on-screen character: lips never move, nobody lip-syncs, nothing is written on screen.
- In mascot mode, Block 1 greets by gesture with mouth closed, the final block waves a sign-off, and middle blocks use the same design.
- In faceless mode, every block is a stylistic scene of its narration beat.
- Use one clear action per block, and end on a held, uncluttered composition: the last frame is reused as the next block's opening frame.
- Put numbers in the narration as words so they are pronounced correctly.

Example (chained block, English, faceless):

```text
STYLE: strict monochrome minimalism, solid black silhouettes on an absolute white void, high contrast, lots of negative space, matte, non-photorealistic, illustrated, not a photo, no live-action, no realism. Every element below is rendered in this identical style, palette and finish.
CONTINUITY: The supplied first frame is the opening image: start from it, keep its style, palette and characters, and evolve into the scene below.
CHARACTER: none, faceless stylistic scene
SCENE: A lone black silhouette slowly dissolves at the edges, crumbling into fine drifting sand that scatters into the white emptiness.
MOTION: Very slow push-in; the figure erodes grain by grain and particles drift sideways. Single continuous shot; the last second holds a stable composition of drifting grains on white.
NARRATION: Off-screen voice-over, warm calm female voice-over, mid-thirties, clear and unhurried, documentary pace, speaking English. The voice starts at about 0.5 seconds, finishes by 9 seconds, then a beat of ambient sound. It says exactly: "Nothing built by hand lasts forever. Wind, water and time take a little each year, until only the idea remains."
AUDIO: Low sustained drone and a soft whisper of falling sand, kept quiet under the voice. No other speech, no singing.
NEGATIVE: color, gray midtones, photorealism, 3D render, lip-sync, moving lips, subtitles, captions, on-screen text, logos, watermark.
```

## Narration block

Write one plain line per clip. The clip is 10 seconds and the voice runs roughly 0.5 s to 9 s, so the line must be spoken in about 8 seconds:

| Language | Words per line | Speaking rate |
|---|---|---|
| English | 18 to 22 | about 2.5 words per second |
| French, Spanish, Italian, German, Portuguese | 15 to 19 | about 2.2 words per second |
| Other | 14 to 18, then check the pilot clip | |

```text
Block 1
For four and a half thousand years, the pyramids of Egypt have stood against the desert, silent and immense.
Block 2
They rose along the Nile, the river that fed a civilization ruled by pharaohs believed to be living gods.
```

Rules:

- Use no timecodes, emotion cues, parentheticals, or stage directions.
- Spell numbers out.
- Avoid hard-to-pronounce acronyms and mixed-language words; spell an acronym out phonetically if it matters.
- Set tone through word choice and concrete detail, not through direction.
- Never say "in this video."
- For a topic, hook, build understanding block by block, and end on the payoff.
- For a personal story, keep the user or their narrator persona as protagonist and invent nothing factual.
- A line that is too long gets cut off or rushed at the end of the clip: shorten it rather than hoping.
