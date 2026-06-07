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

## Instruction Map

Start with this file and the user's request. Load only the mapped owner files needed for the current task, and do not bulk-load generated contract files unless exact schema details are required.

### Focused AI References

| File                                     | Owns                                                                                            | Load when the task involves                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.agents/references/architecture.md`     | Frontend route, API/client, component, test, and abstraction placement                          | Architecture, route boundaries, API/client placement, test placement, shared abstractions |
| `.agents/references/code-style.md`       | Frontend TypeScript, React, CSS, accessibility, and edit shape                                  | App source, tests, fixtures, UI behavior, layout, styling, accessibility                  |
| `.agents/references/documentation.md`    | AI-facing artifact routing and cross-file alignment                                             | Documentation, owner routing, repository rules, cross-file consistency                    |
| `.agents/references/execution.md`        | Ordinary task gates, repository-state checks, execution loop, and handoff                       | Implementation authorization, dirty worktree handling, ordinary execution, handoff        |
| `.agents/references/plan-execution.md`   | Active-plan execution for delegated milestone and spec slices                                   | Implementing an active plan, plan dependency order, checkpoint commits                    |
| `.agents/references/planning.md`         | Plan authoring, readiness rules, status terms, and planning handoff shape                       | Creating or updating `.agents/plans/` execution plans                                     |
| `.agents/references/references-rules.md` | Maintenance rules for focused AI references                                                     | Adding, removing, merging, or rerouting focused AI references                             |
| `.agents/references/releases.md`         | Release sequencing, version choice, tags, package checks, publication, and post-release cleanup | Release preparation, metadata, tags, package publication, release verification            |
| `.agents/references/reviews.md`          | Code-review, spec-drift, documentation-drift, and security-review triggers                      | Reviewing changes or checking drift/security risk during implementation                   |
| `.agents/references/roadmap.md`          | Roadmap editing, selected-row shaping, archive/changelog routing, and roadmap alignment         | `ROADMAP.md` scope, stable IDs, statuses, dependencies, blocked backlog                   |
| `.agents/references/testing.md`          | Validation selection by change type                                                             | Choosing validation, reporting skipped checks, smoke or hardening evidence                |
| `.agents/references/troubleshooting.md`  | Validation failure triage and local problem-solving routes                                      | Failed commands, local workflow issues, incomplete smoke results                          |
| `.agents/references/workflow.md`         | Coordinator, planner, worker, reviewer, verifier, and delegation mechanics                      | Delegation, worker prompts, read sets, scoped handoffs                                    |

### Authoritative Documentation

| File                                                | Owns                                                                                                                  | Load when the task involves                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `docs/README.md`                                    | Human documentation index and documentation ownership map                                                             | Finding the durable human-facing owner for a topic                                        |
| `docs/DEVELOPMENT_LIFECYCLE.md`                     | Human-facing lifecycle and artifact routing                                                                           | Repository lifecycle, artifact routing, owner selection                                   |
| `docs/DESIGN.md`                                    | Durable frontend product and design intent                                                                            | Product direction, UX hierarchy, workflow priorities, UI non-goals                        |
| `docs/LOCAL_DEVELOPMENT.md`                         | Local setup, npm commands, CI reproduction, troubleshooting, contract refresh, smoke workflow, and hardening commands | Setup, local commands, CI reproduction, proxy/dev server, smoke, hardening                |
| `docs/LOCAL_AUTH_SMOKE.md`                          | Manual same-origin authenticated smoke workflow                                                                       | Browser auth smoke, fake-OAuth/local backend readiness                                    |
| `docs/WORKING_WITH_AI.md`                           | Human guidance for AI-assisted planning, implementation, validation, review, and releases                             | Human-facing AI collaboration guidance                                                    |
| `docs/API_COVERAGE.md`                              | Approved backend operation coverage audit                                                                             | API operation coverage, contract coverage gaps, generated/client/UI/test mapping          |
| `docs/ROADMAP_ARCHIVE.md`                           | Completed roadmap summaries that left the active roadmap                                                              | Historical completed roadmap context; do not edit archive content unless explicitly asked |
| `docs/backend/approved-openapi.json`                | Imported backend OpenAPI contract                                                                                     | Exact endpoint, schema, request, response, pagination, filter, and error shapes           |
| `docs/backend/FRONTEND_AI_CONTRACT.md`              | Imported backend frontend integration guidance                                                                        | API-facing frontend behavior, session/auth/CSRF/localization invariants                   |
| `docs/backend/README.md`                            | Backend contract import bundle usage                                                                                  | How to use or refresh imported backend contract artifacts                                 |
| `docs/backend/SOURCE.md`                            | Backend contract artifact provenance                                                                                  | Verifying the source and timestamp of imported backend artifacts                          |
| `docs/specs/SPEC_admin_catalog_management.md`       | Selected admin catalog management behavior                                                                            | Admin book/category management visible states, access, errors, tests                      |
| `docs/specs/SPEC_admin_localization_management.md`  | Selected admin localization management behavior                                                                       | Admin locale/message editing, coverage/status behavior, tests                             |
| `docs/specs/SPEC_admin_user_management.md`          | Selected admin user management behavior                                                                               | Admin user list/detail/role-management visible states and tests                           |
| `docs/specs/SPEC_operator_audit_surface.md`         | Selected operator overview and audit-log behavior                                                                     | Operator metrics, audit filters, details, partial payloads, tests                         |
| `docs/specs/SPEC_public_catalog_workflow_polish.md` | Selected public catalog workflow polish behavior                                                                      | Public catalog query UX, filter/sort/page summaries, route-query behavior                 |

### Root Owners

| File              | Owns                                                                                          | Load when the task involves                                    |
| ----------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `README.md`       | Public project overview and current surface                                                   | Public-facing project summary or top-level documentation links |
| `SETUP.md`        | Short setup entry point that routes to `docs/LOCAL_DEVELOPMENT.md`                            | Setup entry-point wording or compatibility with local docs     |
| `ROADMAP.md`      | Selected scope, status, dependencies, blocked backlog, release context, and product non-goals | Roadmap/product scope, stable IDs, release state, planned work |
| `CHANGELOG.md`    | Release-candidate and shipped user-visible history                                            | Release notes, shipped history, release-candidate changes      |
| `CONTRIBUTING.md` | Contributor orientation                                                                       | Contributor entry-point rules or links                         |
| `SECURITY.md`     | Vulnerability reporting and supported security-fix lines                                      | Security reporting policy or supported lines                   |
| `.gitmessage`     | AI-authored commit-message format                                                             | Creating commits when explicitly authorized                    |

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
