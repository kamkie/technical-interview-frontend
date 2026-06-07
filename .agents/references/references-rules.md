# AI Reference Maintenance

This file owns AI-facing rules for maintaining focused `.agents/references/*.md` guides in this frontend repository.

## Purpose

Focused references are small owner guides for AI procedure. They should help agents find the durable owner document, contract, test, or command without copying full human docs or backend contract detail.

Use a focused reference when a recurring AI workflow needs more detail than belongs in `AGENTS.md`, a final response, or an active plan. Do not add a reference file for one-off notes, scratch decisions, or rules that already have a clear durable owner.

## Ownership Rules

- Keep each reference scoped to one procedure area, such as documentation routing, roadmap editing, validation selection, review triggers, release work, reference maintenance, architecture placement, code style, execution, workflow, planning, plan execution, or troubleshooting.
- Point to the human owner document, backend contract artifact, executable test, generated type, roadmap row, or package script that owns behavior.
- Do not copy endpoint schemas, request fields, authentication details, setup steps, release procedures, or roadmap bodies when a source document already owns them.
- Do not use focused references to change product scope, API behavior, release status, or selected roadmap work by implication.
- Keep backend API behavior subordinate to `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, and `docs/backend/README.md`.
- Keep `AGENTS.md` lean by routing detailed AI procedure here instead of duplicating full instructions.
- Keep active plans under `.agents/plans/` focused on execution coordination; move durable rules into the relevant reference, human doc, test, contract, or roadmap row before the plan is complete.

## Adding Or Removing References

When adding a focused guide:

- confirm the procedure is recurring enough to need a durable AI owner
- choose the smallest filename and title that describe the procedure area
- link or name the authoritative owner documents instead of restating them
- add or update routing in `.agents/references/documentation.md` when the new guide changes artifact routing
- add or update `AGENTS.md` only when the root entry point needs to advertise the guide
- run the validation selected by `.agents/references/testing.md`

When removing or merging a focused guide:

- move any still-valid rule into the remaining owner before deleting it
- remove stale routing from `AGENTS.md`, `.agents/references/documentation.md`, active plans, and human docs that reference it
- preserve the underlying owner document, test, contract, or roadmap row unless the task explicitly changes that behavior

## Duplication Checks

Before handoff, check for overlap:

- If two references give different procedure for the same change type, keep the rule in the more specific owner and route the other file to it.
- If a reference repeats a human-facing procedure, replace the copy with a pointer to the human owner and keep only AI-specific decision rules.
- If a reference repeats backend contract detail, replace the copy with a high-level invariant and point to `docs/backend/`.
- If a plan contains durable guidance that will outlive the plan, move that guidance into the right owner document before marking the plan complete.
