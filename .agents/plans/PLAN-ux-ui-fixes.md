# Plan: UX/UI Fixes — Navigation, Delete Confirmation, Catalog Feedback, Layout

Plan-ID: PLAN-ux-ui-fixes

Status: Approved

Workers: 1

Clean verifier: None declared.

Filename: `.agents/plans/PLAN-ux-ui-fixes.md`

## Readiness

- Plan readiness: Approved; all open questions resolved by the user.
- Approved by: user (chat session)
- Approved at: 2026-06-10
- Open questions: None; see `## Open Questions` for resolutions.
- Implementation progress: Complete; commits ccfc1fe (A), 6a1c879 (B), a5adab5 (C), 014c605 (D), 414fb89 (E). Full baseline, a11y, anonymous and authenticated smoke, and a live mock-browser pass all green on 2026-06-10. Item 12b needed no change (form fills its row at 1440px).

## Status History

- 2026-06-10: none -> Draft by AI agent; plan created from UX audit plus user screenshot walkthrough.
- 2026-06-10: Draft -> Approved by user; decisions: 1440px workspace cap everywhere, no audit condensing but inline expanding detail rows replace the side panel, implement everything, one commit per group.

## Goal

Fix the approved set of UX/UI issues: per-route document titles, skip link, focus management on route change, a themed accessible delete-confirmation dialog replacing `window.confirm`, catalog refetch/empty-state feedback, removal of the dead "0 selected" summary entry, the diagnostics layout gap, audit-table mid-word breaking, noisy category action labels, oversized sort controls, and always-visible account-menu connection details.

## Non-Goals

- Backend contract changes of any kind.
- Condensing or grouping repetitive audit entries (user decision: keep row-per-record; grouping/filter controls are a possible future option).
- New abstractions beyond the shared `ConfirmDialog` and `AuditEntryDetails` components.

## Source Artifacts

- User request: chat session 2026-06-10 — "plan some ux and ui fixes", all three audit groups approved, plus screenshot findings and the explicit request to always show account connection details "in nicer form with cell details".
- Roadmap refs: none (no active roadmap items; this is fix work owned by specs and source).
- Design/spec refs: `docs/DESIGN.md`, `docs/specs/SPEC_public_catalog_workflow_polish.md` (line 10 must change with item 8), `docs/specs/SPEC_admin_catalog_management.md`, `docs/specs/SPEC_admin_localization_management.md` (checked — "explicit confirmation" wording is behavior-level, no edits needed).
- Backend contract refs: none touched; all changes are presentation/interaction.
- Focused references: `.agents/references/execution.md`, `.agents/references/testing.md`.
- Source files or tests: `src/App.tsx`, `src/catalog/CatalogPanel.tsx`, `src/admin/AdminCatalogPage.tsx`, `src/admin/AdminLocalizationPage.tsx`, `src/operator/OperatorPage.tsx`, `src/operator/OperatorDiagnosticsPage.tsx`, `src/ui/PaginationControls.tsx`, `src/index.css`, colocated `*.test.tsx`.

## Assumptions

- jsdom ^29.1.1 (package.json) supports `HTMLDialogElement.show/showModal/close` — tests interact via buttons only; Escape behavior is verified manually. Revisit trigger: ConfirmDialog tests fail on `showModal`.
- The admin catalog summary "No book selected" is live state (becomes "Editing book X, version Y", `AdminCatalogPage.tsx:1549`) and intentionally stays; only the public catalog's hardcoded "0 selected" is dead UI.

## Open Questions

All resolved by the user on 2026-06-10:

- Workspace width cap: raise to 1440px everywhere (new item 14).
- Audit entries: do not condense duplicates by default; filtering/grouping may become an option later (out of scope). Details move inline into the table via expanding rows, replacing the side details panel (new item 13, owns a `SPEC_operator_audit_surface.md` update).
- Scope: implement everything.
- Commits: one commit per group after that group's validation passes (5 checkpoints: A dialog, B shell/navigation, C catalog feedback, D inline audit details, E layout + width cap).

## Proposed Changes

Commit groups: A = items 1–2 (dialog), B = items 3–5 (shell), C = items 6–8 (catalog), D = item 13 (inline audit details), E = items 9–12b plus 14 (layout, width cap).

### 1. New `ConfirmDialog` component

Files: `src/ui/ConfirmDialog.tsx` (new), `src/ui/ConfirmDialog.test.tsx` (new), `src/index.css`.

Native `<dialog>` + `showModal()` (free focus trap, Escape, top layer). Mount-when-open: parent renders it only while a delete is pending; mount effect calls `showModal()` then focuses the Cancel button. Props: `title`, `message: ReactNode`, `confirmLabel`, `cancelLabel = 'Cancel'`, `onConfirm`, `onCancel`. `onClose={onCancel}` covers Escape/native close; call-site cancel handlers must be idempotent (cleanup `close()` also fires it after confirm).

Buttons reuse `.secondary-button` / `.danger-button` (`src/index.css:710–748`). `.confirm-dialog` styled as a pulled catalog card (surface background, 6px radius, `--shadow-panel`); entry animation reuses the transform-only `@keyframes card-pull` (`src/index.css:216`, contrast-safe for axe; reduced-motion handled globally at :222). `::backdrop` uses a literal ink scrim `rgb(23 28 41 / 0.45)` (CSS variables don't reliably reach `::backdrop`).

Tests: dialog role plus title/message render; Confirm fires `onConfirm`; Cancel fires `onCancel`; initial focus on Cancel.

### 2. Wire dialog into the 3 delete call sites

Files: `src/admin/AdminCatalogPage.tsx` (`window.confirm` at :469 books, :588 categories), `src/admin/AdminLocalizationPage.tsx` (:426), plus their `.test.tsx` files.

Per site: split delete into `requestXDelete(record, opener)` (sets `pendingXDelete` state + `deleteReturnFocusRef`) → conditional `<ConfirmDialog>` → `confirmXDelete()` runs the existing delete body minus the confirm gate. Opener passed explicitly from the row button (`event.currentTarget`); on cancel, return focus via `window.requestAnimationFrame(() => opener?.focus())` — same pattern as `src/operator/OperatorPage.tsx:235`. Keep message copy exactly `Delete ${label}?`. Confirm labels: "Delete book" / "Delete category" / "Delete localization".

Tests: replace `vi.spyOn(window, 'confirm')` (`AdminCatalogPage.test.tsx:414, 441, 534, 577`; `AdminLocalizationPage.test.tsx:336, 385`) with: click row Delete → `findByRole('dialog')` → assert message text → click confirm → existing fetch assertions unchanged. Add one cancel test per page (no DELETE request, dialog removed, focus returned).

### 3. Per-route `document.title`

Files: `src/App.tsx`, `src/App.test.tsx`.

Effect inside `RouteContextHeader` (App.tsx:421, already remounts per route via `key={routeContext.path}`): `document.title = `${context.title} · Library Console``. Static `<title>` in `src/index.html` stays as pre-bootstrap fallback. Tests: assert title for `/catalog` and one authenticated route.

### 4. Skip-to-content link

Files: `src/App.tsx`, `src/index.css`.

`<a className="skip-link" href="#main-content">Skip to main content</a>` as first child of `.app-shell` (App.tsx:237); `id="main-content"` + `tabIndex={-1}` on `<main className="workspace">` (:262). CSS: absolutely positioned, `z-index: 20` (above topbar's 10), hidden via `transform: translateY(-150%)`, revealed with `transform: none` on `:focus`. Never `display: none`. Tests: link exists with correct href; main carries the id.

### 5. Focus reset on route change

Files: `src/App.tsx`, `src/App.test.tsx`.

New `useRouteFocusReset()` hook in App: tracks `useLocation().pathname` + `useNavigationType()`. Skip when type is `REPLACE` (redirects, URL canonicalization), when previous pathname is null (initial load), or when pathname unchanged (query-string churn). Otherwise `requestAnimationFrame(() => document.getElementById('page-title')?.focus())`. Add `tabIndex={-1}` to the `<h1 id="page-title">` (:428). Tests: no focus steal on initial load; h1 focused after clicking a nav link.

### 6. Catalog refetch feedback

Files: `src/catalog/CatalogPanel.tsx`, `src/ui/PaginationControls.tsx`, `src/index.css`.

Local `isFetching` state; books effect (:84–105) sets it true before `fetchBooks`, false in then/catch (inside the `!ignore` guard). Stale rows stay rendered. Permanently-mounted `<p className="catalog-fetch-status" role="status">` whose text toggles to "Updating results…" while fetching over ready data (live regions must pre-exist to announce; fixed `min-height` avoids layout shift). Pass `busy` into `BookResults`: `aria-busy` on `.catalog-table-scroll` (:399); new optional `disabled?: boolean` prop on `PaginationControls` (default false, other consumers untouched) disabling buttons and page-size select. No opacity dim on table text — avoids the axe contrast race entirely.

### 7. Catalog empty-state recovery action

Files: `src/catalog/CatalogPanel.tsx`, `src/index.css`.

`StateBlock` children replace the message (`src/ui/StateBlock.tsx:22`), so in the empty branch (:372–395) render `<StateMessage variant="empty">No books match these filters.</StateMessage>` explicitly plus, when any filter/category is active, a "Clear filters" button (`.secondary-button state-block-action`) calling the existing `clearFilters` (:146). CSS: `.state-block-action { margin-top: 0.6rem; justify-self: center; }`.

### 8. Remove dead "Selected: 0 selected" + spec update

Files: `src/catalog/CatalogPanel.tsx` (delete dl entry :336–339), `src/catalog/CatalogPanel.test.tsx` (delete assertion :63), `docs/specs/SPEC_public_catalog_workflow_polish.md` (line 10: drop ", and selected row count").

Same change set, same scope. Spec is the durable owner; markdown lint requires LF endings.

Catalog test additions: refetch test (deferred second fetch → stale rows visible, "Updating results…" present, pagination disabled, aria-busy; resolve → clears); empty-state tests (Clear filters present with active filter and resets the query; absent without filters).

### 9. Diagnostics overview layout — fix the stranded "Runtime summary"

Files: `src/operator/OperatorDiagnosticsPage.tsx`, `src/index.css`.

Cause: `.operator-overview-grid` uses `repeat(auto-fit, minmax(19rem, 1fr))` (:1142–1146); the tall Audit summary card defines row 1's track height, so Runtime summary (row 2) starts below it, leaving a giant gap under the short Operational status card.

Fix: add modifier classes to the three cards in `OperatorOverview` (:186–192) and use explicit grid areas — `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'status audit' 'runtime audit'; align-items: start;` with `.operator-card-status/-audit/-runtime { grid-area: … }`. In the existing 720px media block, collapse to a single column (`'status' 'audit' 'runtime'`). Source order unchanged, so reading/tab order stays logical.

### 10. Operations audit table — stop mid-word breaking

Files: `src/operator/OperatorPage.tsx`, `src/index.css`.

Cause: the audit table reuses `.catalog-table` whose `td { overflow-wrap: anywhere }` (:2247) lets "AUTHENTICATION", "LOGIN_SUCCESS", and actor logins break mid-word; `.operator-audit-table { min-width: 880px }` (:2254) is too small for 5 mono-token columns.

Fix: raise `.operator-audit-table` min-width to ~64rem (the wrapper is already a horizontal scroll region, OperatorPage.tsx:478–483) and set `overflow-wrap: normal` on the target/action/actor cells (add cell classes if needed; summary column keeps wrapping).

### 11. Category row actions — compact labels

Files: `src/admin/AdminCatalogPage.tsx` (:1383–1396).

Categories rows render visible `Edit {label}` / `Delete {label}` ("Delete manual-regression-no-tag"), unlike the books table's compact "Edit"/"Delete" with `aria-label` (:1277, :1285). Align: visible "Edit" / "Delete", record name in `aria-label`. Accessible names unchanged, so role-based test queries survive.

### 12. Account menu — connection details always visible as cells (explicit user request)

Files: `src/App.tsx` (`SessionAccountMenu`, :521–689), `src/index.css`, `src/App.test.tsx`.

Remove the "Connection details" disclosure button and `showDetails` state from both menu variants (signed-in :671–684, signed-out :602–615); always render `SessionDetails`. Style each `session-metadata` dt/dd pair as a bordered cell tile (padding, 1px `--color-border`, 4px radius, `--color-background` fill) in a two-column grid; the existing 720px media block already collapses it to one column. Tests clicking "Connection details" before asserting endpoint values change to assert the always-visible details directly.

### 12a. Cap oversized "Sort by" / "Rows per page" controls

Files: `src/index.css` only.

Cause: fr-based two-column control grids consume the full panel width — `.catalog-controls` (:2075), `.localization-controls` (:1794), `.operator-controls` (:1341). Fix: `grid-template-columns: minmax(14rem, 24rem) minmax(9rem, 11rem); justify-content: start;` for all three. Existing ≤720px single-column overrides stay.

### 12b. Localization create-form balance — verify at 1440px, then minimal fix

Files: `src/index.css` (possibly none).

With the workspace cap raised (item 14), check the form in the preview; only if the three columns (`.localization-form-grid`, :1801) still look unbalanced, adjust the template (e.g. `minmax(14rem, 1fr) minmax(8rem, 10rem) minmax(14rem, 1.6fr)`).

### 13. Inline audit details — expanding rows replace the side panel

Files: `src/operator/OperatorPage.tsx`, `src/operator/OperatorDiagnosticsPage.tsx`, `src/operator/AuditDetailsPanel.tsx` (refactor), `src/index.css`, `docs/specs/SPEC_operator_audit_surface.md`, both operator `.test.tsx` files.

Extract the detail body (metadata dl + Summary + Structured-details JSON, `AuditDetailsPanel.tsx:68–109`) into a reusable `AuditEntryDetails` component and delete the panel shell. Operations table: the row "View" button becomes a "Details" toggle with `aria-expanded`/`aria-controls`; when expanded, an extra `<tr class="audit-detail-row"><td colspan="6">` beneath the row renders `AuditEntryDetails`; single-expansion semantics keep the existing `SelectedAuditEntry | null` state and the workflow summary's "Selected" field working; the opener-focus-return machinery is removed (focus stays on the toggle). Diagnostics list: expand `AuditEntryDetails` inside the clicked `<li>`. Remove the second `operator-layout` column from both pages — content goes full width. Spec update: reword "read-only details panel" (lines 30, 154 and any other panel mentions) to inline read-only row details, keeping behavior-level wording. Tests: rewrite details open/close flows against `aria-expanded` + inline content.

### 14. Workspace width cap 1200px → 1440px

Files: `src/index.css` (:761).

`.workspace { width: min(100%, 1440px); }` — global. Verify admin tables/forms and route headers at the new width; existing breakpoints (all ≤960px) untouched.

## Contract And Repository Invariants

- No API-facing behavior changes; no new endpoints, fields, or transport assumptions.
- Durable owners updated alongside code: `SPEC_public_catalog_workflow_polish.md` (item 8) and `SPEC_operator_audit_surface.md` (item 13); confirm-flow specs and `docs/DESIGN.md` were checked and need none.
- Run `git status --short` before edits; treat existing changes as user-owned.
- Commits authorized by the user: one per group (A–E) after that group's validation passes.

## Validation Plan

Per commit group: `npm run lint:eslint`, `npm run typecheck`, `npm test`, then the group's commit. Full pass at the end:

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` (full baseline — app source plus markdown changed).
2. `npm run a11y` — dialog, skip link, status region, focus changes introduce no new findings.
3. `npm run smoke:anonymous` and `npm run smoke:authenticated`.
4. Manual pass via `npm run dev:mock` for jsdom-untestable behavior: Escape closes the dialog, backdrop in light/dark, skip link appears on first Tab, h1 focus after nav, diagnostics layout has no gap and stacks at mobile width, audit tokens don't split, account menu cells in both themes. The user's own vite dev server occupies port 5173 — do not kill it; use `npm run dev:list`/`dev:cleanup` hygiene or `autoPort` in `.claude/launch.json`.

## Review Expectations

- Review for owner drift (spec edit in item 8) and for accessible-name regressions in items 2 and 11.
- No auth/session/CSRF/transport surface changes; security review not triggered beyond restating invariants.

## Risks

- jsdom `<dialog>` gaps: tests use button clicks only; explicit `.focus()` after `showModal()` keeps initial focus deterministic; Escape verified manually.
- `onClose` double-firing `onCancel` after confirm: cancel handlers are idempotent; confirm snapshots the pending record before clearing state.
- Focus stolen on load/redirects: `useNavigationType()` REPLACE guard plus null-previous-pathname guard.
- axe contrast: no text dimming anywhere; dialog entry animation reuses the transform-only `card-pull` keyframes.
- Existing App tests: the new skip link may affect link-count queries; removing the "Connection details" toggle requires updating tests that click it.

## Handoff Notes

- Implementation authorized 2026-06-10 ("implement everything", commits per group). Progress tracked per commit group A–E.
