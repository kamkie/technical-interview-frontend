# AI Roadmap Reference

This file owns AI-facing procedure for editing `ROADMAP.md`. Keep `ROADMAP.md`
focused on selected, planned, explicitly deferred, or rejected frontend scope.

Use this reference with `.agents/references/documentation.md` when changing roadmap
scope, milestone state, release-prep scope, backlog rows, deferred candidates, or
rejected scope.

## Roadmap Ownership

- `ROADMAP.md` owns current baseline, product direction, active milestone state,
  near-term backlog, candidate lists, procedure adoption scope, hardening candidates,
  and rejected frontend scope.
- Completed milestone summaries move to `docs/ROADMAP_ARCHIVE.md` when they leave
  the active roadmap.
- Shipped or release-candidate user-visible history belongs in `CHANGELOG.md`.
- Release sequencing stays in `.agents/references/releases.md`.
- Smoke, hardening, and local validation procedures belong in their owner docs or
  AI validation references, not in `ROADMAP.md`.
- Endpoint fields, request schemas, auth header details, and durable API rules stay
  in `docs/backend/` or executable tests, not in `ROADMAP.md`.

## Row Shaping

Future selected rows should name:

- the durable owner document
- the backend contract source when API-facing
- expected tests
- the validation command set

Use these status terms for selected rows:

- `Ready`: the milestone can start from the current repository state.
- `Waiting`: the milestone has a normal predecessor dependency.
- `Blocked`: the milestone needs a product choice, credential, backend contract
  refresh, or external state before implementation can start.

Detailed procedures belong in the owner document or executable tests. Add a
separate spec only when user-facing behavior is too broad or ambiguous for a
roadmap row.

## Editing Checks

- Make the smallest coherent roadmap change.
- Preserve backend contract invariants and do not change API-facing rules through
  roadmap wording alone.
- Update `ROADMAP.md` when roadmap or product scope changes.
- Update `SETUP.md`, `README.md`, package configuration, or other owners only when
  their owned behavior changes.
- Check specs, changelog entries, release references, and archive pointers when the
  selected scope, release state, or completed roadmap work changes.
