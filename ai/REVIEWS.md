# Reviews

> **Phase owner:** Review (lifecycle spec §2 phase 6). **Lens group:** §3.6 *Review*. **Loop:** §5.5 *Review Loop*.

## Lenses Owned (in order)

`Self-Review` → `Code Review` → `Security Review?` → `Docs Review?` → `Decide`

## Self-Review Priority List

Run before requesting peer review. Stop at the first miss and fix it.

1. Spec is updated (or explicitly N/A for the change-class).
2. Behavior matches the spec; no scope creep.
3. Validation listed in the plan was actually run; result is recorded.
4. Public contract artifacts updated when behavior changed.
5. AI guides updated when repo-wide guidance changed.
6. No disabled / skipped / weakened tests.
7. No secrets, credentials, or environment-specific paths committed.
8. Code style follows `CODE_STYLE.md`.
9. Diff is the smallest that satisfies the spec.

## Code Review

Peer-style review of the validated diff. Reviewers check the same priority list above plus:

- code is readable and follows existing patterns
- error handling and edge cases are covered
- no dead code, no commented-out code

## Security Review (conditional)

Triggered when the change touches any of:

- authentication, authorization, session handling
- secrets, credentials, key material
- sensitive user data or PII
- deployment-facing config or CI permissions
- the release / publish path

If triggered, run the security review checklist (TODO: link to repo-specific security skill / guide if present, e.g. `ai/skills/security-best-practices/`). Record the security reviewer in the PR description.

## Docs Review (conditional)

Triggered when the change is documentation-heavy or touches `README.md`, contract docs, or AI guides. Verify routing per `DOCUMENTATION.md`.

## Decision

The reviewer outputs exactly one of:

- **Approve** → exit Review; route to `WORKFLOW.md` *Integration*.
- **Request Changes** → loop back to `EXECUTION.md` (re-enter Implementation).

Record the decision and the reviewer on the PR or in the plan's *Validation Results*.
