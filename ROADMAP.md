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

- Release phase: `v0.4.0` is published; no next release candidate is selected.
- Latest release: `v0.4.0`.
- Next target version: Not selected; select the next maintenance target before more release prep.
- Current priority: Eight milestones from the 2026-06-12 full-app UI/UX/accessibility review are selected and ready; `M-A11Y-001` (serious dark-mode contrast finding) is the recommended first slice. Select the next maintenance target before more release prep.
- Active product plans: None; `PLAN-frontend-i18n` closed on 2026-06-11.
- Selection policy: Breaking user-facing or backend-contract integration changes require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the roadmap or owner document defines the command, evidence, threshold, and failure owner.

## Milestones

All eight milestones below were selected on 2026-06-12 from the full-app UI, UX, accessibility, and design review. Recommended order is as listed; `M-A11Y-001` carries the only serious-severity finding.

### M-A11Y-001: Dark-Mode Accessibility Parity

Labels: `type:milestone`, `status:ready`

Goal: Make dark mode meet the same automated accessibility bar as light mode.

#### E-A11Y-002: Dark-Mode Contrast And Scan Coverage

Labels: `type:epic`, `milestone:M-A11Y-001`, `status:ready`

Current evidence: axe reports a serious `color-contrast` violation on the route-header `.call-number` element in dark mode on every scanned route, while light mode passes; the existing accessibility automation scans light mode only.

Tasks:

- T-A11Y-004: Fix the dark-theme `.call-number` color token so the route-header call number meets WCAG contrast in dark mode.
- T-A11Y-005: Add a dark-mode pass to the accessibility automation over the existing route scope, reusing the current `npm run a11y` command, serious-or-critical failure threshold, evidence locations, and maintainer failure owner.

Acceptance Criteria:

- axe reports no serious or critical violations in dark mode on the scanned route scope.
- `npm run a11y` covers light and dark mode with unchanged pass/fail semantics, evidence locations, and failure owner.

### M-COPY-001: Status And Empty-State Copy Correctness

Labels: `type:milestone`, `status:ready`

Goal: Make status and empty-state chrome strings grammatical and accurate in every list state.

#### E-COPY-001: Table Status And Catalog Empty Copy

Labels: `type:epic`, `milestone:M-COPY-001`, `status:ready`

Current evidence: the error status template renders "Audit rows are needs attention." and "Localization rows are needs attention."; the backend-empty catalog shows "No books match these filters." when no filters are applied.

Tasks:

- T-COPY-001: Rewrite the `rows-status-error` message family so composed status lines read grammatically in error states.
- T-COPY-002: Give the unfiltered empty catalog its own message, distinct from the filtered no-match message and its `Clear filters` action.
- T-COPY-003: Record the matching backend-seeded `ui.*` localization row updates as backend-owned follow-up.

Acceptance Criteria:

- Status lines read grammatically in loading and error states on the operator and localization tables.
- The unfiltered empty catalog and the filtered no-match state show distinct, accurate messages.
- The backend localization seed follow-up is recorded where the backend tracks work.

### M-RESILIENCE-001: Backend-Unavailable Behavior

Labels: `type:milestone`, `status:ready`

Goal: Replace raw technical failure strings with localized, recoverable backend-unavailable handling.

#### E-RESILIENCE-001: Unreachable-Backend Classification And Recovery

Labels: `type:epic`, `milestone:M-RESILIENCE-001`, `status:ready`

Current evidence: 5xx responses without problem details render bare request lines such as "GET /api/books failed with 500 Internal Server Error", network failures render the browser's "Failed to fetch", the session bootstrap fallback is hardcoded English, and no error state offers a retry action.

Tasks:

- T-RESILIENCE-001: Classify unreachable-backend failures (fetch rejection, or 5xx responses without problem details) on stable fields in the shared API client.
- T-RESILIENCE-002: Replace raw fallback strings, including the session bootstrap fallback, with localized backend-unavailable messaging.
- T-RESILIENCE-003: Add retry affordances to the session connection-issue panel and the public catalog error state.
- T-RESILIENCE-004: Decide whether idempotent GET reads get a single bounded automatic retry when classified unreachable, and implement the selected behavior; problem-details responses and unsafe writes are never retried.

Acceptance Criteria:

- No user-visible raw request-line or untranslated fallback strings remain for unreachable-backend failures.
- Branching uses status and payload shape, never localized message text.
- A user can recover from a transient backend outage without a manual page reload.

### M-DIAGNOSTICS-001: Frontend Build Identity On Diagnostics

Labels: `type:milestone`, `status:ready`

Goal: Let support escalations identify the running SPA build from the system diagnostics route.

#### E-DIAGNOSTICS-001: Frontend Build Card

Labels: `type:epic`, `milestone:M-DIAGNOSTICS-001`, `status:ready`

Current evidence: `/operator/diagnostics` renders only backend operator-surface data; nothing identifies the SPA build, including when the operator-surface request fails.

Tasks:

- T-DIAGNOSTICS-001: Inject the frontend application name, `package.json` version, build time, and runtime mode at build time through the Vite config, with typed declarations.
- T-DIAGNOSTICS-002: Render a frontend build card on the diagnostics route that also renders when the operator-surface request fails.
- T-DIAGNOSTICS-003: Cover the card with diagnostics page tests, including the operator-surface failure state.

Acceptance Criteria:

- The diagnostics route shows frontend name, version, build time, and runtime mode.
- The frontend build card renders while the operator surface is unavailable.
- The card is frontend-owned display only; no new backend fields or invented contract data.

### M-I18N-001: Anonymous Language Access And Catalog Load Alignment

Labels: `type:milestone`, `status:ready`

Goal: Keep language choice available to anonymous visitors on narrow viewports and align catalog loading with the backend's documented pagination.

#### E-I18N-003: Narrow-Viewport Anonymous Language Control

Labels: `type:epic`, `milestone:M-I18N-001`, `status:ready`

Current evidence: the topbar language menu is hidden below the 960px breakpoint; signed-in users keep the account-page language control, while anonymous visitors have no language control at all on narrow viewports.

Tasks:

- T-I18N-006: Give anonymous visitors a usable language control below the 960px topbar breakpoint, preserving the backend `language` cookie negotiation behavior.

Acceptance Criteria:

- An anonymous visitor on a 390px viewport can change the UI language without widening the window.

#### E-I18N-004: Localization Catalog Walk Alignment

Labels: `type:epic`, `milestone:M-I18N-001`, `status:ready`

Current evidence: the UI catalog walk requests `size=200` while the backend clamps to its maximum page size of 100 (verified live: 405 rows, 5 pages), and pages are fetched sequentially, so chrome localization settles after 5 round trips per language.

Tasks:

- T-I18N-007: Align the UI localization catalog page size with the backend's documented maximum; route the exact pagination rule to `docs/backend/`.
- T-I18N-008: Fetch remaining catalog pages in parallel after the first page while keeping the `last`-based walk as fallback.

Acceptance Criteria:

- Catalog requests use a page size the backend actually serves, with the rule sourced from `docs/backend/`.
- Chrome localization settles in at most two round-trip waves per language at current catalog sizes.

### M-CATALOG-001: Category Filter Usability

Labels: `type:milestone`, `status:ready`

Goal: Keep category filtering scannable and searchable as the category set grows.

#### E-CATALOG-002: Chip Search And Narrow-Viewport Bounding

Labels: `type:epic`, `milestone:M-CATALOG-001`, `status:ready`

Current evidence: 36 live categories render roughly four chip rows on desktop and about two screens on a 390px viewport before the catalog table starts, on both the public and admin catalog pages.

Tasks:

- T-CATALOG-004: Add a client-side search input to the shared category chip group; selected chips always remain visible, and the search text stays out of the URL while selected categories keep the repeated `category` URL contract.
- T-CATALOG-005: Bound the chip wall on narrow viewports with a collapse or scrollable row so the catalog table returns near the top of the page on mobile.
- T-CATALOG-006: Add the new `ui.catalog.*` message keys with English defaults and record the backend localization seeding follow-up.

Acceptance Criteria:

- Categories can be narrowed by typing, with a no-match state, on the public and admin catalog pages.
- Selected categories are never hidden by the search text, and URL query behavior is unchanged.
- The mobile catalog shows table content without multiple screens of chips when no search is active.

### M-MOBILE-001: Dense-Table Action Reachability

Labels: `type:milestone`, `status:ready`

Goal: Keep row actions usable and discoverable on narrow viewports.

#### E-MOBILE-001: Narrow-Viewport Table Actions

Labels: `type:epic`, `milestone:M-MOBILE-001`, `status:ready`

Current evidence: tables rely on a horizontal-scroll container with no visible affordance at 390px, and admin Edit and Delete actions render off-viewport.

Tasks:

- T-MOBILE-001: Select the narrow-viewport pattern: a sticky action column or a visible horizontal-scroll affordance.
- T-MOBILE-002: Apply the selected pattern consistently across the catalog, admin, and operator tables.

Acceptance Criteria:

- Row actions are reachable and discoverable at 390px on every list route.
- The same pattern is used across catalog, admin, and operator tables.

### M-WORKFLOW-002: Session And Admin Chrome Demotion

Labels: `type:milestone`, `status:ready`

Goal: Let primary actions lead in session menus and admin toolbars per the reduced-control-clutter design rule.

#### E-WORKFLOW-002: Diagnostics Demotion And Denied-State Polish

Labels: `type:epic`, `milestone:M-WORKFLOW-002`, `status:ready`

Current evidence: the sign-in and account menus give more space to endpoint, session-cookie, and CSRF metadata tiles than to the sign-in and sign-out actions; admin list pages keep Refresh buttons that `docs/DESIGN.md` flags for demotion; operator filters stay enabled while the route is permission-denied.

Tasks:

- T-WORKFLOW-004: Move the session metadata tiles behind a compact connection-details disclosure in the sign-in and account menus.
- T-WORKFLOW-005: Decide whether the admin Refresh buttons stay or are demoted, and record the decision in `docs/DESIGN.md`.
- T-WORKFLOW-006: Present the operator filter controls consistently with the permission-denied state instead of leaving them enabled.

Acceptance Criteria:

- Sign-in and sign-out actions visually lead their menus, with session metadata available behind a disclosure.
- The Refresh-button decision is recorded in `docs/DESIGN.md` and the UI matches it.
- The denied operator view does not offer interactive filters that cannot produce results.

Completed milestones are archived in `docs/ROADMAP_ARCHIVE.md`.

## Blocked Backlog

No blocked items.

## Product Non-Goals

These are deliberate product and integration boundaries for the current roadmap.

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Backend-only operations and deployment runbooks until this frontend owns a deployment target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm, Kubernetes, and post-deploy smoke gates by default.
- Environment-specific deployment promotion beyond the GHCR package, checked-in reference manifests, and GitHub Release workflow.
- Generic command wrappers, broad workflow-state directories, and reusable execution scaffolding remain non-goals unless selected by a concrete owner; the completed dev-server and smoke helpers are the current narrow exception owned by local-development docs and validation references.
