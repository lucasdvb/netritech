# Ad References

An ad reference is an inspiration video the user wants new ads modeled after, optionally tied to a presenter and/or product. There is no reference processing service: you break the video down locally into a reusable **ad reference card**, then rebuild it with the user's own presenter and product.

## Inputs

- A **local video file** from the user, or a clip generated earlier in this work (a local file).
- If the user supplies anything else (a link to a platform video, a stream), ask for a local file. Don't download or convert other sources.
- Optional binding: one presenter card and one product card per reference (`marketing-avatars.md`, `marketing-products.md`). To bind several, make several cards.

## Constraints

- **Mutually exclusive with hook/setting.** When the user selects an ad reference, don't also use hook or setting blocks (`marketing-setup-items.md`). Either reference-driven or composed-from-blocks.
- Rebuild the structure, pacing and shot logic, not the content: no copied faces, brands, music, exact scripts or protected characters.

## Analyze (local, no permission needed)

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 ref.mp4
mkdir -p ref_frames && ffmpeg -i ref.mp4 -vf "fps=1,scale=640:-1" ref_frames/f_%02d.jpg
```

Read the frames (image files) in order, plus any transcript the user supplies, and write the card:

```
AD REFERENCE CARD
duration / aspect:   {s} / {9:16 | 16:9 | other}
hook (0-3 s):        {what happens, line, visual device}
structure:           {problem -> demo -> proof -> CTA | testimonial | unboxing | ...}
shots:               {n} shots; per shot: {seconds} {framing} {camera move} {action}
pacing:              {cuts per 10 s, beat rhythm}
presenter:           {type, energy, delivery}
setting / look:      {place, light, grade, palette}
on-screen text:      {captions/CTA style and timing (to reproduce in post)}
audio:               {voice style, music mood, sound effects}
CTA:                 {what it asks, how}
transferable rules:  {3 bullets: what to keep}
```

Show the card to the user for corrections.

## Rebuild

1. Map the card onto the video generator (`marketing-modes.md`): pick the nearest mode, take shots as `BEATS`, camera and look from the card, audio from the card's voice/music descriptions.
2. Swap in the user's presenter card and product card with their reference images.
3. Split into clips (4-10 s each) if the reference is longer than 10 s; chain with last-frame continuity (`workflows.md`).
4. Show prompt + clip plan; run only after a yes.
5. Reproduce on-screen text in post (`ffmpeg drawtext`), not in the model.

## Prior generated clip as a reference

For a clip generated earlier, use the same analysis on the local file (or, to keep its style, pass its URL with `--video-url` for an extension or edit, `workflows.md`).
