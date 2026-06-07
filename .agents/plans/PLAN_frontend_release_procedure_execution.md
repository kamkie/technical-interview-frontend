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
| Phase | M12-M15 Roadmap Execution |
| Status | Ready For M12 Release-Readiness Work |
| Last Updated | 2026-06-07 |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | Yes for M12 release-readiness, M14 human docs, M15 AI references, and M13 selection-first hardening |
| Blocking Open Questions | None for the next ready slice |
| Accepted Fallbacks | Authenticated browser smoke remains manual until credentials and a canonical command exist; remote release publication requires an explicit current user request |
| Ready For Execution | M12-A release-readiness audit and documentation reconciliation |

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
| Changelog | `CHANGELOG.md` | Released history and `0.1.0` changelog promotion owner | Candidate `0.1.0` entries under `Unreleased` |
| Package metadata | `package.json`, `package-lock.json` | Package name, version, runtime, scripts, and dependency baseline | Version is `0.1.0` |
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
- `CHANGELOG.md` has candidate `0.1.0` content under `## [Unreleased]`.
- CI runs lint, typecheck, tests, build, and `git diff --check`.
- No frontend release tag is recorded in `ROADMAP.md`.

## Phase Map

| Phase | Milestone / Slice | Status | Gate |
| --- | --- | --- | --- |
| 0 | Plan activation | Ready | Plan file exists and docs-only validation passes |
| 1 | M12-A Release-readiness audit and reconciliation | Ready | No release tag is created in this slice |
| 2 | M14 Human procedure documentation | Waiting | M12-A commit landed and validation passed |
| 3 | M15 AI procedure reference layer | Waiting | M14 commit landed and validation passed |
| 4 | M13-A Hardening selection and triage rules | Waiting | M14/M15 owners exist |
| 5 | M13-B Selected hardening tooling implementation | Waiting | M13-A selection is committed and unblocked |
| 6 | M12-B Final release cut and post-release cleanup | Waiting | M13-B, M14, and M15 are complete; local `main` is at the release-candidate state |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Is local `main` synced to the exact release candidate? | M12-B must cut from the intended first-parent release state | Coordinator | Open until M12-B | Stop M12-B with concrete git state if not on synced `main` | No for M12-A |
| Q2 | Which M13 tools are release-blocking? | M13 candidates vary in local reproducibility and maintenance cost | M13-A worker | Planned | Select the minimum repeatable set; document deferred candidates and triggers | No for M12-A |
| Q3 | Are authenticated smoke credentials available? | Auth smoke cannot be automated without stable local identity and credentials | Coordinator / maintainer | Open | Keep manual smoke evidence documented; do not block docs/tooling slices | No |
| Q4 | Are backend contract artifacts stale? | API-facing changes must follow imported contract owners | Coordinator | No conflict known | Refresh only if conflict appears during execution | No |
| Q5 | Should the release be pushed or published remotely? | Local tag creation and remote publication are separate actions | User / maintainer | Not requested | Do not push tags, branches, or releases without explicit request | No |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M12 is split into M12-A readiness and M12-B final release execution | `ROADMAP.md` release preconditions and near-term backlog | 2026-06-07 | Roadmap changes M12 done criteria |
| D2 | M13 is treated as part of `0.1.0` hardening for the minimum repeatable tool set selected in M13-A | Current user request to plan implementation of roadmap milestones | 2026-06-07 | Maintainer explicitly defers M13 beyond `0.1.0` |
| D3 | Candidate M13 tooling starts with workflow permissions/concurrency, CodeQL, dependency review, an npm-compatible audit command, and documented deferred checks | `ROADMAP.md` hardening candidates | 2026-06-07 | A candidate lacks stable CI support or creates unacceptable noise |
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
| 0: Plan activation | Ready | Coordinator | Pending | `git diff --check` | Create this plan and report readiness |
| 1: M12-A Release-readiness audit | Ready | M12 worker | Pending | Baseline validation plus `git diff --check` | No tag creation in this slice |
| 2: M14 Human procedure docs | Waiting | M14 worker | Pending | `git diff --check`; full baseline only if non-doc files change | Waits for M12-A |
| 3: M15 AI procedure references | Waiting | M15 worker | Pending | `git diff --check`; full baseline only if non-doc files change | Waits for M14 |
| 4: M13-A Hardening selection | Waiting | M13 worker | Pending | `git diff --check`; full baseline if package/workflow files change | Waits for M14/M15 |
| 5: M13-B Hardening implementation | Waiting | M13 worker | Pending | Selected hardening commands plus full baseline | Waits for M13-A |
| 6: M12-B Release cut | Waiting | M12 worker for metadata edits; coordinator for validation, commit, tag, and plan recording | Pending | Full baseline, tag verification, clean git status | Waits for M13-B and synced `main` |

## Phase 1: M12-A Release-Readiness Audit

| Field | Value |
| --- | --- |
| Status | Ready |
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

## Phase 2: M14 Human Procedure Documentation

| Field | Value |
| --- | --- |
| Status | Waiting |
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
| Status | Waiting |
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
| Status | Waiting |
| Goal | Select the minimum M13 hardening checks that are useful, repeatable, and owned before adding tooling |
| Owned Files Or Packages | `ROADMAP.md`, `docs/LOCAL_DEVELOPMENT.md`, `.agents/references/testing.md`, `.agents/references/reviews.md`, `.agents/references/releases.md`, this plan |
| Context Required | M14/M15 procedure owners, `ROADMAP.md` hardening candidates, current CI workflow and package scripts |
| Behavior To Preserve | Do not add release-blocking checks without a repeatable local or CI-owned command and triage owner |
| Deliverables | Selected M13 tool set; deferred candidate list with triggers; failure triage and skip policy; roadmap status update if scope changes |
| Validation Checkpoint | `git diff --check`; run full baseline if package or workflow files change |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

Default M13 selection target:

- Add explicit GitHub Actions permissions and concurrency controls.
- Add CodeQL for TypeScript/JavaScript and workflow analysis where supported.
- Add dependency-review for pull requests.
- Add an npm-compatible audit script with a documented threshold and exception
  process.
- Add Dependabot or equivalent dependency-update automation if the repository can
  define useful grouping and reviewer expectations without extra credentials.
- Defer SBOM/license reporting, bundle budgets, and authenticated browser smoke until
  the repository owns a release artifact, size threshold, or credentials.

## Phase 5: M13-B Selected Hardening Tooling

| Field | Value |
| --- | --- |
| Status | Waiting |
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
| Status | Waiting |
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
