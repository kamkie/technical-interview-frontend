# Roadmap

This roadmap tracks selected, planned, blocked, and non-goal first-party browser
frontend work for the sibling `technical-interview-demo` backend. Roadmap editing
rules are owned by `.agents/references/roadmap.md`.

Roadmap hierarchy:

- Milestone: delivery slice with an outcome and order.
- Epic: product or workflow area inside a milestone.
- Task: actionable unit inside an epic.

Labels use `milestone:*`, `epic:*`, and `status:*` so the hierarchy stays
searchable without turning the roadmap into a table. Backend contract details,
validation selection, and AI procedure rules stay in their owner documents instead
of being repeated on every item.

## Release Context

- Release phase: Post-`0.2.0` maintenance.
- Next target version: Future maintenance release; final scope and version
  selected before release prep.
- Current priority: M1 Production UI Foundation.
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

## Milestones

### M1 Production UI Foundation

Labels: `milestone:M1-production-ui`, `status:ready`

Goal: Make the existing frontend read as a production work tool rather than a
technical demo.

#### Epic: Shell And Navigation

Labels: `milestone:M1-production-ui`, `epic:shell-navigation`, `status:ready`

Tasks:

- Rework primary navigation around catalog, account, and operator workflows.
- Move admin workflows into a distinct menu or section.
- Make authentication and session controls user-facing first.
- Keep diagnostics secondary to everyday user actions.

Acceptance Criteria:

- Primary navigation no longer mixes admin and user workflows.
- Admin routes remain discoverable for authorized users.
- Backend-backed session, login/logout, and route guard behavior is unchanged.
- Route/component coverage protects the redesigned shell.

#### Epic: Route Context And State Basics

Labels: `milestone:M1-production-ui`, `epic:route-context`, `status:ready`

Tasks:

- Add route context so each work area has clear location, state, and available
  actions.
- Reduce exposed refresh and control clutter where automatic state or route context
  can carry the interaction.
- Improve empty, loading, and error states without branching on localized English
  display messages.

Acceptance Criteria:

- Catalog, account, admin, and operator routes explain their current context.
- Primary actions are visible without overwhelming the page.
- State handling uses stable fields such as status, `messageKey`, and endpoint
  context.

### M2 Workflow Polish

Labels: `milestone:M2-workflow-polish`, `status:waiting`

Goal: Improve daily catalog, account, admin, and operator workflows after the
production shell foundation lands.

Depends on: M1 Production UI Foundation.

#### Epic: Visual Hierarchy

Labels: `milestone:M2-workflow-polish`, `epic:visual-hierarchy`, `status:waiting`

Tasks:

- Establish consistent page headers, content bands, and action placement.
- Reduce nested cards and competing visual weight.
- Keep state and primary actions visible without adding backend behavior.

Acceptance Criteria:

- Main catalog, account, admin, and operator pages have clear visual hierarchy.
- Route/component coverage protects unchanged backend-backed flows.

#### Epic: State Semantics

Labels: `milestone:M2-workflow-polish`, `epic:state-semantics`, `status:waiting`

Tasks:

- Normalize loading, empty, success, and error state presentation across routes.
- Keep localized messages as display content.
- Branch on stable fields and route context instead of English display text.

Acceptance Criteria:

- Shared state patterns are predictable across user, admin, and operator surfaces.
- Tests cover state handling without depending on localized English strings.

#### Epic: Catalog Workflows

Labels: `milestone:M2-workflow-polish`, `epic:catalog-workflows`, `status:waiting`

Tasks:

- Improve table scanning, pagination, sorting, and repeated filter interactions.
- Clarify form prominence and action hierarchy.
- Preserve update flows that require book `version` values.

Acceptance Criteria:

- Catalog and admin catalog tables are efficient to scan and operate.
- Form actions and table actions have clear relative priority.
- Tests cover pagination, sorting, repeated filters, and versioned updates.

#### Epic: Admin And Operator Workflows

Labels: `milestone:M2-workflow-polish`, `epic:admin-operator`, `status:waiting`

Tasks:

- Group controls by workflow rather than API surface.
- Improve dense scanning of admin catalog, user, and operator states.
- Preserve existing admin and operator backend operations.

Acceptance Criteria:

- Admin and operator pages support fast scanning and repeated actions.
- Tests cover grouped controls, state handling, and unchanged operations.

#### Epic: Account And Session Copy

Labels: `milestone:M2-workflow-polish`, `epic:account-session`, `status:waiting`

Tasks:

- Render login options from session metadata without hard-coded provider paths.
- Keep logout and account preference flows visible and understandable.
- Reduce technical labels, raw identifiers, and diagnostics in primary UI.

Acceptance Criteria:

- Session controls, login provider rendering, logout, and preference updates are
  covered by route/component tests.
- User-facing copy is clearer without changing stable backend behavior.

### M3 Responsive Layout And Smoke Evidence

Labels: `milestone:M3-responsive-smoke`, `status:waiting`

Goal: Keep redesigned workflows usable across viewports and add repeatable browser
smoke evidence for the most important routes.

Depends on: M2 Workflow Polish.

#### Epic: Responsive Layout

Labels: `milestone:M3-responsive-smoke`, `epic:responsive-layout`, `status:waiting`

Tasks:

- Make responsive behavior deliberate instead of simple vertical stacking.
- Keep table state and row actions discoverable on small screens.
- Verify auth controls and primary navigation remain usable.

Acceptance Criteria:

- Responsive route/component or browser coverage protects selected layouts.
- Tables, filters, action groups, and auth controls remain coherent on mobile and
  desktop widths.

#### Epic: Authenticated Browser Smoke

Labels: `milestone:M3-responsive-smoke`, `epic:smoke-auth`, `status:waiting`

Tasks:

- Add repeatable smoke evidence for session bootstrap, authenticated route access,
  and logout.
- Extend beyond fake-OAuth readiness only where local procedure owners can support
  repeatable evidence.
- Record the frontend URL, backend profile, flow covered, and any skipped
  authenticated steps.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected authenticated flow.
- Failures point to an owned workflow, route, or backend-contract issue.

#### Epic: Anonymous Browser Smoke

Labels: `milestone:M3-responsive-smoke`, `epic:smoke-anonymous`, `status:waiting`

Tasks:

- Add repeatable smoke evidence for anonymous shell and public catalog paths.
- Select the anonymous routes that carry the most user-visible risk.
- Keep smoke traffic same-origin and `/api/**` shaped.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected anonymous flow.
- The smoke result identifies the frontend URL and route coverage.

## Blocked Backlog

Blocked items are planned work, but they need a product choice, stable threshold,
credential, owner, or repeatable failure before implementation can start.

### M4 Quality Gates

Labels: `milestone:M4-quality-gates`, `status:blocked`

Goal: Add enforceable accessibility, smoke, and hardening evidence only after the
repository has selected thresholds, owners, and failure behavior.

#### Epic: Accessibility Automation

Labels: `milestone:M4-quality-gates`, `epic:accessibility`, `status:blocked`

Blocked by: Accessibility thresholds and failure ownership are not selected.

Tasks:

- Select the accessibility command, threshold, skip rules, and failure owner.
- Decide whether the check runs locally, in CI, or both.
- Add the check only after results are actionable.

Acceptance Criteria:

- The selected command, threshold, skip rules, and failure owner are documented.
- The check can run locally or in CI with actionable results.

#### Epic: Smoke Gap Promotion

Labels: `milestone:M4-quality-gates`, `epic:smoke`, `status:blocked`

Blocked by: No repeatable local smoke gap is currently documented.

Tasks:

- Identify the affected route, component, workflow, or owner document.
- Turn the repeatable failure into component, route, browser, or procedure
  coverage.

Acceptance Criteria:

- The gap identifies a clear owner.
- A targeted test or procedure covers the repeatable failure.

#### Epic: Hardening Thresholds

Labels: `milestone:M4-quality-gates`, `epic:hardening`, `status:blocked`

Blocked by: Hardening thresholds, owners, report formats, and exception rules are
not selected.

Tasks:

- Decide when container vulnerability, deployment posture, and runtime hardening
  findings should fail release work.
- Select SBOM and license inventory format, publication path, and triage
  expectations.
- Define any bundle-size or asset-budget thresholds and exception process.
- Decide whether GitHub Actions SHA pinning is required and how pinned versions
  stay current.
- Add custom frontend security lint rules only for repeated issue patterns not
  covered by selected tools.
- Upload CI hardening artifacts only after reports are stable enough to retain.

Acceptance Criteria:

- Thresholds, owners, exception rules, and report paths are documented before checks
  become release-blocking.
- Selected commands produce actionable local or CI evidence.
- Advisory findings do not accidentally become release-blocking before thresholds
  are selected.

## Product Non-Goals

These are deliberate product and integration boundaries for the current roadmap.

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
