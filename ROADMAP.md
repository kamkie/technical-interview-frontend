# Roadmap

This roadmap tracks active, planned, and explicitly deferred first-party browser
frontend work for the sibling `technical-interview-demo` backend. Roadmap editing
rules are owned by `.agents/references/roadmap.md`.

## Current Baseline

| Field               | Current                                                                                   |
|---------------------|-------------------------------------------------------------------------------------------|
| Release phase       | Post-`0.2.0` maintenance                                                                  |
| Next target version | Future maintenance release; final scope and version selected before release prep           |
| Frontend stack      | Vite + React + TypeScript                                                                 |
| Runtime             | Node.js 24.x, npm 11.x                                                                    |
| Backend integration | Same-origin `/api/**` browser traffic                                                     |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`           |
| Implemented surface | Session, public catalog, account, admin catalog/users, operator, localization, app theme   |
| Active milestone    | Production UI redesign foundation                                                         |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`      |

The app currently bootstraps browser session state with `GET /api/session`,
renders login options from session metadata, generates checked OpenAPI TypeScript
types, routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, implements selected admin/operator surfaces, and provides an
app-level light/dark/system theme preference.

The selected implementation milestone is the production UI redesign foundation.
Remaining roadmap work follows that foundation before selecting narrower polish,
automation, or release-prep slices.

## Product Direction

- Extend the contract-first browser UI only for backend-supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.
- Keep any mock API development mode same-origin, `/api/**`-shaped,
  contract-backed, and opt-in; it must not become an alternate production
  integration path.
- Promote hardening, smoke, or release checks only when a selected roadmap row or
  owner document defines the threshold, evidence, and failure owner.

## Active Milestones

| Status | Milestone                         | Durable owner                                                        | Backend contract source                                                                                              | Expected tests                                                                                                                                 | Validation                                                                                 |
|--------|-----------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Ready  | Production UI redesign foundation | `ROADMAP.md`; later implementation behavior owned by route/component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, account, admin, operator, and catalog behavior | Route/component coverage for shell navigation, route context, auth controls, admin grouping, state rendering, and unchanged backend-backed flows | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |

Scope:

- Present the app as a production browser product, not as repository or technical
  demo framing.
- Reserve the primary shell and navigation for everyday catalog, account, and
  operator workflows.
- Move admin workflows into a distinct menu or section instead of mixing them with
  primary user navigation.
- Make authentication and session controls user-facing first, with diagnostics
  secondary.
- Provide route context for each work area so users can understand where they are
  and what actions are available.
- Reduce exposed refresh and control clutter where automatic state or route context
  can carry the interaction.
- Improve empty, loading, and error states without branching on localized English
  display messages.
- Preserve same-origin `/api/**`, session-cookie auth, CSRF, login provider,
  pagination, repeated filter, localization, and versioned update invariants from
  the backend contract sources.

## Near-Term Backlog

| Status  | Backlog row                                        | Durable owner                                                        | Backend contract source                                                                                              | Expected tests                                                                                                                                | Validation                                                                                 |
|---------|----------------------------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Ready   | Implement production UI redesign foundation        | `ROADMAP.md`; later implementation behavior owned by route/component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, account, admin, operator, and catalog behavior | Route/component coverage for shell navigation, route context, auth controls, admin grouping, state rendering, and unchanged backend-backed flows | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Visual hierarchy and page structure pass           | `ROADMAP.md`; later implementation behavior owned by route/component layout tests | No new API surface; preserve backend-backed route behavior from `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` | Route/component coverage for page bands, route-specific layout hierarchy, card reduction, state visibility, and unchanged backend-backed flows | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Admin/operator operational workflow density        | `ROADMAP.md`; later implementation behavior owned by admin/operator route and component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for admin and operator behavior       | Admin/operator route and component coverage for product-shaped workflows, dense operational scanning, grouped controls, state handling, and unchanged backend-backed operations | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Catalog/table/form action hierarchy pass           | `ROADMAP.md`; later implementation behavior owned by catalog/admin component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for catalog and admin catalog behavior | Catalog/admin component coverage for table scanning, form prominence, action hierarchy, pagination, sorting, repeated filters, and update version fields | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Account/session and product copy polish            | `ROADMAP.md`; later implementation behavior owned by auth/account route and component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for session, login/logout, account, localization, and display-message behavior | Auth/account route and component coverage for session controls, login provider rendering, logout, preference updates, technical labels, dialogs, identifiers, and localized state messaging | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Status and state semantics pass                    | `ROADMAP.md`; later implementation behavior owned by shared state, route, and component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for stable fields such as status, `messageKey`, endpoint context, localization, and unchanged response handling | Shared state and route/component coverage for consistent catalog, account, admin, and operator statuses plus empty, loading, and error states that do not branch on English display text | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Waiting | Responsive layout and table-scanning polish        | `ROADMAP.md`; later implementation behavior owned by responsive route/component tests | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` for unchanged backend-backed flows     | Responsive route/component or browser coverage for shell navigation, tables, filters, action groups, auth controls, and table scanning beyond simple vertical stacking | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |

Keep backend surface expansion unselected unless a future backend contract refresh
or product decision introduces an approved operation gap. Select authenticated
fake-OAuth smoke automation only when maintainers want an executable command beyond
the owner contract in `docs/LOCAL_AUTH_SMOKE.md`. Promote local smoke gaps into
tests or owner docs only after documented workflows expose a repeatable gap. Keep
release-prep work unselected until a concrete release candidate exists.

## Smoke And Local Procedure Candidates

Deferred candidates:

- Authenticated browser smoke automation beyond fake-OAuth readiness.
- Anonymous browser smoke expansion beyond the current canonical command.
- Accessibility automation with stable thresholds and failure ownership.
- Promotion of repeatable local smoke gaps into component, route, or browser tests.

## Procedure Adoption Scope

The backend repository's procedure model should be adopted selectively. This
frontend needs clear ownership without backend operational weight.

Adopted procedure owners are indexed in `docs/README.md`. Completed procedure
adoption summaries are archived in `docs/ROADMAP_ARCHIVE.md`.

Add only when justified by future work:

- `.agents/references/planning.md` and a reusable plan template if more large
  multi-milestone plans are expected.
- A lightweight changed-file classifier or command wrapper only if CI time becomes a
  real bottleneck.
- Durable workflow-state directories under `.agents/context/` only if the repository
  starts using multi-agent delegation or long-lived sidecars again.

Keep deferred:

- Backend operations and deployment runbooks until this frontend owns a deployment
  target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm,
  Kubernetes, and post-deploy smoke procedures. The frontend keeps lightweight
  reference manifests under `infra/` until a deployment target is selected.
- Environment-specific deployment promotion, hosted-runtime runbooks, and
  backend-owned posture checks outside the frontend container/package/reference
  manifests.

## Hardening Candidates

Future hardening candidates should become release-blocking only after they have a
repeatable local command or a clearly owned CI signal with triage and skip rules.

Deferred candidates and revisit triggers:

- Container image vulnerability thresholds, deployment posture gates, and runtime
  infrastructure hardening beyond the advisory baseline: revisit after maintainers
  select stable thresholds, owners, and exception rules.
- SBOM and license reporting: revisit when maintainers select a durable
  dependency/license inventory requirement for the published container package.
- Enforced bundle-size or asset-budget checks: revisit when a reviewed threshold
  exists or production `dist/` growth becomes a repeated review issue.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter
  supply-chain policy or add automation that keeps pinned SHAs current.
- Custom frontend security lint rules beyond CodeQL and ESLint: revisit when a
  repeated issue pattern is not covered by the selected checks.
- CI artifact upload for hardening reports: revisit when selected checks write
  stable report files that should outlive workflow logs or code-scanning alerts.

Do not add backend-only hardening gates. Do not make selected container/deployment
hardening release-blocking until one stable baseline exists and a severity or
posture threshold has been selected.

## Rejected Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Deployment promotion beyond the GHCR package, checked-in reference manifests, and
  GitHub Release workflow.
