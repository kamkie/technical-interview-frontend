# Roadmap

This roadmap tracks selected, planned, blocked, and non-goal first-party browser frontend work for the sibling `technical-interview-demo` backend. Roadmap editing rules are owned by `.agents/references/roadmap.md`.

Roadmap hierarchy:

- Milestone: delivery slice with an outcome and order.
- Epic: product or workflow area inside a milestone.
- Task: actionable unit inside an epic.
- Plan: execution artifact created when milestone work needs coordinated execution.

Stable IDs:

- Milestones use `M-AREA-NNN`.
- Epics use `E-AREA-NNN`.
- Tasks use `T-AREA-NNN`.
- Plans use `PLAN-short-kebab-slug`.

Keep IDs stable when wording, status, ordering, or section placement changes. Do not renumber existing IDs. When work is split, keep the original ID for the closest surviving item and assign new IDs to new items. Do not reuse retired IDs for unrelated work.

Labels use stable IDs so the hierarchy stays searchable without turning the roadmap into a table. Backend contract details, validation selection, and AI procedure rules stay in their owner documents instead of being repeated on every item.

## Release Context

- Release phase: Post-`0.2.0` maintenance.
- Next target version: Future maintenance release; final scope and version selected before release prep.
- Current priority: M-UI-001: Production UI Foundation.
- Active product plan: `PLAN-workflow-polish` is checked in for `M-WORKFLOW-001` planning; execution waits for `M-UI-001`.
- Selection policy: Breaking user-facing or backend-contract integration changes require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the roadmap or owner document defines the command, evidence, threshold, and failure owner.

## Milestones

### M-UI-001: Production UI Foundation

Labels: `type:milestone`, `status:ready`

Goal: Make the existing frontend read as a production work tool rather than a technical demo.

#### E-UI-001: Shell And Navigation

Labels: `type:epic`, `milestone:M-UI-001`, `status:ready`

Tasks:

- T-UI-001: Rework primary navigation around catalog, account, and operator workflows.
- T-UI-003: Make authentication and session controls user-facing first.
- T-UI-002: Move admin workflows into a distinct menu or section.
- T-UI-004: Keep diagnostics secondary to everyday user actions.

Acceptance Criteria:

- Primary navigation no longer mixes admin and user workflows.
- Admin routes remain discoverable for authorized users.
- Backend-backed session, login/logout, and route guard behavior is unchanged.
- Route/component coverage protects the redesigned shell.

#### E-UI-002: Route Context And State Basics

Labels: `type:epic`, `milestone:M-UI-001`, `status:ready`

Tasks:

- T-UI-005: Add route context so each work area has clear location, state, and available actions.
- T-UI-006: Reduce exposed refresh and control clutter where automatic state or route context can carry the interaction.
- T-UI-007: Improve empty, loading, and error states without branching on localized English display messages.

Acceptance Criteria:

- Catalog, account, admin, and operator routes explain their current context.
- Primary actions are visible without overwhelming the page.
- State handling uses stable fields such as status, `messageKey`, and endpoint context.

### M-WORKFLOW-001: Workflow Polish

Labels: `type:milestone`, `status:waiting`, `plan:PLAN-workflow-polish`

Plan ID: `PLAN-workflow-polish`

Goal: Improve daily catalog, account, admin, and operator workflows after the production shell foundation lands.

Depends on: M-UI-001.

#### E-STATE-001: State Semantics

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:waiting`

Tasks:

- T-STATE-001: Normalize loading, empty, success, and error state presentation across routes.
- T-STATE-002: Keep localized messages as display content.
- T-STATE-003: Branch on stable fields and route context instead of English display text.

Acceptance Criteria:

- Shared state patterns are predictable across user, admin, and operator surfaces.
- Tests cover state handling without depending on localized English strings.

#### E-WORKFLOW-001: Visual Hierarchy

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:waiting`

Tasks:

- T-WORKFLOW-001: Establish consistent page headers, content bands, and action placement.
- T-WORKFLOW-002: Reduce nested cards and competing visual weight.
- T-WORKFLOW-003: Keep state and primary actions visible without adding backend behavior.

Acceptance Criteria:

- Main catalog, account, admin, and operator pages have clear visual hierarchy.
- Route/component coverage protects unchanged backend-backed flows.

#### E-CATALOG-001: Catalog Workflows

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:waiting`

Tasks:

- T-CATALOG-001: Improve table scanning, pagination, sorting, and repeated filter interactions.
- T-CATALOG-002: Clarify form prominence and action hierarchy.
- T-CATALOG-003: Preserve update flows that require book `version` values.

Acceptance Criteria:

- Catalog and admin catalog tables are efficient to scan and operate.
- Form actions and table actions have clear relative priority.
- Tests cover pagination, sorting, repeated filters, and versioned updates.

#### E-OPS-001: Admin And Operator Workflows

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:waiting`

Tasks:

- T-OPS-001: Group controls by workflow rather than API surface.
- T-OPS-002: Improve dense scanning of admin catalog, user, and operator states.
- T-OPS-003: Preserve existing admin and operator backend operations.

Acceptance Criteria:

- Admin and operator pages support fast scanning and repeated actions.
- Tests cover grouped controls, state handling, and unchanged operations.

#### E-AUTH-001: Account And Session Copy

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:waiting`

Tasks:

- T-AUTH-001: Render login options from session metadata without hard-coded provider paths.
- T-AUTH-002: Keep logout and account preference flows visible and understandable.
- T-AUTH-003: Reduce technical labels, raw identifiers, and diagnostics in primary UI.

Acceptance Criteria:

- Session controls, login provider rendering, logout, and preference updates are covered by route/component tests.
- User-facing copy is clearer without changing stable backend behavior.

### M-SMOKE-001: Responsive Layout And Smoke Evidence

Labels: `type:milestone`, `status:waiting`

Goal: Keep redesigned workflows usable across viewports and add repeatable browser smoke evidence for the most important routes.

Depends on: M-WORKFLOW-001.

#### E-RESP-001: Responsive Layout

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:waiting`

Tasks:

- T-RESP-001: Make responsive behavior deliberate instead of simple vertical stacking.
- T-RESP-002: Keep table state and row actions discoverable on small screens.
- T-RESP-003: Verify auth controls and primary navigation remain usable.

Acceptance Criteria:

- Responsive route/component or browser coverage protects selected layouts.
- Tables, filters, action groups, and auth controls remain coherent on mobile and desktop widths.

#### E-SMOKE-002: Anonymous Browser Smoke

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:waiting`

Tasks:

- T-SMOKE-004: Add repeatable smoke evidence for anonymous shell and public catalog paths.
- T-SMOKE-005: Select the anonymous routes that carry the most user-visible risk.
- T-SMOKE-006: Keep smoke traffic same-origin and `/api/**` shaped.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected anonymous flow.
- The smoke result identifies the frontend URL and route coverage.

#### E-SMOKE-001: Authenticated Browser Smoke

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:waiting`

Tasks:

- T-SMOKE-001: Add repeatable smoke evidence for session bootstrap, authenticated route access, and logout.
- T-SMOKE-002: Extend beyond fake-OAuth readiness only where local procedure owners can support repeatable evidence.
- T-SMOKE-003: Record the frontend URL, backend profile, flow covered, and any skipped authenticated steps.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected authenticated flow.
- Failures point to an owned workflow, route, or backend-contract issue.

## Blocked Backlog

Blocked items are planned work, but they need a product choice, stable threshold, credential, owner, or repeatable failure before implementation can start.

### M-QUALITY-001: Quality Gates

Labels: `type:milestone`, `status:blocked`

Goal: Add enforceable accessibility, smoke, and hardening evidence only after the repository has selected thresholds, owners, and failure behavior.

#### E-A11Y-001: Accessibility Automation

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:blocked`

Blocked by: Accessibility thresholds and failure ownership are not selected.

Tasks:

- T-A11Y-001: Select the accessibility command, threshold, skip rules, and failure owner.
- T-A11Y-002: Decide whether the check runs locally, in CI, or both.
- T-A11Y-003: Add the check only after results are actionable.

Acceptance Criteria:

- The selected command, threshold, skip rules, and failure owner are documented.
- The check can run locally or in CI with actionable results.

#### E-SMOKE-003: Smoke Gap Promotion

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:blocked`

Blocked by: No repeatable local smoke gap is currently documented.

Tasks:

- T-SMOKE-007: Identify the affected route, component, workflow, or owner document.
- T-SMOKE-008: Turn the repeatable failure into component, route, browser, or procedure coverage.

Acceptance Criteria:

- The gap identifies a clear owner.
- A targeted test or procedure covers the repeatable failure.

#### E-HARDEN-001: Hardening Thresholds

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:blocked`

Blocked by: Hardening thresholds, owners, report formats, and exception rules are not selected.

Tasks:

- T-HARDEN-001: Decide when container vulnerability, deployment posture, and runtime hardening findings should fail release work.
- T-HARDEN-002: Select SBOM and license inventory format, publication path, and triage expectations.
- T-HARDEN-003: Define any bundle-size or asset-budget thresholds and exception process.
- T-HARDEN-004: Decide whether GitHub Actions SHA pinning is required and how pinned versions stay current.
- T-HARDEN-005: Add custom frontend security lint rules only for repeated issue patterns not covered by selected tools.
- T-HARDEN-006: Upload CI hardening artifacts only after reports are stable enough to retain.

Acceptance Criteria:

- Thresholds, owners, exception rules, and report paths are documented before checks become release-blocking.
- Selected commands produce actionable local or CI evidence.
- Advisory findings do not accidentally become release-blocking before thresholds are selected.

## Product Non-Goals

These are deliberate product and integration boundaries for the current roadmap.

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Backend-only operations and deployment runbooks until this frontend owns a deployment target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm, Kubernetes, and post-deploy smoke gates by default.
- Environment-specific deployment promotion beyond the GHCR package, checked-in reference manifests, and GitHub Release workflow.
- Generic command wrappers, broad workflow-state directories, and reusable execution scaffolding until repeated frontend work selects a concrete owner; repository prompt recipes remain narrow session starters, not roadmap scope.
