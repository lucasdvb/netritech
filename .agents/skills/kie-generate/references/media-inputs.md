# Media Inputs

How to pass reference images, keyframes and source videos to the two models.

## Public URLs only

Every input to `kie_image.py` and `kie_video.py` must be a **public URL**. Local files are hosted first (after the user's yes, per the Permission rule):

```bash
python3 scripts/kie_upload.py path/to/file.png            # prints one public URL per file
python3 scripts/kie_upload.py a.png b.png                  # several files
```

Uploads are temporary (KIE deletes them after ~3 days). Don't upload confidential material without saying so. Files generated earlier (`url ...` printed by the scripts) are already public and can be reused directly as inputs. If a source video upload is refused, ask the user for a public link to it.

Accepted types: images `png`, `jpg`/`jpeg`, `webp`; video `mp4`, `mov`, `webm`.

## What each model accepts

| Model | Flag | Meaning | Limits |
|---|---|---|---|
| Image (GPT Image 2.5 Flare) | `-i <url>` (repeat) | reference / source image(s); switches to image-to-image | up to 16 |
| Video (Gemini Omni Flash 1.1) | `-i <url>` (repeat) | reference images for subject, product, style, scene | up to 7 |
| Video | `--first-frame <url>` | image used as the first frame | 1 |
| Video | `--last-frame <url>` | image used as the last frame | 1 |
| Video | `--video-url <url>` | source video to extend or edit | 1 video; counts as 2 image slots (max 5 `-i` alongside it) |
| Video | `--video-start S` / `--video-end S` | segment of the source video, in seconds | |
| Video | `--audio-id <id>` / `--character-id <id>` | ids supplied by the user | max 3 each |

There are no audio files, mask images or video-to-image inputs. Reference audio is not supported; describe the voice and sound in the prompt.

## Referring to inputs in the prompt

Refer by order: "image 1 is the product, image 2 is the presenter". State what must be preserved ("product label and shape exactly as in image 1") and what may change. For `--first-frame`, don't redescribe the frame, describe the motion.

Same reference set on every call keeps identity, product and style consistent across variants and clips.

## Multiple images

```bash
python3 scripts/kie_image.py "Place the sneaker from image 1 on the concrete step from image 2; keep both exactly" \
  -a 4:5 -r 1K -o composite.png -i <sneaker url> -i <step url>
```

## Getting frames out of a video (local)

```bash
ffmpeg -sseof -0.1 -i clip.mp4 -frames:v 1 last.png          # last frame
ffmpeg -ss 3.2 -i clip.mp4 -frames:v 1 frame.png              # frame at 3.2 s
ffmpeg -i clip.mp4 -vf "fps=1,scale=640:-1" frames/f_%02d.jpg # one frame per second (contact sheet source)
```

To analyze a video (hook, pacing, shots), extract frames like this and read them, then write the breakdown yourself (see `marketing-ad-references.md`). There is no scoring model.

## Schema mismatches

- More than 16 (image) or 7 (video) references -> trim; keep the most informative ones.
- `--video-url` plus 6+ images -> drop images to 5 or fewer.
- Non-public URL (local path, expiring private link) -> upload first.
- Video aspect other than `16:9` / `9:16` -> the script rejects it; generate in the nearest supported ratio and crop.
