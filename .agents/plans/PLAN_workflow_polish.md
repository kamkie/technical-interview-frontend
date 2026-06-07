# Plan: Workflow Polish

## Provenance

| Field              | Value                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan ID            | `PLAN-workflow-polish`                                                                                                                                                                                                           |
| Created By         | Codex                                                                                                                                                                                                                            |
| Created On         | 2026-06-07                                                                                                                                                                                                                       |
| Source Request     | Create an active plan for `M-WORKFLOW-001: Workflow Polish`.                                                                                                                                                                     |
| Generation Context | `AGENTS.md`, `ROADMAP.md`, `docs/DESIGN.md`, `.agents/references/planning.md`, `.agents/references/plan-execution.md`, `.agents/references/documentation.md`, `.agents/references/testing.md`, app source layout, `package.json` |

## Lifecycle

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Phase         | Planning                                                               |
| Status        | Waiting                                                                |
| Current Slice | Wait for `M-UI-001` to land, then run the predecessor readiness check. |
| Last Updated  | 2026-06-07                                                             |

## Planning Readiness

| Field                                      | Value                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Objective Clear Enough To Test Or Document | Yes                                                                                                     |
| Decision Complete                          | Yes                                                                                                     |
| Blocking Open Questions                    | None                                                                                                    |
| Accepted Fallbacks                         | Use `ROADMAP.md`, `docs/DESIGN.md`, imported backend artifacts, and current route tests as tie-breakers |
| Ready For Execution                        | No; execution waits for `M-UI-001` because the roadmap dependency is still active                       |

## Linked And Source Artifacts

| Artifact                 | Path                                                        | Role                                                                                                       | Status      |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| Root AI rules            | `AGENTS.md`                                                 | Authorization, dirty-worktree protection, truth priority, and focused-reference routing                    | Current     |
| Roadmap                  | `ROADMAP.md`                                                | Selected scope, stable IDs, milestone dependency, and task order for `M-WORKFLOW-001`                      | Current     |
| Design owner             | `docs/DESIGN.md`                                            | Durable product and design intent for production workflow polish                                           | Current     |
| Backend contract         | `docs/backend/`                                             | Source of truth for API behavior, auth, CSRF, localization, pagination, repeated filters, and update rules | Current     |
| Planning reference       | `.agents/references/planning.md`                            | Active-plan authoring and readiness rules                                                                  | Current     |
| Execution reference      | `.agents/references/plan-execution.md`                      | Delegated execution, slice promotion, and commit checkpoint handling                                       | Current     |
| Architecture reference   | `.agents/references/architecture.md`                        | Route, feature, helper, and test placement                                                                 | Current     |
| Code-style reference     | `.agents/references/code-style.md`                          | TypeScript, React, CSS, accessibility, and testing shape                                                   | Current     |
| Validation reference     | `.agents/references/testing.md`                             | Required validation selection                                                                              | Current     |
| Existing specs           | `docs/specs/`                                               | Prior selected behavior details to preserve, not redefine                                                  | Read-only   |
| App shell and routes     | `src/App.tsx`, `src/index.css`                              | Shared shell, account/session controls, and global layout styles                                           | Future edit |
| Shared UI helpers        | `src/ui/`                                                   | Existing async state, mutation feedback, formatting, pagination, and theme helpers                         | Future edit |
| Catalog workflows        | `src/catalog/`, `src/admin/AdminCatalogPage.tsx`            | Public and admin catalog route behavior                                                                    | Future edit |
| Admin/operator workflows | `src/admin/`, `src/operator/`                               | Admin localization, users, and operator/audit route behavior                                               | Future edit |
| Account/session workflow | `src/account/AccountProfile.tsx`, `src/api/session.test.ts` | Account preference, login-provider, logout, and session-copy coverage                                      | Future edit |

## Summary

`M-WORKFLOW-001` polishes daily catalog, account, admin, and operator workflows after the production shell foundation lands. The plan keeps the roadmap task order: state semantics first, visual hierarchy second, catalog workflow polish third, admin/operator workflow grouping fourth, and account/session copy last.

This plan is `Waiting`, not `Ready`, because `M-WORKFLOW-001` depends on `M-UI-001`. When `M-UI-001` lands, the coordinator should run the predecessor readiness check, update this plan's lifecycle, then execute the first ready slice.

Durable rules discovered during execution must move to the owning backend contract artifact, executable test, design guide, roadmap row, focused reference, human doc, or source file before this plan is complete.

## Scope

In scope:

- `E-STATE-001`: normalize loading, empty, success, and error state presentation across implemented routes.
- `E-WORKFLOW-001`: establish consistent page headers, content bands, and action placement without adding backend behavior.
- `E-CATALOG-001`: improve catalog and admin catalog scanning, pagination, sorting, repeated filters, form prominence, and versioned update protection.
- `E-OPS-001`: group admin and operator controls by workflow, improve dense scanning, and preserve existing backend operations.
- `E-AUTH-001`: make account/session copy clearer, keep login providers metadata-driven, and keep logout/account preference flows visible.
- Route/component/API tests needed to protect the changed user-visible behavior and contract-sensitive request behavior.
- Focused CSS/layout changes in `src/index.css` and small shared UI helpers only when multiple routes genuinely use the same pattern.

Out of scope:

- `M-UI-001` shell/navigation foundation implementation.
- `M-SMOKE-001` responsive smoke commands or canonical smoke evidence.
- `M-QUALITY-001` accessibility, smoke-gap promotion, or hardening thresholds.
- Backend API expansion, generated type edits, alternate transports, JWT or bearer-token assumptions, provider-specific OAuth paths, CORS-first behavior, or invented request fields.
- New generic command wrappers, broad workflow-state directories, global state frameworks, or reusable execution scaffolding.
- Marketing or landing-page treatment.

## Contract And Repository Invariants

- Preserve same-origin `/api/**`, session-cookie auth, `GET /api/session`, metadata-driven login providers from `loginProviders[]`, session metadata for account/logout/CSRF names, CSRF header mirroring for unsafe writes with a real current session, localized messages as display content, stable-field branching, Spring pagination, repeated filters, and book `version` on updates.
- Do not branch on localized English response messages.
- Do not hand-edit `src/api/generated/openapi.ts`.
- Keep public catalog, account, admin, operator, and audit workflows structurally distinct in routes and tests.
- Use existing route, feature, API, routing, and UI helper boundaries before adding new abstractions.
- Add the smallest useful tests for each changed visible behavior.
- Run `git status --short` before every repository-changing slice and preserve user-owned changes.

## Decisions, Open Questions, And Assumptions

| ID | Type       | Item                                                                                          | Owner        | Status   | Fallback Or Decision                                                                                      | Blocks Ready? |
| -- | ---------- | --------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| D1 | Decision   | Execute workflow polish in roadmap order after `M-UI-001`: state, visual hierarchy, catalog, operations, account/session | Roadmap      | Accepted | Preserve stable IDs and reorder only through `ROADMAP.md`                                                 | No            |
| D2 | Decision   | Do not create new specs up front                                                               | Coordinator  | Accepted | Add a focused `docs/specs/` file only if a slice becomes too broad or ambiguous for roadmap plus design    | No            |
| D3 | Decision   | Browser review is useful but not canonical smoke evidence for this milestone                   | Coordinator  | Accepted | Use local browser review for significant visual changes; keep formal smoke scope in `M-SMOKE-001`         | No            |
| A1 | Assumption | `M-UI-001` will leave shell navigation and route context stable enough for workflow polish      | Coordinator  | Active   | If `M-UI-001` changes scope or leaves unresolved shell questions, replan before promoting `T-STATE-001`    | No            |
| A2 | Assumption | Existing mock API and route/component tests can cover most workflow polish without live credentials | Coordinator  | Active   | Use live backend or smoke evidence only when a changed flow cannot be validated with current tests         | No            |

## Execution Shape And Ownership

- Coordinator owns this plan, roadmap status updates, dirty-worktree checks, shared-file assignment, validation reporting, and plan-authorized commits during execution.
- Implementation should be delegated by slice when this active plan is executed.
- Shared files such as `src/index.css`, `src/App.tsx`, and `src/ui/` are coordinator-owned unless assigned to one worker at a time.
- Each repository-changing task includes a commit checkpoint after that task's validation. Commit only the slice-owned files and leave unrelated user-owned changes unstaged.
- Promote dependent slices from `Waiting` to `Ready` only after predecessor work lands, validates, and the checkpoint is complete.

## Progress Tracker

| Slice                        | Status  | Owner       | Depends On            | Last Updated | Notes                                                                  |
| ---------------------------- | ------- | ----------- | --------------------- | ------------ | ---------------------------------------------------------------------- |
| P0: Predecessor readiness    | Waiting | Coordinator | `M-UI-001` completion | 2026-06-07   | Confirm shell/navigation and route context are stable before execution |
| P1: State semantics          | Waiting | Worker      | P0                    | 2026-06-07   | Covers `E-STATE-001`                                                   |
| P2: Visual hierarchy         | Waiting | Worker      | P1                    | 2026-06-07   | Covers `E-WORKFLOW-001`                                                |
| P3: Catalog workflows        | Waiting | Worker      | P2                    | 2026-06-07   | Covers `E-CATALOG-001`                                                 |
| P4: Admin/operator workflows | Waiting | Worker      | P3                    | 2026-06-07   | Covers `E-OPS-001`                                                     |
| P5: Account/session copy     | Waiting | Worker      | P4                    | 2026-06-07   | Covers `E-AUTH-001`                                                    |
| P6: Final review             | Waiting | Coordinator | P5                    | 2026-06-07   | Confirm owner drift, tests, and handoff evidence                       |

## Plan Tasks

### Task 0: Predecessor Readiness Check

| Field                   | Value                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Waiting                                                                                                                                |
| Goal                    | Confirm `M-UI-001` has landed and leaves stable shell navigation, route context, and session-control behavior for workflow polish      |
| Owned Files Or Packages | `.agents/plans/PLAN_workflow_polish.md`; `ROADMAP.md` only if roadmap status or plan status needs updating                             |
| Read-Only Context       | `ROADMAP.md`, `docs/DESIGN.md`, `src/App.tsx`, implemented `M-UI-001` diffs, affected route tests                                      |
| Behavior To Preserve    | Stable IDs, roadmap dependency, backend contract invariants, and completed `M-UI-001` behavior                                         |
| Deliverables            | Plan lifecycle/status update from `Waiting` to `Ready` when appropriate, or a replan note if `M-UI-001` leaves unresolved dependencies |
| Validation Checkpoint   | `npm run lint:markdown`; `git diff --check` for plan/status-only edits                                                                 |
| Commit Checkpoint       | Authorized after validation with only `.agents/plans/PLAN_workflow_polish.md` and any scoped roadmap status edit                       |

Implementation notes:

- Do not begin `P1` while `M-UI-001` is still selected as the active roadmap priority.
- If `M-UI-001` changes the route model enough that this plan's slices no longer match real ownership, update the plan before assigning workers.

### Task 1: State Semantics

| Field                   | Value                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                  | Waiting                                                                                                                                                      |
| Goal                    | Normalize loading, empty, success, and error state presentation across public, account, admin, and operator routes without branching on localized messages   |
| Owned Files Or Packages | `src/ui/`, affected route components in `src/catalog/`, `src/account/`, `src/admin/`, `src/operator/`, affected route/component tests, focused CSS selectors |
| Read-Only Context       | `docs/DESIGN.md`, `ROADMAP.md` `E-STATE-001`, current tests, `src/api/` modules, `docs/backend/`                                                             |
| Behavior To Preserve    | Stable-field branching, localized messages as display content, route-specific access behavior, existing fetch/mutation semantics                             |
| Deliverables            | Shared or route-local state presentation pattern, updated route render states, tests proving state behavior without relying on English backend messages      |
| Validation Checkpoint   | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check`                                                                         |
| Commit Checkpoint       | Authorized after validation with only state semantics source, test, CSS, and plan status files                                                               |

Implementation notes:

- Prefer existing `LoadState`, `MutationState`, `MutationFeedback`, and route-local state before adding a new shared component.
- Add shared UI only when at least two routes use the same behavior.

### Task 2: Visual Hierarchy

| Field                   | Value                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Waiting                                                                                                                                                   |
| Goal                    | Establish consistent page headers, content bands, and action placement while preserving backend-backed flows                                              |
| Owned Files Or Packages | `src/App.tsx`, `src/index.css`, affected route components and route/component tests                                                                       |
| Read-Only Context       | `docs/DESIGN.md`, `ROADMAP.md` `E-WORKFLOW-001`, output from Task 1                                                                                       |
| Behavior To Preserve    | Shell/navigation behavior from `M-UI-001`, public/account/admin/operator separation, state semantics from Task 1, all backend request behavior            |
| Deliverables            | Consistent route hierarchy, action placement, reduced nested card weight where applicable, tests covering unchanged route flows and visible primary state |
| Validation Checkpoint   | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check`                                                                      |
| Commit Checkpoint       | Authorized after validation with only visual hierarchy source, test, CSS, and plan status files                                                           |

Implementation notes:

- Keep the app work-focused and dense; do not add hero, marketing, or decorative treatment.
- Use browser review for materially changed layouts when a local dev target is available, but do not call that canonical smoke evidence.

### Task 3: Catalog Workflows

| Field                   | Value                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Waiting                                                                                                                                              |
| Goal                    | Improve public and admin catalog table scanning, pagination, sorting, repeated filters, form prominence, action hierarchy, and versioned updates     |
| Owned Files Or Packages | `src/catalog/`, `src/admin/AdminCatalogPage.tsx`, `src/test/fixtures/catalog.ts`, matching catalog/admin tests, focused CSS selectors                |
| Read-Only Context       | `docs/specs/SPEC_public_catalog_workflow_polish.md`, `docs/specs/SPEC_admin_catalog_management.md`, `docs/backend/`, output from Tasks 1 and 2       |
| Behavior To Preserve    | Catalog query serialization, repeated `category`, repeated `sort`, pagination conventions, admin authorization, CSRF handling, book `version` update |
| Deliverables            | Improved table/control/form hierarchy and tests for pagination, sorting, repeated filters, and versioned admin updates                               |
| Validation Checkpoint   | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check`                                                                 |
| Commit Checkpoint       | Authorized after validation with only catalog workflow source, test, fixture, CSS, and plan status files                                             |

Implementation notes:

- Do not invent new catalog filters or backend fields.
- Keep public catalog and admin catalog related but distinct; share only proven helpers.

### Task 4: Admin And Operator Workflows

| Field                   | Value                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Waiting                                                                                                                                                                                 |
| Goal                    | Group admin and operator controls by workflow, improve dense scanning, and preserve localization, user, operator, and audit operations                                                  |
| Owned Files Or Packages | `src/admin/AdminLocalizationPage.tsx`, `src/admin/AdminUsersPage.tsx`, `src/operator/OperatorPage.tsx`, matching tests, focused CSS selectors                                           |
| Read-Only Context       | `docs/specs/SPEC_admin_localization_management.md`, `docs/specs/SPEC_admin_user_management.md`, `docs/specs/SPEC_operator_audit_surface.md`, `docs/backend/`, output from Tasks 1 and 2 |
| Behavior To Preserve    | Admin role gating, operator access behavior, localization stable fields, audit query serialization, role replacement semantics, CSRF handling                                           |
| Deliverables            | Workflow-grouped controls, improved dense scanning for admin/operator tables and detail panels, tests proving unchanged operations and state handling                                   |
| Validation Checkpoint   | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check`                                                                                                    |
| Commit Checkpoint       | Authorized after validation with only admin/operator workflow source, test, CSS, and plan status files                                                                                  |

Implementation notes:

- Keep localization messages as display content; branch on status, message keys, route context, typed fields, and endpoint context.
- Preserve read-only operator behavior.

### Task 5: Account And Session Copy

| Field                   | Value                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Waiting                                                                                                                                                                                 |
| Goal                    | Keep login providers metadata-driven, make logout/account preference flows understandable, and reduce technical labels in primary UI                                                    |
| Owned Files Or Packages | `src/App.tsx`, `src/account/AccountProfile.tsx`, `src/api/session.test.ts`, `src/api/session.ts` only if helper coverage requires it, matching app/account tests, focused CSS selectors |
| Read-Only Context       | `docs/backend/`, `docs/DESIGN.md`, `ROADMAP.md` `E-AUTH-001`, output from Tasks 1 and 2                                                                                                 |
| Behavior To Preserve    | Login links from `loginProviders[]` `authorizationPath`, no invented login entry point, logout metadata, account path metadata, CSRF handling                                           |
| Deliverables            | Clearer account/session copy and controls, route/component coverage for session controls, login provider rendering, logout, and preference updates                                      |
| Validation Checkpoint   | `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `git diff --check`                                                                                                    |
| Commit Checkpoint       | Authorized after validation with only account/session source, test, CSS, and plan status files                                                                                          |

Implementation notes:

- Do not hard-code provider paths or provider-specific OAuth behavior.
- Keep diagnostics reachable when useful, but secondary to everyday account and session actions.

### Task 6: Final Review And Milestone Closeout

| Field                   | Value                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                  | Waiting                                                                                                                                          |
| Goal                    | Confirm `M-WORKFLOW-001` acceptance criteria, owner alignment, validation evidence, and remaining smoke or quality-gate risks                    |
| Owned Files Or Packages | `.agents/plans/PLAN_workflow_polish.md`, `ROADMAP.md` if milestone status changes, docs only if durable rules need owner updates                 |
| Read-Only Context       | Full diff from Tasks 1-5, `docs/DESIGN.md`, `docs/specs/`, focused references, validation logs                                                   |
| Behavior To Preserve    | Completed workflow behavior, stable IDs, archived and active roadmap boundaries, backend contract invariants                                     |
| Deliverables            | Plan validation results, readiness for archive or next milestone handoff, roadmap status update only when implementation is actually complete    |
| Validation Checkpoint   | Full baseline plus any targeted route tests rerun after integration; `npm run lint:markdown` and `git diff --check` for docs-only closeout edits |
| Commit Checkpoint       | Authorized after validation with only plan, roadmap, and narrowly scoped owner-doc closeout files                                                |

Implementation notes:

- Do not mark `M-WORKFLOW-001` done until implementation and required validation have landed.
- Move completed milestone summaries to `docs/ROADMAP_ARCHIVE.md` only when the roadmap archive procedure is selected.

## Blockers And Replan Triggers

| Trigger Or Blocker                                          | Response                                                                                                                       | Owner       | Status |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------ |
| `M-UI-001` is not complete                                  | Keep this plan `Waiting`; do not start Task 1                                                                                  | Coordinator | Open   |
| `M-UI-001` changes route ownership or shell assumptions     | Update this plan before execution                                                                                              | Coordinator | Open   |
| Backend contract conflict appears                           | Follow `docs/backend/README.md`; do not change API-facing behavior from this plan alone                                        | Coordinator | Open   |
| A route behavior is too broad for roadmap plus design owner | Add or update a focused `docs/specs/` file before implementation continues                                                     | Coordinator | Open   |
| Unexpected dirty changes appear inside assigned write scope | Stop and report the files, scope impact, and proposed next action                                                              | Worker      | Open   |
| Implementation requires editing outside assigned scope      | Stop and replan or assign a new scoped worker                                                                                  | Coordinator | Open   |
| Durable rule would live only in this plan                   | Move the rule to its owner document, contract, test, focused reference, roadmap row, or source file before calling it complete | Coordinator | Open   |
| Browser review exposes a repeatable smoke gap               | Route the gap to `M-SMOKE-001` or `M-QUALITY-001` instead of promoting a new gate in this milestone                            | Coordinator | Open   |

## Validation Plan

Required validation for source implementation slices:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Required validation for docs-only plan or roadmap status edits:

```powershell
npm run lint:markdown
git diff --check
```

Additional validation:

- Run targeted route/component tests during each slice when they provide faster feedback, then run the full baseline before the slice checkpoint.
- Use local browser review through the in-app Browser for materially changed visual hierarchy or workflow layout when a dev server is available; record the URL and routes reviewed. This is review evidence, not canonical `M-SMOKE-001` smoke evidence.
- Use `npm run dev:mock` for frontend-only layout and interaction review when the live sibling backend is not needed.

Skipped validation must be reported with reasons, including any environment mismatch from the Node or npm versions required in `package.json`.

## Review Expectations

- Review for documentation and owner drift before every handoff.
- Review for backend contract drift when API-facing wording, client code, generated types, auth/session/CSRF handling, localization, pagination, repeated filters, or update behavior changes.
- Review for security risk if auth, session, CSRF, permissions, headers, cookies, or transport assumptions change beyond restating existing invariants.
- Review CSS/layout changes for overlap, text fit, focus visibility, dense scanning, and mobile/desktop coherence.
- Findings must be fixed, delegated, or recorded with owner and risk before calling a slice complete.

## Handoff Expectations

Each worker report must include:

- changed files
- confirmation that files outside the assigned write scope were not edited
- validation run and result
- skipped validation with reasons
- whether `ROADMAP.md` changed and which stable IDs or references changed
- whether obsolete roadmap sections were recreated
- remaining risks, contradictions, smoke gaps, contract gaps, or owner-drift concerns

Final handoff must include:

- all changed files
- validation commands and results
- skipped checks and reasons
- roadmap changes by stable ID
- confirmation obsolete roadmap sections were not recreated
- remaining risks or blocked follow-up work

After resume, compaction, or summarized handoff, reread the latest user request, `AGENTS.md`, this plan, and the next slice's governing owner before continuing.

## Validation Results

| Date       | Command                 | Scope                          | Result | Notes                       |
| ---------- | ----------------------- | ------------------------------ | ------ | --------------------------- |
| 2026-06-07 | `npm run lint:markdown` | Plan and roadmap documentation | Passed | Plan authoring validation   |
| 2026-06-07 | `git diff --check`      | Plan and roadmap documentation | Passed | Whitespace validation check |
