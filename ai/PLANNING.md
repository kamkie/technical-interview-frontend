# Planning

> **Phase owner:** Planning (lifecycle spec §2 phase 3). **Activity group:** §3.3 *Design, Spec, And Planning*. **Loop:** §5.2 *Plan Loop*.

## Purpose

Turn a roadmap item into a **decision-complete** plan that an Implementer can execute without re-deriving design choices.

## Activities Owned

In-order:

- `Frame` — restate the actual change requested; in/out of scope.
- `Design` — decide product or contract behavior.
- `Spec` — record the decided behavior in the governing executable or published spec artifact (or note that this plan will create it).
- `Decompose` — split into commit-sized milestone checkpoints; pick a workflow mode (see `WORKFLOW.md`).
- `Validate-Plan` — run the readiness checklist below.
- `Sync` — cross-cut to `ROADMAP.md`.
- `Replan?` — re-enter when execution disagrees with locked decisions.

## Workflow

1. Pick the roadmap item from `ROADMAP.md` *Up Next* (or *Active Work* if already in flight).
2. Create `ai/plans/active/PLAN_<short-title>.md` from `ai/templates/PLAN_TEMPLATE.md`.
3. Fill the plan top-down. Stop and ask the user when a *material* requirement gap exists; record fallbacks for non-material gaps as locked assumptions.
4. Run `Validate-Plan` (checklist below). Iterate until it passes.
5. Update `ROADMAP.md`: move the item to *Active Work* with status `Planning` → `Implementation` once approved.
6. Hand off to `EXECUTION.md` (single milestone) or `PLAN_EXECUTION.md` (whole plan).

## Plan Readiness Checklist

A plan is **decision-complete** when the *Required Content Checklist* in `ai/templates/PLAN_TEMPLATE.md` is satisfied **and**:

- governing spec artifact is named (or scheduled to be created in milestone 1)
- each milestone has: goal, owned files, behavior to preserve, deliverables, validation checkpoint, commit checkpoint
- change-class is named (matches a row in `AGENTS.md` *Change-Class Table*)
- validation level is named (matches a row in `AGENTS.md` *Validation Table*)
- workflow shape is named (`linear`, `single-plan parallel`, `multi-plan parallel`)
- every material question is either resolved or explicitly blocking with a fallback

## Replan Trigger

Re-enter Planning when any of: locked decision contradicted by reality, scope drift, design decision discovered mid-execution, or a milestone fails its validation in a way the plan cannot absorb. Record the replan in the plan's *Validation Results* with the trigger and the resulting decision.

## Hand-Off

A planned item leaves Planning when:

- the plan is approved (named approval gate, see `AGENTS.md` *Gate Table*)
- `ROADMAP.md` reflects status `Implementation` (or the next phase the plan starts in)
