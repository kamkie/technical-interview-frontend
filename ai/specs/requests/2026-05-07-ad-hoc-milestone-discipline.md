# Request Spec: Ad-Hoc Milestone Discipline

> Created for a repository-state-changing logical task. See `ai/SPEC_DOCUMENTS.md`.

## Lifecycle

| Field | Value |
| --- | --- |
| Date | 2026-05-07 |
| Status | Implemented |
| Change class | AI guidance change |
| Validation level | AI guidance change: review only |
| Related plan | N/A |
| Owner | AI implementer |

## Task Inputs

- Change guideline to enforce milestone-like behavior even on ad hoc tasks.

## Intended Repository State

- Ad-hoc repository-state-changing tasks are treated as exactly one execution milestone.
- Ad-hoc tasks must record milestone fields before implementation when no approved plan supplies them.
- The milestone record includes goal, owned files, behavior to preserve, deliverables, validation checkpoint, and commit checkpoint.
- Planned single-milestone work can use the approved plan's milestone instead of duplicating it.
- Read-only or clarification-only prompts remain outside this requirement unless they change repository state.

## Governing Specs And Contracts

- `AGENTS.md` owns repo-level lifecycle and DoD rules.
- `ai/EXECUTION.md` owns ad-hoc / single-milestone implementation workflow.
- `ai/SPEC_DOCUMENTS.md` owns request specs and logical-task request records.
- `ai/templates/REQUEST_SPEC_TEMPLATE.md` defines the fallback milestone record for ad-hoc work.

## Affected Artifacts

- `AGENTS.md`
- `ai/EXECUTION.md`
- `ai/SPEC_DOCUMENTS.md`
- `ai/templates/REQUEST_SPEC_TEMPLATE.md`
- `ai/specs/requests/2026-05-07-ad-hoc-milestone-discipline.md`

## Ad-Hoc Milestone Record

- Goal: enforce milestone-shaped execution for ad-hoc repository-state-changing tasks.
- Owned files or packages: `AGENTS.md`, `ai/EXECUTION.md`, `ai/SPEC_DOCUMENTS.md`, `ai/templates/REQUEST_SPEC_TEMPLATE.md`, `ai/specs/requests/2026-05-07-ad-hoc-milestone-discipline.md`.
- Behavior to preserve: full plans remain required only for multi-milestone or planned work; request specs still do not apply to read-only or clarification-only prompts.
- Exact deliverables: repo-level DoD hook, ad-hoc execution workflow step, request-spec guide section, template milestone fields, and this request spec.
- Validation checkpoint: review-only AI guidance validation plus whitespace checks.
- Commit checkpoint: commit when explicitly requested by the user.

## Out Of Scope

- Changing the pinned lifecycle spec copy.
- Requiring a full `ai/plans/active/PLAN_*.md` for tiny ad-hoc changes.
- Adding executable tests for AI guidance-only changes.

## Validation

- Review only. `AGENTS.md` marks AI guidance changes as requiring no executable validation.

## Validation Results

- `git diff --check` passed.
- Changed and untracked file trailing-whitespace check passed.
- User explicitly requested commit on 2026-05-07.

## Completion Checklist

- [x] request captured before state-changing edits
- [x] ad-hoc execution workflow requires a single-milestone record
- [x] request spec guide explains where ad-hoc milestone fields live
- [x] request spec template includes ad-hoc milestone fields
- [x] required validation completed or explicitly marked N/A
- [x] final repository state recorded here
