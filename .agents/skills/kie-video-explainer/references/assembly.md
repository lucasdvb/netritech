# Assembly (local ffmpeg)

All commands here are local: no credits, no approval needed (except `kie_upload.py`, which uploads and needs a yes). Shell state does not persist between calls, so write the work directory literally in each command. `W` below stands for it, e.g. `out/explainer/pyramids`. Clips are named `b01.mp4`, `b02.mp4` ... (two digits, block order).

## Files in the work directory

| File | Content |
|---|---|
| `narration.txt` | the `Block N` / line narration |
| `p01.txt` ... | one final prompt per block |
| `style_key.png` | style key (saved when reachable) |
| `b01.mp4` ... | generated clips |
| `b01_last.png` ... | last frames (chaining) |
| `list.txt` | concat list |
| `narration.srt` | generated subtitles (optional) |
| `final.mp4`, `final_sub.mp4` | outputs |

## Check that a clip was saved

`kie_video.py` prints `url ...` and, if the result host is reachable, `saved <path>`. If there is no `saved` line, the file is not local: give the user the URL and ask them to download it to `W/bNN.mp4` (or paste it). Chaining and assembly both need the local file. Do not continue without it; independent mode (style key `-i`) does not need local frames but assembly still does.

## Last frame for chaining

```bash
ffmpeg -y -sseof -0.2 -i W/b01.mp4 -frames:v 1 -update 1 W/b01_last.png
python3 scripts/kie_upload.py W/b01_last.png
```

The upload prints a public URL; pass it as `--first-frame` to the next block. Look at `b01_last.png` before using it (Read the image): if the style, palette or character drifted, or the frame is mid-transition, stop and propose a fix instead of chaining from it.

## Probe the clips

```bash
for f in W/b??.mp4; do echo -n "$f "; ffprobe -v error -show_entries stream=codec_type,width,height,duration -of csv=p=0 "$f" | tr '\n' ' '; echo; done
```

Expect every clip to have one video and one audio stream, the same size (1920x1080 or 1080x1920 at 1080p), and about 10 s. A clip without audio stream: add silence so the concat keeps audio in sync:

```bash
ffmpeg -y -i W/b03.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo -shortest -c:v copy -c:a aac W/b03_a.mp4 && mv W/b03_a.mp4 W/b03.mp4
```

## Concat

Build the list with absolute paths (zero-padded names keep block order):

```bash
printf "file '%s'\n" "$PWD"/W/b??.mp4 > W/list.txt
```

Default, robust (re-encodes, evens out audio level between clips):

```bash
ffmpeg -y -f concat -safe 0 -i W/list.txt \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -movflags +faststart W/final.mp4
```

Fast, lossless (only when all clips share codec, size and audio format, which they normally do):

```bash
ffmpeg -y -f concat -safe 0 -i W/list.txt -c copy W/final.mp4
```

Verify:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 W/final.mp4
```

Expect about N x 10 seconds (small deviations come from the clips themselves, not from the join). If a level jump between clips remains, normalise each clip first with `-af loudnorm=I=-16:TP=-1.5:LRA=11` into `b01_n.mp4` ... and concat those.

Optional soft crossfade between blocks is not used by default: chained blocks already flow, and independent blocks are meant to be hard cuts.

## Other aspects

The model only makes 16:9 and 9:16. For 1:1 or 4:5, generate 16:9 or 9:16 and crop the finished file:

```bash
ffmpeg -y -i W/final.mp4 -vf "crop=ih:ih" -c:a copy W/final_square.mp4              # 1:1 from 16:9
ffmpeg -y -i W/final.mp4 -vf "crop=ih*4/5:ih" -c:a copy W/final_4x5.mp4             # 4:5 from 16:9 (center crop)
```

Tell the user before generating that the sides are cropped, so scenes must keep the subject centered.

## Burned subtitles (optional)

Timings are estimated from word counts (the narrator's real pace varies), so present them as approximate and offer to shift them with `--offset` after the user has watched the film.

1. Generate the .srt from `narration.txt` (local, offline):

   ```bash
   python3 .agents/skills/kie-video-explainer/scripts/make_srt.py W/narration.txt -o W/narration.srt --offset 0.5 --wps 2.5
   ```

   Use `--wps 2.2` for French, Spanish, Italian, German and Portuguese.

2. Burn them in, 16:9:

   ```bash
   ffmpeg -y -i W/final.mp4 \
     -vf "subtitles=W/narration.srt:force_style='FontName=Anton,FontSize=14,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=40'" \
     -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy W/final_sub.mp4
   ```

   9:16: use `FontSize=11,MarginV=140` so the text sits above the platform UI zone.

Fonts the user chooses from (never pick silently): `Anton` (bold condensed), `Patrick Hand` (friendly handwritten), `Caveat` (script), `Permanent Marker` (marker). Check availability with `fc-list | grep -i "<name>"`; if missing, tell the user and offer an installed alternative (for example `DejaVu Sans`) or a `fontsdir=<folder with .ttf>` option in the filter. Colors in `force_style` are `&HAABBGGRR`: for SPM light grey #DADDE0 text on ink navy #0D141F outline use `PrimaryColour=&H00E0DDDA,OutlineColour=&H001F140D`.

Keep `final.mp4` (no subtitles) as well; `final_sub.mp4` is a derived copy.
