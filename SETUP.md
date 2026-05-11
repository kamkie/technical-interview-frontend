# Setup

This repository does not have a frontend app scaffold yet. The only current local
workflow is backend-contract import and documentation maintenance.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
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

## Daily Commands

| Task | Command |
| --- | --- |
| Refresh backend contract | `./scripts/sync-backend-contract.ps1` |
| Validate docs/guidance diff | `git diff --check` |
| Install dependencies | Not available until app scaffold exists |
| Run local dev server | Not available until app scaffold exists |
| Run tests | Not available until app scaffold exists |
| Build | Not available until app scaffold exists |

## App Scaffold Follow-Up

The first app-scaffold change must choose and document:

- Node.js version and package manager
- app framework and TypeScript settings
- install command
- local dev command
- lint, typecheck, test, and build commands
- browser smoke or e2e command for session/auth flows

Update `README.md`, `ROADMAP.md`, `AGENTS.md`, and this file in that same change.
