# Local Development

This document owns local setup, npm commands, CI reproduction, troubleshooting,
backend contract refresh, browser smoke workflow, local hardening commands, and
CI-owned hardening signals for the frontend repository.

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
| Audit high-or-critical dependency advisories | `npm run audit:security` |
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
npm run audit:security
git diff --check
```

The selected local hardening command can also be run directly:

```powershell
npm run audit:security
```

Use Corepack to invoke the repository package manager when plain `npm` resolves
outside `package.json` `engines` or `packageManager`, for example:

```powershell
corepack npm run lint
corepack npm run audit:security
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

## Hardening Commands And Signals

M13 implements the selected minimum hardening set for the `0.1.0` release hardening
pass.

Implemented M13 checks:

- `.github/workflows/ci.yml` has explicit read-only repository permissions and
  concurrency that cancels superseded pull-request runs while preserving
  protected-branch, tag, release, and scheduled evidence.
- `.github/workflows/codeql.yml` runs CodeQL for `javascript-typescript` and
  `actions` on pull requests, pushes to `main`, and a weekly schedule. This private
  repository writes SARIF artifacts instead of uploading to GitHub code scanning
  until code scanning support is enabled, and the workflow emits a notice naming the
  maintainer-side feature needed for Security-tab alerts.
- `.github/workflows/dependency-review.yml` runs dependency review on pull
  requests, using a high-or-critical severity gate where the repository supports
  the GitHub dependency-review API. In this private repository, unsupported runs
  are advisory so the workflow stays green; use `npm run audit:security` as the
  local fallback evidence. The workflow emits a warning if dependency-review needs
  maintainer-side GitHub security features.
- `npm run audit:security` wraps `npm audit --audit-level=high`. It is the selected
  local hardening command for high or critical advisories in the locked dependency
  graph, including development dependencies because they participate in build,
  test, and release validation. Failures appear in local command output and CI
  workflow logs.
- `.github/dependabot.yml` checks npm and GitHub Actions dependencies weekly. It
  groups npm runtime dependencies, npm tooling/test dependencies, and Actions
  updates separately. Until the repository owns a stable reviewer team or
  `CODEOWNERS`, review uses the normal maintainer path instead of named reviewers.

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
  stable report file beyond CodeQL SARIF. Until then, use pull-request check
  annotations, workflow logs, and CodeQL SARIF artifacts as the report locations.
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
  CodeQL, inspect the SARIF artifact and data/control flow before dismissing an
  alert as not applicable.
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
