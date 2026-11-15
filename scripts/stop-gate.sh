#!/usr/bin/env bash
# Blocks Claude from finishing while scripts/verify.sh fails.
# Exit 2 = stderr is fed back to Claude and it keeps working.
input=$(cat)
MAX_BLOCKS=3

# Not set up yet, or not a git repo: nothing to enforce.
[ -f scripts/verify.sh ] || exit 0
git_dir=$(git rev-parse --git-dir 2>/dev/null) || exit 0
session=$(echo "$input" | jq -r '.session_id // "default"')
counter="$git_dir/claude-stop-gate-$session"

# Only enforce when non-doc files changed.
changed=$(git status --porcelain | cut -c4- | grep -vE '\.(md|txt)$' | grep -v '^fixtures/')
[ -z "$changed" ] && { rm -f "$counter"; exit 0; }

if out=$(bash scripts/verify.sh 2>&1); then
  rm -f "$counter"
  exit 0
fi

blocks=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
if [ "$blocks" -gt "$MAX_BLOCKS" ]; then
  # Don't loop forever: after MAX_BLOCKS tries, stop and tell the human.
  rm -f "$counter"
  jq -n --arg m "verify.sh still failing after $MAX_BLOCKS attempts. The task is NOT done." '{systemMessage: $m}'
  exit 0
fi
echo "$blocks" > "$counter"
echo "scripts/verify.sh is failing (attempt $blocks of $MAX_BLOCKS). Fix it before stopping (do not weaken tests). If you can't, say so plainly and explain why:" >&2
echo "$out" | tail -40 >&2
exit 2
