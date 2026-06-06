# Plan: Admin And Operator Specs

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to make the next plan after account profile/language milestones |
| Generation Context | `ROADMAP.md`, `.agents/plans/PLAN_account_profile_language.md`, imported backend contract guidance, and backend `.agents/plans/PLAN_TEMPLATE.md` |

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
| Accepted Fallbacks | Author small specs before any admin/operator implementation |
| Ready For Execution | No |
| Last Updated | 2026-06-07 |

## Linked Pre-Planning Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Selected admin/operator milestone scope | Current |
| Prior plan | `.agents/plans/PLAN_account_profile_language.md` | Dependency owner for account/CSRF foundation | Dependency Gated |
| Backend contract | `docs/backend/` | API contract and frontend integration invariants | Current |

## Summary

- Produce the small specs required before implementing admin/operator milestones
  M8-M11.
- Use one delegated worker/subagent per spec.
- Commit after each spec.
- Keep this plan limited to specification and planning artifacts; implementation plans
  come after these specs are accepted.

Success is measured by one accepted spec per admin/operator milestone, specs linked
from their implementation owners, docs validation passing, and progress recorded in
this plan.

## Scope

- In scope:
  - M8 Admin Catalog Management spec for combined books/categories.
  - M9 Admin Localization Management spec for message-key editing plus locale
    coverage/status.
  - M10 Operator Audit Surface spec for read-only operator overview plus pageable
    audit log.
  - M11 Admin User Management spec for user list/detail plus role management.
  - Orchestrator progress tracking in this plan.
- Out of scope:
  - Implementing admin/operator UI.
  - Changing imported backend contracts.
  - Adding new backend endpoints or request fields.
  - Broad design-system work not tied to the specific specs.

## Current State

- This plan is dependency-gated.
- `ROADMAP.md` says admin/operator workflows must stay inside selected milestone and
  spec scope.
- M8, M9, and M11 should wait until M7 proves authenticated unsafe-write CSRF
  handling.
- M10 is read-only and can be specified after M5 route/access foundations, but this
  plan keeps all admin/operator specs grouped for one coordinated pass.

## Dependency Gates

| Gate | Required Before Execution | Owner | Status | Evidence |
| --- | --- | --- | --- | --- |
| G1 | M7 Account Language Preference is committed and validated | Account profile/language plan orchestrator | Pending | M7 commit hash and validation recorded in `.agents/plans/PLAN_account_profile_language.md` |
| G2 | Account/auth/CSRF implementation patterns are documented in handoff notes | Account profile/language plan orchestrator | Pending | M7 handoff notes identify API helpers, CSRF helper, and route/access patterns |
| G3 | Coordinator updates this plan from `Dependency Gated` to `Ready` | Coordinator | Pending | Planning Readiness says `Ready For Execution: Yes` |

## Follow-On Readiness

### Becomes Ready After Current Plan

- M8 implementation becomes ready to plan after `docs/specs/SPEC_admin_catalog_management.md` is accepted.
- M9 implementation becomes ready to plan after `docs/specs/SPEC_admin_localization_management.md` is accepted.
- M10 implementation becomes ready to plan after `docs/specs/SPEC_operator_audit_surface.md` is accepted.
- M11 implementation becomes ready to plan after `docs/specs/SPEC_admin_user_management.md` is accepted.

| Milestone | Dependency In This Plan | Expected Readiness After This Plan | Notes |
| --- | --- | --- | --- |
| M8 - Admin Catalog Management | Admin catalog spec | Ready for implementation planning | Combined books/categories; must include CSRF mutation cases. |
| M9 - Admin Localization Management | Admin localization spec | Ready for implementation planning | Message editing plus coverage/status; must include localized failure cases. |
| M10 - Operator Audit Surface | Operator audit spec | Ready for implementation planning | Read-only surface; no mutation helper needed. |
| M11 - Admin User Management | Admin user management spec | Ready for implementation planning | User list/detail plus role replacement; must include operator reason and CSRF cases. |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | M7 is not complete yet | Specs should align with the implemented auth/CSRF helper and route-access patterns | Coordinator | Dependency Gated | Wait for G1-G3 | Yes |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M8 is combined book/category admin management | User / `ROADMAP.md` | 2026-06-07 | Admin catalog scope changes |
| D2 | M9 includes both message-key editing and locale coverage/status | User / `ROADMAP.md` | 2026-06-07 | Localization scope changes |
| D3 | M10 is read-only operator overview plus pageable audit log | User / `ROADMAP.md` | 2026-06-07 | Operator scope changes |
| D4 | M11 is user list/detail plus contract-backed role management | User / `ROADMAP.md` | 2026-06-07 | User-management scope changes |
| D5 | Each admin/operator milestone gets a separate small spec before implementation | `ROADMAP.md` Roadmap Rules and Deferred Scope | 2026-06-07 | Repository planning policy changes |

## Execution Shape And Shared Files

- Recommended shape: `M3: parallel` as a coordinated spec fanout with serial
  integration commits if needed.
- Use one subagent per spec:
  - M8 spec worker.
  - M9 spec worker.
  - M10 spec worker.
  - M11 spec worker.
- Coordinator owns this plan and final spec consistency review.
- Workers may create or edit only their assigned spec file unless the coordinator
  explicitly allows shared index updates.
- Coordinator updates cross-links after all specs are present.

## Affected Artifacts

- `docs/specs/SPEC_admin_catalog_management.md`
- `docs/specs/SPEC_admin_localization_management.md`
- `docs/specs/SPEC_operator_audit_surface.md`
- `docs/specs/SPEC_admin_user_management.md`
- This plan file.
- Optional spec index files if the repository has or later adds them.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Coordinator dependency gate | Not Started | Coordinator | Pending | Pending | Confirm G1-G3 before spec workers start |
| 1: M8 Admin Catalog Spec | Not Started | M8 spec subagent | Pending | Pending | Write combined book/category admin spec and commit |
| 2: M9 Admin Localization Spec | Not Started | M9 spec subagent | Pending | Pending | Write localization editing plus coverage/status spec and commit |
| 3: M10 Operator Audit Spec | Not Started | M10 spec subagent | Pending | Pending | Write read-only operator/audit spec and commit |
| 4: M11 Admin User Management Spec | Not Started | M11 spec subagent | Pending | Pending | Write user list/detail plus role management spec and commit |
| 5: Final spec consistency review | Not Started | Coordinator | Pending | Pending | Review cross-spec consistency and summarize next implementation plans |

## Execution Tasks

### Task 0: Coordinator Dependency Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Confirm this spec plan is ready to execute |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `.agents/plans/PLAN_account_profile_language.md`, `ROADMAP.md`, `git log` |
| Behavior To Preserve | Do not start admin/operator specs until account/auth/CSRF patterns are known |
| Deliverables | Gates G1-G3 marked resolved; Planning Readiness updated to ready |
| Validation Checkpoint | Inspect prior-plan progress tracker and commit history |
| Commit Checkpoint | Commit this plan readiness update before worker handoff |

### Task 1: M8 Admin Catalog Spec

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Specify combined admin book/category management |
| Owned Files Or Packages | `docs/specs/SPEC_admin_catalog_management.md` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M8, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, M7 CSRF helper handoff |
| Behavior To Preserve | Include book `version` on updates; preserve backend pagination/filter conventions; do not invent endpoints |
| Deliverables | Spec covering list, create, update, delete, category-in-use, stale book version, localized errors, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optionally markdown/spec lint if available |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 2: M9 Admin Localization Spec

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Specify localization message editing plus locale coverage/status |
| Owned Files Or Packages | `docs/specs/SPEC_admin_localization_management.md` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M9, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, M7 CSRF helper handoff |
| Behavior To Preserve | Treat localized messages as display content; branch on stable fields and status, not English message text |
| Deliverables | Spec covering supported locales, message-key editing, coverage/status states, localized failures, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optionally markdown/spec lint if available |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 3: M10 Operator Audit Spec

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Specify read-only operator overview plus pageable audit log |
| Owned Files Or Packages | `docs/specs/SPEC_operator_audit_surface.md` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M10, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, M5 route/access handoff |
| Behavior To Preserve | Keep surface read-only; preserve audit filters for target type, action, actor, page, size, and repeated sort |
| Deliverables | Spec covering overview, runtime/status summaries, recent audit entries, filtered pageable audit rows, details panel, access, partial payloads, and tests |
| Validation Checkpoint | `git diff --check`; optionally markdown/spec lint if available |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 4: M11 Admin User Management Spec

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Specify admin user list/detail plus role management |
| Owned Files Or Packages | `docs/specs/SPEC_admin_user_management.md` |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M11, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, M7 CSRF helper handoff |
| Behavior To Preserve | Preserve contract-backed role replacement; require operator reason; do not invent enable/disable/delete behavior |
| Deliverables | Spec covering user list/detail, roles, role-grant provenance, role replacement, validation failures, localized errors, CSRF, access, and tests |
| Validation Checkpoint | `git diff --check`; optionally markdown/spec lint if available |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 5: Final Spec Consistency Review

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Review all admin/operator specs together and prepare implementation planning |
| Owned Files Or Packages | This plan and optional spec index updates |
| Coordinator-Owned Shared Files | This plan |
| Context Required | All four specs and `ROADMAP.md` |
| Behavior To Preserve | Specs must not contradict backend contract artifacts |
| Deliverables | Progress tracker updated; next implementation-plan order recommended |
| Validation Checkpoint | `git diff --check`; optionally full docs checks if available |
| Commit Checkpoint | Commit final plan progress update if progress tracking is persisted in git |

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| M7 does not establish a usable CSRF mutation pattern | Keep M8/M9/M11 spec work gated or write specs with explicit implementation blocker | Coordinator | Open |
| Backend contract lacks an endpoint needed by a proposed spec behavior | Remove that behavior from the spec or refresh/import backend contract before proceeding | Spec worker / Coordinator | Open |
| A spec grows too broad for one milestone | Split the spec and update `ROADMAP.md` before implementation planning | Coordinator | Open |
| Specs disagree on shared admin layout/access patterns | Coordinator reconciles shared assumptions before implementation plans are created | Coordinator | Open |

## Edge Cases And Failure Modes

- Specs must not duplicate durable endpoint schemas from `docs/backend/`; link to the
  contract owner instead.
- Specs must include unauthenticated and forbidden states for protected surfaces.
- Mutation specs must include CSRF-missing/invalid behavior without assuming English
  error text.
- Read-only operator audit work must not accidentally add mutation requirements.

## Validation Plan

- Each spec worker runs:
  - `git diff --check`
  - any available markdown/spec lint command, if one exists at execution time
- Coordinator repeats docs validation after all specs.
- No npm validation is required for spec-only changes unless package/source files are
  touched.

## Verification Strategy

- Contract review against `docs/backend/approved-openapi.json`.
- Frontend integration invariant review against `docs/backend/FRONTEND_AI_CONTRACT.md`.
- Cross-spec review for access, CSRF, localized error, loading, empty, and validation
  state consistency.

## Better Engineering Notes

- Keep this as a specification plan. Do not implement admin/operator UI here.
- Prefer smaller implementation plans per admin/operator milestone after specs are
  accepted.
- If multiple specs identify the same shared admin shell need, create a separate
  prerequisite plan instead of hiding it inside the first implementation milestone.

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-07 | Pending | Dependency gates | Pending | Coordinator records result |
| 2026-06-07 | Pending | M8 spec | Pending | Worker records result |
| 2026-06-07 | Pending | M9 spec | Pending | Worker records result |
| 2026-06-07 | Pending | M10 spec | Pending | Worker records result |
| 2026-06-07 | Pending | M11 spec | Pending | Worker records result |
| 2026-06-07 | Pending | Final spec review | Pending | Coordinator records result |

## User Validation

- Review each spec for intended workflow and acceptance criteria before implementation
  planning.
- Confirm implementation order after specs are accepted.
