# Plan Execution (Whole Plan)

> **Phase owner:** Implementation (lifecycle spec §2 phase 4) across all milestones of one plan. **Loop:** §5.3 *Milestone Execution Loop* iterated until the plan is complete.

Use this guide when an approved plan in `ai/plans/active/` has multiple milestones to be executed end-to-end.

For a single milestone or a tiny ad-hoc change, use `EXECUTION.md` instead.

## Workflow

1. **Load** the plan and only the owner guides referenced by its current milestone (context hygiene, `AGENTS.md` *Context Hygiene Rule*).
2. For each milestone, in order:
   1. Run the milestone through the `EXECUTION.md` workflow.
   2. Tick the milestone in the plan; record validation outcome in *Validation Results*.
   3. Drop the milestone's working set before loading the next.
3. **Replan?** if a milestone failure cannot be absorbed locally — route to `PLANNING.md`.
4. After the final milestone:
   1. Run the plan-level validation listed in the plan's *Validation Plan* (may exceed any single milestone's check).
   2. Route to `REVIEWS.md` for full-diff review.
   3. Route to `WORKFLOW.md` for integration onto the integration branch.
   4. Update `ROADMAP.md` (`Sync` activity).
   5. Move the plan to `ai/archive/` once integrated; release work continues in `RELEASES.md`.

## Milestone Boundaries

- One commit per milestone is the default. Split only when the plan's *Affected Artifacts* makes that impractical and the plan says so.
- Do not interleave milestone diffs across branches unless the plan's workflow shape is `single-plan parallel` or `multi-plan parallel` (see `WORKFLOW.md`).

## Done Criteria

- every milestone deliverable in the plan is checked off
- plan-level validation passed and recorded
- `ROADMAP.md` reflects post-change status
- plan archived (or scheduled for archive on release)
