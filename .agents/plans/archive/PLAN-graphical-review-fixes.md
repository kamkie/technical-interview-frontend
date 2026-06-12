# Plan: Graphical Review Fixes — Timestamps, Scroll Regions, Expand Affordance, Summary Copy, Nav IA

Plan-ID: PLAN-graphical-review-fixes

Status: Closed

Close-Reason: Released

Workers: 1

Clean verifier: None declared.

Filename: `.agents/plans/archive/PLAN-graphical-review-fixes.md`

## Readiness

- Plan readiness: Implemented and closed; all open questions resolved by the user.
- Approved by: user (chat session, "fix each issue and do separate commits for them")
- Approved at: 2026-06-11
- Open questions: None; see `## Open Questions` for resolutions.
- Implementation progress: Complete; commits 7c38ecb (item 1), 8e9dbb2 (item 2), 600abcd (item 6), f03497c (item 4), eeaabaf (item 3), 6e0c327 (item 5), d7cb124 (item 7), 38c21a7 (pre-existing smoke locator strict-mode fix found during validation). Full baseline, a11y scan, and authenticated smoke green on 2026-06-11; mock-browser pass via preview_eval confirmed each fix and a clean all-route overflow sweep.

## Status History

- 2026-06-11: none -> Draft by AI agent; plan created from full-app graphical review (route walk, layout audits at 375/768/1280, token contrast computation, axe scan).
- 2026-06-11: Draft -> Closed (Released) by AI agent after user approval; decisions: chevron unification for the users table, Operations nav menu split, one commit per issue. Findings re-verified against HEAD (8 newer commits) before implementation; all 7 still applied.
- 2026-06-12: Closed plan moved to `.agents/plans/archive/` by AI agent during archive cleanup.

## Goal

Fix the consistency and accessibility findings from the 2026-06-11 graphical review: raw ISO timestamps on the account page, non-keyboard-scrollable localization tables, divergent expand-row affordances between operator and admin users tables, divergent pagination summary phrasing, missing `aria-controls` on the create-form toggles, the Admin/Operations nav grouping mismatch, and the admin book form staying 4-across between 721–960px.

## Non-Goals

- No backend contract changes; all changes are presentation/interaction.
- No consolidation of the three existing range-style summary helpers (`CatalogPanel.tsx:551`, `AdminCatalogPage.tsx:1619/:1841`, `AdminUsersPage.tsx:1125`) — they already produce the target phrasing; only the two outliers change.
- No change to row-click-to-expand semantics, URL-backed selection, or pagination behavior.

## Source Artifacts

- User request: chat session 2026-06-11 — "do full app graphical review … propose how to fix that issues".
- Roadmap refs: none.
- Design/spec refs: `docs/DESIGN.md`; `docs/specs/SPEC_admin_user_management.md` (checked — "detail view" wording is behavior-level, no edits needed); `docs/specs/SPEC_operator_audit_surface.md` (pattern source for item 3, no edits needed).
- Backend contract refs: none touched. Page responses already expose `number`/`size`/`numberOfElements`/`totalElements` (generated `PageLocalizationResponse`, `AuditLogPageResponse`).
- Focused references: `.agents/references/execution.md`, `.agents/references/testing.md`.
- Source files or tests: `src/account/AccountProfile.tsx` + test, `src/admin/AdminLocalizationPage.tsx` + test, `src/admin/AdminUsersPage.tsx` + test, `src/admin/AdminCatalogPage.tsx` + test, `src/operator/OperatorPage.tsx` + test, `src/App.tsx` + test, `src/index.css`, `src/ui/format.ts`.

## Assumptions

- `formatTimestamp` (`src/ui/format.ts`) is the single timestamp presentation owner; its `Intl.DateTimeFormat(undefined, …)` runtime-locale output is acceptable on the account page as it already is on admin users/operator/diagnostics. Tests assert via the same formatter rather than literal strings.
- Frontend nav visibility for the proposed Operations menu keeps the existing `isAdmin` gate (backend authorization remains the real gate), matching today's combined menu.

## Open Questions

All resolved by the user on 2026-06-11 ("fix each issue and do separate commits for them", taking the plan's recommended options):

1. Item 3 (expand affordance): unified on the operator chevron pattern.
2. Item 5 (nav IA): Operations + Diagnostics split into their own topbar "Operations" menu.
3. Commit granularity: one commit per issue (eight total including the pre-existing smoke locator fix).

## Proposed Changes

Commit groups: A = items 1–2 (copy/data consistency), B = items 3 (affordance), C = item 4 + 6 (markup a11y), D = item 5 (nav IA), E = item 7 (CSS responsive).

### 1. Account page timestamps use `formatTimestamp`

Files: `src/account/AccountProfile.tsx` (:134–136), `src/account/AccountProfile.test.tsx`.

`ProfileField` keeps its `'Unavailable'` fallback, so pass formatted values only when present: `value={account.lastLoginAt ? formatTimestamp(account.lastLoginAt) : undefined}` for `lastLoginAt`, `createdAt`, `updatedAt`. Import from `../ui/format`.

Tests: fixtures keep ISO inputs; assertions compare against `formatTimestamp('<iso>')` output (import the helper in the test) instead of literal ISO strings, keeping them locale-independent.

### 2. Unify pagination summary phrasing on the range style

Files: `src/operator/OperatorPage.tsx` (`formatAuditSummary`, :486–506), `src/admin/AdminLocalizationPage.tsx` (`formatLocalizationSummary`, :773–784), both `.test.tsx` files.

Both functions switch from `Showing ${count} of ${total} … .` (count style, trailing period) to the range style used everywhere else, computed from the page response's own fields (`number`, `size`, `numberOfElements`, `totalElements`), mirroring `formatUserWindow` (`AdminUsersPage.tsx:1125`):

- `Showing 1-2 of 2 audit entries` / `… of 1 audit entry`
- `Showing 1-2 of 2 localization rows` / `… of 1 localization row`
- Zero-result and missing-total branches mirror the existing helpers (`0 audit entries`; omit the range when `totalElements` is undefined).
- Loading/error prefix sentences ("Audit rows are loading.") stay unchanged.

Tests asserting the old strings update to the new phrasing.

### 3. Admin users table adopts the operator Details chevron

Files: `src/admin/AdminUsersPage.tsx` (:632–655), `src/index.css` (reuse only), `src/admin/AdminUsersPage.test.tsx`.

The users table's last column header already reads "Details". Replace the `.row-actions` group and `View {label}` secondary-button with the operator pattern (`OperatorPage.tsx:543–561`):

- `<td className="audit-expand-cell">` containing a `.row-expand-button` with `IconChevronDown` + `row-expand-caret`/`open` rotation.
- `aria-label={`Details for ${label}`}`, `aria-expanded={selected}`, `aria-controls={selected ? detailRowId : undefined}` (keep the users page's conditional idref pattern — it never dangles), keep `disabled={user.id === undefined}` and the `stopPropagation` click handler.
- Drop `aria-current`; the rotated caret and expanded row convey state, as on the operator page.
- CSS: no new rules — `.audit-expand-cell` (2.75rem) and `.row-expand-button` already exist. Check `.admin-users-table` nth-child width percentages (:2411–2429) still balance with the narrower last column; adjust percentages only if the fixed layout misallocates.

Tests: queries for `View Mock User` / `View Mock Admin` switch to the `Details for …` accessible name; expanded-state assertions move to `aria-expanded`.

### 4. `aria-controls` on the three create-form toggles

Files: `src/admin/AdminCatalogPage.tsx` ("New book" :806, "New category" ~:968 area), `src/admin/AdminLocalizationPage.tsx` ("New localization" :542), colocated tests touched only if they query these buttons by attribute.

Give each collapsed create-form card a stable id (`admin-book-create-form`, `admin-category-create-form`, `localization-create-form`) and set `aria-controls={open ? formId : undefined}` on its toggle, alongside the existing `aria-expanded`. Conditional idref avoids dangling references while the form is unmounted (axe `aria-valid-attr-value`).

### 5. Split the Operations nav menu out of the Admin menu

Files: `src/App.tsx` (`AdminMenu`, :410–456; `ShellNavigation` :382–395), `src/App.test.tsx`.

Parametrize the menu (label, trigger/panel ids, items) or duplicate it as `OperationsMenu`: **Admin** keeps Catalog admin / Localizations / Users; **Operations** gets Operations console (`end` NavLink) / Diagnostics. Both render under the same `isAdmin` visibility gate. Distinct ids (`operations-menu-trigger`, `operations-menu-panel`) keep `useDismissibleMenu` instances independent. The route eyebrow areas (ADMIN, OPERATIONS) then match their nav grouping.

Tests: nav assertions listing five admin-menu links split into two menus.

### 6. Localization tables become labeled keyboard-scrollable regions

Files: `src/admin/AdminLocalizationPage.tsx` (:737, :823).

Add the attributes every other table wrapper already has: `aria-label="Scrollable localization coverage table"` / `"Scrollable localization rows table"`, `role="region"`, `tabIndex={0}` on the two `.catalog-table-scroll` divs. CSS focus styling already exists (`.catalog-table-scroll:focus-visible`).

### 7. Admin form grid collapses to two columns ≤960px

Files: `src/index.css` (960px media block, :2768).

Add `.admin-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }` so the book form tracks `.catalog-filters` instead of staying 4-across down to 721px (inputs were ~149px at 768px). The existing 720px block already collapses it to one column.

## Contract And Repository Invariants

- No API-facing behavior changes; no new endpoints, fields, or transport assumptions.
- Durable owners checked: `SPEC_admin_user_management.md` and `SPEC_operator_audit_surface.md` are behavior-level and need no edits; re-verify after item 3 lands.
- Run `git status --short` before edits; treat existing changes as user-owned.
- Commit only per the granularity the user approves (Open Question 3).

## Validation Plan

Per commit group: `npm run lint:eslint`, `npm run typecheck`, `npm test`. Full pass at the end:

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. `npm run a11y` — items 3–6 touch accessible names/regions; expect zero new findings (it covers `/account` and `/admin/users`, both changed).
3. `npm run smoke:authenticated`.
4. Mock-browser pass via the `dev-mock-preview` launch config using `preview_eval` (`preview_click`/screenshots are unreliable on this machine): account timestamps render formatted; localization wrappers are focusable with visible focus ring; users-table chevron expands/collapses with rotated caret; both nav menus open/dismiss; summaries read range-style on operator + localization; book form is 2-across at 768px.

## Review Expectations

- Review for accessible-name regressions (items 3, 4, 6) and for test queries left targeting removed labels.
- No auth/session/CSRF/transport changes; security review not triggered.

## Risks

- Item 3 changes accessible names; any external automation or docs referencing "View {name}" buttons breaks — repo search found only colocated tests.
- Item 5 may affect `App.test.tsx` menu-interaction tests and the a11y script's sign-in flow (it targets `#account-menu-trigger`, untouched).
- `formatTimestamp` output is locale-dependent; tests must derive expectations from the helper, never literal formatted strings.
- Fixed `table-layout` width rebalance in item 3 could shift the users table columns; verify against the 880px min-width in the mock browser.

## Handoff Notes

- Created from the graphical review session 2026-06-11; review evidence (contrast table, route-walk audits, axe pass) lives in that chat transcript.
