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
| Active milestone    | None selected                                                                             |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`      |

The app currently bootstraps browser session state with `GET /api/session`,
renders login options from session metadata, generates checked OpenAPI TypeScript
types, routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, implements selected admin/operator surfaces, and provides an
app-level light/dark/system theme preference.

No implementation milestone is currently selected. Remaining roadmap work starts by
selecting the next product, visual, automation, or release-prep slice.

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

No implementation milestone is currently selected. The next action is to select the
next product, visual, automation, or release-prep slice.

## Near-Term Backlog

1. Select the next product, visual, automation, or release-prep slice.
2. Keep backend surface expansion unselected unless a future backend contract
   refresh or product decision introduces an approved operation gap.
3. Select authenticated fake-OAuth smoke automation only when maintainers want an
   executable command beyond the owner contract in `docs/LOCAL_AUTH_SMOKE.md`.
4. Promote local smoke gaps into tests or owner docs only after the documented
   workflows in `docs/LOCAL_DEVELOPMENT.md` or `docs/LOCAL_AUTH_SMOKE.md` expose a
   repeatable gap.
5. Select release-prep work only when a concrete release candidate exists.

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
