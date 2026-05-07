# Request Spec: Console Output Temp Guideline

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

- Add new guideline that AI agent should provide its own console output into files in `/temp` that is git ignored in this repo.

## Intended Repository State

- Repo guidance tells AI agents to capture non-trivial command / console output into files under repo-root `temp/`.
- The guideline states that `temp/` is git-ignored and should be used for transient raw logs, not durable specs or validation records.
- The guideline tells agents to summarize relevant output in chat or tracked docs instead of committing raw console logs.
- `.gitignore` clearly ignores repo-root `temp/`.

## Governing Specs And Contracts

- `AGENTS.md` owns repo-level AI rules and command execution policy.
- `ai/EXECUTION.md` owns Run activity behavior during implementation.
- `.gitignore` owns the ignored `/temp/` workspace.

## Affected Artifacts

- `.gitignore`
- `AGENTS.md`
- `ai/EXECUTION.md`
- `ai/specs/requests/2026-05-07-console-output-temp-guideline.md`

## Ad-Hoc Milestone Record

- Goal: document and enforce temp-file capture for AI console output.
- Owned files or packages: `.gitignore`, `AGENTS.md`, `ai/EXECUTION.md`, `ai/specs/requests/2026-05-07-console-output-temp-guideline.md`.
- Behavior to preserve: `temp/` remains untracked; final answers still summarize relevant output for the user; durable validation results remain in plans or request specs.
- Exact deliverables: ignored `temp/` entry, repo-level console-output guideline, execution Run guidance, and this request spec.
- Validation checkpoint: review-only AI guidance validation plus whitespace checks.
- Commit checkpoint: commit when explicitly requested by the user.

## Out Of Scope

- Capturing every short read-only command output retroactively.
- Committing files under `temp/`.
- Replacing durable validation records with ignored temp logs.

## Validation

- Review only. `AGENTS.md` marks AI guidance changes as requiring no executable validation.

## Validation Results

- `git diff --check` passed. Raw output: `temp/2026-05-07-console-output-temp-guideline/001-git-diff-check.log`.
- Changed and untracked file trailing-whitespace check passed. Raw output: `temp/2026-05-07-console-output-temp-guideline/002-trailing-whitespace.log`.
- `git check-ignore -v` confirmed temp logs are ignored by `.gitignore:2:/temp/`. Raw output: `temp/2026-05-07-console-output-temp-guideline/003-git-ignore-temp.log`.
- User explicitly requested commit on 2026-05-07.

## Completion Checklist

- [x] request captured before state-changing edits
- [x] ad-hoc milestone record filled, or approved plan milestone linked
- [x] `.gitignore` clearly ignores repo-root `temp/`
- [x] `AGENTS.md` states the console-output capture rule
- [x] `ai/EXECUTION.md` applies the rule during Run activity
- [x] required validation completed or explicitly marked N/A
- [x] final repository state recorded here
