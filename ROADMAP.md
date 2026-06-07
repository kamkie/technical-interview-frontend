# Roadmap

This roadmap tracks the planned first-party browser frontend for the sibling
`technical-interview-demo` backend. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field               | Current                                                                                    |
|---------------------|--------------------------------------------------------------------------------------------|
| Release phase       | Pre-release `0.1.0` feature-complete stabilization                                         |
| Next target version | `0.1.0` release hardening                                                                  |
| Frontend stack      | Vite + React + TypeScript                                                                  |
| Runtime             | Node.js 24.x, npm 11.x                                                                     |
| Package metadata    | `package.json` and `package-lock.json` version `0.1.0`; `packageManager` `npm@11.14.1`      |
| Routing target      | React Router                                                                               |
| CI target           | GitHub Actions                                                                             |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row |
| Backend integration | Same-origin `/api/**` browser traffic                                                      |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`            |
| Implemented surface | Session, public catalog, account, admin catalog, admin localization, admin users, operator |
| Hardening baseline  | ESLint, TypeScript, Vitest, API type freshness, build, and whitespace checks               |
| Latest release      | No tagged frontend release yet                                                             |
| Immediate action    | Implement selected M13 hardening tooling before the final release cut                       |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`       |

The app currently bootstraps browser session state with `GET /api/session`, renders
login options from session metadata, generates checked OpenAPI TypeScript types,
routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, and implements the selected admin/operator surfaces. Local
same-origin auth smoke steps and the canonical validation baseline are documented.
The M0-M11 roadmap slice is implemented and recorded in
`.agents/plans/PLAN_frontend_roadmap_execution.md`; the next roadmap work is release
hardening and any newly selected backend-supported scope.

## Product Direction

- Keep extending the contract-first browser UI only for backend-supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.
- Prefer CI-owned hardening tools with reproducible local commands before treating a
  security or quality signal as release-blocking.

## Milestones

| Milestone                          | Status   | Scope                                                                                                                                                                                         | Done when                                                                                                                                                                                                                     |
|------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| M0 - Foundation                    | Complete | Project scaffold, generated API types, session bootstrap, public catalog reads                                                                                                                | Existing validation baseline passes and the app can render session plus catalog states from `/api/session`, `/api/books`, and `/api/categories`                                                                               |
| M1 - CI and Quality Gate           | Complete | GitHub Actions workflow for canonical npm validation commands                                                                                                                                 | CI runs lint, typecheck, tests, build, and whitespace checks on pull requests or the selected branch workflow                                                                                                                 |
| M2 - Simple Public Catalog UX      | Complete | Basic table layout with read-only search, filters, pagination, loading, empty, localized errors, and mock/test fixtures for each visible state                                                | Users can scan and filter public books without relying on implementation placeholders; component tests cover fixture-backed visible states                                                                                    |
| M3 - Advanced Catalog Controls     | Complete | React Router route-level navigation with browser history expectations, richer table controls, URL-synced filters, sorting UI, and deeper catalog state handling                               | Users can share filtered catalog URLs, adjust sorting through the UI, navigate with browser back/forward controls, and use richer table controls with tests covering route/query-state synchronization                        |
| M4 - Local Auth Workflow Docs      | Complete | Document repeatable local same-origin auth against `..\technical-interview-demo`, including backend startup, Vite `/api` proxy wiring, OAuth setup, manual smoke steps, and automation limits | `SETUP.md` links to a local auth smoke doc covering `local,oauth` startup, provider credentials, admin identity seeding, session/account/logout checks, CSRF handling, and anonymous-vs-authenticated automation policy       |
| M5 - Authenticated Session UX      | Complete | Account-aware header/state, logout flow, and route guarding for authenticated-only areas                                                                                                      | UI refreshes session after login/logout paths, mirrors CSRF metadata for unsafe authenticated writes, and has smoke or e2e coverage based on the documented local workflow                                                    |
| M6 - Account Profile Surface       | Complete | Read-only account profile page plus account-aware menu/header                                                                                                                                 | Account UI only appears after session bootstrap establishes the current user and tests cover unauthenticated and authenticated states                                                                                         |
| M7 - Account Language Preference   | Complete | Account self-service flow for reading, updating, and clearing the current user's preferred language                                                                                           | Users can update or clear the contract-backed account language preference with CSRF handling and tests for loading, success, validation/error, unauthenticated, and missing-CSRF states                                       |
| M8 - Admin Catalog Management      | Complete | Combined backend-supported admin book and category management                                                                                                                                 | Combined book/category admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for list, create, update, delete, and error states                                           |
| M9 - Admin Localization Management | Complete | Backend-supported localization message-key editing plus locale coverage/status                                                                                                                | Localization admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for supported locales, message edits, coverage/status states, and localized failures                   |
| M10 - Operator Audit Surface       | Complete | Read-only operator overview plus pageable audit log with filters for target type, action, and actor                                                                                           | Operators can inspect runtime/status summaries, recent audit entries, filtered pageable audit rows, and audit details with tests for access, loading, empty, filtered, paginated, localized error, and partial-payload states |
| M11 - Admin User Management        | Complete | Admin user list/detail with contract-backed role management                                                                                                                                   | Admins can review user profiles, roles, and role-grant provenance, then replace managed roles with CSRF handling and tests for access, empty, success, validation, localized error, and missing-CSRF states                   |
| M12 - Release Procedure And `0.1.0` Hardening | Ready | Backend-style release preparation adapted to the frontend repo: version selection, changelog promotion, validation, annotated tag, publication checks, and post-release roadmap cleanup | Maintainers can cut the first frontend release from `main` using a documented procedure; `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation evidence, and tag state agree |
| M13 - Static Analysis And Hardening Tooling | Ready | Selected `0.1.0` hardening gates: explicit GitHub Actions permissions/concurrency, CodeQL, dependency-review, an npm audit script, Dependabot grouping, and documented triage/exception rules | CI and local scripts expose the selected checks; release preconditions name required hardening evidence; docs explain false-positive handling, skip policy, and artifact locations |
| M14 - Human Procedure Documentation | Complete | Frontend procedure docs adapted from the backend repo: lifecycle/artifact routing, local development, AI collaboration, and documentation index | `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/LOCAL_DEVELOPMENT.md`, `docs/WORKING_WITH_AI.md`, and `docs/README.md` exist; `README.md`, `SETUP.md`, and `CONTRIBUTING.md` link to the owners without duplicating them |
| M15 - AI Procedure Reference Layer | Complete | Lean AI-facing owner guides for documentation routing, validation selection, review/security review, and release sequencing | `.agents/references/documentation.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, and `.agents/references/releases.md` exist; `AGENTS.md` points to them; backend-only workflow state remains deferred |

## Near-Term Backlog

1. Implement the selected M13 `0.1.0` hardening gates without adding deferred
   artifact, credential, or threshold-dependent checks.
2. Finish M12-B: promote the candidate `0.1.0` changelog section when tagging,
   verify package metadata, and follow the release procedure below.
3. Add a canonical browser smoke or e2e command for same-origin session/auth flows
   once the repository has agreed local credentials, backend profile, and identity
   seeding rules.
4. Exercise the documented local auth smoke workflow against the sibling backend and
   move repeatable gaps into tests or owner docs.
5. Add M16+ roadmap rows only when a new backend-supported surface, UX polish slice,
   or release workflow is selected clearly enough to test or document.

## Pragmatic Smoke Split

- Unit and component tests cover the current public, account, admin, and operator
  route behavior.
- Public catalog browser smoke can run anonymously against the sibling backend at
  `..\technical-interview-demo`, validating session bootstrap, categories, books,
  filters, pagination, sorting, and localized read errors.
- Authenticated browser smoke remains manual until there is a canonical command and
  agreed local credentials. Once automated, it should exercise login-provider
  rendering from session metadata, session refresh after login/logout, CSRF handling
  for unsafe authenticated writes, and authenticated access for account,
  admin/operator routes.

## Implementation Defaults

- Completed M0-M11 roadmap implementation is recorded in
  `.agents/plans/PLAN_frontend_roadmap_execution.md`.
- New M12+ implementation plans should identify the owner document, backend contract
  source, tests, and validation before implementation starts.
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
- M8-M11 admin/operator scope is specified under `docs/specs/`; future admin/operator
  expansion should update or add specs before implementation.
- M13 hardening should add package scripts and CI steps only for checks with a
  repeatable local command and a documented owner for failures.
- M14 human procedure docs live under `docs/` and keep entry-point docs linked to
  their owners. M15 AI-facing references live under `.agents/references/`, and
  `AGENTS.md` points to them without duplicating full procedures.

## Procedure Adoption Scope

The backend repository's procedure model should be adopted selectively. This
frontend needs the same owner clarity, but not the same operational weight.

Adopted for the frontend:

- `docs/DEVELOPMENT_LIFECYCLE.md` for human-facing lifecycle, artifact routing, and
  when to use a roadmap row, spec, plan, ADR, or changelog entry.
- `docs/LOCAL_DEVELOPMENT.md` for npm commands, CI reproduction, local
  troubleshooting, backend-contract refresh, browser smoke workflow, and hardening
  commands after M13 lands.
- `docs/WORKING_WITH_AI.md` for human guidance on asking AI for planning,
  implementation, validation, review, and release preparation.
- `docs/README.md` as the human-facing documentation index.
- `.agents/references/documentation.md` for AI-facing artifact ownership and
  cross-file alignment.
- `.agents/references/testing.md` for validation selection by change type, including
  docs-only, app, API-contract, auth/session, hardening, and release work.
- `.agents/references/reviews.md` for bug-risk, spec-drift, documentation-drift, and
  security-review triggers.
- `.agents/references/releases.md` for release sequencing, version choice, annotated
  tags, changelog promotion, package-version checks, and post-release roadmap cleanup.

Add only when justified by future work:

- `.agents/references/planning.md` and a reusable plan template if more large
  multi-milestone plans are expected after M12-M15.
- A lightweight changed-file classifier or command wrapper only if CI time becomes a
  real bottleneck.
- Durable workflow-state directories under `.agents/context/` only if the repository
  starts using multi-agent delegation or long-lived sidecars again.

Keep deferred:

- Backend operations and deployment runbooks until this frontend owns a deployment
  target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, image-signing, GHCR,
  Helm, Kubernetes, and post-deploy smoke procedures.
- Container image scanning, deployment posture checks, and runtime infrastructure
  hardening until the frontend has a corresponding artifact or environment.

## Hardening Tooling Candidates

M13-A selected the smallest useful set for the `0.1.0` hardening pass. M13-B should
implement only these checks before M13 is marked complete:

- Explicit GitHub Actions permissions and concurrency controls on every workflow.
- CodeQL for TypeScript/JavaScript source and GitHub workflow analysis where the
  CodeQL action supports workflow analysis.
- Dependency-review for pull requests, especially manifest and lockfile changes.
- An npm-compatible audit script using a high-or-critical advisory threshold and a
  documented exception process.
- Dependabot for npm and GitHub Actions updates, with separate groups for runtime
  dependencies, tooling/test dependencies, and Actions updates. Use the normal
  maintainer review path until a stable reviewer team or `CODEOWNERS` exists.

Deferred candidates and revisit triggers:

- SBOM and license reporting: revisit when the frontend publishes a package,
  deployable artifact, or release process requiring dependency/license inventory.
- Bundle-size or asset-budget checks: revisit when a reviewed threshold exists or
  production `dist/` growth becomes a repeated review issue.
- Authenticated browser smoke automation: revisit when agreed local credentials,
  identity seeding rules, backend profile, and a canonical command exist.
- Anonymous browser smoke and accessibility automation: revisit when the repository
  owns a canonical browser command and stable failure thresholds.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter
  supply-chain policy or add automation that keeps pinned SHAs current.
- Custom frontend security lint rules beyond CodeQL and ESLint: revisit when a
  repeated issue pattern is not covered by the selected checks.
- CI artifact upload for hardening reports: revisit when a selected check writes
  stable report files; until then, use code-scanning alerts, pull-request check
  annotations, and workflow logs.

Do not add backend-only hardening gates, container image scans, deployment scans, or
runtime infrastructure checks until the frontend repository owns a corresponding
artifact or deployment workflow.

## Release Procedure

This section mirrors the backend repository's release model, adapted for a
frontend-only Vite/npm package. Release work is maintainer-owned and starts only
after the intended implementation scope is complete, reviewed, and integrated on
`main`.

### Versioning And Release Rules

- Use semantic version tags in the form `vMAJOR.MINOR.PATCH` for stable releases or
  `vMAJOR.MINOR.PATCH-PRERELEASE` for prereleases.
- Keep version numbers increasing in `git log --first-parent` order.
- Cut releases only from `main` after all intended changes are integrated there.
- Use annotated tags for intentional releases.
- Keep `CHANGELOG.md` aligned with the release tag.
- Update `ROADMAP.md` after each release so completed work leaves the active roadmap,
  only active or deferred work remains, and the current baseline reflects the new
  release phase, breaking policy, next target version, and latest release.
- Do not create another durable released-history file; released human history belongs
  in `CHANGELOG.md`.

### Release Preconditions

Do not start release preparation until all of these are true:

- The target implementation plan or ad hoc release scope is complete and validation
  evidence is current.
- Local `main` is synced to the exact release-candidate state.
- Required backend contract artifacts and generated API types are current, or any
  intentional backend-contract refresh is already reviewed.
- `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `SETUP.md`, and package metadata agree
  with the release candidate's user-visible surface.
- The full frontend validation baseline has passed for the exact candidate:
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
  `git diff --check`.
- If M13 lands before the release, all selected static-analysis and hardening checks
  have passed for the exact candidate, or each exception has a documented owner and
  release decision.
- Any required browser smoke or e2e evidence has either passed or is explicitly
  recorded as unavailable with the reason.

### Preparing A Release

1. Inspect existing tags with `git tag --sort=v:refname` and first-parent history
   with `git log --first-parent --decorate --oneline`.
2. Choose the next semantic version. Use `PATCH` for compatible fixes or cleanup,
   `MINOR` for backward-compatible frontend feature expansion, and `MAJOR` only for
   an explicitly selected breaking-change plan.
3. Move the release-relevant `CHANGELOG.md` entries from `## [Unreleased]` into a
   new version section dated `YYYY-MM-DD`, leaving a fresh `## [Unreleased]`.
4. Update `ROADMAP.md` so the current baseline names the release phase, latest
   release, next target version, and immediate next action after the release.
5. Archive or close completed concrete plan files only when release cleanup explicitly
   adopts that backend-style plan archive step; do not archive templates or active
   plans.
6. Re-run validation if release metadata edits made earlier evidence stale.
7. Commit the release metadata change with `Prepare vMAJOR.MINOR.PATCH[-PRERELEASE]
   release`.
8. Create an annotated tag named `vMAJOR.MINOR.PATCH[-PRERELEASE]` with a concise
   annotation such as `Release vMAJOR.MINOR.PATCH[-PRERELEASE]`.
9. Verify locally that the tag points at the release commit and that `git status`,
   `CHANGELOG.md`, `ROADMAP.md`, package metadata, and validation evidence all
   describe the same release candidate.

### Publishing And Verification

- Push `main` and the annotated tag only when the release task explicitly includes
  remote publication.
- Monitor any tag-triggered CI or release workflow until it finishes; if no release
  workflow exists yet, create the GitHub Release manually from the annotated tag and
  `CHANGELOG.md` section.
- Verify the published release notes match the released changelog section.
- If a packaged frontend artifact or deployment workflow is later added, extend this
  procedure with artifact checks before cutting that release.
- After publication, update `ROADMAP.md` again only if publication changes the
  active release phase, next target version, or deferred release automation scope.

## Deferred Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Hard-coded OAuth provider paths outside the session bootstrap response.
- New backend surfaces not yet selected in a roadmap row or spec.
- Broad visual design work that is not tied to an implemented user flow.
- Release automation, packaged artifacts, or deployment workflow beyond the manual
  annotated-tag/GitHub Release procedure until explicitly selected.
- Container image scanning, deployment posture checks, and runtime infrastructure
  hardening until the frontend owns a container, deployment target, or hosted runtime.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred frontend work.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep endpoint fields, request schemas, auth header details, and durable API rules in
  `docs/backend/` or executable tests, not in this roadmap.
- Update this file when roadmap or product scope changes; update `SETUP.md`,
  `README.md`, or package configuration only when their owned behavior changes.
