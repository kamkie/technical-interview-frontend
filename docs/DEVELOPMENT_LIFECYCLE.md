# Development Lifecycle

This document owns the human-facing lifecycle for frontend repository changes. Keep it lean and contract-first: frontend behavior follows the imported backend contract, and durable rules belong in the smallest document, test, or spec that owns them.

## Core Lifecycle

Use this sequence for any change that modifies repository state:

1. Name the user-visible behavior, repository rule, or release state being changed.
2. Find the owner artifact for that behavior.
3. Update the owner before or alongside implementation.
4. Make the smallest coherent change.
5. Run the smallest validation that proves the change and report skipped checks.

Stop and clarify when the intended behavior cannot be described clearly enough to test, document, or route to an owner.

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
