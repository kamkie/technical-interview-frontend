# Plan: Account Profile And Language Milestones

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to make the next plan after follow-on catalog/auth milestones |
| Generation Context | `ROADMAP.md`, `.agents/plans/PLAN_follow_on_catalog_auth.md`, imported backend contract guidance, and backend `.agents/plans/PLAN_TEMPLATE.md` |

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
| Accepted Fallbacks | Keep profile read-only and language preference as the first self-service mutation |
| Ready For Execution | No |
| Last Updated | 2026-06-07 |

## Linked Pre-Planning Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Roadmap | `ROADMAP.md` | Selected milestones, implementation defaults, and deferred scope | Current |
| Prior plan | `.agents/plans/PLAN_follow_on_catalog_auth.md` | Dependency owner for M5 authenticated session UX | Dependency Gated |
| Backend contract | `docs/backend/` | API contract and frontend integration invariants | Current |

## Summary

- Implement the account milestones that become practical after authenticated session
  UX exists: M6 Account Profile Surface and M7 Account Language Preference.
- Use one delegated worker/subagent per milestone.
- Commit after each milestone.
- Sequence M6 before M7 so language preference can reuse the account/profile state,
  protected-route behavior, and shared session context from M6.

Success is measured by dependency gates being satisfied, passing validation, one clean
commit per milestone, and an updated progress tracker with commit hashes and risks.

## Scope

- In scope:
  - M6 read-only account profile page plus account-aware menu/header.
  - M7 current-user language preference update/clear flow backed by
    `PUT /api/account/language`.
  - Minimal shared unsafe-write helper only if needed for M7 CSRF handling.
  - Orchestrator progress tracking in this plan.
- Out of scope:
  - M5 authenticated session UX; it belongs to
    `.agents/plans/PLAN_follow_on_catalog_auth.md`.
  - Admin/operator work.
  - Additional account self-service actions beyond preferred language.
  - Backend repository changes.

## Current State

- This plan is dependency-gated.
- M6 depends on M5 authenticated session UX, account-aware header/state, and route
  guard infrastructure.
- M7 depends on M6 account state plus proven CSRF/session handling for unsafe writes.
- Browser traffic must remain same-origin `/api/**`.

## Dependency Gates

| Gate | Required Before Execution | Owner | Status | Evidence |
| --- | --- | --- | --- | --- |
| G1 | M5 Authenticated Session UX is committed and validated | Follow-on catalog/auth plan orchestrator | Pending | M5 commit hash and validation recorded in `.agents/plans/PLAN_follow_on_catalog_auth.md` |
| G2 | M5 exposes reusable session/auth state suitable for account profile routes | Follow-on catalog/auth plan orchestrator | Pending | M5 handoff notes identify session state API/components |
| G3 | Coordinator updates this plan from `Dependency Gated` to `Ready` | Coordinator | Pending | Planning Readiness says `Ready For Execution: Yes` |

## Follow-On Readiness

### Becomes Ready After Current Plan

- M8 Admin Catalog Management becomes ready to spec after M7 proves authenticated
  unsafe-write CSRF handling.
- M9 Admin Localization Management becomes ready to spec after M7 proves
  authenticated unsafe-write CSRF handling.
- M10 Operator Audit Surface can be planned after M5, but should still get its small
  read-only operator/audit spec before implementation.
- M11 Admin User Management becomes ready to spec after M7 proves role-changing CSRF
  mutation patterns.

| Milestone | Dependency In This Plan | Expected Readiness After This Plan | Notes |
| --- | --- | --- | --- |
| M8 - Admin Catalog Management | M7 - Account Language Preference | Ready to spec, not directly implement | Needs a small admin catalog spec for combined books/categories. |
| M9 - Admin Localization Management | M7 - Account Language Preference | Ready to spec, not directly implement | Needs a small localization admin spec for editing plus coverage/status. |
| M10 - Operator Audit Surface | M6 - Account Profile Surface / M5 route access | Ready to spec earlier, but still separate | Read-only surface; no mutation helper required. |
| M11 - Admin User Management | M7 - Account Language Preference | Ready to spec, not directly implement | Needs a small user-management spec for list/detail plus role replacement. |

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | M5 is not complete yet | M6 and M7 rely on authenticated session UX and route guards | Coordinator | Dependency Gated | Wait for G1-G3 | Yes |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | M6 is read-only account profile plus account-aware menu/header | User / `ROADMAP.md` | 2026-06-06 | Account scope changes |
| D2 | M7 is account language preference, not broader self-service | User / `ROADMAP.md` | 2026-06-06 | New account self-service endpoint is selected |
| D3 | M7 uses `PUT /api/account/language` and `UserAccountLanguageRequest.preferredLanguage` from the imported contract | `docs/backend/approved-openapi.json` / generated types | 2026-06-06 | Backend contract changes |
| D4 | M7 can introduce a minimal shared mutation helper if M5 did not already add one | Agent planning decision | 2026-06-07 | Shared API client architecture changes |

## Execution Shape And Shared Files

- Recommended shape: `M2: delegated` with serial workers.
- One subagent owns M6 and one subagent owns M7.
- Workers run one at a time on the same branch:
  - M6 worker first.
  - Coordinator gate.
  - M7 worker second.
  - Coordinator final integration validation.
- Coordinator owns this plan and final cross-milestone validation.
- Shared-file rules:
  - M6 may edit account/profile components, route definitions, app shell/header,
    session context consumers, and account read client/tests.
  - M7 may edit account language preference components, account API client helpers,
    CSRF/mutation helper code, and tests.
  - If either worker needs admin/operator files, stop and return to the coordinator.

## Affected Artifacts

- Account route/page/components.
- App shell/header/menu components.
- `src/api/session.ts` if session-state helpers need small extensions.
- New account API client files for `GET /api/account` and `PUT /api/account/language`.
- Account/profile and language preference tests.
- `src/index.css`.
- Test fixtures for authenticated account states and localized errors.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Coordinator dependency gate | Not Started | Coordinator | Pending | Pending | Confirm G1-G3 before execution |
| 1: M6 Account Profile Surface | Not Started | M6 subagent | Pending | Pending | Add read-only account profile/header behavior and commit |
| 2: Coordinator M6 gate | Not Started | Coordinator | Pending | Pending | Verify M6 commit before M7 handoff |
| 3: M7 Account Language Preference | Not Started | M7 subagent | Pending | Pending | Add language preference mutation flow and commit |
| 4: Final integration validation | Not Started | Coordinator | Pending | Pending | Run full validation and summarize commits |

## Execution Tasks

### Task 0: Coordinator Dependency Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Confirm this plan is ready to execute |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `.agents/plans/PLAN_follow_on_catalog_auth.md`, `ROADMAP.md`, `git log` |
| Behavior To Preserve | Do not start M6 or M7 until M5 is committed and validated |
| Deliverables | Gates G1-G3 marked resolved; Planning Readiness updated to ready |
| Validation Checkpoint | Inspect prior-plan progress tracker and commit history |
| Commit Checkpoint | Commit this plan readiness update before worker handoff |

### Task 1: M6 Account Profile Surface

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add read-only current-account profile page plus account-aware menu/header |
| Owned Files Or Packages | Account components/routes/tests, app shell/header/menu, account read API client |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M6, `docs/backend/FRONTEND_AI_CONTRACT.md`, M5 session UX implementation |
| Behavior To Preserve | Call `GET /api/account` only after session establishes authenticated state; keep login/logout metadata-driven |
| Deliverables | Protected account route/page; account-aware header/menu; loading/error/unauthenticated/authenticated tests; no account mutations |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 2: Coordinator M6 Gate

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M6 commit before M7 worker starts |
| Owned Files Or Packages | This plan |
| Coordinator-Owned Shared Files | This plan |
| Context Required | Git log/diff for the M6 commit |
| Behavior To Preserve | M6 should remain read-only and should not implement language updates |
| Deliverables | Progress Tracker updated with M6 status, commit, validation, and notes |
| Validation Checkpoint | Inspect M6 diff; rerun targeted or full validation if needed |
| Commit Checkpoint | Commit plan update only if the orchestrator chooses to persist progress after each gate |

### Task 3: M7 Account Language Preference

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add current-user preferred-language update and clear flow |
| Owned Files Or Packages | Account language preference components/tests, account API client, CSRF/mutation helper if needed |
| Coordinator-Owned Shared Files | This plan |
| Context Required | `AGENTS.md`, `ROADMAP.md` M7, `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, M5/M6 implementations |
| Behavior To Preserve | Use session metadata for CSRF header name/cookie name; branch on stable fields and status, not localized English text |
| Deliverables | Preferred-language display/edit/clear UI; `PUT /api/account/language` client; account state refresh from returned account response; tests for loading, success, validation/error, unauthenticated, missing-CSRF, and localized errors |
| Validation Checkpoint | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`; browser smoke/e2e only if a canonical command exists |
| Commit Checkpoint | Commit message using `.gitmessage` format; record hash in Progress Tracker |

### Task 4: Final Integration Validation

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Verify M6 and M7 together and produce handoff |
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
| M5 does not provide reusable authenticated route/session state | Keep this plan gated and revise M6 after M5 is complete | Coordinator | Open |
| Backend contract changes account language endpoint shape | Refresh contract artifacts and regenerate API types before implementation | Coordinator | Open |
| CSRF helper design becomes broader than M7 needs | Stop and split shared mutation client into a focused prerequisite task | M7 subagent | Open |
| M6 needs account mutation behavior | Defer mutation to M7 or later self-service milestone | M6 subagent | Open |
| Validation fails after a milestone commit | Fix within that milestone scope or return to coordinator for replan | Responsible subagent / Coordinator | Open |

## Edge Cases And Failure Modes

- Account reads must not run before session state confirms authentication.
- Missing or stale sessions should show authenticated-area fallback behavior, not
  throw.
- Preferred-language clear behavior must send the contract-supported empty/null
  preference shape selected during implementation.
- Missing readable CSRF cookie should be handled as a user-visible write failure state.
- Localized backend messages are display content only.

## Validation Plan

- M6 and M7 workers each run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Coordinator repeats full validation after M7.
- Browser smoke/e2e runs only if a canonical command exists; otherwise record why it
  remains manual or skipped.

## Verification Strategy

- Component/unit tests cover account profile states, route access, and header/menu
  behavior.
- API/client tests cover account read and account language update/clear behavior.
- CSRF tests cover configured header/cookie metadata and missing-token behavior.
- Typecheck includes OpenAPI generated type freshness through `api:types:check`.
- Build verifies Vite output after route/account UI changes.

## Better Engineering Notes

- Keep M6 read-only.
- Keep M7 limited to preferred language.
- Do not add admin/operator surfaces in this plan.
- If a broader account settings page emerges, split it into a later milestone instead
  of expanding M7.
- Next plan file: `.agents/plans/PLAN_admin_operator_specs.md`.

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-07 | Pending | Dependency gates | Pending | Coordinator records result |
| 2026-06-07 | Pending | M6 | Pending | Worker records result |
| 2026-06-07 | Pending | M7 | Pending | Worker records result |
| 2026-06-07 | Pending | Final integration | Pending | Coordinator records result |

## User Validation

- Sign in through the documented local auth workflow.
- Open the account profile route and verify current account fields render.
- Change the preferred language, confirm success, then clear it and confirm the
  account state updates.
- Verify logout/expired-session behavior returns the account area to its protected
  fallback state.
