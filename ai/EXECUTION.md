# Execution (Ad-Hoc / Single Milestone)

> **Phase owner:** Implementation (lifecycle spec §2 phase 4). **Activity group:** §3.4 *Implementation*. **Loop:** §5.3 *Milestone Execution Loop* (single iteration).

Use this guide when:

- the task is a single milestone of an approved plan, **or**
- the change is small enough to skip a multi-milestone plan but still requires implementation discipline

For multi-milestone execution, use `PLAN_EXECUTION.md` instead.

## Activities Owned (in order)

`Spec` → `Code` → `Docs` → `Run` → `Replan?` → `Self-Review` → `Code Review` → `Security Review?` → `Commit` → `Handoff`

## Multi-Agent Use

Default to `M0: solo` for small ad-hoc work. Use `M2: bounded-worker` only when the activity has a clear Write Scope and the handoff can be stated before edits begin.

Delegatable activities at this level:

- `Code` inside explicit owned files or packages
- `Docs` for specific documentation artifacts
- `Author-Tests`, `Run`, `Diagnose?`, or `Fix?` when validation scope is clear

The Coordinator must create `ai/templates/AGENT_HANDOFF_PACKET.md` before delegation and must receive `ai/templates/AGENT_RESULT.md` before integration. If the worker needs files outside the Write Scope, stop and route to `Replan?`.

## Workflow

1. **Spec.** Confirm the spec artifact named by the plan (or by the change-class table) covers the intended behavior. If not, update it first (spec §8).
2. **Code.** Make the smallest change that satisfies the spec. Follow `CODE_STYLE.md`. Touch only files named in the milestone *Owned files* or delegated Write Scope.
3. **Docs.** Apply the routing in `DOCUMENTATION.md` for the change-class. Update contracts and AI guides in the same change when required.
4. **Run.** Execute the smallest sufficient validation from `AGENTS.md` *Validation Table*. Detailed test policy lives in `TESTING.md`.
5. **Replan?** If reality contradicts a locked decision or new design surfaces, stop and route to `PLANNING.md` *Replan Trigger*.
6. **Self-Review.** Run the self-review pass in `REVIEWS.md`.
7. **Security Review?** If any *Security Review* trigger fired (see `AGENTS.md` *Cross-Cutting Trigger Map*), route to `REVIEWS.md` *Security Review*.
8. **Commit.** One commit per milestone unless the plan says otherwise. Update the plan's *Validation Results* in the same commit.
9. **Handoff.** Report status, blockers, and any required push or PR (`WORKFLOW.md`).

## Done Criteria

- validation passed and recorded in the plan
- delegated work has a completed Agent Result when `M2` was used
- contract / docs updates landed in the same change
- branch is in a state ready for `WORKFLOW.md` integration steps
- no `Replan?` is outstanding
