# Archive Completed Work

Move completed roadmap summaries out of the active roadmap view and archive closed plans when evidence shows the work is finished. When the user names specific refs, limit the archive sweep to those refs. When evidence is incomplete, report which candidates are not ready to archive.

Use this prompt when implementation, documentation, planning, or release work appears finished and the remaining action is archive readiness review or a mechanical archive edit.

## Read First

- `AGENTS.md`
- `.agents/references/documentation.md`
- `.agents/references/execution.md`
- `.agents/references/testing.md`
- `.agents/references/roadmap.md`
- `.agents/prompts/README.md`
- this prompt
- `ROADMAP.md`
- `docs/ROADMAP_ARCHIVE.md`
- the named roadmap refs, plan refs, current diff, validation output, closeout note, plan result summary, or completion evidence supplied by the user

If the user does not name specific refs, inspect the active roadmap and active plans for archive-ready candidates before editing. Load related plans, specs, design docs, source files, changelog, validation reports, or backend contract artifacts only when the work entry or supplied evidence references them.

Use `change-closeout.md` first when the user needs a broader handoff or commit-readiness check before archiving. Use `roadmap-triage.md` instead when the request is mostly stale, duplicate, blocked, or misplaced roadmap analysis.

## Archive Rules

- Archive only when the candidate work is finished, task-appropriate validation passed or has an explicit skipped-check reason, and self-review checked behavior, contract, documentation, and validation gaps.
- Preserve stable `M-AREA-NNN`, `E-AREA-NNN`, `T-AREA-NNN`, and `PLAN-<short-kebab-slug>` refs.
- Move completed roadmap summaries to `docs/ROADMAP_ARCHIVE.md` when they leave the active roadmap.
- Move closed plans to `.agents/plans/archive/` only when they no longer need active execution or release-preparation updates.
- Preserve plan filenames, plan status history, close reasons, and validation history.
- Keep active umbrella milestones open when child work or stated completion criteria remain open.
- Do not infer product decisions or close unresolved blockers.
- After archive edits, run documentation validation and `git diff --check` before handoff.

## Output

If the user asks for report-only output, return an archive-readiness note with:

- roadmap refs and plan refs reviewed
- ready-to-archive items and evidence
- blocked or not-ready items and missing evidence
- owner artifacts that would change if edits are requested
- validation needed after an archive edit

If the user asks to edit, make the mechanical archive changes and summarize:

- roadmap summaries and plans moved, retained, or left unchanged
- archive headings, notes, or index entries added
- evidence preserved or added
- validation commands run and results
- skipped checks and remaining risk, if any

## Non-Goals

- Do not implement unfinished work.
- Do not mark roadmap items or plans complete without completion, validation, and self-review evidence.
- Do not change roadmap scope, priorities, product behavior, plan status, or blocker status unless the user explicitly asks and repository rules allow it.
- Do not create commits unless the user asks for a commit or an active plan checkpoint requires one.
