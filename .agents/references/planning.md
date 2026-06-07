# AI Planning Reference

This file owns active-plan authoring and readiness rules for this frontend repository. Use it when creating or updating plans under `.agents/plans/`.

## Plan Purpose

A plan coordinates selected execution. It is not the durable owner for backend contracts, product scope, design intent, validation commands, release history, or recurring AI procedure.

Before a plan is complete, durable rules discovered during execution must move to the right owner:

- backend API behavior to `docs/backend/` and generated types or tests
- product and design intent to `docs/DESIGN.md`
- selected scope, status, dependencies, blocked backlog, and product non-goals to `ROADMAP.md`
- validation selection to `.agents/references/testing.md`
- recurring AI procedure to the focused `.agents/references/` owner
- human-facing instructions to the relevant human doc

## Required Plan Shape

Plans should include:

- objective and outcome
- top-level metadata: `Plan-ID`, `Status`, `Workers`, and `Filename`
- readiness summary with approval state, open-question state, and implementation progress
- status history with timestamped status changes
- source artifacts consulted, including source request, roadmap refs, design/spec refs, backend contract refs, focused references, and source files or tests
- in-scope and out-of-scope boundaries
- assumptions, open questions, proposed changes, and accepted fallbacks
- contract and repository invariants, without copying detailed backend schemas or endpoint rules
- progress tracker with each task packet's `Ready`, `Waiting`, `Blocked`, or `Complete` state
- task packets with lane, goal, initial context budget, allowed and forbidden inputs, write scope, dependencies, validation, escalation triggers, stop conditions, expected output, and result summary
- execution model, long-run continuity, and Mermaid execution graph
- blockers and replan triggers
- validation plan and review expectations
- handoff expectations
- compact validation evidence in task-packet result summaries as commands are run

Keep plan content specific to the selected work. Do not introduce generic command wrappers, broad workflow-state directories, or reusable process scaffolds unless the selected roadmap work names that need.

## Readiness Rules

A plan is ready for approval when:

- the objective is clear enough to test or document
- source documents and truth-priority conflicts have been identified
- write ownership is scoped narrowly enough for workers
- selected task packets have clear `Ready`, `Waiting`, or `Blocked` states
- known decisions are recorded or a fallback is selected
- blockers are real external decisions, credentials, backend contract conflicts, thresholds, or evidence gaps, not routine implementation work
- validation and handoff requirements are explicit

Do not mark a plan approved when the intended behavior cannot be described clearly enough to test or document. Creating or updating a plan is not approval to implement it; implementation starts only when the current user request approves execution or the active plan status and request clearly authorize the next packet.

## Status Terms

Use these top-level plan statuses:

- `Draft`: the plan is being shaped and may contain unanswered questions.
- `Approved`: the plan is ready to implement; required decisions are answered, moved to an owner document, or documented as allowed assumptions.
- `In Progress`: implementation has started.
- `Blocked`: implementation cannot proceed because of an external decision, credential, backend contract conflict, selected threshold, failure owner, explicit user acceptance gate, or external state.
- `Implemented`: planned changes and selected validation are complete; release or archive cleanup may still remain.
- `Closed`: no further plan work is expected; include a close reason.

Use these task-packet statuses in the progress tracker:

- `Ready`: the packet can be assigned now from the current repository state.
- `Waiting`: the packet has a normal predecessor dependency and should become ready when that predecessor lands.
- `Blocked`: the packet needs a product choice, backend contract resolution, credential, selected threshold, failure owner, user acceptance gate explicitly required by the current task, or external state that the plan cannot produce.
- `Complete`: the packet's deliverables, validation, review, and required checkpoint are done.

Keep planned downstream work as `Waiting` when it only depends on earlier selected work. Do not turn planned waiting work into deferred candidate language just because it is later in the sequence.

## Task Packets

Use task packets as the default worker dispatch contract for active-plan work. Each task packet must name exact read-first context, escalation-only context, forbidden inputs, write scope, validation, stop conditions, and expected output. Exploration, design, testing, and review packets should be `read-only` unless the plan explicitly assigns draft or test artifact edits.

Use inline packets for ordinary plans. Link child packet files only when the parent plan would become difficult to scan, such as more than six worker-owned tasks, multiple parallel waves, or an expected parent-plan length above roughly 200 lines after packeting.

The parent plan remains the source of approval, readiness, dependencies, execution graph, packet index, and compact result summaries. Do not paste raw worker transcripts, raw test output, browser logs, or bulky run logs into the plan.

## Commit Checkpoints

Plan every repository-changing task packet with a commit checkpoint after that packet's validation. The checkpoint should state whether the current request and plan authorize a commit after validation, what files belong in the commit, and which validation must pass first.

Tasks that are read-only or produce no repository changes should state that no commit is needed. When a checkpoint authorizes a commit, keep unrelated user-owned changes out of the commit and use the repository commit-message rules.

## Plan Handoff

A planning handoff should include:

- objective
- relevant rules, contracts, source documents, and truth-priority notes
- proposed file ownership and read-only context
- implementation steps
- required tests and validation
- risks, open questions, explicit non-goals, and stop conditions

Implementation prompts should include the planning handoff or clearly state the coordinator's deltas from it.
