# Roadmap Triage

Review active roadmap, roadmap archive, specs, and active plans for stale, duplicate, blocked, misplaced, or underspecified work.

## Read First

- `AGENTS.md`
- `.agents/references/documentation.md`
- `.agents/references/roadmap.md`
- `ROADMAP.md`
- `docs/ROADMAP_ARCHIVE.md`
- `.agents/prompts/README.md`
- this prompt

Load related plans, specs, design docs, changelog entries, backend contract artifacts, or source files only when a roadmap row, archived entry, or user request references them.

## Output

Produce a report in the current response unless the user asks for edits. Group findings as:

- active roadmap items that appear completed, obsolete, duplicated, blocked, underspecified, missing refs, or in the wrong status
- archive entries that should stay archived, need correction, or conflict with active roadmap items
- specs or active plans that should link to roadmap IDs, validation evidence, backend contract artifacts, or design owners
- roadmap rows that should remain `Ready`, `Waiting`, or `Blocked` under `.agents/references/roadmap.md`
- suggested edits with exact owning artifact and validation command

If the user asks to edit, keep changes mechanical and owner-specific: preserve stable IDs, do not renumber historical entries, and do not invent product decisions.

## Non-Goals

- Do not implement roadmap work.
- Do not archive active work without clear evidence that it is completed, superseded, rejected, or no longer needed.
- Do not change product direction without `docs/DESIGN.md`, a selected roadmap row, an active plan, or explicit user instruction.
- Do not encode backend endpoint details in roadmap wording.
