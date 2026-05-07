# AI Project Instructions

`README.md` is the human-facing counterpart of this file. `SETUP.md` is the environment and onboarding guide. The `ai/` directory contains AI-facing support documents. Keep these aligned where their scopes overlap; do not duplicate setup detail from `SETUP.md` here.

## Lifecycle Spec Conformance

- This repository conforms to **`ai/specs/APPLICATION_LIFECYCLE_SPEC.md`**.
- Pinned spec version: **TODO: e.g. `1.0.0`** (see spec §16).
- Declared conformance level: **TODO: `L1` | `L2` | `L3` | `L4`** (see spec §13). Default for a new repo is `L1`.
- Workflow modes supported: **TODO: e.g. `linear`, `single-plan parallel`, `multi-plan parallel`** (see spec §12 step 3 and `ai/WORKFLOW.md`).

## Role Of This File

`AGENTS.md` is the **Engineering Rules** artifact (spec §7). It owns:

- spec-driven development rule (spec §8)
- truth priority (spec §8.1)
- definition of done (spec §9)
- branch and worktree invariants (spec §10)
- the change-class, validation, and gate tables (spec §12 steps 5–7)
- the cross-cutting trigger map (spec §6)
- the lifecycle owner map (which `ai/` guide owns each phase / lens group)

Do not use this file for setup, IDE walkthroughs, or troubleshooting; those belong in `SETUP.md`.

## Core Approach: Spec-Driven Development

Mirror of spec §8:

1. Identify the behavior being changed.
2. Identify the spec artifact that defines that behavior.
3. Update or add the spec **first**.
4. Implement the smallest code change that satisfies the updated spec.
5. Verify the executable and published specs remain aligned.

If intended behavior is not clear enough to express as a spec, work returns to `Planning` and stays there until it is.

## Truth Priority

Mirror of spec §8.1:

1. explicit user request in the current task
2. executable specs (tests, contract checks, compatibility checks, benchmark gates)
3. published contract documents
4. current-cycle state in `ROADMAP.md`
5. active planning entries in `ai/plans/active/`
6. release history in `CHANGELOG.md`
7. AI- or human-facing guidance documents (`ai/*.md`, `README.md`)

## Authoritative Repository Artifacts

| Spec role (§7) | Repo file | Owner of |
| --- | --- | --- |
| Project Charter | `README.md` | mission, supported scope, public summary |
| Setup Guide | `SETUP.md` | local env, tooling, onboarding |
| Roadmap | `ROADMAP.md` | active-work tracking, sequencing, current cycle |
| Release History | `CHANGELOG.md` | shipped versions |
| Engineering Rules | `AGENTS.md` (this file) | rules, lifecycle, DoD |
| Plan | `ai/plans/active/PLAN_*.md` | per-task decision-complete handoff |
| Executable Spec | **TODO: e.g. `tests/`, `src/test/`** | behavior verified by automation |
| Published Contract | **TODO: e.g. `docs/`, OpenAPI, schemas** | human-facing API/contract |
| Phase Owner Guides | `ai/PLANNING.md`, `ai/EXECUTION.md`, … | per-phase guidance |
| Learnings | `ai/LEARNINGS.md` | durable repo lessons |
| Architecture Snapshot | `ai/ARCHITECTURE.md` | structural map |

## Lifecycle Owner Map

Each phase / lens group has exactly one owner guide. Load `AGENTS.md` first, then add only the owner guide(s) matching the current task.

| Lifecycle phase (spec §2) | Primary owner |
| --- | --- |
| Discovery / Roadmap Intake | `ROADMAP.md`, `ai/PLANNING.md` |
| Planning | `ai/PLANNING.md` |
| Implementation (whole plan) | `ai/PLAN_EXECUTION.md` + target plan |
| Implementation (ad-hoc / single milestone) | `ai/EXECUTION.md` |
| Testing | `ai/TESTING.md` |
| Review | `ai/REVIEWS.md` |
| Integration | `ai/WORKFLOW.md` |
| Release | `ai/RELEASES.md` |
| Deployment | **TODO: `ai/OPERATIONS.md` or skip if L1/L2** |
| Operations | **TODO: `ai/OPERATIONS.md` or skip if L1/L2** |
| Continuous Improvement | `ai/LEARNINGS.md`, `ROADMAP.md` |

Conditional descriptive guides (load only when the task touches them):

- `ai/ARCHITECTURE.md` — structural / package-ownership questions
- `ai/CODE_STYLE.md` — code edits
- `ai/DOCUMENTATION.md` — contract-impacting changes
- `ai/LEARNINGS.md` — recurring repo lessons

## Change-Class Table (spec §12 step 5; consumed by the `Docs` lens)

For each change-class, list the artifacts that must move together.

| Change class | Must update together | Notes |
| --- | --- | --- |
| Public behavior change | governing spec, implementation, executable spec (tests), published contract, `CHANGELOG.md` (when released), `ROADMAP.md` entry | breaking changes also bump pinned version |
| Internal refactor | implementation, existing tests | preserve specs and contract |
| Documentation-only | the doc + any AI guide that owns the same topic | skip Deployment phase |
| Setup / environment | `SETUP.md`, env scripts, **TODO: AI env quick-ref if any** | no contract churn |
| Release-history only | `CHANGELOG.md` | follows Release phase |
| AI guidance change | the owning `ai/*.md` only; `AGENTS.md` only when repo-level rule changes | no contract churn |
| **TODO: add repo-specific classes** | | |

## Validation Table (spec §12 step 6; consumed by `Plan-Tests` / `Run`)

For each change-class, the smallest sufficient validation.

| Change class | Smallest sufficient validation |
| --- | --- |
| Public behavior change | full build + executable specs + contract checks |
| Internal refactor | affected unit + integration tests |
| Documentation-only | doc lint / link check (if any); no test run required |
| Setup / environment | repeat the documented setup on a clean target |
| Release-history only | changelog format check |
| AI guidance change | none (review only) |
| **TODO: add repo-specific classes** | **TODO: e.g. `./build.ps1 build`, `npm test`, `pytest -q`, `go test ./…`** |

The default repo-wide command is: **TODO: `<canonical build/test command>`**.

## Gate Table (spec §12 step 7)

| Phase exit | Gate type | Gate |
| --- | --- | --- |
| Discovery → Roadmap Intake | named approval | requester confirms scope |
| Planning → Implementation | named approval | plan readiness checklist passes (`ai/PLANNING.md`) |
| Implementation → Testing | executable | local build passes |
| Testing → Review | executable | required validation passes; result recorded in plan |
| Review → Integration | named approval | reviewer `Approve` |
| Integration → Release | executable | post-merge checks green on integration branch |
| Release → Deployment | named approval | release manager / **TODO** |
| Deployment → Operations | executable | smoke checks green in target env |

## Cross-Cutting Trigger Map (spec §6)

Each trigger points to the artifact that owns it.

| Trigger | Owner | When it fires |
| --- | --- | --- |
| `Replan` | `ai/PLANNING.md` | execution-time gap, contradicted decision, scope drift |
| `Security Review` | `ai/REVIEWS.md` (+ **TODO: `ai/skills/security-best-practices/` or equivalent**) | auth, secrets, sensitive data, deploy/CI config, release path |
| `Sync` | `ROADMAP.md` | any change affecting active-work tracking or contracts |
| `Capture-Learning` | `ai/LEARNINGS.md` | recurring repo-wide lesson |
| `Docs-Routing` | `ai/DOCUMENTATION.md` | change touches contract or maintainer-facing doc |
| `Context-Hygiene` | `AGENTS.md` (rule below) | between every two lenses |
| `Rollback` | `ai/RELEASES.md` (+ deployment runbook **TODO**) | deployed behavior fails verification |
| `Hotfix` | `ai/RELEASES.md` (+ **TODO: `ai/OPERATIONS.md`**) | production incident |

### Context Hygiene Rule

Between any two lenses (spec §1 *Switch*), drop the prior working set before loading the next. Practical effects:

- close completed plans (move to `ai/archive/`)
- summarize long investigations and discard the raw logs
- avoid bulk-loading reference / prompt / template / archived-plan trees as default context

## Definition Of Done

Mirror of spec §9. A change is complete when **all** hold:

- the intended behavior exists in an appropriate spec artifact
- implementation and specs agree
- public contract artifacts are updated when behavior changed
- required validation has passed and the result is recorded against the plan
- the change has landed on the integration branch (or, when run from a side branch, has been pushed and either merged or proposed via pull request)
- the active-work tracking entry in `ROADMAP.md` reflects the post-change state
- if released, the release artifact is published and notes are written

## Branch And Worktree Invariants

Mirror of spec §10:

- treat **TODO: `main` | `trunk` | `<branch>`** as the integration branch for completed work
- keep side-branch / worktree work isolated until planned scope is complete and locally validated
- prefer merging accepted branches or PRs; cherry-pick only on explicit user request, partial acceptance, or when a normal merge is not viable, and record the reason
- do not cut releases from unintegrated side branches, worktrees, detached tips, or non-integrated changes

Detailed mechanics live in `ai/WORKFLOW.md`.

## Local Environment And Command Execution

See `SETUP.md` for setup walkthroughs and troubleshooting.

The canonical local command entry-point is: **TODO: e.g. `./build.ps1`, `make`, `npm`, `pnpm`, `cargo`, `go`, `pytest`**.

## AI Instruction Load Policy

- read `AGENTS.md` first
- read only the owning AI guide for the current task (see *Lifecycle Owner Map*)
- read active `ai/plans/active/PLAN_*.md` only when planning, executing, verifying, or releasing that plan
- read prompts / templates / detailed references / skill files / archived plans **only** when the task specifically needs them
- do not bulk-load `ai/archive/`, `ai/templates/`, or any reference tree as standing context

## Required Updates By Change Type

Detailed routing lives in `ai/DOCUMENTATION.md`. High-level rules:

- public behavior changes update governing specs + implementation + published contract together
- internal refactors preserve specs and contracts
- setup / env changes route to `SETUP.md`
- roadmap changes route to `ROADMAP.md`; released history goes in `CHANGELOG.md`
- durable AI guidance changes route to the owning `ai/*.md`; update `AGENTS.md` only when repo-level rules or document ownership change

## Git Commits

- never initiate commits unsolicited; commit only when the user or a workflow guide explicitly requests it
- **TODO:** add commit-message convention (e.g. Conventional Commits, repo-specific prefix)
- **TODO:** add co-author trailer policy if AI-authored commits should be attributed
