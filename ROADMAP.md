# Roadmap

This roadmap tracks the active, planned, and deferred first-party browser frontend
work for the sibling `technical-interview-demo` backend. Completed roadmap work is
archived in `docs/ROADMAP_ARCHIVE.md`. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field               | Current                                                                                                                                                                                                                                                                        |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Release phase       | Published `0.2.0` release; post-release maintenance                                                                                                                                                                                                                            |
| Next target version | Future post-`0.2.0` admin catalog actions-column polish slice; final version selected before release prep                                                                                                                                                                      |
| Frontend stack      | Vite + React + TypeScript                                                                                                                                                                                                                                                      |
| Runtime             | Node.js 24.x, npm 11.x                                                                                                                                                                                                                                                         |
| Package metadata    | `package.json` and `package-lock.json` version `0.2.0`; `packageManager` `npm@11.16.0`                                                                                                                                                                                         |
| Routing target      | React Router                                                                                                                                                                                                                                                                   |
| CI target           | GitHub Actions                                                                                                                                                                                                                                                                 |
| Container artifact  | Docker image built from `Dockerfile`, serving the Vite build through unprivileged Nginx on port 8080                                                                                                                                                                           |
| Infrastructure refs | Kustomize and Helm references under `infra/` for the frontend container and same-origin `/api/**` proxy                                                                                                                                                                        |
| Release automation  | Tag-driven GitHub Release workflow publishes the GHCR container package, signature, and provenance for future tags that include the workflow                                                                                                                                   |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row                                                                                                                                                                                    |
| Backend integration | Same-origin `/api/**` browser traffic                                                                                                                                                                                                                                          |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`                                                                                                                                                                                                |
| Implemented surface | Session, public catalog, public catalog/app shell visual polish, account, admin catalog, admin localization, admin users, operator, app theme preference                                                                                                                       |
| Hardening baseline  | ESLint, TypeScript, Vitest, API type freshness, build, Codecov coverage/test/bundle uploads, Docker build, whitespace, npm audit, advisory M20 runtime/Nginx, rendered-manifest, and Trivy checks, CodeQL, dependency-review, Dependabot, and release image signing/provenance |
| Latest release      | Published `v0.2.0` on 2026-06-07 with GHCR image, signature, provenance, and GitHub Release notes                                                                                                                                                                              |
| Immediate action    | Implement the selected M27 admin catalog actions column polish                                                                                                                                                                                                                 |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`                                                                                                                                                                                           |

The app currently bootstraps browser session state with `GET /api/session`, renders
login options from session metadata, generates checked OpenAPI TypeScript types,
routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, implements the selected admin/operator surfaces, and provides an
app-level light/dark/system theme preference. Local same-origin auth smoke steps,
the canonical validation baseline, Docker image build, tag-driven GHCR package
publication, and selected hardening evidence are documented.
Earlier completed roadmap work and plan records are archived in
`docs/ROADMAP_ARCHIVE.md`. Post-`0.1.0` execution added contract coverage,
anonymous smoke automation, fake-OAuth readiness, advisory hardening, provider
metadata guardrails, and the published `v0.2.0` release. Post-`0.2.0` execution
selected M19 public catalog workflow polish for canonical route state, visible
query-state summaries, accessible sort affordances, the selected M23
light/dark/system theme preference, the completed M24 browser session surface
cleanup, and the completed M25 public catalog and app shell visual pass.
Remaining roadmap work starts with the selected M27 admin catalog actions-column
wrapping polish before selecting the next product, visual, or automation slice.
M26 is complete by explicit request and added a contract-backed mock API so
frontend-only UI work can run without starting the sibling backend.

## Product Direction

- Keep extending the contract-first browser UI only for backend-supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.
- Keep any mock API development mode same-origin, `/api/**`-shaped,
  contract-backed, and opt-in; it must not become an alternate production
  integration path.
- Prefer CI-owned hardening tools with reproducible local commands before treating a
  security or quality signal as release-blocking.
- Treat container image vulnerability scanning, frontend-owned deployment posture
  checks, and runtime infrastructure hardening as selected follow-up scope, not
  deferred scope.

## Active Milestones

Earlier completed roadmap work is archived in `docs/ROADMAP_ARCHIVE.md`.

Status terms:

- `Done`: the milestone has landed locally and remains in the active table until a
  release cleanup archives it.
- `Ready`: the milestone can start from the current repository state.
- `Waiting`: the milestone has a normal predecessor dependency.
- `Blocked`: the milestone needs a product choice, credential, backend contract
  refresh, or external state before implementation can start.

| Milestone | Status | Scope | Done when | Validation |
| --- | --- | --- | --- | --- |
| M19 - Public Catalog Workflow Polish | Done | Selected in `docs/specs/SPEC_public_catalog_workflow_polish.md`: canonical public catalog route query state, visible active filter/sort/page summaries, default-filter clarity, and accessible sort affordances without backend changes. | Component/route tests cover canonical URL replacement, visible query-state summaries, sort control names, and existing request serialization. | Relevant tests plus full baseline for app changes. |
| M23 - Dark Mode Support | Done | Added app-level dark mode support for implemented public catalog, account, admin, and operator flows without backend/API behavior changes. The app respects the user's OS color-scheme preference on first visit, provides a visible light/dark/system preference control, persists explicit preference locally, and keeps existing session, routing, and localization behavior unchanged. | Light, dark, and system theme selection renders consistently across implemented routes, survives reloads when explicitly selected, preserves keyboard focus visibility and accessible contrast, and has focused component/route coverage plus browser evidence on representative public and authenticated shells. | Relevant tests, browser screenshots or smoke for changed flows, and full baseline for app changes. |
| M24 - Browser Session Surface Cleanup | Done | Moved the Browser Session status and session metadata out of the main page content into a hidden-by-default Session details surface in the app chrome. Account, logout, session cookie, and CSRF metadata remain available for troubleshooting without making session diagnostics a primary page section. | Primary implemented pages no longer show the Browser Session panel by default, session diagnostics remain reachable through an explicit control with accessible naming and keyboard support, and session bootstrap/login/logout behavior remains unchanged. | Focused App tests cover the disclosure behavior and metadata-driven sign-in links; browser evidence covers the main page and opened session surface. |
| M25 - Public Catalog And App Shell Visual Design Pass | Done | Polished the implemented anonymous `/catalog` flow and shared app shell after the Browser Session surface cleanup landed. Scope included header/action layout, intro hierarchy, catalog filters, category chips, query summary, table readability, pagination, focus-visible styling, and responsive behavior across light/dark/system themes without backend/API, auth, route, query-string, sorting, filtering, pagination, or localization behavior changes. | The catalog and shell are easier to scan on desktop and mobile, preserve existing route/query/session behavior, keep keyboard focus visible, and have explicit browser evidence for representative light and dark catalog states. | Focused App/catalog tests, browser screenshots for `/catalog` at desktop and mobile widths in light and dark modes, and full baseline for app changes. |
| M26 - Contract-Backed Mock API Development Mode | Done | Added an opt-in Vite mock API development mode so frontend-only work can run without the sibling backend. The mock serves same-origin `/api/**`, uses generated OpenAPI types for fixtures and route shapes, and keeps session-cookie metadata, login-provider metadata, logout, CSRF, localization, pagination, repeated filters, and representative error behavior aligned with the backend contract. | `npm run dev:mock` runs the frontend against mock middleware instead of the local backend proxy, supports admin/user/anonymous sessions plus success/empty/error scenarios, keeps in-memory mutations for development, and documents that live backend smoke remains the contract-confidence path. | Mock handler tests cover OpenAPI path coverage, session metadata and cookies, CSRF enforcement, repeated category filtering, pagination, version increments, empty/error scenarios, and login/logout state. |
| M27 - Admin Catalog Actions Column Polish | Ready | Polish the admin books table actions column so long edit/delete labels do not wrap into bulky multi-line buttons for rows such as `Manual Regression Book no-tag`. Scope includes action button labeling/layout, column sizing, wrapping behavior, responsive behavior, and accessibility/focus treatment while preserving existing backend/API, auth, sorting, filtering, pagination, localization, and destructive-action behavior. | Admin catalog row actions remain easy to scan and operate on desktop and mobile, long labels do not distort the table, keyboard focus stays visible, and edit/delete intent and destructive-action safeguards remain unchanged. | Focused admin catalog tests or browser smoke for representative long-label rows, plus full baseline for app changes. |

## Near-Term Backlog

1. Implement the selected M27 admin catalog actions column polish so long edit/delete labels
   remain compact and accessible without changing backend/API or destructive-action
   behavior.
2. Keep backend surface expansion unselected unless a future backend contract
   refresh or product decision introduces an approved operation gap.
3. Turn the M18 fake-OAuth readiness contract into an executable authenticated smoke
   command when that automation slice is selected.
4. Exercise the documented local auth smoke workflow against the sibling backend and
   move repeatable gaps into tests or owner docs.
5. For future releases, push `main` and the annotated tag, then monitor the Release
   workflow and verify the GHCR package, signature/provenance evidence, and
   published release notes against `CHANGELOG.md`.

## Pragmatic Smoke Split

- Unit and component tests cover the current public, account, admin, and operator
  route behavior.
- Public catalog browser smoke can run anonymously against the sibling backend at
  `..\technical-interview-demo`, validating session bootstrap, categories, books,
  filters, pagination, sorting, and localized read errors.
- The canonical anonymous command is `npm run smoke:anonymous`. Live pass evidence
  requires a running frontend origin, the sibling backend behind the frontend
  `/api/**` proxy, and Playwright Chromium.
- Authenticated browser smoke readiness can use the backend `local,oauth,fake-oauth`
  profile without external provider secrets. The frontend must still discover and
  start the `smoke` provider through `loginProviders[]`, then verify session refresh
  after login/logout, CSRF handling for unsafe authenticated writes, and
  authenticated access for account and admin/operator routes. M18 owner docs are
  complete; executable automation waits for a selected smoke command.

## Implementation Defaults

- New M16+ implementation plans should identify the owner document, backend contract
  source, tests, and validation before implementation starts.
- M16 contract coverage findings should live in `docs/API_COVERAGE.md` and should
  classify every approved OpenAPI operation before implementation scope is promoted.
- Future admin/operator expansion should update or add specs under `docs/specs/`
  before implementation.
- New hardening work should add package scripts and CI steps only for checks with a
  repeatable local command or a CI-owned signal with a documented owner for failures.
- Human procedure docs live under `docs/` and keep entry-point docs linked to their
  owners. AI-facing references live under `.agents/references/`, and `AGENTS.md`
  points to them without duplicating full procedures.

## Procedure Adoption Scope

The backend repository's procedure model should be adopted selectively. This
frontend needs the same owner clarity, but not the same operational weight.

Adopted procedure owners are indexed in `docs/README.md`. The completed M14/M15
adoption summary is archived in `docs/ROADMAP_ARCHIVE.md`.

Add only when justified by future work:

- `.agents/references/planning.md` and a reusable plan template if more large
  multi-milestone plans are expected after M12-M15.
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

The selected M13 hardening baseline is implemented and archived in
`docs/ROADMAP_ARCHIVE.md`. New hardening candidates should become release-blocking
only after they have a repeatable local command or a clearly owned CI signal with
triage and skip rules.

Selected follow-up scope:

- Container image vulnerability scanning, deployment posture checks, and runtime
  infrastructure hardening: M20's advisory first pass shipped in `0.2.0` with Trivy
  for the Docker image, a kube-linter wrapper for rendered Kustomize and Helm
  manifests, and a repo-owned runtime/Nginx check for `Dockerfile` plus
  `docker/nginx/` invariants. Local or CI command output is the evidence location;
  generated reports are not checked in during the first pass. The release baseline
  has `npm run hardening:runtime`, `npm run docker:build`, and
  `npm run hardening:trivy` passing; `npm run hardening:kube-linter` renders
  manifests but requires `kube-linter` on `PATH`. Maintainers own triage and the
  existing hardening exception path until a dedicated owner is selected. Make any
  finding severity or posture gate release-blocking only after the command or CI
  signal has one stable baseline and a reviewed exception workflow.

Deferred candidates and revisit triggers:

- SBOM and license reporting: revisit when maintainers select a durable
  dependency/license inventory requirement for the published container package.
- Enforced bundle-size or asset-budget checks: revisit when a reviewed threshold
  exists or production `dist/` growth becomes a repeated review issue.
- Authenticated browser smoke automation beyond M18 readiness: implement after the
  fake-OAuth backend profile, smoke identity, skip/fail policy, and canonical command
  are documented.
- Anonymous browser smoke and accessibility automation: revisit when the repository
  owns a canonical browser command and stable failure thresholds.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter
  supply-chain policy or add automation that keeps pinned SHAs current.
- Custom frontend security lint rules beyond CodeQL and ESLint: revisit when a
  repeated issue pattern is not covered by the selected checks.
- CI artifact upload for hardening reports: revisit when M20 or a later selected
  check writes stable report files; until then, use code-scanning alerts,
  pull-request check annotations, local command output, and workflow logs.
Do not add backend-only hardening gates. Do not make selected container/deployment
hardening release-blocking until one stable baseline exists and a severity or
posture threshold has been selected.

## Release Procedure

This section mirrors the backend repository's release model, adapted for a
frontend Vite/npm package with a GHCR container artifact. Release work is
maintainer-owned and starts only after the intended implementation scope is
complete, reviewed, and integrated on `main`.

### Versioning And Release Rules

- Use semantic version tags in the form `vMAJOR.MINOR.PATCH` for stable releases or
  `vMAJOR.MINOR.PATCH-PRERELEASE` for prereleases.
- Keep version numbers increasing in `git log --first-parent` order.
- Cut releases only from `main` after all intended changes are integrated there.
- Use annotated tags for intentional releases.
- Keep `CHANGELOG.md` aligned with the release tag.
- A pushed semantic tag whose commit contains `.github/workflows/release.yml`
  triggers the Release workflow, which validates the candidate, builds and
  smoke-tests the container image, publishes semantic and short-SHA GHCR tags, signs
  and attests the immutable digest, and creates the GitHub Release with package
  links.
- Update `ROADMAP.md` after each release so completed work leaves the active roadmap,
  only active or deferred work remains, and the current baseline reflects the new
  release phase, breaking policy, next target version, and latest release.
- Do not create another durable released-history file; released human history belongs
  in `CHANGELOG.md`.

### Release Preconditions

Do not start release preparation until all of these are true:

- The target implementation plan or ad hoc release scope is complete and validation
  evidence is current.
- Local `main` is synced to the exact release-candidate state.
- Required backend contract artifacts and generated API types are current, or any
  intentional backend-contract refresh is already reviewed.
- `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `SETUP.md`, and package metadata agree
  with the release candidate's user-visible surface.
- The full frontend validation baseline has passed for the exact candidate:
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
  `git diff --check`.
- The production container image build has passed with `npm run docker:build`, or a
  documented maintainer decision explains why local Docker validation is unavailable
  before the tag-driven release workflow supplies that evidence.
- Selected M13 static-analysis and hardening checks have passed for the exact
  candidate, or each exception has a documented owner and release decision.
- Any required browser smoke or e2e evidence has either passed or is explicitly
  recorded as unavailable with the reason.

### Preparing A Release

1. Inspect existing tags with `git tag --sort=v:refname` and first-parent history
   with `git log --first-parent --decorate --oneline`.
2. Choose the next semantic version. Use `PATCH` for compatible fixes or cleanup,
   `MINOR` for backward-compatible frontend feature expansion, and `MAJOR` only for
   an explicitly selected breaking-change plan.
3. Move the release-relevant `CHANGELOG.md` entries from `## [Unreleased]` into a
   new version section dated `YYYY-MM-DD`, leaving a fresh `## [Unreleased]`.
4. Update `ROADMAP.md` so the current baseline names the release phase, latest
   release, next target version, and immediate next action after the release.
5. Archive or close completed concrete plan files only when release cleanup explicitly
   adopts that backend-style plan archive step; do not archive templates or active
   plans.
6. Re-run validation, including `npm run docker:build`, if release metadata edits
   made earlier evidence stale.
7. Commit the release metadata change with `Prepare vMAJOR.MINOR.PATCH[-PRERELEASE]
   release`.
8. Create an annotated tag named `vMAJOR.MINOR.PATCH[-PRERELEASE]` with a concise
   annotation such as `Release vMAJOR.MINOR.PATCH[-PRERELEASE]`.
9. Verify locally that the tag points at the release commit and that `git status`,
   `CHANGELOG.md`, `ROADMAP.md`, package metadata, and validation evidence all
   describe the same release candidate.

### Publishing And Verification

- Push `main` and the annotated tag only when the release task explicitly includes
  remote publication.
- Monitor the tag-triggered Release workflow until it finishes. It must pass the
  full validation baseline, `npm run audit:security`, container build/smoke, GHCR
  publication, signature verification, provenance attestation, and GitHub Release
  creation before publication is considered complete.
- Verify that the GHCR semantic tag and `sha-<12-char-commit>` tag resolve to the
  same immutable digest, and use that digest rather than the mutable tag as the
  authenticity anchor.
- Verify the published release notes match the released changelog section and include
  the container image, immutable image, and package page references.
- After publication, update `ROADMAP.md` again only if publication changes the
  active release phase, next target version, or deferred release automation scope.

## Rejected Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Deployment promotion beyond the GHCR package, checked-in reference manifests, and
  GitHub Release workflow.

## Roadmap Rules

- Keep this file focused on selected, planned, explicitly deferred, or rejected
  frontend scope.
- Move completed milestone summaries into `docs/ROADMAP_ARCHIVE.md` when they leave
  the active roadmap.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep endpoint fields, request schemas, auth header details, and durable API rules in
  `docs/backend/` or executable tests, not in this roadmap.
- Update this file when roadmap or product scope changes; update `SETUP.md`,
  `README.md`, or package configuration only when their owned behavior changes.
