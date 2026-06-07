# AI Task Execution Reference

This file owns ordinary AI task execution gates for this frontend repository. Use it for implementation, documentation, validation, and handoff work that is not already governed by a more specific focused reference.

## Task Gate

Before changing repository state:

- Confirm the current user request explicitly authorizes implementation with wording such as "implement this", "apply the change", "edit the files", "fix it now", "make the change", or an equivalent direct instruction.
- If the request is critique, direction, desired outcome, or a proposed change list without explicit implementation authorization, respond with a proposed approach, affected files, and validation plan, then wait.
- Identify the user-visible behavior, repository rule, product intent, or process rule being changed.
- Identify the owner before editing: backend contract artifact, generated type, executable test, `docs/DESIGN.md`, `ROADMAP.md`, human doc, focused reference, or active plan.
- For API-facing behavior, route exact contract detail to `docs/backend/`.
- Make the smallest coherent change that updates the owner before or alongside the implementation.

## Dirty Worktree Gate

Run `git status --short` before any file edit.

- Treat every existing change as user-owned unless the current task explicitly assigns it to you.
- If files are dirty outside the intended write scope, leave them alone.
- If unexpected changes appear inside the intended write scope before editing, stop and report the file, whether it is inside scope, and the proposed next action.
- If a prior dirty-worktree observation conflicts with the current status, treat the current status as authoritative and reconcile with `git diff`, `git diff --cached`, recent commit history, or reflog only as needed.
- Do not revert, delete, overwrite, normalize, or clean up user-owned changes unless the user explicitly asks for that exact recovery action.

## Branch And Worktree Requests

When a user names a branch or Git worktree as the work target:

- Do not use `main`, the current branch, or the current worktree by default.
- Use or create a non-current, non-`main` branch or linked worktree.
- Use `main`, the current branch, or the current worktree only when the user explicitly asks for that target.

## Execution Loop

Use this loop for ordinary tasks:

1. Load only the instructions and owner documents needed for the change.
2. Define the intended behavior or rule in testable or documentable terms.
3. Check the truth-priority order in `AGENTS.md` when sources conflict.
4. Update the durable owner and implementation together when both are needed.
5. Keep frontend behavior aligned to the imported backend contract and route exact API rules to `docs/backend/`.
6. Run the smallest validation selected by `.agents/references/testing.md`, or the narrower validation explicitly assigned by an active worker prompt.
7. Review the diff for owner drift using `.agents/references/documentation.md` and `.agents/references/reviews.md` when owner boundaries are crossed.
8. Hand off with changed files, validation, skipped checks, and remaining risks.

## Resume And Learning Capture

After context compaction, resume, or summarized handoff, reread the latest user request, `AGENTS.md`, and the most specific governing artifact needed for the next action. Reconcile that resumed context with current worktree state, in-progress validation, active plan or roadmap gates, and newer user instructions before continuing.

Run a learning-capture checkpoint before handoff when validation fails, retries repeat, CI fails, or the user corrects the agent. Decide whether the lesson belongs in an executable test, owner document, focused reference, prompt, active plan update, or no durable rule. Use `.agents/references/references-rules.md` before adding persistent AI guidance, and do not turn one-off mistakes into standing rules without a recurring trigger.

## Validation And Handoff

Use `.agents/references/testing.md` to select validation. Do not run broad npm commands for guidance-only work unless the task changes source code, package scripts, workflows, generated files, or executable behavior.

Final handoff should include:

- changed files
- validation commands run and results
- skipped validation with reasons
- whether `ROADMAP.md` changed, and if so which stable IDs or references changed
- remaining contract, smoke, documentation, or execution risks

Do not commit unless the user asks for a commit or an active plan checkpoint explicitly authorizes the scoped commit.
