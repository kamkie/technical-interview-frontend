# Release Readiness

Check whether the repository is ready for a frontend release or identify blockers before release work proceeds.

## Read First

- `AGENTS.md`
- `.agents/references/releases.md`
- `.agents/references/testing.md`
- `.agents/references/documentation.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `package.json`
- `.agents/prompts/README.md`
- this prompt

Load `package-lock.json`, Docker or Nginx files, CI workflows, release scripts, backend contract artifacts, smoke evidence, hardening scripts, specs, or active plans only when they are relevant to the requested release boundary.

## Output

Produce a release-readiness report with:

- target version, release branch, commit boundary, and whether uncommitted changes are included
- changelog status and whether entries are user-visible release history
- package metadata status and whether `package.json` and `package-lock.json` versions agree
- roadmap release context and whether completed work should move to `docs/ROADMAP_ARCHIVE.md`
- required validation commands and whether each passed, failed, or still needs to run
- Docker image, smoke evidence, GHCR workflow, tag, GitHub Release, signing, provenance, and hardening readiness
- unresolved roadmap items, plan gaps, backend contract gaps, smoke gaps, or known risks that block release
- explicit go, no-go, or conditional-go recommendation

If the user asks for a release plan, create or update a plan under `.agents/plans/` instead of performing release steps immediately.

## Non-Goals

- Do not publish, tag, push, or create a release unless the user explicitly asks and required prerequisites are satisfied.
- Do not add internal AI-agent guidance changes to `CHANGELOG.md` unless they affect public docs, release artifacts, or user-visible behavior.
- Do not skip Docker, smoke, hardening, or full baseline checks just because documentation validation passed.
- Do not invent version numbers, support promises, or release scope without an accepted source.
