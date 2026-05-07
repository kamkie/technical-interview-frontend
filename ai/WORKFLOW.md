# Workflow (Branch, Worktree, Integration)

> **Phase owner:** Integration (lifecycle spec §2 phase 7). **Activity group:** §3.7 *Integration*. **Invariants:** §10.

This guide owns branch, worktree, delegation, and integration mechanics. Spec-driven rules and the definition of done live in `AGENTS.md`.

## Integration Branch

The integration branch is **TODO: `main` | `trunk` | `<branch>`** — the only source of truth for *completed* work (spec §10).

## Branch Model

TODO: pick one and document it.

- **trunk-based** — short-lived feature branches, frequent merges to integration branch.
- **release branches** — `release/x.y` cut from integration branch; backports cherry-picked.
- **GitFlow** — `develop` + `main` + `feature/*` + `release/*` + `hotfix/*`.

## Workflow Modes (spec §12 step 3)

The repository supports the modes declared in `AGENTS.md` *Lifecycle Spec Conformance*:

- **linear** — one branch, one plan at a time. This is the current supported workflow mode.
- **single-plan parallel** — not declared. Requires `M3: parallel-sliced` or higher before use.
- **multi-plan parallel** — not declared. Requires repository-specific worktree / branch ownership rules before use.

## Multi-Agent Mechanics

This repository declares `M2: bounded-worker` in `AGENTS.md`.

Rules:

- the Coordinator owns integration, final validation, and user-facing status
- a Worker Agent may edit only the Write Scope named in its handoff packet
- shared files are Coordinator-owned unless the handoff packet assigns them explicitly
- a delegated result must be reviewed before integration
- integrate one Worker Agent result at a time
- run the smallest relevant validation after integrating a Worker Agent result
- route to `Replan?` when two agents need the same Write Scope or when integration requires a behavior decision

`M2` does not allow multiple writing workers to run in parallel. Read-only review or verification sidecars are allowed when they do not edit files or block the active worker.

## Activities Owned

`Re-validate` → `Resolve-Conflicts?` → `Merge` → `Post-Merge-Verify`

## Integration Steps

1. **Re-validate.** Rebase or merge the integration branch into the working branch. Re-run the validation listed in `AGENTS.md` *Validation Table*.
2. **Resolve-Conflicts?** Resolve and re-validate. Never commit unresolved markers.
3. **Merge.** Prefer merge or squash-merge. Use cherry-pick only when explicitly requested, when accepting a partial branch, or when normal merge is not viable — record the reason on the PR.
4. **Post-Merge-Verify.** Confirm the integration branch still builds and matches the plan's intended state.

## Side-Branch / Worktree Invariants (spec §10)

- keep side-branch / worktree implementation isolated until the planned scope is complete and locally validated
- do not cut releases from unintegrated side branches, worktrees, detached tips, or non-integrated changes
- for `M2` delegation, the handoff packet must name the branch, worktree, or sandbox that contains the worker result

## Pull Requests

- one PR per plan or per slice in delegated modes
- PR description links: plan, roadmap entry, validation result, security/docs reviewers when triggered
- merge only after `REVIEWS.md` *Decide* outputs **Approve**

## Hand-Off

- to **`RELEASES.md`** when the integrated change is release-ready
- to **`ROADMAP.md`** *Sync* activity when active-work tracking needs updating
- to **`ai/archive/`** when the plan is complete (move the plan file)
