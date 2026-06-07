# Roadmap

This roadmap tracks the active, planned, and deferred first-party browser frontend
work for the sibling `technical-interview-demo` backend. Completed roadmap work is
archived in `docs/ROADMAP_ARCHIVE.md`. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field               | Current                                                                                    |
|---------------------|--------------------------------------------------------------------------------------------|
| Release phase       | Local `0.1.0` release cut; post-release maintenance                                        |
| Next target version | Proposed post-`0.1.0` roadmap slice; final version selected before release prep             |
| Frontend stack      | Vite + React + TypeScript                                                                  |
| Runtime             | Node.js 24.x, npm 11.x                                                                     |
| Package metadata    | `package.json` and `package-lock.json` version `0.1.0`; `packageManager` `npm@11.16.0`      |
| Routing target      | React Router                                                                               |
| CI target           | GitHub Actions                                                                             |
| Container artifact  | Docker image built from `Dockerfile`, serving the Vite build through unprivileged Nginx on port 8080 |
| Infrastructure refs | Kustomize and Helm references under `infra/` for the frontend container and same-origin `/api/**` proxy |
| Release automation  | Tag-driven GitHub Release workflow publishes the GHCR container package, signature, and provenance for future tags that include the workflow |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row |
| Backend integration | Same-origin `/api/**` browser traffic                                                      |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`            |
| Implemented surface | Session, public catalog, account, admin catalog, admin localization, admin users, operator |
| Hardening baseline  | ESLint, TypeScript, Vitest, API type freshness, build, Codecov coverage/test/bundle uploads, Docker build, whitespace, npm audit, CodeQL, dependency-review, Dependabot, and release image signing/provenance |
| Latest release      | Local `v0.1.0` release cut on 2026-06-07; not published remotely                           |
| Immediate action    | Start M16 contract coverage, M18 fake-OAuth authenticated-smoke readiness, and selected advisory M20 hardening refinement |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`       |

The app currently bootstraps browser session state with `GET /api/session`, renders
login options from session metadata, generates checked OpenAPI TypeScript types,
routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, and implements the selected admin/operator surfaces. Local
same-origin auth smoke steps, the canonical validation baseline, Docker image build,
tag-driven GHCR package publication, and selected hardening evidence are documented.
Completed M0-M15 work and plan records are
archived in `docs/ROADMAP_ARCHIVE.md`; the next roadmap work starts with M16 and
then promotes smoke automation, selected container/deployment hardening, or focused
UX polish based on that audit and the selected follow-up scope.

## Product Direction

- Keep extending the contract-first browser UI only for backend-supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.
- Prefer CI-owned hardening tools with reproducible local commands before treating a
  security or quality signal as release-blocking.
- Treat container image vulnerability scanning, frontend-owned deployment posture
  checks, and runtime infrastructure hardening as selected follow-up scope, not
  deferred scope.

## Active Milestones

Completed M0-M15 work is archived in `docs/ROADMAP_ARCHIVE.md`.

Status terms:

- `Ready`: the milestone can start from the current repository state.
- `Waiting`: the milestone has a normal predecessor dependency.
- `Blocked`: the milestone needs a product choice, credential, backend contract
  refresh, or external state before implementation can start.

| Milestone | Status | Scope | Done when | Validation |
| --- | --- | --- | --- | --- |
| M16 - Contract Coverage And Scope Audit | Ready | Reconcile `docs/backend/approved-openapi.json`, generated API types, API clients, routes, specs, and visible UI coverage after `0.1.0`. Decide whether the next implementation slice is missing backend-supported surface, smoke automation, or focused UX polish. | `docs/API_COVERAGE.md` records each approved OpenAPI operation as implemented, deferred, or needing follow-up; `ROADMAP.md` promotes the next slice based on that audit; no new endpoint or auth assumption is introduced. | `git diff --check`; add broader validation only if executable files change. |
| M17 - Anonymous Browser Smoke Automation | Waiting on M16 | Add a canonical browser smoke path for anonymous same-origin flows against the sibling backend through the Vite `/api` proxy. Cover session bootstrap, public categories/books, URL-backed filters, pagination, sorting, and localized public-read failures where reproducible. | A documented npm command or script exists, names backend/profile prerequisites, reports skipped backend-dependent steps clearly, and can run without credentials. Public smoke evidence is recorded in docs or test output. | Smoke command plus `git diff --check`; full baseline if package scripts, tooling, or app code change. |
| M18 - Authenticated Smoke Automation Readiness | Ready | Define the fake-OAuth authenticated smoke readiness contract for the sibling backend profile `local,oauth,fake-oauth`. Use the backend-exposed `smoke` provider discovered from `GET /api/session` and first-admin bootstrap identity `smoke:smoke-user`; do not hard-code provider paths, `/test-support/oauth2/**`, or secrets. | Owner docs name the fake-OAuth backend profile, default smoke identity, optional `FAKE_OAUTH_*` overrides, `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES=smoke:smoke-user`, login-provider discovery, logout CSRF handling, account/admin checks, and skip/fail behavior when the fake provider or backend is unavailable. | `git diff --check`; later executable smoke work uses the full baseline and the selected smoke command. |
| M19 - Public Catalog Workflow Polish | Waiting on M16 | Improve the already implemented public catalog workflow without backend changes: scan density, URL-state clarity, keyboard/focus behavior, accessible table controls, pagination/sort affordances, and localized loading/empty/error states. | A focused spec or roadmap note names the exact polish scope; component/route tests cover the changed visible states; anonymous smoke is updated if the workflow changes browser behavior. | Relevant tests plus full baseline for app changes. |
| M20 - Container And Deployment Hardening Refinement | Ready | Implement the selected advisory first pass for frontend-owned hardening: Trivy scans the production container image, kube-linter checks rendered Kustomize and Helm manifests, and a repo-owned runtime/Nginx check covers `Dockerfile` plus `docker/nginx/` invariants. Exclude backend application operations, deployment promotion, and environment-specific platform policy. | Owner docs and scripts or CI signals name Trivy, kube-linter, the runtime/Nginx check, local command evidence, maintainer triage, exception handling, and advisory-only policy. Generated reports are not checked in during the first pass. Follow-on rows are opened before making findings release-blocking or adding persisted CI artifacts. | `git diff --check` for docs-only refinement; full baseline, `npm run docker:build`, Trivy image scan, kube-linter rendered-manifest checks, and the runtime/Nginx check when tooling or runtime files change. |
| M21 - Login Provider Metadata Guardrail | Waiting on M16 | Audit login/session UI, docs, and tests for OAuth provider paths outside `GET /api/session` metadata. Remove unsupported constants if found and add focused coverage or owner-doc guidance that prevents regressions. | Auth entry points render providers from `loginProviders[]`; no provider path is hard-coded in frontend-owned code or docs outside backend-contract examples; coverage or owner docs make the constraint enforceable. | `git diff --check` for docs-only audit; relevant auth tests plus full baseline if source or test files change. |
| M22 - Backend Surface Expansion Selection | Waiting on M16 | Convert M16 coverage gaps into one selected backend-supported surface slice before implementation. Use a roadmap row or focused spec to name the operation group, user-visible behavior, tests, and validation; do not invent endpoints or request fields. | The selected surface has an owner spec or roadmap row, operation coverage is recorded in `docs/API_COVERAGE.md`, route/user states and tests are named, and unselected surfaces remain classified for follow-up. | `git diff --check` for selection docs; API-facing validation and full baseline when implementation follows. |
| M23 - Implemented Flow Visual Design Pass | Waiting on M16 | Select broad visual design work only when tied to implemented public, account, admin, or operator flows. Define the exact flows, accessibility/focus/responsive goals, test coverage, and browser evidence before changing app UI. | A selected visual pass is scoped to implemented user flows, covered by focused tests or browser evidence, and avoids backend/API behavior changes. | Relevant tests, browser screenshots or smoke for changed flows, and full baseline for app changes. |
| M24 - Post-`0.1.0` Release Preparation | Waiting on selected M16-M23 implementation scope | Prepare the next patch or minor release only after selected implementation and validation evidence land. | `CHANGELOG.md`, `ROADMAP.md`, package metadata when needed, validation evidence, completed milestone archive, and tag/publication decision agree for the selected release candidate. | Full baseline, `npm run audit:security`, release checks, and any selected smoke evidence or explicit skip rationale. |

## Near-Term Backlog

1. Execute the ready M16, M18, and M20 slices, then promote the next ready M17, M19,
   M21, M22, or M23 slice based on the coverage audit and selected smoke,
   backend-surface, or visual-design scope.
2. Implement M20 as the selected advisory Trivy, kube-linter, and runtime/Nginx
   hardening pass with local command evidence, maintainer triage, and no checked-in
   generated reports.
3. Use M21 to turn login-provider metadata invariants into explicit audit evidence
   or regression coverage before expanding auth-related UI.
4. Use M22 to select the next backend-supported surface from M16 coverage findings
   before implementation starts.
5. Use M23 for broad visual design work only after the implemented flows and browser
   evidence are named.
6. Add a canonical browser smoke or e2e command for anonymous same-origin
   session/catalog flows against the sibling backend.
7. Execute M18 readiness docs for the backend `fake-oauth` smoke provider, then turn
   the readiness contract into an executable authenticated smoke command.
8. Exercise the documented local auth smoke workflow against the sibling backend and
   move repeatable gaps into tests or owner docs.
9. If remote publication of the existing local `v0.1.0` tag is requested, treat it
   as legacy/manual publication because that tag predates the Release workflow. For
   future release tags, push `main` and the annotated tag, then monitor the Release
   workflow and verify the GHCR package, signature/provenance evidence, and
   published release notes against `CHANGELOG.md`.

## Pragmatic Smoke Split

- Unit and component tests cover the current public, account, admin, and operator
  route behavior.
- Public catalog browser smoke can run anonymously against the sibling backend at
  `..\technical-interview-demo`, validating session bootstrap, categories, books,
  filters, pagination, sorting, and localized read errors.
- Authenticated browser smoke readiness can use the backend `local,oauth,fake-oauth`
  profile without external provider secrets. The frontend must still discover and
  start the `smoke` provider through `loginProviders[]`, then verify session refresh
  after login/logout, CSRF handling for unsafe authenticated writes, and
  authenticated access for account and admin/operator routes. Executable automation
  waits for the M18 owner docs and selected smoke command.

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
  infrastructure hardening: tracked by M20. The first pass is advisory-only and uses
  Trivy for the Docker image, kube-linter for rendered Kustomize and Helm manifests,
  and a repo-owned runtime/Nginx check for `Dockerfile` plus `docker/nginx/`
  invariants. Local or CI command output is the evidence location; generated
  reports are not checked in during the first pass. Maintainers own triage and the
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
