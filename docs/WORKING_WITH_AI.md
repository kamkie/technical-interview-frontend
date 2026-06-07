# Working With AI

This document owns human guidance for asking AI agents to plan, implement, validate, review, and prepare releases in this frontend repository.

Detailed AI procedure lives in `AGENTS.md` and the focused `.agents/references/` files. Keep this document as the human entry point and link to those owners instead of copying their full workflows.

Reusable repository prompt recipes live in `.agents/prompts/README.md`. Use them when you want a named session starter for closeout, CI triage, roadmap triage, release readiness, repository state snapshots, or similar recurring workflows.

## Before Asking

Give the AI the current goal, the files it may edit, and the validation you expect. For API-facing work, point it at the imported backend contract artifacts and require contract-first behavior. For docs or procedure work, name the owner document so rules do not end up only in a plan or final response.

When the request fits a specific lifecycle phase, name it directly: intake, orient, route, design, plan, implement, validate, review and close out, commit, or release. `docs/DEVELOPMENT_LIFECYCLE.md` owns those phase definitions.

Tell the AI when it may commit, tag, push, or publish. If you do not grant that permission explicitly, it should leave changes uncommitted.

## Planning Requests

Ask for a plan when work spans multiple owners, milestones, or commits. Research, exploration, and planning subagents are optional for ad hoc work; use them when they reduce ambiguity, split ownership cleanly, or prepare a narrower implementation handoff. A useful planning request should ask the AI to identify:

- the user-visible behavior or repository rule being changed
- the owning contract, spec, test, or document
- dependencies and blockers
- validation for each slice
- files that are out of scope

Plans coordinate execution. Durable rules still belong in `docs/DESIGN.md`, `ROADMAP.md`, `docs/specs/`, `docs/LOCAL_DEVELOPMENT.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, backend contract artifacts, focused AI references, or executable tests.

For active plan execution, expect the planner to schedule a commit checkpoint after each repository-changing task validates. Read-only or no-change tasks should state that no commit is needed.

Active plans under `.agents/plans/` are execution contracts. When asking AI to implement an active plan, tell it to follow the plan's dependency order and route detailed execution questions to `AGENTS.md` and `.agents/references/plan-execution.md`.

## Implementation Requests

For implementation, give the AI a narrow ownership boundary and ask it to inspect the current worktree before editing. State whether existing user changes must be preserved, and call out any files that are read-only.

For repository-changing ad hoc implementation, expect a separate implementation worker subagent with an exact write scope, scoped validation, and stop conditions. Planning, research, and explorer subagents may be skipped when the coordinator already has enough context. `.agents/references/workflow.md` owns the AI role details.

For active plan execution, expect the AI to follow `.agents/references/plan-execution.md`; active-plan tasks keep their plan dependency order, worker assignment rules, validation checkpoints, and commit checkpoint rules.

For frontend API work, point the AI at `docs/backend/` before it changes clients, generated types, auth behavior, CSRF handling, or API error handling.

For UI work, ask for tests at the smallest useful layer and require visible states to come from backend-supported behavior.

## Validation Requests

Ask the AI to choose validation from `.agents/references/testing.md` and current commands from `docs/LOCAL_DEVELOPMENT.md`, unless the task already names commands. For browser smoke, require the AI to state whether the smoke is anonymous, authenticated manual fake-OAuth, or unavailable as automated authenticated smoke because no canonical command exists.

The final handoff should list validation commands, results, skipped checks, and the reason for each skip.

## Review Requests

When asking for review, ask the AI to lead with findings. Good review prompts name the branch, diff, spec, or files to review and tell the AI whether to focus on bugs, contract drift, test gaps, accessibility, security, release risk, or documentation drift.

A review should include file and line references for actionable findings. If no issues are found, the AI should say that clearly and still report residual test or smoke gaps.

## Release Preparation Requests

Release work is maintainer-owned. Ask AI to audit or prepare a release only after the intended scope is integrated and the target release state is clear.

Be explicit about what is authorized:

- metadata edits only
- changelog promotion
- validation
- commit creation
- annotated tag creation
- remote push or publication

Do not rely on a prior plan alone to authorize pushing branches, pushing tags, or publishing a GitHub Release. The current task must request remote publication.

## Handoff Expectations

Ask the AI to report:

- changed files
- validation commands and results
- skipped validation with reasons
- remaining risks or blockers
- commits, tags, pushes, or releases only when those actions actually happened

For AI procedure changes, expect the AI to update the focused owner under `.agents/references/` and keep human docs as concise pointers. For product or design intent changes, expect `docs/DESIGN.md` to be checked alongside any roadmap or implementation updates.
