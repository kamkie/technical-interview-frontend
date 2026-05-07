# Multi-Agent Execution Specification

This document specifies how a repository may use multiple agents or skills during coding work while preserving clear ownership, integration discipline, and the activity model from `ai/specs/APPLICATION_LIFECYCLE_SPEC.md`.

This spec is optional. A repository that does not support multi-agent execution remains conformant with the application lifecycle spec by declaring `M0` in `AGENTS.md`.

## 1. Scope

This spec owns:

- when lifecycle activities may be delegated to another agent
- how coordinator, worker, reviewer, verifier, and specialist agents interact
- how skills are used inside an activity
- how write scopes, handoffs, validation, and integration are controlled
- when multi-agent execution must return to `Replan?`

This spec does not own:

- provider-specific agent tooling
- model selection
- cloud environment setup
- branch naming conventions
- release approval policy

Those details belong in `AGENTS.md`, `SETUP.md`, `ai/WORKFLOW.md`, or provider-specific guidance.

## 2. Definitions

- **Coordinator**: the agent or human accountable for the plan, activity routing, integration order, final validation, and user-facing status.
- **Worker Agent**: an agent assigned a bounded implementation, test, documentation, or investigation activity.
- **Reviewer Agent**: an agent assigned to review or challenge another agent's output.
- **Verifier Agent**: an agent assigned to run, reproduce, or independently validate behavior.
- **Specialist Agent**: an agent assigned to a domain-specific activity such as security, accessibility, performance, documentation, or migration review.
- **Skill**: reusable instructions, resources, scripts, or assets used by an agent during an activity. A skill helps execution; it does not replace agent accountability.
- **Write Scope**: the explicit files, directories, modules, or artifacts an agent may edit.
- **Read Scope**: the context an agent may inspect to complete the assigned activity.
- **Handoff Packet**: the assignment contract given to an agent before work starts.
- **Agent Result**: the completion report returned by an agent.
- **Integration Queue**: the ordered set of completed agent outputs awaiting coordinator review and merge.

## 3. Core Rules

1. Every multi-agent task has exactly one Coordinator.
2. Every delegated activity has exactly one accountable agent.
3. Every Worker Agent must receive a bounded Write Scope before editing.
4. Two agents must not own the same Write Scope at the same time unless the Coordinator marks the work as exploratory and read-only for integration purposes.
5. Activities may be delegated only when their inputs, expected outputs, and stop conditions are clear.
6. The Coordinator owns integration, conflict resolution, final validation, and final user-facing reporting.
7. Skills may be used inside activities, but skills do not own activities.
8. Any agent that discovers scope ambiguity, conflicting instructions, or cross-scope coupling must stop and route back through `Replan?`.
9. Final validation must run from the integrated state, not only from an individual worker branch, worktree, or sandbox.

## 4. Execution Modes

| Mode | Use when | Concurrency |
| --- | --- | --- |
| `M0: solo` | multi-agent execution is not supported | one agent |
| `M1: sidecar-readonly` | background scan, review, or verification can run without editing | coordinator plus read-only agent |
| `M2: bounded-worker` | one worker can edit a clearly bounded Write Scope | coordinator plus one worker |
| `M3: parallel-sliced` | implementation can be split by file, module, package, route, feature boundary, or artifact type | coordinator plus multiple workers |
| `M4: full-sidecar` | implementation, verification, docs, security, or migration review can safely proceed in parallel | coordinator plus workers, reviewers, verifiers, and specialists |

The declared repository level belongs in `AGENTS.md`.

## 5. Activity Delegation Matrix

| Activity | Delegation policy | Notes |
| --- | --- | --- |
| `Scan` | delegatable | Good read-only explorer activity. |
| `Frame` | coordinator-owned | Agents may gather background context, but the Coordinator owns final scope. |
| `Clarify?` | coordinator-owned | User-facing ambiguity gate. |
| `Capture?` | delegatable | Coordinator approves durable learnings. |
| `Intake` | coordinator-owned | Active-work tracking should not be split casually. |
| `Refine` | coordinator-owned | Agents may draft candidate restatements. |
| `Prioritize` | coordinator or human-owned | Requires product judgment. |
| `Sequence` | coordinator-owned | Defines dependency order and later delegation boundaries. |
| `Sync` | coordinator-owned | Agents may propose updates; Coordinator applies final state. |
| `Design` | coordinator-owned | Competitive exploration is allowed, but one design must be selected. |
| `Spec` | coordinator-owned | Agents may draft; Coordinator approves governing behavior. |
| `Decompose` | coordinator-owned | Produces the Write Scope map used by workers. |
| `Validate-Plan` | delegatable | Independent review is recommended for multi-agent plans. |
| `Replan?` | coordinator-owned | Triggered by ambiguity, coupling, or invalid assumptions. |
| `Code` | delegatable | Requires explicit Write Scope and expected validation. |
| `Docs` | delegatable | May use a docs-focused agent or skill. |
| `Commit` | coordinator-owned | Workers may prepare a diff; Coordinator controls final history unless repo policy says otherwise. |
| `Handoff` | assigned-agent owned | Each agent reports its own result; Coordinator summarizes overall status. |
| `Plan-Tests` | delegatable | Test strategy should be reviewed separately for high-risk changes. |
| `Author-Tests` | delegatable | Prefer independent test authorship when behavior risk is high. |
| `Run` | delegatable | Command, status, and important output must be reported. |
| `Diagnose?` | delegatable | Useful as an independent failure-analysis activity. |
| `Fix?` | delegatable | Must remain inside the assigned Write Scope unless replanned. |
| `Re-run` | delegatable | Must rerun the relevant previously failing validation. |
| `Record` | coordinator-owned | Validation log is part of authoritative plan state. |
| `Self-Review` | assigned-agent owned | Each agent reviews its own diff before handoff. |
| `Code Review` | reviewer-owned | Should be separate from the implementing agent. |
| `Security Review?` | specialist or human-owned | Required when security triggers fire. |
| `Docs Review?` | specialist or reviewer-owned | Required when docs are user-facing or contract-heavy. |
| `Decide` | coordinator or reviewer-owned | Approval authority must be explicit. |
| `Re-validate` | coordinator or verifier-owned | Must run from the integrated state. |
| `Resolve-Conflicts?` | coordinator-owned | Workers may advise, but Coordinator owns the merged result. |
| `Merge` | coordinator-owned | Integration branch control remains centralized. |
| `Post-Merge-Verify` | coordinator or verifier-owned | Must verify the integration branch state. |
| `Gate` | coordinator or human-owned | Release authority is not delegated implicitly. |
| `Tag` | coordinator or release owner | Follow repository release policy. |
| `Notes` | delegatable | Coordinator or release owner approves final notes. |
| `Publish` | coordinator, release owner, or human-owned | Do not parallelize final publish authority. |
| `Post-Release-Cleanup` | coordinator-owned | Includes plan archival and roadmap sync. |

## 6. Handoff Packet

Each delegated activity must receive a handoff packet before work starts:

```md
## Agent Handoff Packet

- Activity:
- Objective:
- Source plan / issue:
- Required context:
- Write Scope:
- Read Scope:
- Out-of-scope files:
- Expected output:
- Required validation:
- Stop conditions:
- Branch / worktree / sandbox:
- Skills allowed:
- Reporting format:
```

The Write Scope must be specific enough that a reviewer can tell whether the agent edited outside its assignment.

## 7. Agent Result

Each delegated agent must return an Agent Result:

```md
## Agent Result

- Activity completed:
- Files changed:
- Decisions made:
- Validation run:
- Validation result:
- Known risks:
- Follow-up needed:
- Ready for integration: yes/no
```

When validation fails, the result must include the failing command, the failure summary, and whether the agent recommends `Fix?`, `Diagnose?`, or `Replan?`.

## 8. Integration Rules

1. The Coordinator reviews every Agent Result before integration.
2. Integration happens one result at a time unless the results are known to be independent.
3. After each integration step, the Coordinator runs the smallest relevant validation for the affected surface.
4. If integration changes another agent's assumptions, affected agents must be re-briefed before continuing.
5. Conflicts that require behavior decisions must route through `Replan?`.
6. The final validation command must run after all accepted results are integrated.

## 9. Replan Triggers

Multi-agent execution must route to `Replan?` when:

- two agents need the same Write Scope
- a worker finds a missing, stale, or contradictory spec
- a validation failure cannot be isolated to one Write Scope
- integration requires a design decision not present in the plan
- an agent edits outside its assigned Write Scope
- review finds that two outputs implement incompatible behavior
- a skill changes the expected output, required validation, or artifact ownership

## 10. Required Plan Additions

Plans using `M1` or higher must include:

```md
## Multi-Agent Execution

- Mode:
- Coordinator:
- Agents:
- Write-scope map:
- Integration order:
- Shared-risk areas:
- Required independent reviews:
- Final validation:
```

Plans using `M3` or higher must also include:

```md
## Integration Queue

| Order | Agent | Activity | Write Scope | Expected output | Validation |
| --- | --- | --- | --- | --- | --- |
```

## 11. Skill Use

Skills are allowed when they improve repeatability or access to specialized procedures. The Handoff Packet must name any required or allowed skills.

Rules:

1. A skill may provide instructions, scripts, templates, assets, or domain references.
2. A skill does not own the activity result.
3. The agent using the skill owns all edits, validation, and reporting produced with it.
4. A skill that introduces new files, generated assets, or external dependencies must be named in the Agent Result.
5. If a skill's instructions conflict with repository rules, repository rules win unless the Coordinator replans.

## 12. Repository Wiring

To adopt this spec, a repository must:

1. Reference this file from `AGENTS.md`.
2. Declare its multi-agent level (`M0` through `M4`) in `AGENTS.md`.
3. Add multi-agent fields to the plan template when declaring `M1` or higher.
4. Define branch, worktree, sandbox, or cloud-task mechanics in `ai/WORKFLOW.md`.
5. Define any required specialist skills or guides in the Phase Owner Map or conditional descriptive guides.

## 13. Minimum Safe Default

The recommended starting point is `M2: bounded-worker`.

At `M2`, a Coordinator may delegate one bounded implementation, test, documentation, or investigation activity at a time, with an explicit Write Scope and Agent Result. This provides useful delegation without requiring the repository to support parallel integration queues.
