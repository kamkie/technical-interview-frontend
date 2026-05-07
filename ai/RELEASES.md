# Releases

> **Phase owner:** Release (lifecycle spec §2 phase 8). **Lens group:** §3.8 *Release*. Triggers `Rollback` and `Hotfix` (spec §6) co-route here.

## Lenses Owned (in order)

`Gate` → `Tag` → `Notes` → `Publish` → `Post-Release-Cleanup`

## Preconditions (Release Gate)

A release may only be cut when **all** hold:

- the change has landed on the integration branch (spec §10)
- post-merge validation is green
- `ROADMAP.md` *Current Project State* names the next target version
- `CHANGELOG.md` *Unreleased* section reflects the change set
- breaking-change policy in `ROADMAP.md` is honored

Releases must **not** be cut from unintegrated side branches, worktrees, or detached tips.

## Workflow

1. **Gate.** Verify all preconditions above. Stop on the first failure.
2. **Tag.** Create the version tag per the project's versioning scheme (TODO: SemVer / CalVer / other from `ROADMAP.md`).
3. **Notes.** Move *Unreleased* in `CHANGELOG.md` under a new `## [<version>]` heading dated today; verify each entry is user-facing.
4. **Publish.** Execute the publish step. TODO: command(s), e.g. push tag, run release pipeline, publish artifacts.
5. **Post-Release-Cleanup.**
   - move released plans from `ai/plans/active/` to `ai/archive/`
   - update `ROADMAP.md` *Current Project State* (next target version, recently done → cleared)
   - reset `CHANGELOG.md` *Unreleased* sub-sections to empty stubs

## Rollback (conditional, spec §6)

When deployed behavior fails verification:

1. Revert or roll forward per the project's rollback strategy (TODO: define).
2. Open a roadmap entry classified as a `Hotfix` and route through `PLANNING.md` (or skip planning for trivial reverts).
3. Record the rollback in `CHANGELOG.md` under the affected version.

## Hotfix (conditional, spec §6)

When a production incident requires a fix outside the normal plan flow:

1. Branch from the released tag.
2. Apply the smallest fix; spec-first still applies.
3. Run the validation for the change-class.
4. Cut a patch release through this same workflow.
5. Forward-port to the integration branch if it diverged.
