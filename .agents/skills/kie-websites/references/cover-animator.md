# Cover animator (~6s reveal clip)

Turn a finished cover image (the plain generation from `references/asset-system.md`
item 6, before the 1200x630 crop) into a short reveal animation: the hero scene
moves, the typography and plates fly in, and the last frame lands exactly on the
approved cover. Uses: a hero intro band, a social/preview video, a launch teaser.

> **PERMISSION-GATED.** The clip costs credits. OFFER it ("want a short cover clip
> to go with the cover image?") and only run it after the user says yes, after
> showing the final prompt, model (Gemini Omni Flash 1.1), aspect, resolution and
> duration, and number of outputs (one). Uploading the cover so it can be used as a
> frame also needs a yes. A retry is a new ask.

## The trick: end-frame reveal

`kie_video.py` accepts a last frame (`--last-frame`). Pass the finished cover as
the LAST frame and describe the buildup: this pins the video to finish on the
approved cover while the model invents the entrance. Do NOT pass it as
`--first-frame` (that drifts away from the cover instead of revealing it).

## Workflow

### 1. Read the cover's content

Use the **plain full-bleed cover** (the uncropped 16:9 generation), NOT the 1200x630
OG crop. Look at the image and note the hero subject, background, title text,
tagline, pill CTA, and logos: you'll reference these concretely in the prompt. The
model only offers 16:9 and 9:16; a cover in another ratio needs a 16:9 or 9:16
re-composition first (ask).

### 2. Design the beats (~6s), all derived from the cover's actual content

1. **0-2s — scene alive, no text yet.** The hero scene exists and moves
   contextually: fur ripples, stars orbit, clouds drift, lights flicker, camera
   pushes in slowly. Name the motion that fits THIS cover's subject.
2. **2-4.5s — text entrance.** The title pops/slides/bounces in (match the motion
   to the typography: pixel type snaps in block by block, chrome bubble letters
   inflate, condensed uppercase slams down), the tagline fades up, the pill CTA
   slides in with a soft bounce.
3. **4.5-6s — settle.** Micro-motion only; everything eases into the exact final
   composition (the last frame).

### 3. Generate

Host the cover if it only exists locally, then run once:

```bash
python3 scripts/kie_upload.py site/refs/cover.png        # prints a public URL (~3 days)
python3 scripts/kie_video.py "<see template>" -a 16:9 -r 1080p -d 6 \
  --last-frame <cover url> -o site/refs/cover-anim.mp4
```

Duration is 4, 6, 8 or 10 s (6 by default). The model generates audio; ask for
silence in the prompt unless the user wants sound.

Prompt template — fill from your beat design, keep the ending anchor sentence:

> Premium 6-second motion cover reveal, smooth cinematic easing, silent. The scene
> starts WITHOUT any text or plates: [SCENE AT START + CONTEXT MOTION — e.g.
> "the fluffy lime creature slowly rotates, its fur rippling in the light,
> stars drifting"]. Then the title "[TITLE TEXT]" [ENTRANCE MOTION matched to
> its typography], the tagline fades up beneath it, and the small rounded pill
> button slides in with a soft bounce. All elements ease precisely into their
> final positions and the video ends exactly on the provided last frame, holding
> still for the last moments. Subtle camera push-in, no flicker, no extra text,
> no new objects.

If animating an OG-style cover with a frame or capsule, append: "The solid color
frame, corner dots and capsule shape stay perfectly static at all times."

### 4. Wire into the site

Take the mp4 (saved by `-o`; if the result host is blocked, ask the user to save
the printed URL to that path), strip audio and compress:
`ffmpeg -i site/refs/cover-anim.mp4 -an -c:v libx264 -crf 23 -pix_fmt yuv420p
-movflags +faststart site/public/assets/cover-clip.mp4` (plain HTML:
`site/assets/cover-clip.mp4`), and extract a poster
(`ffmpeg -i ... -ss 0 -frames:v 1 cover-clip-poster.png`). Reference the file
same-origin from a muted, `playsinline` `<video>` with the poster, and static
final frame under `prefers-reduced-motion`. Review the result: if the ending
visibly drifts from the cover or extra text appears mid-video, propose one
regeneration naming the flaw (e.g., "the title must not change after it lands")
and ask before running it.

For a standalone "animate this cover" request, just save the mp4 as
`<name>_cover_anim.mp4` and show it.

## Deviations

The user's wishes win: other durations, with sound, animating the OG version,
looping intent (then ask for subtle motion and no big entrance; give the same image
as both `--first-frame` and `--last-frame`), vertical covers (`-a 9:16`).
