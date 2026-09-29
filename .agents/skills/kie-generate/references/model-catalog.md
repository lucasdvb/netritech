# Model Catalog

Two models, both through KIE AI. There is no model picker beyond "image or video".

## GPT Image 2.5 Flare (images)

- Script: `scripts/kie_image.py`. KIE ids: `gpt-image-2-5-flare-text-to-image` (no `-i`) and `gpt-image-2-5-flare-image-to-image` (with `-i`). The script switches automatically.
- Aspect `-a`: `1:1`, `4:5`, `3:4`, `2:3`, `9:16`, `16:9`, `21:9`, `auto`, ... Resolution `-r`: `1K` (default), `2K`, `4K`; go higher only when the user asks.
- Up to 16 reference images (`-i`, public URLs). `--background opaque|transparent|auto`.
- No mask/inpaint parameter, no seed. Edits are image-to-image with the source as `-i` and an edit-style prompt ("keep X unchanged, change Y").
- Renders on-image text well. A general model: graphic design, UI, banners, typography, photoreal, illustration, cartoon/characters, logo-style graphics, product concepts, cinematic stills, environments, edits.

Use it for every still: there is no separate cartoon, edit, text, logo or cinematic model; the prompt does the work (see `prompt-engineering.md`).

## Gemini Omni Flash 1.1 (video)

- Script: `scripts/kie_video.py`. KIE id: `google/gemini-omni-flash-1-1`.
- Duration per clip: 4, 6, 8 or 10 s. Aspect: `16:9` or `9:16` only (crop with ffmpeg for 1:1, 4:5, 21:9). Resolution: `1080p` default; `360p`, `720p`, `4k` exist, use only if asked.
- Inputs: up to 7 reference images (`-i`), `--first-frame` / `--last-frame` keyframes, one source video (`--video-url`, optional `--video-start` / `--video-end`, counts as 2 image slots so max 5 images alongside it), `--seed`, `--audio-id` (max 3), `--character-id` (max 3).
- Generates synchronized audio from the prompt: dialogue in quotes, sound effects, music mood written in the text. No separate TTS, music, SFX, lip-sync or voice-clone model.

Use it for every clip: text-to-video, image-to-video, extend, edit a clip, UGC/ad clips, product motion. Longer videos are several clips joined locally (`workflows.md`).

## Which to use

| Brief | Model |
|---|---|
| Poster, banner, UI, typography, infographic, logo-style graphic | Image |
| Photo, product shot, lifestyle, portrait, environment, cinematic still | Image |
| Cartoon / illustrated character, character sheet, mascot | Image |
| Edit, restyle, recolor, remove/add an element on a supplied image | Image (image-to-image) |
| Still ad (headline, bullets, comparison, offer) | Image |
| Storyboard frame or first frame for a clip | Image, then Video with `--first-frame` |
| Motion clip, animate a photo, UGC/ad video, presenter video | Video |
| Extend or edit an existing clip | Video (`--video-url`) |
| Video with speech, sound effects, music mood | Video (audio written in the prompt) |
| Square / 4:5 / 21:9 motion | Video in 16:9 or 9:16, then crop |
| 3D/GLB, standalone audio, voice cloning, face training, upscaling | Not available |

Never invent other model ids or flags; `-m` on the image script is only for a model id the user names.
