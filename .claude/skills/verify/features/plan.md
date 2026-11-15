# Weekly Plan

The group hangout Bee proposes: when/where (`plan-card`), why this group (`why`), who's going (`members`), and the "Debrief with Bee" button.

## Sub-features
- Week 1 from stated preferences: rooftop drinks, Marcus/Ethan/Jordan/Priya/Claire, "Leans career-driven…"
- Week 2+ after a debrief: heading "Next week's Plan", "Last week you clicked with Jordan (…)", "Back"/"New" badges on members
- Balance + intent chips ("3 women, 3 men…", "Intent-aligned…")

## How to get to it (user POV)
Open the site. After a debrief, "See next week's Plan".

## Driving it with Playwright
`page.getByRole("heading", { name: "This week's Plan" })`; `page.getByTestId("members").getByRole("listitem")` has 5 items; `page.getByTestId("why")` text.

## Gotchas
The Plan is computed in the browser from saved state, so a stale localStorage from an earlier run shows week 2. Click "Reset demo" first.
