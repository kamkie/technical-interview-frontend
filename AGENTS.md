# AI Project Instructions

This repository is the first-party browser frontend for the sibling backend repository
`technical-interview-demo`.

Keep the AI guidance here lean and frontend-specific. Do not reintroduce a generic
lifecycle scaffold unless the repository has enough code, tests, CI, and release
workflow to justify the extra process.

## Core Rule

Frontend behavior must follow the backend contract. Agents must not invent endpoints,
request fields, authentication headers, CORS requirements, or alternate transports.

When a task changes repository state:

1. Identify the user-visible behavior or repository rule being changed.
2. Identify the contract, test, or document that owns it.
3. Update that owner before or alongside the implementation.
4. Make the smallest coherent change.
5. Run the smallest available validation and report anything that could not run.

If the intended behavior cannot be described clearly enough to test or document, stop
and clarify before implementing it.

## Truth Priority

Use this order when sources conflict:

1. Explicit user request in the current task.
2. Imported backend OpenAPI contract: `docs/backend/approved-openapi.json`.
3. Imported backend frontend guidance: `docs/backend/FRONTEND_AI_CONTRACT.md`.
4. Backend REST Docs sources from `technical-interview-demo`, when consulted directly.
5. Frontend executable specs and type checks, once the app scaffold exists.
6. Frontend docs in this repo: `README.md`, `SETUP.md`, `ROADMAP.md`, and this file.

If an imported backend artifact appears stale or conflicts with the backend repository,
refresh it with `scripts/sync-backend-contract.ps1` before implementing API-facing
frontend work.

## Backend Contract Rules

Before implementing endpoint clients, generated API bindings, request or response
types, authentication flow, CSRF handling, or API error handling, read:

- `docs/backend/approved-openapi.json`
- `docs/backend/FRONTEND_AI_CONTRACT.md`
- `docs/backend/README.md`

Backend integration invariants:

- Browser traffic targets same-origin `/api/**`.
- Do not add CORS-dependent behavior as a supported integration path.
- Do not introduce JWT or bearer-token assumptions.
- Bootstrap auth state with `GET /api/session`.
- Render login options from `loginProviders[]`; do not hard-code provider paths.
- Use session metadata for `accountPath`, `logoutPath`, CSRF cookie name, and CSRF
  header name.
- For unsafe writes with a real current session, mirror the readable CSRF cookie into
  the configured CSRF request header.
- Treat localized messages as display content. Branch on stable fields such as status,
  `messageKey`, and endpoint context, not English message text.
- Preserve Spring pagination conventions: `page`, `size`, and repeated `sort`.
- Preserve repeated filters where documented, including repeated `category` filters.
- Include a book `version` value when updating books.

## Current Project State

The frontend application is scaffolded with Vite, React, and TypeScript. The canonical
runtime is Node.js 24.x and the canonical package manager is npm.

Canonical npm commands:

- install dependencies: `npm install`
- local development server: `npm run dev`
- production preview: `npm run preview`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- tests: `npm test`
- watch tests: `npm run test:watch`
- production build: `npm run build`
- generate API types: `npm run api:types`
- verify API types: `npm run api:types:check`

API-facing work must start by importing or refreshing the backend contract artifacts if
the imported backend artifact appears stale or conflicts with the backend repository.
After a backend contract refresh, regenerate `src/api/generated/openapi.ts` with
`npm run api:types`.

## Recommended First Implementation Shape

For upcoming implementation work, prefer:

- generated or checked types from the imported OpenAPI contract
- a small API client layer that centralizes session, CSRF, localization, and error
  handling
- component and route tests for user-visible behavior
- browser or smoke coverage for session bootstrap and logout
- the existing npm scripts for `lint`, `typecheck`, `test`, `build`, and local
  development

## Plan Execution Rules

When the user asks to implement an active plan, the plan is the execution contract.

- The orchestrator only orchestrates. It may update coordinator-owned plan/status
  documents, assign workers, review worker output, run validation, resolve
  integration, and create required commits, but it must not implement milestone or
  spec tasks itself.
- Milestone and spec implementation must be delegated to workers with explicit file
  ownership and scoped validation requirements.
- Execute plans in dependency order. The selected executable scope is the next
  `Ready` milestone/spec slice plus any dependent slices that become `Ready` after a
  predecessor is implemented, committed, and validated. Do not treat later roadmap
  dependencies, missing future specs, or future review gates as blockers for a
  currently `Ready` slice.
- Use plan status terms consistently:
  - `Ready`: the orchestrator may assign the worker now.
  - `Waiting`: normal predecessor dependency; promote to `Ready` when the predecessor
    lands.
  - `Blocked`: unresolved product choice, backend contract conflict, required
    credential, user acceptance gate explicitly required by the current task, or
    external state that cannot be produced by the plan itself.
- Stop before implementation only when the next `Ready` slice is actually `Blocked`
  by a decision or external condition that cannot be resolved from the current user
  request, backend contract, executable tests, or owned project documents.
- Once a plan run is started, keep executing through the plan until it is complete.
  Do not stop for status-only handoffs, optional review points, routine validation
  failures, or work that can be delegated, fixed, or decided from existing project
  rules.
- A spec or review step inside the plan is work to perform, not a blocker for earlier
  milestones. Coordinator review may unlock follow-on implementation unless the
  current task explicitly requires separate user acceptance.

## Change Routing

Use the smallest owner that covers the change:

| Change type | Required artifacts |
| --- | --- |
| Backend API integration | imported backend contract, API client/types, affected UI, tests |
| Session/auth behavior | session client, CSRF handling, route guards, tests or smoke notes |
| UI behavior | component/page code, user-facing tests, accessibility/responsive checks |
| Localization/error handling | API client or UI rendering, locale tests, docs if behavior changes |
| Setup/tooling | `SETUP.md`, package scripts/config, this file if canonical commands change |
| AI guidance | this file and any directly affected human-facing doc |
| Roadmap/product scope | `ROADMAP.md`; add a separate spec only when behavior is too broad for a roadmap row |

Avoid storing durable rules in plans, scratch files, or final responses only. Put the
rule in the owner document above.

## Validation

Current minimum validation:

- app or tooling changes: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, and `git diff --check`
- API type workflow changes: `npm run api:types:check`
- docs/guidance-only: `git diff --check`
- imported backend contract refresh: run `scripts/sync-backend-contract.ps1`, then
  `git diff --check`
- session/auth browser behavior: add and run browser smoke or e2e coverage for the
  affected flow; no canonical command exists until those flows are implemented

## Git And Handoff

- Do not commit unless the user asks for a commit.
- When the current user request asks to implement an active plan that contains commit
  checkpoints, those plan checkpoints are explicit commit authorization for the
  scoped plan work. Create the plan-required commits without asking again, while
  keeping unrelated changes out of each commit.
- Use `.gitmessage` as the commit-message format when committing AI-authored work.
- Keep unrelated user changes intact.
- In handoff, report changed files, validation run, skipped validation with reasons,
  and any remaining risks.

## Instruction Load Policy

Start with this file and the user's request. Add only the files needed for the current
task:

- backend contract work: `docs/backend/`
- setup/tooling work: `SETUP.md` and package/tool config
- roadmap/product scope: `ROADMAP.md`
- public project overview: `README.md`
- commit formatting: `.gitmessage`

Do not bulk-load generated contract files unless the task needs exact schema details.
