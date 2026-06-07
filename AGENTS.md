# AI Project Instructions

This repository is the first-party browser frontend for the sibling backend repository `technical-interview-demo`.

Keep the AI guidance here lean and frontend-specific. Do not reintroduce a generic lifecycle scaffold unless the repository has enough code, tests, CI, and release workflow to justify the extra process.

## Core Rule

Frontend behavior must follow the backend contract. Agents must not invent endpoints, request fields, authentication headers, CORS requirements, or alternate transports.

When a task changes repository state:

1. Identify the user-visible behavior or repository rule being changed.
2. Identify the contract, test, or document that owns it.
3. Update that owner before or alongside the implementation.
4. Make the smallest coherent change.
5. Run the smallest available validation and report anything that could not run.

If the intended behavior cannot be described clearly enough to test or document, stop and clarify before implementing it.

## Implementation Authorization

Do not treat critique, direction, desired outcomes, or proposed change lists as permission to edit files. Before changing repository state, confirm that the current task explicitly authorizes implementation with wording such as "implement this", "apply the change", "edit the files", "fix it now", "make the change", or an equivalent direct instruction.

If implementation is not clearly authorized, respond with a proposed approach, affected files, and validation plan, then wait. Use `.agents/references/execution.md` for the ordinary task gate, execution loop, validation selection, and handoff expectations.

## Dirty Worktree Protection

Before any file edit, run `git status --short`.

Treat all existing or unexpected changes as user-owned. Do not revert, delete, overwrite, normalize, or clean up those changes unless the user explicitly asks for that exact recovery action.

If unexpected changes appear during a task, stop and report the files changed, whether they are inside the intended write scope, and the proposed next action. Treat the current `git status --short` as authoritative when reconciling stale dirty-worktree observations, using `.agents/references/execution.md` for the detailed gate.

## Truth Priority

Use this order when sources conflict:

1. Explicit user request in the current task.
2. Imported backend OpenAPI contract: `docs/backend/approved-openapi.json`.
3. Imported backend frontend guidance: `docs/backend/FRONTEND_AI_CONTRACT.md`.
4. Backend REST Docs sources from `technical-interview-demo`, when consulted directly.
5. Frontend executable specs and type checks, once the app scaffold exists.
6. Frontend docs in this repo: `docs/DESIGN.md`, `README.md`, `SETUP.md`, `ROADMAP.md`, and this file.

If an imported backend artifact appears stale or conflicts with the backend repository, refresh it with `scripts/sync-backend-contract.ps1` before implementing API-facing frontend work.

## Backend Contract Rules

Before implementing endpoint clients, generated API bindings, request or response types, authentication flow, CSRF handling, or API error handling, read:

- `docs/backend/approved-openapi.json`
- `docs/backend/FRONTEND_AI_CONTRACT.md`
- `docs/backend/README.md`

Backend integration invariants:

- Browser traffic targets same-origin `/api/**`.
- Do not add CORS-dependent behavior as a supported integration path.
- Do not introduce JWT or bearer-token assumptions.
- Bootstrap auth state with `GET /api/session`.
- Render login options from `loginProviders[]`; do not hard-code provider paths.
- Use session metadata for `accountPath`, `logoutPath`, CSRF cookie name, and CSRF header name.
- For unsafe writes with a real current session, mirror the readable CSRF cookie into the configured CSRF request header.
- Treat localized messages as display content. Branch on stable fields such as status, `messageKey`, and endpoint context, not English message text.
- Preserve Spring pagination conventions: `page`, `size`, and repeated `sort`.
- Preserve repeated filters where documented, including repeated `category` filters.
- Include a book `version` value when updating books.

## Current Project State

The frontend application is scaffolded with Vite, React, and TypeScript. The canonical runtime is Node.js 24.x and the canonical package manager is npm.

Canonical npm commands:

- install dependencies: `npm install`
- local development server: `npm run dev`
- production preview: `npm run preview`
- lint: `npm run lint`
- Markdown lint: `npm run lint:markdown`
- Markdown format: `npm run format:markdown`
- ESLint only: `npm run lint:eslint`
- typecheck: `npm run typecheck`
- tests: `npm test`
- watch tests: `npm run test:watch`
- production build: `npm run build`
- container image build: `npm run docker:build`
- generate API types: `npm run api:types`
- verify API types: `npm run api:types:check`

API-facing work must start by importing or refreshing the backend contract artifacts if the imported backend artifact appears stale or conflicts with the backend repository. After a backend contract refresh, regenerate `src/api/generated/openapi.ts` with `npm run api:types`.

## Markdown Formatting

Tracked Markdown must use LF line endings, end with a final newline, keep prose and list-item prose on one physical line instead of hard-wrapped continuation lines, and keep pipe tables in the deterministic alignment enforced by `npm run lint:markdown`.

## Recommended First Implementation Shape

For upcoming implementation work, prefer:

- generated or checked types from the imported OpenAPI contract
- a small API client layer that centralizes session, CSRF, localization, and error handling
- component and route tests for user-visible behavior
- browser or smoke coverage for session bootstrap and logout
- the existing npm scripts for `lint`, `typecheck`, `test`, `build`, and local development

## Focused AI References

Use these focused references for procedure details that do not belong inline here:

- `.agents/references/architecture.md` owns frontend route, API/client, component, test, and abstraction placement guidance.
- `.agents/references/code-style.md` owns frontend TypeScript, React, CSS, accessibility, and edit-shape guidance.
- `.agents/references/documentation.md` owns AI-facing artifact routing and cross-file alignment checks.
- `.agents/references/execution.md` owns ordinary task gates, repository-state checks, execution loop, and handoff expectations.
- `.agents/references/plan-execution.md` owns active-plan execution for delegated milestone and spec slices.
- `.agents/references/planning.md` owns plan authoring, readiness rules, status terms, and planning handoff shape.
- `.agents/references/references-rules.md` owns maintenance rules for focused AI references.
- `.agents/references/roadmap.md` owns roadmap editing, selected-row shaping, archive/changelog routing, and roadmap alignment checks.
- `.agents/references/testing.md` owns validation selection by change type.
- `.agents/references/troubleshooting.md` owns validation failure triage and local problem-solving routes.
- `.agents/references/reviews.md` owns code-review, spec-drift, documentation-drift, and security-review triggers.
- `.agents/references/releases.md` owns release sequencing, version choice, annotated tags, changelog promotion, package checks, GHCR package publication, GitHub Release verification, and post-release roadmap cleanup.
- `.agents/references/workflow.md` owns coordinator, planner, worker, reviewer, verifier, and delegation mechanics.

## Ad Hoc Implementation Delegation

Ad hoc implementation is implementation work not already governed by an active plan. Use one planning subagent and a separate implementation subagent; this repository rule pre-authorizes those subagents. Roadmap-only documentation edits are governed by `.agents/references/roadmap.md` and do not require subagents unless the user explicitly asks for delegation.

Use `.agents/references/workflow.md` for coordinator, planner, worker, reviewer, verifier, prompt-scope, read-set, and handoff requirements. Backend contract, validation, git, dirty-worktree, and smallest-coherent-change rules still apply.

## Plan Execution Rules

When the user asks to implement an active plan, the plan is the execution contract.

The orchestrator coordinates plan execution and delegates milestone or spec implementation to workers with explicit file ownership and scoped validation. Execute the next eligible `Ready` slice in dependency order, use plan status terms consistently, and treat plan review or spec steps as work to perform unless the current task requires separate user acceptance.

Use `.agents/references/plan-execution.md` for coordinator ownership, dependency handling, status meanings, commit checkpoints, stop/replan triggers, and final handoff requirements.

## Change Routing

Use `.agents/references/documentation.md` to choose the smallest durable owner and to check cross-file alignment. Product and design intent belongs in `docs/DESIGN.md`; selected roadmap scope, status, dependencies, blocked backlog, release context, and product non-goals belong in `ROADMAP.md`. Avoid storing durable rules only in plans, scratch files, or final responses.

## Validation

Use `.agents/references/testing.md` to choose validation by change type. Report commands run, skipped validation with reasons, and any remaining smoke or contract risk.

## Git And Handoff

- Do not commit unless the user asks for a commit.
- When the current user request asks to implement an active plan that contains commit checkpoints, those plan checkpoints are explicit commit authorization for the scoped plan work. Create the plan-required commits without asking again, while keeping unrelated changes out of each commit.
- Use `.gitmessage` as the commit-message format when committing AI-authored work.
- Keep unrelated user changes intact.
- Follow `.agents/references/releases.md` for release commits, annotated tags, changelog promotion, package checks, and post-release cleanup.
- In handoff, report changed files, validation run, skipped validation with reasons, and any remaining risks.

## Instruction Load Policy

Start with this file and the user's request. Add only the files needed for the current task:

- backend contract work: `docs/backend/`
- setup/tooling work: `SETUP.md` and package/tool config
- roadmap/product scope: `ROADMAP.md`
- product/design intent: `docs/DESIGN.md`
- public project overview: `README.md`
- commit formatting: `.gitmessage`
- architecture and code placement: `.agents/references/architecture.md`
- frontend code style: `.agents/references/code-style.md`
- documentation routing: `.agents/references/documentation.md`
- ordinary task execution: `.agents/references/execution.md`
- delegation workflow: `.agents/references/workflow.md`
- plan authoring: `.agents/references/planning.md`
- active plan execution: `.agents/references/plan-execution.md`
- focused reference maintenance: `.agents/references/references-rules.md`
- troubleshooting: `.agents/references/troubleshooting.md`
- validation selection: `.agents/references/testing.md`
- reviews: `.agents/references/reviews.md`
- release preparation: `.agents/references/releases.md`

Do not bulk-load generated contract files unless the task needs exact schema details.
