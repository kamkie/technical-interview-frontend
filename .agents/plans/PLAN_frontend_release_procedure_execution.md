# Plan: Frontend Release And Procedure Roadmap Execution

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to make a plan that will implement milestones from `ROADMAP.md` |
| Generation Context | `AGENTS.md`, `ROADMAP.md`, `README.md`, `CHANGELOG.md`, `package.json`, `.github/workflows/ci.yml`, and `.agents/plans/PLAN_frontend_roadmap_execution.md` |

## Lifecycle

| Status | Current |
| --- | --- |
| Phase | M12-B Final Release Cut |
| Status | Complete |
| Last Updated | 2026-06-07 |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | Yes for M12 release-readiness, M14 human docs, M15 AI references, and M13 selection-first hardening |
| Blocking Open Questions | None for the next ready slice |
| Accepted Fallbacks | Authenticated browser smoke remains manual until credentials and a canonical command exist; remote release publication requires an explicit current user request |
| Ready For Execution | Complete |

## Summary

- Execute the remaining active roadmap milestones M12-M15 without adding new backend
  API scope or UI features.
- Split M12 into an early release-readiness slice and a final release-cut slice, so
  the procedure can guide M14, M15, and M13 before the `v0.1.0` tag is created.
- Treat M13 as a `0.1.0` hardening slice for the minimum repeatable tooling selected
  by this plan; defer only candidate tools that do not yet have credentials,
  artifacts, or a stable local command.
- Keep one worker-owned milestone or milestone slice per implementation task.
- Require one scoped commit per milestone or slice when this plan is later executed.
- The orchestrator may update this plan, assign workers, review output, run
  validation, resolve integration, and create plan-required commits, but must not
  implement milestone work directly.
- Do not push branches, tags, or GitHub releases unless the current user request
  explicitly includes publication.

Success is measured by updated owner documents, selected hardening tooling with
repeatable validation, passing required checks, a verified annotated release tag when
M12-B executes, and roadmap state that agrees with the release outcome.

## Scope

In scope:

- M12 release procedure and `0.1.0` hardening:
  - release metadata consistency
  - changelog promotion
  - package version checks
  - validation evidence
  - annotated tag creation
  - post-release roadmap cleanup
- M13 static analysis and hardening tooling:
  - minimum selected tooling with local or CI-owned commands
  - documented triage, skip, and artifact rules
  - deferred tooling triggers for non-selected candidates
- M14 human procedure documentation:
  - lifecycle and artifact routing
  - local development
  - AI collaboration guide
  - documentation index and cross-links
- M15 AI procedure reference layer:
  - documentation ownership
  - validation selection
  - review and security-review triggers
  - release sequencing
- Coordinator-owned progress tracking in this plan.

Out of scope:

- Backend repository changes.
- New backend endpoints, request fields, auth headers, CORS behavior, JWT, bearer
  tokens, or alternate transports.
- New user-facing product surfaces beyond documentation and release/hardening
  workflow.
- Backend-only hardening such as container image scans, deployment scans, Helm,
  Kubernetes, GHCR, Flyway, or restore-drill procedures.
- Remote publication unless explicitly requested in the execution task.

## Source And Owner Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Milestone source, release state, deferred scope, and post-release cleanup owner | Current |
| Prior plan | `.agents/plans/PLAN_frontend_roadmap_execution.md` | Completed M0-M11 precedent and plan format | Complete |
| Changelog | `CHANGELOG.md` | Released history and `0.1.0` changelog promotion owner | `0.1.0` section prepared for local tag |
| Package metadata | `package.json`, `package-lock.json` | Package name, version, runtime, scripts, and dependency baseline | Version is `0.1.0`; package manager is `npm@11.14.1`; engines require Node.js `>=24 <25` and npm `>=11 <12` |
| CI workflow | `.github/workflows/ci.yml` | Current validation gate and target for M13 hardening | Baseline CI exists |
| Human setup docs | `README.md`, `SETUP.md`, `CONTRIBUTING.md` | Existing public entry points that should link to M14 owners | Current but pre-M14 |
| AI rules | `AGENTS.md` | Current AI rule owner; should point to M15 focused references | Current but pre-M15 |
| Backend contract | `docs/backend/` | Contract and integration invariants; read-only unless stale/conflicting | Current for this plan |

## Current State

- M0-M11 are complete and recorded in
  `.agents/plans/PLAN_frontend_roadmap_execution.md`.
- The app is a Vite, React, and TypeScript frontend using Node.js 24.x and npm 11.x.
- Browser traffic targets same-origin `/api/**`.
- `package.json` is already versioned as `0.1.0`.
- `package-lock.json` root metadata is also versioned as `0.1.0`.
- `CHANGELOG.md` has a dated `0.1.0` release section and a fresh `Unreleased`
  section.
- CI runs `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, and `git diff --check`.
- Local annotated tag `v0.1.0` points to release commit `6b7bd03`; remote
  publication was not requested or performed.

## Phase Map

| Phase | Milestone / Slice | Status | Gate |
| --- | --- | --- | --- |
| 0 | Plan activation | Done | Plan file exists and docs-only validation passed |
| 1 | M12-A Release-readiness audit and reconciliation | Done | No release tag was created in this slice |
| 2 | M14 Human procedure documentation | Done | M12-A commit landed and validation passed |
| 3 | M15 AI procedure reference layer | Done | M14 commit landed and validation passed |
| 4 | M13-A Hardening selection and triage rules | Done | M14/M15 owners exist |
| 5 | M13-B Selected hardening tooling implementation | Done | M13-A selection is committed and unblocked |
| 6 | M12-B Final release cut and post-release cleanup | Done | M13-B, M14, and M15 are complete; local `main` is at the release-candidate state |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Is local `main` synced to the exact release candidate? | M12-B must cut from the intended first-parent release state | Coordinator | Resolved for local release | Preflight found branch `main`, clean worktree, no existing tags, and `0 48` behind/ahead after fetch; local tag cut from release commit `6b7bd03` | No |
| Q2 | Which M13 tools are release-blocking? | M13 candidates vary in local reproducibility and maintenance cost | M13-A worker | Selected in M13-A output | Implement explicit workflow permissions/concurrency, CodeQL, dependency-review, npm audit, and Dependabot; defer artifact, threshold, credential, and custom-rule candidates until their triggers exist | No for M13-B |
| Q3 | Are authenticated smoke credentials available? | Auth smoke cannot be automated without stable local identity and credentials | Coordinator / maintainer | Open | Keep manual smoke evidence documented; do not block docs/tooling slices | No |
| Q4 | Are backend contract artifacts stale? | API-facing changes must follow imported contract owners | Coordinator | No conflict known | Refresh only if conflict appears during execution | No |
| Q5 | Should the release be pushed or published remotely? | Local tag creation and remote publication are separate actions | User / maintainer | Not requested | Do not push tags, branches, or releases without explicit request | No |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M12 is split into M12-A readiness and M12-B final release execution | `ROADMAP.md` release preconditions and near-term backlog | 2026-06-07 | Roadmap changes M12 done criteria |
| D2 | M13 is treated as part of `0.1.0` hardening for the minimum repeatable tool set selected in M13-A | Current user request to plan implementation of roadmap milestones | 2026-06-07 | Maintainer explicitly defers M13 beyond `0.1.0` |
| D3 | M13-B implementation scope is explicit workflow permissions/concurrency, CodeQL, dependency-review, an npm-compatible audit command, and Dependabot grouping; SBOM/license, bundle budgets, browser smoke automation, SHA pinning, custom rules, and report artifact upload stay deferred until their documented triggers exist | `ROADMAP.md` hardening selection | 2026-06-07 | A selected check lacks stable CI support or creates unacceptable noise |
| D4 | M14 human docs should exist before M15 AI references point to them | `ROADMAP.md` procedure adoption scope | 2026-06-07 | AI references become standalone owners by explicit decision |
| D5 | Remote release publication is not authorized by this plan alone | `AGENTS.md` git and handoff rules | 2026-06-07 | User explicitly asks to publish or push |

## Execution Shape And Shared Files

- The selected executable scope starts with the next `Ready` slice.
- Dependent slices become `Ready` only after the predecessor is implemented,
  committed, validated, and recorded in this plan.
- One worker owns one milestone or milestone slice.
- Workers must stop before editing files outside their assigned ownership.
- Coordinator-owned files during execution:
  - this plan
  - roadmap status updates needed for cross-slice alignment
  - final validation and release verification evidence
- Shared file guardrails:
  - `ROADMAP.md` changes must be limited to milestone status, release phase,
    immediate action, and deferred-scope cleanup.
  - `AGENTS.md` remains lean; M15 should move durable details to
    `.agents/references/` and point to them.
  - `README.md`, `SETUP.md`, and `CONTRIBUTING.md` should link to M14 owner docs
    instead of duplicating full procedures.
  - Backend contract artifacts under `docs/backend/` are read-only unless a stale or
    conflicting artifact is discovered.

Status model:

- `Done`: committed, validated, and recorded.
- `Ready`: the coordinator may assign the worker now.
- `Waiting`: normal predecessor dependency; promote after the predecessor lands.
- `Blocked`: unresolved product, contract, credential, or external-state issue that
  cannot be resolved from current project rules.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Plan activation | Done | Coordinator | `e521cc2` | Passed | Plan exists and was refined before execution |
| 1: M12-A Release-readiness audit | Done | M12 worker | `7479a43` | Passed by worker and coordinator | No tag creation in this slice; auth smoke remains manual without credentials or a canonical command |
| 2: M14 Human procedure docs | Done | M14 worker | `c34a9fd` | Passed by worker and coordinator | Human procedure owners and entry-point links landed |
| 3: M15 AI procedure references | Done | M15 worker | `40478d4` | Passed by worker and coordinator | AI procedure references landed |
| 4: M13-A Hardening selection | Done | M13 worker | `d469976` | Passed by worker and coordinator | Selected hardening gates, deferrals, and triage rules documented |
| 5: M13-B Hardening implementation | Done | M13 worker | `324f462` | Passed by worker and coordinator | Selected hardening gates landed; CodeQL, dependency-review, and Dependabot are CI-owned signals |
| 6: M12-B Release cut | Done | M12 worker for metadata edits; coordinator for validation, commit, tag, and plan recording | `6b7bd03`; tag `v0.1.0` | Passed by worker and coordinator | Release metadata committed; annotated local tag created; remote publication not requested |

## Phase 1: M12-A Release-Readiness Audit

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Make the release procedure executable before final release metadata and tag work begins |
| Owned Files Or Packages | `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `SETUP.md`, `CONTRIBUTING.md`, `package.json`, `package-lock.json`, this plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M12, current `CHANGELOG.md`, package metadata, existing validation scripts |
| Behavior To Preserve | Do not change runtime app behavior; do not create a release tag; do not publish remotely |
| Deliverables | Release-readiness audit notes in this plan; docs/package consistency fixes; clear M12-B preconditions; explicit skipped-smoke rationale if auth smoke remains manual |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

M12-A implementation notes:

- Verify package version, package manager, engines, README status, setup commands,
  changelog candidate section, roadmap current baseline, and CI validation commands
  all describe the same `0.1.0` candidate.
- Do not promote `CHANGELOG.md` out of `Unreleased` until M12-B.
- Do not tag until M12-B.
- If validation fails, fix only release-readiness inconsistencies or return to the
  coordinator with a concrete blocker.

M12-A release-readiness audit notes:

- `package.json` and `package-lock.json` agree on version `0.1.0`; `package.json`
  pins `packageManager` to `npm@11.14.1` and constrains engines to Node.js
  `>=24 <25` and npm `>=11 <12`.
- `README.md`, `SETUP.md`, `CONTRIBUTING.md`, `ROADMAP.md`, and `CHANGELOG.md` now
  describe the same pre-tag `0.1.0` release candidate and the same full validation
  baseline used by CI.
- `CHANGELOG.md` remains under `## [Unreleased]` for the `0.1.0` candidate; no
  changelog promotion, annotated tag, push, or remote publication happens in M12-A.
- M12-B must run from synced local `main` at the exact release-candidate state,
  after M14, M15, and selected M13 hardening have landed, with no unrelated dirty
  work included in the release metadata commit.
- M12-B should produce final validation evidence with Node.js 24.x and npm 11.x
  matching `packageManager`/`engines`. During this audit, the local shell reported
  Node.js `v24.16.0` and npm `8.5.2`; Corepack is available if the maintainer needs
  to activate the canonical npm version.
- Authenticated browser smoke remains skipped for automated release gating because
  the repository still lacks agreed local credentials, identity seeding rules, and a
  canonical smoke command. M12-B must record either manual smoke evidence for the
  exact candidate or this skipped-smoke rationale.

## Phase 2: M14 Human Procedure Documentation

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Add human-facing owner docs for lifecycle, local development, AI collaboration, and documentation navigation |
| Owned Files Or Packages | `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/LOCAL_DEVELOPMENT.md`, `docs/WORKING_WITH_AI.md`, `docs/README.md`, `README.md`, `SETUP.md`, `CONTRIBUTING.md`, `ROADMAP.md` |
| Context Required | `ROADMAP.md` M14 and Procedure Adoption Scope, M12-A audit results, existing setup/auth docs |
| Behavior To Preserve | Keep frontend docs lean; do not import backend-only Gradle, container, Helm, operations, or deployment procedures |
| Deliverables | Four human docs with clear ownership; entry-point docs link to owners without duplicating them; roadmap M14 status update after completion |
| Validation Checkpoint | `git diff --check`; run full baseline only if non-doc or executable files change |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

M14 implementation notes:

- `docs/DEVELOPMENT_LIFECYCLE.md` owns artifact routing and when to use roadmap rows,
  specs, plans, ADRs, and changelog entries.
- `docs/LOCAL_DEVELOPMENT.md` owns npm commands, CI reproduction, troubleshooting,
  backend contract refresh, browser smoke workflow, and M13 hardening commands after
  M13 lands.
- `docs/WORKING_WITH_AI.md` owns human guidance for asking AI to plan, implement,
  validate, review, and prepare releases.
- `docs/README.md` is the human-facing docs index.

## Phase 3: M15 AI Procedure Reference Layer

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Move durable AI-facing procedure details into focused reference docs and keep `AGENTS.md` lean |
| Owned Files Or Packages | `.agents/references/documentation.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, `.agents/references/releases.md`, `AGENTS.md`, `ROADMAP.md` |
| Context Required | M14 docs, `ROADMAP.md` M15 and Procedure Adoption Scope, current `AGENTS.md` |
| Behavior To Preserve | Keep backend contract invariants in `AGENTS.md`; do not add durable workflow-state mechanics |
| Deliverables | Four AI references; `AGENTS.md` links to them; roadmap M15 status update after completion |
| Validation Checkpoint | `git diff --check`; run full baseline only if non-doc or executable files change |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

M15 implementation notes:

- `.agents/references/documentation.md` owns artifact routing and cross-file
  alignment checks for AI agents.
- `.agents/references/testing.md` owns validation selection by change type.
- `.agents/references/reviews.md` owns code-review, spec-drift, documentation-drift,
  and security-review triggers.
- `.agents/references/releases.md` owns release sequencing, version choice,
  annotated tags, changelog promotion, package checks, and post-release roadmap
  cleanup.

## Phase 4: M13-A Hardening Selection

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Select the minimum M13 hardening checks that are useful, repeatable, and owned before adding tooling |
| Owned Files Or Packages | `ROADMAP.md`, `docs/LOCAL_DEVELOPMENT.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, `.agents/references/releases.md`, this plan |
| Context Required | M14/M15 procedure owners, `ROADMAP.md` hardening candidates, current CI workflow and package scripts |
| Behavior To Preserve | Do not add release-blocking checks without a repeatable local or CI-owned command and triage owner |
| Deliverables | Selected M13 tool set; deferred candidate list with triggers; failure triage and skip policy; roadmap status update if scope changes |
| Validation Checkpoint | `git diff --check`; run full baseline if package or workflow files change |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

M13-A selection output for M13-B:

- Add explicit GitHub Actions permissions and concurrency controls to every workflow.
  Use least privilege per workflow/job. Cancel superseded pull-request runs, but do
  not cancel protected branch or release/tag evidence.
- Add CodeQL for TypeScript/JavaScript source and GitHub workflow analysis where the
  CodeQL action supports it. Treat this as CI-owned code-scanning evidence.
- Add dependency-review for pull requests that change dependency manifests or
  lockfiles. Treat this as CI-owned pull-request evidence.
- Add `npm run audit:security` as the selected local npm-compatible software
  composition analysis command. It should wrap `npm audit --audit-level=high` unless
  M13-B documents a narrower npm-native equivalent. High and critical advisories are
  release-blocking unless fixed or excepted.
- Add Dependabot for npm and GitHub Actions updates. Group runtime dependencies,
  tooling/test dependencies, and Actions updates separately. Do not name individual
  reviewers until the repository owns a stable reviewer team or `CODEOWNERS`.
- Document report locations as GitHub code scanning for CodeQL, pull-request checks
  for dependency-review, workflow logs for npm audit, and Dependabot pull requests
  for dependency maintenance.

M13-A deferred candidates and revisit triggers:

- SBOM/license reporting waits for a published package, deployable artifact, or
  release requirement for dependency/license inventory.
- Bundle budgets wait for a reviewed threshold or repeated production `dist/` growth
  concerns.
- Authenticated browser smoke automation waits for agreed credentials, identity
  seeding rules, backend profile, and a canonical command.
- Anonymous browser smoke and accessibility automation wait for a canonical browser
  command and stable failure thresholds.
- GitHub Actions SHA pinning waits for a stricter supply-chain policy or automation
  to keep pinned SHAs current.
- Custom frontend security lint rules wait for a repeated issue pattern missed by
  CodeQL or ESLint and a selected stable rule set.
- Hardening report artifact uploads wait for selected checks that write stable report
  files; until then use code-scanning alerts, PR annotations, and workflow logs.

M13-A triage and exception rules for M13-B:

- Repository maintainers own hardening failures until a dedicated team or
  `CODEOWNERS` exists.
- Prefer a source fix, dependency update, or lockfile refresh over an exception.
- Each exception must name the finding/advisory, affected package or path, current
  risk, owner, mitigation or planned fix, expiration or revisit trigger, and release
  decision.
- Skips must be scoped to a check or finding. Do not raise the audit threshold or
  disable a whole workflow to hide one finding.

## Phase 5: M13-B Selected Hardening Tooling

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Implement the M13-A selected hardening tool set in CI, package scripts, and owner docs |
| Owned Files Or Packages | `.github/workflows/`, `.github/dependabot.yml`, `package.json`, `package-lock.json`, `docs/LOCAL_DEVELOPMENT.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, `ROADMAP.md` |
| Context Required | M13-A selection output and current CI validation workflow |
| Behavior To Preserve | Keep existing lint, typecheck, test, build, and whitespace checks; avoid backend-only tooling |
| Deliverables | Selected workflow/package changes; documented local commands; report/artifact locations if any; roadmap M13 status update after completion |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, selected M13 local commands, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

M13-B implementation notes:

- If a selected hardening check cannot run locally, document the CI-only owner,
  trigger, and expected artifact or failure location.
- If a selected check is too noisy on first run, record a scoped exception with an
  owner and expiration trigger instead of weakening the entire gate.
- Do not add a browser smoke or e2e command for authenticated flows until credentials
  and identity seeding rules exist.

## Phase 6: M12-B Final Release Cut

| Field | Value |
| --- | --- |
| Status | Done |
| Goal | Cut the first frontend release locally from synced `main` after selected roadmap hardening is complete |
| Owned Files Or Packages | `CHANGELOG.md`, `ROADMAP.md`, package metadata if needed, this plan, git annotated tag |
| Context Required | Completed M12-A, M13, M14, M15; release procedure in `ROADMAP.md`; `.gitmessage` |
| Behavior To Preserve | Cut only from `main`; use annotated tags; do not publish remotely unless explicitly requested |
| Deliverables | `CHANGELOG.md` `v0.1.0` dated section; roadmap release cleanup; release metadata commit; annotated `v0.1.0` tag; verification evidence in this plan |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, selected M13 commands, `git diff --check`, `git status --short`, tag verification |
| Commit Checkpoint | Commit release metadata using `.gitmessage`; create annotated `v0.1.0` tag; record commit and tag in Progress Tracker |

M12-B implementation notes:

1. Inspect `git status --short`, current branch, existing tags, and first-parent
   history.
2. Stop with a concrete blocker if not on synced `main` or if unrelated user changes
   would be included in the release commit.
3. Promote release-relevant `CHANGELOG.md` entries from `Unreleased` into a dated
   `## [0.1.0] - YYYY-MM-DD` section.
4. Update `ROADMAP.md` so current baseline, latest release, next target version,
   immediate action, and active/deferred roadmap rows agree with the release.
5. Re-run full validation and selected M13 checks after release metadata edits.
6. Commit release metadata as `Prepare v0.1.0 release`.
7. Create annotated tag `v0.1.0` with annotation `Release v0.1.0`.
8. Verify the tag points to the release commit and the working tree is clean except
   for any explicitly excluded user-owned files.

M12-B release metadata/preflight notes:

- Coordinator preflight on 2026-06-07 already ran after `git fetch --prune`:
  branch `main`, clean worktree, no existing tags, and
  `git rev-list --left-right --count origin/main...HEAD` reported `0 48`. Treat
  local `main` as the intended release-candidate state; remote publication remains
  unauthorized.
- `package.json`, top-level `package-lock.json`, and the lockfile root package all
  report version `0.1.0`; no package metadata correction is needed.
- M12-B metadata edits promote `CHANGELOG.md` candidate entries into
  `## [0.1.0] - 2026-06-07`, leave a fresh `## [Unreleased]`, and update
  `ROADMAP.md` for a local `v0.1.0` release cut without claiming remote
  publication.
- Authenticated browser smoke remains unavailable as an automated release gate
  because the repository still lacks agreed local credentials, identity seeding
  rules, backend profile, and a canonical smoke command. The documented manual
  workflow remains the owner until those inputs exist.
- CI-only hardening signals not run locally in this worker slice: CodeQL code
  scanning, dependency-review pull-request checks, and Dependabot update grouping.
  Workflow permissions/concurrency are configuration evidence. The coordinator will
  run the full validation baseline, `npm run audit:security`, and final git/tag
  verification after these metadata edits.
- Coordinator final validation on 2026-06-07 passed with Corepack npm `11.14.1`:
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm run audit:security`, package metadata version check, and
  `git diff --check`.
- Release metadata commit `6b7bd03` was tagged locally with annotated tag
  `v0.1.0` and annotation `Release v0.1.0`; `git rev-parse 'v0.1.0^{}'`
  verified the tag target as `6b7bd03`.
- This plan-recording update is intentionally after the release tag so the plan can
  record the release commit and tag without changing the tagged release metadata.

## Validation Plan

- Docs/guidance-only slices:
  - `git diff --check`
- App/tooling/release-readiness slices:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- M13 tooling slices:
  - all baseline app/tooling commands
  - every selected M13 local command
  - CI-only checks documented with trigger and artifact/failure location
- M12-B final release:
  - all baseline app/tooling commands
  - selected M13 commands
  - `git status --short`
  - annotated tag verification

## Verification Strategy

- Documentation review checks that each durable rule has one owner and entry-point
  docs link to that owner.
- Hardening review checks that each selected M13 gate has a failure owner, triage
  rule, skip policy, and local or CI-owned execution path.
- Release review checks that `CHANGELOG.md`, `ROADMAP.md`, package metadata, git
  history, validation evidence, and tag state describe the same candidate.
- Backend contract review is only needed if execution touches API-facing behavior or
  finds stale imported backend artifacts.

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| A worker needs backend behavior not in `docs/backend/` | Stop that slice and inspect or refresh backend contract artifacts before proceeding | Coordinator | Open |
| M13 selected tooling cannot produce a stable local or CI signal | Defer that candidate with an owner and trigger; do not make it release-blocking | M13 worker / coordinator | Open |
| Authenticated browser smoke remains credential-blocked | Record skipped evidence and keep manual workflow documented | Coordinator | Open |
| Release cut is attempted from a non-`main` branch or dirty unrelated worktree | Stop M12-B with concrete git state and required maintainer action | Coordinator | Open |
| Remote publication is requested after local tag creation | Treat as a separate explicit publication task with push and release verification | Coordinator | Open |

## Handoff Requirements

When this plan is implemented, the final handoff must report:

- changed files by milestone or slice
- commits and tag created
- validation commands and results
- skipped validation with reasons
- deferred M13 candidates and revisit triggers
- any release publication work that was not requested or not performed
