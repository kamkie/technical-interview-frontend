# Plan: Ready Milestones Implementation

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-06 |
| Source Request | User request to implement all ready milestones with a separate subagent and commit per milestone |
| Generation Context | Frontend `ROADMAP.md`, `SETUP.md`, imported backend contract guidance, and backend `.agents/plans/PLAN_TEMPLATE.md` |

## Lifecycle

| Status | Current |
| --- | --- |
| Phase | Planning |
| Status | Ready |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | Yes |
| Blocking Open Questions | None |
| Accepted Fallbacks | Use roadmap Implementation Defaults for minor choices |
| Ready For Execution | Yes |
| Last Updated | 2026-06-07 |

## Linked Pre-Planning Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Selected milestones, implementation defaults, and deferred scope | Current |
| Setup | `SETUP.md` | Local repository layout and validation expectations | Current |
| Backend contract | `docs/backend/` | API contract and frontend integration invariants | Current |

## Summary

- Implement the currently ready milestones: M1 CI, M2 Simple Public Catalog UX, and
  M4 Local Auth Workflow Docs.
- Use one delegated worker/subagent per milestone.
- Require each milestone worker to validate, commit only its own milestone changes,
  and update this plan's progress tracker before handoff.
- Coordinator performs validation between worker handoffs and final integration.
- After this plan completes, M3 and M5 should be re-evaluated as the next ready
  milestones because their direct dependencies are expected to be satisfied.

Success is measured by passing validation, one clean commit per milestone, and a
progress tracker that records status, commit hash, validation, and remaining risks.

## Scope

- In scope:
  - M1 GitHub Actions CI workflow.
  - M2 basic catalog table UX with fixture-backed visible-state tests.
  - M4 local auth smoke documentation and Vite `/api` proxy wiring.
  - Orchestrator progress tracking in this plan.
- Out of scope:
  - M0 Foundation; it is already complete.
  - M3 React Router advanced catalog controls.
  - M5 and later authenticated account/admin/operator implementation.
  - Backend repository changes.

## Current State

- M0 is complete and the validation baseline has passed.
- `ROADMAP.md` records implementation defaults for M1, M2, and M4.
- The frontend uses Vite, React, TypeScript, Node.js 24.x, and npm 11.x.
- Browser traffic must target same-origin `/api/**`.
- The sibling backend checkout is expected at `..\technical-interview-demo`.

## Follow-On Readiness

| Milestone | Dependency In This Plan | Expected Readiness After This Plan | Notes |
| --- | --- | --- | --- |
| M3 - Advanced Catalog Controls | M2 - Simple Public Catalog UX | Ready to plan/implement next | M3 builds on the M2 table/catalog shape and already has React Router plus browser-history decisions recorded in `ROADMAP.md`. |
| M5 - Authenticated Session UX | M4 - Local Auth Workflow Docs | Ready to plan/implement next if M4 documents a runnable workflow | M5 should consume the documented local auth workflow, session refresh rules, and smoke/e2e policy from M4. |
| M6 - Account Profile Surface | M5 - Authenticated Session UX | Not ready from this plan alone | M6 should follow the authenticated session/header/route-guard implementation. |
| M7 - Account Language Preference | M5/M6 plus CSRF mutation helper | Not ready from this plan alone | M7 needs proven authenticated session state and unsafe-write CSRF handling. |
| M8-M11 Admin/Operator milestones | M5+ and per-milestone specs | Not ready from this plan alone | Each admin/operator slice should get the small spec called for in `ROADMAP.md` before implementation. |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | None | No blocking gaps remain for M1, M2, or M4 | Coordinator | Answered | Execute the plan as written | No |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | CI target is GitHub Actions | User / `ROADMAP.md` | 2026-06-06 | CI provider changes |
| D2 | CI runs on pull requests and pushes to `main` with Node.js 24.x, `npm ci`, lint, typecheck, tests, build, and `git diff --check` | `ROADMAP.md` Implementation Defaults | 2026-06-06 | Repository branch or validation policy changes |
| D3 | M2 uses a basic table with title, author, publication year, ISBN, and categories | User / `ROADMAP.md` | 2026-06-06 | Catalog UX scope changes |
| D4 | M2 fixture-backed visible states live under `src/test/fixtures/` | `ROADMAP.md` Implementation Defaults | 2026-06-06 | Test organization changes |
| D5 | M4 auth smoke docs live at `docs/LOCAL_AUTH_SMOKE.md` and link from `SETUP.md` | `ROADMAP.md` Implementation Defaults | 2026-06-06 | Documentation ownership changes |
| D6 | M4 local same-origin development uses a Vite `/api` proxy to `http://localhost:8080` | `ROADMAP.md` Implementation Defaults | 2026-06-06 | Backend local port or proxy strategy changes |

## Execution Shape And Shared Files

- Recommended shape: `M3: parallel` as a coordinated delegated plan with serial
  integration.
- Each milestone has a separate subagent/worker and a separate commit.
- Workers run one at a time on the same branch so each starts from the previous
  milestone commit.
- Coordinator owns:
  - `.agents/plans/PLAN_ready_milestones.md`
  - final cross-milestone validation and handoff
  - resolving conflicts in shared files
- Worker-owned shared-file rules:
  - M1 may edit `.github/workflows/ci.yml`.
  - M2 may edit catalog source/tests/styles and `src/test/fixtures/`.
  - M4 may edit `docs/LOCAL_AUTH_SMOKE.md`, `SETUP.md`, and `vite.config.ts`.
  - If a worker needs `ROADMAP.md`, this plan, or another worker's owned files, stop
    and return to the coordinator.

## Affected Artifacts

- `.github/workflows/ci.yml`
- `src/catalog/`
- `src/api/catalog.ts` if table UX exposes small client gaps
- `src/test/fixtures/`
- `src/index.css`
- `docs/LOCAL_AUTH_SMOKE.md`
- `SETUP.md`
- `vite.config.ts`
- `package.json` / `package-lock.json` only if a worker proves a dependency is needed

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Coordinator baseline | Not Started | Coordinator | Pending | Pending | Confirm clean tree and create branch if requested |
| 1: M1 CI and Quality Gate | Not Started | M1 subagent | Pending | Pending | Add GitHub Actions workflow and commit |
| 2: Coordinator M1 gate | Not Started | Coordinator | Pending | Pending | Verify M1 commit before M2 handoff |
| 3: M2 Simple Public Catalog UX | Not Started | M2 subagent | Pending | Pending | Implement table UX and fixtures/tests, then commit |
| 4: Coordinator M2 gate | Not Started | Coordinator | Pending | Pending | Verify M2 commit before M4 handoff |
| 5: M4 Local Auth Workflow Docs | Not Started | M4 subagent | Pending | Pending | Add auth smoke docs/proxy wiring, then commit |
| 6: Final integration validation | Not Started | Coordinator | Pending | Pending | Run full validation and summarize commits |

## Execution Tasks

### Task 0: Coordinator Baseline

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Prepare execution context before worker handoff |
| Owned Files Or Packages | This plan only |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md`, `SETUP.md`, this plan |
| Behavior To Preserve | Keep unrelated user changes intact |
| Deliverables | Clean baseline notes and branch context |
| Validation Checkpoint | `git status --short`; optionally `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` if baseline freshness is uncertain |
| Commit Checkpoint | No commit unless the plan file itself changed |

### Task 1: M1 CI And Quality Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add GitHub Actions validation for canonical npm commands |
| Owned Files Or Packages | `.github/workflows/ci.yml` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` Current Baseline and Implementation Defaults, `package.json` scripts |
| Behavior To Preserve | CI must use npm and Node.js 24.x; do not add non-contract deployment behavior |
| Deliverables | Workflow triggered on pull requests and pushes to `main`; uses `npm ci`; runs lint, typecheck, tests, build, and `git diff --check` |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 2: Coordinator M1 Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M1 commit before M2 worker starts |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Git log/diff for the M1 commit |
| Behavior To Preserve | Keep M1 commit isolated to CI scope |
| Deliverables | Progress Tracker updated with M1 status, commit, validation, and notes |
| Validation Checkpoint | Inspect M1 diff; rerun targeted validation if needed |
| Commit Checkpoint | Commit plan update only if the orchestrator chooses to persist progress after each gate |

### Task 3: M2 Simple Public Catalog UX

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Replace the current public catalog list with a basic table UX and fixture-backed visible-state coverage |
| Owned Files Or Packages | `src/catalog/`, catalog tests, `src/test/fixtures/`, `src/index.css`; small `src/api/catalog.ts` edits only if needed |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M2 and Implementation Defaults, `docs/backend/FRONTEND_AI_CONTRACT.md` for pagination/filter invariants |
| Behavior To Preserve | Same-origin `/api/**`; Spring pagination parameters; repeated `category` and `sort`; localized error display |
| Deliverables | Table columns for title, author, publication year, ISBN, and categories; button-based pagination; fixtures for loading, populated, empty, filtered, paginated, localized book error, and category error states; tests for visible states |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 4: Coordinator M2 Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M2 commit before M4 worker starts |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Git log/diff for the M2 commit |
| Behavior To Preserve | M2 should not add React Router or authenticated writes |
| Deliverables | Progress Tracker updated with M2 status, commit, validation, and notes |
| Validation Checkpoint | Inspect M2 diff; rerun targeted or full validation if needed |
| Commit Checkpoint | Commit plan update only if the orchestrator chooses to persist progress after each gate |

### Task 5: M4 Local Auth Workflow Docs

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Document local authenticated workflow and wire frontend dev `/api` proxy to the sibling backend |
| Owned Files Or Packages | `docs/LOCAL_AUTH_SMOKE.md`, `SETUP.md`, `vite.config.ts` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M4 and Implementation Defaults, backend `docs/OPERATIONS.md` OAuth Setup, backend `src/manualTests/http/examples/authentication.http` |
| Behavior To Preserve | Do not hard-code provider paths in app behavior; docs may show examples but must say UI uses `GET /api/session` metadata |
| Deliverables | Local auth smoke doc; `SETUP.md` link; Vite `/api` proxy to `http://localhost:8080`; anonymous-vs-authenticated automation policy |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 6: Final Integration Validation

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify all milestone commits together and produce handoff |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Full branch diff and commit list |
| Behavior To Preserve | One commit per milestone; no unrelated changes |
| Deliverables | Final validation results, commit hashes, changed files, skipped milestones, and remaining risks |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit final plan progress update if progress tracking is persisted in git |

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| A worker needs to change backend contract assumptions | Stop and return to coordinator; refresh or inspect `docs/backend/` before proceeding | Coordinator | Open |
| M2 requires React Router or URL-synced behavior | Defer to M3 and keep M2 simple | M2 subagent | Open |
| M4 finds backend local auth cannot run with documented OAuth paths | Document the limitation and mark authenticated smoke as manual/blocked until backend support exists | M4 subagent | Open |
| Validation fails after a milestone commit | Fix within the same milestone scope or revert only that milestone's own commit with coordinator approval | Responsible subagent / Coordinator | Open |

## Edge Cases And Failure Modes

- CI may pass locally but fail on GitHub if Node/npm caching or working-directory paths
  are wrong.
- Catalog table tests must not branch on localized English message text.
- M2 must preserve repeated query parameters for `category` and `sort`.
- Vite proxy wiring must not introduce CORS as a supported integration path.
- Auth smoke docs must distinguish example provider URLs from UI behavior that renders
  provider links from `GET /api/session`.

## Validation Plan

- M1, M2, and M4 workers each run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Coordinator repeats full validation after the final milestone.
- M4 docs-only/proxy validation still uses full validation because `vite.config.ts`
  affects app tooling.

## Verification Strategy

- Unit/component tests cover M2 catalog state and query behavior.
- Typecheck includes OpenAPI generated type freshness through `api:types:check`.
- Build verifies production Vite output after UI and config changes.
- `git diff --check` verifies whitespace across docs and source.
- Manual browser smoke remains deferred unless M4 documents a runnable local workflow.

## Better Engineering Notes

- Do not implement M3 while completing M2.
- Do not add authentication UI in M4; M4 is documentation and local wiring.
- If a dependency is proposed, the worker must explain why existing React/Vite/testing
  tools are insufficient before editing `package.json`.

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-06 | Pending | M1 | Pending | Worker records result |
| 2026-06-06 | Pending | M2 | Pending | Worker records result |
| 2026-06-06 | Pending | M4 | Pending | Worker records result |
| 2026-06-06 | Pending | Final integration | Pending | Coordinator records result |

## User Validation

- Review the CI workflow in GitHub Actions after push.
- Run the frontend and confirm the public catalog table renders populated, empty, and
  filtered states during local/manual checks.
- Follow `docs/LOCAL_AUTH_SMOKE.md` once M4 lands to verify anonymous session,
  login-provider discovery, authenticated session refresh, account read, logout, and
  post-logout session refresh.
