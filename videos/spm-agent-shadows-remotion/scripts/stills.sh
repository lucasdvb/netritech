#!/usr/bin/env bash
# Render chosen frames as PNG stills: scripts/stills.sh <outdir> <frame> [frame...]
# Bundles once, then renders each frame from the bundle (WebGL via ANGLE/SwiftShader).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:?outdir}; shift
BROWSER=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
BUNDLE=${BUNDLE:-$(mktemp -d)/bundle}
[ -f "$BUNDLE/index.html" ] || npx remotion bundle src/index.ts --out-dir="$BUNDLE" --log=error >/dev/null
mkdir -p "$OUT"
for f in "$@"; do
  name=$(printf "f%03d.png" "$f")
  npx remotion still "$BUNDLE" SpmAgentShadows "$OUT/$name" --frame="$f" --gl=angle \
    --browser-executable="$BROWSER" --overwrite --log=error
  echo "$OUT/$name"
done
