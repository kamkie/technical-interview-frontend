# Documentation Routing

> **Lens owner:** `Docs` lens (lifecycle spec §3.4) and the `Docs-Routing` cross-cutting trigger (§6).

This guide tells the Implementer **which artifacts must move together** for each change-class. The summary table lives in `AGENTS.md` *Change-Class Table*; this file expands it.

## Routing Rules

### Public Behavior Change

Move together in one change:

- governing spec (executable spec or published-contract spec)
- implementation
- executable spec test(s)
- published contract artifacts (TODO: e.g. OpenAPI, schema, reference docs, README contract section)
- `CHANGELOG.md` *Unreleased*
- `ROADMAP.md` (status)
- AI guides only when this change alters repo-level rules

### Internal Refactor

Move together:

- implementation
- existing tests (preserve behavior)

Do **not** touch published contracts or specs unless behavior changes.

### Documentation-Only

Move together:

- the doc being updated
- any AI guide that owns the same topic (avoid duplication)

Skip Deployment phase. Validation is doc lint / link check, if any.

### Setup / Environment

Move together:

- `SETUP.md`
- env scripts / wrappers
- `AGENTS.md` *Local Environment* if the canonical command surface changed

### Release-History Only

`CHANGELOG.md` only. This change-class is produced by the Release phase (`RELEASES.md`).

### AI Guidance Change

- the owning `ai/*.md`
- `AGENTS.md` only when repo-level AI rules or document ownership change

## Ownership Of Common Topics

When the same topic could land in two places, this table picks the owner.

| Topic | Owner |
| --- | --- |
| Spec-driven rule, DoD, branch invariants | `AGENTS.md` |
| Lifecycle spec | `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` |
| Per-phase workflow | the matching `ai/<PHASE>.md` |
| Local commands | `SETUP.md` (canonical) + `AGENTS.md` (one-line entry-point) |
| Active work | `ROADMAP.md` |
| Released history | `CHANGELOG.md` |
| Public contract | TODO: contract artifact path |
| Architecture map | `ai/ARCHITECTURE.md` |
| Durable lessons | `ai/LEARNINGS.md` |

## Anti-Patterns

- duplicating setup steps across `README.md`, `SETUP.md`, and `AGENTS.md`
- adding rules to `AGENTS.md` that are owned by an `ai/*.md` guide
- updating an AI guide without updating the contract artifact when behavior changed
- writing release notes in `ROADMAP.md` instead of `CHANGELOG.md`
