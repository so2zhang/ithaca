# Reset + persistence

Progress is saved in localStorage so a refresh mid-demo keeps the week; "Reset demo" returns to week 1.

## Sub-features
- Reload after a debrief stays on week 2
- Reset from any screen (including mid-call, which hangs up)

## How to get to it (user POV)
Header button "Reset demo"; browser reload.

## Driving it with Playwright
Complete a loop, `page.reload()`, expect "Next week's Plan"; click "Reset demo", expect "This week's Plan" and `plan-activity` to contain "Rooftop"; reload again, still week 1.

## Gotchas
State is per browser context; a new Playwright context always starts at week 1.
