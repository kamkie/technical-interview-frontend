# Development Lifecycle

This document owns the human-facing lifecycle for frontend repository changes. Keep
it lean and contract-first: frontend behavior follows the imported backend contract,
and durable rules belong in the smallest document, test, or spec that owns them.

## Core Lifecycle

Use this sequence for any change that modifies repository state:

1. Name the user-visible behavior, repository rule, or release state being changed.
2. Find the owner artifact for that behavior.
3. Update the owner before or alongside implementation.
4. Make the smallest coherent change.
5. Run the smallest validation that proves the change and report skipped checks.

Stop and clarify when the intended behavior cannot be described clearly enough to
test, document, or route to an owner.

## Artifact Routing

| Change | Primary owner | Also update when needed |
| --- | --- | --- |
| Backend API integration | `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, generated API types | API client code, affected UI, tests |
| Session, auth, CSRF, or localization behavior | Backend contract artifacts and executable tests | Route guards, smoke notes, affected docs |
| UI behavior | Component/page code and user-facing tests | `docs/specs/` when behavior is broad or ambiguous |
| Setup, commands, local troubleshooting | `docs/LOCAL_DEVELOPMENT.md` | `SETUP.md`, package scripts, tool config |
| Human AI collaboration guidance | `docs/WORKING_WITH_AI.md` | `CONTRIBUTING.md` and AI references when they exist |
| Product or release scope | `ROADMAP.md` | Specs, `CHANGELOG.md`, release docs |
| Shipped user-visible history | `CHANGELOG.md` | `ROADMAP.md` during release cleanup |

Do not store durable rules only in plans, scratch notes, or final handoffs.

## When To Use Each Artifact

Use a `ROADMAP.md` row when work changes selected product scope, release scope, or a
multi-step milestone. A roadmap row should name the scope and the condition for done;
it should not carry endpoint schemas or long procedures.

Use a spec under `docs/specs/` when user-visible behavior is too broad or ambiguous
for a roadmap row. A good spec names the backend contract source, visible states,
access rules, error behavior, and the tests that should prove the behavior.

Use a plan under `.agents/plans/` for coordinated execution across milestones,
workers, or commits. A plan is an execution contract, not the long-term home for
rules. Move durable decisions into the owning docs, specs, tests, or roadmap rows.

Use an ADR only for durable architectural decisions with meaningful alternatives and
long-term consequences. Keep ADRs short: context, decision, consequences, and revisit
trigger. Do not create ADRs for routine implementation details.

Use `CHANGELOG.md` for shipped, user-visible history and release-relevant
documentation or tooling changes. Keep unreleased candidate entries under
`Unreleased` until a release tag is cut.

## Contract-First Work

API-facing frontend work starts from the imported backend artifacts in
`docs/backend/`. If those artifacts appear stale or conflict with the sibling backend
repository, refresh them before implementing API-facing behavior and regenerate the
checked API types.

Frontend code must continue to use same-origin `/api/**` browser traffic, session
cookies, metadata-driven login/logout paths, and configured CSRF cookie/header names.
Do not invent endpoints, request fields, auth headers, CORS paths, bearer tokens, or
alternate transports.

## Completion Checklist

Before handoff, confirm:

- the owning artifact changed when the behavior or rule changed
- backend contract artifacts stayed authoritative for API-facing behavior
- entry-point docs link to owners instead of duplicating full procedures
- validation matches the change type from `docs/LOCAL_DEVELOPMENT.md`
- skipped validation is reported with the reason
