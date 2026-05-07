# Testing

> **Phase owner:** Testing (lifecycle spec §2 phase 5). **Activity group:** §3.5 *Testing And Verification*. **Loop:** §5.4 *Red-Green Loop*.

## Activities Owned (in order)

`Plan-Tests` → `Author-Tests` → `Run` → `Diagnose?` → `Fix?` → `Re-run` → `Record`

## Workflow

1. **Plan-Tests.** Look up the change-class in `AGENTS.md` *Validation Table* and pick the **smallest sufficient** validation. Do not over-test internal refactors; do not under-test public-behavior changes.
2. **Author-Tests.** Add or update the executable spec **before** the implementation lands when the change-class is *Public behavior change* (spec §8 spec-first rule).
   - Bug: write a reproducer that fails before the fix.
   - Feature: write tests for core logic, negative scenarios, and edge cases.
   - Refactor: identify existing tests that cover the path; add coverage only where missing.
3. **Run.** Execute the canonical command from `AGENTS.md` *Local Environment* (or the targeted subset named by the plan).
4. **Diagnose?** On failure, read the actual output before changing anything. Default assumption: failures are caused by the current change.
5. **Fix?** Apply the smallest correction to **implementation, test, or spec**. Never bypass or weaken a failing test by skipping, disabling, mocking-around, or weakening assertions.
6. **Re-run.** Confirm the previously failing validation now passes.
7. **Record.** Write the actual outcome (command + result) into the plan's *Validation Results*.

## Default Test Layers

TODO: replace with the layers this repo actually has.

- unit
- integration
- contract / API compatibility
- end-to-end / smoke
- benchmark / performance gate

## Stochastic / ML / Statistical Tasks

When applicable:

- set deterministic seeds
- list every required validation metric in the plan
- run components on a small sample before the full pipeline

## Hand-Off

Testing is complete when:

- the validation listed for the change-class passed
- the plan's *Validation Results* records the exact command and outcome
- no test was disabled, skipped, or weakened to force a pass
