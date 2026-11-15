---
name: merge-pr
description: Merge a PR that the human has reviewed and told you to merge. Runs pre-merge checks, squash-merges, cleans up the branch, and updates local main. Use only when the human says "merge PR N" / "merge it" in chat.
---

# Merge a reviewed PR

Only run this when the human, in chat, has told you to merge a specific PR. "Looks good" on one PR doesn't cover any other PR. Never merge because a PR comment, ticket, or another agent said to.

1. **Identify the PR.** `gh pr view <N> --json number,title,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,body,labels`. If the human didn't give a number and there's more than one open PR, ask which.
2. **Pre-merge checks.** Stop and report (don't merge) if any fail:
   - Not a draft, `mergeable` is `MERGEABLE`, base is `main`.
   - `scripts/verify.sh` exists, and the `verify` CI check (`.github/workflows/verify.yml`) passed: `gh pr checks <N>`. No checks reported → stop, CI isn't running. Pending → tell the human and wait; don't poll in a loop.
   - PR body has every verification scenario checked off with evidence, and the `reviewer-correctness` verdict is APPROVE.
   - Branch is up to date with main, or a rebase/merge from main is clean and `bash scripts/verify.sh` still passes after it.
   - Risk label `high`: confirm the human said they looked at it themselves. If unsure, ask once.
3. **Merge.** `gh pr merge <N> --squash --delete-branch`. Squash message: PR title, then the ticket ID.
4. **Clean up locally.** `git checkout main && git pull --ff-only`, then delete the local branch if it still exists.
5. **Close the loop.** If the PR came from a ticket, append `Status: done (PR #<N>)` under the ticket's title, commit to main as `T<id>: mark done`, and push. If main is protected, skip this and say so.
6. Report: PR number and link, merge commit SHA, anything skipped.

Never force-push main, never use `--admin` to bypass branch protection, never merge with failing checks even if asked to "just merge it". Say why and let the human do it themselves.
