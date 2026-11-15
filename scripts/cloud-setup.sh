#!/usr/bin/env bash
# Everything a fresh Linux machine needs to run scripts/verify.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
# Claude Code cloud sessions ship Chromium already; elsewhere (e.g. GitHub Actions) install it.
if [ -z "${CLAUDE_CODE_REMOTE:-}" ]; then npx playwright install --with-deps chromium; fi
