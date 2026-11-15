# Software factory kit

A drop-in `.claude/` setup that works on any project: tickets with verification scenarios, test-first builds, a hook that blocks "done" until checks pass, repro-first bug fixing, two independent reviews, and evals. `/setup-factory` customizes it per project.

Everything below can be done in the Claude Code desktop app; Claude runs the commands and you approve them.

## Once, ever (~20 min)
Paste into Claude Code (Code tab, any folder):
```
Set up my Mac for development: install Homebrew if missing, then node, git, gh and jq via brew. Tell me before any step that needs my password or a browser login. Then run gh auth login with me.
```
Then save this kit to your own GitHub as a template so every project can start from it:
```
Unzip factory-kit.zip, make it a git repo, create a private GitHub repo called factory-kit from it, push, and mark it as a template repository.
```

## New project
On github.com/<you>/factory-kit, click **Use this template** → name the repo → create. Then in Claude Code:
```
Clone <you>/<new-repo> into ~/code and open it. Then /setup-factory
```
It asks what you're building, scaffolds the stack, fills in CLAUDE.md, writes the check scripts, and suggests a first ticket.

## Existing project
In Claude Code, open the project folder:
```
Copy everything from ~/code/factory-kit into this repo except .git and README.md, without overwriting files that already exist (tell me about conflicts). Then /setup-factory
```

## Your loop (every project)
| You want to... | Say |
|---|---|
| Write a ticket | `Use the write-ticket skill:` + what you want |
| Build something | `Use the feature skill on tickets/00X-name.md` (or just describe it) |
| Merge a reviewed PR | `Merge PR <N>` (uses the merge-pr skill) |
| Fix a bug | `Use the fix-bug skill:` + the error, screenshot or failing input |
| Check output quality | `Use the eval skill` |
| Harsh code review | `/thermo-nuclear-code-quality-review` |
| Audit the whole repo | `/ponytail-audit` |
| Keep the verify skill accurate | `/maintain-verification-skill` (every few weeks) |

A normal task: you write a ticket (or have Claude write one) → `use the feature skill` → Claude writes tests, then code → the hook runs the checks → Claude uses the app and screenshots it → the two reviews run → Claude opens a PR → you review it (scenario evidence, screenshots, review notes) → you merge it, or tell Claude `merge PR <N>`.

## Cloud sessions
1. claude.ai/code → connect GitHub → give it access to the repo.
2. Create an environment for the repo and paste in `scripts/cloud-setup.sh` (setup-factory writes it) as the setup script. Add any API keys as environment variables.
3. Start a session and use the same instructions as above. It opens a PR when done.

Everything committed in `.claude/` and `CLAUDE.md` comes along, which is why the skills live in the repo.

## Improving the kit
When you change a skill in one project and it would help everywhere, copy it back to `factory-kit` and push. New projects get it from the template.

## Optional: full plugins (laptop only)
```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/plugin marketplace add michael-denyer/pstack-claude
/plugin install pstack@pstack-claude
```
Adds Ponytail's always-on hooks and pstack's full `/poteto-mode` workflow. pstack-claude is a community port of Lauren Tan's pstack.
