---
name: feature
description: Build a feature from a ticket in tickets/ (Goal / Context / Verification scenarios). Tests from the scenarios first, then code, then verify and review.
---

# Build a feature from a ticket

Input: a ticket in `tickets/` following `tickets/TEMPLATE.md`. If the human described the feature in chat instead, use the `write-ticket` skill first and get their OK on the scenarios.

1. Read the ticket and every file it lists under Context. If a scenario is ambiguous or missing an edge case you can see, list your questions and stop. Don't fill gaps with assumptions.
2. Write a short plan: files to change, and which test covers which scenario. If the change touches shared code, run `blast-radius` first.
3. **Tests first.** Turn each verification scenario into a test at the right layer. Use real fixtures from `fixtures/`, not made-up data. Run the tests and confirm they fail.
4. Implement until they pass.
5. Run `bash scripts/verify.sh`, then the `verify` skill for each user-facing scenario.
6. Run the `ponytail-review` skill and the `reviewer-correctness` agent. Address findings, then re-run until both are clean.
7. Commit on a branch named `t<ticket-id>-<slug>` and open a PR with `gh pr create`. Body: scenario checklist with evidence, evidence paths, review verdicts, risk label (`low` = local to one module, no new deps, no auth/data/security change; otherwise `high`).

Stop after opening the PR and send the link. Don't merge until the human reviews it and tells you to; then use the `merge-pr` skill.
