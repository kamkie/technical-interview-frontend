# Spec Documents

> **Activity owner:** repository request specs for the `Spec` activity and the `Request-Spec` cross-cutting trigger.

Use this guide whenever a user input will change repository state.

## Rule

Before any repository-state-changing edit, create a request spec document in `ai/specs/requests/`.

A request spec is a small, durable record of the intended repository state for one user input. It does not replace executable specs, published contracts, plans, or roadmap tracking. When a behavior change has a governing spec or contract, update that governing artifact first as usual and name it from the request spec.

If the request spec conflicts with the latest explicit user input, the user input wins and the request spec must be updated.

## What Counts As State-Changing

A user input is repository-state-changing when satisfying it requires any of:

- creating, editing, deleting, moving, formatting, or generating files
- changing code, tests, docs, AI guides, config, metadata, dependencies, lockfiles, scripts, or assets
- running a command whose intended outcome writes into the repository
- accepting or integrating delegated work that writes into the repository

Read-only analysis, explanations, status checks, reviews with no edits, and commands that only print information do not require a request spec.

## Location And Naming

- Store request specs in `ai/specs/requests/`.
- Name files `YYYY-MM-DD-<short-slug>.md`.
- Create from `ai/templates/REQUEST_SPEC_TEMPLATE.md`.
- Create one request spec for each repository-state-changing user input.
- Keep that request spec updated as execution discovers final affected artifacts, scope changes, or validation results.
- If a later user input is also repository-state-changing, create a new request spec and link to any predecessor when useful.
- If a later user input only clarifies non-state requirements for the same active change, update the current request spec.

## Minimum Content

Every request spec must include:

- the user input or a concise paraphrase
- the intended repository state
- the change class from `AGENTS.md`
- governing specs, contracts, plans, or docs that define the behavior
- affected artifacts expected to change
- validation required by `AGENTS.md`
- completion checklist

## Workflow

1. Classify whether the user input is repository-state-changing.
2. If it is, create the request spec before other repository edits.
3. Keep the request spec aligned when scope changes, affected artifacts change, validation changes, or validation results are known.
4. Apply the usual spec-driven rule: update governing executable specs or published contracts before implementation when behavior changes.
5. At handoff, make sure the request spec describes the final repository state.

## Exemptions

- Do not create a request spec for read-only work.
- Do not create a request spec when the user explicitly asks for a proposal, plan, review, or explanation without repository edits.
- Do not treat the request spec as permission to skip plan, roadmap, contract, changelog, or validation requirements from `AGENTS.md`.
