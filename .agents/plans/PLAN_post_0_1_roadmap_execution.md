# Plan: Post-0.1.0 Roadmap Execution

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to make an implementation plan for roadmap items |
| Generation Context | `AGENTS.md`, `ROADMAP.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/LOCAL_DEVELOPMENT.md`, `.agents/references/documentation.md`, `.agents/references/testing.md`, and archived `.agents/plans/` precedent |

## Lifecycle

| Field | Value |
| --- | --- |
| Phase | Active Execution |
| Status | Blocked At M24 Release Authorization |
| Last Updated | 2026-06-07 |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | Yes for M16 audit scope, M18 fake-OAuth readiness, selected M20 advisory hardening tools and policy, M17 anonymous smoke promotion, and M21 guardrail promotion |
| Blocking Open Questions | M24 release preparation needs an explicit current release/version/tag task before changelog promotion, package metadata updates, release commit, or annotated tag work |
| Accepted Fallbacks | M20 findings are advisory-only during the first pass; generated hardening reports are not checked in; external-provider authenticated smoke remains optional |
| Ready For Execution | No remaining unblocked slices in this plan |

## Summary

Execute the post-`0.1.0` roadmap from M16 through the next release preparation
without inventing backend API behavior or treating future dependent work as a
blocker for ready slices.

The first executable scope has landed:

- M16 contract coverage and scope audit.
- M18 fake-OAuth authenticated smoke readiness.
- M20 advisory container/deployment hardening refinement.

M16 found no uncovered approved backend operation, so M22 is not selected from this
audit. M17 anonymous browser smoke automation and M21 login-provider metadata
guardrails have landed. M19 and M23 are blocked on selected product scope. M24 is
blocked until a current task explicitly requests release/version/tag work.

This plan is an execution contract. Durable product scope stays in `ROADMAP.md`;
backend API rules stay in `docs/backend/`; local command and hardening procedure
rules stay in `docs/LOCAL_DEVELOPMENT.md` and `.agents/references/testing.md`.

## Execution Rules

- The orchestrator owns this plan, status updates, worker assignment, integration
  review, validation coordination, and final handoff.
- Milestone and spec implementation must be delegated to workers with explicit file
  ownership and scoped validation requirements.
- Execute ready work in dependency order. Independent ready slices may be assigned
  separately, but M16 findings control promotion of M17, M19, M21, M22, and M23.
- Commit checkpoints in this plan authorize scoped commits only when the user later
  asks to implement this active plan. This planning task itself does not create
  commits.
- Do not push branches, tags, packages, or releases unless the current user request
  explicitly authorizes publication.
- Keep unrelated user changes intact. If a worker encounters unrelated dirty files,
  it must avoid staging or reverting them.

## Scope

In scope:

- M16 API coverage audit and scope promotion.
- M18 fake-OAuth authenticated smoke readiness using the backend `smoke` provider.
- M20 advisory hardening implementation with Trivy, kube-linter, and a repo-owned
  runtime/Nginx check.
- M17 anonymous smoke automation if selected or promoted after M16.
- M21 login provider metadata guardrail after M16.
- M22 backend-supported surface selection from M16 gaps.
- M19 or M23 focused UX/design work only after M16 names an exact implemented-flow
  scope.
- M24 release preparation after selected implementation work lands.
- Coordinator status tracking in this plan.

Out of scope:

- Backend repository changes.
- New endpoints, request fields, auth headers, CORS support, JWT, bearer tokens, or
  alternate transports.
- External provider authenticated smoke automation beyond the backend fake-OAuth
  provider.
- Environment-specific deployment promotion, backend operations, database work, and
  platform policy beyond frontend-owned reference artifacts.
- Making M20 vulnerability or posture findings release-blocking during the first
  pass.

## Source And Owner Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Milestone source, product scope, release phase, and deferred scope owner | Current |
| Backend contract | `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/backend/README.md` | API shape and frontend integration invariant owners | Current unless M16 finds staleness |
| API coverage doc | `docs/API_COVERAGE.md` | M16 operation classification owner | Current |
| Local development doc | `docs/LOCAL_DEVELOPMENT.md` | Local commands, hardening commands, smoke workflow, and evidence guidance | Current for selected M20 policy |
| AI validation reference | `.agents/references/testing.md` | Validation selection by change type | Current for M20 |
| Existing specs | `docs/specs/` | Admin/operator selected behavior specs | Read as needed |
| App API clients | `src/api/` | Existing endpoint client coverage | Read/update only when selected scope requires implementation |
| Routes and UI | `src/`, especially catalog/auth/admin/account/operator areas | Existing visible surface and tests | Read/update only for selected user-visible slices |
| Infrastructure refs | `infra/`, `Dockerfile`, `docker/nginx/` | M20 frontend-owned container/runtime/deployment artifacts | Current; M20 may add checks or scripts |

## Current State

- M0-M15 are complete and archived.
- `v0.1.0` was cut locally on 2026-06-07 and was not published remotely.
- Implemented user-visible surface includes session, public catalog, account, admin
  catalog, admin localization, admin users, and operator views.
- The validation baseline is `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, and `git diff --check`.
- M16 found 22 approved OpenAPI operations, all implemented.
- M18 fake-OAuth readiness is documented in `docs/LOCAL_AUTH_SMOKE.md`.
- M20 has repo-owned commands for Trivy, rendered-manifest kube-linter, and
  runtime/Nginx checks. The first pass remains advisory; local/CI output is evidence
  and generated reports are not checked in.
- M17 anonymous smoke automation is available as `npm run smoke:anonymous`.
- M21 provider metadata guardrails are covered by auth/session tests.

## Decision Log

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M16 is the first dependency-setting audit slice for post-`0.1.0` work | `ROADMAP.md` active milestones | 2026-06-07 | Roadmap status changes |
| D2 | M20 first pass uses Trivy, kube-linter, and a repo-owned runtime/Nginx check | Maintainer decisions recorded in `ROADMAP.md` and `docs/LOCAL_DEVELOPMENT.md` | 2026-06-07 | A selected tool cannot provide repeatable local or CI evidence |
| D3 | M20 findings are advisory until a later selected threshold exists | Maintainer decision and roadmap hardening policy | 2026-06-07 | One stable baseline exists and maintainers select severity/posture gates |
| D4 | Generated scan reports are not checked in during M20 first pass | Maintainer evidence-location decision | 2026-06-07 | CI artifact/report upload becomes selected scope |
| D5 | M18 readiness uses the sibling backend `local,oauth,fake-oauth` profile, `smoke` provider, and `smoke:smoke-user` first-admin bootstrap identity | Maintainer update and refreshed `docs/backend/FRONTEND_AI_CONTRACT.md` | 2026-06-07 | Backend fake-OAuth contract changes |
| D6 | Remote publication is not authorized by this plan alone | `AGENTS.md` git and release rules | 2026-06-07 | Current user request explicitly asks to push or publish |
| D7 | M16 found no approved operation gaps; promote M17 and M21, do not select M22 from this audit | `docs/API_COVERAGE.md` | 2026-06-07 | Backend contract refresh or new approved operation gap |
| D8 | M24 release preparation cannot proceed without an explicit release/version/tag task | `.agents/references/releases.md` and M24 commit checkpoint | 2026-06-07 | User explicitly requests release preparation |

## Phase Map

| Phase | Milestone / Slice | Status | Gate |
| --- | --- | --- | --- |
| 0 | Plan activation | Done | Plan file exists and docs-only validation passed |
| 1 | M16 Contract Coverage And Scope Audit | Done | 22 approved operations classified as implemented |
| 2 | M18 Authenticated Smoke Automation Readiness | Done | Fake-OAuth smoke profile and seed identity documented |
| 3 | M20 Advisory Hardening Implementation | Done | Repeatable selected hardening checks and evidence docs added |
| 4 | M21 Login Provider Metadata Guardrail | Done | Provider metadata guardrail tests landed |
| 5 | M22 Backend Surface Expansion Selection | Not selected | M16 found no approved operation gaps |
| 6 | M17 Anonymous Browser Smoke Automation | Done | Anonymous smoke command landed |
| 7 | M19 Public Catalog Workflow Polish | Blocked on selected polish scope | Exact visible states and tests named |
| 8 | M23 Implemented Flow Visual Design Pass | Blocked on selected visual scope | Exact flows, accessibility goals, and browser evidence named |
| 9 | M24 Post-`0.1.0` Release Preparation | Blocked on explicit release task | Release/version/tag work requires current authorization |

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Plan activation | Done | Coordinator | N/A | `git diff --check` | Active plan created; no commit requested |
| 1: M16 coverage audit | Done | M16 worker | `d933e74` | `git diff --check` passed | 22 operations implemented; promotes M17 and M21 |
| 2: M18 auth smoke readiness | Done | M18 worker | `7cff7f7` | `git diff --check` passed | Fake-OAuth readiness documented |
| 3: M20 advisory hardening | Done | M20 worker | `0149608` | Full baseline, Docker build, runtime check, and Trivy passed; kube-linter unavailable after render | Selected advisory commands added |
| 4: M21 metadata guardrail | Done | M21 worker | `50560f4` | Relevant auth tests and full baseline passed | Provider paths guarded by metadata-driven tests |
| 5: M22 surface selection | Not selected | M22 worker | N/A | Covered by M16 | No approved operation gaps |
| 6: M17 anonymous smoke | Done | M17 worker | `256b947` | `npm run smoke:anonymous` skipped clearly because frontend unavailable; full baseline passed | Smoke command added |
| 7: M19 catalog polish | Blocked | M19 worker | Pending | Pending | Needs focused polish scope |
| 8: M23 visual pass | Blocked | M23 worker | Pending | Pending | Needs focused visual scope |
| 9: M24 release prep | Blocked | Release worker / coordinator | Pending | Pending | Needs explicit release/version/tag task |

## Phase 1: M16 Contract Coverage And Scope Audit

| Field | Value |
| --- | --- |
| Status | Ready |
| Goal | Reconcile backend-approved operations with generated types, API clients, routes, tests, specs, and visible UI coverage |
| Owned Files Or Packages | `docs/API_COVERAGE.md`, `ROADMAP.md`, this plan |
| Read-Only Context | `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/backend/README.md`, `src/api/generated/openapi.ts`, `src/api/`, `src/**/*.test.*`, `docs/specs/` |
| Behavior To Preserve | No new endpoint, auth, CORS, CSRF, provider path, or request-field assumptions |
| Deliverables | `docs/API_COVERAGE.md` classifies every approved OpenAPI operation as implemented, deferred, or needing follow-up; `ROADMAP.md` promotes the next slice based on the audit |
| Validation Checkpoint | `git diff --check`; add broader validation only if executable files change |
| Commit Checkpoint | One scoped M16 commit when plan execution is requested |

Implementation notes:

- Parse `docs/backend/approved-openapi.json` with a structured tool rather than
  hand-copying operation lists.
- Map each operation to the existing client, route/page, spec, or test when present.
- Classify gaps without implementing them in this slice.
- If the imported contract appears stale or conflicts with the sibling backend,
  stop M16 implementation and refresh via `scripts/sync-backend-contract.ps1`
  before continuing.
- Promote exactly one next slice or a small ordered set of slices in `ROADMAP.md`;
  do not make future review gates blockers for a ready slice.

## Phase 2: M18 Authenticated Smoke Automation Readiness

| Field | Value |
| --- | --- |
| Status | Ready |
| Goal | Define repeatable authenticated smoke prerequisites using the backend fake-OAuth provider without hard-coding provider paths or secrets |
| Owned Files Or Packages | `docs/LOCAL_AUTH_SMOKE.md`, `docs/LOCAL_DEVELOPMENT.md`, optional smoke script docs, this plan |
| Selected Inputs | Backend profile `local,oauth,fake-oauth`, `smoke` login provider discovered from `GET /api/session`, first-admin bootstrap identity `smoke:smoke-user`, default fake login `smoke-user` |
| Behavior To Preserve | Login-provider discovery from `GET /api/session`; logout CSRF handling; no secrets committed |
| Deliverables | Owner docs name fake-OAuth profile setup, default identity, optional `FAKE_OAUTH_*` overrides, admin seeding, login-provider discovery, and skip/fail behavior |
| Validation Checkpoint | `git diff --check`; later executable smoke uses full baseline and selected smoke command |
| Commit Checkpoint | One scoped M18 readiness commit when plan execution is requested |

Implementation notes:

- Start from `SPRING_PROFILES_ACTIVE=local,oauth,fake-oauth` and
  `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES=smoke:smoke-user`.
- Discover the `smoke` provider from `loginProviders[]` and start login through its
  relative `authorizationPath`; do not hard-code `/test-support/oauth2/**`.
- Treat backend unavailable or missing fake provider as a skip with a clear reason.
- Treat successful login followed by missing CSRF metadata, failed account access,
  failed logout, or failed ADMIN access with the configured admin seed as a failure.
- Keep GitHub and OIDC provider smoke as optional manual checks, not the canonical
  frontend smoke path.

## Phase 3: M20 Advisory Hardening Implementation

| Field | Value |
| --- | --- |
| Status | Ready |
| Goal | Add repeatable advisory hardening checks for the frontend-owned container image, runtime/Nginx config, and reference deployment manifests |
| Owned Files Or Packages | `package.json`, package lock if scripts change, `scripts/`, `docs/LOCAL_DEVELOPMENT.md`, `.agents/references/testing.md`, `ROADMAP.md`, `Dockerfile`, `docker/nginx/`, `infra/`, optional `.github/workflows/` if CI evidence is selected |
| Context Required | M20 row in `ROADMAP.md`, M20 guidance in `docs/LOCAL_DEVELOPMENT.md`, current `Dockerfile`, Nginx template, Kustomize and Helm manifests |
| Behavior To Preserve | Same-origin `/api/**`, `FRONTEND_API_UPSTREAM`, unprivileged Nginx on port `8080`, no browser CORS/JWT/bearer-token assumptions |
| Deliverables | Local commands or package scripts for Trivy, kube-linter rendered-manifest checks, and runtime/Nginx checks; documented evidence and skip behavior; findings advisory-only |
| Validation Checkpoint | Full baseline, `npm run docker:build`, selected Trivy scan, selected kube-linter rendered-manifest check, runtime/Nginx check, `git diff --check`; record unavailable tools explicitly |
| Commit Checkpoint | One scoped M20 commit when plan execution is requested |

Implementation notes:

- Prefer small repo-owned scripts over long duplicated shell snippets in multiple
  docs. Keep generated output under ignored `temp/` or workflow logs.
- Use Trivy with exit code `0` for vulnerability findings during the first pass.
- Render Kustomize and Helm outputs before kube-linter runs; do not lint unrendered
  templates as the only evidence.
- Runtime/Nginx check should assert frontend-owned invariants such as unprivileged
  image, exposed port `8080`, `/healthz`, `/api` proxying through
  `FRONTEND_API_UPSTREAM`, and absence of CORS/JWT/bearer-token/provider-path
  assumptions.
- If a finding indicates a real repo-owned misconfiguration and the fix is small,
  fix it inside M20. If the fix is broad, record a follow-up roadmap row instead of
  expanding the slice silently.

## Phase 4: M21 Login Provider Metadata Guardrail

| Field | Value |
| --- | --- |
| Status | Waiting on M16 |
| Goal | Prove auth entry points render login providers only from `GET /api/session` metadata and prevent hard-coded provider path regressions |
| Owned Files Or Packages | `src/auth/`, `src/api/session.*`, affected route tests, `docs/LOCAL_AUTH_SMOKE.md` or owner docs if guidance changes, this plan |
| Context Required | M16 coverage findings, backend session contract, existing auth/session tests |
| Behavior To Preserve | No hard-coded provider paths, no JWT or bearer-token assumptions, logout/session metadata stays backend-owned |
| Deliverables | Audit evidence plus either focused tests or owner-doc guardrails; unsupported constants removed if found |
| Validation Checkpoint | `git diff --check` for docs-only audit; relevant auth/session tests plus full baseline if source or test files change |
| Commit Checkpoint | One scoped M21 commit when plan execution is requested and M21 is promoted |

Implementation notes:

- Use `rg` to scan source, docs, specs, and tests for provider path constants.
- Prefer executable regression coverage if source code contains the behavior.
- Treat examples copied from backend contract docs as examples only; do not branch on
  provider URL strings in frontend code.

## Phase 5: M22 Backend Surface Expansion Selection

| Field | Value |
| --- | --- |
| Status | Waiting on M16 |
| Goal | Convert M16 coverage gaps into one selected backend-supported surface slice before implementation |
| Owned Files Or Packages | `docs/API_COVERAGE.md`, `ROADMAP.md`, optional `docs/specs/SPEC_*.md`, this plan |
| Context Required | M16 operation classifications and existing specs |
| Behavior To Preserve | Do not implement or invent endpoint behavior in this selection slice |
| Deliverables | One selected operation group with user-visible behavior, route states, tests, and validation named; unselected surfaces remain classified for follow-up |
| Validation Checkpoint | `git diff --check`; API-facing validation and full baseline only when implementation follows |
| Commit Checkpoint | One scoped M22 selection commit when plan execution is requested and M22 is promoted |

Implementation notes:

- Choose a surface that is fully supported by `docs/backend/approved-openapi.json`.
- Add or update a focused spec only when the roadmap row cannot clearly hold the
  behavior, visible states, and tests.
- Keep pagination, repeated filters, CSRF, localization, and session metadata rules
  anchored in backend contract artifacts and tests.

## Phase 6: M17 Anonymous Browser Smoke Automation

| Field | Value |
| --- | --- |
| Status | Waiting on M16 |
| Goal | Add a canonical anonymous same-origin browser smoke command for session bootstrap and public catalog flows |
| Owned Files Or Packages | `package.json`, smoke script files, `docs/LOCAL_DEVELOPMENT.md`, `docs/LOCAL_AUTH_SMOKE.md` if shared smoke guidance changes, this plan |
| Context Required | M16 coverage findings, current Vite proxy behavior, sibling backend prerequisites |
| Behavior To Preserve | Anonymous smoke must run without credentials and through same-origin `/api/**`; authenticated steps remain skipped |
| Deliverables | Documented npm command or script; prerequisites and skip behavior; public smoke evidence in test output or docs |
| Validation Checkpoint | Smoke command plus `git diff --check`; full baseline if package scripts, tooling, or app code change |
| Commit Checkpoint | One scoped M17 commit when plan execution is requested and M17 is promoted |

Implementation notes:

- Name backend profile and frontend URL prerequisites explicitly.
- Cover `GET /api/session`, public categories/books, URL-backed filters,
  pagination, sorting, and reproducible localized public-read failures where stable.
- Report backend-unavailable states as skips, not false passes.

## Phase 7: M19 Public Catalog Workflow Polish

| Field | Value |
| --- | --- |
| Status | Waiting on M16 and selected polish scope |
| Goal | Improve the implemented public catalog workflow without backend changes |
| Owned Files Or Packages | `src/catalog/`, `src/ui/`, catalog route tests, optional focused spec or `ROADMAP.md`, this plan |
| Context Required | M16 audit output and current catalog tests |
| Behavior To Preserve | Existing backend-supported filters, pagination, sorting, and URL query semantics |
| Deliverables | Exact polish scope named before UI edits; tests for changed visible states; smoke update if browser behavior changes |
| Validation Checkpoint | Relevant tests plus full baseline for app changes; smoke command if changed workflow behavior is covered by M17 |
| Commit Checkpoint | One scoped M19 commit when plan execution is requested and M19 is promoted |

Implementation notes:

- Scope should be concrete, for example focus behavior, accessible table controls, or
  pagination affordances. Avoid a broad visual refresh in this slice.
- Do not change backend request semantics unless M22 selected and implemented a
  backend-supported API surface first.

## Phase 8: M23 Implemented Flow Visual Design Pass

| Field | Value |
| --- | --- |
| Status | Waiting on M16 and selected visual scope |
| Goal | Apply visual design refinements only to already implemented flows with named evidence |
| Owned Files Or Packages | Affected route/component files, styles, tests, optional focused spec or `ROADMAP.md`, this plan |
| Context Required | M16 audit output, selected implemented flows, current tests |
| Behavior To Preserve | No backend/API behavior changes; existing access rules and route semantics stay intact |
| Deliverables | Selected flows, responsive/accessibility/focus goals, focused tests or browser evidence, and full baseline for app changes |
| Validation Checkpoint | Relevant tests, browser screenshots or smoke for changed flows, full baseline, `git diff --check` |
| Commit Checkpoint | One scoped M23 commit when plan execution is requested and M23 is promoted |

Implementation notes:

- Use this only for implemented public, account, admin, or operator flows.
- Define browser evidence before changing UI.
- Keep the pass focused enough for one coherent review.

## Phase 9: M24 Post-0.1.0 Release Preparation

| Field | Value |
| --- | --- |
| Status | Waiting on selected M16-M23 implementation scope |
| Goal | Prepare the next patch or minor release after selected implementation and validation evidence land |
| Owned Files Or Packages | `CHANGELOG.md`, `ROADMAP.md`, package metadata when needed, release notes scripts if affected, this plan |
| Context Required | Completed selected implementation scope, validation evidence, release rules in `ROADMAP.md`, `.agents/references/releases.md` |
| Behavior To Preserve | Releases cut only from intended `main`; remote publication requires explicit current request |
| Deliverables | Changelog promotion, roadmap cleanup, package metadata alignment if needed, validation evidence, completed milestone archive updates when selected |
| Validation Checkpoint | Full baseline, `npm run audit:security`, `npm run docker:build`, selected smoke/hardening evidence or explicit skip rationale, `git diff --check` |
| Commit Checkpoint | Scoped release-preparation commit and annotated tag only when release task explicitly requests that work |

Implementation notes:

- Select patch vs minor based on the landed scope.
- Archive completed roadmap summaries only when release cleanup explicitly adopts
  that step.
- Do not publish the tag or GHCR package unless the current user request authorizes
  remote publication.

## Validation Plan

- Docs/guidance-only slices:
  - `git diff --check`
- Backend contract refresh if M16 finds stale artifacts:
  - `./scripts/sync-backend-contract.ps1`
  - `npm run api:types`
  - `git diff --check`
- App/source/tooling slices:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- M20 tooling or runtime slices:
  - full baseline
  - `npm run docker:build`
  - selected Trivy image scan
  - selected kube-linter rendered-manifest check
  - selected runtime/Nginx check
  - `git diff --check`
- Browser smoke slices:
  - selected smoke command
  - backend profile, frontend URL, flow coverage, validation date, and skipped
    authenticated steps with reasons
- Release preparation:
  - full baseline
  - `npm run audit:security`
  - `npm run docker:build`
  - selected smoke and hardening evidence or explicit skip rationale

## Review Strategy

- Contract review checks that every API-facing change follows
  `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`.
- Documentation review checks that durable rules live in owners rather than only in
  this plan.
- Hardening review checks that M20 commands are repeatable, advisory, and scoped to
  frontend-owned artifacts.
- UI review checks accessibility, focus, responsive behavior, and test coverage for
  any M19 or M23 changes.
- Release review checks `CHANGELOG.md`, `ROADMAP.md`, package metadata, validation
  evidence, and git state describe the same candidate.

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| M16 finds stale imported backend artifacts | Refresh with `scripts/sync-backend-contract.ps1`, regenerate API types, then re-evaluate coverage | Coordinator / M16 worker | Open |
| M16 finds a large uncovered surface | Select one coherent M22 slice and leave remaining gaps classified for follow-up | Coordinator / M22 worker | Open |
| M20 selected tool cannot run locally or in CI | Record unavailability, keep findings advisory, and update owner docs with fallback evidence | M20 worker / coordinator | Open |
| M20 finding needs broad runtime or infra changes | Open or update a follow-up roadmap row instead of silently expanding M20 | Coordinator | Open |
| Backend fake-OAuth contract changes | Update M18 owner docs, `ROADMAP.md`, and this plan before changing smoke automation | Coordinator / maintainer | Open |
| Release preparation is requested before selected scope lands | Stop M24 and report missing implementation/validation evidence | Coordinator | Open |
| Remote publication is requested | Treat as a separate explicit publication task with push and workflow verification | Coordinator | Open |

## Handoff Requirements

When this plan is implemented, the final handoff must report:

- changed files by milestone or slice
- commits and tags actually created
- validation commands and results
- skipped validation with reasons
- remaining smoke, contract, or hardening risk
- M18 fake-OAuth readiness status
- any release publication work that was not requested or not performed
