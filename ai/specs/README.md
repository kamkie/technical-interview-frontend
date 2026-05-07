# Specs

This directory holds repository-pinned spec artifacts.

## APPLICATION_LIFECYCLE_SPEC.md

Copy `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` from the upstream source into this directory and pin its version in `AGENTS.md` *Lifecycle Spec Conformance* (spec §16).

The pinned copy is **read-only from the repo's perspective**:

- bump it deliberately, recording the new version and any rename map in `CHANGELOG.md`
- breaking changes (renames of phases or activities) require a coordinated update of every `ai/*.md` owner guide that names the renamed entity

## Other Specs

Add domain or contract specs here when they are not better expressed as executable specs (tests, schemas) or published-contract docs. Each spec must:

- name the behavior it owns
- name the artifacts that realize it
- be referenced by at least one row in `AGENTS.md` *Authoritative Repository Artifacts* or *Change-Class Table*

### MULTI_AGENT_EXECUTION_SPEC.md

Defines optional multi-agent execution modes, activity delegation rules, handoff packets, agent result contracts, integration discipline, and skill usage for coding work.
