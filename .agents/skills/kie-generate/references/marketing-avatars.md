# Presenters (Avatars)

A presenter is a written card plus, optionally, reference photo(s). It keeps the same person across clips and variants. There are no built-in preset faces or voice cloning: consistency comes from identical wording and identical reference images.

## Preset archetypes vs custom

| | Archetype (written) | Custom (photo) |
|---|---|---|
| Source | The templates below, adjusted to the brand | User-supplied photo(s) of a consenting person |
| Cost | None until a reference still is generated | One upload |
| Diversity | Unlimited, described in words | The real person |
| Use when | Generic ad, fast turnaround | Founder, employee, brand-specific face |

## Archetype template

```
PRESENTER: a {age range} {gender/description} {origin/look if relevant}, {hair}, {skin/face details}, wearing {outfit and colors}, {energy: warm / deadpan / excited}, {voice: pitch, pace, accent, language}.
```

Examples to adapt (change details to fit the brand and audience):

- Friendly peer, 20s-30s: casual knit or tee, natural makeup, quick warm voice.
- Calm expert, 40s: shirt or blazer, glasses optional, slow measured voice, office or studio.
- Fitness/energy creator, 20s: athleisure, high energy, gym or outdoor light.
- Parent/home user, 30s-40s: relaxed clothes, kitchen or living room, practical tone.
- Professional colleague: blazer, tidy hair, bright office, confident warm voice (fits SPM employer/client content).
- Older customer, 60s: everyday clothes, unhurried, credible testimonial tone.

## Custom presenter from photos

1. The user provides 1-3 clear photos (front, three-quarter, neutral light) and confirms the person agreed to appear. No real public figures.
2. After the user's yes, upload: `python3 scripts/kie_upload.py face1.jpg face2.jpg`.
3. Write the presenter card from what is visible (age range, hair, outfit) and pass the photos as `-i` on every clip and still, with "the person in image N, same face, hair and clothing".
4. Optional anchor still: generate one clean reference still with the image model (image-to-image, "keep the person's face exactly, neutral background, waist-up, natural light"), approve it with the user, and use that still as the `-i` / `--first-frame` afterwards.

## Using a presenter in clips

- Copy the presenter sentence verbatim into every clip prompt; add the presenter image(s) to `-i` (product images first).
- For chained clips also pass the previous clip's last frame as `--first-frame`.
- Voice: describe it in the prompt (language, pitch, pace, warmth) and repeat it exactly. There is no voice cloning; `--audio-id` / `--character-id` only if the user supplies ids.
- For UGC modes a specific presenter is optional when the brief just says "a person": write a presenter sentence from the archetypes and keep it constant.

## Cartoon or mascot presenter

Describe once, precisely ("flat 2D, thick outlines, teal hoodie, round glasses"), generate one approved character sheet with the image model, and use that image as `-i` for clips and stills.
