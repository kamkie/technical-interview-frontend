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

## Release Context

- Release phase: `v0.3.1` is published; no next release candidate is selected.
- Latest release: `v0.3.1`.
- Next target version: Not selected; select the next maintenance target before more release prep.
- Current priority: Deliver `M-I18N-001` frontend internationalization; select the next maintenance target before more release prep.
- Active product plans: `PLAN-frontend-i18n` (delivers `M-I18N-001`).
- Selection policy: Breaking user-facing or backend-contract integration changes require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the roadmap or owner document defines the command, evidence, threshold, and failure owner.

## Milestones

### M-I18N-001: Frontend Internationalization

Labels: `type:milestone`, `status:ready`

Goal: Render the frontend UI in the user's resolved language using the backend localization mechanism — language negotiation, the public localization catalog, and the existing account language preference — instead of hardcoded English strings. Exact negotiation and endpoint rules stay in `docs/backend/`.

#### E-I18N-001: Language Resolution And Catalog Integration

Labels: `type:epic`, `milestone:M-I18N-001`, `status:ready`

Tasks:

- T-I18N-001: Resolve the active UI language from the account preference, the backend `language` cookie, and the browser locale, restricted to backend-supported languages with English fallback.
- T-I18N-002: Send the resolved language on API requests per the `docs/backend/` negotiation rules so backend payloads arrive localized to match the UI.
- T-I18N-003: Load frontend display strings from the public backend localization catalog, with English fallback for missing keys or translations.

#### E-I18N-002: Localized UI Surfaces

Labels: `type:epic`, `milestone:M-I18N-001`, `status:ready`

Tasks:

- T-I18N-004: Route shell, navigation, catalog, account, and admin chrome strings through the catalog lookup.
- T-I18N-005: Apply a language change from the existing account preference control (or anonymous selection) to the rendered UI within the same session.

Acceptance Criteria:

- The active language resolves from account preference, then cookie, then browser locale, limited to the backend-supported set with English fallback.
- API requests carry the resolved language and the UI renders localized backend feedback without branching on localized message text; `messageKey` remains the stable branching field.
- Frontend chrome strings come from the backend localization catalog, and missing keys or translations fall back to English without breaking the page.
- Changing the language preference updates the rendered UI language in the same session.
- Tests at the smallest useful layer cover language resolution, catalog fallback, and localized rendering.

## Blocked Backlog

- `M-USERS-001` (Blocked): Admin block/unblock action on the user administration page — surface account status in the users list and inline detail, and add a block/unblock control with an operator reason beside role replacement. Blocked until the sibling backend ships its account block/unblock capability (captured as a Conceptualization candidate in the backend `ROADMAP.md`) and the imported contract artifacts under `docs/backend/` are refreshed to expose the status field and endpoint; today the strongest admin sanction is demoting a user to `USER`-only via role replacement.

## Product Non-Goals

These are deliberate product and integration boundaries for the current roadmap.

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Backend-only operations and deployment runbooks until this frontend owns a deployment target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm, Kubernetes, and post-deploy smoke gates by default.
- Environment-specific deployment promotion beyond the GHCR package, checked-in reference manifests, and GitHub Release workflow.
- Generic command wrappers, broad workflow-state directories, and reusable execution scaffolding remain non-goals unless selected by a concrete owner; the completed dev-server and smoke helpers are the current narrow exception owned by local-development docs and validation references.
