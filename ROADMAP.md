# Roadmap

This roadmap tracks the active, planned, and deferred first-party browser frontend
work for the sibling `technical-interview-demo` backend. Completed roadmap work is
archived in `docs/ROADMAP_ARCHIVE.md`. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field               | Current                                                                                    |
|---------------------|--------------------------------------------------------------------------------------------|
| Release phase       | Local `0.1.0` release cut; post-release maintenance                                        |
| Next target version | Unselected post-`0.1.0` scope                                                              |
| Frontend stack      | Vite + React + TypeScript                                                                  |
| Runtime             | Node.js 24.x, npm 11.x                                                                     |
| Package metadata    | `package.json` and `package-lock.json` version `0.1.0`; `packageManager` `npm@11.14.1`      |
| Routing target      | React Router                                                                               |
| CI target           | GitHub Actions                                                                             |
| Breaking policy     | Breaking user-facing or backend-contract integration changes require a selected roadmap row |
| Backend integration | Same-origin `/api/**` browser traffic                                                      |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`            |
| Implemented surface | Session, public catalog, account, admin catalog, admin localization, admin users, operator |
| Hardening baseline  | ESLint, TypeScript, Vitest, API type freshness, build, whitespace, npm audit, CodeQL, dependency-review, and Dependabot |
| Latest release      | Local `v0.1.0` release cut on 2026-06-07; not published remotely                           |
| Immediate action    | Select the next backend-supported M16+ scope or browser smoke automation target             |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`       |

The app currently bootstraps browser session state with `GET /api/session`, renders
login options from session metadata, generates checked OpenAPI TypeScript types,
routes public catalog state through React Router query strings, supports
authenticated session/logout and route guards, exposes account profile and language
preference flows, and implements the selected admin/operator surfaces. Local
same-origin auth smoke steps, the canonical validation baseline, and selected
hardening evidence are documented. Completed M0-M15 work and plan records are
archived in `docs/ROADMAP_ARCHIVE.md`; the next roadmap work is any newly selected
backend-supported scope, smoke automation, or release workflow improvement.

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

## Active Milestones

No post-`0.1.0` milestone is selected yet. Completed M0-M15 work is archived in
`docs/ROADMAP_ARCHIVE.md`.

## Near-Term Backlog

1. Select the next M16+ backend-supported surface, UX polish slice, or release
   workflow improvement clearly enough to test or document.
2. Add a canonical browser smoke or e2e command for same-origin session/auth flows
   once the repository has agreed local credentials, backend profile, and identity
   seeding rules.
3. Exercise the documented local auth smoke workflow against the sibling backend and
   move repeatable gaps into tests or owner docs.
4. If remote publication is later requested, push `main` and the annotated
   `v0.1.0` tag, then verify published release notes against `CHANGELOG.md`.

## Pragmatic Smoke Split

- Unit and component tests cover the current public, account, admin, and operator
  route behavior.
- Public catalog browser smoke can run anonymously against the sibling backend at
  `..\technical-interview-demo`, validating session bootstrap, categories, books,
  filters, pagination, sorting, and localized read errors.
- Authenticated browser smoke remains manual until there is a canonical command and
  agreed local credentials. Once automated, it should exercise login-provider
  rendering from session metadata, session refresh after login/logout, CSRF handling
  for unsafe authenticated writes, and authenticated access for account,
  admin/operator routes.

## Implementation Defaults

- New M16+ implementation plans should identify the owner document, backend contract
  source, tests, and validation before implementation starts.
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
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, image-signing, GHCR,
  Helm, Kubernetes, and post-deploy smoke procedures.
- Container image scanning, deployment posture checks, and runtime infrastructure
  hardening until the frontend has a corresponding artifact or environment.

## Hardening Candidates

The selected M13 hardening baseline is implemented and archived in
`docs/ROADMAP_ARCHIVE.md`. New hardening candidates should become release-blocking
only after they have a repeatable local command or a clearly owned CI signal with
triage and skip rules.

Deferred candidates and revisit triggers:

- SBOM and license reporting: revisit when the frontend publishes a package,
  deployable artifact, or release process requiring dependency/license inventory.
- Bundle-size or asset-budget checks: revisit when a reviewed threshold exists or
  production `dist/` growth becomes a repeated review issue.
- Authenticated browser smoke automation: revisit when agreed local credentials,
  identity seeding rules, backend profile, and a canonical command exist.
- Anonymous browser smoke and accessibility automation: revisit when the repository
  owns a canonical browser command and stable failure thresholds.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter
  supply-chain policy or add automation that keeps pinned SHAs current.
- Custom frontend security lint rules beyond CodeQL and ESLint: revisit when a
  repeated issue pattern is not covered by the selected checks.
- CI artifact upload for hardening reports: revisit when a selected check writes
  stable report files; until then, use code-scanning alerts, pull-request check
  annotations, and workflow logs.

Do not add backend-only hardening gates, container image scans, deployment scans, or
runtime infrastructure checks until the frontend repository owns a corresponding
artifact or deployment workflow.

## Release Procedure

This section mirrors the backend repository's release model, adapted for a
frontend-only Vite/npm package. Release work is maintainer-owned and starts only
after the intended implementation scope is complete, reviewed, and integrated on
`main`.

### Versioning And Release Rules

- Use semantic version tags in the form `vMAJOR.MINOR.PATCH` for stable releases or
  `vMAJOR.MINOR.PATCH-PRERELEASE` for prereleases.
- Keep version numbers increasing in `git log --first-parent` order.
- Cut releases only from `main` after all intended changes are integrated there.
- Use annotated tags for intentional releases.
- Keep `CHANGELOG.md` aligned with the release tag.
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
6. Re-run validation if release metadata edits made earlier evidence stale.
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
- Monitor any tag-triggered CI or release workflow until it finishes; if no release
  workflow exists yet, create the GitHub Release manually from the annotated tag and
  `CHANGELOG.md` section.
- Verify the published release notes match the released changelog section.
- If a packaged frontend artifact or deployment workflow is later added, extend this
  procedure with artifact checks before cutting that release.
- After publication, update `ROADMAP.md` again only if publication changes the
  active release phase, next target version, or deferred release automation scope.

## Deferred Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Hard-coded OAuth provider paths outside the session bootstrap response.
- New backend surfaces not yet selected in a roadmap row or spec.
- Broad visual design work that is not tied to an implemented user flow.
- Release automation, packaged artifacts, or deployment workflow beyond the manual
  annotated-tag/GitHub Release procedure until explicitly selected.
- Container image scanning, deployment posture checks, and runtime infrastructure
  hardening until the frontend owns a container, deployment target, or hosted runtime.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred frontend work.
- Move completed milestone summaries into `docs/ROADMAP_ARCHIVE.md` when they leave
  the active roadmap.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep endpoint fields, request schemas, auth header details, and durable API rules in
  `docs/backend/` or executable tests, not in this roadmap.
- Update this file when roadmap or product scope changes; update `SETUP.md`,
  `README.md`, or package configuration only when their owned behavior changes.
