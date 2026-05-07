# Spec Documents

> **Activity owner:** repository request specs for the `Spec` activity and the `Request-Spec` cross-cutting trigger.

Use this guide whenever a prompt will change repository state or when deciding whether a prompt continues the active request spec or starts a new logical task.

## Rule

Before any repository-state-changing edit, ensure a request spec document exists in `ai/specs/requests/` for the logical task.

A request spec is a small, durable record of the intended repository state for one logical task. It may cover multiple prompts in one thread when those prompts continue the same task and change repository state. It does not replace executable specs, published contracts, plans, or roadmap tracking. When a behavior change has a governing spec or contract, update that governing artifact first as usual and name it from the request spec.

If the request spec conflicts with the latest explicit user input, the user input wins and the request spec must be updated.

## What Counts As State-Changing

A prompt is repository-state-changing when satisfying it requires any of:

- creating, editing, deleting, moving, formatting, or generating files
- changing code, tests, docs, AI guides, config, metadata, dependencies, lockfiles, scripts, or assets
- running a command whose intended outcome writes into the repository
- accepting or integrating delegated work that writes into the repository

Read-only analysis, explanations, status checks, reviews with no edits, clarification-only prompts that do not change the intended repository state, and commands that only print information do not require creating or updating a request spec.

## Logical Task Boundaries

Continue the active request spec when the prompt:

- refines, corrects, narrows, expands, or reverses part of the same requested change
- asks for follow-up edits to the same affected artifact group
- reports validation feedback or asks for fixes within the same intended repository state

Create a new request spec when the prompt changes topic, starts an unrelated feature or fix, targets an unrelated artifact group, or begins a new logical task after the prior task has been handed off.

If the boundary is ambiguous, state the assumption in the request spec before editing. Ask the user only when the ambiguity materially affects scope or validation.

## Location And Naming

- Store request specs in `ai/specs/requests/`.
- Name files `YYYY-MM-DD-<short-slug>.md`.
- Create from `ai/templates/REQUEST_SPEC_TEMPLATE.md`.
- Create one request spec for each repository-state-changing logical task.
- Keep that request spec updated as state-changing prompts revise scope, affected artifacts, validation, or results.
- Do not record research-only, read-only, or clarification-only prompts that do not change the intended repository state.
- If a later state-changing prompt changes topic, create a new request spec and link to any predecessor when useful.

## Minimum Content

Every request spec must include:

- the state-changing task input(s) or a concise paraphrase
- the intended repository state
- the change class from `AGENTS.md`
- governing specs, contracts, plans, or docs that define the behavior
- affected artifacts expected to change
- validation required by `AGENTS.md`
- completion checklist

## Workflow

1. Classify whether the prompt is repository-state-changing.
2. If it is not state-changing, do not create or update a request spec.
3. If it is state-changing, decide whether it continues the active logical task or changes topic.
4. Create a request spec for a new logical task, or update the active request spec for the same logical task, before other repository edits.
5. Keep the request spec aligned when scope changes, affected artifacts change, validation changes, or validation results are known.
6. Apply the usual spec-driven rule: update governing executable specs or published contracts before implementation when behavior changes.
7. At handoff, make sure the request spec describes the final repository state.

## Exemptions

- Do not create a request spec for read-only work.
- Do not create or update a request spec when the user explicitly asks for research, clarification, a proposal, a plan, a review, or an explanation without repository edits or intended repository-state changes.
- Do not treat the request spec as permission to skip plan, roadmap, contract, changelog, or validation requirements from `AGENTS.md`.
