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

The frontend application has not been scaffolded yet. There is currently no canonical
package manager, build command, test command, runtime stack, or CI command.

Until those exist:

- Documentation and AI-guidance changes should at least pass `git diff --check`.
- API-facing work must start by importing or refreshing the backend contract artifacts.
- The first app-scaffold change must update `README.md`, `SETUP.md`, `ROADMAP.md`,
  and this file with the chosen commands and validation expectations.

## Recommended First Implementation Shape

When the app is scaffolded, prefer a typed frontend with:

- generated or checked types from the imported OpenAPI contract
- a small API client layer that centralizes session, CSRF, localization, and error
  handling
- component and route tests for user-visible behavior
- browser or smoke coverage for session bootstrap and logout
- package scripts for `lint`, `typecheck`, `test`, `build`, and local development

The exact stack is still undecided. Record the decision in `ROADMAP.md` before the
first implementation commit.

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

- docs/guidance-only: `git diff --check`
- imported backend contract refresh: run `scripts/sync-backend-contract.ps1`, then
  `git diff --check`

After the app scaffold exists, replace this section with the real commands. A typical
frontend validation set should include lint, typecheck, unit/component tests, build,
and browser smoke or e2e checks when session/auth behavior changes.

## Git And Handoff

- Do not commit unless the user asks for a commit.
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
