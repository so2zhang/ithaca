#!/usr/bin/env bash
# Start Bee Loop for verification: production build on its own port.
# Usage: launch.sh [port=3300] [mode=mock|live]   (live = no DEMO_MODE; needs keys in env for real calls)
set -euo pipefail
PORT="${1:-3300}"; MODE="${2:-mock}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
STATE="${TMPDIR:-/tmp}/bee-loop-verify-$PORT"
cd "$ROOT"
if [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null; then echo "already running on :$PORT (pid $(cat "$STATE.pid"))"; exit 0; fi
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then echo "port $PORT is busy with something we didn't start; pick another port" >&2; exit 1; fi
[ -d node_modules ] || npm ci
[ -f .next/BUILD_ID ] && [ -z "$(find src prompts fixtures -newer .next/BUILD_ID -type f | head -1)" ] || npx next build >/dev/null
DEMO=""; [ "$MODE" = mock ] && DEMO=mock
DEMO_MODE="$DEMO" setsid nohup npx next start -p "$PORT" >"$STATE.log" 2>&1 &
echo $! >"$STATE.pid"
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/" 2>/dev/null | grep -q "Debrief with Bee"; then echo "ready: http://127.0.0.1:$PORT ($MODE) pid $(cat "$STATE.pid") log $STATE.log"; exit 0; fi
  sleep 1
done
echo "not ready after 60s; see $STATE.log" >&2; exit 1
