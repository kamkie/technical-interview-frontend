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
- provenance, including source request, creator, date, and source artifacts consulted
- lifecycle status and planning readiness
- linked artifacts with owner role and expected status
- in-scope and out-of-scope boundaries
- decisions, assumptions, open questions, and accepted fallbacks
- task slices with status, goal, owned files, read-only context, behavior to preserve, deliverables, validation checkpoint, and commit checkpoint
- dependency order and readiness state for each executable slice
- blockers and replan triggers
- validation plan and review expectations
- handoff expectations
- validation results as commands are run

Keep plan content specific to the selected work. Do not introduce generic command wrappers, broad workflow-state directories, or reusable process scaffolds unless the selected roadmap work names that need.

## Readiness Rules

A plan is ready when:

- the objective is clear enough to test or document
- source documents and truth-priority conflicts have been identified
- write ownership is scoped narrowly enough for workers
- selected tasks have clear `Ready`, `Waiting`, or `Blocked` states
- known decisions are recorded or a fallback is selected
- blockers are real external decisions, credentials, backend contract conflicts, thresholds, or evidence gaps, not routine implementation work
- validation and handoff requirements are explicit

Do not mark a plan ready when the intended behavior cannot be described clearly enough to test or document.

## Status Terms

- `Ready`: the slice can be assigned now from the current repository state.
- `Waiting`: the slice has a normal predecessor dependency and should become ready when that predecessor lands.
- `Blocked`: the slice needs a product choice, backend contract resolution, credential, selected threshold, failure owner, user acceptance gate explicitly required by the current task, or external state that the plan cannot produce.

Keep planned downstream work as `Waiting` when it only depends on earlier selected work. Do not turn planned waiting work into deferred candidate language just because it is later in the sequence.

## Commit Checkpoints

Plan task rows may include commit checkpoints. A checkpoint should state whether commits are authorized by the current plan execution request, what files belong in the commit, and which validation must pass first.

When no current user request or plan checkpoint authorizes a commit, do not commit. When a checkpoint authorizes a commit, keep unrelated user-owned changes out of the commit and use the repository commit-message rules.

## Plan Handoff

A planning handoff should include:

- objective
- relevant rules, contracts, source documents, and truth-priority notes
- proposed file ownership and read-only context
- implementation steps
- required tests and validation
- risks, open questions, explicit non-goals, and stop conditions

Implementation prompts should include the planning handoff or clearly state the coordinator's deltas from it.
