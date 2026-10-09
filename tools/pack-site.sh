#!/bin/sh
# Makes life-os-site.zip: only the files the app serves, ready to drop on Netlify (or any static
# host). No package.json, tests or tools, so no host tries to "build" it.
# Usage: sh tools/pack-site.sh [out.zip]
set -e
cd "$(dirname "$0")/.."
out="${1:-life-os-site.zip}"
case "$out" in /*) ;; *) out="$PWD/$out" ;; esac
rm -f "$out"
git ls-files -z index.html manifest.webmanifest sw.js netlify.toml css js assets server/worker.js | xargs -0 zip -q -X "$out"
echo "$out"
