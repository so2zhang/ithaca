---
name: fix-bug
description: Repro-first bug fixing. Use for any bug, error report, failing check, or bad output. Reproduce on the real input before touching code.
---

# Fix a bug, reproduction first

Don't write any fix until step 2 is done.

1. **Capture the real input.** The exact request, record, file, log line, screenshot or model output that triggered the bug. Save it under `fixtures/` (scrub personal info). Don't invent a similar input; use the real one.
2. **Reproduce.** Write a test that fails on that input. Run it and confirm it fails *for the reported reason* (quote the failure). If you can't reproduce it, stop and report what you tried. Don't guess at a fix.
3. **Root cause.** One or two sentences: why it happens, not just where.
4. **Fix.** Smallest change that addresses the root cause. Run `blast-radius` first if it touches shared code.
5. **Prove it.** The new test passes, `bash scripts/verify.sh` passes, and the `verify` skill shows correct behavior on the same input.
6. **Guard.** If the bug was about output quality, add the input as a case in `evals/cases/`.
7. **Review.** Run the `ponytail-review` skill and the `reviewer-correctness` agent. Address everything, re-run until both are clean.
8. **Risk label.** `low` = local to one module, no new deps, no auth/data/security change. Otherwise `high`.

PR body: bug, root cause, fix, repro test name, before/after evidence paths, review verdicts, risk label. Don't merge until the human reviews it and tells you to; then use the `merge-pr` skill.
