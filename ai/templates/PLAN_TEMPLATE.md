# Plan: <title>

> Created from `ai/templates/PLAN_TEMPLATE.md`. See `ai/PLANNING.md` for how this template is used.

## Lifecycle

| Field | Value |
| --- | --- |
| Phase | Planning |
| Status | Draft |
| Roadmap entry | TODO: link to `ROADMAP.md` entry |
| Request spec | TODO: link to `ai/specs/requests/YYYY-MM-DD-<logical-task-slug>.md` |
| Change class | TODO: row from `AGENTS.md` *Change-Class Table* |
| Validation level | TODO: row from `AGENTS.md` *Validation Table* |
| Workflow shape | TODO: `linear` (only currently declared workflow mode) |
| Multi-agent mode | TODO: `M0: solo` \| `M1: sidecar-readonly` \| `M2: bounded-worker` |
| Owner | TODO |

## Summary

- What will change
- Why it matters
- How success will be measured

## Scope

- In scope
- Out of scope

## Current State

- Current behavior
- Current constraints
- Relevant existing specs and code

## Requirement Gaps And Open Questions

- Material questions still requiring user input
- Why each gap matters
- Whether planning is blocked or what fallback applies if the user does not answer

## Locked Decisions And Assumptions

- User decisions
- Requirement gaps resolved from repo truth
- Fallback assumptions that the executor should not revisit

## Affected Artifacts

- Request spec
- Specs (executable)
- Published contracts
- Implementation files / packages
- Tests
- Docs (`README.md`, `SETUP.md`, `ai/*.md`)
- `ROADMAP.md` / `CHANGELOG.md`
- Build / benchmark / CI

## Execution Milestones

### Milestone 1: <name>

- goal
- owned files or packages
- shared files reserved to the coordinator (if delegated)
- context required before execution (`none beyond AGENTS.md and this plan` for small milestones; otherwise name exact guides / specs / packages)
- behavior to preserve
- exact deliverables
- validation checkpoint
- commit checkpoint

### Milestone N: <name>

- …

## Multi-Agent Execution

- Mode: TODO: `M0: solo` unless a bounded delegated activity is useful; max supported level is `M2: bounded-worker`
- Coordinator:
- Agents:
- Write-scope map:
- Integration order:
- Shared-risk areas:
- Required independent reviews:
- Final validation:

For every delegated activity, create an `ai/templates/AGENT_HANDOFF_PACKET.md` packet before work starts. Each delegated agent must return `ai/templates/AGENT_RESULT.md` before integration.

## Edge Cases And Failure Modes

- important error cases
- compatibility risks
- migration / rollout concerns

## Validation Plan

- commands to run (mirrors `AGENTS.md` *Validation Table* row for this change-class)
- tests to add or update
- contract / docs checks
- manual verification steps

## Testing Strategy

- unit (logic, edge cases)
- integration (DB, external services)
- contract (API compatibility)
- smoke / benchmark
- negative-path coverage

## Validation Results

- per-milestone outcomes (filled during execution)
- replan events with trigger and decision

## User Validation

- short walkthrough for the user to verify the delivered behavior

## Required Content Checklist

- [ ] what behavior is changing and why
- [ ] which request spec captures the state-changing logical task
- [ ] which `ROADMAP.md` entry tracks this plan
- [ ] what is out of scope
- [ ] which spec / contract artifacts define the behavior
- [ ] which source files are likely to change
- [ ] what compatibility promises must be preserved
- [ ] what edge cases / failure modes / migration / rollout / benchmark risks matter
- [ ] what requirement gaps still need input and whether they block planning
- [ ] which workflow shape fits and why
- [ ] which multi-agent mode fits and why
- [ ] which files stay coordinator-owned if delegation is realistic
- [ ] write-scope map exists for every delegated activity
- [ ] delegated activities have handoff and result packets when `M1` or higher is used
- [ ] context required per milestone
- [ ] which tests / docs / contracts / AI guides must move
- [ ] testing strategy (and N/A layers for docs-only or AI-guidance-only plans)
- [ ] validation that proves completion
- [ ] how the user can verify the delivered behavior
