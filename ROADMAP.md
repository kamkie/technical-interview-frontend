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

- Release phase: `v0.5.0` is committed and tagged locally; remote publication of `main` and the tag is pending.
- Latest release: `v0.5.0`.
- Next target version: Not selected; select the next maintenance target before more release prep.
- Current priority: Push `main` and the `v0.5.0` tag so the tag-driven Release workflow publishes the container image and GitHub Release, then select the next maintenance target.
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

Selected on 2026-06-12 after the UX design-session follow-ups (`PLAN-ux-design-followups`, archived) delivered `M-I18N-003`; no execution plan is attached yet.

### M-I18N-004: Operator Localization Coverage

Labels: type:milestone, status:ready

Goal: Route every user-visible operator-area string through the localization registry so admin-supplied translations apply on the operator pages, and drop the message keys orphaned by the theme-menu and coverage-matrix reworks.

#### E-I18N-006: Operator Chrome Keying And Registry Cleanup

Labels: type:epic, milestone:M-I18N-004, status:ready

Current evidence: The 2026-06-12 T9 audit keyed the operator signed-out blocks and unknown-value fallbacks but recorded the remaining operator chrome as a follow-up: filter labels and options, table headers, StateBlock loading/empty/error strings, `formatAuditSummary`, aria-labels, the `AUDIT_TARGET_TYPE_LABELS` and `AUDIT_ACTION_LABELS` enum display maps, `createAuditEntryLabel`, and the diagnostics card and metadata labels including literal Yes/No values bypass `t()` (~70+ strings), so `/operator` and `/operator/diagnostics` render mixed languages when a non-English language is active (user-confirmed on `/operator`, 2026-06-12). `ui.theme.option-title` and `ui.admin-localization.status`/`ui.admin-localization.missing-locales` remain in the registry with no call sites after the theme-menu and coverage-matrix reworks.

Tasks:

- T-I18N-011: Key the remaining operator audit chrome (filter labels and options, table headers, state blocks, summaries, enum display maps, aria-labels) through `t()` with English defaults.
- T-I18N-012: Key the remaining diagnostics chrome (card titles, metadata labels, Yes/No values) through `t()` with English defaults.
- T-I18N-013: Remove the orphaned `ui.theme.option-title` and `ui.admin-localization.status`/`ui.admin-localization.missing-locales` keys from the registry along with any mock seeds that mirror them.

Acceptance Criteria:

- With a non-English language active, every user-visible string on `/operator` and `/operator/diagnostics` resolves through the localization registry, with English appearing only as the documented per-key fallback.
- Audit enum values keep stable identifiers in code and URLs; only their display labels localize.
- The registry contains no keys without call sites.
- Backend `ui.*` seed alignment for new keys stays backend-owned through the existing seed-alignment intake in the sibling `technical-interview-demo` roadmap.

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
