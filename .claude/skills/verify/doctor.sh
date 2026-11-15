#!/usr/bin/env bash
# Read-only: is the instance on this port ours, up, and in the mode we think?  Usage: doctor.sh [port=3300]
PORT="${1:-3300}"; STATE="${TMPDIR:-/tmp}/bee-loop-verify-$PORT"
if [ -f "$STATE.pid" ] && kill -0 "$(cat "$STATE.pid")" 2>/dev/null; then echo "ok   process ours (pid $(cat "$STATE.pid"))"; else echo "FAIL no instance we started on :$PORT"; exit 1; fi
curl -fsS "http://127.0.0.1:$PORT/" | grep -q "Debrief with Bee" && echo "ok   page renders the Plan" || { echo "FAIL page not rendering"; exit 1; }
MODE=$(curl -sS -X POST "http://127.0.0.1:$PORT/api/voice-session" -d '{"weights":{"career":0.9,"outdoors":0.2,"creative":0.4,"nightlife":0.6,"bookish":0.5},"signals":[]}')
case "$MODE" in *'"mock":true'*) echo "ok   mode: mock (recorded debrief, no network)";; *signedUrl*) echo "ok   mode: live, ElevenLabs reachable";; *) echo "info mode: live, voice unavailable -> $MODE";; esac
