# Development Lifecycle

This document owns the human-facing lifecycle for frontend repository changes. Keep it lean and contract-first: frontend behavior follows the imported backend contract, and durable rules belong in the smallest document, test, or spec that owns them.

## Core Lifecycle

Use these named phases for any change that modifies repository state. Small direct requests can run the same phases as a short loop; larger or riskier work should make the current phase explicit.

### 1. Intake

Identify the user-visible behavior, repository rule, product intent, release state, or validation boundary being changed. Note any stable refs, such as roadmap IDs, spec names, plan IDs, prompt filenames, or concrete file paths. Clarify whether the request is for analysis, planning, implementation, validation, review, commit, or release work.

Stop and clarify when the intended behavior cannot be described clearly enough to test, document, or route to an owner.

### 2. Orient

Before edits, check the current worktree and treat existing changes as user-owned unless the task says otherwise. Load only the owner artifacts, focused references, prompts, specs, plans, contract files, or source files needed for the requested phase.

### 3. Route

Choose the path early: direct one-off work, bug triage, design, prompt-guided report, plan authoring, active-plan execution, release readiness, or closeout. Find the smallest owner artifact for the behavior or rule, using the artifact routing table below.

Small documentation cleanup and narrow implementation of already-decided behavior can stay on the direct one-off path when no design or plan gate is triggered.

### 4. Design

Use design when frontend product direction, workflow hierarchy, visual treatment, responsive behavior, UI state coverage, screenshots, drafts, or interaction variants need review before production implementation. Durable product and design intent belongs in `docs/DESIGN.md`; selected scope, milestone status, dependencies, and product non-goals stay in `ROADMAP.md`.

### 5. Plan

Use a plan when the work needs sequencing, disjoint write scopes, worker coordination, multiple owners, multiple commits, unresolved choices, or broader validation coordination. Plans coordinate execution, but durable rules still move into the owning contract, test, document, focused reference, roadmap row, or source file.

### 6. Implement

Update the owner before or alongside implementation when behavior, rules, selected scope, or durable documentation changes. Keep the change scoped to the requested behavior and make the smallest coherent edit. For API-facing work, preserve the imported backend contract and refresh contract artifacts only through the backend contract workflow.

### 7. Validate

Choose validation from `.agents/references/testing.md` based on the diff and risk. Use `docs/LOCAL_DEVELOPMENT.md` and `package.json` for command details, local procedure, setup, and environment notes. Report skipped validation with the reason.

### 8. Review And Close Out

Review for behavior drift, backend contract drift, documentation drift, missing tests, missing validation, and scope leaks before handoff. Report changed files, validation, skipped checks, roadmap changes by stable ID when applicable, and remaining risks.

### 9. Commit

Commit only when the user asks or an active plan checkpoint authorizes it. Before committing, confirm the diff matches the requested scope, validation and review evidence are current, and unrelated user-owned changes are preserved.

### 10. Release

Release work starts only when the user explicitly requests a release boundary or release preparation. Use `.agents/references/releases.md` for release sequencing, changelog promotion, package metadata, Docker evidence, tags, publication guardrails, and post-release roadmap cleanup.

## Artifact Routing

| Change                                        | Primary owner                                                                                     | Also update when needed                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend API integration                       | `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, generated API types | API client code, affected UI, tests                                                 |
| Session, auth, CSRF, or localization behavior | Backend contract artifacts and executable tests                                                   | Route guards, smoke notes, affected docs                                            |
| UI behavior                                   | Component/page code and user-facing tests                                                         | `docs/specs/` when behavior is broad or ambiguous                                   |
| Product or design intent                      | `docs/DESIGN.md`                                                                                  | `ROADMAP.md` when selected scope, status, dependencies, or product non-goals change |
| Setup, commands, local troubleshooting        | `docs/LOCAL_DEVELOPMENT.md`                                                                       | `SETUP.md`, package scripts, tool config                                            |
| Validation selection                          | `.agents/references/testing.md`                                                                   | `docs/LOCAL_DEVELOPMENT.md` for command details, procedure, setup, and environment  |
| Human AI collaboration guidance               | `docs/WORKING_WITH_AI.md`                                                                         | `CONTRIBUTING.md` and AI references when they exist                                 |
| Product, roadmap, or release scope            | `ROADMAP.md`                                                                                      | `docs/DESIGN.md`, specs, `CHANGELOG.md`, release docs                               |
| Completed roadmap summaries                   | `docs/ROADMAP_ARCHIVE.md`                                                                         | `ROADMAP.md` links to the archive and keeps only active, planned, or deferred work  |
| Shipped user-visible history                  | `CHANGELOG.md`                                                                                    | `ROADMAP.md` during release cleanup                                                 |

Do not store durable rules only in plans, scratch notes, or final handoffs.

## When To Use Each Artifact

Use `docs/DESIGN.md` when work changes durable frontend product or design intent, including route-level experience direction, workflow priorities, or UI non-goals. Design intent should not carry roadmap status, dependencies, or release state.

Use a `ROADMAP.md` row when work changes selected product scope, roadmap status, dependencies, release scope, blocked backlog, or product non-goals. A roadmap row should name the scope and the condition for done; it should not carry endpoint schemas or long procedures.

Use `docs/ROADMAP_ARCHIVE.md` when completed roadmap milestones leave the active roadmap. Keep released user-visible history in `CHANGELOG.md`.

Use a spec under `docs/specs/` when user-visible behavior is too broad or ambiguous for a roadmap row. A good spec names the backend contract source, visible states, access rules, error behavior, and the tests that should prove the behavior.

Use a plan under `.agents/plans/` for coordinated execution across milestones, workers, or commits. A plan is an execution contract, not the long-term home for rules. Move durable decisions into the owning docs, specs, tests, or roadmap rows.

Use an ADR only for durable architectural decisions with meaningful alternatives and long-term consequences. Keep ADRs short: context, decision, consequences, and revisit trigger. Do not create ADRs for routine implementation details.

Use `CHANGELOG.md` for shipped, user-visible history and release-relevant documentation or tooling changes. Keep unreleased candidate entries under `Unreleased` until a release tag is cut.

## Contract-First Work

API-facing frontend work starts from the imported backend artifacts in `docs/backend/`. If those artifacts appear stale or conflict with the sibling backend repository, use `docs/backend/README.md` to refresh them before implementing API-facing behavior.

Exact browser boundary, auth, CSRF, localization, pagination, request, and response rules stay in the imported backend artifacts, not in this lifecycle overview.

## Completion Checklist

Before handoff, confirm:

- the owning artifact changed when the behavior or rule changed
- backend contract artifacts stayed authoritative for API-facing behavior
- product and design intent stayed in `docs/DESIGN.md` while roadmap status and selected scope stayed in `ROADMAP.md`
- entry-point docs link to owners instead of duplicating full procedures
- validation selection matches the change type from `.agents/references/testing.md`
- command details, local procedure, and environment notes stay in `docs/LOCAL_DEVELOPMENT.md`
- skipped validation is reported with the reason
