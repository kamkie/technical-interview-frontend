# AI Project Instructions

This repository is the first-party browser frontend for the sibling backend repository `technical-interview-demo`.

Keep AI guidance lean and frontend-specific. Route detailed procedure to focused references instead of duplicating it here.

## Core Rule

Frontend behavior follows the imported backend contract; exact API rules live in `docs/backend/`.

Before changing repository state, use `.agents/references/execution.md`; it owns implementation authorization, dirty-worktree protection, owner updates, validation routing, and handoff.

Stop and clarify when the intended behavior cannot be described clearly enough to test, document, or route to an owner.

## Agent Working Style

For non-trivial changes, state the intended behavior and success criteria before implementation.

Prefer the smallest contract-compatible change that satisfies the request. Do not add speculative abstractions, options, or features.

Keep diffs surgical: every changed line should trace to the current task. Do not refactor, reformat, or clean up unrelated code. Remove only unused code created by the current change.

If the request is ambiguous enough that behavior cannot be tested or routed to an owner, stop and clarify.

## Truth Priority

Use this order when sources conflict:

1. Explicit user request in the current task.
2. Imported backend OpenAPI contract: `docs/backend/approved-openapi.json`.
3. Imported backend frontend guidance: `docs/backend/FRONTEND_AI_CONTRACT.md`.
4. Backend REST Docs sources from `technical-interview-demo`, when consulted directly.
5. Frontend executable specs and type checks.
6. Frontend docs in this repo: `docs/DESIGN.md`, `README.md`, `SETUP.md`, `ROADMAP.md`, and this file.

If imported backend artifacts appear stale or conflict with the backend repository, follow `docs/backend/README.md`.

## Local Workflow

Use `docs/LOCAL_DEVELOPMENT.md` and `package.json` for current runtime, package manager, npm scripts, and local workflow details. Use `.agents/references/testing.md` for validation selection.

## Instruction Map

Start with this file and the user's request. Use `.agents/references/documentation.md` for the focused-reference and durable-owner map. Load only the owner files needed for the current task, and do not bulk-load AI guidance, generated contract files, source trees, or archives unless the current task, explicit audit scope, cross-document consistency check, or validation failure requires it.

Use `docs/DEVELOPMENT_LIFECYCLE.md` for named lifecycle phase wording: intake, orient, route, design, plan, implement, validate, review and close out, commit, and release. Keep the phase definitions there instead of duplicating them in AI guidance.

## Artifact Lookup

- Treat `PLAN-<short-kebab-slug>` references as active-plan references and search `.agents/plans/` first, then `.agents/plans/archive/` when the active file is not found.
- Treat `M-AREA-NNN`, `E-AREA-NNN`, and `T-AREA-NNN` references as roadmap references and search `ROADMAP.md` first, then `docs/ROADMAP_ARCHIVE.md` when the active roadmap does not contain the ID.
- Treat `SPEC_<slug>` or `docs/specs/<name>` references as selected frontend behavior specs and search `docs/specs/`.
- Treat named repository prompt references as prompt recipes and search `.agents/prompts/README.md` first, then load only the matching prompt file from `.agents/prompts/`.
- Prefer exact filename lookup when a full filename is supplied. If only an ID or prefix is supplied, use a scoped search in the owning directory before falling back to repository-wide search.

## Execution Routing

Use the focused references for detailed procedure: `.agents/references/execution.md` for ordinary tasks, `.agents/references/workflow.md` for delegation, `.agents/references/plan-execution.md` for active plans, `.agents/references/documentation.md` for owner routing, and `.agents/references/testing.md` for validation.

## Git And Handoff

Use `.agents/references/execution.md` for ordinary git and handoff rules. Use `.agents/references/releases.md` for release commits, annotated tags, changelog promotion, package checks, publication, and post-release cleanup.
