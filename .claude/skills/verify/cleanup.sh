#!/usr/bin/env bash
# Stop the instance launch.sh started on this port. Evidence in evidence/verify/ is kept.  Usage: cleanup.sh [port=3300]
PORT="${1:-3300}"; STATE="${TMPDIR:-/tmp}/bee-loop-verify-$PORT"
if [ -f "$STATE.pid" ]; then
  PID=$(cat "$STATE.pid")
  kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null  # whole process group: npx → next → server
  rm -f "$STATE.pid" "$STATE.log"; echo "stopped pid $PID"
else echo "nothing to stop on :$PORT"; fi
