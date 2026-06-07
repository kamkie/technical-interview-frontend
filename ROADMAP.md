# Roadmap

This roadmap tracks active, planned, and explicitly deferred first-party browser
frontend work for the sibling `technical-interview-demo` backend. Roadmap editing
rules are owned by `.agents/references/roadmap.md`.

## Release Context

- Release phase: Post-`0.2.0` maintenance.
- Next target version: Future maintenance release; final scope and version
  selected before release prep.
- Active milestone: Production UI redesign foundation.
- Selection policy: Breaking user-facing or backend-contract integration changes
  require a selected roadmap row.

The selected implementation milestone is the production UI redesign foundation.
Remaining roadmap work follows that foundation before selecting narrower polish,
automation, or release-prep slices.

## Product Direction

- Extend the contract-first browser UI only for backend-supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.
- Keep any mock API development mode same-origin, `/api/**`-shaped,
  contract-backed, and opt-in; it must not become an alternate production
  integration path.
- Promote hardening, smoke, or release checks only when a selected roadmap row or
  owner document defines the threshold, evidence, and failure owner.

## Active Milestones

### Production UI Redesign Foundation

- Status: Ready.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by
  route/component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, account,
  admin, operator, and catalog behavior.
- Expected tests: Route/component coverage for shell navigation, route context,
  auth controls, admin grouping, state rendering, and unchanged backend-backed
  flows.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

Scope:

- Present the app as a production browser product, not as repository or technical
  demo framing.
- Reserve the primary shell and navigation for everyday catalog, account, and
  operator workflows.
- Move admin workflows into a distinct menu or section instead of mixing them with
  primary user navigation.
- Make authentication and session controls user-facing first, with diagnostics
  secondary.
- Provide route context for each work area so users can understand where they are
  and what actions are available.
- Reduce exposed refresh and control clutter where automatic state or route context
  can carry the interaction.
- Improve empty, loading, and error states without branching on localized English
  display messages.
- Preserve same-origin `/api/**`, session-cookie auth, CSRF, login provider,
  pagination, repeated filter, localization, and versioned update invariants from
  the backend contract sources.

## Near-Term Backlog

The active milestone above is the current Ready slice. The backlog below lists
follow-on slices in priority order. They remain Waiting until their predecessor work
lands or a future roadmap update selects them.

### Visual Hierarchy And Page Structure Pass

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by
  route/component layout tests.
- Backend contract source: No new API surface; preserve backend-backed route
  behavior from `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md`.
- Expected tests: Route/component coverage for page bands, route-specific layout
  hierarchy, card reduction, state visibility, and unchanged backend-backed flows.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

### Status And State Semantics Pass

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by shared
  state, route, and component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for stable fields such as status,
  `messageKey`, endpoint context, localization, and unchanged response handling.
- Expected tests: Shared state and route/component coverage for consistent catalog,
  account, admin, and operator statuses plus empty, loading, and error states that
  do not branch on English display text.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

### Catalog/Table/Form Action Hierarchy Pass

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by
  catalog/admin component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for catalog and admin catalog behavior.
- Expected tests: Catalog/admin component coverage for table scanning, form
  prominence, action hierarchy, pagination, sorting, repeated filters, and update
  version fields.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

### Admin/Operator Operational Workflow Density

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by
  admin/operator route and component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for admin and operator behavior.
- Expected tests: Admin/operator route and component coverage for product-shaped
  workflows, dense operational scanning, grouped controls, state handling, and
  unchanged backend-backed operations.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

### Responsive Layout And Table-Scanning Polish

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by responsive
  route/component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for unchanged backend-backed flows.
- Expected tests: Responsive route/component or browser coverage for shell
  navigation, tables, filters, action groups, auth controls, and table scanning
  beyond simple vertical stacking.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

### Account/Session And Product Copy Polish

- Status: Waiting.
- Durable owner: `ROADMAP.md`; later implementation behavior owned by auth/account
  route and component tests.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, account,
  localization, and display-message behavior.
- Expected tests: Auth/account route and component coverage for session controls,
  login provider rendering, logout, preference updates, technical labels, dialogs,
  identifiers, and localized state messaging.
- Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `git diff --check`.

Keep backend surface expansion unselected unless a future backend contract refresh
or product decision introduces an approved operation gap. Keep release-prep work
unselected until a concrete release candidate exists.

## Smoke And Local Procedure Backlog

Smoke and local procedure tasks are planned backlog scope. Items that still need a
threshold, credential, or repeatable local failure are Blocked rather than Deferred.

### Authenticated Browser Smoke Automation Beyond Fake-OAuth Readiness

- Status: Waiting.
- Durable owner: `ROADMAP.md`; existing fake-OAuth readiness remains in
  `docs/LOCAL_AUTH_SMOKE.md`.
- Backend contract source: `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, and route guard
  behavior.
- Predecessor: Finish the current Ready UI foundation before selecting the exact
  authenticated smoke command.
- Expected validation: Browser smoke evidence for session bootstrap, authenticated
  route access, and logout, plus affected route/component tests if behavior
  changes.

### Anonymous Browser Smoke Expansion

- Status: Waiting.
- Durable owner: `ROADMAP.md`; canonical local smoke procedure stays in its existing
  owner document.
- Backend contract source: No new API surface; preserve same-origin `/api/**`
  public and session behavior from the backend contract artifacts.
- Predecessor: Finish the current Ready UI foundation before selecting additional
  anonymous routes.
- Expected validation: Browser smoke evidence for the selected anonymous routes and
  affected route/component tests if behavior changes.

### Accessibility Automation

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future automation must define the threshold,
  evidence, and failure owner.
- Backend contract source: No new API surface.
- Blocking condition: Stable accessibility thresholds and failure ownership are not
  selected yet.
- Expected validation after unblock: The selected accessibility automation command
  plus the standard baseline for executable or workflow changes.

### Promote Repeatable Local Smoke Gaps Into Tests

- Status: Blocked.
- Durable owner: `ROADMAP.md`; the repeatable gap determines the component, route,
  browser test, or owner document that should carry it.
- Backend contract source: Use the backend contract artifacts when the gap covers
  API-backed behavior; otherwise use the owning workflow document.
- Blocking condition: No repeatable local smoke gap is currently documented.
- Expected validation after unblock: Component, route, or browser coverage for the
  repeatable gap, plus `git diff --check`.

## Hardening Backlog

Hardening tasks are planned backlog scope. They stay Blocked until the repository
has selected thresholds, policies, report formats, or owners that make the work
testable.

### Container Vulnerability And Runtime Posture Thresholds

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define thresholds, evidence, and
  exception rules.
- Backend contract source: No new API surface.
- Blocking condition: Stable thresholds, owners, and exception rules are not
  selected for container image vulnerability findings, deployment posture gates, or
  runtime infrastructure hardening beyond the advisory baseline.
- Expected validation after unblock: The selected container/runtime hardening
  command set plus the standard release or hardening baseline required by
  `.agents/references/testing.md`.

### SBOM And License Reporting

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define inventory format,
  publication path, and triage expectations.
- Backend contract source: No new API surface.
- Blocking condition: A durable dependency/license inventory requirement is not
  selected for the published container package.
- Expected validation after unblock: The selected SBOM/license reporting command
  plus the standard baseline if scripts, workflows, or package configuration
  change.

### Enforced Bundle-Size Or Asset-Budget Checks

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define the reviewed threshold and
  exception process.
- Backend contract source: No new API surface.
- Blocking condition: No reviewed threshold exists, and production `dist/` growth
  has not become a repeated review issue.
- Expected validation after unblock: The selected bundle or asset budget command
  plus the standard baseline for tooling or workflow changes.

### GitHub Actions SHA Pinning

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define the supply-chain policy and
  update mechanism.
- Backend contract source: No new API surface.
- Blocking condition: A stricter supply-chain policy or automation for keeping
  pinned SHAs current is not selected.
- Expected validation after unblock: Workflow configuration review plus the standard
  baseline for workflow/tooling changes.

### Custom Frontend Security Lint Rules

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define the repeated issue pattern
  and selected lint rule behavior.
- Backend contract source: No new API surface.
- Blocking condition: No repeated issue pattern has been identified that selected
  CodeQL, ESLint, or other checks fail to cover.
- Expected validation after unblock: The selected security lint command plus the
  standard baseline for lint/tooling changes.

### CI Artifact Upload For Hardening Reports

- Status: Blocked.
- Durable owner: `ROADMAP.md`; future owner must define report paths, retention
  expectations, and failure ownership.
- Backend contract source: No new API surface.
- Blocking condition: Selected checks do not yet write stable report files that
  should outlive workflow logs or code-scanning alerts.
- Expected validation after unblock: Workflow configuration review plus the
  selected hardening/report command that creates the uploaded artifact.

Do not add backend-only hardening gates. Do not make selected container/deployment
hardening release-blocking until one stable baseline exists and a severity or
posture threshold has been selected.

## Procedure Adoption Scope

The backend repository's procedure model should be adopted selectively. This
frontend needs clear ownership without backend operational weight.

Adopted procedure owners are indexed in `docs/README.md`. Completed procedure
adoption summaries are archived in `docs/ROADMAP_ARCHIVE.md`.

Deferred procedure tasks remain unselected until future work justifies adopting
the extra process in this frontend repository.

### Planning Reference And Reusable Plan Template

- Status: Deferred.
- Durable owner: `ROADMAP.md` until selected; future procedure details would belong
  in `.agents/references/planning.md`.
- Backend contract source: No new API surface.
- Revisit trigger: More large multi-milestone plans are expected.
- Expected validation when selected: `git diff --check` for docs-only procedure
  adoption, plus the standard baseline if scripts, workflows, or executable tooling
  change.

### Changed-File Classifier Or Command Wrapper

- Status: Deferred.
- Durable owner: `ROADMAP.md` until selected; future tooling details would belong in
  the package scripts, helper scripts, or focused AI references that invoke it.
- Backend contract source: No new API surface.
- Revisit trigger: CI time becomes a real bottleneck.
- Expected validation when selected: The selected command-wrapper validation plus
  the standard baseline for tooling or package-script changes.

### Durable Workflow-State Directories

- Status: Deferred.
- Durable owner: `ROADMAP.md` until selected; future workflow-state rules would
  belong with the focused AI procedure that consumes `.agents/context/`.
- Backend contract source: No new API surface.
- Revisit trigger: The repository starts using multi-agent delegation or long-lived
  sidecars again.
- Expected validation when selected: `git diff --check` for docs-only procedure
  adoption, plus the standard baseline if executable workflow tooling changes.

### Frontend Deployment And Operations Runbooks

- Status: Deferred.
- Durable owner: `ROADMAP.md` until the frontend owns a deployment target or runtime
  operations responsibility.
- Backend contract source: No new API surface.
- Revisit trigger: This frontend owns a deployment target or runtime operations
  responsibility.
- Expected validation when selected: Release or deployment validation selected by
  the new owner document, plus `git diff --check`.

### Backend-Specific Procedure Imports

- Status: Deferred.
- Durable owner: `ROADMAP.md`; lightweight frontend reference manifests remain under
  `infra/` until a deployment target is selected.
- Backend contract source: Backend REST Docs and operational procedures remain
  backend-owned unless a frontend integration task requires contract details.
- Revisit trigger: A frontend-owned deployment or operations responsibility requires
  adopting a specific backend-style procedure.
- Expected validation when selected: The selected frontend procedure validation;
  do not add backend-only Gradle, REST Docs, Flyway, restore-drill, application
  Helm, Kubernetes, or post-deploy smoke gates by default.

### Environment-Specific Deployment Promotion And Hosted Runtime Procedures

- Status: Deferred.
- Durable owner: `ROADMAP.md` until this frontend owns environment-specific
  deployment promotion, hosted runtime operations, or posture checks.
- Backend contract source: No new API surface.
- Revisit trigger: Frontend-owned deployment environments, hosted-runtime runbooks,
  or posture checks are selected outside the existing container/package/reference
  manifests.
- Expected validation when selected: The selected release, deployment, or hardening
  validation owned by the new procedure.

## Rejected Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Deployment promotion beyond the GHCR package, checked-in reference manifests, and
  GitHub Release workflow.
