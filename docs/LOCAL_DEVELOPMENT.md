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

M13 has not landed yet. After M13 selects and implements hardening checks, record the
local commands, CI-only checks, thresholds, report locations, triage owner, and skip
policy in this section. Do not treat a hardening candidate as release-blocking until
it has a repeatable local command or a clearly owned CI signal.

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
