#!/bin/sh
# Turn a master render into scroll-scrub web assets.
#   sh videos/export-scroll.sh <master.mp4> <out-dir> [fps]
# Writes:
#   <out>/hero-1920-allintra.mp4   every frame a keyframe: instant, exact seeks for video.currentTime scrubbing
#   <out>/hero-1600-g4.mp4         lighter scrub encode (keyframe every 4 frames), good on mobile data
#   <out>/frames/0001.webp …       1600-wide WebP sequence for a <canvas> scrubber (Apple-style)
#   <out>/poster-first.jpg, poster-last.jpg
set -e
IN="$1"; OUT="$2"; FPS="${3:-30}"
[ -f "$IN" ] && [ -n "$OUT" ] || { echo "usage: sh $0 <master.mp4> <out-dir> [fps]"; exit 1; }
mkdir -p "$OUT/frames"
COMMON="-an -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart"
ffmpeg -v error -y -i "$IN" -vf "fps=$FPS" -c:v libx264 -preset slow -crf 20 -g 1 -keyint_min 1 -bf 0 $COMMON "$OUT/hero-1920-allintra.mp4"
ffmpeg -v error -y -i "$IN" -vf "fps=$FPS,scale=1600:-2:flags=lanczos" -c:v libx264 -preset slow -crf 23 -g 4 -keyint_min 4 -bf 0 $COMMON "$OUT/hero-1600-g4.mp4"
rm -f "$OUT"/frames/*.webp
ffmpeg -v error -y -i "$IN" -vf "fps=$FPS,scale=1600:-2:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 "$OUT/frames/%04d.webp"
ffmpeg -v error -y -i "$IN" -vf "scale=1920:-2" -frames:v 1 -q:v 2 "$OUT/poster-first.jpg"
ffmpeg -v error -y -sseof -0.05 -i "$IN" -vf "scale=1920:-2" -frames:v 1 -q:v 2 "$OUT/poster-last.jpg"
echo "wrote $OUT:"; du -sh "$OUT"/*.mp4 "$OUT/frames" | sed 's/^/  /'
