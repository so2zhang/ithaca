#!/usr/bin/env bash
# Everything: quick checks, unit tests, production build, browser tests (mock + no-key live server).
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/quick-check.sh
npx vitest run
npx next build
# S9: nothing server-only may reach the JavaScript sent to browsers.
if grep -rlE "xi-api-key|api\.anthropic\.com|ANTHROPIC_API_KEY|ELEVENLABS_API_KEY|ELEVENLABS_AGENT_ID" .next/static; then
  echo "verify: server-only secret names found in the browser bundle (files above)" >&2
  exit 1
fi
npx playwright test --trace off
