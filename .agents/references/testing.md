# AI Testing And Validation Reference

This file owns AI-facing validation selection by change type. Use the smallest validation that proves the changed behavior, then report every command run and any skipped check with the reason.

## Selection Table

| Change type                                                           | Required validation                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs or AI guidance only                                              | `npm run lint:markdown`, `git diff --check`                                                                                                                                                                                            |
| App source, tests, package scripts, tool config, or workflow behavior | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`                                                                                                                                                   |
| Dockerfile, Nginx runtime config, or container release workflow       | Full baseline, `npm run docker:build`, and a container smoke check when runtime behavior changes; record Docker unavailability explicitly                                                                                              |
| M20 hardening selection docs                                          | `git diff --check`                                                                                                                                                                                                                     |
| M20 hardening tooling or runtime changes                              | Full baseline, `npm run docker:build`, selected Trivy image scan, selected kube-linter rendered-manifest checks, selected runtime/Nginx check, and `git diff --check`; keep finding gates advisory until a later threshold is selected |
| Backend contract refresh                                              | `./scripts/sync-backend-contract.ps1`, regenerate with `npm run api:types`, then `git diff --check`                                                                                                                                    |
| API type workflow changes without a contract refresh                  | `npm run api:types:check`, plus the full baseline if scripts or executable files changed                                                                                                                                               |
| Backend API integration behavior                                      | Contract artifacts are current, generated types are current, affected tests pass, and the full baseline passes                                                                                                                         |
| Session, auth, CSRF, or logout behavior                               | Relevant tests or smoke evidence for the changed flow, plus the full baseline for executable changes                                                                                                                                   |
| Browser smoke evidence                                                | Record frontend URL, backend profile when used, flow covered, validation date, and skipped authenticated steps with reasons                                                                                                            |
| Release metadata or release-readiness work                            | Full baseline plus `npm run docker:build` for release candidate changes; docs-only release references may use `git diff --check`                                                                                                       |
| M13-A hardening selection docs                                        | `git diff --check`                                                                                                                                                                                                                     |
| M13 hardening tooling or release validation after M13-B               | Full baseline plus `npm run audit:security`; document CodeQL, dependency-review, and Dependabot as CI-owned signals                                                                                                                    |

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

## Selected M13 Hardening Evidence

After M13-B, hardening validation is:

- full baseline validation
- `npm run audit:security`, expected to wrap `npm audit --audit-level=high`; failures appear in local command output and CI workflow logs
- workflow configuration review for explicit permissions and concurrency that cancels superseded pull-request runs without canceling protected branch, tag, release, or scheduled evidence
- CI evidence for CodeQL `javascript-typescript` and `actions` analysis; reports live in GitHub code scanning alerts and CodeQL workflow logs
- CI pull-request evidence for dependency-review; private repositories without dependency graph and GitHub Advanced Security support run in advisory mode and should be paired with `npm run audit:security`; the workflow warning names the maintainer-side features needed for enforcement
- Dependabot configuration review for grouped npm runtime, npm tooling/test, GitHub Actions, and Docker base-image updates

Dependabot PR creation is an operational maintenance signal, not a blocking command for every local validation run. A Dependabot security update tied to a high or critical advisory should be handled through the audit/dependency-review triage path.

## Selected M20 Hardening Evidence

M20's first pass is advisory. Evidence comes from local command output, pull-request logs, or workflow logs rather than checked-in generated reports. The selected tools are Trivy for the production container image, kube-linter for rendered Kustomize and Helm manifests, and a repo-owned runtime/Nginx check for `Dockerfile` plus `docker/nginx/` invariants.

Selected commands:

- `npm run hardening:runtime` checks the Dockerfile and Nginx template invariants.
- `npm run hardening:kube-linter` renders Kustomize and Helm manifests under ignored `temp/hardening/rendered` before invoking kube-linter.
- `npm run hardening:trivy` scans the locally built `technical-interview-frontend` image with Trivy and keeps vulnerability findings advisory with exit code `0`.
- `npm run hardening:m20` runs the selected advisory checks in sequence when all external tools are installed.

Tool installation, rendering, or check configuration failures should be fixed or recorded as unavailable. Vulnerability, posture, and runtime findings should be triaged, but they are not release-blocking until a later roadmap row or release decision selects stable severity/posture thresholds and an enforced exception workflow.

## Validation Boundaries

Run broader validation when a docs task also changes package scripts, workflows, source code, generated files, test behavior, or release-candidate metadata that must match executable evidence.

Do not make a future hardening candidate release-blocking until it has a repeatable local command or a clearly owned CI signal with triage and skip rules. For M20, do not move from advisory to release-blocking until one stable baseline exists and the enforced threshold has been selected.

For selected M13 checks, exceptions must be scoped to a finding or advisory and must include an owner, mitigation or planned fix, expiration or revisit trigger, and the release decision. Do not weaken a global threshold or disable a full workflow to work around a single finding.

Authenticated browser smoke remains manual until the repository has agreed local credentials, identity seeding rules, and a canonical command. When it cannot run, state that directly instead of implying the flow was automated.

## Handoff Format

In final handoff, list:

- each validation command run and its result
- checks not run, with the reason
- any environment mismatch that affects the evidence, such as a non-canonical Node or npm version
- remaining smoke, contract, or hardening risk that validation did not cover
