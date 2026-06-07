# AI Plan Execution Reference

This file owns active-plan execution rules for delegated milestone, spec, and task-packet work in this frontend repository. Use it when the user asks to implement an active plan.

## Execution Contract

When the current user request asks to implement an active plan, the plan is the execution contract. The coordinator executes the next eligible plan packet, not a different interpretation of the roadmap or a new direct-implementation path.

The coordinator may update coordinator-owned plan or status documents, assign workers, review worker output, run validation, resolve integration issues, and create plan-authorized commits. Milestone, spec, and task-packet implementation must be delegated to workers with explicit file ownership and scoped validation requirements.

## Dependency Order

Execute in dependency order:

1. Select the next `Ready` milestone, spec, or task packet from the active plan.
2. Assign a planning worker when the packet needs a handoff or the plan requires one.
3. Assign a separate implementation worker with exact write scope and validation.
4. Review the worker output for owner drift, contract drift, validation gaps, and scope leaks.
5. Run or verify required validation.
6. Update the packet result summary and create the task's plan-authorized commit checkpoint after validation and before promoting dependent packets.
7. Promote dependent `Waiting` packets to `Ready` only after predecessor work lands according to the plan.

Do not treat later roadmap dependencies, missing future specs, optional review points, or future quality gates as blockers for a currently `Ready` packet.

## Status Meanings

- `Ready`: the coordinator may assign the packet now.
- `Waiting`: normal predecessor dependency; promote when the predecessor lands, validates, and any required checkpoint is complete.
- `Blocked`: unresolved product choice, backend contract conflict, required credential, selected threshold, failure owner, explicit user acceptance gate, or external state that cannot be produced by the plan.
- `Complete`: packet deliverables, validation, review, result summary, and required checkpoint are done.

Stop before implementation only when the next `Ready` packet is actually blocked by a decision or external condition that cannot be resolved from the current request, backend contract, executable tests, owner documents, or plan.

## Coordinator Ownership

The coordinator owns:

- active-plan sequencing and status updates
- user-owned dirty-worktree protection
- shared-file assignment
- worker prompts, packet dispatch, and handoff review
- final validation selection and reporting
- plan-authorized commits when the current request and checkpoint allow them

The coordinator does not implement milestone, spec, or repository-changing task packets directly when the active plan calls for delegated execution. Worker prompts must include repository path, relevant instructions, read-only context, escalation-only context, write scope, validation, stop conditions, and output requirements.

## Commit Checkpoint Handling

When an active plan contains commit checkpoints and the current user request asks to implement that plan, those checkpoints are commit authorization for the scoped plan work.

- Expect repository-changing task packets to have one checkpoint per packet or approved parallel wave, scheduled after required validation and review.
- Commit only the files owned by the completed packet or approved parallel wave.
- Keep unrelated user-owned and parallel-worker changes out of the commit.
- Run the checkpoint validation first unless the plan explicitly allows a narrower recovery commit.
- Use the repository commit-message format.
- Do not batch multiple validated packets into one commit unless the plan explicitly combines them into the same task checkpoint or approved parallel wave.
- Do not create extra cleanup commits for files outside the packet or assigned scope.

If the active plan has no checkpoint or the current request does not authorize plan execution commits, report the completed work without committing.

## Stop And Replan Triggers

Stop and replan when:

- the next executable packet lacks clear owner files or validation
- the intended behavior cannot be described clearly enough to test or document
- a backend contract conflict appears and cannot be resolved from imported contract artifacts
- unexpected dirty changes appear inside a worker's assigned write scope
- implementation would require editing outside the active packet's authorized scope
- a durable rule would otherwise live only in the plan after completion
- roadmap status, selected scope, or product non-goals need to change but roadmap editing was not assigned
- a worker output contradicts the plan, `AGENTS.md`, backend contract artifacts, or owner documents

Routine validation failures, optional review steps, ordinary implementation defects, or work that can be delegated are not stop conditions by themselves. Fix, reassign, or record them according to the plan.

## Final Validation And Handoff

At the end of a plan run or packet handoff:

- report all changed files
- report validation commands and results
- list skipped checks with reasons
- state whether `ROADMAP.md` changed and which stable IDs or references changed
- state which task packet result summaries were updated
- summarize remaining risks, contradictions, smoke gaps, contract gaps, or blocked follow-up work

Use `.agents/references/testing.md` for validation selection and `.agents/references/reviews.md` for review triggers.
