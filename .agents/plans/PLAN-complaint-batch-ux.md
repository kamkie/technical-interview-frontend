# Plan: Complaint Batch UX Fixes

Plan-ID: PLAN-complaint-batch-ux

Status: Approved

Workers: 1

Clean verifier: None declared.

Filename: `.agents/plans/PLAN-complaint-batch-ux.md`

## Readiness

- Plan readiness: Complete; all packets implemented and validated.
- Approved by: Kamil Kiewisz (interactive session answer: "Yes, implement all packets").
- Approved at: 2026-06-10
- Open questions: None; Q1-Q3 answered, see `## Open Questions`.
- Implementation progress: T1-T7 complete on 2026-06-10; uncommitted in the working tree pending user review.

Use `Status: Draft` while shaping the plan. Use `Status: Approved` only after explicit user approval is recorded. Creating or updating this plan is not implementation approval.

## Status History

- 2026-06-10T18:30:00+02:00: none -> Draft by Claude (interactive complaining session); plan created from a 12-item user complaint batch plus one queued pagination complaint.
- 2026-06-10T18:45:00+02:00: Draft -> Approved by Kamil Kiewisz; Q1 = collapsible create form on top plus inline editing in an expander row, Q2 = inline SVG flags, Q3 = detail below the list. Coordinator implements directly per this plan's `Workers: 1` sequential execution model; no commits until the user asks.
- 2026-06-10T20:10:00+02:00: Approved -> implementation complete by Claude; T1-T7 landed in one uncommitted working tree. Full baseline green (`npm run lint`, `npm run typecheck`, `npm test` 179/179, `npm run build`, `git diff --check`), `npm run a11y` passed 5/5, and browser evidence was collected on the mock preview (port 5199) for catalog live filters and dual pagination, the localization coverage widget and inline edit row, operator row-click details, the fixed diagnostics gap (20 px with an expanded entry), the always-visible account profile with searchable language input, the topbar SVG-flag language menu, and the full-width users detail. The diagnostics fix abandoned the grid-area row-span (still inflated row one) in favor of an explicit side-column wrapper.

## Goal

Resolve the user's interactive-complaint batch: denser and less verbose list/filter chrome, live filtering, top-and-bottom differentiated pagination, localization coverage as a hideable widget, reachable create/edit forms, fully clickable operator audit rows, a fixed diagnostics grid, an always-visible account profile with a searchable and more discoverable language preference including a wide-screen topbar selector, and a reworked admin users detail layout.

## Non-Goals

- No backend contract changes; all list, filter, sort, and pagination semantics stay as defined by `docs/backend/approved-openapi.json`.
- No new routes and no removal of URL-backed query state.
- No full inline table editing for localizations in this plan (recorded as an open question; default is deferred).
- No visual redesign beyond the specific complaints; the Dewey call-number eyebrow stays per explicit user decision.

## Source Artifacts

- User request: 12-item complaint list from the 2026-06-10 interactive complaining session, plus the queued unlabeled pagination page-size select complaint.
- Roadmap refs: none selected.
- Design/spec refs: `docs/DESIGN.md` for tone and density conventions.
- Backend contract refs: `docs/backend/approved-openapi.json` (read-only; pagination and filter params unchanged).
- Focused references: `.agents/references/execution.md`, `.agents/references/testing.md`.
- Source files or tests: `src/ui/PaginationControls.tsx`, `src/catalog/CatalogPanel.tsx`, `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminCatalogPage.tsx`, `src/admin/AdminUsersPage.tsx`, `src/operator/OperatorPage.tsx`, `src/operator/OperatorDiagnosticsPage.tsx`, `src/account/AccountProfile.tsx`, `src/App.tsx`, `src/index.css`, and their co-located tests.

## Assumptions

- Live filtering keeps URL-backed query state and debounces input at roughly 300 ms before pushing search params; Enter submits immediately. Owner: this plan; revisit if backend request volume becomes a concern.
- The coverage widget default is visible with a collapse control persisted per browser (localStorage), since coverage is derived from already-loaded rows and costs no extra request. Owner: this plan.
- The topbar language selector renders only for authenticated sessions because `PUT` language preference requires auth; anonymous users keep the account-page-only flow. Owner: this plan.
- Flag emoji do not render as flags on Windows Chrome/Edge, so the topbar selector uses short language codes unless the user picks SVG flags. Owner: open question Q2.

## Open Questions

- Q1 (answered 2026-06-10): collapsible create form above the table plus inline editing in an expander row under the edited row, matching the details-row pattern used on other pages. The standalone bottom form section is removed.
- Q2 (answered 2026-06-10): inline SVG flags in the topbar language selector, using a dismissible-menu dropdown consistent with the existing nav/account menus since a native select cannot render SVG content.
- Q3 (answered 2026-06-10): replace the side detail column with a full-width detail section below the users table, consistent with the operator inline-details precedent.

## Proposed Changes

- `src/ui/PaginationControls.tsx`: add a `variant` (`full` | `compact`); full variant merges the page-size select with a visible `rows per page` label and drops the duplicated row count; compact variant is page position plus prev/next only.
- `src/catalog/CatalogPanel.tsx`: compact pagination above the table, full below; remove the duplicate `Rows per page` control block; debounce-live Title/Author/ISBN filters; shrink the query summary strip.
- `src/admin/AdminLocalizationPage.tsx`: remove the Messages/Coverage `Tabs`; coverage becomes a hideable widget at the top of the page; the create form moves into a collapsible panel above the table and editing happens inline in an expander row under the edited row; live message-key filter; top-and-bottom pagination; flatten `workflow-group` headings.
- `src/admin/AdminCatalogPage.tsx`: same pagination, live-filter, and heading-flattening treatment for the books table.
- `src/operator/OperatorPage.tsx`: audit rows become fully clickable (row click toggles details, narrow icon-only expand button keeps `aria-expanded` semantics); drop the wide `Details` column; live actor-login filter; top-and-bottom pagination; flatten headings.
- `src/operator/OperatorDiagnosticsPage.tsx` + `src/index.css`: fix `operator-overview-grid` row sizing (`grid-template-rows: min-content 1fr`) so a tall expanded audit card no longer inflates the gap between status and runtime cards.
- `src/account/AccountProfile.tsx`: remove the `Account details` disclosure and show all profile fields always; language preference becomes a searchable combobox (`input` + `datalist`) and moves visually adjacent to the profile summary.
- `src/App.tsx` + `src/index.css`: topbar quick language selector for authenticated users with inline SVG flags in a dismissible-menu dropdown, visible on wide viewports and hidden on narrow ones.
- `src/admin/AdminUsersPage.tsx` + `src/index.css`: rework the list/detail layout per Q3; fix grant-table horizontal scroll and mid-word email wrapping.
- `src/index.css`: density pass on `.catalog-filters`, `.catalog-controls`, `.workflow-group`, `.admin-section-heading`, and `.catalog-query-details` (smaller paddings, controls, and summary type).
- Co-located tests updated alongside each behavior change.

## Contract And Repository Invariants

- Route API-facing behavior through `docs/backend/` and the imported backend contract artifacts before implementation; this plan changes no request shapes, endpoints, or pagination/filter semantics.
- Preserve same-origin `/api/**`, session-cookie auth, backend-provided session metadata, localized messages as display content, and stable-field branching.
- Run `git status --short` before edits and treat existing or unexpected changes as user-owned.
- Commit only when the user authorizes a commit.

## Clean Verifier

- Declared verifier: none.

## Progress Tracker

| Packet                  | Status   | Owner       | Depends On | Last Updated | Notes                                 |
| ----------------------- | -------- | ----------- | ---------- | ------------ | ------------------------------------- |
| T1-pagination-rework    | Complete | Coordinator | None       | 2026-06-10   | Compact top + labeled full bottom     |
| T2-live-filters         | Complete | Coordinator | T1         | 2026-06-10   | 300 ms debounce, URL-backed           |
| T3-density-pass         | Complete | Coordinator | T2         | 2026-06-10   | Headings flattened, summaries slimmed |
| T4-localizations-rework | Complete | Coordinator | T3         | 2026-06-10   | Coverage widget + inline edit row     |
| T5-operator-fixes       | Complete | Coordinator | T3         | 2026-06-10   | Row-click details + side-column grid  |
| T6-account-language     | Complete | Coordinator | None       | 2026-06-10   | Datalist input + SVG-flag topbar menu |
| T7-admin-users-layout   | Complete | Coordinator | T3         | 2026-06-10   | Detail full-width below the list      |

## Task Packets

### Task Packet: T1-pagination-rework

Task id: T1-pagination-rework

Lane: implementation

Goal:

- `PaginationControls` gains `full` and `compact` variants; every long table (catalog, localizations, admin books, operator audit) renders compact controls above and full controls below, with the page-size select visibly labeled and the duplicated row count removed.

Write scope:

- `src/ui/PaginationControls.tsx`, `src/catalog/CatalogPanel.tsx`, `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminCatalogPage.tsx`, `src/operator/OperatorPage.tsx`, `src/index.css`, co-located tests.

Dependencies:

- None.

Validation:

- Full baseline per `.agents/references/testing.md`; browser check of catalog and localizations pagination.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T2-live-filters

Task id: T2-live-filters

Lane: implementation

Goal:

- Text filters on catalog (title, author, ISBN), localizations (message key), and operator audit (actor login) apply live with a roughly 300 ms debounce while keeping URL-backed state; submit buttons are removed or reduced to a Clear action; selects keep applying immediately.

Write scope:

- `src/catalog/CatalogPanel.tsx`, `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminCatalogPage.tsx`, `src/operator/OperatorPage.tsx`, co-located tests.

Dependencies:

- T1 committed or coordinated for shared-file sequencing.

Validation:

- Full baseline; browser check that typing filters without pressing Search and that back/forward navigation still restores filters.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T3-density-pass

Task id: T3-density-pass

Lane: implementation

Goal:

- Remove the redundant inner `workflow-group` heading layers (`Find ... rows`, `Operate on rows`, `Review audit rows`), shrink filter-card and control sizing, and reduce the query-summary strip so list pages read as one section instead of three nested cards.

Write scope:

- `src/index.css`, `src/catalog/CatalogPanel.tsx`, `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminCatalogPage.tsx`, `src/operator/OperatorPage.tsx`, `src/admin/AdminUsersPage.tsx`, co-located tests.

Dependencies:

- T1, T2 for shared-file sequencing.

Validation:

- Full baseline; `npm run a11y` since heading levels change.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T4-localizations-rework

Task id: T4-localizations-rework

Lane: implementation

Goal:

- The Coverage tab is removed; coverage renders as a hideable widget at the top of the localizations page with its collapse state persisted; the create/edit form is reachable without scrolling past the table per the Q1 decision.

Write scope:

- `src/admin/AdminLocalizationPage.tsx`, `src/index.css`, co-located tests.

Dependencies:

- Q1 answered; T3 for shared-file sequencing.

Validation:

- Full baseline; browser check of coverage hide/show, `Add <lang>` shortcuts, and create/edit flows.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T5-operator-fixes

Task id: T5-operator-fixes

Lane: implementation

Goal:

- Operator audit rows toggle details from a click anywhere in the row with a narrow icon-only control carrying `aria-expanded`; the diagnostics overview grid no longer opens a large gap between the status and runtime cards when the audit card grows.

Write scope:

- `src/operator/OperatorPage.tsx`, `src/operator/OperatorDiagnosticsPage.tsx`, `src/index.css`, co-located tests.

Dependencies:

- T3 for shared-file sequencing.

Validation:

- Full baseline; browser check of row expansion by mouse and keyboard and of the diagnostics layout with an expanded recent entry.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T6-account-language

Task id: T6-account-language

Lane: implementation

Goal:

- The account page shows all profile fields without a disclosure; language preference is a searchable combobox adjacent to the profile summary; authenticated users on wide viewports get a compact topbar language selector (per Q2) that hides on narrow viewports.

Write scope:

- `src/account/AccountProfile.tsx`, `src/App.tsx`, `src/index.css`, co-located tests.

Dependencies:

- Q2 answered.

Validation:

- Full baseline; browser check of language search, save/clear, topbar selector visibility across viewport widths, and `npm run a11y`.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

### Task Packet: T7-admin-users-layout

Task id: T7-admin-users-layout

Lane: implementation

Goal:

- The admin users list/detail arrangement follows the Q3 decision; the grant table no longer needs horizontal scrolling at default width and email values no longer wrap mid-word.

Write scope:

- `src/admin/AdminUsersPage.tsx`, `src/index.css`, co-located tests.

Dependencies:

- Q3 answered; T3 for shared-file sequencing.

Validation:

- Full baseline; browser check of selection, role replacement, and grant history at 1440 px and narrow widths.

Result summary:

- Status: complete 2026-06-10; coordinator-implemented; shared validation evidence is recorded in the 2026-06-10T20:10 Status History entry.

## Execution Model

- `Workers: 1`, sequential packets in tracker order; shared files (`src/index.css`, list pages) make parallel waves not worth the coordination cost.
- Each packet is implemented, validated, and reflected in its result summary before the next starts.

## Long-Run Continuity

- Resume docs reread: latest user request, `AGENTS.md`, this plan, `.agents/references/plan-execution.md`, `.agents/references/testing.md`.
- Current task or wave: none; all packets complete.
- Completed commits: none; the user has not authorized a commit, so all changes sit uncommitted in the working tree.
- Next action: user reviews the working tree and decides on a commit.

## Execution Graph

| Packet                  | State | Dispatch | Return | Orchestrator closeout | Checkpoint / next action |
| ----------------------- | ----- | -------- | ------ | --------------------- | ------------------------ |
| T1-pagination-rework    | Done  | Done     | Done   | Done                  | No commit authorized     |
| T2-live-filters         | Done  | Done     | Done   | Done                  | No commit authorized     |
| T3-density-pass         | Done  | Done     | Done   | Done                  | No commit authorized     |
| T4-localizations-rework | Done  | Done     | Done   | Done                  | No commit authorized     |
| T5-operator-fixes       | Done  | Done     | Done   | Done                  | No commit authorized     |
| T6-account-language     | Done  | Done     | Done   | Done                  | No commit authorized     |
| T7-admin-users-layout   | Done  | Done     | Done   | Done                  | No commit authorized     |

## Validation Plan

- Full baseline after each packet: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.
- `npm run a11y` after packets that change heading structure, disclosure semantics, or interactive row patterns (T3, T5, T6).
- Browser evidence via the mock-mode preview on port 5199 per local memory; record flows checked per packet.

## Review Expectations

- Review for documentation drift in `docs/DESIGN.md` if density conventions change meaningfully.
- No backend contract drift expected; flag immediately if any packet needs a request-shape change.
- Security review not triggered: no auth, session, CSRF, storage, or transport changes beyond reading existing session state for the topbar selector.

## Risks

- Live filtering multiplies backend list requests; debounce mitigates but mock-mode timing tests may need adjustment.
- Removing the Tabs component from localizations changes URL `tab` param handling; deep links with `?tab=coverage` must keep working or redirect cleanly.
- Whole-row click targets risk accidental toggles during text selection; implementation should ignore clicks that follow a text-selection drag.
- Heading flattening touches many test selectors (`getByRole('heading')`), so test churn is concentrated in T3.

## Handoff Notes

- The Dewey call-number eyebrow was complained about and explicitly kept by the user on 2026-06-10; do not remove it as part of any cleanup.
