# Plan Execution (Whole Plan)

> **Phase owner:** Implementation (lifecycle spec §2 phase 4) across all milestones of one plan. **Loop:** §5.3 *Milestone Execution Loop* iterated until the plan is complete.

Use this guide when an approved plan in `ai/plans/active/` has multiple milestones to be executed end-to-end.

For a single milestone or a tiny ad-hoc change, use `EXECUTION.md` instead.

## Multi-Agent Mode

This repository supports `M2: bounded-worker` delegation (`ai/specs/MULTI_AGENT_EXECUTION_SPEC.md`). The plan Owner is the Coordinator unless the plan names someone else.

At `M2`:

- one Worker Agent may own one bounded Write Scope at a time
- read-only sidecar review or validation may run in parallel when it does not block the active milestone
- multiple writing workers and integration queues require a future `M3` workflow update
- the Coordinator owns handoff packets, result review, integration, final validation, and user-facing status

## Workflow

1. **Load** the plan and only the owner guides referenced by its current milestone (context hygiene, `AGENTS.md` *Context Hygiene Rule*).
2. Confirm the plan's *Multi-Agent Execution* section is filled. Use `M0: solo` when delegation does not add value.
3. For each milestone, in order:
   1. If the milestone delegates work, create an `ai/templates/AGENT_HANDOFF_PACKET.md` packet with the exact Write Scope.
   2. Run the milestone through the `EXECUTION.md` workflow.
   3. Require `ai/templates/AGENT_RESULT.md` from any delegated agent before accepting its output.
   4. Review the result against the Write Scope, integrate it, and run the smallest relevant validation.
   5. Tick the milestone in the plan; record validation outcome in *Validation Results*.
   6. Drop the milestone's working set before loading the next.
4. **Replan?** if a milestone failure cannot be absorbed locally — route to `PLANNING.md`.
5. After the final milestone:
   1. Run the plan-level validation listed in the plan's *Validation Plan* (may exceed any single milestone's check).
   2. Route to `REVIEWS.md` for full-diff review.
   3. Route to `WORKFLOW.md` for integration onto the integration branch.
   4. Update `ROADMAP.md` (`Sync` activity).
   5. Move the plan to `ai/archive/` once integrated; release work continues in `RELEASES.md`.

## Milestone Boundaries

- One commit per milestone is the default. Split only when the plan's *Affected Artifacts* makes that impractical and the plan says so.
- Do not interleave milestone diffs across branches. `single-plan parallel` and `multi-plan parallel` are not declared workflow modes in this repo.
- At `M2`, do not keep two writing agents active at the same time. Finish, review, and integrate the current Worker Agent result before assigning another writing Worker Agent.
- Shared files stay Coordinator-owned unless the plan explicitly assigns them to a worker for one activity.

## Done Criteria

- every milestone deliverable in the plan is checked off
- every delegated activity has a handoff packet and result packet
- plan-level validation passed and recorded
- `ROADMAP.md` reflects post-change status
- plan archived (or scheduled for archive on release)
