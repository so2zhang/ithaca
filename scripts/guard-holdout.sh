#!/usr/bin/env bash
# Blocks shell commands that touch evals/holdout/. Read/Grep/Glob/Edit are
# blocked by permissions.deny in .claude/settings.json.
# Exit 2 = the tool call is refused and stderr is shown to Claude.
cmd=$(jq -r '.tool_input.command // ""')
if echo "$cmd" | grep -qE 'evals/holdout|holdout/'; then
  echo "evals/holdout/ is off limits to the agent. To run the holdout set, ask the human; the eval runner reads it via EVAL_SET=holdout." >&2
  exit 2
fi
exit 0
