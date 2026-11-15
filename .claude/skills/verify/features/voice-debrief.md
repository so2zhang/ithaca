# Voice debrief

Call screen with the Bee orb, live transcript, Mute / End / Switch to text.

## Sub-features
- Mock: replays `fixtures/demo/transcript.json` at speech pace, badge "Recorded debrief · demo mode"
- Live: `/api/voice-session` → signed URL → ElevenLabs session with Bee's prompt for this group
- Live without keys: alert "Couldn't start the voice call…" and Switch to text still works

## How to get to it (user POV)
Plan screen → "Debrief with Bee".

## Driving it with Playwright
Mock: wait for `getByTestId("transcript")` to contain "Ethan", click "End" → "What Bee learned". Live-no-keys: launch with `live`, expect text "Couldn't start the voice call".

## Gotchas
A live call needs a microphone and real keys; headless runs can't prove it. End in mock always submits the full recorded transcript, even if pressed early.
