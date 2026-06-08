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

- Release phase: Local `v0.3.0` release candidate prepared; remote publication is not selected.
- Latest release: `v0.2.0`.
- Next target version: `v0.3.0`; after publication, select the next maintenance target before more release prep.
- Current priority: Review the local `v0.3.0` candidate, then create release commit, tag, and publication artifacts only after explicit authorization.
- Active product plans: None; completed plan records and completed UI, workflow, and smoke milestones are archived in `docs/ROADMAP_ARCHIVE.md`.
- Recent supporting work: Dev-server and browser-review hygiene is complete and archived; command details live in `docs/LOCAL_DEVELOPMENT.md` and validation guidance lives in `.agents/references/testing.md`.
- Selection policy: Breaking user-facing or backend-contract integration changes require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the roadmap or owner document defines the command, evidence, threshold, and failure owner.

## Milestones

No ready or waiting selected milestone is active. Completed UI, workflow, and smoke milestones are archived in `docs/ROADMAP_ARCHIVE.md`.

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

Blocked by: Canonical anonymous and authenticated smoke commands plus dev-server hygiene are in place; no repeatable local smoke gap is currently documented.

Tasks:

- T-SMOKE-007: Identify whether a future repeatable failure belongs to the smoke script, frontend route/query behavior, backend contract artifact, or backend implementation.
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
- Generic command wrappers, broad workflow-state directories, and reusable execution scaffolding remain non-goals unless selected by a concrete owner; the completed dev-server and smoke helpers are the current narrow exception owned by local-development docs and validation references.
