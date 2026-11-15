# T001: Bee Loop demo (Plan → voice debrief → learned profile → next Plan)

## Goal
Before: empty repo.
After: a Next.js app, phone-framed, where Maya (Austin) sees this week's group Plan, debriefs with Bee by voice (or text), sees what Bee learned (per-person signals + before/after preference weights with quotes, stated-vs-revealed flagged), and sees next week's Plan regenerate with a grounded "why" line. `DEMO_MODE=mock` runs the whole flow with no network.
Out of scope: auth, database, real Bumble data, a real matcher, multi-user state, production hardening.

## Context
- Files: `src/lib/matcher.ts` (stand-in for Bumble's matcher), `src/lib/profile.ts` (apply updates), `src/lib/extraction.ts` (Claude + zod + retry), `src/app/api/*`, `src/components/*`, `prompts/*.md`, `scripts/seed.ts` → `src/data/users.json`
- Fixtures: `fixtures/demo/transcript.json`, `fixtures/demo/extraction.json` (Maya's scripted debrief, used by mock mode and tests)
- Docs: ElevenLabs Agents React SDK (`@elevenlabs/react` 1.22, signed URL via `GET /v1/convai/conversation/get-signed-url`); Anthropic structured outputs (`betaZodOutputFormat`)
- Constraints: keys server-side only; voice via signed URL; one Claude call per extraction (+1 retry max); mobile-first; footer "Concept prototype by Sophia Zhang, not affiliated with Bumble."

## Verification scenarios
Each one must pass with evidence (test name or screenshot path).
- [x] S1 Given Maya's stated preferences, when the app loads, then this week's Plan shows 6 people (Maya + 5), no gender above 60%, everyone intent-compatible, a venue, a time, and Jordan is in the group.
  Evidence: `tests/matcher.test.ts` "S1 week 1 Plan…"; `e2e/demo.spec.ts` "S1/S3/S4 scripted demo"; `evidence/01-week1-plan.png`
- [x] S2 Given the seed script, when run twice, then output is byte-identical to `src/data/users.json` (~60 users, ages 22–35, all fields present).
  Evidence: `tests/seed.test.ts` "S2 seed data" (61 users)
- [x] S3 Given the mock debrief, when the call ends, then the Learned screen shows per-person signals and a before/after card where at least one change is flagged "stated vs revealed" with a quote from the transcript.
  Evidence: `tests/profile.test.ts` "S3 applying the recorded debrief"; e2e "S1/S3/S4 scripted demo"; `evidence/02-voice-call.png`, `evidence/03-learned.png`
- [x] S4 Given the updated profile and outcome signals, when next week's Plan is shown, then at least 2 members differ, Ethan (wants_to_see_again = no) is excluded, Jordan (yes) returns, and a "why" line names Jordan and quotes Maya's evidence.
  Evidence: `tests/matcher.test.ts` "S4 next week's Plan…"; `evidence/04-week2-plan.png`
- [x] S5 Edge: outcome signals naming unknown people, or LLM weights outside 0–1 / jumps > 0.5, are ignored or clamped; `old_weight` always comes from the real profile, not the LLM. Duplicate people/attributes can't stack or double-seat; evidence quotes must be her own words.
  Evidence: `tests/matcher.test.ts` "S5 …"; `tests/profile.test.ts` "S5 guarding against bad LLM output"; `tests/extract.test.ts` (duplicates, made-up quotes)
- [x] S6 Failure: Claude returns invalid JSON once → one retry succeeds; invalid twice → the UI shows an error with "Use recorded debrief" instead of crashing.
  Evidence: `tests/extract.test.ts` "S6 …" (retry/give-up); e2e "S6 extraction failure…"; `evidence/06-extract-error.png`
- [x] S7 Failure: voice session can't start (no key / network) → the user sees a message and can switch to text; text debrief reaches the same Learned screen.
  Evidence: `tests/routes.test.ts` (503/502); e2e "S7 live mode with no keys…", "S7 text fallback…"; `evidence/07-voice-unavailable.png`, `evidence/05-text-fallback.png`
- [x] S8 Reset demo restores week 1 state after a completed loop.
  Evidence: e2e "S8 progress survives a refresh, and Reset demo restores week 1"
- [x] S9 Security: no API key reaches the browser bundle; `/api/voice-session` returns a signed URL plus Bee's (non-secret) prompt for this group, never a key.
  Evidence: `tests/routes.test.ts` "S9 voice session keeps the key server-side"; `scripts/verify.sh` bundle grep after `next build`

Not proven here (no keys in this environment): a real ElevenLabs call and real Claude extraction. `npm run eval` covers extraction once a key is set.
