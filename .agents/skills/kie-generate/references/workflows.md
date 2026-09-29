# Workflows

Local recipes built on the two scripts plus `ffmpeg`. Each generation step follows the Permission rule (show prompt, model, aspect, duration/resolution, number of outputs; wait for a yes). The ffmpeg steps are local and need no permission.

| Workflow | Use when |
|---|---|
| Long video | The piece is longer than 10 s |
| Continuity chain | Several clips must share character, product and look |
| Extend | Continue an existing clip |
| Draw-to-edit | Edit a source video from an edited/sketched frame at a timestamp |
| Reframe | Another aspect ratio for an existing video |
| Crop to 1:1 / 4:5 / 21:9 | Feed or banner formats for new clips |
| Still-to-video | Approve a still first, then animate it |

## Long video

1. Write a clip plan: one row per clip (4/6/8/10 s), beat, camera, audio line. 15 s = 10 + 6, 20 s = 10 + 10, 30 s = 3 x 10.
2. Give every prompt the same style block (look, palette, lens, lighting) and the same character/product wording.
3. Generate clip 1. For each next clip, take the previous clip's last frame and pass it as the first frame:
   ```bash
   ffmpeg -sseof -0.1 -i clip1.mp4 -frames:v 1 last1.png
   python3 scripts/kie_upload.py last1.png
   python3 scripts/kie_video.py "<clip 2 prompt>" -a 9:16 -d 8 --first-frame <last1 url> -o clip2.mp4
   ```
   Add `-i <reference url>` for the character/product references on every clip.
4. Join locally:
   ```bash
   printf "file 'clip1.mp4'\nfile 'clip2.mp4'\n" > list.txt
   ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -crf 18 -c:a aac -movflags +faststart out.mp4
   ```
   Trim overshoot with `-t <seconds>` on the output. Crossfade audio between clips with `acrossfade` if the seam is audible.

## Extend

Continue a clip in the same scene:

```bash
python3 scripts/kie_video.py "Continue the shot: the camera keeps pushing in as she opens the box; same room, same light, same voice" \
  -a 9:16 -d 8 --video-url <clip url> --video-start 5 --video-end 8 -o clip_ext.mp4
```

The source counts as 2 image slots. Join the result to the original with the concat recipe.

## Draw-to-edit (edit a video from an edited frame)

Inputs: source video, an edited/sketched frame image, the timestamp of that frame, an instruction.

1. Extract the frame at the timestamp (`ffmpeg -ss 3.2 -i source.mp4 -frames:v 1 frame.png`); the user edits or sketches it, or you edit it with the image model (image-to-image, "keep everything unchanged except ...").
2. Generate the edit with the source segment plus the edited frame as reference:
   ```bash
   python3 scripts/kie_video.py "Apply the change shown in image 1 (red jacket) to the whole clip; keep motion, camera, timing and audio unchanged" \
     -a 16:9 -d 8 --video-url <source url> --video-start 0 --video-end 8 -i <edited frame url> -o edited.mp4
   ```
3. Say honestly that this is a prompt-guided edit, not a frame-locked one; propose a rewording if the change is partial.

## Reframe

- **Crop** (fastest, exact framing you control), e.g. 16:9 to 9:16 centered on the subject:
  ```bash
  ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" -c:a copy out_916.mp4
  ```
  Shift the x offset to follow the subject.
- **Regenerate** when cropping loses the subject: extract a frame, recompose it with the image model (`-a 9:16`, "extend and recompose this frame as a vertical image, keep subject and style"), then run video with that image as `--first-frame` and `-a 9:16`, repeating the original prompt.

## Crop to 1:1 / 4:5 / 21:9

Generate in `16:9` or `9:16`, then crop:

```bash
ffmpeg -i in_916.mp4 -vf "crop=iw:iw*5/4:0:(ih-iw*5/4)/2" out_45.mp4      # 9:16 -> 4:5
ffmpeg -i in_916.mp4 -vf "crop=iw:iw:0:(ih-iw)/2"          out_11.mp4      # 9:16 -> 1:1
ffmpeg -i in_169.mp4 -vf "crop=ih:ih:(iw-ih)/2:0"          out_11.mp4      # 16:9 -> 1:1
ffmpeg -i in_169.mp4 -vf "crop=iw:iw*9/21:0:(ih-iw*9/21)/2" out_219.mp4    # 16:9 -> 21:9
```

Leave safe margins in the prompt ("subject centered, room around it") when a crop is planned.

## Still-to-video

1. Generate and approve a still with the image model (correct aspect: 16:9 or 9:16 for video use).
2. Upload it and pass it as `--first-frame`; the video prompt describes motion, camera and audio only.

## Captions, logos, text (local)

Model text in video is unreliable. Add captions with `ffmpeg` `drawtext` (or `subtitles` with an `.srt`), logos with `overlay`; for stills use Pillow.

## Results

`kie_video.py` / `kie_image.py` print `url ...` and save `-o` when the download works; there is nothing to fetch later. Keep the printed URLs in the conversation so clips can be reused as inputs (they are public, temporary).
