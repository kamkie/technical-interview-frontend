# Roadmap Archive

This file archives completed roadmap work that no longer needs to occupy the
active roadmap. Current product scope, backlog, release state, and deferred work
remain in `ROADMAP.md`. Released user-visible history remains in `CHANGELOG.md`.

## Archived Plan Records

- M0-M11 roadmap implementation is recorded in
  `.agents/plans/archive/PLAN_frontend_roadmap_execution.md`.
- M12-M15 release, procedure, and hardening work is recorded in
  `.agents/plans/archive/PLAN_frontend_release_procedure_execution.md`.
- M16-M24 post-`0.1.0` roadmap execution is recorded in
  `.agents/plans/archive/PLAN_post_0_1_roadmap_execution.md`.

## Completed Milestones

| Milestone | Scope | Done when |
| --- | --- | --- |
| M0 - Foundation | Project scaffold, generated API types, session bootstrap, public catalog reads | Existing validation baseline passes and the app can render session plus catalog states from `/api/session`, `/api/books`, and `/api/categories` |
| M1 - CI and Quality Gate | GitHub Actions workflow for canonical npm validation commands | CI runs lint, typecheck, tests, build, and whitespace checks on pull requests or the selected branch workflow |
| M2 - Simple Public Catalog UX | Basic table layout with read-only search, filters, pagination, loading, empty, localized errors, and mock/test fixtures for each visible state | Users can scan and filter public books without relying on implementation placeholders; component tests cover fixture-backed visible states |
| M3 - Advanced Catalog Controls | React Router route-level navigation with browser history expectations, richer table controls, URL-synced filters, sorting UI, and deeper catalog state handling | Users can share filtered catalog URLs, adjust sorting through the UI, navigate with browser back/forward controls, and use richer table controls with tests covering route/query-state synchronization |
| M4 - Local Auth Workflow Docs | Document repeatable local same-origin auth against `..\technical-interview-demo`, including backend startup, Vite `/api` proxy wiring, OAuth setup, manual smoke steps, and automation limits | `SETUP.md` links to a local auth smoke doc covering `local,oauth` startup, provider credentials, admin identity seeding, session/account/logout checks, CSRF handling, and anonymous-vs-authenticated automation policy |
| M5 - Authenticated Session UX | Account-aware header/state, logout flow, and route guarding for authenticated-only areas | UI refreshes session after login/logout paths, mirrors CSRF metadata for unsafe authenticated writes, and has smoke or e2e coverage based on the documented local workflow |
| M6 - Account Profile Surface | Read-only account profile page plus account-aware menu/header | Account UI only appears after session bootstrap establishes the current user and tests cover unauthenticated and authenticated states |
| M7 - Account Language Preference | Account self-service flow for reading, updating, and clearing the current user's preferred language | Users can update or clear the contract-backed account language preference with CSRF handling and tests for loading, success, validation/error, unauthenticated, and missing-CSRF states |
| M8 - Admin Catalog Management | Combined backend-supported admin book and category management | Combined book/category admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for list, create, update, delete, and error states |
| M9 - Admin Localization Management | Backend-supported localization message-key editing plus locale coverage/status | Localization admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for supported locales, message edits, coverage/status states, and localized failures |
| M10 - Operator Audit Surface | Read-only operator overview plus pageable audit log with filters for target type, action, and actor | Operators can inspect runtime/status summaries, recent audit entries, filtered pageable audit rows, and audit details with tests for access, loading, empty, filtered, paginated, localized error, and partial-payload states |
| M11 - Admin User Management | Admin user list/detail with contract-backed role management | Admins can review user profiles, roles, and role-grant provenance, then replace managed roles with CSRF handling and tests for access, empty, success, validation, localized error, and missing-CSRF states |
| M12 - Release Procedure And `0.1.0` Hardening | Backend-style release preparation adapted to the frontend repo: version selection, changelog promotion, validation, annotated tag, publication checks, and post-release roadmap cleanup | Maintainers can cut the first frontend release from `main` using a documented procedure; `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation evidence, and tag state agree |
| M13 - Static Analysis And Hardening Tooling | Selected `0.1.0` hardening gates: explicit GitHub Actions permissions/concurrency, CodeQL, dependency-review, an npm audit script, Dependabot grouping, and documented triage/exception rules | CI and local scripts expose the selected checks; release preconditions name required hardening evidence; docs explain false-positive handling, skip policy, and artifact locations |
| M14 - Human Procedure Documentation | Frontend procedure docs adapted from the backend repo: lifecycle/artifact routing, local development, AI collaboration, and documentation index | `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/LOCAL_DEVELOPMENT.md`, `docs/WORKING_WITH_AI.md`, and `docs/README.md` exist; `README.md`, `SETUP.md`, and `CONTRIBUTING.md` link to the owners without duplicating them |
| M15 - AI Procedure Reference Layer | Lean AI-facing owner guides for documentation routing, validation selection, review/security review, and release sequencing | `.agents/references/documentation.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, and `.agents/references/releases.md` exist; `AGENTS.md` points to them; backend-only workflow state remains deferred |
| M16 - Contract Coverage And Scope Audit | Post-`0.1.0` audit of approved backend OpenAPI operations against generated types, clients, routes, specs, and tests | `docs/API_COVERAGE.md` classifies all 22 approved operations as implemented, with no uncovered operation gap requiring M22 surface selection |
| M17 - Anonymous Browser Smoke Automation | Canonical anonymous same-origin smoke command for session bootstrap and public catalog flows | `npm run smoke:anonymous` exists, documents prerequisites and skip behavior, and can run without credentials through the frontend `/api/**` proxy |
| M18 - Authenticated Smoke Automation Readiness | Fake-OAuth readiness contract for repeatable local authenticated smoke | `docs/LOCAL_AUTH_SMOKE.md` names `local,oauth,fake-oauth`, `smoke` provider discovery from `GET /api/session`, `smoke:smoke-user` admin seeding, CSRF/logout/account/admin checks, and skip/fail behavior |
| M19 - Public Catalog Workflow Polish | Focused catalog polish candidate | No implementation selected for `0.2.0`; remains future product scope because no concrete polish target was selected |
| M20 - Container And Deployment Hardening Refinement | Advisory first pass for frontend-owned hardening with Trivy, rendered-manifest kube-linter, and runtime/Nginx invariant checks | `npm run hardening:runtime`, `npm run hardening:kube-linter`, `npm run hardening:trivy`, and `npm run hardening:m20` exist; findings remain advisory until stable thresholds and exception workflow are selected |
| M21 - Login Provider Metadata Guardrail | Regression coverage for metadata-driven login provider links | Auth/session tests prove providers are rendered from `loginProviders[]` and `authorizationPath`, and no login entry point is invented when metadata omits an authorization path |
| M22 - Backend Surface Expansion Selection | Backend-supported surface selection from M16 gaps | No surface was selected because M16 found no uncovered approved backend operations |
| M23 - Implemented Flow Visual Design Pass | Visual design pass candidate | No implementation selected for `0.2.0`; remains future product scope because no concrete flow or evidence target was selected |
| M24 - Post-`0.1.0` Release Preparation | `0.2.0` release metadata, validation evidence, and publication | `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation evidence, GitHub Release, GHCR image tags, signature/provenance evidence, and published release notes agree for `v0.2.0` |

## Completed Implementation Notes

- M1 CI lives at `.github/workflows/ci.yml`, triggers on pull requests and pushes to
  `main`, uses Node.js 24.x with `npm ci`, and runs `npm run lint`,
  `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- M2 table columns are title, author, publication year, ISBN, and categories.
  M3 adds URL-synced filters, sorting, page-size controls, and browser history
  behavior.
- M2 fixture-backed visible states use shared fixtures under `src/test/fixtures/`,
  covering loading, populated, empty, filtered, paginated, localized book error, and
  category error states.
- M4 local auth documentation lives at `docs/LOCAL_AUTH_SMOKE.md` and is linked from
  `SETUP.md`.
- M4 local same-origin development uses a Vite `/api` proxy to
  `http://localhost:8080` for the backend running from `..\technical-interview-demo`.
- M8-M11 admin/operator scope is specified under `docs/specs/`.
- M13 hardening added package scripts and CI steps only for checks with a repeatable
  local command or a CI-owned signal with a documented owner for failures.
- M14 human procedure docs live under `docs/` and keep entry-point docs linked to
  their owners. M15 AI-facing references live under `.agents/references/`, and
  `AGENTS.md` points to them without duplicating full procedures.
- M16-M21 added the post-`0.1.0` coverage and smoke evidence: API coverage audit,
  anonymous browser smoke, fake-OAuth readiness, advisory hardening commands, and
  metadata-driven login provider guardrails.
- M19 and M23 were not implemented for `0.2.0` because they require explicit
  product scope before UI changes.

## Completed Procedure Adoption

- `docs/DEVELOPMENT_LIFECYCLE.md` owns human-facing lifecycle, artifact routing, and
  when to use a roadmap row, spec, plan, ADR, or changelog entry.
- `docs/LOCAL_DEVELOPMENT.md` owns npm commands, CI reproduction, local
  troubleshooting, backend-contract refresh, browser smoke workflow, and hardening
  commands.
- `docs/WORKING_WITH_AI.md` owns human guidance on asking AI for planning,
  implementation, validation, review, and release preparation.
- `docs/README.md` is the human-facing documentation index.
- `.agents/references/documentation.md` owns AI-facing artifact ownership and
  cross-file alignment.
- `.agents/references/testing.md` owns validation selection by change type.
- `.agents/references/reviews.md` owns bug-risk, spec-drift, documentation-drift,
  and security-review triggers.
- `.agents/references/releases.md` owns release sequencing, version choice,
  annotated tags, changelog promotion, package-version checks, and post-release
  roadmap cleanup.

## Completed Hardening Tooling

M13-A selected the smallest useful set for the `0.1.0` hardening pass. M13-B
implemented these checks without adding deferred artifact, credential, threshold, or
custom-rule gates:

- Explicit GitHub Actions permissions and concurrency controls on every workflow.
- CodeQL for TypeScript/JavaScript source and GitHub workflow analysis, with
  results uploaded to GitHub code scanning.
- Dependency-review for pull requests, especially manifest and lockfile changes,
  with private-repository advisory mode when the GitHub dependency-review API is
  unavailable.
- An npm-compatible audit script using a high-or-critical advisory threshold and a
  documented exception process.
- Dependabot for npm and GitHub Actions updates, with separate groups for runtime
  dependencies, tooling/test dependencies, and Actions updates.
