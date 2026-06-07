# Frontend Troubleshooting Reference

This file owns AI-facing validation failure triage and local problem-solving routes for this frontend. Use it after a command fails, a local workflow behaves unexpectedly, or a smoke result is incomplete.

## First Triage

- Reconfirm the change type and expected validation in `.agents/references/testing.md`; do not broaden validation just to make a documentation-only task look more complete.
- Check whether the failure is inside the assigned write scope. If unexpected files changed, stop and report the files, whether they are in scope, and the proposed next action.
- Use the command output to identify the owning surface: Markdown, ESLint, TypeScript, tests, build, API type freshness, browser smoke, hardening, or local setup.
- Fix the smallest owned cause when it is in scope. If the cause is outside scope or user-owned, report it instead of rewriting unrelated work.

## Markdown Lint And Whitespace

- For docs-only or AI-guidance changes, `npm run lint:markdown` is the owner command and `git diff --check` catches whitespace errors.
- Markdown files should use LF line endings, end with a final newline, keep prose and list-item prose on one physical line where practical, and keep pipe tables deterministically aligned.
- If markdown formatting fails because of a generated or user-owned file outside the task scope, report the path and keep validation scoped to assigned files when the user required scoped validation.

## ESLint, Typecheck, Test, And Build

- ESLint failures usually belong to the touched source, test, script, or config file. Prefer a local code fix over disabling a rule.
- Typecheck failures in API-shaped data often indicate stale generated types, incorrect use of generated types, or a backend contract mismatch; check `docs/backend/` before changing API behavior.
- Test failures should be triaged by layer: API module tests for request and response behavior, route/component tests for visible workflow states, mock API tests for local mock behavior, and routing helper tests for query-state encoding.
- Build failures after source changes usually indicate TypeScript, Vite, import, asset, or generated-type issues; do not treat them as deployment problems until the local build surface is understood.
- If a failure reproduces outside the touched scope, report it with the command, first failing path or test, and why it appears unrelated.

## API Type Freshness

- `npm run typecheck` includes `npm run api:types:check`; a failure can mean `src/api/generated/openapi.ts` is stale relative to `docs/backend/approved-openapi.json`.
- Run `npm run api:types` only after an intentional backend contract refresh or when the task explicitly authorizes regenerating API types.
- Do not hand-edit `src/api/generated/openapi.ts`. If imported backend artifacts conflict with the backend repository, follow `docs/backend/README.md` before regenerating types.

## Auth, Session, CSRF, And Localization Symptoms

- Start from the session, auth, CSRF, and localization contract in `docs/backend/FRONTEND_AI_CONTRACT.md` before changing route guards, account UI, unsafe writes, or localized error handling.
- If localized errors behave inconsistently, check whether code branches on localized display text instead of stable fields, endpoint context, route context, or typed data.

## Same-Origin And Proxy Issues

- Keep local fixes inside the browser boundary documented in `docs/backend/`; do not turn local proxy trouble into a new integration path.
- For local setup or proxy procedure details, consult `docs/LOCAL_DEVELOPMENT.md` and package scripts instead of copying setup steps into this file.
- If the frontend dev server works but API calls fail, separate frontend request shape problems from backend availability, backend profile, reverse-proxy, or mock-mode configuration.
- For smoke-provider behavior, follow backend session metadata rather than hard-coded provider paths.

## Smoke Evidence Limits

Use `.agents/references/testing.md` for browser smoke evidence fields and `docs/LOCAL_DEVELOPMENT.md` for current local procedure. Anonymous smoke can cover shell and public catalog paths when selected. Authenticated smoke remains limited unless the repository has agreed local credentials, identity seeding, and a canonical command.

A manual screenshot or observed browser run is useful context but does not replace a selected repeatable smoke command unless the owner document or roadmap row accepts it. Do not promote a smoke gap into a release-blocking quality gate until `ROADMAP.md` or the relevant owner selects the command, threshold, evidence path, and failure owner.

## Hardening And Advisory Checks

Hardening commands and advisory behavior are selected in `.agents/references/testing.md`, with command procedures in `docs/LOCAL_DEVELOPMENT.md`. Do not make advisory findings release-blocking without a roadmap or release decision.

Tool unavailability, rendering failures, and configuration failures should be fixed when in scope or reported as unavailable. Triage vulnerability, posture, dependency, workflow permission, CodeQL, dependency-review, and npm audit findings with `.agents/references/reviews.md`.

## When To Consult Owner Docs

- Use `docs/backend/` for API contract, auth, CSRF, localization, pagination, repeated filters, and generated type source truth.
- Use `docs/DESIGN.md` for product and design intent when a UI symptom is really a workflow or hierarchy question.
- Use `ROADMAP.md` for selected scope, milestone status, dependencies, blocked backlog, and product non-goals.
- Use `docs/LOCAL_DEVELOPMENT.md` for setup, local command procedure, dev server, proxy, and environment details.
- Use `.agents/references/documentation.md` when a troubleshooting fix requires changing documentation or owner routing.
- Use `.agents/references/testing.md` to choose validation and `.agents/references/reviews.md` to decide whether code, spec, documentation, or security review is required.
