# Toolchain Upgrade

Create or update a narrow `.agents/plans/PLAN-<short-kebab-slug>.md` for a toolchain upgrade batch.

## Scope

Use this prompt for these owned upgrade surfaces:

- npm dependencies and lockfile updates
- Node.js and npm engine or package-manager requirements
- GitHub Actions and CI workflow actions
- Vite, React, TypeScript, Vitest, ESLint, Playwright, Markdown tooling, and API type generation tools
- Docker base images, Nginx runtime image, release image workflow, and hardening tools

## Read First

- `AGENTS.md`
- `.agents/references/planning.md`
- `.agents/references/documentation.md`
- `.agents/references/testing.md`
- `.agents/prompts/README.md`
- this prompt
- relevant package, lockfile, workflow, Docker, Nginx, Vite, TypeScript, ESLint, test, release, or hardening files
- the alert, version target, dependency report, scan, issue, or tool output that motivates the upgrade

Load `.agents/references/releases.md` when release, publication, changelog, tag, Docker image, signing, provenance, or GitHub Release behavior is in scope.

## Output

Create or update one plan under `.agents/plans/` using the existing plan filename and plan-ID rules. Keep the plan narrow enough to review.

Before writing the plan:

- identify where each requested version is owned
- inventory direct dependencies, lockfile impact, workflow action pins, Node/npm engines, Docker base images, checked scripts, and tool config in scope
- call out compatibility risk, migration risk, rollback concerns, resolved-version proof, and validation needed to keep the repository release-ready
- say explicitly whether the requested upgrades should stay one batch or split into smaller plans

Follow repository plan requirements from `.agents/references/planning.md`; keep this prompt focused on toolchain inventory, risk, batch shape, and validation.

## Non-Goals

- Do not implement upgrades from this prompt unless the user separately approves the resulting plan and asks for execution.
- Do not update `CHANGELOG.md` while drafting the plan; changelog ownership follows release and execution guidance during implementation.
- Do not include unrelated cleanup, formatting, dependency modernization, or CI redesign outside the requested upgrade batch.
