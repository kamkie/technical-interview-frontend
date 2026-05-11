# Setup

This repository uses Vite, React, TypeScript, Node.js 24.x, and npm for the first-party
browser frontend.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
- Node.js 24.x
- npm 11.x
- Local sibling checkout of `technical-interview-demo` when refreshing backend contract
  artifacts

The default expected layout is:

```text
D:\Projects\Jit\
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

For app, tooling, or documentation changes, run the smallest applicable set from:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

`npm run typecheck` also verifies that the generated API types are current with
`docs/backend/approved-openapi.json`.

Session/auth browser smoke or e2e coverage should be added when those flows are
implemented. Until then there is no canonical browser smoke command.
