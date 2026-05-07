# Contributing

Thanks for your interest in contributing.

## Before You Start

1. Read `AGENTS.md` — it is the source of truth for the engineering rules and the lifecycle this repo follows.
2. Check `ROADMAP.md` — make sure the change you want is in scope or already planned.
3. Read `SETUP.md` — get a working local environment.

## Spec-Driven Development

This repository follows the spec-driven flow described in `AGENTS.md` *Core Approach*. In short:

1. Find or create the spec artifact that defines the behavior you want to change.
2. Update or add the spec **first**.
3. Implement the smallest change that satisfies the updated spec.
4. Run the validation listed in `AGENTS.md` *Validation Table* for your change-class.

If the behavior is not yet clear enough to express as a spec, open a Discovery item against `ROADMAP.md` instead of starting implementation.

## Workflow

1. **Plan** — for non-trivial changes, create a plan from `ai/templates/PLAN_TEMPLATE.md` under `ai/plans/active/PLAN_<title>.md`. Follow `ai/PLANNING.md`.
2. **Implement** — follow `ai/EXECUTION.md` (single milestone) or `ai/PLAN_EXECUTION.md` (whole plan).
3. **Test** — follow `ai/TESTING.md`. Record the validation result in the plan.
4. **Review** — follow `ai/REVIEWS.md`. Self-review first, then request peer review.
5. **Integrate** — follow `ai/WORKFLOW.md` for branch / merge / PR mechanics.
6. **Release** — only when the change is integrated and release-ready (`ai/RELEASES.md`).

## Pull Requests

- Title: TODO (e.g. Conventional Commits header).
- Description: link the plan, the roadmap entry, and the validation result.
- Definition of Done: see `AGENTS.md` *Definition Of Done*.

## Commit Messages

TODO: conventions (e.g. Conventional Commits, sign-off, co-author trailers).

## Code Of Conduct

TODO: link or inline.

## License

TODO: by submitting a contribution you agree to license it under the project's license (`README.md`).
