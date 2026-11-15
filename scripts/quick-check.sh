#!/usr/bin/env bash
# Fast checks after every edit: types + lint.
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsc --noEmit
npx eslint . --max-warnings 0
