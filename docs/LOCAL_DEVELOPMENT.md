# Local Development

This document owns local setup, npm commands, CI reproduction, troubleshooting,
backend contract refresh, browser smoke workflow, and future M13 hardening commands
for the frontend repository.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
- Node.js 24.x
- npm 11.x, matching `package.json` `packageManager` and `engines`
- Optional sibling backend checkout at `..\technical-interview-demo` for contract
  refreshes and local browser smoke

Default sibling layout:

```text
D:\Projects\demo\
|-- technical-interview-demo\
`-- technical-interview-frontend\
```

## Install And Run

Install dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The dev server binds to `http://127.0.0.1:5173/` and proxies `/api/**` requests to
the local backend during development.

Preview a production build locally:

```powershell
npm run preview
```

## Canonical Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run local dev server | `npm run dev` |
| Run production preview | `npm run preview` |
| Lint | `npm run lint` |
| Typecheck and API type freshness check | `npm run typecheck` |
| Run tests once | `npm test` |
| Run tests in watch mode | `npm run test:watch` |
| Build | `npm run build` |
| Generate API types | `npm run api:types` |
| Verify API types without rewriting | `npm run api:types:check` |
| Validate whitespace in the diff | `git diff --check` |

## Reproduce CI Locally

For app, tooling, release-readiness, and other executable changes, run the same
baseline used by CI:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

CI installs with `npm ci`, so use `npm ci` locally when reproducing lockfile or clean
install failures.

Docs and guidance-only changes may use:

```powershell
git diff --check
```

Run broader validation when a docs change also modifies package scripts, generated
files, workflows, source code, or test behavior.

## Backend Contract Refresh

Refresh imported backend contract artifacts only when they are stale, conflict with
the sibling backend repository, or an API-facing task requires it:

```powershell
./scripts/sync-backend-contract.ps1
```

With a non-default backend checkout:

```powershell
./scripts/sync-backend-contract.ps1 -BackendRepo D:\path\to\technical-interview-demo
```

After refreshing the contract, regenerate checked API types:

```powershell
npm run api:types
```

Use `npm run api:types:check` when you only need to verify that
`src/api/generated/openapi.ts` still matches `docs/backend/approved-openapi.json`.
`npm run typecheck` already includes that freshness check.

## Browser Smoke Workflow

Manual same-origin auth smoke is documented in
[`docs/LOCAL_AUTH_SMOKE.md`](LOCAL_AUTH_SMOKE.md). Use it when verifying session
bootstrap, login-provider rendering, account access, CSRF-backed logout, and local
backend proxy behavior.

Anonymous browser smoke can run without provider secrets and should stay on
`http://127.0.0.1:5173/` so `/api/**` traffic uses the Vite proxy. Authenticated
smoke remains manual until the repository has agreed local credentials, identity
seeding rules, and a canonical command.

When recording smoke evidence, include the backend profile, frontend URL, browser
flow covered, validation date, and any skipped authenticated steps with the reason.

## M13 Hardening Commands

M13-A selected the minimum hardening set for the `0.1.0` release hardening pass.
M13-B must add the package scripts, GitHub Actions workflows, Dependabot
configuration, and any report locations before these checks become release-blocking.

Selected M13 checks:

- Explicit GitHub Actions permissions and concurrency for every workflow. Use the
  narrowest permissions each job needs, and cancel superseded pull-request runs
  without interrupting protected branch or release/tag evidence.
- CodeQL for TypeScript/JavaScript source, plus GitHub Actions workflow analysis
  where the CodeQL action supports it. This is a CI-owned code-scanning signal, not
  a local command.
- Dependency review for pull requests that change dependency manifests or
  lockfiles. This is a CI-owned pull-request signal.
- An npm-compatible audit script named `npm run audit:security`, implemented as a
  wrapper around `npm audit --audit-level=high` unless M13-B documents a narrower
  npm-native equivalent. The threshold is high or critical advisories for the locked
  dependency graph, including development dependencies because they participate in
  build, test, and release validation.
- Dependabot for npm and GitHub Actions updates. Group npm runtime dependencies,
  npm tooling/test dependencies, and GitHub Actions updates separately. Until the
  repository owns a stable reviewer team or `CODEOWNERS`, route review through the
  normal maintainer review path instead of naming individual reviewers in config.

Deferred hardening candidates:

- SBOM and license reporting: revisit when the frontend publishes a package,
  deployable artifact, or release process that needs a durable dependency/license
  inventory.
- Bundle-size and asset budgets: revisit when the project owns a reviewed size
  threshold or production `dist/` growth becomes a repeated review concern.
- Authenticated browser smoke automation: revisit when the repository has agreed
  local credentials, identity seeding rules, backend profile, and a canonical
  command.
- Anonymous browser smoke and accessibility automation: revisit when the repository
  owns a canonical browser command and stable failure thresholds.
- CI artifact upload for hardening reports: revisit when a selected check writes a
  stable report file. Until then, use GitHub code scanning, pull-request check
  annotations, and workflow logs as the report locations.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter
  supply-chain policy or add automation that keeps pinned SHAs current. M13-B should
  keep trusted versioned actions, explicit permissions, and Dependabot action
  updates.
- Custom frontend security lint rules: revisit when CodeQL or ESLint misses a
  repeated security issue pattern and a stable rule set is selected.

Failure triage and exceptions:

- Security and hardening failures are owned by the repository maintainers until a
  dedicated team or `CODEOWNERS` file exists.
- Prefer a source fix, dependency update, or lockfile refresh over an exception. For
  CodeQL, inspect the data or control flow before dismissing an alert as not
  applicable.
- Each exception must name the finding or advisory, affected package/path, current
  risk, owner, mitigation or planned fix, expiration or revisit trigger, and release
  decision. Keep exceptions in this section until a dedicated exceptions file is
  selected.
- A skip must be scoped to the specific check or finding. Do not raise the audit
  threshold, disable an entire workflow, or remove required workflow steps solely to
  hide one failure.
- Release candidates require passing selected checks, documented unavailability for
  any CI-only signal that did not run, and no expired exceptions.

## Troubleshooting

If npm reports an unsupported engine, check `node --version` and `npm --version`.
This repository expects Node.js 24.x and npm 11.x.

If `/api/**` requests fail during local development, confirm the backend is running
on the target used by the Vite proxy, then keep browser traffic on
`http://127.0.0.1:5173/`.

If typecheck fails because generated API types are stale, run `npm run api:types`.
If the generated diff is unexpected, inspect the imported backend contract before
changing frontend behavior.

If tests pass locally but CI fails during install, reproduce with `npm ci` from a
clean checkout so lockfile and engine issues surface.

If `git diff --check` fails, remove trailing whitespace or conflict markers before
handoff.
