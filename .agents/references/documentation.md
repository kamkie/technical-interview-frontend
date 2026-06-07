# AI Documentation Reference

This file owns AI-facing artifact routing and cross-file alignment checks for this frontend repository. Use it with `docs/DEVELOPMENT_LIFECYCLE.md` when a task changes documentation, repository rules, roadmap scope, product or design intent, setup instructions, active plans, release state, or focused AI references.

## Routing Rules

Start by naming the user-visible behavior, repository rule, product intent, or release state being changed. Then update the smallest owner that can hold the durable rule.

| Change                                                | Owner to update first                                                           | Alignment checks                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend API integration                               | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` | Generated API types, API client, affected UI, and tests still follow the imported contract                                                                          |
| Session, auth, CSRF, or localization behavior         | Backend contract artifacts and executable tests                                 | `AGENTS.md` backend invariants, route guards, smoke notes, and affected docs agree                                                                                  |
| Product or design intent                              | `docs/DESIGN.md`                                                                | `ROADMAP.md` selected scope and affected human docs point to the design owner without moving roadmap status or dependencies into the design guide                   |
| UI behavior                                           | Component/page code and user-facing tests                                       | `docs/DESIGN.md`, selected roadmap IDs, and `docs/specs/` agree when the behavior is broader than a roadmap row                                                     |
| Setup, local commands, troubleshooting, or tool usage | `docs/LOCAL_DEVELOPMENT.md`                                                     | `SETUP.md`, package scripts, tool config, `.agents/references/testing.md`, and `.agents/references/troubleshooting.md` agree when their behavior changes            |
| Human AI collaboration guidance                       | `docs/WORKING_WITH_AI.md`                                                       | `CONTRIBUTING.md`, `AGENTS.md`, and focused AI references link to the same owner when relevant                                                                      |
| AI procedure guidance                                 | Focused files under `.agents/references/`                                       | `AGENTS.md` links to focused references instead of duplicating full rules; `.agents/references/references-rules.md` keeps the focused-reference set non-duplicative |
| Active plan execution                                 | `.agents/plans/`                                                                | Durable rules move into owner docs, tests, contracts, roadmap rows, or focused references before the plan is complete                                               |
| Product, milestone, blocked backlog, or release scope | `ROADMAP.md`                                                                    | Use `.agents/references/roadmap.md` for stable-ID and status editing procedure; design, specs, changelog, and release references agree when selected scope changes  |
| Completed roadmap summaries                           | `docs/ROADMAP_ARCHIVE.md`                                                       | Use `.agents/references/roadmap.md` for archive routing; `ROADMAP.md` keeps current selected, planned, blocked, and non-goal scope                                  |
| Shipped or release-candidate history                  | `CHANGELOG.md`                                                                  | Use `.agents/references/roadmap.md` for changelog routing; `ROADMAP.md`, package metadata, and release notes agree during release work                              |

Do not leave durable rules only in plans, scratch notes, or final responses. Plans can coordinate execution, but the owner document, spec, test, contract, focused reference, or roadmap row must carry the rule after the task is complete.

## Focused AI References

Use focused AI references for procedure details that are too specific for `AGENTS.md` and too AI-specific for human docs. Keep these files small and route back to authoritative owners instead of copying source material.

Current focused owners:

- `.agents/references/documentation.md` owns artifact routing and cross-file alignment checks.
- `.agents/references/roadmap.md` owns roadmap editing, stable-ID handling, archive/changelog routing, and roadmap alignment checks.
- `.agents/references/testing.md` owns validation selection by change type.
- `.agents/references/reviews.md` owns code-review, spec-drift, documentation-drift, and security-review triggers.
- `.agents/references/releases.md` owns release sequencing, version choice, release commits, tags, package checks, publication, release verification, and post-release roadmap cleanup.
- `.agents/references/references-rules.md` owns maintenance rules for focused AI references.

Planned focused owners for this guidance model:

- `.agents/references/architecture.md` should own frontend placement, route/API/client/component boundaries, and where new abstractions belong.
- `.agents/references/code-style.md` should own frontend TypeScript, React, CSS, and edit-shape guidance.
- `.agents/references/execution.md` should own ordinary task execution gates, repository-state checks, and handoff expectations.
- `.agents/references/workflow.md` should own planner, worker, reviewer, verifier, and coordinator workflow details.
- `.agents/references/planning.md` should own plan authoring and readiness rules.
- `.agents/references/plan-execution.md` should own active-plan execution rules for delegated milestone and spec slices.
- `.agents/references/troubleshooting.md` should own validation failure triage and local problem-solving routes.

Use `.agents/references/references-rules.md` when adding, removing, merging, or rerouting focused AI references.

## Cross-File Alignment

Before handoff, check the files that describe the same behavior from different entry points:

- `AGENTS.md` keeps core AI rules, backend integration invariants, and links to focused AI references.
- `docs/README.md` indexes human-facing documentation owners.
- `README.md`, `SETUP.md`, and `CONTRIBUTING.md` should link to owner docs instead of copying procedure bodies.
- `docs/DESIGN.md` owns durable product and design intent; `ROADMAP.md` owns selected scope, stable IDs, status, dependencies, release context, blocked backlog, and product non-goals.
- `ROADMAP.md` tracks current selected, planned, blocked, and non-goal scope; `.agents/references/roadmap.md` owns roadmap editing procedure details.
- `.agents/plans/` coordinates active plan execution but should not become the only owner for durable rules.
- `CHANGELOG.md` tracks release-candidate and shipped user-visible history.
- `docs/specs/` holds selected behavior details only when a roadmap row and design guide are not specific enough.

When two owners disagree, use the truth-priority order in `AGENTS.md`. For API-facing behavior, the imported backend contract artifacts stay authoritative.

## Completion Checks

For documentation and guidance tasks:

- confirm each new or changed rule has exactly one durable owner
- keep entry-point docs linked to the owner instead of duplicating full procedures
- preserve backend integration invariants at a high level and route exact API behavior to `docs/backend/`
- update `ROADMAP.md` when selected scope, milestone status, blocked backlog, release state, or product non-goals change, using `.agents/references/roadmap.md` for stable-ID, archive, and changelog routing
- update `docs/DESIGN.md` when product or design intent changes without changing selected roadmap status
- update `.agents/plans/` only for active execution coordination, then move durable rules to the right owner before completion
- run validation from `.agents/references/testing.md` and report skipped checks
