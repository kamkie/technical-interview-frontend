# Roadmap Archive

This file archives completed roadmap work that no longer needs to occupy the
active roadmap. Current product scope, backlog, release state, and planned work
remain in `ROADMAP.md`. Released user-visible history remains in `CHANGELOG.md`.

Archive hierarchy:

- Milestone: completed delivery slice with its historical counter.
- Epic: completed product, workflow, procedure, or hardening area inside the
  milestone.
- Task: completed unit of archived work.
- Plan: archived execution record when one exists.

Stable IDs:

- Completed milestones preserve their historical IDs, such as `M0`, `M17`, and
  `M27`.
- The later local reuse of `M24` is archived as `M24-LOCAL`; its legacy counter is
  noted so old references remain understandable.
- Archived epics use `E-<milestone-id>-NNN`.
- Archived tasks use `T-<milestone-id>-NNN`.
- Archived plan records use `PLAN-short-kebab-slug`.

Keep IDs stable when wording or archive ordering changes. Do not renumber completed
work, and do not reuse retired IDs for unrelated work.

## Archived Plan Records

### PLAN-frontend-roadmap-execution

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_frontend_roadmap_execution.md`

Scope: M0-M11 roadmap implementation.

### PLAN-frontend-release-procedure-execution

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_frontend_release_procedure_execution.md`

Scope: M12-M15 release, procedure, and hardening work.

### PLAN-post-0-1-roadmap-execution

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_post_0_1_roadmap_execution.md`

Scope: M16-M24 post-`0.1.0` roadmap execution.

### PLAN-post-v0-2-local-work

Labels: `type:plan`, `status:archive-summary`

Record: this archive.

Scope: Later local M19 and M23-M27 completion summaries after `v0.2.0`.

## Completed Milestones

### M0: Foundation

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Establish the frontend scaffold and the first backend-contract-backed
runtime path.

#### E-M0-001: Scaffold And Contract Bootstrap

Labels: `type:epic`, `milestone:M0`, `status:done`

Tasks:

- T-M0-001: Scaffold the Vite, React, and TypeScript frontend.
- T-M0-002: Generate initial API types from the approved backend contract.
- T-M0-003: Bootstrap session and public catalog reads.

Acceptance Criteria:

- Existing validation baseline passes.
- The app renders session and catalog states from `/api/session`, `/api/books`, and
  `/api/categories`.

### M1: CI And Quality Gate

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add a repeatable repository quality gate for pull requests and selected
branch validation.

#### E-M1-001: Canonical CI Validation

Labels: `type:epic`, `milestone:M1`, `status:done`

Tasks:

- T-M1-001: Add the GitHub Actions workflow at `.github/workflows/ci.yml`.
- T-M1-002: Run canonical npm validation commands in CI.
- T-M1-003: Include whitespace checks in the workflow.

Acceptance Criteria:

- CI runs lint, typecheck, tests, build, and `git diff --check`.
- The workflow runs on pull requests or the selected branch workflow.

### M2: Simple Public Catalog UX

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Make the public catalog usable for basic anonymous browsing.

#### E-M2-001: Fixture-Backed Catalog Table

Labels: `type:epic`, `milestone:M2`, `status:done`

Tasks:

- T-M2-001: Add a read-only table layout for public books.
- T-M2-002: Support basic search, filters, pagination, loading, empty, and localized
  error states.
- T-M2-003: Add mock/test fixtures for visible catalog states.

Acceptance Criteria:

- Users can scan and filter public books without implementation placeholders.
- Component tests cover fixture-backed visible states.

### M3: Advanced Catalog Controls

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Make catalog state navigable, shareable, and richer without changing backend
request semantics.

#### E-M3-001: URL-Synced Catalog Controls

Labels: `type:epic`, `milestone:M3`, `status:done`

Tasks:

- T-M3-001: Route catalog state through React Router query strings.
- T-M3-002: Add browser history expectations for catalog navigation.
- T-M3-003: Add sorting UI, page-size controls, richer table controls, and deeper
  catalog state handling.

Acceptance Criteria:

- Users can share filtered catalog URLs.
- Browser back/forward controls work with catalog query state.
- Tests cover route and query-state synchronization.

### M4: Local Auth Workflow Docs

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Document repeatable local same-origin auth against the sibling backend.

#### E-M4-001: Local Auth Procedure

Labels: `type:epic`, `milestone:M4`, `status:done`

Tasks:

- T-M4-001: Document backend startup for `..\technical-interview-demo`.
- T-M4-002: Document Vite `/api` proxy wiring and OAuth setup.
- T-M4-003: Document manual smoke steps and automation limits.

Acceptance Criteria:

- `SETUP.md` links to `docs/LOCAL_AUTH_SMOKE.md`.
- The local auth smoke doc covers provider credentials, admin identity seeding,
  session/account/logout checks, CSRF handling, and anonymous-vs-authenticated
  automation policy.

### M5: Authenticated Session UX

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Make authenticated session state visible and usable in the frontend.

#### E-M5-001: Session Header And Route Guards

Labels: `type:epic`, `milestone:M5`, `status:done`

Tasks:

- T-M5-001: Add account-aware header and session state.
- T-M5-002: Add logout flow.
- T-M5-003: Add route guarding for authenticated-only areas.

Acceptance Criteria:

- UI refreshes session after login and logout paths.
- Unsafe authenticated writes mirror CSRF metadata.
- Smoke or e2e coverage follows the documented local workflow.

### M6: Account Profile Surface

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add the first authenticated account surface.

#### E-M6-001: Read-Only Account Profile

Labels: `type:epic`, `milestone:M6`, `status:done`

Tasks:

- T-M6-001: Add a read-only account profile page.
- T-M6-002: Add account-aware menu and header behavior.
- T-M6-003: Cover unauthenticated and authenticated profile states.

Acceptance Criteria:

- Account UI appears only after session bootstrap establishes the current user.
- Tests cover unauthenticated and authenticated states.

### M7: Account Language Preference

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Let users manage their contract-backed language preference.

#### E-M7-001: Account Language Self-Service

Labels: `type:epic`, `milestone:M7`, `status:done`

Tasks:

- T-M7-001: Read the current user's preferred language.
- T-M7-002: Update and clear the preferred language with CSRF handling.
- T-M7-003: Cover loading, success, validation/error, unauthenticated, and
  missing-CSRF states.

Acceptance Criteria:

- Users can update or clear the account language preference.
- Tests cover the selected success and failure states.

### M8: Admin Catalog Management

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add contract-backed admin book and category management.

#### E-M8-001: Admin Book And Category Operations

Labels: `type:epic`, `milestone:M8`, `status:done`

Tasks:

- T-M8-001: Select combined book/category admin scope from the imported backend
  contract.
- T-M8-002: Split the selected admin catalog behavior into a focused spec.
- T-M8-003: Implement list, create, update, delete, and error states.

Acceptance Criteria:

- Combined book/category admin scope follows the backend contract.
- Tests cover list, create, update, delete, and error states.

### M9: Admin Localization Management

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add backend-supported localization message-key editing.

#### E-M9-001: Localization Admin Surface

Labels: `type:epic`, `milestone:M9`, `status:done`

Tasks:

- T-M9-001: Select localization admin scope from the imported backend contract.
- T-M9-002: Add supported locale and coverage/status handling.
- T-M9-003: Cover message edits and localized failures.

Acceptance Criteria:

- Localization admin behavior is split into a focused spec.
- Tests cover supported locales, message edits, coverage/status states, and
  localized failures.

### M10: Operator Audit Surface

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Let operators inspect runtime status and audit activity.

#### E-M10-001: Operator Runtime And Audit Views

Labels: `type:epic`, `milestone:M10`, `status:done`

Tasks:

- T-M10-001: Add read-only operator overview.
- T-M10-002: Add pageable audit log filters for target type, action, and actor.
- T-M10-003: Add audit detail state handling.

Acceptance Criteria:

- Operators can inspect summaries, recent audit entries, filtered audit rows, and
  audit details.
- Tests cover access, loading, empty, filtered, paginated, localized error, and
  partial-payload states.

### M11: Admin User Management

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Let admins review users and manage contract-backed roles.

#### E-M11-001: Admin User Role Management

Labels: `type:epic`, `milestone:M11`, `status:done`

Tasks:

- T-M11-001: Add admin user list and detail views.
- T-M11-002: Show role-grant provenance.
- T-M11-003: Replace managed roles with CSRF handling.

Acceptance Criteria:

- Admins can review user profiles, roles, and role-grant provenance.
- Tests cover access, empty, success, validation, localized error, and missing-CSRF
  states.

### M12: Release Procedure And `0.1.0` Hardening

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Goal: Adapt backend-style release preparation to the frontend repository.

#### E-M12-001: First Release Procedure

Labels: `type:epic`, `milestone:M12`, `status:done`

Tasks:

- T-M12-001: Select frontend version and changelog promotion rules.
- T-M12-002: Add validation, annotated tag, and publication checks.
- T-M12-003: Add post-release roadmap cleanup expectations.

Acceptance Criteria:

- Maintainers can cut the first frontend release from `main` using documented
  procedure.
- `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation evidence, and tag state
  agree.

### M13: Static Analysis And Hardening Tooling

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Goal: Add selected hardening checks that have repeatable evidence and owners.

#### E-M13-001: Selected Hardening Gates

Labels: `type:epic`, `milestone:M13`, `status:done`

Tasks:

- T-M13-001: Add explicit GitHub Actions permissions and concurrency controls.
- T-M13-002: Add CodeQL, dependency-review, npm audit, and Dependabot grouping.
- T-M13-003: Document triage, false-positive, skip, and exception rules.

Acceptance Criteria:

- CI and local scripts expose the selected checks.
- Release preconditions name required hardening evidence.
- Findings have documented owners and artifact locations.

### M14: Human Procedure Documentation

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Goal: Add human-facing procedure docs without duplicating procedure bodies in entry
points.

#### E-M14-001: Frontend Procedure Owners

Labels: `type:epic`, `milestone:M14`, `status:done`

Tasks:

- T-M14-001: Add `docs/DEVELOPMENT_LIFECYCLE.md`.
- T-M14-002: Add `docs/LOCAL_DEVELOPMENT.md`, `docs/WORKING_WITH_AI.md`, and
  `docs/README.md`.
- T-M14-003: Link `README.md`, `SETUP.md`, and `CONTRIBUTING.md` to owners.

Acceptance Criteria:

- Human procedure docs exist under `docs/`.
- Entry-point docs link to the owners without duplicating full procedures.

### M15: AI Procedure Reference Layer

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Goal: Add lean AI-facing owner guides for repository procedure.

#### E-M15-001: Focused AI References

Labels: `type:epic`, `milestone:M15`, `status:done`

Tasks:

- T-M15-001: Add AI references for documentation routing and validation selection.
- T-M15-002: Add AI references for review/security review and release sequencing.
- T-M15-003: Keep backend-only workflow state deferred.

Acceptance Criteria:

- `.agents/references/documentation.md`, `.agents/references/testing.md`,
  `.agents/references/reviews.md`, and `.agents/references/releases.md` exist.
- `AGENTS.md` points to the focused references.

### M16: Contract Coverage And Scope Audit

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Audit approved backend operations against the implemented frontend surface.

#### E-M16-001: API Coverage Classification

Labels: `type:epic`, `milestone:M16`, `status:done`

Tasks:

- T-M16-001: Compare approved OpenAPI operations with generated types, clients,
  routes, specs, and tests.
- T-M16-002: Classify operation coverage in `docs/API_COVERAGE.md`.
- T-M16-003: Decide whether M22 should select a backend surface expansion.

Acceptance Criteria:

- `docs/API_COVERAGE.md` classifies all 22 approved operations as implemented.
- No uncovered operation gap requires M22 surface selection.

### M17: Anonymous Browser Smoke Automation

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Add canonical anonymous same-origin smoke automation.

#### E-M17-001: Anonymous Smoke Command

Labels: `type:epic`, `milestone:M17`, `status:done`

Tasks:

- T-M17-001: Add `npm run smoke:anonymous`.
- T-M17-002: Cover session bootstrap and public catalog flows.
- T-M17-003: Document prerequisites and skip behavior.

Acceptance Criteria:

- Anonymous smoke can run without credentials through the frontend `/api/**` proxy.
- The command reports clear skip behavior when prerequisites are unavailable.

### M18: Authenticated Smoke Automation Readiness

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Define fake-OAuth readiness for repeatable local authenticated smoke.

#### E-M18-001: Fake-OAuth Authenticated Smoke Contract

Labels: `type:epic`, `milestone:M18`, `status:done`

Tasks:

- T-M18-001: Document `local,oauth,fake-oauth` backend profile usage.
- T-M18-002: Document `smoke` provider discovery from `GET /api/session`.
- T-M18-003: Document `smoke:smoke-user` admin seeding, CSRF/logout/account/admin
  checks, and skip/fail behavior.

Acceptance Criteria:

- `docs/LOCAL_AUTH_SMOKE.md` owns fake-OAuth readiness.
- The readiness contract names the local profile, provider, seed identity, and
  smoke behavior.

### M19: Public Catalog Workflow Polish

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Polish the implemented anonymous public catalog workflow without backend
changes.

#### E-M19-001: Public Catalog Route State Polish

Labels: `type:epic`, `milestone:M19`, `status:done`

Tasks:

- T-M19-001: Canonicalize public catalog route query state.
- T-M19-002: Add visible active filter, sort, page, and default-filter summaries.
- T-M19-003: Improve accessible sort affordances.

Acceptance Criteria:

- Component/route tests cover canonical URL replacement and visible query-state
  summaries.
- Existing request serialization remains unchanged.

### M20: Container And Deployment Hardening Refinement

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Add an advisory first pass for frontend-owned container and deployment
hardening.

#### E-M20-001: Advisory Runtime And Deployment Checks

Labels: `type:epic`, `milestone:M20`, `status:done`

Tasks:

- T-M20-001: Add `npm run hardening:runtime`.
- T-M20-002: Add `npm run hardening:kube-linter`.
- T-M20-003: Add `npm run hardening:trivy` and `npm run hardening:m20`.
- T-M20-004: Keep findings advisory until stable thresholds and an exception
  workflow are selected.

Acceptance Criteria:

- Selected hardening commands exist and produce local or CI evidence.
- Findings remain advisory until selected thresholds and exception workflow exist.

### M21: Login Provider Metadata Guardrail

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Prevent regressions that hard-code login provider paths.

#### E-M21-001: Metadata-Driven Login Tests

Labels: `type:epic`, `milestone:M21`, `status:done`

Tasks:

- T-M21-001: Add regression coverage for `loginProviders[]`.
- T-M21-002: Prove provider links use `authorizationPath`.
- T-M21-003: Prove no login entry point is invented when metadata omits an
  authorization path.

Acceptance Criteria:

- Auth/session tests guard metadata-driven provider rendering.
- Login behavior remains owned by backend session metadata.

### M22: Backend Surface Expansion Selection

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Convert M16 coverage gaps into selected backend-supported surface work when
needed.

#### E-M22-001: Surface Expansion Decision

Labels: `type:epic`, `milestone:M22`, `status:done`

Tasks:

- T-M22-001: Review M16 operation classifications.
- T-M22-002: Decide whether an approved operation gap requires selected frontend
  scope.

Acceptance Criteria:

- No surface is selected because M16 found no uncovered approved backend operations.

### M23: Dark Mode Support

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Add app-level theme preference across implemented flows without backend
behavior changes.

#### E-M23-001: Light Dark System Theme Preference

Labels: `type:epic`, `milestone:M23`, `status:done`

Tasks:

- T-M23-001: Add app-level light, dark, and system theme preference.
- T-M23-002: Apply theme behavior across public catalog, account, admin, and
  operator flows.
- T-M23-003: Preserve keyboard focus visibility and accessible contrast.

Acceptance Criteria:

- Theme selection renders consistently across implemented routes.
- Explicit preferences survive reloads.
- Focused route/component coverage and browser evidence cover representative shells.

### M24: Post-`0.1.0` Release Preparation

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Prepare `0.2.0` release metadata, validation evidence, and publication.

#### E-M24-001: `0.2.0` Release Evidence

Labels: `type:epic`, `milestone:M24`, `status:done`

Tasks:

- T-M24-001: Align `CHANGELOG.md`, `ROADMAP.md`, and package metadata for `v0.2.0`.
- T-M24-002: Capture validation evidence.
- T-M24-003: Prepare GitHub Release, GHCR image tags, signature/provenance evidence,
  and published release notes.

Acceptance Criteria:

- Release metadata, validation evidence, package state, and published notes agree
  for `v0.2.0`.

### M24-LOCAL: Browser Session Surface Cleanup

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Legacy counter: `M24`

Goal: Move technical browser session diagnostics out of primary page content.

#### E-M24-LOCAL-001: Session Details Chrome Surface

Labels: `type:epic`, `milestone:M24-LOCAL`, `status:done`

Tasks:

- T-M24-LOCAL-001: Move Browser Session status and metadata into a hidden-by-default
  Session details surface.
- T-M24-LOCAL-002: Keep diagnostics reachable through an explicit accessible
  control.
- T-M24-LOCAL-003: Preserve session bootstrap, login, and logout behavior.

Acceptance Criteria:

- Primary implemented pages no longer show the Browser Session panel by default.
- Session diagnostics remain reachable on demand.
- Session behavior remains unchanged.

### M25: Public Catalog And App Shell Visual Design Pass

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Polish the anonymous `/catalog` flow and shared app shell after session
surface cleanup.

#### E-M25-001: Catalog And Shell Visual Polish

Labels: `type:epic`, `milestone:M25`, `status:done`

Tasks:

- T-M25-001: Improve header/action layout, intro hierarchy, filters, category chips,
  and query summary.
- T-M25-002: Improve table readability, pagination, focus-visible styling, and
  responsive behavior.
- T-M25-003: Preserve existing route, query, session, and theme behavior.

Acceptance Criteria:

- Catalog and shell are easier to scan on desktop and mobile.
- Keyboard focus stays visible.
- Browser evidence covers representative light and dark catalog states.

### M26: Contract-Backed Mock API Development Mode

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Let frontend-only development run without the sibling backend while
preserving the approved API shape.

#### E-M26-001: Opt-In Same-Origin Mock API

Labels: `type:epic`, `milestone:M26`, `status:done`

Tasks:

- T-M26-001: Add opt-in Vite mock API development mode.
- T-M26-002: Support admin, user, anonymous, success, empty, and error scenarios.
- T-M26-003: Keep in-memory mutations for development and document live backend
  smoke as the contract-confidence path.

Acceptance Criteria:

- `npm run dev:mock` runs against same-origin `/api/**` mock middleware.
- Mock behavior preserves generated OpenAPI type alignment.
- The mock path does not become an alternate production integration path.

### M27: Admin Catalog Actions Column Polish

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Keep admin book row actions compact and scannable.

#### E-M27-001: Admin Catalog Row Action Polish

Labels: `type:epic`, `milestone:M27`, `status:done`

Tasks:

- T-M27-001: Polish the admin books table actions column.
- T-M27-002: Prevent long edit/delete labels from creating bulky multi-line
  buttons.
- T-M27-003: Preserve backend/API, auth, sorting, filtering, pagination,
  localization, and destructive-action behavior.

Acceptance Criteria:

- Admin catalog row actions remain easy to scan and operate on desktop and mobile.
- Long labels do not distort the table.
- Edit/delete intent and safeguards remain unchanged.

## Completed Supporting Work

### E-DOC-001: Procedure Adoption

Labels: `type:epic`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Tasks:

- T-DOC-001: Add `docs/DEVELOPMENT_LIFECYCLE.md` for human-facing lifecycle and
  artifact routing.
- T-DOC-002: Add `docs/LOCAL_DEVELOPMENT.md` for npm commands, CI reproduction,
  local troubleshooting, backend-contract refresh, browser smoke workflow, and
  hardening commands.
- T-DOC-003: Add `docs/WORKING_WITH_AI.md` for human guidance on AI planning,
  implementation, validation, review, and release preparation.
- T-DOC-004: Add `docs/README.md` as the human-facing documentation index.
- T-DOC-005: Add focused AI references for documentation, testing, reviews, and
  releases.

Acceptance Criteria:

- Entry-point docs link to the owner documents.
- `AGENTS.md` points to focused AI references without duplicating full procedures.

### E-HARDEN-ARCHIVE-001: Completed Hardening Tooling

Labels: `type:epic`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Tasks:

- T-HARDEN-ARCHIVE-001: Add explicit GitHub Actions permissions and concurrency
  controls on every workflow.
- T-HARDEN-ARCHIVE-002: Add CodeQL for TypeScript/JavaScript source and GitHub
  workflow analysis.
- T-HARDEN-ARCHIVE-003: Add dependency-review with private-repository advisory
  mode.
- T-HARDEN-ARCHIVE-004: Add an npm-compatible audit script using a high-or-critical
  advisory threshold.
- T-HARDEN-ARCHIVE-005: Add Dependabot groups for runtime dependencies,
  tooling/test dependencies, and Actions updates.

Acceptance Criteria:

- M13-A selected the smallest useful hardening set for the `0.1.0` hardening pass.
- M13-B implemented the checks without adding deferred artifact, credential,
  threshold, or custom-rule gates.
