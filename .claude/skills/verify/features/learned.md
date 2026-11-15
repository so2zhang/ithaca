# What Bee learned

Summary, a "Stated vs. revealed" card with quotes, before/after preference bars, and per-person chemistry/vibe/quote.

## Sub-features
- Extraction failure screen: "Bee couldn't process that debrief." with "Try again" / "Use recorded debrief"

## How to get to it (user POV)
End a voice debrief or Finish a text debrief.

## Driving it with Playwright
Expect `stated-vs-revealed` to contain "I miss being outside", `before-after` to contain "90 → 50", `people` to list Jordan. Force failure with a 502 route on `/api/extract`.

## Gotchas
In mock mode the extraction is always the recorded one, regardless of what was typed in text mode.
