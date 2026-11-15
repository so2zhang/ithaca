---
name: verify
description: Drive the real Bee Loop web app (Next.js, phone-framed single page) in a browser to prove user-facing behavior with screenshots. Use after any change to the Plan, debrief (voice/text), extraction, Learned screen, or reset, and before calling a task done.
---

# Verify Bee Loop

Surface: one web page (`/`) with screens Plan → Debrief (voice or text) → "What Bee learned" → next week's Plan. Three API routes back it (`/api/voice-session`, `/api/extract`, `/api/chat`). State lives in the browser's localStorage (`bee-loop-demo-v1`), not on the server, so each browser context is isolated and two instances on different ports never interfere.

## Launch
```bash
bash .claude/skills/verify/launch.sh 3300 mock
```
Builds if `src/`, `prompts/` or `fixtures/` changed since the last build, starts `next start` on the port, and waits until the page renders "Debrief with Bee" (that is the usable state; there is no DB or seed step, the pool is generated in code). `mock` = `DEMO_MODE=mock` (recorded debrief, no network, no keys). `live` = real ElevenLabs + Claude; only useful with `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` exported, and voice needs a real microphone, so a headless agent can't prove the live voice path. Use `live` without keys to check failure screens.

## Doctor
```bash
bash .claude/skills/verify/doctor.sh 3300
```
Confirms the process is the one we started, the page renders, and which mode the server is in (mock / live with voice / live without voice). Run it first whenever anything looks off.

## Drive
Core loop, end to end, as a user:
```bash
node .claude/skills/verify/journey.mjs http://127.0.0.1:3300 voice   # or: text
```
It clicks Reset demo, reads week 1, runs the debrief (voice: waits for the recorded call to reach "Ethan", presses End; text: switches to text, taps three suggested replies, Finish), then the Learned screen, then next week's Plan. It prints each screen's key text and fails on any page error.

For anything else, use Playwright directly with these stable handles (per-feature recipes in `features/`):
- Buttons by role + name: "Debrief with Bee", "End", "Mute"/"Unmute", "Switch to text", "Send", "Finish debrief", "See next week's Plan", "Reset demo", "Try again", "Use recorded debrief", suggested replies `/^Suggested:/`
- Headings: "This week's Plan", "Next week's Plan", "What Bee learned"
- `data-testid`: `plan-card`, `plan-activity`, `why`, `members`, `transcript`, `call-status`, `chat`, `summary`, `stated-vs-revealed`, `before-after`, `people`
- Input: label "Message Bee"
- Force failures with `page.route("**/api/extract", r => r.fulfill({ status: 502, json: {} }))`.

## Evidence
Saved to `evidence/verify/<timestamp>-<path>/` (gitignored; committed proof lives in `evidence/*.png`, produced by `npm run e2e`). A proof includes the screenshot before and after each action plus `state.json` (the localStorage state the app saved: week, weights, signals) to show the side effect, not just the screen. Read the screenshots; don't just check they exist. Mock mode is a real production boundary here (the API routes swap in `fixtures/demo/`), but it proves nothing about prompts or live model behavior; use `npm run eval` (real Claude, ~3¢/case) for that.

## Cleanup
```bash
bash .claude/skills/verify/cleanup.sh 3300
```
Stops only the process `launch.sh` started on that port (pid file in `$TMPDIR`). Evidence in `evidence/verify/` stays.
