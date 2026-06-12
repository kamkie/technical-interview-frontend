# AI Roadmap Reference

This file owns AI-facing procedure for editing `ROADMAP.md`. Keep `ROADMAP.md` focused on selected, planned, blocked, and non-goal first-party frontend scope.

Use this reference with `.agents/references/documentation.md` when changing roadmap scope, milestone state, blocked backlog, release context, product non-goals, stable IDs, or archive/changelog routing.

## Roadmap Ownership

- `ROADMAP.md` owns selected scope, product direction, milestone state, stable milestone/epic/task/plan IDs, dependencies, blocked backlog, release context, and product non-goals.
- `docs/DESIGN.md` owns durable product and design intent; roadmap rows may point to it but should not carry detailed design rationale.
- Active plans under `.agents/plans/` own execution coordination for selected roadmap work; durable results must move into the roadmap, design guide, focused reference, human doc, test, or contract that owns them.
- Completed milestone summaries move to `docs/ROADMAP_ARCHIVE.md` when they leave the active roadmap.
- Shipped or release-candidate user-visible history belongs in `CHANGELOG.md`.
- Release sequencing stays in `.agents/references/releases.md`.
- Smoke, hardening, validation, and troubleshooting procedures belong in their owner docs or AI validation references, not in `ROADMAP.md`.
- Endpoint fields, request schemas, auth header details, and durable API rules stay in `docs/backend/` or executable tests, not in `ROADMAP.md`.

## Stable IDs

Preserve the current roadmap ID model:

- Milestones use `M-AREA-NNN`.
- Epics use `E-AREA-NNN`.
- Tasks use `T-AREA-NNN`.
- Plans use `PLAN-short-kebab-slug`.

Keep IDs stable when wording, status, ordering, or section placement changes. Do not renumber existing IDs. When work is split, keep the original ID for the closest surviving item and assign new IDs to new items. Do not reuse retired IDs for unrelated work.

Labels should use stable IDs so the hierarchy stays searchable without turning `ROADMAP.md` into a table.

## Current Sections

Preserve the current roadmap shape unless the task explicitly changes roadmap structure:

- `Release Context`
- `Product Direction`
- `Milestones`
- `Blocked Backlog`
- `Product Non-Goals`

Do not recreate older procedure-adoption or smoke/local candidate sections. Procedure guidance belongs in focused references, active plans, owner docs, or executable validation rather than in roadmap candidate sections.

## Item Shaping

Milestones, epics, and tasks should name the outcome and stable ID clearly enough that an implementation plan can select the next slice. Keep detailed procedures in owner documents or executable tests.

Shape `## Milestones` and `## Blocked Backlog` entries as a labeled heading hierarchy, not a table:

- Milestone: a `### M-AREA-NNN: Title` heading, a `Labels:` line with `type:milestone` and a status label, then a one-line `Goal:`.
- Epic: a `#### E-AREA-NNN: Title` heading under its milestone, with a `Labels:` line carrying `type:epic`, `milestone:M-AREA-NNN`, and a status label.
- Epic body: optional observed-fact context lines such as `Current evidence:`, `Selected gap:`, or `Blocked by:`, then a `Tasks:` list of `T-AREA-NNN:` bullets, then an `Acceptance Criteria:` list.
- Blocked entries live under `## Blocked Backlog` and name the missing input in a `Blocked by:` line.
- Record selection dates and review provenance as short prose near the affected milestones instead of extra labels.
- End `## Milestones` with the pointer to `docs/ROADMAP_ARCHIVE.md` for completed work.

Use these status labels:

- `status:ready`: the item can start from the current repository state.
- `status:waiting`: the item has a normal predecessor dependency.
- `status:blocked`: the item needs a product choice, credential, backend contract refresh, selected threshold, failure owner, or external state before implementation can start.

Defined work belongs in `status:ready`, `status:waiting`, or `status:blocked` items. Do not move planned waiting work into deferred or candidate language merely because it depends on an earlier milestone.

For roadmap work that needs execution coordination, create or update a plan under `.agents/plans/` and reference it with a stable plan ID. Add a separate spec only when user-facing behavior is too broad or ambiguous for a roadmap item plus `docs/DESIGN.md`.

## Editing Checks

- Make the smallest coherent roadmap change.
- Handle roadmap-only documentation edits directly; they do not require subagents unless the user explicitly asks for delegation.
- Preserve backend contract invariants and do not change API-facing rules through roadmap wording alone.
- Update `ROADMAP.md` when selected scope, milestone status, blocked backlog, release context, or product non-goals change.
- Update `docs/DESIGN.md` when product or design intent changes without changing roadmap status.
- Update `SETUP.md`, `README.md`, package configuration, focused AI references, or other owners only when their owned behavior changes.
- Check specs, changelog entries, release references, archive pointers, active plans, and design references when selected scope, release state, or completed roadmap work changes.
