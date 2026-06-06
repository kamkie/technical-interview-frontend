# Plan: Follow-On Catalog And Auth Milestones

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to make the next plan after ready milestone dependencies are met |
| Generation Context | `ROADMAP.md`, `.agents/plans/PLAN_ready_milestones.md`, `SETUP.md`, imported backend contract guidance, and backend `.agents/plans/PLAN_TEMPLATE.md` |

## Lifecycle

| Status | Current |
| --- | --- |
| Phase | Planning |
| Status | Dependency Gated |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | Yes |
| Blocking Open Questions | None |
| Accepted Fallbacks | Use route/auth defaults recorded in `ROADMAP.md` |
| Ready For Execution | No |
| Last Updated | 2026-06-07 |

## Linked Pre-Planning Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Selected milestones, implementation defaults, and deferred scope | Current |
| Prior plan | `.agents/plans/PLAN_ready_milestones.md` | Dependency owner for M2 and M4 | Active |
| Setup | `SETUP.md` | Local repository layout and validation expectations | Current |
| Backend contract | `docs/backend/` | API contract and frontend integration invariants | Current |

## Summary

- Implement the next follow-on milestones after the current ready plan completes:
  M3 Advanced Catalog Controls and M5 Authenticated Session UX.
- Use one delegated worker/subagent per milestone.
- Commit after each milestone.
- Sequence M3 before M5 so authenticated route guarding can build on the React Router
  foundation and route/query-state conventions from M3.

Success is measured by dependency gates being satisfied, passing validation, one clean
commit per milestone, and an updated progress tracker with commit hashes and risks.

## Scope

- In scope:
  - M3 React Router route-level catalog navigation with URL-synced filters, sorting,
    richer table controls, and browser history behavior.
  - M5 authenticated session UX with account-aware header/state, logout flow, route
    guard infrastructure, session refresh, and CSRF-aware logout behavior.
  - Orchestrator progress tracking in this plan.
- Out of scope:
  - M1, M2, and M4 implementation; those belong to
    `.agents/plans/PLAN_ready_milestones.md`.
  - M6 read-only account profile page beyond minimal protected-route scaffolding if
    needed to prove route guards.
  - M7 account language mutation.
  - M8-M11 admin/operator implementation.
  - Backend repository changes.

## Current State

- This plan is dependency-gated.
- M3 depends on M2 landing the simple public catalog table shape.
- M5 depends on M4 documenting a runnable local auth workflow.
- M5 should execute after M3 because route guarding is cleaner once React Router is in
  place.
- Browser traffic must remain same-origin `/api/**`.

## Dependency Gates

| Gate | Required Before Execution | Owner | Status | Evidence |
| --- | --- | --- | --- | --- |
| G1 | M2 Simple Public Catalog UX is committed and validated | Current ready plan orchestrator | Pending | M2 commit hash and validation recorded in `.agents/plans/PLAN_ready_milestones.md` |
| G2 | M4 Local Auth Workflow Docs is committed and validates local auth workflow assumptions | Current ready plan orchestrator | Pending | M4 commit hash and validation recorded in `.agents/plans/PLAN_ready_milestones.md` |
| G3 | Coordinator updates this plan from `Dependency Gated` to `Ready` | Coordinator | Pending | Planning Readiness says `Ready For Execution: Yes` |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Current plan M2/M4 not completed yet | M3/M5 depend on their outputs | Coordinator | Dependency Gated | Wait for G1 and G2 | Yes |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M3 uses React Router for route-level navigation | User / `ROADMAP.md` | 2026-06-06 | Routing target changes |
| D2 | M3 includes browser back/forward expectations and route/query-state synchronization tests | User / `ROADMAP.md` | 2026-06-06 | Catalog navigation scope changes |
| D3 | M5 follows M4 and consumes `docs/LOCAL_AUTH_SMOKE.md` | User / `ROADMAP.md` | 2026-06-07 | M4 cannot document a runnable auth workflow |
| D4 | M5 follows M3 in this plan so route guards reuse the React Router foundation | Agent planning decision | 2026-06-07 | M3 is skipped or delayed |
| D5 | M5 does not implement the full account profile surface; M6 owns that | `ROADMAP.md` milestone split | 2026-06-07 | Account scope changes |

## Execution Shape And Shared Files

- Recommended shape: `M2: delegated` with serial workers.
- One subagent owns M3 and one subagent owns M5.
- Workers run one at a time on the same branch:
  - M3 worker first.
  - Coordinator gate.
  - M5 worker second.
  - Coordinator final integration validation.
- Coordinator owns this plan and final cross-milestone validation.
- Shared-file rules:
  - M3 may edit routing setup, catalog components/tests/styles, package metadata for
    React Router, and test utilities.
  - M5 may edit session/auth clients, app shell/header, route guard components/tests,
    logout behavior, and smoke docs only if M4 left an implementation note requiring
    a small clarification.
  - If M5 needs full account profile UI, stop and defer that to M6.

## Affected Artifacts

- `package.json` and `package-lock.json` for React Router if not already installed.
- `src/main.tsx`, `src/App.tsx`, and route setup files.
- `src/catalog/` and catalog tests.
- `src/api/session.ts` and session tests if logout/session refresh helpers are added.
- Auth/session UI components and tests.
- `src/index.css`.
- Browser smoke/e2e files only if M4 defined a canonical command or runnable workflow.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Coordinator dependency gate | Not Started | Coordinator | Pending | Pending | Confirm G1-G3 before execution |
| 1: M3 Advanced Catalog Controls | Not Started | M3 subagent | Pending | Pending | Add React Router catalog route/query/history behavior and commit |
| 2: Coordinator M3 gate | Not Started | Coordinator | Pending | Pending | Verify M3 commit before M5 handoff |
| 3: M5 Authenticated Session UX | Not Started | M5 subagent | Pending | Pending | Add account-aware header/session/logout/route guard behavior and commit |
| 4: Final integration validation | Not Started | Coordinator | Pending | Pending | Run full validation and summarize commits |

## Execution Tasks

### Task 0: Coordinator Dependency Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Confirm this plan is ready to execute |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `.agents/plans/PLAN_ready_milestones.md`, `ROADMAP.md`, `git log` |
| Behavior To Preserve | Do not start M3 or M5 until M2 and M4 are committed and validated |
| Deliverables | Gates G1-G3 marked resolved; Planning Readiness updated to ready |
| Validation Checkpoint | Inspect current-plan progress tracker and commit history |
| Commit Checkpoint | Commit this plan readiness update before worker handoff |

### Task 1: M3 Advanced Catalog Controls

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add route-level catalog navigation with URL-synced filters, sorting UI, richer table controls, and browser history behavior |
| Owned Files Or Packages | Routing setup, `src/catalog/`, catalog tests, `src/index.css`, package metadata for React Router |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M3, M2 implementation from the prior plan, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Same-origin `/api/**`; Spring pagination; repeated `category` and `sort`; localized error display |
| Deliverables | React Router setup; catalog route; query-string state for filters/page/sort; browser back/forward behavior; sorting UI; tests for route/query synchronization |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 2: Coordinator M3 Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M3 commit before M5 worker starts |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Git log/diff for the M3 commit |
| Behavior To Preserve | M3 should not implement authenticated account flows |
| Deliverables | Progress Tracker updated with M3 status, commit, validation, and notes |
| Validation Checkpoint | Inspect M3 diff; rerun targeted or full validation if needed |
| Commit Checkpoint | Commit plan update only if the orchestrator chooses to persist progress after each gate |

### Task 3: M5 Authenticated Session UX

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add authenticated session UX built on the documented local auth workflow and React Router foundation |
| Owned Files Or Packages | Session/auth API helpers, app shell/header, route guard components/tests, logout UI/tests |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M5, `docs/backend/FRONTEND_AI_CONTRACT.md`, M4 local auth doc, M3 routing implementation |
| Behavior To Preserve | Render login providers from `GET /api/session`; use session metadata for logout and CSRF; refresh session after logout; do not hard-code provider paths |
| Deliverables | Account-aware header/session state; logout flow through configured `logoutPath`; CSRF-aware logout helper; authenticated route guard infrastructure; tests for anonymous, authenticated, logout success, logout error, missing CSRF, and route-guard states |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`; browser smoke/e2e only if M4 defined a canonical command |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 4: Final Integration Validation

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M3 and M5 together and produce handoff |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Full branch diff and commit list |
| Behavior To Preserve | One commit per milestone; no unrelated changes |
| Deliverables | Final validation results, commit hashes, changed files, skipped work, and remaining risks |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit final plan progress update if progress tracking is persisted in git |

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| M2 does not land a stable table/catalog shape | Keep this plan dependency-gated and revise M3 after M2 is complete | Coordinator | Open |
| M4 cannot document a runnable local auth workflow | Keep M5 gated; optionally split M5 into mocked unit-level session UX and defer browser smoke | Coordinator | Open |
| React Router dependency conflicts with current React/Vite stack | Stop and ask coordinator to choose between dependency adjustment or revised routing approach | M3 subagent | Open |
| M5 needs full account profile behavior | Stop and defer profile details to M6 | M5 subagent | Open |
| Validation fails after a milestone commit | Fix within that milestone scope or return to coordinator for replan | Responsible subagent / Coordinator | Open |

## Edge Cases And Failure Modes

- Query-state parsing must handle missing, duplicate, invalid, and out-of-range values
  without throwing.
- Browser history behavior must avoid adding duplicate history entries for no-op
  filter changes.
- Sorting UI must continue to preserve repeated backend `sort` semantics.
- Logout is idempotent when no session exists, but authenticated logout should include
  the configured CSRF header when a real current session exists.
- M5 tests must not assume a hard-coded OAuth provider.

## Validation Plan

- M3 and M5 workers each run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Coordinator repeats full validation after M5.
- Browser smoke/e2e runs only if M4 defined a canonical command or otherwise records
  why it remains manual or skipped.

## Verification Strategy

- Component/unit tests cover query-state, table controls, sorting, and route guards.
- Session/logout tests cover metadata-driven paths, CSRF header behavior, and session
  refresh after logout.
- Typecheck includes OpenAPI generated type freshness through `api:types:check`.
- Build verifies Vite output after routing changes.
- Manual browser validation follows `docs/LOCAL_AUTH_SMOKE.md` when available.

## Better Engineering Notes

- Keep M3 focused on public catalog navigation; do not mix in authenticated behavior.
- Keep M5 focused on auth/session UX and route guard infrastructure; do not implement
  M6 account profile details.
- If M5 introduces a shared mutation helper, keep it minimal and driven by logout/CSRF
  needs only.
- Next plan file: `.agents/plans/PLAN_account_profile_language.md`.

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-07 | Pending | Dependency gates | Pending | Coordinator records result |
| 2026-06-07 | Pending | M3 | Pending | Worker records result |
| 2026-06-07 | Pending | M5 | Pending | Worker records result |
| 2026-06-07 | Pending | Final integration | Pending | Coordinator records result |

## User Validation

- Navigate catalog URLs directly and verify filters, page, and sort restore from the
  URL.
- Use browser back/forward buttons after catalog filter and sorting changes.
- Follow `docs/LOCAL_AUTH_SMOKE.md` to verify login-provider rendering,
  authenticated session refresh, logout, and post-logout session state.
