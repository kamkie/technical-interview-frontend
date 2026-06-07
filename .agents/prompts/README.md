# Repository Prompts

`.agents/prompts/README.md` owns the catalog, loading mechanism, and maintenance rules for reusable repository prompt recipes.

Use repository prompts for named, repository-specific session starters that are more concrete than `.agents/references/` guidance and not substantial enough to become skills.

## Loading Mechanism

Use repository prompts through a two-stage load:

1. Identify the requested prompt by exact title, filename, or catalog entry.
2. Load only the matching prompt, then follow that prompt's declared read set.

Rules:

- do not bulk-load `.agents/prompts/` to discover intent
- use this catalog or a targeted search only when the requested prompt name is ambiguous
- if more than one prompt matches, ask which prompt to run unless the requested outcome clearly selects one
- treat a prompt's `Read first` section as the prompt-local initial context
- load extra references, docs, plans, reports, or skills only when the prompt or current request gives a concrete trigger
- prompts can narrow or shape context for a session, but they do not override the current user request, `AGENTS.md`, approved backend contract artifacts, accepted plans, or executable tests

## Rules

- keep prompts narrow, single-purpose, and self-contained
- name the smallest useful read set; avoid broad repository scans
- bound outputs by naming the expected report, summary, plan, or artifact location
- keep durable policy in `.agents/references/`, not prompts
- keep implementation sequencing in `.agents/plans/`, not prompts
- keep selected scope, status, and backlog in `ROADMAP.md`, not prompts
- keep executable or strongly repeatable workflows in skills, scripts, or package commands, not prompts
- do not add metadata preambles; keep catalog metadata here
- update this README when adding, renaming, moving, or removing prompts

## Current Prompts

| Prompt                                                    | Use When                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [Archive Completed Work](archive-completed-work.md)       | Completed roadmap summaries or closed plans need archive readiness checked or moved mechanically into archive locations.             |
| [Bug Report Triage](bug-report-triage.md)                 | A reported frontend problem, screenshot, browser note, validation failure, or affected route needs ownership and next-path triage.   |
| [Change Closeout](change-closeout.md)                     | A completed ordinary change needs handoff or commit readiness checked for scope, docs, validation, review risk, and follow-up.       |
| [CI Failure Triage](ci-failure-triage.md)                 | GitHub Actions, local CI, lint, docs validation, typecheck, test, build, smoke, hardening, or packaging failures need a narrow path. |
| [Compact AI Guidance](compact-ai-guidance.md)             | Standing AI instruction files need duplicate, stale, or misplaced guidance compacted without changing policy.                        |
| [Design Draft Session](design-draft-session.md)           | UI drafts, screenshots, visual variants, responsive states, or design-only iterations need a bounded session before implementation.  |
| [Evaluate AI Guidance](evaluate-ai-guidance.md)           | A report-only assessment of repository AI guidance, lifecycle coverage, ownership, duplication, or context-load cost is needed.      |
| [Release Readiness](release-readiness.md)                 | A frontend release boundary needs blockers, required validation, changelog, package, Docker, smoke, GHCR, tag, or hardening review.  |
| [Repository State Snapshot](repository-state-snapshot.md) | Worktree, roadmap, active plans, specs, backend contract, prompts, and next-task readiness need a concise status report.             |
| [Roadmap Triage](roadmap-triage.md)                       | `ROADMAP.md`, `docs/ROADMAP_ARCHIVE.md`, specs, or active plans need stale, duplicate, blocked, or misplaced work reviewed.          |
| [Toolchain Upgrade](toolchain-upgrade.md)                 | npm, Node, GitHub Actions, Docker, Vite, React, TypeScript, Vitest, ESLint, Playwright, or hardening tool upgrades need a plan.      |
