# Change Closeout

Check whether a completed ordinary frontend change is ready for handoff or commit, without treating it as a release-readiness pass.

## Read First

- `AGENTS.md`
- `.agents/references/execution.md`
- `.agents/references/testing.md`
- `.agents/references/reviews.md`
- `.agents/references/documentation.md`
- `.agents/prompts/README.md`
- this prompt
- the current diff, named roadmap item, plan, validation output, or changed files supplied by the user

Load source files, tests, owner docs, roadmap rows, specs, plans, changelog, or backend contract artifacts only when the diff or named artifact shows they may be affected. Load `.agents/references/releases.md` only when release, changelog promotion, Docker image, GHCR publication, tag, or GitHub Release readiness is in scope.

## Output

Return a closeout note with:

- change boundary and whether the diff matches the requested scope
- owner docs, specs, roadmap rows, plans, changelog, prompts, focused references, or backend contract artifacts that are required, complete, missing, or not applicable
- validation commands already run and their results
- skipped validation with concrete reasons and remaining risk
- self-review findings: bugs, regressions, backend contract drift, documentation drift, accessibility risk, unsupported behavior claims, or missing tests
- commit readiness, including whether commits are allowed or required by the current request or active plan checkpoint
- follow-up actions that must happen before handoff, before commit, or later

For active plan work, include plan status and task-result evidence that must be current before the next task or commit checkpoint.

## Non-Goals

- Do not perform release readiness unless the user asks for a release boundary.
- Do not create a commit unless the user asks for it or the active plan checkpoint requires it.
- Do not mark roadmap items, plans, or specs complete unless validation and review evidence support that state.
- Do not paste raw test output, logs, or worker transcripts into the closeout note.
