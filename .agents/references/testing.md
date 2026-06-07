# AI Testing And Validation Reference

This file owns AI-facing validation selection by change type. Use the smallest validation that proves the changed behavior, then report every command run and any skipped check with the reason.

## Selection Table

| Change type                                                           | Required validation                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs or AI guidance only                                              | `npm run lint:markdown`, `git diff --check`                                                                                                                                                           |
| App source, tests, package scripts, tool config, or workflow behavior | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`                                                                                                                  |
| Dockerfile, Nginx runtime config, or container release workflow       | Full baseline, `npm run docker:build`, and a container smoke check when runtime behavior changes; record Docker unavailability explicitly                                                             |
| M20 hardening selection docs                                          | `git diff --check`                                                                                                                                                                                    |
| M20 hardening tooling or runtime changes                              | Full baseline, `npm run docker:build`, selected hardening commands from `docs/LOCAL_DEVELOPMENT.md`, and `git diff --check`; keep finding gates advisory until a later threshold is selected          |
| Backend contract refresh                                              | `./scripts/sync-backend-contract.ps1`, regenerate with `npm run api:types`, then `git diff --check`                                                                                                   |
| API type workflow changes without a contract refresh                  | `npm run api:types:check`, plus the full baseline if scripts or executable files changed                                                                                                              |
| Backend API integration behavior                                      | Contract artifacts are current, generated types are current, affected tests pass, and the full baseline passes                                                                                        |
| Session, auth, CSRF, or logout behavior                               | Relevant tests or smoke evidence for the changed flow, plus the full baseline for executable changes                                                                                                  |
| Browser smoke evidence                                                | Record frontend URL, backend profile when used, flow covered, validation date, and skipped authenticated steps with reasons                                                                           |
| Release metadata or release-readiness work                            | Full baseline plus `npm run docker:build` for release candidate changes; docs-only release references may use `git diff --check`; use `.agents/references/releases.md` for release-only preconditions |
| M13-A hardening selection docs                                        | `git diff --check`                                                                                                                                                                                    |
| M13 hardening tooling or release validation after M13-B               | Full baseline plus `npm run audit:security`; document CodeQL, dependency-review, and Dependabot as CI-owned signals                                                                                   |

The current full baseline is:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Use Corepack to invoke the repository package manager when plain `npm` resolves outside `package.json` `engines` or `packageManager`.

`npm run lint` runs Markdown validation before ESLint. Use `npm run lint:markdown` for docs-only changes that need only the Markdown rule surface: LF line endings, final newline, no hard-wrapped prose or list-item continuation prose outside fenced code, and deterministically aligned pipe tables.

`npm run typecheck` already includes API type freshness. Use `npm run api:types` to rewrite generated API types only after an intentional contract refresh.

## Hardening Evidence Owners

Use `docs/LOCAL_DEVELOPMENT.md` for current hardening command names, tool setup, and local evidence procedures. Use `.agents/references/reviews.md` for security-review triggers, advisory triage, and exception expectations. Use `.agents/references/releases.md` for release-candidate evidence and release-only preconditions.

M13 hardening validation remains full baseline plus `npm run audit:security`, with CodeQL, dependency-review, and Dependabot treated as CI-owned or maintainer-side signals. M20 hardening remains advisory until a later roadmap row or release decision selects stable thresholds and an enforced exception workflow.

## Validation Boundaries

Run broader validation when a docs task also changes package scripts, workflows, source code, generated files, test behavior, or release-candidate metadata that must match executable evidence.

Do not make a future hardening candidate release-blocking until it has a repeatable local command or a clearly owned CI signal with triage and skip rules. For M20, do not move from advisory to release-blocking until one stable baseline exists and the enforced threshold has been selected.

For selected M13 checks, exceptions must be scoped to a finding or advisory and must include an owner, mitigation or planned fix, expiration or revisit trigger, and the release decision. Do not weaken a global threshold or disable a full workflow to work around a single finding.

Authenticated browser smoke is manual through `docs/LOCAL_AUTH_SMOKE.md` until a canonical authenticated command exists. When the manual flow is not run, state whether the skip is because backend/frontend prerequisites were unavailable, the fake-OAuth provider/profile was absent, local admin data was non-canonical, or only the automated command is missing; do not imply credentials or procedure are undefined.

## Handoff Format

In final handoff, list:

- each validation command run and its result
- checks not run, with the reason
- any environment mismatch that affects the evidence, such as a non-canonical Node or npm version
- remaining smoke, contract, or hardening risk that validation did not cover
