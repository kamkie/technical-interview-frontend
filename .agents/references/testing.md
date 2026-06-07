# AI Testing And Validation Reference

This file owns AI-facing validation selection by change type. Use the smallest
validation that proves the changed behavior, then report every command run and any
skipped check with the reason.

## Selection Table

| Change type | Required validation |
| --- | --- |
| Docs or AI guidance only | `git diff --check` |
| App source, tests, package scripts, tool config, or workflow behavior | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Backend contract refresh | `./scripts/sync-backend-contract.ps1`, regenerate with `npm run api:types`, then `git diff --check` |
| API type workflow changes without a contract refresh | `npm run api:types:check`, plus the full baseline if scripts or executable files changed |
| Backend API integration behavior | Contract artifacts are current, generated types are current, affected tests pass, and the full baseline passes |
| Session, auth, CSRF, or logout behavior | Relevant tests or smoke evidence for the changed flow, plus the full baseline for executable changes |
| Browser smoke evidence | Record frontend URL, backend profile when used, flow covered, validation date, and skipped authenticated steps with reasons |
| Release metadata or release-readiness work | Full baseline for release candidate changes; docs-only release references may use `git diff --check` |
| Hardening checks after M13 lands | Full baseline plus each selected local hardening command or documented CI-owned signal |

The current full baseline is:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

`npm run typecheck` already includes API type freshness. Use `npm run api:types` to
rewrite generated API types only after an intentional contract refresh.

## Validation Boundaries

Run broader validation when a docs task also changes package scripts, workflows,
source code, generated files, test behavior, or release-candidate metadata that must
match executable evidence.

Do not make a future hardening candidate release-blocking until it has a repeatable
local command or a clearly owned CI signal with triage and skip rules.

Authenticated browser smoke remains manual until the repository has agreed local
credentials, identity seeding rules, and a canonical command. When it cannot run,
state that directly instead of implying the flow was automated.

## Handoff Format

In final handoff, list:

- each validation command run and its result
- checks not run, with the reason
- any environment mismatch that affects the evidence, such as a non-canonical Node
  or npm version
- remaining smoke, contract, or hardening risk that validation did not cover
