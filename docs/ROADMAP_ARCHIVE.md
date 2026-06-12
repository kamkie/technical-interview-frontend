# Roadmap Archive

This file archives completed roadmap work that no longer needs to occupy the active roadmap. Current product scope, backlog, release state, and planned work remain in `ROADMAP.md`. Released user-visible history remains in `CHANGELOG.md`.

Archive hierarchy:

- Milestone: completed delivery slice with its historical counter.
- Epic: completed product, workflow, procedure, or hardening area inside the milestone.
- Task: completed unit of archived work.
- Plan: archived execution record when one exists.

Stable IDs:

- Completed milestones preserve their historical IDs, such as `M0`, `M17`, and `M27`.
- The later local reuse of `M24` is archived as `M24-LOCAL`; its legacy counter is noted so old references remain understandable.
- Archived epics use `E-<milestone-id>-NNN`.
- Archived tasks use `T-<milestone-id>-NNN`.
- Archived plan records use `PLAN-short-kebab-slug`.

Keep IDs stable when wording or archive ordering changes. Do not renumber completed work, and do not reuse retired IDs for unrelated work.

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

### PLAN-frontend-ai-guidance-design-alignment

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_frontend_ai_guidance_design_alignment.md`

Scope: `M-GUIDANCE-001` frontend design and AI guidance alignment.

### PLAN-production-ui-foundation

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_production_ui_foundation.md`

Scope: `M-UI-001` production UI foundation.

### PLAN-workflow-polish

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_workflow_polish.md`

Scope: `M-WORKFLOW-001` workflow polish.

### PLAN-responsive-layout-smoke-evidence

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN_responsive_layout_smoke_evidence.md`

Scope: `M-SMOKE-001` responsive layout and smoke evidence.

### PLAN-ux-design-followups

Labels: `type:plan`, `status:archived`

Record: `.agents/plans/archive/PLAN-ux-design-followups.md`

Scope: 2026-06-12 UX design-session follow-ups T1-T9, including the `M-I18N-003` localization catalog caching slice.

## Completed Milestones

### M-I18N-003: Localization Catalog Caching

Labels: `type:milestone`, `status:done`

Goal: Stop refetching the UI localization catalog on every page load and language switch by caching it per browser session and revalidating when admin localization edits change the active language.

Completion evidence: Delivered 2026-06-12 on `main` through `PLAN-ux-design-followups` packet T9-i18n-cache-and-gaps. `loadUiCatalog` serves a session-scoped promise cache keyed by language (concurrent loads share one in-flight promise so the dev StrictMode double fetch collapses, and failed loads self-evict so retries work), admin localization create, update, and delete call `invalidateUiCatalog` with the touched row's language, and `I18nProvider` subscribes to invalidations so a mutation on the active language refetches and re-renders the chrome in the same session. Backend HTTP caching for `GET /api/localizations` stays backend-owned as a Candidate row in the sibling `technical-interview-demo` roadmap intake. Full vitest suite green with cache-hit, in-flight-sharing, failed-load-not-cached, language-selective invalidation, and active-language refresh tests.

#### E-I18N-005: Session Catalog Cache And Revalidation

Labels: `type:epic`, `milestone:M-I18N-003`, `status:done`

Tasks:

- T-I18N-009: Cache loaded UI catalogs per language for the browser session and serve repeat language switches from the cache.
- T-I18N-010: Invalidate or update the cached catalog when an admin localization mutation touches the cached language, so saved chrome translations appear without a full reload.

### M-WORKFLOW-002: Session And Admin Chrome Demotion

Labels: `type:milestone`, `status:done`

Goal: Let primary actions lead in session menus and admin toolbars per the reduced-control-clutter design rule.

Completion evidence: Delivered 2026-06-12 on `main`. The sign-in and account menus move the endpoint, session-cookie, and CSRF metadata tiles behind a native `details` connection-details disclosure so sign-in and sign-out actions lead; the admin list Refresh buttons on the books, categories, localization, and users pages were removed per the decision recorded in `docs/DESIGN.md` (mutations refresh in place, URL changes re-fetch, error states carry retry actions), with the orphaned refresh message keys removed from the frontend registry and flagged to the backend seed-alignment plan; and the operator audit filters disable on permission-denied (401/403) load failures via the new stable `httpStatus` field on load-error state while staying enabled during outages. Full baseline and light+dark `npm run a11y` green with new denied-state and disclosure tests.

#### E-WORKFLOW-002: Diagnostics Demotion And Denied-State Polish

Labels: `type:epic`, `milestone:M-WORKFLOW-002`, `status:done`

Tasks:

- T-WORKFLOW-004: Move the session metadata tiles behind a compact connection-details disclosure in the sign-in and account menus.
- T-WORKFLOW-005: Decide whether the admin Refresh buttons stay or are demoted, and record the decision in `docs/DESIGN.md`.
- T-WORKFLOW-006: Present the operator filter controls consistently with the permission-denied state instead of leaving them enabled.

Acceptance Criteria:

- Sign-in and sign-out actions visually lead their menus, with session metadata available behind a disclosure.
- The Refresh-button decision is recorded in `docs/DESIGN.md` and the UI matches it.
- The denied operator view does not offer interactive filters that cannot produce results.

### M-MOBILE-001: Dense-Table Action Reachability

Labels: `type:milestone`, `status:done`

Goal: Keep row actions usable and discoverable on narrow viewports.

Completion evidence: Delivered 2026-06-12 on `main`. The selected pattern — recorded in `docs/DESIGN.md` — is a sticky right-pinned action column below the 720px breakpoint: the admin books and categories action cells, the localization rows action cells (`row-actions-cell`), and the admin users and operator audit expand cells (`audit-expand-cell`) pin to the right edge with an opaque surface background and edge shadow while the rest of the table scrolls beneath them, with stacked full-width action buttons in the slimmer pinned column. A 390px Playwright mock-browser check verified the pinned cells render sticky and fully in-viewport on `/admin/catalog`, `/admin/localizations`, `/admin/users`, and `/operator`. Full baseline and light+dark `npm run a11y` green.

#### E-MOBILE-001: Narrow-Viewport Table Actions

Labels: `type:epic`, `milestone:M-MOBILE-001`, `status:done`

Tasks:

- T-MOBILE-001: Select the narrow-viewport pattern: a sticky action column or a visible horizontal-scroll affordance.
- T-MOBILE-002: Apply the selected pattern consistently across the catalog, admin, and operator tables.

Acceptance Criteria:

- Row actions are reachable and discoverable at 390px on every list route.
- The same pattern is used across catalog, admin, and operator tables.

### M-CATALOG-001: Category Filter Usability

Labels: `type:milestone`, `status:done`

Goal: Keep category filtering scannable and searchable as the category set grows.

Completion evidence: Delivered 2026-06-12 on `main`. The shared `CategoryFilter` chip group gained a client-side search input (`ui.catalog.category-search-label`/`-placeholder`) that narrows rendered chips with a `ui.catalog.categories-no-match` state on both the public and admin catalog pages; selected chips always stay visible, the search text never enters the URL, and the repeated `category` query contract is unchanged. Below the 720px breakpoint the chip wall renders as a single scrollable row (verified at 390px: 38px-tall `flex`/`overflow-x: auto` row that dissolves back to `display: contents` on wide viewports), and the backend `ui.catalog.*` seeding follow-up was recorded as a Candidate row in the backend repository `ROADMAP.md` Conceptualization table. Full baseline and light+dark `npm run a11y` green with new `CategoryFilter` component tests and a catalog URL-contract test.

#### E-CATALOG-002: Chip Search And Narrow-Viewport Bounding

Labels: `type:epic`, `milestone:M-CATALOG-001`, `status:done`

Tasks:

- T-CATALOG-004: Add a client-side search input to the shared category chip group; selected chips always remain visible, and the search text stays out of the URL while selected categories keep the repeated `category` URL contract.
- T-CATALOG-005: Bound the chip wall on narrow viewports with a collapse or scrollable row so the catalog table returns near the top of the page on mobile.
- T-CATALOG-006: Add the new `ui.catalog.*` message keys with English defaults and record the backend localization seeding follow-up.

Acceptance Criteria:

- Categories can be narrowed by typing, with a no-match state, on the public and admin catalog pages.
- Selected categories are never hidden by the search text, and URL query behavior is unchanged.
- The mobile catalog shows table content without multiple screens of chips when no search is active.

### M-I18N-002: Anonymous Language Access And Catalog Load Alignment

Labels: `type:milestone`, `status:done`

Selected as `M-I18N-001` in the 2026-06-12 review and renumbered the same day because `M-I18N-001` is the retired ID of the completed internationalization milestone below.

Goal: Keep language choice available to anonymous visitors on narrow viewports and align catalog loading with the backend's documented pagination.

Completion evidence: Delivered 2026-06-12 on `main`. The anonymous topbar language menu (`language-menu-anonymous`) is exempt from the 960px hide rule while signed-in visitors keep the account-page control, verified in a 390px Playwright mock-browser check (trigger visible in-viewport, Polish selection writes the backend `language` cookie); the UI localization catalog walk requests `size=100` per the backend clamp surfaced as `ConfigurationDetails.pagination.maxPageSize` in `docs/backend/approved-openapi.json`, and after the first page the remaining enumerated pages load as one parallel wave with the sequential `last`-marker walk kept as fallback, so chrome localization settles in two round-trip waves at current catalog sizes. Full baseline and light+dark `npm run a11y` green with new parallel-wave and fallback-walk tests.

#### E-I18N-003: Narrow-Viewport Anonymous Language Control

Labels: `type:epic`, `milestone:M-I18N-002`, `status:done`

Tasks:

- T-I18N-006: Give anonymous visitors a usable language control below the 960px topbar breakpoint, preserving the backend `language` cookie negotiation behavior.

Acceptance Criteria:

- An anonymous visitor on a 390px viewport can change the UI language without widening the window.

#### E-I18N-004: Localization Catalog Walk Alignment

Labels: `type:epic`, `milestone:M-I18N-002`, `status:done`

Tasks:

- T-I18N-007: Align the UI localization catalog page size with the backend's documented maximum; route the exact pagination rule to `docs/backend/`.
- T-I18N-008: Fetch remaining catalog pages in parallel after the first page while keeping the `last`-based walk as fallback.

Acceptance Criteria:

- Catalog requests use a page size the backend actually serves, with the rule sourced from `docs/backend/`.
- Chrome localization settles in at most two round-trip waves per language at current catalog sizes.

### M-DIAGNOSTICS-001: Frontend Build Identity On Diagnostics

Labels: `type:milestone`, `status:done`

Goal: Let support escalations identify the running SPA build from the system diagnostics route.

Completion evidence: Delivered 2026-06-12 on `main`. The Vite config injects the package name, `package.json` version, and config-evaluation build time as typed compile-time constants (declared in `src/vite-env.d.ts`), and `/operator/diagnostics` renders a frontend-owned `Frontend build` card with application, version, build time, and `import.meta.env.MODE` runtime mode outside the operator-surface load state, so the card stays visible when that request fails. Diagnostics page tests cover the loaded state and the operator-surface failure state; full baseline green.

#### E-DIAGNOSTICS-001: Frontend Build Card

Labels: `type:epic`, `milestone:M-DIAGNOSTICS-001`, `status:done`

Tasks:

- T-DIAGNOSTICS-001: Inject the frontend application name, `package.json` version, build time, and runtime mode at build time through the Vite config, with typed declarations.
- T-DIAGNOSTICS-002: Render a frontend build card on the diagnostics route that also renders when the operator-surface request fails.
- T-DIAGNOSTICS-003: Cover the card with diagnostics page tests, including the operator-surface failure state.

Acceptance Criteria:

- The diagnostics route shows frontend name, version, build time, and runtime mode.
- The frontend build card renders while the operator surface is unavailable.
- The card is frontend-owned display only; no new backend fields or invented contract data.

### M-RESILIENCE-001: Backend-Unavailable Behavior

Labels: `type:milestone`, `status:done`

Goal: Replace raw technical failure strings with localized, recoverable backend-unavailable handling.

Completion evidence: Delivered 2026-06-12 on `main`. The shared API client (`src/api/http.ts`) classifies unreachable-backend failures as `BackendUnavailableError` on stable fields (rejected fetch, or 5xx without problem details), every load and mutation display site renders the localized `ui.common.backend-unavailable` message for classified failures instead of raw request lines, the session connection panel and the public catalog error state gained `Try again` retry actions, and idempotent GET reads get a single bounded automatic retry (250ms) while problem-details responses and unsafe writes are never retried; the selected behavior is recorded in `docs/DESIGN.md`. Full baseline and light+dark `npm run a11y` green, with API-level retry/classification tests and browser-level recovery tests for the session and catalog retry flows.

#### E-RESILIENCE-001: Unreachable-Backend Classification And Recovery

Labels: `type:epic`, `milestone:M-RESILIENCE-001`, `status:done`

Tasks:

- T-RESILIENCE-001: Classify unreachable-backend failures (fetch rejection, or 5xx responses without problem details) on stable fields in the shared API client.
- T-RESILIENCE-002: Replace raw fallback strings, including the session bootstrap fallback, with localized backend-unavailable messaging.
- T-RESILIENCE-003: Add retry affordances to the session connection-issue panel and the public catalog error state.
- T-RESILIENCE-004: Decide whether idempotent GET reads get a single bounded automatic retry when classified unreachable, and implement the selected behavior; problem-details responses and unsafe writes are never retried.

Acceptance Criteria:

- No user-visible raw request-line or untranslated fallback strings remain for unreachable-backend failures.
- Branching uses status and payload shape, never localized message text.
- A user can recover from a transient backend outage without a manual page reload.

### M-COPY-001: Status And Empty-State Copy Correctness

Labels: `type:milestone`, `status:done`

Goal: Make status and empty-state chrome strings grammatical and accurate in every list state.

Completion evidence: Delivered 2026-06-12 on `main`. The operator audit summary and the `ui.admin-localization.rows-status-error` default now read `Audit rows need attention.` and `Localization rows need attention.` in error states, the unfiltered empty catalog renders the new `ui.catalog.empty-unfiltered-title`/`ui.catalog.empty-unfiltered-message` keys (`The catalog is empty` / `There are no books in the catalog yet.`) without the `Clear filters` action while the filtered no-match state keeps its existing copy, and the backend `ui.*` seed alignment was recorded as a Candidate row in the backend repository `ROADMAP.md` Conceptualization table. Full baseline green with updated catalog, operator, and localization page tests.

#### E-COPY-001: Table Status And Catalog Empty Copy

Labels: `type:epic`, `milestone:M-COPY-001`, `status:done`

Tasks:

- T-COPY-001: Rewrite the `rows-status-error` message family so composed status lines read grammatically in error states.
- T-COPY-002: Give the unfiltered empty catalog its own message, distinct from the filtered no-match message and its `Clear filters` action.
- T-COPY-003: Record the matching backend-seeded `ui.*` localization row updates as backend-owned follow-up.

Acceptance Criteria:

- Status lines read grammatically in loading and error states on the operator and localization tables.
- The unfiltered empty catalog and the filtered no-match state show distinct, accurate messages.
- The backend localization seed follow-up is recorded where the backend tracks work.

### M-A11Y-001: Dark-Mode Accessibility Parity

Labels: `type:milestone`, `status:done`

Goal: Make dark mode meet the same automated accessibility bar as light mode.

Completion evidence: Delivered 2026-06-12 on `main`. The dark-theme `--color-rule-red` token was raised to `#d97f73` so the route-header call number meets WCAG contrast on the catalog-card surface, and `npm run a11y` scans every covered route in light and dark mode through a fresh mock server and browser context per scheme with a resolved-theme assertion, keeping the serious-or-critical failure threshold, evidence locations, and maintainer failure owner unchanged. Full baseline and the expanded `npm run a11y` green with zero serious or critical findings in both modes.

#### E-A11Y-002: Dark-Mode Contrast And Scan Coverage

Labels: `type:epic`, `milestone:M-A11Y-001`, `status:done`

Tasks:

- T-A11Y-004: Fix the dark-theme `.call-number` color token so the route-header call number meets WCAG contrast in dark mode.
- T-A11Y-005: Add a dark-mode pass to the accessibility automation over the existing route scope, reusing the current `npm run a11y` command, serious-or-critical failure threshold, evidence locations, and maintainer failure owner.

Acceptance Criteria:

- axe reports no serious or critical violations in dark mode on the scanned route scope.
- `npm run a11y` covers light and dark mode with unchanged pass/fail semantics, evidence locations, and failure owner.

### M-USERS-001: Admin Account Block And Unblock

Labels: `type:milestone`, `status:done`

Goal: Surface account status on the admin user administration page and add a block/unblock control with a required operator reason beside role replacement, backed by `PUT /api/admin/users/{id}/status` from the imported contract artifacts under `docs/backend/` (refreshed 2026-06-11 from backend commit `0640891`). Behavior detail is owned by `docs/specs/SPEC_admin_user_management.md`.

Completion evidence: Delivered 2026-06-11 on `main` in commit `332d15b` after the contract refresh `ea68377`; released in `v0.4.0`. Full baseline green; the users list renders a status column and client-side status filter, blocked-account detail shows block provenance, status replacement requires an operator reason, the control stays disabled for the signed-in administrator's own account, and the mock API implements the status route with a seeded blocked user.

### M-I18N-001: Frontend Internationalization

Labels: `type:milestone`, `status:done`

Goal: Render the frontend UI in the user's resolved language using the backend localization mechanism — language negotiation, the public localization catalog, and the existing account language preference — instead of hardcoded English strings. Exact negotiation and endpoint rules stay in `docs/backend/`.

Completion evidence: Delivered 2026-06-11 on `main` through `PLAN-frontend-i18n` checkpoints `ee46d49`, `4a5661b`, `a4f3a41`, `cb4f60b`, `acd2ee9`, and `515789a`; released in `v0.4.0`. Full baseline, `npm run a11y`, and `npm run smoke:authenticated` green; mock-browser evidence covers resolution tiers, in-session switching, anonymous cookie selection, and English fallback.

#### E-I18N-001: Language Resolution And Catalog Integration

Labels: `type:epic`, `milestone:M-I18N-001`, `status:done`

Tasks:

- T-I18N-001: Resolve the active UI language from the account preference, the backend `language` cookie, and the browser locale, restricted to backend-supported languages with English fallback.
- T-I18N-002: Send the resolved language on API requests per the `docs/backend/` negotiation rules so backend payloads arrive localized to match the UI.
- T-I18N-003: Load frontend display strings from the public backend localization catalog, with English fallback for missing keys or translations.

#### E-I18N-002: Localized UI Surfaces

Labels: `type:epic`, `milestone:M-I18N-001`, `status:done`

Tasks:

- T-I18N-004: Route shell, navigation, catalog, account, and admin chrome strings through the catalog lookup.
- T-I18N-005: Apply a language change from the existing account preference control (or anonymous selection) to the rendered UI within the same session.

Acceptance Criteria:

- The active language resolves from account preference, then cookie, then browser locale, limited to the backend-supported set with English fallback.
- API requests carry the resolved language and the UI renders localized backend feedback without branching on localized message text; `messageKey` remains the stable branching field.
- Frontend chrome strings come from the backend localization catalog, and missing keys or translations fall back to English without breaking the page.
- Changing the language preference updates the rendered UI language in the same session.
- Tests at the smallest useful layer cover language resolution, catalog fallback, and localized rendering.

### M-QUALITY-001: Quality Gates

Labels: `type:milestone`, `status:done`

Goal: Add enforceable accessibility and hardening evidence now that command scope, thresholds, skip behavior, and failure ownership are selected; implement the selected deferred hardening scope now that its reporting, budget, pinning, and artifact decisions are made.

Completion evidence: `v0.3.1` is published with main CI and tag-driven Release workflow passing. Command details live in `docs/LOCAL_DEVELOPMENT.md`; validation routing lives in `.agents/references/testing.md`.

#### E-A11Y-001: Accessibility Automation

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- Command: add `npm run a11y`.
- Tooling: use Playwright with `@axe-core/playwright`.
- Runtime: reuse the existing mock Vite/auth pattern so the check can run without the sibling backend or provider credentials.
- Route scope: cover anonymous catalog/home state, authenticated `/account`, and authenticated `/admin/users` with the mock admin session.
- Failure threshold: fail local and CI checks on serious or critical automated accessibility violations.
- Advisory handling: report moderate and minor findings without failing the command during the first pass.
- Skip behavior: missing browser tooling is a prerequisite failure, not a product pass; CI should not silently skip the check.
- Failure owner: repository maintainers.
- Evidence: command output and CI logs are enough for the first implementation; retained artifacts can be selected later if the output proves useful.

Tasks:

- T-A11Y-001: Implement the selected accessibility command, threshold, skip rules, and failure owner.
- T-A11Y-002: Wire the accessibility check to run locally and in CI.
- T-A11Y-003: Document local and CI usage, advisory finding handling, and failure triage.

Acceptance Criteria:

- `npm run a11y` runs against the selected anonymous and authenticated mock-browser route scope.
- Serious or critical automated accessibility violations fail the command locally and in CI.
- Moderate and minor findings are visible as advisory output without failing the first-pass gate.
- Missing browser prerequisites are reported as prerequisite failures instead of successful product evidence.
- Documentation records command usage, CI behavior, skip semantics, and repository-maintainer ownership.

#### E-HARDEN-001: Hardening Thresholds

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- Enforced CI first pass: wire `npm run audit:security` and `npm run hardening:runtime` into CI.
- Dependency audit threshold: fail on high or critical npm advisories.
- Runtime/Nginx threshold: fail on owned runtime invariant violations.
- Container vulnerability threshold: make high or critical Trivy vulnerability findings fail `npm run hardening:trivy` for local and release-prep image-scan evidence.
- Manifest posture handling: keep `npm run hardening:kube-linter` advisory during the first pass.
- Failure owner: repository maintainers.
- Exception requirements: each exception must name the finding or advisory, affected package or path, current risk, owner, mitigation or planned fix, expiration or revisit trigger, and release decision.
- Evidence: command output and CI logs are enough for the first implementation; retained hardening report artifacts can be selected later if stable report files are chosen.

Tasks:

- T-HARDEN-001: Implement selected failure behavior for high or critical npm advisories, runtime invariant violations, and high or critical Trivy findings.
- T-HARDEN-007: Wire `npm run audit:security` and `npm run hardening:runtime` into CI as enforced checks.
- T-HARDEN-008: Keep manifest posture findings advisory until a stable kube-linter failure threshold is selected.
- T-HARDEN-009: Document hardening command usage, CI behavior, exception requirements, report locations, and repository-maintainer ownership.

Acceptance Criteria:

- CI fails on high or critical npm audit advisories.
- CI fails on owned runtime/Nginx hardening invariant violations.
- `npm run hardening:trivy` fails on high or critical Trivy vulnerability findings when Docker, image, and Trivy prerequisites are available.
- `npm run hardening:kube-linter` remains visible advisory evidence and does not fail release work during the first pass.
- Documentation records command usage, CI behavior, exception requirements, report locations, and repository-maintainer ownership.

#### E-HARDEN-002: Deferred Hardening Scope

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- SBOM and license inventory: use SPDX JSON, publish the SBOM as a GitHub Release asset, attach SBOM evidence to the GHCR image through GitHub artifact attestation/provenance, and keep license findings report-only.
- Bundle and asset budgets: add a soft advisory threshold based on the current build baseline plus 10% drift; budget warnings must not fail CI or release work during the first pass.
- GitHub Actions pinning: pin workflow actions to commit SHAs and keep Dependabot GitHub Actions updates active so pinned references stay current.
- Security lint scope: Trivy, CodeQL, and ESLint must stay clean; do not add custom security lint rules until a repeated issue pattern is missed by those selected tools.
- Retained artifacts: upload Trivy reports and CodeQL SARIF as GitHub Actions artifacts with 14-day retention where those checks run; CodeQL code scanning remains the primary security surface.

Tasks:

- T-HARDEN-002: Add SPDX JSON SBOM and report-only license inventory evidence to release publication and GHCR image attestation/provenance.
- T-HARDEN-003: Add soft bundle-size and asset-budget evidence using the current build baseline plus a 10% warning threshold.
- T-HARDEN-004: Pin GitHub Actions workflow actions to commit SHAs while preserving Dependabot action-update maintenance.
- T-HARDEN-005: Confirm the selected security lint scope stays limited to Trivy, CodeQL, and ESLint unless repeated misses justify a later custom rule set.
- T-HARDEN-006: Upload retained Trivy report and CodeQL SARIF artifacts for GitHub Actions runs that produce those reports.

Acceptance Criteria:

- Release publication produces an SPDX JSON SBOM, attaches it to the GitHub Release, and attaches SBOM evidence to the GHCR image through GitHub artifact attestation/provenance.
- License inventory findings remain report-only until a separate license allow/deny policy is selected.
- Bundle and asset budget output warns on more than 10% drift from the selected baseline without failing CI or release work.
- Workflow actions are pinned to commit SHAs and remain covered by Dependabot GitHub Actions updates.
- Trivy, CodeQL, and ESLint remain the selected security lint surfaces; custom security rules stay out of scope until a repeated missed pattern is documented.
- Trivy reports and CodeQL SARIF are retained as GitHub Actions artifacts for 14 days where those checks run.

### M-GUIDANCE-001: Frontend Design And AI Guidance Alignment

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-ai-guidance-design-alignment`

Goal: Give frontend subagents a roadmap-aligned design owner and enough focused AI guidance to implement planned UI work without inventing intent, API behavior, or process.

#### E-GUIDANCE-001: Roadmap-Aligned Design Owner

Labels: `type:epic`, `milestone:M-GUIDANCE-001`, `status:done`

Tasks:

- T-GUIDANCE-001: Create `docs/DESIGN.md` for durable frontend product and design intent.
- T-GUIDANCE-002: Align design direction with `M-UI-001`, `M-WORKFLOW-001`, `M-SMOKE-001`, `M-QUALITY-001`, and product non-goals.
- T-GUIDANCE-003: Link the design owner from human-facing documentation entry points.

Acceptance Criteria:

- `docs/DESIGN.md` exists and matches the selected roadmap hierarchy.
- Design intent stays separate from roadmap status, dependency, and release-context tracking.
- Backend contract invariants remain owned by `docs/backend/` and executable tests.

#### E-GUIDANCE-002: Subagent Execution Rails

Labels: `type:epic`, `milestone:M-GUIDANCE-001`, `status:done`

Tasks:

- T-GUIDANCE-004: Add frontend-specific architecture, code-style, execution, workflow, planning, plan-execution, troubleshooting, and reference-maintenance guides under `.agents/references/`.
- T-GUIDANCE-005: Keep mandatory planning and implementation subagents for ad hoc implementation work.
- T-GUIDANCE-006: Prevent backend-only Gradle, Flyway, REST Docs, operations, or deployment runbook weight from entering frontend guidance.

Acceptance Criteria:

- Focused AI guides give subagents clear intent, ownership boundaries, validation expectations, and stop conditions.
- Guides preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filter, and versioned update rules.
- No guide recreates obsolete `Procedure Adoption Scope` or `Smoke And Local Procedure Candidates` roadmap sections.

#### E-GUIDANCE-003: Root Rules, Plan Template, And Handoff Alignment

Labels: `type:epic`, `milestone:M-GUIDANCE-001`, `status:done`

Tasks:

- T-GUIDANCE-007: Compact `AGENTS.md` around owner-guide routing while preserving implementation authorization, dirty-worktree protection, mandatory subagents, and backend contract invariants.
- T-GUIDANCE-008: Add the minimal reusable active-plan template needed for selected frontend plans.
- T-GUIDANCE-009: Align `.gitmessage` and human-facing AI collaboration docs with the selected workflow.

Acceptance Criteria:

- Root AI rules route detailed procedure to focused owner guides instead of duplicating full workflows.
- The plan template supports active plan execution without adding generic command wrappers or workflow-state directories by default.
- Handoffs report changed files, validation, skipped checks, roadmap changes by stable ID, and remaining risks.

### M-UI-001: Production UI Foundation

Labels: `type:milestone`, `status:done`, `plan:PLAN-production-ui-foundation`

Goal: Make the existing frontend read as a production work tool rather than a technical demo.

#### E-UI-001: Shell And Navigation

Labels: `type:epic`, `milestone:M-UI-001`, `status:done`

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

Labels: `type:epic`, `milestone:M-UI-001`, `status:done`

Tasks:

- T-UI-005: Add route context so each work area has clear location, state, and available actions.
- T-UI-006: Reduce exposed refresh and control clutter where automatic state or route context can carry the interaction.
- T-UI-007: Improve empty, loading, and error states without branching on localized English display messages.

Acceptance Criteria:

- Catalog, account, admin, and operator routes explain their current context.
- Primary actions are visible without overwhelming the page.
- State handling uses stable fields such as status, `messageKey`, and endpoint context.

### M-WORKFLOW-001: Workflow Polish

Labels: `type:milestone`, `status:done`, `plan:PLAN-workflow-polish`

Goal: Improve daily catalog, account, admin, and operator workflows after the production shell foundation lands.

Depends on: M-UI-001.

#### E-STATE-001: State Semantics

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:done`

Tasks:

- T-STATE-001: Normalize loading, empty, success, and error state presentation across routes.
- T-STATE-002: Keep localized messages as display content.
- T-STATE-003: Branch on stable fields and route context instead of English display text.

Acceptance Criteria:

- Shared state patterns are predictable across user, admin, and operator surfaces.
- Tests cover state handling without depending on localized English strings.

#### E-WORKFLOW-001: Visual Hierarchy

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:done`

Tasks:

- T-WORKFLOW-001: Establish consistent page headers, content bands, and action placement.
- T-WORKFLOW-002: Reduce nested cards and competing visual weight.
- T-WORKFLOW-003: Keep state and primary actions visible without adding backend behavior.

Acceptance Criteria:

- Main catalog, account, admin, and operator pages have clear visual hierarchy.
- Route/component coverage protects unchanged backend-backed flows.

#### E-CATALOG-001: Catalog Workflows

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:done`

Tasks:

- T-CATALOG-001: Improve table scanning, pagination, sorting, and repeated filter interactions.
- T-CATALOG-002: Clarify form prominence and action hierarchy.
- T-CATALOG-003: Preserve update flows that require book `version` values.

Acceptance Criteria:

- Catalog and admin catalog tables are efficient to scan and operate.
- Form actions and table actions have clear relative priority.
- Tests cover pagination, sorting, repeated filters, and versioned updates.

#### E-OPS-001: Admin And Operator Workflows

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:done`

Tasks:

- T-OPS-001: Group controls by workflow rather than API surface.
- T-OPS-002: Improve dense scanning of admin catalog, user, and operator states.
- T-OPS-003: Preserve existing admin and operator backend operations.

Acceptance Criteria:

- Admin and operator pages support fast scanning and repeated actions.
- Tests cover grouped controls, state handling, and unchanged operations.

#### E-AUTH-001: Account And Session Copy

Labels: `type:epic`, `milestone:M-WORKFLOW-001`, `status:done`

Tasks:

- T-AUTH-001: Render login options from session metadata without hard-coded provider paths.
- T-AUTH-002: Keep logout and account preference flows visible and understandable.
- T-AUTH-003: Reduce technical labels, raw identifiers, and diagnostics in primary UI.

Acceptance Criteria:

- Session controls, login provider rendering, logout, and preference updates are covered by route/component tests.
- User-facing copy is clearer without changing stable backend behavior.

### M-SMOKE-001: Responsive Layout And Smoke Evidence

Labels: `type:milestone`, `status:done`, `plan:PLAN-responsive-layout-smoke-evidence`

Goal: Keep redesigned workflows usable across viewports and add repeatable browser smoke evidence for the most important routes.

Depends on: M-WORKFLOW-001.

#### E-RESP-001: Responsive Layout

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:done`

Tasks:

- T-RESP-001: Make responsive behavior deliberate instead of simple vertical stacking.
- T-RESP-002: Keep table state and row actions discoverable on small screens.
- T-RESP-003: Verify auth controls and primary navigation remain usable.

Acceptance Criteria:

- Responsive route/component or browser coverage protects selected layouts.
- Tables, filters, action groups, and auth controls remain coherent on mobile and desktop widths.

#### E-SMOKE-002: Anonymous Browser Smoke

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:done`

Current evidence: `npm run smoke:anonymous` is the canonical anonymous command and is expected to pass in the documented local smoke environment; missing prerequisites are recorded as prerequisite skips that exit nonzero, and smoke assertions fail the command.

Tasks:

- T-SMOKE-004: Add repeatable smoke evidence for anonymous shell and public catalog paths.
- T-SMOKE-005: Select the anonymous routes that carry the most user-visible risk.
- T-SMOKE-006: Keep smoke traffic same-origin and `/api/**` shaped.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected anonymous flow.
- The smoke result identifies the frontend URL and route coverage.

#### E-SMOKE-001: Authenticated Browser Smoke

Labels: `type:epic`, `milestone:M-SMOKE-001`, `status:done`

Current evidence: `npm run smoke:authenticated` covers authenticated browser smoke against the internal mock API; live sibling-backend fake-OAuth automation remains deferred unless selected by owners.

Tasks:

- T-SMOKE-001: Add repeatable smoke evidence for session bootstrap, authenticated route access, and logout.
- T-SMOKE-002: Extend beyond fake-OAuth readiness only where local procedure owners can support repeatable evidence.
- T-SMOKE-003: Record the frontend URL, backend profile, flow covered, and any skipped authenticated steps.

Acceptance Criteria:

- A documented smoke command or procedure covers the selected authenticated flow.
- Failures point to an owned workflow, route, or backend-contract issue.

### M0: Foundation

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Establish the frontend scaffold and the first backend-contract-backed runtime path.

#### E-M0-001: Scaffold And Contract Bootstrap

Labels: `type:epic`, `milestone:M0`, `status:done`

Tasks:

- T-M0-001: Scaffold the Vite, React, and TypeScript frontend.
- T-M0-002: Generate initial API types from the approved backend contract.
- T-M0-003: Bootstrap session and public catalog reads.

Acceptance Criteria:

- Existing validation baseline passes.
- The app renders session and catalog states from `/api/session`, `/api/books`, and `/api/categories`.

### M1: CI And Quality Gate

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add a repeatable repository quality gate for pull requests and selected branch validation.

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
- T-M2-002: Support basic search, filters, pagination, loading, empty, and localized error states.
- T-M2-003: Add mock/test fixtures for visible catalog states.

Acceptance Criteria:

- Users can scan and filter public books without implementation placeholders.
- Component tests cover fixture-backed visible states.

### M3: Advanced Catalog Controls

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Make catalog state navigable, shareable, and richer without changing backend request semantics.

#### E-M3-001: URL-Synced Catalog Controls

Labels: `type:epic`, `milestone:M3`, `status:done`

Tasks:

- T-M3-001: Route catalog state through React Router query strings.
- T-M3-002: Add browser history expectations for catalog navigation.
- T-M3-003: Add sorting UI, page-size controls, richer table controls, and deeper catalog state handling.

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
- The local auth smoke doc covers provider credentials, admin identity seeding, session/account/logout checks, CSRF handling, and anonymous-vs-authenticated automation policy.

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
- T-M7-003: Cover loading, success, validation/error, unauthenticated, and missing-CSRF states.

Acceptance Criteria:

- Users can update or clear the account language preference.
- Tests cover the selected success and failure states.

### M8: Admin Catalog Management

Labels: `type:milestone`, `status:done`, `plan:PLAN-frontend-roadmap-execution`

Goal: Add contract-backed admin book and category management.

#### E-M8-001: Admin Book And Category Operations

Labels: `type:epic`, `milestone:M8`, `status:done`

Tasks:

- T-M8-001: Select combined book/category admin scope from the imported backend contract.
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
- Tests cover supported locales, message edits, coverage/status states, and localized failures.

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

- Operators can inspect summaries, recent audit entries, filtered audit rows, and audit details.
- Tests cover access, loading, empty, filtered, paginated, localized error, and partial-payload states.

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
- Tests cover access, empty, success, validation, localized error, and missing-CSRF states.

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

- Maintainers can cut the first frontend release from `main` using documented procedure.
- `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation evidence, and tag state agree.

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

Goal: Add human-facing procedure docs without duplicating procedure bodies in entry points.

#### E-M14-001: Frontend Procedure Owners

Labels: `type:epic`, `milestone:M14`, `status:done`

Tasks:

- T-M14-001: Add `docs/DEVELOPMENT_LIFECYCLE.md`.
- T-M14-002: Add `docs/LOCAL_DEVELOPMENT.md`, `docs/WORKING_WITH_AI.md`, and `docs/README.md`.
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

- `.agents/references/documentation.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, and `.agents/references/releases.md` exist.
- `AGENTS.md` points to the focused references.

### M16: Contract Coverage And Scope Audit

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Audit approved backend operations against the implemented frontend surface.

#### E-M16-001: API Coverage Classification

Labels: `type:epic`, `milestone:M16`, `status:done`

Tasks:

- T-M16-001: Compare approved OpenAPI operations with generated types, clients, routes, specs, and tests.
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
- T-M18-003: Document `smoke:smoke-user` admin seeding, CSRF/logout/account/admin checks, and skip/fail behavior.

Acceptance Criteria:

- `docs/LOCAL_AUTH_SMOKE.md` owns fake-OAuth readiness.
- The readiness contract names the local profile, provider, seed identity, and smoke behavior.

### M19: Public Catalog Workflow Polish

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Polish the implemented anonymous public catalog workflow without backend changes.

#### E-M19-001: Public Catalog Route State Polish

Labels: `type:epic`, `milestone:M19`, `status:done`

Tasks:

- T-M19-001: Canonicalize public catalog route query state.
- T-M19-002: Add visible active filter, sort, page, and default-filter summaries.
- T-M19-003: Improve accessible sort affordances.

Acceptance Criteria:

- Component/route tests cover canonical URL replacement and visible query-state summaries.
- Existing request serialization remains unchanged.

### M20: Container And Deployment Hardening Refinement

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Add an advisory first pass for frontend-owned container and deployment hardening.

#### E-M20-001: Advisory Runtime And Deployment Checks

Labels: `type:epic`, `milestone:M20`, `status:done`

Tasks:

- T-M20-001: Add `npm run hardening:runtime`.
- T-M20-002: Add `npm run hardening:kube-linter`.
- T-M20-003: Add `npm run hardening:trivy` and `npm run hardening:m20`.
- T-M20-004: Keep findings advisory until stable thresholds and an exception workflow are selected.

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
- T-M21-003: Prove no login entry point is invented when metadata omits an authorization path.

Acceptance Criteria:

- Auth/session tests guard metadata-driven provider rendering.
- Login behavior remains owned by backend session metadata.

### M22: Backend Surface Expansion Selection

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-0-1-roadmap-execution`

Goal: Convert M16 coverage gaps into selected backend-supported surface work when needed.

#### E-M22-001: Surface Expansion Decision

Labels: `type:epic`, `milestone:M22`, `status:done`

Tasks:

- T-M22-001: Review M16 operation classifications.
- T-M22-002: Decide whether an approved operation gap requires selected frontend scope.

Acceptance Criteria:

- No surface is selected because M16 found no uncovered approved backend operations.

### M23: Dark Mode Support

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Add app-level theme preference across implemented flows without backend behavior changes.

#### E-M23-001: Light Dark System Theme Preference

Labels: `type:epic`, `milestone:M23`, `status:done`

Tasks:

- T-M23-001: Add app-level light, dark, and system theme preference.
- T-M23-002: Apply theme behavior across public catalog, account, admin, and operator flows.
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
- T-M24-003: Prepare GitHub Release, GHCR image tags, signature/provenance evidence, and published release notes.

Acceptance Criteria:

- Release metadata, validation evidence, package state, and published notes agree for `v0.2.0`.

### M24-LOCAL: Browser Session Surface Cleanup

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Legacy counter: `M24`

Goal: Move technical browser session diagnostics out of primary page content.

#### E-M24-LOCAL-001: Session Details Chrome Surface

Labels: `type:epic`, `milestone:M24-LOCAL`, `status:done`

Tasks:

- T-M24-LOCAL-001: Move Browser Session status and metadata into a hidden-by-default Session details surface.
- T-M24-LOCAL-002: Keep diagnostics reachable through an explicit accessible control.
- T-M24-LOCAL-003: Preserve session bootstrap, login, and logout behavior.

Acceptance Criteria:

- Primary implemented pages no longer show the Browser Session panel by default.
- Session diagnostics remain reachable on demand.
- Session behavior remains unchanged.

### M25: Public Catalog And App Shell Visual Design Pass

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Polish the anonymous `/catalog` flow and shared app shell after session surface cleanup.

#### E-M25-001: Catalog And Shell Visual Polish

Labels: `type:epic`, `milestone:M25`, `status:done`

Tasks:

- T-M25-001: Improve header/action layout, intro hierarchy, filters, category chips, and query summary.
- T-M25-002: Improve table readability, pagination, focus-visible styling, and responsive behavior.
- T-M25-003: Preserve existing route, query, session, and theme behavior.

Acceptance Criteria:

- Catalog and shell are easier to scan on desktop and mobile.
- Keyboard focus stays visible.
- Browser evidence covers representative light and dark catalog states.

### M26: Contract-Backed Mock API Development Mode

Labels: `type:milestone`, `status:done`, `plan:PLAN-post-v0-2-local-work`

Goal: Let frontend-only development run without the sibling backend while preserving the approved API shape.

#### E-M26-001: Opt-In Same-Origin Mock API

Labels: `type:epic`, `milestone:M26`, `status:done`

Tasks:

- T-M26-001: Add opt-in Vite mock API development mode.
- T-M26-002: Support admin, user, anonymous, success, empty, and error scenarios.
- T-M26-003: Keep in-memory mutations for development and document live backend smoke as the contract-confidence path.

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
- T-M27-002: Prevent long edit/delete labels from creating bulky multi-line buttons.
- T-M27-003: Preserve backend/API, auth, sorting, filtering, pagination, localization, and destructive-action behavior.

Acceptance Criteria:

- Admin catalog row actions remain easy to scan and operate on desktop and mobile.
- Long labels do not distort the table.
- Edit/delete intent and safeguards remain unchanged.

### M-SMOKE-002: Smoke Gap Promotion

Labels: `type:milestone`, `status:done`

Goal: Promote the selected anonymous smoke mock-mode gap into targeted frontend smoke coverage.

#### E-SMOKE-003: Smoke Gap Promotion

Labels: `type:epic`, `milestone:M-SMOKE-002`, `status:done`

Current evidence: `FRONTEND_MOCK_SESSION=anonymous FRONTEND_MOCK_API_SCENARIO=success node scripts/with-vite.mjs --mode mock -- npm run smoke:anonymous` passes with localized public-read failure evidence.

Tasks:

- T-SMOKE-007: Classify the repeatable failure as frontend mock API behavior for the managed mock-mode target.
- T-SMOKE-008: Return localized `400` problem details from the mock API when an exact `year` filter is combined with `yearFrom` or `yearTo`, and cover the behavior with a focused handler test.

Acceptance Criteria:

- The selected gap identifies the frontend mock API as owner.
- `src/mock-api/handler.test.ts` covers the repeatable failure.
- Managed mock anonymous smoke passes with localized failure evidence.

## Completed Supporting Work

### E-DOC-001: Procedure Adoption

Labels: `type:epic`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Tasks:

- T-DOC-001: Add `docs/DEVELOPMENT_LIFECYCLE.md` for human-facing lifecycle and artifact routing.
- T-DOC-002: Add `docs/LOCAL_DEVELOPMENT.md` for npm commands, CI reproduction, local troubleshooting, backend-contract refresh, browser smoke workflow, and hardening commands.
- T-DOC-003: Add `docs/WORKING_WITH_AI.md` for human guidance on AI planning, implementation, validation, review, and release preparation.
- T-DOC-004: Add `docs/README.md` as the human-facing documentation index.
- T-DOC-005: Add focused AI references for documentation, testing, reviews, and releases.

Acceptance Criteria:

- Entry-point docs link to the owner documents.
- `AGENTS.md` points to focused AI references without duplicating full procedures.

### E-HARDEN-ARCHIVE-001: Completed Hardening Tooling

Labels: `type:epic`, `status:done`, `plan:PLAN-frontend-release-procedure-execution`

Tasks:

- T-HARDEN-ARCHIVE-001: Add explicit GitHub Actions permissions and concurrency controls on every workflow.
- T-HARDEN-ARCHIVE-002: Add CodeQL for TypeScript/JavaScript source and GitHub workflow analysis.
- T-HARDEN-ARCHIVE-003: Add dependency-review with private-repository advisory mode.
- T-HARDEN-ARCHIVE-004: Add an npm-compatible audit script using a high-or-critical advisory threshold.
- T-HARDEN-ARCHIVE-005: Add Dependabot groups for runtime dependencies, tooling/test dependencies, and Actions updates.

Acceptance Criteria:

- M13-A selected the smallest useful hardening set for the `0.1.0` hardening pass.
- M13-B implemented the checks without adding deferred artifact, credential, threshold, or custom-rule gates.

### E-DEV-ARCHIVE-001: Dev Server And Browser Review Hygiene

Labels: `type:epic`, `status:done`

Tasks:

- T-DEV-ARCHIVE-001: Add managed mock Vite server startup for intentional manual browser review.
- T-DEV-ARCHIVE-002: Add repo-local dev-server list and cleanup commands with post-stop process and port checks.
- T-DEV-ARCHIVE-003: Route authenticated mock smoke through the shared managed Vite lifecycle while preserving smoke evidence output.
- T-DEV-ARCHIVE-004: Document browser-review server ownership, cleanup expectations, and validation routing.

Acceptance Criteria:

- `npm run dev:mock:managed`, `npm run dev:list`, and `npm run dev:cleanup` exist for managed interactive review.
- Programmatic Vite-backed checks use `scripts/with-vite.mjs` so servers close after the check and stale state files are cleaned up.
- `npm run smoke:authenticated` records the validation date, frontend URL, backend profile, selected flow, route coverage, API coverage, pass/skip/fail semantics, and skipped authenticated steps.
- Browser-review hygiene lives in `docs/LOCAL_DEVELOPMENT.md` and `.agents/references/testing.md`, not in active roadmap procedure text.
