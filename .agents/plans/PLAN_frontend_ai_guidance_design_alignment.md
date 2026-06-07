# Plan: Frontend AI Guidance And Design Alignment

## Provenance

| Field | Value |
| --- | --- |
| Created By | Codex |
| Created On | 2026-06-07 |
| Source Request | User request to create a plan for bringing frontend AI rules and `docs/DESIGN.md` in line with the working backend guidance model, while keeping mandatory subagent execution |
| Generation Context | `AGENTS.md`, current `ROADMAP.md` outline, `.agents/references/*`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, `docs/LOCAL_DEVELOPMENT.md`, backend `AGENTS.md`, and selected backend `.agents/references/*` files |

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
| Accepted Fallbacks | Keep mandatory planning and implementation subagents; adopt backend-style focused owner guides only where they add frontend value |
| Ready For Execution | Yes |
| Last Updated | 2026-06-07 |

## Linked Artifacts

| Artifact | Path | Role | Status |
| --- | --- | --- | --- |
| Root AI rules | `AGENTS.md` | Repository-level AI entry point, backend contract invariants, authorization, dirty-worktree rules, and delegation rules | Needs compaction and owner-guide routing |
| Roadmap | `ROADMAP.md` | Selected and planned frontend scope, including production UI redesign slices | User-owned modified file at plan creation; do not edit until executor inspects and confirms scope |
| Human lifecycle guide | `docs/DEVELOPMENT_LIFECYCLE.md` | Human-facing artifact routing and lifecycle summary | Needs `docs/DESIGN.md` routing alignment |
| Human AI guide | `docs/WORKING_WITH_AI.md` | Human guidance for asking AI agents to plan, implement, validate, and review | Needs mandatory-subagent and design-owner alignment |
| Documentation index | `docs/README.md` | Human-facing documentation owner index | Needs `docs/DESIGN.md` entry after creation |
| Existing AI references | `.agents/references/` | Focused AI procedure references | Missing execution, workflow, planning, plan-execution, architecture, code-style, troubleshooting, and reference-maintenance owners |
| Backend model | `D:\Projects\demo\technical-interview-demo\AGENTS.md` and `.agents/references/*` | Working comparison source for guidance shape, not content to copy blindly | Consult selectively |
| Backend contract imports | `docs/backend/` | API integration truth for frontend behavior | Preserve as authoritative |

## Summary

Create a frontend-specific guidance system with enough product intent and execution
rules for subagents to work reliably. The goal is not to remove subagents. The goal
is to make planning and implementation subagents less dumb by giving them clear
intent, ownership boundaries, validation rules, and frontend-specific architecture
guidance.

The durable design owner should be `docs/DESIGN.md`. It must match the selected and
planned roadmap work, especially the production UI redesign sequence. `ROADMAP.md`
should continue to own selection, status, sequencing, release phase, and deferred
scope. Design intent belongs in `docs/DESIGN.md`; roadmap rows should point to it
instead of carrying all product/design rationale inline.

## Scope

In scope:

- Create `docs/DESIGN.md` for frontend product and design intent aligned with the
  planned roadmap slices.
- Add missing focused AI reference files so subagents receive concrete execution,
  workflow, planning, architecture, code-style, troubleshooting, and
  reference-maintenance rules.
- Rewrite or compact `AGENTS.md` so it routes to focused owner guides while keeping
  the frontend backend-contract invariants and mandatory ad hoc planning plus
  implementation subagents.
- Add a reusable active-plan template under `.agents/plans/`.
- Align human-facing docs and AI reference routing with the new design owner.
- Align `.gitmessage` with the backend's newer plan-task metadata shape where useful.
- Preserve user-owned changes, especially the existing modified `ROADMAP.md`.

Out of scope:

- Implementing the production UI redesign itself.
- Changing frontend runtime behavior, package scripts, dependencies, or generated API
  types.
- Refreshing backend contract artifacts.
- Copying backend-only Gradle, Flyway, REST Docs, backend operations, or deployment
  runbook weight into the frontend.
- Editing `ROADMAP.md` during plan creation. Future execution may touch it only after
  inspecting the user-owned diff and confirming that roadmap alignment is in scope.

## Current State

- The frontend has Vite, React, TypeScript, Node.js 24.x, npm 11.x, generated
  OpenAPI types, route/component tests, local auth smoke docs, hardening docs, and
  release docs.
- The frontend does not currently have `docs/DESIGN.md`.
- The active roadmap direction includes production UI redesign foundation, visual
  hierarchy and page structure, admin/operator workflow density,
  catalog/table/form action hierarchy, account/session copy polish, state semantics,
  and responsive/table-scanning polish.
- `AGENTS.md` already enforces mandatory planning and implementation subagents for
  ad hoc implementation work.
- The frontend lacks the backend's focused AI owner guides for ordinary task
  execution, workflow/delegation mechanics, plan authoring, plan execution,
  architecture placement, code-style/edit shape, troubleshooting, and reference-file
  maintenance.
- `ROADMAP.md` was already modified when this plan was created. Treat that diff as
  user-owned.

## Design Contract For `docs/DESIGN.md`

The new design guide should be roadmap-aligned and frontend-specific.

Required sections:

- Product intent: first-party production browser frontend for the sibling backend,
  not a repository demo shell or marketing landing page.
- Design priorities: contract-first UI, workflow clarity, route context,
  user-facing session controls, admin/operator separation, dense operational
  scanning where appropriate, and reduced exposed control clutter.
- Supported experience: public catalog, account/session, admin catalog/users,
  admin localization, operator/audit surface, theme, and local smoke posture.
- Roadmap-aligned direction:
  - Production UI redesign foundation.
  - Visual hierarchy and page structure pass.
  - Admin/operator operational workflow density.
  - Catalog/table/form action hierarchy pass.
  - Account/session and product copy polish.
  - Status and state semantics pass.
  - Responsive layout and table-scanning polish.
- Contract and security boundaries: same-origin `/api/**`, session cookies,
  `GET /api/session`, login providers from `loginProviders[]`, session metadata for
  account/logout/CSRF names, repeated filters/sort, versioned book updates, and no
  JWT, bearer-token, CORS-first, or alternate transport assumptions.
- Non-goals: backend API expansion, backend-only operations weight, decorative
  redesign with no workflow improvement, marketing landing page, and invented API
  fields.
- Design review questions for agents before UI changes land.

## Requirement Gaps And Open Questions

| ID | Question / Gap | Why It Matters | Owner | Status | Fallback / Decision | Blocks Ready? |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Should mandatory subagents be relaxed? | User explicitly said subagents are the reliable part. | User | Answered | Keep mandatory planning and implementation subagents for ad hoc implementation. | No |
| Q2 | Should backend guidance be copied wholesale? | Backend has useful mechanics but also backend-only operational weight. | Coordinator | Answered | Copy shape and selected rules, not backend-specific content. | No |
| Q3 | Should `ROADMAP.md` be edited now? | It already has a user-owned modification. | User / Coordinator | Answered for this plan creation | Do not edit roadmap while creating this plan. Future execution must inspect and preserve the user-owned diff. | No |
| Q4 | Does `docs/DESIGN.md` need to match planned roadmap items? | Design intent must guide subagents and UI work. | User | Answered | Yes. The design guide is roadmap-aligned; roadmap remains status/selection owner. | No |

## Decision Log And Assumptions

| ID | Decision / Assumption | Source | Date | Revisit Trigger |
| --- | --- | --- | --- | --- |
| D1 | Frontend behavior remains subordinate to imported backend contract artifacts. | `AGENTS.md` and user context | 2026-06-07 | Backend contract refresh or conflict |
| D2 | Mandatory planning plus implementation subagents stay in force for ad hoc implementation. | User correction | 2026-06-07 | User explicitly changes the workflow model |
| D3 | `docs/DESIGN.md` should own durable product/design intent and match selected/planned roadmap slices. | User correction | 2026-06-07 | Roadmap scope materially changes |
| D4 | `ROADMAP.md` should own selected scope, status, sequence, and deferred work, not detailed design rationale. | Backend comparison and frontend docs | 2026-06-07 | Maintainers choose a different ownership split |
| D5 | Missing AI guides should be frontend-tailored rather than backend copies. | Backend comparison | 2026-06-07 | A frontend workflow needs deeper procedure detail |
| D6 | Backend operations/deployment weight stays out unless the frontend owns deployment operations. | Roadmap rejected/deferred scope | 2026-06-07 | Frontend gets a deployment target or runtime operations responsibility |

## Execution Shape And Shared Files

Use an orchestrated delegated workflow:

- The coordinator owns this plan, user-owned dirty-worktree protection, shared-file
  sequencing, final validation, and final handoff.
- Use one planning subagent to convert each task into a narrow handoff before its
  implementation worker starts.
- Use a separate implementation worker for each task or disjoint task group.
- Do not spawn subagents with full thread history. Give each worker a complete scoped
  prompt with repository path, relevant instructions, read set, write scope,
  validation, output requirements, and stop conditions.
- Workers must not edit outside their assigned write scope.
- Workers must not revert user-owned changes.
- `ROADMAP.md` is coordinator-owned for this plan and currently user-modified.
  Workers must treat it as read-only unless a later coordinator decision explicitly
  assigns a roadmap alignment edit after inspecting the existing diff.

Shared files:

- `AGENTS.md`: coordinator-owned or assigned to the root-rules worker only.
- `ROADMAP.md`: read-only until the existing user-owned diff is inspected and
  explicit roadmap-edit authorization exists.
- `.agents/references/documentation.md`: coordinator-owned unless assigned during
  the documentation-routing task.
- `.agents/plans/PLAN_frontend_ai_guidance_design_alignment.md`: coordinator-owned.

## Progress Tracker

| Task | Status | Owner | Commit | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| 0: Create active plan | Done | Coordinator | Not committed | Scoped `git diff --check` pending | Does not edit `ROADMAP.md` |
| 1: Create roadmap-aligned design owner | Not Started | Design worker | Pending | Pending | Adds `docs/DESIGN.md` and related indexes |
| 2: Add reference maintenance and documentation routing | Not Started | AI docs worker | Pending | Pending | Adds `references-rules.md`; updates documentation routing |
| 3: Add frontend architecture, code-style, and troubleshooting guides | Not Started | Frontend rules worker | Pending | Pending | Gives implementers product and edit-shape rails |
| 4: Add execution, workflow, planning, and plan-execution guides | Not Started | Workflow rules worker | Pending | Pending | Keeps mandatory subagent model |
| 5: Add plan template and optional context placeholders | Not Started | Planning worker | Pending | Pending | Makes future active plans consistent |
| 6: Compact root AI rules and commit metadata | Not Started | Root rules worker | Pending | Pending | Updates `AGENTS.md` and `.gitmessage` |
| 7: Human doc alignment and final review | Not Started | Coordinator / docs worker | Pending | Pending | Aligns `docs/WORKING_WITH_AI.md`, `CONTRIBUTING.md`, and cross-references as needed |

## Plan Tasks

### Task 1: Create Roadmap-Aligned Design Owner

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Create `docs/DESIGN.md` as the durable frontend product/design intent owner aligned with selected and planned roadmap items |
| Owned Files Or Packages | `docs/DESIGN.md`, `docs/README.md`, possibly `docs/DEVELOPMENT_LIFECYCLE.md` and `docs/WORKING_WITH_AI.md` when they need links |
| Read-Only Context | `ROADMAP.md`, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/backend/README.md`, backend `docs/DESIGN.md` for shape only |
| Behavior To Preserve | Do not change API rules, roadmap status, package scripts, or app code |
| Deliverables | A frontend-specific design guide with roadmap-aligned sections and explicit non-goals; documentation index points to it |
| Validation Checkpoint | `git diff --check`; manual cross-reference review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 2: Add Reference Maintenance And Documentation Routing

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Add rules that keep `.agents/references/*.md` focused, non-duplicative, and aligned with owner documents |
| Owned Files Or Packages | `.agents/references/references-rules.md`, `.agents/references/documentation.md`, `.agents/references/roadmap.md` |
| Read-Only Context | Backend `.agents/references/references-rules.md`, backend `.agents/references/documentation.md`, frontend `docs/DEVELOPMENT_LIFECYCLE.md` |
| Behavior To Preserve | Keep backend contract artifacts authoritative for API behavior |
| Deliverables | Reference-maintenance owner; documentation routing includes `docs/DESIGN.md`, active-plan template, workflow guides, and frontend-specific architecture/style guides |
| Validation Checkpoint | `git diff --check`; manual overlap review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 3: Add Frontend Architecture, Code-Style, And Troubleshooting Guides

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Give implementation workers concrete frontend rules and placement guidance |
| Owned Files Or Packages | `.agents/references/architecture.md`, `.agents/references/code-style.md`, `.agents/references/troubleshooting.md`, possibly `.agents/references/testing.md` if troubleshooting references must align |
| Read-Only Context | `src/` structure, `package.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, `docs/DESIGN.md` from Task 1, backend equivalent guides for shape only |
| Behavior To Preserve | Do not create new app abstractions or edit source code in this guidance task |
| Deliverables | Frontend-specific architecture map, route/API/client/component ownership, TypeScript/React edit-shape rules, CSS/layout expectations, validation failure playbook |
| Validation Checkpoint | `git diff --check`; manual cross-reference review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 4: Add Execution, Workflow, Planning, And Plan-Execution Guides

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Make the mandatory subagent workflow reliable by defining planner, worker, coordinator, reviewer, and verifier expectations |
| Owned Files Or Packages | `.agents/references/execution.md`, `.agents/references/workflow.md`, `.agents/references/planning.md`, `.agents/references/plan-execution.md` |
| Read-Only Context | `AGENTS.md`, this plan, backend equivalent guides for shape, frontend `.agents/references/testing.md`, `.agents/references/reviews.md` |
| Behavior To Preserve | Keep mandatory ad hoc planning plus implementation subagents; do not introduce direct-implementation default |
| Deliverables | Task gate, execution loop, handoff requirements, role read sets, ownership boundaries, active-plan execution loop, and stop/replan triggers tailored to frontend work |
| Validation Checkpoint | `git diff --check`; manual consistency review against `AGENTS.md` |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 5: Add Plan Template And Optional Context Placeholders

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Make future active plans consistent and executable without copying archived plan residue |
| Owned Files Or Packages | `.agents/plans/PLAN_TEMPLATE.md`, optional `.agents/plans/README.md`, optional `.agents/context/*/README.md` only if workflow guide selects durable state directories |
| Read-Only Context | This plan, backend `.agents/plans/PLAN_TEMPLATE.md`, `.agents/references/planning.md` from Task 4 |
| Behavior To Preserve | Do not archive or rewrite existing archived plans |
| Deliverables | Reusable frontend plan skeleton with provenance, lifecycle, readiness, source artifacts, scope, decisions, tasks, progress, validation, and handoff sections |
| Validation Checkpoint | `git diff --check`; manual template/reference alignment review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 6: Compact Root AI Rules And Commit Metadata

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Keep `AGENTS.md` as a strong entry point while moving detailed procedure into focused guides |
| Owned Files Or Packages | `AGENTS.md`, `.gitmessage` |
| Read-Only Context | New references from Tasks 2-5, backend `AGENTS.md`, backend `.gitmessage`, frontend `docs/backend/` rules |
| Behavior To Preserve | Mandatory subagent rule, implementation authorization rule, dirty-worktree protection, backend contract invariants, no commits unless authorized |
| Deliverables | Root file routes to focused guides, has a clear document map, keeps frontend contract rules, and avoids duplicating full execution procedures; `.gitmessage` uses `plan-task` style metadata if adopted |
| Validation Checkpoint | `git diff --check`; manual root/reference consistency review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

### Task 7: Human Doc Alignment And Final Review

| Field | Value |
| --- | --- |
| Status | Not Started |
| Goal | Align human-facing docs with the new design and AI guidance owner split |
| Owned Files Or Packages | `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT_LIFECYCLE.md`, `docs/WORKING_WITH_AI.md`, `docs/README.md`, possibly `ROADMAP.md` only if the current user-owned diff is inspected and roadmap edit authorization exists |
| Read-Only Context | All changed AI references, `docs/DESIGN.md`, `ROADMAP.md`, `CHANGELOG.md` only if release-history wording is implicated |
| Behavior To Preserve | Do not duplicate detailed AI procedures in human docs; do not edit user-owned roadmap changes without explicit scope |
| Deliverables | Human docs link to the right owners; cross-references do not point to missing files; final review confirms no contradictory guidance |
| Validation Checkpoint | `git diff --check`; manual cross-reference and documentation-drift review |
| Commit Checkpoint | Commit only if user asks or execution policy authorizes commits |

## Blockers And Replan Triggers

| Trigger / Blocker | Response | Owner | Status |
| --- | --- | --- | --- |
| Existing `ROADMAP.md` diff conflicts with planned edits | Stop before editing `ROADMAP.md`; report the conflict and ask whether to incorporate, preserve, or defer roadmap edits | Coordinator | Open |
| A worker finds a backend contract conflict | Refresh or inspect `docs/backend/` only if API-facing behavior is actually changing; otherwise record as out of scope | Coordinator | Open |
| A guide starts copying backend-only Gradle/Flyway/REST Docs/operations content | Remove it or route to deferred/non-goal notes | Responsible worker | Open |
| `docs/DESIGN.md` contradicts selected roadmap items | Fix design or roadmap ownership before final review; do not leave divergent intent | Design worker / Coordinator | Open |
| A task needs source-code changes to make docs true | Replan; this plan is guidance/design only | Coordinator | Open |
| Reference files duplicate one another | Use `references-rules.md` to compact into the best owner | AI docs worker | Open |

## Validation Plan

This plan is documentation and AI-guidance work unless execution later expands the
scope.

Required validation:

```powershell
git diff --check
```

When existing user-owned changes are present, workers may run scoped whitespace
validation for their owned paths first, then the coordinator decides whether a full
`git diff --check` is safe to interpret.

Manual review:

- Confirm every durable rule has one owner.
- Confirm `docs/DESIGN.md` matches selected and planned roadmap items.
- Confirm `ROADMAP.md` is not edited accidentally while user-owned changes exist.
- Confirm `AGENTS.md` keeps mandatory subagent execution and backend contract
  invariants.
- Confirm no new guide imports backend-only operational weight.
- Confirm all new cross-references point to real files.

Broader npm validation is not required unless implementation expands into package
scripts, source code, generated files, tests, or workflow YAML.

## Review Expectations

- Review for documentation drift before handoff.
- Review for spec or contract drift if any API-facing wording changes.
- Security review is required only if auth/session/CSRF guidance changes beyond
  restating existing backend contract invariants.
- Findings must be fixed or recorded before calling the plan implemented.

## Handoff Expectations

Each worker report must include:

- changed files
- confirmation that `ROADMAP.md` was not edited unless explicitly assigned
- validation run and result
- skipped validation with reasons
- remaining risks or contradictions

Final handoff must include:

- all changed files
- validation commands and results
- any skipped checks and reasons
- whether user-owned `ROADMAP.md` changes were preserved untouched
- remaining guidance or roadmap alignment risks

## Validation Results

| Date | Command | Scope | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-07 | Pending | Plan creation | Pending | Plan file created without editing `ROADMAP.md` |
