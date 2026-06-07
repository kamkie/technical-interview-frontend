# Plan: Frontend AI Guidance And Design Alignment

## Provenance

| Field              | Value                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Created By         | Codex                                                                                                                                                                                                                                                                                                         |
| Created On         | 2026-06-07                                                                                                                                                                                                                                                                                                    |
| Source Request     | User request to create a plan for bringing frontend AI rules and `docs/DESIGN.md` in line with the working backend guidance model, while keeping mandatory subagent execution                                                                                                                                 |
| Generation Context | `AGENTS.md`, current `ROADMAP.md` milestone hierarchy (`M-UI-001`, `M-WORKFLOW-001`, `M-SMOKE-001`, `M-QUALITY-001`), `.agents/references/*`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, `docs/LOCAL_DEVELOPMENT.md`, backend `AGENTS.md`, and selected backend `.agents/references/*` files |

## Lifecycle

| Status | Current                               |
| ------ | ------------------------------------- |
| Phase  | Archived Completed Guidance Execution |
| Status | Complete; Archived                    |

## Planning Readiness

| Field                   | Value                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Decision Complete       | Yes                                                                                                                               |
| Blocking Open Questions | None                                                                                                                              |
| Accepted Fallbacks      | Keep mandatory planning and implementation subagents; adopt backend-style focused owner guides only where they add frontend value |
| Ready For Execution     | Complete                                                                                                                          |
| Last Updated            | 2026-06-07                                                                                                                        |

## Linked Artifacts

| Artifact                 | Path                                                                             | Role                                                                                                                    | Status                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Root AI rules            | `AGENTS.md`                                                                      | Repository-level AI entry point, backend contract invariants, authorization, dirty-worktree rules, and delegation rules | Completed: compacted and routed to focused owner guides                                                                         |
| Roadmap                  | `ROADMAP.md`                                                                     | Selected and planned frontend scope using stable milestone, epic, task, and plan IDs                                    | Completed: `M-GUIDANCE-001` archived and `M-UI-001` promoted as current priority                                                |
| Human lifecycle guide    | `docs/DEVELOPMENT_LIFECYCLE.md`                                                  | Human-facing artifact routing and lifecycle summary                                                                     | Completed: aligned with `docs/DESIGN.md` routing                                                                                |
| Human AI guide           | `docs/WORKING_WITH_AI.md`                                                        | Human guidance for asking AI agents to plan, implement, validate, and review                                            | Completed: aligned with mandatory-subagent and design-owner guidance                                                            |
| Documentation index      | `docs/README.md`                                                                 | Human-facing documentation owner index                                                                                  | Completed: links to `docs/DESIGN.md`                                                                                            |
| Existing AI references   | `.agents/references/`                                                            | Focused AI procedure references                                                                                         | Completed: execution, workflow, planning, plan-execution, architecture, code-style, troubleshooting, and reference guides added |
| Backend model            | `D:\Projects\demo\technical-interview-demo\AGENTS.md` and `.agents/references/*` | Working comparison source for guidance shape, not content to copy blindly                                               | Consult selectively                                                                                                             |
| Backend contract imports | `docs/backend/`                                                                  | API integration truth for frontend behavior                                                                             | Preserve as authoritative                                                                                                       |

## Summary

Create a frontend-specific guidance system with enough product intent and execution rules for subagents to work reliably. The goal is not to remove subagents. The goal is to make planning and implementation subagents effective by giving them clear intent, ownership boundaries, validation rules, and frontend-specific architecture guidance.

The durable design owner should be `docs/DESIGN.md`. It must match the current selected and planned roadmap work: `M-UI-001: Production UI Foundation`, `M-WORKFLOW-001: Workflow Polish`, `M-SMOKE-001: Responsive Layout And Smoke Evidence`, and the blocked `M-QUALITY-001: Quality Gates`. `ROADMAP.md` should continue to own selection, stable IDs, status, dependencies, release context, blocked backlog, and product non-goals. Design intent belongs in `docs/DESIGN.md`; roadmap items should point to it instead of carrying all product/design rationale inline.

The older roadmap section `## Procedure Adoption Scope` has been obsoleted by the current roadmap structure. This plan must not recreate that section. Procedure work selected by this user request belongs in this active plan and focused owner guides; remaining generic scaffolding, command wrappers, and workflow-state directories stay out unless this plan explicitly selects a minimal version.

## Scope

In scope:

- Create `docs/DESIGN.md` for frontend product and design intent aligned with the current roadmap milestone hierarchy.
- Add missing focused AI reference files so subagents receive concrete execution, workflow, planning, architecture, code-style, troubleshooting, and reference-maintenance rules.
- Rewrite or compact `AGENTS.md` so it routes to focused owner guides while keeping the frontend backend-contract invariants and mandatory ad hoc planning plus implementation subagents.
- Add a reusable active-plan template under `.agents/plans/`.
- Align human-facing docs and AI reference routing with the new design owner.
- Align `.gitmessage` with the backend's newer plan-task metadata shape where useful.
- Align roadmap-related references with the current stable ID model without reintroducing obsolete deferred procedure sections.

Out of scope:

- Implementing the production UI redesign itself.
- Changing frontend runtime behavior, package scripts, dependencies, or generated API types.
- Refreshing backend contract artifacts.
- Copying backend-only Gradle, Flyway, REST Docs, backend operations, or deployment runbook weight into the frontend.
- Rewriting the current roadmap hierarchy or reintroducing the removed `## Procedure Adoption Scope` and `## Smoke And Local Procedure Candidates` sections.
- Moving `M-SMOKE-001` back to deferred status. It is planned waiting work in the current roadmap.

## Current State

- The frontend has Vite, React, TypeScript, Node.js 24.x, npm 11.x, generated OpenAPI types, route/component tests, local auth smoke docs, hardening docs, and release docs.
- The frontend now has `docs/DESIGN.md` as the durable product and design intent owner.
- The active roadmap now uses stable IDs. `M-GUIDANCE-001` is completed and archived; `M-UI-001` is the current ready milestone, `M-WORKFLOW-001` waits on UI foundation, `M-SMOKE-001` waits on workflow polish, and `M-QUALITY-001` is blocked on thresholds, owners, or repeatable evidence.
- Smoke and responsive layout work is no longer a deferred candidate. It is planned waiting work under `M-SMOKE-001`.
- Procedure adoption scope is no longer a standalone roadmap section. Generic planning scaffolds, command wrappers, and workflow-state directories are product non-goals until repeated frontend work proves they are worth the process cost.
- `AGENTS.md` already enforces mandatory planning and implementation subagents for ad hoc implementation work.
- The frontend now has focused AI owner guides for ordinary task execution, workflow/delegation mechanics, plan authoring, plan execution, architecture placement, code-style/edit shape, troubleshooting, and reference-file maintenance.
- The current roadmap structure should be treated as the source of truth for selected/planned/blocked scope.

## Design Contract For `docs/DESIGN.md`

The new design guide should be roadmap-aligned and frontend-specific.

Required sections:

- Product intent: first-party production browser frontend for the sibling backend, not a repository demo shell or marketing landing page.
- Design priorities: contract-first UI, workflow clarity, route context, user-facing session controls, admin/operator separation, dense operational scanning where appropriate, and reduced exposed control clutter.
- Supported experience: public catalog, account/session, admin catalog/users, admin localization, operator/audit surface, theme, and local smoke posture.
- Roadmap-aligned direction:
  - `M-UI-001`: Production UI foundation, including shell/navigation and route context/state basics.
  - `M-WORKFLOW-001`: Workflow polish, including visual hierarchy, state semantics, catalog workflows, admin/operator workflows, and account/session copy.
  - `M-SMOKE-001`: Responsive layout and smoke evidence, including responsive layout, authenticated smoke, and anonymous smoke.
  - `M-QUALITY-001`: Blocked quality gates, including accessibility automation, smoke gap promotion, and hardening thresholds after owners and thresholds are selected.
- Contract and security boundaries: same-origin `/api/**`, session cookies, `GET /api/session`, login providers from `loginProviders[]`, session metadata for account/logout/CSRF names, repeated filters/sort, versioned book updates, and no JWT, bearer-token, CORS-first, or alternate transport assumptions.
- Non-goals: backend API expansion, backend-only operations weight, decorative redesign with no workflow improvement, marketing landing page, invented API fields, generic command wrappers, generic planning scaffolds beyond this selected plan's minimum needs, and workflow-state directories unless the workflow guide selects them for a concrete execution need.
- Design review questions for agents before UI changes land.

## Requirement Gaps And Open Questions

| ID  | Question / Gap                                                                  | Why It Matters                                                               | Owner          | Status   | Fallback / Decision                                                                                                                         | Blocks Ready? |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Q1  | Should mandatory subagents be relaxed?                                          | User explicitly said subagents are the reliable part.                        | User           | Answered | Keep mandatory planning and implementation subagents for ad hoc implementation.                                                             | No            |
| Q2  | Should backend guidance be copied wholesale?                                    | Backend has useful mechanics but also backend-only operational weight.       | Coordinator    | Answered | Copy shape and selected rules, not backend-specific content.                                                                                | No            |
| Q3  | Should `ROADMAP.md` be edited now?                                              | The roadmap has already been reshaped into stable milestone/epic/task IDs.   | Coordinator    | Answered | This plan update does not edit the roadmap. Future execution edits it only when roadmap references or status actually need to change.       | No            |
| Q4  | Does `docs/DESIGN.md` need to match planned roadmap items?                      | Design intent must guide subagents and UI work.                              | User           | Answered | Yes. The design guide is roadmap-aligned; roadmap remains status/selection owner.                                                           | No            |
| Q5  | Does this plan implement the old `## Procedure Adoption Scope` roadmap section? | That section no longer exists in the current roadmap.                        | Coordinator    | Answered | The current roadmap obsoletes the old section. This plan must not recreate it; it should align owner guides with the new roadmap hierarchy. | No            |
| Q6  | Should smoke/local procedure work be deferred?                                  | The current roadmap selected responsive and smoke evidence as `M-SMOKE-001`. | User / Roadmap | Answered | No. Treat smoke evidence as planned waiting work, not deferred candidate work.                                                              | No            |

## Decision Log And Assumptions

| ID  | Decision / Assumption                                                                                                                                             | Source                                                 | Date       | Revisit Trigger                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| D1  | Frontend behavior remains subordinate to imported backend contract artifacts.                                                                                     | `AGENTS.md` and user context                           | 2026-06-07 | Backend contract refresh or conflict                                   |
| D2  | Mandatory planning plus implementation subagents stay in force for ad hoc implementation.                                                                         | User correction                                        | 2026-06-07 | User explicitly changes the workflow model                             |
| D3  | `docs/DESIGN.md` should own durable product/design intent and match selected/planned roadmap IDs and slices.                                                      | User correction                                        | 2026-06-07 | Roadmap scope materially changes                                       |
| D4  | `ROADMAP.md` should own selected scope, stable IDs, status, dependencies, blocked backlog, release context, and product non-goals, not detailed design rationale. | Backend comparison, frontend docs, and current roadmap | 2026-06-07 | Maintainers choose a different ownership split                         |
| D5  | Missing AI guides should be frontend-tailored rather than backend copies.                                                                                         | Backend comparison                                     | 2026-06-07 | A frontend workflow needs deeper procedure detail                      |
| D6  | Backend operations/deployment weight stays out unless the frontend owns deployment operations.                                                                    | Roadmap product non-goals                              | 2026-06-07 | Frontend gets a deployment target or runtime operations responsibility |
| D7  | `M-SMOKE-001` is planned waiting work, not deferred procedure scope.                                                                                              | Current roadmap and user correction                    | 2026-06-07 | Roadmap changes smoke evidence status                                  |
| D8  | Generic command wrappers, generic planning scaffolds, and workflow-state directories remain out unless selected by this plan's concrete execution needs.          | Current roadmap product non-goals                      | 2026-06-07 | Repeated frontend work proves a specific process artifact is worth it  |

## Execution Shape And Shared Files

Use an orchestrated delegated workflow:

- The coordinator owns this plan, user-owned dirty-worktree protection, shared-file sequencing, final validation, and final handoff.
- Use one planning subagent to convert each task into a narrow handoff before its implementation worker starts.
- Use a separate implementation worker for each task or disjoint task group.
- Do not spawn subagents with full thread history. Give each worker a complete scoped prompt with repository path, relevant instructions, read set, write scope, validation, output requirements, and stop conditions.
- Workers must not edit outside their assigned write scope.
- Workers must not revert user-owned changes.
- `ROADMAP.md` is coordinator-owned for this plan. Workers must treat it as read-only unless a coordinator explicitly assigns roadmap-reference alignment after confirming the edit is necessary.

Shared files:

- `AGENTS.md`: coordinator-owned or assigned to the root-rules worker only.
- `ROADMAP.md`: read-only unless the coordinator assigns a narrowly scoped alignment edit; do not recreate obsolete sections.
- `.agents/references/documentation.md`: coordinator-owned unless assigned during the documentation-routing task.
- `.agents/plans/archive/PLAN_frontend_ai_guidance_design_alignment.md`: archived coordinator-owned execution record.

## Progress Tracker

| Task                                                                 | Status | Owner                 | Commit          | Validation                       | Notes                                                                       |
| -------------------------------------------------------------------- | ------ | --------------------- | --------------- | -------------------------------- | --------------------------------------------------------------------------- |
| 0: Create and align active plan                                      | Done   | Coordinator           | Existing commit | Scoped `git diff --check` passed | Updated to current roadmap stable-ID hierarchy without editing `ROADMAP.md` |
| 1: Create roadmap-aligned design owner                               | Done   | Design worker         | Final commit    | Scoped `git diff --check` passed | Added `docs/DESIGN.md`; index links completed during human-doc alignment    |
| 2: Add reference maintenance and documentation routing               | Done   | AI docs worker        | Final commit    | Scoped `git diff --check` passed | Added `references-rules.md`; updated documentation and roadmap routing      |
| 3: Add frontend architecture, code-style, and troubleshooting guides | Done   | Frontend rules worker | Final commit    | Scoped `git diff --check` passed | Added focused implementation guidance                                       |
| 4: Add execution, workflow, planning, and plan-execution guides      | Done   | Workflow rules worker | Final commit    | Scoped `git diff --check` passed | Added delegated workflow and active-plan execution guidance                 |
| 5: Add minimal plan template; avoid generic scaffolding              | Done   | Planning worker       | Final commit    | Scoped `git diff --check` passed | Added only `PLAN_TEMPLATE.md`                                               |
| 6: Compact root AI rules and commit metadata                         | Done   | Root rules worker     | Final commit    | Scoped `git diff --check` passed | Updated `AGENTS.md` routing and `.gitmessage` plan-task metadata            |
| 7: Human doc and roadmap-reference alignment                         | Done   | Docs worker           | Final commit    | Scoped `git diff --check` passed | Aligned human docs without editing `ROADMAP.md`                             |

## Plan Tasks

### Task 1: Create Roadmap-Aligned Design Owner

| Field                   | Value                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                  | Done                                                                                                                                                                     |
| Goal                    | Create `docs/DESIGN.md` as the durable frontend product/design intent owner aligned with selected and planned roadmap items                                              |
| Owned Files Or Packages | `docs/DESIGN.md`, `docs/README.md`, possibly `docs/DEVELOPMENT_LIFECYCLE.md` and `docs/WORKING_WITH_AI.md` when they need links                                          |
| Read-Only Context       | `ROADMAP.md` current milestone hierarchy, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/backend/README.md`, backend `docs/DESIGN.md` for shape only                      |
| Behavior To Preserve    | Do not change API rules, roadmap status, package scripts, or app code                                                                                                    |
| Deliverables            | A frontend-specific design guide with sections for `M-UI-001`, `M-WORKFLOW-001`, `M-SMOKE-001`, `M-QUALITY-001`, and product non-goals; documentation index points to it |
| Validation Checkpoint   | `git diff --check`; manual cross-reference review                                                                                                                        |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                          |

### Task 2: Add Reference Maintenance And Documentation Routing

| Field                   | Value                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Done                                                                                                                                                                                                      |
| Goal                    | Add rules that keep `.agents/references/*.md` focused, non-duplicative, and aligned with owner documents                                                                                                  |
| Owned Files Or Packages | `.agents/references/references-rules.md`, `.agents/references/documentation.md`, `.agents/references/roadmap.md`                                                                                          |
| Read-Only Context       | Backend `.agents/references/references-rules.md`, backend `.agents/references/documentation.md`, frontend `docs/DEVELOPMENT_LIFECYCLE.md`                                                                 |
| Behavior To Preserve    | Keep backend contract artifacts authoritative for API behavior                                                                                                                                            |
| Deliverables            | Reference-maintenance owner; documentation routing includes `docs/DESIGN.md`, the current roadmap stable-ID model, active-plan guidance, workflow guides, and frontend-specific architecture/style guides |
| Validation Checkpoint   | `git diff --check`; manual overlap review                                                                                                                                                                 |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                           |

### Task 3: Add Frontend Architecture, Code-Style, And Troubleshooting Guides

| Field                   | Value                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Done                                                                                                                                                                                                 |
| Goal                    | Give implementation workers concrete frontend rules and placement guidance                                                                                                                           |
| Owned Files Or Packages | `.agents/references/architecture.md`, `.agents/references/code-style.md`, `.agents/references/troubleshooting.md`, possibly `.agents/references/testing.md` if troubleshooting references must align |
| Read-Only Context       | `src/` structure, `package.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/DESIGN.md` from Task 1, backend equivalent guides for shape only                                                     |
| Behavior To Preserve    | Do not create new app abstractions or edit source code in this guidance task                                                                                                                         |
| Deliverables            | Frontend-specific architecture map, route/API/client/component ownership, TypeScript/React edit-shape rules, CSS/layout expectations, validation failure playbook                                    |
| Validation Checkpoint   | `git diff --check`; manual cross-reference review                                                                                                                                                    |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                      |

### Task 4: Add Execution, Workflow, Planning, And Plan-Execution Guides

| Field                   | Value                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Done                                                                                                                                                                                                                          |
| Goal                    | Make the mandatory subagent workflow reliable by defining planner, worker, coordinator, reviewer, and verifier expectations                                                                                                   |
| Owned Files Or Packages | `.agents/references/execution.md`, `.agents/references/workflow.md`, `.agents/references/planning.md`, `.agents/references/plan-execution.md`                                                                                 |
| Read-Only Context       | `AGENTS.md`, this plan, backend equivalent guides for shape, frontend `.agents/references/testing.md`, `.agents/references/reviews.md`                                                                                        |
| Behavior To Preserve    | Keep mandatory ad hoc planning plus implementation subagents; do not introduce a direct-implementation default; do not add generic command wrappers or durable workflow-state directories unless a concrete task selects them |
| Deliverables            | Task gate, execution loop, handoff requirements, role read sets, ownership boundaries, active-plan execution loop, and stop/replan triggers tailored to frontend work                                                         |
| Validation Checkpoint   | `git diff --check`; manual consistency review against `AGENTS.md`                                                                                                                                                             |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                                               |

### Task 5: Add Minimal Plan Template; Avoid Generic Scaffolding

| Field                   | Value                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                  | Done                                                                                                                                                                                                                     |
| Goal                    | Make selected active plans consistent without adding broad generic planning scaffolding beyond current need                                                                                                              |
| Owned Files Or Packages | `.agents/plans/PLAN_TEMPLATE.md`, optional `.agents/plans/README.md`; `.agents/context/*/README.md` only if Task 4 selects durable state for a concrete execution need                                                   |
| Read-Only Context       | This plan, current `ROADMAP.md` product non-goals, backend `.agents/plans/PLAN_TEMPLATE.md`, `.agents/references/planning.md` from Task 4                                                                                |
| Behavior To Preserve    | Do not archive or rewrite existing archived plans                                                                                                                                                                        |
| Deliverables            | Minimal frontend plan skeleton with provenance, lifecycle, readiness, source artifacts, scope, decisions, tasks, progress, validation, and handoff sections; no command wrapper or context bus unless selected elsewhere |
| Validation Checkpoint   | `git diff --check`; manual template/reference alignment review                                                                                                                                                           |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                                          |

### Task 6: Compact Root AI Rules And Commit Metadata

| Field                   | Value                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Done                                                                                                                                                                                                    |
| Goal                    | Keep `AGENTS.md` as a strong entry point while moving detailed procedure into focused guides                                                                                                            |
| Owned Files Or Packages | `AGENTS.md`, `.gitmessage`                                                                                                                                                                              |
| Read-Only Context       | New references from Tasks 2-5, backend `AGENTS.md`, backend `.gitmessage`, frontend `docs/backend/` rules                                                                                               |
| Behavior To Preserve    | Mandatory subagent rule, implementation authorization rule, dirty-worktree protection, backend contract invariants, no commits unless authorized                                                        |
| Deliverables            | Root file routes to focused guides, has a clear document map, keeps frontend contract rules, and avoids duplicating full execution procedures; `.gitmessage` uses `plan-task` style metadata if adopted |
| Validation Checkpoint   | `git diff --check`; manual root/reference consistency review                                                                                                                                            |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                         |

### Task 7: Human Doc And Roadmap-Reference Alignment

| Field                   | Value                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                  | Done                                                                                                                                                                                                                                                |
| Goal                    | Align human-facing docs and roadmap references with the new design and AI guidance owner split                                                                                                                                                      |
| Owned Files Or Packages | `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, `docs/README.md`, possibly `ROADMAP.md` for narrow reference alignment only                                                                             |
| Read-Only Context       | All changed AI references, `docs/DESIGN.md`, `ROADMAP.md`, `CHANGELOG.md` only if release-history wording is implicated                                                                                                                             |
| Behavior To Preserve    | Do not duplicate detailed AI procedures in human docs; do not recreate `## Procedure Adoption Scope` or `## Smoke And Local Procedure Candidates`; keep `M-SMOKE-001` planned/waiting and `M-QUALITY-001` blocked unless the roadmap itself changes |
| Deliverables            | Human docs link to the right owners; roadmap references, if edited, point to `docs/DESIGN.md` and focused AI guides without changing milestone status; final review confirms no contradictory guidance                                              |
| Validation Checkpoint   | `git diff --check`; manual cross-reference and documentation-drift review                                                                                                                                                                           |
| Commit Checkpoint       | Commit only if user asks or execution policy authorizes commits                                                                                                                                                                                     |

## Blockers And Replan Triggers

| Trigger / Blocker                                                              | Response                                                                                                              | Owner                       | Status |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------ |
| Roadmap hierarchy changes again during execution                               | Re-read `ROADMAP.md`, update this plan or the affected worker handoff before editing design or guidance files         | Coordinator                 | Open   |
| A worker finds a backend contract conflict                                     | Refresh or inspect `docs/backend/` only if API-facing behavior is actually changing; otherwise record as out of scope | Coordinator                 | Open   |
| A guide starts copying backend-only Gradle/Flyway/REST Docs/operations content | Remove it or route to deferred/non-goal notes                                                                         | Responsible worker          | Open   |
| `docs/DESIGN.md` contradicts selected roadmap items                            | Fix design or roadmap ownership before final review; do not leave divergent intent                                    | Design worker / Coordinator | Open   |
| A task needs source-code changes to make docs true                             | Replan; this plan is guidance/design only                                                                             | Coordinator                 | Open   |
| Reference files duplicate one another                                          | Use `references-rules.md` to compact into the best owner                                                              | AI docs worker              | Open   |
| A worker tries to reintroduce old deferred roadmap sections                    | Stop and align to the current stable-ID roadmap hierarchy instead                                                     | Coordinator                 | Open   |

## Validation Plan

This plan is documentation and AI-guidance work unless execution later expands the scope.

Required validation:

```powershell
git diff --check
```

When existing user-owned changes are present, workers may run scoped whitespace validation for their owned paths first, then the coordinator decides whether a full `git diff --check` is safe to interpret.

Manual review:

- Confirm every durable rule has one owner.
- Confirm `docs/DESIGN.md` matches `M-UI-001`, `M-WORKFLOW-001`, `M-SMOKE-001`, `M-QUALITY-001`, and product non-goals.
- Confirm roadmap edits, if any, are narrow reference/status alignment and do not recreate obsolete sections.
- Confirm `M-SMOKE-001` remains planned waiting work, not deferred candidate work.
- Confirm `AGENTS.md` keeps mandatory subagent execution and backend contract invariants.
- Confirm no new guide imports backend-only operational weight.
- Confirm no generic command wrapper or workflow-state directory is added without concrete selection.
- Confirm all new cross-references point to real files.

Broader npm validation is not required unless implementation expands into package scripts, source code, generated files, tests, or workflow YAML.

## Review Expectations

- Review for documentation drift before handoff.
- Review for spec or contract drift if any API-facing wording changes.
- Security review is required only if auth/session/CSRF guidance changes beyond restating existing backend contract invariants.
- Findings must be fixed or recorded before calling the plan implemented.

## Handoff Expectations

Each worker report must include:

- changed files
- confirmation that `ROADMAP.md` was not edited unless explicitly assigned
- confirmation that old `Procedure Adoption Scope` and `Smoke And Local Procedure Candidates` sections were not recreated
- validation run and result
- skipped validation with reasons
- remaining risks or contradictions

Final handoff must include:

- all changed files
- validation commands and results
- any skipped checks and reasons
- whether `ROADMAP.md` changed, and if so which stable IDs or references changed
- remaining guidance or roadmap alignment risks

## Validation Results

| Date       | Command                                                                           | Scope                                     | Result | Notes                                                                            |
| ---------- | --------------------------------------------------------------------------------- | ----------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| 2026-06-07 | `git diff --check -- .agents/plans/PLAN_frontend_ai_guidance_design_alignment.md` | Plan creation and roadmap-shape alignment | Passed | Plan updated to current roadmap stable-ID hierarchy without editing `ROADMAP.md` |
| 2026-06-07 | `npm run format:markdown`                                                         | Plan implementation docs                  | Passed | Formatted deterministic pipe table alignment for tracked Markdown files          |
| 2026-06-07 | `npm run lint:markdown`                                                           | Plan implementation docs                  | Passed | Markdown line ending and markdownlint checks passed                              |
| 2026-06-07 | `git diff --check`                                                                | Plan implementation docs                  | Passed | Whitespace check passed                                                          |
| 2026-06-07 | `git diff --cached --check`                                                       | Staged plan implementation docs           | Passed | Staged whitespace check passed                                                   |
