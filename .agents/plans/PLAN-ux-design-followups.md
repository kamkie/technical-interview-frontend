# Plan: UX Design Follow-Ups After v0.5.0

Plan-ID: PLAN-ux-design-followups

Status: Approved

Workers: 1

Clean verifier: None declared.

Filename: `.agents/plans/PLAN-ux-design-followups.md`

## Readiness

- Plan readiness: Design decisions are resolved from the 2026-06-12 interactive design session; implementation approved.
- Approved by: Kamil Kiewisz (user request: "implement PLAN-ux-design-followups.md")
- Approved at: 2026-06-12T18:11:00+02:00
- Open questions: No blocking questions; see `## Assumptions` for recorded defaults.
- Implementation progress: In progress.

Use `Status: Approved` only after explicit user approval is recorded. Creating or updating this plan is not implementation approval.

## Status History

- 2026-06-12T18:30:00+02:00: none -> Draft by Claude (interactive design session with user); plan created.
- 2026-06-12T19:10:00+02:00: Draft updated by Claude; user-reported issues added as T6-T9 (chip search truncation and layout jump, diagnostics empty space, double connection error, translation caching and hardcoded-string gaps).
- 2026-06-12T18:11:00+02:00 (later session): Draft -> Approved by Kamil Kiewisz via the request "implement PLAN-ux-design-followups.md"; execution started.

## Goal

Ship five user-approved UX improvements: globally true localization coverage with actionable gaps, a partial-translation notice in the language menus, language-resolution continuity across loads, production-grade copy and timestamp formatting, and a compact two-row mobile topbar with a unified theme-menu idiom.

## Non-Goals

- No backend contract changes; all work uses the existing `GET /api/localizations` pagination and single-value `messageKey`/`language` filters.
- No change to the per-key English fallback rendering model (best-effort display stays).
- No removal of the inline edit-row pattern in admin tables (confirmed healthy during the session; an earlier "edit form off-screen" finding was retracted as a probe artifact).
- No extension of the seeded mock Polish/German translations beyond what new message keys require.
- No hamburger/drawer navigation on mobile; nav links stay visible.

## Source Artifacts

- User request: 2026-06-12 interactive design session (chat); decisions recorded in this plan.
- Roadmap refs: `M-I18N-003` / `E-I18N-005` (T-I18N-009, T-I18N-010) selected 2026-06-12 for the caching slice (T9); remaining packets stay plan-scoped until selected.
- Backend contract refs: `docs/backend/approved-openapi.json` (`/api/localizations` GET: single `messageKey` string filter, `language` filter, pageable; no repeated-key filter), `docs/backend/FRONTEND_AI_CONTRACT.md` (`language` negotiation cookie).
- Source files: `src/admin/AdminLocalizationPage.tsx`, `src/i18n/I18nProvider.tsx`, `src/i18n/resolveLanguage.ts`, `src/i18n/messages.ts`, `src/App.tsx`, `src/account/AccountProfile.tsx`, `src/ui/format.ts`, `src/index.css`.
- Focused references: `.agents/references/execution.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`.

## Assumptions

- Backend clamps page size at 100 (diagnostics reports `MAX PAGE SIZE 100`); the coverage sweep pages at `size=100`. Owner: backend contract docs; revisit if the clamp changes.
- Coverage sweep safety bound: if `totalElements` exceeds 2,000 rows, skip the sweep and degrade to the current visible-rows derivation with the existing caveat hint. Owner: this plan; revisit with real data volumes.
- Partial-translation notice threshold: show the notice whenever the loaded UI catalog covers less than 100% of `UI_MESSAGES` keys; the percentage shown is rounded to whole numbers. Owner: user review at T2.
- Timezone for plan timestamps: Europe/Warsaw.

## Open Questions

- None blocking. Decisions taken in-session: background full sweep over verify-on-click (T1); matrix + language chips over language-lens-first (T1); keep account-page form model (T3); theme menu idiom on all viewports (T5); mobile topbar included in scope (T5).

## Proposed Changes

- `src/admin/AdminLocalizationPage.tsx` — coverage sweep, global coverage model, matrix rework, chips, always-active cells, timestamp formatting.
- `src/api/localizations.ts` — sweep helper (paged unfiltered list) if not already expressible.
- `src/i18n/I18nProvider.tsx`, `src/i18n/resolveLanguage.ts` — persist resolved account language to the `language` cookie; expose catalog coverage ratio.
- `src/App.tsx` — language menus: partial-coverage notice, admin link, "Language settings" entry; theme control becomes a menu; topbar responsive layout hooks.
- `src/account/AccountProfile.tsx` — presentation alignment, resolved-language hint.
- `src/i18n/messages.ts` — copy rewrites and new keys.
- `src/ui/format.ts` — localizable fallback for `formatTimestamp`.
- `src/index.css` — coverage matrix height cap, mobile topbar two-row layout, initials-circle account button.
- Tests colocated with each changed module.

## Contract And Repository Invariants

- Route API-facing behavior through `docs/backend/` artifacts; the sweep uses only documented pagination and filters.
- Preserve same-origin `/api/**`, session-cookie auth, CSRF, localization, pagination, repeated-filter, and versioned-update invariants.
- Run `git status --short` before edits; treat unexpected changes as user-owned.
- Move durable rules discovered during execution into owner documents before closing this plan.

## Progress Tracker

| Packet                     | Status   | Owner       | Depends On | Last Updated | Notes                                  |
| -------------------------- | -------- | ----------- | ---------- | ------------ | -------------------------------------- |
| T1-localization-coverage   | Complete | Coordinator | None       | 2026-06-12   | Largest packet                         |
| T2-partial-language-notice | Complete | Coordinator | None       | 2026-06-12   | User-confirmed in session              |
| T3-language-continuity     | Complete | Coordinator | None       | 2026-06-12   | Cookie write + account-page alignment  |
| T4-copy-and-timestamps     | Ready    | Coordinator | None       | 2026-06-12   | Safest packet                          |
| T5-mobile-topbar           | Ready    | Coordinator | None       | 2026-06-12   | Theme menu idiom changes all viewports |
| T6-catalog-chip-search     | Ready    | Coordinator | None       | 2026-06-12   | User-reported chip search issues       |
| T7-diagnostics-layout      | Ready    | Coordinator | None       | 2026-06-12   | Fill the two-column hole               |
| T8-connection-errors       | Ready    | Coordinator | None       | 2026-06-12   | Repro required first                   |
| T9-i18n-cache-and-gaps     | Ready    | Coordinator | None       | 2026-06-12   | Session cache + hardcoded-string audit |

## Task Packets

### Task Packet: T1-localization-coverage

Task id: T1-localization-coverage

Lane: implementation

Goal:

- On `/admin/localizations` mount, sweep all localization rows (`GET /api/localizations?size=100&page=0..N`, unfiltered) into a client-side coverage model; after mutations, update the model locally from the mutation result without re-sweeping.
- Coverage widget shows globally true stats ("N keys · M gaps"), a per-language summary chip row (for example `en 100% · pl 15%`) where each chip filters the matrix to keys missing that language, and a key search box scoped to the matrix.
- Matrix lists all keys (decoupled from the rows table's filters and pagination), drops the STATUS and MISSING LOCALES columns, and caps its height with internal vertical scroll.
- Every missing cell is always an actionable "add" button opening the prefilled create form (existing `startCreate` path); cells whose row exists open that row for editing even when it is on another rows-table page. Delete the `coverageViewPartial` suppression and the partial-view hint copy.
- Show the English reference text next to the message-text field in the create/edit form.
- Render the rows-table UPDATED column with `formatTimestamp`.
- Degrade per the 2,000-row assumption: skip sweep, restore current visible-rows behavior and hint.

Write scope:

- `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminLocalizationPage.test.tsx`, `src/api/localizations.ts` (+ test), `src/index.css` (matrix sizing only), `src/i18n/messages.ts` (new `ui.admin-localization.*` keys only; scope added 2026-06-12 by coordinator because the packet's new UI copy requires keys).

Dependencies: none.

Validation:

- Scoped vitest for the page and API module; `npm run typecheck`; `npx eslint src scripts`; manual browser pass in mock mode incl. mobile viewport per `.agents/references/testing.md` routing.

Stop conditions:

- Backend rejects `size=100` or paging behaves off-contract; coverage model memory pressure at the assumed bound; any need to touch routing or shared pagination components beyond read use.

Result summary:

- Status: complete (2026-06-12). `sweepLocalizations` pages `GET /api/localizations?size=100` unfiltered with the 2,000-row `too-large` bail-out; the page holds a `loading | ready | degraded` coverage model patched locally after mutations (no re-sweep). Matrix decoupled from table filters/pagination, STATUS/MISSING LOCALES columns dropped, height capped at 24rem with internal scroll; all cells actionable (add via prefilled `startCreate`, edit via standalone panel for off-page rows). Degraded path keeps the old visible-rows derivation, hint, and create suppression. English reference shown in the form; UPDATED column uses `formatTimestamp`. Validation: scoped vitest 35/35 (stabilized by coordinator: success-feedback assertions re-query inside `waitFor` because the post-save refresh remounts the form panel), `npm run typecheck` pass, `npx eslint src scripts` pass, `git diff --check` pass, mock-mode preview smoke on port 5199 (sweep request shape, chip filtering, off-page edit, English reference, zero console errors). Known follow-ups: matrix reuses `category-chip`/`category-search-input` classes so T6 CSS changes also affect this page; `ui.admin-localization.status`/`.missing-locales` keys now unused (left for a cleanup outside this packet's scope).

### Task Packet: T2-partial-language-notice

Task id: T2-partial-language-notice

Lane: implementation

Goal:

- After the UI catalog loads, compute coverage as loaded-catalog keys over `UI_MESSAGES` keys.
- When below 100%, the language menus (signed-in and anonymous) show a notice under the current selection: language covers X% of the interface, the rest appears in English.
- Admins additionally see a "Complete this translation" link to `/admin/localizations?language=<lang>`.
- No extra network requests; only the already-loaded catalog is used.

Write scope:

- `src/App.tsx`, `src/App.test.tsx`, `src/i18n/I18nProvider.tsx` (+ test), `src/i18n/messages.ts` (new keys).

Dependencies: none.

Validation:

- Scoped vitest; `npm run typecheck`; `npx eslint src scripts`; manual check switching to seeded `pl` and `de` in mock mode.

Stop conditions:

- Coverage ratio unavailable without provider API changes that leak catalog internals; menu layout regressions on mobile.

Result summary:

- Status: complete (2026-06-12). `I18nProvider` tags the loaded catalog with its language and derives `catalogCoverage` (0..1) over `UI_MESSAGES` keys — forced to 1 for `en`, unloaded/failed catalogs, and in-flight switches. Exposed via a render-prop `CatalogCoverage` component (module-private context; no catalog internals leaked). Both language menus render `LanguageCoverageNotice` under the options ("{language} covers {percent}% of the interface. The rest appears in English."); admins also get a "Complete this translation" link to `/admin/localizations?language=<lang>` that dismisses the menu. Two new keys. No extra network requests. Validation: scoped vitest 42/42, typecheck pass, `npx eslint src scripts` pass, `git diff --check` pass; mock-mode preview confirmed pl 4% / de 1% notices, admin link, and no notice for `en`. Anonymous-menu browser check skipped (mock boots as admin; signing out would mutate the shared preview session) — covered by vitest instead. Follow-up noted: a `catalogCoverage` member on `I18nContextValue` in `useI18n.ts` would replace the render-prop cleanly; left out as an out-of-scope edit.

### Task Packet: T3-language-continuity

Task id: T3-language-continuity

Lane: implementation

Goal:

- When the account language preference resolves (login, account load, preference save), persist the resolved language into the `language` negotiation cookie (reuse the anonymous-menu cookie write), so the next full load resolves the correct language before `/api/account` returns. Eliminates the wrong-language flash; after logout the UI keeps the last language.
- Account page keeps the select + "Save language" + "Clear preference" form model. Align presentation with the topbar menu: identical option labels and ordering, `MutationFeedback`-style saved confirmation in both surfaces, and a resolved-language hint when no preference is set ("No preference — currently following your browser: English").
- Topbar language menu gains a final "Language settings" entry linking to `/account`.

Write scope:

- `src/i18n/I18nProvider.tsx` (+ test), `src/App.tsx` (+ test), `src/account/AccountProfile.tsx` (+ test), `src/i18n/messages.ts` (new keys).

Dependencies: none.

Validation:

- Scoped vitest incl. a reload-resolution test through `resolveLanguage` inputs; `npm run typecheck`; `npx eslint src scripts`.

Stop conditions:

- Cookie semantics conflict with `docs/backend/FRONTEND_AI_CONTRACT.md` negotiation rules; any need to change logout behavior beyond resolution order.

Result summary:

- Status: complete (2026-06-12). `I18nProvider`'s account-value subscription mirrors the resolved supported preference into the `language` cookie (same attributes as the anonymous-menu write: `path=/; max-age=31536000; SameSite=Lax`) at bootstrap, account load, and preference save; reload-resolution test proves the cookie tier yields the account language before `/api/account`. Account select labels/order now match the topbar menu; "No preference — currently following your browser: {language}" hint added; quick menu stays open after save with the shared `MutationFeedback` confirmation (reset on trigger toggle) and gains a final "Language settings" link to `/account`. Two new keys. Recorded decisions: preference-less accounts write no cookie (keeps cookie/browser tiers truthful), and "Clear preference" does not delete the cookie — so after clearing, the UI keeps the last language until cookie/browser tiers change, and the browser-hint copy can be nominally inaccurate while a stale cookie pins the language (edge also reachable pre-T3 via the anonymous menu; accepted). Validation: scoped vitest 51/51, typecheck pass, `npx eslint src scripts` pass, `git diff --check` pass; browser pass not required for this packet.

### Task Packet: T4-copy-and-timestamps

Task id: T4-copy-and-timestamps

Lane: implementation

Goal:

- Rewrite contract-speak English defaults in `src/i18n/messages.ts` (keys unchanged), including at minimum: localization admin lede, operations console lede, users admin lede, admin catalog lede, "Replace managed roles" heading and helper, the "Updating loaded version N" form note, and the account page "ACCOUNT RECORD" label (becomes "Account ID"). Session-agreed flavor: "Browse the audit log of who changed what, and when." for the operations console; "Add and edit the translated messages shown across the app." for localization admin.
- Localize the hardcoded `'Unknown'` fallback in `src/ui/format.ts` (accept a fallback parameter or translate at call sites).
- Ensure every timestamp column across admin/operator tables routes through `formatTimestamp` (localization rows handled in T1; audit/users already conform).

Write scope:

- `src/i18n/messages.ts`, `src/ui/format.ts` (+ test), call-site files for the fallback parameter and labels (`src/account/AccountProfile.tsx`, `src/admin/AdminUsersPage.tsx`, `src/operator/OperatorPage.tsx`, `src/admin/AdminCatalogPage.tsx`) and their colocated tests.

Dependencies: none (T1 owns the localization-rows timestamp call site; coordinate write scopes if run in parallel).

Validation:

- Scoped vitest; `npm run typecheck`; `npx eslint src scripts`; copy review against `ROADMAP.md` "Product Direction" (production product framing).

Stop conditions:

- A rewrite would change the meaning of a contract-mandated behavior description (versioned updates, CSRF) rather than its tone.

Result summary:

- Status: pending

### Task Packet: T5-mobile-topbar

Task id: T5-mobile-topbar

Lane: implementation

Goal:

- Replace the three-option theme radiogroup with a dismissible menu (icon + caret, options System/Light/Dark with checked state) using the existing `useDismissibleMenu` idiom, on all viewports.
- Narrow viewports get a two-row topbar: row one brand + language menu + theme menu + account button as an initials circle; row two the nav links in a single horizontally scrollable row. Target chrome height ≤ ~104px at 375px width (currently 194px).
- Desktop keeps the single-row layout with the new theme menu; account button keeps the display name.
- Preserve skip-link, focus order, and `aria-expanded`/`aria-controls` patterns; keep entry animations transform-only (axe contrast flake guard).

Write scope:

- `src/App.tsx`, `src/App.test.tsx`, `src/index.css`, `src/ui/icons.tsx` (only if a new icon is required), `src/i18n/messages.ts` (new keys).

Dependencies: none.

Validation:

- Scoped vitest; `npm run typecheck`; `npx eslint src scripts`; `npm run a11y`; manual 375px viewport measurement of topbar height in mock mode.

Stop conditions:

- Theme menu cannot express the radiogroup semantics accessibly; topbar height target requires hiding nav links.

Result summary:

- Status: pending

### Task Packet: T6-catalog-chip-search

Task id: T6-catalog-chip-search

Lane: implementation

Goal:

- Stop the category search placeholder from truncating (user screenshot, Polish placeholder "Wpisz, aby znaleźć kategorię" clipped in the fixed `12rem` input): widen or flex the input, add `text-overflow: ellipsis` for placeholder overflow, and review placeholder length per language.
- Make the `::-webkit-search-cancel-button` styling occupy space only when the input has text and stay visibly rendered in both themes (`src/index.css:1739`); cross-check non-WebKit engines.
- Stop the layout jump while filtering chips: reserve stable height for the chip area (`.category-chip-row` / `.category-filter`), so narrowing chips never moves the table or toolbar below. Applies to both public catalog and admin catalog instances of `CategoryFilter`.

Write scope:

- `src/catalog/CategoryFilter.tsx` (+ test), `src/index.css`, `src/i18n/messages.ts` (placeholder wording only if needed).

Dependencies: none.

Validation:

- Scoped vitest; `npm run typecheck`; `npx eslint src scripts`; manual mock-mode check at desktop and 375px: type into chip search and confirm zero vertical shift below the control.

Result summary:

- Status: pending

### Task Packet: T7-diagnostics-layout

Task id: T7-diagnostics-layout

Lane: implementation

Goal:

- Remove the dead space in the diagnostics overview (user screenshot: hole under Dependencies because `operator-overview-grid` is two fixed `operator-overview-side` stacks of unequal height).
- Preferred direction: flow the cards as CSS `columns: 2` with `break-inside: avoid` (masonry-like fill, robust to backend-dependent card heights such as "Git details unavailable"), or rebalance card assignment and pull the full-width Frontend build card into the shorter column. Keep a single column flow on narrow viewports.

Write scope:

- `src/operator/OperatorDiagnosticsPage.tsx` (+ test), `src/index.css`.

Dependencies: none.

Validation:

- Scoped vitest; `npm run typecheck`; `npx eslint src scripts`; manual check that no column hole remains with mock data and with the "unavailable" cards present.

Result summary:

- Status: pending

### Task Packet: T8-connection-errors

Task id: T8-connection-errors

Lane: implementation

Goal:

- Reproduce the user-reported double error when the backend is unreachable: the topbar "Connection issue" menu (session bootstrap error) and a page-level error block render simultaneously, and one survives its sibling's retry because session state and page data state retry independently.
- Design outcome: one connection story — a single reachability surface, and any retry (or any subsequent successful response) recovers both the session state and the visible page's data state. No error surface may persist after a retry that succeeded.
- Reproduce first against a stopped backend or the mock error scenario; record the exact pair of surfaces and the sticky one in this packet before implementation.

Write scope:

- `src/App.tsx` (+ test), `src/auth/RequireAuthenticated.tsx` (+ test), `src/ui/asyncState.ts` (+ test) as needed; page files only for wiring retries.

Dependencies: none.

Validation:

- Scoped vitest with a simulated unreachable backend; `npm run typecheck`; `npx eslint src scripts`; manual repro before/after.

Stop conditions:

- The repro shows the second surface comes from a source this plan does not own (for example backend-localized problem payloads).

Result summary:

- Status: pending

### Task Packet: T9-i18n-cache-and-gaps

Task id: T9-i18n-cache-and-gaps

Lane: implementation

Goal:

- Add a session-scoped UI catalog cache in the i18n layer keyed by language (today `loadUiCatalog` refetches every page load and every language switch, twice in dev StrictMode), invalidated when an admin localization mutation touches the cached language (coordinate with T1's mutation paths).
- Audit and key the hardcoded English strings that bypass `t()` — confirmed: all `RequireAuthenticated` guard copy ("Checking authentication", "Session unavailable", "Sign in required", login-provider strings); sweep the rest of `src/` for JSX string literals.
- HTTP-level caching (ETag / max-age on `/api/localizations`) is backend-owned: recorded 2026-06-12 as a Candidate row in the sibling `technical-interview-demo` roadmap `## Conceptualization` table; do not implement here.

Write scope:

- `src/i18n/catalog.ts` (+ test), `src/i18n/I18nProvider.tsx` (+ test), `src/auth/RequireAuthenticated.tsx` (+ test), `src/i18n/messages.ts`; audit findings may add call-site files with coordinator approval.

Dependencies: none (coordinate cache invalidation hooks with T1 if both run).

Validation:

- Scoped vitest incl. a cache-hit and an invalidation test; `npm run typecheck`; `npx eslint src scripts`.

Result summary:

- Status: pending

## Execution Model

- `Workers: 1` sequential by default; T2–T5 have disjoint-enough scopes for selective parallel waves except where `src/App.tsx` and `src/i18n/messages.ts` overlap (T2, T3, T5 share both — keep those sequential or merge their `App.tsx` work into one wave).
- Each repository-changing packet is validated through `.agents/references/testing.md` and self-reviewed through `.agents/references/reviews.md` before the next dependent packet starts.
- Commit checkpoints: one commit per completed, validated packet; no commits are authorized until this plan is `Status: Approved` and the current request authorizes execution.

## Validation Plan

- Per packet: scoped vitest, `npm run typecheck`, `npx eslint src scripts` (full `npm run lint` fails on user-local gitignored scripts).
- Cross-cutting after all packets: `npm run a11y`, `npm run test`, manual mock-mode browser pass on desktop and 375px viewports.
- Skipped validation must be reported with reasons.

## Review Expectations

- Backend contract drift review for T1 (pagination/filter use) and T3 (negotiation cookie semantics).
- Documentation drift: `docs/DESIGN.md` review for the theme-menu idiom and topbar layout change; update if it codifies the current radiogroup.
- No security review expected unless T3's cookie handling exceeds restating the existing negotiation invariant.

## Risks

- T1 sweep cost grows with data volume; mitigated by the 2,000-row bound and local model updates after mutations.
- T5 changes the theme control on desktop too; visual regression risk in screenshots/docs.
- Three packets touch `src/App.tsx`; merge conflicts if run as parallel waves.
- Copy rewrites (T4) change message defaults that seeded mock translations mirror; mock seeds may need matching tweaks to stay representative.

## Handoff Notes

- Design session evidence: the inline edit-row pattern and create-form focus management in admin pages were verified healthy; do not re-litigate. The "edit form renders off-screen" finding from early in the session was retracted as a measurement artifact.
- The preview browser page is shared with the user in this environment; unexplained mock-state changes during verification may be user interactions (see auto-memory note `preview-page-is-shared-with-user`).
- The caching slice (T9 data path) is selected on the roadmap as `M-I18N-003`; the other packets remain plan-scoped. Roadmap selection does not change this plan's `Status: Draft` — implementation still needs explicit approval.
