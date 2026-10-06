#!/usr/bin/env bash
# Renders the review stills and a labelled 3-column contact sheet into out/stills/.
set -euo pipefail
cd "$(dirname "$0")/.."
FRAMES="0,20,45,70,95,120,150,175,200,220,239"
rm -rf out/stills && mkdir -p out/stills
npx remotion render src/index.ts SpmSignal out/stills/frames --frames="$FRAMES" --sequence --image-format=png --concurrency=3
for f in out/stills/frames/element-*.png; do
  n=$(basename "$f" .png | sed 's/element-//')
  mv "$f" "out/stills/frame-$n.png"
done
rmdir out/stills/frames
python3 scripts/contact.py out/stills/contact.jpg out/stills/frame-*.png
