# Plan: Example — replace this file once a real plan exists

> This is an illustrative example of a populated plan. Delete it when the first real plan lands in `ai/plans/active/`.

## Lifecycle

| Field | Value |
| --- | --- |
| Phase | Planning |
| Status | Example |
| Roadmap entry | `ROADMAP.md` → "Adopt application lifecycle spec" |
| Change class | AI guidance change |
| Validation level | none (review only) |
| Workflow shape | linear |
| Owner | TODO |

## Summary

- What will change: scaffold the repository against `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` (§7 + §12 step 1).
- Why it matters: gives every new contributor and AI agent the same lifecycle map.
- How success will be measured: every required artifact (§7) exists; every lens (§3) has exactly one owner.

## Scope

- In scope: top-level files (`AGENTS.md`, `README.md`, `SETUP.md`, `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`), `ai/` owner guides, `ai/templates/PLAN_TEMPLATE.md`, `ai/plans/active/`, `ai/archive/`, pinned spec copy.
- Out of scope: Deployment / Operations guides (L3 work), branch-model decision, CI integration, language-specific tooling.

## Current State

- The new repo has no lifecycle scaffolding.
- The lifecycle spec is the single normative input.

## Requirement Gaps And Open Questions

- Pinned spec version: blocks `AGENTS.md` *Lifecycle Spec Conformance* — fallback: latest version on the integration branch of the spec source.
- Conformance level: not blocking — fallback: declare `L1`.
- Canonical local command: not blocking — fallback: leave `TODO` markers until first real implementation lands.

## Locked Decisions And Assumptions

- Default conformance level is `L1 — Spec-Driven Core` until the repo gains release / ops capability.
- Default workflow shape is `linear`.
- Integration branch is `main` unless the user picks otherwise.

## Affected Artifacts

- All template files listed in *Scope*.

## Execution Milestones

### Milestone 1: Scaffold top-level files

- goal: create `AGENTS.md`, `README.md`, `SETUP.md`, `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- deliverables: files committed with `TODO` markers in repo-specific values
- validation checkpoint: `AGENTS.md` references every artifact role from spec §7
- commit checkpoint: one commit, message "scaffold: top-level lifecycle artifacts"

### Milestone 2: Scaffold `ai/` owner guides

- goal: one owner guide per phase / lens group
- deliverables: `ai/PLANNING.md`, `ai/EXECUTION.md`, `ai/PLAN_EXECUTION.md`, `ai/TESTING.md`, `ai/REVIEWS.md`, `ai/RELEASES.md`, `ai/WORKFLOW.md`, `ai/DOCUMENTATION.md`, `ai/ARCHITECTURE.md`, `ai/LEARNINGS.md`, `ai/CODE_STYLE.md`
- validation checkpoint: every lens in spec §3 has exactly one owner guide
- commit checkpoint: one commit, message "scaffold: ai owner guides"

### Milestone 3: Scaffold templates and pinned spec

- goal: `ai/templates/PLAN_TEMPLATE.md`, `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` (pinned), `ai/archive/` placeholder
- validation checkpoint: a new plan can be created from the template without manual section invention
- commit checkpoint: one commit, message "scaffold: plan template and pinned lifecycle spec"

## Edge Cases And Failure Modes

- conformance overshoot: declaring `L3` while Operations / Deployment guides are absent → keep `L1` default.
- duplication drift: the same topic landing in two files → enforce ownership via `ai/DOCUMENTATION.md` table.

## Validation Plan

- review-only validation (change class is *AI guidance change*).
- spot-check: every artifact role from spec §7 maps to a file; every lens from spec §3 has an owner guide.

## Testing Strategy

- N/A (AI-guidance-only plan).

## Validation Results

- TBD — fill on execution.

## User Validation

- The user opens `AGENTS.md` and can answer: which file owns each lifecycle phase, what gates each phase exit, and what validation each change-class needs.

## Required Content Checklist

- [x] what behavior is changing and why
- [x] roadmap entry
- [x] out of scope
- [x] governing spec
- [x] files likely to change
- [x] compatibility promises (none — new repo)
- [x] edge cases
- [x] requirement gaps and fallbacks
- [x] workflow shape
- [x] coordinator-owned files (none — linear shape)
- [x] context per milestone
- [x] artifacts that must move
- [x] testing strategy (N/A justified)
- [x] validation that proves completion
- [x] user verification walkthrough
