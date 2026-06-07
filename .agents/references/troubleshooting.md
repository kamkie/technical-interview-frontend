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
- Do not hand-edit `src/api/generated/openapi.ts`. If imported backend artifacts conflict with the backend repository, refresh with `scripts/sync-backend-contract.ps1` before regenerating types.

## Auth, Session, CSRF, And Localization Symptoms

- If the app appears logged out unexpectedly, start with `GET /api/session` behavior and session metadata before changing route guards or account UI.
- If login options are missing or wrong, check that the UI renders `loginProviders[]` and each provider's `authorizationPath` from session metadata instead of hard-coded provider paths.
- If logout or unsafe writes fail, check whether the current session is real and whether the readable CSRF cookie is mirrored into the configured CSRF header name from session metadata.
- If account calls fail, confirm the UI only calls account endpoints after session bootstrap establishes the needed authenticated state.
- If localized errors behave inconsistently, check whether code branches on localized English message text instead of stable fields such as status, `messageKey`, endpoint context, or route context.

## Same-Origin And Proxy Issues

- Supported browser traffic is same-origin `/api/**`; do not fix local problems by adding CORS-first behavior, bearer tokens, JWT assumptions, alternate transports, or direct backend-origin URLs.
- For local setup or proxy procedure details, consult `docs/LOCAL_DEVELOPMENT.md` and package scripts instead of copying setup steps into this file.
- If the frontend dev server works but API calls fail, separate frontend request shape problems from backend availability, backend profile, reverse-proxy, or mock-mode configuration.
- Smoke environments may expose a `smoke` login provider through backend metadata. Discover it through `loginProviders[]`; do not hard-code test-support OAuth paths.

## Smoke Evidence Limits

- Browser smoke evidence must record the frontend URL, backend profile when used, covered flow, validation date, and skipped authenticated steps with reasons.
- Anonymous smoke can cover shell and public catalog paths when selected. Authenticated smoke remains limited unless the repository has agreed local credentials, identity seeding, and a canonical command.
- A manual screenshot or observed browser run is useful context but does not replace a selected repeatable smoke command unless the owner document or roadmap row accepts it.
- Do not promote a smoke gap into a release-blocking quality gate until `ROADMAP.md` or the relevant owner selects the command, threshold, evidence path, and failure owner.

## Hardening And Advisory Checks

- Hardening commands and advisory behavior are selected in `.agents/references/testing.md`; do not make advisory findings release-blocking without a roadmap or release decision.
- Tool unavailability, rendering failures, and configuration failures should be fixed when in scope or reported as unavailable. Vulnerability and posture findings should be triaged according to the selected threshold state.
- For dependency, workflow permission, CodeQL, dependency-review, and npm audit findings, use `.agents/references/reviews.md` for security-review triggers and exception expectations.

## When To Consult Owner Docs

- Use `docs/backend/` for API contract, auth, CSRF, localization, pagination, repeated filters, and generated type source truth.
- Use `docs/DESIGN.md` for product and design intent when a UI symptom is really a workflow or hierarchy question.
- Use `ROADMAP.md` for selected scope, milestone status, dependencies, blocked backlog, and product non-goals.
- Use `docs/LOCAL_DEVELOPMENT.md` for setup, local command procedure, dev server, proxy, and environment details.
- Use `.agents/references/documentation.md` when a troubleshooting fix requires changing documentation or owner routing.
- Use `.agents/references/testing.md` to choose validation and `.agents/references/reviews.md` to decide whether code, spec, documentation, or security review is required.
