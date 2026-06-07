# AI Project Instructions

This repository is the first-party browser frontend for the sibling backend repository `technical-interview-demo`.

Keep AI guidance lean and frontend-specific. Route detailed procedure to focused references instead of duplicating it here.

## Core Rule

Frontend behavior follows the backend contract. Agents must not invent endpoints, request fields, authentication headers, CORS requirements, or alternate transports.

Before changing repository state, use `.agents/references/execution.md` and preserve these root gates:

- the current user request must explicitly authorize implementation
- run `git status --short` before editing
- treat existing or unexpected changes as user-owned
- identify the behavior or repository rule being changed and its durable owner
- update the owner before or alongside implementation
- make the smallest coherent change
- run the smallest applicable validation and report anything skipped

Stop and clarify when the intended behavior cannot be described clearly enough to test, document, or route to an owner.

## Truth Priority

Use this order when sources conflict:

1. Explicit user request in the current task.
2. Imported backend OpenAPI contract: `docs/backend/approved-openapi.json`.
3. Imported backend frontend guidance: `docs/backend/FRONTEND_AI_CONTRACT.md`.
4. Backend REST Docs sources from `technical-interview-demo`, when consulted directly.
5. Frontend executable specs and type checks.
6. Frontend docs in this repo: `docs/DESIGN.md`, `README.md`, `SETUP.md`, `ROADMAP.md`, and this file.

If imported backend artifacts appear stale or conflict with the backend repository, follow `docs/backend/README.md`.

## Local Workflow

Use `docs/LOCAL_DEVELOPMENT.md` and `package.json` for current runtime, package manager, npm scripts, and local workflow details. Use `.agents/references/testing.md` for validation selection.

## Instruction Map

Start with this file and the user's request. Load only the owner files needed for the current task, and do not bulk-load generated contract files unless exact schema details are required.

Focused AI references:

- `.agents/references/architecture.md`: route, API/client, component, test, and abstraction placement.
- `.agents/references/code-style.md`: TypeScript, React, CSS, accessibility, and edit shape.
- `.agents/references/documentation.md`: artifact routing and cross-file alignment.
- `.agents/references/execution.md`: implementation authorization, dirty-worktree handling, ordinary execution, validation routing, and handoff.
- `.agents/references/plan-execution.md`: active-plan dependency order, coordinator ownership, checkpoint commits, and final handoff.
- `.agents/references/planning.md`: plan authoring, readiness, status terms, and planning handoff.
- `.agents/references/references-rules.md`: adding, removing, merging, or rerouting focused references.
- `.agents/references/releases.md`: release sequencing, version choice, release commits, tags, package checks, publication, and cleanup.
- `.agents/references/reviews.md`: code review, spec drift, documentation drift, and security-review triggers.
- `.agents/references/roadmap.md`: `ROADMAP.md` editing, stable IDs, archive/changelog routing, and roadmap alignment.
- `.agents/references/testing.md`: validation selection by change type.
- `.agents/references/troubleshooting.md`: validation failure triage and local problem-solving routes.
- `.agents/references/workflow.md`: coordinator, planner, worker, reviewer, verifier, delegation, read sets, and scoped handoffs.

Reusable prompts live in `.agents/prompts/README.md`; `compact-ai-guidance.md` owns this compaction workflow.

Human and durable owner docs:

- `docs/README.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, and `docs/WORKING_WITH_AI.md` own human documentation routing, lifecycle, and AI-collaboration guidance.
- `docs/DESIGN.md` owns product and design intent.
- `ROADMAP.md` owns selected scope, status, dependencies, blocked backlog, release context, and product non-goals.
- `CHANGELOG.md` owns release-candidate and shipped user-visible history.
- `docs/LOCAL_DEVELOPMENT.md`, `SETUP.md`, and `docs/LOCAL_AUTH_SMOKE.md` own local setup, commands, troubleshooting, and auth smoke guidance.
- `docs/API_COVERAGE.md`, `docs/backend/`, and `docs/specs/` own API coverage, imported backend contracts, and selected behavior specs.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `.gitmessage` own the public project entry point, contribution orientation, security policy, and AI-authored commit format.

## Execution Routing

Ad hoc implementation is implementation work not already governed by an active plan. Use `.agents/references/workflow.md` for the planning subagent, implementation subagent, coordinator, reviewer, verifier, prompt-scope, read-set, and handoff rules. Roadmap-only documentation edits are governed by `.agents/references/roadmap.md` and do not require subagents unless the user explicitly asks for delegation.

When the user asks to implement an active plan, the plan is the execution contract. Use `.agents/references/plan-execution.md` for dependency order, status meanings, coordinator ownership, commit checkpoints, stop/replan triggers, and final handoff.

Use `.agents/references/documentation.md` to choose the smallest durable owner and check cross-file alignment. Product and design intent belongs in `docs/DESIGN.md`; roadmap scope and status belongs in `ROADMAP.md`; durable rules must not live only in plans, scratch files, or final responses.

Use `.agents/references/testing.md` to choose validation by change type. Report commands run, skipped checks with reasons, and remaining smoke, contract, or hardening risk.

## Git And Handoff

- Do not commit unless the user asks for a commit or an active plan checkpoint explicitly authorizes the scoped commit.
- Use `.gitmessage` as the commit-message format when committing AI-authored work.
- Keep unrelated user changes intact.
- Follow `.agents/references/releases.md` for release commits, annotated tags, changelog promotion, package checks, publication, and post-release cleanup.
- In handoff, report changed files, validation run, skipped validation with reasons, whether `ROADMAP.md` changed, and remaining risks.
