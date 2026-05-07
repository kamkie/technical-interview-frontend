# Request Spec: Repository-State-Changing User Input Guideline

> Request spec for the user input received on 2026-05-07. This is the durable spec record for the repository-state-changing request that adds the request-spec guideline.

## Lifecycle

| Field | Value |
| --- | --- |
| Date | 2026-05-07 |
| Status | Implemented |
| Change class | AI guidance change |
| Validation level | AI guidance change: review only |
| Related plan | N/A |
| Owner | AI implementer |

## User Input

Create an AI guideline that requires a spec document for each user input that changes repository state.

## Intended Repository State

- AI guidance defines what counts as a repository-state-changing user input.
- AI agents must create a per-request spec document before making state-changing edits and keep it updated through handoff.
- The request-spec location, naming, and minimum content are documented.
- Existing lifecycle, planning, execution, and documentation routing guides point to the new rule without duplicating detailed workflow.
- This request has its own request spec document.

## Change Class

AI guidance change with a repo-level rule update.

## Governing Specs And Contracts

- `AGENTS.md` owns repo-level engineering rules, change classes, DoD, and cross-cutting triggers.
- `ai/SPEC_DOCUMENTS.md` owns detailed request-spec workflow after this change.
- `ai/DOCUMENTATION.md` owns documentation routing for AI guidance changes.
- Published contracts and executable specs are N/A for this AI guidance-only request.

## Affected Artifacts

- `AGENTS.md`
- `ai/SPEC_DOCUMENTS.md`
- `ai/PLANNING.md`
- `ai/EXECUTION.md`
- `ai/PLAN_EXECUTION.md`
- `ai/DOCUMENTATION.md`
- `ai/specs/README.md`
- `ai/templates/PLAN_TEMPLATE.md`
- `ai/templates/REQUEST_SPEC_TEMPLATE.md`
- `ai/specs/requests/2026-05-07-request-spec-guideline.md`

## Out Of Scope

- Changing the pinned lifecycle spec copy.
- Adding executable tests for documentation-only AI guidance.
- Creating request specs retroactively for earlier user inputs.

## Validation

Review only. `AGENTS.md` marks AI guidance changes as requiring no executable validation.

## Validation Results

- `git diff --check` passed.
- Changed and untracked file trailing-whitespace check passed.

## Completion Checklist

- [x] Request spec exists before other state-changing edits.
- [x] Repo-level rule is wired from `AGENTS.md`.
- [x] Phase guides route state-changing work through the request-spec rule.
- [x] Template exists for future request specs.
- [x] Documentation remains internally consistent.
