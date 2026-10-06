#!/bin/bash
# Installs the dependencies of the motion-reel skill (.claude/skills/motion-reel) in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SKILL="$CLAUDE_PROJECT_DIR/.claude/skills/motion-reel"

# Playwright (pinned in package.json to match the Chromium preinstalled in /opt/pw-browsers)
(cd "$SKILL" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-audit --no-fund)

# Python audio libraries used by music.py, beats.py, mix.py, vo.py, review.py
PY_DEPS="numpy scipy soundfile librosa pillow"
if ! python3 -c "import numpy, scipy, soundfile, librosa, PIL" 2>/dev/null; then
  python3 -m pip install --user -q $PY_DEPS 2>/dev/null \
    || python3 -m pip install --user --break-system-packages -q $PY_DEPS
fi
