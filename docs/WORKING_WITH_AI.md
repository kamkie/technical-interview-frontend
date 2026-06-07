# Working With AI

This document owns human guidance for asking AI agents to plan, implement, validate, review, and prepare releases in this frontend repository.

Detailed AI procedure lives in `AGENTS.md` and the focused `.agents/references/` files. Keep this document as the human entry point and link to those owners instead of copying their full workflows.

## Before Asking

Give the AI the current goal, the files it may edit, and the validation you expect. For API-facing work, point it at the imported backend contract artifacts and require contract-first behavior. For docs or procedure work, name the owner document so rules do not end up only in a plan or final response.

Tell the AI when it may commit, tag, push, or publish. If you do not grant that permission explicitly, it should leave changes uncommitted.

## Planning Requests

Ask for a plan when work spans multiple owners, milestones, or commits. For ad hoc implementation work, expect the repository workflow to use a planning subagent before a separate implementation subagent. A useful planning request should ask the AI to identify:

- the user-visible behavior or repository rule being changed
- the owning contract, spec, test, or document
- dependencies and blockers
- validation for each slice
- files that are out of scope

Plans coordinate execution. Durable rules still belong in `docs/DESIGN.md`, `ROADMAP.md`, `docs/specs/`, `docs/LOCAL_DEVELOPMENT.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, backend contract artifacts, focused AI references, or executable tests.

Active plans under `.agents/plans/` are execution contracts. When asking AI to implement an active plan, tell it to follow the plan's dependency order and route detailed execution questions to `AGENTS.md` and `.agents/references/plan-execution.md`.

## Implementation Requests

For implementation, give the AI a narrow ownership boundary and ask it to inspect the current worktree before editing. State whether existing user changes must be preserved, and call out any files that are read-only.

For ad hoc implementation, expect one planning subagent and a separate implementation subagent unless the current task explicitly changes that workflow. The coordinator should keep worker prompts scoped, avoid sharing full thread history, and use `.agents/references/workflow.md` for role details.

For frontend API work, require the AI to read `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, and `docs/backend/README.md` before changing clients, generated types, auth behavior, CSRF handling, or API error handling.

For UI work, ask for tests at the smallest useful layer and require visible states to come from backend-supported behavior. Do not ask the AI to add CORS-first flows, JWT, bearer-token auth, hard-coded provider paths, or backend-only procedures.

## Validation Requests

Ask the AI to choose validation from `docs/LOCAL_DEVELOPMENT.md` unless the task already names commands. For app or tooling changes, expect:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

For docs-only changes, expect `npm run lint:markdown` plus `git diff --check`, unless a narrower explicit task says otherwise. For API type workflow changes, include `npm run api:types:check`. For browser smoke, require the AI to state whether the smoke is anonymous, authenticated manual, or unavailable because credentials and a canonical command do not exist.

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
