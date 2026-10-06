#!/usr/bin/env bash
# Master H.264 (CRF 16, yuv420p, silent) plus an all-intra copy (-g 1) for scroll-scrubbing.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.ts SpmSignal out/spm-signal.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p --muted --image-format=png --concurrency=3
FF=$(command -v ffmpeg || echo node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg)
"$FF" -y -v error -i out/spm-signal.mp4 -an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -g 1 -keyint_min 1 -sc_threshold 0 -movflags +faststart out/spm-signal-scrub.mp4
