# Troubleshooting

Do not retry or regenerate automatically: explain, propose the fix, ask (Permission rule).

## Key

- `KeyError` / `FileNotFoundError` on `.mcp.json` or `KIE_AI_API_KEY` -> the key is missing. Ask the user to set `KIE_AI_API_KEY` in the environment or add it to the kie-ai server env in `.mcp.json`.

## Task creation

- `createTask failed: {...}` -> read the message in the braces. Typical causes: not enough credits (tell the user), an invalid parameter (aspect, duration, resolution outside the allowed set), or an input URL that is not public or has expired (re-upload after a yes).
- Argparse `invalid choice` -> the value is outside the scripts' set. Video: `-a` 16:9/9:16, `-d` 4/6/8/10, `-r` 360p/720p/1080p/4k. Image: `-r` 1K/2K/4K.

## Job lifecycle

- `failed: <code> <message>` -> the generation failed server-side. Often content policy (real people, sexual content, trademarks, branded characters) or an unusable input. Rephrase, then ask before rerunning.
- The script polls with no timeout of its own; a very slow video can take several minutes. If it seems stuck, tell the user and ask whether to wait.

## Result delivery

- `download failed (...)` -> the sandbox blocks `tempfile.aiquickdraw.com`. Give the user the printed `url`; nothing is lost. Local steps that need the file (ffmpeg, PIL) need the user to download it or a network path that allows it.

## Quality problems (propose, then ask)

| Symptom | Proposed fix |
|---|---|
| Wrong or misspelled text on an image | Shorten the text, put it in quotes with position/font, reduce other detail |
| Product or logo altered | Pass clean reference images, add "exactly as in image 1, do not redraw", composite the logo locally |
| Character drifts between clips | Same reference images and wording every clip, previous last frame as `--first-frame` |
| Video has garbled on-screen text | Remove text from the prompt, add captions in post |
| Speech too long / cut off | About 2.5 words per second; shorten the line or use a 10 s clip |
| Wrong aspect ratio for the channel | Video: crop with ffmpeg; image: change `-a` |
| Seam between joined clips | Start the next clip from the previous last frame; crossfade with ffmpeg |

## ffmpeg

- Concat with `-c copy` fails or stutters -> re-encode as in `workflows.md` (`-c:v libx264 -c:a aac`).
- No audio track in a clip -> add `-an` handling or generate the clip with audio described in the prompt.
