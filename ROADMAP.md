# Roadmap

This roadmap tracks selected, planned, blocked, and rejected first-party browser
frontend work for the sibling `technical-interview-demo` backend. Roadmap editing
rules are owned by `.agents/references/roadmap.md`.

Roadmap items are goal-first. Backend contract details, validation selection, and
AI procedure rules stay in their owner documents instead of being repeated on every
item.

## Release Context

- Release phase: Post-`0.2.0` maintenance.
- Next target version: Future maintenance release; final scope and version
  selected before release prep.
- Current priority: Production UI redesign foundation.
- Selection policy: Breaking user-facing or backend-contract integration changes
  require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical
  demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator
  workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven
  login/logout, CSRF, localization, pagination, repeated filters, and versioned
  update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the
  roadmap or owner document defines the command, evidence, threshold, and failure
  owner.

## Current Priority

### Production UI Redesign Foundation

Status: Ready

Goal: Make the existing frontend read as a production work tool rather than a
technical demo.

Scope:

- Rework the shell so primary navigation serves catalog, account, and operator
  workflows.
- Move admin workflows into a distinct menu or section.
- Make authentication and session controls user-facing first, with diagnostics
  secondary.
- Add route context so each work area has clear location, state, and available
  actions.
- Improve empty, loading, and error states without branching on localized English
  display messages.

Done when:

- Main catalog, account, admin, and operator routes have production-shaped layout
  and navigation.
- Admin links no longer compete with primary user navigation.
- Backend-backed session, login/logout, catalog, account, admin, and operator flows
  keep their existing contract behavior.
- Route/component coverage protects the redesigned shell and unchanged flows.

## Planned Roadmap

Items are listed in priority order. They stay Waiting until predecessor work lands
or a future roadmap update selects them as the current priority.

### Visual Hierarchy And Page Structure

Status: Waiting

Goal: Make each route scan like a coherent work area instead of a collection of
equally weighted panels.

Scope:

- Establish consistent page headers, content bands, and action placement.
- Reduce nested cards and competing visual weight.
- Keep state and primary actions visible without adding new backend behavior.

Done when:

- Main catalog, account, admin, and operator pages have clear visual hierarchy.
- Route/component coverage protects unchanged backend-backed flows.

Depends on: Production UI redesign foundation.

### Status And State Semantics

Status: Waiting

Goal: Make loading, empty, success, and error states consistent across user,
admin, and operator workflows.

Scope:

- Normalize state presentation across catalog, account, admin, and operator routes.
- Branch on stable fields such as status, `messageKey`, endpoint context, and route
  context rather than localized English text.
- Keep localized messages as display content.

Done when:

- Shared state patterns are predictable across routes.
- Tests cover state handling without depending on English display messages.

Depends on: Production UI redesign foundation.

### Catalog/Table/Form Action Hierarchy

Status: Waiting

Goal: Make catalog and admin catalog workflows easier to scan, filter, edit, and
complete.

Scope:

- Improve table scanning, pagination, sorting, and repeated filter interactions.
- Clarify form prominence and action hierarchy.
- Preserve update flows that require book `version` values.

Done when:

- Catalog and admin catalog tables are efficient to scan and operate.
- Form actions and table actions have clear relative priority.
- Tests cover pagination, sorting, repeated filters, and versioned updates.

Depends on: Status and state semantics.

### Admin/Operator Operational Workflow Density

Status: Waiting

Goal: Make admin and operator pages efficient for repeated operational use.

Scope:

- Group controls by workflow rather than API surface.
- Improve dense scanning of admin catalog, user, and operator states.
- Preserve existing admin and operator backend operations.

Done when:

- Admin and operator pages support fast scanning and repeated actions.
- Tests cover grouped controls, state handling, and unchanged operations.

Depends on: Catalog/table/form action hierarchy.

### Responsive Layout And Table Scanning

Status: Waiting

Goal: Keep the shell, filters, action groups, and tables usable across narrow and
wide viewports.

Scope:

- Make responsive behavior deliberate instead of simple vertical stacking.
- Keep table state and row actions discoverable on small screens.
- Verify auth controls and primary navigation remain usable.

Done when:

- Responsive route/component or browser coverage protects the selected layouts.
- Tables, filters, action groups, and auth controls remain coherent on mobile and
  desktop widths.

Depends on: Catalog/table/form action hierarchy and admin/operator workflow
density.

### Account/Session And Product Copy

Status: Waiting

Goal: Make account, session, and authentication copy feel product-facing while
preserving metadata-driven auth behavior.

Scope:

- Render login options from session metadata without hard-coded provider paths.
- Keep logout and account preference flows visible and understandable.
- Reduce technical labels, raw identifiers, and diagnostics in primary UI.

Done when:

- Session controls, login provider rendering, logout, and preference updates are
  covered by route/component tests.
- User-facing copy is clearer without changing stable backend behavior.

Depends on: Status and state semantics.

### Authenticated Browser Smoke

Status: Waiting

Goal: Add repeatable smoke evidence for session bootstrap, authenticated route
access, and logout.

Scope:

- Extend beyond fake-OAuth readiness only where local procedure owners can support
  repeatable evidence.
- Record the frontend URL, backend profile, flow covered, and any skipped
  authenticated steps.

Done when:

- A documented smoke command or procedure covers the selected authenticated flow.
- Failures point to an owned workflow, route, or backend-contract issue.

Depends on: Production UI redesign foundation.

### Anonymous Browser Smoke

Status: Waiting

Goal: Add repeatable smoke evidence for anonymous shell and public catalog paths.

Scope:

- Select the anonymous routes that carry the most user-visible risk.
- Keep smoke traffic same-origin and `/api/**` shaped.

Done when:

- A documented smoke command or procedure covers the selected anonymous flow.
- The smoke result identifies the frontend URL and route coverage.

Depends on: Production UI redesign foundation.

## Blocked Backlog

Blocked items are planned work, but they need a product choice, stable threshold,
credential, owner, or repeatable failure before implementation can start.

### Accessibility Automation

Status: Blocked

Goal: Add automated accessibility evidence with a stable threshold and failure
owner.

Blocked by: Accessibility thresholds and failure ownership are not selected.

Done when unblocked:

- The selected command, threshold, skip rules, and failure owner are documented.
- The check can run locally or in CI with actionable results.

### Promote Repeatable Local Smoke Gaps Into Tests

Status: Blocked

Goal: Turn repeatable smoke failures into durable component, route, or browser
coverage.

Blocked by: No repeatable local smoke gap is currently documented.

Done when unblocked:

- The gap identifies the affected route, component, workflow, or owner document.
- A targeted test or procedure covers the repeatable failure.

### Container Vulnerability And Runtime Posture Thresholds

Status: Blocked

Goal: Decide when container vulnerability, deployment posture, and runtime
hardening findings should fail release work.

Blocked by: Stable thresholds, owners, and exception rules are not selected.

Done when unblocked:

- Thresholds and exception rules are documented.
- The selected hardening command produces actionable local or CI evidence.

### SBOM And License Reporting

Status: Blocked

Goal: Produce dependency and license inventory evidence for the published container
package.

Blocked by: Inventory format, publication path, and triage expectations are not
selected.

Done when unblocked:

- The selected SBOM/license command and output location are documented.
- Package or workflow changes are covered by the standard validation baseline.

### Bundle-Size Or Asset-Budget Checks

Status: Blocked

Goal: Keep production bundle and asset growth visible before it becomes a review
problem.

Blocked by: No reviewed threshold exists, and production `dist/` growth has not
become a repeated issue.

Done when unblocked:

- The selected threshold and exception process are documented.
- The selected check runs locally or in CI with actionable output.

### GitHub Actions SHA Pinning

Status: Blocked

Goal: Tighten workflow supply-chain posture without creating unmaintained pinned
versions.

Blocked by: A stricter supply-chain policy or SHA update mechanism is not selected.

Done when unblocked:

- The pinning policy and update mechanism are documented.
- Workflow validation confirms the pinned actions still run.

### Custom Frontend Security Lint Rules

Status: Blocked

Goal: Catch repeated frontend security issues that selected tools do not cover.

Blocked by: No repeated issue pattern has been identified outside CodeQL, ESLint,
and existing checks.

Done when unblocked:

- The issue pattern and selected lint behavior are documented.
- The lint rule has targeted coverage and runs in the standard validation path.

### CI Artifact Upload For Hardening Reports

Status: Blocked

Goal: Preserve useful hardening evidence beyond workflow logs when reports become
stable enough to keep.

Blocked by: Selected checks do not yet write stable report files worth retaining.

Done when unblocked:

- Report paths, retention expectations, and failure ownership are documented.
- CI uploads the selected reports without making advisory findings release-blocking
  by accident.

## Rejected Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token
  auth.
- Backend-only operations and deployment runbooks until this frontend owns a
  deployment target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm,
  Kubernetes, and post-deploy smoke gates by default.
- Environment-specific deployment promotion beyond the GHCR package, checked-in
  reference manifests, and GitHub Release workflow.
- Generic planning scaffolds, command wrappers, and workflow-state directories
  until repeated frontend work proves they are worth the process cost.
