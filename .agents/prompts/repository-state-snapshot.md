# Repository State Snapshot

Summarize the current repository state across worktree changes, roadmap scope, active plans, specs, backend contract artifacts, prompts, and validation readiness.

## Read First

- `AGENTS.md`
- `.agents/references/documentation.md`
- `.agents/references/execution.md`
- `.agents/references/planning.md`
- `.agents/references/roadmap.md`
- `ROADMAP.md`
- `.agents/prompts/README.md`
- this prompt

Load specific plans, archived roadmap entries, specs, changelog entries, backend contract artifacts, source files, or validation logs only when an artifact status depends on them.

## Output

Produce a repository-state report with:

- permission boundary and whether the report includes uncommitted changes
- current branch, worktree status, and notable untracked or modified files
- current roadmap priority, ready milestones, waiting milestones, blocked backlog, and roadmap refs needing attention
- active plans and whether their next slices are ready, waiting, blocked, stale, or missing
- specs, backend contract artifacts, prompts, or focused references that appear relevant to the requested status
- recommended next task or top 1-3 options with the evidence for each
- suggested owning artifact edits and validation commands, without applying them unless asked

## Non-Goals

- Do not implement tasks or archive work unless the user explicitly asks for edits.
- Do not infer product decisions, roadmap status changes, or plan completion from discussion alone.
- Do not run heavy builds or tests for a status snapshot unless the user asks for validation.
- Do not bulk-load source trees or archives unless a named artifact requires it.
