# AI Testing And Validation Reference

This file owns AI-facing validation selection by change type. Use the smallest validation that proves the changed behavior, then report every command run and any skipped check with the reason.

## Selection Table

| Change type                                                           | Required validation                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs or AI guidance only                                              | `npm run lint:markdown`, `git diff --check`                                                                                                                                                             |
| App source, tests, package scripts, tool config, or workflow behavior | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`                                                                                                                    |
| Dockerfile, Nginx runtime config, or container release workflow       | Full baseline, `npm run docker:build`, and a container smoke check when runtime behavior changes; record Docker unavailability explicitly                                                               |
| M20 hardening selection docs                                          | `git diff --check`                                                                                                                                                                                      |
| Selected hardening tooling or runtime changes                         | Full baseline, `npm run docker:build`, selected hardening commands from `docs/LOCAL_DEVELOPMENT.md`, and `git diff --check`; record unavailable Docker, Trivy, kube-linter, kubectl, or Helm explicitly |
| Backend contract refresh                                              | `./scripts/sync-backend-contract.ps1`, regenerate with `npm run api:types`, then `git diff --check`                                                                                                     |
| API type workflow changes without a contract refresh                  | `npm run api:types:check`, plus the full baseline if scripts or executable files changed                                                                                                                |
| Backend API integration behavior                                      | Contract artifacts are current, generated types are current, affected tests pass, and the full baseline passes                                                                                          |
| Session, auth, CSRF, or logout behavior                               | Relevant tests or smoke evidence for the changed flow, plus the full baseline for executable changes                                                                                                    |
| Browser smoke evidence                                                | Record frontend URL, backend profile when used, flow covered, validation date, and skipped authenticated steps with reasons                                                                             |
| Release metadata or release-readiness work                            | Full baseline plus `npm run docker:build` for release candidate changes; docs-only release references may use `git diff --check`; use `.agents/references/releases.md` for release-only preconditions   |
| M13-A hardening selection docs                                        | `git diff --check`                                                                                                                                                                                      |
| M13 hardening tooling or release validation after M13-B               | Full baseline plus `npm run audit:security`; document CodeQL, dependency-review, and Dependabot as CI-owned signals                                                                                     |

The current full baseline is:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Use Corepack to invoke the repository package manager when plain `npm` resolves outside `package.json` `engines` or `packageManager`.

`npm run lint` runs Markdown validation before ESLint. Use `npm run lint:markdown` for docs-only changes that need only the Markdown rule surface: LF line endings, Mermaid fenced-code syntax, final newline, no hard-wrapped prose or list-item continuation prose outside fenced code, and deterministically aligned pipe tables.

`npm run typecheck` already includes API type freshness. Use `npm run api:types` to rewrite generated API types only after an intentional contract refresh.

## Hardening Evidence Owners

Use `docs/LOCAL_DEVELOPMENT.md` for current hardening command names, tool setup, and local evidence procedures. Use `.agents/references/reviews.md` for security-review triggers, advisory triage, and exception expectations. Use `.agents/references/releases.md` for release-candidate evidence and release-only preconditions.

Selected hardening validation includes the full baseline plus `npm run audit:security`, `npm run hardening:runtime`, and `npm run hardening:trivy` when Docker, image, and Trivy prerequisites are available. CodeQL, dependency-review, and Dependabot remain CI-owned or maintainer-side signals. `npm run hardening:kube-linter` remains advisory for rendered-manifest posture findings during the first pass, but missing render or lint prerequisites are still prerequisite failures to fix or record.

## Validation Boundaries

Run broader validation when a docs task also changes package scripts, workflows, source code, generated files, test behavior, or release-candidate metadata that must match executable evidence.

Do not make a future hardening candidate release-blocking until it has a repeatable local command or a clearly owned CI signal with triage and skip rules. E-HARDEN-001 selects enforced thresholds for high or critical npm advisories, owned runtime/Nginx invariant violations, and high or critical Trivy findings; deferred hardening candidates still need their own selected thresholds before promotion.

For selected hardening checks, exceptions must be scoped to a finding or advisory and must include the affected package or path, current risk, owner, mitigation or planned fix, expiration or revisit trigger, and the release decision. Do not weaken a global threshold or disable a full workflow to work around a single finding.

Canonical automated authenticated browser smoke is `npm run smoke:authenticated`; it starts Vite mock mode through `scripts/with-vite.mjs` and should record the backend profile as internal mock API. Use `docs/LOCAL_AUTH_SMOKE.md` when live sibling-backend fake-OAuth evidence is needed. When live fake-OAuth smoke is not run, state whether the skip is because backend/frontend prerequisites were unavailable, the fake-OAuth provider/profile was absent, local admin data was non-canonical, or external-provider credentials were unavailable.

## Browser Review Server Hygiene

Before browser-review work that may start Vite, run `npm run dev:list` and treat any listed process as pre-existing unless the current task owns it. Use `scripts/with-vite.mjs` or smoke scripts that import it for programmatic checks that need Vite; do not start hidden detached Vite/npm servers with `Start-Process` unless the task explicitly asks to leave a server running after handoff.

For manual browser review that intentionally leaves mock Vite running, use `npm run dev:mock:managed -- --port 5173` so PID and port are recorded. Any final handoff that leaves a server running must report the port, PID, command, and reason.

At closeout for browser-review work, run `npm run dev:list` again. Stop servers owned by the task with `npm run dev:cleanup`; if anything remains, report exactly what remains. Any final handoff claiming a server was stopped must be backed by a post-stop port check from `npm run dev:cleanup`, `scripts/with-vite.mjs`, or an equivalent explicit port probe.

Programmatic smoke scripts that start Vite should use `scripts/with-vite.mjs` or the same `createServer(...); try { ... } finally { await server.close() }` lifecycle shape. Avoid OS-level process lifecycles for smoke checks unless the task explicitly needs a long-running interactive server.

## Handoff Format

In final handoff, list:

- each validation command run and its result
- checks not run, with the reason
- any environment mismatch that affects the evidence, such as a non-canonical Node or npm version
- remaining smoke, contract, or hardening risk that validation did not cover
