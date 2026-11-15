---
name: write-ticket
description: Turn a feature or bug description into a ticket in tickets/ following tickets/TEMPLATE.md, with concrete verification scenarios. Use when the human says "write a ticket", "make a ticket for X", or describes work they want built later.
---

# Write a ticket

Output: `tickets/<NNN>-<slug>.md`, ready for the `feature` skill.

1. **Number it.** Next unused 3-digit number in `tickets/` (start at `001`). Slug: 2–4 lowercase words joined by hyphens. Title line: `# T<NNN>: <title>`.
2. **Ground it in the code.** Read enough of the repo to fill Context with real paths: files likely to change, existing fixtures in `fixtures/`, relevant docs. Don't list paths you haven't confirmed exist. If no fitting fixture exists, say what real input is needed and where it would come from.
3. **Fill the template** (`tickets/TEMPLATE.md`), keeping its headings:
   - Goal: concrete Before/After a user could observe. Out of scope: name the tempting adjacent work.
   - Verification scenarios: given/when/then, each checkable by a test or a screenshot. At least one happy path, one edge case, one failure case (what the user sees when it breaks). No vague words like "works well" or "fast"; use numbers.
4. **Ask, don't assume.** Anything you had to guess (behavior, limits, copy, who can do it) goes in a `## Open questions` section at the end, and you list those questions in chat.
5. Show the human the Goal and scenarios and ask for OK or edits. Apply edits to the file. Don't start building until they say to (then use the `feature` skill).

Don't commit the ticket on its own; it goes in with the feature branch. Several requests at once → one ticket each, unless they can't ship separately.
