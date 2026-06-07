# Plan: [Plan Title]

## Provenance

| Field              | Value                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Plan ID            | `[PLAN-short-kebab-slug]`                                                                                                           |
| Created By         | [Agent or person]                                                                                                                   |
| Created On         | [YYYY-MM-DD]                                                                                                                        |
| Source Request     | [Short description or link to request]                                                                                              |
| Generation Context | [AGENTS.md, ROADMAP.md stable IDs, docs/specs, backend contract artifacts, focused references, or other source artifacts consulted] |

## Lifecycle

| Field         | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Phase         | [Planning / Execution / Review / Complete]               |
| Status        | [Ready / Waiting / Blocked / Complete]                   |
| Current Slice | [Next executable milestone, spec, task, or worker slice] |
| Last Updated  | [YYYY-MM-DD]                                             |

## Planning Readiness

| Field                                      | Value                                                       |
| ------------------------------------------ | ----------------------------------------------------------- |
| Objective Clear Enough To Test Or Document | [Yes / No]                                                  |
| Decision Complete                          | [Yes / No]                                                  |
| Blocking Open Questions                    | [None or list IDs]                                          |
| Accepted Fallbacks                         | [Fallbacks selected from existing owner documents, or None] |
| Ready For Execution                        | [Yes / No]                                                  |

Use `Ready` only when the slice can be assigned from the current repository state. Use `Waiting` for normal predecessor dependency. Use `Blocked` only for unresolved product choices, backend contract conflicts, credentials, thresholds, failure owners, explicit user acceptance gates, or external state the plan cannot produce.

## Linked And Source Artifacts

| Artifact           | Path                           | Role                                                                                                                          | Status                                     |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Root AI rules      | `AGENTS.md`                    | Implementation authorization, dirty-worktree protection, backend contract invariants, delegation, validation, and git handoff | [Current / Needs update / Read-only]       |
| Roadmap            | `ROADMAP.md`                   | Selected scope, stable IDs, status, dependencies, blocked backlog, release context, and product non-goals                     | [Current / Needs update / Read-only]       |
| Design owner       | `docs/DESIGN.md`               | Durable frontend product and design intent                                                                                    | [Current / Needs update / Not applicable]  |
| Backend contract   | `docs/backend/`                | API behavior truth for endpoint, auth, CSRF, pagination, repeated filters, localization, and generated type work              | [Current / Needs refresh / Not applicable] |
| Focused references | `.agents/references/[file].md` | Procedure owner for [planning / execution / testing / reviews / documentation / other]                                        | [Current / Needs update / Read-only]       |
| Specs or tests     | `[path]`                       | Executable or documented owner for changed behavior                                                                           | [Current / Needs update / Not applicable]  |

## Summary

[Briefly state the intended outcome, user-visible behavior or repository rule being changed, and why this plan exists.]

Durable rules discovered during execution must move to the owning backend contract artifact, executable test, human doc, design guide, roadmap row, focused reference, or source file before this plan is complete.

## Scope

In scope:

- [Selected milestone, spec, task, documentation, or implementation slice]
- [Files or package areas workers may edit]
- [Validation and review evidence required]

Out of scope:

- [Explicit non-goal]
- [Files or behaviors workers must not edit]
- Generic command wrappers, broad workflow-state directories, context buses, or other reusable scaffolding unless this plan explicitly selects a concrete need and owner.

## Contract And Repository Invariants

- Preserve backend contract invariants: same-origin `/api/**`, session-cookie auth, `GET /api/session`, login providers from `loginProviders[]`, session metadata for account/logout/CSRF names, CSRF header mirroring for unsafe writes with a real current session, localized messages as display content, stable-field branching, Spring pagination, repeated filters, and book `version` on updates.
- Do not invent endpoints, request fields, authentication headers, CORS-first behavior, JWT or bearer-token assumptions, alternate transports, or provider-specific OAuth paths.
- Confirm implementation authorization before changing repository state unless this active plan and current user request explicitly authorize the scoped work.
- Run `git status --short` before editing and treat existing or unexpected changes as user-owned.
- Assign explicit write scopes to workers and keep unrelated user or parallel-worker changes intact.
- Commit only when the current request and plan checkpoint authorize it, and keep unrelated files out of the checkpoint commit.

## Decisions, Open Questions, And Assumptions

| ID  | Type       | Item            | Owner   | Status            | Fallback Or Decision | Blocks Ready? |
| --- | ---------- | --------------- | ------- | ----------------- | -------------------- | ------------- |
| D1  | Decision   | [Decision made] | [Owner] | [Accepted]        | [Result]             | No            |
| Q1  | Question   | [Open question] | [Owner] | [Open / Answered] | [Fallback if any]    | [Yes / No]    |
| A1  | Assumption | [Assumption]    | [Owner] | [Active]          | [Revisit trigger]    | No            |

## Execution Shape And Ownership

- Coordinator owns plan sequencing, dirty-worktree protection, shared-file assignment, worker prompts, review, validation reporting, and plan-authorized commits.
- Planning workers return objective, source documents, ownership, implementation steps, validation, risks, open questions, and non-goals.
- Implementation workers edit only assigned files, preserve user-owned changes, run scoped validation, and report changed files, validation, skipped checks, and remaining risks.
- Reviewers check for owner drift, backend contract drift, documentation drift, security risk, missing validation, and scope leaks.
- Shared files are coordinator-owned unless assigned to one worker at a time.
- Every repository-changing task should include a commit checkpoint after that task's validation; read-only or no-change tasks should state that no commit is needed.

## Progress Tracker

| Slice              | Status                                 | Owner                  | Depends On            | Last Updated | Notes        |
| ------------------ | -------------------------------------- | ---------------------- | --------------------- | ------------ | ------------ |
| [Slice ID or name] | [Ready / Waiting / Blocked / Complete] | [Coordinator / worker] | [None or predecessor] | [YYYY-MM-DD] | [Short note] |

## Plan Tasks

### Task 1: [Task Name]

| Field                   | Value                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Status                  | [Ready / Waiting / Blocked / Complete]                                                             |
| Goal                    | [Outcome]                                                                                          |
| Owned Files Or Packages | `[exact write scope]`                                                                              |
| Read-Only Context       | `[files workers may consult but must not edit]`                                                    |
| Behavior To Preserve    | [Backend contract, user-visible behavior, repository rule, or non-goal]                            |
| Deliverables            | [Concrete output]                                                                                  |
| Validation Checkpoint   | `[command]` or [manual review]                                                                     |
| Commit Checkpoint       | [Authorized after validation with files listed / No commit needed for read-only or no-change task] |

Implementation notes:

- [Narrow implementation note, if needed]
- [Stop condition, if needed]

## Blockers And Replan Triggers

| Trigger Or Blocker                                          | Response                                                                                                                | Owner               | Status |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| Backend contract conflict appears                           | Inspect or refresh imported backend artifacts only if API-facing behavior is changing; otherwise record as out of scope | [Coordinator]       | [Open] |
| Unexpected dirty changes appear inside assigned write scope | Stop and report changed files, scope impact, and proposed next action                                                   | [Worker]            | [Open] |
| Work requires edits outside assigned scope                  | Stop and replan or assign a new scoped worker                                                                           | [Coordinator]       | [Open] |
| Durable rule would live only in this plan                   | Move the rule to its owner document, contract, test, reference, roadmap row, or source file before completion           | [Coordinator]       | [Open] |
| Validation failure is routine and scoped                    | Fix, reassign, or record according to the task; do not treat it as a user blocker by default                            | [Responsible owner] | [Open] |

## Validation Plan

Required validation:

```powershell
[smallest relevant command]
```

Additional validation, if selected:

- [Command or manual review]
- [Browser, smoke, route, component, contract, typecheck, lint, build, or release check]

Skipped validation must be reported with reasons. Broader npm commands are not required unless the plan changes package scripts, source code, generated files, tests, workflow YAML, or behavior that those checks protect.

## Review Expectations

- Review for documentation and owner drift before handoff.
- Review for backend contract drift if API-facing wording, client code, generated types, auth/session/CSRF handling, localization, pagination, filters, or update behavior changes.
- Security review is required when auth, session, CSRF, permissions, headers, cookies, or transport assumptions change beyond restating existing invariants.
- Findings must be fixed, delegated, or recorded with owner and risk before calling the plan complete.

## Handoff Expectations

Each worker report must include:

- changed files
- confirmation that files outside the assigned write scope were not edited
- validation run and result
- skipped validation with reasons
- whether `ROADMAP.md` was edited and which stable IDs or references changed
- whether obsolete roadmap sections were recreated
- remaining risks, contradictions, smoke gaps, contract gaps, or owner-drift concerns

Final handoff must include:

- all changed files
- validation commands and results
- skipped checks and reasons
- roadmap changes by stable ID, or confirmation `ROADMAP.md` was not edited
- confirmation obsolete roadmap sections were not recreated
- remaining risks or blocked follow-up work

## Validation Results

| Date         | Command     | Scope               | Result                      | Notes   |
| ------------ | ----------- | ------------------- | --------------------------- | ------- |
| [YYYY-MM-DD] | `[command]` | [Files or behavior] | [Passed / Failed / Skipped] | [Notes] |
