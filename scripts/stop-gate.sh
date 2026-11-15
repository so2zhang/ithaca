#!/usr/bin/env bash
# Blocks Claude from finishing while scripts/verify.sh fails.
# Exit 2 = stderr is fed back to Claude and it keeps working.
input=$(cat)

# Don't loop forever: if we already blocked once this turn, let it stop.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then exit 0; fi

# Not set up yet, or not a git repo: nothing to enforce.
[ -f scripts/verify.sh ] || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Only enforce when non-doc files changed.
changed=$(git status --porcelain | awk '{print $2}' | grep -vE '\.(md|txt)$' | grep -v '^fixtures/')
[ -z "$changed" ] && exit 0

if ! out=$(bash scripts/verify.sh 2>&1); then
  echo "scripts/verify.sh is failing. Fix it before stopping (do not weaken tests):" >&2
  echo "$out" | tail -40 >&2
  exit 2
fi
exit 0
