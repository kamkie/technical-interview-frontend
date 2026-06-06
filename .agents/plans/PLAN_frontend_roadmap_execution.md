# Plan: Frontend Roadmap Execution

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to fold roadmap execution plans into one orchestrator-owned plan |
| Generation Context | `ROADMAP.md`, prior active `.agents/plans/PLAN_*.md` files, `SETUP.md`, imported backend contract guidance, and backend `.agents/plans/PLAN_TEMPLATE.md` |

## Lifecycle

| Status | Current |
| --- | --- |
| Phase | Whole-Plan Readiness Gate |
| Status | Blocked For Remaining Implementation |

## Planning Readiness

| Field | Value |
| --- | --- |
| Decision Complete | No for remaining work |
| Blocking Open Questions | Yes; later authenticated/admin/operator gates are unresolved |
| Accepted Fallbacks | Do not start partial implementation; wait until the whole selected scope can finish |
| Ready For Execution | No for remaining whole-plan implementation |
| Last Updated | 2026-06-07 |

Phase 1 is implemented and recorded. Remaining implementation must not start as a
partial phase run: the plan is blocked until the whole selected remaining scope can be
executed to completion without unresolved gates.

## Linked Pre-Planning Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Milestone source, scope decisions, and implementation defaults | Current |
| Setup | `SETUP.md` | Local repository layout and validation expectations | Current |
| Backend contract | `docs/backend/` | API contract and frontend integration invariants | Current |

## Summary

- Execute the frontend roadmap from M1 through M11 with one orchestrator-owned plan
  only when the whole selected plan scope can finish.
- The orchestrator only orchestrates workers; milestone and spec implementation
  belongs to workers, not the orchestrator.
- Keep one subagent/worker per milestone or spec slice.
- Require one commit per milestone/spec slice.
- Do not start partial implementation for a dependency-gated plan.
- Once a plan run starts, keep executing until complete unless an unresolved decision
  cannot be made from the user request, backend contract, tests, or project docs.

Success is measured by passing validation, isolated commits, progress tracker updates,
and no implementation work outside the selected milestone/spec scope.

## Scope

- In scope:
  - Phase 0: M0 bookkeeping; already complete.
  - Phase 1: M1 CI, M2 Simple Public Catalog UX, M4 Local Auth Workflow Docs.
  - Phase 2: M3 Advanced Catalog Controls, M5 Authenticated Session UX.
  - Phase 3: M6 Account Profile Surface, M7 Account Language Preference.
  - Phase 4: specs for M8-M11 admin/operator work.
  - Phase 5: implementation planning gates for M8-M11 after specs are accepted.
  - Orchestrator progress tracking in this plan.
- Out of scope:
  - Backend repository changes.
  - Inventing endpoints, request fields, auth headers, or transports.
  - Implementing admin/operator UI before the relevant spec is accepted.

## Current State

- M0 and Phase 1 are complete.
- Frontend stack is Vite, React, TypeScript, Node.js 24.x, and npm 11.x.
- Browser traffic must target same-origin `/api/**`.
- The sibling backend checkout is expected at `..\technical-interview-demo`.
- Contract-facing work must follow `docs/backend/approved-openapi.json`,
  `docs/backend/FRONTEND_AI_CONTRACT.md`, and `docs/backend/README.md`.

## Phase Map

| Phase | Milestones | Status | Gate |
| --- | --- | --- | --- |
| 0 | M0 Foundation | Complete | Already validated |
| 1 | M1, M2, M4 | Complete | Milestone commits landed and validation passed |
| 2 | M3, M5 | Blocked | Do not start M3 alone; whole remaining scope is not executable yet |
| 3 | M6, M7 | Dependency Gated | M5 complete and reusable auth/session state exists |
| 4 | M8-M11 specs | Dependency Gated | M7 proves auth/CSRF mutation pattern |
| 5 | M8-M11 implementation planning | Dependency Gated | Relevant spec accepted |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | None for Phase 1 | M1/M2/M4 were ready to implement | Coordinator | Completed | Phase 1 executed and recorded | No |
| Q2 | M3 and M5 depend on Phase 1 outputs | M3 needs M2 table shape; M5 needs M4 local auth workflow and M3 route foundation | Coordinator | Gated | Do not execute M3 alone under the whole-plan rule | Yes |
| Q3 | M6 and M7 depend on M5 | Account work needs authenticated session/header/route guard foundation | Coordinator | Dependency Gated | Wait for M5 | Yes for Phase 3 |
| Q4 | Admin/operator implementation needs specs | Roadmap requires small specs before implementation | Coordinator | Dependency Gated | Execute Phase 4 first | Yes for Phase 5 |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | CI target is GitHub Actions | User / `ROADMAP.md` | 2026-06-06 | CI provider changes |
| D2 | CI runs on pull requests and pushes to `main` with Node.js 24.x, `npm ci`, lint, typecheck, tests, build, and `git diff --check` | `ROADMAP.md` | 2026-06-06 | Branch or validation policy changes |
| D3 | M2 uses a basic table with title, author, publication year, ISBN, and categories | User / `ROADMAP.md` | 2026-06-06 | Catalog UX scope changes |
| D4 | M2 fixtures live under `src/test/fixtures/` and cover loading, populated, empty, filtered, paginated, localized book error, and category error states | `ROADMAP.md` | 2026-06-06 | Test organization changes |
| D5 | M3 uses React Router with route-level browser history expectations | User / `ROADMAP.md` | 2026-06-06 | Routing target changes |
| D6 | M4 docs live at `docs/LOCAL_AUTH_SMOKE.md` and local dev uses a Vite `/api` proxy to `http://localhost:8080` | User / `ROADMAP.md` | 2026-06-06 | Backend local port or proxy strategy changes |
| D7 | M5 consumes M4 local auth docs and does not implement full account profile details | User / `ROADMAP.md` | 2026-06-07 | M4 cannot document runnable auth workflow |
| D8 | M6 is read-only account profile plus account-aware menu/header | User / `ROADMAP.md` | 2026-06-06 | Account scope changes |
| D9 | M7 is account language preference backed by `PUT /api/account/language` | User / contract check | 2026-06-06 | Backend account contract changes |
| D10 | M8 is combined book/category admin management | User / `ROADMAP.md` | 2026-06-07 | Admin catalog scope changes |
| D11 | M9 includes message-key editing plus locale coverage/status | User / `ROADMAP.md` | 2026-06-07 | Localization scope changes |
| D12 | M10 is read-only operator overview plus pageable audit log | User / `ROADMAP.md` | 2026-06-07 | Operator scope changes |
| D13 | M11 is user list/detail plus role management | User / `ROADMAP.md` | 2026-06-07 | User-management scope changes |

## Execution Shape And Shared Files

- Recommended shape: orchestrated serial delegation after whole-plan readiness is
  established.
- Before spawning implementation workers, the coordinator must audit the entire
  selected plan scope and confirm that it can finish without unresolved gates.
- If the whole selected scope cannot finish, the coordinator stops before
  implementation and reports the exact unresolved decisions or external blockers.
- The coordinator must not implement milestone or spec tasks. Coordinator-owned work
  is limited to orchestration, worker assignment, plan/status updates, cross-slice
  validation, integration review, and required commits.
- One subagent owns one milestone or one spec slice.
- Each milestone/spec slice gets one commit.
- Coordinator owns this plan, phase gates, cross-slice validation, and final handoff.
- Workers must stop and return to the coordinator before editing files outside their
  assigned slice.

Shared-file guardrails:

- `ROADMAP.md` is coordinator-owned during execution unless a milestone explicitly
  changes roadmap scope.
- This plan is coordinator-owned.
- Backend contract artifacts under `docs/backend/` are read-only unless a contract
  refresh is explicitly part of the task.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: M0 Foundation | Done | Coordinator | Existing | Passed | M0 is complete |
| 1: M1 CI and Quality Gate | Done | M1 subagent | `266f63d` | Passed by coordinator | Added GitHub Actions workflow |
| 2: M2 Simple Public Catalog UX | Done | M2 subagent | `ec852da` | Passed by M2 subagent and coordinator | Added table UX and fixture-backed visible states |
| 3: M4 Local Auth Workflow Docs | Done | M4 subagent | `3cb49be` | Passed by coordinator | Added auth smoke docs and Vite `/api` proxy |
| 4: Phase 1 integration gate | Done | Coordinator | N/A; status tracking only | Passed by coordinator | M3 is unlocked; M5 still waits for M3 |
| 5: M3 Advanced Catalog Controls | Blocked | M3 subagent | Pending | Pending | M2 table shape is complete, but whole remaining plan is not executable |
| 6: M5 Authenticated Session UX | Blocked | M5 subagent | Pending | Pending | Wait for M3 route foundation |
| 7: Phase 2 integration gate | Blocked | Coordinator | Pending | Pending | Unlock M6/M7 if M5 passes |
| 8: M6 Account Profile Surface | Blocked | M6 subagent | Pending | Pending | Wait for M5 |
| 9: M7 Account Language Preference | Blocked | M7 subagent | Pending | Pending | Wait for M6 and CSRF/session patterns |
| 10: Phase 3 integration gate | Blocked | Coordinator | Pending | Pending | Unlock admin/operator specs |
| 11: M8 Admin Catalog Spec | Blocked | M8 spec subagent | Pending | Pending | Wait for M7 |
| 12: M9 Admin Localization Spec | Blocked | M9 spec subagent | Pending | Pending | Wait for M7 |
| 13: M10 Operator Audit Spec | Blocked | M10 spec subagent | Pending | Pending | Wait for M5/M7 phase gate |
| 14: M11 Admin User Management Spec | Blocked | M11 spec subagent | Pending | Pending | Wait for M7 |
| 15: Phase 4 spec review gate | Blocked | Coordinator | Pending | Pending | Unlock per-milestone implementation planning |
| 16: M8-M11 implementation planning | Blocked | Coordinator | Pending | Pending | Create or activate implementation tasks after specs are accepted |

## Phase 1: Completed Implementation

### Task 1: M1 CI And Quality Gate

| Field | Value |
| --- | --- |
| Status | Complete |
| Goal | Add GitHub Actions validation for canonical npm commands |
| Owned Files Or Packages | `.github/workflows/ci.yml` |
| Context Required | `AGENTS.md`, `ROADMAP.md`, `package.json` scripts |
| Behavior To Preserve | CI must use npm and Node.js 24.x; do not add deployment behavior |
| Deliverables | Workflow triggered on pull requests and pushes to `main`; uses `npm ci`; runs lint, typecheck, tests, build, and `git diff --check` |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 2: M2 Simple Public Catalog UX

| Field | Value |
| --- | --- |
| Status | Complete |
| Goal | Replace current public catalog list with basic table UX and fixture-backed visible-state tests |
| Owned Files Or Packages | `src/catalog/`, catalog tests, `src/test/fixtures/`, `src/index.css`; `src/api/catalog.ts` only if needed |
| Context Required | `AGENTS.md`, `ROADMAP.md` M2, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Same-origin `/api/**`; Spring pagination; repeated `category` and `sort`; localized error display |
| Deliverables | Table columns for title, author, publication year, ISBN, categories; button pagination; fixtures/tests for visible states |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 3: M4 Local Auth Workflow Docs

| Field | Value |
| --- | --- |
| Status | Complete |
| Goal | Document local authenticated workflow and wire frontend dev `/api` proxy to sibling backend |
| Owned Files Or Packages | `docs/LOCAL_AUTH_SMOKE.md`, `SETUP.md`, `vite.config.ts` |
| Context Required | `AGENTS.md`, `ROADMAP.md` M4, backend `docs/OPERATIONS.md` OAuth Setup, backend `src/manualTests/http/examples/authentication.http` |
| Behavior To Preserve | Do not hard-code provider paths in app behavior; docs must say UI uses `GET /api/session` metadata |
| Deliverables | Local auth smoke doc; `SETUP.md` link; Vite `/api` proxy to `http://localhost:8080`; anonymous-vs-authenticated automation policy |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

## Phase 2: Follow-On Catalog And Auth

Gate: M2 and M4 are committed and validated, but Phase 2 must not start as a
standalone partial run. M3 still precedes M5 inside the implementation order, but no
Phase 2 worker should start until the whole selected remaining plan scope can finish.

### Task 4: M3 Advanced Catalog Controls

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Add route-level catalog navigation with URL-synced filters, sorting UI, richer table controls, and browser history behavior |
| Owned Files Or Packages | Routing setup, `src/catalog/`, catalog tests, `src/index.css`, package metadata for React Router |
| Context Required | M2 implementation, `ROADMAP.md` M3, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Same-origin `/api/**`; Spring pagination; repeated `category` and `sort`; localized error display |
| Deliverables | React Router setup; catalog route; query-string state for filters/page/sort; browser back/forward behavior; sorting UI; route/query tests |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 5: M5 Authenticated Session UX

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Add authenticated session UX on the documented local auth workflow and React Router foundation |
| Owned Files Or Packages | Session/auth API helpers, app shell/header, route guards/tests, logout UI/tests |
| Context Required | M4 auth doc, M3 routing implementation, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Render login providers from `GET /api/session`; use session metadata for logout and CSRF; refresh session after logout; do not hard-code provider paths |
| Deliverables | Account-aware header/session state; metadata-driven logout; CSRF-aware logout helper; route guard infrastructure; tests for anonymous/authenticated/logout/missing-CSRF states |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`; browser smoke/e2e only if M4 defines a canonical command |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

## Phase 3: Account Profile And Language

Gate: M5 must be committed, validated, and expose reusable authenticated session and
route-guard patterns.

### Task 6: M6 Account Profile Surface

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Add read-only current-account profile page plus account-aware menu/header |
| Owned Files Or Packages | Account components/routes/tests, app shell/header/menu, account read API client |
| Context Required | M5 session UX, `ROADMAP.md` M6, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Call `GET /api/account` only after session establishes authenticated state |
| Deliverables | Protected account route/page; account-aware header/menu; loading/error/unauthenticated/authenticated tests; no account mutations |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 7: M7 Account Language Preference

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Add current-user preferred-language update and clear flow |
| Owned Files Or Packages | Account language preference components/tests, account API client, CSRF/mutation helper if needed |
| Context Required | M5/M6 implementations, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Behavior To Preserve | Use session metadata for CSRF header/cookie names; branch on stable fields and status, not localized English text |
| Deliverables | Preferred-language display/edit/clear UI; `PUT /api/account/language` client; returned account-state refresh; tests for loading, success, validation/error, unauthenticated, missing-CSRF, and localized errors |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`; browser smoke/e2e only if canonical command exists |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

## Phase 4: Admin And Operator Specs

Gate: M7 must be committed and validated. These tasks create specs only; they do not
implement admin/operator UI.

### Task 8: M8 Admin Catalog Spec

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Specify combined admin book/category management |
| Owned Files Or Packages | `docs/specs/SPEC_admin_catalog_management.md` |
| Context Required | `ROADMAP.md` M8, `docs/backend/approved-openapi.json`, M7 CSRF helper handoff |
| Behavior To Preserve | Include book `version` on updates; preserve backend pagination/filter conventions; do not invent endpoints |
| Deliverables | Spec covering list, create, update, delete, category-in-use, stale book version, localized errors, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optional markdown/spec lint if available |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 9: M9 Admin Localization Spec

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Specify localization message editing plus locale coverage/status |
| Owned Files Or Packages | `docs/specs/SPEC_admin_localization_management.md` |
| Context Required | `ROADMAP.md` M9, `docs/backend/approved-openapi.json`, M7 CSRF helper handoff |
| Behavior To Preserve | Treat localized messages as display content; branch on stable fields and status |
| Deliverables | Spec covering supported locales, message-key editing, coverage/status states, localized failures, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optional markdown/spec lint if available |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 10: M10 Operator Audit Spec

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Specify read-only operator overview plus pageable audit log |
| Owned Files Or Packages | `docs/specs/SPEC_operator_audit_surface.md` |
| Context Required | `ROADMAP.md` M10, `docs/backend/approved-openapi.json`, M5 route/access handoff |
| Behavior To Preserve | Keep read-only; preserve audit filters for target type, action, actor, page, size, and repeated sort |
| Deliverables | Spec covering overview, runtime/status summaries, recent audit entries, filtered pageable rows, details panel, access, partial payloads, and tests |
| Validation Checkpoint | `git diff --check`; optional markdown/spec lint if available |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

### Task 11: M11 Admin User Management Spec

| Field | Value |
| --- | --- |
| Status | Blocked |
| Goal | Specify admin user list/detail plus role management |
| Owned Files Or Packages | `docs/specs/SPEC_admin_user_management.md` |
| Context Required | `ROADMAP.md` M11, `docs/backend/approved-openapi.json`, M7 CSRF helper handoff |
| Behavior To Preserve | Preserve contract-backed role replacement; require operator reason; do not invent enable/disable/delete behavior |
| Deliverables | Spec covering user list/detail, roles, role-grant provenance, role replacement, validation failures, localized errors, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optional markdown/spec lint if available |
| Commit Checkpoint | Commit using `.gitmessage`; record hash in Progress Tracker |

## Phase 5: Admin And Operator Implementation Planning

Gate: the relevant Phase 4 spec must be accepted. The coordinator should create or
activate implementation tasks for M8-M11 one milestone at a time after spec review.

| Milestone | Implementation Gate | Next Action |
| --- | --- | --- |
| M8 | `docs/specs/SPEC_admin_catalog_management.md` accepted | Create M8 implementation task or mark Task 16 ready |
| M9 | `docs/specs/SPEC_admin_localization_management.md` accepted | Create M9 implementation task or mark Task 16 ready |
| M10 | `docs/specs/SPEC_operator_audit_surface.md` accepted | Create M10 implementation task or mark Task 16 ready |
| M11 | `docs/specs/SPEC_admin_user_management.md` accepted | Create M11 implementation task or mark Task 16 ready |

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| A worker needs to change backend contract assumptions | Coordinator inspects or refreshes `docs/backend/`; stop only if the contract conflict remains unresolved | Coordinator | Open |
| The selected plan scope is only partially executable | Stop before implementation; do not run a partial milestone slice unless the user explicitly re-scopes the plan | Coordinator | Open |
| M2 requires React Router or URL-synced behavior | Defer to M3 and keep M2 simple | M2 subagent | Open |
| M4 cannot document runnable local auth | Keep M5 gated or split M5 into mocked unit-level session UX and defer browser smoke | Coordinator | Open |
| M5 appears to need full account profile behavior | Keep M5 scoped to session UX and defer profile details to M6 unless the contract or user request creates an unresolved conflict | M5 subagent | Open |
| M7 cannot establish a usable CSRF mutation pattern | Keep admin mutation specs/implementation gated or add explicit blocker to specs | Coordinator | Open |
| A spec grows too broad for one milestone | Split the spec and update `ROADMAP.md` before implementation planning | Coordinator | Open |
| Validation fails after a milestone commit | Fix within that milestone scope or return to coordinator for replan | Responsible subagent / Coordinator | Open |

## Edge Cases And Failure Modes

- Query-state parsing must handle missing, duplicate, invalid, and out-of-range values.
- Browser history behavior must avoid duplicate entries for no-op filter changes.
- Catalog and audit sorting must preserve repeated backend `sort` semantics.
- Unsafe writes must mirror the readable CSRF cookie into the configured header.
- Localized backend messages are display content only.
- Specs must not duplicate durable endpoint schemas from `docs/backend/`; they should
  link to the contract owner instead.

## Validation Plan

- App/tooling milestone workers run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Spec-only workers run:
  - `git diff --check`
  - optional markdown/spec lint if available at execution time
- Coordinator repeats the applicable validation after each phase gate.

## Verification Strategy

- Component/unit tests cover UI states, query-state, route guards, account flows, and
  CSRF helper behavior as milestones land.
- Typecheck includes OpenAPI generated type freshness through `api:types:check`.
- Build verifies production Vite output after app/tooling changes.
- Contract review uses `docs/backend/approved-openapi.json` and
  `docs/backend/FRONTEND_AI_CONTRACT.md`.
- Browser smoke/e2e runs only when a canonical command exists; otherwise the
  orchestrator records why it remains manual or skipped.

## Better Engineering Notes

- Keep each milestone commit scoped to one milestone or spec.
- Do not implement future-phase behavior early.
- If a shared admin shell emerges from specs, create a prerequisite task rather than
  hiding it inside the first admin implementation milestone.

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-07 | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check` | Phase 1 | Passed | Reran after Vite proxy matcher fix; 4 test files, 19 tests; browser smoke mounted the app with expected backend-offline 502s |
| 2026-06-07 | Pending | Phase 2 | Blocked | Do not start M3 alone; remaining whole-plan scope has unresolved gates |
| 2026-06-07 | Pending | Phase 3 | Pending | Coordinator records result |
| 2026-06-07 | Pending | Phase 4 | Pending | Coordinator records result |
| 2026-06-07 | Pending | Final roadmap execution | Pending | Coordinator records result |

## User Validation

- Review the GitHub Actions workflow after M1.
- Use the catalog table and URL/history behavior after M2/M3.
- Follow `docs/LOCAL_AUTH_SMOKE.md` for session/login/logout checks after M4/M5.
- Verify account profile and language preference after M6/M7.
- Review M8-M11 specs before any admin/operator implementation starts.
