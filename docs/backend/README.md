# Backend Contract Imports

This directory holds imported backend contract artifacts for frontend agents and
frontend tooling.

Source repository: `technical-interview-demo`

Imported files:

- `FRONTEND_AI_CONTRACT.md` from backend `docs/FRONTEND_AI_CONTRACT.md`
- `approved-openapi.json` from backend
  `src/test/resources/openapi/approved-openapi.json`
- `SOURCE.md`, generated locally by the sync script

Refresh from the default sibling checkout:

```powershell
./scripts/sync-backend-contract.ps1
```

Refresh from an explicit checkout:

```powershell
./scripts/sync-backend-contract.ps1 -BackendRepo D:\path\to\technical-interview-demo
```

Do not edit imported copies by hand. If an imported file conflicts with the backend
repository, refresh this directory or update the backend source first.
