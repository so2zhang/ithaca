#!/usr/bin/env bash
# Runs quick checks after each edit. Exit 2 = stderr is fed back to Claude.
[ -f scripts/quick-check.sh ] || exit 0
if ! out=$(bash scripts/quick-check.sh 2>&1); then
  echo "scripts/quick-check.sh failed after this edit:" >&2
  echo "$out" | tail -20 >&2
  exit 2
fi
exit 0
