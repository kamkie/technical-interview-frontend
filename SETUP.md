# Setup

This repository uses Vite, React, TypeScript, Node.js 24.x, and npm for the first-party
browser frontend. The current release candidate is package version `0.1.0`; the
canonical package manager is `npm@11.14.1`, with engines constrained to Node.js
`>=24 <25` and npm `>=11 <12`.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
- Node.js 24.x
- npm 11.x, matching the `packageManager` and `engines` fields in `package.json`
- Local sibling checkout of `technical-interview-demo` at `..\technical-interview-demo`
  when refreshing backend contract artifacts or defining local smoke coverage

The default expected layout is:

```text
D:\Projects\demo\
|-- technical-interview-demo\
`-- technical-interview-frontend\
```

You can pass a different backend path to `scripts/sync-backend-contract.ps1` if needed.

## Backend Contract Refresh

From the repository root:

```powershell
./scripts/sync-backend-contract.ps1
```

Or with an explicit backend checkout:

```powershell
./scripts/sync-backend-contract.ps1 -BackendRepo D:\path\to\technical-interview-demo
```

The script copies:

- `docs/FRONTEND_AI_CONTRACT.md`
- `src/test/resources/openapi/approved-openapi.json`

into `docs/backend/` and records the backend commit in `docs/backend/SOURCE.md`.

After refreshing the backend contract, regenerate the checked-in TypeScript API types:

```powershell
npm run api:types
```

To verify that `src/api/generated/openapi.ts` matches the imported OpenAPI contract
without rewriting it, run:

```powershell
npm run api:types:check
```

## Local Auth Smoke

Use [docs/LOCAL_AUTH_SMOKE.md](docs/LOCAL_AUTH_SMOKE.md) to verify the local
same-origin OAuth session workflow against `..\technical-interview-demo`. It covers
backend `local,oauth` startup, provider credentials, first-admin bootstrap, Vite
`/api` proxy behavior, session/account/logout checks, CSRF handling, and automation
limits.

## Daily Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run local dev server | `npm run dev` |
| Run production preview | `npm run preview` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Run tests once | `npm test` |
| Run tests in watch mode | `npm run test:watch` |
| Build | `npm run build` |
| Refresh backend contract | `./scripts/sync-backend-contract.ps1` |
| Generate API types | `npm run api:types` |
| Verify API types | `npm run api:types:check` |
| Validate docs/guidance diff | `git diff --check` |

## Validation Expectations

For app or tooling changes, and for release-readiness checks, run the same validation
baseline used by CI:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

`npm run typecheck` also verifies that the generated API types are current with
`docs/backend/approved-openapi.json`.

Docs or guidance-only changes may use `git diff --check` unless a plan or user
request explicitly requires the full baseline.

Session/auth browser smoke or e2e coverage remains manual until the repository has
agreed local credentials, identity seeding rules, and a canonical command.
