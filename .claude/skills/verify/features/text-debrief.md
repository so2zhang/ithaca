# Text debrief

Chat fallback with Bee (`chat`), message box ("Message Bee"), Send, "Finish debrief".

## Sub-features
- Mock: Bee replays recorded lines in order; a "Suggested:" button offers Maya's recorded reply
- Live: `/api/chat` → Claude replies as Bee
- Reply failure shows "Bee couldn't reply…" and Finish still works after one user message

## How to get to it (user POV)
Call screen → "Switch to text".

## Driving it with Playwright
Click `/^Suggested:/` (mock) or fill "Message Bee" + "Send"; expect `chat` to contain Bee's next line ("Let's start with Ethan"); "Finish debrief" → "What Bee learned".

## Gotchas
"Finish debrief" is disabled until the user has sent at least one message.
