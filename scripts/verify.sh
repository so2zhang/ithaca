#!/usr/bin/env bash
# Everything: quick checks, unit tests, production build, browser tests (mock + no-key live server).
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/quick-check.sh
npx vitest run
npx next build
npx playwright test --trace off
