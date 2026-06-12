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

Selected on 2026-06-12 from the interactive UX design session; execution coordination lives in `PLAN-ux-design-followups` (Draft).

### M-I18N-003: Localization Catalog Caching

Labels: type:milestone, status:ready

Goal: Stop refetching the UI localization catalog on every page load and language switch by caching it per browser session and revalidating when admin localization edits change the active language.

#### E-I18N-005: Session Catalog Cache And Revalidation

Labels: type:epic, milestone:M-I18N-003, status:ready

Current evidence: `loadUiCatalog` walks every page of `GET /api/localizations` on each full page load and each language switch, twice per load under dev StrictMode, and admin localization mutations leave any loaded catalog stale until the next reload.

Tasks:

- T-I18N-009: Cache loaded UI catalogs per language for the browser session and serve repeat language switches from the cache.
- T-I18N-010: Invalidate or update the cached catalog when an admin localization mutation touches the cached language, so saved chrome translations appear without a full reload.

Acceptance Criteria:

- Switching back to an already-loaded language within one session issues no catalog refetch.
- Creating, editing, or deleting a localization row for the active language updates the rendered chrome in the same session.
- Backend HTTP caching for `GET /api/localizations` stays backend-owned and is tracked as a Candidate row in the sibling `technical-interview-demo` roadmap intake.

The remaining UX design-session work in `PLAN-ux-design-followups` stays plan-scoped until selected here.

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
