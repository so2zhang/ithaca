---
name: setup-factory
description: Customize this software-factory kit for the current project. Fills in CLAUDE.md, writes the check scripts, sets up tests, real-data fixtures, evals and the verify skill. Use for /setup-factory, a new repo, or a repo that just got the kit copied in.
---

# Set up the factory for this project

Goal: after this, `feature` and `fix-bug` work end to end in this repo. Ask the human whenever a step needs a decision; don't guess.

1. **Understand the project.**
   - Existing code: read the README, package manifests, folder structure, existing tests and CI. Run the app if you can.
   - Empty repo: ask what they're building, who it's for, and any stack preference. Propose a stack in two lines (default to boring, well-documented choices) and scaffold it with the official starter after they agree.
2. **Fill CLAUDE.md.** Replace every `<...>` with real content. Keep it short. Ask the human for the Review checklist risks if you can't tell.
3. **Write the check scripts** for this stack:
   - `scripts/quick-check.sh`: typecheck + lint, under ~20s
   - `scripts/verify.sh`: quick-check + unit tests + integration/e2e tests. For UI apps, use Playwright (web or Electron). On Linux with no display (cloud sessions set `CLAUDE_CODE_REMOTE=true`), wrap GUI tests in `xvfb-run -a`.
   - Install any missing test tooling, add one trivial passing test per layer, and run both scripts until they pass.
4. **Real data.** Ask the human where realistic inputs come from (prod data, recordings, screenshots, sample files). Create `fixtures/` subfolders for them and a README saying what each holds. Suggest putting ~20% into `evals/holdout/`. If prod data has personal info, propose how to scrub it before saving.
5. **Test seams.** Add env-var switches so tests can feed fixtures in place of live inputs and fake any paid or slow service (LLM, payments, email). Document them in CLAUDE.md.
6. **Verify skill.** Once the app runs, run the `create-verification-skill` skill to generate `.claude/skills/verify/`.
7. **Evals** (only if the product has fuzzy output like LLM responses, search or ranking): write `evals/run` in the project's language following the `eval` skill, plus 3 example cases for the human to review.
8. **Cloud readiness.** Write `scripts/cloud-setup.sh` with everything a fresh Linux VM needs to run `scripts/verify.sh` (dependency install, system packages, xvfb if there's a GUI). Tell the human to paste it into the cloud environment's setup script. `.github/workflows/verify.yml` runs the same script, then `verify.sh`, on every PR; push a branch and confirm it passes with `gh pr checks`.
9. **Finish.** Run `scripts/verify.sh` once more, commit as "set up software factory", and report: what you filled in, what still needs the human (fixtures to collect, rubrics to review), and a suggested first ticket.
