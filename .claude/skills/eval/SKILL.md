---
name: eval
description: Run quality evals on the golden set, then do error analysis on the failures. Use after any change to prompts, models, ranking, retrieval, or anything with fuzzy output.
---

# Run evals and analyze failures

Case format (`evals/cases/*.json`):
```json
{
  "id": "short-name",
  "input": "fixtures/<path> or inline input",
  "assertions": [{ "type": "contains|regex|max_latency_ms|max_tokens", "value": "..." }],
  "rubric": ["Specific, checkable criterion", "..."]
}
```

1. Run the project's eval runner (`evals/run.*`; see CLAUDE.md for the command). Use real services, not test fakes. For each case it runs the same code path the product uses, checks the hard assertions, has a judge model grade each rubric item PASS/FAIL with a one-line reason, and appends a row to `evals/results/<timestamp>.jsonl`. It prints pass rate per rubric item, plus latency p50/p95.
2. Compare against the previous results file. Report regressions first.
3. **Error analysis.** Read the raw failing outputs yourself, not just the judge's reasons. Group failures into 3–6 named categories with counts and one example each.
4. For each category, propose one concrete change and say what result would show it worked.

Rules: never edit or delete anything in `evals/cases/` or `evals/holdout/` to raise the score. Holdout only runs when the human asks.
